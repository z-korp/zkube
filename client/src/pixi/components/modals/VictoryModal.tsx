/**
 * VictoryModal - PixiJS modal shown when player completes all 50 levels
 * Displays: celebration, final stats, share option
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { Graphics as PixiGraphics, Text as PixiText, TextStyle } from 'pixi.js';
import { useTick } from '@pixi/react';
import { Modal } from '../ui';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { useAnimationSequence, useCountUp } from '@/pixi/design/animation';
import { color, ease } from '@/pixi/design/tokens';

const CONFETTI_PURPLE = 0xa855f7;
const CONFETTI_PINK = 0xec4899;


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
  life: number;
  maxLife: number;
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
  const titleTextRef = useRef<PixiText | null>(null);
  const titleCycleMsRef = useRef(0);

  const modalWidth = 360;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 48;
  const buttonSpacing = 12;

  const displayScore = useCountUp(isOpen ? totalScore : 0, 500, ease.outCubic);
  const displayCubes = useCountUp(isOpen ? totalCubes : 0, 500, ease.outCubic);

  const revealSteps = useMemo(() => [
    { id: 'trophyScaleUp', delay: 0, duration: 250, from: 0, to: 1.2, ease: ease.outBack },
    { id: 'trophyScaleSettle', delay: 250, duration: 150, from: 1.2, to: 1.0, ease: ease.outCubic },
    { id: 'trophyAlpha', delay: 100, duration: 300, from: 0, to: 1, ease: ease.outCubic },
    { id: 'titleAlpha', delay: 400, duration: 300, from: 0, to: 1, ease: ease.outCubic },
    { id: 'subtitleAlpha', delay: 600, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'statsAlpha', delay: 800, duration: 200, from: 0, to: 1, ease: ease.linear },
    { id: 'buttonsAlpha', delay: 1200, duration: 200, from: 0, to: 1, ease: ease.linear },
  ], []);
  const seq = useAnimationSequence(revealSteps);

  useEffect(() => {
    if (!isOpen) {
      seq.reset();
      confettiRef.current = [];
      titleCycleMsRef.current = 0;
      const titleText = titleTextRef.current;
      if (titleText) {
        titleText.style.fill = color.accent.gold;
      }
      const g = confettiGfxRef.current;
      if (g) g.clear();
      return;
    }

    seq.play();

    const confettiColors = [color.accent.gold, color.status.success, color.accent.blue, color.status.danger, CONFETTI_PURPLE, CONFETTI_PINK];
    const particles: Confetti[] = [];
    
    for (let i = 0; i < 120; i++) {
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
        life: 2000,
        maxLife: 2000,
      });
    }
    confettiRef.current = particles;
  }, [isOpen, modalWidth, seq.play, seq.reset]);

  const tickConfetti = useCallback((ticker: { deltaMS: number }) => {
    const ps = confettiRef.current;
    if (ps.length === 0) return;

    const dt = ticker.deltaMS / 16.667;
    let writeIdx = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.08 * dt;
      p.rotation += p.rotationSpeed * dt;
      p.life -= ticker.deltaMS;
      if (p.life > 0) {
        ps[writeIdx++] = p;
      }
    }
    ps.length = writeIdx;

    const g = confettiGfxRef.current;
    if (!g) return;
    g.clear();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      const drawSize = p.size * (0.3 + 0.7 * lifeRatio);
      const w = drawSize;
      const h = drawSize * 0.6;
      g.setFillStyle({ color: p.color, alpha: lifeRatio });
      g.rect(p.x - w / 2, p.y - h / 2, w, h);
      g.fill();
    }
  }, []);
  useTick((ticker) => {
    if (!isOpen) return;
    tickConfetti(ticker);

    titleCycleMsRef.current += ticker.deltaMS;
    const phase = (titleCycleMsRef.current * Math.PI * 2) / 1200;
    const mix = (Math.sin(phase) + 1) / 2;

    const gold = color.accent.gold;
    const white = color.text.primary;

    const r = Math.round(((gold >> 16) & 0xff) + (((white >> 16) & 0xff) - ((gold >> 16) & 0xff)) * mix);
    const g = Math.round(((gold >> 8) & 0xff) + (((white >> 8) & 0xff) - ((gold >> 8) & 0xff)) * mix);
    const b = Math.round((gold & 0xff) + ((white & 0xff) - (gold & 0xff)) * mix);
    const fill = (r << 16) | (g << 8) | b;

    const titleText = titleTextRef.current;
    if (titleText) {
      titleText.style.fill = fill;
    }
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
    g.fill({ color: color.bg.primary, alpha: 0.9 });
    g.stroke({ color: color.accent.gold, width: 2, alpha: 0.6 });
  }, [buttonWidth]);

  // Draw trophy icon
  const drawTrophy = useCallback((g: PixiGraphics) => {
    g.clear();
    const size = 72;
    
    // Golden circle
    g.circle(size / 2, size / 2, size / 2);
    g.fill({ color: color.accent.gold, alpha: 1 });
    
    // Trophy shape (simplified)
    g.moveTo(size * 0.3, size * 0.25);
    g.lineTo(size * 0.7, size * 0.25);
    g.lineTo(size * 0.65, size * 0.55);
    g.lineTo(size * 0.35, size * 0.55);
    g.closePath();
    g.fill({ color: color.bg.primary });
    
    // Trophy stem
    g.rect(size * 0.4, size * 0.55, size * 0.2, size * 0.15);
    g.fill({ color: color.bg.primary });
    
    // Trophy base
    g.rect(size * 0.3, size * 0.7, size * 0.4, size * 0.08);
    g.fill({ color: color.bg.primary });
  }, []);

  const titleStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 28,
    fill: color.accent.gold,
    dropShadow: {
      alpha: 0.5,
      angle: Math.PI / 4,
      blur: 4,
      distance: 2,
      color: color.bg.overlay,
    },
  }), []);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 13,
    fill: color.text.secondary,
  }), []);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 20,
    fontWeight: 'bold',
    fill: color.text.primary,
  }), []);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 20,
    fontWeight: 'bold',
    fill: color.accent.gold,
  }), []);

  const trophyScale = seq.elapsed < 250 ? seq.get('trophyScaleUp') : seq.get('trophyScaleSettle');

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
        <pixiContainer x={(buttonWidth - 72) / 2} y={0} alpha={seq.get('trophyAlpha')} scale={trophyScale}>
          <pixiGraphics draw={drawTrophy} eventMode="none" />
        </pixiContainer>

        {/* Victory text */}
        <pixiText
          text="VICTORY!"
          x={buttonWidth / 2}
          y={85}
          anchor={{ x: 0.5, y: 0 }}
          style={titleStyle}
          alpha={seq.get('titleAlpha')}
          ref={(node: PixiText | null) => {
            titleTextRef.current = node;
          }}
          eventMode="none"
        />

        <pixiText
          text="YOU COMPLETED ALL 50 LEVELS!"
          x={buttonWidth / 2}
          y={120}
          anchor={{ x: 0.5, y: 0 }}
          style={labelStyle}
          alpha={seq.get('subtitleAlpha')}
          eventMode="none"
        />

        {/* Stats box */}
        <pixiContainer y={150} alpha={seq.get('statsAlpha')}>
          <pixiGraphics draw={drawStatsBox} eventMode="none" />
          
          <pixiContainer x={16} y={16}>
            {/* Total Score */}
            <pixiText text="Total Score" x={0} y={0} style={labelStyle} eventMode="none" />
            <pixiText text={String(displayScore)} x={buttonWidth - 32} y={0} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />
            
            {/* Cubes Earned */}
            <pixiText text="Cubes Earned" x={0} y={36} style={labelStyle} eventMode="none" />
            <pixiText text={String(displayCubes)} x={buttonWidth - 32} y={36} anchor={{ x: 1, y: 0 }} style={cubeStyle} eventMode="none" />
            
            {/* Max Combo */}
            <pixiText text="Max Combo" x={0} y={72} style={labelStyle} eventMode="none" />
            <pixiText text={`${maxCombo}x`} x={buttonWidth - 32} y={72} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />
          </pixiContainer>
        </pixiContainer>

        {/* Buttons */}
        <pixiContainer alpha={seq.get('buttonsAlpha')}>
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
      </pixiContainer>
    </Modal>
  );
};

export default VictoryModal;
