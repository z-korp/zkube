import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";

interface ArcadeButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  accentOverride?: string;
}

const ArcadeButton: React.FC<ArcadeButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  accentOverride,
}) => {
  const { themeTemplate } = useTheme();
  const themeColors = getThemeColors(themeTemplate);
  const accent = accentOverride ?? themeColors.accent;

  return (
    <motion.button
      whileHover={{ scale: 1 }}
      whileTap={{ scale: disabled ? 1 : 0.985, y: disabled ? 0 : 2 }}
      disabled={disabled}
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-center font-sans text-[18px] font-extrabold uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
      style={{
        color: "#0a1628",
        background: `linear-gradient(180deg, ${accent} 0%, ${accent} 76%, ${accent}D9 100%)`,
        borderColor: `${accent}66`,
        boxShadow: `0 10px 0 ${accent}55, 0 12px 28px -12px ${accent}CC, inset 0 2px 0 rgba(255,255,255,0.45)`,
      }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] opacity-60" />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
};

export default ArcadeButton;
