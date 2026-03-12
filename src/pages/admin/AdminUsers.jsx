import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/admin-users.css'

function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(d) {
    if (!d) return 'Never'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedUser, setSelectedUser] = useState(null)
    const [stats, setStats] = useState(null)
    const [statsLoading, setStatsLoading] = useState(false)
    // Reset password modal state
    const [resetTarget, setResetTarget] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [resetMsg, setResetMsg] = useState('')
    const [resetSaving, setResetSaving] = useState(false)

    useEffect(() => {
        api('/users')
            .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        const matchRole = filterRole === 'all' || u.role === filterRole
        const matchStatus = filterStatus === 'all' || (u.status || 'active') === filterStatus
        return matchSearch && matchRole && matchStatus
    })

    const handleSelectUser = async (user) => {
        if (selectedUser?._id === user._id) {
            setSelectedUser(null)
            setStats(null)
            return
        }
        setSelectedUser(user)
        setStats(null)
        setStatsLoading(true)
        try {
            const s = await api(`/users/${user._id}/stats`)
            setStats(s)
        } catch {
            setStats({ totalTests: '—', avgScore: '—' })
        }
        setStatsLoading(false)
    }

    const handleDelete = async (userId) => {
        if (!window.confirm('Permanently delete this student account and all their data?')) return
        try {
            await api(`/users/${userId}`, 'DELETE')
            setUsers(prev => prev.filter(u => u._id !== userId))
            if (selectedUser?._id === userId) { setSelectedUser(null); setStats(null) }
        } catch (err) {
            alert('Delete failed: ' + err.message)
        }
    }

    const handleBlock = async (user) => {
        const action = user.status === 'blocked' ? 'unblock' : 'block'
        if (!window.confirm(`${action === 'block' ? 'Block' : 'Unblock'} ${user.name}?`)) return
        try {
            const res = await api(`/users/${user._id}/block`, 'PUT')
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: res.status } : u))
            if (selectedUser?._id === user._id) setSelectedUser(prev => ({ ...prev, status: res.status }))
        } catch (err) {
            alert('Failed: ' + err.message)
        }
    }

    const openResetPassword = (user) => {
        setResetTarget(user)
        setNewPassword('')
        setResetMsg('')
    }

    const submitResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setResetMsg('Password must be at least 6 characters')
            return
        }
        setResetSaving(true)
        setResetMsg('')
        try {
            await api(`/users/${resetTarget._id}/reset-password`, 'POST', { newPassword })
            setResetMsg('Password reset successfully')
            setTimeout(() => {
                setResetTarget(null)
                setNewPassword('')
                setResetMsg('')
            }, 1500)
        } catch (err) {
            setResetMsg('Failed: ' + err.message)
        }
        setResetSaving(false)
    }

    const handleExportCSV = () => {
        const rows = [
            ['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Login'],
            ...filtered.map(u => [
                u.name, u.email, u.role,
                u.status || 'active',
                fmtDate(u.createdAt),
                fmtDate(u.lastLogin)
            ])
        ]
        const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    const students = users.filter(u => u.role === 'student')
    const admins = users.filter(u => u.role === 'admin')
    const blocked = users.filter(u => u.status === 'blocked')

    if (loading) return (
        <AdminLayout title="Users" subtitle="Manage all registered students and admins.">
            <div className="al-empty"><p>Loading users…</p></div>
        </AdminLayout>
    )

    return (
        <AdminLayout
            title="Users"
            subtitle="View, manage, block, and reset passwords for all registered users."
            action={{ label: 'Export CSV', onClick: handleExportCSV }}
        >
            {/* Stats */}
            <div className="al-stats">
                <div className="al-stat">
                    <div className="al-stat-label">Total Users</div>
                    <div className="al-stat-value">{users.length}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Students</div>
                    <div className="al-stat-value">{students.length}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Admins</div>
                    <div className="al-stat-value">{admins.length}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Blocked</div>
                    <div className="al-stat-value" style={{ color: blocked.length > 0 ? '#dc2626' : undefined }}>{blocked.length}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="al-filter-row" style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    className="al-search"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className="al-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="admin">Admins</option>
                </select>
                <select className="al-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                    {filtered.length} of {users.length} users
                </span>
            </div>

            {/* Table */}
            <div className="al-panel">
                <table className="al-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>No users found</td></tr>
                        ) : filtered.map(user => {
                            const isBlocked = user.status === 'blocked'
                            const isSelected = selectedUser?._id === user._id
                            return (
                                <tr
                                    key={user._id}
                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isSelected ? '#f8faff' : undefined, opacity: isBlocked ? 0.75 : 1 }}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: user.role === 'admin' ? 'linear-gradient(135deg,#4f46e5,#0ea5e9)' : isBlocked ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isBlocked ? '#94a3b8' : 'white', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                                                {user.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{user.email}</td>
                                    <td>
                                        <span className={`al-badge ${user.role === 'admin' ? 'al-badge--purple' : 'al-badge--green'}`}>
                                            {user.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`al-badge ${isBlocked ? 'al-badge--red' : 'al-badge--green'}`}>
                                            {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                        {fmtDate(user.createdAt)}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '12px', color: user.lastLogin ? '#64748b' : '#cbd5e1', whiteSpace: 'nowrap' }}>
                                        {fmtDateTime(user.lastLogin)}
                                    </td>
                                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                        {user.role !== 'admin' && (
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => handleBlock(user)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: `1px solid ${isBlocked ? '#bbf7d0' : '#fde68a'}`,
                                                        color: isBlocked ? '#15803d' : '#b45309',
                                                        padding: '4px 10px', borderRadius: '6px',
                                                        fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                                                    }}
                                                >
                                                    {isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                                <button
                                                    onClick={() => openResetPassword(user)}
                                                    style={{ background: 'transparent', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                                                >
                                                    Reset PW
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    style={{ background: 'transparent', border: '1px solid #fecaca', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* User Detail Panel */}
            {selectedUser && (
                <div style={{ marginTop: '16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '22px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                            {selectedUser.name}
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginLeft: '10px' }}>Profile Detail</span>
                        </h3>
                        <button onClick={() => { setSelectedUser(null); setStats(null) }} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                        {[
                            { label: 'Full Name', value: selectedUser.name },
                            { label: 'Email', value: selectedUser.email },
                            { label: 'Role', value: selectedUser.role?.toUpperCase() },
                            { label: 'Account Status', value: (selectedUser.status || 'active').toUpperCase(), highlight: selectedUser.status === 'blocked' },
                            { label: 'Joined', value: fmtDate(selectedUser.createdAt) },
                            { label: 'Last Login', value: fmtDateTime(selectedUser.lastLogin) },
                            { label: 'Tests Taken', value: statsLoading ? '…' : (stats?.totalTests ?? '—') },
                            { label: 'Avg Band Score', value: statsLoading ? '…' : (stats?.avgScore ?? '—') },
                        ].map(item => (
                            <div key={item.label} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{item.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: item.highlight ? '#dc2626' : '#1e293b' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Reset Password</h3>
                            <button onClick={() => setResetTarget(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                            Set a new password for <strong>{resetTarget.name}</strong>
                        </p>
                        <input
                            type="password"
                            placeholder="New password (min. 6 characters)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitResetPassword()}
                            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' }}
                            autoFocus
                        />
                        {resetMsg && (
                            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: resetMsg.includes('success') ? '#15803d' : '#dc2626' }}>
                                {resetMsg}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setResetTarget(null)}
                                style={{ padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitResetPassword}
                                disabled={resetSaving}
                                style={{ padding: '9px 22px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: resetSaving ? 0.7 : 1 }}
                            >
                                {resetSaving ? 'Saving…' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
