/**
 * LevelCompleteModal - PixiJS modal shown after completing a level
 * Displays: star rating, score, bonuses awarded, cubes earned
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal, Button } from '../ui';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';

const MODAL_TITLE_STYLE = new TextStyle({
  fontFamily: FONT_BODY,
  fontSize: 22,
  fontWeight: 'bold',
  fill: 0xffffff,
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
  totalCubes,
}: LevelCompleteModalProps) => {
  const [animatedStars, setAnimatedStars] = useState(0);

  const modalWidth = 340;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 52;

  // Animate stars appearing
  useEffect(() => {
    if (!isOpen) {
      setAnimatedStars(0);
      return;
    }

    const delays = [200, 500, 800];
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < stars; i++) {
      timers.push(setTimeout(() => {
        setAnimatedStars(i + 1);
      }, delays[i]));
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen, stars]);

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
      g.fill({ color: 0xfbbf24 });
      g.stroke({ color: 0xf59e0b, width: 2 });
    } else {
      g.fill({ color: 0x374151, alpha: 0.5 });
      g.stroke({ color: 0x4b5563, width: 2 });
    }
  }, []);

  // Draw stats box
  const drawStatsBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = bonusAwarded ? 140 : 100;
    const radius = 12;
    
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: 0x1e293b, alpha: 0.9 });
    g.stroke({ color: 0x334155, width: 1, alpha: 0.4 });
  }, [buttonWidth, bonusAwarded]);

  // Draw bonus awarded box
  const drawBonusBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = 50;
    const radius = 10;
    
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: 0x166534, alpha: 0.4 });
    g.stroke({ color: 0x22c55e, width: 1.5, alpha: 0.6 });
  }, [buttonWidth]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 13,
    fill: 0x94a3b8,
  }), []);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 18,
    fontWeight: 'bold',
    fill: 0xffffff,
  }), []);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 18,
    fontWeight: 'bold',
    fill: 0xfbbf24,
  }), []);

  const bonusTextStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 14,
    fill: 0x22c55e,
  }), []);

  const starSize = 48;
  const starGap = 16;
  const starsWidth = starSize * 3 + starGap * 2;
  const starsStartX = (buttonWidth - starsWidth) / 2;

  const drawStar0 = useCallback((g: PixiGraphics) => drawStar(g, animatedStars > 0, starSize), [drawStar, animatedStars, starSize]);
  const drawStar1 = useCallback((g: PixiGraphics) => drawStar(g, animatedStars > 1, starSize), [drawStar, animatedStars, starSize]);
  const drawStar2 = useCallback((g: PixiGraphics) => drawStar(g, animatedStars > 2, starSize), [drawStar, animatedStars, starSize]);
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
      <pixiContainer x={24} y={0}>
        {/* Stars display */}
        <pixiContainer y={10}>
          {[0, 1, 2].map((i) => (
            <pixiContainer 
              key={i} 
              x={starsStartX + i * (starSize + starGap) + starSize / 2}
              y={starSize / 2}
              scale={animatedStars > i ? 1 : 0.8}
              alpha={animatedStars > i ? 1 : 0.4}
            >
              <pixiGraphics draw={starDraws[i]} />
            </pixiContainer>
          ))}
        </pixiContainer>

        {/* Stats box */}
        <pixiContainer y={70}>
          <pixiGraphics draw={drawStatsBox} />
          
          <pixiContainer x={16} y={12}>
             {/* Score */}
             <pixiText text="LEVEL SCORE" x={0} y={0} style={labelStyle} />
             <pixiText 
               text={`${levelScore} / ${targetScore}`} 
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
         <Button
           text="CONTINUE"
           y={bonusAwarded ? 230 : 190}
           width={buttonWidth}
           height={buttonHeight}
           variant="primary"
           onClick={onClose}
         />
      </pixiContainer>
    </Modal>
  );
};

export default LevelCompleteModal;
