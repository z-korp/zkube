type IconButtonSize = "sm" | "md" | "lg";
type IconButtonVariant = "ghost" | "solid";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  size?: IconButtonSize;
  badge?: number;
  variant?: IconButtonVariant;
  className?: string;
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost:
    "bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-white",
  solid:
    "bg-slate-800/70 hover:bg-slate-700/70 text-slate-200 hover:text-white",
};

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  size = "md",
  badge,
  variant = "ghost",
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-lg transition-colors ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1">
          {badge}
        </span>
      )}
    </button>
  );
};

export default IconButton;
