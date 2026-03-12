import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BASE_URL } from '../services/api'
import '../App.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleRegister = async e => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g., student@example.com)')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long for security.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'student' })
      })

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message === 'User already exists' ? 'This email is already registered. Please log in instead.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📝</div>
          <h2>Sign up as a new student</h2>
          <p>Create a student account to start your IELTS practice and track your progress.</p>
        </div>
        {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', border: '1px solid #bbf7d0' }}>Account created! Redirecting to login...</div>}
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name (e.g., John Smith)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Choose a Password</label>
            <input
              type="password"
              placeholder="Create a strong password (min. 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-auth secondary" disabled={loading}>
            {loading ? 'Creating your account...' : 'Create a student account to start your IELTS practice'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in here to continue your test</Link></p>
        </div>
      </div>
      <div className="auth-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  )
}
