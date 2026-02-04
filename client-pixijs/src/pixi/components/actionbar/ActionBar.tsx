import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { BonusButton, BonusButtonData } from './BonusButton';
import { ComboDisplay } from './ComboDisplay';
import { StarRating } from './StarRating';
import { BonusType } from '@/dojo/game/types/bonus';

interface BonusSlot extends BonusButtonData {
  bonusType: BonusType;
  onClick: () => void;
}

interface ActionBarProps {
  /** Bonus button slots */
  bonusSlots: BonusSlot[];
  /** Currently selected bonus type (or None) */
  selectedBonus: BonusType;
  /** Current combo count */
  combo: number;
  /** Max combo this run */
  maxCombo: number;
  /** Stars earned this level (0-3) */
  stars: number;
  /** Width of the action bar */
  width: number;
  /** Height of the action bar */
  height: number;
  /** Y position */
  y?: number;
  /** Whether actions are disabled (tx processing) */
  isDisabled?: boolean;
}

/**
 * Bottom action bar containing bonus buttons, combo display, and star rating
 * 
 * Layout:
 * [Hammer] [Wave] [Totem]          [5x COMBO]  [***]
 */
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
}: ActionBarProps) => {
  const { colors, isProcedural } = usePixiTheme();

  // Layout calculations
  const padding = 8;
  const buttonSize = Math.min(48, height - 8);
  const buttonGap = 8;
  
  // Bonus buttons on the left
  const bonusStartX = padding;
  
  // Star rating on the right
  const starSize = 16;
  const starGap = 4;
  const starWidth = 3 * starSize + 2 * starGap;
  const starsX = width - padding - starWidth;
  const starsY = (height - starSize) / 2;
  
  // Combo display between bonuses and stars
  const comboWidth = 50;
  const comboX = starsX - comboWidth - 16;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Semi-transparent background
    g.rect(0, 0, width, height);
    g.fill({ color: isProcedural ? 0x0a0a0f : 0x1a2744, alpha: 0.85 });
    
    // Top border line
    g.moveTo(0, 0);
    g.lineTo(width, 0);
    g.stroke({ color: isProcedural ? colors.accent : 0x334155, width: 1, alpha: 0.3 });
  }, [width, height, isProcedural, colors.accent]);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBackground} />
      
      {/* Bonus buttons */}
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
      
      {/* Combo display */}
      <ComboDisplay
        combo={combo}
        maxCombo={maxCombo}
        x={comboX}
        y={(height - 40) / 2}
        height={40}
      />
      
      {/* Star rating */}
      <StarRating
        stars={stars}
        x={starsX}
        y={starsY}
        starSize={starSize}
        gap={starGap}
      />
    </pixiContainer>
  );
};

export default ActionBar;
