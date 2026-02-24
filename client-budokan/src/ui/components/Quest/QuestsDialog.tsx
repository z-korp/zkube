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

// ─── Inline cube ────────────────────────────────────────────────────────────

const InlineCube: React.FC<{
  amount: number;
  muted?: boolean;
}> = ({ amount, muted = false }) => (
  <span
    className={`inline-flex items-center gap-0.5 flex-shrink-0 ${
      muted ? "opacity-35" : ""
    }`}
  >
    <span className="text-xs">🧊</span>
    <span className="font-['Fredericka_the_Great'] text-sm leading-none text-yellow-200">
      {amount}
    </span>
  </span>
);

// ─── Compact Breakpoint Slider ──────────────────────────────────────────────
// Player / Clearer families — track with dots at tier targets

const SLIDER_FAMILIES = new Set(["player", "clearer"]);

const CompactSlider: React.FC<{
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}> = ({ family, onClaim, claimingKey, disabled }) => {
  const Icon = iconMap[family.icon] ?? Gamepad2;
  const allClaimed = family.tiers.every((t) => t.claimed);
  const maxTarget = family.tiers[family.tiers.length - 1]?.target ?? 1;
  const progress = Math.min(family.progress, maxTarget);
  const fillPercent = maxTarget > 0 ? (progress / maxTarget) * 100 : 0;

  const breakpoints = family.tiers.map((tier) => ({
    target: tier.target,
    reward: tier.reward,
    completed: tier.completed,
    claimed: tier.claimed,
    claimable: tier.completed && !tier.claimed,
    questId: tier.questId,
    intervalId: tier.intervalId,
    position: maxTarget > 0 ? (tier.target / maxTarget) * 100 : 0,
  }));

  const hasClaimable = breakpoints.some((bp) => bp.claimable);

  const cardBg = allClaimed
    ? "bg-slate-800 border-green-500/15"
    : hasClaimable
      ? "bg-indigo-950 border-green-500/30"
      : "bg-indigo-950 border-white/8";

  return (
    <motion.div
      className={`rounded-xl border p-3 ${cardBg}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`grid h-7 w-7 place-items-center rounded-lg flex-shrink-0 ${
              allClaimed
                ? "bg-green-500/15 text-green-400/60"
                : hasClaimable
                  ? "bg-yellow-400/15 text-yellow-300"
                  : "bg-white/8 text-cyan-300"
            }`}
          >
            <Icon size={14} />
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-base leading-tight ${
              allClaimed ? "text-slate-400" : "text-white"
            }`}
          >
            {family.name}
          </span>
          {allClaimed && (
            <Check size={12} className="text-green-400/60" />
          )}
        </div>
        <InlineCube amount={family.totalReward} muted={allClaimed} />
      </div>

      {/* Slider track */}
      <div className="relative px-2.5 pt-7 pb-5">
        <div className="relative h-1.5 bg-slate-700 rounded-full">
          {/* Fill */}
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              allClaimed
                ? "bg-green-500/40"
                : hasClaimable
                  ? "bg-gradient-to-r from-cyan-400 to-green-400"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Breakpoints */}
          {breakpoints.map((bp, i) => {
            const isClaimingThis =
              claimingKey === `${bp.questId}:${bp.intervalId}`;
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${bp.position}%` }}
              >
                {/* Dot */}
                <div
                  className={`relative w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    bp.claimed
                      ? "bg-green-500 border-green-400 text-white"
                      : bp.claimable
                        ? "bg-yellow-400 border-yellow-300 text-slate-900"
                        : bp.completed
                          ? "bg-cyan-400 border-cyan-300 text-slate-900"
                          : "bg-slate-700 border-slate-500"
                  }`}
                >
                  {bp.claimed && <Check size={8} strokeWidth={3} />}
                  {bp.claimable && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-slate-900" />
                  )}
                </div>

                {/* Claim bubble */}
                {bp.claimable && (
                  <button
                    onClick={() => {
                      if (isClaimingThis || disabled) return;
                      onClaim(bp.questId, bp.intervalId);
                    }}
                    disabled={isClaimingThis || disabled}
                    className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg shadow-green-500/40 disabled:opacity-50 transition-colors"
                  >
                    {isClaimingThis ? (
                      <Loader2 size={9} className="animate-spin" />
                    ) : (
                      "Claim"
                    )}
                  </button>
                )}

                {/* Labels below */}
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span
                    className={`text-[10px] font-medium tabular-nums ${
                      bp.claimed
                        ? "text-green-400/50"
                        : bp.completed
                          ? "text-cyan-200"
                          : "text-slate-400"
                    }`}
                  >
                    {bp.target}
                  </span>
                  <span
                    className={`text-[9px] leading-tight ${
                      bp.claimed ? "text-slate-600" : "text-yellow-300/60"
                    }`}
                  >
                    🧊{bp.reward}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Pill indicators ────────────────────────────────────────────────────────

const PillIndicators: React.FC<{
  tiers: QuestTier[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}> = ({ tiers, selectedIndex, onSelect }) => (
  <div className="flex items-center gap-0.5">
    {tiers.map((tier, i) => (
      <button
        key={tier.questId}
        onClick={() => onSelect(i)}
        className={`h-3 rounded-full transition-all ${
          i === selectedIndex ? "w-6" : "w-4"
        } ${
          tier.claimed
            ? "bg-green-500/60"
            : tier.completed
              ? "bg-yellow-400"
              : i === selectedIndex
                ? "bg-slate-500"
                : "bg-slate-700"
        }`}
      />
    ))}
  </div>
);

// ─── Compact Tier Card ──────────────────────────────────────────────────────
// Combo / Combo Streak — one tier at a time with pill navigation

const CompactTierCard: React.FC<{
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}> = ({ family, onClaim, claimingKey, disabled }) => {
  const Icon = iconMap[family.icon] ?? Gamepad2;
  const allClaimed = family.tiers.every((t) => t.claimed);

  const autoIndex = useMemo(() => {
    const idx = family.tiers.findIndex((t) => !t.claimed);
    return idx >= 0 ? idx : family.tiers.length - 1;
  }, [family.tiers]);

  const [selectedIndex, setSelectedIndex] = useState(autoIndex);

  useEffect(() => {
    setSelectedIndex(autoIndex);
  }, [autoIndex]);

  const tier = family.tiers[selectedIndex];
  if (!tier) return null;

  const claimable = tier.completed && !tier.claimed;
  const claimKey = `${tier.questId}:${tier.intervalId}`;
  const isClaiming = claimingKey === claimKey;

  const cardBg = allClaimed
    ? "bg-slate-800 border-green-500/15"
    : claimable
      ? "bg-indigo-950 border-green-500/30"
      : "bg-indigo-950 border-white/8";

  return (
    <motion.div
      className={`rounded-xl border p-3 ${cardBg}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`grid h-7 w-7 place-items-center rounded-lg flex-shrink-0 ${
              allClaimed
                ? "bg-green-500/15 text-green-400/60"
                : claimable
                  ? "bg-yellow-400/15 text-yellow-300"
                  : "bg-white/8 text-cyan-300"
            }`}
          >
            <Icon size={14} />
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-base leading-tight ${
              allClaimed ? "text-slate-400" : "text-white"
            }`}
          >
            {family.name}
          </span>
        </div>
        <PillIndicators
          tiers={family.tiers}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>

      {/* Active tier */}
      <div
        className={`rounded-lg p-2.5 ${
          tier.claimed
            ? "bg-black/20"
            : claimable
              ? "bg-green-950/40 border border-green-500/15"
              : "bg-black/30"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              {tier.claimed && (
                <Check size={12} className="text-green-400 flex-shrink-0" />
              )}
              {claimable && (
                <span className="text-green-400 font-bold italic text-[10px] uppercase tracking-wide flex-shrink-0">
                  DONE!
                </span>
              )}
              <span
                className={`text-xs truncate ${
                  tier.claimed
                    ? "text-slate-500 line-through"
                    : claimable
                      ? "text-green-200"
                      : "text-slate-200"
                }`}
              >
                {tier.description || tier.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              Tier {tier.tier}/{family.totalTiers}
            </span>
          </div>
          <InlineCube amount={tier.reward} muted={tier.claimed} />
        </div>

        {/* Claim */}
        {claimable && (
          <button
            onClick={() => onClaim(tier.questId, tier.intervalId)}
            disabled={isClaiming || disabled}
            className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            {isClaiming ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>Claim 🧊 {tier.reward}</>
            )}
          </button>
        )}
      </div>
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

  const renderFamily = (family: QuestFamily) => {
    if (SLIDER_FAMILIES.has(family.id)) {
      return (
        <CompactSlider
          key={family.id}
          family={family}
          onClaim={handleClaim}
          claimingKey={claimingKey}
          disabled={!account}
        />
      );
    }
    return (
      <CompactTierCard
        key={family.id}
        family={family}
        onClaim={handleClaim}
        claimingKey={claimingKey}
        disabled={!account}
      />
    );
  };

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
                <motion.div
                  className={`rounded-xl border p-3 ${
                    finisherFamily.tiers[0]?.claimed
                      ? "bg-slate-800 border-yellow-500/10"
                      : finisherFamily.tiers[0]?.completed
                        ? "bg-gradient-to-br from-yellow-950/80 via-amber-950/70 to-orange-950/60 border-yellow-400/30"
                        : "bg-indigo-950 border-yellow-500/15"
                  }`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={15} className={
                        finisherFamily.tiers[0]?.claimed
                          ? "text-yellow-400/40"
                          : "text-yellow-300"
                      } />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-['Fredericka_the_Great'] text-base ${
                            finisherFamily.tiers[0]?.claimed ? "text-yellow-400/40" : "text-yellow-50"
                          }`}>
                            Daily Champion
                          </span>
                          {finisherFamily.tiers[0]?.completed && !finisherFamily.tiers[0]?.claimed && (
                            <span className="text-green-400 font-bold italic text-[10px] uppercase">
                              DONE!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <InlineCube
                      amount={finisherFamily.tiers[0]?.reward ?? 20}
                      muted={finisherFamily.tiers[0]?.claimed}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30">
                      <motion.div
                        className={`h-full rounded-full ${
                          finisherFamily.tiers[0]?.claimed
                            ? "bg-yellow-600/30"
                            : finisherFamily.tiers[0]?.completed
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
                    <span className={`font-['Fredericka_the_Great'] text-sm min-w-fit ${
                      finisherFamily.tiers[0]?.claimed ? "text-yellow-400/35" : "text-yellow-50"
                    }`}>
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
                        <>Claim 🧊 {finisherFamily.claimableTier.reward}</>
                      )}
                    </button>
                  )}
                </motion.div>
              )}

              {/* Main families */}
              {mainFamilies.map(renderFamily)}
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
