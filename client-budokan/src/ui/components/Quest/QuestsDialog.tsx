import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { useQuests } from "@/contexts/quests";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { QuestCard } from "./QuestCard";
import { useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScroll, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { shortString } from "starknet";

interface QuestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestsDialog: React.FC<QuestsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { quests, status } = useQuests();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  // Separate quests by status
  const { activeQuests, completedQuests } = useMemo(() => {
    const active = quests.filter((q) => !q.claimed);
    const completed = quests.filter((q) => q.claimed);
    return { activeQuests: active, completedQuests: completed };
  }, [quests]);

  // Calculate total claimable rewards
  const claimableRewards = useMemo(() => {
    return activeQuests
      .filter((q) => q.completed && !q.claimed)
      .reduce((sum, quest) => {
        const rewardAmount = quest.rewards.reduce((r, reward) => {
          const match = reward.description.match(/(\d+)/);
          return r + (match ? parseInt(match[1], 10) : 0);
        }, 0);
        return sum + rewardAmount;
      }, 0);
  }, [activeQuests]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[480px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-5 py-5 max-h-[85vh] overflow-hidden gap-0"
      >
        <DialogTitle className="text-2xl text-center mb-3 flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faScroll} className="text-yellow-400" />
          Daily Quests
        </DialogTitle>

        {/* Summary Stats */}
        {claimableRewards > 0 && (
          <div className="text-center mb-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 py-2 px-3 rounded-lg border border-yellow-500/30">
            <span className="text-yellow-400 font-medium">
              {claimableRewards} cube ready to claim!
            </span>
          </div>
        )}

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Loading quests...
            </div>
          ) : activeQuests.length === 0 && completedQuests.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No quests available yet.
            </div>
          ) : (
            <>
              {/* Active Quests */}
              {activeQuests.length > 0 && (
                <>
                  {activeQuests.map((quest) => (
                    <QuestCard
                      key={`${quest.id}-${quest.intervalId}`}
                      quest={quest}
                      onClaim={handleClaim}
                    />
                  ))}
                </>
              )}

              {/* Completed Quests Section */}
              {completedQuests.length > 0 && (
                <>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">
                    Completed Today
                  </div>
                  {completedQuests.map((quest) => (
                    <QuestCard
                      key={`${quest.id}-${quest.intervalId}`}
                      quest={quest}
                      onClaim={handleClaim}
                    />
                  ))}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestsDialog;
