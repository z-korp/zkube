import React from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import BonusButton from "../components/BonusButton";
import { useTheme } from "@/ui/elements/theme-provider";
import { Bonus } from "@/dojo/game/types/bonus";
import { BonusName } from "@/enums/bonusEnum";

interface GameBonusProps {
  onBonusWaveClick: () => void;
  onBonusTikiClick: () => void;
  onBonusHammerClick: () => void;
  hammerCount: number;
  tikiCount: number;
  waveCount: number;
  bonus: BonusName;
}

export const GameBonus: React.FC<GameBonusProps> = ({
  onBonusWaveClick,
  onBonusTikiClick,
  onBonusHammerClick,
  hammerCount,
  tikiCount,
  waveCount,
  bonus,
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
          bonusName={BonusName.HAMMER}
          bonus={bonus}
        />
      </div>
      <div className="flex flex-col items-center">
        <BonusButton
          onClick={onBonusWaveClick}
          urlImage={imgAssets.wave}
          bonusCount={waveCount}
          tooltipText="Destroys an entire line"
          bonusName={BonusName.WAVE}
          bonus={bonus}
        />
      </div>
      <div className="flex flex-col w-full items-end">
        <BonusButton
          onClick={onBonusTikiClick}
          urlImage={imgAssets.tiki}
          bonusCount={tikiCount}
          tooltipText="Destroys all blocks of a specific size"
          bonusName={BonusName.TIKI}
          bonus={bonus}
        />
      </div>
    </div>
  );
};

export default GameBonus;
