import React, { useCallback, useState } from "react";
import { AlertCircle, Check, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../elements/card";
import { Button } from "../elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useFreeMint } from "@/hooks/useFreeMint";

const Airdrop = () => {
  const { account } = useAccountCustom();
  const [claimStatus, setClaimStatus] = useState({
    claimed: false,
    amountClaimed: "0",
  });
  const [isLoading, setIsLoading] = useState(false);

  const freeGames = useFreeMint({ player_id: account?.address });

  const handleClaim = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setClaimStatus((prev) => ({
        ...prev,
        claimed: true,
        amountClaimed: freeGames?.number.toString() ?? "0",
      }));
    } catch (error) {
      console.error("Error claiming:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (freeGames && freeGames.number === 0) {
    return (
      <div className="text-center text-sm mt-6 text-gray-300 flex flex-col gap-3 font-semibold md:font-normal">
        <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
        <p>You are not eligible for the ZKube airdrop.</p>
        <p>Keep participating to earn rewards!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-4">
      <Card className="bg-gray-800/50 p-4">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-white">
            ZKube Airdrop
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Claimable Amount</span>
              <span className="text-white font-bold">
                {freeGames?.number} Games
              </span>
            </div>

            {/* <div className="space-y-2">
              <span className="text-sm text-gray-400">Eligible for:</span>
              {mockUserData.collections.map((collection, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span className="text-sm text-gray-300">
                    {collection.name}: {collection.amount} points
                  </span>
                </div>
              ))}
            </div> */}

            {!claimStatus.claimed ? (
              <Button
                className="w-full"
                onClick={handleClaim}
                disabled={isLoading}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Claim Airdrop
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
};

export default Airdrop;
