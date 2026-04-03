// API Configuration
// In production, this should point to your deployed backend URL

const API_URL = import.meta.env.VITE_API_URL || '';

// WebSocket URL (derive from API_URL or use current host)
// Note: y-websocket WebsocketProvider appends the room name to the URL path
const getWsUrl = (docId) => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // If API_URL is set, derive WS URL from it
  if (API_URL) {
    const url = new URL(API_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}`;
  }
  
  // Default: use current host (for local dev with proxy)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

export { API_URL, getWsUrl };
