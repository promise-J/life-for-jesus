// Thin fetch wrapper: same-origin cookies, CSRF header, consistent errors.
const BASE = import.meta.env.VITE_API_BASE || '';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let csrfToken = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const r = await fetch(`${BASE}/api/auth/csrf`, { credentials: 'include' });
  const body = await r.json();
  csrfToken = body.csrfToken;
  return csrfToken;
}

export async function api(path, { method = 'GET', body, query, retryCsrf = true, keepalive = false } = {}) {
  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (method !== 'GET') headers['x-csrf-token'] = await ensureCsrf();
  let res;
  try {
    res = await fetch(url, { method, headers, credentials: 'include', keepalive, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the game server. Check your connection and try again.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 403 && data?.error?.code === 'csrf' && retryCsrf) {
      csrfToken = null;
      return api(path, { method, body, query, retryCsrf: false });
    }
    const e = data?.error || {};
    throw new ApiError(res.status, e.code || 'error', e.message || `Request failed (${res.status}).`, e.details);
  }
  return data;
}

export function newKey() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export const Api = {
  me: () => api('/auth/me'),
  register: (b) => api('/auth/register', { method: 'POST', body: b }),
  login: (b) => api('/auth/login', { method: 'POST', body: b }),
  guest: () => api('/auth/guest', { method: 'POST', body: {} }),
  upgrade: (b) => api('/auth/upgrade', { method: 'POST', body: b }),
  logout: () => api('/auth/logout', { method: 'POST', body: {} }),
  config: () => api('/config'),
  characters: () => api('/characters'),
  createCharacter: (b) => api('/characters', { method: 'POST', body: b }),
  character: (id) => api(`/characters/${id}`),
  deleteCharacter: (id) => api(`/characters/${id}`, { method: 'DELETE', body: {} }),
  action: (id, type, payload = {}, key = newKey(), opts = {}) => api(`/characters/${id}/actions`, { method: 'POST', body: { type, payload, key }, ...opts }),
  report: (id) => api(`/characters/${id}/report`),
  events: (id, page = 1) => api(`/characters/${id}/events`, { query: { page } }),
  journal: (id, page = 1) => api(`/characters/${id}/journal`, { query: { page } }),
  passage: (ref) => api('/scripture/passage', { query: { ref } }),
  books: () => api('/scripture/books'),
  chapter: (bookId, ch) => api(`/scripture/chapter/${bookId}/${ch}`),
  search: (q, page = 1) => api('/scripture/search', { query: { q, page } }),
  entries: (topic) => api('/scripture/entries', { query: { topic } }),
  favorites: () => api('/scripture/favorites'),
  addFavorite: (ref) => api('/scripture/favorites', { method: 'POST', body: { ref } }),
  removeFavorite: (ref) => api('/scripture/favorites', { method: 'DELETE', body: { ref } }),
  settings: () => api('/settings'),
  saveSettings: (b) => api('/settings', { method: 'PUT', body: b }),
  devEnding: (id) => api(`/dev/characters/${id}/trigger-ending`, { method: 'POST', body: {} }),
  devAdvance: (id, hours) => api(`/dev/characters/${id}/advance`, { method: 'POST', body: { hours } }),
  devInspect: (id) => api(`/dev/characters/${id}/inspect`),
};
