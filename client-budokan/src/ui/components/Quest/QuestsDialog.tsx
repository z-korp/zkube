import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { useQuests } from "@/contexts/quests";
import { useMusicPlayer } from "@/contexts/hooks";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMemo, useCallback, useState, useEffect } from "react";
import { shortString } from "starknet";
import { motion } from "motion/react";
import {
  Check,
  Clock3,
  Gamepad2,
  ListOrdered,
  Loader2,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { QuestFamily, QuestTier } from "@/types/questFamily";

// ─── Constants ──────────────────────────────────────────────────────────────

const CUMULATIVE_FAMILIES = new Set(["player", "clearer"]);

const iconMap: Record<string, LucideIcon> = {
  "fa-gamepad": Gamepad2,
  "fa-bars-staggered": ListOrdered,
  "fa-bolt": Zap,
  "fa-arrow-trend-up": TrendingUp,
  "fa-trophy": Trophy,
};

interface QuestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const secondsUntilNextUtcMidnight = (): number => {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  );
  return Math.max(0, Math.floor((next - now.getTime()) / 1000));
};

const formatCountdown = (sec: number): string => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  const ss = s % 60;
  return `${m}m ${ss.toString().padStart(2, "0")}s`;
};

// ─── Tier Dots ──────────────────────────────────────────────────────────────

const TierDots: React.FC<{ tiers: QuestTier[] }> = ({ tiers }) => (
  <div className="flex items-center gap-0.5">
    {tiers.map((tier) => (
      <div
        key={tier.questId}
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          tier.claimed
            ? "bg-green-400"
            : tier.completed
              ? "bg-yellow-400"
              : "bg-slate-600"
        }`}
      />
    ))}
  </div>
);

// ─── Compact Quest Card ─────────────────────────────────────────────────────
// Unified card for all families (dialog-sized).

const CompactQuestCard: React.FC<{
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}> = ({ family, onClaim, claimingKey, disabled }) => {
  const Icon = iconMap[family.icon] ?? Gamepad2;
  const allClaimed = family.tiers.every((t) => t.claimed);
  const claimable = family.claimableTier;
  const isCumulative = CUMULATIVE_FAMILIES.has(family.id);

  const activeTierIndex = family.currentTierIndex >= 0
    ? family.currentTierIndex
    : family.tiers.length - 1;
  const activeTier = claimable ?? family.tiers[activeTierIndex];
  if (!activeTier) return null;

  const claimKey = claimable
    ? `${claimable.questId}:${claimable.intervalId}`
    : "";
  const isClaiming = claimable !== null && claimingKey === claimKey;

  const progressPercent =
    isCumulative && family.nextTarget > 0
      ? Math.min((family.progress / family.nextTarget) * 100, 100)
      : 0;

  return (
    <motion.div
      className={`rounded-lg p-3 transition-colors ${
        allClaimed
          ? "bg-slate-900/50"
          : claimable
            ? "bg-slate-900 ring-1 ring-green-500/30"
            : "bg-slate-900"
      }`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`grid h-6 w-6 place-items-center rounded-md flex-shrink-0 ${
              allClaimed
                ? "bg-green-500/10 text-green-400/50"
                : claimable
                  ? "bg-green-500/15 text-green-300"
                  : "bg-white/8 text-cyan-300"
            }`}
          >
            {allClaimed ? <Check size={12} /> : <Icon size={12} />}
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-sm leading-tight truncate ${
              allClaimed ? "text-slate-500" : "text-white"
            }`}
          >
            {family.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <TierDots tiers={family.tiers} />
          <span
            className={`inline-flex items-center gap-0.5 ${
              allClaimed ? "opacity-35" : ""
            }`}
          >
            <span className="text-[10px]">🧊</span>
            <span className="font-['Fredericka_the_Great'] text-xs text-yellow-200">
              {activeTier.reward}
            </span>
          </span>
        </div>
      </div>

      {/* Description */}
      {!allClaimed && (
        <p
          className={`text-xs mb-1.5 ${
            claimable ? "text-green-200" : "text-slate-400"
          }`}
        >
          {activeTier.description || activeTier.name}
        </p>
      )}

      {/* Progress / status */}
      {allClaimed ? (
        <p className="text-[10px] text-green-400/50">All tiers completed</p>
      ) : isCumulative ? (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                claimable
                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                  : "bg-gradient-to-r from-cyan-400 to-blue-400"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-xs leading-none min-w-fit ${
              claimable ? "text-green-200" : "text-slate-300"
            }`}
          >
            {family.progress}/{family.nextTarget}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {activeTier.completed ? (
            <>
              <Check size={11} className="text-green-400" />
              <span className="text-xs text-green-300">Achieved!</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Not yet achieved</span>
          )}
        </div>
      )}

      {/* Claim */}
      {claimable && (
        <button
          onClick={() => onClaim(claimable.questId, claimable.intervalId)}
          disabled={isClaiming || disabled}
          className="w-full mt-2 py-1.5 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          {isClaiming ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <>Claim 🧊 {claimable.reward}</>
          )}
        </button>
      )}
    </motion.div>
  );
};

// ─── Main dialog ────────────────────────────────────────────────────────────

export const QuestsDialog: React.FC<QuestsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { questFamilies, status } = useQuests();
  const { playSfx } = useMusicPlayer();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(secondsUntilNextUtcMidnight);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(
      () => setCountdown(secondsUntilNextUtcMidnight()),
      1000,
    );
    return () => window.clearInterval(id);
  }, [isOpen]);

  const { mainFamilies, finisherFamily } = useMemo(() => {
    const main = questFamilies.filter((f) => f.id !== "finisher");
    const finisher = questFamilies.find((f) => f.id === "finisher");
    return { mainFamilies: main, finisherFamily: finisher };
  }, [questFamilies]);

  const totals = useMemo(() => {
    const totalQuests = mainFamilies.reduce((s, f) => s + f.totalTiers, 0);
    const totalCompleted = mainFamilies.reduce(
      (s, f) => s + f.tiers.filter((t) => t.completed).length,
      0,
    );
    return { totalCompleted, totalQuests };
  }, [mainFamilies]);

  const claimableRewards = useMemo(
    () => questFamilies.reduce((s, f) => s + (f.claimableTier?.reward ?? 0), 0),
    [questFamilies],
  );

  const handleClaim = useCallback(
    async (questId: string, intervalId: number) => {
      if (!account) return;
      const key = `${questId}:${intervalId}`;
      setClaimingKey(key);
      try {
        const questIdFelt = `0x${BigInt(shortString.encodeShortString(questId)).toString(16)}`;
        await systemCalls.claimQuest({
          account,
          quest_id: questIdFelt,
          interval_id: intervalId,
        });
        playSfx("claim");
      } finally {
        setClaimingKey(null);
      }
    },
    [account, playSfx, systemCalls],
  );

  const allClaimed =
    questFamilies.length > 0 &&
    questFamilies.every((f) => f.tiers.every((t) => t.claimed));

  const finisherTier = finisherFamily?.tiers[0];
  const finisherCanClaim = finisherTier?.completed && !finisherTier?.claimed;
  const finisherProgressPercent =
    totals.totalQuests > 0
      ? Math.min((totals.totalCompleted / totals.totalQuests) * 100, 100)
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[480px] w-[95%] flex flex-col mx-auto justify-start rounded-xl px-4 py-4 max-h-[85vh] overflow-hidden gap-0 bg-[#0a0f2a] border-indigo-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <DialogTitle className="font-['Fredericka_the_Great'] text-xl text-white flex items-center gap-2">
            Daily Quests
          </DialogTitle>
          <div className="flex items-center gap-1.5 text-cyan-200">
            <Clock3 size={13} />
            <span className="font-['Fredericka_the_Great'] text-sm leading-none">
              {formatCountdown(countdown)}
            </span>
          </div>
        </div>

        {/* Claimable banner */}
        {claimableRewards > 0 && (
          <div className="flex items-center justify-center gap-2 mb-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg py-1.5 px-3">
            <span className="text-sm">🧊</span>
            <span className="font-['Fredericka_the_Great'] text-lg text-yellow-200 leading-none">
              {claimableRewards}
            </span>
            <span className="text-xs text-yellow-300/70">CUBE to claim</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-8 text-slate-300">
              <Loader2 size={14} className="animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : questFamilies.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              No quests available yet.
            </div>
          ) : (
            <>
              {/* Champion */}
              {finisherFamily && finisherTier && (
                <motion.div
                  className={`rounded-lg p-3 ${
                    finisherTier.claimed
                      ? "bg-slate-900/50"
                      : finisherCanClaim
                        ? "bg-gradient-to-br from-yellow-950/60 to-amber-950/40 ring-1 ring-yellow-500/25"
                        : "bg-slate-900 ring-1 ring-yellow-500/10"
                  }`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy
                        size={14}
                        className={
                          finisherTier.claimed
                            ? "text-yellow-400/40"
                            : "text-yellow-300"
                        }
                      />
                      <span
                        className={`font-['Fredericka_the_Great'] text-sm ${
                          finisherTier.claimed
                            ? "text-yellow-400/40"
                            : "text-yellow-50"
                        }`}
                      >
                        Daily Champion
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        finisherTier.claimed ? "opacity-35" : ""
                      }`}
                    >
                      <span className="text-[10px]">🧊</span>
                      <span className="font-['Fredericka_the_Great'] text-xs text-yellow-200">
                        {finisherTier.reward}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-black/30 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          finisherTier.claimed
                            ? "bg-yellow-600/30"
                            : finisherCanClaim
                              ? "bg-gradient-to-r from-green-400 to-emerald-400"
                              : "bg-gradient-to-r from-yellow-400 to-amber-300"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${finisherProgressPercent}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span
                      className={`font-['Fredericka_the_Great'] text-xs min-w-fit ${
                        finisherTier.claimed
                          ? "text-yellow-400/35"
                          : "text-yellow-50"
                      }`}
                    >
                      {totals.totalCompleted}/{totals.totalQuests}
                    </span>
                  </div>
                  {finisherCanClaim && finisherFamily.claimableTier && (
                    <button
                      onClick={() =>
                        handleClaim(
                          finisherFamily.claimableTier!.questId,
                          finisherFamily.claimableTier!.intervalId,
                        )
                      }
                      disabled={
                        claimingKey ===
                          `${finisherFamily.claimableTier.questId}:${finisherFamily.claimableTier.intervalId}` ||
                        !account
                      }
                      className="w-full mt-2 py-1.5 rounded-md bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {claimingKey ===
                      `${finisherFamily.claimableTier.questId}:${finisherFamily.claimableTier.intervalId}` ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <>CLAIM 🧊 {finisherFamily.claimableTier.reward}</>
                      )}
                    </button>
                  )}
                </motion.div>
              )}

              {/* Quest families */}
              {mainFamilies.map((family) => (
                <CompactQuestCard
                  key={family.id}
                  family={family}
                  onClaim={handleClaim}
                  claimingKey={claimingKey}
                  disabled={!account}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-white/5 text-center">
          {allClaimed ? (
            <p className="text-xs text-green-400/60">
              All done! Come back after reset.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Resets at midnight UTC
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestsDialog;
