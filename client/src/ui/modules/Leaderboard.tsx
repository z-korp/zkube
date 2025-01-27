import React, { useState, memo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { TableCell, TableRow } from "@/ui/elements/table";
import { Button } from "@/ui/elements/button";
import { Game } from "@/dojo/game/models/game";
import { usePlayer } from "@/hooks/usePlayer";
import { useMediaQuery } from "react-responsive";
import { ModeType } from "@/dojo/game/types/mode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
import { Level } from "@/dojo/game/types/level";
import useTournament from "@/hooks/useTournament";
import { formatPrize } from "@/utils/price";
import { ContentTournament } from "../components/Leaderboard/ContentTournament";
import { ContentFree } from "../components/Leaderboard/ContentFree";
import { trackEvent } from "@/services/analytics";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

interface TabListProps {
  activeTab: ModeType;
  setActiveTab: React.Dispatch<React.SetStateAction<ModeType>>;
  isMdorLarger: boolean;
}

const TabList = memo<TabListProps>(({ setActiveTab, isMdorLarger }) => (
  <TabsList className="grid w-full mx-auto sm:w-full grid-cols-3">
    <TabsTrigger
      value={ModeType.Free}
      onClick={() => setActiveTab(ModeType.Free)}
      className="font-semibold md:font-normal"
    >
      {isMdorLarger ? ModeType.Free : "Free"}
    </TabsTrigger>
    <TabsTrigger
      value={ModeType.Daily}
      onClick={() => setActiveTab(ModeType.Daily)}
      className="font-semibold md:font-normal"
    >
      {isMdorLarger ? ModeType.Daily : "Daily"}
    </TabsTrigger>
    <TabsTrigger
      value={ModeType.Normal}
      onClick={() => setActiveTab(ModeType.Normal)}
      className="font-semibold md:font-normal"
    >
      {isMdorLarger ? ModeType.Normal : "Weekly"}
    </TabsTrigger>
  </TabsList>
));

interface LeaderboardProps {
  buttonType:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "brutal"
    | null
    | undefined;
  textSize?: "sm" | "md" | "lg";
  inMenu?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  buttonType,
  textSize = "lg",
  inMenu = false,
}) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const handleOpenLeaderboard = useCallback(() => {
    trackEvent("Leaderboard Opened", {
      interface: isMdOrLarger ? "desktop" : "mobile",
      from_menu: inMenu,
    });
  }, [isMdOrLarger, inMenu]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={buttonType}
          className={`w-full text-${textSize} ${!isMdOrLarger && !inMenu && "py-6 border-4 rounded-none bg-sky-200 font-sans"}`}
          onClick={handleOpenLeaderboard}
        >
          Leaderboards
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[700px] w-[95%] rounded-lg p-4 flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex items-center text-2xl">
          <DialogTitle>Leaderboards</DialogTitle>
        </DialogHeader>
        <div className="flex-grow min-h-[460px] flex flex-col">
          <LeaderboardContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const LeaderboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModeType>(ModeType.Free);
  const isMdorLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const {
    endTimestamp: dailyEndTimestamp,
    tournament: dailyTournament,
    id: dailyTournamentId,
  } = useTournament(ModeType.Daily);

  const {
    endTimestamp: normalEndTimestamp,
    tournament: normalTournament,
    id: normalTournamentId,
  } = useTournament(ModeType.Normal);

  const handleTabChange = useCallback(
    (newTab: ModeType) => {
      trackEvent("Leaderboard Tab Changed", {
        previous_tab: activeTab,
        new_tab: newTab,
        interface: isMdorLarger ? "desktop" : "mobile",
      });
      setActiveTab(newTab);
    },
    [activeTab, isMdorLarger],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleTabChange(value as ModeType)}
    >
      <TabList
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMdorLarger={isMdorLarger}
      />
      <TabsContent value={ModeType.Free}>
        <ContentFree mode={ModeType.Free} isMdOrLarger={isMdorLarger} />
      </TabsContent>
      <TabsContent value={ModeType.Daily}>
        {dailyTournamentId !== 0 && (
          <ContentTournament
            mode={ModeType.Daily}
            endTimestamp={dailyEndTimestamp}
            tournamentId={dailyTournamentId}
            currentTournament={dailyTournament}
            isMdOrLarger={isMdorLarger}
          />
        )}
      </TabsContent>
      <TabsContent value={ModeType.Normal}>
        {normalTournamentId !== 0 && (
          <ContentTournament
            mode={ModeType.Normal}
            endTimestamp={normalEndTimestamp}
            tournamentId={normalTournamentId}
            currentTournament={normalTournament}
            isMdOrLarger={isMdorLarger}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

interface RowProps {
  rank: number;
  game: Game & { potentialWinnings: bigint };
}

export const Row: React.FC<RowProps> = memo(({ rank, game }) => {
  const { player } = usePlayer({ playerId: game.player_id });

  return (
    <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-800">
      <TableCell className="text-center font-semibold">{`#${rank}`}</TableCell>
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
              .withImage
          : "-"}
      </TableCell>
    </TableRow>
  );
});
