import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    Shield,
    ChevronDown,
    Lock,
} from 'lucide-react'
import logoImg from '../assets/logotip.png'
import '../styles/navbar.css'

export default function Navbar() {
    const navigate  = useNavigate()
    const location  = useLocation()
    const user      = JSON.parse(localStorage.getItem('user') || 'null')
    const [dropOpen, setDropOpen] = useState(false)
    const dropRef   = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const h = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
        }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    // Close dropdown on navigation
    useEffect(() => { setDropOpen(false) }, [location.pathname])

    const handleLogout = () => {
        localStorage.clear()
        navigate(user?.role === 'admin' ? '/admin-login' : '/login')
    }

    const initials = user
        ? (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : ''

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + '/')

    const isAdmin   = user?.role === 'admin'
    const isStudent = user && !isAdmin

    return (
        <nav className="premium-nav">
            <div className="nav-container">

                {/* ── Logo ── */}
                <Link to={isAdmin ? '/admin' : '/'} className="nav-logo">
                    <img src={logoImg} alt="Harvard School" className="nav-logo-img" />
                </Link>

                {/* ── Center — student links only ── */}
                <div className="nav-links">
                    {isStudent && (
                        <>
                            <Link
                                to="/dashboard"
                                className={`nav-item${isActive('/dashboard') ? ' nav-item-active' : ''}`}
                            >
                                <LayoutDashboard size={15} strokeWidth={2} />
                                Dashboard
                            </Link>
                            <Link
                                to="/my-results"
                                className={`nav-item${isActive('/my-results') ? ' nav-item-active' : ''}`}
                            >
                                <ClipboardList size={15} strokeWidth={2} />
                                My Results
                            </Link>
                        </>
                    )}
                </div>

                {/* ── Right side ── */}
                <div className="nav-auth">

                    {/* ════ ADMIN ════ */}
                    {isAdmin && (
                        <div className="nav-admin-group">
                            <Link to="/admin" className="btn-admin-pill">
                                <Shield size={14} strokeWidth={2.5} />
                                Admin Panel
                            </Link>

                            {/* Name + logout */}
                            <div className="nav-admin-user">
                                <span className="nav-admin-name">{user.name?.split(' ')[0]}</span>
                                <button
                                    className="nav-admin-logout"
                                    onClick={handleLogout}
                                    title="Log out"
                                >
                                    <LogOut size={15} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ════ STUDENT ════ */}
                    {isStudent && (
                        <div className="nav-avatar-wrap" ref={dropRef}>
                            <button
                                className="nav-avatar-btn"
                                onClick={() => setDropOpen(p => !p)}
                                aria-label="Account menu"
                            >
                                <span className="nav-avatar-circle">{initials}</span>
                                <div className="nav-avatar-text">
                                    <span className="nav-avatar-name">{user.name?.split(' ')[0]}</span>
                                    <span className="nav-avatar-role">
                                        <span className="nav-dot" />
                                        Student
                                    </span>
                                </div>
                                <ChevronDown
                                    size={13}
                                    strokeWidth={2.5}
                                    className={`nav-chevron${dropOpen ? ' open' : ''}`}
                                />
                            </button>

                            {dropOpen && (
                                <div className="nav-dropdown">
                                    <div className="nav-drop-header">
                                        <span className="nav-drop-avatar">{initials}</span>
                                        <div>
                                            <div className="nav-drop-name">{user.name}</div>
                                            <div className="nav-drop-email">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="nav-drop-divider" />
                                    <button className="nav-drop-item nav-drop-logout" onClick={handleLogout}>
                                        <LogOut size={15} strokeWidth={2} />
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════ GUEST ════ */}
                    {!user && (
                        <div className="nav-guest-group">
                            <Link to="/login"    className="btn-login-ghost">Log In</Link>
                            <Link to="/register" className="btn-register-solid">Sign Up</Link>
                            <Link to="/admin-login" className="admin-entrance" title="Admin Login">
                                <Lock size={15} strokeWidth={2} />
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </nav>
    )
}
