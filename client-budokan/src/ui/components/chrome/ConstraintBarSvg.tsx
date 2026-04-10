import { CONSTRAINT_BAR } from "./chromeLayout";

const { viewBox: vb, sockets: s } = CONSTRAINT_BAR;

const ConstraintBarSvg: React.FC = () => (
  <svg
    viewBox={`0 0 ${vb.width} ${vb.height}`}
    className="w-full h-auto block"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="cb-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#14182480" />
        <stop offset="100%" stopColor="#0f121980" />
      </linearGradient>

      <linearGradient id="cb-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6B5B3E" />
        <stop offset="50%" stopColor="#A89060" />
        <stop offset="100%" stopColor="#6B5B3E" />
      </linearGradient>

      <radialGradient id="cb-recess">
        <stop offset="0%" stopColor="#050710" />
        <stop offset="100%" stopColor="#0e1220" />
      </radialGradient>

      <filter id="cb-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
        <feOffset dx="0" dy="1" result="offset" />
        <feComposite in="offset" in2="SourceAlpha" operator="in" result="shadow" />
        <feFlood floodColor="#000000" floodOpacity="0.4" result="color" />
        <feComposite in="color" in2="shadow" operator="in" result="final" />
        <feMerge>
          <feMergeNode in="final" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ─── Bridge connecting the two sockets ─── */}
    <rect
      x={s.ring1.cx - 4}
      y={s.ring1.cy - 10}
      width={s.ring2.cx - s.ring1.cx + 8}
      height="20"
      rx="6"
      fill="#0c1018"
      stroke="#6B5B3E"
      strokeWidth="1"
      opacity="0.6"
    />

    {/* ─── Left socket ─── */}
    <circle cx={s.ring1.cx} cy={s.ring1.cy} r={s.ring1.r + 2} fill="none" stroke="url(#cb-ring)" strokeWidth="2" />
    <circle cx={s.ring1.cx} cy={s.ring1.cy} r={s.ring1.r} fill="url(#cb-recess)" filter="url(#cb-inner-shadow)" />

    {/* ─── Right socket ─── */}
    <circle cx={s.ring2.cx} cy={s.ring2.cy} r={s.ring2.r + 2} fill="none" stroke="url(#cb-ring)" strokeWidth="2" />
    <circle cx={s.ring2.cx} cy={s.ring2.cy} r={s.ring2.r} fill="url(#cb-recess)" filter="url(#cb-inner-shadow)" />
  </svg>
);

export default ConstraintBarSvg;
