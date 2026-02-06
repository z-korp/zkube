import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { BonusButton } from './BonusButton';
import type { BonusButtonData } from './BonusButton';
import { ComboDisplay } from './ComboDisplay';
import { SurrenderButton } from './SurrenderButton';
import { BonusType } from '@/dojo/game/types/bonus';

interface BonusSlot extends BonusButtonData {
  bonusType: BonusType;
  onClick: () => void;
}

interface ActionBarProps {
  bonusSlots: BonusSlot[];
  selectedBonus: BonusType;
  combo: number;
  maxCombo: number;
  stars: number;
  width: number;
  height: number;
  y?: number;
  isDisabled?: boolean;
  onSurrender?: () => void;
  showSurrender?: boolean;
}

export const ActionBar = ({
  bonusSlots,
  selectedBonus,
  combo,
  maxCombo,
  stars,
  width,
  height,
  y = 0,
  isDisabled = false,
  onSurrender,
  showSurrender = true,
}: ActionBarProps) => {
  const { colors, isProcedural } = usePixiTheme();

  const padding = 10;
  const buttonSize = Math.min(46, height - 10);
  const buttonGap = 8;
  const bonusCount = bonusSlots.length;

  const bonusSectionWidth = bonusCount * buttonSize + (bonusCount - 1) * buttonGap;
  const bonusStartX = padding;

  const surrenderWidth = 38;
  const surrenderHeight = buttonSize * 0.75;
  const surrenderX = width - padding - surrenderWidth;
  const surrenderY = (height - surrenderHeight) / 2;

  const comboWidth = 50;
  const rightEdge = showSurrender ? surrenderX - 8 : width - padding;
  const comboX = rightEdge - comboWidth;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, width, height);
    g.fill({ color: isProcedural ? 0x0a0a0f : 0x0f172a, alpha: 0.85 });
    g.moveTo(0, 0.5);
    g.lineTo(width, 0.5);
    g.stroke({ color: isProcedural ? colors.accent : 0x334155, width: 0.5, alpha: 0.3 });
  }, [width, height, isProcedural, colors.accent]);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBackground} />

      {bonusSlots.map((slot, index) => (
        <BonusButton
          key={slot.type}
          {...slot}
          x={bonusStartX + index * (buttonSize + buttonGap)}
          y={(height - buttonSize) / 2}
          size={buttonSize}
          isSelected={selectedBonus === slot.bonusType}
          isDisabled={isDisabled || slot.count === 0}
        />
      ))}

      <ComboDisplay
        combo={combo} maxCombo={maxCombo}
        x={comboX} y={(height - 40) / 2} height={40}
      />

      {showSurrender && (
        <SurrenderButton
          x={surrenderX} y={surrenderY}
          width={surrenderWidth} height={surrenderHeight}
          onClick={onSurrender} isDisabled={isDisabled}
        />
      )}
    </pixiContainer>
  );
};

export default ActionBar;
