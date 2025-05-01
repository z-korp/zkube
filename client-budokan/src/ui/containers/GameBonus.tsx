import ImageAssets from "@/ui/theme/ImageAssets";
import BonusButton from "../components/BonusButton";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { BonusType } from "@/dojo/game/types/bonus";

interface GameBonusProps {
  onBonusWaveClick: () => void;
  onBonusTikiClick: () => void;
  onBonusHammerClick: () => void;
  hammerCount: number;
  tikiCount: number;
  waveCount: number;
  bonus: BonusType;
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
    <div className="grid grid-cols-3 gap-1">
      <div className="flex flex-col items-start">
        <BonusButton
          onClick={onBonusHammerClick}
          urlImage={imgAssets.hammer}
          bonusCount={hammerCount}
          tooltipText="Destroys a block"
          bonusName={BonusType.Hammer}
          bonus={bonus}
        />
      </div>
      <div className="flex flex-col items-center">
        <BonusButton
          onClick={onBonusWaveClick}
          urlImage={imgAssets.wave}
          bonusCount={waveCount}
          tooltipText="Destroys an entire line"
          bonusName={BonusType.Wave}
          bonus={bonus}
        />
      </div>
      <div className="flex flex-col w-full items-end">
        <BonusButton
          onClick={onBonusTikiClick}
          urlImage={imgAssets.tiki}
          bonusCount={tikiCount}
          tooltipText="Destroys all blocks of a specific size"
          bonusName={BonusType.Totem}
          bonus={bonus}
        />
      </div>
    </div>
  );
};

export default GameBonus;
