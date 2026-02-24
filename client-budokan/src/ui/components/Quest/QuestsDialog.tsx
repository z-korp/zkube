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
  Circle,
  CircleCheck,
  Clock3,
  Gamepad2,
  ListOrdered,
  Loader2,
  Lock,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { QuestFamily, QuestTier } from "@/types/questFamily";

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

// ─── Cube reward badge (compact) ────────────────────────────────────────────

const CubeBadge: React.FC<{ amount: number; claimed?: boolean }> = ({
  amount,
  claimed = false,
}) => (
  <div className="flex flex-col items-center gap-0 w-9 flex-shrink-0">
    {claimed ? (
      <Check size={14} className="text-green-400/60" />
    ) : (
      <span className="text-sm">🧊</span>
    )}
    <span
      className={`font-['Fredericka_the_Great'] text-xs leading-none ${
        claimed ? "text-slate-500" : "text-yellow-200"
      }`}
    >
      {amount}
    </span>
  </div>
);

// ─── Compact tier row ───────────────────────────────────────────────────────

const TierRow: React.FC<{ tier: QuestTier; isActive: boolean }> = ({
  tier,
  isActive,
}) => {
  let icon: React.ReactNode;
  let textCls: string;

  if (tier.claimed) {
    icon = <CircleCheck size={11} className="text-green-400/50" />;
    textCls = "text-slate-500 line-through";
  } else if (tier.completed) {
    icon = <CircleCheck size={11} className="text-green-400" />;
    textCls = "text-green-300";
  } else if (tier.locked) {
    icon = <Lock size={11} className="text-slate-600" />;
    textCls = "text-slate-600";
  } else {
    icon = <Circle size={11} className="text-slate-400" />;
    textCls = "text-slate-300";
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 py-0.5 px-1.5 rounded text-xs ${
        isActive ? "bg-white/5" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {icon}
        <span className={`truncate ${textCls}`}>
          {tier.description || tier.name}
        </span>
      </div>
      <span
        className={`font-['Fredericka_the_Great'] text-sm leading-none flex-shrink-0 ${
          tier.claimed ? "text-slate-600" : tier.completed ? "text-yellow-300" : "text-slate-400"
        }`}
      >
        +{tier.reward}
      </span>
    </div>
  );
};

// ─── Family card (dialog-sized) ─────────────────────────────────────────────

const FamilyRow: React.FC<{
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}> = ({ family, onClaim, claimingKey, disabled }) => {
  const Icon = iconMap[family.icon] ?? Gamepad2;
  const allCompleted = family.tiers.every((t) => t.completed);
  const allClaimed = family.tiers.every((t) => t.claimed);
  const claimableTier = family.claimableTier;
  const claimKey = claimableTier
    ? `${claimableTier.questId}:${claimableTier.intervalId}`
    : "";
  const isClaiming = claimableTier !== null && claimingKey === claimKey;

  const progressPercent =
    family.nextTarget > 0
      ? Math.min((family.progress / family.nextTarget) * 100, 100)
      : allCompleted
        ? 100
        : 0;

  const cardBg = allClaimed
    ? "bg-slate-900/30 border-green-400/10"
    : claimableTier
      ? "bg-indigo-900/40 border-green-400/20"
      : "bg-indigo-900/25 border-white/5";

  return (
    <motion.div
      className={`rounded-xl border p-3 ${cardBg}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`grid h-7 w-7 place-items-center rounded-lg flex-shrink-0 ${
              allClaimed
                ? "bg-green-500/10 text-green-400/50"
                : claimableTier
                  ? "bg-yellow-400/15 text-yellow-300"
                  : "bg-white/10 text-cyan-300"
            }`}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-['Fredericka_the_Great'] text-base leading-tight truncate ${
                  allClaimed ? "text-slate-400" : "text-white"
                }`}
              >
                {family.name}
              </span>
              {allCompleted && !allClaimed && (
                <span className="text-green-400 font-bold italic text-[10px] uppercase">
                  DONE!
                </span>
              )}
              {allClaimed && <Check size={12} className="text-green-400/50" />}
            </div>
          </div>
        </div>
        <CubeBadge
          amount={
            claimableTier
              ? claimableTier.reward
              : allCompleted
                ? family.totalReward
                : family.tiers[family.currentTierIndex >= 0 ? family.currentTierIndex : 0]
                    ?.reward ?? 0
          }
          claimed={allClaimed}
        />
      </div>

      {/* Progress bar */}
      {!allCompleted && (
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/25">
            <motion.div
              className={`h-full rounded-full ${
                claimableTier
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="font-['Fredericka_the_Great'] text-sm leading-none text-cyan-100 min-w-fit">
            {family.progress}/{family.nextTarget}
          </span>
        </div>
      )}

      {/* Tier detail */}
      {family.totalTiers > 1 && (
        <div className="flex flex-col gap-0 rounded-lg bg-black/10 p-1 mb-1.5">
          {family.tiers.map((tier) => (
            <TierRow
              key={tier.questId}
              tier={tier}
              isActive={
                family.currentTierIndex >= 0 &&
                family.tiers[family.currentTierIndex]?.questId === tier.questId
              }
            />
          ))}
        </div>
      )}

      {/* Claim */}
      {claimableTier && (
        <button
          onClick={() => onClaim(claimableTier.questId, claimableTier.intervalId)}
          disabled={isClaiming || disabled}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isClaiming ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              CLAIM +{claimableTier.reward} CUBE
            </>
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
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
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
              {finisherFamily && (
                <div className={`rounded-xl border p-3 ${
                  finisherFamily.tiers[0]?.claimed
                    ? "bg-yellow-900/10 border-yellow-400/10"
                    : finisherFamily.tiers[0]?.completed
                      ? "bg-yellow-800/20 border-yellow-400/20"
                      : "bg-indigo-900/25 border-yellow-400/10"
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-300" />
                      <div>
                        <span className="font-['Fredericka_the_Great'] text-base text-yellow-50">
                          Daily Champion
                        </span>
                        {finisherFamily.tiers[0]?.completed && !finisherFamily.tiers[0]?.claimed && (
                          <span className="ml-2 text-green-400 font-bold italic text-[10px] uppercase">
                            DONE!
                          </span>
                        )}
                      </div>
                    </div>
                    <CubeBadge
                      amount={finisherFamily.tiers[0]?.reward ?? 20}
                      claimed={finisherFamily.tiers[0]?.claimed}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/25">
                      <motion.div
                        className={`h-full rounded-full ${
                          finisherFamily.tiers[0]?.completed
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : "bg-gradient-to-r from-yellow-400 to-amber-300"
                        }`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${totals.totalQuests > 0 ? Math.min((totals.totalCompleted / totals.totalQuests) * 100, 100) : 0}%`,
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span className="font-['Fredericka_the_Great'] text-sm text-yellow-50 min-w-fit">
                      {totals.totalCompleted}/{totals.totalQuests}
                    </span>
                  </div>
                  {finisherFamily.claimableTier && (
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
                      className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {claimingKey ===
                      `${finisherFamily.claimableTier.questId}:${finisherFamily.claimableTier.intervalId}` ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        `CLAIM +${finisherFamily.claimableTier.reward} CUBE`
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Main families */}
              {mainFamilies.map((family) => (
                <FamilyRow
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
