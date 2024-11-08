import { erc721ABI } from "@/utils/erc721";
import { useAccount, useReadContract } from "@starknet-react/core";
import { BlockTag } from "starknet";
import { Button } from "../elements/button";
import { useNftMint } from "@/hooks/useNftMint";
import { useState, useCallback } from "react";
import { useFirstNft } from "@/hooks/useFirstNft";

const { VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS } = import.meta.env;

const Nfts = ({ address }: { address: string }) => {
  const { account } = useAccount();

  const [isWaitingTx, setIsWaitingTx] = useState(false);
  const {
    mint,
    isPending,
    error: mintError,
    isError: isMintError,
  } = useNftMint();

  useFirstNft(address);

  const handleMint = useCallback(async () => {
    if (account) {
      try {
        setIsWaitingTx(true);
        const tx = await mint();

        await account.waitForTransaction(tx.transaction_hash, {
          retryInterval: 1000,
        });
      } catch (err) {
        console.error("Mint error:", err);
      } finally {
        setIsWaitingTx(false);
      }
    }
  }, [account, mint]);

  const { data, isError, isLoading, error } = useReadContract({
    functionName: "balance_of",
    args: [address],
    abi: erc721ABI,
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    watch: true,
    blockIdentifier: BlockTag.PENDING,
    refetchInterval: 2000,
  });

  // Combined loading state
  const isMinting = isPending || isWaitingTx;

  return (
    <div className="p-4">
      {isLoading && <p className="text-gray-600">Loading...</p>}
      {isError && (
        <p className="text-red-500">
          Error: {error?.message || "Failed to fetch NFT balance"}
        </p>
      )}
      {mintError && (
        <p className="text-red-500">
          Mint Error: {mintError?.message || "Failed to mint"}
        </p>
      )}
      {data !== undefined && (
        <p className="text-lg">NFT Balance: {data.toString()}</p>
      )}
      <Button
        onClick={handleMint}
        disabled={isMinting}
        className={`${isMinting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isMinting
          ? isWaitingTx
            ? "Waiting for confirmation..."
            : "Minting..."
          : `Mint`}
      </Button>
    </div>
  );
};

export default Nfts;
