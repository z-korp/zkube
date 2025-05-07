import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useContract } from "@starknet-react/core";
import { erc20ABI } from "@/utils/erc20";
import { useMediaQuery } from "react-responsive";
import { erc721ABI } from "@/utils/erc721";
import { showToast } from "@/utils/toast";

const {
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
} = import.meta.env;

interface CreateProps {
  handleGameMode: () => void;
}

export const Create: React.FC<CreateProps> = ({ handleGameMode }) => {
  const {
    setup: {
      systemCalls: { create },
    },
  } = useDojo();

  const { account } = useAccountCustom();
  const { contract: erc20Contract } = useContract({
    abi: erc20ABI,
    address: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  });
  const { contract: erc721Contract } = useContract({
    abi: erc721ABI,
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  });

  const { game } = useGame({
    gameId: /*TBD player?.game_id*/ "0",
    shouldLog: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const disabled = useMemo(() => {
    return !account || (!!game && !game.isOver());
  }, [account, game]);

  const handleClick = useCallback(async () => {
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
      const token_id = 0n;

      showToast({
        message: "Preparing game data...",
        txHash: "",
        toastId: "game-start-process",
        type: "success",
      });

      // Start game
      await create({
        account: account as Account,
        token_id,
      });

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
  }, [erc20Contract, erc721Contract, account, create, handleGameMode]);

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
