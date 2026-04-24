// src/services/api.js
const _envBase = import.meta.env.VITE_API_BASE_URL || ''
const _defaultBase = 'http://localhost:5001'

let _raw = _envBase || _defaultBase
if (_raw.endsWith('/')) _raw = _raw.slice(0, -1)
export const BASE_URL = _raw.endsWith('/api') ? _raw : `${_raw}/api`

export const api = async (endpoint, method = 'GET', body) => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : null
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
     if ((res.status === 401 || res.status === 403) && !endpoint.includes('login')) {
         localStorage.removeItem('user');
         localStorage.removeItem('token');
         // Use replace so the login page doesn't stack in history
         window.location.replace('/login');
         throw new Error('Session expired');
     }
     throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}
export default api
