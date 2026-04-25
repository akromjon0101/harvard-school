import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function norm(v) {
    if (v == null || v === '') return null
    if (Array.isArray(v)) return v.map(x => String(x).trim().toLowerCase()).filter(Boolean).sort().join(', ')
    return String(v).trim()
}

function checkCorrect(student, rawCorrect) {
    if (student == null || student === '') return false;
    if (rawCorrect == null || rawCorrect === '') return false;
    
    const s = student.trim().toLowerCase();
    // Split by | or , to allow multiple correct variants
    const accepted = String(rawCorrect)
        .split(/[|,]/)
        .map(x => x.trim().toLowerCase())
        .filter(Boolean);
    
    return accepted.some(a => a === s);
}

/** Given a question block and the answers object, return an array of
 *  { number, label, studentAnswer, correctAnswer, isCorrect } rows */
function getRows(q, answers) {
    const start = q.startNumber ?? q.questionNumber ?? 1

    // Gap-fill, summary-completion, summary-phrase-bank
    if (['gap-fill', 'summary-completion', 'summary-phrase-bank'].includes(q.type)) {
        const gapCount = (q.questionText?.match(/\[gap\]/gi) || []).length || 1
        return Array.from({ length: gapCount }, (_, i) => {
            const num = start + i
            const student = norm(answers[num])
            const correct = (q.correctAnswers || [])[i] ?? q.correctAnswer ?? ''
            const isCorrect = checkCorrect(student, correct)
            return { number: num, label: `Q${num}`, student: student ?? '—', correct: correct || '—', isCorrect }
        })
    }

    // Table completion
    if (q.type === 'table-completion') {
        const rows = q.tableData?.rows || []
        let gapCount = rows.reduce((acc, row) =>
            acc + (Array.isArray(row) ? row.reduce((a, c) => a + ((c || '').match(/\[gap\]/gi) || []).length, 0) : 0), 0)
        if (gapCount === 0) gapCount = 1
        return Array.from({ length: gapCount }, (_, i) => {
            const num = start + i
            const student = norm(answers[num])
            const correct = (q.correctAnswers || [])[i] ?? ''
            const isCorrect = checkCorrect(student, correct)
            return { number: num, label: `Q${num}`, student: student ?? '—', correct: correct || '—', isCorrect }
        })
    }

    // MCQ-multi (Choose TWO) — occupies 2 question numbers, show 1 row per answer slot
    if (q.type === 'mcq-multi') {
        const studentArr = Array.isArray(answers[start]) ? answers[start] : (answers[start] != null ? [answers[start]] : [])
        const correctArr = (q.correctAnswers || []).slice(0, 2)
        return [0, 1].map(i => {
            const studentVal = studentArr[i] != null ? String(studentArr[i]).toUpperCase() : '—'
            const correctVal = correctArr[i] != null ? String(correctArr[i]).toUpperCase() : '—'
            const isCorrect  = studentArr[i] != null &&
                correctArr.map(c => String(c).toUpperCase()).includes(String(studentArr[i]).toUpperCase())
            return { number: start + i, label: `Q${start + i}`, student: studentVal, correct: correctVal, isCorrect }
        })
    }

    // Matching / Map-labeling / Choose-from-box
    if (['matching', 'map-labeling', 'choose-from-box', 'matching-headings'].includes(q.type)) {
        const items = q.matchingItems || []
        const count = items.length || 1
        return Array.from({ length: count }, (_, i) => {
            const num = start + i
            const student = norm(answers[num])
            const correct = (q.correctAnswers || [])[i] ?? ''
            const isCorrect = checkCorrect(student, correct)
            return {
                number: num,
                label: `Q${num}`,
                student: student != null ? student.toUpperCase() : '—',
                correct: correct ? String(correct).toUpperCase() : '—',
                isCorrect
            }
        })
    }

    // TFNG / MCQ / Short answer — single answer
    const student = norm(answers[start])
    const correct = q.correctAnswer ?? (q.correctAnswers || [])[0] ?? ''
    const isCorrect = checkCorrect(student, correct)
    return [{ number: start, label: `Q${start}`, student: student ?? '—', correct: correct || '—', isCorrect }]
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

// Strip module namespace prefix: { listening_1: 'A' } → { 1: 'A' }
function extractModuleAnswers(allAnswers, module) {
    const prefix = `${module}_`
    const hasNamespaced = Object.keys(allAnswers).some(k => k.startsWith(prefix))
    if (!hasNamespaced) return allAnswers
    const result = {}
    Object.entries(allAnswers).forEach(([k, v]) => {
        if (k.startsWith(prefix)) result[Number(k.slice(prefix.length))] = v
    })
    return result
}

// ─── Module icon map ──────────────────────────────────────────────────────────
const MODULE_META = {
    listening: { icon: '🎧', label: 'Listening', color: '#4f46e5' },
    reading:   { icon: '📖', label: 'Reading',   color: '#0891b2' },
    writing:   { icon: '✍️', label: 'Writing',   color: '#059669' },
    speaking:  { icon: '🎤', label: 'Speaking',  color: '#7c3aed' },
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AnswerSheet() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [submission, setSubmission] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeModule, setActiveModule] = useState('listening')

    useEffect(() => {
        api(`/submissions/${id}`)
            .then(data => {
                setSubmission(data)
                // Default to first module that has sections
                const mods = data.exam?.modules || {}
                const first = ['listening', 'reading', 'writing', 'speaking'].find(m => (mods[m]?.length ?? 0) > 0)
                if (first) setActiveModule(first)
                setLoading(false)
            })
            .catch(() => {
                setError('Could not load the answer sheet. Please try again.')
                setLoading(false)
            })
    }, [id])

    if (loading) {
        return (
            <div className="as-wrapper">
                <div className="as-loading">
                    <div className="as-spinner" />
                    <p>Loading your answer sheet…</p>
                </div>
            </div>
        )
    }

    if (error || !submission) {
        return (
            <div className="as-wrapper">
                <div className="as-error">
                    <div className="as-error-icon">⚠️</div>
                    <p>{error || 'Submission not found.'}</p>
                    <button className="as-btn-back" onClick={() => navigate('/my-results')}>
                        ← Back to Results
                    </button>
                </div>
            </div>
        )
    }

    const exam = submission.exam || {}
    const modules = exam.modules || {}
    const answers = submission.answers || {}
    const band = submission.estimatedBand
    const scores = submission.moduleScores || {}
    const availableModules = ['listening', 'reading', 'writing', 'speaking'].filter(m => (modules[m]?.length ?? 0) > 0)

    const getBandColor = (b) => {
        if (!b) return '#94a3b8'
        if (b >= 7.5) return '#16a34a'
        if (b >= 6.0) return '#2563eb'
        if (b >= 5.0) return '#d97706'
        return '#dc2626'
    }

    return (
        <div className="as-wrapper">

            {/* ── Header ── */}
            <div className="as-header">
                <button className="as-btn-back" onClick={() => navigate('/my-results')}>
                    ← My Results
                </button>
                <div className="as-header-content">
                    <div className="as-header-text">
                        <h1 className="as-title">{exam.title || 'IELTS Mock Test'}</h1>
                        <p className="as-subtitle">
                            Submitted {new Date(submission.submittedAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    {band != null && (
                        <div className="as-band-badge" style={{ borderColor: getBandColor(band), color: getBandColor(band) }}>
                            <span className="as-band-label">Band</span>
                            <span className="as-band-num">{band.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Score pills */}
                <div className="as-score-pills">
                    {scores.listening?.total > 0 && (() => {
                        const lb = ieltsFromRaw(scores.listening.score, scores.listening.total)
                        return (
                            <div className="as-score-pill">
                                <span>🎧 Listening</span>
                                <strong>{scores.listening.score}/{scores.listening.total}</strong>
                                {lb != null && <span style={{ color: getBandColor(lb), fontWeight: 700, marginLeft: 4 }}>· Band {lb.toFixed(1)}</span>}
                            </div>
                        )
                    })()}
                    {scores.reading?.total > 0 && (() => {
                        const rb = ieltsFromRaw(scores.reading.score, scores.reading.total)
                        return (
                            <div className="as-score-pill">
                                <span>📖 Reading</span>
                                <strong>{scores.reading.score}/{scores.reading.total}</strong>
                                {rb != null && <span style={{ color: getBandColor(rb), fontWeight: 700, marginLeft: 4 }}>· Band {rb.toFixed(1)}</span>}
                            </div>
                        )
                    })()}
                    {scores.writing?.score > 0 && (
                        <div className="as-score-pill" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                            <span>✍️ Writing</span>
                            <strong style={{ color: '#059669' }}>Band {scores.writing.score.toFixed(1)}</strong>
                        </div>
                    )}
                    {scores.speaking?.score > 0 && (
                        <div className="as-score-pill" style={{ background: '#faf5ff', borderColor: '#c4b5fd' }}>
                            <span>🎤 Speaking</span>
                            <strong style={{ color: '#7c3aed' }}>Band {scores.speaking.score.toFixed(1)}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Module tabs ── */}
            {availableModules.length > 1 && (
                <div className="as-module-tabs">
                    {availableModules.map(mod => {
                        const meta = MODULE_META[mod]
                        return (
                            <button
                                key={mod}
                                className={`as-module-tab ${activeModule === mod ? 'active' : ''}`}
                                onClick={() => setActiveModule(mod)}
                                style={{ '--tab-color': meta.color }}
                            >
                                {meta.icon} {meta.label}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* ── Answer content ── */}
            <div className="as-content">
                {activeModule === 'writing' ? (
                    <WritingAnswers sections={modules.writing || []} answers={answers} aiGrading={submission.aiGrading} />
                ) : activeModule === 'speaking' ? (
                    <SpeakingAnswers sections={modules.speaking || []} answers={answers} aiGrading={submission.aiGrading} />
                ) : (
                    <ScoredAnswers
                        sections={modules[activeModule] || []}
                        answers={extractModuleAnswers(answers, activeModule)}
                        moduleKey={activeModule}
                        scores={scores[activeModule]}
                    />
                )}
            </div>

            {/* ── Examiner Feedback ── */}
            {submission.examinerFeedback && (
                <div className="as-feedback">
                    <h2 className="as-feedback-title">Examiner Feedback</h2>
                    <div className="as-feedback-grid">
                        {submission.examinerFeedback.strengths && (
                            <div className="as-feedback-card as-feedback-strength">
                                <div className="as-feedback-card-label">✅ Strengths</div>
                                <p>{submission.examinerFeedback.strengths}</p>
                            </div>
                        )}
                        {submission.examinerFeedback.weaknesses && (
                            <div className="as-feedback-card as-feedback-weakness">
                                <div className="as-feedback-card-label">⚠ Areas to Improve</div>
                                <p>{submission.examinerFeedback.weaknesses}</p>
                            </div>
                        )}
                        {submission.examinerFeedback.recommendation && (
                            <div className="as-feedback-card as-feedback-rec">
                                <div className="as-feedback-card-label">💡 Recommendation</div>
                                <p>{submission.examinerFeedback.recommendation}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Scored Q&A section (Listening / Reading) ─────────────────────────────────
function ScoredAnswers({ sections, answers, moduleKey, scores }) {
    if (!sections.length) {
        return <div className="as-empty">No questions recorded for this module.</div>
    }

    let totalCorrect = 0, totalQuestions = 0

    const allRows = sections.flatMap(section =>
        (section.questions || []).flatMap(q => getRows(q, answers))
    )
    allRows.forEach(r => {
        totalQuestions++
        if (r.isCorrect) totalCorrect++
    })

    return (
        <div className="as-scored">
            {/* Section summary bar */}
            <div className="as-module-summary">
                <div className="as-summary-score">
                    {totalCorrect} / {totalQuestions} correct
                </div>
                <div className="as-summary-bar-bg">
                    <div
                        className="as-summary-bar-fill"
                        style={{ width: `${totalQuestions ? (totalCorrect / totalQuestions) * 100 : 0}%` }}
                    />
                </div>
                <div className="as-summary-pct">
                    {totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
                </div>
            </div>

            {sections.map((section, si) => {
                const sectionRows = (section.questions || []).flatMap(q => getRows(q, answers))
                const secCorrect = sectionRows.filter(r => r.isCorrect).length
                return (
                    <div key={si} className="as-section">
                        <div className="as-section-header">
                            <span className="as-section-title">{section.title}</span>
                            {section.questionRange && (
                                <span className="as-section-range">Questions {section.questionRange}</span>
                            )}
                            <span className="as-section-score">
                                {secCorrect}/{sectionRows.length}
                            </span>
                        </div>

                        {section.instructions && (
                            <div className="as-section-instructions" dangerouslySetInnerHTML={{ __html: section.instructions }} />
                        )}

                        {(section.questions || []).map((q, qi) => {
                            const rows = getRows(q, answers)
                            return (
                                <QuestionBlock key={qi} q={q} rows={rows} />
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Writing answers ──────────────────────────────────────────────────────────
function WritingAnswers({ sections, answers, aiGrading }) {
    if (!sections.length) {
        return <div className="as-empty">No writing tasks in this exam.</div>
    }
    return (
        <div className="as-writing">
            {sections.map((section, si) => {
                const possibleKeys = [
                    `task${si + 1}`, `Task${si + 1}`,
                    `writing_${si}`, `writing${si + 1}`,
                    section.title?.toLowerCase().replace(/\s+/g, '_'),
                ]
                const writingText = possibleKeys.reduce((acc, k) => acc || answers[k], null)
                    || Object.values(answers).find(v => typeof v === 'string' && v.length > 100)

                const words = writingText ? writingText.trim().split(/\s+/).filter(Boolean).length : 0
                const minWords = si === 0 ? 150 : 250
                const taskAI = aiGrading?.writing?.[si]

                // Image from section media (Task 1 chart)
                const imageUrl = (section.media || []).find(m => m.type === 'image')?.url

                return (
                    <div key={si} className="as-writing-task">
                        <div className="as-writing-task-header">
                            <span className="as-writing-task-label">{section.title || `Task ${si + 1}`}</span>
                            {section.questionRange && (
                                <span className="as-section-range">{section.questionRange}</span>
                            )}
                            {taskAI?.status === 'done' && taskAI.band != null && (
                                <span className="as-ai-band-pill">AI Band {taskAI.band}</span>
                            )}
                        </div>

                        {section.passageContent && (
                            <div className="as-writing-prompt">
                                <div className="as-writing-prompt-label">Task Prompt</div>
                                <p>{section.passageContent}</p>
                            </div>
                        )}

                        {imageUrl && (
                            <div className="as-writing-chart">
                                <div className="as-writing-prompt-label">Chart / Diagram</div>
                                <img src={imageUrl} alt="Writing task chart" className="as-writing-chart-img" />
                            </div>
                        )}

                        <div className="as-writing-answer">
                            <div className="as-writing-answer-header">
                                <span className="as-writing-answer-label">Your Response</span>
                                <span className={`as-word-count ${words >= minWords ? 'sufficient' : 'short'}`}>
                                    {words} words {words < minWords ? `(minimum ${minWords})` : '✓'}
                                </span>
                            </div>
                            {writingText
                                ? <div className="as-writing-text">{writingText}</div>
                                : <div className="as-empty-writing">No response recorded for this task.</div>
                            }
                        </div>

                        <WritingAIFeedback taskAI={taskAI} taskIndex={si} />
                    </div>
                )
            })}
        </div>
    )
}

// ─── AI Feedback panel for a single writing task ──────────────────────────────
const CRITERIA_LABELS = {
    taskAchievement:   'Task Achievement',
    coherenceCohesion: 'Coherence & Cohesion',
    lexicalResource:   'Lexical Resource',
    grammaticalRange:  'Grammatical Range & Accuracy',
}

function bandColor(b) {
    if (!b) return '#94a3b8'
    if (b >= 7.5) return '#16a34a'
    if (b >= 6.5) return '#2563eb'
    if (b >= 5.5) return '#d97706'
    return '#dc2626'
}

function WritingAIFeedback({ taskAI, taskIndex }) {
    if (!taskAI) {
        return (
            <div className="as-ai-panel as-ai-pending">
                <span className="as-ai-icon">🤖</span>
                <span>AI analysis will appear here once grading is complete.</span>
            </div>
        )
    }

    if (taskAI.status === 'processing') {
        return (
            <div className="as-ai-panel as-ai-pending">
                <span className="as-ai-spinner" />
                <span>AI is analysing your Task {taskIndex + 1} response…</span>
            </div>
        )
    }

    if (taskAI.status === 'error') {
        return (
            <div className="as-ai-panel as-ai-error">
                <span className="as-ai-icon">⚠️</span>
                <span>AI grading failed: {taskAI.error || 'Unknown error'}</span>
            </div>
        )
    }

    if (taskAI.status !== 'done' || taskAI.band == null) return null

    return (
        <div className="as-ai-panel as-ai-done">
            <div className="as-ai-header">
                <span className="as-ai-icon">🤖</span>
                <span className="as-ai-title">AI IELTS Analysis — Task {taskIndex + 1}</span>
                <span className="as-ai-overall-band" style={{ color: bandColor(taskAI.band) }}>
                    Band {taskAI.band}
                </span>
            </div>

            {/* Question analysis + relevance */}
            {taskAI.questionAnalysis && (
                <div className="as-ai-analysis-box" style={{ borderColor: '#7c3aed' }}>
                    <div className="as-ai-analysis-label" style={{ color: '#7c3aed' }}>Question Analysis</div>
                    <p>{taskAI.questionAnalysis}</p>
                </div>
            )}
            {taskAI.relevanceCheck && (
                <div className="as-ai-analysis-box" style={{ borderColor: '#ca8a04', background: '#fefce8' }}>
                    <div className="as-ai-analysis-label" style={{ color: '#ca8a04' }}>Relevance Check</div>
                    <p>{taskAI.relevanceCheck}</p>
                </div>
            )}

            {/* 4 criteria grid */}
            {taskAI.criteria && (
                <div className="as-ai-criteria">
                    {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
                        const crit = taskAI.criteria[key]
                        if (!crit) return null
                        return (
                            <div key={key} className="as-ai-criterion">
                                <div className="as-ai-criterion-header">
                                    <span className="as-ai-criterion-label">{label}</span>
                                    <span className="as-ai-criterion-band" style={{ color: bandColor(crit.band) }}>
                                        {crit.band}
                                    </span>
                                </div>
                                {crit.comment && (
                                    <p className="as-ai-criterion-comment">{crit.comment}</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Strengths / Weaknesses / Advice */}
            {taskAI.strengths?.length > 0 && (
                <AIBulletList title="Strengths" items={taskAI.strengths} color="#16a34a" bg="#f0fdf4" />
            )}
            {taskAI.weaknesses?.length > 0 && (
                <AIBulletList title="Weaknesses" items={taskAI.weaknesses} color="#dc2626" bg="#fef2f2" />
            )}
            {taskAI.improvementAdvice?.length > 0 && (
                <AIBulletList title="Improvement Advice" items={taskAI.improvementAdvice} color="#2563eb" bg="#eff6ff" />
            )}

            {/* Overall feedback */}
            {taskAI.feedback && (
                <div className="as-ai-feedback-text">
                    <div className="as-ai-feedback-label">Overall Feedback</div>
                    <p>{taskAI.feedback}</p>
                </div>
            )}
        </div>
    )
}

// ─── Shared bullet list for AI fields ────────────────────────────────────────
function AIBulletList({ title, items, color, bg }) {
    return (
        <div className="as-ai-bullet-list" style={{ background: bg, borderColor: color + '40' }}>
            <div className="as-ai-bullet-title" style={{ color }}>{title}</div>
            <ul>
                {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    )
}

// ─── Speaking answers ─────────────────────────────────────────────────────────
const SPEAKING_CRITERIA_LABELS = {
    fluencyCoherence: 'Fluency & Coherence',
    lexicalResource:  'Lexical Resource',
    grammaticalRange: 'Grammatical Range & Accuracy',
    pronunciation:    'Pronunciation',
}

function SpeakingAnswers({ sections, answers, aiGrading }) {
    if (!sections.length) {
        return <div className="as-empty">No speaking sections in this exam.</div>
    }

    const speakingAI = aiGrading?.speaking
    const speakingTextAI = aiGrading?.speakingTexts || []
    const hasAI = speakingAI?.status === 'done' || speakingTextAI.some(s => s.status === 'done')

    return (
        <div className="as-writing">
            {/* Overall AI band if available */}
            {speakingAI?.status === 'done' && (
                <SpeakingAIFeedback data={speakingAI} label="Overall Speaking" />
            )}

            {sections.map((section, si) => {
                const textKey = `speaking_text_${si}`
                const textValue = answers[textKey] || ''
                const audioKey = `speaking_audio_${si}`
                const audioUrl = answers[audioKey] || ''

                // per-question audio keys: speaking_audio_0_q0, speaking_audio_0_q1...
                const perQAudios = Object.entries(answers)
                    .filter(([k]) => k.startsWith(`speaking_audio_${si}_q`))
                    .sort(([a], [b]) => a.localeCompare(b))

                const partTextAI = speakingTextAI[si]

                return (
                    <div key={si} className="as-writing-task">
                        <div className="as-writing-task-header">
                            <span className="as-writing-task-label">{section.title || `Part ${si + 1}`}</span>
                            {partTextAI?.status === 'done' && partTextAI.band != null && (
                                <span className="as-ai-band-pill">AI Band {partTextAI.band}</span>
                            )}
                        </div>

                        {/* Cue card / questions */}
                        {section.passageContent && (
                            <div className="as-writing-prompt">
                                <div className="as-writing-prompt-label">
                                    {section.title === 'Part 2' ? 'Cue Card' : 'Questions'}
                                </div>
                                <p style={{ whiteSpace: 'pre-line' }}>{section.passageContent}</p>
                            </div>
                        )}

                        {/* Per-question list (Part 1 / Part 3) */}
                        {section.questions?.length > 0 && (
                            <div className="as-speaking-qs">
                                {section.questions.map((q, qi) => {
                                    const qAudio = answers[`speaking_audio_${si}_q${qi}`]
                                    return (
                                        <div key={qi} className="as-speaking-q-row">
                                            <span className="as-speaking-q-num">Q{qi + 1}</span>
                                            <div className="as-speaking-q-body">
                                                <p className="as-speaking-q-text">{q.questionText}</p>
                                                {qAudio ? (
                                                    <audio controls src={qAudio} className="as-speaking-audio" />
                                                ) : (
                                                    <span className="as-speaking-no-audio">No recording</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Single part audio (Part 2) */}
                        {!section.questions?.length && audioUrl && (
                            <div className="as-writing-answer">
                                <div className="as-writing-answer-label">Your Recording</div>
                                <audio controls src={audioUrl} style={{ width: '100%', marginTop: '8px' }} />
                            </div>
                        )}

                        {/* Text answer (admin mode) */}
                        {textValue && (
                            <div className="as-writing-answer">
                                <div className="as-writing-answer-header">
                                    <span className="as-writing-answer-label">Your Written Response</span>
                                </div>
                                <div className="as-writing-text">{textValue}</div>
                            </div>
                        )}

                        {/* Per-part AI feedback */}
                        {partTextAI && <SpeakingAIFeedback data={partTextAI} label={`Part ${si + 1} AI Analysis`} />}
                    </div>
                )
            })}
        </div>
    )
}

function SpeakingAIFeedback({ data, label }) {
    if (!data || data.status !== 'done' || data.band == null) return null
    return (
        <div className="as-ai-panel as-ai-done" style={{ borderLeft: '4px solid #7c3aed' }}>
            <div className="as-ai-header">
                <span className="as-ai-icon">🤖</span>
                <span className="as-ai-title">{label}</span>
                <span className="as-ai-overall-band" style={{ color: bandColor(data.band) }}>
                    Band {data.band}
                </span>
            </div>

            {data.questionAnalysis && (
                <div className="as-ai-analysis-box" style={{ borderColor: '#7c3aed' }}>
                    <div className="as-ai-analysis-label" style={{ color: '#7c3aed' }}>Question Analysis</div>
                    <p>{data.questionAnalysis}</p>
                </div>
            )}
            {data.relevanceCheck && (
                <div className="as-ai-analysis-box" style={{ borderColor: '#ca8a04', background: '#fefce8' }}>
                    <div className="as-ai-analysis-label" style={{ color: '#ca8a04' }}>Relevance Check</div>
                    <p>{data.relevanceCheck}</p>
                </div>
            )}

            {data.criteria && (
                <div className="as-ai-criteria">
                    {Object.entries(SPEAKING_CRITERIA_LABELS).map(([key, label]) => {
                        const crit = data.criteria[key]
                        if (!crit) return null
                        return (
                            <div key={key} className="as-ai-criterion">
                                <div className="as-ai-criterion-header">
                                    <span className="as-ai-criterion-label">{label}</span>
                                    <span className="as-ai-criterion-band" style={{ color: bandColor(crit.band) }}>
                                        {crit.band}
                                    </span>
                                </div>
                                {crit.comment && <p className="as-ai-criterion-comment">{crit.comment}</p>}
                            </div>
                        )
                    })}
                </div>
            )}

            {data.strengths?.length > 0 && <AIBulletList title="Strengths" items={data.strengths} color="#16a34a" bg="#f0fdf4" />}
            {data.weaknesses?.length > 0 && <AIBulletList title="Weaknesses" items={data.weaknesses} color="#dc2626" bg="#fef2f2" />}
            {data.improvementAdvice?.length > 0 && <AIBulletList title="Improvement Advice" items={data.improvementAdvice} color="#2563eb" bg="#eff6ff" />}

            {data.feedback && (
                <div className="as-ai-feedback-text">
                    <div className="as-ai-feedback-label">Overall Feedback</div>
                    <p>{data.feedback}</p>
                </div>
            )}

            {data.transcript && (
                <details className="as-ai-transcript">
                    <summary>Show transcript</summary>
                    <div className="as-ai-transcript-body">{data.transcript}</div>
                </details>
            )}
        </div>
    )
}

// ─── Single question block ────────────────────────────────────────────────────
function QuestionBlock({ q, rows }) {
    const correctCount = rows.filter(r => r.isCorrect).length
    const allCorrect = correctCount === rows.length
    const allWrong = correctCount === 0

    return (
        <div className={`as-q-block ${allCorrect ? 'all-correct' : allWrong ? 'all-wrong' : 'partial'}`}>
            <div className="as-q-block-header">
                <span className="as-q-type-badge">{q.type?.replace(/-/g, ' ')}</span>
                {q.instructionText && (
                    <span className="as-q-instruction" dangerouslySetInnerHTML={{ __html: q.instructionText }} />
                )}
                <span className="as-q-score-badge">
                    {correctCount}/{rows.length}
                </span>
            </div>

            {q.questionText && q.type !== 'mcq' && q.type !== 'tfng' && (
                <div className="as-q-text">
                    {q.questionText.length > 200
                        ? q.questionText.substring(0, 200) + '…'
                        : q.questionText}
                </div>
            )}

            <div className="as-answer-rows">
                {rows.map((row, ri) => (
                    <div key={ri} className={`as-answer-row ${row.isCorrect ? 'correct' : 'wrong'}`}>
                        <span className="as-q-num">{row.label}</span>
                        <div className="as-answer-cells">
                            <div className="as-answer-cell student">
                                <span className="as-cell-label">Your answer</span>
                                <span className="as-cell-value">{row.student}</span>
                            </div>
                            <div className={`as-answer-cell correct-ans ${row.isCorrect ? '' : 'highlight'}`}>
                                <span className="as-cell-label">Correct answer</span>
                                <span className="as-cell-value">{row.correct}</span>
                            </div>
                            <div className={`as-verdict ${row.isCorrect ? 'pass' : 'fail'}`}>
                                {row.isCorrect ? '✓' : '✗'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
