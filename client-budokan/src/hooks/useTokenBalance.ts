import { useEffect, useMemo, useRef, useState } from "react";
import { useDojo } from "@/dojo/useDojo";
import {
  fetchTokenBalances,
  type TokenBalance,
  updateTokenBalance,
} from "@/dojo/torii/tokens";

interface BalanceSubscription {
  cancel: () => void;
}

const getMatchedBalance = (
  balances: TokenBalance[],
  contractAddress: string,
  accountAddress: string
): bigint => {
  const match = balances.find(
    (balance) =>
      BigInt(balance.contract_address) === BigInt(contractAddress) &&
      BigInt(balance.account_address) === BigInt(accountAddress)
  );

  return BigInt(match?.balance ?? "0");
};

export const useTokenBalance = (
  contractAddress: string | undefined,
  accountAddress: string | undefined
) => {
  const {
    setup: { toriiClient },
  } = useDojo();

  const [balance, setBalance] = useState(0n);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<BalanceSubscription | null>(null);

  const currentBalance = useMemo(() => {
    if (!contractAddress || !accountAddress) {
      return 0n;
    }

    return getMatchedBalance(balances, contractAddress, accountAddress);
  }, [balances, contractAddress, accountAddress]);

  useEffect(() => {
    setBalance(currentBalance);
  }, [currentBalance]);

  useEffect(() => {
    if (!toriiClient || !contractAddress || !accountAddress) {
      setBalances([]);
      setBalance(0n);
      setIsLoading(false);
      subscriptionRef.current?.cancel();
      subscriptionRef.current = null;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const init = async () => {
      try {
        const balances = await fetchTokenBalances(
          toriiClient,
          [contractAddress],
          [accountAddress]
        );

        if (cancelled) {
          return;
        }

        setBalances(balances);
        setIsLoading(false);

        const subscription = await toriiClient.onTokenBalanceUpdated(
          [contractAddress],
          [accountAddress],
          [],
          (nextBalance: TokenBalance) => {
            if (cancelled) {
              return;
            }

            setBalances((prevBalances) =>
              updateTokenBalance(prevBalances, nextBalance)
            );
          }
        );

        if (cancelled) {
          subscription.cancel();
          return;
        }

        subscriptionRef.current?.cancel();
        subscriptionRef.current = subscription;
      } catch {
        if (!cancelled) {
          setBalances([]);
          setBalance(0n);
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      subscriptionRef.current?.cancel();
      subscriptionRef.current = null;
    };
  }, [toriiClient, contractAddress, accountAddress]);

  return { balance, isLoading };
};
