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
    "bg-gradient-to-b from-amber-400 via-orange-500 to-orange-700 border-orange-800 shadow-orange-900/40",
  purple:
    "bg-gradient-to-b from-purple-400 via-purple-600 to-indigo-800 border-indigo-900 shadow-purple-900/40",
  green:
    "bg-gradient-to-b from-emerald-400 via-emerald-600 to-green-800 border-green-900 shadow-green-900/40",
  blue:
    "bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-800 border-blue-900 shadow-blue-900/40",
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
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97, y: 1 }}
      className={`relative w-full max-w-[340px] py-4 md:py-5 rounded-xl border-2 border-b-4 text-white font-['Fredericka_the_Great'] text-lg md:text-xl tracking-wide shadow-lg ${
        VARIANT_CLASSES[variant]
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:border-b-2 active:mt-[2px]"}`}
      style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}
    >
      <span className="absolute inset-x-0 top-0 h-[1px] rounded-t-xl bg-white/25" />
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
