import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/elements/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/elements/pagination";
import { Button } from "@/ui/elements/button";
import { Game } from "@/dojo/game/models/game";
import { useGames } from "@/hooks/useGames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKhanda, faStar } from "@fortawesome/free-solid-svg-icons";
import { usePlayer } from "@/hooks/usePlayer";
import { useMediaQuery } from "react-responsive";
import { ModeType, Mode } from "@/dojo/game/types/mode";

const GAME_PER_PAGE = 5;
const MAX_PAGE_COUNT = 5;

interface LeaderboardProps {
  modeType: ModeType;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ modeType }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          {modeType === ModeType.Daily ? "Top Daily" : "Leaderboard"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex items-center text-2xl">
          <DialogTitle>
            {modeType === ModeType.Daily ? "Top Daily" : "Leaderboard"}
          </DialogTitle>
        </DialogHeader>
        <div className="m-auto">
          <Content modeType={modeType} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ContentProps {
  modeType: ModeType;
}

export const Content: React.FC<ContentProps> = ({ modeType }) => {
  const { games } = useGames();
  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(0);

  const filteredGames = useMemo(() => {
    return games.filter((game) => game.mode.value === modeType);
  }, [games, modeType]);

  const sortedGames = useMemo(() => {
    return filteredGames
      .sort((a, b) => b.combo - a.combo)
      .sort((a, b) => b.score - a.score);
  }, [filteredGames]);

  useEffect(() => {
    const rem = Math.floor(sortedGames.length / (GAME_PER_PAGE + 1)) + 1;
    setPageCount(rem);
    setPage(1); // Reset to first page when mode changes
  }, [sortedGames]);

  const { start, end } = useMemo(() => {
    const start = (page - 1) * GAME_PER_PAGE;
    const end = start + GAME_PER_PAGE;
    return { start, end };
  }, [page]);

  const handlePrevious = useCallback(() => {
    if (page === 1) return;
    setPage((prev) => prev - 1);
  }, [page]);

  const handleNext = useCallback(() => {
    if (page === Math.min(pageCount, MAX_PAGE_COUNT)) return;
    setPage((prev) => prev + 1);
  }, [page, pageCount]);

  const disabled = useMemo(() => sortedGames.length > 0, [sortedGames]);

  const isSmallScreen = useMediaQuery({ query: "(min-width: 640px)" });

  return (
    <>
      <Table className="text-md">
        <TableCaption className={`${disabled && "hidden"}`}>
          Leaderboard is waiting for its best players to make history
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-1/5">Rank</TableHead>
            <TableHead className="text-center w-1/5">
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            </TableHead>
            <TableHead className="text-center w-1/5">
              <FontAwesomeIcon icon={faKhanda} className="text-slate-500" />
            </TableHead>
            <TableHead className="w-3/5">Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedGames.slice(start, end).map((game, index) => (
            <Row
              key={index}
              rank={(page - 1) * GAME_PER_PAGE + index + 1}
              game={game}
            />
          ))}
        </TableBody>
      </Table>
      <Pagination className={`${!disabled && "hidden"}`}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={`${page === 1 && "opacity-50"}`}
              onClick={handlePrevious}
            />
          </PaginationItem>
          {isSmallScreen &&
            Array.from({ length: Math.min(pageCount, MAX_PAGE_COUNT) }).map(
              (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={index + 1 === page}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
          <PaginationItem>
            <PaginationNext
              className={`${page === Math.min(pageCount, MAX_PAGE_COUNT) && "opacity-50"}`}
              onClick={handleNext}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
};

export const Row = ({ rank, game }: { rank: number; game: Game }) => {
  const { player } = usePlayer({ playerId: game.player_id });

  return (
    <TableRow>
      <TableCell>{`# ${rank}`}</TableCell>
      <TableCell className="text-right">
        <p className="flex gap-1 justify-center items-center">
          <span className="font-bold">{game.score}</span>
        </p>
      </TableCell>
      <TableCell className="text-right">
        <p className="flex gap-1 justify-center items-center">
          <span className="font-bold">{game.combo}</span>
        </p>
      </TableCell>
      <TableCell className="text-left max-w-36 truncate">
        {player?.name || "-"}
      </TableCell>
    </TableRow>
  );
};
