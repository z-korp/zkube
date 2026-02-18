import { motion } from "motion/react";

type NavVariant = "orange" | "purple" | "green" | "blue";

interface NavButtonProps {
  label: string;
  variant: NavVariant;
  onClick: () => void;
  badge?: string | number;
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<NavVariant, string> = {
  orange:
    "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 shadow-orange-500/25",
  purple:
    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/25",
  green:
    "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-500/25",
  blue:
    "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 shadow-blue-500/25",
};

const NavButton: React.FC<NavButtonProps> = ({
  label,
  variant,
  onClick,
  badge,
  disabled = false,
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`relative w-full max-w-[340px] py-4 md:py-5 rounded-xl text-white font-['Fredericka_the_Great'] text-lg md:text-xl tracking-wide shadow-lg transition-shadow ${
        VARIANT_CLASSES[variant]
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {label}
      {badge !== undefined && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-['Bangers'] min-w-[22px] h-[22px] flex items-center justify-center rounded-full px-1.5 shadow-md">
          {badge}
        </span>
      )}
    </motion.button>
  );
};

export default NavButton;
