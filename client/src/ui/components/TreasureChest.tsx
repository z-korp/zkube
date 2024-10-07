import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { Progress } from "../elements/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAllChests } from "@/hooks/useAllChests";
import { Chest } from "@/dojo/game/models/chest";
import { useParticipations } from "@/hooks/useParticipations";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useChestContribution } from "@/hooks/useChestContribution";
import ChestTimeline from "./ChestTimeline";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { formatPrize } from "@/utils/wei";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

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

  // Find the index of the first incomplete chest
  const initialChestIndex = chests.findIndex(
    (chest) => chest.points < chest.point_target,
  );
  const [currentChestIndex, setCurrentChestIndex] = useState(
    initialChestIndex !== -1 ? initialChestIndex : 0,
  );

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
        className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start"
        aria-describedby={undefined}
      >
        <DialogTitle>
          <VisuallyHidden.Root>Collective Treasure Chest</VisuallyHidden.Root>
        </DialogTitle>
        <div className="flex-1 flex flex-col">
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
              className={`self-center h-[180px] ${currentChest.points === 0 && "grayscale"}`}
              src={currentChest.getIcon()}
            />
            <p className="text-lg font-semibold mt-2">
              {`Total Prize: ${formatPrize(currentChest.prize, VITE_PUBLIC_GAME_TOKEN_SYMBOL)}`}
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
                  {`${currentChest.points.toLocaleString()} / ${currentChest.point_target.toLocaleString()} points (${collectiveProgress.toFixed(1)}%)`}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold">Your Impact</h3>
            <div className="text-sm text-center">
              <p>
                {`You've contributed ${userContribution.toLocaleString()} points`}
              </p>
              <p>
                {`That's ${userParticipationPercentage.toFixed(2)}% of the total effort!`}
              </p>
              <p>{`Potential reward: ${formatPrize(userPrizeShare, VITE_PUBLIC_GAME_TOKEN_SYMBOL)}`}</p>
            </div>
          </div>

          {/* Bottom Section */}
          <ChestTimeline
            chests={chests}
            currentChestIndex={currentChestIndex}
            setCurrentChestIndex={setCurrentChestIndex}
          />

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
