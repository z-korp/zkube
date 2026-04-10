import { HUD_BAR } from "./chromeLayout";

const { viewBox: vb, panel: p, sockets: s } = HUD_BAR;

interface HudBarSvgProps {
  starsEarned?: number;
}

const HudBarSvg: React.FC<HudBarSvgProps> = ({ starsEarned = 0 }) => {
  return (
    <svg
      viewBox={`0 0 ${vb.width} ${vb.height}`}
      className="w-full h-auto block"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="hud-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1e2e" />
          <stop offset="50%" stopColor="#0f1219" />
          <stop offset="100%" stopColor="#1a1e2e" />
        </linearGradient>

        <linearGradient id="hud-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B7355" />
          <stop offset="30%" stopColor="#C9A96E" />
          <stop offset="50%" stopColor="#DFC088" />
          <stop offset="70%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#6B5B3E" />
        </linearGradient>

        <radialGradient id="hud-recess">
          <stop offset="0%" stopColor="#050710" />
          <stop offset="85%" stopColor="#0a0e1a" />
          <stop offset="100%" stopColor="#141824" />
        </radialGradient>

        <linearGradient id="hud-channel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080b14" />
          <stop offset="50%" stopColor="#060912" />
          <stop offset="100%" stopColor="#0a0e1a" />
        </linearGradient>

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

        <filter id="hud-glow" x="-5%" y="-15%" width="110%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
        </filter>

        <linearGradient id="hud-border" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#8B7355" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.6" />
        </linearGradient>

        <filter id="hud-star-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FACC15" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* ─── Main panel body (compact — portrait & moves overlap edges) ─── */}
      <rect
        x={p.x} y={p.y} width={p.width} height={p.height}
        rx={p.rx} ry={p.rx}
        fill="url(#hud-panel)"
        stroke="url(#hud-border)"
        strokeWidth="1.5"
        filter="url(#hud-glow)"
      />

      {/* ─── Guardian socket — mask covers panel border behind it ─── */}
      <circle cx={s.guardian.cx} cy={s.guardian.cy} r={s.guardian.r + 5} fill="#0f1219" />
      <circle cx={s.guardian.cx} cy={s.guardian.cy} r={s.guardian.r + 3} fill="none" stroke="url(#hud-ring)" strokeWidth="3" />
      <circle cx={s.guardian.cx} cy={s.guardian.cy} r={s.guardian.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />

      {/* ─── Stars — filled based on starsEarned ─── */}
      {[0, 1, 2].map((i) => {
        const starCx = s.stars.x + s.stars.width / 2 - 26 + i * 26;
        const starCy = s.stars.y + s.stars.height / 2;
        const sr = 7;
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
        x={s.scoreBar.x} y={s.scoreBar.y}
        width={s.scoreBar.width} height={s.scoreBar.height}
        rx="5"
        fill="url(#hud-channel)"
        stroke="#1a1e2e"
        strokeWidth="1"
      />

      {/* Combo rendered as fire badge in HTML overlay — no SVG socket needed */}

      {/* ─── Moves socket — mask covers panel border behind it ─── */}
      <circle cx={s.moves.cx} cy={s.moves.cy} r={s.moves.r + 5} fill="#0f1219" />
      <circle cx={s.moves.cx} cy={s.moves.cy} r={s.moves.r + 3} fill="none" stroke="url(#hud-ring)" strokeWidth="3" />
      <circle cx={s.moves.cx} cy={s.moves.cy} r={s.moves.r} fill="url(#hud-recess)" filter="url(#hud-inner-shadow)" />

      {/* Constraints rendered by ProgressRing in the HTML overlay — no SVG sockets needed */}

    </svg>
  );
};

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
