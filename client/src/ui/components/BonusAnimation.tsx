import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BonusType, Bonus } from "@/dojo/game/types/bonus";

interface BonusAnimationProps {
  optimisticScore: number;
  optimisticCombo: number;
  optimisticMaxCombo: number;
  isMdOrLarger: boolean;
}

const BonusAnimation: React.FC<BonusAnimationProps> = ({
  optimisticScore,
  optimisticCombo,
  optimisticMaxCombo,
  isMdOrLarger,
}) => {
  const prevScoreRef = useRef(optimisticScore);
  const prevComboRef = useRef(optimisticCombo);
  const prevMaxComboRef = useRef(optimisticMaxCombo);

  const [unlockedBonuses, setUnlockedBonuses] = useState({
    Hammer: false,
    Totem: false,
    Wave: false,
  });

  const [wonBonus, setWonBonus] = useState<BonusType | null>(null);

  useEffect(() => {
    if (wonBonus) {
      const timer = setTimeout(() => {
        setWonBonus(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [wonBonus]);

  const getBonusImage = (bonusType: BonusType) => {
    const bonus = new Bonus(bonusType);
    return bonus.getIcon();
  };

  // Effect to check and set score-based bonuses
  useEffect(() => {
    if (!wonBonus) {
      if (
        optimisticScore >= 120 &&
        prevScoreRef.current < 120 &&
        !unlockedBonuses.Hammer
      ) {
        setWonBonus(BonusType.Hammer);
        setUnlockedBonuses((prev) => ({ ...prev, Hammer: true }));
      } else if (
        optimisticScore >= 80 &&
        prevScoreRef.current < 80 &&
        !unlockedBonuses.Hammer
      ) {
        setWonBonus(BonusType.Hammer);
        setUnlockedBonuses((prev) => ({ ...prev, Hammer: true }));
      } else if (
        optimisticScore >= 40 &&
        prevScoreRef.current < 40 &&
        !unlockedBonuses.Hammer
      ) {
        setWonBonus(BonusType.Hammer);
        setUnlockedBonuses((prev) => ({ ...prev, Hammer: true }));
      }
    }

    prevScoreRef.current = optimisticScore;
  }, [optimisticScore, wonBonus, unlockedBonuses]);

  // Effect to check and set combo-based bonuses
  useEffect(() => {
    if (!wonBonus) {
      if (
        optimisticCombo >= 24 &&
        prevComboRef.current < 24 &&
        !unlockedBonuses.Wave
      ) {
        setWonBonus(BonusType.Wave);
        setUnlockedBonuses((prev) => ({ ...prev, Wave: true }));
      } else if (
        optimisticCombo >= 16 &&
        prevComboRef.current < 16 &&
        !unlockedBonuses.Wave
      ) {
        setWonBonus(BonusType.Wave);
        setUnlockedBonuses((prev) => ({ ...prev, Wave: true }));
      } else if (
        optimisticCombo >= 8 &&
        prevComboRef.current < 8 &&
        !unlockedBonuses.Wave
      ) {
        setWonBonus(BonusType.Wave);
        setUnlockedBonuses((prev) => ({ ...prev, Wave: true }));
      }
    }

    prevComboRef.current = optimisticCombo;
  }, [optimisticCombo, wonBonus, unlockedBonuses]);

  // Effect to check and set maxCombo-based bonuses
  useEffect(() => {
    if (!wonBonus) {
      if (
        optimisticMaxCombo >= 6 &&
        prevMaxComboRef.current < 6 &&
        !unlockedBonuses.Totem
      ) {
        setWonBonus(BonusType.Totem);
        setUnlockedBonuses((prev) => ({ ...prev, Totem: true }));
      } else if (
        optimisticMaxCombo >= 4 &&
        prevMaxComboRef.current < 4 &&
        !unlockedBonuses.Totem
      ) {
        setWonBonus(BonusType.Totem);
        setUnlockedBonuses((prev) => ({ ...prev, Totem: true }));
      } else if (
        optimisticMaxCombo >= 2 &&
        prevMaxComboRef.current < 2 &&
        !unlockedBonuses.Totem
      ) {
        setWonBonus(BonusType.Totem);
        setUnlockedBonuses((prev) => ({ ...prev, Totem: true }));
      }
    }

    prevMaxComboRef.current = optimisticMaxCombo;
  }, [optimisticMaxCombo, wonBonus, unlockedBonuses]);

  if (!wonBonus) return null;

  return (
    <AnimatePresence>
      {wonBonus && (
        <motion.div
          key="bonus-animation"
          initial={{
            id: "init",
            scale: 0,
            rotate: 360,
            x: 0,
            y: -130,
            opacity: 0,
          }}
          animate={{
            id: "animate",
            scale: isMdOrLarger ? 1 : 0.7,
            rotate: 360,
            x: 0,
            y: -130,
            opacity: 1,
          }}
          exit={{
            id: "exit",
            scale: isMdOrLarger ? 0.27 : 0.23,
            rotate: 0,
            x:
              wonBonus === BonusType.Hammer
                ? isMdOrLarger
                  ? -180
                  : -148
                : wonBonus === BonusType.Wave
                  ? isMdOrLarger
                    ? -120
                    : -96
                  : isMdOrLarger
                    ? -58
                    : -48,
            y: isMdOrLarger ? -316 : -264,
            transition: {
              type: "spring",
              duration: 1,
            },
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 20,
          }}
          className="absolute inset-0 flex items-center justify-center z-50"
        >
          <motion.img
            src={getBonusImage(wonBonus)}
            alt="Bonus"
            className="relative z-10 w-32 h-32"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BonusAnimation;
