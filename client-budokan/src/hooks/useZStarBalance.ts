import { useReadContract } from "@starknet-react/core";
import { erc20ABI } from "@/utils/erc20";
import { BlockTag } from "starknet";

const { VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS } = import.meta.env;

export const useZStarBalance = (address: string | undefined) => {
  const {
    refetch,
    data: balance,
    isLoading,
    isError,
    error,
  } = useReadContract({
    address: VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS,
    abi: erc20ABI,
    functionName: "balance_of",
    args: address ? [address] : undefined,
    watch: true,
    refetchInterval: 5000,
    blockIdentifier: BlockTag.PENDING,
  });

  return {
    refetch,
    isLoading,
    isError,
    error,
    balance: balance ? Number(BigInt(balance.toString())) : 0,
  };
};
