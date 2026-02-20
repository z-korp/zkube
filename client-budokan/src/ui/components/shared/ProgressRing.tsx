type RingColor = "green" | "orange" | "red" | "blue";

interface ProgressRingProps {
  progress: number;
  size: number;
  color: RingColor;
  icon: React.ReactNode;
  badge?: string;
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
  badge,
}) => {
  const strokeWidth = Math.max(2, size * 0.1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;

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

      <div className="relative z-10 flex items-center justify-center">
        {icon}
      </div>

      {badge && (
        <span className="absolute -bottom-1 -right-1 bg-slate-800 border border-slate-600 text-white text-[9px] font-['Tilt_Prism'] min-w-[18px] h-[14px] flex items-center justify-center rounded-full px-1 leading-none">
          {badge}
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
