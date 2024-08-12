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
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider";
import NextLine from "../components/NextLine";
import { Surrender } from "../actions/Surrender";
import { Content as Leaderboard } from "../modules/Leaderboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKhanda, faStar } from "@fortawesome/free-solid-svg-icons";
import { DifficultyType } from "@/dojo/game/types/difficulty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/elements/select";

function getEnumValues<T extends { [key: string]: string | number }>(
  enumObject: T,
): Array<T[keyof T]> {
  return Object.keys(enumObject)
    .filter((key) => isNaN(Number(key)))
    .map((key) => enumObject[key as keyof T]);
}

export const Test = () => {
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

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType>(
    DifficultyType.Easy,
  );

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value as DifficultyType);
  };

  useEffect(() => {
    console.log(selectedDifficulty);
  }, [selectedDifficulty]);

  return (
    <div className="relative flex flex-col h-screen">
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
            <div className="absolute flex flex-col items-center gap-4 w-full p-4 max-w-4xl">
              <Create />
              <Start difficulty={selectedDifficulty} />
              {!game && (
                <>
                  {" "}
                  <div className="absolute top translate-y-[100%] bg-slate-900 w-[500px] p-6 rounded-xl">
                    <Leaderboard />
                  </div>
                  <Select
                    onValueChange={handleDifficultyChange}
                    value={selectedDifficulty || undefined}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEnumValues(DifficultyType)
                        .filter((e) => e !== DifficultyType.None)
                        .map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {!!game && game.over && (
                <div className="flex flex-col gap-4 absolute top translate-y-[325%]">
                  <p className="text-4xl">Game Over</p>
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
                        icon={faKhanda}
                        className="text-slate-500 ml-2"
                      />
                    </div>
                  </div>
                </div>
              )}
              {!!game && !game.over && (
                <div className="relative w-full">
                  <div className="flex flex-col items-center">
                    <GameBoard
                      initialGrid={game.blocks}
                      nextLine={game.next_row}
                      score={game.score}
                      combo={game.combo}
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
