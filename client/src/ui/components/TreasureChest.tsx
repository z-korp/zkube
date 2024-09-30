import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { Progress } from "../elements/progress";
import { ScrollArea, ScrollBar } from "../elements/scroll-area";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useAllChests } from "@/hooks/useAllChests";
import { Chest } from "@/dojo/game/models/chest";
import { useParticipations } from "@/hooks/useParticipations";
import useAccountCustom from "@/hooks/useAccountCustom";
import { ethers } from "ethers";
import { useChestContribution } from "@/hooks/useChestContribution";

interface ChestIconProps {
  chest: Chest;
  isActive: boolean;
  onClick: (chest: Chest) => void;
}

const ChestIcon: React.FC<ChestIconProps> = ({ chest, isActive, onClick }) => {
  const isCompleted = chest.isCompleted();
  const baseClasses =
    "w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg overflow-hidden";
  const activeClasses = isActive ? "" : "";
  const stateClasses = isActive
    ? "ring-2 ring-yellow-300"
    : isCompleted
      ? "ring-2 ring-gray-800"
      : "";
  const isCurrentChest = chest.points !== 0;

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${activeClasses} ${!isCurrentChest && "grayscale"} relative`}
      onClick={() => onClick(chest)}
    >
      <img
        src={chest.getIcon()}
        alt={`${chest.id} Chest`}
        className="w-[26px]"
      />
      {isCompleted && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-800 rounded-full p-1">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

interface CollectiveTreasureChestProps {
  isOpen: boolean;
  onClose: () => void;
}

const CollectiveTreasureChest: React.FC<CollectiveTreasureChestProps> = ({
  isOpen,
  onClose,
}) => {
  const { account } = useAccountCustom();
  const chests = useAllChests();
  const participations = useParticipations({ player_id: account?.address });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedChest, setSelectedChest] = useState<Chest | null>(null);
  const [currentChestIndex, setCurrentChestIndex] = useState(0);

  const currentChest = chests[currentChestIndex];

  const {
    userContribution,
    collectiveProgress,
    userParticipationPercentage,
    userPrizeShare,
  } = useChestContribution(
    currentChest,
    participations,
    account?.address || "",
  );

  const handleChestClick = (chest: Chest) => {
    setSelectedChest(chest);
  };

  const handlePrevious = () => {
    setCurrentChestIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentChestIndex((prev) => Math.min(chests.length - 1, prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[800px] h-[700px] flex flex-col mx-auto justify-start"
        aria-describedby={undefined}
      >
        <DialogTitle className="h-0" />

        <div className="flex-1 flex flex-col px-6 ">
          {/* Top Section */}
          <div className="text-center mb-6 flex flex-col relative">
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 transition-transform duration-300 ease-in-out hover:scale-150 rounded-full p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentChestIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-transform duration-300 ease-in-out hover:scale-150 rounded-full p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentChestIndex === chests.length - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <img
              className="self-center h-[180px]"
              src={currentChest.getIcon()}
            />
            <p className="text-lg font-semibold mt-2">
              Total Prize: {ethers.utils.formatEther(currentChest.prize)} ETH
            </p>
          </div>

          {/* Middle Section */}
          <div>
            <div className="relative mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Collective Progress
              </h3>
              <Progress
                value={collectiveProgress}
                className="w-full h-6 mt-6"
              />
              <div className="absolute inset-0 flex justify-center items-center">
                <span className="text-sm font-bold text-white">
                  {currentChest.points.toLocaleString()} /{" "}
                  {currentChest.point_target.toLocaleString()} points (
                  {collectiveProgress.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold">Your Contribution</h3>
            <div className="text-sm text-center">
              <p>
                Your participation: {userContribution} points -{" "}
                {userParticipationPercentage.toFixed(2)}%
              </p>
              <p>
                Your ETH share: {ethers.utils.formatEther(userPrizeShare)} ETH
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Chest Timeline</h3>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex p-4 justify-between">
                {chests.map((chest) => (
                  <div
                    key={chest.id}
                    className="flex flex-col items-center mr-4 last:mr-0"
                  >
                    <ChestIcon
                      chest={chest}
                      isActive={chest.id === currentChest.id}
                      onClick={handleChestClick}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Leaderboard Toggle */}
          {/*<button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
          </button>*/}

          {/* Leaderboard Panel */}
          {showLeaderboard && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="text-lg font-semibold mb-2">Top Contributors</h3>
              {/* Add your leaderboard content here */}
              <p>Leaderboard content goes here...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollectiveTreasureChest;
