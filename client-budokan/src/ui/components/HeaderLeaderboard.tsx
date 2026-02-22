import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/elements/table";
import { RotateCw } from "lucide-react";
import { useGameTokens } from "metagame-sdk/sql";
import type { GameTokenData } from "metagame-sdk";
import {
  getGameSystemAddress,
  getLeaderboardExcludedNames,
  normalizeAddress,
} from "@/utils/metagame";
import { useLeaderboardSlot, type LeaderboardEntry } from "@/hooks/useLeaderboardSlot";

const gameSystemAddress = getGameSystemAddress();
const excludedLeaderboardNames = getLeaderboardExcludedNames();
const excludedLeaderboardNameSet = new Set(excludedLeaderboardNames);

// Check if we should skip metagame SDK (not available on slot/sepolia)
const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const useRecsOnly = VITE_PUBLIC_DEPLOY_TYPE === "slot" || VITE_PUBLIC_DEPLOY_TYPE === "sepolia";

interface HeaderLeaderboardProps {
  buttonType?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "brutal";
  textSize?: "sm" | "md" | "lg";
}

export const HeaderLeaderboard: React.FC<HeaderLeaderboardProps> = ({
  buttonType = "default",
  textSize = "lg",
}) => {
  const [page, setPage] = React.useState(1);
  const [copiedTokenId, setCopiedTokenId] = React.useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  // Use metagame SDK only for mainnet (relayer not available on slot/sepolia)
  const metagameResult = useGameTokens({
    sortBy: "score",
    sortOrder: "desc",
    limit: !useRecsOnly ? 100 : 0, // Only query if mainnet
    includeMetadata: true,
    gameAddresses: gameSystemAddress ? [gameSystemAddress] : undefined,
  });

  // Check if metagame SDK failed to return results (only relevant for mainnet)
  const metagameFailed = !useRecsOnly && 
    !metagameResult.loading && 
    (!metagameResult.games || metagameResult.games.length === 0);

  // Use RECS query for slot/sepolia OR as fallback when metagame fails on mainnet
  const slotResult = useLeaderboardSlot();

  // Use RECS for slot/sepolia, metagame for mainnet (with RECS fallback)
  const { games, loading, refetch } = useRecsOnly 
    ? { games: slotResult.games, loading: slotResult.loading, refetch: slotResult.refetch }
    : metagameFailed
      ? { games: slotResult.games, loading: slotResult.loading, refetch: slotResult.refetch }
      : { games: metagameResult.games, loading: metagameResult.loading, refetch: () => {} };

  const filteredGames = React.useMemo(() => {
    if (excludedLeaderboardNameSet.size === 0) {
      return games;
    }
    return games.filter((game: GameTokenData | LeaderboardEntry) => {
      if (game.game_id === 0) return true;
      const playerName = game.player_name?.toLowerCase();
      return !(playerName && excludedLeaderboardNameSet.has(playerName));
    });
  }, [games]);

  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedGames = filteredGames.slice(startIdx, endIdx);
  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
  const handleCopyPlayerAddress = React.useCallback(
    async (address: string | undefined, tokenId: string) => {
      if (!address) return;
      try {
        await navigator.clipboard.writeText(address);
        setCopiedTokenId(tokenId);
        setTimeout(
          () => setCopiedTokenId((prev) => (prev === tokenId ? null : prev)),
          1500,
        );
      } catch (err) {
        console.error("Failed to copy player address", err);
      }
    },
    [],
  );

  // Type guard for slot mode entries
  const getGameLevel = (game: GameTokenData | LeaderboardEntry): number => {
    if ('level' in game) return game.level;
    return 1;
  };

  const getGameCubes = (game: GameTokenData | LeaderboardEntry): number => {
    if ('totalCubes' in game) return game.totalCubes;
    return 0;
  };

  const getGameTotalScore = (game: GameTokenData | LeaderboardEntry): number => {
    if ('totalScore' in game) return game.totalScore;
    return game.score ?? 0;
  };

  const isGameOver = (game: GameTokenData | LeaderboardEntry): boolean => {
    if ('gameOver' in game) return game.gameOver;
    return game.game_over ?? false;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonType} className={`w-full text-${textSize}`}>
          Leaderboard
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[750px] w-[95%] rounded-lg p-4 flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex flex-row items-center justify-between text-2xl">
          <DialogTitle>Leaderboard</DialogTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={loading}
            className="h-8 w-8"
            title="Refresh leaderboard"
          >
            <RotateCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
        </DialogHeader>
        <div className="flex-grow min-h-[460px] flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-slate-400">Loading...</span>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-slate-400">No games yet. Be the first to play!</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-16">Rank</TableHead>
                  <TableHead className="text-left">Player</TableHead>
                  <TableHead className="text-center">Level</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Cubes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGames.map((game: GameTokenData | LeaderboardEntry, index: number) => (
                  <TableRow
                    key={game.token_id}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <TableCell className="text-center font-semibold">{`#${
                      startIdx + index + 1
                    }`}</TableCell>
                    <TableCell className="text-left">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() =>
                          handleCopyPlayerAddress(
                            normalizeAddress(
                              (game as GameTokenData).minted_by_address ?? (game as GameTokenData).owner ?? undefined,
                            ),
                            String(game.token_id),
                          )
                        }
                        title="Click to copy player address"
                      >
                        {game.player_name ?? `Game #${game.token_id}`}
                        {copiedTokenId === String(game.token_id)
                          ? " (copied)"
                          : ""}
                      </button>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {getGameLevel(game)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {getGameTotalScore(game)}
                    </TableCell>
                    <TableCell className="text-center text-yellow-400">
                      {getGameCubes(game)} 🧊
                    </TableCell>
                    <TableCell className="text-center">
                      {isGameOver(game) ? (
                        <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-300">Finished</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">Playing</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span>
            Page {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
