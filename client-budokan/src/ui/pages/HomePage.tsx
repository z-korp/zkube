import { useCallback, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import TopBar from "@/ui/navigation/TopBar";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
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
  const { themeTemplate } = useTheme();
  const { setMusicContext } = useMusicPlayer();
  const { cubeBalance } = useCubeBalance();
  const navigate = useNavigationStore((s) => s.navigate);
  const imgAssets = ImageAssets(themeTemplate);

  useEffect(() => {
    setMusicContext("main");
  }, [setMusicContext]);

  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = normalizeAddress(account?.address);

  const { games: ownedGames } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
    forceRecs: true,
  });

  const activeGames = useMemo(() => {
    if (!ownedGames?.length) return [];
    return ownedGames.filter((g) => !g.game_over);
  }, [ownedGames]);

  const handleProfile = useCallback(() => {
    if (!account) return;
  }, [account]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />

      <TopBar
        cubeBalance={cubeBalance}
        onTutorial={() => navigate("tutorial")}
        onQuests={() => navigate("quests")}
        onTrophies={() => {}}
        onSettings={() => navigate("settings")}
        onProfile={handleProfile}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 pb-12">
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

        <div className="flex flex-col items-center gap-3 w-full mt-4">
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
                label="SHOP"
                variant="green"
                onClick={() => navigate("shop")}
              />

              <NavButton
                label="LEADERBOARD"
                variant="blue"
                onClick={() => navigate("leaderboard")}
              />
            </>
          )}
        </div>

        <div className="mt-auto pt-8">
          <p className="text-xs text-slate-500 text-center">
            Built on Starknet with Dojo
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
