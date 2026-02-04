import { useState, useEffect, useCallback } from "react";
import { Button } from "@/ui/elements/button";
import type { QuestProps } from "@/contexts/quests";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faCheck,
  faSquare,
  faSquareCheck,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

interface QuestCardProps {
  quest: QuestProps;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
}

// Format countdown timer
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onClaim }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [countdown, setCountdown] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, quest.end - now);
  });

  // Update countdown every second
  useEffect(() => {
    if (quest.claimed) return;
    
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      setCountdown(Math.max(0, quest.end - now));
    }, 1000);

    return () => clearInterval(interval);
  }, [quest.end, quest.claimed]);

  const handleClaim = useCallback(async () => {
    if (!quest.completed || quest.claimed || quest.locked) return;
    setIsClaiming(true);
    try {
      await onClaim(quest.id, quest.intervalId);
    } finally {
      setIsClaiming(false);
    }
  }, [quest.completed, quest.claimed, quest.locked, quest.id, quest.intervalId, onClaim]);

  // Determine card state
  const isLocked = quest.locked;
  const isCompleted = quest.completed && !quest.claimed;
  const isClaimed = quest.claimed;

  // Get total reward CUBE amount
  const rewardAmount = quest.rewards.reduce((sum, r) => {
    const match = r.description.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  // Get the first task (our quests typically have one task)
  const task = quest.tasks[0];
  const taskCount = task ? Math.min(Number(task.count), Number(task.total)) : 0;
  const taskTotal = task ? Number(task.total) : 1;
  const progress = (taskCount / taskTotal) * 100;

  return (
    <motion.div
      className={`
        select-none flex flex-col gap-3 rounded-lg p-4
        ${isLocked 
          ? "bg-slate-900/50 opacity-60" 
          : isClaimed
            ? "bg-slate-800/30"
            : "bg-slate-900"
        }
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top section: left (title/task) and right (claim button) */}
      <div className="flex justify-between items-start gap-4">
        {/* Left: title and task with checkbox */}
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          {/* Title row with lock/check icon */}
          <div className="flex items-center gap-2">
            {isLocked && (
              <FontAwesomeIcon icon={faLock} className="text-slate-500 text-sm" />
            )}
            <h3 className="text-lg font-semibold text-white tracking-wide uppercase truncate">
              {quest.name}
            </h3>
            {rewardAmount > 0 && (
              <span className={`text-sm font-medium ml-auto flex-shrink-0 ${
                isCompleted ? "text-yellow-400" : "text-slate-400"
              }`}>
                +{rewardAmount}
              </span>
            )}
          </div>
          
          {/* Task description with checkbox */}
          {task && (
            <div className={`flex items-center gap-2 ${
              isClaimed ? "text-slate-500" : "text-slate-300"
            }`}>
              <FontAwesomeIcon 
                icon={isClaimed || taskCount >= taskTotal ? faSquareCheck : faSquare} 
                className={`text-sm ${
                  isClaimed ? "text-slate-500" : taskCount >= taskTotal ? "text-green-400" : "text-slate-400"
                }`}
              />
              <span className="text-sm truncate">
                {task.description}
              </span>
            </div>
          )}
        </div>

        {/* Right: claim button (desktop only) */}
        <ClaimButton
          claimed={isClaimed}
          isCompleted={isCompleted}
          isLocked={isLocked}
          onClaim={handleClaim}
          isClaiming={isClaiming}
          countdown={countdown}
          className="hidden md:flex"
        />
      </div>

      {/* Bottom section: progress bar and count */}
      <div className="flex items-center gap-3 h-5">
        {/* Progress bar */}
        <div className="flex-1 h-4 p-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isClaimed ? "bg-slate-600" : taskCount >= taskTotal ? "bg-green-500" : "bg-blue-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          />
        </div>

        {/* Count display */}
        <p className="flex items-center gap-2 text-sm text-white font-medium min-w-fit">
          {taskCount >= taskTotal && (
            <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
          )}
          <span>
            {taskCount} of {taskTotal}
          </span>
        </p>
      </div>

      {/* Mobile claim button */}
      <ClaimButton
        claimed={isClaimed}
        isCompleted={isCompleted}
        isLocked={isLocked}
        onClaim={handleClaim}
        isClaiming={isClaiming}
        countdown={countdown}
        className="w-full md:hidden"
      />
    </motion.div>
  );
};

interface ClaimButtonProps {
  claimed: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onClaim: () => void;
  isClaiming: boolean;
  countdown: number;
  className?: string;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({
  claimed,
  isCompleted,
  isLocked,
  onClaim,
  isClaiming,
  countdown,
  className = "",
}) => {
  if (claimed) {
    return (
      <div className={className}>
        <div className="px-5 py-2 bg-slate-800 rounded-lg h-10 flex items-center justify-center min-w-[100px]">
          <span className="text-lg tracking-wider text-slate-400 font-medium">
            Claimed
          </span>
        </div>
      </div>
    );
  }

  if (isCompleted && !isLocked) {
    return (
      <Button
        variant="default"
        onClick={onClaim}
        disabled={isClaiming}
        isLoading={isClaiming}
        className={`bg-green-600 hover:bg-green-700 text-white font-semibold min-w-[100px] h-10 ${className}`}
      >
        <span className="text-lg">Claim</span>
      </Button>
    );
  }

  // Show countdown timer
  return (
    <div className={className}>
      <div className="px-5 py-2 bg-slate-800 rounded-lg h-10 flex items-center justify-center min-w-[100px]">
        <span className="text-lg tracking-wider text-white font-medium tabular-nums">
          {formatCountdown(countdown)}
        </span>
      </div>
    </div>
  );
};

export default QuestCard;
