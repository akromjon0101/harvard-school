import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  Sun, Moon,
  Headphones, BookOpen, PenLine, MessageSquare,
  UserPlus, ClipboardList, Bot,
  GraduationCap, Trophy, Settings2,
} from 'lucide-react'
import '../styles/home-v2.css'

/* ── Animated counter ── */
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

/* ── Scroll reveal (fires once) ── */
function useInView(ref, threshold = 0.18) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref, threshold])
  return visible
}

/* ── Data ── */
const SKILLS = [
  {
    icon: <Headphones size={28} strokeWidth={1.8} />, label: 'Listening',
    color: '#6366f1', light: '#eef2ff',
    grad: 'linear-gradient(135deg,#6366f1,#818cf8)',
    desc: '4 parts, 40 questions. Real-condition audio with MCQ, gap-fill, and matching tasks.',
    tag: '30 min · 40 Q',
  },
  {
    icon: <BookOpen size={28} strokeWidth={1.8} />, label: 'Reading',
    color: '#0ea5e9', light: '#eff6ff',
    grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
    desc: '3 academic passages with 40 questions — TFNG, headings, and summary completion.',
    tag: '60 min · 40 Q',
  },
  {
    icon: <PenLine size={28} strokeWidth={1.8} />, label: 'Writing',
    color: '#10b981', light: '#f0fdf4',
    grad: 'linear-gradient(135deg,#10b981,#34d399)',
    desc: 'Task 1 & Task 2 with word count tracking, AI scoring, and detailed band feedback.',
    tag: '60 min · 2 tasks',
  },
  {
    icon: <MessageSquare size={28} strokeWidth={1.8} />, label: 'Speaking',
    color: '#f59e0b', light: '#fffbeb',
    grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    desc: '3 parts with audio recording, AI fluency scoring, and personalised improvement tips.',
    tag: '11–14 min · 3 parts',
  },
]

const STEPS = [
  { n: '01', icon: <UserPlus size={26} strokeWidth={1.8} />,      title: 'Create Account',      desc: 'Sign up in seconds. No credit card required for your first practice test.' },
  { n: '02', icon: <ClipboardList size={26} strokeWidth={1.8} />, title: 'Take Practice Tests', desc: 'Attempt real IELTS-style exams under timed conditions with authentic materials.' },
  { n: '03', icon: <Bot size={26} strokeWidth={1.8} />,           title: 'Get AI Feedback',     desc: 'Receive instant band score predictions and personalised improvement tips.' },
]

/* ════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const user     = JSON.parse(localStorage.getItem('user') || 'null')

  /* refs */
  const statsRef     = useRef(null)
  const skillsRef    = useRef(null)
  const howRef       = useRef(null)
  const visualRafRef = useRef(null)

  /* state */
  const [statsOn,  setStatsOn]  = useState(false)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('hv2-theme') === 'dark'
  )

  /* hooks */
  const skillsVisible = useInView(skillsRef)
  const howVisible    = useInView(howRef)

  /* persist theme */
  useEffect(() => {
    localStorage.setItem('hv2-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  /* stats observer */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsOn(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    return () => { if (visualRafRef.current) cancelAnimationFrame(visualRafRef.current) }
  }, [])


  /* counters */
  const cnt1 = useCounter(5000, 2200, statsOn)
  const cnt2 = useCounter(98,   1800, statsOn)
  const cnt3 = useCounter(40,   1600, statsOn)

  /* ══════════ JSX ══════════ */
  return (
    <div className={`home-page-v2${darkMode ? ' dark-mode' : ''}`}>

      {/* ════ HERO ════ */}
      <div className="home-hero">
        <div className="hero-content">
          <div className="hero-badge"><GraduationCap size={15} strokeWidth={2} /> Harvard School — Official IELTS Preparation</div>
          <h1 className="hero-title">
            Master Your <span className="highlight">IELTS Exam</span> with Harvard School
          </h1>
          <p className="hero-subtitle">
            Practice under real exam conditions for{' '}
            <strong className="text-primary">Listening, Reading, Writing &amp; Speaking</strong>.
            Get AI-powered feedback and certified band score predictions.
          </p>
          <div className="hero-actions">
            <button
              className="btn-hero-primary"
              onClick={() => navigate(user ? '/dashboard' : '/register')}
            >
              {user ? 'Go to My Dashboard' : 'Sign up as a new student'}
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate('/login')}>
              Log in to continue your test
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-value">5k+</span>
              <span className="stat-label">Students Trained</span>
            </div>
            <div className="stat-card highlighted">
              <span className="stat-value">Band 7.5</span>
              <span className="stat-label">Average Result</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">AI</span>
              <span className="stat-label">Instant Feedback</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="main-visual-card">
            <div className="visual-header">
              <div className="dots">
                <span style={{ background: '#ef4444' }} />
                <span style={{ background: '#f59e0b' }} />
                <span style={{ background: '#22c55e' }} />
              </div>
              <div className="address-bar">harvard-school.com</div>
            </div>
            <div className="visual-content">
              <div className="listening-visual-item">
                <div className="play-icon">▶</div>
                <div className="waves">
                  <span /><span /><span /><span /><span />
                </div>
              </div>
              <div className="line long" />
              <div className="line med" />
              <div className="line short" />
              <div className="vc-skills">
                <div className="vc-skill-row">
                  <span className="vc-skill-icon">🎧</span>
                  <span className="vc-skill-label">Listening</span>
                  <div className="vc-skill-bar"><div className="vc-skill-fill" style={{ width: '82%', background: 'linear-gradient(90deg,#6366f1,#818cf8)' }} /></div>
                  <span className="vc-skill-score" style={{ color: '#6366f1' }}>8.0</span>
                </div>
                <div className="vc-skill-row">
                  <span className="vc-skill-icon">📖</span>
                  <span className="vc-skill-label">Reading</span>
                  <div className="vc-skill-bar"><div className="vc-skill-fill" style={{ width: '75%', background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' }} /></div>
                  <span className="vc-skill-score" style={{ color: '#0ea5e9' }}>7.5</span>
                </div>
                <div className="vc-skill-row">
                  <span className="vc-skill-icon">✍️</span>
                  <span className="vc-skill-label">Writing</span>
                  <div className="vc-skill-bar"><div className="vc-skill-fill" style={{ width: '70%', background: 'linear-gradient(90deg,#10b981,#34d399)' }} /></div>
                  <span className="vc-skill-score" style={{ color: '#10b981' }}>7.0</span>
                </div>
                <div className="vc-skill-row">
                  <span className="vc-skill-icon">🗣️</span>
                  <span className="vc-skill-label">Speaking</span>
                  <div className="vc-skill-bar"><div className="vc-skill-fill" style={{ width: '78%', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} /></div>
                  <span className="vc-skill-score" style={{ color: '#f59e0b' }}>7.5</span>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-badge top-right"><Trophy size={13} strokeWidth={2} /> Band 9.0 Achievers</div>
          <div className="floating-badge bottom-left"><GraduationCap size={13} strokeWidth={2} /> Harvard School</div>
        </div>

        <div className="home-footer-subtle">
          <span onClick={() => navigate('/admin-login')} className="admin-portal-link">
            <Settings2 size={13} strokeWidth={2} /> Staff Access
          </span>
        </div>
      </div>

      {/* ════ SKILLS ════ */}
      <section
        className={`skills-section${skillsVisible ? ' is-visible' : ''}`}
        ref={skillsRef}
      >
        <div className="skills-section-inner">
          <div className="section-label-row">
            <span className="section-eyebrow">Complete Preparation</span>
            <h2 className="section-title">
              All 4 Skills.{' '}
              <span className="text-grad-cyan">One Platform.</span>
            </h2>
            <p className="section-sub">
              Everything you need to achieve your target band score in one place.
            </p>
          </div>

          <div className="skills-grid">
            {SKILLS.map((skill, i) => (
              <div
                key={skill.label}
                className="skill-card-v2"
                style={{
                  '--sc-color': skill.color,
                  '--sc-grad':  skill.grad,
                  '--sc-light': skill.light,
                  '--delay':    `${i * 0.12}s`,
                }}
              >
                <div className="sc-top-bar" style={{ background: skill.grad }} />
                <div className="sc-icon-wrap">
                  <span className="sc-icon">{skill.icon}</span>
                </div>
                <h3 className="sc-title">{skill.label}</h3>
                <p className="sc-desc">{skill.desc}</p>
                <span className="sc-tag">{skill.tag}</span>
                <div className="sc-hover-glow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section
        className={`how-section${howVisible ? ' is-visible' : ''}`}
        ref={howRef}
      >
        <div className="how-inner">
          <div className="section-label-row">
            <span className="section-eyebrow dark">How It Works</span>
            <h2 className="section-title">
              Three steps to your{' '}
              <span className="text-grad-indigo">target band</span>
            </h2>
          </div>

          <div className="how-steps">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="how-step"
                style={{ '--delay': `${i * 0.18}s` }}
              >
                <div className="how-step-num">{step.n}</div>
                <div className="how-step-icon">{step.icon}</div>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
                {i < 2 && <div className="how-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-inner">
          <div className="stat-block">
            <div className="stat-block-num">{statsOn ? cnt1.toLocaleString() : '0'}+</div>
            <div className="stat-block-label">Students Trained</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <div className="stat-block-num">{statsOn ? cnt2 : '0'}%</div>
            <div className="stat-block-label">Pass Rate</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <div className="stat-block-num">Band 7.5</div>
            <div className="stat-block-label">Average Result</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <div className="stat-block-num">{statsOn ? cnt3 : '0'}+</div>
            <div className="stat-block-label">Full Tests Available</div>
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="cta-section-v2">
        <div className="cta-v2-inner">
          <div className="cta-orb-1" />
          <div className="cta-orb-2" />
          <h2 className="cta-v2-title">
            Ready to achieve your<br />
            <span className="text-grad-white">target band score?</span>
          </h2>
          <p className="cta-v2-sub">
            Join 5,000+ students already preparing with Harvard School's IELTS platform.
          </p>
          <div className="cta-v2-actions">
            <button
              className="btn-cta-v2-primary"
              onClick={() => navigate(user ? '/dashboard' : '/register')}
            >
              {user ? 'Go to Dashboard →' : 'Start for Free →'}
            </button>
            <button className="btn-cta-v2-outline" onClick={() => navigate('/login')}>
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* ════ THEME TOGGLE ════ */}
      <button
        className={`theme-toggle-fab ${darkMode ? 'is-dark' : 'is-light'}`}
        onClick={() => setDarkMode(d => !d)}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle dark/light mode"
      >
        <span className="fab-icons">
          <span className="fab-sun"><Sun size={18} /></span>
          <span className="fab-moon"><Moon size={18} /></span>
        </span>
      </button>

    </div>
  )
}
