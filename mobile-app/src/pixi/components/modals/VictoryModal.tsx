/**
 * VictoryModal - PixiJS modal shown when player completes all 50 levels
 * Displays: celebration, final stats, share option
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { useTick } from '@pixi/react';
import { Modal, Button } from '../ui';
import { usePixiTheme } from '../../themes/ThemeContext';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';


interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome: () => void;
  onShare?: () => void;
  screenWidth: number;
  screenHeight: number;
  // Game stats
  totalScore: number;
  totalCubes: number;
  maxCombo: number;
}

// Confetti particle
interface Confetti {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: number;
  size: number;
}

export const VictoryModal = ({
  isOpen,
  onClose,
  onGoHome,
  onShare,
  screenWidth,
  screenHeight,
  totalScore,
  totalCubes,
  maxCombo,
}: VictoryModalProps) => {
  const { colors } = usePixiTheme();
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const frameRef = useRef(0);

  const modalWidth = 360;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 48;
  const buttonSpacing = 12;

  // Initialize confetti when modal opens
  useEffect(() => {
    if (!isOpen) {
      setConfetti([]);
      return;
    }

    const colors = [0xfbbf24, 0x22c55e, 0x3b82f6, 0xef4444, 0xa855f7, 0xec4899];
    const particles: Confetti[] = [];
    
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: i,
        x: modalWidth / 2 + (Math.random() - 0.5) * 100,
        y: -20 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
      });
    }
    setConfetti(particles);
  }, [isOpen, modalWidth]);

  // Animate confetti via PixiJS ticker
  const confettiActive = isOpen && confetti.length > 0;
  const tickConfetti = useCallback((ticker: { deltaMS: number }) => {
    const dt = ticker.deltaMS / 16.667;
    frameRef.current++;
    setConfetti(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + 0.05 * dt, // Gravity
      rotation: p.rotation + p.rotationSpeed * dt,
    })).filter(p => p.y < 500)); // Remove particles that fall off
  }, []);
  useTick(tickConfetti, confettiActive);

  // Draw stats background
  const drawStatsBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = 120;
    const radius = 12;
    
    // Golden gradient feel
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: 0x1e293b, alpha: 0.9 });
    g.stroke({ color: 0xfbbf24, width: 2, alpha: 0.6 });
  }, [buttonWidth]);

  // Draw trophy icon
  const drawTrophy = useCallback((g: PixiGraphics) => {
    g.clear();
    const size = 72;
    
    // Golden circle
    g.circle(size / 2, size / 2, size / 2);
    g.fill({ color: 0xfbbf24, alpha: 1 });
    
    // Trophy shape (simplified)
    g.moveTo(size * 0.3, size * 0.25);
    g.lineTo(size * 0.7, size * 0.25);
    g.lineTo(size * 0.65, size * 0.55);
    g.lineTo(size * 0.35, size * 0.55);
    g.closePath();
    g.fill({ color: 0x1e293b });
    
    // Trophy stem
    g.rect(size * 0.4, size * 0.55, size * 0.2, size * 0.15);
    g.fill({ color: 0x1e293b });
    
    // Trophy base
    g.rect(size * 0.3, size * 0.7, size * 0.4, size * 0.08);
    g.fill({ color: 0x1e293b });
  }, []);

  // Draw single confetti piece
  const drawConfettiPiece = useCallback((g: PixiGraphics, p: Confetti) => {
    g.clear();
    g.rect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    g.fill({ color: p.color, alpha: 0.9 });
  }, []);

  const titleStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 28,
    fill: 0xfbbf24,
    dropShadow: {
      alpha: 0.5,
      angle: Math.PI / 4,
      blur: 4,
      distance: 2,
      color: 0x000000,
    },
  }), []);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 13,
    fill: 0x94a3b8,
  }), []);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 20,
    fontWeight: 'bold',
    fill: 0xffffff,
  }), []);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 20,
    fontWeight: 'bold',
    fill: 0xfbbf24,
  }), []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      width={modalWidth}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={false}
    >
      <pixiContainer x={24} y={-20}>
        {/* Confetti */}
        {confetti.map(p => (
          <pixiGraphics
            key={p.id}
            x={p.x}
            y={p.y}
            rotation={p.rotation}
            draw={(g) => drawConfettiPiece(g, p)}
          />
        ))}

        {/* Trophy icon */}
        <pixiContainer x={(buttonWidth - 72) / 2} y={0}>
          <pixiGraphics draw={drawTrophy} />
        </pixiContainer>

        {/* Victory text */}
        <pixiText
          text="VICTORY!"
          x={buttonWidth / 2}
          y={85}
          anchor={{ x: 0.5, y: 0 }}
          style={titleStyle}
        />

        <pixiText
          text="You completed all 50 levels!"
          x={buttonWidth / 2}
          y={120}
          anchor={{ x: 0.5, y: 0 }}
          style={labelStyle}
        />

        {/* Stats box */}
        <pixiContainer y={150}>
          <pixiGraphics draw={drawStatsBox} />
          
          <pixiContainer x={16} y={16}>
            {/* Total Score */}
            <pixiText text="Total Score" x={0} y={0} style={labelStyle} />
            <pixiText text={String(totalScore)} x={buttonWidth - 32} y={0} anchor={{ x: 1, y: 0 }} style={valueStyle} />
            
            {/* Cubes Earned */}
            <pixiText text="Cubes Earned" x={0} y={36} style={labelStyle} />
            <pixiText text={String(totalCubes)} x={buttonWidth - 32} y={36} anchor={{ x: 1, y: 0 }} style={cubeStyle} />
            
            {/* Max Combo */}
            <pixiText text="Max Combo" x={0} y={72} style={labelStyle} />
            <pixiText text={`${maxCombo}x`} x={buttonWidth - 32} y={72} anchor={{ x: 1, y: 0 }} style={valueStyle} />
          </pixiContainer>
        </pixiContainer>

        {/* Buttons */}
        {onShare && (
          <Button
            text="Share Victory"
            y={290}
            width={buttonWidth}
            height={buttonHeight}
            variant="primary"
            onClick={onShare}
          />
        )}

        <Button
          text="Back to Home"
          y={onShare ? 290 + buttonHeight + buttonSpacing : 290}
          width={buttonWidth}
          height={buttonHeight}
          variant="secondary"
          onClick={onGoHome}
        />
      </pixiContainer>
    </Modal>
  );
};

export default VictoryModal;
