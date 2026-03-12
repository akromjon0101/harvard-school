import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'

// Band → colour
function bandColor(b) {
    if (!b) return '#94a3b8'
    if (b >= 7.5) return '#16a34a'
    if (b >= 6.0) return '#2563eb'
    if (b >= 5.0) return '#d97706'
    return '#dc2626'
}

// Criteria label map
const WRITING_CRITERIA_LABELS = {
    taskAchievement:  'Task Achievement',
    coherenceCohesion:'Coherence & Cohesion',
    lexicalResource:  'Lexical Resource',
    grammaticalRange: 'Grammatical Range',
}
const SPEAKING_CRITERIA_LABELS = {
    fluencyCoherence: 'Fluency & Coherence',
    lexicalResource:  'Lexical Resource',
    grammaticalRange: 'Grammatical Range',
    pronunciation:    'Pronunciation',
}

// ── Single criterion row ─────────────────────────────────────────────────
function CriterionRow({ label, band, comment }) {
    const [open, setOpen] = useState(false)
    const pct = ((band || 0) / 9) * 100
    return (
        <div style={{ marginBottom: '10px' }}>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                onClick={() => setOpen(o => !o)}
            >
                <span style={{ fontSize: '12px', color: '#475569', minWidth: '170px' }}>{label}</span>
                <div style={{ flex: 1, height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: bandColor(band), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: bandColor(band), minWidth: '28px', textAlign: 'right' }}>
                    {band?.toFixed(1) ?? '—'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
            </div>
            {open && comment && (
                <div style={{ marginTop: '6px', marginLeft: '180px', fontSize: '12.5px', color: '#475569', lineHeight: '1.6', background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '8px 12px' }}>
                    {comment}
                </div>
            )}
        </div>
    )
}

// ── Writing task AI result card ───────────────────────────────────────────
function WritingAICard({ data, taskIndex }) {
    if (!data) return null

    if (data.status === 'processing' || data.status === 'pending') {
        return (
            <div style={cardStyle}>
                <div style={cardHeaderStyle('#7c3aed')}>
                    <span>Task {taskIndex + 1} Writing — AI Grading</span>
                    <span style={processingBadge}>Processing...</span>
                </div>
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    <div style={spinnerStyle} />
                    AI is analysing your essay...
                </div>
            </div>
        )
    }

    if (data.status === 'error') {
        return (
            <div style={cardStyle}>
                <div style={cardHeaderStyle('#dc2626')}>
                    <span>Task {taskIndex + 1} Writing — AI Grading</span>
                    <span style={errorBadge}>Error</span>
                </div>
                <div style={{ padding: '12px 16px', fontSize: '13px', color: '#dc2626' }}>
                    {data.error || 'Grading failed. Try again.'}
                </div>
            </div>
        )
    }

    if (data.status === 'done') {
        return (
            <div style={cardStyle}>
                <div style={cardHeaderStyle('#7c3aed')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Task {taskIndex + 1} Writing — AI Assessment</span>
                        {data.chartType && (
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 8px', background: '#ede9fe', color: '#6d28d9', borderRadius: '10px', border: '1px solid #c4b5fd' }}>
                                {data.chartType}
                            </span>
                        )}
                    </div>
                    <span style={doneBadge}>Band {data.band?.toFixed(1)}</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                    {data.questionAnalysis && (
                        <div style={analysisBox('#f5f3ff', '#7c3aed')}>
                            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7c3aed' }}>Question Analysis</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>{data.questionAnalysis}</p>
                        </div>
                    )}
                    {data.keyDataPoints?.length > 0 && (
                        <div style={analysisBox('#f0f9ff', '#0284c7')}>
                            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7' }}>Key Data Points Expected</strong>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                                {data.keyDataPoints.map((pt, i) => (
                                    <li key={i} style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.6', marginBottom: '2px' }}>{pt}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.dataAccuracy && (
                        <div style={analysisBox('#fff7ed', '#c2410c')}>
                            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c2410c' }}>Data Accuracy Check</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>{data.dataAccuracy}</p>
                        </div>
                    )}
                    {data.relevanceCheck && (
                        <div style={analysisBox('#fefce8', '#ca8a04')}>
                            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ca8a04' }}>Relevance Check</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>{data.relevanceCheck}</p>
                        </div>
                    )}
                    {Object.entries(WRITING_CRITERIA_LABELS).map(([key, label]) => (
                        <CriterionRow key={key} label={label} band={data.criteria?.[key]?.band} comment={data.criteria?.[key]?.comment} />
                    ))}
                    {data.strengths?.length > 0 && (
                        <BulletSection title="Strengths" items={data.strengths} color="#16a34a" bg="#f0fdf4" />
                    )}
                    {data.weaknesses?.length > 0 && (
                        <BulletSection title="Weaknesses" items={data.weaknesses} color="#dc2626" bg="#fef2f2" />
                    )}
                    {data.improvementAdvice?.length > 0 && (
                        <BulletSection title="Improvement Advice" items={data.improvementAdvice} color="#2563eb" bg="#eff6ff" />
                    )}
                    {data.feedback && (
                        <div style={{ marginTop: '10px', fontSize: '13px', color: '#374151', lineHeight: '1.65', background: '#f8faff', borderLeft: '3px solid #7c3aed', padding: '10px 14px', borderRadius: '0 5px 5px 0' }}>
                            {data.feedback}
                        </div>
                    )}
                    {data.gradedAt && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                            AI graded {new Date(data.gradedAt).toLocaleString('en-GB')}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}

// ── Speaking AI result card ───────────────────────────────────────────────
function SpeakingAICard({ data }) {
    if (!data) return null
    const [showTranscript, setShowTranscript] = useState(false)
    const label = data._label || 'Speaking'
    const color = data._label ? '#0891b2' : '#059669'

    if (data.status === 'processing' || data.status === 'pending') {
        return (
            <div style={cardStyle}>
                <div style={cardHeaderStyle(color)}>
                    <span>{label} — AI Grading</span>
                    <span style={processingBadge}>Transcribing + Grading...</span>
                </div>
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    <div style={spinnerStyle} />
                    Transcribing audio and grading response...
                </div>
            </div>
        )
    }

    if (data.status === 'error') {
        return (
            <div style={cardStyle}>
                <div style={cardHeaderStyle('#dc2626')}>
                    <span>{label} — AI Grading</span>
                    <span style={errorBadge}>Error</span>
                </div>
                <div style={{ padding: '12px 16px', fontSize: '13px', color: '#dc2626' }}>
                    {data.error || 'Grading failed. Try again.'}
                </div>
            </div>
        )
    }

    if (data.status === 'done') {
        return (
            <div style={cardStyle}>
                <div style={cardHeaderStyle(color)}>
                    <span>{label} — AI Assessment</span>
                    <span style={doneBadge}>Band {data.band?.toFixed(1)}</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                    {data.questionAnalysis && (
                        <div style={analysisBox('#f0fdf4', '#059669')}>
                            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>Question Analysis</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>{data.questionAnalysis}</p>
                        </div>
                    )}
                    {data.relevanceCheck && (
                        <div style={analysisBox('#fefce8', '#ca8a04')}>
                            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ca8a04' }}>Relevance Check</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#374151', lineHeight: '1.6' }}>{data.relevanceCheck}</p>
                        </div>
                    )}
                    {Object.entries(SPEAKING_CRITERIA_LABELS).map(([key, label]) => (
                        <CriterionRow key={key} label={label} band={data.criteria?.[key]?.band} comment={data.criteria?.[key]?.comment} />
                    ))}
                    {data.strengths?.length > 0 && (
                        <BulletSection title="Strengths" items={data.strengths} color="#16a34a" bg="#f0fdf4" />
                    )}
                    {data.weaknesses?.length > 0 && (
                        <BulletSection title="Weaknesses" items={data.weaknesses} color="#dc2626" bg="#fef2f2" />
                    )}
                    {data.improvementAdvice?.length > 0 && (
                        <BulletSection title="Improvement Advice" items={data.improvementAdvice} color="#2563eb" bg="#eff6ff" />
                    )}
                    {data.feedback && (
                        <div style={{ marginTop: '10px', fontSize: '13px', color: '#374151', lineHeight: '1.65', background: '#f0fdf4', borderLeft: '3px solid #059669', padding: '10px 14px', borderRadius: '0 5px 5px 0' }}>
                            {data.feedback}
                        </div>
                    )}
                    {data.transcript && (
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={() => setShowTranscript(o => !o)}
                                style={{ fontSize: '11.5px', color: '#64748b', background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
                            >
                                {showTranscript ? 'Hide' : 'Show'} transcript
                            </button>
                            {showTranscript && (
                                <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#475569', lineHeight: '1.7', background: '#f9fafb', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '10px 14px', whiteSpace: 'pre-wrap' }}>
                                    {data.transcript}
                                </div>
                            )}
                        </div>
                    )}
                    {data.gradedAt && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                            AI graded {new Date(data.gradedAt).toLocaleString('en-GB')}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}

// ── Main export ───────────────────────────────────────────────────────────
export default function AIFeedbackPanel({ submission, onAIUpdate }) {
    const [triggering, setTriggering] = useState({ writing: false, speaking: false, speakingParts: false, speakingText: false })
    const [aiData, setAiData] = useState(submission?.aiGrading || {})
    const pollRef = useRef(null)

    // Sync when submission changes
    useEffect(() => {
        setAiData(submission?.aiGrading || {})
    }, [submission?._id])

    const isProcessing = (
        aiData?.writing?.some(w => w.status === 'processing' || w.status === 'pending') ||
        aiData?.speaking?.status === 'processing' ||
        aiData?.speaking?.status === 'pending' ||
        aiData?.speakingTexts?.some(s => s.status === 'processing' || s.status === 'pending')
    )

    // Poll while processing
    useEffect(() => {
        if (!isProcessing) {
            clearInterval(pollRef.current)
            return
        }
        pollRef.current = setInterval(async () => {
            try {
                const fresh = await api(`/ai/status/${submission._id}`)
                setAiData(fresh)
                if (onAIUpdate) onAIUpdate(fresh)
                const stillProcessing = (
                    fresh?.writing?.some(w => w.status === 'processing' || w.status === 'pending') ||
                    fresh?.speaking?.status === 'processing' ||
                    fresh?.speaking?.status === 'pending' ||
                    fresh?.speakingTexts?.some(s => s.status === 'processing' || s.status === 'pending')
                )
                if (!stillProcessing) clearInterval(pollRef.current)
            } catch { /* ignore */ }
        }, 3000)
        return () => clearInterval(pollRef.current)
    }, [isProcessing, submission?._id])

    const triggerWriting = async () => {
        setTriggering(t => ({ ...t, writing: true }))
        try {
            await api(`/ai/grade/${submission._id}/writing`, 'POST')
            // Set writing to processing immediately
            setAiData(prev => ({
                ...prev,
                writing: (submission.writingTexts || []).map((_, i) => ({ taskIndex: i, status: 'processing' }))
            }))
        } catch (err) {
            alert('Failed to start AI grading: ' + err.message)
        }
        setTriggering(t => ({ ...t, writing: false }))
    }

    const triggerSpeaking = async () => {
        setTriggering(t => ({ ...t, speaking: true }))
        try {
            await api(`/ai/grade/${submission._id}/speaking`, 'POST')
            setAiData(prev => ({ ...prev, speaking: { status: 'processing' } }))
        } catch (err) {
            alert('Failed to start AI grading: ' + err.message)
        }
        setTriggering(t => ({ ...t, speaking: false }))
    }

    const triggerSpeakingParts = async () => {
        setTriggering(t => ({ ...t, speakingParts: true }))
        try {
            await api(`/ai/grade/${submission._id}/speaking-parts`, 'POST')
            setAiData(prev => ({ ...prev, speaking: { status: 'processing' } }))
        } catch (err) {
            alert('Failed to start AI grading: ' + err.message)
        }
        setTriggering(t => ({ ...t, speakingParts: false }))
    }

    const triggerSpeakingText = async () => {
        setTriggering(t => ({ ...t, speakingText: true }))
        try {
            await api(`/ai/grade/${submission._id}/speaking-text`, 'POST')
            setAiData(prev => ({
                ...prev,
                speakingTexts: (submission.speakingTexts || []).map((_, i) => ({ partIndex: i, status: 'processing' }))
            }))
        } catch (err) {
            alert('Failed to start AI grading: ' + err.message)
        }
        setTriggering(t => ({ ...t, speakingText: false }))
    }

    const hasWriting       = submission?.writingTexts?.length > 0
    const hasSpeaking      = !!(submission?.speakingAudioUrl || submission?.answers?.speakingAudioUrl)
    const hasSpeakingParts = submission?.speakingParts?.some(p => p.audioUrl)
    const hasSpeakingText  = submission?.speakingTexts?.length > 0
    const hasAnyAI         = aiData?.writing?.length > 0 || aiData?.speaking?.status || aiData?.speakingTexts?.length > 0

    if (!hasWriting && !hasSpeaking && !hasSpeakingParts && !hasSpeakingText) return null

    return (
        <div style={{ marginTop: '4px' }}>
            {/* Section header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0 8px',
                borderBottom: '1.5px solid #e2e8f0',
                marginBottom: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: '#7c3aed',
                        background: '#f5f3ff', border: '1px solid #ddd6fe',
                        padding: '2px 8px', borderRadius: '4px'
                    }}>AI Assessment</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>powered by GPT-4o + Whisper</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {hasWriting && (
                        <button
                            onClick={triggerWriting}
                            disabled={triggering.writing || isProcessing}
                            style={triggerBtnStyle('#7c3aed')}
                        >
                            {triggering.writing ? 'Starting...' : aiData?.writing?.length ? 'Re-grade Writing' : 'Grade Writing'}
                        </button>
                    )}
                    {hasSpeaking && (
                        <button
                            onClick={triggerSpeaking}
                            disabled={triggering.speaking || isProcessing}
                            style={triggerBtnStyle('#059669')}
                        >
                            {triggering.speaking ? 'Starting...' : aiData?.speaking?.status ? 'Re-grade Speaking' : 'Grade Speaking'}
                        </button>
                    )}
                    {hasSpeakingParts && (
                        <button
                            onClick={triggerSpeakingParts}
                            disabled={triggering.speakingParts || isProcessing}
                            style={triggerBtnStyle('#059669')}
                        >
                            {triggering.speakingParts ? 'Starting...' : aiData?.speaking?.status ? 'Re-grade Speaking' : 'Grade Speaking (Parts)'}
                        </button>
                    )}
                    {hasSpeakingText && (
                        <button
                            onClick={triggerSpeakingText}
                            disabled={triggering.speakingText || isProcessing}
                            style={triggerBtnStyle('#0891b2')}
                        >
                            {triggering.speakingText ? 'Starting...' : aiData?.speakingTexts?.length ? 'Re-grade Speaking (Text)' : 'Grade Speaking (Text)'}
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {!hasAnyAI && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', background: '#f9fafb', borderRadius: '8px', border: '1.5px dashed #e2e8f0' }}>
                    Click "Grade Writing" or "Grade Speaking" to get AI feedback.
                </div>
            )}

            {aiData?.writing?.map((w, i) => (
                <WritingAICard key={i} data={w} taskIndex={i} />
            ))}

            {aiData?.speaking?.status && (
                <SpeakingAICard data={aiData.speaking} />
            )}

            {aiData?.speakingTexts?.map((s, i) => (
                <SpeakingAICard key={i} data={{ ...s, _label: `Speaking Part ${s.partIndex + 1} (Text)` }} />
            ))}
        </div>
    )
}

// ── Bullet list section ────────────────────────────────────────────────────
function BulletSection({ title, items, color, bg }) {
    return (
        <div style={{ marginTop: '10px', background: bg, border: `1px solid ${color}30`, borderRadius: '6px', padding: '8px 12px' }}>
            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color }}>{title}</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                {items.map((item, i) => (
                    <li key={i} style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.6', marginBottom: '2px' }}>{item}</li>
                ))}
            </ul>
        </div>
    )
}

function analysisBox(bg, border) {
    return {
        marginBottom: '10px',
        background: bg,
        border: `1px solid ${border}30`,
        borderRadius: '6px',
        padding: '8px 12px',
    }
}

// ── Styles ────────────────────────────────────────────────────────────────
const cardStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '12px',
    background: '#fff',
}

function cardHeaderStyle(color) {
    return {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: color + '10',
        borderBottom: `1px solid ${color}30`,
        fontSize: '13px', fontWeight: 700, color,
    }
}

const doneBadge = {
    fontSize: '12px', fontWeight: 800, padding: '2px 10px',
    background: '#16a34a', color: '#fff', borderRadius: '12px',
}
const processingBadge = {
    fontSize: '11px', fontWeight: 700, padding: '2px 10px',
    background: '#f59e0b', color: '#fff', borderRadius: '12px',
    animation: 'pulse 1.5s infinite',
}
const errorBadge = {
    fontSize: '11px', fontWeight: 700, padding: '2px 10px',
    background: '#dc2626', color: '#fff', borderRadius: '12px',
}
const spinnerStyle = {
    width: '24px', height: '24px',
    border: '3px solid #e2e8f0', borderTopColor: '#7c3aed',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    display: 'inline-block', margin: '0 auto 8px',
}

function triggerBtnStyle(color) {
    return {
        fontSize: '12px', fontWeight: 700, padding: '5px 14px',
        background: color, color: '#fff', border: 'none',
        borderRadius: '6px', cursor: 'pointer',
        opacity: 1, transition: 'opacity 0.15s',
    }
}
