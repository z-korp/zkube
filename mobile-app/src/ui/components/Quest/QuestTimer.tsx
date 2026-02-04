import { useState, useEffect } from "react";

interface QuestTimerProps {
  endTime: number; // Unix timestamp in seconds
  className?: string;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Expired";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export const QuestTimer: React.FC<QuestTimerProps> = ({
  endTime,
  className = "",
}) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, endTime - now);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const isUrgent = timeRemaining < 3600; // Less than 1 hour

  return (
    <span
      className={`text-xs font-medium ${
        isUrgent ? "text-orange-400" : "text-slate-400"
      } ${className}`}
    >
      {formatTimeRemaining(timeRemaining)}
    </span>
  );
};

export default QuestTimer;
