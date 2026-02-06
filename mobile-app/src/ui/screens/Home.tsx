/**
 * Home Screen - Pure PixiJS Landing Page
 * 
 * The entire visual layer is rendered in PixiJS (sky, clouds, blocks, title, buttons).
 * Only the LoadoutDialog (blockchain transaction flow) remains as an HTML overlay
 * since it needs React form inputs and wallet interaction.
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { showToast } from "@/utils/toast";
import { LoadoutDialog } from "@/ui/components/Shop";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { LandingScreen } from "@/pixi/components/landing/LandingScreen";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";

export const Home = () => {
  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const { connector } = useAccount();
  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { cubeBalance, refetch: refetchCubeBalance } = useCubeBalance();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showLoadoutDialog, setShowLoadoutDialog] = useState(false);

  const cubeBalanceNum = Number(cubeBalance);

  // Called from PixiJS Play button
  const handlePlay = useCallback(() => {
    if (!account) {
      // Try to connect
      const controllerConnector = connector as ControllerConnector;
      if (controllerConnector?.controller) {
        controllerConnector.controller.connect();
      }
      return;
    }
    setShowLoadoutDialog(true);
  }, [account, connector]);

  // Called from PixiJS Connect button
  const handleConnect = useCallback(() => {
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller) {
      controllerConnector.controller.connect();
    }
  }, [connector]);

  // Loadout confirmed -> mint + create game
  const handleLoadoutConfirm = useCallback(
    async (selectedBonuses: number[], cubesToBring: number) => {
      if (!account) return;

      if (cubesToBring > 0) {
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
        const mintResult = await freeMint({
          account,
          name: username ?? "",
          settingsId: DEFAULT_SETTINGS_ID,
        });

        const gameId = mintResult.game_id;
        if (!gameId) {
          throw new Error("Failed to extract game_id from mint transaction");
        }

        await create({
          account,
          token_id: gameId,
          selected_bonuses: selectedBonuses,
          cubes_amount: cubesToBring,
        });

        showToast({
          message:
            cubesToBring > 0
              ? `Game #${gameId} started with ${cubesToBring} cubes!`
              : `Game #${gameId} started! Good luck!`,
          type: "success",
        });

        setShowLoadoutDialog(false);
        navigate(`/play/${gameId}`);
      } catch (error) {
        console.error("Error starting game:", error);
        showToast({
          message:
            "Failed to start game. Check My Games if a token was minted.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, freeMint, create, username, cubeBalance, refetchCubeBalance, navigate],
  );

  const handleLoadoutClose = useCallback(
    (open: boolean) => {
      if (!open && !isLoading) {
        setShowLoadoutDialog(false);
      }
    },
    [isLoading],
  );

  return (
    <>
      {/* Full PixiJS Landing Screen */}
      <LandingScreen
        onPlay={handlePlay}
        onConnect={handleConnect}
        isConnected={!!account}
      />

      {/* Loadout Dialog (HTML overlay for blockchain tx flow) */}
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
