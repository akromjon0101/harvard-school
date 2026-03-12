import { useNavigate } from 'react-router-dom'
import {
  Mic, Play, ArrowRight, CheckCircle,
  Volume2, Brain, Clock, Star,
  MessageCircle, Zap, Headphones,
} from 'lucide-react'
import SpeakingIllustration from '../components/SpeakingIllustration'
import '../styles/speaking.css'

const PARTS = [
  {
    part: 'Part 1',
    title: 'Introduction & Interview',
    dur: '4–5 min',
    icon: <MessageCircle size={22} strokeWidth={1.8} />,
    color: '#6366f1',
    desc: 'Familiar topics like home, family, work, studies, and interests. Conversational questions to warm you up.',
  },
  {
    part: 'Part 2',
    title: 'Individual Long Turn',
    dur: '3–4 min',
    icon: <Mic size={22} strokeWidth={1.8} />,
    color: '#0ea5e9',
    desc: 'Speak for 2 minutes on a given cue card topic after 1 minute of preparation time.',
  },
  {
    part: 'Part 3',
    title: 'Two-Way Discussion',
    dur: '4–5 min',
    icon: <Zap size={22} strokeWidth={1.8} />,
    color: '#f59e0b',
    desc: 'In-depth discussion on abstract ideas connected to the Part 2 topic. Demonstrates higher-order thinking.',
  },
]

const FEATURES = [
  { icon: <Brain size={20} strokeWidth={1.8} />,      title: 'AI Examiner',       desc: 'Realistic AI voice asks questions just like a real IELTS examiner.' },
  { icon: <Star size={20} strokeWidth={1.8} />,       title: 'Instant Band Score', desc: 'Get your predicted score immediately after each part.' },
  { icon: <Volume2 size={20} strokeWidth={1.8} />,    title: 'Audio Recording',    desc: 'Record your answers and play them back for self-review.' },
  { icon: <Headphones size={20} strokeWidth={1.8} />, title: 'Fluency Analysis',   desc: 'AI analyses pace, coherence, and vocabulary in your response.' },
]


export default function Speaking() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const dest = user ? '/dashboard' : '/register'

  return (
    <div className="speaking-page">

      {/* ══ HERO ══ */}
      <section className="sp-hero">
        <div className="sp-hero-blob sp-blob-1" />
        <div className="sp-hero-blob sp-blob-2" />
        <div className="sp-hero-blob sp-blob-3" />

        <div className="sp-hero-inner">
          {/* Left text */}
          <div className="sp-hero-text">
            <div className="sp-eyebrow">
              <Mic size={14} strokeWidth={2.5} />
              AI-Powered Speaking Test
            </div>

            <h1 className="sp-title">
              Improve Your IELTS<br />
              <span className="sp-title-highlight">Speaking with AI</span>
            </h1>

            <p className="sp-subtitle">
              Practice with our AI examiner, record your responses, and get
              instant band score predictions with detailed improvement tips —
              all in one platform.
            </p>

            <div className="sp-actions">
              <button onClick={() => navigate(dest)} className="sp-btn-primary">
                <Mic size={17} strokeWidth={2} />
                Start Speaking Test
                <ArrowRight size={15} strokeWidth={2} />
              </button>
              <button onClick={() => navigate(user ? '/dashboard' : '/login')} className="sp-btn-secondary">
                <Play size={15} strokeWidth={2} />
                Practice Now
              </button>
            </div>

            <div className="sp-chips">
              {['Real IELTS format', 'Instant AI scoring', 'Band 9 tips', 'Audio recording'].map(t => (
                <span key={t} className="sp-chip">
                  <CheckCircle size={12} strokeWidth={2.5} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="sp-hero-visual">
            <SpeakingIllustration />
          </div>
        </div>
      </section>

      {/* ══ PARTS ══ */}
      <section className="sp-parts">
        <div className="sp-parts-inner">
          <span className="sp-section-eyebrow">Exam Structure</span>
          <h2 className="sp-section-title">Three parts. One complete test.</h2>
          <p className="sp-section-sub">Total speaking time: 11–14 minutes</p>

          <div className="sp-parts-grid">
            {PARTS.map((p, i) => (
              <div
                key={p.part}
                className="sp-part-card"
                style={{ '--pc': p.color, '--delay': `${i * 0.12}s` }}
              >
                <div className="sp-part-icon" style={{ color: p.color, background: p.color + '18' }}>
                  {p.icon}
                </div>
                <div className="sp-part-badge">{p.part}</div>
                <h3 className="sp-part-title">{p.title}</h3>
                <p className="sp-part-desc">{p.desc}</p>
                <span className="sp-part-dur">
                  <Clock size={12} strokeWidth={2} />
                  {p.dur}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="sp-features">
        <div className="sp-features-inner">
          <span className="sp-section-eyebrow">Why Choose Us</span>
          <h2 className="sp-section-title">Everything you need to score higher</h2>

          <div className="sp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="sp-feat-card">
                <div className="sp-feat-icon">{f.icon}</div>
                <h3 className="sp-feat-title">{f.title}</h3>
                <p className="sp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="sp-cta">
        <div className="sp-cta-orb-1" />
        <div className="sp-cta-orb-2" />
        <div className="sp-cta-inner">
          <div className="sp-cta-icon-wrap">
            <Volume2 size={28} strokeWidth={1.6} />
          </div>
          <h2 className="sp-cta-title">
            Ready to improve<br />your speaking?
          </h2>
          <p className="sp-cta-sub">
            Join thousands of students who achieved their target band score with Harvard School.
          </p>
          <button onClick={() => navigate(dest)} className="sp-btn-primary sp-cta-btn">
            Get Started Free
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </section>

    </div>
  )
}
