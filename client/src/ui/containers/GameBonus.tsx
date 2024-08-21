import React from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import BonusButton from "../components/BonusBouton";
import { useTheme } from "@/ui/elements/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

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

  const handleClickWave = () => {
    console.log("Wave button clicked");
    onBonusWaveClick();
  };

  const handleClickTiki = () => {
    console.log("Tiki button clicked");
    onBonusTikiClick();
  };

  const handleClickHammer = () => {
    console.log("Hammer button clicked");
    onBonusHammerClick();
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col items-start">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <BonusButton
                onClick={handleClickHammer}
                urlImage={imgAssets.hammer}
                bonusCount={hammerCount}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-sm">
                <p> Use to destroy a single block</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex flex-col items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <BonusButton
                onClick={handleClickWave}
                urlImage={imgAssets.wave}
                bonusCount={waveCount}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-sm">
                <p> Use to destroy an entire line</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex flex-col w-full items-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <BonusButton
                onClick={handleClickTiki}
                urlImage={imgAssets.tiki}
                bonusCount={tikiCount}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-sm">
                <p> Use to destroy all piecies of a specific size</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default GameBonus;
