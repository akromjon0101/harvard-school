/**
 * ExamPreviewModal
 * Full-screen admin preview + publish gateway.
 *
 * Layout fix: ip-header / ip-footer use position:fixed normally (for the real exam).
 * Inside this overlay we override them to position:sticky via .epv-exam-root CSS
 * so they stay inside the overlay container and don't escape to the viewport.
 *
 * Props:
 *   examData       { title, modules }
 *   onClose        () => void          — "Back to Editor"
 *   onPublish      (status) => void    — called with 'published' or 'draft'
 *   saving         boolean             — disables publish buttons while saving
 *   publishErrors  string[]            — validation errors from parent
 */
import { useState, useMemo, useRef, useCallback } from 'react'
import QuestionRenderer from '../exam/QuestionRenderer'
import '../../styles/ielts-paper.css'
import '../../styles/ielts-premium.css'

// ─── Issue Detection ─────────────────────────────────────────────────────────
function detectIssues(parts) {
  const issues = []
  parts.forEach(({ module, section }) => {
    const ctx = `${module === 'listening' ? '🎧' : module === 'reading' ? '📖' : '✍️'} ${section.title}`
    if (module !== 'writing' && (!section.questions || section.questions.length === 0)) {
      issues.push({ severity: 'warn', ctx, msg: 'No question blocks added' })
    }
    if (module === 'reading' && !section.passageContent?.trim()) {
      issues.push({ severity: 'warn', ctx, msg: 'Reading passage is empty' })
    }
    if (module === 'writing' && !section.passageContent?.trim()) {
      issues.push({ severity: 'info', ctx, msg: 'Writing task prompt is empty' })
    }
    ; (section.questions || []).forEach((q, qi) => {
      const qLabel = `Block ${qi + 1} (Q${q.startNumber ?? q.questionNumber})`
      if (q.type === 'mcq' && (q.options || []).filter(Boolean).length < 2) {
        issues.push({ severity: 'error', ctx, msg: `${qLabel}: MCQ has fewer than 2 options` })
      }
      if ((q.type === 'gap-fill' || q.type === 'summary-completion') && !q.questionText?.includes('[gap]')) {
        issues.push({ severity: 'error', ctx, msg: `${qLabel}: No [gap] markers in question text` })
      }
      if (q.type === 'table-completion' && !q.tableData?.rows?.length) {
        issues.push({ severity: 'error', ctx, msg: `${qLabel}: Table has no rows` })
      }
      if (q.type === 'matching' && (!q.matchingItems?.length || !q.options?.length)) {
        issues.push({ severity: 'warn', ctx, msg: `${qLabel}: Matching items or options list is empty` })
      }
      if (q.type === 'matching-headings' && (!q.options?.length || !q.matchingItems?.length)) {
        issues.push({ severity: 'warn', ctx, msg: `${qLabel}: Headings or paragraphs list is empty` })
      }
      const hasAns =
        (q.correctAnswers?.length > 0 && q.correctAnswers.some(Boolean)) ||
        (typeof q.correctAnswer === 'string' && q.correctAnswer.trim())
      if (!hasAns && module !== 'writing') {
        issues.push({ severity: 'warn', ctx, msg: `${qLabel}: No correct answers set` })
      }
    })
  })
  return issues
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPartLabel(module, sectionIdx) {
  if (module === 'reading') return `Passage ${sectionIdx + 1}`
  if (module === 'writing') return `Task ${sectionIdx + 1}`
  return `Part ${sectionIdx + 1}`
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const NOOP = () => { }

// ─── Issue Panel ──────────────────────────────────────────────────────────────
function IssuePanel({ issues }) {
  const errors = issues.filter(i => i.severity === 'error')
  const warns = issues.filter(i => i.severity === 'warn')
  const infos = issues.filter(i => i.severity === 'info')
  return (
    <div className="epv-issues-panel">
      {[
        { list: errors, label: `✖ ${errors.length} Error${errors.length !== 1 ? 's' : ''}`, mod: 'error' },
        { list: warns, label: `⚠ ${warns.length} Warning${warns.length !== 1 ? 's' : ''}`, mod: 'warn' },
        { list: infos, label: null, mod: 'info' },
      ].map(({ list, label, mod }) =>
        list.length === 0 ? null : (
          <div key={mod} className="epv-issue-group">
            {label && <span className={`epv-issue-group-label epv-issue-group-label--${mod}`}>{label}</span>}
            {list.map((iss, i) => (
              <div key={i} className={`epv-issue epv-issue--${mod}`}>
                <span className="epv-issue-ctx">{iss.ctx}</span>
                <span className="epv-issue-msg">{iss.msg}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ─── Writing placeholder ──────────────────────────────────────────────────────
function WritingPlaceholder({ sectionIdx }) {
  const min = sectionIdx === 0 ? 150 : 250
  return (
    <div className="ip-answer-col">
      <div
        className="ip-writing-textarea"
        style={{
          background: '#f8fafc', color: '#94a3b8', display: 'flex',
          alignItems: 'flex-start', padding: '14px', fontFamily: 'Georgia, serif',
          fontSize: '14px', lineHeight: '1.7', userSelect: 'none'
        }}
      >
        Students will write their {sectionIdx === 0 ? 'Task 1 report' : 'Task 2 essay'} here
        (minimum {min} words)…
      </div>
      <div className="ip-wc-bar-wrap">
        <div className="ip-wc-bar-fill" style={{ width: '0%', background: '#dc2626' }} />
      </div>
      <div className="ip-wc-info" style={{ color: '#94a3b8' }}>
        <span className="ip-wc-num wc-low">0 words</span>
        <span>{min} more words needed</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExamPreviewModal({
  examData,
  onClose,
  onPublish,
  saving = false,
  publishErrors = [],
}) {
  const [partIndex, setPartIndex] = useState(0)
  const [showIssues, setShowIssues] = useState(true)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const audioRef = useRef(null)

  // ── Flat parts list (same logic as IELTSExamPage) ──
  const parts = useMemo(() => {
    if (!examData?.modules) return []
    const result = []
      ;['listening', 'reading', 'writing'].forEach(mod => {
        const moduleData = examData.modules[mod]
        if (!Array.isArray(moduleData) || moduleData.length === 0) return
        moduleData.forEach((section, idx) => result.push({ module: mod, sectionIdx: idx, section }))
      })
    return result
  }, [examData])

  // ── Question number index ──
  const { allQNums, qPartMap } = useMemo(() => {
    const nums = [], map = {}
    parts.forEach((part, pIdx) => {
      ; (part.section.questions || []).forEach(q => {
        if (!q) return
        const gaps = (q.questionText?.match(/\[gap\]/gi) || []).length
        const mLen = (q.matchingItems || []).length
        const tGaps = q.type === 'table-completion' && q.tableData?.rows
          ? q.tableData.rows.reduce((a, row) => a + row.reduce((b, c) => b + ((c || '').match(/\[gap\]/gi) || []).length, 0), 0)
          : 0
        const total = Math.max(gaps, mLen, tGaps, q.correctAnswers?.length || 0, 1)
        const start = q.startNumber ?? q.questionNumber
        if (typeof start === 'number') {
          for (let i = 0; i < total; i++) { nums.push(start + i); map[start + i] = pIdx }
        }
      })
    })
    nums.sort((a, b) => a - b)
    return { allQNums: nums, qPartMap: map }
  }, [parts])

  const issues = useMemo(() => detectIssues(parts), [parts])
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warnCount = issues.filter(i => i.severity === 'warn').length
  const hasErrors = publishErrors.length > 0
  const panelVisible = showIssues && (issues.length > 0 || hasErrors)

  const goToPart = useCallback((idx) => {
    setPartIndex(idx)
    setIsAudioPlaying(false)
    setAudioProgress(0)
    setAudioDuration(0)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
  }, [])

  // ── Empty state ──
  if (parts.length === 0) {
    return (
      <div className="epv-overlay">
        <div className="epv-banner">
          <div className="epv-banner-left">
            <span className="epv-badge">👁 PREVIEW</span>
            <span className="epv-banner-hint">No content yet</span>
          </div>
          <div className="epv-banner-right">
            <button className="epv-close-btn" onClick={onClose} disabled={saving}>← Back to Editor</button>
            {onPublish && (
              <>
                <button className="epv-btn-draft" onClick={() => onPublish('draft')} disabled={saving}>
                  {saving ? '…' : '💾 Save Draft'}
                </button>
                <button className="epv-btn-publish" onClick={() => onPublish('published')} disabled={saving}>
                  {saving ? 'Publishing…' : '🚀 Publish Test'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="epv-empty">
          <div className="epv-empty-icon">📋</div>
          <p className="epv-empty-title">Nothing to preview yet</p>
          <p className="epv-empty-sub">Add questions in Step 2, then come back to preview.</p>
          <button className="epv-empty-btn" onClick={onClose}>Back to Editor</button>
        </div>
      </div>
    )
  }

  const part = parts[partIndex]
  const { module, sectionIdx, section } = part
  const partLabel = getPartLabel(module, sectionIdx)
  const currentAudio = section?.media?.find(m => m.type === 'audio')
  const isReading = module === 'reading'
  const isWriting = module === 'writing'
  const isListening = module === 'listening'

  const handleAudioToggle = () => {
    if (!audioRef.current || !currentAudio) return
    if (isAudioPlaying) { audioRef.current.pause(); setIsAudioPlaying(false) }
    else { audioRef.current.play().catch(console.error); setIsAudioPlaying(true) }
  }

  return (
    <div className="epv-overlay">

      {/* ── Banner ── */}
      <div className="epv-banner">
        <div className="epv-banner-left">
          <span className="epv-badge">👁 ADMIN PREVIEW</span>
          <span className="epv-banner-hint">Student view — inputs disabled</span>
        </div>

        <div className="epv-banner-right">
          {/* Issue toggle */}
          {issues.length > 0 && (
            <button
              className={`epv-issues-btn${panelVisible ? ' active' : ''}`}
              onClick={() => setShowIssues(v => !v)}
            >
              {errorCount > 0 && <span className="epv-count-chip epv-count-chip--error">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
              {warnCount > 0 && <span className="epv-count-chip epv-count-chip--warn">{warnCount} warning{warnCount !== 1 ? 's' : ''}</span>}
              {panelVisible ? '▲ Hide' : '▼ Show'}
            </button>
          )}
          {issues.length === 0 && !hasErrors && (
            <span className="epv-all-ok">✓ No issues</span>
          )}

          {/* Back button */}
          <button className="epv-close-btn" onClick={onClose} disabled={saving}>
            ← Back to Editor
          </button>

          {/* Publish actions */}
          {onPublish && (
            <>
              <button
                className="epv-btn-draft"
                onClick={() => onPublish('draft')}
                disabled={saving}
              >
                {saving ? '…' : '💾 Save Draft'}
              </button>
              <button
                className="epv-btn-publish"
                onClick={() => onPublish('published')}
                disabled={saving}
              >
                {saving ? 'Publishing…' : '🚀 Publish Test'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Validation errors from parent ── */}
      {hasErrors && (
        <div className="epv-publish-errors">
          {publishErrors.map((e, i) => <span key={i}>⚠ {e}</span>)}
        </div>
      )}

      {/* ── Issues panel ── */}
      {panelVisible && issues.length > 0 && <IssuePanel issues={issues} />}

      {/* ── Exam shell ── */}
      {/* .epv-exam-root overrides ip-header/ip-footer to position:sticky
          so they stay inside this overlay instead of snapping to viewport */}
      <div className={`epv-exam-root${panelVisible ? ' epv-has-issues' : ''}`}>
        <div className="ip-root">

          {/* Header — sticky in preview context */}
          <header className="ip-header">
            <div className="ip-header-left">
              <div className="ip-header-exam-title">{examData.title || 'IELTS Mock Test'}</div>
              <div className="ip-header-org">Harvard School · Computer-Based IELTS</div>
            </div>
            <div className="ip-header-center">
              {module.toUpperCase()} — {partLabel}
              {section.title && section.title !== partLabel ? ` · ${section.title}` : ''}
            </div>
            <div className="ip-header-right">
              <div className="ip-timer epv-timer-preview">PREVIEW</div>
            </div>
          </header>

          {/* Instructions banner */}
          {section.instructions && !isWriting && (
            <div className="ip-instructions-banner">{section.instructions}</div>
          )}

          {/* Scrollable body */}
          <div className="ip-body">
            <div className={`ip-paper${isReading ? ' reading-layout' : ''}`}>

              {/* Part header */}
              <div className="ip-part-header">
                <div className="ip-part-label">{module.toUpperCase()}</div>
                <div className="ip-part-title">
                  {partLabel}
                  {section.title && section.title !== partLabel ? ` — ${section.title}` : ''}
                </div>
                {section.questionRange && (
                  <span className="ip-part-range-badge">Questions {section.questionRange}</span>
                )}
              </div>

              {/* ── LISTENING ── */}
              {isListening && (
                <div className="ip-listening-content">
                  {currentAudio && (
                    <audio
                      ref={audioRef}
                      src={currentAudio.url}
                      onTimeUpdate={() => {
                        if (!audioRef.current) return
                        const { currentTime, duration } = audioRef.current
                        setAudioProgress((currentTime / duration) * 100 || 0)
                      }}
                      onLoadedMetadata={() => {
                        if (audioRef.current) setAudioDuration(audioRef.current.duration)
                      }}
                      onEnded={() => setIsAudioPlaying(false)}
                    />
                  )}
                  <div className="ip-audio-strip">
                    <button
                      className="ip-audio-play-btn"
                      onClick={handleAudioToggle}
                      disabled={!currentAudio}
                      title={!currentAudio ? 'No audio uploaded' : isAudioPlaying ? 'Pause' : 'Play'}
                    >
                      {isAudioPlaying ? '⏸' : '▶'}
                    </button>
                    <div className="ip-audio-progress-wrap">
                      <div className="ip-audio-progress-fill" style={{ width: `${audioProgress}%` }} />
                    </div>
                    <span className="ip-audio-time">
                      {fmtTime(audioRef.current?.currentTime || 0)} / {fmtTime(audioDuration)}
                    </span>
                    {!currentAudio && (
                      <span className="epv-no-audio">No audio uploaded for this part</span>
                    )}
                  </div>
                  <p className="ip-audio-warning">
                    ⚠ This recording will play ONCE only. Ensure headphones are connected before playing.
                  </p>
                  {section.passageContent && (
                    <div className="ip-context-box">{section.passageContent}</div>
                  )}
                  <div style={{ pointerEvents: 'none' }}>
                    {(section.questions || []).length > 0
                      ? section.questions.map((q, i) => {
                        const prevQ = i > 0 ? section.questions[i - 1] : null;
                        const hideInst = prevQ && prevQ.instructionText && prevQ.instructionText === q.instructionText;
                        return (
                          <div key={i} className="ip-question-block">
                            <QuestionRenderer
                              type={q.type} data={q} value={{}} onChange={NOOP}
                              qNumber={q.startNumber ?? q.questionNumber}
                              hideInstruction={hideInst}
                            />
                          </div>
                        );
                      })
                      : <div className="ip-empty-section epv-empty-section">No questions added yet.</div>
                    }
                  </div>
                </div>
              )}

              {/* ── READING ── */}
              {isReading && (
                <div className="ip-reading-split">
                  <div className="ip-passage-col">
                    <h2 className="ip-passage-title">{section.title}</h2>
                    <div className="ip-passage-text">
                      {section.passageContent || (
                        <em className="epv-missing-content">
                          Reading passage not set — add it in Step 2.
                        </em>
                      )}
                    </div>
                  </div>
                  <div className="ip-questions-col" style={{ pointerEvents: 'none' }}>
                    {(section.questions || []).length > 0
                      ? section.questions.map((q, i) => {
                        const prevQ = i > 0 ? section.questions[i - 1] : null;
                        const hideInst = prevQ && prevQ.instructionText && prevQ.instructionText === q.instructionText;
                        return (
                          <div key={i} className="ip-question-block">
                            <QuestionRenderer
                              type={q.type} data={q} value={{}} onChange={NOOP}
                              qNumber={q.startNumber ?? q.questionNumber}
                              hideInstruction={hideInst}
                            />
                          </div>
                        );
                      })
                      : <div className="ip-empty-section epv-empty-section">No questions added yet.</div>
                    }
                  </div>
                </div>
              )}

              {/* ── WRITING ── */}
              {isWriting && (
                <div className="ip-writing-split">
                  <div className="ip-task-col">
                    <h2 className="ip-task-heading">{section.title}</h2>
                    <p className="ip-task-instructions">
                      {section.instructions ||
                        (sectionIdx === 0
                          ? 'Task 1: You should spend about 20 minutes on this task. Write at least 150 words.'
                          : 'Task 2: You should spend about 40 minutes on this task. Write at least 250 words.')}
                    </p>
                    {section.media?.filter(m => m.type === 'image').map((img, i) => (
                      <img key={i} src={img.url} alt="Task visual" className="ip-task-image" />
                    ))}
                    <div className="ip-task-prompt">
                      {section.passageContent || (
                        <em className="epv-missing-content">No task prompt set yet.</em>
                      )}
                    </div>
                  </div>
                  <WritingPlaceholder sectionIdx={sectionIdx} />
                </div>
              )}

            </div>
          </div>

          {/* Footer — sticky in preview context, matches new two-row layout */}
          <footer className="ip-footer">
            <div className="ip-footer-grid-row">
              <button
                className="ip-nav-btn"
                onClick={() => goToPart(Math.max(0, partIndex - 1))}
                disabled={partIndex === 0}
              >❮</button>
              <div className="ip-q-grid">
                {allQNums.map(n => (
                  <div
                    key={n}
                    className={`ip-q-dot${qPartMap[n] === partIndex ? ' active' : ''}`}
                    onClick={() => goToPart(qPartMap[n] ?? partIndex)}
                    title={`Question ${n}`}
                  >{n}</div>
                ))}
              </div>
              <button
                className="ip-nav-btn"
                onClick={() => goToPart(Math.min(parts.length - 1, partIndex + 1))}
                disabled={partIndex === parts.length - 1}
              >❯</button>
            </div>
            <div className="ip-footer-controls-row">
              <div className="ip-legend">
                <span className="ip-legend-item"><span className="ip-legend-sq active" />Current part</span>
                <span className="ip-legend-item"><span className="ip-legend-sq empty" />Other part</span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>
                {parts.length} part{parts.length !== 1 ? 's' : ''} · {allQNums.length} Q total
              </span>
              <button
                className="ip-finish-btn"
                disabled
                style={{ opacity: 0.3, cursor: 'not-allowed' }}
                title="Submit is disabled in preview mode"
              >Finish Test</button>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
