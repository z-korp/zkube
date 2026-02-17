/**
 * LevelCompleteModal - PixiJS modal shown after completing a level
 * Displays: star rating, score, bonuses awarded, cubes earned
 */

import { useCallback, useMemo, useEffect } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal } from '../ui';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { useAnimationSequence, useCountUp } from '@/pixi/design/animation';
import { color, ease, duration } from '@/pixi/design/tokens';

const STAR_STROKE = 0xf59e0b;
const EMPTY_STAR_FILL = 0x374151;
const EMPTY_STAR_STROKE = 0x4b5563;
const BONUS_BOX_BG = color.status.successDark;

const MODAL_TITLE_STYLE = new TextStyle({
  fontFamily: FONT_BODY,
  fontSize: 22,
  fontWeight: 'bold',
  fill: color.text.primary,
});


interface LevelCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenWidth: number;
  screenHeight: number;
  level: number;
  levelScore: number;
  targetScore: number;
  stars: number; // 1-3
  bonusAwarded?: {
    type: string;
    icon: string;
  } | null;
  cubesEarned: number;
  totalCubes: number;
}

export const LevelCompleteModal = ({
  isOpen,
  onClose,
  screenWidth,
  screenHeight,
  level,
  levelScore,
  targetScore,
  stars,
  bonusAwarded,
  cubesEarned,
  totalCubes: _totalCubes,
}: LevelCompleteModalProps) => {
  const modalWidth = 340;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 52;

  const steps = useMemo(() => [
    { id: 'titleScale', delay: 100, duration: 300, from: 0.8, to: 1.0, ease: ease.outCubic },
    { id: 'titleAlpha', delay: 100, duration: 300, from: 0, to: 1, ease: ease.outCubic },
    { id: 'star0', delay: 400, duration: 400, from: 0, to: 1, ease: ease.outBack },
    { id: 'star1', delay: 600, duration: 400, from: 0, to: 1, ease: ease.outBack },
    { id: 'star2', delay: 800, duration: 400, from: 0, to: 1, ease: ease.outBack },
    { id: 'statsAlpha', delay: 1000, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'buttonAlpha', delay: 1500, duration: 300, from: 0, to: 1, ease: ease.linear },
  ], []);

  const seq = useAnimationSequence(steps);
  const scoreTarget = isOpen && seq.elapsed >= 1200 ? levelScore : 0;
  const displayScore = useCountUp(scoreTarget, duration.scoreCountUp, ease.outCubic);

  useEffect(() => {
    if (isOpen) seq.play();
    else seq.reset();
  }, [isOpen]);

  // Draw star
  const drawStar = useCallback((g: PixiGraphics, filled: boolean, size: number) => {
    g.clear();
    
    const points = 5;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    
    g.moveTo(0, -outerRadius);
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      g.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    
    g.closePath();
    
    if (filled) {
      g.fill({ color: color.accent.gold });
      g.stroke({ color: STAR_STROKE, width: 2 });
    } else {
      g.fill({ color: EMPTY_STAR_FILL, alpha: 0.5 });
      g.stroke({ color: EMPTY_STAR_STROKE, width: 2 });
    }
  }, []);

  // Draw stats box
  const drawStatsBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = bonusAwarded ? 140 : 100;
    const radius = 12;
    
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: color.bg.primary, alpha: 0.9 });
    g.stroke({ color: color.bg.surface, width: 1, alpha: 0.4 });
  }, [buttonWidth, bonusAwarded]);

  // Draw bonus awarded box
  const drawBonusBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = 50;
    const radius = 10;
    
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: BONUS_BOX_BG, alpha: 0.4 });
    g.stroke({ color: color.status.success, width: 1.5, alpha: 0.6 });
  }, [buttonWidth]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 13,
    fill: color.text.secondary,
  }), []);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 18,
    fontWeight: 'bold',
    fill: color.text.primary,
  }), []);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 18,
    fontWeight: 'bold',
    fill: color.accent.gold,
  }), []);

  const bonusTextStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 14,
    fill: color.status.success,
  }), []);

  const starSize = 48;
  const starGap = 16;
  const starsWidth = starSize * 3 + starGap * 2;
  const starsStartX = (buttonWidth - starsWidth) / 2;

  const drawStar0 = useCallback((g: PixiGraphics) => drawStar(g, stars > 0, starSize), [drawStar, stars, starSize]);
  const drawStar1 = useCallback((g: PixiGraphics) => drawStar(g, stars > 1, starSize), [drawStar, stars, starSize]);
  const drawStar2 = useCallback((g: PixiGraphics) => drawStar(g, stars > 2, starSize), [drawStar, stars, starSize]);
  const starDraws = useMemo(() => [drawStar0, drawStar1, drawStar2], [drawStar0, drawStar1, drawStar2]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`LEVEL ${level} COMPLETE!`}
      titleStyle={MODAL_TITLE_STYLE}
      width={modalWidth}
      contentHeight={290}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <pixiContainer x={24} y={0} scale={seq.get('titleScale')} alpha={seq.get('titleAlpha')}>
        {/* Stars display */}
        <pixiContainer y={10}>
          {[0, 1, 2].map((i) => (
            <pixiContainer
              key={i} 
              x={starsStartX + i * (starSize + starGap) + starSize / 2}
              y={starSize / 2}
              scale={i < stars ? seq.get(`star${i}`) : seq.get(`star${i}`) * 0.85 + 0.15}
              alpha={i < stars ? seq.get(`star${i}`) : seq.get(`star${i}`) * 0.6 + 0.4}
            >
              <pixiGraphics draw={starDraws[i]} />
            </pixiContainer>
          ))}
        </pixiContainer>

        {/* Stats box */}
        <pixiContainer y={70} alpha={seq.get('statsAlpha')}>
          <pixiGraphics draw={drawStatsBox} />
          
          <pixiContainer x={16} y={12}>
             {/* Score */}
             <pixiText text="LEVEL SCORE" x={0} y={0} style={labelStyle} />
              <pixiText 
                text={`${displayScore} / ${targetScore}`} 
                x={buttonWidth - 32} 
                y={0} 
                anchor={{ x: 1, y: 0 }} 
                style={valueStyle} 
              />
             
             {/* Cubes earned this level */}
             <pixiText text="CUBES EARNED" x={0} y={36} style={labelStyle} />
            <pixiText 
              text={cubesEarned > 0 ? `+${cubesEarned}` : '0'} 
              x={buttonWidth - 32} 
              y={36} 
              anchor={{ x: 1, y: 0 }} 
              style={cubeStyle} 
            />

            {/* Bonus awarded (if any) */}
            {bonusAwarded && (
              <pixiContainer y={72}>
                <pixiGraphics draw={drawBonusBox} x={-8} y={-4} />
                <pixiText 
                  text={`Bonus: ${bonusAwarded.icon} ${bonusAwarded.type}`}
                  x={(buttonWidth - 32) / 2}
                  y={12}
                  anchor={{ x: 0.5, y: 0 }}
                  style={bonusTextStyle}
                />
              </pixiContainer>
            )}
          </pixiContainer>
        </pixiContainer>

        {/* Continue button */}
        <pixiContainer alpha={seq.get('buttonAlpha')}>
          <PixiButton
            label="CONTINUE"
            y={bonusAwarded ? 230 : 190}
            width={buttonWidth}
            height={buttonHeight}
            variant="green"
            onPress={onClose}
          />
        </pixiContainer>
      </pixiContainer>
    </Modal>
  );
};

export default LevelCompleteModal;
