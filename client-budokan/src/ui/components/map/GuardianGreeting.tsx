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

  // Build dialog steps
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
      className="absolute inset-0 z-40 flex flex-col items-center justify-end bg-black/50 px-3 pb-8 md:justify-center md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleAdvance}
    >
      {/* Portrait — centered above the speech bubble */}
      <motion.div
        className="mb-3 shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
      >
        <img
          src={portraitSrc}
          alt={guardian.name}
          className="h-24 w-24 rounded-2xl object-cover"
          style={{ border: `3px solid ${colors.accent}66`, boxShadow: `0 0 28px ${colors.accent}33, 0 8px 24px rgba(0,0,0,0.5)` }}
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.querySelector(".emoji-fallback")?.classList.remove("hidden");
          }}
        />
        <span className="emoji-fallback hidden flex h-24 w-24 items-center justify-center rounded-2xl text-4xl" style={{ background: `${colors.accent}22`, border: `3px solid ${colors.accent}66` }}>
          {guardian.emoji}
        </span>
      </motion.div>

      {/* Speech bubble — comic strip style */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bubble tail pointing up */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 h-0 w-0"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: `8px solid ${colors.accent}30`,
          }}
        />

        <div
          className="rounded-2xl border-2 px-5 py-4"
          style={{
            background: `linear-gradient(180deg, ${colors.backgroundGradientStart ?? "#0a1628"}F5, ${colors.background ?? "#050a12"}FA)`,
            borderColor: `${colors.accent}30`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${colors.accent}15`,
          }}
        >
          {/* Name bar */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-black text-white">{guardian.name}</span>
              <span className="font-sans text-[10px] font-semibold" style={{ color: colors.accent }}>{guardian.title}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase text-white/25 transition-colors hover:text-white/50"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Skip
            </button>
          </div>

          {/* Dialog text */}
          <div className="min-h-[48px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-sans text-[15px] leading-relaxed text-white/90"
              >
                {steps[step]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress dots + advance */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 16 : 6,
                    background: i === step ? colors.accent : i < step ? `${colors.accent}66` : "rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
              className="rounded-full px-3 py-1 font-sans text-[12px] font-bold transition-colors"
              style={{ background: `${colors.accent}25`, color: colors.accent, border: `1px solid ${colors.accent}40` }}
            >
              {isLastStep ? (mode === "endless" ? "Enter Arena" : "Begin") : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GuardianGreeting;
