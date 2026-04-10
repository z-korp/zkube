type RingColor = "green" | "orange" | "red" | "blue";

interface ProgressRingProps {
  progress: number;
  size: number;
  color: RingColor;
  icon: React.ReactNode;
  badgeTopLeft?: string;
  badgeBottomLeft?: string;
  badgeBottomRight?: string;
}

const COLOR_MAP: Record<RingColor, string> = {
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  blue: "#3b82f6",
};

const TRACK_COLOR = "#334155";

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  color,
  icon,
  badgeTopLeft,
  badgeBottomLeft,
  badgeBottomRight,
}) => {
  const strokeWidth = Math.max(3, size * 0.14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;
  const innerDiameter = size - strokeWidth * 2;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {/* Track + progress arc */}
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={COLOR_MAP[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>

      {/* Icon */}
      <div
        className="absolute z-10 flex items-center justify-center rounded-full overflow-hidden"
        style={{ width: innerDiameter, height: innerDiameter, left: strokeWidth, top: strokeWidth }}
      >
        {icon}
      </div>


      {badgeTopLeft && (
        <span className="absolute -top-0.5 -left-0.5 bg-slate-800 border border-slate-500 text-white font-sans text-[clamp(7px,1.8vw,10px)] font-bold min-w-[clamp(14px,3.5vw,18px)] h-[clamp(14px,3.5vw,18px)] flex items-center justify-center rounded-full px-0.5 leading-none shadow-[0_0_4px_rgba(0,0,0,0.5)] z-20">
          {badgeTopLeft}
        </span>
      )}

      {badgeBottomLeft && (
        <span className="absolute -bottom-0.5 -left-0.5 bg-slate-800 border border-slate-500 text-white font-sans text-[clamp(7px,1.8vw,10px)] font-bold min-w-[clamp(14px,3.5vw,18px)] h-[clamp(14px,3.5vw,18px)] flex items-center justify-center rounded-full px-0.5 leading-none shadow-[0_0_4px_rgba(0,0,0,0.5)] z-20">
          {badgeBottomLeft}
        </span>
      )}

      {badgeBottomRight && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-slate-800 border border-slate-500 text-white font-sans text-[clamp(7px,1.8vw,10px)] font-bold min-w-[clamp(14px,3.5vw,18px)] h-[clamp(14px,3.5vw,18px)] flex items-center justify-center rounded-full px-0.5 leading-none shadow-[0_0_4px_rgba(0,0,0,0.5)] z-20">
          {badgeBottomRight}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
