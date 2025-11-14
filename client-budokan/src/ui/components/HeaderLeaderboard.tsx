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
import { useStarknetApi } from "@/hooks/useStarknetApi";

interface GameData {
  score: number;
  game_id: string | number;
}

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
  const [games, setGames] = React.useState<GameData[]>([]);
  const [page, setPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;
  const { getTokenMetadata } = useStarknetApi();
  const [names, setNames] = React.useState<Record<string, string>>({});

  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedGames = games.slice(startIdx, endIdx);
  const totalPages = Math.ceil(games.length / ITEMS_PER_PAGE);

  React.useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_TORII}/graphql`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
              query ZkubeBudoV113GameModels {
                zkubeBudoV113GameModels(
                  order: { direction: DESC, field: SCORE }
                  first: 100
                ) {
                  totalCount
                  edges {
                    node {
                      score
                      game_id
                    }
                  }
                }
              }
            `,
            }),
          }
        );

        const data = await response.json();
        console.log("GraphQL raw response:", data);
        if (data.data?.zkubeBudoV113GameModels?.edges) {
          const nodes = data.data.zkubeBudoV113GameModels.edges.map(
            (edge: { node: GameData }) => edge.node
          );
          /*console.log("Extracted nodes:", nodes);
          nodes.forEach((node: GameData, idx: number) => {
            if (node.entity && node.entity.models && node.entity.models[0]) {
              console.log(
                `Node[${idx}] player_name:`,
                node.entity.models[0].player_name,
              );
            } else {
              console.log(`Node[${idx}] has no player_name`, node);
            }
          });*/
          setGames(nodes);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Resolve player names for current page using Starknet RPC hook
  React.useEffect(() => {
    const fetchNames = async () => {
      const updates: Record<string, string> = {};
      await Promise.all(
        paginatedGames.map(async (game) => {
          const key = String(game.game_id);
          if (names[key] !== undefined) return;
          try {
            const idValue =
              typeof game.game_id === "string"
                ? Number.isNaN(Number(game.game_id))
                  ? parseInt(game.game_id as string, 10)
                  : Number(game.game_id)
                : game.game_id;
            const meta = await getTokenMetadata(idValue);
            if (meta?.playerName) {
              updates[key] = meta.playerName;
            } else {
              updates[key] = "-";
            }
          } catch (e) {
            updates[key] = "-";
          }
        })
      );
      if (Object.keys(updates).length > 0) {
        setNames((prev) => ({ ...prev, ...updates }));
      }
    };
    if (paginatedGames.length > 0) fetchNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedGames.map((g) => g.game_id).join("")]);

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
                    key={game.game_id}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <TableCell className="text-center font-semibold">{`#${
                      startIdx + index + 1
                    }`}</TableCell>
                    <TableCell className="text-left">
                      {names[String(game.game_id)] ?? "-"}
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
