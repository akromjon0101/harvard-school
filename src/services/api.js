// src/services/api.js
// Normalize: strip trailing slash, ensure path ends with /api
const _envBase = import.meta.env.VITE_API_BASE_URL || ''
const _defaultBase = 'http://localhost:5001/api'

// 1. If not set, use default
let _raw = _envBase || _defaultBase

// 2. Strip trailing slashes
_raw = _raw.replace(/\/+$/, '')

// 3. Ensure it ends with /api (only if it's an absolute URL or we want it to be)
export const BASE_URL = _raw.endsWith('/api') ? _raw : `${_raw}/api`

// Ping server on app load to wake up Railway from sleep
if (typeof window !== 'undefined') {
  fetch(`${BASE_URL}/health`, { method: 'GET' }).catch(() => {})
}

export const api = async (endpoint, method = 'GET', body) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    credentials: 'include', // Important: allow browser to send/receive cookies
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (!endpoint.includes('login') && !endpoint.includes('logout')) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        alert('⚠️ Session expired. Please log in again.');
        localStorage.removeItem('user');

        if (user.role === 'admin') {
          window.location.href = '/admin-login';
        } else {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'API error')
  }

  return res.json()
}

export default api






