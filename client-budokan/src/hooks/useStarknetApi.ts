import { useAccount } from "@starknet-react/core";
import { hexToAscii } from "@dojoengine/utils";
import { num } from "starknet";

type TokenLike = {
  address: string;
  symbol?: string;
  decimals?: number;
  [key: string]: unknown;
};

const hexToBigInt = (hex?: string): bigint => {
  if (!hex) return 0n;
  try {
    return BigInt(hex);
  } catch {
    // Allow parsing without 0x prefix
    return BigInt(`0x${hex}`);
  }
};

const parseU256 = (result?: string[]): bigint => {
  if (!result || result.length === 0) return 0n;
  if (result.length === 1) return hexToBigInt(result[0]);
  // Expect [low, high]
  const low = hexToBigInt(result[0]);
  const high = hexToBigInt(result[1]);
  return (high << 128n) + low;
};

export const useStarknetApi = () => {
  const { address } = useAccount();

  const rpcUrl = import.meta.env.VITE_PUBLIC_NODE_URL as string;
  const denshokanAddress = import.meta.env.VITE_PUBLIC_DENSHOKAN as string;

  const getTokenBalances = async (tokens: TokenLike[]) => {
    if (!Array.isArray(tokens) || tokens.length === 0)
      return [] as { token: TokenLike; balance: bigint }[];

    if (!address) {
      return tokens.map((t) => ({ token: t, balance: 0n }));
    }

    const calls = tokens.map((token, i) => ({
      id: i + 1,
      jsonrpc: "2.0",
      method: "starknet_call",
      params: [
        {
          contract_address: token.address,
          // balance_of selector
          entry_point_selector:
            "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e",
          calldata: [address],
        },
        "latest",
      ],
    }));

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calls),
    });

    const data: Array<{ id: number; result?: string[] }> = await response.json();

    return tokens.map((token, idx) => {
      const res = data?.[idx]?.result as string[] | undefined;
      const balance = parseU256(res);
      return { token, balance };
    });
  };

  const getTokenMetadata = async (tokenId: bigint | number | string) => {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            jsonrpc: "2.0",
            method: "starknet_call",
            params: [
              {
                contract_address: denshokanAddress,
                // metadata_by_id (example selector)
                entry_point_selector:
                  "0x20d82cc6889093dce20d92fc9daeda4498c9b99ae798fc2a6f4757e38fb1729",
                calldata: [num.toHex(tokenId)],
              },
              "latest",
            ],
            id: 0,
          },
          {
            jsonrpc: "2.0",
            method: "starknet_call",
            params: [
              {
                contract_address: denshokanAddress,
                // name_by_id (example selector)
                entry_point_selector:
                  "0x170ac5a9fd747db6517bea85af33fcc77a61d4442c966b646a41fdf9ecca233",
                calldata: [num.toHex(tokenId)],
              },
              "latest",
            ],
            id: 1,
          },
        ]),
      });

      const data: Array<{ id: number; result?: string[] }> = await response.json();
      if (!data?.[0]?.result) return null;

      const r0 = data[0].result!;
      const r1 = data[1]?.result ?? [];

      const mintedAtMs = parseInt(r0[1] ?? "0x0", 16) * 1000;
      const settingsId = parseInt(r0[2] ?? "0x0");
      const expiresAtMs = parseInt(r0[3] ?? "0x0", 16) * 1000;
      const availableAtMs = parseInt(r0[4] ?? "0x0", 16) * 1000;
      const mintedBy = r0[5];

      const tokenMetadata = {
        id: tokenId,
        tokenId,
        playerName: r1?.[0] ? hexToAscii(r1[0]) : "",
        mintedAt: mintedAtMs,
        settingsId,
        expires_at: expiresAtMs,
        available_at: availableAtMs,
        minted_by: mintedBy,
      } as const;

      return tokenMetadata;
    } catch (error) {
      console.log("error", error);
    }

    return null;
  };

  return {
    getTokenBalances,
    getTokenMetadata,
  };
};

