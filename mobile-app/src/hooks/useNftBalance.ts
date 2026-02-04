import { useReadContract } from "@starknet-react/core";
import { erc721ABI } from "@/utils/erc721";
import { BlockTag } from "starknet";

const { VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS } = import.meta.env;

export const useNftBalance = (address: string) => {
  const {
    refetch,
    data: balance,
    isLoading,
    isError,
    error,
  } = useReadContract({
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    abi: erc721ABI,
    functionName: "balance_of",
    args: [address],
    watch: true,
    refetchInterval: 2000,
    blockIdentifier: BlockTag.PENDING,
  });

  return {
    refetch,
    isLoading,
    isError,
    error,
    balance: balance ? BigInt(balance.toString()) : 0n,
  };
};
