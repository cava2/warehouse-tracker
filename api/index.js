// index.js

require('dotenv').config();
const express = require('express');
const XLSX    = require('xlsx');
require('isomorphic-fetch');              // polyfills global fetch()
const { DeviceCodeCredential } = require('@azure/identity');

const app = express();
app.use(express.json());

// ─── Configuration & Auth ───────────────────────────────────────────────────
const FILE_PATH = 'warehouse-tracker.xlsx';   // your file at the root of OneDrive

const credential = new DeviceCodeCredential({
  clientId: process.env.AZURE_CLIENT_ID,
  tenantId: 'common',
  userPromptCallback: info => console.log(info.message)
});

// Fetch an access token for Files.ReadWrite
async function getToken() {
  const resp = await credential.getToken(['https://graph.microsoft.com/Files.ReadWrite']);
  return resp.token;
}

// ─── Download the workbook → Buffer ──────────────────────────────────────────
async function downloadWorkbook() {
  const token = await getToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(FILE_PATH)}:/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Upload the workbook from a Buffer ──────────────────────────────────────
async function uploadWorkbook(buffer) {
  const token = await getToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(FILE_PATH)}:/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    }
  );
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
}

// ─── Parse the first worksheet into JSON objects ─────────────────────────────
function parseItems(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames.includes('Sheet1') ? 'Sheet1' : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  let items = XLSX.utils.sheet_to_json(sheet, { defval: null });
  // Remove any "__EMPTY" columns
  items = items.map(row => {
    Object.keys(row).forEach(key => {
      if (key.startsWith('__EMPTY')) delete row[key];
    });
    return row;
  });
  return items;
}

// ─── Rebuild a .xlsx Buffer from items + logs ───────────────────────────────
function buildBufferFromJson(items, logs = []) {
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(items, { header: Object.keys(items[0]) });
  XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');

  const ws2 = XLSX.utils.json_to_sheet(logs, {
    header: ['timestamp','partRef','delta','quantityBefore','quantityAfter','user']
  });
  XLSX.utils.book_append_sheet(wb, ws2, 'Logs');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ─── GET /items?threshold=low|high ───────────────────────────────────────────
app.get('/items', async (req, res) => {
  try {
    const buf = await downloadWorkbook();
    const all = parseItems(buf);
    const { threshold } = req.query;

    let result = all;
    if (threshold === 'low')  result = all.filter(i => i.QUANTITY < i['Min Level']);
    if (threshold === 'high') result = all.filter(i => i.QUANTITY > i['Max Level']);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /items/:partRef/adjust ─────────────────────────────────────────────
app.post('/items/:partRef/adjust', async (req, res) => {
  const { partRef } = req.params;
  const { delta, user } = req.body;

  try {
    // Download and parse
    const buf   = await downloadWorkbook();
    const items = parseItems(buf);

    // Find & update by Craig-Yr-Hesg Part Ref
    const item = items.find(i => i['Craig-Yr-Hesg Part Ref'] === partRef);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const before = item.QUANTITY;
    item.QUANTITY = before + delta;

    // Load existing logs
    const wb       = XLSX.read(buf, { type: 'buffer' });
    const logSheet = wb.Sheets['Logs'];
    const existing = logSheet
      ? XLSX.utils.sheet_to_json(logSheet, { defval: null })
      : [];

    // Append new log entry
    existing.push({
      timestamp:      new Date().toISOString(),
      partRef,
      delta,
      quantityBefore: before,
      quantityAfter:  item.QUANTITY,
      user
    });

    // Rebuild and upload
    const newBuf = buildBufferFromJson(items, existing);
    await uploadWorkbook(newBuf);

    res.json({ partRef, quantity: item.QUANTITY });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Bootstrap & start server ────────────────────────────────────────────────
(async () => {
  try {
    // Prompt the user for device-code auth immediately:
    await getToken();
    console.log('✔️  Authentication successful, starting server…');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`API listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('Authentication failed:', err);
    process.exit(1);
  }
})();