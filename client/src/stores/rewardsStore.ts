import { create } from "zustand";
import { useEffect } from "react";
import { Participation } from "@/dojo/game/models/participation";
import { Tournament } from "@/dojo/game/models/tournament";
import { Mode } from "@/dojo/game/types/mode";
import { formatPrize } from "@/utils/wei";
import { useAllChests } from "@/hooks/useAllChests";
import { useParticipations } from "@/hooks/useParticipations";
import { useWonTournaments } from "@/hooks/useWonTournaments";
import useAccountCustom from "@/hooks/useAccountCustom";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

interface ParticipationWithPrize extends Participation {
  raw_prize: bigint;
  formatted_prize: string;
  formatted_user_prize: string;
}

export type TournamentReward = {
  player_id: string;
  rank: 1 | 2 | 3;
  prize: string;
  tournament_id: number;
  mode: Mode;
  tournament: Tournament;
};

interface RewardsState {
  rewardsCount: number;
  tournamentRewards: TournamentReward[];
  filteredParticipations: ParticipationWithPrize[];
  setRewardsCount: (count: number) => void;
  setTournamentRewards: (rewards: TournamentReward[]) => void;
  setFilteredParticipations: (participations: ParticipationWithPrize[]) => void;
}

export const useRewardsStore = create<RewardsState>((set) => ({
  rewardsCount: 0,
  tournamentRewards: [],
  filteredParticipations: [],
  setRewardsCount: (count) => set({ rewardsCount: count }),
  setTournamentRewards: (rewards) => set({ tournamentRewards: rewards }),
  setFilteredParticipations: (participations) =>
    set({ filteredParticipations: participations }),
}));

// Custom hook to manage rewards calculations
export const useRewardsCalculator = () => {
  const { account } = useAccountCustom();
  const chests = useAllChests();
  const participations = useParticipations({ player_id: account?.address });
  const tournaments = useWonTournaments({ player_id: account?.address });
  const { setRewardsCount, setTournamentRewards, setFilteredParticipations } =
    useRewardsStore();

  useEffect(() => {
    const calculateRewards = () => {
      if (!account?.address) return;

      // Calculate filteredParticipations
      const calculatedFilteredParticipations = participations
        .filter((participation) => {
          const chest = chests.find(
            (chest) => chest.id === participation.chest_id,
          );
          return chest?.isCompleted() && !participation.claimed;
        })
        .map((participation) => {
          const chest = chests.find(
            (chest) => chest.id === participation.chest_id,
          );

          if (!chest)
            return {
              ...participation,
              raw_prize: 0n,
              formatted_prize: "",
              formatted_user_prize: "",
            };

          const rawPrize = BigInt(chest.prize);
          const totalPoints = BigInt(chest?.point_target);

          return {
            ...participation,
            raw_prize: rawPrize,
            formatted_prize: formatPrize(
              rawPrize,
              VITE_PUBLIC_GAME_TOKEN_SYMBOL,
            ),
            formatted_user_prize: formatPrize(
              (rawPrize * BigInt(participation.points)) / totalPoints,
              VITE_PUBLIC_GAME_TOKEN_SYMBOL,
            ),
          };
        });

      // Calculate tournamentRewards
      const calculatedTournamentRewards: TournamentReward[] = [];
      const player_id = BigInt(account.address).toString(16);

      tournaments.forEach((tournament) => {
        if (!tournament.isOver()) return;

        if (
          tournament.top1_player_id.toString(16) === player_id &&
          !tournament.top1_claimed &&
          tournament.top1_prize !== 0n
        ) {
          calculatedTournamentRewards.push({
            player_id: account.address,
            rank: 1,
            prize: formatPrize(
              tournament.top1_prize,
              VITE_PUBLIC_GAME_TOKEN_SYMBOL,
            ),
            tournament_id: tournament.id,
            mode: tournament.mode,
            tournament,
          });
        }
        if (
          tournament.top2_player_id.toString(16) === player_id &&
          !tournament.top2_claimed &&
          tournament.top2_prize !== 0n
        ) {
          calculatedTournamentRewards.push({
            player_id: account.address,
            rank: 2,
            prize: formatPrize(
              tournament.top2_prize,
              VITE_PUBLIC_GAME_TOKEN_SYMBOL,
            ),
            tournament_id: tournament.id,
            mode: tournament.mode,
            tournament,
          });
        }
        if (
          tournament.top3_player_id.toString(16) === player_id &&
          !tournament.top3_claimed &&
          tournament.top3_prize !== 0n
        ) {
          calculatedTournamentRewards.push({
            player_id: account.address,
            rank: 3,
            prize: formatPrize(
              tournament.top3_prize,
              VITE_PUBLIC_GAME_TOKEN_SYMBOL,
            ),
            tournament_id: tournament.id,
            mode: tournament.mode,
            tournament,
          });
        }
      });

      // Update the store
      setFilteredParticipations(calculatedFilteredParticipations);
      setTournamentRewards(calculatedTournamentRewards);
      setRewardsCount(
        calculatedFilteredParticipations.length +
          calculatedTournamentRewards.length,
      );
    };

    calculateRewards();
  }, [
    account?.address,
    chests,
    participations,
    tournaments,
    setFilteredParticipations,
    setTournamentRewards,
    setRewardsCount,
  ]);
};
