import useAccountCustom from "@/hooks/useAccountCustom";
import { useAllChests } from "@/hooks/useAllChests";
import { useParticipations } from "@/hooks/useParticipations";
import { useMemo } from "react";
import { ethers } from "ethers";
import { RewardCard } from "./RewardCard";

// Assuming VITE_PUBLIC_GAME_TOKEN_SYMBOL is defined in your environment variables
const VITE_PUBLIC_GAME_TOKEN_SYMBOL =
  import.meta.env.VITE_PUBLIC_GAME_TOKEN_SYMBOL || "ETH";

export const Rewards = () => {
  const { account } = useAccountCustom();
  const chests = useAllChests();
  const participations = useParticipations({ player_id: account?.address });

  const filteredParticipations = useMemo(() => {
    if (!account?.address || !participations) return [];
    return participations
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
        const rawPrize = chest ? BigInt(chest.prize) : BigInt(0);

        const formattedPrize = (() => {
          const rawEthPrize = ethers.utils.formatEther(rawPrize);
          const formattedPrize = parseFloat(rawEthPrize).toString();
          return `${formattedPrize} ${VITE_PUBLIC_GAME_TOKEN_SYMBOL}`;
        })();

        return {
          ...participation,
          rawPrize,
          formattedPrize,
        };
      });
  }, [participations, account?.address, chests]);

  return (
    <div>
      {filteredParticipations.map((p) => (
        <RewardCard
          key={p.chest_id}
          type="chest"
          amount={p.formattedPrize}
          chest={chests.find((chest) => chest.id === p.chest_id)}
          userContribution={p.points}
          userPrizeShare={p.rawPrize}
          onClaim={() => {
            return;
          }}
        />
      ))}
    </div>
  );
};
