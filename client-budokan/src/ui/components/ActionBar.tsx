import React, { useState } from "react";
import { motion } from "framer-motion";
import BonusButton from "./BonusButton";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { BonusType } from "@/dojo/game/types/bonus";

interface ActionBarProps {
  // Bonus handlers
  onBonusHammerClick: () => void;
  onBonusWaveClick: () => void;
  onBonusTotemClick: () => void;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  activeBonus: BonusType;
  // Power-up handlers (placeholder for future)
  powerUps?: {
    id: string;
    icon: string;
    count: number;
    onClick: () => void;
    tooltip: string;
  }[];
}

const ActionBar: React.FC<ActionBarProps> = ({
  onBonusHammerClick,
  onBonusWaveClick,
  onBonusTotemClick,
  hammerCount,
  waveCount,
  totemCount,
  activeBonus,
  powerUps = [],
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const [activePanel, setActivePanel] = useState(0); // 0 = bonuses, 1 = power-ups

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const threshold = 50;
    if (info.offset.x < -threshold && activePanel === 0) {
      setActivePanel(1);
    } else if (info.offset.x > threshold && activePanel === 1) {
      setActivePanel(0);
    }
  };

  // Placeholder power-ups for design testing
  const defaultPowerUps = powerUps.length > 0 ? powerUps : [
    { id: "power1", icon: "⚡", count: 1, onClick: () => {}, tooltip: "Power 1" },
    { id: "power2", icon: "💥", count: 0, onClick: () => {}, tooltip: "Power 2" },
    { id: "power3", icon: "🎯", count: 2, onClick: () => {}, tooltip: "Power 3" },
    { id: "power4", icon: "⏰", count: 0, onClick: () => {}, tooltip: "Power 4" },
    { id: "power5", icon: "🔄", count: 1, onClick: () => {}, tooltip: "Power 5" },
  ];

  return (
    <div className="w-full">
      {/* Swipeable container */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={{ x: activePanel === 0 ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Panel 1: Bonuses */}
          <div className="min-w-full flex justify-center items-center gap-2 px-2 py-1">
            <BonusButton
              onClick={onBonusHammerClick}
              urlImage={imgAssets.hammer}
              bonusCount={hammerCount}
              tooltipText="Destroys a block"
              bonusName={BonusType.Hammer}
              bonus={activeBonus}
              disabled={hammerCount === 0}
            />
            <BonusButton
              onClick={onBonusWaveClick}
              urlImage={imgAssets.wave}
              bonusCount={waveCount}
              tooltipText="Destroys an entire line"
              bonusName={BonusType.Wave}
              bonus={activeBonus}
              disabled={waveCount === 0}
            />
            <BonusButton
              onClick={onBonusTotemClick}
              urlImage={imgAssets.tiki}
              bonusCount={totemCount}
              tooltipText="Destroys all blocks of a specific size"
              bonusName={BonusType.Totem}
              bonus={activeBonus}
              disabled={totemCount === 0}
            />
          </div>

          {/* Panel 2: Power-ups */}
          <div className="min-w-full flex justify-center items-center gap-1.5 px-2 py-1">
            {defaultPowerUps.map((power) => (
              <PowerUpButton
                key={power.id}
                icon={power.icon}
                count={power.count}
                onClick={power.onClick}
                tooltip={power.tooltip}
                disabled={power.count === 0}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-1">
        <button
          onClick={() => setActivePanel(0)}
          className={`w-2 h-2 rounded-full transition-colors ${
            activePanel === 0 ? "bg-yellow-500" : "bg-slate-600"
          }`}
          aria-label="Bonuses"
        />
        <button
          onClick={() => setActivePanel(1)}
          className={`w-2 h-2 rounded-full transition-colors ${
            activePanel === 1 ? "bg-yellow-500" : "bg-slate-600"
          }`}
          aria-label="Power-ups"
        />
      </div>
    </div>
  );
};

// Simple power-up button component
interface PowerUpButtonProps {
  icon: string;
  count: number;
  onClick: () => void;
  tooltip: string;
  disabled?: boolean;
}

const PowerUpButton: React.FC<PowerUpButtonProps> = ({
  icon,
  count,
  onClick,
  tooltip,
  disabled = false,
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg border flex items-center justify-center text-xl
        ${disabled 
          ? "bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed" 
          : "bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 cursor-pointer"
        }`}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      title={tooltip}
    >
      <span>{icon}</span>
      <div className={`absolute -top-1 -right-1 text-xs rounded-full h-5 w-5 flex items-center justify-center
        ${disabled ? "bg-slate-600 text-slate-400" : "bg-yellow-500 text-white"}`}
      >
        {count}
      </div>
    </motion.button>
  );
};

export default ActionBar;
