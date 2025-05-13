import { Header } from "@/ui/containers/Header";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { useMediaQuery } from "react-responsive";
import useViewport from "@/hooks/useViewport";
import HeaderBalance from "../components/HeaderBalance";
import { PlayFreeGame } from "../actions/PlayFreeGame";
import { useGame } from "@/hooks/useGame";
import Tutorial from "../components/Tutorial/Tutorial";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import MaxComboIcon from "../components/MaxComboIcon";
import GameBoard from "../components/GameBoard";
import { useGrid } from "@/hooks/useGrid";
import useAccountCustom from "@/hooks/useAccountCustom";
import { Surrender } from "../actions/Surrender";

export const Home = () => {
  useViewport();
  const { account } = useAccountCustom();
  const [animationDone, setAnimationDone] = useState(false);

  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

  const { game } = useGame({
    gameId: 0,
    shouldLog: true,
  });

  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: true });

  const gameGrid: React.RefObject<HTMLDivElement> | null = useRef(null);

  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");

  // State variables for modals
  const [isTournamentsOpen, setIsTournamentsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const [tutorialState, setTutorialState] = useState({
    isActive: false,
    showGrid: false,
    showText: true,
  });

  const endTutorial = useCallback(() => {
    setTutorialState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const startTutorial = useCallback(() => {
    setTutorialState({
      isActive: true,
      showGrid: true,
      showText: true,
    });
  }, []);

  // Define render functions
  const renderDesktopView = () => (
    <>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-center justify-center">
        <PlayFreeGame />
      </div>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-start justify-center">
        <Button
          variant="default"
          onClick={() => console.log("Play")}
          className="w-[150px]"
        >
          My Games
        </Button>
      </div>
    </>
  );

  const renderMobileView = () => (
    <div className="flex flex-col w-full gap-4 px-4 mt-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-primary text-white text-lg py-6 border-4 shadow-lg bg-sky-900 font-sans rounded-none"
            variant="brutal"
          >
            Play !
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95%]  flex flex-col justify-center p-8">
          <DialogHeader className="flex flex-row gap-3 items-center justify-center w-full space-y-0">
            <HeaderBalance />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
      <Header onStartTutorial={startTutorial} />

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
                {tutorialState.isActive ? (
                  <Tutorial
                    showGrid={tutorialState.showGrid}
                    endTutorial={endTutorial}
                  />
                ) : (
                  <>
                    {(!game || (!!game && isGameOn === "isOver")) && (
                      <>
                        {isMdOrLarger
                          ? renderDesktopView()
                          : renderMobileView()}
                      </>
                    )}

                    {!!game && isGameOn === "isOver" && !isTournamentsOpen && (
                      <>
                        <div className="flex flex-col gap-4 mt-4 md:mt-0">
                          <div className="p-6 rounded-lg shadow-lg w-full h-full bg-gray-900 m-2">
                            <p className="text-4xl text-center mb-2">
                              Game Over
                            </p>

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
                )}
              </div>
            </div>
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
