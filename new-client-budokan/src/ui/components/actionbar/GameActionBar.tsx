import { motion } from "motion/react";

import { getThemeColors, type ThemeId } from "@/config/themes";
import { getBonusType } from "@/config/mutatorConfig";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

interface GameActionBarProps {
  onMap: () => void;
  onSurrender: () => void;
  bonusType: number;
  bonusCharges: number;
  bonusSlot: number;
  onBonusActivate?: (slotIndex: number) => void;
  activeBonus?: number | null;
  disabled?: boolean;
}

const GameActionBar: React.FC<GameActionBarProps> = ({
  onMap,
  onSurrender,
  bonusType,
  bonusCharges,
  bonusSlot,
  onBonusActivate,
  activeBonus = null,
  disabled = false,
}) => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate as ThemeId);
  const hasBonus = bonusType > 0;
  const bonus = getBonusType(bonusType);
  const slotIsActive = activeBonus == null ? bonusSlot >= 0 : activeBonus === bonusSlot;
  const slotDisabled = disabled || bonusCharges <= 0;

  return (
    <div className="w-full px-2 pb-2 pt-1">
      <div
        className="mx-auto flex h-16 w-full max-w-[500px] items-center justify-between rounded-lg border bg-black/80 px-2.5 backdrop-blur-md"
        style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: `${colors.actionBarBg}D0` }}
      >
        <motion.button
          type="button"
          onClick={onMap}
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md disabled:opacity-50"
          style={{ color: colors.accent }}
        >
          <span className="text-base leading-none">◈</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.05em]">Map</span>
        </motion.button>

        {hasBonus ? (
          <div className="flex flex-1 items-center justify-center px-1">
            <motion.button
              type="button"
              onClick={() => onBonusActivate?.(bonusSlot)}
              whileTap={{ scale: 0.9 }}
              disabled={slotDisabled}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
              style={{
                borderColor: slotIsActive ? colors.accent : `${colors.border}`,
                backgroundColor: `${colors.surface}`,
                boxShadow: slotIsActive ? `0 0 14px ${colors.accent}88` : "none",
              }}
              title={`${bonus.name} (${bonusCharges})`}
            >
              <img src={bonus.icon} alt={bonus.name} className="h-6 w-6" draggable={false} />
              <span
                className="absolute -right-1 -top-1 min-w-[18px] rounded-full px-1 text-center text-[9px] font-bold leading-[18px]"
                style={{
                  color: "#091322",
                  backgroundColor: bonusCharges > 0 ? colors.accent2 : `${colors.textMuted}`,
                  boxShadow: `0 0 10px ${colors.accent2}66`,
                }}
              >
                {bonusCharges}
              </span>
            </motion.button>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <motion.button
          type="button"
          onClick={onSurrender}
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md disabled:opacity-50"
          style={{ color: "#ff7070" }}
        >
          <span className="text-sm leading-none">🏳</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.05em]">Surr</span>
        </motion.button>
      </div>
    </div>
  );
};

export type { GameActionBarProps };
export default GameActionBar;
