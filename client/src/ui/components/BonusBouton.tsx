import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../elements/button";

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
    <motion.button
      initial={{ rotate: 0 }}
      exit={{ rotate: 0 }}
      whileHover={isClicked ? {} : { rotate: [0, -10, 10, -10, 10, 0] }}
      transition={{ duration: 0.5 }}
      disabled={isClicked}
    >
      <Button
        variant="outline"
        size="icon"
        className="md:p-4 sm:p-1 md:border-8 sm:border-4"
        onClick={handleClick}
        disabled={isClicked}
      >
        <img src={urlImage} alt={altText} />
      </Button>
    </motion.button>
  );
};

export default BonusButton;
