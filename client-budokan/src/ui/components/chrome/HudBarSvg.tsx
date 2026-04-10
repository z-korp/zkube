import { HUD_BAR } from "./chromeLayout";

const { viewBox: vb, sockets: s } = HUD_BAR;

interface HudBarSvgProps {
  /** Number of stars earned (0-3) — fills the engraved stars */
  starsEarned?: number;
  /** Number of constraint sockets to render (0, 1, or 2) */
  constraintCount?: number;
}

const HudBarSvg: React.FC<HudBarSvgProps> = ({ starsEarned = 0, constraintCount = 0 }) => (
  <svg
    viewBox={`0 0 ${vb.width} ${vb.height}`}
    className="w-full h-auto block"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      {/* Dark panel gradient */}
      <linearGradient id="hud-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1e2e" />
        <stop offset="50%" stopColor="#0f1219" />
        <stop offset="100%" stopColor="#1a1e2e" />
      </linearGradient>

      {/* Bronze ring gradient */}
      <linearGradient id="hud-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8B7355" />
        <stop offset="30%" stopColor="#C9A96E" />
        <stop offset="50%" stopColor="#DFC088" />
        <stop offset="70%" stopColor="#C9A96E" />
        <stop offset="100%" stopColor="#6B5B3E" />
      </linearGradient>

      {/* Recessed socket radial */}
      <radialGradient id="hud-recess">
        <stop offset="0%" stopColor="#050710" />
        <stop offset="85%" stopColor="#0a0e1a" />
        <stop offset="100%" stopColor="#141824" />
      </radialGradient>

      {/* Score channel gradient */}
      <linearGradient id="hud-channel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#080b14" />
        <stop offset="50%" stopColor="#060912" />
        <stop offset="100%" stopColor="#0a0e1a" />
      </linearGradient>

      {/* Inner shadow filter */}
      <filter id="hud-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
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

      {/* Outer glow for the panel */}
      <filter id="hud-glow" x="-5%" y="-15%" width="110%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
      </filter>

      {/* Metallic border gradient */}
      <linearGradient id="hud-border" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#8B7355" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.6" />
      </linearGradient>

      {/* Star glow filter */}
      <filter id="hud-star-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FACC15" floodOpacity="0.7" />
      </filter>
    </defs>

    {/* ─── Main panel body ─── */}
    <rect
      x="36"
      y="8"
      width={vb.width - 72}
      height={vb.height - 16}
      rx="14"
      ry="14"
      fill="url(#hud-panel)"
      stroke="url(#hud-border)"
      strokeWidth="1.5"
      filter="url(#hud-glow)"
    />

    {/* ─── Left wing (behind guardian) ─── */}
    <path
      d={`M ${s.guardian.cx + s.guardian.r - 4} ${vb.height * 0.2}
          L 38 ${vb.height * 0.2}
          Q 28 ${vb.height * 0.2} 28 ${vb.height * 0.3}
          L 28 ${vb.height * 0.7}
          Q 28 ${vb.height * 0.8} 38 ${vb.height * 0.8}
          L ${s.guardian.cx + s.guardian.r - 4} ${vb.height * 0.8}`}
      fill="url(#hud-panel)"
      stroke="url(#hud-border)"
      strokeWidth="1.5"
    />

    {/* ─── Right wing (behind moves) ─── */}
    <path
      d={`M ${s.moves.cx - s.moves.r + 4} ${vb.height * 0.2}
          L ${vb.width - 38} ${vb.height * 0.2}
          Q ${vb.width - 28} ${vb.height * 0.2} ${vb.width - 28} ${vb.height * 0.3}
          L ${vb.width - 28} ${vb.height * 0.7}
          Q ${vb.width - 28} ${vb.height * 0.8} ${vb.width - 38} ${vb.height * 0.8}
          L ${s.moves.cx - s.moves.r + 4} ${vb.height * 0.8}`}
      fill="url(#hud-panel)"
      stroke="url(#hud-border)"
      strokeWidth="1.5"
    />

    {/* ─── Guardian socket ─── */}
    <circle cx={s.guardian.cx} cy={s.guardian.cy} r={s.guardian.r + 3} fill="none" stroke="url(#hud-ring)" strokeWidth="3" />
    <circle cx={s.guardian.cx} cy={s.guardian.cy} r={s.guardian.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />

    {/* ─── Level socket ─── */}
    <circle cx={s.level.cx} cy={s.level.cy} r={s.level.r + 2} fill="none" stroke="url(#hud-ring)" strokeWidth="2" />
    <circle cx={s.level.cx} cy={s.level.cy} r={s.level.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />

    {/* ─── Stars — engraved, filled based on starsEarned ─── */}
    {[0, 1, 2].map((i) => {
      const starCx = s.stars.x + s.stars.width / 2 - 28 + i * 28;
      const starCy = s.stars.y + s.stars.height / 2;
      const sr = 8;
      const earned = starsEarned > i;
      return (
        <polygon
          key={i}
          points={starPoints(starCx, starCy, sr, sr * 0.4)}
          fill={earned ? "#FACC15" : "#0a0e1a"}
          stroke={earned ? "#FACC15" : "#3a3520"}
          strokeWidth={earned ? "0.5" : "0.8"}
          opacity={earned ? 1 : 0.5}
          filter={earned ? "url(#hud-star-glow)" : undefined}
        />
      );
    })}

    {/* ─── Score channel ─── */}
    <rect
      x={s.scoreBar.x}
      y={s.scoreBar.y}
      width={s.scoreBar.width}
      height={s.scoreBar.height}
      rx="6"
      fill="url(#hud-channel)"
      stroke="#1a1e2e"
      strokeWidth="1"
    />

    {/* ─── Moves socket ─── */}
    <circle cx={s.moves.cx} cy={s.moves.cy} r={s.moves.r + 3} fill="none" stroke="url(#hud-ring)" strokeWidth="3" />
    <circle cx={s.moves.cx} cy={s.moves.cy} r={s.moves.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />

    {/* ─── Gear teeth on moves socket ─── */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const outerR = s.moves.r + 7;
      const toothW = 4;
      const toothH = 5;
      const tx = s.moves.cx + Math.cos(angle) * outerR;
      const ty = s.moves.cy + Math.sin(angle) * outerR;
      return (
        <rect
          key={i}
          x={tx - toothW / 2}
          y={ty - toothH / 2}
          width={toothW}
          height={toothH}
          rx="1"
          fill="#6B5B3E"
          opacity="0.5"
          transform={`rotate(${i * 30}, ${tx}, ${ty})`}
        />
      );
    })}

    {/* ─── Constraint sockets (0, 1, or 2) ─── */}
    {constraintCount >= 1 && (
      <>
        <circle cx={s.constraint1.cx} cy={s.constraint1.cy} r={s.constraint1.r + 2} fill="none" stroke="url(#hud-ring)" strokeWidth="2" />
        <circle cx={s.constraint1.cx} cy={s.constraint1.cy} r={s.constraint1.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />
      </>
    )}
    {constraintCount >= 2 && (
      <>
        <circle cx={s.constraint2.cx} cy={s.constraint2.cy} r={s.constraint2.r + 2} fill="none" stroke="url(#hud-ring)" strokeWidth="2" />
        <circle cx={s.constraint2.cx} cy={s.constraint2.cy} r={s.constraint2.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />
      </>
    )}

    {/* ─── Thin decorative line ─── */}
    <line
      x1={s.level.cx + s.level.r + 8}
      y1={s.scoreBar.y - 2}
      x2={s.moves.cx - s.moves.r - 8}
      y2={s.scoreBar.y - 2}
      stroke="#C9A96E"
      strokeWidth="0.5"
      opacity="0.2"
    />
  </svg>
);

/** Generate 5-pointed star polygon points */
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * 36 - 90) * (Math.PI / 180);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

export default HudBarSvg;
