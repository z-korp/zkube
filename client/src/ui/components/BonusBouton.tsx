import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../elements/button"; // Assurez-vous d'avoir le bon chemin pour l'importation

interface BonusButtonProps {
  onClick?: () => void;
  urlImage: string;
  bonusCount: number;
}

const BonusButton: React.FC<BonusButtonProps> = ({ onClick, urlImage, bonusCount }) => {
  const [isClicked, setIsClicked] = useState(false);

  const altText = "image for bonus";

  const handleClick = () => {
    setIsClicked(true);
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ rotate: 0 }}
      exit={{ rotate: 0 }}
      whileHover={isClicked ? {} : { rotate: [0, -10, 10, -10, 10, 0] }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs sm:text-sm rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center z-10 transform translate-x-1/2 -translate-y-1/2">
        {bonusCount}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="md:p-2 sm:p-1 p-1 border"
        onClick={handleClick}
        disabled={false}
      >
        <img src={urlImage} alt={altText} />
      </Button>
    </motion.div>
  );
};

export default BonusButton;
