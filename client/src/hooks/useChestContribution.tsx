import { useState, useEffect } from "react";
import { Chest } from "@/dojo/game/models/chest";
import { Participation } from "@/dojo/game/models/participation";

interface ChestContributionResult {
  userContribution: number;
  collectiveProgress: number;
  userParticipationPercentage: number;
  userPrizeShare: bigint;
}

export const useChestContribution = (
  currentChest: Chest,
  participations: Participation[],
  accountAddress: string,
): ChestContributionResult => {
  const [result, setResult] = useState<ChestContributionResult>({
    userContribution: 0,
    collectiveProgress: 0,
    userParticipationPercentage: 0,
    userPrizeShare: BigInt(0),
  });

  useEffect(() => {
    const participation = participations.find(
      (p: Participation) => p.chest_id === currentChest.id,
    );

    if (currentChest.points === 0) {
      setResult({
        userContribution: 0,
        collectiveProgress: 0,
        userParticipationPercentage: 0,
        userPrizeShare: BigInt(0),
      });
      return;
    }

    const userContribution = participation ? participation.points : 0;
    const collectiveProgress =
      (currentChest.points / currentChest.point_target) * 100;
    const userParticipationPercentage =
      (userContribution / currentChest.points) * 100;
    const userPrizeShare =
      (BigInt((userParticipationPercentage * 1_000).toFixed(0)) *
        currentChest.prize) /
      BigInt(100 * 1000);

    setResult({
      userContribution,
      collectiveProgress,
      userParticipationPercentage,
      userPrizeShare,
    });
  }, [currentChest, participations, accountAddress]);

  return result;
};
