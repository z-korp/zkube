import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
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
import { showToast } from "@/utils/toast";
import { trackEvent } from "@/services/analytics";

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

  const { mint } = useNftMint();
  const [isWaitingTx, setIsWaitingTx] = useState(false);

  const handleMint = useCallback(async () => {
    if (account) {
      try {
        setIsWaitingTx(true);
        showToast({
          message: "Minting your first game credit NFT...",
          toastId: "game-start-process",
        });

        const tx = await mint();
        showToast({
          message: "Minting your first game credit NFT...",
          txHash: tx.transaction_hash,
          toastId: "game-start-process",
        });

        await account.waitForTransaction(tx.transaction_hash, {
          retryInterval: 200,
        });

        showToast({
          message: "Transaction validated",
          txHash: tx.transaction_hash,
          type: "success",
          toastId: "game-start-process",
        });
      } catch (err) {
        console.error("Mint error:", err);
        showToast({
          message: "Failed to mint NFT",
          type: "error",
          toastId: "game-start-process",
        });
      } finally {
        setIsWaitingTx(false);
      }
    }
  }, [account, mint]);

  const disabled = useMemo(() => {
    return !account || !player || (!!game && !game.isOver());
  }, [account, player, game]);

  const handleClick = useCallback(async () => {
    if (settings === null) {
      console.error("Settings not loaded");
      return;
    }
    if (erc20Contract === undefined) {
      console.error("ERC20 contract not loaded");
      return;
    }
    if (erc721Contract === undefined) {
      console.error("ERC721 contract not loaded");
      return;
    }
    if (!account?.address) {
      console.error("Account not loaded");
      return;
    }

    setIsLoading(true);
    showToast({
      message: "Checking your game credits...",
      toastId: "game-start-process",
    });

    try {
      let token_id = 0n;
      if (mode !== ModeType.Free) {
        // Check if the player has an NFT
        const ret_erc721_balance = await erc721Contract.call("balance_of", [
          account?.address,
        ]);
        const number_of_nft = Number(ret_erc721_balance.toString());
        console.log("number_of_nft", number_of_nft);

        if (number_of_nft === 0) {
          // Check balance and claim from faucet if needed
          const ret_erc20 = await erc20Contract.call("balanceOf", [
            account?.address,
          ]);
          const balance = BigInt(ret_erc20.toString());
          if (balance < settings.game_price && erc20Contract) {
            if (import.meta.env.VITE_PUBLIC_DEPLOY_TYPE === "mainnet") {
              console.log("No LORDs to pay for game");
              return;
            }
            showToast({
              message: "Claiming tokens from faucet...",
              toastId: "game-start-process",
            });
            await createFaucetClaimHandler(account as Account, () => {
              return;
            })();
          }

          // Mint NFT
          await handleMint();
        }

        const ret_erc721 = await erc721Contract.call(
          "token_of_owner_by_index",
          [account?.address, 0],
        );
        token_id = BigInt(ret_erc721.toString());
        console.log("token_id", token_id);
      }

      showToast({
        message: "Preparing game data...",
        txHash: "",
        toastId: "game-start-process",
        type: "success",
      });

      const {
        seed,
        proof_gamma_x,
        proof_gamma_y,
        proof_c,
        proof_s,
        proof_verify_hint,
        beta,
      } = await fetchVrfData();

      // Track game start attempt
      trackEvent("Game Start", {
        mode: mode,
        player_address: account?.address,
        player_name: player?.name,
        token_id: token_id.toString(),
        is_free_mode: mode === ModeType.Free,
      });

      // Start game
      await start({
        account: account as Account,
        token_id,
        mode: new Mode(mode).into(),
        seed,
        x: proof_gamma_x,
        y: proof_gamma_y,
        c: proof_c,
        s: proof_s,
        sqrt_ratio_hint: proof_verify_hint,
        beta: beta,
      });

      // Track successful game start
      trackEvent("Game Started Successfully", {
        mode: mode,
        player_address: account?.address,
        player_name: player?.name,
        token_id: token_id.toString(),
        is_free_mode: mode === ModeType.Free,
      });

      handleGameMode();
    } catch (error) {
      console.error("Error during game start:", error);

      // Track failed game start
      trackEvent("Game Start Failed", {
        mode: mode,
        player_address: account?.address,
        player_name: player?.name,
        error: error instanceof Error ? error.message : String(error),
      });

      showToast({
        message: "Failed to start game",
        type: "error",
        toastId: "game-start-process",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    settings,
    erc20Contract,
    erc721Contract,
    account,
    mode,
    handleMint,
    start,
    handleGameMode,
    player,
  ]);

  return (
    <Button
      disabled={isLoading || disabled}
      isLoading={isLoading}
      onClick={handleClick}
      variant={`${!isMdOrLarger ? "brutal" : "default"}`}
      className={`text-lg w-full transition-transform duration-300 ease-in-out hover:scale-105 ${!isMdOrLarger && "py-6 border-4 border-white rounded-none text-white bg-sky-900 shadow-lg font-sans font-bold "}`}
    >
      Play !
    </Button>
  );
};
