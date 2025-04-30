// validateGraph-delegated.js

// 1) Load your .env
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const { DeviceCodeCredential } = require('@azure/identity');

async function main() {
  const clientId     = process.env.AZURE_CLIENT_ID;
  const driveItemId = process.env.DRIVE_ITEM_ID;    // e.g. "AAB00903808B02CB!s21110a765dcd438bb6e98f43bd995628"

  if (!clientId || !driveItemId) {
    throw new Error('Missing AZURE_CLIENT_ID or DRIVE_ITEM_ID in .env');
  }

  // 2) Device Code flow for delegated user auth
  const credential = new DeviceCodeCredential({
    clientId,
    tenantId: 'common',
    userPromptCallback: info => console.log(info.message)
  });

  // 3) Build Graph client asking for your already-consented Files.ReadWrite
  const client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(['https://graph.microsoft.com/.default']);
        return token.token;
      }
    }
  });

  // 4) URL‐encode the full driveItemId (especially the "!" as %21)
  const encodedId = encodeURIComponent(driveItemId);
  console.log('Using full driveItemId =', driveItemId);

  // 5) Fetch metadata by ID
  console.log('Fetching metadata…');
  const meta = await client
    .api(`/me/drive/items/${encodedId}`)
    .get();
  console.log('✅ Metadata:', {
    id: meta.id,
    name: meta.name,
    size: meta.size,
    modified: meta.lastModifiedDateTime
  });

  // 6) Download content by ID
  console.log('Downloading content…');
  const data = await client
    .api(`/me/drive/items/${encodedId}/content`)
    .get();
  console.log(`✅ Downloaded ${data.length} bytes.`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
