import React, { useCallback, useState, forwardRef, useEffect } from "react";
import { AlertCircle, Check, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../elements/card";
import { Button } from "../elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useFreeMint } from "@/hooks/useFreeMint";
import { useDojo } from "@/dojo/useDojo";
import { Account } from "starknet";

interface AirdropProps {
  className?: string;
}

const Airdrop = forwardRef<HTMLDivElement, AirdropProps>((props, ref) => {
  const {
    setup: {
      systemCalls: { claimFreeMint },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const [claimStatus, setClaimStatus] = useState({
    claimed: false,
    amountClaimed: "0",
    showSuccess: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const freeGames = useFreeMint({ player_id: account?.address });

  // Reset claim status after timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (claimStatus.showSuccess) {
      timeoutId = setTimeout(() => {
        setClaimStatus((prev) => ({
          ...prev,
          showSuccess: false,
        }));
      }, 5000); // 5 seconds
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [claimStatus.showSuccess]);

  const handleClaim = useCallback(async () => {
    setIsLoading(true);
    try {
      await claimFreeMint({
        account: account as Account,
      });
      // Needed otherwise the element hide and show again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setClaimStatus((prev) => ({
        ...prev,
        claimed: true,
        showSuccess: true,
        amountClaimed: freeGames?.number.toString() ?? "0",
      }));
    } catch (error) {
      console.error("Error claiming:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account, claimFreeMint, freeGames?.number]);

  if (
    freeGames === null ||
    (freeGames.number === 0 && !claimStatus.showSuccess)
  ) {
    return (
      <div
        ref={ref}
        className="text-center text-sm mt-6 text-gray-300 flex flex-col gap-3 font-semibold md:font-normal"
      >
        <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
        <p>You are not eligible for the zKube airdrop.</p>
        <p>Keep participating to earn rewards!</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col gap-3 pt-4">
      <Card className="bg-gray-800/50 p-4">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-white">
            zKube Airdrop
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Claimable Amount</span>
              <span className="text-white font-bold">
                {freeGames?.number ?? 0} Games
              </span>
            </div>

            {!claimStatus.claimed || !claimStatus.showSuccess ? (
              <Button
                className="w-full"
                onClick={handleClaim}
                disabled={isLoading || claimStatus.claimed}
                isLoading={isLoading}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {claimStatus.claimed ? "Claimed" : "Claim Airdrop"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-500">
                <Check size={20} />
                <span>
                  Successfully claimed {claimStatus.amountClaimed} ZKUBE
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

Airdrop.displayName = "Airdrop";

export default Airdrop;
