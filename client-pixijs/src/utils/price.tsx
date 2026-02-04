import { ReactNode } from "react";
import { ethers } from "ethers";
import { symbolImages } from "./tokenImages";

export type Prize = {
  full: string;
  formatted_prize: string;
  display: ReactNode;
  withImage: ReactNode | null;
};

export const formatPrize = (
  rawPrize: string | bigint,
  token_symbol: string,
  symbolNode?: ReactNode,
): Prize => {
  const rawEthPrize = ethers.utils.formatEther(rawPrize);
  const truncatedPrize = parseFloat(rawEthPrize).toFixed(2);

  // Check if we have an image for this token
  const tokenImage = symbolImages[token_symbol];

  return {
    full: `${truncatedPrize} ${token_symbol}`,
    formatted_prize: truncatedPrize,
    display: (
      <div className="flex items-center">
        <span>{truncatedPrize}</span>
        {symbolNode ? symbolNode : <span className="ml-1">{token_symbol}</span>}
      </div>
    ),
    withImage: tokenImage ? (
      <div className="flex items-center justify-center">
        <span>{truncatedPrize}</span>
        <img src={tokenImage} alt={token_symbol} className="ml-1 h-8 w-8" />
      </div>
    ) : null,
  };
};
