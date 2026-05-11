import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, BASE_URL } from '../../services/api'
import '../../App.css'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async e => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const trimmedEmail = email.trim();
            const trimmedPassword = password.trim();

            const res = await fetch(`${BASE_URL}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Login error response:', data);
                throw new Error(data.error || 'Login failed');
            }

            if (!data.user || data.user.role !== 'admin') {
                console.error('User role check failed:', data.user);
                throw new Error('Access denied. Admin privileges required.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/admin');
        } catch (err) {
            console.error('Login attempt failed:', err);
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                setError('Server bilan ulanib bo\'lmadi. Backend ishlaayotganini tekshiring.')
            } else {
                setError(err.message || 'Admin authentication failed')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page admin-login-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🔐</div>
                    <h2>Admin Specialist Portal</h2>
                    <p>Official access for IELTS Mock system management.</p>
                </div>
{error && <div style={{ color: '#e11d48', background: '#fff1f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label>Admin ID / Email</label>
                        <input
                            type="email"
                            placeholder="admin@gmail.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Secure Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-auth btn-admin-auth" disabled={loading}>
                        {loading ? 'Verifying Credentials...' : 'Access Admin Console'}
                    </button>
                </form>
            </div>
        </div>
    )
}
