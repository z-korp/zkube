/**
 * GameOverModal - PixiJS modal shown when the game ends (not victory)
 * Displays: final level, total score, cubes earned
 */

import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal, Button } from '../ui';
import { usePixiTheme } from '../../themes/ThemeContext';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

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
  const { colors } = usePixiTheme();

  const modalWidth = 340;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 48;
  const buttonSpacing = 12;

  // Stat row component
  const StatRow = ({ label, value, color = 0xffffff, y }: { label: string; value: string | number; color?: number; y: number }) => {
    const labelStyle = useMemo(() => new TextStyle({
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 14,
      fill: 0x94a3b8,
    }), []);

    const valueStyle = useMemo(() => new TextStyle({
      fontFamily: FONT,
      fontSize: 22,
      fontWeight: 'bold',
      fill: color,
    }), [color]);

    return (
      <pixiContainer y={y}>
        <pixiText text={label} x={0} y={0} style={labelStyle} />
        <pixiText text={String(value)} x={buttonWidth} y={0} anchor={{ x: 1, y: 0 }} style={valueStyle} />
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
    g.fill({ color: 0x1e293b, alpha: 0.9 });
    g.stroke({ color: 0x334155, width: 1, alpha: 0.4 });
  }, [buttonWidth]);

  // Draw game over icon
  const drawGameOverIcon = useCallback((g: PixiGraphics) => {
    g.clear();
    const size = 64;
    
    // Red circle background
    g.circle(size / 2, size / 2, size / 2);
    g.fill({ color: 0xef4444, alpha: 0.9 });
    
    // X mark
    const pad = 18;
    g.moveTo(pad, pad);
    g.lineTo(size - pad, size - pad);
    g.moveTo(size - pad, pad);
    g.lineTo(pad, size - pad);
    g.stroke({ color: 0xffffff, width: 4 });
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Game Over"
      subtitle={`You reached level ${level}`}
      width={modalWidth}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={false}
    >
      <pixiContainer x={24} y={0}>
        {/* Game over icon */}
        <pixiContainer x={(buttonWidth - 64) / 2} y={0}>
          <pixiGraphics draw={drawGameOverIcon} />
        </pixiContainer>

        {/* Stats box */}
        <pixiContainer y={80}>
          <pixiGraphics draw={drawStatsBox} />
          
          <pixiContainer x={16} y={16}>
            <StatRow label="Final Level" value={level} y={0} />
            <StatRow label="Total Score" value={totalScore} y={40} />
            <StatRow label="Cubes Earned" value={totalCubes} color={0xfbbf24} y={80} />
            <StatRow label="Max Combo" value={`${maxCombo}x`} color={0x60a5fa} y={120} />
          </pixiContainer>
        </pixiContainer>

        {/* Buttons */}
        {onPlayAgain && (
          <Button
            text="Play Again"
            y={260}
            width={buttonWidth}
            height={buttonHeight}
            variant="primary"
            onClick={onPlayAgain}
          />
        )}

        <Button
          text="Back to Home"
          y={onPlayAgain ? 260 + buttonHeight + buttonSpacing : 260}
          width={buttonWidth}
          height={buttonHeight}
          variant="secondary"
          onClick={onGoHome}
        />
      </pixiContainer>
    </Modal>
  );
};

export default GameOverModal;
