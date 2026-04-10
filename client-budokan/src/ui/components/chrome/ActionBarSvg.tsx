import { ACTION_BAR } from "./chromeLayout";

const { viewBox: vb, sockets: s } = ACTION_BAR;

const ActionBarSvg: React.FC = () => (
  <svg
    viewBox={`0 0 ${vb.width} ${vb.height}`}
    className="w-full h-auto block"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="ab-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1e2e" />
        <stop offset="50%" stopColor="#0f1219" />
        <stop offset="100%" stopColor="#1a1e2e" />
      </linearGradient>

      <linearGradient id="ab-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8B7355" />
        <stop offset="30%" stopColor="#C9A96E" />
        <stop offset="50%" stopColor="#DFC088" />
        <stop offset="70%" stopColor="#C9A96E" />
        <stop offset="100%" stopColor="#6B5B3E" />
      </linearGradient>

      <radialGradient id="ab-recess">
        <stop offset="0%" stopColor="#050710" />
        <stop offset="85%" stopColor="#0a0e1a" />
        <stop offset="100%" stopColor="#141824" />
      </radialGradient>

      <linearGradient id="ab-border" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#8B7355" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.6" />
      </linearGradient>

      <filter id="ab-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feOffset dx="0" dy="1" result="offset" />
        <feComposite in="offset" in2="SourceAlpha" operator="in" result="shadow" />
        <feFlood floodColor="#000000" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="shadow" operator="in" result="final" />
        <feMerge>
          <feMergeNode in="final" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="ab-glow" x="-5%" y="-15%" width="110%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
      </filter>
    </defs>

    {/* ─── Main panel body ─── */}
    <rect
      x="20"
      y="10"
      width={vb.width - 40}
      height={vb.height - 20}
      rx="14"
      ry="14"
      fill="url(#ab-panel)"
      stroke="url(#ab-border)"
      strokeWidth="1.5"
      filter="url(#ab-glow)"
    />

    {/* ─── Decorative corner accents ─── */}
    {/* Top-left */}
    <path d="M 30 14 L 44 14 L 44 16 L 32 16 L 32 28 L 30 28 Z" fill="#C9A96E" opacity="0.3" />
    {/* Top-right */}
    <path d={`M ${vb.width - 30} 14 L ${vb.width - 44} 14 L ${vb.width - 44} 16 L ${vb.width - 32} 16 L ${vb.width - 32} 28 L ${vb.width - 30} 28 Z`} fill="#C9A96E" opacity="0.3" />
    {/* Bottom-left */}
    <path d={`M 30 ${vb.height - 14} L 44 ${vb.height - 14} L 44 ${vb.height - 16} L 32 ${vb.height - 16} L 32 ${vb.height - 28} L 30 ${vb.height - 28} Z`} fill="#C9A96E" opacity="0.3" />
    {/* Bottom-right */}
    <path d={`M ${vb.width - 30} ${vb.height - 14} L ${vb.width - 44} ${vb.height - 14} L ${vb.width - 44} ${vb.height - 16} L ${vb.width - 32} ${vb.height - 16} L ${vb.width - 32} ${vb.height - 28} L ${vb.width - 30} ${vb.height - 28} Z`} fill="#C9A96E" opacity="0.3" />

    {/* ─── Surrender socket (left) ─── */}
    <circle cx={s.surrender.cx} cy={s.surrender.cy} r={s.surrender.r + 3} fill="none" stroke="url(#ab-ring)" strokeWidth="2.5" />
    <circle cx={s.surrender.cx} cy={s.surrender.cy} r={s.surrender.r} fill="url(#ab-recess)" filter="url(#ab-inner-shadow)" />

    {/* ─── Bonus socket (center, larger) ─── */}
    <circle cx={s.bonus.cx} cy={s.bonus.cy} r={s.bonus.r + 3} fill="none" stroke="url(#ab-ring)" strokeWidth="3" />
    <circle cx={s.bonus.cx} cy={s.bonus.cy} r={s.bonus.r} fill="url(#ab-recess)" filter="url(#ab-inner-shadow)" />

    {/* ─── Settings socket (right) ─── */}
    <circle cx={s.settings.cx} cy={s.settings.cy} r={s.settings.r + 3} fill="none" stroke="url(#ab-ring)" strokeWidth="2.5" />
    <circle cx={s.settings.cx} cy={s.settings.cy} r={s.settings.r} fill="url(#ab-recess)" filter="url(#ab-inner-shadow)" />

    {/* ─── Connector lines between sockets ─── */}
    <line x1={s.surrender.cx + s.surrender.r + 6} y1={s.surrender.cy} x2={s.bonus.cx - s.bonus.r - 6} y2={s.bonus.cy} stroke="#C9A96E" strokeWidth="0.5" opacity="0.2" />
    <line x1={s.bonus.cx + s.bonus.r + 6} y1={s.bonus.cy} x2={s.settings.cx - s.settings.r - 6} y2={s.settings.cy} stroke="#C9A96E" strokeWidth="0.5" opacity="0.2" />
  </svg>
);

export default ActionBarSvg;
