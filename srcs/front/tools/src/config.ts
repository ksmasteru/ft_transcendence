// API Configuration - dynamically determines the API base URL
// Uses the current hostname to support both localhost and network access
const getApiBaseUrl = (): string => {
  // In browser environment, use current hostname
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // If accessing via network IP, use port 3000 on same hostname
    // If localhost, use localhost:3000
    return `${protocol}//${hostname}:3000`;
  }
  // Fallback for server-side rendering (shouldn't happen in this app)
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

