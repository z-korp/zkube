import { GRID_FRAME } from "./chromeLayout";

interface GridFrameSvgProps {
  /** Grid width in pixels */
  gridWidth: number;
  /** Grid height in pixels (main grid + next line) */
  gridHeight: number;
}

const { padding: PAD, borderWidth: BW, cornerRadius: CR } = GRID_FRAME;

const GridFrameSvg: React.FC<GridFrameSvgProps> = ({ gridWidth, gridHeight }) => {
  const totalW = gridWidth + PAD * 2;
  const totalH = gridHeight + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Dark stone border gradient */}
        <linearGradient id="gf-border" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.5" />
          <stop offset="20%" stopColor="#8B7355" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#6B5B3E" stopOpacity="0.2" />
          <stop offset="80%" stopColor="#8B7355" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.5" />
        </linearGradient>

        {/* Inner edge highlight */}
        <linearGradient id="gf-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>

        {/* Outer shadow */}
        <filter id="gf-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* ─── Outer border (inset by half stroke so full stroke is visible) ─── */}
      <rect
        x={BW / 2}
        y={BW / 2}
        width={totalW - BW}
        height={totalH - BW}
        rx={CR}
        ry={CR}
        fill="none"
        stroke="url(#gf-border)"
        strokeWidth={BW}
        filter="url(#gf-shadow)"
      />

      {/* ─── Inner border highlight ─── */}
      <rect
        x={BW + 1}
        y={BW + 1}
        width={totalW - BW * 2 - 2}
        height={totalH - BW * 2 - 2}
        rx={Math.max(0, CR - 2)}
        ry={Math.max(0, CR - 2)}
        fill="none"
        stroke="url(#gf-inner)"
        strokeWidth="1"
      />
    </svg>
  );
};

export default GridFrameSvg;
