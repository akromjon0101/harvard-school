import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import QuestionRenderer from '../components/exam/QuestionRenderer'
import SpeakingHero     from '../components/exam/SpeakingHero'
import '../styles/ielts-paper.css'
import '../styles/ielts-premium.css'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Renders passage text with highlights as React elements (no dangerouslySetInnerHTML)
// This gives a predictable DOM structure: textNode | <mark>textNode</mark> | textNode ...
function renderHighlightedText(rawText, highlights) {
    const text = normalizeText(rawText)
    if (!text) return null
    if (!highlights?.length) return text
    const sorted = highlights.map((h, i) => ({ ...h, origIdx: i })).sort((a, b) => a.start - b.start)
    const parts = []
    let cursor = 0
    for (const h of sorted) {
        if (h.start >= cursor && h.end > h.start) {
            if (h.start > cursor) parts.push(text.slice(cursor, h.start))
            parts.push(
                <mark
                    key={`hl-${h.start}`}
                    className={`ip-text-highlight ip-hl-${h.color || 'yellow'}`}
                    data-hl={h.origIdx}
                    title="Click to remove"
                >
                    {text.slice(h.start, h.end)}
                </mark>
            )
            cursor = h.end
        }
    }
    if (cursor < text.length) parts.push(text.slice(cursor))
    return parts
}

// Normalize line endings so DOM text nodes and raw string match
function normalizeText(str) {
    return str ? str.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : ''
}

// Accurate caret offset using recursive DOM walk
// Handles text nodes, element nodes, and marks correctly
function getCaretOffset(container, targetNode, targetOffset) {
    // Case: selection boundary is at the container element itself
    if (targetNode === container) {
        let t = 0
        for (let i = 0; i < targetOffset; i++) {
            t += container.childNodes[i]?.textContent?.length || 0
        }
        return t
    }
    let total = 0
    let found = false
    function walk(node) {
        if (found) return
        if (node === targetNode) {
            if (node.nodeType === Node.TEXT_NODE) {
                total += targetOffset
            } else {
                // element node: targetOffset is child index
                for (let i = 0; i < targetOffset && i < node.childNodes.length; i++) {
                    total += node.childNodes[i].textContent.length
                }
            }
            found = true
            return
        }
        if (node.nodeType === Node.TEXT_NODE) {
            total += node.nodeValue.length
        } else {
            for (const child of node.childNodes) {
                if (found) return
                walk(child)
            }
        }
    }
    for (const child of container.childNodes) {
        if (found) break
        walk(child)
    }
    return total
}

// Count how many question slots a question block occupies
function getQCount(q) {
    if (!q) return 0
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
    const user = JSON.parse(localStorage.getItem('user') || '{}')
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
function PaperQuestionBlock({ q, moduleAnswers, module, onChange, flagged, onToggleFlag, onFocus }) {
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
            />
        </div>
    )
}

// ── Main exam page ────────────────────────────────────────────────────────────
export default function IELTSExamPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [exam, setExam]                     = useState(null)
    const [partIndex, setPartIndex]           = useState(0)
    // Keys: 'listening_1', 'reading_5', 'writing_0'
    const [answers, setAnswers]               = useState({})
    // Keys: 'listening_1': true
    const [flagged, setFlagged]               = useState({})
    // Active question NUMBER in current module (for navigator highlighting)
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [timeLeft, setTimeLeft]             = useState(null)
    const [timerPaused, setTimerPaused]       = useState(false)
    const moduleTimerRef = useRef(null) // tracks which module's timer is currently running
    const [isSubmitting, setIsSubmitting]     = useState(false)
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

    // Highlight state (reading + listening passages)
    const passageRef = useRef(null)
    const [sectionHighlights, setSectionHighlights] = useState({})
    const [selectionPopup, setSelectionPopup] = useState({ visible: false, x: 0, y: 0, start: 0, end: 0 })

    // Audio state
    const audioRef = useRef(null)
    const [hasPlayed, setHasPlayed]           = useState({})
    const [audioProgress, setAudioProgress]   = useState(0)
    const [audioDuration, setAudioDuration]   = useState(0)
    const [isAudioPlaying, setIsAudioPlaying]       = useState(false)
    const [audioCheckConfirmed, setAudioCheckConfirmed] = useState(false)
    const [testAudioPlayed, setTestAudioPlayed]     = useState(false)

    // TTS state for reading speaking prompts aloud
    const [ttsSpeaking, setTtsSpeaking] = useState(false)

    // Speaking recording state (per sectionIdx)
    const speakingRecorderRef = useRef(null)
    const speakingChunksRef   = useRef([])
    const [speakingRecording, setSpeakingRecording]   = useState(false)  // currently recording
    const [speakingAudios, setSpeakingAudios]         = useState({})     // sectionIdx → blobUrl
    const [speakingDurations, setSpeakingDurations]   = useState({})     // sectionIdx → seconds
    const [speakingPlayIdx, setSpeakingPlayIdx]       = useState(null)   // which part is playing
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
        setSectionHighlights({})
        setSelectionPopup({ visible: false, x: 0, y: 0, start: 0, end: 0 })
        setShowSubmitConfirm(false)
        setTimeLeft(null)
        // Restore saved answers/flags for THIS exam
        try {
            const saved = localStorage.getItem(`exam_answers_${id}`)
            setAnswers(saved ? JSON.parse(saved) : {})
        } catch { setAnswers({}) }
        try {
            const saved = localStorage.getItem(`exam_flagged_${id}`)
            setFlagged(saved ? JSON.parse(saved) : {})
        } catch { setFlagged({}) }
        // Fetch exam data
        api(`/exams/${id}`)
            .then(data => {
                if (data) {
                    setExam(data)
                }
            })
            .catch(() => navigate('/dashboard'))
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

    // Reset audio on part change
    useEffect(() => {
        setIsAudioPlaying(false)
        setAudioProgress(0)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }, [partIndex])

    // Hide selection popup on outside click
    useEffect(() => {
        const hide = () => setSelectionPopup(p => ({ ...p, visible: false }))
        document.addEventListener('mousedown', hide)
        return () => document.removeEventListener('mousedown', hide)
    }, [])
    useEffect(() => { setSelectionPopup(p => ({ ...p, visible: false })) }, [partIndex])

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
    const isReading   = currentModule === 'reading'
    const isWriting   = currentModule === 'writing'
    const isSpeaking  = currentModule === 'speaking'

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
        } else if (isListening || isSpeaking) {
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
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, timerPaused, parts, id])

    // Cancel TTS when leaving speaking section
    useEffect(() => {
        if (!isSpeaking) {
            window.speechSynthesis?.cancel()
            setTtsSpeaking(false)
        }
    }, [isSpeaking])

    // ── startNumbers of mcq-multi questions in current module (for answer mirroring) ──
    const mcqMultiStartNums = useMemo(() => {
        if (!currentModule || isWriting || isSpeaking || !exam?.modules) return new Set()
        const set = new Set()
        ;(exam.modules[currentModule] || []).forEach(sec => {
            ;(sec.questions || []).forEach(q => {
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
            ;(sec.questions || []).forEach(q => {
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
            ;(section.questions || []).forEach(q => {
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
            ;(sec.questions || []).forEach(q => {
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
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            await api('/submissions', 'POST', {
                exam: id,
                user: user?.id || user?._id,
                // Send full namespaced answers — controller handles extraction per module
                answers
            })
            localStorage.removeItem(`exam_answers_${id}`)
            localStorage.removeItem(`exam_flagged_${id}`)
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

    // ── Highlight helpers ─────────────────────────────────────────────────────
    const highlightKey = `part_${partIndex}`
    const currentHighlights = sectionHighlights[highlightKey] || []

    const handlePassageMouseUp = useCallback((e) => {
        // If clicking on an existing mark — skip (handlePassageClick will handle removal)
        if (e.target.closest('mark.ip-text-highlight')) return
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) { setSelectionPopup(p => ({ ...p, visible: false })); return }
        const selectedText = selection.toString()
        if (selectedText.trim().length < 2) { setSelectionPopup(p => ({ ...p, visible: false })); return }
        const range = selection.getRangeAt(0)
        const el = passageRef.current
        if (!el || !el.contains(range.commonAncestorContainer)) { setSelectionPopup(p => ({ ...p, visible: false })); return }
        try {
            const startOffset = getCaretOffset(el, range.startContainer, range.startOffset)
            const endOffset   = getCaretOffset(el, range.endContainer,   range.endOffset)
            if (endOffset <= startOffset) { setSelectionPopup(p => ({ ...p, visible: false })); return }
            const rect = range.getBoundingClientRect()
            setSelectionPopup({ visible: true, x: rect.left + rect.width / 2, y: rect.top, start: startOffset, end: endOffset })
        } catch { setSelectionPopup(p => ({ ...p, visible: false })) }
    }, [])

    const applyHighlight = useCallback((color = 'yellow') => {
        setSectionHighlights(prev => ({
            ...prev,
            [highlightKey]: [...(prev[highlightKey] || []), { start: selectionPopup.start, end: selectionPopup.end, color }]
        }))
        setSelectionPopup(p => ({ ...p, visible: false }))
        window.getSelection()?.removeAllRanges()
    }, [selectionPopup, highlightKey])

    const handlePassageClick = useCallback((e) => {
        const mark = e.target.closest('mark.ip-text-highlight')
        if (!mark) return
        const idx = parseInt(mark.dataset.hl, 10)
        if (isNaN(idx)) return
        setSectionHighlights(prev => ({
            ...prev,
            [highlightKey]: (prev[highlightKey] || []).filter((_, i) => i !== idx)
        }))
    }, [highlightKey])

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
        return section.questions.map((q, i) => (
            <PaperQuestionBlock
                key={`${currentModule}_${q.startNumber ?? q.questionNumber ?? i}`}
                q={q}
                moduleAnswers={moduleAnswers}
                module={currentModule}
                onChange={handleAnswerChange}
                flagged={flagged}
                onToggleFlag={toggleFlag}
                onFocus={setActiveQuestion}
            />
        ))
    }, [section, moduleAnswers, currentModule, handleAnswerChange, flagged, toggleFlag])

    // ── Loading / empty states ────────────────────────────────────────────────
    if (!exam) return (
        <div className="ip-loading">
            <div className="ip-loading-spinner" />
            <p>Loading exam...</p>
        </div>
    )
    if (parts.length === 0) return (
        <div className="ip-loading"><p>This exam has no content yet.</p></div>
    )

    const partLabel = getPartLabel(currentModule, sectionIdx)
    const timeWarning = timeLeft !== null && timeLeft < 300
    const timeDanger  = timeLeft !== null && timeLeft < 60

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
                <div className="ip-instructions-banner">
                    {section.instructions}
                </div>
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
                <div className={[
                    'ip-paper',
                    isReading   ? 'reading-layout'   : '',
                    isWriting   ? 'writing-layout'   : '',
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
                            {section?.passageContent ? (
                                <div className="ip-listening-split">
                                    <div className="ip-listening-left">
                                        {section?.instructions && (
                                            <p className="ip-listening-instr-label">{section.instructions}</p>
                                        )}
                                        <div
                                            ref={passageRef}
                                            className="ip-context-box ip-highlightable"
                                            onMouseUp={handlePassageMouseUp}
                                            onClick={handlePassageClick}
                                        >
                                            {renderHighlightedText(section.passageContent, currentHighlights)}
                                        </div>
                                        {currentHighlights.length > 0 && (
                                            <button
                                                className="ip-hl-clear-btn ip-hl-clear-btn--block"
                                                onClick={() => setSectionHighlights(prev => ({ ...prev, [highlightKey]: [] }))}
                                            >
                                                🗑 Clear highlights ({currentHighlights.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="ip-listening-right">
                                        {renderQuestions()}
                                    </div>
                                </div>
                            ) : (
                                <div className="ip-listening-full">
                                    {/* Instructions as highlightable text — student can mark key words */}
                                    {section?.instructions && (
                                        <div
                                            ref={passageRef}
                                            className="ip-listening-instr-hl ip-highlightable"
                                            onMouseUp={handlePassageMouseUp}
                                            onClick={handlePassageClick}
                                        >
                                            {renderHighlightedText(section.instructions, currentHighlights)}
                                        </div>
                                    )}
                                    {currentHighlights.length > 0 && (
                                        <button
                                            className="ip-hl-clear-btn ip-hl-clear-btn--block"
                                            onClick={() => setSectionHighlights(prev => ({ ...prev, [highlightKey]: [] }))}
                                        >
                                            🗑 Clear highlights ({currentHighlights.length})
                                        </button>
                                    )}
                                    {renderQuestions()}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── READING ── */}
                    {isReading && (
                        <div className="ip-reading-split">
                            <div className="ip-passage-col">
                                <div className="ip-passage-title-row">
                                    <h2 className="ip-passage-title">{section?.title}</h2>
                                    {currentHighlights.length > 0 && (
                                        <button
                                            className="ip-hl-clear-btn"
                                            onClick={() => setSectionHighlights(prev => ({ ...prev, [highlightKey]: [] }))}
                                        >
                                            🗑 Clear ({currentHighlights.length})
                                        </button>
                                    )}
                                </div>
                                <div
                                    ref={passageRef}
                                    className="ip-passage-text"
                                    onCopy={e => e.preventDefault()}
                                    onContextMenu={e => e.preventDefault()}
                                    onMouseUp={handlePassageMouseUp}
                                    onClick={handlePassageClick}
                                >
                                    {renderHighlightedText(
                                        section?.passageContent || 'Passage content not available.',
                                        currentHighlights
                                    )}
                                </div>
                            </div>
                            <div className="ip-questions-col">
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
                        />
                    )}

                    {/* ── WRITING ── */}
                    {isWriting && (
                        <div className="ip-writing-split">
                            <div className="ip-task-col">
                                <h2 className="ip-task-heading">{section?.title}</h2>
                                <p className="ip-task-instructions">
                                    {section?.instructions ||
                                        (sectionIdx === 0
                                            ? 'Task 1: You should spend about 20 minutes on this task. Write at least 150 words.'
                                            : 'Task 2: You should spend about 40 minutes on this task. Write at least 250 words.')}
                                </p>
                                {section?.media?.filter(m => m.type === 'image').map((img, i) => (
                                    <img key={i} src={img.url} alt="Task visual" className="ip-task-image" />
                                ))}
                                <div
                                    ref={passageRef}
                                    className="ip-task-prompt ip-highlightable"
                                    onMouseUp={handlePassageMouseUp}
                                    onClick={handlePassageClick}
                                >
                                    {renderHighlightedText(section?.passageContent || 'No task description provided.', currentHighlights)}
                                </div>
                                {currentHighlights.length > 0 && (
                                    <button
                                        className="ip-hl-clear-btn ip-hl-clear-btn--block"
                                        onClick={() => setSectionHighlights(prev => ({ ...prev, [highlightKey]: [] }))}
                                    >
                                        🗑 Clear highlights ({currentHighlights.length})
                                    </button>
                                )}
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
                                const isActive   = activeQuestion === n
                                return (
                                    <div
                                        key={dotKey}
                                        className={[
                                            'ip-q-dot',
                                            isFlaggedQ ? 'flagged'  : '',
                                            isAnswered ? 'answered' : '',
                                            isActive   ? 'active'   : '',
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
                        <span className="ip-legend-item"><span className="ip-legend-sq active"   />Active</span>
                        <span className="ip-legend-item"><span className="ip-legend-sq flagged"  />Flagged</span>
                        <span className="ip-legend-item"><span className="ip-legend-sq empty"    />Unanswered</span>
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
                    className="ip-selection-popup"
                    style={{ left: selectionPopup.x, top: selectionPopup.y }}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                >
                    <span className="ip-hl-popup-label">Highlight</span>
                    <div className="ip-hl-popup-divider" />
                    {['yellow', 'green', 'blue', 'pink'].map(c => (
                        <button
                            key={c}
                            className={`ip-hl-dot ip-hl-dot--${c}`}
                            onClick={() => applyHighlight(c)}
                            title={c}
                        />
                    ))}
                    <div className="ip-hl-popup-divider" />
                    <button
                        className="ip-selection-popup-btn ip-selection-popup-btn--close"
                        onClick={() => setSelectionPopup(p => ({ ...p, visible: false }))}
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

// ── Speaking Recorder component ───────────────────────────────────────────────
function SpeakingRecorder({
    sectionIdx,
    speakingRecording, setSpeakingRecording,
    speakingAudios, setSpeakingAudios,
    speakingDurations, setSpeakingDurations,
    speakingPlayIdx, setSpeakingPlayIdx,
    speakingRecorderRef, speakingChunksRef, speakingPlaybackRef,
    onUploaded,
}) {
    const [elapsed, setElapsed]     = useState(0)
    const [micError, setMicError]   = useState('')
    const [uploading, setUploading] = useState(false)
    const timerRef    = useRef(null)
    const elapsedRef  = useRef(0)  // always current, readable inside onstop closure

    const blobUrl  = speakingAudios[sectionIdx]
    const duration = speakingDurations[sectionIdx] || 0
    const isPlaying = speakingPlayIdx === sectionIdx

    const fmt = (s) => {
        const m = Math.floor(s / 60), sec = s % 60
        return `${m}:${String(sec).padStart(2, '0')}`
    }

    const startRecording = async () => {
        setMicError('')
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            speakingChunksRef.current = []
            const mr = new MediaRecorder(stream)
            speakingRecorderRef.current = mr

            mr.ondataavailable = e => speakingChunksRef.current.push(e.data)
            mr.onstop = async () => {
                const blob = new Blob(speakingChunksRef.current, { type: 'audio/webm' })
                const localUrl = URL.createObjectURL(blob)
                if (speakingAudios[sectionIdx]) URL.revokeObjectURL(speakingAudios[sectionIdx])
                setSpeakingAudios(p => ({ ...p, [sectionIdx]: localUrl }))
                setSpeakingDurations(p => ({ ...p, [sectionIdx]: elapsedRef.current }))
                stream.getTracks().forEach(t => t.stop())

                // Upload to server so it persists with the submission
                setUploading(true)
                try {
                    const fd = new FormData()
                    fd.append('audio', new File([blob], `speaking_part${sectionIdx}.webm`, { type: 'audio/webm' }))
                    const res  = await fetch(`${BASE}/speaking/upload`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                        body: fd,
                    })
                    const data = await res.json()
                    if (data.url) onUploaded?.(data.url)
                } catch {
                    // upload failed — recording still available locally
                } finally {
                    setUploading(false)
                }
            }

            mr.start()
            setSpeakingRecording(true)
            elapsedRef.current = 0
            setElapsed(0)
            timerRef.current = setInterval(() => {
                elapsedRef.current += 1
                setElapsed(p => p + 1)
            }, 1000)
        } catch {
            setMicError('Microphone access denied. Please allow microphone and try again.')
        }
    }

    const stopRecording = () => {
        speakingRecorderRef.current?.stop()
        setSpeakingRecording(false)
        clearInterval(timerRef.current)
    }

    const togglePlay = () => {
        if (!speakingPlaybackRef.current) return
        if (isPlaying) {
            speakingPlaybackRef.current.pause()
            setSpeakingPlayIdx(null)
        } else {
            speakingPlaybackRef.current.play()
            setSpeakingPlayIdx(sectionIdx)
        }
    }

    const deleteRecording = () => {
        if (isPlaying) {
            speakingPlaybackRef.current?.pause()
            setSpeakingPlayIdx(null)
        }
        if (speakingAudios[sectionIdx]) URL.revokeObjectURL(speakingAudios[sectionIdx])
        setSpeakingAudios(p => { const n = { ...p }; delete n[sectionIdx]; return n })
        setSpeakingDurations(p => { const n = { ...p }; delete n[sectionIdx]; return n })
    }

    useEffect(() => () => clearInterval(timerRef.current), [])

    return (
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {micError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626' }}>
                    {micError}
                </div>
            )}

            {/* Mic card */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

                {/* Animated mic icon */}
                <div style={{ position: 'relative', width: 72, height: 72 }}>
                    {speakingRecording && (
                        <span style={{
                            position: 'absolute', inset: -8,
                            borderRadius: '50%', border: '3px solid #dc2626',
                            animation: 'sp-pulse 1s ease-in-out infinite',
                        }} />
                    )}
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: speakingRecording ? '#dc2626' : blobUrl ? '#059669' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 30, transition: 'background 0.3s',
                    }}>
                        🎤
                    </div>
                </div>

                {/* Timer / status */}
                <div style={{ textAlign: 'center' }}>
                    {speakingRecording ? (
                        <>
                            <div style={{ fontSize: 30, fontWeight: 800, color: '#dc2626', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
                                {fmt(elapsed)}
                            </div>
                            <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>
                                ● RECORDING
                            </div>
                        </>
                    ) : blobUrl ? (
                        <>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                                {uploading ? 'Uploading…' : 'Recording saved ✓'}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {uploading ? 'Saving to server…' : `${fmt(duration)} recorded`}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Ready to record</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Press the button below to start</div>
                        </>
                    )}
                </div>

                {/* Record / Stop */}
                {!speakingRecording ? (
                    <button
                        onClick={startRecording}
                        style={{
                            background: '#dc2626', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '11px 32px', fontSize: 14,
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        {blobUrl ? '🔴 Re-record' : '🔴 Start Recording'}
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        style={{
                            background: '#1e293b', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '11px 32px', fontSize: 14,
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        ⏹ Stop Recording
                    </button>
                )}
            </div>

            {/* Playback bar */}
            {blobUrl && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <audio
                        ref={speakingPlaybackRef}
                        src={blobUrl}
                        onEnded={() => setSpeakingPlayIdx(null)}
                    />
                    <button
                        onClick={togglePlay}
                        style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: '#059669', color: '#fff', border: 'none',
                            fontSize: 16, cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Your recording</div>
                        <div style={{ fontSize: 12, color: '#15803d' }}>{fmt(duration)}</div>
                    </div>
                    <button
                        onClick={deleteRecording}
                        style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}
                    >
                        🗑 Delete
                    </button>
                </div>
            )}

            <style>{`
                @keyframes sp-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50%       { transform: scale(1.18); opacity: 0.2; }
                }
            `}</style>
        </div>
    )
}
