import { useDojo } from "@/dojo/useDojo";
import { useCallback, useState } from "react";
import { Button } from "@/ui/elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { showToast } from "@/utils/toast";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { LoadoutDialog } from "@/ui/components/Shop";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";

type PlayFreeGameProps = {
  onMintSuccess?: () => void | Promise<void>;
};

export const PlayFreeGame = ({ onMintSuccess }: PlayFreeGameProps) => {
  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { cubeBalance } = useCubeBalance();

  const [isLoading, setIsLoading] = useState(false);
  const [showLoadoutDialog, setShowLoadoutDialog] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<number | null>(null);

  const cubeBalanceNum = Number(cubeBalance);

  const handleClick = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      // Mint a new free game
      // Use default settings ID for official games that earn cubes/quests
      const result = await freeMint({
        account,
        name: username ?? "",
        settingsId: DEFAULT_SETTINGS_ID,
      });

      setPendingGameId(result.game_id);
      setShowLoadoutDialog(true);
      setIsLoading(false);
      return;
    } catch (error) {
      console.error("Error minting game:", error);
      showToast({
        message: "Failed to mint game",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, freeMint, username]);

  const handleLoadoutConfirm = useCallback(async (selectedBonuses: number[], cubesToBring: number) => {
    if (!account || pendingGameId === null) return;

    setIsLoading(true);
    try {
      await create({
        account,
        token_id: pendingGameId,
        selected_bonuses: selectedBonuses,
        cubes_amount: cubesToBring,
      });

      showToast({
        message: cubesToBring > 0
          ? `Game started with ${cubesToBring} cubes! You can spend them in the shop.`
          : "Game minted! You can resume it from My Games.",
        type: "success",
      });

      setShowLoadoutDialog(false);
      setPendingGameId(null);
      onMintSuccess?.();
    } catch (error) {
      console.error("Error creating game:", error);
      showToast({
        message: "Failed to create game",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, create, onMintSuccess, pendingGameId]);

  const handleLoadoutClose = useCallback(() => {
    // If dialog is closed, use defaults
    if (pendingGameId !== null) {
      handleLoadoutConfirm([1, 3, 2], 0); // Default: Hammer, Wave, Totem, 0 cubes
    }
  }, [handleLoadoutConfirm, pendingGameId]);

  return (
    <>
      <Button
        disabled={isLoading}
        isLoading={isLoading}
        onClick={handleClick}
        variant="default"
        className="text-lg w-[300px] transition-transform duration-300 ease-in-out hover:scale-105"
      >
        Mint Game
      </Button>

      <LoadoutDialog
        isOpen={showLoadoutDialog}
        onClose={handleLoadoutClose}
        onConfirm={handleLoadoutConfirm}
        playerMetaData={playerMeta?.data ?? null}
        cubeBalance={cubeBalanceNum}
        isLoading={isLoading}
      />
    </>
  );
};
