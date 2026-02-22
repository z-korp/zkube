import React from "react";
import { motion } from "motion/react";
import { Button } from "../elements/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import { BonusType } from "@/dojo/game/types/bonus";

interface BonusButtonProps {
  onClick?: () => void;
  urlImage: string;
  bonusCount: number;
  tooltipText: string; // Ajout d'une nouvelle prop pour le texte du tooltip
  bonusName: BonusType;
  bonus: BonusType;
  disabled?: boolean;
  highlighted?: boolean;
}

const BonusButton: React.FC<BonusButtonProps> = ({
  onClick,
  urlImage,
  bonusCount,
  tooltipText,
  bonusName,
  bonus,
  disabled = false,
  highlighted = false,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const isDisabled = disabled || bonusCount === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ rotate: 0 }}
            exit={{ rotate: 0 }}
            whileHover={isDisabled ? {} : { rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className={`relative ${isDisabled ? "opacity-50" : ""}`}
          >
            <div className={`absolute -top-1 right-2 text-white text-xs sm:text-sm rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center z-10 transform translate-x-1/2 -translate-y-1/2 ${
              isDisabled ? "bg-slate-500" : "bg-yellow-500"
            }`}>
              {bonusCount}
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`p-1 sm:p-1.5 md:p-2 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border ${
                bonus == bonusName ? "bg-yellow-500" : ""
              } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} ${
                highlighted ? "border-4 border-yellow-500" : ""
              }`}
              onClick={handleClick}
              disabled={isDisabled}
            >
              <img 
                src={urlImage} 
                alt="image for bonus" 
                className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isDisabled ? "grayscale" : ""}`} 
              />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-sm">
            <p>{tooltipText}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BonusButton;
