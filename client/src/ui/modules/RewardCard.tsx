import React from "react";
import { motion } from "framer-motion";
import { Chest } from "@/dojo/game/models/chest";
import { Button } from "../elements/button";

export const RewardCard: React.FC<{
  type: "chest" | "tournament";
  chest?: Chest;
  amount: string;
  userContribution: number;
  userPrizeShare: bigint;
  onClaim: () => void;
}> = ({ type, chest, amount, userContribution, onClaim }) => {
  const rewardTitle = type === "chest" ? "Treasure Chest" : "Tournament Reward";

  return (
    <div className="w-full p-4 relative border rounded-lg text-white">
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

          <div>
            <p className="mb-2">
              Congrats! A {amount} chest opened collectively.
            </p>
            <p className="mb-2">
              Your contribution: {userContribution.toLocaleString()} /{" "}
              {chest?.point_target} points
            </p>
            <p className="font-semibold">Your reward: {amount}</p>
          </div>
        </motion.div>

        <div className="absolute bottom-4 right-4">
          <Button onClick={onClaim}>Claim Reward</Button>
        </div>
      </div>
    </div>
  );
};

export default RewardCard;
