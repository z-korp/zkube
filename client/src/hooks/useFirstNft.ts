import { useReadContract } from "@starknet-react/core";
import { erc721ABI } from "@/utils/erc721";

const { VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS } = import.meta.env;

export const useFirstNft = (address: string) => {
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useReadContract({
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    abi: erc721ABI,
    functionName: "balance_of",
    args: [address],
    watch: true,
  });

  const balanceNumber = balance ? Number(balance.toString()) : 0;

  const {
    data: tokenId,
    isLoading: isTokenLoading,
    error: tokenError,
  } = useReadContract({
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    abi: erc721ABI,
    functionName: "token_of_owner_by_index",
    args: [address, 0],
    watch: true,
    enabled: balanceNumber > 0,
  });

  console.log("tokenId", tokenId);

  return {
    tokenId: tokenId ? BigInt(tokenId.toString()) : null,
    isLoading: isBalanceLoading || isTokenLoading,
    error: balanceError || tokenError,
    balance: balance ? BigInt(balance.toString()) : 0n,
  };
};
