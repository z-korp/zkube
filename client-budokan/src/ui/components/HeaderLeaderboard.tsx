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
import { useGameTokens } from "metagame-sdk/sql";
import type { GameTokenData } from "metagame-sdk";
import {
  getGameSystemAddress,
  getLeaderboardExcludedNames,
  normalizeAddress,
} from "@/utils/metagame";

const gameSystemAddress = getGameSystemAddress();
const excludedLeaderboardNames = getLeaderboardExcludedNames();

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
  const { games, loading, error } = useGameTokens({
    sortBy: "score",
    sortOrder: "desc",
    limit: 100,
    includeMetadata: true,
    gameAddresses: gameSystemAddress ? [gameSystemAddress] : undefined,
  });
  const filteredGames = React.useMemo(() => {
    if (!excludedLeaderboardNames.length) {
      return games;
    }
    return games.filter((game) => {
      if (game.game_id === 0) return true;
      const playerName = (game as GameTokenData).player_name?.toLowerCase();
      return !(playerName && excludedLeaderboardNames.includes(playerName));
    });
  }, [games, excludedLeaderboardNames]);

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonType} className={`w-full text-${textSize}`}>
          Leaderboard
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[700px] w-[95%] rounded-lg p-4 flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex items-center text-2xl">
          <DialogTitle>Leaderboard</DialogTitle>
        </DialogHeader>
        <div className="flex-grow min-h-[460px] flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Rank</TableHead>
                <TableHead className="text-left">Player</TableHead>
                <TableHead className="text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGames.map((game, index) => (
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
                            game.minted_by_address ?? game.owner ?? undefined,
                          ),
                          String(game.token_id),
                        )
                      }
                      title="Click to copy player address"
                    >
                      {(game as GameTokenData).player_name ?? "-"}
                      {copiedTokenId === String(game.token_id)
                        ? " (copied)"
                        : ""}
                    </button>
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {game.score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            Page {page} / {totalPages}
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
