type BadgeSize = "sm" | "md" | "lg";

interface LevelBadgeProps {
  level: number;
  size?: BadgeSize;
}

const SIZE_CONFIG: Record<BadgeSize, { container: string; text: string }> = {
  sm: { container: "w-7 h-7", text: "text-xs" },
  md: { container: "w-9 h-9", text: "text-sm" },
  lg: { container: "w-12 h-12", text: "text-lg" },
};

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = "md",
}) => {
  const config = SIZE_CONFIG[size];

  return (
    <div
      className={`${config.container} rounded-full border-2 border-yellow-500 bg-slate-900 flex items-center justify-center shadow-[0_0_8px_rgba(250,204,21,0.3)]`}
    >
      <span className={`font-['Tilt_Prism'] ${config.text} text-yellow-400 leading-none`}>
        {level}
      </span>
    </div>
  );
};

export default LevelBadge;
