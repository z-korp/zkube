import { useCallback, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { loadThemeTemplate } from "@/config/themes";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import { useQuests } from "@/contexts/quests";
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
  const { connector } = useAccount();
  const { username } = useControllerUsername();
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const { cubeBalance } = useCubeBalance();
  const navigate = useNavigationStore((s) => s.navigate);
  const { questFamilies } = useQuests();
  const imgAssets = ImageAssets(themeTemplate);

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

  return (
    <div className="h-screen-viewport flex flex-col">
      <TopBar
        cubeBalance={cubeBalance}
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
                label="NEW GAME"
                variant="orange"
                onClick={() => navigate("loadout")}
                disabled={false}
              />

              <NavButton
                label="MY GAMES"
                variant="purple"
                onClick={() => navigate("mygames")}
                badge={activeGames.length > 0 ? activeGames.length : undefined}
              />

              <NavButton
                label="LEADERBOARD"
                variant="blue"
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
