import { useDojo } from "@/dojo/useDojo";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { showToast } from "@/utils/toast";
import { useControllers } from "@/contexts/controllers";
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
  const { find } = useControllers();
  const { playerMeta } = usePlayerMeta();
  const username = account?.address ? find(account.address)?.username : undefined;
  const { cubeBalance, refetch: refetchCubeBalance } = useCubeBalance();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showLoadoutDialog, setShowLoadoutDialog] = useState(false);

  const cubeBalanceNum = Number(cubeBalance);

  // Step 1: Show loadout dialog (no transaction yet)
  const handleClick = useCallback(() => {
    if (!account) return;
    setShowLoadoutDialog(true);
  }, [account]);

  // Step 2: On confirm, mint + create sequentially
  const handleLoadoutConfirm = useCallback(async (selectedBonuses: number[], cubesToBring: number) => {
    if (!account) return;

    // Validate cube balance if bringing cubes
    if (cubesToBring > 0) {
      // Refetch to ensure we have latest balance
      await refetchCubeBalance?.();
      const currentBalance = Number(cubeBalance);
      if (cubesToBring > currentBalance) {
        showToast({
          message: `Insufficient cubes. You have ${currentBalance} but tried to bring ${cubesToBring}.`,
          type: "error",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      // Step 2a: Mint the game token
      const mintResult = await freeMint({
        account,
        name: username ?? "",
        settingsId: DEFAULT_SETTINGS_ID,
      });

      const gameId = mintResult.game_id;
      if (!gameId) {
        throw new Error("Failed to extract game_id from mint transaction");
      }

      // Step 2b: Create/start the game with loadout
      await create({
        account,
        token_id: gameId,
        selected_bonuses: selectedBonuses,
        cubes_amount: cubesToBring,
      });

      showToast({
        message: cubesToBring > 0
          ? `Game #${gameId} started with ${cubesToBring} cubes!`
          : `Game #${gameId} started! Good luck!`,
        type: "success",
      });

      setShowLoadoutDialog(false);
      onMintSuccess?.();
      
      // Navigate to the play page
      navigate(`/play/${gameId}`);
    } catch (error) {
      console.error("Error starting game:", error);
      showToast({
        message: "Failed to start game. Check My Games if a token was minted.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, freeMint, create, username, cubeBalance, refetchCubeBalance, onMintSuccess]);

  // If dialog is closed without confirming, do nothing (no orphaned games)
  const handleLoadoutClose = useCallback(() => {
    if (!isLoading) {
      setShowLoadoutDialog(false);
    }
  }, [isLoading]);

  return (
    <>
      <Button
        disabled={isLoading || !account}
        isLoading={isLoading}
        onClick={handleClick}
        variant="default"
        className="text-lg w-[300px] transition-transform duration-300 ease-in-out hover:scale-105"
      >
        Play Game
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
