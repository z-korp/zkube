import React, { useState, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface LevelThresholds {
  [key: number]: number;
}

const levelThresholds: LevelThresholds = {
  1: 0,
  2: 300,
  3: 600,
  4: 1000,
  5: 1500,
  6: 2200,
  7: 3100,
  8: 4300,
  9: 5800,
  10: 7800,
  11: 10300,
  12: 13500,
  13: 17500,
  14: 22500,
  15: 28500,
  16: 36000,
  17: 45000,
  18: 56000,
  19: 70000,
  20: 100000,
};

interface LevelIndicatorProps {
  currentXP: number;
}

const LevelIndicator: React.FC<LevelIndicatorProps> = ({ currentXP }) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const animationRef = useRef<number>();

  const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
  };

  // Easing function for smoother animation
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  const calculateLevel = (xp: number): [number, number, number] => {
    let level = 1;
    while (level < 20 && xp >= levelThresholds[level + 1]) {
      level++;
    }
    const currentLevelXP = levelThresholds[level];
    const nextLevelXP = levelThresholds[level + 1];
    const progress =
      ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return [level, Math.floor(progress), nextLevelXP - currentLevelXP];
  };

  const [currentLevel, progress, xpForNextLevel] = calculateLevel(displayXP);

  useEffect(() => {
    let startTime: number;
    const animationDuration = 3000; // Increased to 3 seconds

    const animate = (time: number) => {
      if (startTime === undefined) {
        startTime = time;
      }

      const elapsed = time - startTime;
      const rawProgress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeOutCubic(rawProgress);

      setDisplayXP(Math.floor(lerp(displayXP, currentXP, easedProgress)));

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentXP]);

  const strokeWidth = 4;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="relative w-[32px] h-[32px]">
            <svg className="w-full h-full" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r={radius}
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="16"
                cy="16"
                r={radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 16 16)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background rounded-full w-[24px] h-[24px] flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">
                  {currentLevel}
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>Level: {currentLevel}</p>
            <p>XP: {displayXP}</p>
            <p>Progress: {progress}%</p>
            <p>
              Next Level:{" "}
              {currentLevel < 20
                ? xpForNextLevel - (displayXP - levelThresholds[currentLevel])
                : "Max"}{" "}
              XP
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LevelIndicator;
