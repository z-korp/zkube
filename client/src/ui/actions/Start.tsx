import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Account, BlockTag } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchVrfData } from "@/api/vrf";
import { Mode, ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useSettings } from "@/hooks/useSettings";
import { createFaucetClaimHandler } from "@/utils/faucet";
import { useContract } from "@starknet-react/core";
import { erc20ABI } from "@/utils/erc20";
import { useMediaQuery } from "react-responsive";
import { erc721ABI } from "@/utils/erc721";
import { useNftMint } from "@/hooks/useNftMint";

const {
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
} = import.meta.env;

interface StartProps {
  mode: ModeType;
  handleGameMode: () => void;
}

export const Start: React.FC<StartProps> = ({ mode, handleGameMode }) => {
  const {
    setup: {
      systemCalls: { start },
    },
  } = useDojo();

  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { settings } = useSettings();
  const { contract: erc20Contract } = useContract({
    abi: erc20ABI,
    address: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  });
  const { contract: erc721Contract } = useContract({
    abi: erc721ABI,
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  });

  const { game } = useGame({
    gameId: player?.game_id || "0x0",
    shouldLog: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const {
    mint,
    isPending,
    error: mintError,
    isError: isMintError,
  } = useNftMint();
  const [isWaitingTx, setIsWaitingTx] = useState(false);

  //useFirstNft(address);

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

  const disabled = useMemo(() => {
    return !account || !player || (!!game && !game.isOver());
  }, [account, player, game]);

  const handleClick = useCallback(async () => {
    if (settings === null) return;
    if (erc20Contract === undefined) return;
    if (erc721Contract === undefined) return;
    if (!account?.address) return;

    setIsLoading(true);

    // Check if the player has an NFT
    const ret_erc721_balance = await erc721Contract.call("balance_of", [
      account?.address,
    ]);
    const number_of_nft = Number(ret_erc721_balance.toString());
    console.log("number_of_nft", number_of_nft);

    try {
      if (number_of_nft === 0) {
        // Mint one
        // First check if the player has enough balance
        const ret_erc20 = await erc20Contract.call("balanceOf", [
          account?.address,
        ]);
        const balance = BigInt(ret_erc20.toString());
        if (balance < settings.game_price && erc20Contract) {
          console.log("Not enough balance, trying to claim faucet");

          await createFaucetClaimHandler(account as Account, () => {
            return;
          })();
        }

        // Second mint the NFT
        await handleMint();
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
    }

    try {
      const ret_erc721 = await erc721Contract.call("token_of_owner_by_index", [
        account?.address,
        0,
      ]);
      const currentTokenId = BigInt(ret_erc721.toString());
      console.log("currentTokenId", currentTokenId);

      const {
        seed,
        proof_gamma_x,
        proof_gamma_y,
        proof_c,
        proof_s,
        proof_verify_hint,
        beta,
      } = await fetchVrfData();

      await start({
        account: account as Account,
        token_id: currentTokenId || BigInt(0),
        mode: new Mode(mode).into(),
        price: settings.game_price,
        seed,
        x: proof_gamma_x,
        y: proof_gamma_y,
        c: proof_c,
        s: proof_s,
        sqrt_ratio_hint: proof_verify_hint,
        beta: beta,
      });
      handleGameMode();
    } catch (error) {
      console.error("Error during game start:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    settings,
    erc20Contract,
    erc721Contract,
    account,
    start,
    mode,
    handleGameMode,
  ]);

  return (
    <Button
      disabled={isLoading || disabled}
      isLoading={isLoading}
      onClick={handleClick}
      className={`text-lg w-full transition-transform duration-300 ease-in-out hover:scale-105 ${!isMdOrLarger && "py-6 border-4 border-white rounded-none text-white bg-sky-900 shadow-lg font-sans font-bold "}`}
    >
      Play !
    </Button>
  );
};
