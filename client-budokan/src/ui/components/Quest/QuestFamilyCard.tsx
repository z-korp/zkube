import { useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/elements/button";
import type { QuestFamily, QuestTier } from "@/types/questFamily";
import { motion } from "motion/react";
import {
  Circle,
  CircleCheck,
  Gamepad2,
  ListOrdered,
  Lock,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface QuestFamilyCardProps {
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
}

const iconMap: Record<string, LucideIcon> = {
  "fa-gamepad": Gamepad2,
  "fa-bars-staggered": ListOrdered,
  "fa-bolt": Zap,
  "fa-trophy": Trophy,
};

// Format countdown timer
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const QuestFamilyCard: React.FC<QuestFamilyCardProps> = ({ family, onClaim }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Get countdown from the first tier (all should have same end time)
  const endTime = family.tiers[0]?.intervalId 
    ? family.tiers[0].intervalId * 86400 + 86400 // Next day at midnight UTC
    : 0;
    
  const [countdown, setCountdown] = useState(() => {
    // Calculate end of current interval (midnight UTC)
    const now = Math.floor(Date.now() / 1000);
    const todayMidnight = Math.floor(now / 86400) * 86400;
    const nextMidnight = todayMidnight + 86400;
    return Math.max(0, nextMidnight - now);
  });

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const todayMidnight = Math.floor(now / 86400) * 86400;
      const nextMidnight = todayMidnight + 86400;
      setCountdown(Math.max(0, nextMidnight - now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClaim = useCallback(async () => {
    if (!family.claimableTier) return;
    setIsClaiming(true);
    try {
      await onClaim(family.claimableTier.questId, family.claimableTier.intervalId);
    } finally {
      setIsClaiming(false);
    }
  }, [family.claimableTier, onClaim]);

  // Get icon
  const Icon = iconMap[family.icon] || Gamepad2;
  
  // Calculate state
  const allCompleted = family.tiers.every(t => t.completed);
  const allClaimed = family.tiers.every(t => t.claimed);
  const hasClaimable = family.claimableTier !== null;
  
  // Current tier number (1-indexed, or total if all done)
  const currentTier = family.currentTierIndex >= 0 
    ? family.currentTierIndex + 1 
    : family.totalTiers;

  // Progress percentage toward next tier
  const progressPercent = family.nextTarget > 0 
    ? Math.min((family.progress / family.nextTarget) * 100, 100)
    : 100;

  return (
    <motion.div
      className={`
        select-none flex flex-col gap-3 rounded-lg p-4
        ${allClaimed 
          ? "bg-slate-800/30" 
          : hasClaimable
            ? "bg-slate-900 ring-1 ring-green-500/30"
            : "bg-slate-900"
        }
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header: Family name and tier indicator */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon
            size={18}
            className={`text-lg ${hasClaimable ? "text-yellow-400" : allClaimed ? "text-slate-500" : "text-blue-400"}`}
          />
          <h3 className="text-lg font-semibold text-white tracking-wide">
            {family.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Tier indicator */}
          <span className={`text-sm font-medium ${
            allCompleted ? "text-green-400" : "text-slate-400"
          }`}>
            Tier {currentTier}/{family.totalTiers}
          </span>
          {/* Timer */}
          <span className="text-xs text-slate-500 tabular-nums">
            {formatCountdown(countdown)}
          </span>
        </div>
      </div>

      {/* Tiers list */}
      <div className="flex flex-col gap-2">
        {family.tiers.map((tier) => (
          <TierRow 
            key={tier.questId} 
            tier={tier} 
            isCurrentClaimable={family.claimableTier?.questId === tier.questId}
          />
        ))}
      </div>

      {/* Progress bar toward next uncompleted tier */}
      {!allCompleted && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 p-0.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                hasClaimable ? "bg-green-500" : "bg-blue-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
            />
          </div>
          <span className="text-sm text-slate-400 min-w-fit tabular-nums">
            {family.progress}/{family.nextTarget}
          </span>
        </div>
      )}

      {/* Claim button */}
      {hasClaimable && (
        <Button
          variant="default"
          onClick={handleClaim}
          disabled={isClaiming}
          isLoading={isClaiming}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-10"
        >
          <span className="text-lg">
            Claim Tier {family.claimableTier!.tier} (+{family.claimableTier!.reward} CUBE)
          </span>
        </Button>
      )}

      {/* Total rewards summary */}
      {family.totalTiers > 1 && (
        <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-700/50">
          <span>Total rewards: {family.totalReward} CUBE</span>
          {family.claimedReward > 0 && (
            <span className="text-green-400/70">+{family.claimedReward} claimed</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

interface TierRowProps {
  tier: QuestTier;
  isCurrentClaimable: boolean;
}

const TierRow: React.FC<TierRowProps> = ({ tier, isCurrentClaimable }) => {
  // Determine icon and style
  let iconElement: React.ReactNode;
  let textStyle: string;

  if (tier.claimed) {
    // Completed and claimed
    iconElement = <CircleCheck size={12} className="text-slate-500 text-xs" />;
    textStyle = "text-slate-500 line-through";
  } else if (tier.completed) {
    // Completed but not claimed
    iconElement = <CircleCheck size={12} className="text-green-400 text-xs" />;
    textStyle = "text-green-400";
  } else if (tier.locked) {
    // Locked
    iconElement = <Lock size={12} className="text-slate-600 text-xs" />;
    textStyle = "text-slate-600";
  } else {
    // In progress
    iconElement = <Circle size={12} className="text-slate-400 text-xs" />;
    textStyle = "text-slate-300";
  }

  return (
    <div className={`flex items-center justify-between gap-2 text-sm ${
      isCurrentClaimable ? "bg-green-900/20 -mx-2 px-2 py-1 rounded" : ""
    }`}>
      <div className="flex items-center gap-2">
        {iconElement}
        <span className={textStyle}>
          Tier {tier.tier}: {tier.description || tier.name}
        </span>
      </div>
      <span className={`font-medium ${
        tier.claimed ? "text-slate-500" : tier.completed ? "text-yellow-400" : "text-slate-400"
      }`}>
        +{tier.reward}
      </span>
    </div>
  );
};

export default QuestFamilyCard;
