import BonusButton from "../components/BonusBouton";

import imageHammer from "/assets/bonus/hammer.png";
import imageTiki from "/assets/bonus/tiki.png";
import imageWave from "/assets/bonus/wave.png";

const handleClick = () => {
  console.log("Ready to be binded");
};

export const GameBonus = () => {
  return (
    <div className="grid grid-cols-3 gap-12 md:w-1/2 sm:w-2/3 bg-color">
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
