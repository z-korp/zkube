import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BonusType, Bonus } from "@/dojo/game/types/bonus";
import { Totem } from "@/dojo/game/elements/bonuses/totem";
import { Wave } from "@/dojo/game/elements/bonuses/wave";
import { Hammer } from "@/dojo/game/elements/bonuses/hammer";

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

  const [wonBonus, setWonBonus] = useState<BonusType | null>(null);

  const [unlockedBonuses, setUnlockedBonuses] = useState({
    Hammer: false,
    Totem: false,
    Wave: false,
  });

  useEffect(() => {
    if (wonBonus) {
      const timer = setTimeout(() => {
        setWonBonus(null);
      }, 1200);
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
      const hammerConditions = Hammer.getConditions();
      const thirdHammerScore = hammerConditions[2].score;
      const secondHammerScore = hammerConditions[1].score;
      const firstHammerScore = hammerConditions[0].score;
      if (
        optimisticScore >= thirdHammerScore &&
        prevScoreRef.current < thirdHammerScore &&
        !unlockedBonuses.Hammer
      ) {
        setWonBonus(BonusType.Hammer);
        setUnlockedBonuses((prev) => ({ ...prev, Hammer: true }));
      } else if (
        optimisticScore >= secondHammerScore &&
        prevScoreRef.current < secondHammerScore &&
        !unlockedBonuses.Hammer
      ) {
        setWonBonus(BonusType.Hammer);
        setUnlockedBonuses((prev) => ({ ...prev, Hammer: true }));
      } else if (
        optimisticScore >= firstHammerScore &&
        prevScoreRef.current < firstHammerScore &&
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
      const waveConditions = Wave.getConditions();
      const thirdWaveCombo = waveConditions[2].combo;
      const secondWaveCombo = waveConditions[1].combo;
      const firstWaveCombo = waveConditions[0].combo;
      if (
        optimisticCombo >= thirdWaveCombo &&
        prevComboRef.current < thirdWaveCombo &&
        !unlockedBonuses.Wave
      ) {
        setWonBonus(BonusType.Wave);
        setUnlockedBonuses((prev) => ({ ...prev, Wave: true }));
      } else if (
        optimisticCombo >= secondWaveCombo &&
        prevComboRef.current < secondWaveCombo &&
        !unlockedBonuses.Wave
      ) {
        setWonBonus(BonusType.Wave);
        setUnlockedBonuses((prev) => ({ ...prev, Wave: true }));
      } else if (
        optimisticCombo >= firstWaveCombo &&
        prevComboRef.current < firstWaveCombo &&
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
      const totemConditions = Totem.getConditions();
      const thirdTotemMaxCombo = totemConditions[2].max_combo;
      const secondTotemMaxCombo = totemConditions[1].max_combo;
      const firstTotemMaxCombo = totemConditions[0].max_combo;
      if (
        optimisticMaxCombo >= thirdTotemMaxCombo &&
        prevMaxComboRef.current < thirdTotemMaxCombo &&
        !unlockedBonuses.Totem
      ) {
        setWonBonus(BonusType.Totem);
        setUnlockedBonuses((prev) => ({ ...prev, Totem: true }));
      } else if (
        optimisticMaxCombo >= secondTotemMaxCombo &&
        prevMaxComboRef.current < secondTotemMaxCombo &&
        !unlockedBonuses.Totem
      ) {
        setWonBonus(BonusType.Totem);
        setUnlockedBonuses((prev) => ({ ...prev, Totem: true }));
      } else if (
        optimisticMaxCombo >= firstTotemMaxCombo &&
        prevMaxComboRef.current < firstTotemMaxCombo &&
        !unlockedBonuses.Totem
      ) {
        setWonBonus(BonusType.Totem);
        setUnlockedBonuses((prev) => ({ ...prev, Totem: true }));
      }
    }

    prevMaxComboRef.current = optimisticMaxCombo;
  }, [optimisticMaxCombo, wonBonus, unlockedBonuses]);

  return (
    <AnimatePresence>
      {wonBonus && (
        <motion.div
          key="bonus-animation"
          initial={{
            id: "init",
            scale: 0,
            rotate: 360,
            top: isMdOrLarger ? 200 : 150,
            left: "50%",
            x: "-50%",
            y: "-50%",
            opacity: 0,
          }}
          animate={{
            id: "animate",
            scale: isMdOrLarger ? 1 : 0.7,
            rotate: 360,
            top: isMdOrLarger ? 200 : 150,
            left: "50%",
            x: "-50%",
            y: "-50%",
            opacity: 1,
          }}
          exit={{
            id: "exit",
            scale: isMdOrLarger ? 0.27 : 0.23,
            rotate: 0,
            top: isMdOrLarger ? 40 : 31,
            left:
              wonBonus === BonusType.Hammer
                ? "9%"
                : wonBonus === BonusType.Wave
                ? "23%"
                : "37%",
            x: "-50%",
            y: "-50%",
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
          className="absolute flex items-center justify-center z-50"
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
