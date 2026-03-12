# 🚀 IELTS System Improvement – Implementation Checklist

## Phase 1: Critical Backend Foundation (Weeks 1-2)

### Database & Authentication
- [ ] Update User schema with:
  - Password hashing (bcrypt)
  - Role field (admin/user)
  - Status field (active/blocked)
  - Registration date tracking
  - Test attempts history

- [ ] Update Test schema with:
  - Status field: `draft | pending_review | approved | rejected`
  - Created/Updated timestamps
  - CreatedBy (admin reference)
  - ApprovedBy (admin reference)

- [ ] Update Question schema with:
  - Support for all question types
  - Image URL storage (pictureOptions, imageUrl)
  - Proper answer format per type

### API Implementation
- [ ] `POST /api/auth/login-user` - User login
- [ ] `POST /api/auth/login-admin` - Admin separate login
- [ ] `POST /api/auth/register` - User registration with password hash
- [ ] `POST /api/auth/change-password` - Change password (both roles)
- [ ] `POST /api/upload` - Image/audio file upload
- [ ] `PATCH /api/tests/:id/approve` - Admin test approval
- [ ] `PATCH /api/tests/:id/reject` - Admin test rejection
- [ ] `GET /api/tests` - Show approved tests to users, all to admins
- [ ] `GET /api/users` - Admin user list
- [ ] `PATCH /api/users/:id/status` - Block/unblock user

### JWT & Middleware
- [ ] Implement JWT token generation with role
- [ ] Create RBAC middleware for admin-only routes
- [ ] Add token verification on all protected endpoints
- [ ] Implement refresh token (optional but recommended)

---

## Phase 2: Frontend – Real Exam Layout (Weeks 2-3)

### Listening Module (NEW)
- [ ] Create `ListeningExam.jsx` (replaces Listening.jsx)
  - Section-based navigation (1-4)
  - Official IELTS header with test code
  - Timer countdown (clear warning at <1 min)
  - Question numbering (1-40 across sections)
  - Audio player per section

- [ ] Implement Question Type Components:
  - [x] TFNG (with clear TRUE/FALSE/NOT GIVEN legend)
  - [x] Picture Choice (grid layout with A/B/C/D labels)
  - [x] MCQ Single & Multiple
  - [x] Form/Note/Table Completion (with template rendering)
  - [x] Matching
  - [x] Diagram/Map Labelling (with image display)
  - [x] Short Answer
  - [x] Sentence Completion
  - [x] Classification

- [ ] Add `listening-exam.css` (paper-based styling)
  - Official IELTS color scheme (#0066cc blue)
  - Clean white background
  - Proper spacing (1.5 line-height)
  - Font: Calibri or Arial (official exam font)
  - Responsive design + print-friendly

### Reading Module
- [ ] Create `ReadingExam.jsx` (similar to Listening)
  - Passages displayed on left (scrollable, serif font)
  - Questions on right (sticky on desktop)
  - Side-by-side layout for real exam feel
  - Passage numbering (1-3)
  - Questions linked to passages

- [ ] Implement Reading question types:
  - TFNG (with same clarity improvements)
  - MCQ
  - Matching
  - Heading matching
  - Sentence completion
  - Short answer

- [ ] Add `reading-exam.css` (two-column layout, passage styling)

### Writing Module (Optional Enhancement)
- [ ] Improve Writing task layout
- [ ] Add task instructions clarity
- [ ] Add word count tracker
- [ ] Add timer for writing tasks

---

## Phase 3: Admin Dashboard Improvements (Week 3)

### Admin User Management
- [ ] Create `AdminUsers.jsx`
  - User list with filters (all/active/blocked)
  - Table: Name, Email, Registration Date, Attempts, Status
  - Click user for detailed view
  - Block/Unblock button
  - View user test history

- [ ] Create `AdminUserDetails.jsx` (modal/page)
  - Full user information
  - All test attempts with scores
  - Ability to delete user

### Admin Test Approval
- [ ] Create `AdminTestApproval.jsx`
  - List tests by status: draft, pending, approved, rejected
  - Preview test before approval
  - Approve with confirmation
  - Reject with reason field
  - Publish only approved tests

- [ ] Add approval workflow UI to Admin Dashboard

### Admin Reports (Optional)
- [ ] Dashboard statistics:
  - Total users
  - Total tests created
  - Tests pending review
  - Average user score
  - Most attempted test

---

## Phase 4: Security & Authentication (Week 4)

### Frontend Auth Pages
- [ ] Separate `UserLogin.jsx` and `AdminLogin.jsx`
  - Different routes: `/login` vs `/admin/login`
  - Different styling/branding
  - Error messages for invalid credentials

- [ ] Create `ChangePassword.jsx` (for both user & admin)
  - Current password verification
  - New password strength check
  - Confirm password matching
  - Success/error feedback

- [ ] Update route protection
  - User routes check for `user` role
  - Admin routes check for `admin` role
  - Redirect to appropriate login if not authenticated

### Backend Security
- [ ] Implement password hashing (bcrypt, min 10 rounds)
- [ ] Add JWT secret to environment variables
- [ ] Set JWT expiration (24h recommended)
- [ ] Validate all inputs on backend
- [ ] Add rate limiting on login endpoint
- [ ] Use HTTPS in production
- [ ] Implement CORS properly

---

## Phase 5: Image Upload & Storage (Week 4)

### Implementation Options

**Option A: Local File Storage** (Simple, for development)
```
POST /api/upload
- Save to /public/uploads/ folder
- Return URL: /uploads/[filename]
- Good for: Development, small-scale deployments
- Not recommended for: Production, scaling
```

**Option B: AWS S3** (Recommended for production)
```
- Setup AWS S3 bucket
- Use signed URLs for uploads
- Return S3 URL to frontend
- Good for: Large scale, secure, reliable
```

**Option C: Cloudinary** (Easiest third-party)
```
- No backend setup needed
- Direct frontend upload
- Automatic image optimization
- Good for: Simplicity, good CDN
```

### Implementation Steps
- [ ] Choose storage solution
- [ ] Implement `/api/upload` endpoint
- [ ] Add file validation (size, type)
- [ ] Store image URL in database
- [ ] Display images in questions (frontend)
- [ ] Add error handling for failed uploads

---

## Phase 6: Test Visibility Control (Week 4)

### Database Changes
- [ ] Add `status` field to tests: `draft | pending_review | approved | rejected`
- [ ] Add `approvedBy` (admin ObjectId)
- [ ] Add `approvalDate` (timestamp)

### API Changes
- [ ] Modify `GET /api/tests`:
  - For users: return only `approved` tests
  - For admins: return all tests
  - Add filter parameter: `?status=pending_review`

- [ ] Add `PATCH /api/tests/:id/approve`:
  - Change status to `approved`
  - Set `approvedBy` and `approvalDate`
  - Only accessible by admins

- [ ] Add `PATCH /api/tests/:id/reject`:
  - Change status to `rejected`
  - Store rejection reason
  - Only accessible by admins

### Frontend Changes
- [ ] Users see only approved tests on home/dashboard
- [ ] Admins see all tests with status badges
- [ ] Add approval workflow to admin dashboard

---

## Testing Checklist

### Functional Testing
- [ ] User can register with secure password
- [ ] User can login with email/password
- [ ] Admin can login separately and access admin routes
- [ ] User cannot access admin routes
- [ ] Test image uploads work for all question types
- [ ] Images display correctly in questions
- [ ] TFNG legend appears and is clear
- [ ] Picture choice shows A/B/C/D labels correctly
- [ ] Timer counts down and stops at 0
- [ ] Test submission saves all answers
- [ ] Users only see approved tests

### Security Testing
- [ ] Passwords are hashed (never stored in plain text)
- [ ] JWT tokens are required for protected routes
- [ ] Admin routes require `admin` role
- [ ] Cross-site request forgery (CSRF) protection in place
- [ ] SQL injection attempts are prevented
- [ ] File upload validation works (size, type)
- [ ] No sensitive data in API responses

### UI/UX Testing
- [ ] Exam layout matches real IELTS paper
- [ ] Typography is clear and readable
- [ ] Colors follow official IELTS blue (#0066cc)
- [ ] Responsive design works on mobile/tablet
- [ ] Question navigation is intuitive
- [ ] Error messages are helpful and clear
- [ ] Admin dashboard is organized and functional

---

## Deployment Checklist

### Before Production
- [ ] Environment variables configured (.env)
- [ ] Database backed up
- [ ] SSL/HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Logging and error tracking setup
- [ ] Monitoring tools configured
- [ ] Backup plan documented

### After Deployment
- [ ] Test all critical user flows
- [ ] Verify images upload and display
- [ ] Monitor error logs
- [ ] Check database performance
- [ ] Verify authentication works
- [ ] Check email notifications (if implemented)

---

## Priority Matrix

### 🔴 CRITICAL (Do First)
1. Password hashing implementation
2. Test approval/visibility system
3. Image upload API
4. TFNG clarity improvements
5. Exam layout redesign

### 🟡 HIGH (Do Next)
1. Admin user management
2. Separate admin/user login
3. Reading module redesign
4. Image display in all question types
5. JWT token implementation

### 🟢 MEDIUM (Nice to Have)
1. Admin reports/analytics
2. Test preview in admin
3. User profile update
4. Test history visualization
5. Email notifications

### ⚪ LOW (Future)
1. Speaking module
2. Advanced analytics
3. Mobile app
4. API documentation
5. Gamification features

---

## Quick Reference: Code Patterns

### TFNG Component
```jsx
const [answer, setAnswer] = useState(null)

return (
  <div className="tfng-question">
    <div className="tfng-legend">
      <div>TRUE: Statement agrees</div>
      <div>FALSE: Statement contradicts</div>
      <div>NOT GIVEN: Information not in text</div>
    </div>
    <div className="tfng-options">
      {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
        <button
          key={opt}
          onClick={() => setAnswer(opt)}
          className={answer === opt ? 'selected' : ''}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
)
```

### API Authentication
```javascript
// Frontend
const token = localStorage.getItem('token')
await api('/protected-endpoint', 'GET', null, token)

// Backend
app.post('/api/tests/:id/approve', authenticateAdmin, (req, res) => {
  // Only admins reach here
})
```

### Password Hashing
```javascript
const bcrypt = require('bcrypt')
const hashedPassword = await bcrypt.hash(password, 10)
const isCorrect = await bcrypt.compare(inputPassword, hashedPassword)
```

---

## Success Metrics (After Implementation)

- ✅ 100% of IELTS question types functional
- ✅ 0 security vulnerabilities (OWASP Top 10)
- ✅ All images upload and display correctly
- ✅ Exam layout matches real IELTS paper
- ✅ TFNG clarity: 0 student confusion
- ✅ Admin approval workflow functional
- ✅ User management complete
- ✅ Password security: 100% hashed
- ✅ Response time < 500ms (most endpoints)
- ✅ Uptime > 99.5%

---

## Support & Escalation

**For Questions:**
- Check IELTS_SYSTEM_IMPROVEMENT_PLAN.md (detailed guide)
- Review code examples in this document
- Check test case requirements below

**For Issues:**
- Check error logs
- Verify database connection
- Test API endpoints with Postman
- Check JWT tokens are valid

---

**Last Updated:** February 11, 2026  
**Status:** Ready to Implement  
**Owner:** IELTS System Architect
