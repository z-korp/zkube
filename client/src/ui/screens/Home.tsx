import { Header } from "@/ui/containers/Header";
import { Create } from "../actions/Create";
import { Start } from "../actions/Start";
import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider";
import NextLine from "../components/NextLine";
import { Surrender } from "../actions/Surrender";
import { Content as Leaderboard } from "../modules/Leaderboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faStar,
  faWebAwesome,
} from "@fortawesome/free-solid-svg-icons";
import GoogleFormEmbed from "../components/GoogleFormEmbed";
import { useQuerySync } from "@dojoengine/react";
import { ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";

interface position {
  x: number;
  y: number;
}

export const Home = () => {
  const {
    setup: { toriiClient, contractComponents },
  } = useDojo();

  useQuerySync(toriiClient, contractComponents as any, []);

  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  const { game } = useGame({ gameId: player?.game_id || "0x0" });
  const [animationDone, setAnimationDone] = useState(false);

  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const testGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 3, 3, 3, 1, 0],
  ];

  const testEmptyGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const testline = [1, 0, 0, 2, 2, 0, 2, 2];

  const TetrisGrid = () => {
    // Définir les pièces avec leurs positions et tailles
    const pieces = [
      { size: 1, positions: [{ x: 1, y: 1 }] },
      {
        size: 2,
        positions: [
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ],
      },
      {
        size: 3,
        positions: [
          { x: 5, y: 4 },
          { x: 6, y: 4 },
          { x: 7, y: 4 },
        ],
      },
    ];

    // Fonction pour calculer le bounding box d'une pièce
    const getBoundingBox = (positions: position[]) => {
      const xs = positions.map((pos: position) => pos.x);
      const ys = positions.map((pos: position) => pos.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        x: minX,
        y: minY,
        width: (maxX - minX + 1) * 40,
        height: (maxY - minY + 1) * 40,
      };
    };

    return (
      <div className="relative w-[320px] h-[400px] bg-gray-800 grid grid-cols-8 grid-rows-10 gap-1">
        {/* Créer les cellules de la grille */}
        {[...Array(80)].map((_, index) => (
          <div
            key={index}
            className="w-full h-full bg-gray-700 border border-gray-600"
          ></div>
        ))}

        {/* Afficher les pièces */}
        {pieces.map((piece, pieceIndex) => {
          const { x, y, width, height } = getBoundingBox(piece.positions);
          return (
            <div
              key={pieceIndex}
              className="absolute bg-blue-500"
              style={{
                top: `${y * 40}px`,
                left: `${x * 40}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              {piece.positions.map((pos, cellIndex) => (
                <div
                  key={cellIndex}
                  className="w-8 h-8 bg-blue-500"
                  style={{
                    position: "absolute",
                    top: `${(pos.y - y) * 40}px`,
                    left: `${(pos.x - x) * 40}px`,
                  }}
                ></div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col h-screen">
      <Header />
      <BackGroundBoard imageBackground={imgAssets.imageBackground}>
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
            <div className="absolute flex flex-col items-center gap-4 w-full p-2 max-w-4xl mt-4">
              <Create />
              <Start mode={ModeType.Daily} />
              <Start mode={ModeType.Normal} />
              {!game && (
                <div className="absolute top md:translate-y-[100%] translate-y-[40%] bg-slate-900 w-11/12 p-6 rounded-xl">
                  <Leaderboard modeType={ModeType.Daily} />
                </div>
              )}
              {!!game && game.over && (
                <>
                  <div className="flex flex-col gap-4 mt-8 ">
                    <p className="text-4xl text-center">Game Over</p>
                    <div className="flex gap-4 justify-center items-center">
                      <div className="grow text-4xl flex gap-2 justify-end">
                        {game.score}
                        <FontAwesomeIcon
                          icon={faStar}
                          className="text-yellow-500 ml-2"
                        />
                      </div>
                      <div className="grow text-4xl flex gap-2 justify-end">
                        {game.combo}
                        <FontAwesomeIcon
                          icon={faFire}
                          className="text-slate-700 ml-2"
                        />
                      </div>
                      <div className="grow text-4xl flex gap-2 justify-end">
                        {game.max_combo}
                        <FontAwesomeIcon
                          icon={faWebAwesome}
                          className="text-slate-700 ml-2"
                        />
                      </div>
                    </div>
                  </div>
                  <motion.h1
                    className="md:text-2xl  md:mt-4 mt-2 md:p-4 p-2 bg-primary text-secondary rounded-lg"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  >
                    Give feedback and get a chance to win STRK
                  </motion.h1>
                  <GoogleFormEmbed />
                </>
              )}
              {!!game && !game.over && (
                <div className="relative w-full">
                  <div className="flex flex-col items-center">
                    <GameBoard
                      initialGrid={game.blocks}
                      nextLine={game.next_row}
                      score={game.score}
                      combo={game.combo}
                      maxCombo={game.max_combo}
                      hammerCount={game.hammer - game.hammer_used}
                      totemCount={game.totem - game.totem_used}
                      waveCount={game.wave - game.wave_used}
                    />
                    <NextLine numbers={game.next_row} />
                  </div>
                  <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0 sm:mb-4 flex justify-center sm:justify-end w-full">
                    <Surrender />
                  </div>
                </div>
              )}
            </div>
          </div>
          <AnimatePresence>
            {!animationDone && ( 
              <>
                <>
                  <PalmTree
                    image={imgAssets.palmRight}
                    initial="visibleRight"
                    animate="hiddenRight"
                    duration={3}
                    position="right"
                  />
                  <PalmTree
                    image={imgAssets.palmLeft}
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
