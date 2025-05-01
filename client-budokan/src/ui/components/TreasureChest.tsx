import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { Progress } from "../elements/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAllChests } from "@/hooks/useAllChests";
import { useParticipations } from "@/hooks/useParticipations";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useChestContribution } from "@/hooks/useChestContribution";
import ChestTimeline from "./ChestTimeline";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useMediaQuery } from "react-responsive";
import { DialogPrizePoolContributors } from "./DialogPrizePoolContributors";
import { formatPrize } from "@/utils/price";
import AnimatedChest from "./AnimatedChest";

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
  const participations = useParticipations();
  // const [showLeaderboard, setShowLeaderboard] = useState(false);
  // const [selectedChest, setSelectedChest] = useState<Chest | null>(null);
  const isMdOrLarger = useMediaQuery({ minWidth: 768 });

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

  const handlePrevious = () => {
    setCurrentChestIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentChestIndex((prev) => Math.min(chests.length - 1, prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4"
        aria-describedby={undefined}
      >
        <DialogTitle>
          <VisuallyHidden.Root>Collective Treasure Chest</VisuallyHidden.Root>
        </DialogTitle>
        <div className="flex-1 flex flex-col gap-4 font-semibold md:font-normal">
          {/* Top Section */}
          <div className="text-center flex flex-col relative">
            <button
              onClick={handlePrevious}
              className="absolute z-50 left-2 top-1/2 transform -translate-y-1/2 transition-transform duration-300 ease-in-out hover:scale-150 rounded-full p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentChestIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute z-50 right-2 top-1/2 transform -translate-y-1/2 transition-transform duration-300 ease-in-out hover:scale-150 rounded-full p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentChestIndex === chests.length - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <AnimatedChest
              imageSrc={currentChest.getIcon()}
              isGrayscale={currentChest.points === 0}
            />
            <div className="relative flex items-center justify-center gap-2 mt-4 w-full">
              <div className="text-lg font-semibold text-center flex items-center gap-4">
                <span className="text-2xl">Total Prize:</span>
                {
                  formatPrize(currentChest.prize, VITE_PUBLIC_GAME_TOKEN_SYMBOL)
                    .withImage
                }
              </div>
              <div
                className={`absolute transition-transform duration-300 hover:-translate-y-1 ${isMdOrLarger ? "right-20" : "right-0"}`}
              >
                <DialogPrizePoolContributors chest={currentChest} />
              </div>
            </div>
          </div>

          {/* Middle Section */}
          <div>
            <div className="relative">
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

          <div className="">
            <h3 className="text-lg font-semibold">Your Impact</h3>
            <div className="text-sm text-center flex flex-col justify-center">
              <p>
                {`You've contributed ${userContribution.toLocaleString()} points`}
              </p>
              <p className="mt-2">
                {`That's ${userParticipationPercentage.toFixed(2)}% of the total effort!`}
              </p>
              <div className="flex gap-2 mx-auto items-center">
                <p>Potential reward:</p>
                {
                  formatPrize(userPrizeShare, VITE_PUBLIC_GAME_TOKEN_SYMBOL)
                    .withImage
                }
              </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollectiveTreasureChest;
