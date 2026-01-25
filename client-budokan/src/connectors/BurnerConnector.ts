import { Account, RpcProvider } from "starknet";

// Default Katana account from .env.slot
const DEFAULT_KATANA_ADDRESS = "0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819";
const DEFAULT_KATANA_PRIVATE_KEY = "0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4";

export const KATANA_ACCOUNT_ADDRESS = import.meta.env.VITE_PUBLIC_MASTER_ADDRESS || DEFAULT_KATANA_ADDRESS;
export const KATANA_PRIVATE_KEY = import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY || DEFAULT_KATANA_PRIVATE_KEY;

export function createBurnerAccount(rpcUrl: string): Account {
  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  return new Account({
    provider,
    address: KATANA_ACCOUNT_ADDRESS,
    signer: KATANA_PRIVATE_KEY,
  });
}
