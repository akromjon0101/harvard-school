import { Routes, Route, useLocation } from 'react-router'
import { Suspense, lazy } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/admin/AdminLogin'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Lazy-loaded pages (code splitting for performance)
const Speaking        = lazy(() => import('./pages/Speaking'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const MyResults       = lazy(() => import('./pages/MyResults'))
const IELTSExamPage   = lazy(() => import('./pages/IELTSExamPage'))
const IELTSTRF        = lazy(() => import('./pages/IELTSTRF'))
const StudentReadingPage = lazy(() => import('./pages/StudentReadingPage'))
const PracticeGrader  = lazy(() => import('./pages/PracticeGrader'))
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminSubmissions = lazy(() => import('./pages/admin/AdminSubmissions'))
const AdminExams      = lazy(() => import('./pages/admin/AdminExams'))
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'))
const TestCreator     = lazy(() => import('./pages/admin/TestCreator'))
const AnswerSheet     = lazy(() => import('./pages/AnswerSheet'))
import './App.css'
import './styles/answer-sheet.css'
import Maintenance from './pages/Maintenance'

// Set this to true to enable maintenance mode, false to disable
const IS_MAINTENANCE = false

// Routes where navbar should be hidden (full-screen exam experience)
const HIDE_NAV_PATTERNS = [/^\/exam\//, /^\/reading-session\//]

export default function App() {
  const location = useLocation()
  const hideNav = HIDE_NAV_PATTERNS.some(p => p.test(location.pathname))

  return (
    <>
      {IS_MAINTENANCE && <Maintenance />}
      {!hideNav && <Navbar />}
      <Suspense fallback={<div className="loading-screen"><div className="loading-screen-spinner" /><span className="loading-screen-text">Harvard School</span></div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/speaking" element={<Speaking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Student Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-results" element={<MyResults />} />
          <Route path="/my-results/:id" element={<AnswerSheet />} />
          <Route path="/my-results/:id/trf" element={<IELTSTRF />} />
          <Route path="/exam/:id" element={<IELTSExamPage />} />
          <Route path="/reading-session/:id" element={<StudentReadingPage />} />
          <Route path="/practice" element={<PracticeGrader />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        {/* Admin Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/exams" element={<AdminExams />} />
          <Route path="/admin/submissions" element={<AdminSubmissions />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/create-test" element={<TestCreator />} />
          <Route path="/admin/exams/:id/edit" element={<TestCreator />} />
        </Route>
      </Routes>
      </Suspense>
    </>
  )
}
