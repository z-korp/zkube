import { useLerpNumber } from "@/hooks/useLerpNumber";
import { erc20ABI } from "@/utils/erc20";
import { useContractRead } from "@starknet-react/core";
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { BlockTag } from "starknet";

interface BalanceProps {
  address: string;
  token_address: string;
  symbol?: string;
}

interface BalanceData {
  balance: {
    low: bigint;
  };
}

const FixedWidthDigit: React.FC<{ value: string }> = ({ value }) =>
  value === "." ? (
    <span>.</span>
  ) : (
    <span className="inline-block text-center w-[6px] md:w-[8px]">{value}</span>
  );

const Balance = ({ address, token_address, symbol = "ETH" }: BalanceProps) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const [targetBalance, setTargetBalance] = useState<number | undefined>(
    undefined,
  );

  // useBalance doesn't work on Katana, don't know why
  const { data, isError, isLoading, error } = useContractRead({
    functionName: "balanceOf",
    args: [address as string],
    abi: erc20ABI,
    address: token_address,
    watch: true,
    blockIdentifier: BlockTag.PENDING,
    refetchInterval: 500,
  });

  useEffect(() => {
    if (data !== undefined) {
      const balanceData = data as BalanceData;
      const formattedBalance = parseFloat(
        formatUnits(balanceData.balance.low, 18, symbol === "ETH" ? 6 : 2),
      );

      setTargetBalance(formattedBalance);
    }
  }, [data, symbol]);

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

  if (isLoading) return <div>Loading ...</div>;
  if (isError || !data) return <div></div>;
  if (displayBalance == undefined) return <div></div>;

  // Format the balance string
  const balanceString = displayBalance
    .toFixed(decimalNumber)
    .toString()
    .split(".")
    .map((part, index) =>
      index === 1 ? part.slice(0, isMdOrLarger ? 5 : 3) : part,
    )
    .join(".");

  // Split the balance string into characters
  const balanceChars = balanceString.split("");

  return (
    <div className="text-xs font-semibold md:font-normal flex items-center">
      {balanceChars.map((char, index) => (
        <FixedWidthDigit key={index} value={char} />
      ))}{" "}
      <span className="ml-1">{symbol}</span>
    </div>
  );
};

export default Balance;

/*
MIT License

[Include the license text here as needed]

*/

function formatUnits(
  value: bigint,
  decimals: number,
  displayDecimals: number = decimals,
) {
  let display = value.toString();

  const negative = display.startsWith("-");
  if (negative) display = display.slice(1);

  display = display.padStart(decimals, "0");

  const integer = display.slice(0, display.length - decimals)

  // Trim the fraction to the desired number of decimal places
  // And remove trailing zeros
  const fraction = display.slice(display.length - decimals).slice(0, displayDecimals).replace(/(0+)$/, "");

  return `${negative ? "-" : ""}${integer || "0"}${
    fraction ? `.${fraction}` : ""
  }`;
}
