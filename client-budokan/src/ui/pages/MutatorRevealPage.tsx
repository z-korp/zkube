import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";

import { getThemeColors, type ThemeId } from "@/config/themes";
import { getBonusType, getMutatorDef } from "@/config/mutatorConfig";
import { getZoneGuardian } from "@/config/bossCharacters";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { useGame } from "@/hooks/useGame";
import GuardianGreeting from "@/ui/components/map/GuardianGreeting";
import ZoneBackground from "@/ui/components/map/ZoneBackground";

const ROLL_DURATION_MS = 1500;
const ROLL_FRAME_MS = 110;

const MutatorRevealPage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate as ThemeId);

  const gameId = useNavigationStore((s) => s.gameId);
  const navigate = useNavigationStore((s) => s.navigate);
  const goBack = useNavigationStore((s) => s.goBack);

  const { game } = useGame({ gameId: gameId ?? undefined, shouldLog: false });
  const mapZoneId = useNavigationStore((s) => s.mapZoneId);
  const guardian = getZoneGuardian(mapZoneId || 1);

  const mutatorId = game?.activeMutatorId ?? 0;
  const bonusTypeId = game?.bonusType ?? 0;
  const bonusCharges = game?.bonusCharges ?? 0;
  const mutator = getMutatorDef(mutatorId);
  const bonus = getBonusType(bonusTypeId);

  const isNoMutator = mutatorId === 0;
  const rollPool = useMemo(
    () => [getMutatorDef(1).icon, getMutatorDef(2).icon, getMutatorDef(1).icon, getMutatorDef(2).icon],
    [],
  );

  const [rollingIcon, setRollingIcon] = useState(rollPool[0]);
  const [rollKey, setRollKey] = useState(0);
  const [isRolling, setIsRolling] = useState(!isNoMutator);
  const [isSettled, setIsSettled] = useState(isNoMutator);
  const [pulseReady, setPulseReady] = useState(false);

  useEffect(() => {
    setIsRolling(!isNoMutator);
    setIsSettled(isNoMutator);
    setPulseReady(false);
  }, [isNoMutator, mutatorId]);

  useEffect(() => {
    if (!isRolling) return;

    const interval = window.setInterval(() => {
      const next = rollPool[Math.floor(Math.random() * rollPool.length)];
      setRollingIcon(next);
      setRollKey((k) => k + 1);
    }, ROLL_FRAME_MS);

    const done = window.setTimeout(() => {
      window.clearInterval(interval);
      setIsRolling(false);
      setIsSettled(true);
    }, ROLL_DURATION_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [isRolling, rollPool]);

  useEffect(() => {
    if (!isSettled) return;
    const effectRows = Math.max(mutator.effects.length, bonusTypeId > 0 ? 2 : 0);
    const delay = 900 + effectRows * 100;
    const timer = window.setTimeout(() => setPulseReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [bonusTypeId, isSettled, mutator.effects.length]);

  const displayIcon = isRolling ? rollingIcon : mutator.icon;

  // Endless mode: show guardian greeting overlay instead of rolling animation
  if (game?.mode === 1) {
    const zoneThemeId = `theme-${Math.min(10, Math.max(1, mapZoneId || 1))}` as ThemeId;
    const zoneColors = getThemeColors(zoneThemeId);
    return (
      <div className="relative h-full">
        <ZoneBackground zone={mapZoneId || 1} themeId={zoneThemeId} />
        <GuardianGreeting
          colors={zoneColors}
          guardian={guardian}
          mode="endless"
          activeMutatorId={mutatorId}
          onClose={() => {
            if (gameId !== null) navigate("play", gameId);
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex h-full min-h-0 flex-col px-5 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <button
        onClick={goBack}
        className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
        style={{ color: colors.accent, background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <ChevronLeft size={20} />
      </button>

      <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center">
        {!game ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${colors.accent}66`, borderTopColor: "transparent" }}
            />
            <p className="font-sans text-[11px] uppercase tracking-[0.16em]" style={{ color: colors.textMuted }}>
              Syncing run...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${colors.accent}30` }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${displayIcon}-${rollKey}-${isSettled}`}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={
                    isSettled
                      ? {
                          opacity: 1,
                          scale: [0, 1.2, 1],
                          rotate: [0, 5, 0],
                        }
                      : { opacity: 1, scale: 1, rotate: 0 }
                  }
                  exit={{ opacity: 0, scale: 0.75, rotate: 10 }}
                  transition={
                    isSettled
                      ? {
                          scale: { type: "spring", stiffness: 260, damping: 16 },
                          rotate: { duration: 0.45 },
                        }
                      : { duration: 0.09 }
                  }
                  className="text-[68px] leading-none"
                  style={{ filter: `drop-shadow(0 0 20px ${colors.accent}80)` }}
                >
                  {displayIcon}
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.p
              className="font-sans text-[11px] italic text-white/60"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: isSettled ? 0 : 30, opacity: isSettled ? 1 : 0 }}
              transition={{ delay: isSettled ? 0.2 : 0, duration: 0.35 }}
            >
              {guardian.emoji} {guardian.name} grants you:
            </motion.p>

            <motion.p
              className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: colors.accent }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: isSettled ? 0 : 30, opacity: isSettled ? 1 : 0 }}
              transition={{ delay: isSettled ? 0.3 : 0, duration: 0.35 }}
            >
              Your Mutator
            </motion.p>

            <motion.h1
              className="mt-1 font-display text-[28px] font-black"
              style={{ color: colors.text, textShadow: colors.glow }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: isSettled ? 0 : 30, opacity: isSettled ? 1 : 0 }}
              transition={{ delay: isSettled ? 0.4 : 0, duration: 0.35 }}
            >
              {mutator.name}
            </motion.h1>

            <div className="mt-5 flex w-full flex-col gap-2.5">
              {(mutator.effects.length ? mutator.effects : ["Standard rules apply", "No mutator modifiers this run"]).map(
                (effect, index) => (
                  <motion.div
                    key={`${effect}-${index}`}
                    className="rounded-xl px-3.5 py-2.5 backdrop-blur-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: isSettled ? 0 : 10, opacity: isSettled ? 1 : 0 }}
                    transition={{ delay: isSettled ? 0.55 + index * 0.1 : 0, duration: 0.3 }}
                  >
                    <p className="font-sans text-[11px]" style={{ color: colors.text }}>
                      {effect}
                    </p>
                  </motion.div>
                ),
              )}

              {bonusTypeId > 0 && (
                <motion.div
                  className="mt-1 rounded-xl px-3.5 py-2.5 backdrop-blur-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${colors.accent2}40` }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: isSettled ? 0 : 10, opacity: isSettled ? 1 : 0 }}
                  transition={{ delay: isSettled ? 0.75 + mutator.effects.length * 0.1 : 0, duration: 0.3 }}
                >
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.05em]" style={{ color: colors.accent2 }}>
                    Bonus: {bonus.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <img src={bonus.icon} alt={bonus.name} className="h-5 w-5" draggable={false} />
                    <p className="font-sans text-[10px]" style={{ color: colors.text }}>
                      {bonus.description}
                    </p>
                  </div>
                  <p className="mt-1 font-sans text-[10px]" style={{ color: colors.textMuted }}>
                    {bonusCharges} charge{bonusCharges === 1 ? "" : "s"} available
                  </p>
                </motion.div>
              )}
            </div>

            <motion.button
              disabled={gameId === null}
              onClick={() => {
                if (gameId !== null) {
                  const isEndless = game?.mode === 1;
                  navigate(isEndless ? "play" : "map", gameId);
                }
              }}
              className="mt-6 w-full rounded-xl py-3.5 font-display text-sm font-extrabold tracking-[0.1em] text-white transition-opacity disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                boxShadow: pulseReady
                  ? `0 0 22px ${colors.accent}80, inset 0 0 0 1px rgba(255,255,255,0.15)`
                  : `0 0 0 ${colors.accent}00`,
              }}
              animate={
                pulseReady
                  ? {
                      boxShadow: [
                        `0 0 12px ${colors.accent}66, inset 0 0 0 1px rgba(255,255,255,0.12)`,
                        `0 0 28px ${colors.accent}99, inset 0 0 0 1px rgba(255,255,255,0.22)`,
                        `0 0 12px ${colors.accent}66, inset 0 0 0 1px rgba(255,255,255,0.12)`,
                      ],
                    }
                  : undefined
              }
              transition={pulseReady ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY } : undefined}
              whileTap={{ scale: 0.98 }}
            >
              {game?.mode === 1 ? "START ENDLESS ▶" : "ENTER MAP ▶"}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MutatorRevealPage;
