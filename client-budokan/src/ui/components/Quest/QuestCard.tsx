import { useState } from "react";
import { Button } from "@/ui/elements/button";
import { Progress } from "@/ui/elements/progress";
import { QuestTimer } from "./QuestTimer";
import type { QuestProps } from "@/contexts/quests";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faCheck,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

interface QuestCardProps {
  quest: QuestProps;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onClaim }) => {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!quest.completed || quest.claimed || quest.locked) return;
    setIsClaiming(true);
    try {
      await onClaim(quest.id, quest.intervalId);
    } finally {
      setIsClaiming(false);
    }
  };

  // Determine card state
  const isLocked = quest.locked;
  const isCompleted = quest.completed && !quest.claimed;
  const isClaimed = quest.claimed;
  const isInProgress = !isLocked && !quest.completed;

  // Calculate progress percentage (capped at 100)
  const progressPercent = Math.min(100, quest.progression);

  // Get total reward CUBE amount
  const rewardAmount = quest.rewards.reduce((sum, r) => {
    const match = r.description.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  return (
    <motion.div
      className={`
        relative rounded-lg p-3 border transition-all
        ${isLocked 
          ? "bg-slate-900/50 border-slate-700/30 opacity-60" 
          : isClaimed
            ? "bg-green-900/20 border-green-700/30"
            : isCompleted
              ? "bg-yellow-900/20 border-yellow-500/50 shadow-lg shadow-yellow-500/10"
              : "bg-slate-800/50 border-slate-700/40"
        }
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isLocked && (
              <FontAwesomeIcon icon={faLock} className="text-slate-500 text-xs" />
            )}
            {isClaimed && (
              <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
            )}
            <span className={`text-sm font-medium truncate ${
              isLocked ? "text-slate-500" : isClaimed ? "text-green-400" : "text-white"
            }`}>
              {quest.name}
            </span>
          </div>
          {quest.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {quest.description}
            </p>
          )}
        </div>

        {/* Timer or Reward */}
        <div className="flex-shrink-0 text-right">
          {!isClaimed && quest.end > 0 && (
            <QuestTimer endTime={quest.end} />
          )}
          {rewardAmount > 0 && (
            <div className={`text-xs font-medium ${
              isCompleted ? "text-yellow-400" : "text-slate-400"
            }`}>
              {rewardAmount} cube
            </div>
          )}
        </div>
      </div>

      {/* Task Progress */}
      {quest.tasks.length > 0 && (
        <div className="mb-2">
          {quest.tasks.map((task, index) => (
            <div key={index} className="mb-1.5 last:mb-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 truncate flex-1 mr-2">
                  {task.description}
                </span>
                <span className={`font-medium ${
                  Number(task.count) >= Number(task.total) 
                    ? "text-green-400" 
                    : "text-slate-300"
                }`}>
                  {Math.min(Number(task.count), Number(task.total))} / {Number(task.total)}
                </span>
              </div>
              <Progress 
                value={(Number(task.count) / Number(task.total)) * 100}
                className={`h-1.5 ${
                  Number(task.count) >= Number(task.total) 
                    ? "[&>div]:bg-green-500" 
                    : "[&>div]:bg-blue-500"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Overall Progress (if no individual tasks shown) */}
      {quest.tasks.length === 0 && isInProgress && (
        <div className="mb-2">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Claim Button */}
      {isCompleted && (
        <Button
          size="sm"
          onClick={handleClaim}
          disabled={isClaiming}
          isLoading={isClaiming}
          className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-semibold"
        >
          <FontAwesomeIcon icon={faGift} className="mr-2" />
          Claim Reward
        </Button>
      )}

      {/* Claimed indicator */}
      {isClaimed && (
        <div className="text-center text-xs text-green-400/80 mt-2">
          Completed
        </div>
      )}
    </motion.div>
  );
};

export default QuestCard;
