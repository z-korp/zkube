import { useMemo } from "react";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

interface GameHudProps {
  levelScore: number;
  targetScore: number;
  movesRemaining: number;
  combo: number;
  constraintProgress: number;
  constraint2Progress: number;
  constraint3Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel: GameLevelData | null;
  maxMoves: number;
}

const CONSTRAINT_EMOJI: Record<ConstraintType, string> = {
  [ConstraintType.None]: "",
  [ConstraintType.ComboLines]: "🔥",
  [ConstraintType.BreakBlocks]: "🧱",
  [ConstraintType.ComboStreak]: "⚡",
  [ConstraintType.FillAndClear]: "🌊",
  [ConstraintType.NoBonusUsed]: "🚫",
  [ConstraintType.KeepGridBelow]: "📊",
};

interface ConstraintData {
  type: ConstraintType;
  value: number;
  count: number;
  progress: number;
}

const GameHud: React.FC<GameHudProps> = ({
  levelScore,
  targetScore,
  movesRemaining,
  combo,
  constraintProgress,
  constraint2Progress,
  constraint3Progress,
  bonusUsedThisLevel,
  gameLevel,
  maxMoves,
}) => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);

  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;

  const cube3Threshold = gameLevel?.cube3Threshold ?? maxMoves;
  const cube2Threshold = gameLevel?.cube2Threshold ?? Math.max(1, Math.floor(maxMoves * 0.7));
  const movesUsed = Math.max(0, maxMoves - movesRemaining);
  const starScore = movesUsed <= cube3Threshold ? 3 : movesUsed <= cube2Threshold ? 2 : 1;

  const constraints = useMemo<ConstraintData[]>(() => {
    const result: ConstraintData[] = [];
    if (gameLevel) {
      if (gameLevel.constraintType !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraintType,
          value: gameLevel.constraintValue,
          count: gameLevel.constraintCount,
          progress: constraintProgress,
        });
      }
      if (gameLevel.constraint2Type !== undefined && gameLevel.constraint2Type !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraint2Type,
          value: gameLevel.constraint2Value,
          count: gameLevel.constraint2Count,
          progress: constraint2Progress,
        });
      }
      if (gameLevel.constraint3Type !== undefined && gameLevel.constraint3Type !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraint3Type,
          value: gameLevel.constraint3Value,
          count: gameLevel.constraint3Count,
          progress: constraint3Progress,
        });
      }
    }
    return result;
  }, [
    gameLevel?.constraintType, gameLevel?.constraintValue, gameLevel?.constraintCount, constraintProgress,
    gameLevel?.constraint2Type, gameLevel?.constraint2Value, gameLevel?.constraint2Count, constraint2Progress,
    gameLevel?.constraint3Type, gameLevel?.constraint3Value, gameLevel?.constraint3Count, constraint3Progress,
  ]);

  const level = gameLevel?.level ?? 1;

  return (
    <div className="w-full px-3 pb-2 pt-1 shrink-0">
      <div
        className="mx-auto w-full max-w-[500px] rounded-xl border px-3 py-2"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="rounded-md border px-2 py-1 font-display text-[10px] font-bold tracking-[0.1em]"
              style={{
                color: colors.accent,
                borderColor: `${colors.accent}66`,
                backgroundColor: `${colors.accent}1F`,
              }}
            >
              LV.{level}
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className="text-xs"
                  style={{ color: i < starScore ? colors.accent2 : colors.textMuted }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[9px]" style={{ color: colors.textMuted }}>
                MOVES
              </p>
              <p className="font-display text-[15px] font-bold" style={{ color: colors.text }}>
                {Math.max(0, maxMoves - movesRemaining)}/{maxMoves}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px]" style={{ color: colors.textMuted }}>
                SCORE
              </p>
              <p className="font-display text-[15px] font-bold" style={{ color: colors.accent2 }}>
                {animatedScore}/{targetScore}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px]" style={{ color: colors.textMuted }}>
                COMBO
              </p>
              <p className="font-display text-[15px] font-bold" style={{ color: colors.accent }}>
                x{combo}
              </p>
            </div>
          </div>
        </div>

        {constraints.length > 0 && (
          <div
            className="mt-2 rounded-lg border px-2.5 py-2"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="space-y-1.5">
              {constraints.map((c, i) => {
                const description = Constraint.fromContractValues(c.type, c.value, c.count).getDescription();
                const progress =
                  c.type === ConstraintType.NoBonusUsed
                    ? bonusUsedThisLevel
                      ? 0
                      : 1
                    : c.type === ConstraintType.KeepGridBelow
                      ? c.progress >= 1
                        ? 0
                        : 1
                      : c.progress;
                const target =
                  c.type === ConstraintType.NoBonusUsed || c.type === ConstraintType.KeepGridBelow
                    ? 1
                    : c.count;

                return (
                  <div key={`constraint-${i}`} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span>{CONSTRAINT_EMOJI[c.type]}</span>
                      <span className="truncate text-[10px]" style={{ color: colors.text }}>
                        {description}
                      </span>
                    </div>
                    <span className="font-display text-[11px] font-bold" style={{ color: colors.accent }}>
                      {progress}/{target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHud;
