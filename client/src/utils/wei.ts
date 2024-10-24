import { ethers } from "ethers";

export const formatPrize = (
  rawPrize: string | bigint,
  token_symbol: string,
): string => {
  const rawEthPrize = ethers.utils.formatEther(rawPrize);
  const truncatedPrize = parseFloat(rawEthPrize).toFixed(2);
  return `${truncatedPrize} ${token_symbol}`;
};
