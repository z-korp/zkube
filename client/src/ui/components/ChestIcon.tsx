import React from "react";
import { Chest } from "@/dojo/game/models/chest";
import { Check, Lock } from "lucide-react";

interface ChestIconProps {
  chest: Chest;
  isActive: boolean;
  onClick: (chest: Chest) => void;
}

export const ChestIcon: React.FC<ChestIconProps> = ({
  chest,
  isActive,
  onClick,
}) => {
  const isCompleted = chest.isCompleted();
  const isCurrentChest = chest.points !== 0;

  const baseClasses =
    "w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer shadow-lg overflow-hidden relative";
  const stateClasses = isActive
    ? "ring-2 ring-yellow-300"
    : isCompleted
      ? "ring-2 ring-gray-800"
      : "";

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${!isCurrentChest && "grayscale"}`}
      onClick={() => onClick(chest)}
    >
      <img
        src={chest.getIcon()}
        alt={`${chest.id} Chest`}
        className="w-[26px] transition-opacity duration-300"
        style={{ opacity: isActive ? 1 : 0.7 }}
      />
      {isCompleted && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center transition-opacity duration-300">
          <div className="bg-gray-800 rounded-full p-1">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
      {!isCurrentChest && !isCompleted && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
          <Lock className="w-6 h-6 text-gray-300" />
        </div>
      )}
      <div
        className={`
          absolute inset-0 bg-yellow-100 
          transition-opacity duration-300 
          ${isActive ? "opacity-20" : "opacity-0"}
        `}
      />
    </div>
  );
};
