import useAccountCustom from "@/hooks/useAccountCustom";
import { useAllChests } from "@/hooks/useAllChests";
import { useCallback } from "react";
import { RewardCard } from "./RewardCard";
import { Mode } from "@/dojo/game/types/mode";
import { Tournament } from "@/dojo/game/models/tournament";
import { useDojo } from "@/dojo/useDojo";
import { useRewardsStore } from "@/stores/rewardsStore";

export type TournamentReward = {
  player_id: string;
  rank: 1 | 2 | 3;
  prize: string;
  tournament_id: number;
  mode: Mode;
  tournament: Tournament;
};

export const Rewards = () => {
  const {
    setup: {
      systemCalls: { claimTournament, claimChest },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const chests = useAllChests();

  const { tournamentRewards, filteredParticipations } = useRewardsStore();

  const handleClaimChest = useCallback(
    async (chest_id: number) => {
      if (!account?.address) return;
      try {
        await claimChest({ account, chest_id });
      } catch (error) {
        console.error("Error claiming chest:", error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account?.address, claimChest],
  );

  const handleClaimTournament = useCallback(
    async (mode: Mode, tournament_id: number, rank: number) => {
      if (!account?.address) return;
      try {
        await claimTournament({
          account,
          mode: mode.into(),
          tournament_id,
          rank,
        });
        // You might want to add some state update or notification here
      } catch (error) {
        console.error("Error claiming tournament reward:", error);
        // Handle error (e.g., show an error message to the user)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account?.address, claimTournament],
  );

  if (filteredParticipations.length === 0 && tournamentRewards.length === 0) {
    return (
      <div className="text-center text-sm mt-6 text-gray-300 flex flex-col gap-3 font-semibold md:font-normal">
        <p>
          Place in the top 3 of a tournament or help open the collective chest
          to earn rewards.
        </p>
        <p>Keep competing for great rewards!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredParticipations.map((p) => (
        <RewardCard
          key={p.chest_id}
          type="chest"
          amount={p.formatted_user_prize}
          chest={chests.find((chest) => chest.id === p.chest_id)}
          userContribution={p.points}
          onClaim={() => handleClaimChest(p.chest_id)}
        />
      ))}
      {tournamentRewards.map((reward) => (
        <RewardCard
          key={reward.tournament_id + "_" + reward.rank}
          type="tournament"
          amount={reward.prize}
          tournament={reward.tournament}
          tournament_reward={reward}
          onClaim={() =>
            handleClaimTournament(
              reward.mode,
              reward.tournament_id,
              reward.rank,
            )
          }
        />
      ))}
    </div>
  );
};
