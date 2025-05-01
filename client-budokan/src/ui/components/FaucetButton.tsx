import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Button } from "@/ui/elements/button";
import { createFaucetClaimHandler } from "@/utils/faucet";
import { Account } from "starknet";

export const FaucetButton = () => {
  const { account } = useAccount();

  const [isPending, setIsPending] = useState(false);

  const handleFaucetClaim = createFaucetClaimHandler(
    account as Account,
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
