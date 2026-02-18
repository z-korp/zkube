import { Home } from "lucide-react";
import LevelBadge from "@/ui/components/shared/LevelBadge";
import { useLerpNumber } from "@/hooks/useLerpNumber";

interface StatsBarProps {
  level: number;
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves: number;
  totalCubes: number;
  combo: number;
  onHome: () => void;
}

const StatsBar: React.FC<StatsBarProps> = ({
  level,
  levelScore,
  targetScore,
  moves,
  maxMoves,
  totalCubes,
  combo,
  onHome,
}) => {
  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;
  const movesRemaining = maxMoves - moves;
  const isDanger = movesRemaining <= 3 && movesRemaining > 0;
  const isOut = movesRemaining <= 0;

  return (
    <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-slate-900/60 backdrop-blur-sm rounded-lg">
      <button
        onClick={onHome}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shrink-0"
      >
        <Home size={16} />
      </button>

      <LevelBadge level={level} size="sm" />

      <div className="flex items-center gap-0.5 min-w-0">
        <span className="font-['Bangers'] text-sm text-cyan-400 tabular-nums">
          {animatedScore}
        </span>
        <span className="text-slate-500 text-xs">/</span>
        <span className="font-['Bangers'] text-sm text-slate-400 tabular-nums">
          {targetScore}
        </span>
      </div>

      <div className="flex items-center gap-0.5 min-w-0">
        <span
          className={`font-['Bangers'] text-sm tabular-nums ${
            isOut
              ? "text-red-500"
              : isDanger
                ? "text-orange-400"
                : "text-white"
          }`}
        >
          {moves}
        </span>
        <span className="text-slate-500 text-xs">/</span>
        <span className="font-['Bangers'] text-sm text-slate-400 tabular-nums">
          {maxMoves}
        </span>
      </div>

      {combo > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-orange-400 text-xs">🔥</span>
          <span className="font-['Bangers'] text-sm text-orange-400">
            {combo}x
          </span>
        </div>
      )}

      <div className="flex items-center gap-0.5 shrink-0">
        <span className="text-sm">🧊</span>
        <span className="font-['Bangers'] text-sm text-yellow-400 tabular-nums">
          {totalCubes}
        </span>
      </div>
    </div>
  );
};

export default StatsBar;
