import { motion } from "motion/react";
import type { ThemeColors } from "@/config/themes";
import type { ZoneGuardian } from "@/config/bossCharacters";
import { getGuardianPortrait } from "@/config/bossCharacters";
import { getMutatorDef } from "@/config/mutatorConfig";

interface GuardianGreetingProps {
  colors: ThemeColors;
  guardian: ZoneGuardian;
  mode: "story" | "daily" | "endless";
  activeMutatorId?: number;
  passiveMutatorId?: number;
  isFirstVisit?: boolean;
  onClose: () => void;
}

const GuardianGreeting: React.FC<GuardianGreetingProps> = ({
  colors,
  guardian,
  mode,
  activeMutatorId,
  passiveMutatorId,
  isFirstVisit = false,
  onClose,
}) => {
  const portraitSrc = getGuardianPortrait(guardian.zoneId);
  const activeMutator = activeMutatorId && activeMutatorId > 0 ? getMutatorDef(activeMutatorId) : null;
  const passiveMutator = passiveMutatorId && passiveMutatorId > 0 ? getMutatorDef(passiveMutatorId) : null;

  const greeting = mode === "endless"
    ? "The arena awaits. Here, there is no end — only how far you can push."
    : guardian.greeting;

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Full-height portrait — seamlessly fading into background */}
      <div className="relative flex flex-1 min-h-0 items-end justify-center overflow-hidden">
        <motion.div
          className="relative h-[70%] max-h-[420px]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          <img
            src={portraitSrc}
            alt={guardian.name}
            className="h-full w-auto object-contain"
            style={{
              maskImage: "radial-gradient(ellipse 80% 85% at 50% 45%, black 40%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 85% at 50% 45%, black 40%, transparent 75%)",
            }}
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      </div>

      {/* Dialog panel — bottom, full width */}
      <motion.div
        className="shrink-0"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-2 mb-3 rounded-2xl border-2 px-4 pb-4 pt-3"
          style={{
            background: `linear-gradient(180deg, ${colors.backgroundGradientStart ?? "#0a1628"}F5, ${colors.background ?? "#050a12"}FA)`,
            borderColor: `${colors.accent}35`,
            boxShadow: `0 -4px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${colors.accent}15`,
          }}
        >
          {/* Name bar */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-black text-white">{guardian.name}</span>
              <span className="rounded-full px-2 py-0.5 font-sans text-[9px] font-bold uppercase" style={{ color: colors.accent, background: `${colors.accent}18` }}>
                {guardian.title}
              </span>
            </div>
          </div>

          {/* Greeting */}
          <p className="font-sans text-[15px] leading-relaxed text-white/90">
            {greeting}
          </p>

          {/* Zone hint */}
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-white/60">
            {guardian.zoneHint}
          </p>

          {/* Perfection hint on first visit */}
          {isFirstVisit && mode !== "endless" && (
            <p className="mt-2 font-sans text-[12px] text-pink-300/70">
              💎 Earn 3 stars on all 10 levels for +20★ perfection bonus
            </p>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="mt-3 w-full rounded-xl py-2.5 font-sans text-[13px] font-bold uppercase tracking-[0.06em] text-white transition-colors"
            style={{ background: `${colors.accent}30`, border: `1px solid ${colors.accent}50` }}
          >
            {mode === "endless" ? "Enter Arena" : isFirstVisit ? "Begin" : "Close"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GuardianGreeting;
