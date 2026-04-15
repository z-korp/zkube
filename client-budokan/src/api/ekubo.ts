/**
 * Thin wrapper around Ekubo's mainnet quoter API. Used to derive USD
 * prices for display (portfolio estimation, price indicators).
 *
 * Source pattern: death-mountain `client/src/api/ekubo.ts`.
 */

const MAINNET_CHAIN_ID = "23448594291968334";
const QUOTER_BASE = `https://prod-api-quoter.ekubo.org/${MAINNET_CHAIN_ID}`;

interface SwapQuoteResponse {
  price_impact?: number;
  total_calculated?: string | number;
  splits?: unknown[];
}

export interface SwapQuote {
  impact: number;
  total: number; // tokenOut units (raw, still needs decimal-scaling)
}

/**
 * Ekubo quoter. `amount` convention:
 * - positive → exact-in (sell `amount` of tokenIn, quote how much tokenOut you get)
 * - negative → exact-out (buy `|amount|` of tokenOut, quote how much tokenIn you pay)
 */
export const getSwapQuote = async (
  amount: number | string | bigint,
  tokenIn: string,
  tokenOut: string,
): Promise<SwapQuote> => {
  const normalized = typeof amount === "bigint" ? amount.toString() : String(amount);
  const response = await fetch(`${QUOTER_BASE}/${normalized}/${tokenIn}/${tokenOut}`);
  const data: SwapQuoteResponse = await response.json();
  return {
    impact: data.price_impact ?? 0,
    total: Number(data.total_calculated ?? 0),
  };
};
