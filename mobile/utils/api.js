import axios from 'axios';

const API_BASE = 'http://192.168.1.11:3000';

export default {
  getItems: async () => {
    const resp = await axios.get(`${API_BASE}/items`);
    return resp.data;
  }
};
