// src/services/api.js
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

export const api = async (endpoint, method = 'GET', body) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method, 
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    },
    body: body ? JSON.stringify(body) : null
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (!endpoint.includes('login')) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        alert('⚠️ Session expired. Please log in again.');
        localStorage.removeItem('token');
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






