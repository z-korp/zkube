/**
 * Home Screen - Pure PixiJS. Zero HTML.
 * Just mounts LandingScreen and passes callbacks.
 */
import { useCallback } from "react";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { LandingScreen } from "@/pixi/components/landing/LandingScreen";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";

export const Home = () => {
  const { account } = useAccountCustom();
  const { connector } = useAccount();
  const { cubeBalance } = useCubeBalance();

  const cubeBalanceNum = Number(cubeBalance);

  const handlePlay = useCallback(() => {
    if (!account) {
      const c = connector as ControllerConnector;
      if (c?.controller) c.controller.connect();
      return;
    }
    // TODO: PixiJS loadout flow -> freeMint -> create -> navigate
    console.log("Play clicked - loadout flow not yet implemented in PixiJS");
  }, [account, connector]);

  const handleConnect = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller) c.controller.connect();
  }, [connector]);

  const handleTrophyClick = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller?.openProfile) c.controller.openProfile("trophies");
  }, [connector]);

  return (
    <LandingScreen
      onPlay={handlePlay}
      onConnect={handleConnect}
      isConnected={!!account}
      cubeBalance={cubeBalanceNum}
      onTrophyClick={handleTrophyClick}
    />
  );
};
