import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import { useDojo } from "@/dojo/useDojo";
import { MainScreen } from "@/pixi/components/pages/MainScreen";
import type { PlayerGame } from "@/pixi/components/pages/MainScreen";
import { useAccount, useConnect } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { GameTokenData } from "metagame-sdk";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useQuests } from "@/contexts/quests";
import { shortString } from "starknet";
import { useMusicPlayer } from "@/contexts/hooks";
import { deriveUserFacingErrorMessage, showToast } from "@/utils/toast";
import { normalizeAddress } from "@/utils/address";

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

export const Home = () => {
  const { account } = useAccountCustom();
  const { connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { cubeBalance, refetch: refetchCubeBalance } = useCubeBalance();
  const { playerMeta } = usePlayerMeta();
  const { username } = useControllerUsername();
  const location = useLocation();
  const initialPage = (location.state as { openLoadout?: boolean })?.openLoadout ? 'loadout' : undefined;

  const {
    setup: { systemCalls },
  } = useDojo();

  const cubeBalanceNum = Number(cubeBalance);

  const {
    games: leaderboardEntries,
    loading: leaderboardLoading,
    refetch: refetchLeaderboard,
  } = useLeaderboardSlot({ forceRecs: true });

  const { questFamilies, status: questsStatus, refresh: refreshQuests } = useQuests();
  const questsLoading = questsStatus === "loading";

  const {
    musicVolume,
    effectsVolume,
    setMusicVolume,
    setEffectsVolume,
  } = useMusicPlayer();

  const [isStartingGame, setIsStartingGame] = useState(false);

  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = account?.address ? normalizeAddress(account.address) : undefined;

  const {
    games: ownedGames,
    loading: gamesLoading,
    refetch: refetchGames,
  } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
    forceRecs: true,
  });

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

  const handleStartGame = useCallback(
    async (selectedBonuses: number[], cubesToBring: number): Promise<number | undefined> => {
      if (!account) {
        showToast({
          message: "Connect your wallet to start a game.",
          type: "info",
          toastId: "start-game-connect-required",
        });
        const c = connector as ControllerConnector;
        if (c?.controller) c.controller.connect();
        return undefined;
      }

      if (cubesToBring > 0) {
        await refetchCubeBalance?.();
        const currentBalance = Number(cubeBalance);
        if (cubesToBring > currentBalance) {
          showToast({
            message: `Insufficient cubes. You have ${currentBalance} but tried to bring ${cubesToBring}.`,
            type: "error",
            toastId: "start-game-balance-error",
          });
          return undefined;
        }
      }

      setIsStartingGame(true);
      try {
        showToast({
          message: "Minting your game pass...",
          type: "loading",
          toastId: "start-game-flow",
        });

        const mintResult = await systemCalls.freeMint({
          account,
          name: username ?? "",
          settingsId: DEFAULT_SETTINGS_ID,
        });

        const gameId = mintResult.game_id;
        if (!gameId) {
          throw new Error("Failed to extract game_id from mint transaction");
        }

        showToast({
          message: `Game #${gameId} minted. Creating run...`,
          type: "loading",
          toastId: "start-game-flow",
        });

        await systemCalls.create({
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
          toastId: "start-game-flow",
        });

        refetchGames?.();
        return gameId;
      } catch (error) {
        console.error("Error starting game:", error);
        showToast({
          message: deriveUserFacingErrorMessage(
            error,
            "Failed to start game. Check My Games if a token was minted."
          ),
          type: "error",
          toastId: "start-game-flow",
        });
        return undefined;
      } finally {
        setIsStartingGame(false);
      }
    },
    [
      account,
      connector,
      username,
      cubeBalance,
      refetchCubeBalance,
      systemCalls,
      refetchGames,
    ]
  );

  const handleConnect = useCallback(() => {
    const target = connectors.find((c) => c.id === "controller") ?? connectors[0];
    if (!target) {
      showToast({
        message: "No wallet connector is available.",
        type: "error",
        toastId: "connect-wallet-missing",
      });
      return;
    }
    connect({ connector: target });
  }, [connect, connectors]);

  const handleTrophyClick = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller?.openProfile) c.controller.openProfile("trophies");
  }, [connector]);

  const handleClaimQuest = useCallback(
    async (questId: string, intervalId: number) => {
      if (!account) {
        showToast({
          message: "Connect wallet to claim quests.",
          type: "info",
          toastId: "quest-connect-required",
        });
        return;
      }
      if (questId.length > 31) {
        showToast({ message: 'Invalid quest ID.', type: 'error', toastId: 'quest-id-error' });
        return;
      }
      try {
        const questIdFelt = `0x${BigInt(shortString.encodeShortString(questId)).toString(16)}`;
        await systemCalls.claimQuest({
          account,
          quest_id: questIdFelt,
          interval_id: intervalId,
        });
        refetchCubeBalance?.();
      } catch (error) {
        console.error('Quest claim failed:', error);
      }
    },
    [account, systemCalls, refetchCubeBalance]
  );

  const handleUpgradeStartingBonus = useCallback(
    async (bonusType: number) => {
      if (!account) {
        showToast({
          message: "Connect wallet to use the shop.",
          type: "info",
          toastId: "shop-connect-required",
        });
        return;
      }
      await systemCalls.upgradeStartingBonus({ account, bonus_type: bonusType });
      refetchCubeBalance?.();
    },
    [account, systemCalls, refetchCubeBalance]
  );

  const handleUpgradeBagSize = useCallback(
    async (bonusType: number) => {
      if (!account) {
        showToast({
          message: "Connect wallet to use the shop.",
          type: "info",
          toastId: "shop-connect-required",
        });
        return;
      }
      await systemCalls.upgradeBagSize({ account, bonus_type: bonusType });
      refetchCubeBalance?.();
    },
    [account, systemCalls, refetchCubeBalance]
  );

  const handleUpgradeBridging = useCallback(async () => {
    if (!account) {
      showToast({
        message: "Connect wallet to use the shop.",
        type: "info",
        toastId: "shop-connect-required",
      });
      return;
    }
    await systemCalls.upgradeBridgingRank({ account });
    refetchCubeBalance?.();
  }, [account, systemCalls, refetchCubeBalance]);

  const handleUnlockBonus = useCallback(
    async (bonusType: number) => {
      if (!account) {
        showToast({
          message: "Connect wallet to use the shop.",
          type: "info",
          toastId: "shop-connect-required",
        });
        return;
      }
      await systemCalls.unlockBonus({ account, bonus_type: bonusType });
      refetchCubeBalance?.();
    },
    [account, systemCalls, refetchCubeBalance]
  );

  const handleProfileClick = useCallback(() => {
    const c = connector as ControllerConnector;
    if (c?.controller?.openProfile) c.controller.openProfile();
  }, [connector]);

  return (
    <MainScreen
      initialPage={initialPage}
      onConnect={handleConnect}
      onProfileClick={handleProfileClick}
      isConnected={!!account}
      username={username}
      walletAddress={account?.address}
      cubeBalance={cubeBalanceNum}
      games={playerGames}
      gamesLoading={gamesLoading}
      onRefreshGames={refetchGames}
      onTrophyClick={handleTrophyClick}
      onStartGame={handleStartGame}
      isStartingGame={isStartingGame}
      playerMetaData={playerMeta?.data ?? null}
      leaderboardEntries={leaderboardEntries}
      leaderboardLoading={leaderboardLoading}
      onRefreshLeaderboard={refetchLeaderboard}
      questFamilies={questFamilies}
      questsLoading={questsLoading}
      questsStatus={questsStatus}
      onRefreshQuests={refreshQuests}
      onClaimQuest={handleClaimQuest}
      onUpgradeStartingBonus={handleUpgradeStartingBonus}
      onUpgradeBagSize={handleUpgradeBagSize}
      onUpgradeBridging={handleUpgradeBridging}
      onUnlockBonus={handleUnlockBonus}
      musicVolume={musicVolume}
      effectsVolume={effectsVolume}
      onMusicVolumeChange={setMusicVolume}
      onEffectsVolumeChange={setEffectsVolume}
    />
  );
};
