import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";
import { showToast } from "@/utils/toast";
import { useGeneralStore } from "@/stores/generalStore";
import { useControllerUsername } from "@/hooks/useControllerUsername";

export const PlayFreeGame = () => {
  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();

  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const { gameId } = useGeneralStore();

  const { game } = useGame({
    gameId: gameId || 0,
    shouldLog: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const disabled = useMemo(() => {
    return !account || (!!game && !game.isOver());
  }, [account, game]);

  const handleClick = useCallback(async () => {
    if (!account?.address) {
      console.error("Account not loaded");
      return;
    }
    if (!username) {
      console.error("Username not loaded");
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

      await freeMint({
        account: account as Account,
        name: username,
        settingsId: 0,
      });

      // Wait for the TokenMetadata model to be created
      /*const playerKey = getEntityIdFromKeys([
        BigInt(newAccount.address),
      ]) as Entity;
      const component = getComponentValue(Player, playerKey);*/

      await create({
        account: account as Account,
        token_id,
      });
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
  }, [account, freeMint, create, username]);

  return (
    <Button
      disabled={isLoading || disabled}
      isLoading={isLoading}
      onClick={handleClick}
      variant={`${!isMdOrLarger ? "brutal" : "default"}`}
      className={`text-lg w-full transition-transform duration-300 ease-in-out hover:scale-105 ${
        !isMdOrLarger &&
        "py-6 border-4 border-white rounded-none text-white bg-sky-900 shadow-lg font-sans font-bold "
      }`}
    >
      Play !
    </Button>
  );
};
