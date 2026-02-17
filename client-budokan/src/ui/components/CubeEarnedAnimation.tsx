import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export type CubeEarnReason = 
  | "combo_4" // 4 lines cleared = +1 cube
  | "combo_5" // 5 lines cleared = +3 cubes
  | "combo_6" // 6 lines cleared = +5 cubes
  | "combo_7" // 7 lines cleared = +10 cubes
  | "combo_8" // 8 lines cleared = +25 cubes
  | "combo_9" // 9+ lines cleared = +50 cubes
  | "achievement_5x" // First 5-line combo = +3 cubes
  | "achievement_10x"; // First 10-line combo = +5 cubes

interface CubeEarnedNotification {
  id: number;
  amount: number;
  reason: CubeEarnReason;
}

interface CubeEarnedAnimationProps {
  /** Running combo counter that accumulates across the game */
  comboCounter: number;
  /** Whether first 5-line combo achievement was unlocked */
  combo5Achieved: boolean;
  /** Whether first 10-line combo achievement was unlocked */
  combo10Achieved: boolean;
  isMdOrLarger: boolean;
}

const getReasonText = (reason: CubeEarnReason): string => {
  switch (reason) {
    case "combo_4":
      return "4-Line Combo!";
    case "combo_5":
      return "5-Line Combo!";
    case "combo_6":
      return "6-Line Combo!";
    case "combo_7":
      return "7-Line Combo!";
    case "combo_8":
      return "8-Line Combo!";
    case "combo_9":
      return "MEGA COMBO!";
    case "achievement_5x":
      return "First 5x Combo!";
    case "achievement_10x":
      return "First 10x Combo!";
    default:
      return "Cube Bonus!";
  }
};

const getReasonColor = (reason: CubeEarnReason): string => {
  switch (reason) {
    case "combo_4":
      return "text-yellow-400";
    case "combo_5":
      return "text-orange-400";
    case "combo_6":
      return "text-red-400";
    case "combo_7":
      return "text-pink-400";
    case "combo_8":
      return "text-purple-400";
    case "combo_9":
      return "text-cyan-400";
    case "achievement_5x":
      return "text-purple-400";
    case "achievement_10x":
      return "text-pink-400";
    default:
      return "text-yellow-400";
  }
};

const CubeEarnedAnimation: React.FC<CubeEarnedAnimationProps> = ({
  comboCounter,
  combo5Achieved,
  combo10Achieved,
  isMdOrLarger,
}) => {
  const prevComboCounterRef = useRef(comboCounter);
  const prevCombo5Ref = useRef(combo5Achieved);
  const prevCombo10Ref = useRef(combo10Achieved);
  const notificationIdRef = useRef(0);

  const [notifications, setNotifications] = useState<CubeEarnedNotification[]>([]);

  // Add a notification and auto-remove it after delay
  const addNotification = (amount: number, reason: CubeEarnReason) => {
    const id = notificationIdRef.current++;
    setNotifications((prev) => [...prev, { id, amount, reason }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2500);
  };

  // Detect combo achievement unlocks (one-time per run)
  useEffect(() => {
    // First 5x combo achievement: +3 cubes
    if (combo5Achieved && !prevCombo5Ref.current) {
      addNotification(3, "achievement_5x");
    }
    prevCombo5Ref.current = combo5Achieved;
  }, [combo5Achieved]);

  useEffect(() => {
    // First 10x combo achievement: +5 cubes
    if (combo10Achieved && !prevCombo10Ref.current) {
      addNotification(5, "achievement_10x");
    }
    prevCombo10Ref.current = combo10Achieved;
  }, [combo10Achieved]);

  // Detect multi-line clears by watching comboCounter changes
  // comboCounter += lines_cleared when lines_cleared > 1
  // So if combo increases by N (where N >= 2), N lines were cleared
  useEffect(() => {
    const prevCombo = prevComboCounterRef.current;
    const newCombo = comboCounter;
    const linesCleared = newCombo - prevCombo;

    // Only award cube bonuses for 4+ lines cleared
    // Rewards: 4->+1, 5->+3, 6->+5, 7->+10, 8->+25, 9+->+50
    if (linesCleared >= 4) {
      if (linesCleared >= 9) {
        addNotification(50, "combo_9");
      } else if (linesCleared >= 8) {
        addNotification(25, "combo_8");
      } else if (linesCleared >= 7) {
        addNotification(10, "combo_7");
      } else if (linesCleared >= 6) {
        addNotification(5, "combo_6");
      } else if (linesCleared >= 5) {
        addNotification(3, "combo_5");
      } else {
        addNotification(1, "combo_4");
      }
    }

    prevComboCounterRef.current = comboCounter;
  }, [comboCounter]);

  return (
    <AnimatePresence>
      {notifications.map((notification, index) => (
        <motion.div
          key={notification.id}
          initial={{
            scale: 0.5,
            opacity: 0,
            y: 50,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
          }}
          exit={{
            scale: 0.8,
            opacity: 0,
            y: -50,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          className="fixed z-50 flex flex-col items-center justify-center pointer-events-none"
          style={{
            top: isMdOrLarger ? 180 + index * 90 : 140 + index * 70,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Background glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.3, 1.1], 
              opacity: [0, 0.4, 0.2] 
            }}
            transition={{ duration: 0.6 }}
            className={`absolute w-40 h-40 rounded-full blur-2xl ${
              notification.reason.startsWith("achievement") 
                ? "bg-purple-500" 
                : "bg-yellow-500"
            }`}
          />
          
          {/* Main content */}
          <motion.div
            initial={{ rotate: -5 }}
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 0.4, repeat: 1 }}
            className={`relative flex flex-col items-center rounded-2xl px-8 py-5 border-2 shadow-2xl ${
              notification.reason.startsWith("achievement")
                ? "bg-gradient-to-br from-purple-900/95 to-slate-900/95 border-purple-400/60 shadow-purple-500/30"
                : "bg-gradient-to-br from-yellow-900/95 to-slate-900/95 border-yellow-400/60 shadow-yellow-500/30"
            }`}
          >
            {/* Cube icon and amount */}
            <div className="flex items-center gap-3 mb-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.4, times: [0, 0.5, 1] }}
                className={`text-4xl font-bold ${
                  notification.reason.startsWith("achievement")
                    ? "text-purple-300"
                    : "text-yellow-300"
                }`}
              >
                +{notification.amount}
              </motion.span>
              <motion.span
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: 360, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-3xl"
              >
                {/* Cube emoji */}
                <span role="img" aria-label="cube">
                  {notification.reason.startsWith("achievement") ? (
                    <span className="inline-block">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        *
                      </motion.span>
                    </span>
                  ) : null}
                </span>
              </motion.span>
            </div>

            {/* Reason text */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`text-base font-bold tracking-wide ${getReasonColor(notification.reason)}`}
            >
              {getReasonText(notification.reason)}
            </motion.div>

            {/* Sparkle effects for achievements */}
            {notification.reason.startsWith("achievement") && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: [-20, -30], y: [-10, -20] }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute text-yellow-300 text-lg"
                >
                  *
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: [20, 30], y: [-15, -25] }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute text-yellow-300 text-lg"
                >
                  *
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: [0, 5], y: [20, 30] }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="absolute text-yellow-300 text-lg"
                >
                  *
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default CubeEarnedAnimation;
