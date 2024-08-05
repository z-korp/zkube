import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../elements/button"; // Assurez-vous d'avoir le bon chemin pour l'importation

interface BonusButtonProps {
  onClick?: () => void;
  urlImage: string;
}

const BonusButton: React.FC<BonusButtonProps> = ({ onClick, urlImage }) => {
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
    >
      <Button
        variant="outline"
        size="icon"
        className="md:p-2 sm:p-1 p-1"
        onClick={handleClick}
        disabled={false}
      >
        <img src={urlImage} alt={altText} />
      </Button>
    </motion.div>
  );
};

export default BonusButton;
