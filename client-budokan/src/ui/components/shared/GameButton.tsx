import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface GameButtonProps {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-500/25",
  secondary:
    "bg-slate-700 hover:bg-slate-600 shadow-slate-700/25",
  danger:
    "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/25",
};

const GameButton: React.FC<GameButtonProps> = ({
  label,
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={`w-full py-3.5 rounded-xl text-white font-semibold text-base md:text-lg shadow-lg transition-shadow flex items-center justify-center gap-2 ${
        VARIANT_CLASSES[variant]
      } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {label}
    </motion.button>
  );
};

export default GameButton;
