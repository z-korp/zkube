import { Header } from "@/ui/containers/Header";
import { Create } from "../actions/Create";
import { Start } from "../actions/Start";
import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider";
import { Surrender } from "../actions/Surrender";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import GoogleFormEmbed from "../components/GoogleFormEmbed";
import { useQuerySync } from "@dojoengine/react";
import { ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";
import { Level } from "@/dojo/game/types/level";
import { toPng } from "html-to-image";
import { LeaderboardContent } from "../modules/Leaderboard";
import { useMediaQuery } from "react-responsive";
import { useRewardsCalculator } from "@/stores/rewardsStore";
import Tutorial from "./Tutorial";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import MaxComboIcon from "../components/MaxComboIcon";

export const Home = () => {
  const {
    setup: { toriiClient, contractComponents },
  } = useDojo();

  useRewardsCalculator();

  useQuerySync(toriiClient, contractComponents as any, []);

  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  const { game } = useGame({ gameId: player?.game_id || "0x0" });
  const [animationDone, setAnimationDone] = useState(false);

  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const gameGrid: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [level, setLevel] = useState<number | "">(0);
  const [score, setScore] = useState<number | undefined>(0);
  const [imgData, setImgData] = useState<string>("");

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  useEffect(() => {
    if (game?.over) {
      if (gameGrid.current !== null) {
        toPng(gameGrid.current, { cacheBust: true })
          .then((dataUrl) => {
            setImgData(dataUrl);
            composeTweet();
          })
          .catch((err) => {
            console.error(`Screenshot failed`, err);
          });
      }
      setIsGameOn("isOver");
    }
  }, [game?.over, isUnmounting]);

  useEffect(() => {
    if (!!game && !game.over) {
      setIsGameOn("isOn");
    } else {
      setIsGameOn("isOver");
    }
  }, [game?.over]);

  const composeTweet = () => {
    setLevel(player?.points ? Level.fromPoints(player?.points).value : "");
    setScore(game?.score);
    setIsPreviewOpen(true);
  };

  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showTutorialText, setShowTutorialText] = useState(true);

  const startTutorial = () => {
    setIsTutorialActive(true);
  };

  const handleStartTutorial = () => {
    setShowGrid(true);
    startTutorial();
    setShowTutorialText(false);
  };

  return (
    <div className="relative flex flex-col h-screen">
      <Header onStartTutorial={handleStartTutorial} />
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
              {isTutorialActive ? (
                <Tutorial
                  showGrid={showGrid}
                  showTutorialText={showTutorialText}
                  tutorial={isTutorialActive}
                  setTutorial={setIsTutorialActive}
                />
              ) : (
                <>
                  <Create />
                  {(!game || (!!game && isGameOn === "isOver")) && (
                    <div className="flex flex-col sm:flex-row p-2 sm:p-4 rounded-xl w-[93%] gap-2 sm:gap-4 items-center justify-evenly">
                      <Start
                        mode={ModeType.Daily}
                        handleGameMode={() => setIsGameOn("isOn")}
                      />
                      <Start
                        mode={ModeType.Normal}
                        handleGameMode={() => setIsGameOn("isOn")}
                      />
                    </div>
                  )}
                  {!game && (
                    <div className="bg-slate-900 w-11/12 p-4 rounded-xl mb-4 max-h-[55vh]">
                      <LeaderboardContent />
                    </div>
                  )}
                  {!!game && isGameOn === "isOver" && (
                    <>
                      <div className="flex flex-col gap-4 mt-8 ">
                        <div className=" p-6 rounded-lg shadow-lg w-full h-full bg-gray-900 m-2">
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
                              <MaxComboIcon
                                width={36}
                                height={36}
                                className={`text-slate-700 ml-2 `}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="md:text-2xl md:mt-4 mt-2 md:p-4 p-2 bg-primary text-secondary rounded-lg">
                              Give feedback and get a chance to win STRK
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="flex items-center justify-centerbg-opacity-50">
                            <div className="flex flex-col h-[90vh] w-[90vw] max-w-4xl rounded-lg shadow-lg">
                              <DialogHeader className="flex items-center">
                                <DialogTitle>Feedback</DialogTitle>
                              </DialogHeader>
                              <div className="flex-grow overflow-auto px-2">
                                <GoogleFormEmbed />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    </>
                  )}
                  {!!game && isGameOn === "isOn" && (
                    <div className="relative w-full">
                      <div
                        ref={gameGrid}
                        className="flex flex-col items-center"
                      >
                        <GameBoard
                          // check if game is over because otherwise we can display
                          // previous game data on the board while the new game is starting
                          // and torii indexing
                          initialGrid={game.isOver() ? [] : game.blocks}
                          nextLine={game.isOver() ? [] : game.next_row}
                          score={game.isOver() ? 0 : game.score}
                          combo={game.isOver() ? 0 : game.combo}
                          maxCombo={game.isOver() ? 0 : game.max_combo}
                          hammerCount={
                            game.isOver() ? 0 : game.hammer - game.hammer_used
                          }
                          totemCount={
                            game.isOver() ? 0 : game.totem - game.totem_used
                          }
                          waveCount={
                            game.isOver() ? 0 : game.wave - game.wave_used
                          }
                          account={account}
                        />
                      </div>
                      <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0 sm:mb-4 flex justify-center sm:justify-end w-full">
                        <Surrender setIsUnmounting={setIsUnmounting} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/*<TweetPreview
            open={isPreviewOpen}
            setOpen={setIsPreviewOpen}
            level={level}
            score={score}
            imgSrc={imgData}
          />*/}
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
