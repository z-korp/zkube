import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { getBlockColors, getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { getMutatorDef } from "@/config/mutatorConfig";
import { ZONE_NAMES } from "@/config/profileData";
import { motion } from "motion/react";

const TROPHY_IMAGES: Record<number, string> = {
  1: "/assets/trophies/gold.png",
  2: "/assets/trophies/silver.png",
  3: "/assets/trophies/bronze.png",
};

const CountdownPill: React.FC<{ endTime: number; accent: string; border: string; text: string }> = ({ endTime, accent, border, text }) => {
  const [sec, setSec] = useState(() =>
    Math.max(0, endTime - Math.floor(Date.now() / 1000)),
  );
  useEffect(() => {
    const id = window.setInterval(() => {
      setSec(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [endTime]);

  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");

  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="rounded-lg border px-3 py-1 font-display text-[11px] font-bold shadow-sm backdrop-blur-md"
      style={{ borderColor: `${accent}80`, backgroundColor: border, color: text, boxShadow: `0 0 10px ${accent}33` }}
    >
      {sec > 0 ? `${h}:${m}:${s}` : "ENDED"}
    </motion.div>
  );
};

const DailyChallengePage: React.FC = () => {
  const { account } = useAccountCustom();
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const navigate = useNavigationStore((state) => state.navigate);
  const {
    setup: { systemCalls },
  } = useDojo();

  const { challenge, isLoading: challengeLoading } = useCurrentChallenge();
  const { entry, isRegistered } = usePlayerEntry(
    challenge?.challenge_id,
    account?.address,
  );
  const { entries: leaderboard } = useDailyLeaderboard(
    challenge?.challenge_id,
  );

  const [starting, setStarting] = useState(false);

  const now = useMemo(() => Math.floor(Date.now() / 1000), []);
  const isActive =
    challenge &&
    !challenge.settled &&
    challenge.start_time <= now &&
    challenge.end_time > now;

  const zoneName = challenge?.zone_id
    ? (ZONE_NAMES[challenge.zone_id] ?? `Zone ${challenge.zone_id}`)
    : null;
  const activeMutator = challenge?.active_mutator_id
    ? getMutatorDef(challenge.active_mutator_id)
    : null;
  const passiveMutator = challenge?.passive_mutator_id
    ? getMutatorDef(challenge.passive_mutator_id)
    : null;

  const starReward = entry?.star_reward
    ? BigInt(entry.star_reward)
    : 0n;

  const previewGrid = useMemo(() => {
    const seedSource = challenge ? BigInt((challenge as { seed?: bigint }).seed ?? challenge.challenge_id) : 1n;
    const shift = Number(seedSource % 11n);
    const rows = 5;
    const cols = 8;
    return Array.from({ length: rows * cols }).map((_, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      if (r < 2) return 0;
      const val = (r * cols + c + shift) % 5;
      return val as 0 | 1 | 2 | 3 | 4;
    });
  }, [challenge]);

  const handlePlay = useCallback(async () => {
    if (!account || !challenge || starting) return;
    setStarting(true);
    try {
      const result = await systemCalls.startDailyGame({ account });
      if (result.game_id !== 0n) {
        navigate("play", result.game_id);
      }
    } finally {
      setStarting(false);
    }
  }, [account, challenge, starting, systemCalls, navigate]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <h1 className="pt-4 pb-2 text-center font-sans text-xl font-bold tracking-wide text-white">Daily Challenge</h1>

      <div className="mx-2 mt-1 mb-[72px] rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-sm p-3 overflow-y-auto flex-1 min-h-0">
        <div className="mx-auto flex w-full max-w-[500px] flex-col gap-3">
          {challengeLoading && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-lg shadow-black/20 backdrop-blur-xl">
              <Loader2 size={24} className="mx-auto animate-spin" style={{ color: colors.accent }} />
            </div>
          )}

          {!challengeLoading && !challenge && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-lg shadow-black/20 backdrop-blur-xl">
              <img src="/assets/trophies/gold.png" alt="Trophy" className="mx-auto mb-4 h-16 w-16 opacity-80" draggable={false} />
              <p className="mb-1 font-display text-xl text-white">
                No Active Challenge
              </p>
              <p className="font-sans text-sm text-white/60">
                Check back later for the next daily challenge.
              </p>
            </div>
          )}

          {challenge && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[20px] font-extrabold tracking-wide text-white">
                    ⚡ Daily Challenge
                  </p>
                  <p className="font-sans text-[11px] font-medium text-white/60">
                    {new Date(challenge.start_time * 1000).toLocaleDateString()} · Same seed for all
                  </p>
                </div>
                {isActive && (
                  <CountdownPill
                    endTime={challenge.end_time}
                    accent={colors.accent}
                    border="rgba(255,255,255,0.04)"
                    text={colors.accent}
                  />
                )}
              </div>

              {(zoneName || activeMutator || passiveMutator) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {zoneName && (
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-sans text-[10px] font-bold text-white/80">
                      {zoneName}
                    </span>
                  )}
                  {activeMutator && activeMutator.id !== 0 && (
                    <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 font-sans text-[10px] font-bold text-orange-300">
                      {activeMutator.icon} {activeMutator.name}
                    </span>
                  )}
                  {passiveMutator && passiveMutator.id !== 0 && (
                    <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 font-sans text-[10px] font-bold text-purple-300">
                      {passiveMutator.icon} {passiveMutator.name}
                    </span>
                  )}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-xl"
              >
                <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
                  TODAY'S TOP 3
                </p>
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                  className="space-y-1.5"
                >
                  {leaderboard.slice(0, 3).map((le, idx) => (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0 }
                      }}
                      key={le.rank}
                      className="flex items-center justify-between pt-1.5 first:pt-0"
                      style={{ borderTop: idx > 0 ? `1px solid rgba(255,255,255,0.06)` : "none" }}
                    >
                      <span className="flex items-center gap-2 font-sans text-[11px] font-medium text-white">
                        <img
                          src={TROPHY_IMAGES[idx + 1]}
                          alt={`Rank ${idx + 1}`}
                          className="h-5 w-5 drop-shadow-md"
                          draggable={false}
                        />
                        {le.playerName}
                      </span>
                      <span className="font-display text-[13px] font-bold tracking-wide" style={{ color: colors.accent }}>
                        {le.value.toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <div className="flex justify-center py-2">
                <div className="text-center">
                  <div
                    className="inline-block rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 shadow-lg shadow-black/20 backdrop-blur-xl"
                    style={{ boxShadow: `0 0 20px ${colors.accent}1A, inset 0 0 10px ${colors.accent}0D` }}
                  >
                    <div className="grid grid-cols-8 gap-1">
                      {previewGrid.map((block, idx) => {
                        const validBlock = block >= 1 && block <= 4;
                        const blockColor = validBlock
                          ? getBlockColors(themeTemplate, block as 1 | 2 | 3 | 4).fill
                          : "transparent";
                        return (
                          <div
                            key={`preview-${idx}`}
                            className="h-[22px] w-[22px] rounded-[4px] border"
                            style={{
                              borderColor: validBlock ? `${blockColor}66` : `rgba(255,255,255,0.06)`,
                              backgroundColor: validBlock ? `${blockColor}99` : "rgba(255,255,255,0.02)",
                              boxShadow: validBlock ? `0 0 8px ${blockColor}4D` : "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-3 font-sans text-[11px] font-medium text-white/60">
                    {challenge.total_entries} players today
                  </p>
                </div>
              </div>

              {isActive && account && (
                <motion.button
                  animate={{ boxShadow: [`0 8px 20px -4px ${colors.accent}66`, `0 8px 30px 0px ${colors.accent}99`, `0 8px 20px -4px ${colors.accent}66`] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={starting}
                  onClick={handlePlay}
                  className="flex w-full items-center justify-center rounded-2xl px-4 py-4 font-display text-[17px] font-black tracking-[0.12em] shadow-xl disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}E6)`,
                    color: "#0a1628",
                    boxShadow: `inset 0 2px 0 rgba(255,255,255,0.4)`,
                  }}
                >
                  {starting ? "STARTING..." : "PLAY DAILY"}
                </motion.button>
              )}

              {isRegistered && entry && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
                  <p className="font-sans text-[12px] font-medium text-white">
                    Your best: <span className="font-display text-[14px] font-bold" style={{ color: colors.accent }}>{entry.best_score}</span> · Rank {entry.rank > 0 ? `#${entry.rank}` : "—"}
                  </p>
                  {entry.best_stars > 0 && (
                    <p className="mt-1 font-sans text-[11px] text-white/60">
                      Stars: {entry.best_stars} · Attempts: {entry.attempts}
                    </p>
                  )}
                  {starReward > 0n && (
                    <p className="mt-1 font-sans text-[11px] font-semibold text-yellow-300">
                      ⭐ Star Reward: {starReward.toString()}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
