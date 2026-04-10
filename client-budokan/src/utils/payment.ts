const USDC_DECIMALS = 6;

export const formatUsdcAmount = (
  rawAmount: bigint | number | string | undefined,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string => {
  if (rawAmount === undefined) return "0.00";

  const value = Number(rawAmount);
  if (!Number.isFinite(value)) return "0.00";

  const normalized = value / 10 ** USDC_DECIMALS;
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;

  return normalized.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
};

export const formatUsdcLabel = (
  rawAmount: bigint | number | string | undefined,
): string => `${formatUsdcAmount(rawAmount)} USDC`;
