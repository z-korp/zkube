import { Game } from "@/dojo/game/models/game";
import useStats from "@/hooks/useStats";

export default function StatsPage() {
  const {
    topPlayers,
    totalScore,
    maxCombo,
    topGames,
    finishedGames,
    ongoingGames,
    statsByMode,
  } = useStats();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-10">Game Statistics</h1>

      {/* Grid pour les stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className=" rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Global Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className=" p-4 rounded-lg">
              <div className="text-gray-600">Total Score</div>
              <div className="text-2xl font-bold">
                {totalScore.toLocaleString()}
              </div>
            </div>
            <div className=" p-4 rounded-lg">
              <div className="text-gray-600">Max Combo</div>
              <div className="text-2xl font-bold">{maxCombo}</div>
            </div>

            {/* Nouvelles stats pour les parties */}
            <div className="p-4 rounded-lg">
              <div className="text-gray-600">Finished Games</div>
              <div className="text-2xl font-bold">{finishedGames}</div>
            </div>
            <div className="p-4 rounded-lg">
              <div className="text-gray-600">Ongoing Games</div>
              <div className="text-2xl font-bold">{ongoingGames}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats par mode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {Object.entries(statsByMode).map(([mode, stats]) => (
          <div key={mode} className="rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{mode}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2">
                  <div className="text-gray-600">Games</div>
                  <div className="text-xl font-bold">{stats.totalGames}</div>
                </div>
                <div className="p-2">
                  <div className="text-gray-600">Finished</div>
                  <div className="text-xl font-bold">{stats.finishedGames}</div>
                </div>
                <div className="p-2">
                  <div className="text-gray-600">Score</div>
                  <div className="text-xl font-bold">
                    {stats.totalScore.toLocaleString()}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-gray-600">Best Combo</div>
                  <div className="text-xl font-bold">{stats.maxCombo}x</div>
                </div>
              </div>

              {stats.bestGames.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Best Games</h3>
                  <div className="space-y-2">
                    {stats.bestGames.map((game: Game, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg"
                      >
                        <div className="text-sm">
                          Score: {game.score.toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {game.combo}x Combo
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grid pour les tops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Players */}
        <div className=" rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Players</h2>
          <div className="space-y-3">
            {topPlayers.map((player, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3  rounded-lg  transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-600">
                    Level {player.level.value} -{" "}
                    {player.points.toLocaleString()} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Games */}
        <div className=" rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Best Games</h2>
          <div className="space-y-3">
            {topGames.map((game, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3  rounded-lg  transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">
                    Score: {game.score.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">
                    {game.combo}x Combo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
