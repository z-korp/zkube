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
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { Surrender } from "../actions/Surrender";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import GoogleFormEmbed from "../components/GoogleFormEmbed";
import { ModeType } from "@/dojo/game/types/mode";
import { Level } from "@/dojo/game/types/level";
import { toPng } from "html-to-image";
import { Leaderboard } from "../modules/Leaderboard";
import { useRewardsCalculator } from "@/stores/rewardsStore";
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
import { ChevronLeft } from "lucide-react";
import CollectiveTreasureChest from "../components/TreasureChest";
import GameOverDialog from "../components/GameOverDialog";
import useViewport from "@/hooks/useViewport";
import { TweetPreview } from "../components/TweetPreview";
import { useGrid } from "@/hooks/useGrid";
import Tutorial from "../components/Tutorial/Tutorial";
import Swipper from "../components/Swipper";
import HeaderBalance from "../components/HeaderBalance";
import { useDojo } from "@/dojo/useDojo";
import { getSyncEntities } from "@dojoengine/state";
import * as torii from "@dojoengine/torii-client";
import { usePlayerId } from "@/hooks/usePlayerId";

const { VITE_PUBLIC_NAMESPACE, VITE_PUBLIC_OFFCHAIN } = import.meta.env;

export const Home = () => {
  useViewport();
  useRewardsCalculator();
  const isSigning = false; //useAutoSignup();

  const {
    setup: { toriiClient, contractComponents },
  } = useDojo();
  const { account } = useAccountCustom();
  usePlayerId({ playerAddress: account?.address });
  const { player } = usePlayer();

  const { game } = useGame({
    gameId: player?.game_id || "0x0",
    shouldLog: true,
  });
  const grid = useGrid({ gameId: game?.id ?? "", shouldLog: true });
  const [animationDone, setAnimationDone] = useState(false);

  const { theme, themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const gameGrid: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [level, setLevel] = useState<number | "">(0);
  const [score, setScore] = useState<number | undefined>(0);
  const [imgData, setImgData] = useState<string>("");

  const offchain = String(VITE_PUBLIC_OFFCHAIN).toLowerCase() === "true";

  useEffect(() => {
    if (offchain) return;
    const clause: torii.MemberClause = {
      model: `${VITE_PUBLIC_NAMESPACE}-Mint`,
      member: "id",
      operator: "Eq",
      value: {
        Primitive: {
          Felt252: account?.address,
        },
      },
    };

    const syncEntities = async () => {
      await getSyncEntities(
        toriiClient,
        contractComponents as any,
        { Member: clause },
        [],
        100,
        false,
      );
    };

    syncEntities();
  }, [account?.address]);

  // fetch here because Participation has double keys
  useEffect(() => {
    if (offchain) return;
    const clause: torii.KeysClause = {
      keys: [undefined, undefined],
      pattern_matching: "FixedLen",
      models: [`${VITE_PUBLIC_NAMESPACE}-Participation`],
    };

    const syncEntities = async () => {
      await getSyncEntities(
        toriiClient,
        contractComponents as any,
        { Keys: clause },
        [],
        10_000,
        false,
      );
    };

    syncEntities();
  }, [account?.address]);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  // State variables for modals
  const [isTournamentsOpen, setIsTournamentsOpen] = useState(false);

  // Tutorial state and handlers
  const [tutorialState, setTutorialState] = useState({
    isActive: false,
    showGrid: false,
    showText: true,
  });

  const handleTutorialCleanup = useCallback(() => {
    setTutorialState({
      isActive: false,
      showGrid: false,
      showText: false,
    });
  }, []);

  const startTutorial = useCallback(() => {
    try {
      setTutorialState((prev) => ({
        ...prev,
        isActive: true,
      }));
    } catch (error) {
      console.error("Failed to start tutorial:", error);
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
    setTutorialState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const composeTweet = useCallback(() => {
    setLevel(player?.points ? Level.fromPoints(player?.points).value : "");
    setScore(game?.score);
    setIsPreviewOpen(true);
  }, [game?.score, player?.points]);

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

  // Handlers for mobile buttons
  const handlePlay = () => {
    setIsGameOn("isOn"); // Start the game
  };

  const handleTournaments = () => {
    setIsTournamentsOpen(true); // Open Tournaments modal
  };

  const [chestIsOpen, setChestIsOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);

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

  /*useEffect(() => {
    console.log("==================> Grid is changing");
  }, [grid]);*/

  // Define render functions
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

          <Swipper setIsGameOn={() => setIsGameOn("isOn")}></Swipper>
        </DialogContent>
      </Dialog>

      <Button
        variant={"brutal"}
        onClick={() => setChestIsOpen(true)}
        className="w-full bg-primary text-secondary text-lg border-4  py-6 font-sans bg-sky-200  rounded-none"
      >
        Collective Chests
      </Button>

      <Leaderboard buttonType="brutal" textSize="lg" />
    </div>
  );

  return (
    <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
      <Header onStartTutorial={handleStartTutorial} />

      {/* Content Area */}
      <div className="flex flex-col flex-1 relative">
        <Dialog open={isSigning} modal>
          <DialogContent
            aria-describedby={undefined}
            className="flex flex-col items-center justify-center p-6"
          >
            <p className="mt-8 mb-7">Aligning the blocks for your signup...</p>
          </DialogContent>
        </Dialog>

        <CollectiveTreasureChest
          isOpen={chestIsOpen}
          onClose={() => setChestIsOpen(false)}
        />

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
                    {game && (
                      <GameOverDialog
                        isOpen={isGameOverOpen}
                        onClose={() => setIsGameOverOpen(false)}
                        game={game}
                      />
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

                        {!isTournamentsOpen && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="text-md md:text-2xl mt-2 md:p-4 p-2 bg-primary text-secondary rounded-lg">
                                Give feedback and get a chance to win STRK
                              </Button>
                            </DialogTrigger>

                            <DialogContent
                              aria-describedby={undefined}
                              className="sm:max-w-[700px] w-[95%] h-[580px] flex flex-col mx-auto justify-start items-center bg-opacity-50 rounded-lg shadow-lg"
                            >
                              <DialogHeader className="flex items-center">
                                <DialogTitle>Feedback</DialogTitle>
                              </DialogHeader>
                              <div className="flex-grow overflow-auto px-2 w-full h-full">
                                <GoogleFormEmbed />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
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
                            <Surrender />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <TweetPreview
              open={isPreviewOpen}
              setOpen={setIsPreviewOpen}
              level={level}
              score={score}
              imgSrc={imgData}
              gameId={game?.id ?? ""}
              tournamentId={game?.tournament_id ?? 0}
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
