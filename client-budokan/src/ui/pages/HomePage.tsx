import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { useDojo } from "@/dojo/useDojo";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { loadThemeTemplate } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import { useQuests } from "@/contexts/quests";
import { showToast } from "@/utils/toast";
import ImageAssets from "@/ui/theme/ImageAssets";
import TopBar from "@/ui/navigation/TopBar";
import NavButton from "@/ui/components/shared/NavButton";
import Connect from "@/ui/components/Connect";
import useViewport from "@/hooks/useViewport";

const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const HomePage: React.FC = () => {
  useViewport();

  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { connector } = useAccount();
  const { username } = useControllerUsername();
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const { questFamilies } = useQuests();
  const imgAssets = ImageAssets(themeTemplate);
  const [isStartingGame, setIsStartingGame] = useState(false);

  useEffect(() => {
    setThemeTemplate(loadThemeTemplate(), false);
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist, setThemeTemplate]);

  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = normalizeAddress(account?.address);

  const { games: ownedGames } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
  });

  const activeGames = useMemo(() => {
    if (!ownedGames?.length) return [];
    return ownedGames.filter((g) => !g.game_over);
  }, [ownedGames]);

  const claimableQuestCount = useMemo(
    () => questFamilies.filter((f) => f.claimableTier !== null).length,
    [questFamilies],
  );

  const handleProfile = useCallback(() => {
    if (!account) return;
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile();
    }
  }, [account, connector]);

  const handleTrophies = useCallback(() => {
    if (!account) return;
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile("trophies");
    }
  }, [account, connector]);

  const handleStartGame = useCallback(async () => {
    if (!account || isStartingGame) return;

    setIsStartingGame(true);
    try {
      const mintResult = await freeMint({
        account,
        name: username ?? "",
        settingsId: DEFAULT_SETTINGS_ID,
      });

      const gameId = mintResult.game_id;
      if (!gameId) throw new Error("Failed to extract game_id from mint");

      await create({
        account,
        token_id: gameId,
      });

      showToast({
        message: `Game #${gameId} started!`,
        type: "success",
      });

      navigate("map", gameId);
    } catch (error) {
      console.error("Error starting game:", error);
      showToast({
        message: "Failed to start game. Check My Games if a token was minted.",
        type: "error",
      });
    } finally {
      setIsStartingGame(false);
    }
  }, [account, create, freeMint, isStartingGame, navigate, username]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <TopBar
        cubeBalance={0n}
        onTutorial={() => navigate("tutorial")}
        onQuests={() => navigate("quests")}
        onTrophies={handleTrophies}
        onSettings={() => navigate("settings")}
        onProfile={handleProfile}
        username={username}
        claimableQuestCount={claimableQuestCount}
      />

      <div className="flex-1 flex flex-col items-center justify-start px-6 gap-3 pt-4">
        {imgAssets.logo && (
          <motion.img
            src={imgAssets.logo}
            alt="zKube"
            draggable={false}
            className="w-48 md:w-64 lg:w-80 max-w-[340px] drop-shadow-2xl"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <div className="flex flex-col items-center gap-3 w-full mt-2">
          {!account ? (
            <Connect />
          ) : (
            <>
              <NavButton
                label={isStartingGame ? "STARTING..." : "NEW GAME"}
                variant="orange"
                onClick={handleStartGame}
                disabled={isStartingGame}
              />

              <NavButton
                label="MY GAMES"
                variant="purple"
                onClick={() => navigate("mygames")}
                badge={activeGames.length > 0 ? activeGames.length : undefined}
              />

              <NavButton
                label="DAILY CHALLENGE"
                variant="blue"
                onClick={() => navigate("dailychallenge")}
              />

              <NavButton
                label="LEADERBOARD"
                variant="purple"
                onClick={() => navigate("leaderboard")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
