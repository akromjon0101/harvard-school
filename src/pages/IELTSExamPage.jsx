import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import QuestionRenderer from '../components/exam/QuestionRenderer'
import SpeakingHero from '../components/exam/SpeakingHero'
import { stripHtml, getRangeOffsets } from '../utils/highlightUtils'
import Mark from 'mark.js'
import '../styles/ielts-paper.css'
import '../styles/ielts-premium.css'
import '../styles/highlight.css';

// Count how many question slots a question block occupies
function getQCount(q) {
    if (!q) return 0
    // TFNG: each non-empty line = one question
    if (q.type === 'tfng' || q.type === 'true-false-notgiven') {
        const lines = (q.questionText || '').split('\n').filter(l => l.trim()).length
        return Math.max(lines, 1)
    }
    const gaps = (q.questionText?.match(/\[gap\]/gi) || []).length
    const matchLen = (q.matchingItems || []).length
    const tableGaps = q.type === 'table-completion' && q.tableData?.rows
        ? q.tableData.rows.reduce((sum, row) =>
            sum + (Array.isArray(row) ? row.filter(c => /\[gap\]/i.test(String(c))).length : 0), 0)
        : 0
    return Math.max(gaps, matchLen, tableGaps, q.correctAnswers?.length || 0, 1)
}

function formatTime(seconds) {
    if (seconds === null) return '--:--:--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Writing area ──────────────────────────────────────────────────────────────
function WritingArea({ sectionIdx, value, onChange }) {
    let user = {}
    try { user = JSON.parse(localStorage.getItem('user') || '{}') } catch { /* corrupted */ }
    const minWords = sectionIdx === 0 ? 150 : 250
    const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
    const pct = Math.min((wordCount / minWords) * 100, 100)
    const barColor = wordCount >= minWords ? '#16a34a' : wordCount >= minWords * 0.8 ? '#b45309' : '#dc2626'
    const countClass = wordCount >= minWords ? 'wc-good' : wordCount >= minWords * 0.8 ? 'wc-near' : 'wc-low'
    const ribbonText = (`WRITING TASK ${sectionIdx + 1}  `).repeat(18)

    return (
        <div className="ip-answer-col">
            <div className="ip-answer-sheet">
                <div className="ip-sheet-header">
                    <span className="ip-sheet-title">IELTS Writing Answer Sheet — Task {sectionIdx + 1}</span>
                </div>
                <div className="ip-candidate-row">
                    <div className="ip-candidate-field">
                        <span className="ip-candidate-label">Candidate Name</span>
                        <span className="ip-candidate-value">{user.name || ''}</span>
                    </div>
                    <div className="ip-candidate-field">
                        <span className="ip-candidate-label">Candidate No.</span>
                        <span className="ip-candidate-value">{(user._id || user.id || '').slice(-8).toUpperCase() || '—'}</span>
                    </div>
                    <div className="ip-candidate-field">
                        <span className="ip-candidate-label">Centre No.</span>
                        <span className="ip-candidate-value">GB 123</span>
                    </div>
                </div>
                <div className="ip-task-ribbon" aria-hidden="true">{ribbonText}</div>
                <textarea
                    className="ip-lined-paper-textarea"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    spellCheck={true}
                    placeholder=""
                />
            </div>
            <div className="ip-wc-bar-wrap">
                <div className="ip-wc-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <div className="ip-wc-info">
                <span className={`ip-wc-num ${countClass}`}>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
                <span>{wordCount >= minWords ? `✓ Minimum ${minWords} words reached` : `${minWords - wordCount} more needed`}</span>
            </div>
        </div>
    )
}

// ── Question block ────────────────────────────────────────────────────────────
// moduleAnswers: plain {qNum: answer} map for QuestionRenderer
// module: current module string (for flag key)
// onFocus: called with qNum when user interacts with this block
function PaperQuestionBlock({ q, moduleAnswers, module, onChange, flagged, onToggleFlag, onFocus, hideInstruction, modifiedHtml }) {
    const qNum = q.startNumber ?? q.questionNumber
    const isFlagged = !!flagged[`${module}_${qNum}`]

    return (
        <div
            className="ip-question-block"
            onFocus={() => onFocus(Number(qNum))}
            onClick={() => onFocus(Number(qNum))}
        >
            <button
                className={`ip-flag-btn${isFlagged ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); onToggleFlag(qNum) }}
            >
                {isFlagged ? '🚩 Flagged' : '+ Flag'}
            </button>
            {q.image && <img src={q.image} alt="Question diagram" className="ip-q-image" />}
            <QuestionRenderer
                type={q.type}
                data={q}
                value={moduleAnswers}
                onChange={onChange}
                qNumber={qNum}
                hideInstruction={hideInstruction}
                modifiedHtml={modifiedHtml}
            />
        </div>
    )
}

// ── Main exam page ────────────────────────────────────────────────────────────
export default function IELTSExamPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [exam, setExam] = useState(null)
    const [examError, setExamError] = useState(null)
    const [partIndex, setPartIndex] = useState(0)
    // Keys: 'listening_1', 'reading_5', 'writing_0'
    const [answers, setAnswers] = useState({})
    // Keys: 'listening_1': true
    const [flagged, setFlagged] = useState({})
    // Active question NUMBER in current module (for navigator highlighting)
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [timeLeft, setTimeLeft] = useState(null)
    const [timerPaused, setTimerPaused] = useState(false)
    const moduleTimerRef = useRef(null) // tracks which module's timer is currently running
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

    // Highlight state: { [sectionKey]: [{start, end, color}] }
    const [highlights, setHighlights] = useState({})
    const [selectionPopup, setSelectionPopup] = useState({ visible: false, x: 0, y: 0, position: 'above' })
    // Pre-computed offsets saved on mouseup (Range is invalid after re-render, plain numbers are not)
    const savedOffsetsRef = useRef(null)

    // Speaking session elapsed timer
    const speakingSessionStartRef = useRef(null)
    const [sessionElapsed, setSessionElapsed] = useState(0)

    // Audio state
    const audioRef = useRef(null)
    const [hasPlayed, setHasPlayed] = useState({})
    const [audioProgress, setAudioProgress] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [isAudioPlaying, setIsAudioPlaying] = useState(false)
    const [audioCheckConfirmed, setAudioCheckConfirmed] = useState(false)
    const [testAudioPlayed, setTestAudioPlayed] = useState(false)

    const [loadingTimedOut, setLoadingTimedOut] = useState(false)

    // Help user if load takes too long
    useEffect(() => {
        if (exam) return
        const timer = setTimeout(() => {
            if (!exam) setLoadingTimedOut(true)
        }, 8000)
        return () => clearTimeout(timer)
    }, [exam])

    // Speaking recording state (per sectionIdx)
    const speakingRecorderRef = useRef(null)
    const speakingChunksRef = useRef([])
    const [speakingRecording, setSpeakingRecording] = useState(false)  // currently recording
    const [speakingAudios, setSpeakingAudios] = useState({})     // sectionIdx → blobUrl
    const [speakingDurations, setSpeakingDurations] = useState({})     // sectionIdx → seconds
    const [speakingPlayIdx, setSpeakingPlayIdx] = useState(null)   // which part is playing
    const speakingPlaybackRef = useRef(null)

    // Cancel TTS on unmount
    useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

    // ── Reset & load when exam ID changes ────────────────────────────────────
    // This fixes the "all tests share global state" bug:
    // React may keep the component alive when navigating between exam IDs.
    // We must explicitly reset every piece of state on id change.
    useEffect(() => {
        if (!id) return
        // Reset UI state
        setPartIndex(0)
        setActiveQuestion(null)
        setHasPlayed({})
        setAudioProgress(0)
        setAudioDuration(0)
        setIsAudioPlaying(false)
        setAudioCheckConfirmed(false)
        setTestAudioPlayed(false)

        setSelectionPopup({ visible: false, x: 0, y: 0 })
        setExamError(null)
        setSessionElapsed(0)
        speakingSessionStartRef.current = null
        setShowSubmitConfirm(false)
        setTimeLeft(null)
        // Restore saved answers/flags/highlights for THIS exam
        try {
            const saved = localStorage.getItem(`exam_answers_${id}`)
            setAnswers(saved ? JSON.parse(saved) : {})
        } catch { setAnswers({}) }
        try {
            const saved = localStorage.getItem(`exam_flagged_${id}`)
            setFlagged(saved ? JSON.parse(saved) : {})
        } catch { setFlagged({}) }
        try {
            const saved = localStorage.getItem(`exam_highlights_${id}`)
            setHighlights(saved ? JSON.parse(saved) : {})
        } catch { setHighlights({}) }
        // Fetch exam data
        api(`/exams/${id}`)
            .then(data => {
                if (data) setExam(data)
            })
            .catch(err => {
                setExamError(err.message || 'Failed to load exam')
            })
    }, [id, navigate])

    // ── Auto-save ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (id && Object.keys(answers).length > 0) {
            localStorage.setItem(`exam_answers_${id}`, JSON.stringify(answers))
        }
    }, [answers, id])

    useEffect(() => {
        if (id && Object.keys(flagged).length > 0) {
            localStorage.setItem(`exam_flagged_${id}`, JSON.stringify(flagged))
        }
    }, [flagged, id])

    useEffect(() => {
        if (id) localStorage.setItem(`exam_highlights_${id}`, JSON.stringify(highlights))
    }, [highlights, id])


    // Reset audio on part change
    useEffect(() => {
        setIsAudioPlaying(false)
        setAudioProgress(0)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }, [partIndex])

    // Hide selection popup on click outside the popup
    useEffect(() => {
        const hide = (e) => {
            if (e.target.closest('.ip-selection-popup')) return
            setSelectionPopup(p => p.visible ? { ...p, visible: false } : p)
        }
        document.addEventListener('mousedown', hide)
        return () => document.removeEventListener('mousedown', hide)
    }, [])
    useEffect(() => { setSelectionPopup(p => p.visible ? { ...p, visible: false } : p) }, [partIndex])

    // ── Build flat parts list ─────────────────────────────────────────────────
    // ── Build flat parts list ─────────────────────────────────────────────────
    const parts = useMemo(() => {
        if (!exam?.modules) return []
        const result = []
            ;['listening', 'reading', 'writing', 'speaking'].forEach(mod => {
                const moduleData = exam.modules[mod]
                if (!Array.isArray(moduleData) || moduleData.length === 0) return
                moduleData.forEach((section, idx) => {
                    result.push({ module: mod, sectionIdx: idx, section })
                })
            })
        return result
    }, [exam])

    // ── Current part ─────────────────────────────────────────────────────────
    const currentPart = parts[partIndex] || {}
    const { module: currentModule, sectionIdx, section } = currentPart

    const isListening = currentModule === 'listening'
    const isReading = currentModule === 'reading'
    const isWriting = currentModule === 'writing'
    const isSpeaking = currentModule === 'speaking'

    // Key that uniquely identifies the current highlightable section
    const currentSectionKey = `${currentModule}_${sectionIdx ?? 0}`

    // Set innerHTML for the uncontrolled content div.
    // Runs BEFORE the marks effect (React executes layout effects in definition order).
    // Using [currentSectionKey] ensures it fires on section navigation but NOT on
    // timer ticks / answer changes — so marks are never erased by a React re-render.
    useLayoutEffect(() => {
        if (!contentHtmlRef.current) return
        const html = isListening && !section?.passageContent
            ? (section?.instructions || '')
            : (section?.passageContent || '')
        contentHtmlRef.current.innerHTML = html
    }, [currentSectionKey]) // eslint-disable-line react-hooks/exhaustive-deps

    // Re-apply highlights via mark.js.
    // Each highlight stores the `zone` it was captured in (data-hl-zone attribute on the
    // container element). Offsets are relative to that specific container — NOT the whole paper —
    // so mark.js counts the same characters as getRangeOffsets, guaranteed.
    useLayoutEffect(() => {
        const paper = examPaperRef.current
        if (!paper) return
        const list = highlights[currentSectionKey] || []
        const hasExistingMarks = paper.querySelector('mark.ip-text-highlight') !== null

        // Early exit: nothing to apply and nothing to clean — skip DOM work entirely.
        // This makes every timer tick free when there are no highlights on this section.
        if (list.length === 0 && !hasExistingMarks) return

        new Mark(paper).unmark({
            done: () => {
                if (list.length === 0) return
                const byZone = {}
                list.forEach((hl, idx) => {
                    const z = hl.zone || 'paper'
                    ;(byZone[z] = byZone[z] || []).push({ ...hl, idx })
                })
                Object.entries(byZone).forEach(([zone, marks]) => {
                    const container = zone === 'paper'
                        ? paper
                        : (paper.querySelector(`[data-hl-zone="${zone}"]`) || paper)
                    const instance = new Mark(container)
                    marks.forEach(({ start, end, color, idx }) => {
                        instance.markRanges(
                            [{ start, length: end - start }],
                            {
                                element: 'mark',
                                className: `ip-text-highlight ip-hl-${color || 'yellow'}`,
                                acrossElements: true,
                                exclude: ['input', 'textarea', 'select'],
                                each: el => {
                                    el.dataset.hl = String(idx)
                                    el.title = 'Click to remove highlight'
                                },
                            }
                        )
                    })
                })
            },
        })
    }) // no deps — runs after every render; early-exit when no highlights makes timer ticks free

    // Per-module timer: Reading = 60 min, Writing = 60 min, others = no timer
    useEffect(() => {
        if (isReading) {
            moduleTimerRef.current = 'reading'
            const saved = localStorage.getItem(`exam_timer_reading_${id}`)
            setTimeLeft(saved ? parseInt(saved, 10) : 60 * 60)
            setTimerPaused(false)
        } else if (isWriting) {
            moduleTimerRef.current = 'writing'
            const saved = localStorage.getItem(`exam_timer_writing_${id}`)
            setTimeLeft(saved ? parseInt(saved, 10) : 60 * 60)
            setTimerPaused(false)
        } else if (isSpeaking) {
            moduleTimerRef.current = 'speaking'
            const saved = localStorage.getItem(`exam_timer_speaking_${id}`)
            setTimeLeft(saved ? parseInt(saved, 10) : 15 * 60)
            setTimerPaused(false)
        } else if (isListening) {
            moduleTimerRef.current = null
            setTimeLeft(null)
            setTimerPaused(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReading, isWriting, isListening, isSpeaking])

    // ── Timer countdown ───────────────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null) return
        if (timeLeft <= 0) {
            localStorage.removeItem(`exam_timer_reading_${id}`)
            localStorage.removeItem(`exam_timer_writing_${id}`)
            if (moduleTimerRef.current === 'reading') {
                const firstWritingIdx = parts.findIndex(p => p.module === 'writing')
                if (firstWritingIdx !== -1) {
                    setPartIndex(firstWritingIdx)
                } else {
                    handleSubmit(true)
                }
            } else {
                handleSubmit(true)
            }
            return
        }
        if (timerPaused) return
        // Save timer per module
        if (moduleTimerRef.current === 'reading') {
            localStorage.setItem(`exam_timer_reading_${id}`, String(timeLeft))
        } else if (moduleTimerRef.current === 'writing') {
            localStorage.setItem(`exam_timer_writing_${id}`, String(timeLeft))
        } else if (moduleTimerRef.current === 'speaking') {
            localStorage.setItem(`exam_timer_speaking_${id}`, String(timeLeft))
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, timerPaused, parts, id])

    // Cancel TTS when leaving speaking section
    useEffect(() => {
        if (!isSpeaking) window.speechSynthesis?.cancel()
    }, [isSpeaking])

    // Speaking overall session timer
    useEffect(() => {
        if (!isSpeaking) {
            speakingSessionStartRef.current = null
            setSessionElapsed(0)
            return
        }
        if (!speakingSessionStartRef.current) {
            speakingSessionStartRef.current = Date.now()
        }
        const iv = setInterval(() => {
            setSessionElapsed(Math.floor((Date.now() - speakingSessionStartRef.current) / 1000))
        }, 1000)
        return () => clearInterval(iv)
    }, [isSpeaking])

    // ── startNumbers of mcq-multi questions in current module (for answer mirroring) ──
    const mcqMultiStartNums = useMemo(() => {
        if (!currentModule || isWriting || isSpeaking || !exam?.modules) return new Set()
        const set = new Set()
            ; (exam.modules[currentModule] || []).forEach(sec => {
                ; (sec.questions || []).forEach(q => {
                    if (q?.type === 'mcq-multi' || q?.type === 'mcq-multiple') {
                        const start = q.startNumber ?? q.questionNumber
                        if (typeof start === 'number') set.add(start)
                    }
                })
            })
        return set
    }, [exam, currentModule, isWriting, isSpeaking])

    // ── Per-module question numbers (for navigator) ───────────────────────────
    // Each module has its own numbered questions (listening 1-40, reading 1-40)
    const currentModuleQNums = useMemo(() => {
        if (!currentModule || isWriting || isSpeaking || !exam?.modules) return []
        const modSections = exam.modules[currentModule] || []
        const nums = new Set()
        modSections.forEach(sec => {
            ; (sec.questions || []).forEach(q => {
                if (!q) return
                const start = q.startNumber ?? q.questionNumber
                if (typeof start !== 'number') return
                const count = getQCount(q)
                for (let i = 0; i < count; i++) nums.add(start + i)
            })
        })
        return [...nums].sort((a, b) => a - b)
    }, [exam, currentModule, isWriting, isSpeaking])

    // ── Map: `${module}_${qNum}` → partIndex (for navigator click) ───────────
    const qPartMap = useMemo(() => {
        const map = {}
        parts.forEach((part, pIdx) => {
            const { module, section } = part
            if (!module || module === 'writing' || module === 'speaking') return
                ; (section.questions || []).forEach(q => {
                    if (!q) return
                    const start = q.startNumber ?? q.questionNumber
                    if (typeof start !== 'number') return
                    const count = getQCount(q)
                    for (let i = 0; i < count; i++) {
                        map[`${module}_${start + i}`] = pIdx
                    }
                })
        })
        return map
    }, [parts])

    // ── Module-scoped answers for QuestionRenderer ────────────────────────────
    // QuestionRenderer expects plain {qNum: answer} — strip the module prefix
    const moduleAnswers = useMemo(() => {
        if (!currentModule || isWriting || isSpeaking) return answers
        const prefix = `${currentModule}_`
        const result = {}
        Object.entries(answers).forEach(([k, v]) => {
            if (k.startsWith(prefix)) {
                result[Number(k.slice(prefix.length))] = v
            }
        })
        return result
    }, [answers, currentModule, isWriting, isSpeaking])

    // ── Answer change — uses namespaced keys ──────────────────────────────────
    // FIX: Each module's answers are stored under separate keys so reading and
    // listening Q1 never conflict: 'listening_1' vs 'reading_1'
    const handleAnswerChange = useCallback((qNum, val) => {
        if (!currentModule) return
        if (currentModule === 'writing' || currentModule === 'speaking') {
            // Writing/speaking use module-indexed keys passed directly as qNum
            setAnswers(prev => ({ ...prev, [qNum]: val }))
        } else {
            setAnswers(prev => {
                const next = { ...prev, [`${currentModule}_${qNum}`]: val }
                // mcq-multi occupies 2 question numbers — mirror answer to num+1
                // so both navigator dots show as answered
                if (typeof qNum === 'number' && mcqMultiStartNums.has(qNum)) {
                    next[`${currentModule}_${qNum + 1}`] = val
                }
                return next
            })
            // FIX: set only the SINGLE question that was just answered as active
            setActiveQuestion(typeof qNum === 'number' ? qNum : null)
        }
    }, [currentModule, mcqMultiStartNums])

    // ── Flag toggle — also namespaced ────────────────────────────────────────
    const toggleFlag = useCallback((qNum) => {
        if (!currentModule || currentModule === 'writing' || currentModule === 'speaking') return
        const key = `${currentModule}_${qNum}`
        setFlagged(prev => {
            if (prev[key]) { const next = { ...prev }; delete next[key]; return next }
            return { ...prev, [key]: true }
        })
    }, [currentModule])

    // ── Count answered in current module ────────────────────────────────────
    const answeredInModule = useMemo(() => {
        if (!currentModule || isWriting || isSpeaking) return 0
        return currentModuleQNums.filter(n => {
            const v = answers[`${currentModule}_${n}`]
            return v !== undefined && v !== ''
        }).length
    }, [currentModuleQNums, answers, currentModule, isWriting, isSpeaking])

    // ── Count all answered (for submit modal) ────────────────────────────────
    const { totalAllQ, answeredAll } = useMemo(() => {
        let total = 0, answered = 0
        parts.forEach(part => {
            const { module: mod, section: sec } = part
            if (!mod || mod === 'writing' || mod === 'speaking') return
                ; (sec.questions || []).forEach(q => {
                    if (!q) return
                    const start = q.startNumber ?? q.questionNumber
                    if (typeof start !== 'number') return
                    const count = getQCount(q)
                    for (let i = 0; i < count; i++) {
                        total++
                        const key = `${mod}_${start + i}`
                        if (answers[key] !== undefined && answers[key] !== '') answered++
                    }
                })
        })
        return { totalAllQ: total, answeredAll: answered }
    }, [answers, parts])

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit && !showSubmitConfirm) { setShowSubmitConfirm(true); return }
        setShowSubmitConfirm(false)
        setIsSubmitting(true)
        try {
            let user = {}
            try { user = JSON.parse(localStorage.getItem('user') || '{}') } catch { /* corrupted */ }
            await api('/submissions', 'POST', {
                exam: id,
                user: user?.id || user?._id,
                // Send full namespaced answers — controller handles extraction per module
                answers
            })
            localStorage.removeItem(`exam_answers_${id}`)
            localStorage.removeItem(`exam_flagged_${id}`)
            localStorage.removeItem(`exam_highlights_${id}`) // Cleanup legacy
            localStorage.removeItem(`exam_timer_reading_${id}`)
            localStorage.removeItem(`exam_timer_writing_${id}`)
            navigate('/my-results')
        } catch (err) {
            alert('Submission failed: ' + err.message)
            setIsSubmitting(false)
        }
    }

    // ── Audio helpers ─────────────────────────────────────────────────────────
    const currentAudio = section?.media?.find(m => m.type === 'audio')
    const audioKey = String(partIndex)

    const playTestAudio = () => {
        const sampleRate = 22050, duration = 0.6, freq = 440
        const numSamples = Math.floor(sampleRate * duration)
        const buf = new ArrayBuffer(44 + numSamples * 2)
        const dv = new DataView(buf)
        const ws = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)) }
        ws(0, 'RIFF'); dv.setUint32(4, 36 + numSamples * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ')
        dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
        dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true)
        dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); ws(36, 'data')
        dv.setUint32(40, numSamples * 2, true)
        for (let i = 0; i < numSamples; i++) {
            const fade = i < 2000 ? i / 2000 : i > numSamples - 2000 ? (numSamples - i) / 2000 : 1
            dv.setInt16(44 + i * 2, Math.sin(2 * Math.PI * freq * i / sampleRate) * 0x3FFF * fade, true)
        }
        const url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
        const a = new Audio(url)
        a.onended = () => { URL.revokeObjectURL(url); setTestAudioPlayed(true) }
        a.play().catch(() => setTestAudioPlayed(true))
    }

    const playAudio = () => {
        if (!audioRef.current) return
        if (hasPlayed[audioKey] && !isAudioPlaying) {
            alert('IELTS Exam Rule: The recording plays ONCE only.')
            return
        }
        if (isAudioPlaying) {
            audioRef.current.pause()
            setIsAudioPlaying(false)
        } else {
            audioRef.current.play().catch(console.error)
            setIsAudioPlaying(true)
            setHasPlayed(prev => ({ ...prev, [audioKey]: true }))
        }
    }

    const handleAudioUpdate = () => {
        if (!audioRef.current) return
        const { currentTime, duration } = audioRef.current
        setAudioProgress((currentTime / duration) * 100 || 0)
        if (currentTime >= duration) setIsAudioPlaying(false)
    }

    // ── Highlight helpers (state-based — survives re-renders and navigation) ────
    const examPaperRef = useRef(null)
    // Uncontrolled ref for passage/task/context content divs.
    // We set innerHTML manually so React NEVER owns these divs — mark.js marks survive
    // all re-renders, StrictMode double-invocations, and timer ticks.
    const contentHtmlRef = useRef(null)

    const handleGlobalMouseUp = useCallback((e) => {
        // Never interfere with clicks inside the popup itself
        if (e.target.closest('.ip-selection-popup')) return

        // Textarea / select interactions should not trigger the highlight popup
        if (e.target.closest('textarea, select')) {
            setSelectionPopup(p => p.visible ? { ...p, visible: false } : p)
            return
        }

        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            setSelectionPopup(p => p.visible ? { ...p, visible: false } : p)
            return
        }

        const selectedText = selection.toString().trim()
        if (selectedText.length < 2) {
            setSelectionPopup(p => p.visible ? { ...p, visible: false } : p)
            return
        }

        const range = selection.getRangeAt(0)
        const paper = examPaperRef.current
        if (!paper || !paper.contains(range.commonAncestorContainer)) {
            setSelectionPopup(p => p.visible ? { ...p, visible: false } : p)
            return
        }

        // Find the nearest [data-hl-zone] ancestor inside the paper.
        // Computing offsets relative to this specific container (not the whole paper)
        // guarantees mark.js uses the same character counting when re-applying.
        let ancestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement
            : range.commonAncestorContainer
        let zoneEl = paper
        let zone = 'paper'
        while (ancestor && ancestor !== paper) {
            if (ancestor.dataset?.hlZone) {
                zone = ancestor.dataset.hlZone
                zoneEl = ancestor
                break
            }
            ancestor = ancestor.parentElement
        }

        let offsets
        try {
            offsets = getRangeOffsets(zoneEl, range)
        } catch {
            return
        }
        const { start, end } = offsets
        if (start >= end) return
        savedOffsetsRef.current = { start, end, zone }

        const rects = range.getClientRects()
        if (rects.length === 0) return
        const rect = rects[rects.length - 1]
        const popupX = Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120)
        const below = rect.bottom + 54 > window.innerHeight
        const popupY = below ? rect.top : rect.bottom
        setSelectionPopup({ visible: true, x: popupX, y: popupY, position: below ? 'above' : 'below' })
    }, [])

    useEffect(() => {
        window.addEventListener('mouseup', handleGlobalMouseUp)
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
    }, [handleGlobalMouseUp])

    const applyHighlight = useCallback((color = 'yellow') => {
        if (!savedOffsetsRef.current) return
        const { start, end, zone = 'paper' } = savedOffsetsRef.current
        setHighlights(prev => {
            const existing = prev[currentSectionKey] || []
            // Remove overlapping highlights within the same zone only
            const filtered = existing.filter(h => {
                if ((h.zone || 'paper') !== zone) return true
                return h.end <= start || h.start >= end
            })
            return { ...prev, [currentSectionKey]: [...filtered, { start, end, color, zone }] }
        })
        savedOffsetsRef.current = null
        window.getSelection()?.removeAllRanges()
        setSelectionPopup(p => ({ ...p, visible: false }))
    }, [currentSectionKey])

    const handleMarkClick = useCallback((e) => {
        const mark = e.target.closest('mark.ip-text-highlight')
        if (!mark) return
        const idx = parseInt(mark.dataset.hl, 10)
        if (isNaN(idx)) return
        setHighlights(prev => {
            const existing = prev[currentSectionKey] || []
            return { ...prev, [currentSectionKey]: existing.filter((_, i) => i !== idx) }
        })
        e.stopPropagation()
    }, [currentSectionKey])

    // ── Part label ────────────────────────────────────────────────────────────
    const getPartLabel = (mod, idx) => {
        if (mod === 'reading') return `Passage ${idx + 1}`
        if (mod === 'writing') return `Task ${idx + 1}`
        return `Part ${idx + 1}`
    }

    // ── Shared question list renderer ────────────────────────────────────────
    const renderQuestions = useCallback(() => {
        if (!section?.questions?.length) {
            return <div className="ip-empty-section">No questions in this section.</div>
        }
        return section.questions.map((q, i) => {
            const prevQ = i > 0 ? section.questions[i - 1] : null;
            const hideInstruction = prevQ && prevQ.instructionText && prevQ.instructionText === q.instructionText;
            return (
                <PaperQuestionBlock
                    key={`${currentModule}_${q.startNumber ?? q.questionNumber ?? i}`}
                    q={q}
                    moduleAnswers={moduleAnswers}
                    module={currentModule}
                    onChange={handleAnswerChange}
                    flagged={flagged}
                    onToggleFlag={toggleFlag}
                    onFocus={setActiveQuestion}
                    hideInstruction={hideInstruction}
                />
            );
        });
    }, [section, moduleAnswers, currentModule, handleAnswerChange, flagged, toggleFlag])

    // ── Loading / error / empty states ───────────────────────────────────────
    if (examError) return (
        <div className="ip-loading">
            <div style={{ textAlign: 'center', color: '#dc2626', fontSize: 15, marginBottom: 16 }}>
                ⚠ {examError}
            </div>
            <button
                onClick={() => { setExamError(null); window.location.reload() }}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
                Retry
            </button>
            <button
                onClick={() => navigate('/dashboard')}
                style={{ background: 'none', color: '#64748b', border: 'none', marginTop: 10, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
                Back to Dashboard
            </button>
        </div>
    )
    if (!exam) return (
        <div className="ip-loading">
            <div className="ip-loading-spinner" />
            <p>Loading exam...</p>
            {loadingTimedOut && (
                <div style={{ marginTop: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Taking a while? The server might be waking up.<br />
                    Please wait or <button onClick={() => window.location.reload()} style={{ color: '#2563eb', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>refresh</button>.
                </div>
            )}
        </div>
    )
    if (parts.length === 0) return (
        <div className="ip-loading">
            <p>This exam has no content yet.</p>
            <button onClick={() => navigate('/dashboard')} style={{ marginTop: 16, background: 'none', color: '#2563eb', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>← Back to Dashboard</button>
        </div>
    )

    const partLabel = getPartLabel(currentModule, sectionIdx)
    const timeWarning = timeLeft !== null && timeLeft < 300
    const timeDanger = timeLeft !== null && timeLeft < 60

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="ip-root">

            {/* ── COMBINED HEADER ── */}
            <header className="ip-header">
                {/* Module navigation tabs */}
                <div className="ip-header-tabs">
                    {['listening', 'reading', 'writing', 'speaking'].map(mod => {
                        const hasMod = exam?.modules?.[mod]?.length > 0
                        if (!hasMod) return null
                        const modFirstPartIdx = parts.findIndex(p => p.module === mod)
                        const icons = { listening: '🎧', reading: '📖', writing: '✍', speaking: '🎤' }
                        return (
                            <button
                                key={mod}
                                className={`ip-header-tab${currentModule === mod ? ' active' : ''}`}
                                onClick={() => { if (modFirstPartIdx !== -1) { setPartIndex(modFirstPartIdx); setActiveQuestion(null) } }}
                                title={mod.charAt(0).toUpperCase() + mod.slice(1)}
                            >
                                {icons[mod]}
                                <span className="ip-header-tab-text">{mod.charAt(0).toUpperCase() + mod.slice(1)}</span>
                            </button>
                        )
                    })}
                </div>

                <div className="ip-header-sep" />

                {/* Current section info */}
                <div className="ip-header-info">
                    <span className="ip-header-mod-badge">{currentModule?.toUpperCase()}</span>
                    <span className="ip-header-section-label">
                        {partLabel}{section?.title && section.title !== partLabel ? ` — ${section.title}` : ''}
                    </span>
                    {section?.questionRange && (
                        <span className="ip-header-q-badge">Q {section.questionRange}</span>
                    )}
                    {currentModule && exam?.modules?.[currentModule]?.length > 1 && (
                        <span className="ip-header-part-idx">
                            {sectionIdx + 1}/{exam.modules[currentModule].length}
                        </span>
                    )}
                </div>

                {/* Timer */}
                {timeLeft !== null && (
                    <div className={`ip-timer${timeWarning ? ' warning' : ''}${timeDanger ? ' danger' : ''}`}>
                        {formatTime(timeLeft)}
                    </div>
                )}

            </header>

            {/* ── INSTRUCTIONS BANNER (reading / speaking only — listening shows inline) ── */}
            {section?.instructions && !isWriting && !isListening && (
                <div
                    className="ip-instructions-banner"
                    dangerouslySetInnerHTML={{ __html: section.instructions }}
                />
            )}

            {/* ── AUDIO CHECK OVERLAY (listening only, once per exam) ── */}
            {isListening && !audioCheckConfirmed && (
                <div className="ip-audio-check-overlay">
                    <div className="ip-audio-check-card">
                        <div className="ip-audio-check-icon">🎧</div>
                        <h3 className="ip-audio-check-title">Audio Check</h3>
                        <p className="ip-audio-check-desc">
                            Before the listening test begins, please check that your headphones are working correctly.
                        </p>
                        <button
                            className={`ip-audio-check-play-btn${testAudioPlayed ? ' played' : ''}`}
                            onClick={playTestAudio}
                        >
                            🔔 {testAudioPlayed ? 'Play Again' : 'Play Test Sound'}
                        </button>
                        {testAudioPlayed && (
                            <p className="ip-audio-check-q">Can you hear the sound clearly?</p>
                        )}
                        <button
                            className="ip-audio-check-confirm-btn"
                            onClick={() => setAudioCheckConfirmed(true)}
                        >
                            {testAudioPlayed ? 'Yes, continue to test →' : 'Skip and continue →'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── BODY ── */}
            <div className="ip-body">
                <div
                    ref={examPaperRef}
                    onClick={handleMarkClick}
                    className={[
                    'ip-paper',
                    'ip-highlightable',
                    isListening ? 'ip-paper-listening' : '',
                    isReading ? 'reading-layout' : '',
                    isWriting ? 'writing-layout' : '',
                    isListening ? 'listening-layout' : '',
                ].filter(Boolean).join(' ')}>

                    {/* ── LISTENING ── */}
                    {isListening && (
                        <>
                            <audio
                                ref={audioRef}
                                src={currentAudio?.url}
                                onTimeUpdate={handleAudioUpdate}
                                onLoadedMetadata={() => { if (audioRef.current) setAudioDuration(audioRef.current.duration) }}
                                onEnded={() => setIsAudioPlaying(false)}
                            />

                            {/* Sticky audio bar */}
                            <div className="ip-audio-bar">
                                <div className="ip-audio-strip">
                                    <button
                                        className="ip-audio-play-btn"
                                        onClick={playAudio}
                                        disabled={!currentAudio}
                                        title={hasPlayed[audioKey] && !isAudioPlaying ? 'Recording already played' : isAudioPlaying ? 'Pause' : 'Play recording'}
                                    >
                                        {isAudioPlaying ? '⏸' : '▶'}
                                    </button>
                                    <div className="ip-audio-info">
                                        <div className="ip-audio-top-row">
                                            <span className="ip-audio-label">
                                                {isAudioPlaying ? 'Playing…' : hasPlayed[audioKey] ? 'Recording Played' : 'Section Recording'}
                                            </span>
                                            <span className="ip-audio-time">
                                                {formatTime(Math.floor(audioRef.current?.currentTime || 0))} / {formatTime(Math.floor(audioDuration || 0))}
                                            </span>
                                            {hasPlayed[audioKey] && !isAudioPlaying && (
                                                <span className="ip-audio-played-badge">PLAYED</span>
                                            )}
                                        </div>
                                        <div className="ip-audio-progress-wrap">
                                            <div className="ip-audio-progress-fill" style={{ width: `${audioProgress}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <p className="ip-audio-warning">
                                    ⚠ This recording plays ONCE only. Ensure headphones are connected before playing.
                                </p>
                            </div>

                            {/* Content: split if passage, full-width if not */}
                            {(() => {
                                const sectionImage = section?.media?.find(m => m.type === 'image')
                                const instrPlainText = stripHtml(section?.instructions || '')

                                if (section?.passageContent) {
                                    return (
                                        <div className="ip-listening-split ip-highlightable">
                                            <div className="ip-listening-left">
                                                {/* 1. Instructions first */}
                                                {section?.instructions && (
                                                    <p className="ip-listening-instr-label ip-highlightable"
                                                       dangerouslySetInnerHTML={{ __html: section.instructions }} />
                                                )}
                                                {/* 2. Image after instructions */}
                                                {sectionImage && (
                                                    <img
                                                        src={sectionImage.url}
                                                        alt="Listening diagram"
                                                        className="ip-listening-image"
                                                    />
                                                )}
                                                {/* 3. Passage (highlightable) */}
                                                <div
                                                    ref={contentHtmlRef}
                                                    className="ip-context-box ip-highlightable"
                                                    data-hl-zone="context"
                                                />

                                            </div>
                                            <div className="ip-listening-right">
                                                {renderQuestions()}
                                            </div>
                                        </div>
                                    )
                                }

                                return (
                                    <div className="ip-listening-full ip-highlightable">
                                        {/* 1. Instructions as highlightable text — student can mark key words */}
                                        {instrPlainText && (
                                            <div
                                                ref={contentHtmlRef}
                                                className="ip-listening-instr-hl ip-highlightable"
                                                data-hl-zone="context"
                                            />
                                        )}

                                        {/* 2. Image after instructions */}
                                        {sectionImage && (
                                            <img
                                                src={sectionImage.url}
                                                alt="Listening diagram"
                                                className="ip-listening-image"
                                            />
                                        )}
                                        {/* 3. Questions */}
                                        {renderQuestions()}
                                    </div>
                                )
                            })()}
                        </>
                    )}

                    {/* ── READING ── */}
                    {isReading && (
                        <div className="ip-reading-split">
                            <div className="ip-passage-col">
                                <div className="ip-passage-title-row">
                                    <h2 className="ip-passage-title">{section?.title}</h2>

                                </div>
                                <div
                                    ref={contentHtmlRef}
                                    className="ip-passage-text ip-highlightable"
                                    data-hl-zone="passage"
                                    onCopy={e => e.preventDefault()}
                                    onContextMenu={e => e.preventDefault()}
                                />
                            </div>
                            <div className="ip-questions-col" data-hl-zone="questions">
                                {renderQuestions()}
                            </div>
                        </div>
                    )}

                    {/* ── SPEAKING ── */}
                    {isSpeaking && (
                        <SpeakingHero
                            section={section}
                            sectionIdx={sectionIdx}
                            speakingRecording={speakingRecording}
                            setSpeakingRecording={setSpeakingRecording}
                            speakingAudios={speakingAudios}
                            setSpeakingAudios={setSpeakingAudios}
                            speakingDurations={speakingDurations}
                            setSpeakingDurations={setSpeakingDurations}
                            speakingPlayIdx={speakingPlayIdx}
                            setSpeakingPlayIdx={setSpeakingPlayIdx}
                            speakingRecorderRef={speakingRecorderRef}
                            speakingChunksRef={speakingChunksRef}
                            speakingPlaybackRef={speakingPlaybackRef}
                            onUploaded={(url, qIdx) => handleAnswerChange(
                                qIdx != null ? `speaking_audio_${sectionIdx}_q${qIdx}` : `speaking_audio_${sectionIdx}`,
                                url
                            )}
                            isAdmin={false}
                            textValue={answers[`speaking_text_${sectionIdx}`] || ''}
                            onTextAnswer={val => handleAnswerChange(`speaking_text_${sectionIdx}`, val)}
                            sessionElapsed={sessionElapsed}
                        />
                    )}

                    {/* ── WRITING ── */}
                    {isWriting && (
                        <div className="ip-writing-split ip-highlightable">
                            <div className="ip-task-col">
                                <h2 className="ip-task-heading">{section?.title}</h2>
                                {(() => {
                                    const rawInstr = section?.instructions
                                    const plainInstr = rawInstr ? stripHtml(rawInstr).trim() : ''
                                    const fallback = sectionIdx === 0
                                        ? 'Task 1: You should spend about 20 minutes on this task. Write at least 150 words.'
                                        : 'Task 2: You should spend about 40 minutes on this task. Write at least 250 words.'
                                    return plainInstr
                                        ? <div className="ip-task-instructions ip-highlightable" dangerouslySetInnerHTML={{ __html: rawInstr }} />
                                        : <p className="ip-task-instructions">{fallback}</p>
                                })()}
                                <div
                                    ref={contentHtmlRef}
                                    className="ip-task-prompt ip-highlightable"
                                    data-hl-zone="task"
                                />
                                {section?.media?.filter(m => m.type === 'image').map((img, i) => (
                                    <img key={i} src={img.url} alt="Task visual" className="ip-task-image" />
                                ))}

                            </div>
                            <WritingArea
                                sectionIdx={sectionIdx}
                                value={answers[`writing_${sectionIdx}`] || ''}
                                onChange={val => handleAnswerChange(`writing_${sectionIdx}`, val)}
                            />
                        </div>
                    )}

                </div>
            </div>

            {/* ── FOOTER ── */}
            <footer className="ip-footer">

                {/* ── Row 1: Question navigator grid (listening / reading only) ── */}
                {!isWriting && !isSpeaking && currentModuleQNums.length > 0 ? (
                    <div className="ip-footer-grid-row">
                        <button
                            className="ip-nav-btn"
                            onClick={() => { setPartIndex(p => Math.max(0, p - 1)); setActiveQuestion(null) }}
                            disabled={partIndex === 0}
                            title="Previous section"
                        >❮</button>

                        <span className="ip-footer-part-label">{partLabel}</span>

                        {/* Navigator: keyed by unique module_qNum — only one dot activates */}
                        <div className="ip-q-grid">
                            {currentModuleQNums.map(n => {
                                const dotKey = `${currentModule}_${n}`
                                const isAnswered = answers[dotKey] !== undefined && answers[dotKey] !== ''
                                const isFlaggedQ = !!flagged[dotKey]
                                const isActive = activeQuestion === n
                                return (
                                    <div
                                        key={dotKey}
                                        className={[
                                            'ip-q-dot',
                                            isFlaggedQ ? 'flagged' : '',
                                            isAnswered ? 'answered' : '',
                                            isActive ? 'active' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => {
                                            const targetPart = qPartMap[dotKey]
                                            if (targetPart !== undefined) setPartIndex(targetPart)
                                            setActiveQuestion(n)
                                        }}
                                        title={`Q${n}${isAnswered ? ' ✓' : ''}${isFlaggedQ ? ' 🚩' : ''}`}
                                    >
                                        {n}
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            className="ip-nav-btn"
                            onClick={() => { setPartIndex(p => Math.min(parts.length - 1, p + 1)); setActiveQuestion(null) }}
                            disabled={partIndex === parts.length - 1}
                            title="Next section"
                        >❯</button>
                    </div>
                ) : (
                    /* Writing / Speaking: just prev/next arrows */
                    <div className="ip-footer-grid-row ip-footer-grid-row--writing">
                        <button
                            className="ip-nav-btn"
                            onClick={() => { setPartIndex(p => Math.max(0, p - 1)); setActiveQuestion(null) }}
                            disabled={partIndex === 0}
                            title="Previous section"
                        >❮</button>
                        <span className="ip-footer-writing-label">
                            {isSpeaking ? `Speaking — Part ${sectionIdx + 1}` : `Writing — Task ${sectionIdx + 1}`}
                        </span>
                        <button
                            className="ip-nav-btn"
                            onClick={() => { setPartIndex(p => Math.min(parts.length - 1, p + 1)); setActiveQuestion(null) }}
                            disabled={partIndex === parts.length - 1}
                            title="Next section"
                        >❯</button>
                    </div>
                )}

                {/* ── Row 2: Legend + count + finish button ── */}
                <div className="ip-footer-controls-row">
                    <div className="ip-legend">
                        <span className="ip-legend-item"><span className="ip-legend-sq answered" />Answered</span>
                        <span className="ip-legend-item"><span className="ip-legend-sq active" />Active</span>
                        <span className="ip-legend-item"><span className="ip-legend-sq flagged" />Flagged</span>
                        <span className="ip-legend-item"><span className="ip-legend-sq empty" />Unanswered</span>
                    </div>
                    {!isWriting && !isSpeaking && currentModuleQNums.length > 0 && (
                        <span className="ip-answered-count">
                            {answeredInModule} / {currentModuleQNums.length} answered
                        </span>
                    )}
                    <button className="ip-finish-btn" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Finish Test'}
                    </button>
                </div>

            </footer>

            {/* ── HIGHLIGHT POPUP ── */}
            {selectionPopup.visible && (
                <div
                    className={`ip-selection-popup ip-selection-popup--${selectionPopup.position}`}
                    style={{ left: selectionPopup.x, top: selectionPopup.y }}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                >
                    <span className="ip-hl-popup-label">Highlight</span>
                    <div className="ip-hl-popup-divider" />
                    {['yellow', 'green', 'blue', 'pink'].map(c => (
                        <button
                            key={c}
                            className={`ip-hl-dot ip-hl-dot--${c}`}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => applyHighlight(c)}
                            title={c.charAt(0).toUpperCase() + c.slice(1)}
                        />
                    ))}
                    <div className="ip-hl-popup-divider" />
                    <button
                        className="ip-selection-popup-btn ip-selection-popup-btn--close"
                        onClick={() => {
                            setSelectionPopup(p => ({ ...p, visible: false }))
                        }}
                        title="Cancel"
                    >✕</button>
                </div>
            )}

            {/* ── SUBMIT CONFIRM MODAL ── */}
            {showSubmitConfirm && (
                <div className="ip-modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
                    <div className="ip-modal-box" onClick={e => e.stopPropagation()}>
                        <h2>Submit Your Test?</h2>
                        <p>
                            You have answered <strong>{answeredAll}</strong> of <strong>{totalAllQ}</strong> questions.
                            {answeredAll < totalAllQ && (
                                <span className="ip-modal-warning">
                                    {' '}{totalAllQ - answeredAll} question{totalAllQ - answeredAll !== 1 ? 's' : ''} unanswered.
                                </span>
                            )}
                        </p>
                        <p className="ip-modal-note">Once submitted, you cannot change your answers.</p>
                        <div className="ip-modal-actions">
                            <button className="ip-modal-btn cancel" onClick={() => setShowSubmitConfirm(false)}>
                                Review Answers
                            </button>
                            <button className="ip-modal-btn confirm" onClick={() => handleSubmit(true)}>
                                Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
