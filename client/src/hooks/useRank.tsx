import { useEffect, useState } from "react";
import { useGamesFromTournament } from "./useGamesFromTournament";

const useRank = ({
  tournamentId,
  gameId,
}: {
  tournamentId: number;
  gameId: string;
}) => {
  const [rank, setRank] = useState(0);
  const [suffix, setSuffix] = useState("th");

  const { games } = useGamesFromTournament({ tournamentId });

  useEffect(() => {
    const playerGameIndex = games.findIndex((game) => game.id === gameId);
    if (playerGameIndex !== -1) {
      const r = playerGameIndex + 1;
      setRank(r);
      setSuffix(getOrdinalSuffix(r));
    }
  }, [games, gameId]);

  function getOrdinalSuffix(rank: number) {
    const j = rank % 10,
      k = rank % 100;

    let suffix = "th"; // Default suffix

    if (j === 1 && k !== 11) {
      suffix = "st";
    } else if (j === 2 && k !== 12) {
      suffix = "nd";
    } else if (j === 3 && k !== 13) {
      suffix = "rd";
    }

    return suffix;
  }

  return { rank, suffix };
};

export default useRank;
