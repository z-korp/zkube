import { useTokenBalance } from "./useTokenBalance";

const { VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS } = import.meta.env;

export const useZStarBalance = (address: string | undefined) => {
  const { balance, isLoading } = useTokenBalance(
    VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS,
    address
  );

  return {
    refetch: () => {},
    isLoading,
    isError: false,
    error: null,
    balance: Number(balance),
  };
};
