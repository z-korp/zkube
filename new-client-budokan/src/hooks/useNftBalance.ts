import { useTokenBalance } from "./useTokenBalance";

const { VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS } = import.meta.env;

export const useNftBalance = (address: string) => {
  const { balance, isLoading } = useTokenBalance(
    VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    address
  );

  return {
    refetch: () => {},
    isLoading,
    isError: false,
    error: null,
    balance,
  };
};
