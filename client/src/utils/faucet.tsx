import { Account, CallData, uint256 } from "starknet";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

export const FAUCET_AMOUNT = uint256.bnToUint256(1000n * 10n ** 18n);
export const FAUCET_COOLDOWN = 86400; // 24 hours in seconds

export const createFaucetClaimHandler = (
  account: Account | undefined,
  setIsPending: (isPending: boolean) => void,
) => {
  return async () => {
    if (!account) {
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
