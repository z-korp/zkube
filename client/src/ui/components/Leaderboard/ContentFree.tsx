import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useGames } from "@/hooks/useGames";
import { ModeType } from "@/dojo/game/types/mode";
import { Game } from "@/dojo/game/models/game";
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
import { usePlayer } from "@/hooks/usePlayer";
import { Level } from "@/dojo/game/types/level";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faFire,
  faFlagCheckered,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/ui/elements/tooltip";
import MaxComboIcon from "../MaxComboIcon";

const MAX_PAGE_COUNT = 5;

interface ContentFreeProps {
  mode: ModeType;
  isMdOrLarger: boolean;
}

export const ContentFree: React.FC<ContentFreeProps> = ({
  mode,
  isMdOrLarger,
}) => {
  const { games } = useGames();
  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(0);

  const GAME_PER_PAGE = useMemo(() => (isMdOrLarger ? 8 : 9), [isMdOrLarger]);

  // Filter games based on mode
  const filteredGames = useMemo(() => {
    return games.filter((game) => game.mode.value === mode);
  }, [games, mode]);

  const sortedGames = useMemo(() => {
    return filteredGames.sort(
      (a, b) => b.score_in_tournament - a.score_in_tournament,
    );
  }, [filteredGames]);

  useEffect(() => {
    const rem = Math.floor(sortedGames.length / (GAME_PER_PAGE + 1)) + 1;
    setPageCount(rem);
  }, [sortedGames]);

  useEffect(() => {
    setPage(1); // Reset to first page only when mode changes
  }, [mode]);

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
    if (page === pageCount) return;
    setPage((prev) => prev + 1);
  }, [page, pageCount]);

  const disabled = useMemo(() => sortedGames.length > 0, [sortedGames]);

  return (
    <div className="flex flex-col h-[420px] justify-between">
      {/* No tournament Select or Timer */}
      <div className="flex-grow overflow-auto">
        <Table className="text-sm sm:text-base sm:w-full font-semibold md:font-normal">
          <TableCaption className={`${disabled && "hidden"}`}>
            Leaderboard is waiting for its best players to make history
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[3%] md:w-[8%] text-center font-semibold md:font-normal">
                {isMdOrLarger ? "Rank" : "#"}
              </TableHead>
              <TableHead className="w-[27%] text-start font-semibold md:font-normal">
                Name
              </TableHead>
              <TableHead className="w-[10%] text-center hidden md:table-cell">
                lvl
              </TableHead>
              <TableHead className="w-[15%] text-center">
                <div className="flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                </div>
              </TableHead>
              <TableHead className="w-[10%] text-center">
                <div className="flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faFire} className="text-slate-500" />
                </div>
              </TableHead>
              <TableHead className="w-[10%] text-center">
                <div className="flex items-center justify-center gap-1">
                  <MaxComboIcon
                    width={isMdOrLarger ? 17 : 15}
                    height={isMdOrLarger ? 17 : 15}
                    className="text-slate-500"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[10%] text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FontAwesomeIcon
                      icon={faFlagCheckered}
                      className="text-slate-500"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className=" w-[180px] text-base"
                  >
                    Game on going
                  </TooltipContent>
                </Tooltip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGames.slice(start, end).map((game, index) => (
              <RowFree
                key={index}
                rank={(page - 1) * GAME_PER_PAGE + index + 1}
                game={game}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination className={`${!disabled && "hidden"}`}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={`${page === 1 && "opacity-50"}`}
              onClick={handlePrevious}
            />
          </PaginationItem>
          {!isMdOrLarger &&
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
              className={`${page === pageCount && "opacity-50"}`}
              onClick={handleNext}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

interface RowFreeProps {
  rank: number;
  game: Game;
}

export const RowFree: React.FC<RowFreeProps> = ({ rank, game }) => {
  const { player } = usePlayer({ playerId: game.player_id });

  return (
    <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-800">
      <TableCell className="text-center font-semibold">{`${rank}`}</TableCell>
      <TableCell className="text-left sm:max-w-36 truncate">
        {player?.name || "-"}
      </TableCell>
      <TableCell className="text-center hidden md:table-cell">
        {player?.points !== undefined
          ? Level.fromPoints(player?.points).value
          : ""}
      </TableCell>
      <TableCell className="text-center font-bold">
        {game.score_in_tournament}
      </TableCell>
      <TableCell className="text-center font-bold">
        {game.combo_counter_in_tournament}
      </TableCell>
      <TableCell className="text-center font-bold">
        {game.max_combo_in_tournament}
      </TableCell>
      <TableCell className="text-center font-bold">
        {game.isOver() ? (
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-300" />
        ) : (
          <FontAwesomeIcon icon={faClock} className="text-orange-300" />
        )}
      </TableCell>
    </TableRow>
  );
};
