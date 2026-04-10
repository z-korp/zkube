import { ReactNode } from "react";
import { symbolImages } from "./tokenImages";
import { formatUsdcAmount } from "./payment";

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
  const normalizedSymbol = token_symbol.toUpperCase() === "ETH" ? "USDC" : token_symbol;
  const truncatedPrize =
    normalizedSymbol.toUpperCase() === "USDC"
      ? formatUsdcAmount(rawPrize)
      : Number(rawPrize).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  // Check if we have an image for this token
  const tokenImage = symbolImages[normalizedSymbol];

  return {
    full: `${truncatedPrize} ${normalizedSymbol}`,
    formatted_prize: truncatedPrize,
    display: (
      <div className="flex items-center">
        <span>{truncatedPrize}</span>
        {symbolNode ? symbolNode : <span className="ml-1">{normalizedSymbol}</span>}
      </div>
    ),
    withImage: tokenImage ? (
      <div className="flex items-center justify-center">
        <span>{truncatedPrize}</span>
        <img src={tokenImage} alt={normalizedSymbol} className="ml-1 h-8 w-8" />
      </div>
    ) : null,
  };
};
