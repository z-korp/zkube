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
    <div className="w-full shrink-0 px-2 pb-1 pt-1">
      <div
        className="mx-auto w-full max-w-[500px] rounded-xl border px-2.5 py-1.5"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex h-8 items-center justify-between gap-1.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full border px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.08em]"
              style={{
                color: colors.accent,
                borderColor: `${colors.accent}66`,
                backgroundColor: `${colors.accent}1F`,
              }}
            >
              LV.{level}
            </div>
            <div className="flex gap-0.5 text-[11px] leading-none">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  style={{ color: i < starScore ? colors.accent2 : colors.textMuted }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-[0.08em]" style={{ color: colors.textMuted }}>
                MOVES
              </span>
              <span className="font-display text-[13px] font-bold tabular-nums" style={{ color: colors.text }}>
                {movesUsed}/{maxMoves}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-[0.08em]" style={{ color: colors.textMuted }}>
                SCORE
              </span>
              <span className="font-display text-[13px] font-bold tabular-nums" style={{ color: colors.accent2 }}>
                {animatedScore}/{targetScore}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-[0.08em]" style={{ color: colors.textMuted }}>
                COMBO
              </span>
              <span className="font-display text-[13px] font-bold tabular-nums" style={{ color: colors.accent }}>
                ×{combo}
              </span>
              {combo > 1 && <span className="text-[11px] leading-none">🔥</span>}
            </div>
          </div>
        </div>

        {constraints.length > 0 && (
          <div className="mt-1.5 space-y-1">
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
              const clamped = Math.max(0, Math.min(1, target > 0 ? progress / target : 0));

              return (
                <div key={`constraint-${i}`}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[9px]" style={{ color: colors.textMuted }}>
                      {description}
                    </span>
                    <span className="font-display text-[10px] tabular-nums" style={{ color: colors.accent }}>
                      {progress}/{target}
                    </span>
                  </div>
                  <div
                    className="h-1 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: `${colors.border}66` }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{ width: `${Math.round(clamped * 100)}%`, backgroundColor: colors.accent }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHud;
