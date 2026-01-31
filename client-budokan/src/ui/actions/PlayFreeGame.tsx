import { useDojo } from "@/dojo/useDojo";
import { useCallback, useState } from "react";
import { Button } from "@/ui/elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { showToast } from "@/utils/toast";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { BonusSelectionDialog, BringCubesDialog, getMaxCubesForRank } from "@/ui/components/Shop";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";

type PlayFreeGameProps = {
  onMintSuccess?: () => void | Promise<void>;
};

const DEFAULT_SELECTED_BONUSES = [1, 3, 2]; // Hammer, Wave, Totem

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
  const [showBringCubesDialog, setShowBringCubesDialog] = useState(false);
  const [showBonusSelectionDialog, setShowBonusSelectionDialog] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<number | null>(null);
  const [pendingSelectedBonuses, setPendingSelectedBonuses] = useState<number[] | null>(null);


  // Check if player has bridging rank unlocked
  const bridgingRank = playerMeta?.data?.bridgingRank ?? 0;
  const maxCubesAllowed = getMaxCubesForRank(bridgingRank);
  const cubeBalanceNum = Number(cubeBalance);
  const canBringCubes = bridgingRank > 0 && cubeBalanceNum > 0;

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
      setShowBonusSelectionDialog(true);
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

  const handleBonusSelectionConfirm = useCallback(async (selectedBonuses: number[]) => {
    if (!account || pendingGameId === null) return;

    setPendingSelectedBonuses(selectedBonuses);
    setIsLoading(true);
    try {
      if (canBringCubes) {
        setShowBonusSelectionDialog(false);
        setShowBringCubesDialog(true);
        setIsLoading(false);
        return;
      }

      await create({
        account,
        token_id: pendingGameId,
        selected_bonuses: selectedBonuses,
        cubes_amount: 0,
      });

      showToast({
        message: "Game minted! You can resume it from My Games.",
        type: "success",
      });

      setShowBonusSelectionDialog(false);
      setPendingGameId(null);
      setPendingSelectedBonuses(null);
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
  }, [account, canBringCubes, create, onMintSuccess, pendingGameId]);

  const handleBonusSelectionClose = useCallback(() => {
    if (pendingGameId !== null) {
      handleBonusSelectionConfirm(DEFAULT_SELECTED_BONUSES);
    }
  }, [handleBonusSelectionConfirm, pendingGameId]);

  const handleBringCubesConfirm = useCallback(async (cubes: number) => {
    if (!account || pendingGameId === null) return;

    const selectedBonuses = pendingSelectedBonuses ?? DEFAULT_SELECTED_BONUSES;

    setIsLoading(true);
    try {
      await create({
        account,
        token_id: pendingGameId,
        selected_bonuses: selectedBonuses,
        cubes_amount: cubes,
      });

      showToast({
        message: cubes > 0
          ? `Game started with ${cubes} cubes! You can spend them in the shop.`
          : "Game minted! You can resume it from My Games.",
        type: "success",
      });

      setShowBringCubesDialog(false);
      setShowBonusSelectionDialog(false);
      setPendingGameId(null);
      setPendingSelectedBonuses(null);
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
  }, [account, create, onMintSuccess, pendingGameId, pendingSelectedBonuses]);

  const handleBringCubesClose = useCallback(() => {
    // If dialog is closed without confirming, create the game without cubes
    if (pendingGameId !== null) {
      handleBringCubesConfirm(0);
    }
  }, [handleBringCubesConfirm, pendingGameId]);

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

      <BringCubesDialog
        isOpen={showBringCubesDialog}
        onClose={handleBringCubesClose}
        onConfirm={handleBringCubesConfirm}
        maxCubes={maxCubesAllowed}
        cubeBalance={cubeBalanceNum}
        isLoading={isLoading}
      />

      <BonusSelectionDialog
        isOpen={showBonusSelectionDialog}
        onClose={handleBonusSelectionClose}
        onConfirm={handleBonusSelectionConfirm}
        shrinkUnlocked={playerMeta?.data?.shrinkUnlocked ?? false}
        shuffleUnlocked={playerMeta?.data?.shuffleUnlocked ?? false}
      />
    </>
  );
};
