import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useGames } from "@/hooks/useGames";
import { useTournaments } from "@/hooks/useTournaments";
import { ModeType } from "@/dojo/game/types/mode";
import { Game } from "@/dojo/game/models/game";
import { Tournament } from "@/dojo/game/models/tournament";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/ui/elements/select";
import { format } from "date-fns";
import { formatPrize } from "@/utils/wei";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/ui/elements/tooltip";
import MaxComboIcon from "../MaxComboIcon";
import TournamentTimer from "../TournamentTimer";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

const MAX_PAGE_COUNT = 5;

interface ContentTournamentProps {
  mode: ModeType;
  endTimestamp: number;
  tournamentId: number;
  currentTournament: Tournament | null;
  isMdOrLarger: boolean;
}

export const ContentTournament: React.FC<ContentTournamentProps> = ({
  mode,
  endTimestamp,
  tournamentId,
  currentTournament,
  isMdOrLarger,
}) => {
  const { games } = useGames();
  const allTournaments = useTournaments({ mode });
  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    number | null
  >(allTournaments.length > 0 ? allTournaments[0].id : null);

  const GAME_PER_PAGE = useMemo(() => (isMdOrLarger ? 7 : 6), [isMdOrLarger]);

  const selectedTournament = useMemo(() => {
    return allTournaments.find((t) => t.id === selectedTournamentId);
  }, [allTournaments, selectedTournamentId]);

  // Ensure currentTournament is included in tournaments list
  const tournaments = useMemo(() => {
    let currentTournamentToInclude;
    if (!currentTournament) {
      currentTournamentToInclude = Tournament.createNullTournament(
        tournamentId,
        mode,
      );
    } else {
      currentTournamentToInclude = currentTournament;
    }

    const isCurrentIncluded = allTournaments.some(
      (t) => t.id === currentTournamentToInclude.id,
    );

    if (isCurrentIncluded) {
      return allTournaments;
    } else {
      // Add currentTournamentToInclude at the beginning
      return [currentTournamentToInclude, ...allTournaments];
    }
  }, [allTournaments, currentTournament]);

  useEffect(() => {
    // Update selectedTournamentId when the tournaments list changes
    if (tournaments.length > 0) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments]);

  // Filter out tournaments without winners, starting from the second tournament
  const filteredTournaments = useMemo(() => {
    if (tournaments.length === 0) return [];
    const [current] = tournaments;
    const pastTournaments = tournaments
      .slice(1)
      .filter((t) => t.top1_player_id !== 0n);
    return [current, ...pastTournaments];
  }, [tournaments]);

  const filteredGames = useMemo(() => {
    if (selectedTournamentId == null) return [];
    return games.filter(
      (game) =>
        game.mode.value === mode && game.tournament_id === selectedTournamentId,
    );
  }, [games, mode, selectedTournamentId]);

  const { sortedGames } = useMemo(() => {
    const sorted = filteredGames
      .sort(
        (a, b) => b.combo_counter_in_tournament - a.combo_counter_in_tournament,
      )
      .sort((a, b) => b.score_in_tournament - a.score_in_tournament);

    return { sortedGames: sorted };
  }, [filteredGames]);

  const gamesWithWinnings = useMemo(() => {
    return sortedGames.map((game) => {
      let potentialWinnings = 0n;
      if (selectedTournament) {
        if (Number(game.id) === selectedTournament.top1_game_id) {
          potentialWinnings = selectedTournament.top1_prize;
        } else if (Number(game.id) === selectedTournament.top2_game_id) {
          potentialWinnings = selectedTournament.top2_prize;
        } else if (Number(game.id) === selectedTournament.top3_game_id) {
          potentialWinnings = selectedTournament.top3_prize;
        }
      }
      return { ...game, isOver: () => game.isOver(), potentialWinnings };
    });
  }, [sortedGames, selectedTournament]);

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
    if (page === Math.min(pageCount, MAX_PAGE_COUNT)) return;
    setPage((prev) => prev + 1);
  }, [page, pageCount]);

  const disabled = useMemo(() => sortedGames.length > 0, [sortedGames]);

  const handleTournamentChange = useCallback((value: string) => {
    const numericValue = Number(value);
    setSelectedTournamentId(isNaN(numericValue) ? null : numericValue);
  }, []);

  const formatTournamentDate = (tournament: Tournament) => {
    const startDate = tournament.getStartDate();
    const endDate = tournament.getEndDate();

    if (endDate) {
      // Normal (monthly) tournament
      return `${format(startDate, "MMM d HH:mm")} - ${format(
        endDate,
        "MMM d HH:mm, yyyy",
      )}`;
    } else {
      // Daily tournament
      return format(startDate, "MMM d, HH:mm yyyy");
    }
  };

  return (
    <div className="flex flex-col h-[420px]">
      <div
        className={`w-full flex ${isMdOrLarger && "justify-between"} items-center my-1-0.5 p-2`}
      >
        {isMdOrLarger && (
          <Select
            onValueChange={handleTournamentChange}
            value={selectedTournamentId?.toString() ?? ""}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Current" />
            </SelectTrigger>
            <SelectContent>
              {filteredTournaments.map((t, index) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {index === 0 ? "Current" : formatTournamentDate(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div
          className={`flex ${isMdOrLarger ? "gap-4" : "justify-between  w-full"} items-center`}
        >
          <h2 className="text-sm md:text-base font-semibold">
            Tournament ends in
          </h2>
          <TournamentTimer mode={mode} endTimestamp={endTimestamp} />
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <Table className="text-sm sm:text-base sm:w-full ">
          <TableCaption className={`${disabled && "hidden"}`}>
            Leaderboard is waiting for its best players to make history
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[3%] md:w-[8%] text-center">
                {isMdOrLarger ? "Rank" : "#"}
              </TableHead>
              <TableHead className="w-[27%] text-start">Name</TableHead>
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
              <TableHead className="w-[35%] text-center">
                <div className="flex items-center justify-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="">
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className="text-yellow-500"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className=" w-[180px] text-base"
                    >
                      Potential winnings for top 3 players
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gamesWithWinnings.slice(start, end).map((game, index) => (
              <RowTournament
                key={index}
                rank={(page - 1) * GAME_PER_PAGE + index + 1}
                game={game}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination className={`${!disabled && "hidden"} mt-auto`}>
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
              className={`${
                page === Math.min(pageCount, MAX_PAGE_COUNT) && "opacity-50"
              }`}
              onClick={handleNext}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

interface RowTournamentProps {
  rank: number;
  game: Game & { potentialWinnings: bigint };
}

export const RowTournament: React.FC<RowTournamentProps> = ({ rank, game }) => {
  const { player } = usePlayer({ playerId: game.player_id });

  return (
    <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-800">
      <TableCell className="text-center font-semibold">{`${rank}`}</TableCell>
      <TableCell className="text-left sm:max-w-36 truncate">
        {player?.name || "-"}
      </TableCell>
      <TableCell className="text-center hidden md:table-cell">
        {player?.points ? Level.fromPoints(player?.points).value : ""}
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
        {game.potentialWinnings
          ? formatPrize(game.potentialWinnings, VITE_PUBLIC_GAME_TOKEN_SYMBOL)
          : "-"}
      </TableCell>
    </TableRow>
  );
};
