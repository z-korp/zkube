import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { BonusButton } from './BonusButton';
import type { BonusButtonData } from './BonusButton';
import { ComboDisplay } from './ComboDisplay';
import { SurrenderButton } from './SurrenderButton';
import { BonusType } from '@/dojo/game/types/bonus';
import { type ThemeId } from '../../utils/colors';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';

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
  const { colors, themeName } = usePixiTheme();

  const barCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.ActionBar),
    [themeName],
  );
  const barTex = useTextureWithFallback(barCandidates);

  const buttonSize = Math.min(52, height - 12);
  const buttonGap = Math.round(12);
  const bonusCount = bonusSlots.length;

  const pillPadX = 16;
  const pillPadY = 6;

  const bonusSectionWidth = bonusCount * buttonSize + (bonusCount - 1) * buttonGap;

  const surrenderW = 34;
  const surrenderH = buttonSize * 0.65;

  const comboWidth = 50;
  const totalContentW = bonusSectionWidth + (combo > 0 ? comboWidth + 8 : 0) + (showSurrender ? surrenderW + 8 : 0);
  const pillW = totalContentW + pillPadX * 2;
  const pillH = height - pillPadY * 2;
  const pillX = Math.round((width - pillW) / 2);
  const pillY = pillPadY;
  const pillRadius = pillH / 2;

  const bonusStartX = pillX + pillPadX;
  const bonusCenterY = pillY + (pillH - buttonSize) / 2;

  const surrenderX = pillX + pillW - pillPadX - surrenderW;
  const surrenderY2 = pillY + (pillH - surrenderH) / 2;

  const comboRightEdge = showSurrender ? surrenderX - 8 : pillX + pillW - pillPadX;
  const comboX = comboRightEdge - comboWidth;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();

    if (!barTex) {
      g.roundRect(pillX, pillY, pillW, pillH, pillRadius);
      g.fill({ color: colors.actionBarBg, alpha: 0.92 });

      g.roundRect(pillX, pillY, pillW, pillH, pillRadius);
      g.stroke({ color: colors.hudBarBorder, width: 1.5, alpha: 0.3 });
    }
  }, [pillX, pillY, pillW, pillH, pillRadius, colors, barTex]);

  return (
    <pixiContainer y={y}>
      {barTex ? (
        <pixiSprite texture={barTex} x={pillX} y={pillY} width={pillW} height={pillH} />
      ) : (
        <pixiGraphics draw={drawBackground} />
      )}

      {bonusSlots.map((slot, index) => (
        <BonusButton
          key={slot.type}
          {...slot}
          x={bonusStartX + index * (buttonSize + buttonGap)}
          y={bonusCenterY}
          size={buttonSize}
          isSelected={selectedBonus === slot.bonusType}
          isDisabled={isDisabled || slot.count === 0}
        />
      ))}

      <ComboDisplay
        combo={combo} maxCombo={maxCombo}
        x={comboX} y={pillY + (pillH - 40) / 2} height={40}
      />

      {showSurrender && (
        <SurrenderButton
          x={surrenderX} y={surrenderY2}
          width={surrenderW} height={surrenderH}
          onClick={onSurrender} isDisabled={isDisabled}
        />
      )}
    </pixiContainer>
  );
};

export default ActionBar;
