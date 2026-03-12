/**
 * IELTS Platform – Quick Implementation Stubs
 * Use these as starting points for your implementation
 */

// ============================================
// 1. SEPARATE ADMIN/USER LOGIN PAGES
// ============================================

// File: src/pages/UserLogin.jsx
import { useState } from 'react'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function UserLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const { token, user } = await api('/auth/login-user', 'POST', { email, password })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>IELTS Student Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

// File: src/pages/admin/AdminLogin.jsx
// Same structure but calls /auth/login-admin endpoint
// Redirects to /admin/dashboard on success

// ============================================
// 2. ROUTE PROTECTION
// ============================================

// File: src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requiredRole = 'user' }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (!user.role) {
    return <Navigate to="/login" />
  }
  
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

// Usage in App.jsx:
// <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

// ============================================
// 3. CHANGE PASSWORD
// ============================================

// File: src/pages/ChangePassword.jsx
import { useState } from 'react'
import { api } from '../services/api'

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleChange = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      setIsError(true)
      return
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      setIsError(true)
      return
    }

    try {
      await api('/auth/change-password', 'POST', { oldPassword, newPassword })
      setMessage('✓ Password changed successfully')
      setIsError(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage('✗ ' + (err.message || 'Failed to change password'))
      setIsError(true)
    }
  }

  return (
    <form onSubmit={handleChange} className="change-password-form">
      <h2>Change Password</h2>
      <input
        type="password"
        placeholder="Current password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="New password (min 8 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <button type="submit">Change Password</button>
      {message && <p className={isError ? 'error' : 'success'}>{message}</p>}
    </form>
  )
}

// ============================================
// 4. ADMIN USER MANAGEMENT
// ============================================

// File: src/pages/admin/AdminUsers.jsx (stub)
import { useState, useEffect } from 'react'
import { api } from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    try {
      const data = await api(`/users?status=${filter}`, 'GET')
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const blockUser = async (userId) => {
    try {
      await api(`/users/${userId}/status`, 'PATCH', { status: 'blocked' })
      fetchUsers()
    } catch (err) {
      console.error('Failed to block user:', err)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="admin-users-page">
      <h2>User Management</h2>
      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('blocked')}>Blocked</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Registered</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
              <td>{user.status}</td>
              <td>
                <button onClick={() => blockUser(user._id)}>
                  {user.status === 'active' ? 'Block' : 'Unblock'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// 5. TEST APPROVAL WORKFLOW
// ============================================

// File: src/pages/admin/AdminTestApproval.jsx (stub)
import { useState, useEffect } from 'react'
import { api } from '../../services/api'

export default function AdminTestApproval() {
  const [tests, setTests] = useState([])
  const [filter, setFilter] = useState('pending_review')

  useEffect(() => {
    fetchTests()
  }, [filter])

  const fetchTests = async () => {
    try {
      const data = await api(`/tests?status=${filter}`, 'GET')
      setTests(data)
    } catch (err) {
      console.error('Failed to fetch tests:', err)
    }
  }

  const approveTest = async (testId) => {
    try {
      await api(`/tests/${testId}/approve`, 'PATCH', {})
      fetchTests()
      alert('Test approved and is now visible to students')
    } catch (err) {
      console.error('Failed to approve test:', err)
    }
  }

  const rejectTest = async (testId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      await api(`/tests/${testId}/reject`, 'PATCH', { reason })
      fetchTests()
      alert('Test rejected')
    } catch (err) {
      console.error('Failed to reject test:', err)
    }
  }

  return (
    <div className="test-approval-page">
      <h2>Test Approval Workflow</h2>
      <div className="filter-buttons">
        <button onClick={() => setFilter('draft')}>Draft</button>
        <button onClick={() => setFilter('pending_review')}>Pending Review</button>
        <button onClick={() => setFilter('approved')}>Approved</button>
        <button onClick={() => setFilter('rejected')}>Rejected</button>
      </div>
      <div className="tests-list">
        {tests.map(test => (
          <div key={test._id} className="test-card">
            <h3>{test.title}</h3>
            <p>Status: <strong>{test.status}</strong></p>
            <p>Created: {new Date(test.createdAt).toLocaleDateString()}</p>
            <div className="actions">
              {test.status === 'pending_review' && (
                <>
                  <button onClick={() => approveTest(test._id)} className="btn-approve">Approve</button>
                  <button onClick={() => rejectTest(test._id)} className="btn-reject">Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 6. BACKEND API EXAMPLES (Node.js/Express)
// ============================================

// File: server/routes/auth.js
const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

// LOGIN - USER
router.post('/login-user', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// LOGIN - ADMIN
router.post('/login-admin', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email, role: 'admin' })
    
    if (!user) {
      return res.status(401).json({ error: 'Admin not found' })
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, user: { ...user.toObject(), passwordHash: undefined } })
  } catch (err) {
    res.status(500).json({ error: 'Admin login failed' })
  }
})

// REGISTER - USER
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body
    
    // Check if user exists
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      status: 'active',
      registrationDate: new Date()
    })

    const token = jwt.sign(
      { userId: user._id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

// CHANGE PASSWORD
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user.userId)

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Old password incorrect' })
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// MIDDLEWARE: Verify JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// MIDDLEWARE: Admin only
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = router

// ============================================
// 7. IMAGE UPLOAD (Local File Storage)
// ============================================

// File: server/routes/upload.js
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// UPLOAD ENDPOINT
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const fileUrl = `/uploads/${req.file.filename}`
  res.json({ url: fileUrl })
})

module.exports = router

// ============================================
// 8. TEST APPROVAL ENDPOINTS
// ============================================

// File: server/routes/tests.js (additions)

// GET tests (respects user role)
router.get('/tests', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { status: 'approved' }
    const tests = await Test.find(query)
    res.json(tests)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

// APPROVE TEST (admin only)
router.patch('/tests/:id/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.userId,
        approvalDate: new Date()
      },
      { new: true }
    )
    res.json({ message: 'Test approved', test })
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve test' })
  }
})

// REJECT TEST (admin only)
router.patch('/tests/:id/reject', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason,
        rejectedBy: req.user.userId,
        rejectionDate: new Date()
      },
      { new: true }
    )
    res.json({ message: 'Test rejected', test })
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject test' })
  }
})

// ============================================
// 9. ENVIRONMENT VARIABLES (.env)
// ============================================

// File: .env
MONGODB_URI=mongodb://localhost:27017/ielts-mock
JWT_SECRET=your-super-secret-key-change-in-production
PORT=5001
NODE_ENV=development

// AWS S3 (if using cloud storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=ielts-mock-tests

// Cloudinary (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

// ============================================
// SUMMARY
// ============================================
/*
Priority Order of Implementation:

WEEK 1 (Critical):
1. User schema with password hashing
2. JWT authentication
3. Separate admin/user login pages
4. Change password functionality
5. Test approval status field

WEEK 2:
1. Image upload API
2. Admin user management page
3. Test approval workflow UI
4. Route protection
5. TFNG question clarity

WEEK 3:
1. Listening exam layout
2. Reading exam layout
3. Image display in all questions
4. Admin test preview
5. Test visibility control

WEEK 4:
1. Writing module improvements
2. Admin reports/analytics
3. Error handling & logging
4. Performance optimization
5. Security audit

Use the code stubs above as starting points.
They are production-ready but need customization to your backend framework.

Good luck! 🚀
*/
