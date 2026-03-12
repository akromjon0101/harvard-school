import { useState, useRef } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// Band colour helper
function bandColor(b) {
    if (!b) return '#94a3b8'
    if (b >= 7.5) return '#16a34a'
    if (b >= 6.0) return '#2563eb'
    if (b >= 5.0) return '#d97706'
    return '#dc2626'
}

// Criteria label maps
const WRITING_LABELS  = { taskAchievement: 'Task Achievement', coherenceCohesion: 'Coherence & Cohesion', lexicalResource: 'Lexical Resource', grammaticalRange: 'Grammatical Range' }
const SPEAKING_LABELS = { fluencyCoherence: 'Fluency & Coherence', lexicalResource: 'Lexical Resource', grammaticalRange: 'Grammatical Range', pronunciation: 'Pronunciation' }

function CriteriaGrid({ criteria, labels }) {
    return (
        <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
            {Object.entries(labels).map(([key, label]) => {
                const item = criteria?.[key]
                const pct  = ((item?.band || 0) / 9) * 100
                return (
                    <div key={key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#475569', minWidth: '180px' }}>{label}</span>
                            <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: bandColor(item?.band), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: bandColor(item?.band), minWidth: '30px', textAlign: 'right' }}>
                                {item?.band?.toFixed(1) ?? '—'}
                            </span>
                        </div>
                        {item?.comment && (
                            <p style={{ margin: '0 0 0 190px', fontSize: '12px', color: '#64748b', lineHeight: '1.55' }}>
                                {item.comment}
                            </p>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function ResultCard({ result, type }) {
    const [showTranscript, setShowTranscript] = useState(false)
    const labels = type === 'writing' ? WRITING_LABELS : SPEAKING_LABELS
    const color  = type === 'writing' ? '#7c3aed' : '#059669'

    return (
        <div style={{ border: `1.5px solid ${color}30`, borderRadius: '10px', overflow: 'hidden', marginTop: '20px' }}>
            {/* Header */}
            <div style={{ background: color + '12', borderBottom: `1px solid ${color}20`, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color, fontSize: '14px' }}>
                    {type === 'writing' ? 'Writing Assessment' : 'Speaking Assessment'}
                </span>
                <span style={{ fontWeight: 900, fontSize: '22px', color: bandColor(result.band) }}>
                    Band {result.band?.toFixed(1)}
                </span>
            </div>

            <div style={{ padding: '16px 18px' }}>
                <CriteriaGrid criteria={result.criteria} labels={labels} />

                {result.feedback && (
                    <div style={{ background: '#f8faff', borderLeft: `3px solid ${color}`, borderRadius: '0 6px 6px 0', padding: '10px 14px', fontSize: '13px', color: '#374151', lineHeight: '1.65' }}>
                        {result.feedback}
                    </div>
                )}

                {result.transcript && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => setShowTranscript(o => !o)}
                            style={{ fontSize: '12px', color: '#64748b', background: 'none', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '4px 12px', cursor: 'pointer' }}
                        >
                            {showTranscript ? 'Hide' : 'Show'} transcript
                        </button>
                        {showTranscript && (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#475569', background: '#f9fafb', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                                {result.transcript}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function PracticeGrader() {
    const [question,       setQuestion]       = useState('What is your favorite holiday destination? Why?')
    const [speakingResult, setSpeakingResult] = useState(null)
    const [writingResult,  setWritingResult]  = useState(null)
    const [recording,      setRecording]      = useState(false)
    const [submittedText,  setSubmittedText]  = useState('')
    const [speakingLoading, setSpeakingLoading] = useState(false)
    const [writingLoading,  setWritingLoading]  = useState(false)
    const [error,          setError]          = useState('')

    const mediaRecorderRef = useRef(null)
    const audioChunksRef   = useRef([])

    // ── Recording ───────────────────────────────────────────────────────
    const startRecording = async () => {
        setError('')
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current   = []

            mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data)

            mediaRecorderRef.current.onstop = async () => {
                setSpeakingLoading(true)
                setSpeakingResult(null)
                try {
                    const blob     = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                    const file     = new File([blob], 'answer.webm', { type: 'audio/webm' })
                    const formData = new FormData()
                    formData.append('audio', file)
                    formData.append('question', question)
                    formData.append('userId', 'practice_user')

                    const res  = await fetch(`${API}/practice/speaking`, { method: 'POST', body: formData })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Server error')
                    setSpeakingResult(data.result)
                } catch (err) {
                    setError('Speaking grading failed: ' + err.message)
                } finally {
                    setSpeakingLoading(false)
                    stream.getTracks().forEach(t => t.stop())
                }
            }

            mediaRecorderRef.current.start()
            setRecording(true)
        } catch (err) {
            setError('Microphone access denied: ' + err.message)
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop()
        setRecording(false)
    }

    // ── Writing ──────────────────────────────────────────────────────────
    const submitWriting = async () => {
        if (!submittedText.trim()) return
        setError('')
        setWritingLoading(true)
        setWritingResult(null)
        try {
            const res  = await fetch(`${API}/practice/writing`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ userId: 'practice_user', question, submittedText }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Server error')
            setWritingResult(data.result)
        } catch (err) {
            setError('Writing grading failed: ' + err.message)
        } finally {
            setWritingLoading(false)
        }
    }

    const wordCount = submittedText.trim() ? submittedText.trim().split(/\s+/).length : 0

    return (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                IELTS Practice Grader
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '28px' }}>
                AI-powered instant feedback — Speaking &amp; Writing
            </p>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {/* Question input */}
            <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    Question / Task
                </label>
                <textarea
                    rows={2}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
            </div>

            {/* ── Speaking ── */}
            <section style={sectionStyle('#059669')}>
                <h2 style={sectionTitle('#059669')}>Speaking</h2>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {!recording ? (
                        <button onClick={startRecording} disabled={speakingLoading} style={btnStyle('#059669')}>
                            Record Answer
                        </button>
                    ) : (
                        <button onClick={stopRecording} style={btnStyle('#dc2626')}>
                            Stop &amp; Grade
                        </button>
                    )}
                    {recording && (
                        <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                            Recording...
                        </span>
                    )}
                    {speakingLoading && (
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                            Transcribing &amp; grading...
                        </span>
                    )}
                </div>

                {speakingResult && <ResultCard result={speakingResult} type="speaking" />}
            </section>

            {/* ── Writing ── */}
            <section style={{ ...sectionStyle('#7c3aed'), marginTop: '24px' }}>
                <h2 style={sectionTitle('#7c3aed')}>Writing</h2>

                <textarea
                    rows={8}
                    value={submittedText}
                    onChange={e => setSubmittedText(e.target.value)}
                    placeholder="Write your answer here..."
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '14px', fontFamily: "'Times New Roman', serif", lineHeight: '1.8', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <button onClick={submitWriting} disabled={writingLoading || !submittedText.trim()} style={btnStyle('#7c3aed')}>
                        {writingLoading ? 'Grading...' : 'Submit for Grading'}
                    </button>
                    <span style={{ fontSize: '12px', color: wordCount >= 250 ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                        {wordCount} word{wordCount !== 1 ? 's' : ''}
                    </span>
                </div>

                {writingResult && <ResultCard result={writingResult} type="writing" />}
            </section>

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
            `}</style>
        </div>
    )
}

function sectionStyle(color) {
    return {
        background: '#fff', border: `1.5px solid ${color}20`,
        borderRadius: '10px', padding: '20px 22px',
    }
}
function sectionTitle(color) {
    return { fontSize: '15px', fontWeight: 800, color, margin: '0 0 14px', letterSpacing: '0.02em' }
}
function btnStyle(color) {
    return {
        background: color, color: '#fff', border: 'none',
        borderRadius: '7px', padding: '10px 22px', fontSize: '13px',
        fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    }
}
