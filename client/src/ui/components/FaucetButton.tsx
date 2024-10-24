import { useState } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import { Button } from "@/ui/elements/button";
import { createFaucetClaimHandler, faucetAbi } from "@/utils/faucet";
import { Account } from "starknet";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

export const FaucetButton = () => {
  const { account } = useAccount();

  const { contract } = useContract({
    abi: faucetAbi,
    address: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  });

  const [isPending, setIsPending] = useState(false);

  const handleFaucetClaim = createFaucetClaimHandler(
    account as Account,
    contract,
    setIsPending,
  );

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
