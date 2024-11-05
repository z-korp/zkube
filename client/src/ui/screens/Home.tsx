import { Header } from "@/ui/containers/Header";
import { Create } from "../actions/Create";
import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { Surrender } from "../actions/Surrender";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import GoogleFormEmbed from "../components/GoogleFormEmbed";
import { useQuerySync } from "@dojoengine/react";
import { ModeType } from "@/dojo/game/types/mode";
import { Level } from "@/dojo/game/types/level";
import { toPng } from "html-to-image";
import { Leaderboard } from "../modules/Leaderboard";
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
import GameModeCard from "../components/GameModeCard";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";
import { Start } from "../actions/Start";
import { ChevronLeft } from "lucide-react";
import CollectiveTreasureChest from "../components/TreasureChest";
import GameOverDialog from "../components/GameOverDialog";
import useViewport from "@/hooks/useViewport";
import { TweetPreview } from "../components/TweetPreview";
import { Schema } from "@dojoengine/recs";
import { useGrid } from "@/hooks/useGrid";
import { useRewardsCalculator } from "@/stores/rewardsStore";

export const Home = () => {
  const {
    setup: { toriiClient, contractComponents },
  } = useDojo();

  useViewport();
  useRewardsCalculator();

  useQuerySync<Schema>(toriiClient, contractComponents as any, []);

  const isSigning = false;
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { game } = useGame({
    gameId: player?.game_id || "0x0",
    shouldLog: true,
  });
  const grid = useGrid({ gameId: game?.id ?? "", shouldLog: true });
  
  // State declarations
  const [animationDone, setAnimationDone] = useState(false);
  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [level, setLevel] = useState<number | "">(0);
  const [score, setScore] = useState<number | undefined>(0);
  const [imgData, setImgData] = useState<string>("");
  const [isTournamentsOpen, setIsTournamentsOpen] = useState(false);
  const [chestIsOpen, setChestIsOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [tutorialState, setTutorialState] = useState({
    isActive: false,
    showGrid: false,
    showText: true,
  });

  // Refs
  const gameGrid = useRef<HTMLDivElement>(null);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);

  // Theme setup
  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const imageTotemTheme = theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;
  
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  // Callbacks
  const composeTweet = useCallback(() => {
    setLevel(player?.points ? Level.fromPoints(player?.points).value : "");
    setScore(game?.score);
    setIsPreviewOpen(true);
  }, [game?.score, player?.points]);

  const handleTutorialCleanup = useCallback(() => {
    setTutorialState({
      isActive: false,
      showGrid: false,
      showText: false,
    });
  }, []);

  const startTutorial = useCallback(() => {
    try {
      setTutorialState(prev => ({
        ...prev,
        isActive: true,
      }));
    } catch (error) {
      console.error('Failed to start tutorial:', error);
      handleTutorialCleanup();
    }
  }, [handleTutorialCleanup]);

  const handleStartTutorial = useCallback(() => {
    setTutorialState({
      isActive: true,
      showGrid: true,
      showText: false,
    });
    startTutorial();
  }, [startTutorial]);

  const endTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  // Effects
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
  }, [composeTweet, game?.over]);

  useEffect(() => {
    if (!!game && !game.over) {
      setIsGameOn("isOn");
    } else {
      setIsGameOn("isOver");
    }
  }, [game?.over]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      handleTutorialCleanup();
    };
  }, [handleTutorialCleanup]);

  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && game?.over) {
        setIsGameOverOpen(true);
      }
    }
    prevGameOverRef.current = game?.over;
  }, [game?.over]);

  // Render functions
  const renderDesktopView = () => (
    <>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-center justify-center">
        <GameModeCard
          mode={ModeType.Free}
          handleGameMode={() => setIsGameOn("isOn")}
        />
      </div>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-start justify-center">
        <GameModeCard
          mode={ModeType.Daily}
          handleGameMode={() => setIsGameOn("isOn")}
        />
        <GameModeCard
          mode={ModeType.Normal}
          handleGameMode={() => setIsGameOn("isOn")}
        />
      </div>
    </>
  );

  const renderTournamentsView = () => (
    <div className="flex flex-col sm:flex-row w-full gap-6 sm:gap-8 items-center justify-center">
      <div className="flex justify-center items-center w-full relative h-[36px]">
        <Button
          onClick={() => setIsTournamentsOpen(false)}
          className="flex items-center absolute left-0 top-0 p-0 pr-2"
          variant="default"
        >
          <ChevronLeft /> Back
        </Button>
        <h1 className="text-center text-2xl font-bold">Tournaments</h1>
      </div>

      <GameModeCard
        mode={ModeType.Daily}
        handleGameMode={() => setIsGameOn("isOn")}
      />
      <GameModeCard
        mode={ModeType.Normal}
        handleGameMode={() => setIsGameOn("isOn")}
      />
    </div>
  );

  const renderMobileView = () => (
    <div className="flex flex-col w-full gap-4 px-4 mt-4">
      <Start mode={ModeType.Free} handleGameMode={() => setIsGameOn("isOn")} />
      <Button
        onClick={() => setIsTournamentsOpen(true)}
        className="w-full bg-primary text-secondary text-lg py-6 border-4 shadow-lg bg-sky-200 font-sans rounded-none"
      >
        <p>Tournaments</p>
      </Button>
      <Button
        onClick={() => setChestIsOpen(true)}
        className="w-full bg-primary text-secondary text-lg border-4 py-6 font-sans bg-sky-200 rounded-none"
      >
        Collective Chests
      </Button>
      <Leaderboard buttonType="default" textSize="lg" />
    </div>
  );

  return (
    <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
      <Header onStartTutorial={handleStartTutorial} />
      
      <div className="flex flex-col flex-1 relative">
        {/* Signing Dialog */}
        <Dialog open={isSigning} modal>
          <DialogContent className="flex flex-col items-center justify-center p-6">
            <p className="mt-8 mb-7">Aligning the blocks for your signup...</p>
          </DialogContent>
        </Dialog>

        {/* Treasure Chest */}
        <CollectiveTreasureChest
          isOpen={chestIsOpen}
          onClose={() => setChestIsOpen(false)}
        />

        {/* Main Game Area */}
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
            <div className="relative flex flex-col gap-4 sm:gap-8 flex-grow items-center justify-start overflow-auto">
              <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl mt-2 sm:mt-4 p-2 md:p-0">
                {/* Game Content */}
                {!isSigning && <Create />}
                
                {(!game || (!!game && isGameOn === "isOver")) && (
                  <>
                    {isMdOrLarger
                      ? renderDesktopView()
                      : isTournamentsOpen
                        ? renderTournamentsView()
                        : renderMobileView()}
                  </>
                )}

                {/* Game Over Dialog */}
                {game && (
                  <GameOverDialog
                    isOpen={isGameOverOpen}
                    onClose={() => setIsGameOverOpen(false)}
                    game={game}
                  />
                )}

                {/* Active Game Board */}
                {!!game && isGameOn === "isOn" && (
                  <div className="relative w-full">
                    <div
                      ref={gameGrid}
                      className="flex flex-col items-center game-container"
                    >
                      <GameBoard
                        initialGrid={game.isOver() ? [] : game.blocks}
                        nextLine={game.isOver() ? [] : game.next_row}
                        score={game.isOver() ? 0 : game.score}
                        combo={game.isOver() ? 0 : game.combo}
                        maxCombo={game.isOver() ? 0 : game.max_combo}
                        hammerCount={game.isOver() ? 0 : game.hammer - game.hammer_used}
                        totemCount={game.isOver() ? 0 : game.totem - game.totem_used}
                        waveCount={game.isOver() ? 0 : game.wave - game.wave_used}
                        account={account}
                        game={game}
                      />
                    </div>
                    {isMdOrLarger && (
                      <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0 sm:mb-4 flex justify-center sm:justify-end w-full">
                        <Surrender />
                      </div>
                    )}
                  </div>
                )}

                {/* Tutorial */}
                {tutorialState.isActive && (
                  <Tutorial
                    showGrid={tutorialState.showGrid}
                    showTutorialText={tutorialState.showText}
                    tutorial={tutorialState.isActive}
                    endTutorial={endTutorial}
                  />
                )}
              </div>
            </div>

            {/* Tweet Preview */}
            <TweetPreview
              open={isPreviewOpen}
              setOpen={setIsPreviewOpen}
              level={level}
              score={score}
              imgSrc={imgData}
              gameId={game?.id ?? ""}
              tournamentId={game?.tournament_id ?? 0}
            />

            {/* Palm Tree Animations */}
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