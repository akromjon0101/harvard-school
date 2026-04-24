/**
 * IELTS Test Creator — Redesigned Wizard
 * Guided, step-by-step interface for non-technical admins.
 * Step 1: Test info + module selection
 * Step 2: Section-by-section question builder
 *         → "Review & Publish" opens ExamPreviewModal (the publish gateway)
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, BASE_URL } from '../../services/api'
import '../../styles/test-creator.css'
import ExamPreviewModal from '../../components/admin/ExamPreviewModal'

import RichTextEditor from '../../components/admin/RichTextEditor'

// ─── Question type catalogue with IELTS examples ────────────────────────────
const QUESTION_TYPES = {
  listening: [
    {
      id: 'mcq',
      label: 'Multiple Choice',
      icon: '☑',
      color: '#4f46e5',
      desc: 'Students choose one correct answer (A, B, C or D)',
      example: 'Q: What is the main topic of the lecture?\n  A) Ocean pollution\n  B) Climate change\n  C) Solar energy\n  D) Wildlife protection\nAnswer: C',
    },
    {
      id: 'gap-fill',
      label: 'Form / Note Completion',
      icon: '📋',
      color: '#0891b2',
      desc: 'Students fill blanks in a form or notes. Use [gap] for each blank.',
      example: 'Patient name: [gap]\nDate of birth: [gap]\nReason for visit: [gap]\n\nAnswers: 1) Sarah Brown  2) 14 March  3) back pain',
    },
    {
      id: 'matching',
      label: 'Matching',
      icon: '↔',
      color: '#059669',
      desc: 'Students match items from two lists (e.g. speakers to opinions)',
      example: 'Match each person to their opinion:\n1. Anna   → B. Too expensive\n2. James  → A. Great location\n3. Mia    → C. Difficult to find',
    },
    {
      id: 'map-labeling',
      label: 'Map / Diagram Labelling',
      icon: '🗺',
      color: '#d97706',
      desc: 'Students write letters A–H to label positions on a map or diagram',
      example: 'Label the floor plan. Write the correct letter:\n12. Café       → E\n13. Reception  → B\n14. Car park   → G',
    },
    {
      id: 'tfng',
      label: 'Sentence Completion',
      icon: '✏',
      color: '#7c3aed',
      desc: 'Students complete sentences using words heard in the audio',
      example: 'The museum is open from [gap] to 6pm.\nEntry is [gap] for under-12s.\nAnswers: 9am / free',
    },
    {
      id: 'mcq-multi',
      label: 'Choose TWO (Multiple Choice)',
      icon: '☑☑',
      color: '#6366f1',
      desc: 'Students choose TWO correct answers from options A–E',
      example: 'Which TWO things did Colin find most satisfying?\nA) support from restaurants  B) preventing waste  C) 3-D printing\nCorrect: B and C',
    },
    {
      id: 'table-completion',
      label: 'Table / Form Completion',
      icon: '📋',
      color: '#0f766e',
      desc: 'Students fill blanks in a table. Enter column headers and rows; use [gap] for each blank.',
      example: 'Headers: Category | Detail | Notes\nRow 1: Location | [gap] | Northern district\nRow 2: Size | 400 m² | [gap]',
    },
    {
      id: 'summary-completion',
      label: 'Summary Completion',
      icon: '📝',
      color: '#6d28d9',
      desc: 'Students fill gaps in a summary paragraph. Use [gap] for each blank.',
      example: 'The factory produces [gap] tonnes of steel per year.\nIt employs around [gap] workers.\nAnswers: 2,000 / 450',
    },
    {
      id: 'choose-from-box',
      label: 'Choose from a Box',
      icon: '🗃',
      color: '#be185d',
      desc: 'Word bank + one select-per-item. Students choose letter A, B, C… for each statement.',
      example: 'Word bank: A) reduction  B) increase  C) stable\nItem 1: Carbon emissions → A\nItem 2: Sea temperatures → B',
    },
  ],
  reading: [
    {
      id: 'tfng',
      label: 'True / False / Not Given',
      icon: 'T/F',
      color: '#dc2626',
      desc: 'Students decide if each statement is TRUE, FALSE, or NOT GIVEN in the text',
      example: '"The company was founded in 1890." → TRUE\n"The CEO has a PhD."              → NOT GIVEN\n"Products are sold in 40 countries."→ FALSE',
    },
    {
      id: 'matching',
      label: 'Matching Headings',
      icon: '↔',
      color: '#059669',
      desc: 'Students match headings (i–x) to paragraphs, or statements to sections',
      example: 'Match each heading to the correct paragraph:\nParagraph A → iii. The role of technology\nParagraph B → vii. A brief history',
    },
    {
      id: 'mcq',
      label: 'Multiple Choice',
      icon: '☑',
      color: '#4f46e5',
      desc: 'Students choose the correct answer based on the reading passage',
      example: 'According to the text, migration increased mainly due to:\nA) Climate change\nB) Economic opportunity  ← correct\nC) Political conflict',
    },
    {
      id: 'gap-fill',
      label: 'Summary / Sentence Completion',
      icon: '📋',
      color: '#0891b2',
      desc: 'Students fill gaps in a summary using words from the passage. Use [gap].',
      example: 'The invention of the [gap] in 1876 changed communication.\nIt was developed by [gap] in the US.\nAnswers: telephone / Bell',
    },
    {
      id: 'short-answer',
      label: 'Short Answer Questions',
      icon: '💬',
      color: '#7c3aed',
      desc: 'Students write a short answer (max 3 words) from the passage',
      example: 'Q: What year did the expedition begin? → 1912\nQ: How many team members were there? → fourteen',
    },
    {
      id: 'table-completion',
      label: 'Table Completion',
      icon: '📋',
      color: '#0f766e',
      desc: 'Students fill gaps in a table using words from the passage.',
      example: 'Headers: Feature | Description\nRow 1: Location | [gap]\nRow 2: Founded | [gap]',
    },
    {
      id: 'summary-completion',
      label: 'Summary Completion',
      icon: '📝',
      color: '#6d28d9',
      desc: 'Students complete a summary paragraph. Use [gap] for each blank.',
      example: 'The author argues that [gap] is the main cause of poverty.\nThis was first identified in [gap].',
    },
    {
      id: 'summary-phrase-bank',
      label: 'Summary Completion (Phrase Bank A–J)',
      icon: '📝',
      color: '#5b21b6',
      desc: 'Complete the summary using the list of phrases A–J. One letter per blank.',
      example: 'Passage with blanks 31–36. Options A–J. Write the correct letter in each box.',
    },
    {
      id: 'matching-headings',
      label: 'Matching Headings',
      icon: '↔',
      color: '#0369a1',
      desc: 'Students match headings (i, ii, iii…) to paragraphs.',
      example: 'Headings list:\ni.  The role of technology\nii. A brief history\nParagraph A → iii\nParagraph B → i',
    },
    {
      id: 'choose-from-box',
      label: 'Choose from a Box',
      icon: '🗃',
      color: '#be185d',
      desc: 'Word bank + one select-per-item. Students choose letter A, B, C… for each statement.',
      example: 'Word bank: A) reduction  B) increase  C) stable\nItem 1: Carbon emissions → A\nItem 2: Sea temperatures → B',
    },
  ],
}

const DEFAULT_INSTRUCTIONS = {
  'gap-fill': 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
  'mcq': 'Choose the correct letter, A, B, C or D.',
  'mcq-multi': 'Choose TWO letters, A–E.',
  'matching': 'Write the correct letter, A–H, next to Questions 1–6.',
  'map-labeling': 'Label the map below. Write the correct letter, A–H, next to Questions 1–5.',
  'tfng': 'Write TRUE, FALSE or NOT GIVEN.',
  'short-answer': 'Answer the questions using NO MORE THAN THREE WORDS from the passage.',
  'table-completion': 'Complete the table below. Write ONE WORD ONLY for each answer.',
  'summary-completion': 'Complete the summary using words from the box.',
  'summary-phrase-bank': 'Complete the summary using the list of phrases, A–J, below. Write the correct letter, A–J, in boxes 31–36.',
  'matching-headings': 'The reading passage has several paragraphs. Choose the correct heading for each paragraph.',
  'choose-from-box': 'Choose SIX answers from the box and write the correct letter, A–H, next to Questions 11–16.',
}

const BASE = BASE_URL

function makeSection(title) {
  return { title, instructions: '', questionRange: '', passageContent: '', media: [], questions: [] }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TestCreator() {
  const navigate = useNavigate()
  const { id: examId } = useParams()   // defined when route is /admin/exams/:id/edit
  const isEditMode = Boolean(examId)

  // ── Step 1 state
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activeModules, setActiveModules] = useState(['listening', 'reading'])

  // ── Exam sections
  const [sections, setSections] = useState({
    listening: [makeSection('Part 1'), makeSection('Part 2'), makeSection('Part 3'), makeSection('Part 4')],
    reading: [makeSection('Passage 1'), makeSection('Passage 2'), makeSection('Passage 3')],
    writing: [makeSection('Task 1'), makeSection('Task 2')],
    speaking: [makeSection('Part 1'), makeSection('Part 2'), makeSection('Part 3')],
  })

  // ── Step 2 state
  const allSectionKeys = activeModules.flatMap(mod =>
    sections[mod].map((_, idx) => ({ mod, idx }))
  )
  const [sectionPos, setSectionPos] = useState(0)
  const [pickingType, setPickingType] = useState(false)
  const [draftQ, setDraftQ] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const [uploading, setUploading] = useState({})
  const [bulkMCQMode, setBulkMCQMode] = useState(false)

  // ── AI grading
  const [aiGradingEnabled, setAiGradingEnabled] = useState(false)

  // ── Publish/save state
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])
  const [saveError, setSaveError] = useState('')
  const [loadingExam, setLoadingExam] = useState(isEditMode)

  // ── Preview state
  const [showPreview, setShowPreview] = useState(false)

  // ── Load existing exam when in edit mode ────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return
    api(`/exams/${examId}`)
      .then(exam => {
        setTitle(exam.title || '')
        setDescription(exam.description || '')
        setAiGradingEnabled(!!exam.aiGradingEnabled)
        const mods = exam.modules || {}
        const detected = ['listening', 'reading', 'writing', 'speaking'].filter(m => Array.isArray(mods[m]) && mods[m].length > 0)
        setActiveModules(detected.length > 0 ? detected : ['listening', 'reading'])
        setSections(prev => ({
          listening: Array.isArray(mods.listening) && mods.listening.length > 0
            ? mods.listening
            : prev.listening,
          reading: Array.isArray(mods.reading) && mods.reading.length > 0
            ? mods.reading
            : prev.reading,
          writing: Array.isArray(mods.writing) && mods.writing.length > 0
            ? mods.writing
            : prev.writing,
          speaking: Array.isArray(mods.speaking) && mods.speaking.length > 0
            ? mods.speaking.map(sec =>
                (sec.title === 'Part 1' || sec.title === 'Part 3') && !sec.passageContent && sec.questions?.length > 0
                  ? { ...sec, passageContent: sec.questions.map(q => q.questionText).join('\n') }
                  : sec
              )
            : prev.speaking,
        }))
        setLoadingExam(false)
      })
      .catch(() => {
        setSaveError('Failed to load exam for editing.')
        setLoadingExam(false)
      })
  }, [examId, isEditMode])

  // Build the exam data object that ExamPreviewModal expects (same shape as exam.modules)
  const previewExamData = useMemo(() => ({
    title: title || 'Untitled Test',
    modules: {
      listening: activeModules.includes('listening') ? sections.listening : [],
      reading: activeModules.includes('reading') ? sections.reading : [],
      writing: activeModules.includes('writing') ? sections.writing : [],
      speaking: activeModules.includes('speaking') ? sections.speaking : [],
    },
  }), [title, sections, activeModules])

  const currentKey = allSectionKeys[sectionPos] || { mod: 'listening', idx: 0 }
  const currentSection = sections[currentKey.mod][currentKey.idx]

  // ── Helpers
  const updateCurrentSection = (field, value) => {
    setSections(prev => {
      const arr = [...prev[currentKey.mod]]
      arr[currentKey.idx] = { ...arr[currentKey.idx], [field]: value }
      return { ...prev, [currentKey.mod]: arr }
    })
  }

  // How many question slots does a single question block occupy?
  const getQCountFromQ = (q) => {
    const type = q.type
    if (type === 'tfng' || type === 'true-false-notgiven') {
      return Math.max(1, (q.questionText || '').split('\n').filter(l => l.trim()).length)
    }
    if (type === 'gap-fill' || type === 'summary-completion' || type === 'summary-phrase-bank') {
      return Math.max(1, (q.questionText?.match(/\[gap\]/gi) || []).length)
    }
    if (type === 'table-completion') {
      const tg = q.tableData?.rows
        ? q.tableData.rows.reduce((a, row) => a + (Array.isArray(row) ? row.reduce((b, c) => b + ((c || '').match(/\[gap\]/gi) || []).length, 0) : 0), 0)
        : 0
      return Math.max(1, tg)
    }
    if (type === 'matching' || type === 'map-labeling' || type === 'matching-headings' || type === 'choose-from-box') {
      return Math.max(1, (q.matchingItems || []).length)
    }
    if (type === 'mcq-multi' || type === 'checkbox') return 2
    return 1
  }

  // Compute the first question number for a given section index
  // by looking at how many slots previous sections already used.
  const getSectionStart = (sectionsArr, sectionIdx) => {
    let last = 0
    sectionsArr.forEach((sec, si) => {
      if (si >= sectionIdx) return
      sec.questions.forEach(q => {
        const s = q.startNumber || q.questionNumber || 1
        last = Math.max(last, s + getQCountFromQ(q) - 1)
      })
    })
    return last + 1
  }

  // Recalculate sequential startNumber/questionNumber starting from startFrom.
  const reindexQuestions = (questions, startFrom = 1) => {
    let nextNum = startFrom
    return questions.map(q => {
      const start = nextNum
      nextNum = start + getQCountFromQ(q)
      return { ...q, startNumber: start, questionNumber: start }
    })
  }

  const getNextStart = () => {
    // Scoped to the current module only so reading always starts from 1
    let last = 0
    const mod = currentKey.mod
    ;(sections[mod] || []).forEach(s => {
      s.questions.forEach(q => {
        const gaps = (q.questionText?.match(/\[gap\]/gi) || []).length
        const tableGaps = q.type === 'table-completion' && q.tableData?.rows
          ? q.tableData.rows.reduce((a, row) => a + (Array.isArray(row) ? row.reduce((b, c) => b + ((c || '').match(/\[gap\]/gi) || []).length, 0) : 0), 0)
          : 0
        const items = (q.matchingItems || []).length
        last = Math.max(last, (q.startNumber || 1) + Math.max(gaps || tableGaps, items, 1) - 1)
      })
    })
    return last + 1
  }

  const openTypePicker = () => {
    setPickingType(true)
    setDraftQ(null)
    setEditingIdx(null)
  }

  const selectType = (typeId) => {
    const next = getNextStart()
    const base = {
      type: typeId,
      questionNumber: next,
      instructionText: DEFAULT_INSTRUCTIONS[typeId] || '',
      questionText: '',
      options: typeId === 'mcq' ? ['', '', '', ''] : typeId === 'mcq-multi' ? ['', '', '', '', ''] : [],
      matchingItems: [],
      correctAnswer: '',
      correctAnswers: [],
      startNumber: next,
    }
    if (typeId === 'table-completion') base.tableData = { headers: ['', ''], rows: [['', '[gap]'], ['', '[gap]']] }
    if (typeId === 'summary-phrase-bank') base.options = ['', '', '', '', '', '', '', '', '', ''] // A-J
    setDraftQ(base)
  }

  const saveDraftQuestion = () => {
    if (!draftQ) return
    setSections(prev => {
      const arr = [...prev[currentKey.mod]]
      const qs = editingIdx !== null
        ? arr[currentKey.idx].questions.map((x, i) => i === editingIdx ? draftQ : x)
        : [...arr[currentKey.idx].questions, draftQ]
      arr[currentKey.idx] = { ...arr[currentKey.idx], questions: qs }
      return { ...prev, [currentKey.mod]: arr }
    })
    setDraftQ(null)
    setPickingType(false)
    setEditingIdx(null)
  }

  const saveAndRepeatQuestion = () => {
    if (!draftQ) return
    const repeatType = draftQ.type
    saveDraftQuestion()
    // Open a fresh form of the same type immediately
    setTimeout(() => selectType(repeatType), 0)
  }

  const cancelDraft = () => {
    setDraftQ(null)
    setPickingType(false)
    setEditingIdx(null)
    setBulkMCQMode(false)
  }

  // adminStart: explicit number from BulkMCQImport's customStart field (may be null)
  const addMultipleQuestions = (newQuestions, adminStart = null) => {
    setSections(prev => {
      const arr = [...prev[currentKey.mod]]
      const existing = arr[currentKey.idx].questions

      // Compute next number after existing questions in THIS section
      let lastUsed = getSectionStart(arr, currentKey.idx) - 1
      existing.forEach(q => {
        const s = q.startNumber || q.questionNumber || 1
        lastUsed = Math.max(lastUsed, s + getQCountFromQ(q) - 1)
      })
      // Admin override takes priority; otherwise continue from last used
      const startFrom = adminStart !== null ? adminStart : lastUsed + 1

      // Renumber only the incoming questions — do NOT touch existing ones
      const renumbered = reindexQuestions(newQuestions, startFrom)

      arr[currentKey.idx] = {
        ...arr[currentKey.idx],
        questions: [...existing, ...renumbered],
      }
      return { ...prev, [currentKey.mod]: arr }
    })
    setBulkMCQMode(false)
    setPickingType(false)
  }

  const removeQuestion = (qIdx) => {
    setSections(prev => {
      const arr = [...prev[currentKey.mod]]
      const startFrom = getSectionStart(arr, currentKey.idx)
      const filtered = arr[currentKey.idx].questions.filter((_, i) => i !== qIdx)
      arr[currentKey.idx] = {
        ...arr[currentKey.idx],
        questions: reindexQuestions(filtered, startFrom),
      }
      return { ...prev, [currentKey.mod]: arr }
    })
  }

  const duplicateQuestion = (qIdx) => {
    setSections(prev => {
      const arr = [...prev[currentKey.mod]]
      const qs = [...arr[currentKey.idx].questions]
      const clone = { ...qs[qIdx] }
      // Shift startNumber to avoid overlap
      const next = getNextStart()
      clone.startNumber = next
      clone.questionNumber = next
      qs.splice(qIdx + 1, 0, clone)
      arr[currentKey.idx] = { ...arr[currentKey.idx], questions: qs }
      return { ...prev, [currentKey.mod]: arr }
    })
  }

  const editQuestion = (qIdx) => {
    setDraftQ({ ...currentSection.questions[qIdx] })
    setEditingIdx(qIdx)
    setPickingType(true)
  }

  const uploadFile = async (file, key) => {
    setUploading(p => ({ ...p, [key]: true }))
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`${BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
      return data.url || null
    } catch (err) {
      alert(`Upload failed: ${err.message || 'Please try again.'}`)
      return null
    } finally {
      setUploading(p => ({ ...p, [key]: false }))
    }
  }

  const handleSectionAudio = async (e) => {
    const url = await uploadFile(e.target.files[0], 'audio')
    if (url) {
      const others = currentSection.media.filter(m => m.type !== 'audio')
      updateCurrentSection('media', [...others, { type: 'audio', url }])
    }
    e.target.value = ''
  }

  const handleSectionImage = async (e) => {
    const url = await uploadFile(e.target.files[0], 'image')
    if (url) {
      const others = currentSection.media.filter(m => m.type !== 'image')
      updateCurrentSection('media', [...others, { type: 'image', url }])
    }
    e.target.value = ''
  }

  const totalQuestions = activeModules.reduce((acc, mod) =>
    acc + sections[mod].reduce((a, s) =>
      a + s.questions.reduce((qa, q) => {
        const gaps = (q.questionText?.match(/\[gap\]/gi) || []).length
        const items = (q.matchingItems || []).length
        return qa + Math.max(gaps, items, 1)
      }, 0), 0), 0)

  const validate = () => {
    const errs = []
    if (!title.trim()) errs.push('Test title is required.')
    if (activeModules.length === 0) errs.push('Select at least one module.')
    return errs
  }

  // Ensure every question has questionNumber and type (required by backend schema)
  const normalizeQuestion = (q) => {
    const num = Number(q?.questionNumber ?? q?.startNumber ?? 1)
    return {
      ...q,
      questionNumber: Number.isFinite(num) ? num : 1,
      type: q?.type || 'gap-fill',
    }
  }

  const handleSave = async (saveStatus) => {
    const errs = validate()
    if (errs.length) { setErrors(errs); setSaveError(''); return }
    setErrors([])
    setSaveError('')
    setSaving(true)
    try {
      // Backend expects listening, reading, writing, speaking; send all (inactive = empty arrays)
      const normalizeSection = (sec) => ({
        ...sec,
        questions: (sec.questions || []).map(normalizeQuestion),
      })
      // Speaking Part 1 & Part 3: questions stored as newline-separated passageContent → convert to questions[]
      const normalizeSpeakingSection = (sec) => {
        if (sec.title === 'Part 1' || sec.title === 'Part 3') {
          const qs = (sec.passageContent || '').split('\n').filter(Boolean).map((text, i) => ({
            questionText: text,
            type: 'speaking',
            questionNumber: i + 1,
          }))
          return { ...sec, questions: qs }
        }
        return { ...sec, questions: [] }
      }
      const modules = {
        listening: (sections.listening || []).map(normalizeSection),
        reading: (sections.reading || []).map(normalizeSection),
        writing: (sections.writing || []).map(normalizeSection),
        speaking: (sections.speaking || []).map(normalizeSpeakingSection),
      }

      const endpoint = isEditMode ? `/exams/${examId}` : '/exams'
      const method = isEditMode ? 'PUT' : 'POST'

      await api(endpoint, method, { title, description, status: saveStatus, modules, aiGradingEnabled })
      navigate('/admin/exams')
    } catch (err) {
      setSaveError('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────
  if (loadingExam) {
    return (
      <div className="tc-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
          <p>Loading exam for editing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tc-root">

      {/* ── Top bar ── */}
      <div className="tc-topbar">
        <div className="tc-logo">
          <button className="tc-back-btn" onClick={() => navigate('/admin/exams')}>← Exams</button>
          <div className="tc-title-area">
            <span className="tc-badge">{isEditMode ? 'Edit Test' : 'Test Builder'}</span>
            <span className="tc-title-preview">{title || (isEditMode ? 'Editing Test' : 'New IELTS Test')}</span>
          </div>
        </div>
        <div className="tc-steps">
          {['Test Info', 'Add Questions'].map((label, i) => (
            <div key={i} className={`tc-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
              <div className="tc-step-num">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
              {i < 2 && <div className="tc-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ STEP 1: Test Info ══════════════ */}
      {step === 1 && (
        <div className="tc-centered">
          <div className="tc-card">
            <h2 className="tc-card-title">Test Information</h2>
            <p className="tc-card-sub">Give your test a clear name and choose which sections to include.</p>

            <div className="tc-field">
              <label className="tc-label">Test Title <span className="tc-req">*</span></label>
              <input
                className="tc-input"
                type="text"
                placeholder="e.g. IELTS Academic Mock Test — April 2025"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <span className="tc-hint">Students see this name when choosing a test. Be specific.</span>
            </div>

            <div className="tc-field">
              <label className="tc-label">Description <span className="tc-opt">(optional)</span></label>
              <textarea
                className="tc-textarea"
                rows={3}
                placeholder="e.g. Full Academic mock — covers all 3 sections, difficulty level 6.5–7.5"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="tc-field">
              <label className="tc-label">Which sections does this test include?</label>
              <div className="tc-module-picker">
                {[
                  { id: 'listening', icon: '🎧', label: 'Listening', desc: '4 parts · ~40 questions' },
                  { id: 'reading', icon: '📖', label: 'Reading', desc: '3 passages · ~40 questions' },
                  { id: 'writing', icon: '✍️', label: 'Writing', desc: '2 tasks' },
                  { id: 'speaking', icon: '🎤', label: 'Speaking', desc: '3 parts · spoken response' },
                ].map(m => (
                  <label
                    key={m.id}
                    className={`tc-module-card ${activeModules.includes(m.id) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={activeModules.includes(m.id)}
                      onChange={e => {
                        if (e.target.checked) setActiveModules(p => [...p, m.id])
                        else setActiveModules(p => p.filter(x => x !== m.id))
                      }}
                    />
                    <span className="tc-module-icon">{m.icon}</span>
                    <span className="tc-module-label">{m.label}</span>
                    <span className="tc-module-desc">{m.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="tc-ai-toggle-field">
              <div className="tc-ai-toggle-info">
                <span className="tc-ai-toggle-icon">🤖</span>
                <div>
                  <strong>AI Auto-Grading</strong>
                  <p>When ON — AI automatically checks writing & speaking answers and gives feedback to students after submission. When OFF — only listening & reading are auto-scored; writing/speaking wait for manual review.</p>
                </div>
              </div>
              <button
                type="button"
                className={`tc-ai-switch${aiGradingEnabled ? ' on' : ''}`}
                onClick={() => setAiGradingEnabled(v => !v)}
                aria-pressed={aiGradingEnabled}
              >
                <span className="tc-ai-switch-thumb" />
                <span className="tc-ai-switch-label">{aiGradingEnabled ? 'AI ON' : 'AI OFF'}</span>
              </button>
            </div>


            <div className="tc-footer">
              <div />
              <button
                className="tc-btn-primary"
                onClick={() => { setSectionPos(0); setStep(2) }}
                disabled={!title.trim() || activeModules.length === 0}
              >
                Next: Add Questions →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2: Question Builder ══════════════ */}
      {step === 2 && (
        <div className="tc-builder">

          {/* Section progress bar */}
          <div className="tc-section-progress">
            {allSectionKeys.map((key, pos) => {
              const s = sections[key.mod][key.idx]
              const hasQ = s.questions.length > 0
              return (
                <button
                  key={pos}
                  className={`tc-section-dot ${pos === sectionPos ? 'active' : hasQ ? 'done' : ''}`}
                  onClick={() => { cancelDraft(); setSectionPos(pos) }}
                  title={`${key.mod} — ${s.title}`}
                >
                  <span className="tc-dot-module">
                    {key.mod === 'listening' ? '🎧' : key.mod === 'reading' ? '📖' : key.mod === 'speaking' ? '🎤' : '✍️'}
                  </span>
                  <span className="tc-dot-label">{s.title}</span>
                  {hasQ && <span className="tc-dot-count">{s.questions.length}</span>}
                </button>
              )
            })}
          </div>

          {/* Section editor */}
          <div className="tc-section-editor">
            <div className="tc-section-header">
              <div>
                <div className="tc-section-module-badge">
                  {currentKey.mod === 'listening' ? '🎧 LISTENING' : currentKey.mod === 'reading' ? '📖 READING' : currentKey.mod === 'speaking' ? '🎤 SPEAKING' : '✍️ WRITING'}
                </div>
                <h2 className="tc-section-title">{currentSection.title}</h2>
                <p className="tc-section-sub">
                  Section {sectionPos + 1} of {allSectionKeys.length}
                  {' · '}
                  {currentSection.questions.length} question block{currentSection.questions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="tc-section-nav">
                <button
                  className="tc-btn-ghost"
                  onClick={() => { cancelDraft(); setSectionPos(p => p - 1) }}
                  disabled={sectionPos === 0}
                >
                  ← Previous
                </button>
                {sectionPos < allSectionKeys.length - 1 ? (
                  <button
                    className="tc-btn-secondary"
                    onClick={() => { cancelDraft(); setSectionPos(p => p + 1) }}
                  >
                    Next Section →
                  </button>
                ) : (
                  <button className="tc-btn-secondary" onClick={() => setShowPreview(true)}>
                    👁 Preview
                  </button>
                )}
              </div>
            </div>

            {/* ── Section Setup ── */}
            <div className="tc-section-setup">

              {/* Instructions + Question Range (all modules) */}
              <div className="tc-field-row tc-section-meta-fields">
                <div className="tc-field half">
                  <label className="tc-label">Section Instructions <span className="tc-opt">(shown to student)</span></label>
                  <RichTextEditor
                    value={currentSection.instructions || ''}
                    onChange={val => updateCurrentSection('instructions', val)}
                    placeholder={
                      currentKey.mod === 'listening'
                        ? 'e.g. Questions 1–10. Complete the form below. Write NO MORE THAN TWO WORDS.'
                        : currentKey.mod === 'reading'
                          ? 'e.g. Questions 1–13. Read the passage and answer the questions.'
                          : currentKey.mod === 'speaking'
                            ? 'e.g. Part 1: The examiner will ask you questions about yourself and familiar topics.'
                            : 'e.g. Write at least 150 words in response to the task below.'
                    }
                    rows={2}
                  />
                  <span className="tc-hint">Displayed as a banner at the top of this section. Supports <b>bold</b> and font size.</span>
                </div>
                <div className="tc-field quarter">
                  <label className="tc-label">Question Range <span className="tc-opt">(optional)</span></label>
                  <input
                    className="tc-input"
                    type="text"
                    placeholder="e.g. 1–10"
                    value={currentSection.questionRange || ''}
                    onChange={e => updateCurrentSection('questionRange', e.target.value)}
                  />
                  <span className="tc-hint">e.g. "1–10" — shown in section header.</span>
                </div>
              </div>

              {currentKey.mod === 'listening' && (
                <div className="tc-setup-row">
                  <div className="tc-setup-item">
                    <span className="tc-setup-icon">🎵</span>
                    <div className="tc-setup-info">
                      <strong>Audio Recording</strong>
                      <span>
                        {currentSection.media.find(m => m.type === 'audio')
                          ? '✅ Audio file uploaded'
                          : 'Optional — upload the MP3 for this part'}
                      </span>
                    </div>
                    <label className="tc-btn-upload">
                      {uploading.audio
                        ? 'Uploading...'
                        : currentSection.media.find(m => m.type === 'audio') ? 'Replace Audio' : 'Upload MP3'}
                      <input type="file" accept="audio/*" hidden onChange={handleSectionAudio} />
                    </label>
                    {currentSection.media.find(m => m.type === 'audio') && (
                      <button
                        className="tc-btn-ghost"
                        style={{ color: '#dc2626', borderColor: '#dc2626' }}
                        onClick={() => updateCurrentSection('media', currentSection.media.filter(m => m.type !== 'audio'))}
                      >
                        Remove Audio
                      </button>
                    )}
                  </div>
                  {currentSection.media.find(m => m.type === 'audio') && (
                    <audio
                      controls
                      src={currentSection.media.find(m => m.type === 'audio').url}
                      style={{ width: '100%', marginTop: 8, height: 36 }}
                    />
                  )}
                  <div className="tc-setup-item">
                    <span className="tc-setup-icon">🖼️</span>
                    <div className="tc-setup-info">
                      <strong>Map / Diagram Image</strong>
                      <span>
                        {currentSection.media.find(m => m.type === 'image')
                          ? '✅ Image uploaded'
                          : 'Optional — needed only for map labelling questions'}
                      </span>
                    </div>
                    <label className="tc-btn-upload">
                      {uploading.image
                        ? 'Uploading...'
                        : currentSection.media.find(m => m.type === 'image') ? 'Replace Image' : 'Upload Image'}
                      <input type="file" accept="image/*" hidden onChange={handleSectionImage} />
                    </label>
                    {currentSection.media.find(m => m.type === 'image') && (
                      <button
                        className="tc-btn-ghost"
                        style={{ color: '#dc2626', borderColor: '#dc2626' }}
                        onClick={() => updateCurrentSection('media', currentSection.media.filter(m => m.type !== 'image'))}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  {currentSection.media.find(m => m.type === 'image') && (
                    <img
                      src={currentSection.media.find(m => m.type === 'image').url}
                      alt="Preview"
                      style={{ maxHeight: 120, maxWidth: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e2e8f0' }}
                    />
                  )}
                </div>
              )}

              {currentKey.mod === 'reading' && (
                <div className="tc-field" style={{ marginBottom: 0 }}>
                  <label className="tc-label">Passage Text</label>
                  <RichTextEditor
                    value={currentSection.passageContent}
                    onChange={val => updateCurrentSection('passageContent', val)}
                    placeholder="Paste the full reading passage here. Students will see this text on the left side of the screen while answering questions."
                    rows={10}
                  />
                  <span className="tc-hint">
                    Tip: Press Enter twice between paragraphs. The passage appears alongside questions during the exam.
                  </span>
                </div>
              )}

              {currentKey.mod === 'speaking' && (
                <>
                  <div className="tc-field" style={{ marginBottom: 0 }}>
                    {currentSection.title === 'Part 2' ? (
                      <>
                        <label className="tc-label">Cue Card</label>
                        <textarea
                          className="tc-textarea"
                          rows={7}
                          placeholder={'Describe a place you have visited that you found interesting.\nYou should say:\n  – where it is\n  – when you visited\n  – what you did there\nand explain why you found it interesting.\n\nYou have 1 minute to prepare. Then speak for 1–2 minutes.'}
                          value={currentSection.passageContent}
                          onChange={e => updateCurrentSection('passageContent', e.target.value)}
                        />
                        <span className="tc-hint">Part 2 — Student speaks for 1–2 minutes after 1 minute preparation.</span>
                      </>
                    ) : (
                      <>
                        <label className="tc-label">
                          {currentSection.title === 'Part 1' ? 'Part 1 Questions' : 'Part 3 Questions'}
                        </label>
                        <SpeakingQuestionList
                          value={currentSection.passageContent || ''}
                          onChange={val => updateCurrentSection('passageContent', val)}
                        />
                        <span className="tc-hint" style={{ marginTop: 6 }}>
                          {currentSection.title === 'Part 1'
                            ? 'Part 1 — Introduction. Examiner asks familiar questions (~4–5 minutes). Press Enter to add next question.'
                            : 'Part 3 — Two-way discussion. Abstract follow-up questions (~4–5 minutes). Press Enter to add next question.'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="tc-setup-row" style={{ marginTop: 16 }}>
                    <div className="tc-setup-item">
                      <span className="tc-setup-icon">🔊</span>
                      <div className="tc-setup-info">
                        <strong>Examiner Audio Prompt</strong>
                        <span>
                          {currentSection.media.find(m => m.type === 'audio')
                            ? '✅ Audio uploaded'
                            : 'Optional — upload a pre-recorded examiner prompt'}
                        </span>
                      </div>
                      <label className="tc-btn-upload">
                        {uploading.audio
                          ? 'Uploading...'
                          : currentSection.media.find(m => m.type === 'audio') ? 'Replace Audio' : 'Upload MP3'}
                        <input type="file" accept="audio/*" hidden onChange={handleSectionAudio} />
                      </label>
                      {currentSection.media.find(m => m.type === 'audio') && (
                        <button
                          className="tc-btn-ghost"
                          style={{ color: '#dc2626', borderColor: '#dc2626' }}
                          onClick={() => updateCurrentSection('media', currentSection.media.filter(m => m.type !== 'audio'))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {currentSection.media.find(m => m.type === 'audio') && (
                      <audio
                        controls
                        src={currentSection.media.find(m => m.type === 'audio').url}
                        style={{ width: '100%', marginTop: 8, height: 36 }}
                      />
                    )}
                  </div>
                </>
              )}

              {currentKey.mod === 'writing' && (
                <>
                  <div className="tc-field" style={{ marginBottom: 0 }}>
                    <label className="tc-label">Writing Task Prompt</label>
                    <RichTextEditor
                      value={currentSection.passageContent}
                      onChange={val => updateCurrentSection('passageContent', val)}
                      placeholder={
                        currentSection.title === 'Task 1'
                          ? 'e.g. The chart below shows the percentage of household income spent on food in different countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.'
                          : 'e.g. Some people believe that university education should be free for all students. Others argue that students should pay tuition fees. Discuss both views and give your own opinion. Write at least 250 words.'
                      }
                      rows={6}
                    />
                    <span className="tc-hint">
                      {currentSection.title === 'Task 1'
                        ? 'Task 1: Describe a chart, graph, map, or process. Students write at least 150 words.'
                        : 'Task 2: Essay question. Students write at least 250 words.'}
                    </span>
                  </div>
                  <div className="tc-setup-row" style={{ marginTop: 16 }}>
                    <div className="tc-setup-item">
                      <span className="tc-setup-icon">🖼️</span>
                      <div className="tc-setup-info">
                        <strong>Task Image / Chart</strong>
                        <span>
                          {currentSection.media.find(m => m.type === 'image')
                            ? '✅ Image uploaded'
                            : 'Optional — upload a chart, map, or diagram for Task 1'}
                        </span>
                      </div>
                      <label className="tc-btn-upload">
                        {uploading.image
                          ? 'Uploading...'
                          : currentSection.media.find(m => m.type === 'image') ? 'Replace Image' : 'Upload Image'}
                        <input type="file" accept="image/*" hidden onChange={handleSectionImage} />
                      </label>
                      {currentSection.media.find(m => m.type === 'image') && (
                        <button
                          className="tc-btn-ghost"
                          style={{ color: '#dc2626', borderColor: '#dc2626' }}
                          onClick={() => updateCurrentSection('media', currentSection.media.filter(m => m.type !== 'image'))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {currentSection.media.find(m => m.type === 'image') && (
                      <img
                        src={currentSection.media.find(m => m.type === 'image').url}
                        alt="Task preview"
                        style={{ maxHeight: 160, maxWidth: '100%', marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 4 }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Question blocks (not for writing or speaking) ── */}
            {currentKey.mod !== 'writing' && currentKey.mod !== 'speaking' && (
              <div className="tc-questions-area">
                <div className="tc-questions-header">
                  <h3>Question Blocks</h3>
                  {!pickingType && !bulkMCQMode && (
                    <button className="tc-btn-add-q" onClick={openTypePicker}>
                      + Add Question Block
                    </button>
                  )}
                </div>

                {/* ── Bulk MCQ import ── */}
                {bulkMCQMode && (
                  <BulkMCQImport
                    getNextStart={getNextStart}
                    defaultInstruction={DEFAULT_INSTRUCTIONS['mcq'] || ''}
                    onImport={addMultipleQuestions}
                    onCancel={cancelDraft}
                  />
                )}

                {/* ── Type picker ── */}
                {pickingType && !draftQ && !bulkMCQMode && (
                  <div className="tc-type-picker">
                    <div className="tc-type-picker-header">
                      <h4>Choose a Question Type</h4>
                      <button className="tc-close-btn" onClick={cancelDraft}>✕ Cancel</button>
                    </div>
                    <div className="tc-type-grid">
                      {/* Bulk MCQ special card — first in grid */}
                      {(currentKey.mod === 'listening' || currentKey.mod === 'reading') && (
                        <button
                          className="tc-type-card tc-type-card-bulk"
                          onClick={() => { setBulkMCQMode(true); setPickingType(false) }}
                          style={{ '--tc-type-color': '#4f46e5' }}
                        >
                          <div className="tc-type-icon" style={{ background: '#4f46e5' }}>⚡</div>
                          <div className="tc-type-info">
                            <strong>Bulk MCQ Import</strong>
                            <p>Paste many MCQ questions at once — faster than adding one by one</p>
                          </div>
                          <div className="tc-type-example">
                            <span className="tc-example-label">FASTEST</span>
                            <pre>{'Q1 text\nA. opt\nB. opt\nC\n\nQ2 text...'}</pre>
                          </div>
                        </button>
                      )}
                      {(QUESTION_TYPES[currentKey.mod] || []).map(qt => (
                        <button
                          key={qt.id}
                          className="tc-type-card"
                          onClick={() => selectType(qt.id)}
                          style={{ '--tc-type-color': qt.color }}
                        >
                          <div className="tc-type-icon" style={{ background: qt.color }}>{qt.icon}</div>
                          <div className="tc-type-info">
                            <strong>{qt.label}</strong>
                            <p>{qt.desc}</p>
                          </div>
                          <div className="tc-type-example">
                            <span className="tc-example-label">IELTS Example</span>
                            <pre>{qt.example}</pre>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Draft question form ── */}
                {draftQ && !bulkMCQMode && (
                  <QuestionForm
                    q={draftQ}
                    onChange={setDraftQ}
                    onSave={saveDraftQuestion}
                    onSaveAndRepeat={saveAndRepeatQuestion}
                    onCancel={cancelDraft}
                  />
                )}

                {/* ── Saved question blocks ── */}
                {currentSection.questions.length === 0 && !pickingType ? (
                  <div className="tc-empty-hint">
                    <span className="tc-empty-icon">📋</span>
                    <p>No questions added for <strong>{currentSection.title}</strong> yet.</p>
                    <p>Click <strong>"+ Add Question Block"</strong> above to get started.</p>
                  </div>
                ) : (
                  <div className="tc-question-list">
                    {currentSection.questions.map((q, qi) => (
                      <QuestionCard
                        key={qi}
                        q={q}
                        qi={qi}
                        onEdit={() => editQuestion(qi)}
                        onDuplicate={() => duplicateQuestion(qi)}
                        onRemove={() => removeQuestion(qi)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulk Answer Input Panel */}
          <BulkAnswerPanel
            currentSection={currentSection}
            onApply={(updatedQuestions) => {
              setSections(prev => {
                const arr = [...prev[currentKey.mod]]
                arr[currentKey.idx] = { ...arr[currentKey.idx], questions: updatedQuestions }
                return { ...prev, [currentKey.mod]: arr }
              })
            }}
          />

          {/* Fixed bottom navigation */}
          <div className="tc-builder-footer">
            <button className="tc-btn-ghost" onClick={() => setStep(1)} disabled={saving}>← Edit Test Info</button>
            <div className="tc-footer-center">
              {saveError && <span className="tc-save-error">{saveError}</span>}
              {errors.length > 0 && !saveError && (
                <span className="tc-save-error">{errors[0]}</span>
              )}
              {!saveError && errors.length === 0 && (
                <span className="tc-total-badge">{totalQuestions} question{totalQuestions !== 1 ? 's' : ''} total</span>
              )}
            </div>
            <div className="tc-footer-actions">
              <button className="tc-btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>
                {saving ? '…' : isEditMode ? '💾 Update Draft' : '💾 Save Draft'}
              </button>
              <button className="tc-btn-primary" onClick={() => handleSave('published')} disabled={saving}>
                {saving ? 'Saving…' : isEditMode ? '✅ Update & Publish' : '🚀 Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PREVIEW MODAL ══════════════ */}
      {showPreview && (
        <ExamPreviewModal
          examData={previewExamData}
          onClose={() => setShowPreview(false)}
          onPublish={handleSave}
          saving={saving}
          publishErrors={errors}
        />
      )}

    </div>
  )
}

// ─── QUESTION FORM ──────────────────────────────────────────────────────────
function QuestionForm({ q, onChange, onSave, onSaveAndRepeat, onCancel }) {
  const update = (field, value) => {
    const next = { ...q, [field]: value }
    if (field === 'startNumber') next.questionNumber = value
    onChange(next)
  }
  const gapCount = (q.questionText?.match(/\[gap\]/gi) || []).length

  // Auto-focus first text input when form opens
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.querySelector('.tc-q-form .tc-textarea, .tc-q-form .tc-input[type="text"]')
      if (el) el.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [])

  const insertGap = () => {
    update('questionText', (q.questionText || '') + ' [gap] ')
  }

  const presets = {
    'gap-fill': ['Write NO MORE THAN TWO WORDS AND/OR A NUMBER.', 'Write ONE WORD ONLY.', 'Write ONE WORD AND/OR A NUMBER.'],
    'tfng': ['Write TRUE, FALSE or NOT GIVEN.', 'Write YES, NO or NOT GIVEN.'],
    'short-answer': ['Write NO MORE THAN THREE WORDS.', 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER.'],
    'mcq': ['Choose the correct letter, A, B, C or D.'],
    'mcq-multi': ['Choose TWO letters, A–E.', 'Choose TWO letters, A–D.'],
    'matching': ['Write the correct letter, A–H, next to Questions 1–6.', 'Match each heading to the correct paragraph.'],
    'map-labeling': ['Label the map below. Write the correct letter, A–H.'],
    'table-completion': ['Complete the table below. Write ONE WORD ONLY for each answer.', 'Write NO MORE THAN TWO WORDS for each answer.'],
    'choose-from-box': ['Choose SIX answers from the box and write the correct letter, A–H.', 'Choose the correct letter, A, B or C, for each item.'],
    'summary-phrase-bank': ['Complete the summary using the list of phrases, A–J, below. Write the correct letter in boxes 31–36.'],
  }

  return (
    <div className="tc-q-form">
      <div className="tc-q-form-header">
        <div>
          <span className="tc-q-type-badge">{q.type.replace(/-/g, ' ').toUpperCase()}</span>
          <span className="tc-q-form-title"> Fill in the question details below</span>
        </div>
        <button className="tc-close-btn" onClick={onCancel}>✕ Cancel</button>
      </div>

      {/* Starting question number */}
      <div className="tc-field-row">
        <div className="tc-field half">
          <label className="tc-label">Starting Question Number</label>
          <input
            className="tc-input"
            type="number"
            min={1}
            value={q.startNumber || 1}
            onChange={e => update('startNumber', parseInt(e.target.value) || 1)}
          />
          <span className="tc-hint">Questions are numbered from this value.</span>
        </div>
      </div>

      {/* Instruction text */}
      <div className="tc-field">
        <label className="tc-label">Task Instruction</label>
        {(presets[q.type] || []).length > 0 && (
          <div className="tc-preset-btns">
            {(presets[q.type] || []).map(p => (
              <button
                key={p}
                className={`tc-preset ${q.instructionText === p ? 'active' : ''}`}
                onClick={() => update('instructionText', p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <RichTextEditor
          value={q.instructionText || ''}
          onChange={val => update('instructionText', val)}
          placeholder="Instruction text shown above the question (e.g. Write NO MORE THAN TWO WORDS)..."
          rows={2}
        />
        <span className="tc-hint">Shown above the question group in the exam. Supports <b>bold</b> and font size for emphasis.</span>
      </div>

      {/* Gap-fill question text */}
      {q.type === 'gap-fill' && (
        <div className="tc-field">
          <div className="tc-label-row">
            <label className="tc-label">Question Text — type [gap] where each blank should appear</label>
            <button className="tc-insert-gap-btn" onClick={insertGap}>+ Insert [gap]</button>
          </div>
          <RichTextEditor
            value={q.questionText || ''}
            onChange={val => update('questionText', val)}
            placeholder="Name: [gap]&#10;Phone number: [gap]&#10;Date of appointment: [gap]"
            rows={6}
          />
          {gapCount > 0 && (
            <div className="tc-gap-badge">
              {gapCount} blank{gapCount !== 1 ? 's' : ''} → Question{gapCount !== 1 ? 's' : ''}{' '}
              {q.startNumber}{gapCount > 1 ? `–${q.startNumber + gapCount - 1}` : ''}
            </div>
          )}
          <span className="tc-hint">
            Click "Insert [gap]" to add a blank at the cursor position, or type [gap] manually.
          </span>
        </div>
      )}

      {/* MCQ question text + options */}
      {q.type === 'mcq' && (
        <>
          <div className="tc-field">
            <label className="tc-label">Question Text</label>
            <RichTextEditor
              value={q.questionText || ''}
              onChange={val => update('questionText', val)}
              placeholder="e.g. What is the main reason the speaker gives for the change in policy?"
              rows={2}
            />
          </div>
          <div className="tc-field">
            <div className="tc-label-row">
              <label className="tc-label">Answer Options (A, B, C, D...)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className="tc-preset" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => {
                  update('_optPasteMode', !q._optPasteMode)
                  if (!q._optPasteMode) update('_optPasteText', (q.options || []).join('\n'))
                }}>{q._optPasteMode ? '✕ List Mode' : '📋 Paste Mode'}</button>
                {!q._optPasteMode && <button className="tc-add-option-btn" style={{ margin: 0 }} onClick={() => update('options', [...(q.options || []), ''])}>+ Add</button>}
              </div>
            </div>
            {q._optPasteMode ? (
              <div>
                <textarea className="tc-textarea" rows={5}
                  value={q._optPasteText || ''}
                  onChange={e => update('_optPasteText', e.target.value)}
                  placeholder={"Paste options, one per line:\nClimate change\nOcean pollution\nSolar energy\nWildlife protection"}
                />
                <button className="tc-btn-save-q" style={{ fontSize: '12px', padding: '7px 16px', marginTop: 8 }} onClick={() => {
                  const opts = (q._optPasteText || '').split('\n').map(s => s.trim()).filter(Boolean)
                  update('options', opts)
                  update('_optPasteMode', false)
                  update('_optPasteText', undefined)
                }}>✓ Apply {(q._optPasteText || '').split('\n').filter(s => s.trim()).length} Options</button>
                <span className="tc-hint" style={{ marginTop: 6 }}>Each line → one option (A, B, C…). Press Apply when done.</span>
              </div>
            ) : (
              <div className="tc-options-list">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className="tc-option-row">
                    <span className="tc-option-letter">{String.fromCharCode(65 + i)}</span>
                    <RichTextEditor
                      value={opt}
                      onChange={val => { const o = [...(q.options || [])]; o[i] = val; update('options', o) }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      rows={1}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${(q.correctAnswer || '') === String.fromCharCode(65 + i) ? '#16a34a' : '#e2e8f0'}`, background: (q.correctAnswer || '') === String.fromCharCode(65 + i) ? '#f0fdf4' : 'transparent', color: (q.correctAnswer || '') === String.fromCharCode(65 + i) ? '#16a34a' : '#94a3b8' }}>
                      <input type="radio" name={`mcq-correct-${q.startNumber}`} checked={(q.correctAnswer || '') === String.fromCharCode(65 + i)} onChange={() => update('correctAnswer', String.fromCharCode(65 + i))} style={{ accentColor: '#16a34a' }} />
                      ✓
                    </label>
                    <button className="tc-remove-btn" onClick={() => update('options', q.options.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <span className="tc-hint">Enter in field = new option. Click ✓ radio to mark correct answer directly.</span>
          </div>
        </>
      )}

      {/* MCQ-multi (Choose TWO) */}
      {q.type === 'mcq-multi' && (
        <>
          <div className="tc-field">
            <label className="tc-label">Question Text</label>
            <RichTextEditor
              value={q.questionText || ''}
              onChange={val => update('questionText', val)}
              placeholder="e.g. Which TWO things did Colin find most satisfying about his project?"
              rows={2}
            />
          </div>
          <div className="tc-field">
            <div className="tc-label-row">
              <label className="tc-label">Options (A–E)</label>
              <button
                className="tc-add-option-btn"
                onClick={() => update('options', [...(q.options || []), ''])}
              >
                + Add Option
              </button>
            </div>
            <div className="tc-options-list">
              {(q.options || []).map((opt, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-letter">{String.fromCharCode(65 + i)}</span>
                  <RichTextEditor
                    value={opt}
                    onChange={val => { const o = [...(q.options || [])]; o[i] = val; update('options', o) }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    rows={1}
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('options', q.options.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
            </div>
            <span className="tc-hint">Correct answers: enter exactly TWO letters (e.g. B and C).</span>
          </div>
        </>
      )}

      {/* TFNG statements */}
      {q.type === 'tfng' && (
        <div className="tc-field">
          <label className="tc-label">Answer Format</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { label: 'True / False', vals: ['TRUE', 'FALSE'] },
              { label: 'Yes / No / Not Given', vals: ['YES', 'NO', 'NOT GIVEN'] },
              { label: 'True / False / Not Given', vals: ['TRUE', 'FALSE', 'NOT GIVEN'] },
            ].map(preset => (
              <button key={preset.label}
                className={`tc-preset${JSON.stringify(q._tfngOptions || ['TRUE', 'FALSE', 'NOT GIVEN']) === JSON.stringify(preset.vals) ? ' active' : ''}`}
                style={{ padding: '7px 14px', fontSize: '12px' }}
                onClick={() => update('_tfngOptions', preset.vals)}
              >{preset.label}</button>
            ))}
          </div>
          <label className="tc-label">Statements (one per line)</label>
          <textarea
            className="tc-textarea"
            rows={5}
            value={q.questionText || ''}
            onChange={e => update('questionText', e.target.value)}
            placeholder={'The company was founded in 1890.\nThe CEO holds a doctorate.\nProducts are exported to 40 countries.'}
          />
          <span className="tc-hint">
            Each line = one statement. Select answer format above — options auto-generated for students.
          </span>
        </div>
      )}

      {/* Matching Headings */}
      {q.type === 'matching-headings' && (
        <>
          <div className="tc-field">
            <label className="tc-label">List of Headings</label>
            <span className="tc-hint">Each heading will be assigned a Roman numeral (i, ii, iii…)</span>
            <div className="tc-items-list">
              {(q.options || []).map((h, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-letter" style={{ fontStyle: 'italic', minWidth: 28 }}>
                    {['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][i] || i + 1}
                  </span>
                  <RichTextEditor
                    value={h}
                    onChange={val => { const o = [...(q.options || [])]; o[i] = val; update('options', o) }}
                    placeholder={`Heading ${i + 1}`}
                    rows={1}
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('options', q.options.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
              <button
                className="tc-add-item-btn"
                onClick={() => update('options', [...(q.options || []), ''])}
              >
                + Add Heading
              </button>
            </div>
          </div>
          <div className="tc-field">
            <label className="tc-label">Paragraphs to Match</label>
            <span className="tc-hint">These are the section/paragraph labels students will assign headings to</span>
            <div className="tc-items-list">
              {(q.matchingItems || []).map((p, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-num">{(q.startNumber || 1) + i}</span>
                  <input
                    className="tc-input"
                    value={p}
                    onChange={e => { const it = [...q.matchingItems]; it[i] = e.target.value; update('matchingItems', it) }}
                    placeholder="e.g. Paragraph A / Section B"
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('matchingItems', q.matchingItems.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
              <button
                className="tc-add-item-btn"
                onClick={() => update('matchingItems', [...(q.matchingItems || []), ''])}
              >
                + Add Paragraph
              </button>
            </div>
          </div>
        </>
      )}

      {/* Table completion — dynamic row/column editor */}
      {q.type === 'table-completion' && (() => {
        const headers = q.tableData?.headers || ['', '']
        const rows = q.tableData?.rows || [['', '[gap]']]
        const colCount = headers.length

        const updateTable = (newHeaders, newRows) =>
          update('tableData', { headers: newHeaders, rows: newRows })

        const addColumn = () => {
          updateTable([...headers, ''], rows.map(row => [...row, '']))
        }

        const removeColumn = (colIdx) => {
          if (colCount <= 1) return
          updateTable(
            headers.filter((_, i) => i !== colIdx),
            rows.map(row => row.filter((_, i) => i !== colIdx))
          )
        }

        const setHeader = (colIdx, value) => {
          const h = [...headers]; h[colIdx] = value
          update('tableData', { ...q.tableData, headers: h })
        }

        const addRow = () =>
          update('tableData', { ...q.tableData, rows: [...rows, Array(colCount).fill('')] })

        const removeRow = (rowIdx) =>
          update('tableData', { ...q.tableData, rows: rows.filter((_, i) => i !== rowIdx) })

        const setCell = (rowIdx, colIdx, value) => {
          const newRows = rows.map((row, i) =>
            i !== rowIdx ? row : row.map((cell, j) => j !== colIdx ? cell : value)
          )
          update('tableData', { ...q.tableData, rows: newRows })
        }

        return (
          <>
            {/* Column headers */}
            <div className="tc-field">
              <div className="tc-label-row">
                <label className="tc-label">Columns &amp; Headers</label>
                <button type="button" className="tc-add-item-btn" onClick={addColumn}>
                  + Add Column
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: '8px' }}>
                {headers.map((h, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Col {i + 1}</span>
                      <button
                        type="button"
                        className="tc-remove-btn"
                        style={{ fontSize: '10px', padding: '1px 5px' }}
                        onClick={() => removeColumn(i)}
                        disabled={colCount <= 1}
                        title="Remove this column"
                      >✕</button>
                    </div>
                    <input
                      className="tc-input"
                      value={h.replace('[gap]', '')}
                      onChange={e => setHeader(i, e.target.value)}
                      placeholder={`Column ${i + 1} header`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Data rows */}
            <div className="tc-field">
              <div className="tc-label-row">
                <label className="tc-label">Table Rows</label>
                <button type="button" className="tc-add-item-btn" onClick={addRow}>+ Add Row</button>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                {rows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${colCount}, 1fr) auto`,
                      gap: '8px',
                      padding: '10px 12px',
                      alignItems: 'start',
                      background: rowIdx % 2 === 0 ? '#fafafa' : '#fff',
                      borderBottom: rowIdx < rows.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    {Array.from({ length: colCount }).map((_, cellIdx) => {
                      const cellValue = row[cellIdx] || ''
                      const gapCount = (cellValue.match(/\[gap\]/gi) || []).length
                      return (
                        <div key={cellIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            className="tc-input"
                            value={cellValue}
                            onChange={e => setCell(rowIdx, cellIdx, e.target.value)}
                            placeholder="Cell text — type [gap] for blank"
                            style={gapCount > 0 ? { borderColor: '#f59e0b', background: '#fffbeb' } : {}}
                          />
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setCell(rowIdx, cellIdx, cellValue + '[gap]')}
                              style={{ fontSize: '11px', padding: '2px 7px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px', cursor: 'pointer', color: '#92400e', whiteSpace: 'nowrap' }}
                            >+ blank</button>
                            {gapCount > 0 && (
                              <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 600 }}>
                                {gapCount} blank{gapCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      className="tc-remove-btn"
                      onClick={() => removeRow(rowIdx)}
                      title="Remove row"
                      style={{ alignSelf: 'center', marginTop: 4 }}
                    >✕</button>
                  </div>
                ))}
              </div>
              <span className="tc-hint">Type cell content freely. Click "+ blank" to append a [gap] marker — you can have text before and after it. Enter correct answers below.</span>
            </div>
          </>
        )
      })()}

      {/* Summary phrase bank (passage + options A–J) */}
      {q.type === 'summary-phrase-bank' && (
        <>
          <div className="tc-field">
            <div className="tc-label-row">
              <label className="tc-label">Summary passage — use [gap] for each blank</label>
              <button className="tc-insert-gap-btn" onClick={insertGap}>+ Insert [gap]</button>
            </div>
            <RichTextEditor
              value={q.questionText || ''}
              onChange={val => update('questionText', val)}
              placeholder="Although people have [gap] to misinformation..."
              rows={8}
            />
          </div>
          <div className="tc-field">
            <div className="tc-label-row">
              <label className="tc-label">Phrases A–J (one per line)</label>
              <button
                className="tc-add-option-btn"
                onClick={() => update('options', [...(q.options || []).slice(0, 10), ''].slice(0, 10))}
              >
                Ensure 10 options
              </button>
            </div>
            <div className="tc-options-list">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-letter">{String.fromCharCode(65 + i)}</span>
                  <RichTextEditor
                    value={(q.options || [])[i] || ''}
                    onChange={val => {
                      const o = [...(q.options || [])]; while (o.length <= i) o.push(''); o[i] = val
                      update('options', o.slice(0, 10))
                    }}
                    placeholder={`Phrase ${String.fromCharCode(65 + i)}`}
                    rows={1}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Choose from box — simplified (box title → options A–H → questions) */}
      {q.type === 'choose-from-box' && (
        <>
          <div className="tc-field" style={{ background: '#fdf2f8', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <strong style={{ fontSize: '13px', color: '#9d174d' }}>🗃 3 qadam:</strong>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#831843' }}>
              <li>Quti sarlavhasi (masalan: Information)</li>
              <li>Variantlar A, B, C… (talabalar shulardan bitta harf tanlaydi)</li>
              <li>Savollar — har biriga bitta harf mos keladi</li>
            </ol>
            <button
              type="button"
              className="tc-add-item-btn"
              style={{ marginTop: '10px', background: '#be185d', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              onClick={() => {
                const start = q.startNumber ?? 11
                onChange({
                  ...q,
                  boxTitle: 'Information',
                  options: Array.from({ length: 8 }, (_, i) => (q.options || [])[i] || ''),
                  matchingItems: Array.from({ length: 6 }, (_, i) => (q.matchingItems || [])[i] || `${start + i}. `)
                })
              }}
            >
              📋 Shablon: 6 savol, 8 variant (A–H)
            </button>
          </div>
          <div className="tc-field">
            <label className="tc-label">1. Quti sarlavhasi</label>
            <input
              className="tc-input"
              value={q.boxTitle || ''}
              onChange={e => update('boxTitle', e.target.value)}
              placeholder="Information"
            />
          </div>
          <div className="tc-field">
            <div className="tc-label-row">
              <label className="tc-label">2. Variantlar (A, B, C...H) — qutida korinadi</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '11px', color: '#9d174d', fontWeight: 600 }}>
                  {(q.options || []).filter(Boolean).length} / 8
                </span>
                {(q.options || []).length < 8 && (
                  <button
                    className="tc-add-option-btn"
                    style={{ margin: 0 }}
                    onClick={() => update('options', [...(q.options || []), ''])}
                  >
                    + Variant qoshish
                  </button>
                )}
              </div>
            </div>
            <div className="tc-options-list">
              {(q.options || []).map((opt, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-letter">{String.fromCharCode(65 + i)}</span>
                  <RichTextEditor
                    value={opt}
                    onChange={val => { const o = [...(q.options || [])]; o[i] = val; update('options', o) }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    rows={1}
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('options', q.options.filter((_, j) => j !== i))}
                    title={`Remove option ${String.fromCharCode(65 + i)}`}
                  >x</button>
                </div>
              ))}
            </div>
            {(q.options || []).length === 0 && (
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0' }}>
                No options yet. Click &quot;+ Variant qoshish&quot; to add.
              </p>
            )}
          </div>
          <div className="tc-field">
            <label className="tc-label">3. Savollar (har biriga bitta harf tanlanadi)</label>
            <span className="tc-hint" style={{ marginBottom: 8, display: 'block' }}>Masalan: 11. Superheroes, 12. Just do it</span>
            <div className="tc-items-list">
              {(q.matchingItems || []).map((item, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-num">{(q.startNumber || 1) + i}</span>
                  <input
                    className="tc-input"
                    value={item}
                    onChange={e => {
                      const it = [...q.matchingItems]; it[i] = e.target.value; update('matchingItems', it)
                    }}
                    placeholder={`${(q.startNumber || 11) + i}. ...`}
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('matchingItems', q.matchingItems.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
              <button
                className="tc-add-item-btn"
                onClick={() => update('matchingItems', [...(q.matchingItems || []), ''])}
              >
                + Savol qo'shish
              </button>
            </div>
          </div>
        </>
      )}

      {/* Matching / Map-labelling (not choose-from-box) */}
      {(q.type === 'matching' || q.type === 'map-labeling') && (
        <>
          <div className="tc-field">
            <label className="tc-label">
              {q.type === 'matching' ? 'Items to Match (numbered list on left)' : 'Labelled Positions (numbered on diagram)'}
            </label>
            <span className="tc-hint" style={{ marginBottom: 8, display: 'block' }}>
              {q.type === 'matching'
                ? 'These are the question items students will match. Each item gets a question number.'
                : 'These are the numbered positions on the map/diagram.'}
            </span>
            <div className="tc-items-list">
              {(q.matchingItems || []).map((item, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-num">{(q.startNumber || 1) + i}</span>
                  <input
                    className="tc-input"
                    value={item}
                    onChange={e => {
                      const it = [...q.matchingItems]; it[i] = e.target.value; update('matchingItems', it)
                    }}
                    placeholder={q.type === 'matching' ? 'e.g. The farm / Speaker 1' : 'e.g. Reception / Café'}
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('matchingItems', q.matchingItems.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
              <button
                className="tc-add-item-btn"
                onClick={() => update('matchingItems', [...(q.matchingItems || []), ''])}
              >
                + Add Item
              </button>
            </div>
          </div>
          <div className="tc-field">
            <label className="tc-label">Options Pool (A, B, C...)</label>
            <div className="tc-items-list">
              {(q.options || []).map((opt, i) => (
                <div key={i} className="tc-option-row">
                  <span className="tc-option-letter">{String.fromCharCode(65 + i)}</span>
                  <RichTextEditor
                    value={opt}
                    onChange={val => { const o = [...(q.options || [])]; o[i] = val; update('options', o) }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    rows={1}
                  />
                  <button
                    className="tc-remove-btn"
                    onClick={() => update('options', q.options.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
              <button
                className="tc-add-item-btn"
                onClick={() => update('options', [...(q.options || []), ''])}
              >
                + Add Option
              </button>
            </div>
          </div>
        </>
      )}

      {/* Short answer */}
      {q.type === 'short-answer' && (
        <div className="tc-field">
          <label className="tc-label">Question(s)</label>
          <RichTextEditor
            value={q.questionText || ''}
            onChange={val => update('questionText', val)}
            placeholder={'Q1: What year was the museum founded?\nQ2: How many employees work at the site?\nQ3: Which city is the headquarters located in?'}
            rows={4}
          />
          <span className="tc-hint">
            Students answer using words taken directly from the passage (maximum 3 words).
          </span>
        </div>
      )}

      {/* ── Correct Answers ── */}
      <div className="tc-field tc-answers">
        <div className="tc-label-row" style={{ marginBottom: 8 }}>
          <label className="tc-label" style={{ marginBottom: 0 }}>
            ✅ Correct Answer{q.type === 'gap-fill' && gapCount > 1 ? 's' : ''}
          </label>
          {['gap-fill', 'summary-completion', 'table-completion', 'matching', 'map-labeling', 'choose-from-box', 'short-answer'].includes(q.type) && (
            <span className="tc-hint" style={{ margin: 0 }}>Use <code>|</code> for alternatives: <code>1912 | nineteen twelve</code></span>
          )}
        </div>

        {q.type === 'gap-fill' && gapCount > 0 ? (
          <div className="tc-answers-grid">
            {Array.from({ length: gapCount }).map((_, i) => (
              <div key={i} className="tc-answer-item">
                <span className="tc-answer-num">Q{(q.startNumber || 1) + i}</span>
                <input
                  className="tc-input"
                  value={(q.correctAnswers || [])[i] || ''}
                  onChange={e => {
                    const ca = [...(q.correctAnswers || [])]; ca[i] = e.target.value
                    update('correctAnswers', ca)
                  }}
                  placeholder="answer | alternative"
                />
              </div>
            ))}
          </div>
        ) : q.type === 'tfng' ? (
          <>
            {(() => {
              const stmts = (q.questionText || '').split('\n').filter(s => s.trim())
              const opts = q._tfngOptions || ['TRUE', 'FALSE', 'NOT GIVEN']
              const answers = (q.correctAnswer || '').split(',').map(s => s.trim())
              return stmts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stmts.map((stmt, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1.5px solid #d1fae5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: '#16a34a', color: '#fff', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>Q{(q.startNumber || 1) + i}</span>
                        <span style={{ fontSize: '12px', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stmt}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {opts.map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${answers[i] === opt ? '#16a34a' : '#e2e8f0'}`, background: answers[i] === opt ? '#16a34a' : '#f8fafc', color: answers[i] === opt ? '#fff' : '#64748b', transition: 'all 0.12s' }}>
                            <input type="radio" name={`tfng-${q.startNumber}-${i}`} checked={answers[i] === opt} onChange={() => {
                              const a = [...answers]; while (a.length <= i) a.push(''); a[i] = opt;
                              update('correctAnswer', a.join(', '))
                            }} style={{ display: 'none' }} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <span className="tc-hint">Add statements above, then select correct answers here.</span>
            })()}
          </>
        ) : (q.type === 'matching' || q.type === 'map-labeling' || q.type === 'choose-from-box') ? (
          <div className="tc-answers-grid">
            {(q.matchingItems || []).map((_, i) => (
              <div key={i} className="tc-answer-item">
                <span className="tc-answer-num">Q{(q.startNumber || 1) + i}</span>
                <input
                  className="tc-input"
                  value={(q.correctAnswers || [])[i] || ''}
                  onChange={e => {
                    const ca = [...(q.correctAnswers || [])]; ca[i] = e.target.value
                    update('correctAnswers', ca)
                  }}
                  placeholder="A  or  A | B"
                />
              </div>
            ))}
          </div>
        ) : q.type === 'matching-headings' ? (
          <div className="tc-answers-grid">
            {(q.matchingItems || []).map((paragraph, i) => (
              <div key={i} className="tc-answer-item">
                <span className="tc-answer-num">Q{(q.startNumber || 1) + i}</span>
                <select
                  className="tc-input"
                  value={(q.correctAnswers || [])[i] || ''}
                  onChange={e => {
                    const ca = [...(q.correctAnswers || [])]; ca[i] = e.target.value
                    update('correctAnswers', ca)
                  }}
                >
                  <option value="">— select heading —</option>
                  {(q.options || []).map((_, j) => {
                    const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][j] || String(j + 1)
                    return <option key={j} value={roman}>{roman}</option>
                  })}
                </select>
              </div>
            ))}
          </div>
        ) : q.type === 'mcq-multi' ? (
          <div className="tc-answers-grid">
            <span className="tc-hint" style={{ gridColumn: '1 / -1' }}>Enter the TWO correct letters (e.g. B and C)</span>
            {['First', 'Second'].map((label, i) => (
              <div key={i} className="tc-answer-item">
                <span className="tc-answer-num">{label}</span>
                <input
                  className="tc-input"
                  value={(q.correctAnswers || [])[i] ?? ''}
                  onChange={e => {
                    const ca = [...(q.correctAnswers || [])]; ca[i] = e.target.value.toUpperCase().slice(0, 1)
                    update('correctAnswers', ca)
                  }}
                  placeholder="A–E"
                />
              </div>
            ))}
          </div>
        ) : q.type === 'table-completion' ? (
          (() => {
            const rows = q.tableData?.rows || []
            const gapCount = rows.reduce((acc, row) => acc + (Array.isArray(row) ? row.reduce((a, c) => a + ((c || '').match(/\[gap\]/gi) || []).length, 0) : 0), 0)
            return gapCount > 0 ? (
              <div className="tc-answers-grid">
                {Array.from({ length: gapCount }).map((_, i) => (
                  <div key={i} className="tc-answer-item">
                    <span className="tc-answer-num">Q{(q.startNumber || 1) + i}</span>
                    <input
                      className="tc-input"
                      value={(q.correctAnswers || [])[i] || ''}
                      onChange={e => {
                        const ca = [...(q.correctAnswers || [])]; ca[i] = e.target.value
                        update('correctAnswers', ca)
                      }}
                      placeholder="ONE WORD"
                    />
                  </div>
                ))}
              </div>
            ) : <span className="tc-hint">Add [gap] in table rows above, then enter correct answers here.</span>
          })()
        ) : q.type === 'summary-phrase-bank' ? (
          (() => {
            const sc = (q.questionText || '').split(/\[gap\]/gi).length - 1
            const gapCount = Math.max(0, sc)
            return gapCount > 0 ? (
              <div className="tc-answers-grid">
                {Array.from({ length: gapCount }).map((_, i) => (
                  <div key={i} className="tc-answer-item">
                    <span className="tc-answer-num">Q{(q.startNumber || 1) + i}</span>
                    <input
                      className="tc-input"
                      value={(q.correctAnswers || [])[i] || ''}
                      onChange={e => {
                        const ca = [...(q.correctAnswers || [])]; ca[i] = e.target.value.toUpperCase().slice(0, 1)
                        update('correctAnswers', ca)
                      }}
                      placeholder="A–J"
                    />
                  </div>
                ))}
              </div>
            ) : <span className="tc-hint">Add [gap] in the summary above, then enter correct letters (A–J) here.</span>
          })()
        ) : (
          <>
            <input
              className="tc-input"
              value={q.correctAnswer || ''}
              onChange={e => update('correctAnswer', e.target.value)}
              placeholder={q.type === 'mcq' ? 'e.g. B' : 'e.g. 1912 | nineteen twelve (use | for alternatives)'}
            />
            {q.type === 'short-answer' && (
              <span className="tc-hint">
                Use | to allow multiple accepted spellings: e.g. 14 | fourteen | 14 employees
              </span>
            )}
          </>
        )}
      </div>

      <div className="tc-q-form-footer">
        <button className="tc-btn-ghost" onClick={onCancel}>Cancel</button>
        {onSaveAndRepeat && (
          <button className="tc-btn-save-repeat" onClick={onSaveAndRepeat}>
            + Save &amp; Add Another
          </button>
        )}
        <button className="tc-btn-save-q" onClick={onSave}>
          ✓ Save Question Block
        </button>
      </div>
    </div>
  )
}

// ─── SPEAKING QUESTION LIST ──────────────────────────────────────────────────
function SpeakingQuestionList({ value, onChange }) {
  // Store as local array so empty strings work correctly
  const [items, setItems] = useState(() => {
    const lines = value.split('\n').filter(Boolean)
    return lines.length > 0 ? lines : []
  })

  // Sync outward whenever items change
  const commit = (next) => {
    setItems(next)
    onChange(next.join('\n'))
  }

  const addQuestion = () => {
    const next = [...items, '']
    setItems(next)
    // Don't commit empty string — commit only when user types
    // But we still need passageContent to reflect state
    onChange([...items, ''].join('\n'))
  }

  const updateItem = (i, val) => {
    const next = [...items]
    next[i] = val
    commit(next)
  }

  const removeItem = (i) => {
    commit(items.filter((_, j) => j !== i))
  }

  const insertAfter = (i) => {
    const next = [...items]
    next.splice(i + 1, 0, '')
    setItems(next)
    onChange(next.join('\n'))
  }

  // Auto-focus last item when added
  useEffect(() => {
    if (items.length === 0) return
    const inputs = document.querySelectorAll('.tc-speaking-q-row .tc-input')
    const last = inputs[inputs.length - 1]
    if (last && last.value === '') last.focus()
  }, [items.length])

  if (items.length === 0) {
    return (
      <div>
        <div className="tc-speaking-empty">
          <span>No questions yet. Click "+ Add Question".</span>
        </div>
        <button className="tc-add-item-btn" style={{ marginTop: 8 }} onClick={addQuestion}>
          + Add Question
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="tc-speaking-qs">
        {items.map((line, i) => (
          <div key={i} className="tc-speaking-q-row">
            <span className="tc-option-num">{i + 1}</span>
            <input
              className="tc-input"
              value={line}
              onChange={e => updateItem(i, e.target.value)}
              placeholder="e.g. Do you work or study?"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); insertAfter(i) }
              }}
            />
            <button className="tc-remove-btn" onClick={() => removeItem(i)}>✕</button>
          </div>
        ))}
      </div>
      <button className="tc-add-item-btn" style={{ marginTop: 8 }} onClick={addQuestion}>
        + Add Question
      </button>
    </div>
  )
}

// ─── BULK MCQ IMPORT ─────────────────────────────────────────────────────────
/**
 * Parses a textarea of multiple MCQ questions:
 *
 *   What is the main topic of the lecture?
 *   A. Climate change
 *   B. Ocean pollution
 *   C. Solar energy
 *   D. Wildlife protection
 *   C
 *
 *   Second question text...
 *   A. ...
 *   Answer: B
 *
 * Rules:
 *  - Questions separated by one or more blank lines
 *  - Options: lines starting with A. / A) / (A) / A -
 *  - Answer: a lone letter line OR "Answer: X" / "ANSWER: X" / "*X"
 */
function parseBulkMCQ(raw, startNum, defaultInstruction) {
  // Normalize line endings
  const lines = raw.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim())

  // Option line: A. text / A) text / (A) text / A - text / A: text
  const OPT_RE = /^[(\[]?\s*([A-Ja-j])\s*[)\].:\-\u2013\u2014]\s*(.+)/i
  // Answer line: "C" / "Answer: C" / "Javob: C" / "*C"
  const ANS_RE = /^(?:(?:answer|javob|ans|to['']g['']ri|togri)\s*[:：]?\s*|\*\s*)?([A-Ja-j])\.?\s*$/i
  // New question start: line starts with number — "1.", "1)", "Q1.", "Q1)"
  const QNUM_RE = /^(?:q\s*)?\d+[.)]\s+\S/i

  const questions = []
  let qNum = startNum

  // State for current question being built
  let qText = []
  let opts = []
  let ans = ''
  let inOptions = false

  const flush = () => {
    const questionText = qText.join(' ').trim()
    if (!questionText && opts.length === 0) return
    if (opts.length === 0) return // skip if no options at all
    questions.push({
      type: 'mcq',
      questionNumber: qNum,
      startNumber: qNum,
      instructionText: defaultInstruction,
      questionText,
      options: opts,
      correctAnswer: ans,
      correctAnswers: [],
      matchingItems: [],
    })
    qNum++
    qText = []; opts = []; ans = ''; inOptions = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue // skip empty lines

    const optMatch = line.match(OPT_RE)
    const ansMatch = line.match(ANS_RE)
    const isNewQ = QNUM_RE.test(line)

    if (optMatch) {
      inOptions = true
      opts.push(optMatch[2].trim())
      continue
    }

    if (ansMatch && (inOptions || line.length <= 3)) {
      ans = ansMatch[1].toUpperCase()
      // Peek: if next non-empty line is a new question or option A, flush now
      const next = lines.slice(i + 1).find(l => l.trim())
      const nextIsNewQ = next && (QNUM_RE.test(next) || !next.match(OPT_RE))
      if (nextIsNewQ || i === lines.length - 1) flush()
      continue
    }

    if (isNewQ) {
      // Starting a new numbered question — flush previous if any options collected
      if (opts.length > 0 || qText.length > 0) flush()
      const stripped = line.replace(/^(?:q\s*)?\d+[.)]\s+/i, '')
      qText.push(stripped)
      continue
    }

    // Plain text line
    if (inOptions) {
      // Text after options but not an answer — treat as continuation of last option
      if (opts.length > 0) opts[opts.length - 1] += ' ' + line
    } else {
      qText.push(line)
    }
  }

  // Flush the last question
  flush()

  return questions
}

function BulkMCQImport({ getNextStart, defaultInstruction, onImport, onCancel }) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [instructionText, setInstructionText] = useState(defaultInstruction)
  const [customStart, setCustomStart] = useState(null) // null = use getNextStart()

  const effectiveStart = customStart !== null ? customStart : getNextStart()

  const handleParse = () => {
    const start = effectiveStart
    const questions = parseBulkMCQ(text, start, instructionText)
    setParsed(questions)
    if (customStart === null) setCustomStart(start)
  }

  // When admin changes the starting number, renumber all parsed questions in sequence
  const handleChangeStart = (val) => {
    const num = Math.max(1, parseInt(val) || 1)
    setCustomStart(num)
    if (parsed && parsed.length > 0) {
      let next = num
      setParsed(parsed.map(q => {
        const s = next++
        return { ...q, startNumber: s, questionNumber: s }
      }))
    }
  }

  const handleImport = () => {
    if (!parsed || parsed.length === 0) return
    onImport(parsed.map(q => ({ ...q, instructionText })), customStart)
  }

  const EXAMPLE = `What is the main topic of the talk?
A. Climate change
B. Ocean pollution
C. Solar energy
D. Wildlife protection
C

What does the speaker suggest about the new policy?
A. It will affect all employees
B. Only managers are involved
C. It starts next month
D. It needs extra training
Answer: A`

  return (
    <div className="tc-bulk-mcq-form">
      <div className="tc-q-form-header">
        <div>
          <span className="tc-q-type-badge" style={{ background: '#4f46e5' }}>BULK MCQ IMPORT</span>
          <span className="tc-q-form-title"> Paste multiple MCQ questions at once</span>
        </div>
        <button className="tc-close-btn" onClick={onCancel}>✕ Cancel</button>
      </div>

      <div className="tc-field" style={{ marginBottom: 12 }}>
        <label className="tc-label">Task Instruction (applied to all questions)</label>
        <input
          className="tc-input"
          value={instructionText}
          onChange={e => setInstructionText(e.target.value)}
          placeholder="Choose the correct letter, A, B, C or D."
        />
      </div>

      <div className="tc-field">
        <div className="tc-label-row">
          <label className="tc-label">Paste questions below (blank line between each)</label>
          <button className="tc-preset" style={{ fontSize: '11px' }} onClick={() => setText(EXAMPLE)}>
            Load example
          </button>
        </div>
        <textarea
          className="tc-textarea"
          rows={16}
          value={text}
          onChange={e => { setText(e.target.value); setParsed(null) }}
          placeholder={EXAMPLE}
          autoFocus
        />
        <span className="tc-hint">
          Format: question text → options (A. / A) / A-) → answer (lone letter or "Answer: B"). Blank line between questions.
        </span>
      </div>

      {/* Starting question number control */}
      <div className="tc-field-row" style={{ marginBottom: 12, alignItems: 'flex-end', gap: 12 }}>
        <div className="tc-field" style={{ maxWidth: 200, margin: 0 }}>
          <label className="tc-label">Starting Question Number</label>
          <input
            className="tc-input"
            type="number"
            min={1}
            value={effectiveStart}
            onChange={e => handleChangeStart(e.target.value)}
          />
          <span className="tc-hint">
            Auto: {getNextStart()} — change if needed
          </span>
        </div>
        {parsed && parsed.length > 0 && (
          <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600, paddingBottom: 4 }}>
            Q{parsed[0].startNumber} – Q{parsed[parsed.length - 1].startNumber}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <button
          className="tc-preset"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          👁 Preview ({text.trim() ? text.trim().split(/\n{2,}/).filter(b => b.trim()).length : 0} blocks detected)
        </button>
        <button
          className="tc-btn-save-q"
          style={{ fontSize: '13px', padding: '9px 22px' }}
          onClick={handleImport}
          disabled={!parsed || parsed.length === 0}
        >
          ✓ Import {parsed ? parsed.length : 0} Question{parsed?.length !== 1 ? 's' : ''}
        </button>
        <button className="tc-btn-ghost" style={{ fontSize: '12px' }} onClick={() => { setText(''); setParsed(null); setCustomStart(null) }}>
          Clear
        </button>
      </div>

      {parsed && (
        <div className="tc-bulk-mcq-preview">
          {parsed.length === 0 ? (
            <p className="tc-hint" style={{ color: '#dc2626' }}>No valid MCQ questions found. Check your format.</p>
          ) : (
            parsed.map((q, i) => (
              <div key={i} className="tc-bulk-mcq-preview-item">
                <div className="tc-bulk-mcq-preview-header">
                  <span className="tc-answer-num">Q{q.startNumber}</span>
                  {q.correctAnswer
                    ? <span className="tc-bulk-mcq-answer-badge">✓ {q.correctAnswer}</span>
                    : <span className="tc-bulk-mcq-no-answer">⚠ no answer</span>}
                </div>
                <p className="tc-bulk-mcq-qtext">{q.questionText || <em style={{ color: '#9ca3af' }}>no question text</em>}</p>
                <div className="tc-bulk-mcq-opts">
                  {q.options.filter(Boolean).map((opt, oi) => (
                    <span
                      key={oi}
                      className={`tc-bulk-mcq-opt${q.correctAnswer === String.fromCharCode(65 + oi) ? ' correct' : ''}`}
                    >
                      <strong>{String.fromCharCode(65 + oi)}</strong> {opt}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── BULK ANSWER PANEL ───────────────────────────────────────────────────────
function BulkAnswerPanel({ currentSection, onApply }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [open, setOpen] = useState(false)

  const parseText = (raw) => {
    const map = {}
    raw.split('\n').forEach(line => {
      const m = line.match(/^\s*(?:Q)?(\d+)\s*[.:)]\s*(.+)/i)
      if (m) map[parseInt(m[1])] = m[2].trim()
    })
    return map
  }

  const buildResults = (map) => {
    const results = []
    currentSection.questions.forEach(q => {
      const start = q.startNumber || q.questionNumber || 1

      if (q.type === 'gap-fill' || q.type === 'summary-completion') {
        const count = (q.questionText?.match(/\[gap\]/gi) || []).length
        const updates = []
        for (let i = 0; i < count; i++) { const n = start + i; if (map[n] !== undefined) updates.push({ num: n, ans: map[n] }) }
        if (updates.length) results.push({ q, updates, field: 'correctAnswers' })

      } else if (q.type === 'table-completion') {
        const rows = q.tableData?.rows || []
        const count = rows.reduce((a, row) => a + (Array.isArray(row) ? row.reduce((b, c) => b + ((c || '').match(/\[gap\]/gi) || []).length, 0) : 0), 0)
        const updates = []
        for (let i = 0; i < count; i++) { const n = start + i; if (map[n] !== undefined) updates.push({ num: n, ans: map[n] }) }
        if (updates.length) results.push({ q, updates, field: 'correctAnswers' })

      } else if (q.type === 'summary-phrase-bank') {
        const count = Math.max(0, (q.questionText?.split(/\[gap\]/gi) || []).length - 1)
        const updates = []
        for (let i = 0; i < count; i++) { const n = start + i; if (map[n] !== undefined) updates.push({ num: n, ans: map[n].toUpperCase().slice(0, 1) }) }
        if (updates.length) results.push({ q, updates, field: 'correctAnswers' })

      } else if (q.type === 'matching' || q.type === 'map-labeling' || q.type === 'choose-from-box' || q.type === 'matching-headings') {
        const count = (q.matchingItems || []).length
        const updates = []
        for (let i = 0; i < count; i++) { const n = start + i; if (map[n] !== undefined) updates.push({ num: n, ans: map[n] }) }
        if (updates.length) results.push({ q, updates, field: 'correctAnswers' })

      } else if (q.type === 'tfng') {
        const count = (q.questionText || '').split('\n').filter(s => s.trim()).length
        const updates = []
        for (let i = 0; i < count; i++) { const n = start + i; if (map[n] !== undefined) updates.push({ num: n, ans: map[n].toUpperCase() }) }
        if (updates.length) results.push({ q, updates, field: 'correctAnswer-csv' })

      } else {
        if (map[start] !== undefined) results.push({ q, updates: [{ num: start, ans: map[start] }], field: 'correctAnswer' })
      }
    })
    return results
  }

  const handleApply = () => {
    const map = parseText(text)
    const results = buildResults(map)
    const updatedQuestions = currentSection.questions.map(q => {
      const r = results.find(x => x.q === q)
      if (!r) return q
      if (r.field === 'correctAnswers') {
        const ca = [...(q.correctAnswers || [])]
        const start = q.startNumber || q.questionNumber || 1
        r.updates.forEach(({ num, ans }) => { ca[num - start] = ans })
        return { ...q, correctAnswers: ca }
      } else if (r.field === 'correctAnswer-csv') {
        const start = q.startNumber || q.questionNumber || 1
        const answers = (q.correctAnswer || '').split(',').map(s => s.trim())
        r.updates.forEach(({ num, ans }) => { const idx = num - start; while (answers.length <= idx) answers.push(''); answers[idx] = ans })
        return { ...q, correctAnswer: answers.join(', ') }
      } else {
        return { ...q, correctAnswer: r.updates[0].ans }
      }
    })
    onApply(updatedQuestions)
    setText('')
    setPreview(null)
    setOpen(false)
  }

  if (currentSection.questions.length === 0) return null

  return (
    <div className="tc-bulk-panel">
      <button className="tc-bulk-toggle" onClick={() => { setOpen(o => !o); setPreview(null) }}>
        <span className="tc-bulk-toggle-arrow">{open ? '▲' : '▼'}</span>
        <span>Bulk Answer Input</span>
        <span className="tc-bulk-toggle-hint">paste all answers at once</span>
      </button>
      {open && (
        <div className="tc-bulk-body">
          <p className="tc-hint" style={{ marginBottom: 8 }}>
            One answer per line: <code>1. A</code> &nbsp; <code>2. clothes</code> &nbsp; <code>3. 1912 | nineteen twelve</code>
          </p>
          <textarea
            className="tc-textarea"
            rows={8}
            placeholder={'1. A\n2. B\n3. clothes\n4. TRUE\n5. 1912 | nineteen twelve\n6. C\n...'}
            value={text}
            onChange={e => { setText(e.target.value); setPreview(null) }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button
              className="tc-preset"
              onClick={() => setPreview(buildResults(parseText(text)))}
              disabled={!text.trim()}
            >
              👁 Preview
            </button>
            <button
              className="tc-btn-save-q"
              style={{ fontSize: '13px', padding: '8px 20px' }}
              onClick={handleApply}
              disabled={!text.trim()}
            >
              ✓ Apply Answers
            </button>
            <button className="tc-btn-ghost" style={{ fontSize: '12px' }} onClick={() => { setText(''); setPreview(null) }}>
              Clear
            </button>
          </div>
          {preview && (
            <div className="tc-bulk-preview">
              <strong className="tc-bulk-preview-title">
                {preview.length > 0
                  ? `${preview.length} block${preview.length !== 1 ? 's' : ''} will be updated:`
                  : 'No matching question numbers found in this section.'}
              </strong>
              {preview.map((r, i) => (
                <div key={i} className="tc-bulk-result-row">
                  <span className="tc-bulk-q-label">Q{r.q.startNumber} · {r.q.type.replace(/-/g, ' ')}</span>
                  <div className="tc-bulk-tags">
                    {r.updates.map(({ num, ans }) => (
                      <span key={num} className="tc-bulk-tag">
                        Q{num} → <strong>{ans}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── QUESTION CARD (compact display of saved block) ─────────────────────────
const TYPE_COLORS = {
  'mcq': '#4f46e5',
  'mcq-multi': '#6366f1',
  'gap-fill': '#0891b2',
  'matching': '#059669',
  'map-labeling': '#d97706',
  'tfng': '#dc2626',
  'short-answer': '#7c3aed',
  'table-completion': '#0f766e',
  'summary-completion': '#6d28d9',
  'summary-phrase-bank': '#5b21b6',
  'matching-headings': '#0369a1',
  'choose-from-box': '#be185d',
}

function QuestionCard({ q, qi, onEdit, onDuplicate, onRemove }) {
  const gapCount = (q.questionText?.match(/\[gap\]/gi) || []).length
  const itemCount = (q.matchingItems || []).length
  const tableGaps = q.type === 'table-completion' && q.tableData?.rows
    ? q.tableData.rows.reduce((a, row) => a + (Array.isArray(row) ? row.reduce((b, c) => b + ((c || '').match(/\[gap\]/gi) || []).length, 0) : 0), 0)
    : 0
  const count = q.type === 'gap-fill' || q.type === 'summary-phrase-bank' ? gapCount
    : q.type === 'table-completion' ? (tableGaps || 1)
      : q.type === 'mcq-multi' ? 2
        : (q.type === 'matching' || q.type === 'map-labeling' || q.type === 'choose-from-box') ? itemCount : 1
  const end = (q.startNumber || 1) + Math.max(count, 1) - 1
  const range = count > 1
    ? `Q${q.startNumber}–${end}`
    : `Q${q.startNumber || 1}`

  const preview = q.instructionText || q.questionText?.substring(0, 90) || '(no preview)'

  return (
    <div className="tc-q-card">
      <div className="tc-q-card-left">
        <span className="tc-q-range">{range}</span>
        <span className="tc-q-type" style={{ background: TYPE_COLORS[q.type] || '#64748b' }}>
          {q.type.replace(/-/g, ' ')}
        </span>
      </div>
      <div className="tc-q-card-center">
        <span className="tc-q-preview">{preview}</span>
      </div>
      <div className="tc-q-card-actions">
        <button className="tc-q-edit-btn" onClick={onEdit}>Edit</button>
        <button className="tc-q-dup-btn" onClick={onDuplicate} title="Duplicate this block">⧉</button>
        <button className="tc-q-remove-btn" onClick={onRemove}>✕</button>
      </div>
    </div>
  )
}
