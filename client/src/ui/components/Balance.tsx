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

      console.log("formattedBalance", formattedBalance);

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

  if (isLoading) return <div>Loading ...</div>;
  if (isError || !data) return <div>{error?.message}</div>;
  if (displayBalance == undefined) return <div></div>;

  return (
    <div className="text-xs">
      {`${displayBalance
        .toFixed(decimalNumber)
        .toString()
        .split(".")
        .map((part, index) =>
          index === 1 ? part.slice(0, isMdOrLarger ? 5 : 3) : part,
        )
        .join(".")} ${symbol}`}
    </div>
  );
};

export default Balance;

/*
MIT License

Copyright (c) 2023-present weth, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

https://github.com/wevm/viem/blob/main/src/utils/unit/formatUnits.ts
*/

/**
 *  Divides a number by a given exponent of base 10 (10exponent), and formats it into a string representation of the number..
 *
 * - Docs: https://viem.sh/docs/utilities/formatUnits
 *
 * formatUnits(420000000000n, 9)
 * // '420'
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

  // eslint-disable-next-line prefer-const
  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals),
  ];

  // Trim the fraction to the desired number of decimal places
  fraction = fraction.slice(0, displayDecimals);

  // Remove trailing zeros
  fraction = fraction.replace(/(0+)$/, "");

  return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
}
