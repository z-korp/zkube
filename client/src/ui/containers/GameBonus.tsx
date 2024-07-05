import BonusButton from "../components/BonusBouton";

import imageHammer from "/assets/bonus/hammer.png";
import imageTiki from "/assets/bonus/tiki.png";
import imageWave from "/assets/bonus/wave.png";

export const GameBonus = () => {
  const handleClick = () => {
    console.log("Ready to be binded");
  };

  return (
    <div className="grid grid-cols-3 md:gap-3 sm:gap-4 gap-6 w-60 pb-2">
      <div className="flex flex-col items-start">
        <BonusButton onClick={handleClick} urlImage={imageHammer} />
      </div>
      <div className="flex flex-col items-center">
        <BonusButton onClick={handleClick} urlImage={imageTiki} />
      </div>
      <div className="flex flex-col w-full items-end ">
        <BonusButton onClick={handleClick} urlImage={imageWave} />
      </div>
    </div>
  );
};
