import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import GameButton from "@/ui/components/shared/GameButton";
import { getBlockColors, getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

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
    <div
      className="rounded-lg border px-3 py-1 font-display text-[11px] font-bold"
      style={{ borderColor: `${accent}80`, backgroundColor: border, color: text }}
    >
      {sec > 0 ? `${h}:${m}:${s}` : "ENDED"}
    </div>
  );
};

const DailyChallengePage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { account } = useAccountCustom();
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
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

  const [registering, setRegistering] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const now = useMemo(() => Math.floor(Date.now() / 1000), []);
  const isActive =
    challenge &&
    !challenge.settled &&
    challenge.start_time <= now &&
    challenge.end_time > now;
  const isSettled = challenge?.settled;

  const prizePool = challenge?.prize_pool
    ? BigInt(challenge.prize_pool)
    : BigInt(0);
  const playerPrize = entry?.prize_amount
    ? BigInt(entry.prize_amount)
    : BigInt(0);
  const canClaim =
    isSettled && isRegistered && playerPrize > 0n && !entry?.claimed;

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

  const handleRegister = useCallback(async () => {
    if (!account || !challenge || registering) return;
    setRegistering(true);
    try {
      await systemCalls.registerEntry({
        account,
        challenge_id: challenge.challenge_id,
      });
    } finally {
      setRegistering(false);
    }
  }, [account, challenge, registering, systemCalls]);

  const handleClaimPrize = useCallback(async () => {
    if (!account || !challenge || claiming) return;
    setClaiming(true);
    try {
      await systemCalls.claimPrize({
        account,
        challenge_id: challenge.challenge_id,
      });
    } finally {
      setClaiming(false);
    }
  }, [account, challenge, claiming, systemCalls]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          onClick={goBack}
          className="h-11 w-11 rounded-lg"
          style={{ color: colors.textMuted }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex w-full max-w-[500px] flex-col gap-3">
          {challengeLoading && (
            <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Loader2 size={24} className="mx-auto animate-spin" style={{ color: colors.textMuted }} />
            </div>
          )}

          {!challengeLoading && !challenge && (
            <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <p className="mb-1 font-display text-lg" style={{ color: colors.text }}>
                No Active Challenge
              </p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Check back later for the next daily challenge.
              </p>
            </div>
          )}

          {challenge && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[16px] font-extrabold" style={{ color: colors.text }}>
                    ⚡ Daily Challenge
                  </p>
                  <p className="text-[10px]" style={{ color: colors.textMuted }}>
                    {new Date(challenge.start_time * 1000).toLocaleDateString()} · Same seed for all
                  </p>
                </div>
                {isActive && (
                  <CountdownPill
                    endTime={challenge.end_time}
                    accent={colors.accent}
                    border={colors.surface}
                    text={colors.accent}
                  />
                )}
              </div>

              <div
                className="rounded-[10px] border px-3 py-2"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <p className="mb-1.5 text-[9px] uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
                  TODAY'S TOP 3
                </p>
                <div className="space-y-1">
                  {leaderboard.slice(0, 3).map((le, idx) => (
                    <div
                      key={le.rank}
                      className="flex items-center justify-between pt-1 first:pt-0"
                      style={{ borderTop: idx > 0 ? `1px solid ${colors.border}` : "none" }}
                    >
                      <span className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.text }}>
                        <img
                          src={TROPHY_IMAGES[idx + 1]}
                          alt={`Rank ${idx + 1}`}
                          className="h-5 w-5"
                          draggable={false}
                        />
                        {le.playerName}
                      </span>
                      <span className="font-display text-[11px] font-bold" style={{ color: colors.accent2 }}>
                        {le.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center py-1">
                <div className="text-center">
                  <div
                    className="inline-block rounded-[10px] border p-1.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: colors.border }}
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
                            className="h-[22px] w-[22px] rounded-[3px] border"
                            style={{
                              borderColor: validBlock ? `${blockColor}4D` : `${colors.border}66`,
                              backgroundColor: validBlock ? `${blockColor}88` : "rgba(255,255,255,0.02)",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px]" style={{ color: colors.textMuted }}>
                    {challenge.total_entries} players today
                  </p>
                </div>
              </div>

              {isActive && !isRegistered && account && (
                <button
                  type="button"
                  disabled={registering}
                  onClick={handleRegister}
                  className="w-full rounded-xl py-3 font-display text-sm font-black tracking-[0.1em] disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent2}, ${colors.accent2}CC)`,
                    color: "#0a1628",
                    boxShadow: `0 0 30px ${colors.accent2}40`,
                  }}
                >
                  {registering ? "REGISTERING..." : "START DAILY"}
                </button>
              )}

              {isRegistered && entry && (
                <div className="rounded-xl border p-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <p className="text-[11px]" style={{ color: colors.text }}>
                    Your best: {entry.best_score} · Rank {entry.rank > 0 ? `#${entry.rank}` : "—"}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: colors.textMuted }}>
                    Prize Pool: {prizePool.toString()}
                  </p>
                  {canClaim && (
                    <div className="mt-2">
                      <GameButton
                        label={claiming ? "CLAIMING..." : `CLAIM PRIZE (${playerPrize.toString()})`}
                        variant="primary"
                        loading={claiming}
                        disabled={claiming}
                        onClick={handleClaimPrize}
                      />
                    </div>
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
