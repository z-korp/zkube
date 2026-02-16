/**
 * VictoryModal - PixiJS modal shown when player completes all 50 levels
 * Displays: celebration, final stats, share option
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { useTick } from '@pixi/react';
import { Modal } from '../ui';
import { PixiButton } from '../../ui/PixiButton';
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
  const confettiRef = useRef<Confetti[]>([]);
  const confettiGfxRef = useRef<PixiGraphics | null>(null);

  const modalWidth = 360;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 48;
  const buttonSpacing = 12;

  useEffect(() => {
    if (!isOpen) {
      confettiRef.current = [];
      const g = confettiGfxRef.current;
      if (g) g.clear();
      return;
    }

    const confettiColors = [0xfbbf24, 0x22c55e, 0x3b82f6, 0xef4444, 0xa855f7, 0xec4899];
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
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: 6 + Math.random() * 6,
      });
    }
    confettiRef.current = particles;
  }, [isOpen, modalWidth]);

  const tickConfetti = useCallback((ticker: { deltaMS: number }) => {
    const ps = confettiRef.current;
    if (ps.length === 0) return;

    const dt = ticker.deltaMS / 16.667;
    let writeIdx = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.05 * dt;
      p.rotation += p.rotationSpeed * dt;
      if (p.y < 500) {
        ps[writeIdx++] = p;
      }
    }
    ps.length = writeIdx;

    const g = confettiGfxRef.current;
    if (!g) return;
    g.clear();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      g.setFillStyle({ color: p.color, alpha: 0.9 });
      g.rect(p.x - p.size / 2, p.y - p.size / 4, p.size, p.size / 2);
      g.fill();
    }
  }, []);
  useTick((ticker) => {
    if (!isOpen) return;
    tickConfetti(ticker);
  });

  const captureConfettiGfx = useCallback((g: PixiGraphics) => {
    confettiGfxRef.current = g;
  }, []);

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
      contentHeight={430}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <pixiContainer x={24} y={-20}>
        {/* Confetti — single imperative Graphics, drawn in tick */}
        <pixiGraphics draw={captureConfettiGfx} eventMode="none" />

        {/* Trophy icon */}
        <pixiContainer x={(buttonWidth - 72) / 2} y={0}>
          <pixiGraphics draw={drawTrophy} eventMode="none" />
        </pixiContainer>

        {/* Victory text */}
        <pixiText
          text="VICTORY!"
          x={buttonWidth / 2}
          y={85}
          anchor={{ x: 0.5, y: 0 }}
          style={titleStyle}
          eventMode="none"
        />

        <pixiText
          text="YOU COMPLETED ALL 50 LEVELS!"
          x={buttonWidth / 2}
          y={120}
          anchor={{ x: 0.5, y: 0 }}
          style={labelStyle}
          eventMode="none"
        />

        {/* Stats box */}
        <pixiContainer y={150}>
          <pixiGraphics draw={drawStatsBox} eventMode="none" />
          
          <pixiContainer x={16} y={16}>
            {/* Total Score */}
            <pixiText text="Total Score" x={0} y={0} style={labelStyle} eventMode="none" />
            <pixiText text={String(totalScore)} x={buttonWidth - 32} y={0} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />
            
            {/* Cubes Earned */}
            <pixiText text="Cubes Earned" x={0} y={36} style={labelStyle} eventMode="none" />
            <pixiText text={String(totalCubes)} x={buttonWidth - 32} y={36} anchor={{ x: 1, y: 0 }} style={cubeStyle} eventMode="none" />
            
            {/* Max Combo */}
            <pixiText text="Max Combo" x={0} y={72} style={labelStyle} eventMode="none" />
            <pixiText text={`${maxCombo}x`} x={buttonWidth - 32} y={72} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />
          </pixiContainer>
        </pixiContainer>

        {/* Buttons */}
        {onShare && (
          <PixiButton
            label="SHARE VICTORY"
            y={290}
            width={buttonWidth}
            height={buttonHeight}
            variant="orange"
            onPress={onShare}
          />
        )}

        <PixiButton
          label="BACK TO HOME"
          y={onShare ? 290 + buttonHeight + buttonSpacing : 290}
          width={buttonWidth}
          height={buttonHeight}
          variant="purple"
          onPress={onGoHome}
        />
      </pixiContainer>
    </Modal>
  );
};

export default VictoryModal;
