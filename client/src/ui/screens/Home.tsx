import { Header } from "@/ui/containers/Header";
import { Create } from "../actions/Create";
import { Start } from "../actions/Start";
import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import imageBackground from "/assets/theme-2-1.png";
import imageTotemDark from "/assets/theme-2-totem-dark.png";
import imageTotemLight from "/assets/theme-2-totem-light.png";
import palmLeft from "/assets/palmtree-left.png";
import palmRight from "/assets/palmtree-right.png";
import PalmTree from "../components/PalmTree";
import { Game } from "@/dojo/game/models/game";
import { GameBonus } from "../containers/GameBonus";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider";

export const Home = () => {
  const {
    account: { account },
  } = useDojo();
  const { player } = usePlayer({ playerId: account.address });
  const { game } = useGame({ gameId: player?.game_id || "0x0" });
  const [animationDone, setAnimationDone] = useState(false);

  const { theme } = useTheme();
  const imageTotemTheme = theme === "dark" ? imageTotemDark : imageTotemLight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!game) return null;

  return (
    <div className="relative flex flex-col">
      <Header />

      <BackGroundBoard imageBackground={imageBackground}>
        <BackGroundBoard
          imageBackground={imageTotemTheme}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 0.995, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <div className="relative flex flex-col gap-8 grow items-center justify-start">
            <div className="absolute top-10 flex flex-col items-center gap-4 w-full p-4 max-w-4xl">
              <GameBonus />
              <GameBoard initialGrid={game.blocks} />
              <Create />
              <Start />
            </div>
          </div>
          <AnimatePresence>
            {!animationDone && (
              <>
                <>
                  <PalmTree
                    image={palmRight}
                    initial="visibleRight"
                    animate="hiddenRight"
                    duration={3}
                    position="right"
                  />
                  <PalmTree
                    image={palmLeft}
                    initial="visibleLeft"
                    animate="hiddenLeft"
                    duration={3}
                    position="left"
                  />
                </>
              </>
            )}
          </AnimatePresence>
        </BackGroundBoard>
      </BackGroundBoard>
    </div>
  );
};
