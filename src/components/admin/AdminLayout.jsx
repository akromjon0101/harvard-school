import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, BarChart2, Users, LogOut, Plus } from 'lucide-react'
import '../../styles/admin-layout.css'

const NAV = [
    { to: '/admin',             label: 'Dashboard',  Icon: LayoutDashboard, end: true },
    { to: '/admin/exams',       label: 'Tests',       Icon: BookOpen },
    { to: '/admin/submissions', label: 'Results',     Icon: BarChart2 },
    { to: '/admin/users',       label: 'Users',       Icon: Users },
]

export default function AdminLayout({ children, title, subtitle, action }) {
    const navigate  = useNavigate()
    const user      = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/admin-login')
    }

    return (
        <div className="al-root">
            {/* ── Sidebar ── */}
            <aside className="al-sidebar">
                <div className="al-brand">
                    <div className="al-brand-mark">HS</div>
                    <div>
                        <div className="al-brand-name">Harvard School</div>
                        <div className="al-brand-role">Admin Panel</div>
                    </div>
                </div>

                <nav className="al-nav">
                    {NAV.map(({ to, label, Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `al-nav-item${isActive ? ' active' : ''}`}
                        >
                            <Icon size={17} strokeWidth={2.2} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="al-sidebar-bottom">
                    <div className="al-user-row">
                        <div className="al-user-avatar">{user.name?.charAt(0) || 'A'}</div>
                        <div className="al-user-info">
                            <div className="al-user-name">{user.name || 'Admin'}</div>
                            <div className="al-user-email">{user.email}</div>
                        </div>
                    </div>
                    <button className="al-logout" onClick={handleLogout}>
                        <LogOut size={15} /> Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="al-main">
                {(title || action) && (
                    <div className="al-topbar">
                        <div className="al-topbar-left">
                            {title && <h1 className="al-page-title">{title}</h1>}
                            {subtitle && <p className="al-page-sub">{subtitle}</p>}
                        </div>
                        {action && (
                            <button className="al-action-btn" onClick={action.onClick}>
                                <Plus size={16} />
                                {action.label}
                            </button>
                        )}
                    </div>
                )}
                <div className="al-body">{children}</div>
            </main>
        </div>
    )
}
