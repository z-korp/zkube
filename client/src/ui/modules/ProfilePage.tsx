import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { CardContent } from "@/ui/elements/card";
import { Button } from "@/ui/elements/button";
import { Achievements } from "./Achievements";
import { Statistics } from "./Statistics";
import Connect from "../components/Connect";
import { useGames } from "@/hooks/useGames";
import { usePlayer } from "@/hooks/usePlayer";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import { Level } from "@/dojo/game/types/level";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
import { motion } from "framer-motion";

export const ProfilePage = () => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { games } = useGames();

  const filteredGames = useMemo(() => {
    if (!account?.address || !games) return [];
    return games.filter((game) => game.player_id === account?.address);
  }, [games, account?.address]);

  const levelPlayer = player?.points ? Level.fromPoints(player.points) : null;
  const highestCombo = useMemo(
    () => Math.max(...filteredGames.map((game) => game.combo), 0),
    [filteredGames],
  );
  const highestScore = useMemo(
    () =>
      Math.max(
        ...filteredGames.map((game) =>
          Level.fromPoints(game.score).getPoints(),
        ),
        0,
      ),
    [filteredGames],
  );

  return (
    <>
      {player && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{player.name}</Button>
          </DialogTrigger>
          <DialogContent
            className="w-full max-w-2xl"
            aria-describedby={undefined}
          >
            <DialogHeader className="flex items-center text-2xl">
              <DialogTitle>Profile</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="achievements">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              <TabsContent
                className="max-h-[50vh] overflow-y-auto"
                value="achievements"
                asChild
              >
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <CardContent>
                    <Achievements
                      level={levelPlayer?.value || 1}
                      highestScore={highestScore}
                      highestCombo={highestCombo}
                    />
                  </CardContent>
                </motion.div>
              </TabsContent>
              <TabsContent
                className="max-h-[50vh] overflow-y-auto"
                value="stats"
                asChild
              >
                <motion.div
                  key="statistics"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <CardContent>
                    <Statistics games={filteredGames} />
                  </CardContent>
                </motion.div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
      {ACCOUNT_CONNECTOR === "controller" && <Connect />}
    </>
  );
};
