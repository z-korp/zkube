import { motion } from "motion/react";
import { X } from "lucide-react";
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
  onClose: () => void;
}

const GuardianGreeting: React.FC<GuardianGreetingProps> = ({
  colors,
  guardian,
  mode,
  activeMutatorId,
  passiveMutatorId,
  onClose,
}) => {
  const portraitSrc = getGuardianPortrait(guardian.zoneId);
  const activeMutator = activeMutatorId && activeMutatorId > 0 ? getMutatorDef(activeMutatorId) : null;
  const passiveMutator = passiveMutatorId && passiveMutatorId > 0 ? getMutatorDef(passiveMutatorId) : null;

  const greeting = mode === "endless"
    ? `The arena awaits. Here, there is no end — only how far you can push.`
    : guardian.greeting;

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl"
        style={{ background: `linear-gradient(180deg, ${colors.backgroundGradientStart ?? "#0a1628"}F0, ${colors.background ?? "#050a12"}F8)` }}
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md"
        >
          <X size={14} />
        </button>

        {/* Guardian portrait */}
        <div className="flex justify-center pt-5 pb-2">
          <div className="relative">
            <img
              src={portraitSrc}
              alt={guardian.name}
              className="h-28 w-28 rounded-2xl object-cover"
              style={{ border: `2px solid ${colors.accent}55`, boxShadow: `0 0 24px ${colors.accent}33` }}
              draggable={false}
              onError={(e) => {
                // Fallback to emoji if portrait not generated yet
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.querySelector(".emoji-fallback")?.classList.remove("hidden");
              }}
            />
            <span className="emoji-fallback hidden flex h-28 w-28 items-center justify-center rounded-2xl text-5xl" style={{ background: `${colors.accent}22`, border: `2px solid ${colors.accent}55` }}>
              {guardian.emoji}
            </span>
          </div>
        </div>

        {/* Name + title */}
        <div className="text-center px-4">
          <p className="font-display text-xl font-black text-white">{guardian.name}</p>
          <p className="font-sans text-[11px] font-semibold" style={{ color: colors.accent }}>{guardian.title}</p>
        </div>

        {/* Greeting */}
        <div className="mx-4 mt-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <p className="font-sans text-[13px] italic text-white/80 leading-relaxed text-center">
            "{greeting}"
          </p>
        </div>

        {/* Endless mode: mutator explanation */}
        {mode === "endless" && (activeMutator || passiveMutator) && (
          <div className="mx-4 mt-3 space-y-1.5">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">Arena Rules</p>
            {passiveMutator && (
              <div className="rounded-xl border border-purple-400/20 bg-purple-500/8 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{passiveMutator.icon}</span>
                  <span className="font-sans text-[11px] font-bold text-purple-300">{passiveMutator.name}</span>
                </div>
                <p className="mt-0.5 font-sans text-[10px] text-white/50">{passiveMutator.description}</p>
                {passiveMutator.effects.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {passiveMutator.effects.map((e) => (
                      <span key={e} className="rounded-full bg-purple-500/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-purple-200/70">{e}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeMutator && (
              <div className="rounded-xl border border-orange-400/20 bg-orange-500/8 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{activeMutator.icon}</span>
                  <span className="font-sans text-[11px] font-bold text-orange-300">{activeMutator.name}</span>
                </div>
                <p className="mt-0.5 font-sans text-[10px] text-white/50">{activeMutator.description}</p>
                {activeMutator.effects.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {activeMutator.effects.map((e) => (
                      <span key={e} className="rounded-full bg-orange-500/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-orange-200/70">{e}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <div className="px-4 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl py-2.5 font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors"
            style={{ background: `${colors.accent}33`, border: `1px solid ${colors.accent}55` }}
          >
            {mode === "endless" ? "Enter Arena" : "Begin"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GuardianGreeting;
