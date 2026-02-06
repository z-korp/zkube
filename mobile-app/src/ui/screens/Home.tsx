/**
 * Home Screen - Pure PixiJS. Zero HTML.
 * Fetches player's games and passes data to LandingScreen.
 * Implements the full Play flow: LoadoutModal -> freeMint -> create -> navigate
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useDojo } from "@/dojo/useDojo";
import { LandingScreen } from "@/pixi/components/landing/LandingScreen";
import type { PlayerGame } from "@/pixi/components/landing/MyGamesModal";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { GameTokenData } from "metagame-sdk";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { toast } from "sonner";

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
  const { cubeBalance, refetch: refetchCubeBalance } = useCubeBalance();
  const { playerMeta } = usePlayerMeta();
  const { username } = useControllerUsername();
  const navigate = useNavigate();

  const {
    setup: { systemCalls },
  } = useDojo();

  const cubeBalanceNum = Number(cubeBalance);

  // State for LoadoutModal
  const [showLoadoutModal, setShowLoadoutModal] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

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

  // Handle Play button click - open LoadoutModal
  const handlePlay = useCallback(() => {
    if (!account) {
      const c = connector as ControllerConnector;
      if (c?.controller) c.controller.connect();
      return;
    }
    setShowLoadoutModal(true);
  }, [account, connector]);

  // Handle loadout close
  const handleLoadoutClose = useCallback(() => {
    if (!isStartingGame) {
      setShowLoadoutModal(false);
    }
  }, [isStartingGame]);

  // Handle loadout confirm - freeMint + create -> navigate
  const handleLoadoutConfirm = useCallback(
    async (selectedBonuses: number[], cubesToBring: number) => {
      if (!account) return;

      // Validate cube balance if bringing cubes
      if (cubesToBring > 0) {
        await refetchCubeBalance?.();
        const currentBalance = Number(cubeBalance);
        if (cubesToBring > currentBalance) {
          toast.error(
            `Insufficient cubes. You have ${currentBalance} but tried to bring ${cubesToBring}.`
          );
          return;
        }
      }

      setIsStartingGame(true);
      try {
        // Step 1: Mint the game token
        const mintResult = await systemCalls.freeMint({
          account,
          name: username ?? "",
          settingsId: DEFAULT_SETTINGS_ID,
        });

        const gameId = mintResult.game_id;
        if (!gameId) {
          throw new Error("Failed to extract game_id from mint transaction");
        }

        // Step 2: Create/start the game with loadout
        await systemCalls.create({
          account,
          token_id: gameId,
          selected_bonuses: selectedBonuses,
          cubes_amount: cubesToBring,
        });

        toast.success(
          cubesToBring > 0
            ? `Game #${gameId} started with ${cubesToBring} cubes!`
            : `Game #${gameId} started! Good luck!`
        );

        setShowLoadoutModal(false);
        refetchGames?.();

        // Navigate to the play page
        navigate(`/play/${gameId}`);
      } catch (error) {
        console.error("Error starting game:", error);
        toast.error(
          "Failed to start game. Check My Games if a token was minted."
        );
      } finally {
        setIsStartingGame(false);
      }
    },
    [
      account,
      username,
      cubeBalance,
      refetchCubeBalance,
      systemCalls,
      refetchGames,
      navigate,
    ]
  );

  const handleConnect = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller) c.controller.connect();
  }, [connector]);

  const handleTrophyClick = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller?.openProfile) c.controller.openProfile("trophies");
  }, [connector]);

  // Opens the controller profile window when clicking username
  const handleProfileClick = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller?.openProfile) c.controller.openProfile();
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
      onProfileClick={handleProfileClick}
      isConnected={!!account}
      username={username}
      cubeBalance={cubeBalanceNum}
      games={playerGames}
      gamesLoading={gamesLoading}
      onResumeGame={handleResumeGame}
      onTrophyClick={handleTrophyClick}
      // LoadoutModal props
      showLoadoutModal={showLoadoutModal}
      onLoadoutClose={handleLoadoutClose}
      onLoadoutConfirm={handleLoadoutConfirm}
      playerMetaData={playerMeta?.data ?? null}
      isStartingGame={isStartingGame}
    />
  );
};
