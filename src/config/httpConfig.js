import { getToken } from "@/api/auth";

const API_BASE_URL = "http://35.196.79.227:8000";

export function apiFetch(endpoint, options = {}) {
  const token = getToken && getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });
}
