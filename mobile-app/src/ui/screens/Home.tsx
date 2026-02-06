/**
 * Home Screen - Pure PixiJS. Zero HTML.
 * Fetches player's games and passes data to LandingScreen.
 */
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { LandingScreen } from "@/pixi/components/landing/LandingScreen";
import type { PlayerGame } from "@/pixi/components/landing/MyGamesModal";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { GameTokenData } from "metagame-sdk";

// ============================================================================
// HELPERS
// ============================================================================

// Normalize address to remove leading zeros (matches Torii's format)
const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

type TokenAttribute = {
  trait?: string;
  trait_type?: string;
  name?: string;
  value?: string | number;
  Value?: string | number;
  display_type?: string | number;
};

type TokenMetadata = {
  name?: string;
  description?: string;
  attributes?: TokenAttribute[];
};

const parseTokenMetadata = (metadata: unknown): TokenMetadata | undefined => {
  if (!metadata) return undefined;
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return undefined;
    }
  }
  if (typeof metadata === "object") {
    return metadata as TokenMetadata;
  }
  return undefined;
};

const getAttributeValue = (
  attributes: TokenAttribute[],
  key: string
): string | number | undefined => {
  const entry = attributes.find(
    (item) =>
      item?.trait === key || item?.trait_type === key || item?.name === key
  );
  return entry?.value ?? entry?.Value ?? entry?.display_type;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Home = () => {
  const { account } = useAccountCustom();
  const { connector } = useAccount();
  const { cubeBalance } = useCubeBalance();
  const navigate = useNavigate();

  const cubeBalanceNum = Number(cubeBalance);

  // Fetch player's games
  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = normalizeAddress(account?.address);

  const {
    games: ownedGames,
    loading: gamesLoading,
    refetch: refetchGames,
  } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
    forceRecs: true,
  });

  // Transform GameTokenData[] to PlayerGame[]
  const playerGames: PlayerGame[] = useMemo(() => {
    if (!ownedGames?.length) return [];

    return ownedGames.map((game: GameTokenData) => {
      const metadata = parseTokenMetadata(game.metadata);
      const attributes = Array.isArray(metadata?.attributes)
        ? (metadata?.attributes as TokenAttribute[])
        : [];

      const levelAttr = getAttributeValue(attributes, "Level");
      const totalCubesAttr = getAttributeValue(attributes, "Total Cubes");
      const totalScoreAttr = getAttributeValue(attributes, "Total Score");
      const cubesBroughtAttr = getAttributeValue(attributes, "Cubes Brought");
      const cubesSpentAttr = getAttributeValue(attributes, "Cubes Spent");

      // Calculate available cubes: totalCubes + cubesBrought - cubesSpent
      const totalCubes = Number(totalCubesAttr) || 0;
      const cubesBrought = Number(cubesBroughtAttr) || 0;
      const cubesSpent = Number(cubesSpentAttr) || 0;
      const cubesAvailable = Math.max(0, totalCubes + cubesBrought - cubesSpent);

      return {
        tokenId: game.token_id,
        name:
          metadata?.name || game.gameMetadata?.name || `Game #${game.token_id}`,
        level: Number(levelAttr) || 1,
        totalScore: Number(totalScoreAttr) || game.score || 0,
        cubesAvailable,
        gameOver: Boolean(game.game_over),
      };
    });
  }, [ownedGames]);

  // Handlers
  const handlePlay = useCallback(() => {
    if (!account) {
      const c = connector as ControllerConnector;
      if (c?.controller) c.controller.connect();
      return;
    }
    // TODO: Open PixiJS loadout dialog, then freeMint + create -> navigate
    console.log("Play clicked - loadout flow TODO");
  }, [account, connector]);

  const handleConnect = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller) c.controller.connect();
  }, [connector]);

  const handleTrophyClick = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller?.openProfile) c.controller.openProfile("trophies");
  }, [connector]);

  const handleResumeGame = useCallback(
    (tokenId: number) => {
      navigate(`/play/${tokenId}`);
    },
    [navigate]
  );

  return (
    <LandingScreen
      onPlay={handlePlay}
      onConnect={handleConnect}
      isConnected={!!account}
      cubeBalance={cubeBalanceNum}
      games={playerGames}
      gamesLoading={gamesLoading}
      onResumeGame={handleResumeGame}
      onTrophyClick={handleTrophyClick}
    />
  );
};
