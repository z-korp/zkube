import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { Player } from "@/dojo/game/models/player";
import { Game } from "@/dojo/game/models/game";
import { Level } from "@/dojo/game/types/level";
import { ModeType } from "@/dojo/game/types/mode";

const useStats = () => {
  // Players state
  const [players, setPlayers] = useState<Player[]>([]);
  // Games state
  const [games, setGames] = useState<Game[]>([]);

  const {
    setup: {
      clientModels: {
        models: { Player: PlayerComponent, Game: GameComponent },
        classes: { Player: PlayerClass, Game: GameClass },
      },
    },
  } = useDojo();

  const playerKeys = useEntityQuery([Has(PlayerComponent)]);
  const gameKeys = useEntityQuery([Has(GameComponent)]);

  // Effect for players
  useEffect(() => {
    const components = playerKeys
      .map((entity) => {
        const component = getComponentValue(PlayerComponent, entity);
        if (!component) return undefined;
        return new PlayerClass(component);
      })
      .filter((player): player is Player => player !== undefined)
      .sort((a, b) => {
        const levelA = Level.fromPoints(a.points);
        const levelB = Level.fromPoints(b.points);
        if (levelB.value !== levelA.value) {
          return levelB.value - levelA.value;
        }
        return b.points - a.points;
      });

    setPlayers(components);
  }, [playerKeys]);

  // Effect for games
  useEffect(() => {
    const components = gameKeys
      .map((entity) => {
        const component = getComponentValue(GameComponent, entity);
        if (!component) return undefined;
        return new GameClass(component);
      })
      .filter((game): game is Game => game !== undefined)
      .sort((a, b) => b.combo - a.combo); // Tri par combo décroissant

    setGames(components);
  }, [gameKeys]);

  // Calcul des stats
  const totalScore = games.reduce((sum, game) => sum + game.score, 0);
  const maxCombo =
    games.length > 0 ? Math.max(...games.map((game) => game.combo)) : 0;

  // Ajouter le calcul des parties terminées/en cours
  const finishedGames = games.filter((game) => game.isOver()).length;
  const ongoingGames = games.filter((game) => !game.isOver()).length;

  // Grouper les stats par mode
  const statsByMode = Object.values(ModeType).reduce(
    (acc, mode) => {
      if (mode === ModeType.None) return acc;

      const modeGames = games.filter((game) => game.mode.value === mode);
      acc[mode] = {
        totalGames: modeGames.length,
        finishedGames: modeGames.filter((game) => game.isOver()).length,
        ongoingGames: modeGames.filter((game) => !game.isOver()).length,
        totalScore: modeGames.reduce((sum, game) => sum + game.score, 0),
        maxCombo:
          modeGames.length > 0
            ? Math.max(...modeGames.map((game) => game.combo))
            : 0,
        bestGames: modeGames
          .filter((game) => game.isOver())
          .sort((a, b) => b.combo - a.combo)
          .slice(0, 5),
      };
      return acc;
    },
    {} as Record<ModeType, any>,
  );

  return {
    // Players stats
    topPlayers: players.slice(0, 10).map((player) => ({
      ...player,
      level: Level.fromPoints(player.points),
      nextLevelXP: Level.fromPoints(player.points).getPointsToNextLevel(),
    })),
    // Games stats
    totalScore,
    maxCombo,
    topGames: games.slice(0, 10),
    finishedGames,
    ongoingGames,
    statsByMode,
  };
};

export default useStats;
