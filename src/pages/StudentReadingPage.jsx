import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { wrapRangeTextNodes } from '../utils/safeHighlight'
import '../styles/student-exam.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (seconds) => {
  if (seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

const getToken = () => localStorage.getItem('token') || ''

// Part label for footer (IELTS standard: Part 1–4)
const partLabel = (idx) => `Part ${idx + 1}`

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StudentReadingPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // answers keyed by questionNumber (string key for safety)
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState([])

  // Active passage tab
  const [activePassage, setActivePassage] = useState(0)

  // Timer (starts only when exam starts)
  const [timeLeft, setTimeLeft] = useState(null)
  const timerRef = useRef(null)

  // Confirm-submit modal
  const [showConfirm, setShowConfirm] = useState(false)

  // Auto-save indicator
  const [saveLabel, setSaveLabel] = useState('')

  const passageRef = useRef(null)
  const splitContainerRef = useRef(null)
  const resizerDragging = useRef(false)
  const [leftPct, setLeftPct] = useState(50)  // split %
  const [resizerActive, setResizerActive] = useState(false)

  // ─── Load test ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`${API_BASE}/reading/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        if (!res.ok) throw new Error('Failed to load test')
        const data = await res.json()
        setTest(data)
        setTimeLeft((data.duration || 60) * 60)

        // Restore saved progress
        const saved = localStorage.getItem(`reading_${id}_progress`)
        if (saved) {
          const p = JSON.parse(saved)
          setAnswers(p.answers || {})
          setFlagged(p.flagged || [])
          if (p.timeLeft) setTimeLeft(p.timeLeft)
        }
      } catch (e) {
        console.error(e)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchTest()
  }, [id, navigate])

  // ─── Timer ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!started || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [started, submitted])  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-save every 30 s ───────────────────────────────────────────────

  useEffect(() => {
    if (!started || submitted) return
    const interval = setInterval(() => {
      localStorage.setItem(`reading_${id}_progress`, JSON.stringify({ answers, flagged, timeLeft }))
      setSaveLabel('Saved')
      setTimeout(() => setSaveLabel(''), 2000)
    }, 30000)
    return () => clearInterval(interval)
  }, [started, submitted, answers, flagged, timeLeft, id])

  // ─── Answer / flag ──────────────────────────────────────────────────────

  const handleAnswer = useCallback((questionNumber, value) => {
    setAnswers(prev => ({ ...prev, [String(questionNumber)]: value }))
  }, [])

  const toggleFlag = useCallback((questionNumber) => {
    setFlagged(prev =>
      prev.includes(questionNumber)
        ? prev.filter(n => n !== questionNumber)
        : [...prev, questionNumber]
    )
  }, [])

  // ─── Text highlighter ───────────────────────────────────────────────────

  const handleHighlight = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return
    const range = selection.getRangeAt(0)
    if (range.collapsed) return
    
    // Smooth popup or just direct highlight (direct yellow for simple fallback)
    const onRemove = (e) => {
        const parent = e.target.parentNode;
        while (e.target.firstChild) parent.insertBefore(e.target.firstChild, e.target);
        parent.removeChild(e.target);
    };

    wrapRangeTextNodes(range, 'highlight-yellow', '', onRemove);
    selection.removeAllRanges();
  }, [])

  // ─── Drag-to-resize split pane ───────────────────────────────────────────

  const handleResizerMouseDown = useCallback((e) => {
    e.preventDefault()
    resizerDragging.current = true
    setResizerActive(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (mv) => {
      if (!resizerDragging.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const pct = ((mv.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(75, Math.max(25, pct)))
    }

    const onUp = () => {
      resizerDragging.current = false
      setResizerActive(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])


  const handleSubmit = useCallback(async (forced = false) => {
    if (!forced) setShowConfirm(false)
    setSubmitted(true)
    clearInterval(timerRef.current)
    localStorage.removeItem(`reading_${id}_progress`)

    try {
      await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          examId: id,
          moduleType: 'reading',
          answers,
          timeSpent: ((test?.duration || 60) * 60) - (timeLeft || 0)
        })
      })
    } catch (e) {
      console.error('Submit failed:', e)
    }
  }, [id, answers, test, timeLeft])

  // ─── Derived data ────────────────────────────────────────────────────────

  const allQuestions = test ? (test.passages || []).flatMap(p =>
    (p.questionGroups || []).flatMap(g => g.questions || [])
      .concat(p.questions || [])
  ) : []

  const totalQ = allQuestions.length
  const answeredQ = allQuestions.filter(q => {
    const a = answers[String(q.questionNumber)]
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0)
  }).length

  // ─── Loading / Intro / Submitted screens ─────────────────────────────────

  if (loading) return <div className="exam-loading">Loading reading test…</div>

  if (submitted) {
    return (
      <div className="exam-submitted" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem' }}>✓</div>
        <h1>Test Submitted</h1>
        <p>Your answers have been recorded. You can review your results from the dashboard.</p>
        <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/my-results')}>
          View Results
        </button>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="exam-intro">
        <div className="intro-card">
          <h1>IELTS Reading Test</h1>
          <h2>{test?.testName}</h2>
          {test?.description && <p>{test.description}</p>}
          <div className="test-info" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '1.5rem 0' }}>
            <div><strong>{test?.duration || 60} min</strong><br /><small>Duration</small></div>
            <div><strong>{totalQ}</strong><br /><small>Questions</small></div>
            <div><strong>{(test?.passages || []).length}</strong><br /><small>Passages</small></div>
          </div>
          <ul style={{ textAlign: 'left', marginBottom: '1.5rem', lineHeight: 1.8 }}>
            <li>Read each passage carefully before answering.</li>
            <li>You can highlight text, flag questions, and navigate freely.</li>
            <li>Your progress is auto-saved every 30 seconds.</li>
            <li>The test submits automatically when time runs out.</li>
          </ul>
          <button className="btn-start" onClick={() => setStarted(true)}>Start Reading Test</button>
        </div>
      </div>
    )
  }

  const passage = test.passages?.[activePassage]

  // ─── Main exam UI ─────────────────────────────────────────────────────────

  return (
    <div className="ielts-reading-simulation">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="sim-header-dark">
        <div className="header-left">
          <span className="exam-mode">IELTS Reading — {test.testName}</span>
        </div>
        <div className="header-timer" style={{ color: timeLeft < 300 ? '#ef4444' : undefined }}>
          Time Remaining: <strong>{formatTime(timeLeft)}</strong>
          {saveLabel && <span style={{ marginLeft: '1rem', fontSize: '0.78em', opacity: 0.7 }}>💾 {saveLabel}</span>}
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85em' }}>{answeredQ}/{totalQ} answered</span>
          

          
          <button className="btn-help" onClick={() => setShowConfirm(true)}>Finish Test</button>
        </div>
      </header>

      {/* ── Passage Tabs — REMOVED (navigation via footer) ── */}

      {/* ── Split Screen ─────────────────────────────────────────────────── */}
      <main className="simulation-split" ref={splitContainerRef}>

        {/* LEFT: Passage ───────────────────────────────────────────────── */}
        <section
          className="passage-pane"
          onMouseUp={handleHighlight}
          ref={passageRef}
          style={{ userSelect: 'text', width: `${leftPct}%` }}
        >
          <div className="passage-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 className="passage-title">{passage?.title}</h2>
              <button
                title="Highlight selected text"
                style={{
                  fontSize: '0.75rem', padding: '3px 10px', cursor: 'pointer',
                  background: '#fffde7', border: '1px solid #f9a825', borderRadius: 3, whiteSpace: 'nowrap'
                }}
                onClick={handleHighlight}
              >
                ✏️ Highlight
              </button>
            </div>
            {passage?.content ? (
              <div
                className="passage-html-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passage.content) }}
              />
            ) : (
              <p className="muted">No content for this passage.</p>
            )}
          </div>
        </section>

        {/* RESIZER */}
        <div
          className={`split-resizer ${resizerActive ? 'dragging' : ''}`}
          onMouseDown={handleResizerMouseDown}
          title="Drag to resize"
        />

        {/* RIGHT: Questions ────────────────────────────────────────────── */}
        <section className="questions-pane" style={{ width: `${100 - leftPct}%` }}>
          {(passage?.questionGroups || []).map((group, gi) => (
            <QuestionGroup
              key={gi}
              group={group}
              answers={answers}
              flagged={flagged}
              onAnswer={handleAnswer}
              onFlag={toggleFlag}
            />
          ))}

          {/* Legacy flat questions (backwards compat) */}
          {(passage?.questions || []).length > 0 && (
            <div className="question-group-block">
              {(passage.questions).map(q => (
                <QuestionRow
                  key={q.questionNumber}
                  question={q}
                  answer={answers[String(q.questionNumber)]}
                  isFlagged={flagged.includes(q.questionNumber)}
                  onAnswer={handleAnswer}
                  onFlag={toggleFlag}
                />
              ))}
            </div>
          )}

          {!passage?.questionGroups?.length && !passage?.questions?.length && (
            <p className="muted" style={{ padding: '2rem' }}>No questions for this passage.</p>
          )}
        </section>
      </main>

      {/* ── Bottom navigation: Part 1 / 2 / 3 / 4 blocks ───────────────── */}
      <footer className="sim-footer-grid">
        {(test.passages || []).map((p, pIdx) => {
          const pQuestions = [
            ...(p.questionGroups || []).flatMap(g => g.questions || []),
            ...(p.questions || [])
          ]
          if (!pQuestions.length) return null
          return (
            <div key={pIdx} className="footer-part-block">
              <span
                className="footer-part-label"
                style={{ cursor: 'pointer', color: activePassage === pIdx ? '#1a56db' : undefined }}
                onClick={() => setActivePassage(pIdx)}
              >
                {partLabel(pIdx)}
              </span>
              <div className="footer-nums-row">
                {pQuestions.map(q => {
                  const n = q.questionNumber
                  const ans = answers[String(n)]
                  const isAnswered = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0)
                  const isFl = flagged.includes(n)
                  return (
                    <div
                      key={n}
                      title={`Q${n}${isFl ? ' (flagged)' : ''}${isAnswered ? ' — answered' : ''}`}
                      className={`nav-item ${isFl ? 'flagged' : isAnswered ? 'answered' : ''}`}
                      onClick={() => setActivePassage(pIdx)}
                    >
                      {n}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <button className="finish-btn" onClick={() => setShowConfirm(true)}>Submit ✓</button>
      </footer>

      {/* ── Confirm Submit Modal ─────────────────────────────────────────── */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Submit Test?</h3></div>
            <div className="modal-body">
              <p>You have answered <strong>{answeredQ}</strong> of <strong>{totalQ}</strong> questions.</p>
              {answeredQ < totalQ && (
                <p style={{ color: '#f59e0b' }}>
                  ⚠️ {totalQ - answeredQ} question{totalQ - answeredQ !== 1 ? 's' : ''} unanswered.
                </p>
              )}
              <p>Once submitted, you cannot change your answers.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowConfirm(false)}>Continue Test</button>
              <button className="btn-primary" onClick={() => handleSubmit(false)}>Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Question Group Block ─────────────────────────────────────────────────────

function QuestionGroup({ group, answers, flagged, onAnswer, onFlag }) {
  const isTFNG = group.groupType === 'true-false-not-given'
  const isYNNG = group.groupType === 'yes-no-not-given'
  const isSummary = group.groupType === 'summary-completion'
  const isHeadings = group.groupType === 'matching-headings'
  const isInfo = group.groupType === 'matching-information'

  return (
    <div className="question-group-block">
      {group.questionRange && (
        <p className="group-range-label">{group.questionRange}</p>
      )}
      {group.instructions && (
        <p className="group-instructions">{group.instructions}</p>
      )}

      {/* Heading / People bank */}
      {isHeadings && (group.headingsList || []).length > 0 && (
        <div className="heading-bank">
          <div className="heading-bank-title">List of Headings</div>
          {group.headingsList.map(h => (
            <div key={h.letter} className="heading-bank-item">
              <strong>{h.letter}.</strong> {h.text}
            </div>
          ))}
        </div>
      )}

      {/* Summary paragraph with inline inputs */}
      {isSummary && group.summaryText && (
        <SummaryCompletion
          group={group}
          answers={answers}
          onAnswer={onAnswer}
        />
      )}

      {/* Question rows */}
      {!(isSummary && group.summaryText) && group.questions.map(q => (
        <QuestionRow
          key={q.questionNumber}
          question={q}
          answer={answers[String(q.questionNumber)]}
          isFlagged={flagged.includes(q.questionNumber)}
          onAnswer={onAnswer}
          onFlag={onFlag}
          headingsList={isHeadings ? group.headingsList : undefined}
          isTFNG={isTFNG}
          isYNNG={isYNNG}
          isInfo={isInfo}
        />
      ))}
    </div>
  )
}

// ─── Summary Completion (inline blanks in paragraph) ─────────────────────────

function SummaryCompletion({ group, answers, onAnswer }) {
  const parts = (group.summaryText || '').split('___')
  const qs = group.questions || []

  return (
    <div style={{ lineHeight: 2.2, fontSize: '0.95em', marginBottom: '1rem' }}>
      {parts.map((part, i) => (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part.replace(/\n/g, '<br/>')) }} />
          {i < parts.length - 1 && qs[i] && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75em', color: '#6b7280', verticalAlign: 'super' }}>
                {qs[i].questionNumber}
              </span>
              <input
                type="text"
                value={answers[String(qs[i].questionNumber)] || ''}
                onChange={e => onAnswer(qs[i].questionNumber, e.target.value)}
                placeholder="answer"
                style={{
                  border: 'none', borderBottom: '2px solid #3b82f6',
                  outline: 'none', width: '120px', background: '#f0f9ff',
                  padding: '0.1rem 0.25rem', fontFamily: 'inherit', fontSize: '0.9em'
                }}
              />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

// ─── Single Question Row ──────────────────────────────────────────────────────

function QuestionRow({ question, answer, isFlagged, onAnswer, onFlag, headingsList, isTFNG, isYNNG, isInfo }) {
  const isAnswered = answer !== undefined && answer !== '' && !(Array.isArray(answer) && answer.length === 0)
  // Strip HTML tags from question text and preserve line breaks
  const stripHtml = (html) => {
    if (!html) return '';
    let text = html.replace(/<[^>]+>/g, '');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    return text;
  };

  return (
    <div className={`question-item ${isFlagged ? 'flagged-row' : ''}`}>
      {/* Sidebar: number box + flag */}
      <div className="q-sidebar">
        <div className={`q-number-box ${isAnswered ? 'answered' : ''}`}> 
          {question.questionNumber}
        </div>
        <button
          className="q-flag-btn"
          onClick={() => onFlag(question.questionNumber)}
          title={isFlagged ? 'Remove flag' : 'Flag for review'}
        >
          {isFlagged ? '🚩' : '⚑'}
        </button>
      </div>

      {/* Question content */}
      <div className="q-main">
        {question.questionText && (
          stripHtml(question.questionText).split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))
        )}
        <QuestionInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          headingsList={headingsList}
          isTFNG={isTFNG}
          isYNNG={isYNNG}
          isInfo={isInfo}
        />
      </div>
    </div>
  )
}

// ─── Question Input (renders appropriate input for each type) ─────────────────

function QuestionInput({ question, answer, onAnswer, headingsList, isTFNG, isYNNG, isInfo }) {
  const n = question.questionNumber
  const type = question.questionType

  // ── Multiple Choice ──────────────────────────────────────────────────────
  if (type === 'multiple-choice') {
    const multi = (question.numberOfAnswers || 1) > 1
    const curr = multi ? (Array.isArray(answer) ? answer : []) : (answer || '')

    return (
      <div className="mcq-options-list">
        {multi && (
          <p style={{ fontSize: '0.8em', color: '#555', marginBottom: '5px', fontStyle: 'italic' }}>
            Choose {question.numberOfAnswers} letters.
          </p>
        )}
        {(question.options || []).map((opt, i) => {
          const letter = String.fromCharCode(65 + i)
          const isSelected = multi ? curr.includes(letter) : curr === letter
          return (
            <label key={i} className={`mcq-option ${isSelected ? 'checked' : ''}`}>
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={`q${n}`}
                value={letter}
                checked={isSelected}
                onChange={() => {
                  if (multi) {
                    const next = isSelected ? curr.filter(v => v !== letter) : [...curr, letter]
                    onAnswer(n, next)
                  } else {
                    onAnswer(n, letter)
                  }
                }}
              />
              <span className="mcq-circle">{letter}</span>
              <span className="mcq-option-text">{opt}</span>
            </label>
          )
        })}
      </div>
    )
  }

  // ── TRUE / FALSE / NOT GIVEN ────────────────────────────────────────────
  if (type === 'true-false-not-given' || isTFNG) {
    return (
      <div className="tfng-options">
        {['TRUE', 'FALSE', 'NOT GIVEN'].map(o => (
          <button key={o} type="button"
            className={`tfng-btn ${answer === o ? 'selected' : ''}`}
            onClick={() => onAnswer(n, o)}
          >
            {o}
          </button>
        ))}
      </div>
    )
  }

  // ── YES / NO / NOT GIVEN ─────────────────────────────────────────────────
  if (type === 'yes-no-not-given' || isYNNG) {
    return (
      <div className="tfng-options">
        {['YES', 'NO', 'NOT GIVEN'].map(o => (
          <button key={o} type="button"
            className={`tfng-btn ${answer === o ? 'selected' : ''}`}
            onClick={() => onAnswer(n, o)}
          >
            {o}
          </button>
        ))}
      </div>
    )
  }

  // ── Matching Headings ────────────────────────────────────────────────────
  if (type === 'matching-headings' && headingsList) {
    return (
      <select
        className="q-select"
        value={answer || ''}
        onChange={e => onAnswer(n, e.target.value)}
      >
        <option value="">Select a heading…</option>
        {headingsList.map(h => (
          <option key={h.letter} value={h.letter}>{h.letter}. {h.text}</option>
        ))}
      </select>
    )
  }

  // ── Matching Information (paragraph letter) ──────────────────────────────
  if (type === 'matching-information' || isInfo) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    return (
      <select
        className="q-select"
        style={{ minWidth: 70 }}
        value={answer || ''}
        onChange={e => onAnswer(n, e.target.value)}
      >
        <option value="">—</option>
        {letters.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    )
  }

  // ── Matching (two columns) ───────────────────────────────────────────────
  if (type === 'matching') {
    const curr = answer || {}
    return (
      <div>
        {(question.items || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ minWidth: 160, fontSize: '0.88em', color: '#222' }}>{item}</span>
            <select
              className="q-select"
              value={curr[item] || ''}
              onChange={e => onAnswer(n, { ...curr, [item]: e.target.value })}
            >
              <option value="">Select…</option>
              {(question.matchOptions || []).map((opt, oi) => (
                <option key={oi} value={opt}>{String.fromCharCode(65 + oi)}. {opt}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }

  // ── Sentence / Note / Table / Short Answer / Fill-blank ──────────────────
  if (['sentence-completion', 'note-completion', 'table-completion',
    'short-answer', 'fill-blank', 'diagram-completion'].includes(type)) {
    return (
      <div>
        {question.maxWords && (
          <p style={{ fontSize: '0.8em', color: '#555', marginBottom: '4px', fontStyle: 'italic' }}>
            Write NO MORE THAN {question.maxWords} WORD{question.maxWords !== 1 ? 'S' : ''} AND/OR A NUMBER.
          </p>
        )}
        {question.imageUrl && (
          <img src={question.imageUrl} alt="Diagram" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, marginBottom: '8px', display: 'block' }} />
        )}
        <input
          type="text"
          className="cb-dotted-input"
          placeholder="Your answer"
          value={answer || ''}
          onChange={e => onAnswer(n, e.target.value)}
        />
      </div>
    )
  }

  // ── Summary completion (individual question fallback) ─────────────────────
  if (type === 'summary-completion') {
    return (
      <input
        type="text"
        placeholder="Your answer"
        value={answer || ''}
        onChange={e => onAnswer(n, e.target.value)}
        style={{ padding: '0.35rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, minWidth: 200 }}
      />
    )
  }

  return <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unknown question type: {type}</p>
}
