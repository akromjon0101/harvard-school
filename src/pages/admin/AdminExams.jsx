import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AdminExams() {
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        api('/exams')
            .then(data => { setExams(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const togglePublish = async (id, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published'
        try {
            await api(`/exams/${id}`, 'PUT', { status: newStatus })
            setExams(prev => prev.map(e => e._id === id ? { ...e, status: newStatus } : e))
        } catch { alert('Failed to update status') }
    }

    const toggleAI = async (id, current) => {
        try {
            await api(`/exams/${id}`, 'PUT', { aiGradingEnabled: !current })
            setExams(prev => prev.map(e => e._id === id ? { ...e, aiGradingEnabled: !current } : e))
        } catch { alert('Failed to update AI setting') }
    }

    const deleteExam = async (id) => {
        if (!window.confirm('Permanently delete this exam?')) return
        try {
            await api(`/exams/${id}`, 'DELETE')
            setExams(prev => prev.filter(e => e._id !== id))
        } catch { alert('Failed to delete exam') }
    }

    const clearAll = async () => {
        if (!window.confirm('DELETE ALL EXAMS? This cannot be undone.')) return
        try {
            await Promise.all(exams.map(e => api(`/exams/${e._id}`, 'DELETE')))
            setExams([])
        } catch { alert('Failed to clear some exams') }
    }

    const published = exams.filter(e => e.status === 'published' || e.isPublished).length

    return (
        <AdminLayout
            title="Tests"
            subtitle="Manage all exams — control visibility, publish status, and student access."
            action={{ label: 'Create New Test', onClick: () => navigate('/admin/create-test') }}
        >
            {/* Stats */}
            <div className="al-stats">
                <div className="al-stat">
                    <div className="al-stat-label">Total Exams</div>
                    <div className="al-stat-value">{exams.length}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Live for Students</div>
                    <div className="al-stat-value" style={{ color: '#16a34a' }}>{published}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Drafts</div>
                    <div className="al-stat-value" style={{ color: '#d97706' }}>{exams.length - published}</div>
                </div>
            </div>

            {loading ? (
                <div className="al-empty"><p>Loading exams…</p></div>
            ) : exams.length === 0 ? (
                <div className="al-panel">
                    <div className="al-empty">
                        <div className="al-empty-icon">📝</div>
                        <p>No exams yet — create your first test to get started.</p>
                        <button
                            className="al-action-btn"
                            style={{ margin: '16px auto 0' }}
                            onClick={() => navigate('/admin/create-test')}
                        >
                            Create First Exam →
                        </button>
                    </div>
                </div>
            ) : (
                <div className="al-panel">
                    <div className="al-panel-header">
                        <h2 className="al-panel-title">All Exams ({exams.length})</h2>
                        <button
                            onClick={clearAll}
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            🗑 Clear All
                        </button>
                    </div>
                    <table className="al-table">
                        <thead>
                            <tr>
                                <th>Exam Title</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th>Publish</th>
                                <th>AI Check</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(exam => {
                                const isPublished = exam.status === 'published' || exam.isPublished
                                return (
                                    <tr key={exam._id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{exam.title}</div>
                                            {exam.description && (
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {exam.description.substring(0, 60)}{exam.description.length > 60 ? '…' : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td>{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                                        <td>
                                            <span className={`al-badge ${isPublished ? 'al-badge--green' : 'al-badge--amber'}`}>
                                                {isPublished ? '● Live' : '○ Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <div
                                                    onClick={() => togglePublish(exam._id, isPublished ? 'published' : 'draft')}
                                                    style={{
                                                        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                                                        transition: 'background 0.2s', position: 'relative', flexShrink: 0,
                                                        background: isPublished ? '#16a34a' : '#cbd5e1'
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute', top: 2, width: 18, height: 18,
                                                        borderRadius: '50%', background: 'white',
                                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                                        left: isPublished ? 20 : 2
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                                    {isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </label>
                                        </td>
                                        <td>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <div
                                                    onClick={() => toggleAI(exam._id, exam.aiGradingEnabled)}
                                                    style={{
                                                        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                                                        transition: 'background 0.2s', position: 'relative', flexShrink: 0,
                                                        background: exam.aiGradingEnabled ? '#7c3aed' : '#cbd5e1'
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute', top: 2, width: 18, height: 18,
                                                        borderRadius: '50%', background: 'white',
                                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                                        left: exam.aiGradingEnabled ? 20 : 2
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: exam.aiGradingEnabled ? '#7c3aed' : '#94a3b8' }}>
                                                    {exam.aiGradingEnabled ? '🤖 ON' : 'OFF'}
                                                </span>
                                            </label>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => navigate(`/admin/exams/${exam._id}/edit`)}
                                                    className="al-icon-btn"
                                                    style={{ width: 'auto', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}
                                                >
                                                    ✏ Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteExam(exam._id)}
                                                    className="al-icon-btn al-icon-btn--danger"
                                                    style={{ width: 'auto', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    )
}
