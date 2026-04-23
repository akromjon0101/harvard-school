import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Square, Play, RotateCcw, ChevronRight, CheckCircle, Volume2, Clock } from 'lucide-react'
import { api, BASE_URL } from '../../services/api'

const BASE = BASE_URL

// ── TTS sound bars ────────────────────────────────────────────────────────────
const BAR_HEIGHTS = [0.4, 0.75, 0.55, 1, 0.6, 0.9, 0.45, 0.8, 0.5, 0.7, 0.35, 0.85]
function SoundBars({ active }) {
    return (
        <div className={`sh-bars${active ? ' sh-bars--active' : ''}`}>
            {BAR_HEIGHTS.map((h, i) => (
                <div key={i} className="sh-bar" style={{ '--bh': h, animationDelay: `${i * 0.06}s` }} />
            ))}
        </div>
    )
}

// ── Real-time mic wave bars ───────────────────────────────────────────────────
function MicWave({ levels, active }) {
    return (
        <div className={`sh-mic-wave${active ? ' sh-mic-wave--active' : ''}`}>
            {levels.map((h, i) => (
                <div key={i} className="sh-mic-wave-bar" style={{ '--mh': h }} />
            ))}
        </div>
    )
}

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ total, current, done }) {
    return (
        <div className="sh-progress-dots">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`sh-dot${i < done ? ' sh-dot--done' : i === current ? ' sh-dot--active' : ''}`}
                />
            ))}
        </div>
    )
}

// ── Countdown ring component ──────────────────────────────────────────────────
function CountdownRing({ seconds, maxSeconds, size = 80 }) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const pct = Math.max(0, seconds / maxSeconds)
    const dash = circ * pct
    const isWarning = seconds <= Math.min(10, maxSeconds * 0.2)
    const isDanger  = seconds <= 5

    return (
        <div className="sh-countdown-wrap">
            <svg width={size} height={size} className="sh-countdown-svg" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={isDanger ? '#dc2626' : isWarning ? '#f59e0b' : '#1d4ed8'}
                    strokeWidth={6}
                    strokeDasharray={circ}
                    strokeDashoffset={circ - dash}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
            </svg>
            <div className={`sh-countdown-val${isDanger ? ' danger' : isWarning ? ' warn' : ''}`}>
                {seconds}
            </div>
            <div className="sh-countdown-label">sec</div>
        </div>
    )
}

// ── AI Hero card — defined OUTSIDE component to avoid remount on every render ─
function AIHero({ isSpeakingTTS, isLoadingTTS, sectionTitle, onAvatarClick, titleHint }) {
    return (
        <div className="sh-ai-hero">
            <div className="sh-ai-grid" aria-hidden="true" />
            <div className="sh-ai-hero-top">
                <span className="sh-ai-live-badge">
                    <span className="sh-ai-dot" />
                    AI Examiner
                </span>
                <span className="sh-ai-part-chip">{sectionTitle || 'Speaking'}</span>
            </div>

            <SoundBars active={isSpeakingTTS} />
            {isLoadingTTS ? (
                <div className="sh-tap-hint sh-tap-hint--loading">
                    <span className="sh-status-dot-spin" /> Preparing voice…
                </div>
            ) : isSpeakingTTS ? (
                <button className="sh-tap-hint sh-tap-hint--speaking" onClick={onAvatarClick}>
                    <span className="sh-ai-dot sh-ai-dot--sm" />
                    Examiner is speaking — tap to stop
                </button>
            ) : (
                <button className="sh-tap-hint" onClick={onAvatarClick}>
                    <Volume2 size={14} />
                    {titleHint || 'Tap to hear the question'}
                </button>
            )}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SpeakingHero({
    section,
    sectionIdx,
    speakingRecording,    setSpeakingRecording,
    speakingAudios,       setSpeakingAudios,
    speakingDurations,    setSpeakingDurations,
    speakingPlayIdx,      setSpeakingPlayIdx,
    speakingRecorderRef,  speakingChunksRef, speakingPlaybackRef,
    onUploaded,
    isAdmin,
    textValue,
    onTextAnswer,
}) {
    const rawQuestions = section?.questions || []
    const questions = rawQuestions.length > 0
        ? rawQuestions
        : (section?.title === 'Part 1' || section?.title === 'Part 3')
            ? (section?.passageContent || '').split('\n').filter(Boolean).map((text, i) => ({ questionText: text, questionNumber: i + 1 }))
            : []
    const isTurnByTurn = questions.length > 0

    // IELTS timing constants
    const isPart1 = section?.title === 'Part 1'
    const isPart3 = section?.title === 'Part 3'
    const MAX_RECORD_SECONDS = isPart3 ? 60 : 30   // Part 1: 30s, Part 3: 60s
    const PREP_SECONDS       = 60                  // Part 2: 1 min preparation
    const SPEAK_SECONDS      = 120                 // Part 2: 2 min speaking

    const [qIdx,           setQIdx]           = useState(0)
    const [phase,          setPhase]          = useState('intro')
    const [doneSet,        setDoneSet]        = useState(new Set())
    const [qAudios,        setQAudios]        = useState({})
    const [qDurations,     setQDurations]     = useState({})
    const [qElapsed,       setQElapsed]       = useState(0)
    const [reviewing,      setReviewing]      = useState(false)
    const [uploading,      setUploading]      = useState(false)
    const [micError,       setMicError]       = useState('')
    const [micLevels,      setMicLevels]      = useState(new Array(20).fill(0.08))

    // Timer / countdown state
    const [recordCountdown, setRecordCountdown] = useState(MAX_RECORD_SECONDS)
    const [prepPhase,       setPrepPhase]       = useState('none')  // 'none'|'prep'|'ready'
    const [prepCountdown,   setPrepCountdown]   = useState(PREP_SECONDS)
    const [speakCountdown,  setSpeakCountdown]  = useState(SPEAK_SECONDS)

    const ttsAudioRef    = useRef(new Audio())
    const timerRef       = useRef(null)
    const elapsedRef     = useRef(0)
    const reviewAudioRef = useRef(null)
    const analyserRef    = useRef(null)
    const audioCtxRef    = useRef(null)
    const micRafRef      = useRef(null)
    const ttsTimeoutRef  = useRef(null)
    const countdownRef   = useRef(null)   // for record/prep countdown intervals
    const stopFnRef      = useRef(null)   // store stop function for auto-stop

    const [ttsState, setTtsState] = useState('idle')
    const isSpeakingTTS = ttsState === 'speaking'
    const isLoadingTTS  = ttsState === 'loading'

    const currentQ     = questions[qIdx]
    const questionText = isTurnByTurn
        ? (currentQ?.questionText || '')
        : (section?.passageContent || '')

    // Reset on section change
    useEffect(() => {
        setQIdx(0); setPhase('intro'); setDoneSet(new Set())
        setQAudios({}); setQDurations({}); setTtsState('idle')
        setRecordCountdown(MAX_RECORD_SECONDS)
        setPrepPhase('none'); setPrepCountdown(PREP_SECONDS); setSpeakCountdown(SPEAK_SECONDS)
        clearInterval(countdownRef.current)
        const audio = ttsAudioRef.current
        if (audio) { audio.pause(); audio.src = ''; audio.onended = null; audio.onerror = null }
        window.speechSynthesis?.cancel()
        clearInterval(timerRef.current)
    }, [sectionIdx]) // eslint-disable-line react-hooks/exhaustive-deps

    // Global cleanup
    useEffect(() => () => {
        ttsAudioRef.current?.pause()
        window.speechSynthesis?.cancel()
        clearInterval(timerRef.current)
        clearTimeout(ttsTimeoutRef.current)
        reviewAudioRef.current?.pause()
        cancelAnimationFrame(micRafRef.current)
        audioCtxRef.current?.close().catch?.(() => {})
        clearInterval(countdownRef.current)
    }, [])

    // ── TTS ──────────────────────────────────────────────────────────────────
    const playTTS = useCallback(async (text, onEnd) => {
        if (!text?.trim()) { onEnd?.(); return }
        setTtsState('loading')

        clearTimeout(ttsTimeoutRef.current)
        ttsTimeoutRef.current = setTimeout(() => {
            setTtsState('idle')
            onEnd?.()
        }, 8000)

        const audio = ttsAudioRef.current
        audio.muted = true
        audio.play().catch(() => {})
        audio.pause()
        audio.muted = false

        try {
            const res  = await fetch(`${BASE}/tts`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                body: JSON.stringify({ text, voice: 'fable' }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            if (!data.url) throw new Error('no url')

            clearTimeout(ttsTimeoutRef.current)
            audio.onended = () => { setTtsState('idle'); onEnd?.() }
            audio.onerror = () => { setTtsState('idle'); onEnd?.() }
            audio.src = data.url
            audio.load()
            await audio.play()
            setTtsState('speaking')
        } catch (err) {
            console.warn('TTS fetch failed, trying Speech Synthesis:', err)
            try {
                const synth = window.speechSynthesis
                synth.cancel()
                const utt = new SpeechSynthesisUtterance(text)
                utt.lang = 'en-GB'; utt.rate = 0.88
                const setVoice = () => {
                    const voices = synth.getVoices()
                    const v = voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'))
                    if (v) utt.voice = v
                }
                setVoice()
                if (!synth.getVoices().length) synth.onvoiceschanged = setVoice
                utt.onend   = () => { clearTimeout(ttsTimeoutRef.current); setTtsState('idle'); onEnd?.() }
                utt.onerror = () => { clearTimeout(ttsTimeoutRef.current); setTtsState('idle'); onEnd?.() }
                clearTimeout(ttsTimeoutRef.current)
                setTtsState('speaking')
                synth.speak(utt)
            } catch {
                setTtsState('idle')
                onEnd?.()
            }
        }
    }, [])

    const stopTTS = useCallback(() => {
        const audio = ttsAudioRef.current
        if (audio) { audio.pause(); audio.onended = null; audio.onerror = null }
        window.speechSynthesis?.cancel()
        setTtsState('idle')
    }, [])

    // ── Mic visualization ─────────────────────────────────────────────────────
    const startMicVisualization = (stream) => {
        try {
            const ctx      = new AudioContext()
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 64
            ctx.createMediaStreamSource(stream).connect(analyser)
            audioCtxRef.current  = ctx
            analyserRef.current  = analyser
            const buf = new Uint8Array(analyser.frequencyBinCount)
            const tick = () => {
                analyser.getByteFrequencyData(buf)
                setMicLevels(Array.from({ length: 20 }, (_, i) => {
                    const idx = Math.floor(i * buf.length / 20)
                    return Math.max(0.08, buf[idx] / 255)
                }))
                micRafRef.current = requestAnimationFrame(tick)
            }
            micRafRef.current = requestAnimationFrame(tick)
        } catch {}
    }
    const stopMicVisualization = () => {
        cancelAnimationFrame(micRafRef.current)
        audioCtxRef.current?.close().catch?.(() => {})
        audioCtxRef.current  = null
        analyserRef.current  = null
        setMicLevels(new Array(20).fill(0.08))
    }

    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

    // ── Recording ─────────────────────────────────────────────────────────────
    const getMimeType = () => {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
    }

    // Start recording countdown (for Parts 1 & 3)
    const startRecordCountdown = useCallback((maxSecs, stopFn) => {
        clearInterval(countdownRef.current)
        setRecordCountdown(maxSecs)
        let remaining = maxSecs
        countdownRef.current = setInterval(() => {
            remaining -= 1
            setRecordCountdown(remaining)
            if (remaining <= 0) {
                clearInterval(countdownRef.current)
                stopFn?.()
            }
        }, 1000)
    }, [])

    const startRecording = async () => {
        setMicError('')
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicError('Audio recording is not supported. Please use Chrome or Firefox over HTTPS.')
            return
        }
        try {
            const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
            startMicVisualization(stream)
            speakingChunksRef.current = []
            const mimeType = getMimeType()
            const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
            speakingRecorderRef.current = mr
            mr.ondataavailable = e => { if (e.data?.size > 0) speakingChunksRef.current.push(e.data) }
            mr.onstop = async () => {
                stopMicVisualization()
                clearInterval(countdownRef.current)
                const blob     = new Blob(speakingChunksRef.current, { type: mimeType || 'audio/webm' })
                const localUrl = URL.createObjectURL(blob)
                const dur      = elapsedRef.current
                setQAudios(p    => ({ ...p, [qIdx]: localUrl }))
                setQDurations(p => ({ ...p, [qIdx]: dur }))
                setDoneSet(p    => new Set([...p, qIdx]))
                stream.getTracks().forEach(t => t.stop())
                setPhase('reviewing')
                setUploading(true)
                try {
                    const fd = new FormData()
                    fd.append('audio', new File([blob], `speaking_${sectionIdx}_q${qIdx}.webm`, { type: mimeType || 'audio/webm' }))
                    const res  = await fetch(`${BASE}/speaking/upload`, {
                        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: fd,
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
                    if (data.url) onUploaded?.(data.url, qIdx)
                } catch {} finally { setUploading(false) }
            }
            mr.start(100)
            setSpeakingRecording(true); setPhase('recording')
            elapsedRef.current = 0; setQElapsed(0)
            timerRef.current = setInterval(() => { elapsedRef.current += 1; setQElapsed(elapsedRef.current) }, 1000)

            // Start IELTS countdown for Part 1 / Part 3
            const stopFn = () => {
                if (speakingRecorderRef.current?.state === 'recording') {
                    speakingRecorderRef.current.stop()
                    setSpeakingRecording(false)
                    clearInterval(timerRef.current)
                }
            }
            stopFnRef.current = stopFn
            startRecordCountdown(MAX_RECORD_SECONDS, stopFn)

        } catch (err) {
            const msg = err?.name === 'NotAllowedError'
                ? 'Microphone access denied. Please allow mic in browser settings.'
                : err?.name === 'NotFoundError'
                ? 'No microphone found. Please connect a microphone.'
                : 'Could not start recording. Please check your microphone.'
            setMicError(msg)
        }
    }

    const stopRecording = () => {
        clearInterval(countdownRef.current)
        speakingRecorderRef.current?.stop()
        setSpeakingRecording(false)
        clearInterval(timerRef.current)
    }

    // goNext: call playTTS directly with next question's text (within user gesture)
    const goNext = () => {
        reviewAudioRef.current?.pause(); setReviewing(false)
        if (qIdx < questions.length - 1) {
            const nextIdx  = qIdx + 1
            const nextText = questions[nextIdx]?.questionText || ''
            setQIdx(nextIdx)
            setRecordCountdown(MAX_RECORD_SECONDS)
            setPhase('tts')
            playTTS(nextText, () => setPhase('ready'))
        } else {
            setPhase('finished')
        }
    }

    const reRecord     = () => { setQAudios(p => ({ ...p, [qIdx]: null })); setRecordCountdown(MAX_RECORD_SECONDS); setPhase('ready') }
    const toggleReview = () => {
        const url = qAudios[qIdx]; if (!url) return
        if (reviewing) { reviewAudioRef.current?.pause(); setReviewing(false) }
        else {
            if (!reviewAudioRef.current) reviewAudioRef.current = new Audio()
            reviewAudioRef.current.src = url
            reviewAudioRef.current.onended = () => setReviewing(false)
            reviewAudioRef.current.play(); setReviewing(true)
        }
    }
    const wordCount = (textValue || '').trim().split(/\s+/).filter(Boolean).length

    // ── Shared avatar click handler ───────────────────────────────────────────
    const handleAvatarClickTurnByTurn = () => {
        if (isSpeakingTTS) { stopTTS(); return }
        if (phase === 'intro' || phase === 'ready' || phase === 'reviewing') {
            setPhase('tts')
            playTTS(questionText, () => setPhase('ready'))
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── PART 2 (cue card / free-form) ─────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    if (!isTurnByTurn) {
        const blobUrl   = speakingAudios[sectionIdx]
        const duration  = speakingDurations[sectionIdx] || 0
        const isPlaying = speakingPlayIdx === sectionIdx
        const elapsed   = speakingDurations[`${sectionIdx}_elapsed`] || 0

        const togglePlayback = () => {
            if (!blobUrl) return
            if (!speakingPlaybackRef.current) {
                speakingPlaybackRef.current = new Audio(blobUrl)
                speakingPlaybackRef.current.onended = () => setSpeakingPlayIdx(null)
            }
            if (isPlaying) { speakingPlaybackRef.current.pause(); setSpeakingPlayIdx(null) }
            else { speakingPlaybackRef.current.src = blobUrl; speakingPlaybackRef.current.play(); setSpeakingPlayIdx(sectionIdx) }
        }

        // ── Prep phase handlers ──────────────────────────────────────────────
        const startPreparation = () => {
            clearInterval(countdownRef.current)
            setPrepPhase('prep')
            let remaining = PREP_SECONDS
            setPrepCountdown(remaining)
            countdownRef.current = setInterval(() => {
                remaining -= 1
                setPrepCountdown(remaining)
                if (remaining <= 0) {
                    clearInterval(countdownRef.current)
                    setPrepPhase('ready')
                }
            }, 1000)
        }

        const startP2Recording = async () => {
            setMicError('')
            if (!navigator.mediaDevices?.getUserMedia) {
                setMicError('Audio recording is not supported. Please use Chrome or Firefox over HTTPS.')
                return
            }
            try {
                const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
                startMicVisualization(stream)
                speakingChunksRef.current = []
                const mimeType = getMimeType()
                const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
                speakingRecorderRef.current = mr
                mr.ondataavailable = e => { if (e.data?.size > 0) speakingChunksRef.current.push(e.data) }
                mr.onstop = async () => {
                    stopMicVisualization()
                    clearInterval(countdownRef.current)
                    const blob = new Blob(speakingChunksRef.current, { type: mimeType || 'audio/webm' })
                    const localUrl = URL.createObjectURL(blob)
                    if (speakingAudios[sectionIdx]) URL.revokeObjectURL(speakingAudios[sectionIdx])
                    setSpeakingAudios(p    => ({ ...p, [sectionIdx]: localUrl }))
                    setSpeakingDurations(p => ({ ...p, [sectionIdx]: elapsedRef.current }))
                    stream.getTracks().forEach(t => t.stop())
                    setUploading(true)
                    try {
                        const fd = new FormData()
                        fd.append('audio', new File([blob], `speaking_part${sectionIdx}.webm`, { type: mimeType || 'audio/webm' }))
                        const res  = await fetch(`${BASE}/speaking/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: fd })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
                        if (data.url) onUploaded?.(data.url)
                    } catch {} finally { setUploading(false) }
                }
                mr.start(100); setSpeakingRecording(true)
                elapsedRef.current = 0
                timerRef.current = setInterval(() => {
                    elapsedRef.current += 1
                    setSpeakingDurations(p => ({ ...p, [`${sectionIdx}_elapsed`]: elapsedRef.current }))
                }, 1000)

                // Start 2-minute speaking countdown
                let remaining = SPEAK_SECONDS
                setSpeakCountdown(remaining)
                clearInterval(countdownRef.current)
                countdownRef.current = setInterval(() => {
                    remaining -= 1
                    setSpeakCountdown(remaining)
                    if (remaining <= 0) {
                        clearInterval(countdownRef.current)
                        // Auto-stop
                        if (speakingRecorderRef.current?.state === 'recording') {
                            speakingRecorderRef.current.stop()
                            setSpeakingRecording(false)
                            clearInterval(timerRef.current)
                        }
                    }
                }, 1000)

            } catch (err) {
                const msg = err?.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow mic in browser settings.'
                    : err?.name === 'NotFoundError'
                    ? 'No microphone found. Please connect a microphone.'
                    : 'Could not start recording. Please check your microphone.'
                setMicError(msg)
            }
        }

        const stopP2 = () => {
            clearInterval(countdownRef.current)
            speakingRecorderRef.current?.stop()
            setSpeakingRecording(false)
            clearInterval(timerRef.current)
        }
        const reRecordP2 = () => {
            speakingPlaybackRef.current?.pause(); speakingPlaybackRef.current = null
            setSpeakingPlayIdx(null)
            setSpeakingAudios(p    => ({ ...p, [sectionIdx]: null }))
            setSpeakingDurations(p => ({ ...p, [sectionIdx]: 0 }))
            setPrepPhase('none'); setPrepCountdown(PREP_SECONDS); setSpeakCountdown(SPEAK_SECONDS)
        }

        return (
            <div className="sh-root">
                {isAdmin && <div className="sh-admin-badge">Admin Preview Mode</div>}
                <AIHero
                    isSpeakingTTS={isSpeakingTTS}
                    isLoadingTTS={isLoadingTTS}
                    sectionTitle={section?.title}
                    onAvatarClick={() => { if (isSpeakingTTS) { stopTTS(); return }; playTTS(questionText, null) }}
                    titleHint="Click the examiner to hear the topic"
                />

                {/* Cue card — always visible */}
                {section?.passageContent && (
                    <div className="sh-cuecard">
                        <div className="sh-cuecard-label">
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            Topic Card — Read and make notes
                        </div>
                        <div className="sh-cuecard-body">{section.passageContent}</div>
                    </div>
                )}

                {isAdmin ? (
                    <div className="sh-text-area">
                        <label className="sh-text-label">Type your speaking answer:</label>
                        <textarea className="sh-text-textarea" rows={7} value={textValue || ''} onChange={e => onTextAnswer?.(e.target.value)} placeholder="Type your answer as if speaking to the examiner." />
                        <div className="sh-text-footer">
                            <span className={`sh-text-wc${wordCount >= 50 ? ' wc-ok' : ''}`}>{wordCount} words</span>
                            {wordCount >= 50 && <span className="sh-text-ready">Ready for AI grading</span>}
                        </div>
                    </div>
                ) : (
                    <div className="sh-record-area">

                        {/* ── Phase: Not started ─────────────────────────────────────────────── */}
                        {prepPhase === 'none' && !speakingRecording && !blobUrl && (
                            <>
                                <div className="sh-p2-timer-info">
                                    <div className="sh-p2-timer-block">
                                        <Clock size={16} />
                                        <span>1 min</span>
                                        <span className="sh-p2-timer-sub">Preparation</span>
                                    </div>
                                    <div className="sh-p2-timer-arrow">→</div>
                                    <div className="sh-p2-timer-block">
                                        <Mic size={16} />
                                        <span>2 min</span>
                                        <span className="sh-p2-timer-sub">Speaking</span>
                                    </div>
                                </div>
                                <button className="sh-btn-record sh-btn-prep" onClick={startPreparation}>
                                    <Clock size={18} /> Start Preparation (1 min)
                                </button>
                                {micError && <p className="sh-mic-err">{micError}</p>}
                            </>
                        )}

                        {/* ── Phase: Preparation countdown ──────────────────────────────────── */}
                        {prepPhase === 'prep' && (
                            <div className="sh-prep-panel">
                                <div className="sh-prep-header">
                                    <span className="sh-prep-label">
                                        <Clock size={15} /> Preparation Time
                                    </span>
                                    <CountdownRing seconds={prepCountdown} maxSeconds={PREP_SECONDS} size={80} />
                                </div>
                                <p className="sh-prep-hint">
                                    Read the topic card above and make mental notes. You will speak for 2 minutes.
                                </p>
                                <button className="sh-btn-record" onClick={() => {
                                    clearInterval(countdownRef.current)
                                    setPrepPhase('ready')
                                }}>
                                    Skip Prep → Start Speaking
                                </button>
                            </div>
                        )}

                        {/* ── Phase: Ready to speak ─────────────────────────────────────────── */}
                        {prepPhase === 'ready' && !speakingRecording && !blobUrl && (
                            <>
                                <div className="sh-prep-ready-banner">
                                    Preparation time is up — you may start speaking now.
                                </div>
                                <button className="sh-btn-record" onClick={startP2Recording}>
                                    <Mic size={18} /> Start Speaking (2 min)
                                </button>
                                {micError && <p className="sh-mic-err">{micError}</p>}
                            </>
                        )}

                        {/* ── Recording ─────────────────────────────────────────────────────── */}
                        {speakingRecording && (
                            <div className="sh-recording-panel">
                                <div className="sh-rec-header">
                                    <div className="sh-rec-live">
                                        <span className="sh-rec-dot" />
                                        <span>Recording</span>
                                        <span className="sh-rec-timer">{fmt(elapsed)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <CountdownRing seconds={speakCountdown} maxSeconds={SPEAK_SECONDS} size={56} />
                                        <button className="sh-btn-stop" onClick={stopP2}>
                                            <Square size={14} /> Stop
                                        </button>
                                    </div>
                                </div>
                                <MicWave levels={micLevels} active={speakingRecording} />
                                <p className="sh-rec-countdown-label">
                                    {speakCountdown > 0 ? `${speakCountdown}s remaining` : 'Time up — stopping…'}
                                </p>
                            </div>
                        )}

                        {/* ── Done ──────────────────────────────────────────────────────────── */}
                        {blobUrl && !speakingRecording && (
                            <div className="sh-done-panel">
                                {uploading && <p className="sh-uploading">Saving answer…</p>}
                                <div className="sh-done-row">
                                    <button className="sh-btn-play" onClick={togglePlayback}>
                                        {isPlaying ? <><Square size={14} /> Stop</> : <><Play size={14} /> Listen back</>}
                                    </button>
                                    <button className="sh-btn-rerecord" onClick={reRecordP2}>
                                        <RotateCcw size={13} /> Re-record
                                    </button>
                                </div>
                                <p className="sh-done-duration">{fmt(duration)} recorded</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── TURN-BY-TURN (Part 1 & 3) ─────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    if (phase === 'finished') {
        return (
            <div className="sh-root">
                <div className="sh-finished">
                    <div className="sh-finished-icon"><CheckCircle size={52} color="#16a34a" strokeWidth={1.5} /></div>
                    <h3 className="sh-finished-title">All questions answered!</h3>
                    <p className="sh-finished-sub">{questions.length} question{questions.length !== 1 ? 's' : ''} recorded for {section?.title}.</p>
                    <div className="sh-finished-summary">
                        {questions.map((q, i) => (
                            <div key={i} className={`sh-fin-q${doneSet.has(i) ? ' done' : ''}`}>
                                <span className="sh-fin-num">{i + 1}</span>
                                <span className="sh-fin-text">{q.questionText}</span>
                                {doneSet.has(i) && <CheckCircle size={14} color="#16a34a" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const currentDur = qDurations[qIdx] || 0

    return (
        <div className="sh-root">
            {isAdmin && <div className="sh-admin-badge">Admin Preview Mode</div>}

            <AIHero
                isSpeakingTTS={isSpeakingTTS}
                isLoadingTTS={isLoadingTTS}
                sectionTitle={section?.title}
                onAvatarClick={handleAvatarClickTurnByTurn}
                titleHint={
                    phase === 'intro'     ? 'Tap to hear the question' :
                    phase === 'tts'       ? 'Playing question…' :
                    phase === 'ready'     ? 'Tap to replay the question' :
                    phase === 'recording' ? 'Recording in progress…' :
                    phase === 'reviewing' ? 'Tap to replay the question' : ''
                }
            />

            {/* IELTS timing info */}
            <div className="sh-ielts-timing-info">
                <Clock size={13} />
                {isPart1
                    ? `Part 1 — Answer each question in ~${MAX_RECORD_SECONDS} seconds`
                    : `Part 3 — Give a longer answer (~${MAX_RECORD_SECONDS} seconds)`
                }
            </div>

            {/* Progress + counter */}
            <div className="sh-progress-row">
                <ProgressDots total={questions.length} current={qIdx} done={doneSet.size} />
                <span className="sh-q-counter">Q <strong>{qIdx + 1}</strong> / <strong>{questions.length}</strong></span>
            </div>

            {/* Question card */}
            <div className="sh-question-card">
                <div className="sh-question-header">
                    <span className="sh-q-badge">Question {qIdx + 1}</span>
                    <button
                        className="sh-q-replay-btn"
                        onClick={() => { if (!isSpeakingTTS && !isLoadingTTS) { setPhase('tts'); playTTS(questionText, () => setPhase('ready')) } }}
                        title="Replay question"
                        disabled={isSpeakingTTS || isLoadingTTS}
                    >
                        <Volume2 size={14} />
                    </button>
                </div>
                {questionText && (
                    <p className="sh-question-text">{questionText}</p>
                )}
            </div>

            {/* Phase UI */}
            {isAdmin ? (
                <div className="sh-text-area">
                    <label className="sh-text-label">Type your answer for Q{qIdx + 1}:</label>
                    <textarea
                        className="sh-text-textarea"
                        rows={5}
                        value={(textValue || '').split('|||')[qIdx] || ''}
                        onChange={e => {
                            const parts = (textValue || '').split('|||')
                            while (parts.length <= qIdx) parts.push('')
                            parts[qIdx] = e.target.value
                            onTextAnswer?.(parts.join('|||'))
                        }}
                        placeholder="Type your spoken answer here…"
                    />
                    <div className="sh-done-row" style={{ marginTop: 10 }}>
                        {qIdx < questions.length - 1 ? (
                            <button className="sh-btn-next" onClick={goNext}>Next Question <ChevronRight size={16} /></button>
                        ) : (
                            <button className="sh-btn-next sh-btn-finish" onClick={goNext}><CheckCircle size={16} /> Finish Speaking</button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="sh-record-area">
                    {phase === 'intro' && (
                        <button className="sh-btn-record sh-btn-play-q" onClick={() => { setPhase('tts'); playTTS(questionText, () => setPhase('ready')) }}>
                            <Play size={18} /> Play Question
                        </button>
                    )}
                    {phase === 'tts' && (
                        <div className="sh-tts-waiting">
                            <span className="sh-tts-dot" />
                            <span>Listen to the question…</span>
                            <button
                                className="sh-skip-btn"
                                onClick={() => { stopTTS(); setPhase('ready') }}
                            >
                                Skip →
                            </button>
                        </div>
                    )}
                    {phase === 'ready' && (
                        <>
                            <button className="sh-btn-record" onClick={startRecording}>
                                <Mic size={18} /> Record My Answer
                            </button>
                            {micError && <p className="sh-mic-err">{micError}</p>}
                        </>
                    )}
                    {phase === 'recording' && (
                        <div className="sh-recording-panel">
                            <div className="sh-rec-header">
                                <div className="sh-rec-live">
                                    <span className="sh-rec-dot" />
                                    <span>Recording</span>
                                    <span className="sh-rec-timer">{fmt(qElapsed)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <CountdownRing
                                        seconds={recordCountdown}
                                        maxSeconds={MAX_RECORD_SECONDS}
                                        size={56}
                                    />
                                    <button className="sh-btn-stop" onClick={stopRecording}>
                                        <Square size={14} /> Stop
                                    </button>
                                </div>
                            </div>
                            <MicWave levels={micLevels} active={speakingRecording} />
                            <p className="sh-rec-countdown-label">
                                {recordCountdown > 0
                                    ? `${recordCountdown}s remaining — answer naturally`
                                    : 'Time up — stopping recording…'
                                }
                            </p>
                        </div>
                    )}
                    {phase === 'reviewing' && (
                        <div className="sh-done-panel">
                            {uploading && <p className="sh-uploading">Saving answer…</p>}
                            <div className="sh-done-row">
                                <button className="sh-btn-play" onClick={toggleReview}>
                                    {reviewing ? <><Square size={14} /> Stop</> : <><Play size={14} /> Listen back</>}
                                </button>
                                <button className="sh-btn-rerecord" onClick={reRecord}>
                                    <RotateCcw size={13} /> Re-record
                                </button>
                            </div>
                            <p className="sh-done-duration">{fmt(currentDur)} recorded</p>
                            <div style={{ marginTop: 12 }}>
                                {qIdx < questions.length - 1 ? (
                                    <button className="sh-btn-next" onClick={goNext}>Next Question <ChevronRight size={16} /></button>
                                ) : (
                                    <button className="sh-btn-next sh-btn-finish" onClick={goNext}><CheckCircle size={16} /> Finish Speaking</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
