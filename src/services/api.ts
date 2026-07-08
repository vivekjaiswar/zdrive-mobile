import axios from 'axios';

export const API_BASE_URL = 'https://zhdrive.in/api';

// Public web app origin (used to turn the backend's relative share
// paths, e.g. "/share/:token", into absolute links we can hand to
// Share.share() / Linking.openURL()).
export const WEB_BASE_URL = 'https://zhdrive.in';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;