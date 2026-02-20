type RingColor = "green" | "orange" | "red" | "blue";

interface ProgressRingProps {
  progress: number;
  size: number;
  color: RingColor;
  icon: React.ReactNode;
  badgeTopLeft?: string;
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
  badgeBottomRight,
}) => {
  const strokeWidth = Math.max(2, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;
  const innerDiameter = size - strokeWidth * 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>

      <div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden"
        style={{ width: innerDiameter, height: innerDiameter }}
      >
        {icon}
      </div>

      {badgeTopLeft && (
        <span className="absolute -top-1.5 -left-1.5 bg-slate-800 border border-slate-500 text-white text-[8px] font-bold font-['Tilt_Prism'] min-w-[16px] h-[14px] flex items-center justify-center rounded-full px-1 leading-none z-20">
          {badgeTopLeft}
        </span>
      )}

      {badgeBottomRight && (
        <span className="absolute -bottom-1.5 -right-1.5 bg-slate-800 border border-slate-500 text-white text-[8px] font-bold font-['Tilt_Prism'] min-w-[16px] h-[14px] flex items-center justify-center rounded-full px-1 leading-none z-20">
          {badgeBottomRight}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
