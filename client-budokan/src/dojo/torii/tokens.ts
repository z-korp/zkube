import type * as torii from "@dojoengine/torii-client";

export interface TokenBalance {
  contract_address: string;
  account_address: string;
  token_id: string;
  balance: string;
}

export async function fetchTokenBalances(
  client: torii.ToriiClient,
  contractAddresses: string[],
  accountAddresses: string[]
): Promise<TokenBalance[]> {
  const result = await client.getTokenBalances({
    contract_addresses: contractAddresses,
    account_addresses: accountAddresses,
    token_ids: [],
    pagination: {
      cursor: undefined,
      direction: "Backward",
      limit: 1000,
      order_by: [],
    },
  });

  return (result.items ?? []) as TokenBalance[];
}

export function updateTokenBalance(
  previousBalances: TokenBalance[],
  newBalance: TokenBalance
): TokenBalance[] {
  if (
    BigInt(newBalance.account_address) === 0n &&
    BigInt(newBalance.contract_address) === 0n
  ) {
    return previousBalances;
  }

  const idx = previousBalances.findIndex(
    (balance) =>
      BigInt(balance.token_id || 0) === BigInt(newBalance.token_id || 0) &&
      BigInt(balance.contract_address) === BigInt(newBalance.contract_address) &&
      BigInt(balance.account_address) === BigInt(newBalance.account_address)
  );

  if (idx === -1) {
    return [...previousBalances, newBalance];
  }

  return previousBalances.map((balance, index) =>
    index === idx ? newBalance : balance
  );
}
