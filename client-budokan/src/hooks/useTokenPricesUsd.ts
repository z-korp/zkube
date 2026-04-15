import { useEffect, useState } from "react";
import { getSwapQuote } from "@/api/ekubo";

/**
 * USD price (per 1 token) for STRK and LORDS, quoted against USDC on Ekubo
 * mainnet pools. Fetched once on mount; not reactive. The portfolio total on
 * the Profile page needs fresh values at view-time, so re-running the hook on
 * navigation is enough.
 *
 * Pattern lifted from death-mountain `Statistics.tsx:fetchStrkPrice`: ask for
 * a quote on 100 tokens in → divide the USDC total by 100.
 */

const STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const LORDS = "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49";
const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";

// 100 tokens (18 decimals) → quote 100 STRK/LORDS → USDC (6 decimals)
const QUOTE_AMOUNT_IN = BigInt(100) * BigInt(1e18);

const quoteToUsd = async (tokenIn: string): Promise<number | null> => {
  try {
    const quote = await getSwapQuote(QUOTE_AMOUNT_IN, tokenIn, USDC);
    if (!quote.total) return null;
    // USDC has 6 decimals; we quoted 100 tokens, so divide again by 100.
    return quote.total / 1e6 / 100;
  } catch (err) {
    console.error("[useTokenPricesUsd] quote failed", tokenIn, err);
    return null;
  }
};

export interface TokenPricesUsd {
  strk: number | null;
  lords: number | null;
  isLoading: boolean;
}

export const useTokenPricesUsd = (): TokenPricesUsd => {
  const [strk, setStrk] = useState<number | null>(null);
  const [lords, setLords] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [strkPrice, lordsPrice] = await Promise.all([
        quoteToUsd(STRK),
        quoteToUsd(LORDS),
      ]);
      if (cancelled) return;
      setStrk(strkPrice);
      setLords(lordsPrice);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { strk, lords, isLoading };
};
