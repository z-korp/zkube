import React from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import BonusButton from "../components/BonusButton";
import { useTheme } from "@/ui/elements/theme-provider";

interface GameBonusProps {
  onBonusWaveClick: () => void;
  onBonusTikiClick: () => void;
  onBonusHammerClick: () => void;
  hammerCount: number;
  tikiCount: number;
  waveCount: number;
}

export const GameBonus: React.FC<GameBonusProps> = ({
  onBonusWaveClick,
  onBonusTikiClick,
  onBonusHammerClick,
  hammerCount,
  tikiCount,
  waveCount,
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col items-start">
        <BonusButton
          onClick={onBonusHammerClick}
          urlImage={imgAssets.hammer}
          bonusCount={hammerCount}
          tooltipText="Destroys a block"
        />
      </div>
      <div className="flex flex-col items-center">
        <BonusButton
          onClick={onBonusWaveClick}
          urlImage={imgAssets.wave}
          bonusCount={waveCount}
          tooltipText="Destroys an entire line"
        />
      </div>
      <div className="flex flex-col w-full items-end">
        <BonusButton
          onClick={onBonusTikiClick}
          urlImage={imgAssets.tiki}
          bonusCount={tikiCount}
          tooltipText="Destroys all blocks of a specific size"
        />
      </div>
    </div>
  );
};

export default GameBonus;