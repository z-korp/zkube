import React from "react";
import { motion } from "framer-motion";
import { Chest } from "@/dojo/game/models/chest";
import { Button } from "../elements/button";
import { Tournament } from "@/dojo/game/models/tournament";
import { TournamentReward } from "./Rewards";

import bronze from "/assets/trophies/bronze.png";
import silver from "/assets/trophies/silver.png";
import gold from "/assets/trophies/gold.png";
import { format } from "date-fns";
import { ModeType } from "@/dojo/game/types/mode";
import { useMediaQuery } from "react-responsive";
import { formatPrize, Prize } from "@/utils/price";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

export const RewardCard: React.FC<{
  type: "chest" | "tournament";
  amount: Prize;
  onClaim: () => void;
  // chest
  chest?: Chest;
  userContribution?: number;
  // tournament
  tournament?: Tournament;
  tournament_reward?: TournamentReward;
}> = ({
  type,
  chest,
  tournament,
  amount,
  userContribution,
  onClaim,
  tournament_reward,
}) => {
  const isMdOrLarger = useMediaQuery({ minWidth: 768 });

  const rewardTitle = type === "chest" ? "Treasure Chest" : "Tournament Reward";

  const getTournamentPlaceText = (place: number) => {
    const places = ["1st", "2nd", "3rd"];
    return places[place - 1];
  };

  const getTournamentTrophyImage = (place: number) => {
    const places = [gold, silver, bronze];
    return places[place - 1];
  };

  const formatTournamentDate = (tournament: Tournament) => {
    const startDate = tournament.getStartDate();
    const endDate = tournament.getEndDate();

    if (endDate) {
      // Normal (monthly) tournament
      return `${format(startDate, "MMM d, HH:mm")} - ${format(endDate, "MMM d, HH:mm, yyyy")}`;
    } else {
      // Daily tournament
      return format(startDate, "MMM d, HH:mm, yyyy");
    }
  };

  return (
    <div className="w-full p-4 relative border rounded-lg text-white text-sm md:text-base font-semibold md:font-normal">
      <div className="w-full">
        <motion.div
          className="flex items-start space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {chest && (
            <img
              src={chest.getIcon()}
              alt={rewardTitle}
              className="h-24 object-contain"
            />
          )}
          {tournament && tournament_reward?.rank && (
            <img
              src={getTournamentTrophyImage(tournament_reward?.rank)}
              alt={rewardTitle}
              className="h-24 object-contain my-auto"
            />
          )}
          <div>
            {type === "chest" ? (
              <>
                <p className="mb-2">
                  A{" "}
                  {chest?.prize
                    ? formatPrize(chest?.prize, VITE_PUBLIC_GAME_TOKEN_SYMBOL)
                        .full
                    : ""}{" "}
                  chest opened collectively.
                </p>
                <p className="mb-2">
                  Your contribution: {userContribution?.toLocaleString()} /{" "}
                  {chest?.point_target} points
                </p>
                <div className="font-semibold flex items-center gap-2">
                  <p>Your rewards:</p> {amount.withImage}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2">
                  {`You placed ${tournament_reward?.rank && getTournamentPlaceText(tournament_reward.rank)}
                  in a ${tournament_reward?.mode.value === ModeType.Daily ? "daily" : "monthly"} tournament.`}
                </p>
                <p className="mb-2">
                  Tournament: {tournament && formatTournamentDate(tournament)}
                </p>
                <div className="font-semibold flex items-center gap-2">
                  <p>Your rewards:</p> {tournament_reward?.prize.withImage}
                </div>
              </>
            )}
          </div>
        </motion.div>

        <div className="absolute bottom-4 right-4">
          <Button
            onClick={onClaim}
            className={!isMdOrLarger ? "h-[26px]" : ""}
          >{`Claim ${isMdOrLarger ? "Reward" : ""}`}</Button>
        </div>
      </div>
    </div>
  );
};

export default RewardCard;
