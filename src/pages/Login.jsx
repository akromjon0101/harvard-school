import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BASE_URL } from '../services/api'
import '../App.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Login failed')

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Server bilan ulanib bo\'lmadi. Backend ishlaayotganini tekshiring.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h2>Welcome Back</h2>
          <p>Log in to continue your IELTS practice journey.</p>
        </div>
        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create a free student account</Link></p>
        </div>
      </div>
      <div className="auth-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  )
}
