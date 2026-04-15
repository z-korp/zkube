import { useEffect, useState } from "react";

/**
 * Fetch ERC20 balance directly from Starknet mainnet via JSON-RPC.
 * Replaces the previous Torii-backed implementation so wallet balances
 * (STRK, USDC, LORDS, zStar, …) always reflect the controller's real
 * mainnet holdings, regardless of which network the game is deployed on.
 *
 * Pattern lifted from death-mountain (`client/src/api/starknet.ts`):
 * a single `starknet_call` to the token's `balanceOf`, parsing the
 * u256 [low, high] result.
 */

const MAINNET_RPC_URL = "https://api.cartridge.gg/x/starknet/mainnet";

// keccak("balanceOf") truncated — standard Starknet ERC20 selector
const BALANCE_OF_SELECTOR =
  "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e";

const uint256ToBigInt = (low: string, high: string): bigint =>
  (BigInt(high) << 128n) + BigInt(low);

export const useTokenBalance = (
  contractAddress: string | undefined,
  accountAddress: string | undefined,
) => {
  const [balance, setBalance] = useState(0n);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!contractAddress || !accountAddress) {
      setBalance(0n);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const response = await fetch(MAINNET_RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "starknet_call",
            params: [
              {
                contract_address: contractAddress,
                entry_point_selector: BALANCE_OF_SELECTOR,
                calldata: [accountAddress],
              },
              "latest",
            ],
          }),
        });

        const data: { result?: [string, string] } = await response.json();
        if (cancelled) return;

        if (!data.result) {
          setBalance(0n);
        } else {
          const [low, high] = data.result;
          setBalance(uint256ToBigInt(low, high));
        }
      } catch (err) {
        console.error("[useTokenBalance] fetch failed", err);
        if (!cancelled) setBalance(0n);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contractAddress, accountAddress]);

  return { balance, isLoading };
};
