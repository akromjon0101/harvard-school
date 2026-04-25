import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Settings, GraduationCap } from 'lucide-react'
import { api } from '../services/api'
import '../App.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  let user = {}
  try { user = JSON.parse(localStorage.getItem('user') || '{}') } catch { /* corrupted */ }

  useEffect(() => {
    if (!user.role) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [examsData, resultsData] = await Promise.all([
          api('/exams'),
          api(`/submissions/user/${user.id || user._id}`)
        ])
        setExams(examsData)
        setResults(resultsData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.id, user._id])

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-sidebar">
        <div className="user-info-card">
          <div className="avatar-large">{user.name?.charAt(0)}</div>
          <h2>{user.name}</h2>
          <p className="user-role-badge">{user.role.toUpperCase()}</p>
        </div>

        <nav className="side-nav">
          <button className="nav-btn active" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={15} /> My Dashboard
          </button>
          <button className="nav-btn" onClick={() => navigate('/my-results')}>
            <BarChart3 size={15} /> My Test Results
          </button>
          <button className="nav-btn" onClick={() => navigate('/my-results')}>
            <Settings size={15} /> Settings
          </button>
        </nav>
      </div>

      <div className="dashboard-main-content">
        <header className="page-header">
          <h1>Welcome back, <span className="text-primary">{user.name?.split(' ')[0]}!</span></h1>
          <p>Your journey to IELTS success at Harvard School continues here.</p>
        </header>

        <section className="dashboard-grid">
          {/* Left Column: Exams */}
          <div className="grid-col active-tests">
            <div className="section-header">
              <h2>🚀 Featured Mock Tests</h2>
              <span className="count-pill">{exams.length}</span>
            </div>
            {loading ? (
              <div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-item skeleton-card" />
                ))}
              </div>
            ) : (
              <div className="test-list">
                {exams.filter(exam => exam.status === 'published' || exam.isPublished).map(exam => (
                  <div key={exam._id} className="test-item-card">
                    <div className="test-item-icon"><GraduationCap size={28} strokeWidth={1.5} /></div>
                    <div className="test-info">
                      <h3>{exam.title}</h3>
                      <p>{exam.description || 'Complete Mock Test Simulator'}</p>
                      <div className="test-tags">
                        <span className="tag blue">⏱ 180m</span>
                        <span className="tag green">Official Style</span>
                      </div>
                    </div>
                    <button className="btn-go" onClick={() => navigate(`/exam/${exam._id}`)}>Take Test →</button>
                  </div>
                ))}
                {exams.filter(exam => exam.status === 'published' || exam.isPublished).length === 0 && (
                  <p className="empty-state">No live exams available at the moment. Please check back later.</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Recent Results Summary */}
          <div className="grid-col recent-performance">
            <div className="section-header">
              <h2>📈 Recent Results</h2>
              <button className="text-btn" onClick={() => navigate('/my-results')}>View All</button>
            </div>
            <div className="results-summary-list">
              {results.slice(0, 3).map(res => (
                <div key={res._id} className="summary-item">
                  <div className="summary-main">
                    <strong>{res.exam?.title}</strong>
                    <span>{new Date(res.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="summary-scores">
                    <span className="mini-score">L: {res.moduleScores?.listening?.score || 'N/A'}</span>
                    <span className="mini-score">R: {res.moduleScores?.reading?.score || 'N/A'}</span>
                  </div>
                </div>
              ))}
              {results.length === 0 && <p className="empty-state">No tests taken yet. Start your first mock test!</p>}
            </div>

            <div className="improvement-card">
              <h4>💡 Pro Tip</h4>
              <p>Focus on Section 4 in Listening to boost your score efficiently.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
