/**
 * GameOverModal - PixiJS modal shown when the game ends (not victory)
 * Displays: final level, total score, cubes earned
 */

import { useCallback, useEffect, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal } from '../ui';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { useAnimationSequence } from '@/pixi/design/animation';
import { color, ease } from '@/pixi/design/tokens';


interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain?: () => void;
  onGoHome: () => void;
  screenWidth: number;
  screenHeight: number;
  // Game stats
  level: number;
  totalScore: number;
  totalCubes: number;
  maxCombo: number;
}

export const GameOverModal = ({
  isOpen,
  onClose,
  onPlayAgain,
  onGoHome,
  screenWidth,
  screenHeight,
  level,
  totalScore,
  totalCubes,
  maxCombo,
}: GameOverModalProps) => {
  const modalWidth = 340;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 48;
  const buttonSpacing = 12;

  const steps = useMemo(() => [
    { id: 'iconScale', delay: 100, duration: 400, from: 0, to: 1, ease: ease.outBack },
    { id: 'iconAlpha', delay: 100, duration: 400, from: 0, to: 1, ease: ease.outCubic },
    { id: 'statsBox', delay: 600, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'stat0', delay: 800, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'stat1', delay: 1000, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'stat2', delay: 1200, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'stat3', delay: 1400, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'buttons', delay: 1800, duration: 200, from: 0, to: 1, ease: ease.linear },
  ], []);

  const seq = useAnimationSequence(steps);

  useEffect(() => {
    if (isOpen) seq.play();
    else seq.reset();
  }, [isOpen]);

  // Stat row component
  const StatRow = ({ label, value, color: valueColor = color.text.primary, y }: { label: string; value: string | number; color?: number; y: number }) => {
    const labelStyle = useMemo(() => new TextStyle({
      fontFamily: FONT_BODY,
      fontSize: 14,
      fill: color.text.secondary,
    }), []);

    const valueStyle = useMemo(() => new TextStyle({
      fontFamily: FONT_TITLE,
      fontSize: 22,
      fontWeight: 'bold',
      fill: valueColor,
    }), [valueColor]);

    return (
      <pixiContainer y={y}>
        <pixiText text={label} x={0} y={0} style={labelStyle} eventMode="none" />
        <pixiText text={String(value)} x={buttonWidth} y={0} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />
      </pixiContainer>
    );
  };

  // Draw stats background
  const drawStatsBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = 160;
    const radius = 12;
    
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: color.bg.primary, alpha: 0.9 });
    g.stroke({ color: color.bg.surface, width: 1, alpha: 0.4 });
  }, [buttonWidth]);

  // Draw game over icon
  const drawGameOverIcon = useCallback((g: PixiGraphics) => {
    g.clear();
    const size = 64;
    
    // Red circle background
    g.circle(size / 2, size / 2, size / 2);
    g.fill({ color: color.status.danger, alpha: 0.9 });
    
    // X mark
    const pad = 18;
    g.moveTo(pad, pad);
    g.lineTo(size - pad, size - pad);
    g.moveTo(size - pad, pad);
    g.lineTo(pad, size - pad);
    g.stroke({ color: color.text.primary, width: 4 });
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GAME OVER"
      subtitle={`YOU REACHED LEVEL ${level}`}
      width={modalWidth}
      contentHeight={380}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <pixiContainer x={24} y={0}>
        {/* Game over icon */}
        <pixiContainer x={(buttonWidth - 64) / 2} y={0} scale={seq.get('iconScale')} alpha={seq.get('iconAlpha')}>
          <pixiGraphics draw={drawGameOverIcon} eventMode="none" />
        </pixiContainer>

        {/* Stats box */}
        <pixiContainer y={80} alpha={seq.get('statsBox')}>
          <pixiGraphics draw={drawStatsBox} eventMode="none" />
          
          <pixiContainer x={16} y={16}>
            <pixiContainer alpha={seq.get('stat0')}>
              <StatRow label="Final Level" value={level} y={0} />
            </pixiContainer>
            <pixiContainer alpha={seq.get('stat1')}>
              <StatRow label="Total Score" value={totalScore} y={40} />
            </pixiContainer>
            <pixiContainer alpha={seq.get('stat2')}>
              <StatRow label="Cubes Earned" value={totalCubes} color={color.accent.gold} y={80} />
            </pixiContainer>
            <pixiContainer alpha={seq.get('stat3')}>
              <StatRow label="Max Combo" value={`${maxCombo}x`} color={color.accent.blue} y={120} />
            </pixiContainer>
          </pixiContainer>
        </pixiContainer>

        {/* Buttons */}
        <pixiContainer alpha={seq.get('buttons')}>
          {onPlayAgain && (
            <PixiButton
              label="PLAY AGAIN"
              y={260}
              width={buttonWidth}
              height={buttonHeight}
              variant="orange"
              onPress={onPlayAgain}
            />
          )}

          <PixiButton
            label="BACK TO HOME"
            y={onPlayAgain ? 260 + buttonHeight + buttonSpacing : 260}
            width={buttonWidth}
            height={buttonHeight}
            variant="purple"
            onPress={onGoHome}
          />
        </pixiContainer>
      </pixiContainer>
    </Modal>
  );
};

export default GameOverModal;
