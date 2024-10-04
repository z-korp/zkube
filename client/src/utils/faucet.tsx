import { Abi, Contract, uint256 } from "starknet";

export const faucetAbi = [
  {
    members: [
      {
        name: "low",
        offset: 0,
        type: "felt",
      },
      {
        name: "high",
        offset: 1,
        type: "felt",
      },
    ],
    name: "Uint256",
    size: 2,
    type: "struct",
  },
  {
    inputs: [],
    name: "constructor",
    outputs: [],
    type: "constructor",
  },
  {
    inputs: [
      {
        name: "value",
        type: "Uint256",
      },
    ],
    name: "burn",
    outputs: [],
    type: "function",
  },
  {
    inputs: [
      {
        name: "recipient",
        type: "felt",
      },
      {
        name: "amount",
        type: "Uint256",
      },
    ],
    name: "mint",
    outputs: [],
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    type: "function",
  },
] satisfies Abi;

export const FAUCET_AMOUNT = uint256.bnToUint256(1000n * 10n ** 18n);
export const FAUCET_COOLDOWN = 86400; // 24 hours in seconds

export async function claimFromFaucet(contract: Contract) {
  try {
    console.log("qqqqqq");
    await contract.faucet();
    return { success: true, message: "Successfully claimed from faucet" };
  } catch (error: any) {
    console.log("Failed to claim from faucet: " + error.message);
    return {
      success: false,
      message: "Failed to claim from faucet: " + error.message,
    };
  }
}

export async function getLastFaucetClaim(
  contract: Contract,
  address: string,
): Promise<number> {
  try {
    const result = await contract.last_faucet_claim(address);
    return Number(result);
  } catch (error) {
    console.error("Failed to get last faucet claim:", error);
    return 0;
  }
}

export function canClaimFromFaucet(lastClaimTime: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= lastClaimTime + FAUCET_COOLDOWN;
}

export function getTimeUntilNextClaim(lastClaimTime: number): number {
  const currentTime = Math.floor(Date.now() / 1000);
  const nextClaimTime = lastClaimTime + FAUCET_COOLDOWN;
  return Math.max(0, nextClaimTime - currentTime);
}
