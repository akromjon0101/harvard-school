export default function SpeakingIllustration() {
  return (
    <svg
      viewBox="0 0 520 400"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ maxWidth: 520, display: 'block' }}
    >
      <defs>
        <radialGradient id="si-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="si-desk" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="si-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde7c3" />
          <stop offset="100%" stopColor="#f8c090" />
        </linearGradient>
        <linearGradient id="si-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="si-shirt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <radialGradient id="si-orb" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <linearGradient id="si-screen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <filter id="si-drop">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.13)" />
        </filter>
        <filter id="si-glow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="si-softdrop">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="rgba(0,0,0,0.12)" />
        </filter>
      </defs>

      {/* ── Background ambient glow ── */}
      <ellipse cx="260" cy="200" rx="230" ry="185" fill="url(#si-bg)" />

      {/* ── Sparkle stars ── */}
      <g opacity="0.85" style={{ animation: 'si-sparkle 2.2s ease-in-out infinite' }}>
        <path d="M78,72 L81,80 L84,72 L81,64 Z" fill="#f59e0b" />
        <path d="M82,72 L74,75 L82,78 L90,75 Z" fill="#f59e0b" />
      </g>
      <g opacity="0.7" style={{ animation: 'si-sparkle 2.8s ease-in-out infinite 0.4s' }}>
        <path d="M450,58 L453,65 L456,58 L453,51 Z" fill="#818cf8" />
        <path d="M453,55 L446,58 L453,61 L460,58 Z" fill="#818cf8" />
      </g>
      <g opacity="0.6" style={{ animation: 'si-sparkle 3.1s ease-in-out infinite 1s' }}>
        <path d="M468,195 L471,201 L474,195 L471,189 Z" fill="#34d399" />
        <path d="M471,192 L465,195 L471,198 L477,195 Z" fill="#34d399" />
      </g>
      <circle cx="60" cy="155" r="5" fill="#f472b6" opacity="0.5"
        style={{ animation: 'si-float 3.4s ease-in-out infinite' }} />
      <circle cx="455" cy="260" r="4" fill="#fbbf24" opacity="0.55"
        style={{ animation: 'si-float 2.9s ease-in-out infinite 0.7s' }} />
      <circle cx="95" cy="290" r="3.5" fill="#6366f1" opacity="0.45"
        style={{ animation: 'si-float 3.8s ease-in-out infinite 1.4s' }} />

      {/* ── Books (left, standing) ── */}
      <rect x="54" y="270" width="19" height="68" rx="3" fill="#f59e0b" />
      <rect x="54" y="270" width="19" height="5" rx="1" fill="#d97706" />
      <line x1="59" y1="296" x2="69" y2="296" stroke="white" strokeWidth="1" opacity="0.4" />
      <rect x="75" y="262" width="17" height="76" rx="3" fill="#6366f1" />
      <rect x="75" y="262" width="17" height="5" rx="1" fill="#4338ca" />
      <line x1="79" y1="286" x2="89" y2="286" stroke="white" strokeWidth="1" opacity="0.4" />
      <rect x="94" y="268" width="15" height="70" rx="3" fill="#0ea5e9" />
      <rect x="94" y="268" width="15" height="5" rx="1" fill="#0284c7" />

      {/* ── Desk ── */}
      <rect x="40" y="332" width="440" height="52" rx="14" fill="url(#si-desk)" filter="url(#si-drop)" />
      <rect x="40" y="370" width="440" height="14" rx="8" fill="#fbbf24" opacity="0.4" />

      {/* ── Laptop screen ── */}
      {/* Hinge/stand */}
      <rect x="306" y="300" width="12" height="36" rx="5" fill="#94a3b8" />
      <rect x="294" y="330" width="36" height="7" rx="3" fill="#cbd5e1" />
      {/* Screen body */}
      <rect x="262" y="222" width="112" height="82" rx="10" fill="#1e293b" filter="url(#si-drop)" />
      <rect x="266" y="226" width="104" height="74" rx="8" fill="url(#si-screen)" />
      {/* Screen content lines */}
      <rect x="276" y="236" width="84" height="7" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="276" y="249" width="60" height="6" rx="2" fill="rgba(99,102,241,0.55)" />
      <rect x="276" y="261" width="72" height="6" rx="2" fill="rgba(255,255,255,0.08)" />
      <rect x="276" y="273" width="52" height="6" rx="2" fill="rgba(255,255,255,0.07)" />
      {/* IELTS label on screen */}
      <rect x="282" y="284" width="42" height="10" rx="5" fill="#6366f1" opacity="0.85" />
      {/* Screen shine */}
      <rect x="266" y="226" width="104" height="18" rx="8" fill="rgba(255,255,255,0.04)" />

      {/* ── Microphone ── */}
      {/* Base */}
      <ellipse cx="208" cy="338" rx="16" ry="5" fill="#64748b" opacity="0.7" />
      {/* Stand pole */}
      <rect x="206" y="274" width="4" height="64" rx="2" fill="#94a3b8" />
      {/* Arm */}
      <path d="M208,278 Q226,268 230,252" fill="none" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
      {/* Mic capsule */}
      <rect x="220" y="232" width="20" height="36" rx="10" fill="#334155" filter="url(#si-softdrop)" />
      <rect x="222" y="234" width="16" height="32" rx="8" fill="#475569" />
      {/* Mic grille */}
      <line x1="223" y1="241" x2="237" y2="241" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="223" y1="247" x2="237" y2="247" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="223" y1="253" x2="237" y2="253" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="223" y1="259" x2="237" y2="259" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {/* Recording glow */}
      <ellipse cx="230" cy="250" rx="16" ry="24" fill="#ef4444" opacity="0.12"
        style={{ animation: 'si-mic-glow 1.2s ease-in-out infinite' }} />
      {/* Red dot */}
      <circle cx="230" cy="275" r="5" fill="#ef4444"
        style={{ animation: 'si-rec-blink 1s ease-in-out infinite' }} />

      {/* ── Chair back ── */}
      <rect x="112" y="215" width="13" height="122" rx="6.5" fill="#4f46e5" opacity="0.65" />

      {/* ── Student body (shirt) ── */}
      <path
        d="M126,280 Q126,262 144,256 L156,252 L168,250 L186,250 L198,252 L210,256 Q228,262 228,280 L228,334 L126,334 Z"
        fill="url(#si-shirt)"
      />
      {/* Collar detail */}
      <path d="M168,250 Q177,262 186,250" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />

      {/* ── Neck ── */}
      <rect x="163" y="236" width="28" height="24" rx="10" fill="url(#si-skin)" />

      {/* ── Head ── */}
      <ellipse cx="177" cy="198" rx="50" ry="54" fill="url(#si-skin)" filter="url(#si-drop)" />

      {/* ── Hair ── */}
      <path
        d="M130,192 Q132,148 177,140 Q222,148 224,192
           Q218,158 177,155 Q136,158 130,192 Z"
        fill="url(#si-hair)"
      />
      {/* Hair top */}
      <path
        d="M152,143 Q177,132 202,143 Q188,136 177,134 Q166,136 152,143 Z"
        fill="#0f172a"
      />

      {/* ── Ears ── */}
      <ellipse cx="128" cy="200" rx="10" ry="13" fill="#f8c090" />
      <ellipse cx="226" cy="200" rx="10" ry="13" fill="#f8c090" />

      {/* ── Headphones ── */}
      {/* Band */}
      <path d="M124,199 Q177,162 230,199" fill="none" stroke="#4f46e5" strokeWidth="9" strokeLinecap="round" />
      <path d="M124,199 Q177,162 230,199" fill="none" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
      {/* Left cup */}
      <rect x="112" y="190" width="18" height="22" rx="7" fill="#4338ca" />
      <rect x="114" y="192" width="14" height="18" rx="5" fill="#6366f1" />
      {/* Right cup */}
      <rect x="224" y="190" width="18" height="22" rx="7" fill="#4338ca" />
      <rect x="226" y="192" width="14" height="18" rx="5" fill="#6366f1" />

      {/* ── Eyes ── */}
      {/* Left */}
      <ellipse cx="158" cy="198" rx="13" ry="14" fill="white" />
      <ellipse cx="158" cy="199" rx="9" ry="9.5" fill="#1e293b" />
      <ellipse cx="158" cy="199" rx="5" ry="5.5" fill="#4f46e5" />
      <ellipse cx="158" cy="199" rx="2.5" ry="2.8" fill="white" opacity="0.92" />
      <ellipse cx="153" cy="194" rx="3" ry="2.2" fill="white" opacity="0.75" />
      {/* Right */}
      <ellipse cx="196" cy="198" rx="13" ry="14" fill="white" />
      <ellipse cx="196" cy="199" rx="9" ry="9.5" fill="#1e293b" />
      <ellipse cx="196" cy="199" rx="5" ry="5.5" fill="#4f46e5" />
      <ellipse cx="196" cy="199" rx="2.5" ry="2.8" fill="white" opacity="0.92" />
      <ellipse cx="191" cy="194" rx="3" ry="2.2" fill="white" opacity="0.75" />

      {/* ── Eyebrows ── */}
      <path d="M147,182 Q158,177 169,180" fill="none" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M185,180 Q196,177 207,182" fill="none" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />

      {/* ── Nose ── */}
      <path d="M174,214 Q177,220 180,214" fill="none" stroke="#c4956a" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── Smile ── */}
      <path d="M161,228 Q177,241 193,228" fill="none" stroke="#c4956a" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M163,229 Q177,240 191,229 Q177,248 163,229 Z" fill="white" opacity="0.65" />

      {/* ── Cheeks ── */}
      <ellipse cx="140" cy="218" rx="13" ry="8" fill="#f472b6" opacity="0.28" />
      <ellipse cx="214" cy="218" rx="13" ry="8" fill="#f472b6" opacity="0.28" />

      {/* ── Arms ── */}
      <path d="M128,300 Q120,318 118,334 L152,334 L152,300 Z" fill="#f8c090" />
      <path d="M128,300 Q120,318 118,334 L152,334 L152,300 Z" fill="url(#si-shirt)" opacity="0.6" />
      <path d="M226,300 Q234,318 236,334 L202,334 L202,300 Z" fill="#f8c090" />
      <path d="M226,300 Q234,318 236,334 L202,334 L202,300 Z" fill="url(#si-shirt)" opacity="0.6" />

      {/* ── AI Orb companion ── */}
      {/* Outer glow */}
      <circle cx="412" cy="162" r="60" fill="rgba(124,58,237,0.14)"
        style={{ animation: 'si-ai-pulse 3s ease-in-out infinite' }} />
      {/* Orb */}
      <circle cx="412" cy="162" r="44" fill="url(#si-orb)" filter="url(#si-drop)" />
      {/* Shine */}
      <ellipse cx="399" cy="148" rx="16" ry="10" fill="rgba(255,255,255,0.28)" />
      {/* Face - left eye */}
      <ellipse cx="401" cy="162" rx="7" ry="7.5" fill="white" opacity="0.95" />
      <ellipse cx="401" cy="163" rx="4.5" ry="5" fill="#1e293b" />
      <ellipse cx="399" cy="161" rx="2" ry="2" fill="white" opacity="0.9" />
      {/* Face - right eye */}
      <ellipse cx="423" cy="162" rx="7" ry="7.5" fill="white" opacity="0.95" />
      <ellipse cx="423" cy="163" rx="4.5" ry="5" fill="#1e293b" />
      <ellipse cx="421" cy="161" rx="2" ry="2" fill="white" opacity="0.9" />
      {/* Smile */}
      <path d="M397,175 Q412,185 427,175" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

      {/* ── Speech bubble from AI ── */}
      <path
        d="M342,100 Q342,78 364,78 L452,78 Q474,78 474,100
           L474,126 Q474,148 452,148 L378,148 L365,164 L367,148
           Q342,148 342,126 Z"
        fill="white" filter="url(#si-softdrop)"
      />
      {/* Bubble lines */}
      <rect x="355" y="92" width="90" height="7" rx="3" fill="#e0e7ff" />
      <rect x="355" y="105" width="72" height="7" rx="3" fill="#c7d2fe" />
      <rect x="355" y="118" width="82" height="7" rx="3" fill="#e0e7ff" />
      {/* AI chip */}
      <rect x="355" y="132" width="38" height="10" rx="5" fill="#6366f1" />

      {/* ── Floating badges ── */}
      {/* IELTS badge */}
      <rect x="42" y="155" width="78" height="38" rx="11" fill="white" filter="url(#si-softdrop)"
        style={{ animation: 'si-badge-a 4s ease-in-out infinite' }} />
      <rect x="45" y="158" width="72" height="32" rx="9" fill="#eff6ff" />
      <text x="81" y="173" textAnchor="middle" fill="#2563eb" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">IELTS</text>
      <text x="81" y="184" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">Band 7.5+</text>

      {/* Score badge */}
      <rect x="435" y="278" width="68" height="38" rx="11" fill="white" filter="url(#si-softdrop)"
        style={{ animation: 'si-badge-b 4.5s ease-in-out infinite 0.5s' }} />
      <rect x="438" y="281" width="62" height="32" rx="9" fill="#fefce8" />
      <text x="469" y="296" textAnchor="middle" fill="#d97706" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">⭐ 8.5</text>
      <text x="469" y="307" textAnchor="middle" fill="#92400e" fontSize="7.5" fontFamily="sans-serif">AI Score</text>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes si-sparkle {
          0%,100% { opacity:0.85; transform:scale(1) rotate(0deg); }
          50%      { opacity:0.5;  transform:scale(1.3) rotate(20deg); }
        }
        @keyframes si-float {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-8px); }
        }
        @keyframes si-mic-glow {
          0%,100% { opacity:0.12; }
          50%      { opacity:0.28; }
        }
        @keyframes si-rec-blink {
          0%,100% { opacity:1; }
          50%      { opacity:0.3; }
        }
        @keyframes si-ai-pulse {
          0%,100% { transform:scale(1);    opacity:0.14; }
          50%      { transform:scale(1.12); opacity:0.22; }
        }
        @keyframes si-badge-a {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-6px); }
        }
        @keyframes si-badge-b {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(7px); }
        }
      `}</style>
    </svg>
  )
}
