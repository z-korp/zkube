import { motion } from "motion/react";
import type { ThemeColors } from "@/config/themes";
import type { ZoneGuardian } from "@/config/bossCharacters";
import { getGuardianPortrait } from "@/config/bossCharacters";
import { getMutatorDef } from "@/config/mutatorConfig";

/** Split text at first period: headline in accent, rest in default color */
function headlineAccent(text: string, accent: string): React.ReactNode {
  const dotIdx = text.indexOf(".");
  if (dotIdx === -1) return <span style={{ color: accent }} className="font-semibold">{text}</span>;
  const headline = text.slice(0, dotIdx + 1);
  const rest = text.slice(dotIdx + 1);
  return (
    <>
      <span style={{ color: accent }} className="font-semibold">{headline}</span>
      {rest && <span>{rest}</span>}
    </>
  );
}

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
    ? "The arena awaits. No end, only how far you can push."
    : mode === "daily"
      ? guardian.dailyGreeting
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
              maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 95%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 95%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
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
          <p className="font-sans text-sm leading-relaxed text-white/85">
            {greeting}
          </p>

          {/* Hint: daily builds from actual mutators, story uses zone hint */}
          {mode === "daily" && (activeMutator || passiveMutator) ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {activeMutator && (
                <p className="font-sans text-sm leading-relaxed text-white/70">
                  {activeMutator.icon} <span className="font-semibold" style={{ color: colors.accent }}>{activeMutator.name}.</span>{" "}
                  {activeMutator.description}
                </p>
              )}
              {passiveMutator && (
                <p className="font-sans text-sm leading-relaxed text-white/70">
                  {passiveMutator.icon} <span className="font-semibold" style={{ color: colors.accent }}>{passiveMutator.name}.</span>{" "}
                  {passiveMutator.description}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 font-sans text-sm leading-relaxed text-white/70">
              {headlineAccent(guardian.zoneHint, colors.accent)}
            </p>
          )}

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
