import { useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";

import { getThemeColors } from "@/config/themes";
import { getBossDisplay } from "@/config/bossIdentities";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { useGame } from "@/hooks/useGame";
import { useGameLevel } from "@/hooks/useGameLevel";
import { ConstraintType } from "@/dojo/game/types/constraint";

interface ConstraintDisplay {
  emoji: string;
  title: string;
  description: string;
}

function toConstraintDisplay(type: ConstraintType, value: number, count: number): ConstraintDisplay {
  switch (type) {
    case ConstraintType.ComboLines:
      return {
        emoji: "🔥",
        title: `Clear ${count} combo line${count > 1 ? "s" : ""}`,
        description: `Make ${value}+ line clears in one move to build chain pressure`,
      };
    case ConstraintType.BreakBlocks:
      return {
        emoji: "💎",
        title: `Break ${count} size-${value} blocks`,
        description: "Target exact block sizes under intense board pressure",
      };
    case ConstraintType.ComboStreak:
      return {
        emoji: "⚡",
        title: `Reach ${value}x combo streak`,
        description: "Maintain momentum with precise consecutive clears",
      };
    case ConstraintType.KeepGridBelow:
      return {
        emoji: "📊",
        title: `Keep grid below ${value} rows`,
        description: "Control vertical growth and never let the board overflow",
      };
    default:
      return {
        emoji: "🎯",
        title: "Adaptive objective",
        description: "Face a dynamic boss condition this encounter",
      };
  }
}

const BossRevealPage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const { playSfx } = useMusicPlayer();

  const gameId = useNavigationStore((s) => s.gameId);
  const navigate = useNavigationStore((s) => s.navigate);
  const goBack = useNavigationStore((s) => s.goBack);

  const { seed } = useGame({ gameId: gameId ?? undefined, shouldLog: false });
  const gameLevel = useGameLevel({ gameId: gameId ?? undefined });

  useEffect(() => {
    playSfx("boss-intro");
  }, [playSfx]);

  const bossId = useMemo(() => Number((seed % 10n) + 1n), [seed]);
  const boss = getBossDisplay(bossId);

  const constraints = useMemo(() => {
    if (!gameLevel) {
      return [
        {
          emoji: "🔥",
          title: "Combo pressure",
          description: "Stack line chains to survive the opening barrage",
        },
        {
          emoji: "📊",
          title: "Grid control",
          description: "Keep your board stable while damage ramps up",
        },
      ];
    }

    const rows = [
      { type: gameLevel.constraintType, value: gameLevel.constraintValue, count: gameLevel.constraintCount },
      { type: gameLevel.constraint2Type, value: gameLevel.constraint2Value, count: gameLevel.constraint2Count },
      { type: gameLevel.constraint3Type, value: gameLevel.constraint3Value, count: gameLevel.constraint3Count },
    ]
      .filter((c) => c.type !== ConstraintType.None)
      .slice(0, 2)
      .map((c) => toConstraintDisplay(c.type, c.value, c.count));

    return rows.length ? rows : [toConstraintDisplay(ConstraintType.ComboLines, 3, 2)];
  }, [gameLevel]);

  return (
    <div className="relative flex h-full min-h-0 flex-col px-5 py-4">
      <button
        onClick={goBack}
        className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
        style={{ color: colors.accent, background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <ChevronLeft size={20} />
      </button>

      <div className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center">
        <div
          style={{
            fontSize: 64,
            marginBottom: 8,
            filter: "drop-shadow(0 0 20px rgba(255,59,59,0.5))",
          }}
        >
          {boss.emoji}
        </div>

        <p
          className="font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: colors.accent }}
        >
          Level 10 · Boss
        </p>

        <h1
          className="mt-1 font-display text-[22px] font-black"
          style={{ color: colors.text, textShadow: colors.glow }}
        >
          {boss.name}
        </h1>

        <p className="mt-1 font-['DM_Sans'] text-[11px]" style={{ color: colors.textMuted }}>
          {boss.title}
        </p>

        <p
          className="mt-1 text-center font-['DM_Sans'] text-[11px] leading-[1.45]"
          style={{ color: colors.textMuted }}
        >
          {boss.description}
        </p>

        <div className="mt-5 flex w-full flex-col gap-2">
          {constraints.map((constraint) => (
            <div
              key={`${constraint.emoji}-${constraint.title}`}
              className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
              style={{
                background: "rgba(255,59,59,0.08)",
                border: "1px solid rgba(255,59,59,0.2)",
              }}
            >
              <span style={{ fontSize: 18 }}>{constraint.emoji}</span>
              <div>
                <p className="font-display text-[11px] font-bold" style={{ color: colors.text }}>
                  {constraint.title}
                </p>
                <p className="font-['DM_Sans'] text-[9px]" style={{ color: colors.textMuted }}>
                  {constraint.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={gameId === null}
          onClick={() => {
            if (gameId !== null) navigate("play", gameId);
          }}
          className="mt-5 w-full rounded-xl py-3.5 font-display text-sm font-extrabold tracking-[0.1em] text-white transition-opacity disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FF3B3B, #FF6B3B)",
            boxShadow: "0 0 30px rgba(255,59,59,0.4)",
          }}
        >
          FIGHT BOSS
        </button>
      </div>
    </div>
  );
};

export default BossRevealPage;
