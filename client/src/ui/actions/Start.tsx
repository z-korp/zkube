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
import { setComponent } from "@dojoengine/recs";
import { useGeneralStore } from "@/stores/generalStore";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { packGridToBigint, packRowToU32, generateNextRow } from "@/offchain/grid";
import { DEFAULT_GRID_HEIGHT, DEFAULT_GRID_WIDTH } from "@/dojo/game/constants";

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
      clientModels: { models },
    },
  } = useDojo();

  const { account } = useAccountCustom();
  const { player } = usePlayer();
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
  const offchain = String(import.meta.env.VITE_PUBLIC_OFFCHAIN).toLowerCase() === "true";
  const { setPlayerId, setPlayerName } = useGeneralStore();

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
    if (offchain) return !!game && !game.isOver();
    return !account || !player || (!!game && !game.isOver());
  }, [account, player, game, offchain]);

  const handleClick = useCallback(async () => {
    if (!offchain && settings === null) {
      console.error("Settings not loaded");
      return;
    }
    if (!offchain && erc20Contract === undefined) {
      console.error("ERC20 contract not loaded");
      return;
    }
    if (!offchain && erc721Contract === undefined) {
      console.error("ERC721 contract not loaded");
      return;
    }
    if (!offchain && !account?.address) {
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
      if (!offchain && mode !== ModeType.Free) {
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

      if (offchain) {
        // Create or ensure a local player id
        const localPlayerId = player?.id
          ? parseInt(player.id, 16)
          : 1;
        if (!player) {
          // minimal player
          const playerEntity = getEntityIdFromKeys([BigInt(localPlayerId)]);
          setComponent(models.Player, playerEntity as any, {
            id: localPlayerId,
            game_id: 0,
            points: 0,
            last_active_day: 0,
            account_creation_day: Math.floor(Date.now() / 1000 / 86400),
            daily_streak: 0,
          } as any);
          setPlayerId(localPlayerId);
          setPlayerName("offchain");
        }

        // build initial grid and next row
        const grid = Array.from({ length: DEFAULT_GRID_HEIGHT }, () =>
          Array(DEFAULT_GRID_WIDTH).fill(0),
        );
        // optionally seed bottom two rows
        grid[DEFAULT_GRID_HEIGHT - 1] = generateNextRow(DEFAULT_GRID_WIDTH);
        grid[DEFAULT_GRID_HEIGHT - 2] = generateNextRow(DEFAULT_GRID_WIDTH);
        const nextRow = generateNextRow(DEFAULT_GRID_WIDTH);

        const packedBlocks = packGridToBigint(grid);
        const packedNext = packRowToU32(nextRow);
        const newGameId = Math.floor(Date.now() % 2 ** 31);
        const gameEntity = getEntityIdFromKeys([BigInt(newGameId)]);
        setComponent(models.Game, gameEntity as any, {
          id: newGameId,
          seed: BigInt(0),
          blocks: packedBlocks,
          player_id: localPlayerId,
          over: false,
          mode: new Mode(mode).into(),
          score: 0,
          moves: 0,
          next_row: packedNext,
          start_time: Math.floor(Date.now() / 1000),
          hammer_bonus: 0,
          wave_bonus: 0,
          totem_bonus: 0,
          hammer_used: 0,
          wave_used: 0,
          totem_used: 0,
          combo_counter: 0,
          max_combo: 0,
          tournament_id: 0,
        } as any);
        // link player -> game
        const playerEntity = getEntityIdFromKeys([BigInt(localPlayerId)]);
        setComponent(models.Player, playerEntity as any, {
          id: localPlayerId,
          game_id: newGameId,
          points: 0,
          last_active_day: 0,
          account_creation_day: Math.floor(Date.now() / 1000 / 86400),
          daily_streak: 0,
        } as any);
      } else {
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
      }

      handleGameMode();
    } catch (error) {
      console.error("Error during game start:", error);
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
