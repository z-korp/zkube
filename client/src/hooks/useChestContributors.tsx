import { useState, useEffect } from "react";
import { Chest } from "@/dojo/game/models/chest";
import { Participation } from "@/dojo/game/models/participation";

interface ChestContributorsResult {
  contributorsNumber: number;
  contributors: Participation[];
}

export const useChestContributors = (
  currentChest: Chest,
  participations: Participation[],
  accountAddress: string,
): ChestContributorsResult => {
  const [result, setResult] = useState<ChestContributorsResult>({
    contributorsNumber: 0,
    contributors: [],
  });

  useEffect(() => {
    const contributors = participations.filter(
      (participation) =>
        participation.chest_id === currentChest.id &&
        participation.player_id.toString() !== accountAddress,
    );

    setResult({
      contributorsNumber: contributors.length,
      contributors,
    });
  }, [currentChest, participations, accountAddress]);

  return result;
};
