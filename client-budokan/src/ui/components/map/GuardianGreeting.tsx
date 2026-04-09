import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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

  // Build dialog steps based on context
  const steps: string[] = [];

  if (mode === "endless") {
    steps.push("The arena awaits. Here, there is no end — only how far you can push.");
    if (passiveMutator) steps.push(`${passiveMutator.icon} ${passiveMutator.name} shapes the arena. ${passiveMutator.description}`);
    steps.push("Survive as long as you can. The leaderboard remembers the strongest.");
  } else {
    steps.push(guardian.greeting);
    if (activeMutator && passiveMutator) {
      steps.push(`${activeMutator.icon} ${activeMutator.name} will grant you power. ${activeMutator.effects[0] ?? activeMutator.description}`);
      steps.push(`${passiveMutator.icon} ${passiveMutator.name} shapes your journey. ${passiveMutator.effects[0] ?? passiveMutator.description}`);
    } else if (activeMutator) {
      steps.push(`${activeMutator.icon} ${activeMutator.name} will be your ally. ${activeMutator.description}`);
    }
    if (isFirstVisit) {
      steps.push("Earn 3 stars on every level for the perfection bonus — 20 bonus stars await the worthy. Now, prove yourself!");
    }
  }

  const [step, setStep] = useState(0);
  const isLastStep = step >= steps.length - 1;

  const handleAdvance = () => {
    if (isLastStep) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm px-3 pb-6 md:items-center md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleAdvance}
    >
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 shadow-2xl backdrop-blur-xl"
        style={{ background: `linear-gradient(180deg, ${colors.backgroundGradientStart ?? "#0a1628"}F2, ${colors.background ?? "#050a12"}FA)` }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Portrait */}
          <div className="shrink-0">
            <img
              src={portraitSrc}
              alt={guardian.name}
              className="h-16 w-16 rounded-xl object-cover"
              style={{ border: `2px solid ${colors.accent}44`, boxShadow: `0 0 16px ${colors.accent}22` }}
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.querySelector(".emoji-fallback")?.classList.remove("hidden");
              }}
            />
            <span className="emoji-fallback hidden flex h-16 w-16 items-center justify-center rounded-xl text-3xl" style={{ background: `${colors.accent}22`, border: `2px solid ${colors.accent}44` }}>
              {guardian.emoji}
            </span>
          </div>

          {/* Dialog */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-black text-white">{guardian.name}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="font-sans text-[10px] font-bold uppercase text-white/30 hover:text-white/60"
              >
                Skip
              </button>
            </div>
            <p className="font-sans text-[10px] font-semibold" style={{ color: colors.accent }}>{guardian.title}</p>

            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-2 font-sans text-[13px] leading-relaxed text-white/85"
              >
                {steps[step]}
              </motion.p>
            </AnimatePresence>

            {/* Progress dots + tap hint */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === step ? 12 : 6,
                      background: i === step ? colors.accent : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
                className="font-sans text-[11px] font-bold"
                style={{ color: colors.accent }}
              >
                {isLastStep ? (mode === "endless" ? "Enter Arena >" : "Begin >") : "Next >"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GuardianGreeting;
