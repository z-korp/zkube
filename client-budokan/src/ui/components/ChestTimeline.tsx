import React from "react";
import { Chest } from "@/dojo/game/models/chest";
import { ChestIcon } from "./ChestIcon";

interface ChestTimelineProps {
  chests: Chest[];
  currentChestIndex: number;
  setCurrentChestIndex: (index: number) => void;
}

const ChestTimeline: React.FC<ChestTimelineProps> = ({
  chests,
  currentChestIndex,
  setCurrentChestIndex,
}) => {
  // Calculate the number of chests for each row on mobile
  const chestsPerRow = Math.ceil(chests.length / 2);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2">Chest Timeline</h3>

      {/* Mobile view with two rows */}
      <div className="md:hidden">
        <div className="grid grid-cols-5 gap-2 mb-2">
          {chests.slice(0, chestsPerRow).map((chest, index) => (
            <div key={chest.id} className="flex flex-col items-center">
              <ChestIcon
                chest={chest}
                isActive={index === currentChestIndex}
                onClick={() => setCurrentChestIndex(index)}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {chests.slice(chestsPerRow).map((chest, index) => (
            <div key={chest.id} className="flex flex-col items-center ">
              <ChestIcon
                chest={chest}
                isActive={index + chestsPerRow === currentChestIndex}
                onClick={() => setCurrentChestIndex(index + chestsPerRow)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex justify-between w-full space-x-4">
        {chests.map((chest, index) => (
          <div key={chest.id} className="flex flex-col items-center">
            <ChestIcon
              chest={chest}
              isActive={index === currentChestIndex}
              onClick={() => setCurrentChestIndex(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChestTimeline;
