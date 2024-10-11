import { Abi, Account, CallData, Contract, uint256 } from "starknet";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

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

export const createFaucetClaimHandler = (
  account: Account | undefined,
  contract: Contract | undefined,
  setIsPending: (isPending: boolean) => void,
) => {
  return async () => {
    if (!contract || !account) {
      console.error("Account or contract is undefined");
      return;
    }

    setIsPending(true);
    try {
      const transaction = await account.execute({
        contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
        entrypoint: "faucet",
        calldata: CallData.compile({}),
      });

      await account.waitForTransaction(transaction.transaction_hash, {
        retryInterval: 1000,
      });
      console.log("Successfully claimed from faucet");
    } catch (error) {
      console.error("Error claiming from faucet:", error);
    } finally {
      setIsPending(false);
    }
  };
};
