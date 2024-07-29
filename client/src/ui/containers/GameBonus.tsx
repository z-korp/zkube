import ImageAssets from "@/ui/theme/ImageAssets";
import BonusButton from "../components/BonusBouton";
import { useTheme } from "@/ui/elements/theme-provider";

export const GameBonus = ({ onBonusWaveClick }: { onBonusWaveClick: any }) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const handleClickWave = () => {
    console.log("Ready to be binded");
    onBonusWaveClick();
  };
  const handleClickTiki = () => {
    console.log("Ready to be binded");
    //onBonusWaveClick();
  };
  const handleClickHammer = () => {
    console.log("Ready to be binded");
    //onBonusWaveClick();
  };

  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-2">
      <div className="flex flex-col items-start">
        <BonusButton onClick={handleClickHammer} urlImage={imgAssets.hammer} />
      </div>
      <div className="flex flex-col items-center">
        <BonusButton onClick={handleClickTiki} urlImage={imgAssets.tiki} />
      </div>
      <div className="flex flex-col w-full items-end ">
        <BonusButton onClick={handleClickWave} urlImage={imgAssets.wave} />
      </div>
    </div>
  );
};
