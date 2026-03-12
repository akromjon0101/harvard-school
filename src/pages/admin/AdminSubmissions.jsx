import { useEffect, useState, useRef } from 'react'
import { api } from '../../services/api'
import AIFeedbackPanel from '../../components/admin/AIFeedbackPanel'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/admin-submissions.css'

function getAIStatus(sub) {
    const ai = sub?.aiGrading
    if (!ai) return 'none'
    const processing = ai?.writing?.some(w => w.status === 'processing') ||
        ai?.speaking?.status === 'processing' ||
        ai?.speakingTexts?.some(s => s.status === 'processing')
    if (processing) return 'processing'
    const done = ai?.writing?.some(w => w.status === 'done') ||
        ai?.speaking?.status === 'done' ||
        ai?.speakingTexts?.some(s => s.status === 'done')
    return done ? 'done' : 'none'
}

const STATUS_LABELS = {
    pending_review: 'Pending Review',
    checked: 'Checked',
    completed: 'Completed',
    graded: 'Completed' // legacy
}

const STATUS_COLORS = {
    pending_review: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    checked: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    completed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    graded: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
}

function StatusBadge({ status }) {
    const s = status || 'completed'
    const c = STATUS_COLORS[s] || STATUS_COLORS.completed
    return (
        <span style={{
            fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px',
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            whiteSpace: 'nowrap', letterSpacing: '0.3px'
        }}>
            {STATUS_LABELS[s] || s}
        </span>
    )
}

function getBandColor(band) {
    if (!band) return '#94a3b8'
    if (band >= 7.5) return '#16a34a'
    if (band >= 6.0) return '#2563eb'
    if (band >= 5.0) return '#d97706'
    return '#dc2626'
}

// Extract numeric question answers, skipping writing_* and speakingAudioUrl keys
function getNumericAnswers(answers) {
    if (!answers) return []
    return Object.entries(answers)
        .filter(([k]) => /^\d+$/.test(k))
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([k, v]) => ({ q: Number(k), ans: Array.isArray(v) ? v.join(', ') : String(v ?? '') }))
}

export default function AdminSubmissions() {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selected, setSelected] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [form, setForm] = useState(null)
    const [aiTriggering, setAiTriggering] = useState(false)
    const modalRef = useRef(null)

    useEffect(() => {
        api('/submissions')
            .then(data => { setSubmissions(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    // Close modal on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') closeModal() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    const filtered = submissions.filter(s => {
        const matchSearch = !search ||
            s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.exam?.title?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || s.status === statusFilter ||
            (statusFilter === 'completed' && s.status === 'graded')
        return matchSearch && matchStatus
    })

    const openSubmission = async (sub) => {
        setDetailLoading(true)
        setSaveMsg('')
        try {
            const full = await api(`/submissions/${sub._id}`)
            setSelected(full)
            setForm({
                strengths: full.examinerFeedback?.strengths || '',
                weaknesses: full.examinerFeedback?.weaknesses || '',
                recommendation: full.examinerFeedback?.recommendation || '',
                writingBand: full.moduleScores?.writing?.score || '',
                speakingBand: full.moduleScores?.speaking?.score || '',
                status: full.status || 'pending_review'
            })
        } catch {
            setSelected(sub)
            setForm({
                strengths: sub.examinerFeedback?.strengths || '',
                weaknesses: sub.examinerFeedback?.weaknesses || '',
                recommendation: sub.examinerFeedback?.recommendation || '',
                writingBand: sub.moduleScores?.writing?.score || '',
                speakingBand: sub.moduleScores?.speaking?.score || '',
                status: sub.status || 'pending_review'
            })
        }
        setDetailLoading(false)
        // Scroll modal to top
        setTimeout(() => modalRef.current?.scrollTo({ top: 0 }), 50)
    }

    const closeModal = () => {
        setSelected(null)
        setForm(null)
        setSaveMsg('')
    }

    const saveGrading = async () => {
        if (!selected || !form) return
        setSaving(true)
        setSaveMsg('')
        try {
            const updated = await api(`/submissions/${selected._id}`, 'PUT', {
                examinerFeedback: {
                    strengths: form.strengths,
                    weaknesses: form.weaknesses,
                    recommendation: form.recommendation
                },
                writingBand: form.writingBand,
                speakingBand: form.speakingBand,
                status: form.status
            })
            // Update in list
            setSubmissions(prev => prev.map(s => s._id === selected._id
                ? { ...s, status: updated.status, estimatedBand: updated.estimatedBand }
                : s
            ))
            setSelected(updated)
            setSaveMsg('Saved successfully')
        } catch (err) {
            setSaveMsg('Save failed: ' + err.message)
        }
        setSaving(false)
    }

    const triggerAllAI = async () => {
        if (!selected) return
        setAiTriggering(true)
        const hasWriting      = selected.writingTexts?.length > 0
        const hasSpeakingAudio = !!(selected.speakingAudioUrl || selected.answers?.speakingAudioUrl)
        const hasSpeakingText = selected.speakingTexts?.length > 0
        try {
            if (hasWriting)       await api(`/ai/grade/${selected._id}/writing`, 'POST')
            if (hasSpeakingAudio) await api(`/ai/grade/${selected._id}/speaking`, 'POST')
            if (hasSpeakingText)  await api(`/ai/grade/${selected._id}/speaking-text`, 'POST')
            // Refresh the selected submission so AIFeedbackPanel sees processing state
            const fresh = await api(`/submissions/${selected._id}`)
            setSelected(fresh)
        } catch (err) {
            setSaveMsg('AI grading failed: ' + err.message)
        }
        setAiTriggering(false)
    }

    const deleteSubmission = async (id) => {
        if (!window.confirm('Permanently delete this submission?')) return
        try {
            await api(`/submissions/${id}`, 'DELETE')
            setSubmissions(prev => prev.filter(s => s._id !== id))
            if (selected?._id === id) closeModal()
        } catch { alert('Delete failed') }
    }

    // Stats
    const pending = submissions.filter(s => s.status === 'pending_review').length
    const avgBand = submissions.length
        ? (submissions.reduce((a, s) => a + (s.estimatedBand || 0), 0) / submissions.length).toFixed(1)
        : '—'

    return (
        <AdminLayout
            title="Student Results"
            subtitle="All exam attempts with scores, writing responses, and examiner grading."
        >
            {/* Stats */}
            <div className="al-stats">
                <div className="al-stat">
                    <div className="al-stat-label">Total Submissions</div>
                    <div className="al-stat-value">{submissions.length}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Pending Review</div>
                    <div className="al-stat-value" style={{ color: pending > 0 ? '#c2410c' : undefined }}>{pending}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Avg Band Score</div>
                    <div className="al-stat-value">{avgBand}</div>
                </div>
                <div className="al-stat">
                    <div className="al-stat-label">Unique Students</div>
                    <div className="al-stat-value">{new Set(submissions.map(s => s.user?._id)).size}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="al-filter-row" style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    className="al-search"
                    placeholder="Search by name, email or exam…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '260px' }}
                />
                <select
                    className="al-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="checked">Checked</option>
                    <option value="completed">Completed</option>
                </select>
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                    {filtered.length} of {submissions.length}
                </span>
            </div>

            {loading ? (
                <div className="al-empty"><p>Loading submissions…</p></div>
            ) : filtered.length === 0 ? (
                <div className="al-panel">
                    <div className="al-empty">
                        <p>{search || statusFilter !== 'all' ? 'No submissions match your filter.' : 'No submissions yet.'}</p>
                    </div>
                </div>
            ) : (
                <div className="al-panel" style={{ overflowX: 'auto' }}>
                    <table className="al-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Exam</th>
                                <th>Status</th>
                                <th>AI</th>
                                <th>Band</th>
                                <th>Listening</th>
                                <th>Reading</th>
                                <th>Writing</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(res => {
                                const band = res.estimatedBand
                                const listening = res.moduleScores?.listening
                                const reading = res.moduleScores?.reading
                                const writing = res.moduleScores?.writing
                                const aiStatus = getAIStatus(res)
                                const aiDone = aiStatus === 'done'
                                const aiProcessing = aiStatus === 'processing'
                                return (
                                    <tr
                                        key={res._id}
                                        onClick={() => openSubmission(res)}
                                        style={{ cursor: 'pointer' }}
                                        className="clickable"
                                    >
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{res.user?.name || '—'}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{res.user?.email}</div>
                                        </td>
                                        <td style={{ fontSize: '13px', maxWidth: 180, fontWeight: 600 }}>
                                            {res.exam?.title || '—'}
                                        </td>
                                        <td><StatusBadge status={res.status} /></td>
                                        <td>
                                            {aiProcessing ? (
                                                <span title="AI grading in progress" style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>⏳ AI</span>
                                            ) : aiDone ? (
                                                <span title="AI graded" style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>✓ AI</span>
                                            ) : (
                                                <span title="Not AI graded" style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="band-badge-small" style={{ background: getBandColor(band) }}>
                                                {band?.toFixed(1) || '—'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {listening?.score ?? '—'} / {listening?.total ?? '—'}
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {reading?.score ?? '—'} / {reading?.total ?? '—'}
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {writing?.score > 0 ? writing.score.toFixed(1) : <span style={{ color: '#94a3b8' }}>—</span>}
                                        </td>
                                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                                            {new Date(res.submittedAt).toLocaleDateString('en-GB')}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => deleteSubmission(res._id)}
                                                className="sub-delete-btn"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Detail Modal ─────────────────────────────────────── */}
            {selected && (
                <div className="sub-modal-overlay" onClick={closeModal}>
                    <div className="sub-modal" onClick={e => e.stopPropagation()} ref={modalRef}>

                        {/* Modal Header */}
                        <div className="sub-modal-header">
                            <div className="sub-modal-header-left">
                                <div className="sub-modal-avatar">
                                    {selected.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="sub-modal-student-name">{selected.user?.name || 'Unknown'}</div>
                                    <div className="sub-modal-student-email">{selected.user?.email}</div>
                                </div>
                            </div>
                            <div className="sub-modal-header-right">
                                <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px', maxWidth: 240 }}>{selected.exam?.title || 'IELTS Mock Test'}</div>
                                    <div>{new Date(selected.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <button className="sub-modal-close" onClick={closeModal}>✕</button>
                            </div>
                        </div>

                        {detailLoading ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading details…</div>
                        ) : (
                            <>
                                {/* AI Check / Manual Mode Bar */}
                                {(() => {
                                    const aiEnabled = selected.exam?.aiGradingEnabled
                                    const aiStatus = getAIStatus(selected)
                                    const hasGradable = selected.writingTexts?.length > 0 ||
                                        !!(selected.speakingAudioUrl || selected.answers?.speakingAudioUrl) ||
                                        selected.speakingTexts?.length > 0
                                    if (!hasGradable) return null

                                    if (!aiEnabled) {
                                        return (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '12px 24px', background: '#f8fafc',
                                                borderBottom: '1px solid #e2e8f0',
                                            }}>
                                                <span style={{ fontSize: 20 }}>📝</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Manual Review Mode</div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>AI grading is off for this exam — use the grading form below to score writing and speaking</div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 24px', background: aiStatus === 'done' ? '#f0fdf4' : aiStatus === 'processing' ? '#fffbeb' : '#f8faff',
                                            borderBottom: '1px solid #e2e8f0',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 18 }}>
                                                    {aiStatus === 'done' ? '✅' : aiStatus === 'processing' ? '⏳' : '🤖'}
                                                </span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                                                        AI Grading {aiStatus === 'done' ? 'Complete' : aiStatus === 'processing' ? 'In Progress…' : 'Not Started'}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                                        {aiStatus === 'done'
                                                            ? 'Writing and/or speaking graded — scores applied automatically'
                                                            : aiStatus === 'processing'
                                                            ? 'AI is currently grading this submission'
                                                            : 'AI grading is enabled for this exam — scores will be applied automatically'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={triggerAllAI}
                                                disabled={aiTriggering || aiStatus === 'processing'}
                                                style={{
                                                    padding: '8px 20px', fontWeight: 700, fontSize: 13,
                                                    border: 'none', borderRadius: 8, cursor: 'pointer',
                                                    background: aiStatus === 'done' ? '#7c3aed' : '#2563eb',
                                                    color: '#fff', fontFamily: 'inherit',
                                                    opacity: (aiTriggering || aiStatus === 'processing') ? 0.6 : 1,
                                                }}
                                            >
                                                {aiTriggering ? 'Starting…' : aiStatus === 'processing' ? 'Grading…' : aiStatus === 'done' ? 'Re-run AI' : 'Run AI Check'}
                                            </button>
                                        </div>
                                    )
                                })()}

                                {/* Score Overview */}
                                <div className="sub-modal-section">
                                    <div className="sub-modal-section-title">Score Overview</div>
                                    <div className="sub-score-grid">
                                        <ScoreBox
                                            label="Overall Band"
                                            value={selected.estimatedBand?.toFixed(1) ?? '—'}
                                            color={getBandColor(selected.estimatedBand)}
                                            big
                                        />
                                        <ScoreBox
                                            label="Listening"
                                            value={`${selected.moduleScores?.listening?.score ?? '—'}/${selected.moduleScores?.listening?.total ?? '—'}`}
                                            sub="raw score"
                                            color="#0891b2"
                                        />
                                        <ScoreBox
                                            label="Reading"
                                            value={`${selected.moduleScores?.reading?.score ?? '—'}/${selected.moduleScores?.reading?.total ?? '—'}`}
                                            sub="raw score"
                                            color="#7c3aed"
                                        />
                                        <ScoreBox
                                            label="Writing Band"
                                            value={selected.moduleScores?.writing?.score > 0
                                                ? selected.moduleScores.writing.score.toFixed(1) : '—'}
                                            sub="examiner grade"
                                            color="#d97706"
                                        />
                                        <ScoreBox
                                            label="Speaking Band"
                                            value={selected.moduleScores?.speaking?.score > 0
                                                ? selected.moduleScores.speaking.score.toFixed(1) : '—'}
                                            sub="examiner grade"
                                            color="#059669"
                                        />
                                    </div>
                                </div>

                                {/* Listening Answers */}
                                {selected.moduleScores?.listening?.total > 0 && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">
                                            Listening Answers
                                            <span className="sub-section-score">
                                                {selected.moduleScores.listening.score}/{selected.moduleScores.listening.total}
                                            </span>
                                        </div>
                                        <AnswerGrid answers={getNumericAnswers(selected.answers)} rangeEnd={selected.moduleScores.listening.total} />
                                    </div>
                                )}

                                {/* Reading Answers */}
                                {selected.moduleScores?.reading?.total > 0 && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">
                                            Reading Answers
                                            <span className="sub-section-score">
                                                {selected.moduleScores.reading.score}/{selected.moduleScores.reading.total}
                                            </span>
                                        </div>
                                        <AnswerGrid
                                            answers={getNumericAnswers(selected.answers)}
                                            rangeStart={(selected.moduleScores.listening?.total || 0) + 1}
                                            rangeEnd={(selected.moduleScores.listening?.total || 0) + selected.moduleScores.reading.total}
                                        />
                                    </div>
                                )}

                                {/* Writing Texts */}
                                {selected.writingTexts?.length > 0 && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">Writing Responses</div>
                                        {selected.writingTexts.map((text, i) => (
                                            <div key={i} className="sub-writing-block">
                                                <div className="sub-writing-label">Task {i + 1}</div>
                                                <div className="sub-writing-text">{text || <em style={{ color: '#94a3b8' }}>No text submitted</em>}</div>
                                                <div className="sub-writing-wc">{text?.split(/\s+/).filter(Boolean).length || 0} words</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Fallback: writing from answers object if writingTexts not populated */}
                                {(!selected.writingTexts?.length) && selected.answers && Object.keys(selected.answers).some(k => /^writing_/.test(k)) && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">Writing Responses</div>
                                        {Object.entries(selected.answers)
                                            .filter(([k]) => /^writing_\d+$/.test(k))
                                            .sort(([a], [b]) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
                                            .map(([k, text], i) => (
                                                <div key={k} className="sub-writing-block">
                                                    <div className="sub-writing-label">Task {i + 1}</div>
                                                    <div className="sub-writing-text">{text || <em style={{ color: '#94a3b8' }}>No text submitted</em>}</div>
                                                    <div className="sub-writing-wc">{String(text || '').split(/\s+/).filter(Boolean).length} words</div>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {/* Speaking Text Answers (admin exam mode) */}
                                {selected.speakingTexts?.length > 0 && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">
                                            Speaking Responses (Text)
                                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                                                Admin Mode
                                            </span>
                                        </div>
                                        {selected.speakingTexts.map((text, i) => (
                                            <div key={i} className="sub-writing-block">
                                                <div className="sub-writing-label">Part {i + 1}</div>
                                                <div className="sub-writing-text">{text || <em style={{ color: '#94a3b8' }}>No text submitted</em>}</div>
                                                <div className="sub-writing-wc">{text?.split(/\s+/).filter(Boolean).length || 0} words</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Speaking Parts (new multi-part) */}
                                {selected.speakingParts?.length > 0 && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">Speaking Recordings</div>
                                        {selected.speakingParts.map((part, pi) => (
                                            <div key={pi} style={{ marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                                <div style={{ background: '#f8faff', padding: '8px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>
                                                        🎤 Part {part.partIndex + 1}
                                                        {part.questionIndex != null && ` — Q${part.questionIndex + 1}`}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                                        background: part.transcriptStatus === 'done' ? '#f0fdf4' : part.transcriptStatus === 'processing' ? '#fef9c3' : part.transcriptStatus === 'error' ? '#fef2f2' : '#f1f5f9',
                                                        color: part.transcriptStatus === 'done' ? '#15803d' : part.transcriptStatus === 'processing' ? '#a16207' : part.transcriptStatus === 'error' ? '#dc2626' : '#64748b',
                                                    }}>
                                                        {part.transcriptStatus === 'done' ? 'Transcribed' : part.transcriptStatus === 'processing' ? 'Transcribing…' : part.transcriptStatus === 'error' ? 'Transcription failed' : 'Pending transcription'}
                                                    </span>
                                                </div>
                                                <div style={{ padding: '12px 14px' }}>
                                                    <div className="sub-audio-player" style={{ marginBottom: part.transcript ? 10 : 0 }}>
                                                        <span style={{ fontSize: '18px' }}>🔊</span>
                                                        <audio controls src={part.audioUrl} style={{ flex: 1, height: '34px' }} />
                                                    </div>
                                                    {part.transcript && (
                                                        <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transcript</div>
                                                            {part.transcript}
                                                        </div>
                                                    )}
                                                    {!part.transcript && part.transcriptStatus !== 'processing' && (
                                                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Transcript not yet available.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Speaking Audio (legacy single-file fallback) */}
                                {!selected.speakingParts?.length && (selected.speakingAudioUrl || selected.answers?.speakingAudioUrl) && (
                                    <div className="sub-modal-section">
                                        <div className="sub-modal-section-title">Speaking Recording</div>
                                        <div className="sub-audio-player">
                                            <span style={{ fontSize: '20px' }}>🎙</span>
                                            <audio
                                                controls
                                                src={selected.speakingAudioUrl || selected.answers?.speakingAudioUrl}
                                                style={{ flex: 1, height: '36px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* AI Feedback */}
                                {selected && (
                                    <div className="sub-modal-section">
                                        <AIFeedbackPanel
                                            submission={selected}
                                            onAIUpdate={(fresh) => {
                                                setSelected(prev => prev ? { ...prev, aiGrading: fresh } : prev)
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Examiner Grading */}
                                {form && (
                                    <div className="sub-modal-section sub-grading-section">
                                        <div className="sub-modal-section-title">Examiner Grading</div>

                                        {/* Status + Band Scores */}
                                        <div className="sub-grade-row">
                                            <div className="sub-grade-field">
                                                <label className="sub-grade-label">Status</label>
                                                <select
                                                    value={form.status}
                                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                                    className="sub-grade-select"
                                                >
                                                    <option value="pending_review">Pending Review</option>
                                                    <option value="checked">Checked</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>
                                            <div className="sub-grade-field">
                                                <label className="sub-grade-label">
                                                    Writing Band (0–9)
                                                    {selected?.aiGrading?.writing?.find(w => w.status === 'done') && (
                                                        <button
                                                            style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 7px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                                                            onClick={() => {
                                                                const aiW = selected.aiGrading.writing.find(w => w.status === 'done')
                                                                if (aiW?.band) setForm(f => ({ ...f, writingBand: aiW.band }))
                                                            }}
                                                        >Use AI</button>
                                                    )}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0" max="9" step="0.5"
                                                    value={form.writingBand}
                                                    onChange={e => setForm(f => ({ ...f, writingBand: e.target.value }))}
                                                    placeholder="e.g. 6.5"
                                                    className="sub-grade-input"
                                                />
                                            </div>
                                            <div className="sub-grade-field">
                                                <label className="sub-grade-label">
                                                    Speaking Band (0–9)
                                                    {selected?.aiGrading?.speaking?.status === 'done' && (
                                                        <button
                                                            style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 7px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                                                            onClick={() => {
                                                                const aiS = selected.aiGrading.speaking
                                                                if (aiS?.band) setForm(f => ({ ...f, speakingBand: aiS.band }))
                                                            }}
                                                        >Use AI</button>
                                                    )}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0" max="9" step="0.5"
                                                    value={form.speakingBand}
                                                    onChange={e => setForm(f => ({ ...f, speakingBand: e.target.value }))}
                                                    placeholder="e.g. 7.0"
                                                    className="sub-grade-input"
                                                />
                                            </div>
                                        </div>

                                        {/* Feedback */}
                                        <div className="sub-grade-field" style={{ marginTop: '12px' }}>
                                            <label className="sub-grade-label">✅ Strengths</label>
                                            <textarea
                                                rows={2}
                                                value={form.strengths}
                                                onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
                                                placeholder="What the student did well..."
                                                className="sub-grade-textarea"
                                            />
                                        </div>
                                        <div className="sub-grade-field" style={{ marginTop: '10px' }}>
                                            <label className="sub-grade-label">⚠ Areas to Improve</label>
                                            <textarea
                                                rows={2}
                                                value={form.weaknesses}
                                                onChange={e => setForm(f => ({ ...f, weaknesses: e.target.value }))}
                                                placeholder="Areas needing improvement..."
                                                className="sub-grade-textarea"
                                            />
                                        </div>
                                        <div className="sub-grade-field" style={{ marginTop: '10px' }}>
                                            <label className="sub-grade-label">💡 Recommendation</label>
                                            <textarea
                                                rows={2}
                                                value={form.recommendation}
                                                onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
                                                placeholder="Study advice for next steps..."
                                                className="sub-grade-textarea"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="sub-modal-actions">
                                            {saveMsg && (
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: saveMsg.startsWith('Save failed') ? '#dc2626' : '#15803d' }}>
                                                    {saveMsg}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => deleteSubmission(selected._id)}
                                                className="sub-btn-delete"
                                            >
                                                Delete Submission
                                            </button>
                                            <button
                                                onClick={saveGrading}
                                                disabled={saving}
                                                className="sub-btn-save"
                                            >
                                                {saving ? 'Saving…' : '✓ Save Grading'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

function ScoreBox({ label, value, sub, color, big }) {
    return (
        <div className="sub-score-box" style={{ borderTop: `3px solid ${color}` }}>
            <div className="sub-score-box-label">{label}</div>
            <div className="sub-score-box-value" style={{ color, fontSize: big ? '28px' : '20px' }}>{value}</div>
            {sub && <div className="sub-score-box-sub">{sub}</div>}
        </div>
    )
}

function AnswerGrid({ answers, rangeStart = 1, rangeEnd }) {
    const filtered = answers.filter(a => a.q >= rangeStart && (!rangeEnd || a.q <= rangeEnd))
    if (filtered.length === 0) return <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No answers recorded.</p>
    return (
        <div className="sub-answer-grid">
            {filtered.map(({ q, ans }) => (
                <div key={q} className="sub-answer-cell">
                    <span className="sub-answer-qnum">Q{q}</span>
                    <span className="sub-answer-val">{ans || <em style={{ color: '#d1d5db' }}>—</em>}</span>
                </div>
            ))}
        </div>
    )
}
