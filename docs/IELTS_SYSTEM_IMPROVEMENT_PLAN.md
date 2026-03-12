# IELTS Mock Test Platform – Comprehensive Improvement Plan
**Date:** February 11, 2026  
**Status:** Production-Ready System Architecture

---

## 📋 EXECUTIVE SUMMARY

Your current system has good foundational components but needs critical improvements in:
1. **Image handling** (missing upload/display in questions)
2. **Exam authenticity** (not matching real IELTS paper-based format)
3. **Test lifecycle** (no approval/visibility control)
4. **Admin features** (weak user management)
5. **Security** (weak authentication & password management)
6. **Question types** (incomplete True/False/Not Given implementation)

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue 1: Image Upload/Display in Questions
**Problem:**
- Admin cannot reliably upload images for Picture Choice, Diagrams, Maps, etc.
- No storage system for images (no database relation to questions)
- Images not persisted or retrieved properly

**Impact:** Students cannot take picture-choice or diagram-labelling questions

**Solution Path:**
- Implement image storage (local file or cloud: AWS S3, Cloudinary, etc.)
- Store image URLs in database alongside question objects
- Add proper error handling for failed uploads

### Issue 2: Test Visibility & Approval System
**Problem:**
- No distinction between "draft" and "published" tests
- Tests become visible immediately upon creation
- No admin approval workflow

**Impact:** Incomplete tests accidentally visible to students; no quality control

**Solution Path:**
- Add `status` field to test objects: `draft` | `pending_review` | `approved` | `rejected`
- Admins see all tests; users see only `approved` tests
- Add review/approval UI in admin dashboard

### Issue 3: Authentication & Authorization
**Problem:**
- Single login route (no separate admin/user paths)
- No role-based access control (RBAC)
- Passwords not hashed (security risk)
- No password change feature

**Impact:** Admin actions accessible to regular users; password theft risk

**Solution Path:**
- Implement separate `/login` (user) and `/admin/login` (admin) routes
- Add JWT role-based middleware on backend
- Hash passwords with bcrypt; implement password change endpoint
- Add permission checks on protected routes

### Issue 4: Exam Layout Not Matching Real IELTS
**Problem:**
- No clear section headers (Section 1–4)
- Questions don't follow IELTS numbering (1–40 across sections)
- No official spacing/typography
- Modern web UI instead of paper-based presentation

**Impact:** Students get confused; practice doesn't match real exam format

**Solution Path:**
- Redesign Listening/Reading pages to mimic real IELTS paper layout
- Add section headers with context
- Use proper typography (serif fonts for passages, numbered questions)
- Add progress indicator (Questions 1–10, 11–20, etc.)

### Issue 5: True/False/Not Given Confusion
**Problem:**
- The difference between FALSE and NOT GIVEN is unclear
- No visual distinction or helpful hints
- Can confuse students

**Impact:** Students misunderstand question type; poor learning

**Solution Path:**
- Add clear legend: FALSE (statement contradicts text) vs NOT GIVEN (info not in text)
- Visual buttons instead of text dropdown
- Add practice explanation modal

---

## ✅ IMPLEMENTATION ROADMAP

### PHASE 1: Backend Foundation (Database + API)
**Duration:** 1-2 days

#### 1.1 Database Schema Updates (MongoDB/PostgreSQL)

```javascript
// User Schema
{
  _id: ObjectId,
  email: String (unique),
  firstName: String,
  lastName: String,
  passwordHash: String, // hashed with bcrypt
  role: Enum("user", "admin"),
  status: Enum("active", "blocked"),
  registrationDate: Date,
  attempts: Array, // [{ testId, score, date }]
  createdAt: Date,
  updatedAt: Date
}

// Test Schema (Full Exam)
{
  _id: ObjectId,
  testCode: String (e.g., "IELTS-2026-02-001"),
  title: String,
  description: String,
  status: Enum("draft", "pending_review", "approved", "rejected"),
  
  listeningModule: {
    sections: Array[{
      sectionNumber: Number (1-4),
      audioUrl: String,
      audioScript: String,
      questions: Array[Question]
    }]
  },
  
  readingModule: {
    passages: Array[{
      passageNumber: Number (1-3),
      title: String,
      content: String,
      questions: Array[Question]
    }]
  },
  
  writingModule: {
    task1: { instruction: String, imageUrl: String, type: String },
    task2: { instruction: String }
  },
  
  createdBy: ObjectId (admin user),
  approvedBy: ObjectId (admin user, if approved),
  approvalDate: Date,
  createdAt: Date,
  updatedAt: Date
}

// Question Schema (Generic)
{
  questionNumber: Number (1-40 for listening/reading),
  questionType: String (mcq-single, picture-choice, tfng, form-completion, etc.),
  questionText: String,
  section: Number (1-4 for listening; 1-3 for reading),
  
  // Conditional fields based on questionType
  options: Array, // for MCQ
  pictureOptions: Array[{url: String, index: Number}], // for picture-choice
  imageUrl: String, // for diagram/map labelling
  template: String, // for form/note/table completion
  correctAnswer: String or Array or Object, // format depends on type
  
  points: Number,
  difficulty: String ("easy", "medium", "hard"),
  skillTags: Array
}

// Test Attempt Schema
{
  _id: ObjectId,
  testId: ObjectId,
  userId: ObjectId,
  startDate: Date,
  endDate: Date,
  duration: Number (seconds),
  answers: Object, // { questionId: answer, ... }
  score: Number,
  scorePercentage: Number,
  status: Enum("in-progress", "submitted", "graded"),
  createdAt: Date
}
```

#### 1.2 Backend API Endpoints

```javascript
// AUTH
POST /api/auth/login-user          // User login
POST /api/auth/login-admin          // Admin login
POST /api/auth/register             // User registration
POST /api/auth/change-password       // Change password (both user & admin)
POST /api/auth/logout               // Logout
GET  /api/auth/verify-token         // Verify JWT

// TESTS (Admin)
POST /api/tests                      // Create new test
GET  /api/tests                      // List all tests (admin sees all; user sees approved)
GET  /api/tests/:id                  // Get test details
PUT  /api/tests/:id                  // Update test
PATCH /api/tests/:id/approve         // Approve test (admin only)
PATCH /api/tests/:id/reject          // Reject test (admin only)
DELETE /api/tests/:id                // Delete test (admin only)

// IMAGES & FILE UPLOAD
POST /api/upload                     // Upload image/audio (returns URL)
DELETE /api/files/:id                // Delete uploaded file

// TEST ATTEMPTS (User)
POST /api/attempts                   // Start test
GET  /api/attempts/:id               // Get attempt details
PUT  /api/attempts/:id/submit        // Submit test
GET  /api/user/attempts              // Get user's test history

// USERS (Admin Dashboard)
GET  /api/users                      // List all users (admin only)
GET  /api/users/:id                  // Get user details
PATCH /api/users/:id/status          // Block/activate user (admin only)
DELETE /api/users/:id                // Delete user (admin only)
```

---

### PHASE 2: Frontend – Listening Module Redesign

#### 2.1 Real IELTS Listening Format

**File:** `src/pages/ListeningExam.jsx` (new, replaces Listening.jsx)

```jsx
import React, { useState, useEffect } from 'react'
import '../styles/listening-exam.css'

export default function ListeningExam() {
  const [test, setTest] = useState(null)
  const [section, setSection] = useState(1)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [audioStatus, setAudioStatus] = useState('ready') // ready, playing, paused

  // Render question based on type
  const renderQuestion = (q) => {
    switch(q.questionType) {
      case 'picture-choice':
        return <PictureChoiceQuestion question={q} answer={answers[q.questionNumber]} onChange={(ans) => setAnswers({...answers, [q.questionNumber]: ans})} />
      case 'mcq-single':
        return <MCQSingleQuestion question={q} answer={answers[q.questionNumber]} onChange={(ans) => setAnswers({...answers, [q.questionNumber]: ans})} />
      case 'tfng':
        return <TFNGQuestion question={q} answer={answers[q.questionNumber]} onChange={(ans) => setAnswers({...answers, [q.questionNumber]: ans})} />
      case 'form-completion':
        return <FormCompletionQuestion question={q} answer={answers[q.questionNumber]} onChange={(ans) => setAnswers({...answers, [q.questionNumber]: ans})} />
      case 'matching':
        return <MatchingQuestion question={q} answer={answers[q.questionNumber]} onChange={(ans) => setAnswers({...answers, [q.questionNumber]: ans})} />
      case 'diagram-labelling':
        return <DiagramLabellingQuestion question={q} answer={answers[q.questionNumber]} onChange={(ans) => setAnswers({...answers, [q.questionNumber]: ans})} />
      default:
        return <p>Unknown question type</p>
    }
  }

  return (
    <div className="listening-exam-container">
      {/* IELTS Paper Header */}
      <header className="exam-header">
        <div className="header-badge">IELTS Listening Test</div>
        <h1>International English Language Testing System</h1>
        <p className="exam-code">Test Code: {test?.testCode} | Time: {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</p>
      </header>

      {/* Section Navigation */}
      <nav className="section-nav">
        {[1, 2, 3, 4].map(s => (
          <button key={s} className={`section-btn ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
            Section {s}
          </button>
        ))}
      </nav>

      {/* Audio Player */}
      <section className="audio-section">
        <h2>Section {section}</h2>
        <audio controls src={getCurrentAudio()} className="audio-player" />
        <p className="audio-hint">Listen to the audio and answer questions below. You have 30 minutes.</p>
      </section>

      {/* Questions List (Official Numbering 1-40) */}
      <section className="questions-section">
        {test?.listeningModule?.sections[section-1]?.questions?.map((q, idx) => (
          <div key={q.questionNumber} className="question-block ielts-paper">
            <div className="question-number">{q.questionNumber}.</div>
            <div className="question-content">
              {renderQuestion(q)}
            </div>
          </div>
        ))}
      </section>

      {/* Submit Button */}
      <footer className="exam-footer">
        <button className="btn-submit">Submit Test</button>
      </footer>
    </div>
  )
}

// TFNG Component with Clear Instructions
function TFNGQuestion({ question, answer, onChange }) {
  return (
    <div className="tfng-question">
      <p className="question-text">{question.questionText}</p>
      <div className="tfng-legend">
        <small>
          <strong>TRUE</strong> = Statement agrees with information in passage<br/>
          <strong>FALSE</strong> = Statement contradicts information in passage<br/>
          <strong>NOT GIVEN</strong> = Information not mentioned in passage
        </small>
      </div>
      <div className="tfng-buttons">
        {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
          <button
            key={opt}
            className={`tfng-btn ${answer === opt ? 'selected' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function PictureChoiceQuestion({ question, answer, onChange }) {
  return (
    <div className="picture-choice-question">
      <p className="question-text">{question.questionText}</p>
      <div className="picture-grid-student">
        {question.pictureOptions.map((pic, idx) => (
          <label key={idx} className={`picture-option ${answer === idx ? 'selected' : ''}`}>
            <input type="radio" name={`q${question.questionNumber}`} value={idx} onChange={(e) => onChange(parseInt(e.target.value))} />
            <img src={pic} alt={`Option ${String.fromCharCode(65+idx)}`} />
            <span className="picture-label">{String.fromCharCode(65+idx)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Similar components for MCQ, Form Completion, Matching, etc.
```

**CSS:** `src/styles/listening-exam.css`

```css
.listening-exam-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: #ffffff;
  font-family: 'Calibri', 'Arial', sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
}

.exam-header {
  text-align: center;
  border-bottom: 2px solid #0066cc;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

.exam-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0066cc;
  margin: 0.5rem 0;
}

.exam-code {
  font-size: 0.9rem;
  color: #666;
  margin: 0.5rem 0 0 0;
}

/* TFNG styling */
.tfng-legend {
  background: #f5f5f5;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  border-left: 3px solid #0066cc;
  font-size: 0.85rem;
}

.tfng-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.tfng-btn {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.tfng-btn.selected {
  border-color: #0066cc;
  background: #e6f0ff;
  color: #0066cc;
}

/* Picture Grid */
.picture-grid-student {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.picture-option {
  position: relative;
  border: 2px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.picture-option input {
  display: none;
}

.picture-option img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.picture-label {
  position: absolute;
  top: 5px;
  left: 5px;
  background: #333;
  color: white;
  padding: 3px 6px;
  border-radius: 3px;
  font-weight: 800;
  font-size: 0.85rem;
}

.picture-option.selected {
  border-color: #0066cc;
  box-shadow: 0 0 0 3px #e6f0ff;
}

.question-block {
  margin: 1.5rem 0;
  padding: 1rem;
  border-left: 3px solid #0066cc;
  background: #f9f9f9;
}

.question-number {
  display: inline;
  font-weight: 800;
  margin-right: 0.5rem;
}
```

---

### PHASE 3: Frontend – Reading Module
**Same principles as Listening, but:**
- Passages displayed on left; questions on right (side-by-side)
- Larger passages (serif font)
- Easy paragraph reference (e.g., "Paragraph A–C")

---

### PHASE 4: Admin Improvements

#### 4.1 Admin User Management Dashboard

**File:** `src/pages/admin/AdminUsers.jsx` (new)

```jsx
import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import '../../styles/admin-users.css'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, blocked

  useEffect(() => {
    api('/users').then(setUsers).catch(err => console.error(err))
  }, [])

  const filteredUsers = users.filter(u => filter === 'all' || u.status === filter)

  const handleBlockUser = async (userId) => {
    await api(`/users/${userId}/status`, 'PATCH', { status: 'blocked' })
    setUsers(users.map(u => u._id === userId ? {...u, status: 'blocked'} : u))
  }

  return (
    <div className="admin-users-container">
      <h2>User Management</h2>
      
      <div className="filter-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All Users ({users.length})
        </button>
        <button className={`filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
          Active ({users.filter(u => u.status === 'active').length})
        </button>
        <button className={`filter-btn ${filter === 'blocked' ? 'active' : ''}`} onClick={() => setFilter('blocked')}>
          Blocked ({users.filter(u => u.status === 'blocked').length})
        </button>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Registered</th>
            <th>Test Attempts</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user._id} onClick={() => setSelectedUser(user)} className={selectedUser?._id === user._id ? 'selected' : ''}>
              <td><strong>{user.firstName} {user.lastName}</strong></td>
              <td>{user.email}</td>
              <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
              <td>{user.attempts?.length || 0}</td>
              <td>
                <span className={`status-badge ${user.status}`}>
                  {user.status === 'active' ? '✓ Active' : '✗ Blocked'}
                </span>
              </td>
              <td>
                <button className="btn-action" onClick={(e) => {
                  e.stopPropagation()
                  handleBlockUser(user._id)
                }}>
                  {user.status === 'active' ? 'Block' : 'Unblock'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div className="user-details-panel">
          <h3>User Details</h3>
          <div className="detail-row">
            <strong>Full Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
          </div>
          <div className="detail-row">
            <strong>Email:</strong> {selectedUser.email}
          </div>
          <div className="detail-row">
            <strong>Registered:</strong> {new Date(selectedUser.registrationDate).toLocaleDateString()}
          </div>
          <div className="detail-row">
            <strong>Status:</strong> {selectedUser.status}
          </div>
          <div className="detail-row">
            <strong>Test Attempts:</strong> {selectedUser.attempts?.length || 0}
          </div>
          {selectedUser.attempts && selectedUser.attempts.length > 0 && (
            <div className="attempts-history">
              <h4>Recent Attempts</h4>
              {selectedUser.attempts.slice(-5).map((attempt, idx) => (
                <div key={idx} className="attempt-item">
                  {attempt.testName} - Score: {attempt.score}% - {new Date(attempt.date).toLocaleDateString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

### PHASE 5: Test Approval Workflow

**File:** `src/pages/admin/AdminTestApproval.jsx` (new)

```jsx
export default function AdminTestApproval() {
  const [tests, setTests] = useState([])
  const [filter, setFilter] = useState('pending_review') // draft, pending_review, approved, rejected

  const approveTest = async (testId) => {
    await api(`/tests/${testId}/approve`, 'PATCH', {})
    // Refresh tests
  }

  const rejectTest = async (testId, reason) => {
    await api(`/tests/${testId}/reject`, 'PATCH', { reason })
  }

  return (
    <div className="test-approval-container">
      <h2>Test Approval Workflow</h2>
      {/* Status filters */}
      {/* List tests by status with approve/reject buttons */}
    </div>
  )
}
```

---

### PHASE 6: Security Implementation

#### 6.1 Backend Password Hashing (Node.js Example)

```javascript
// Backend: /api/auth
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Save user with hashed password
  const user = await User.create({
    email,
    passwordHash: hashedPassword,
    firstName,
    lastName,
    role: 'user',
    status: 'active'
  })
  
  res.json({ message: 'User registered', userId: user._id })
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  
  // Compare password
  const validPassword = await bcrypt.compare(password, user.passwordHash)
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' })
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
  
  res.json({ token, user: { ...user, passwordHash: undefined } })
}

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const userId = req.user.userId // From JWT middleware
  
  const user = await User.findById(userId)
  const validOldPassword = await bcrypt.compare(oldPassword, user.passwordHash)
  
  if (!validOldPassword) return res.status(401).json({ error: 'Old password incorrect' })
  
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await user.save()
  
  res.json({ message: 'Password changed' })
}
```

#### 6.2 Frontend Password Change (React)

```jsx
// src/pages/ChangePassword.jsx
export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }

    try {
      await api('/auth/change-password', 'POST', { oldPassword, newPassword })
      setMessage('✓ Password changed successfully')
    } catch (err) {
      setMessage('✗ ' + err.message)
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="change-password-form">
      <input type="password" placeholder="Current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
      <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      <button type="submit">Change Password</button>
      {message && <p className={message.startsWith('✓') ? 'success' : 'error'}>{message}</p>}
    </form>
  )
}
```

---

## 📊 IMPLEMENTATION PRIORITY

### Week 1 (Critical)
- [ ] Backend: User schema + password hashing
- [ ] Backend: Test approval workflow
- [ ] Frontend: IELTS Listening exam layout
- [ ] Frontend: TFNG component with clear instructions

### Week 2 (High)
- [ ] Backend: Image upload API
- [ ] Frontend: Image display in questions
- [ ] Frontend: Reading module redesign
- [ ] Admin: User management dashboard

### Week 3 (Medium)
- [ ] Admin: Test approval UI
- [ ] Password change functionality
- [ ] Admin/User separate login pages
- [ ] Test visibility based on approval status

---

## 🎯 KEY METRICS FOR SUCCESS

- ✅ Listening questions display images correctly
- ✅ TFNG clarity: 100% of students understand difference
- ✅ Exam layout matches real IELTS paper
- ✅ Admins can approve/reject tests before visibility
- ✅ User management functional and clear
- ✅ Passwords securely hashed (bcrypt)
- ✅ Separate admin/user authentication flows
- ✅ No production security vulnerabilities (OWASP Top 10)

---

## ⚠️ NEXT STEPS

1. **Confirm backend framework** (Express, Django, etc.)
2. **Choose image storage** (local, AWS S3, Cloudinary, etc.)
3. **Set up database schema** from templates above
4. **Implement Phase 1** (backend foundation)
5. **Deploy and test** with real data

---

**Owner:** IELTS System Architect  
**Last Updated:** Feb 11, 2026  
**Status:** Ready for Implementation
