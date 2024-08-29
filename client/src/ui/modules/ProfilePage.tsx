import React, { useMemo, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
import { motion } from "framer-motion";
import { Game } from "@/dojo/game/models/game";

// Constantes pour les seuils de score et de combo
const SCORE_THRESHOLDS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
const COMBO_THRESHOLDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Typage des résultats des filtrages
type GamesByThreshold = {
  threshold: number;
  games: Game[];
};

// Composant principal de la page profil
export const ProfilePage = () => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { games } = useGames();

  // ACHIEVEMENTS
  // Filtre les jeux en fonction de l'utilisateur connecté
  const filteredGames = useMemo(() => {
    if (!account?.address || !games) return [];
    return games.filter((game) => game.player_id === account?.address);
  }, [games, account?.address]);


  // Fonction générique pour obtenir les jeux par seuil
  const getGamesByThresholds = useCallback(
    (
      games: Game[],
      thresholds: number[],
      key: keyof Game,
    ): GamesByThreshold[] => {
      return thresholds.map((threshold) => ({
        threshold,
        games: games.filter((game) => Number(game[key]) >= threshold),
      }));
    },
    [],
  );

  // Récupère les jeux par seuil de score
  const gamesByScoreThresholds = useMemo(
    () => getGamesByThresholds(filteredGames, SCORE_THRESHOLDS, "score"),
    [filteredGames, getGamesByThresholds],
  );

  // Récupère les jeux par seuil de combo
  const gamesByComboThresholds = useMemo(
    () => getGamesByThresholds(filteredGames, COMBO_THRESHOLDS, "combo"),
    [filteredGames, getGamesByThresholds],
  );

  return (
    <>
      {player && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{player.name}</Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl">
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
                      gamesByThresholds={gamesByScoreThresholds}
                      combosByThresholds={gamesByComboThresholds}
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