import { useDojo } from "@/dojo/useDojo";
import { useCallback, useState } from "react";
import { Button } from "@/ui/elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { showToast } from "@/utils/toast";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { BringCubesDialog, getMaxCubesForRank } from "@/ui/components/Shop";

type PlayFreeGameProps = {
  onMintSuccess?: () => void | Promise<void>;
};

export const PlayFreeGame = ({ onMintSuccess }: PlayFreeGameProps) => {
  const {
    setup: {
      systemCalls: { freeMint, create, createWithCubes },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { cubeBalance } = useCubeBalance();

  const [isLoading, setIsLoading] = useState(false);
  const [showBringCubesDialog, setShowBringCubesDialog] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<number | null>(null);

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
      const result = await freeMint({
        account,
        name: username ?? "",
        settingsId: 1,
      });

      // If player can bring cubes, show the dialog
      if (canBringCubes) {
        setPendingGameId(result.game_id);
        setShowBringCubesDialog(true);
        setIsLoading(false);
        return;
      }

      // Otherwise, create the game normally without cubes
      await create({ account, token_id: result.game_id });

      showToast({
        message: "Game minted! You can resume it from My Games.",
        type: "success",
      });

      onMintSuccess?.();
    } catch (error) {
      console.error("Error minting game:", error);
      showToast({
        message: "Failed to mint game",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, canBringCubes, create, freeMint, onMintSuccess, username]);

  const handleBringCubesConfirm = useCallback(async (cubes: number) => {
    if (!account || pendingGameId === null) return;

    setIsLoading(true);
    try {
      if (cubes > 0) {
        // Create game with cubes
        await createWithCubes({ 
          account, 
          token_id: pendingGameId, 
          cubes_amount: cubes 
        });
        showToast({
          message: `Game started with ${cubes} cubes! You can spend them in the shop.`,
          type: "success",
        });
      } else {
        // Create game without cubes
        await create({ account, token_id: pendingGameId });
        showToast({
          message: "Game minted! You can resume it from My Games.",
          type: "success",
        });
      }

      setShowBringCubesDialog(false);
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
  }, [account, create, createWithCubes, onMintSuccess, pendingGameId]);

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
    </>
  );
};
