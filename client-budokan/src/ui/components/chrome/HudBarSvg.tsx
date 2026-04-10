import { HUD_BAR } from "./chromeLayout";

const { viewBox: vb, sockets: s } = HUD_BAR;

const HudBarSvg: React.FC = () => (
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
    </defs>

    {/* ─── Main panel body ─── */}
    <rect
      x="36"
      y="16"
      width={vb.width - 72}
      height={vb.height - 32}
      rx="14"
      ry="14"
      fill="url(#hud-panel)"
      stroke="url(#hud-border)"
      strokeWidth="1.5"
      filter="url(#hud-glow)"
    />

    {/* ─── Left wing (behind guardian) ─── */}
    <path
      d={`M ${s.guardian.cx + s.guardian.r - 4} ${vb.height * 0.25}
          L 38 ${vb.height * 0.25}
          Q 28 ${vb.height * 0.25} 28 ${vb.height * 0.35}
          L 28 ${vb.height * 0.65}
          Q 28 ${vb.height * 0.75} 38 ${vb.height * 0.75}
          L ${s.guardian.cx + s.guardian.r - 4} ${vb.height * 0.75}`}
      fill="url(#hud-panel)"
      stroke="url(#hud-border)"
      strokeWidth="1.5"
    />

    {/* ─── Right wing (behind moves) ─── */}
    <path
      d={`M ${s.moves.cx - s.moves.r + 4} ${vb.height * 0.25}
          L ${vb.width - 38} ${vb.height * 0.25}
          Q ${vb.width - 28} ${vb.height * 0.25} ${vb.width - 28} ${vb.height * 0.35}
          L ${vb.width - 28} ${vb.height * 0.65}
          Q ${vb.width - 28} ${vb.height * 0.75} ${vb.width - 38} ${vb.height * 0.75}
          L ${s.moves.cx - s.moves.r + 4} ${vb.height * 0.75}`}
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

    {/* ─── Stars area — 3 engraved stars ─── */}
    {[0, 1, 2].map((i) => {
      const starCx = s.stars.x + s.stars.width / 2 - 30 + i * 30;
      const starCy = s.stars.y + s.stars.height / 2;
      const sr = 8;
      return (
        <polygon
          key={i}
          points={starPoints(starCx, starCy, sr, sr * 0.4)}
          fill="#0a0e1a"
          stroke="#3a3520"
          strokeWidth="0.8"
          opacity="0.5"
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

    {/* ─── Thin decorative line across center ─── */}
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
