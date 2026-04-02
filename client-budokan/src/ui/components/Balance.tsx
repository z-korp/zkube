import { useLerpNumber } from "@/hooks/useLerpNumber";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { symbolImages } from "@/utils/tokenImages";
import { useEffect, useMemo } from "react";
import { useMediaQuery } from "react-responsive";

interface BalanceProps {
  address: string;
  token_address: `0x${string}`;
  symbol?: string;
}

const FixedWidthDigit: React.FC<{ value: string }> = ({ value }) =>
  value === "." ? (
    <span>.</span>
  ) : (
    <span className="inline-block text-center w-[6px] md:w-[8px]">{value}</span>
  );

const Balance = ({ address, token_address, symbol = "ETH" }: BalanceProps) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const { balance: rawBalance, isLoading } = useTokenBalance(token_address, address);

  const targetBalance = useMemo(() => {
    if (rawBalance === 0n && isLoading) return undefined;
    return parseFloat(
      formatUnits(rawBalance, 18, symbol === "ETH" ? 6 : 2)
    );
  }, [rawBalance, isLoading, symbol]);

  const isError = false;
  const data = rawBalance;

  const decimalNumber = useMemo(() => {
    return symbol === "ETH" ? 6 : 2;
  }, [symbol]);

  const displayBalance = useLerpNumber(targetBalance, {
    decimals: decimalNumber,
    integer: false,
  });

  useEffect(() => {
    if (isError) {
      console.error("Error fetching balance", error);
    }
  }, [isError, error]);

  const symbolImage = symbolImages[symbol];

  if (isError || !data) {
    return (
      <div className="text-xs font-semibold md:font-normal flex items-center bg-secondary">
        0
        {symbolImage ? (
          <img src={symbolImage} alt={symbol} className="ml-1 h-8 w-8" />
        ) : (
          <span className="ml-1">{symbol}</span>
        )}
      </div>
    );
  }

  if (displayBalance == undefined) {
    return (
      <div className="min-w-[100px] min-h-[20px] bg-secondary">
        Calculating...
      </div>
    );
  }

  // Format the balance string
  const balanceString = displayBalance
    .toFixed(decimalNumber)
    .toString()
    .split(".")
    .map((part, index) =>
      index === 1 ? part.slice(0, isMdOrLarger ? 5 : 3) : part
    )
    .join(".");

  // Split the balance string into characters
  const balanceChars = balanceString.split("");

  return (
    <div className="text-xs font-semibold md:font-normal flex items-center bg-secondary">
      {balanceChars.map((char, index) => (
        <FixedWidthDigit key={index} value={char} />
      ))}{" "}
      {symbolImage ? (
        <img src={symbolImage} alt={symbol} className="ml-2 h-8 w-8" />
      ) : (
        <span className="ml-1">{symbol}</span>
      )}
    </div>
  );
};

export default Balance;

function formatUnits(
  value: bigint,
  decimals: number,
  displayDecimals: number = decimals
) {
  let display = value.toString();

  const negative = display.startsWith("-");
  if (negative) display = display.slice(1);

  display = display.padStart(decimals, "0");

  const integer = display.slice(0, display.length - decimals);

  // Trim the fraction to the desired number of decimal places
  // And remove trailing zeros
  const fraction = display
    .slice(display.length - decimals)
    .slice(0, displayDecimals)
    .replace(/(0+)$/, "");

  return `${negative ? "-" : ""}${integer || "0"}${
    fraction ? `.${fraction}` : ""
  }`;
}
