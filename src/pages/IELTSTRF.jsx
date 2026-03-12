import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import '../styles/ielts-trf.css'

function getCEFR(band) {
    if (!band) return '—'
    if (band >= 8.0) return 'C2'
    if (band >= 7.0) return 'C1'
    if (band >= 5.5) return 'B2'
    if (band >= 4.0) return 'B1'
    if (band >= 3.0) return 'A2'
    return 'A1'
}

function fmtBand(val) {
    if (val == null || val === '') return null
    const n = Number(val)
    if (isNaN(n)) return null
    // IELTS scores round to nearest 0.5
    return (Math.round(n * 2) / 2).toFixed(1)
}

function ieltsFromRaw(score, total) {
    if (!total) return null
    const pct = (score / total) * 100
    if (pct >= 97.5)  return 9.0
    if (pct >= 87.5)  return 8.5
    if (pct >= 81.25) return 8.0
    if (pct >= 75)    return 7.5
    if (pct >= 67.5)  return 7.0
    if (pct >= 60)    return 6.5
    if (pct >= 51.25) return 6.0
    if (pct >= 45)    return 5.5
    if (pct >= 38.75) return 5.0
    return 4.0
}

export default function IELTSTRF() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [submission, setSubmission] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api(`/submissions/${id}`)
            .then(data => { setSubmission(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="trf-loading">
                <div className="trf-spinner" />
                <p>Loading Test Report Form…</p>
            </div>
        )
    }

    if (!submission) {
        return (
            <div className="trf-loading">
                <p style={{ color: '#dc2626' }}>Submission not found.</p>
                <button
                    onClick={() => navigate('/my-results')}
                    style={{ background: '#003580', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', cursor: 'pointer', fontWeight: 700 }}
                >
                    ← Back to Results
                </button>
            </div>
        )
    }

    const user    = submission.user || {}
    const exam    = submission.exam || {}
    const scores  = submission.moduleScores || {}
    const band    = submission.estimatedBand
    const cefr    = getCEFR(band)

    const dateStr = new Date(submission.submittedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    })
    const validUntil = new Date(submission.submittedAt)
    validUntil.setFullYear(validUntil.getFullYear() + 2)
    const validUntilStr = validUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const testYear = new Date(submission.submittedAt).getFullYear()

    // Derive module band scores using official IELTS percentage table
    const listeningBand = scores.listening?.total > 0 ? ieltsFromRaw(scores.listening.score, scores.listening.total) : null
    const readingBand   = scores.reading?.total  > 0 ? ieltsFromRaw(scores.reading.score,   scores.reading.total)   : null
    const writingBand   = scores.writing?.score  > 0 ? scores.writing.score  : null
    const speakingBand  = scores.speaking?.score > 0 ? scores.speaking.score : null

    const candidateId = (user._id || user.id || '000000').slice(-8).toUpperCase()

    const MODULES = [
        { key: 'listening', label: 'Listening', val: listeningBand },
        { key: 'reading',   label: 'Reading',   val: readingBand   },
        { key: 'writing',   label: 'Writing',   val: writingBand   },
        { key: 'speaking',  label: 'Speaking',  val: speakingBand  },
    ]

    return (
        <div className="trf-page">

            {/* Toolbar */}
            <div className="trf-toolbar">
                <button className="trf-toolbar-btn" onClick={() => navigate('/my-results')}>
                    ← My Results
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="trf-toolbar-btn" onClick={() => navigate(`/my-results/${id}`)}>
                        📋 Answer Sheet
                    </button>
                    <button className="trf-toolbar-btn print" onClick={() => window.print()}>
                        🖨 Print TRF
                    </button>
                </div>
            </div>

            {/* TRF Document */}
            <div className="trf-document">

                {/* ── Header ── */}
                <div className="trf-header">
                    <div className="trf-header-ielts">
                        <div className="trf-ielts-big">IELTS</div>
                        <div className="trf-ielts-sub">International English Language Testing System</div>
                    </div>
                    <div className="trf-header-title">Test Report Form</div>
                    <div className="trf-header-logos">
                        <div className="trf-org-logo">Harvard School</div>
                        <div className="trf-org-logo">Official IELTS Centre</div>
                        <div className="trf-org-logo">Computer-Based IELTS</div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="trf-body">

                    {/* Candidate section */}
                    <div className="trf-candidate-section">
                        <div className="trf-candidate-info">
                            <div className="trf-info-row">
                                <span className="trf-info-label">Family Name / First Name</span>
                                <span className="trf-info-value">{user.name || 'N/A'}</span>
                            </div>
                            <div className="trf-info-row">
                                <span className="trf-info-label">Test Taken</span>
                                <span className="trf-info-value date-val">{exam.title || 'IELTS Mock Test'} · Academic</span>
                            </div>
                            <div className="trf-info-row">
                                <span className="trf-info-label">Date of Test</span>
                                <span className="trf-info-value date-val">{dateStr}</span>
                            </div>
                            <div className="trf-info-row" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                                <span className="trf-info-label">E-mail</span>
                                <span className="trf-info-value" style={{ fontSize: 13 }}>{user.email || 'N/A'}</span>
                            </div>

                            {/* Centre / candidate number table */}
                            <div className="trf-centre-table">
                                <div className="trf-centre-row">
                                    <div className="trf-centre-cell">
                                        <span className="trf-centre-label">Test Centre Number</span>
                                        <span className="trf-centre-value">GB 123</span>
                                    </div>
                                    <div className="trf-centre-cell">
                                        <span className="trf-centre-label">Test Centre Name</span>
                                        <span className="trf-centre-value">Harvard School</span>
                                    </div>
                                    <div className="trf-centre-cell">
                                        <span className="trf-centre-label">Candidate Number</span>
                                        <span className="trf-centre-value">{candidateId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Photo placeholder */}
                        <div className="trf-photo-box">
                            <div className="trf-photo-icon">👤</div>
                            <div className="trf-photo-label">Candidate<br />Photo</div>
                        </div>
                    </div>

                    {/* Score divider */}
                    <div className="trf-section-divider">Band Scores</div>

                    {/* Individual module scores */}
                    <div className="trf-score-section">
                        <div className="trf-score-modules">
                            {MODULES.map(({ label, val }) => (
                                <div key={label} className="trf-score-box">
                                    <div className="trf-score-label">{label}</div>
                                    <div className={`trf-score-value${!val ? ' empty' : ''}`}>
                                        {val != null ? Number(val).toFixed(1) : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overall band + CEFR */}
                        <div className="trf-overall-row">
                            <div className="trf-overall-box">
                                <div className="trf-overall-label">Overall Band Score</div>
                                <div className="trf-overall-value">
                                    {band != null ? fmtBand(band) : '—'}
                                </div>
                            </div>
                            <div className="trf-cefr-box">
                                <div className="trf-cefr-label">CEFR Level</div>
                                <div className="trf-cefr-value">{cefr}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="trf-footer">
                    <div className="trf-validity">
                        This Test Report Form is valid for two years from the date of the test.&ensp;
                        Valid until: <strong>{validUntilStr}</strong>
                    </div>

                    <div className="trf-footer-bottom">
                        {/* Left stamp */}
                        <div className="trf-stamp">
                            <div className="trf-stamp-text">HARVARD SCHOOL AUTHORISED</div>
                            <div className="trf-stamp-year">{testYear}</div>
                        </div>

                        {/* Logos */}
                        <div className="trf-footer-logos">
                            <div className="trf-logo-block">
                                <div className="trf-logo-name">Harvard School</div>
                                <div className="trf-logo-sub">IELTS Centre</div>
                            </div>
                            <div className="trf-logo-divider" />
                            <div className="trf-logo-block">
                                <div className="trf-logo-name" style={{ color: '#c0392b' }}>Official</div>
                                <div className="trf-logo-sub">Test Provider</div>
                            </div>
                            <div className="trf-logo-divider" />
                            <div className="trf-logo-block">
                                <div className="trf-logo-name" style={{ color: '#c0392b' }}>Computer-Based</div>
                                <div className="trf-logo-sub">IELTS</div>
                            </div>
                        </div>

                        {/* Signature + right stamp */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <div className="trf-signature-area">
                                <div className="trf-signature-line" />
                                <div className="trf-signature-label">Authorised Signatory</div>
                            </div>
                            <div className="trf-stamp right">
                                <div className="trf-stamp-text">OFFICIAL SEAL HARVARD SCHOOL</div>
                                <div className="trf-stamp-year">{testYear}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
