import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { useQuests } from "@/contexts/quests";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { QuestFamilyCard } from "./QuestFamilyCard";
import { useMemo, useCallback, useState } from "react";
import { shortString } from "starknet";
import { motion } from "motion/react";
import { Loader2, Scroll, Trophy } from "lucide-react";

interface QuestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestsDialog: React.FC<QuestsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { questFamilies, status } = useQuests();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  // Separate main families from finisher
  const { mainFamilies, finisherFamily } = useMemo(() => {
    const main = questFamilies.filter((f) => f.id !== 'finisher');
    const finisher = questFamilies.find((f) => f.id === 'finisher');
    return { mainFamilies: main, finisherFamily: finisher };
  }, [questFamilies]);

  // Calculate total claimable rewards
  const claimableRewards = useMemo(() => {
    return questFamilies.reduce((sum, family) => {
      if (family.claimableTier) {
        return sum + family.claimableTier.reward;
      }
      return sum;
    }, 0);
  }, [questFamilies]);

  // Handle claiming a quest
  const handleClaim = useCallback(
    async (questId: string, intervalId: number) => {
      if (!account) return;
      
      // Convert quest ID string to felt252
      const questIdFelt = `0x${BigInt(shortString.encodeShortString(questId)).toString(16)}`;
      await systemCalls.claimQuest({
        account,
        quest_id: questIdFelt,
        interval_id: intervalId,
      });
    },
    [account, systemCalls]
  );

  // Check if all families are fully claimed
  const allClaimed = questFamilies.every(f => 
    f.tiers.every(t => t.claimed)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[520px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-5 py-5 max-h-[85vh] overflow-hidden gap-0"
      >
        <DialogTitle className="text-2xl text-center mb-3 flex items-center justify-center gap-2">
          <Scroll size={16} className="text-yellow-400" />
          Daily Quests
        </DialogTitle>

        {/* Summary Stats */}
        {claimableRewards > 0 && (
          <div className="text-center mb-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 py-2 px-3 rounded-lg border border-yellow-500/30">
            <span className="text-yellow-400 font-medium">
              {claimableRewards} CUBE ready to claim!
            </span>
          </div>
        )}

        {/* Quest Families List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 size={16} className="animate-spin mr-2" />
              Loading quests...
            </div>
          ) : questFamilies.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No quests available yet.
            </div>
          ) : (
            <>
              {/* Main Quest Families */}
              {mainFamilies.map((family) => (
                <QuestFamilyCard
                  key={family.id}
                  family={family}
                  onClaim={handleClaim}
                />
              ))}

              {/* Daily Champion (Finisher) - Separate Section */}
              {finisherFamily && (
                <>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-2 mb-1 flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500" />
                    <span>Complete all quests</span>
                  </div>
                  <DailyChampionCard 
                    family={finisherFamily} 
                    onClaim={handleClaim}
                    totalQuestsCompleted={mainFamilies.reduce(
                      (sum, f) => sum + f.tiers.filter(t => t.completed).length, 
                      0
                    )}
                    totalQuests={mainFamilies.reduce((sum, f) => sum + f.totalTiers, 0)}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-500">
            Quests reset daily at midnight UTC
          </p>
          {allClaimed && (
            <p className="text-xs text-green-400 mt-1">
              All quests completed! Come back tomorrow.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Special card for Daily Champion quest
interface DailyChampionCardProps {
  family: ReturnType<typeof useQuests>['questFamilies'][0];
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  totalQuestsCompleted: number;
  totalQuests: number;
}

const DailyChampionCard: React.FC<DailyChampionCardProps> = ({ 
  family, 
  onClaim,
  totalQuestsCompleted,
  totalQuests,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  
  const tier = family.tiers[0];
  if (!tier) return null;
  
  const isCompleted = tier.completed;
  const isClaimed = tier.claimed;
  const canClaim = isCompleted && !isClaimed;
  
  // Progress based on completed quests across all families
  const progressPercent = totalQuests > 0 
    ? (totalQuestsCompleted / totalQuests) * 100 
    : 0;

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim(tier.questId, tier.intervalId);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <motion.div
      className={`
        select-none flex flex-col gap-3 rounded-lg p-4
        ${isClaimed 
          ? "bg-yellow-900/10 border border-yellow-500/20" 
          : canClaim
            ? "bg-yellow-900/20 ring-1 ring-yellow-500/50"
            : "bg-slate-900"
        }
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Trophy
            size={20}
            className={`text-xl ${isClaimed ? "text-yellow-600" : canClaim ? "text-yellow-400" : "text-slate-500"}`}
          />
          <div>
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Daily Champion
            </h3>
            <p className="text-xs text-slate-400">
              Complete all daily quests
            </p>
          </div>
        </div>
        <span className={`text-lg font-bold ${
          isClaimed ? "text-yellow-600" : canClaim ? "text-yellow-400" : "text-slate-400"
        }`}>
          +{tier.reward} CUBE
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 p-0.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isClaimed ? "bg-yellow-600" : isCompleted ? "bg-yellow-400" : "bg-slate-600"
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
          {totalQuestsCompleted}/{totalQuests}
        </span>
      </div>

      {/* Claim button */}
      {canClaim && (
        <button
          onClick={handleClaim}
          disabled={isClaiming}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {isClaiming ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Trophy size={16} />
              <span>Claim Daily Champion Reward!</span>
            </>
          )}
        </button>
      )}

      {/* Claimed state */}
      {isClaimed && (
        <div className="text-center py-1 text-yellow-600 font-medium">
          Champion reward claimed!
        </div>
      )}
    </motion.div>
  );
};

export default QuestsDialog;
