/* eslint-disable @typescript-eslint/no-explicit-any */
import { Header } from "@/ui/containers/Header";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { Button } from "@/ui/elements/button";
import { useMediaQuery } from "react-responsive";
import useViewport from "@/hooks/useViewport";
import HeaderBalance from "../components/HeaderBalance";
import { PlayFreeGame } from "../actions/PlayFreeGame";
import { useGame } from "@/hooks/useGame";
import Tutorial from "../components/Tutorial/Tutorial";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faStar,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import MaxComboIcon from "../components/MaxComboIcon";
import GameBoard from "../components/GameBoard";
import { useGrid } from "@/hooks/useGrid";
import useAccountCustom from "@/hooks/useAccountCustom";
import { Surrender } from "../actions/Surrender";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/elements/table";
import { useNavigate } from "react-router-dom";
import { useGameTokens } from "metagame-sdk/sql";
import type { GameTokenData } from "metagame-sdk";
import { getGameSystemAddress } from "@/utils/metagame";

const gameSystemAddress = getGameSystemAddress();

type TokenAttribute = {
  trait?: string;
  trait_type?: string;
  name?: string;
  value?: string | number;
  Value?: string | number;
  display_type?: string | number;
};

type TokenMetadata = {
  name?: string;
  description?: string;
  attributes?: TokenAttribute[];
};

type PlayerGameRow = {
  tokenId: number;
  name: string;
  score: string | number | undefined;
  combo: string | number | undefined;
  maxCombo: string | number | undefined;
  gameOver: boolean;
};

const parseTokenMetadata = (metadata: unknown): TokenMetadata | undefined => {
  if (!metadata) return undefined;
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return undefined;
    }
  }
  if (typeof metadata === "object") {
    return metadata as TokenMetadata;
  }
  return undefined;
};

const getAttributeValue = (
  attributes: TokenAttribute[],
  key: string,
): string | number | undefined => {
  const entry = attributes.find(
    (item) =>
      item?.trait === key || item?.trait_type === key || item?.name === key,
  );
  return entry?.value ?? entry?.Value ?? entry?.display_type;
};

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

  const [isGameOn] = useState<"idle" | "isOn" | "isOver">("idle");

  const navigate = useNavigate();

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

  const shouldFetchMyGames = Boolean(account?.address);
  const {
    games: ownedGames,
    loading: ownedGamesLoading,
    metadataLoading: ownedMetadataLoading,
    refetch: refetchOwnedGames,
  } = useGameTokens({
    owner: shouldFetchMyGames ? account?.address : undefined,
    sortBy: "minted_at",
    sortOrder: "desc",
    limit: shouldFetchMyGames ? 100 : 0,
    includeMetadata: true,
    gameAddresses: gameSystemAddress ? [gameSystemAddress] : undefined,
  });

  const playerGames: PlayerGameRow[] = useMemo(() => {
    if (!ownedGames?.length) return [];
    return ownedGames.map((game: GameTokenData) => {
      const metadata = parseTokenMetadata(game.metadata);
      const attributes = Array.isArray(metadata?.attributes)
        ? (metadata?.attributes as TokenAttribute[])
        : [];
      const scoreAttr = getAttributeValue(attributes, "Score");
      const comboAttr = getAttributeValue(attributes, "Combo");
      const maxComboAttr = getAttributeValue(attributes, "Max Combo");
      return {
        tokenId: game.token_id,
        name:
          metadata?.name || game.gameMetadata?.name || `Game #${game.token_id}`,
        score: scoreAttr ?? game.score ?? "-",
        combo: comboAttr ?? "-",
        maxCombo: maxComboAttr ?? "-",
        gameOver: Boolean(game.game_over),
      };
    });
  }, [ownedGames]);

  const myGamesLoading =
    shouldFetchMyGames && (ownedGamesLoading || ownedMetadataLoading);

  const formatStat = (value: string | number | undefined) => {
    if (value === undefined || value === null || value === "") {
      return "-";
    }
    return value.toString();
  };

  const renderMyGamesTable = (games: PlayerGameRow[]) => {
    if (!isMdOrLarger) {
      return (
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 hide-scrollbar">
          {games.map((game) => (
            <div
              key={game.tokenId}
              className="rounded-xl border border-white/20 bg-black/60 p-4 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-white">
                  <span className="text-slate-400 mr-1">#{game.tokenId}</span>
                  {game.name}
                </div>
                {!game.gameOver ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/play/${game.tokenId}`)}
                  >
                    Resume
                  </Button>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Finished
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div>
                  <p className="text-xs uppercase text-slate-400">Score</p>
                  <p className="text-base font-semibold">
                    {formatStat(game.score)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="overflow-x-auto">
          <div className="max-h-[320px] overflow-y-auto pr-2 hide-scrollbar">
            <Table className="min-w-[640px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-400">
                    Game
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-400">
                    Score
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-400">
                    Combo
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-400">
                    Max Combo
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.tokenId} className="text-base">
                    <TableCell>
                      <span className="text-slate-400 mr-1">
                        #{game.tokenId}
                      </span>
                      {game.name}
                    </TableCell>
                    <TableCell>{formatStat(game.score)}</TableCell>
                    <TableCell>{formatStat(game.combo)}</TableCell>
                    <TableCell>{formatStat(game.maxCombo)}</TableCell>
                    <TableCell>
                      {!game.gameOver ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/play/${game.tokenId}`)}
                        >
                          Play
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Completed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  const renderMyGamesContent = () => {
    if (!account?.address) {
      return <div>Connect your wallet to view your games.</div>;
    }
    if (myGamesLoading) {
      return <div>Loading...</div>;
    }
    if (!playerGames.length) {
      return <div>You have no games yet.</div>;
    }

    const activeGames = playerGames.filter((game) => !game.gameOver);
    const completedGames = playerGames.filter((game) => game.gameOver);

    return (
      <div className="space-y-6 px-1 sm:px-0">
        <div>
          <h3 className="text-lg font-semibold mb-2">In Progress</h3>
          {activeGames.length ? (
            renderMyGamesTable(activeGames)
          ) : (
            <p className="text-sm text-muted-foreground">
              No active games yet.
            </p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Finished</h3>
          {completedGames.length ? (
            renderMyGamesTable(completedGames)
          ) : (
            <p className="text-sm text-muted-foreground">
              No finished games yet.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Define render functions
  const MyGamesSection = () => (
    <div className="w-full max-w-4xl px-4 sm:px-0">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-black/70 via-slate-900/70 to-black/80 shadow-2xl backdrop-blur-xl p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">My Games</h2>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="rounded-full border border-white/20 px-3 py-1">
              {playerGames.length
                ? `${playerGames.length} saved`
                : "No games yet"}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchOwnedGames?.()}
              disabled={myGamesLoading}
              className="h-8 w-8 border-white/30 text-white hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </Button>
          </div>
        </div>
        <div className="mt-6">{renderMyGamesContent()}</div>
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-8 items-center justify-center mt-4">
        <PlayFreeGame onMintSuccess={refetchOwnedGames} />
      </div>
      <div className="flex w-full justify-center mt-6">
        <MyGamesSection />
      </div>
    </>
  );

  const renderMobileView = () => (
    <div className="flex flex-col w-full gap-6 px-4 mt-4 items-center">
      <div className="w-[300px]">
        <PlayFreeGame onMintSuccess={refetchOwnedGames} />
      </div>
      <MyGamesSection />
    </div>
  );

  return (
    <div
      className="h-screen-viewport flex flex-col w-full overflow-auto hide-scrollbar"
      id="portal-root"
    >
      <Header onStartTutorial={startTutorial} showTutorial={true} />

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
            <div className="relative flex flex-col gap-4 sm:gap-8 flex-grow items-center justify-start overflow-auto hide-scrollbar h-full">
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

                    {!!game && isGameOn === "isOver" && (
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
