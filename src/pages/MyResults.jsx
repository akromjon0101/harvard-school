import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function MyResults() {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        const userId = user.id || user._id
        if (!userId) return
        api(`/submissions/user/${userId}`)
            .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const listeningBand = (score, total) => {
        if (!total || !score) return null
        const pct = (score / total) * 100
        if (pct >= 97.5) return 9.0
        if (pct >= 92.5) return 8.5
        if (pct >= 87.5) return 8.0
        if (pct >= 80.0) return 7.5
        if (pct >= 75.0) return 7.0
        if (pct >= 65.0) return 6.5
        if (pct >= 57.5) return 6.0
        if (pct >= 45.0) return 5.5
        if (pct >= 40.0) return 5.0
        if (pct >= 32.5) return 4.5
        if (pct >= 25.0) return 4.0
        if (pct >= 20.0) return 3.5
        if (pct >= 15.0) return 3.0
        if (pct >= 10.0) return 2.5
        if (pct >=  7.5) return 2.0
        return 1.0
    }
    const readingBand = (score, total) => {
        if (!total || !score) return null
        const pct = (score / total) * 100
        if (pct >= 97.5) return 9.0
        if (pct >= 92.5) return 8.5
        if (pct >= 87.5) return 8.0
        if (pct >= 82.5) return 7.5
        if (pct >= 75.0) return 7.0
        if (pct >= 67.5) return 6.5
        if (pct >= 57.5) return 6.0
        if (pct >= 47.5) return 5.5
        if (pct >= 37.5) return 5.0
        if (pct >= 32.5) return 4.5
        if (pct >= 25.0) return 4.0
        if (pct >= 20.0) return 3.5
        if (pct >= 15.0) return 3.0
        if (pct >= 10.0) return 2.5
        if (pct >=  7.5) return 2.0
        return 1.0
    }

    const getBandColor = (band) => {
        if (!band) return '#94a3b8'
        if (band >= 7.5) return '#16a34a'
        if (band >= 6.0) return '#2563eb'
        if (band >= 5.0) return '#d97706'
        return '#dc2626'
    }

    const getBandLabel = (band) => {
        if (!band) return 'N/A'
        if (band >= 8.0) return 'Expert'
        if (band >= 7.0) return 'Good'
        if (band >= 6.0) return 'Competent'
        if (band >= 5.0) return 'Modest'
        return 'Limited'
    }

    return (
        <div className="dashboard-wrapper">
            <aside className="dashboard-sidebar">
                <div className="user-info-card">
                    <div className="avatar-large">{user.name?.charAt(0)}</div>
                    <h2>{user.name}</h2>
                    <p className="user-role-badge">STUDENT</p>
                </div>
                <nav className="side-nav">
                    <button className="nav-btn" onClick={() => navigate('/dashboard')}>🏠 Dashboard</button>
                    <button className="nav-btn active">📊 My Results</button>
                </nav>
            </aside>

            <main className="dashboard-main-content">
                <header className="page-header">
                    <h1>My <span className="text-primary">Test Results</span></h1>
                    <p>Official performance reports from all completed exams.</p>
                </header>

                {loading ? (
                    <div className="results-loading">
                        <div className="loader-dots"><span /><span /><span /></div>
                        <p>Loading results...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="results-empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No results yet</h3>
                        <p>You haven't completed any exams. Take your first mock test to see results here.</p>
                        <button className="btn-primary-fill" onClick={() => navigate('/dashboard')}>Browse Tests →</button>
                    </div>
                ) : (
                    <div className="results-list">
                        {results.map(res => {
                            const band = res.estimatedBand
                            const bandColor = getBandColor(band)
                            const listening = res.moduleScores?.listening
                            const reading = res.moduleScores?.reading

                            return (
                                <div key={res._id} className="result-card">
                                    {/* Header Row */}
                                    <div className="result-card-header">
                                        <div className="result-meta">
                                            <h3 className="result-exam-title">{res.exam?.title || 'IELTS Mock Test'}</h3>
                                            <span className="result-date">
                                                {new Date(res.submittedAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric', month: 'long', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="band-score-display" style={{ borderColor: bandColor }}>
                                            <span className="band-label" style={{ color: bandColor }}>
                                                {getBandLabel(band)}
                                            </span>
                                            <span className="band-number" style={{ color: bandColor }}>
                                                {band?.toFixed(1) ?? '—'}
                                            </span>
                                            <span className="band-sub">Band Score</span>
                                        </div>
                                    </div>

                                    {/* Scores Row */}
                                    <div className="scores-row">
                                        <ScoreModule
                                            label="Listening"
                                            score={listening?.score}
                                            total={listening?.total}
                                            icon="🎧"
                                            band={listeningBand(listening?.score, listening?.total)}
                                            getBandColor={getBandColor}
                                        />
                                        <ScoreModule
                                            label="Reading"
                                            score={reading?.score}
                                            total={reading?.total}
                                            icon="📖"
                                            band={readingBand(reading?.score, reading?.total)}
                                            getBandColor={getBandColor}
                                        />
                                        <BandModule
                                            label="Writing"
                                            icon="✍️"
                                            band={res.moduleScores?.writing?.score}
                                            aiDone={res.aiGrading?.writing?.some(w => w.status === 'done')}
                                            pending={res.status === 'pending_review'}
                                            getBandColor={getBandColor}
                                        />
                                        <BandModule
                                            label="Speaking"
                                            icon="🎤"
                                            band={res.moduleScores?.speaking?.score}
                                            aiDone={res.aiGrading?.speaking?.status === 'done' || res.aiGrading?.speakingTexts?.some(s => s.status === 'done')}
                                            pending={res.status === 'pending_review'}
                                            getBandColor={getBandColor}
                                        />
                                    </div>

                                    {/* AI Writing Feedback Summary */}
                                    {res.aiGrading?.writing?.some(w => w.status === 'done') && (
                                        <div className="ai-feedback-summary">
                                            <div className="ai-feedback-summary-label">🤖 AI Writing Feedback</div>
                                            {res.aiGrading.writing.filter(w => w.status === 'done').map((w, i) => (
                                                <div key={i} className="ai-feedback-summary-item">
                                                    <span className="ai-task-badge">Task {w.taskIndex + 1} — Band {w.band?.toFixed(1)}</span>
                                                    {w.feedback && <p className="ai-feedback-summary-text">{w.feedback}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* AI Speaking Feedback Summary */}
                                    {(res.aiGrading?.speaking?.status === 'done' || res.aiGrading?.speakingTexts?.some(s => s.status === 'done')) && (
                                        <div className="ai-feedback-summary ai-feedback-summary--speaking">
                                            <div className="ai-feedback-summary-label">🤖 AI Speaking Feedback</div>
                                            {res.aiGrading?.speaking?.status === 'done' && (
                                                <div className="ai-feedback-summary-item">
                                                    <span className="ai-task-badge">Speaking — Band {res.aiGrading.speaking.band?.toFixed(1)}</span>
                                                    {res.aiGrading.speaking.feedback && <p className="ai-feedback-summary-text">{res.aiGrading.speaking.feedback}</p>}
                                                </div>
                                            )}
                                            {res.aiGrading?.speakingTexts?.filter(s => s.status === 'done').map((s, i) => (
                                                <div key={i} className="ai-feedback-summary-item">
                                                    <span className="ai-task-badge">Part {s.partIndex + 1} — Band {s.band?.toFixed(1)}</span>
                                                    {s.feedback && <p className="ai-feedback-summary-text">{s.feedback}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Result actions */}
                                    <div className="result-card-actions">
                                        <button
                                            className="btn-answer-sheet"
                                            onClick={() => navigate(`/my-results/${res._id}`)}
                                        >
                                            📋 Answer Sheet
                                        </button>
                                        <button
                                            className="btn-view-trf"
                                            onClick={() => navigate(`/my-results/${res._id}/trf`)}
                                        >
                                            🏅 View TRF
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}

function BandModule({ label, icon, band, aiDone, pending, getBandColor }) {
    const hasBand = band > 0
    const color = hasBand ? getBandColor(band) : '#94a3b8'
    return (
        <div className="score-module-box">
            <div className="score-module-top">
                <span className="score-icon">{icon}</span>
                <span className="score-module-label">{label}</span>
            </div>
            {hasBand ? (
                <>
                    <div className="score-fraction" style={{ color, fontSize: '22px' }}>
                        {band.toFixed(1)}<span style={{ fontSize: '13px', color: '#94a3b8' }}> / 9.0</span>
                    </div>
                    <div className="score-bar-bg">
                        <div className="score-bar-fill" style={{ width: `${(band / 9) * 100}%`, background: color }} />
                    </div>
                    {aiDone && <span style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px', display: 'block' }}>AI graded</span>}
                </>
            ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                    {pending ? 'Pending review' : 'Not included'}
                </div>
            )}
        </div>
    )
}

function ScoreModule({ label, score, total, icon, band, getBandColor }) {
    const pct = total ? Math.round((score / total) * 100) : 0
    const color = band && getBandColor ? getBandColor(band) : '#64748b'
    return (
        <div className="score-module-box">
            <div className="score-module-top">
                <span className="score-icon">{icon}</span>
                <span className="score-module-label">{label}</span>
            </div>
            <div className="score-fraction">{score ?? '—'}<span>/{total ?? '—'}</span></div>
            {band != null && (
                <div style={{ fontSize: '18px', fontWeight: 800, color, marginTop: '2px', lineHeight: 1 }}>
                    {band.toFixed(1)}
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', marginLeft: '3px' }}>band</span>
                </div>
            )}
            {total > 0 && (
                <div className="score-bar-bg">
                    <div className="score-bar-fill" style={{ width: `${pct}%`, background: band ? color : undefined }} />
                </div>
            )}
        </div>
    )
}
