import React, { useCallback, useState } from "react";
import { AlertCircle, Check, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../elements/card";
import { Button } from "../elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";

const Airdrop = () => {
  const { account } = useAccountCustom();
  const [claimStatus, setClaimStatus] = useState({
    claimed: false,
    amountClaimed: "0",
    transferredToController: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const mockUserData = {
    claimable: true,
    amount: "9",
    collections: [
      {
        name: "ZKube Collection",
        amount: 5,
      },
      {
        name: "Flippy Collection",
        amount: 3,
      },
      {
        name: "Early Adopter Collection",
        amount: 1,
      },
    ],
  };

  const handleClaim = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setClaimStatus((prev) => ({
        ...prev,
        claimed: true,
        amountClaimed: mockUserData.amount,
      }));
    } catch (error) {
      console.error("Error claiming:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!mockUserData.claimable) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-gray-900/50">
        <CardContent className="text-center p-6">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-300">
            You are not eligible for the ZKube airdrop.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      <Card className="bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            ZKube Airdrop Claim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-800/50 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Claimable Amount</span>
              <span className="text-white font-bold">
                {mockUserData.amount} ZKUBE
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-400">Eligible for:</span>
              {mockUserData.collections.map((collection, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span className="text-sm text-gray-300">
                    {collection.name}: {collection.amount} points
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-4">
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-500">
                  <Check size={20} />
                  <span>
                    Successfully claimed {claimStatus.amountClaimed} ZKUBE
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Airdrop;
