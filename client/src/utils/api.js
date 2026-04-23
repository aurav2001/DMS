const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000/api' : 'https://dms-backend-zeta.vercel.app/api');
export const SOCKET_URL = API_BASE.replace('/api', '');

// Vercel doesn't support Socket.io, so we disable it for the demo to prevent 404 errors
export const ENABLE_SOCKETS = isLocal || !SOCKET_URL.includes('vercel.app');
