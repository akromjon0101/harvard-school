import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import OpenAIUsageCard from '../../components/admin/OpenAIUsageCard'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        if (user.role !== 'admin') navigate('/dashboard')
    }, [user, navigate])

    if (user.role !== 'admin') return null

    return (
        <AdminLayout
            title={`Welcome, ${user.name?.split(' ')[0] || 'Admin'}`}
            subtitle="Harvard School Management Console"
        >
            {/* Primary CTA */}
            <div className="al-primary-cta">
                <div>
                    <h2>Create a New IELTS Test</h2>
                    <p>Use the guided wizard to build a Listening, Reading, or Writing test step by step — no technical knowledge required.</p>
                    <Link to="/admin/create-test" className="al-cta-btn">
                        + Start Building a Test
                    </Link>
                </div>
                <div style={{ fontSize: '64px', opacity: 0.18 }}>📝</div>
            </div>

            {/* Quick-link cards */}
            <div className="al-dash-grid">
                <Link to="/admin/exams" className="al-dash-card">
                    <div className="al-dash-card-icon" style={{ background: '#eff6ff' }}>📚</div>
                    <h3>Manage Tests</h3>
                    <p>View all tests, publish or unpublish them, and delete old ones.</p>
                </Link>

                <Link to="/admin/submissions" className="al-dash-card">
                    <div className="al-dash-card-icon" style={{ background: '#f0fdf4' }}>📊</div>
                    <h3>Student Results</h3>
                    <p>View band scores, section breakdowns, and weak skill patterns.</p>
                </Link>

                <Link to="/admin/users" className="al-dash-card">
                    <div className="al-dash-card-icon" style={{ background: '#fdf4ff' }}>👥</div>
                    <h3>Users</h3>
                    <p>View registered students, export data, and manage accounts.</p>
                </Link>
            </div>

            {/* OpenAI usage card */}
            <OpenAIUsageCard />

            {/* System status */}
            <div className="al-status-row">
                <div className="al-status-pill">
                    <span className="al-status-dot" />
                    System online
                </div>
                <div className="al-status-pill">
                    Logged in as <strong style={{ marginLeft: 6 }}>{user.email}</strong>
                </div>
            </div>
        </AdminLayout>
    )
}
