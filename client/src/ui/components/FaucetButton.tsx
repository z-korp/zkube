import { useState } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import { Button } from "@/ui/elements/button";
import { faucetAbi } from "@/utils/faucet";
import { CallData } from "starknet";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

export const FaucetButton = () => {
  const { account } = useAccount();

  const { contract } = useContract({
    abi: faucetAbi,
    address: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  });

  const [isPending, setIsPending] = useState(false);

  const handleFaucetClaim = async () => {
    if (!contract || !account) return;

    setIsPending(true);
    try {
      const transaction = await account.execute(
        {
          contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
          entrypoint: "faucet",
          calldata: CallData.compile({}),
        },
        { maxFee: 1e16 },
      );

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

  return (
    <Button
      variant="outline"
      onClick={handleFaucetClaim}
      disabled={isPending || !account}
      className="h-[36px] w-full"
    >
      {isPending ? "Claiming..." : "Claim LORDS Faucet"}
    </Button>
  );
};
