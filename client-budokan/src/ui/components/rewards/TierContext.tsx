import type { ThemeColors } from "@/config/themes";

interface TierDef {
  pct: number;
  label: string;
  reward: number;
}

interface TierContextProps {
  colors: ThemeColors;
  myRank: number | null;
  myScore: number;
  myName?: string;
  totalEntries: number;
  tiers: TierDef[];
  /** Sorted entries: { rank, score, name } — full leaderboard */
  entries: { rank: number; score: number; name: string }[];
  scoreLabel?: string;
}

/**
 * Shows the user's rank with context: the boundary row above (next tier up)
 * and below (tier drop). Helps the user understand what to aim for.
 */
const TierContext: React.FC<TierContextProps> = ({
  colors,
  myRank,
  myScore,
  myName = "You",
  totalEntries,
  tiers,
  entries,
  scoreLabel = "",
}) => {
  if (!myRank || totalEntries === 0) return null;

  // Find the user's current tier and boundaries
  const myPct = ((myRank - 1) * 100) / totalEntries;

  // Next tier up: the first tier with a lower pct threshold than where user is
  const currentTierIdx = tiers.findIndex((t) => myPct < t.pct);
  const tierAboveIdx = currentTierIdx > 0 ? currentTierIdx - 1 : -1;
  // Tier below: the next tier with a higher pct threshold
  const tierBelowIdx = currentTierIdx >= 0 ? currentTierIdx + 1 : tiers.length;

  // Compute boundary rank for a tier: rank where (rank-1)*100/total < pct
  // i.e. rank <= floor(total * pct / 100)
  const boundaryRank = (pct: number) => Math.max(1, Math.floor((totalEntries * pct) / 100));

  // Get the score at a given rank from the entries array
  const scoreAtRank = (rank: number): number | null => {
    const entry = entries.find((e) => e.rank === rank);
    return entry?.score ?? null;
  };

  const aboveTier = tierAboveIdx >= 0 ? tiers[tierAboveIdx] : null;
  const belowTier = tierBelowIdx < tiers.length ? tiers[tierBelowIdx] : null;

  const aboveRank = aboveTier ? boundaryRank(aboveTier.pct) : null;
  const aboveScore = aboveRank ? scoreAtRank(aboveRank) : null;

  const belowRank = belowTier ? boundaryRank(belowTier.pct) : null;
  const belowScore = belowRank ? scoreAtRank(belowRank) : null;

  return (
    <div className="rounded-2xl border px-3 py-2.5 backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
      <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
        Your Position
      </p>

      <div className="flex flex-col gap-0.5">
        {/* Row above: next tier boundary */}
        {aboveTier && aboveRank && (
          <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2">
              <span className="w-6 text-center font-sans text-[11px] font-bold text-white/30">#{aboveRank}</span>
              <span className="font-sans text-[11px] font-semibold text-white/40">
                {aboveTier.label} cutoff
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {aboveScore !== null && (
                <span className="font-sans text-[11px] font-bold text-white/30">{aboveScore.toLocaleString()}{scoreLabel}</span>
              )}
              <span className="font-sans text-[10px] font-bold text-yellow-400/60">+{aboveTier.reward}★</span>
            </div>
          </div>
        )}

        {/* User's row */}
        <div
          className="flex items-center justify-between rounded-lg px-2.5 py-2"
          style={{ background: `${colors.accent}20`, border: `1px solid ${colors.accent}50` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 text-center font-sans text-[12px] font-black" style={{ color: colors.accent }}>#{myRank}</span>
            <span className="font-sans text-[12px] font-bold" style={{ color: colors.text }}>
              {myName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[12px] font-black" style={{ color: colors.accent }}>{myScore.toLocaleString()}{scoreLabel}</span>
            {currentTierIdx >= 0 && (
              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 font-sans text-[10px] font-bold text-yellow-300">Projected +{tiers[currentTierIdx].reward}★</span>
            )}
          </div>
        </div>

        {/* Row below: tier drop boundary */}
        {belowTier && belowRank && (
          <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2">
              <span className="w-6 text-center font-sans text-[11px] font-bold text-white/30">#{belowRank}</span>
              <span className="font-sans text-[11px] font-semibold text-white/40">
                {belowTier.label} cutoff
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {belowScore !== null && (
                <span className="font-sans text-[11px] font-bold text-white/30">{belowScore.toLocaleString()}{scoreLabel}</span>
              )}
              <span className="font-sans text-[10px] font-bold text-yellow-400/60">+{belowTier.reward}★</span>
            </div>
          </div>
        )}

        {/* If user is outside all tiers */}
        {currentTierIdx < 0 && belowTier === null && (
          <div className="mt-0.5 rounded-lg px-2.5 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="font-sans text-[11px] font-semibold text-white/40">
              Outside reward tiers — keep climbing!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TierContext;
