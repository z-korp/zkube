import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { Surrender } from "../actions/Surrender";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import MaxComboIcon from "../components/MaxComboIcon";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";
import GameOverDialog from "../components/GameOverDialog";
import useViewport from "@/hooks/useViewport";
import { TweetPreview } from "../components/TweetPreview";
import { useGrid } from "@/hooks/useGrid";
import { useParams, Navigate } from "react-router-dom";
import { Header } from "@/ui/containers/Header";

export const Play = () => {
  useViewport();

  const { gameId: gameIdParam } = useParams<{ gameId: string }>();
  const { account } = useAccountCustom();

  // Move all hook calls before any conditional returns
  // If no gameId is provided, default to 0
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : 0;

  const { game } = useGame({
    gameId: gameId,
    shouldLog: true,
  });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: true });
  const [animationDone, setAnimationDone] = useState(false);

  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const gameGrid = useRef<HTMLDivElement>(null);
  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [score, setScore] = useState<number | undefined>(0);
  const [imgData, setImgData] = useState<string>("");
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const composeTweet = useCallback(() => {
    setScore(game?.score);
    setIsPreviewOpen(true);
  }, [game?.score]);

  useEffect(() => {
    if (game?.over) {
      if (gameGrid && gameGrid.current !== null) {
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
  }, [composeTweet, game?.over]);

  useEffect(() => {
    // Check if game is defined and not over
    // the !!game is important to not display the twitter screen
    if (!!game && !game.over) {
      setIsGameOn("isOn");
    } else {
      setIsGameOn("isOver");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.over]);

  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      // Check if game.over transitioned from false to true
      if (!prevGameOverRef.current && game?.over) {
        setIsGameOverOpen(true);
      }
    }
    // Update the ref with the current value of game.over
    prevGameOverRef.current = game?.over;
  }, [game?.over]);

  // Optional: Redirect to home if no gameId is provided
  // This conditional return comes AFTER all hook calls
  if (!gameIdParam) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
      <Header onStartTutorial={() => {}} showTutorial={false} />
      {/* Content Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Main Content */}
        <BackGroundBoard imageBackground={imgAssets.imageBackground}>
          <BackGroundBoard
            imageBackground={imageTotemTheme}
            initial={{ scale: 1 }}
            animate={isMdOrLarger ? { scale: [1, 0.995, 1] } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <div className="relative flex flex-col gap-4 sm:gap-8 flex-grow items-center justify-start overflow-auto h-full">
              <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl mt-2 sm:mt-4 p-2 md:p-0 h-full">
                <>
                  {game && (
                    <GameOverDialog
                      isOpen={isGameOverOpen}
                      onClose={() => setIsGameOverOpen(false)}
                      game={game}
                    />
                  )}
                  {!!game && isGameOn === "isOver" && (
                    <>
                      <div className="flex flex-col gap-4 mt-4 md:mt-0">
                        <div className="p-6 rounded-lg shadow-lg w-full h-full bg-gray-900 m-2">
                          <p className="text-4xl text-center mb-2">Game Over</p>

                          <div className="flex gap-4 justify-center items-center">
                            <div className="grow text-4xl flex gap-2 justify-end">
                              {game.score}
                              <FontAwesomeIcon
                                icon={faStar}
                                className="text-yellow-500"
                              />
                            </div>
                            <div className="grow text-4xl flex gap-2 justify-end">
                              {game.combo}
                              <FontAwesomeIcon
                                icon={faFire}
                                className="text-slate-700"
                              />
                            </div>
                            <div className="grow text-4xl flex gap-2 justify-end">
                              {game.max_combo}
                              <MaxComboIcon
                                width={36}
                                height={36}
                                className="text-slate-700"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {!!game && isGameOn === "isOn" && (
                    <div className="relative w-full">
                      <div
                        ref={gameGrid}
                        className="flex flex-col items-center game-container"
                      >
                        <GameBoard
                          // Check if game is over because otherwise we can display
                          // previous game data on the board while the new game is starting
                          // and torii indexing
                          initialGrid={grid}
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
                          game={game}
                        />
                      </div>
                      {isMdOrLarger && (
                        <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0 sm:mb-4 flex justify-center sm:justify-end w-full">
                          <Surrender gameId={game.id} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>
            </div>
            <TweetPreview
              open={isPreviewOpen}
              setOpen={setIsPreviewOpen}
              score={score}
              imgSrc={imgData}
            />
            <AnimatePresence>
              {!animationDone && (
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
              )}
            </AnimatePresence>
          </BackGroundBoard>
        </BackGroundBoard>
      </div>
    </div>
  );
};
