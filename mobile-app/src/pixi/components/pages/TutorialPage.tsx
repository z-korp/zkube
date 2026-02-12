/**
 * TutorialPage - PixiJS tutorial that walks through all 11 game mechanics.
 * Renders step cards with icons, descriptions, and info items in a scrollable list.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
import { TUTORIAL_STEPS, type TutorialStep, type InfoStep } from '@/pixi/data/tutorialSteps';

const STEP_ICON_STYLE = { fontSize: 22 };
const STEP_TITLE_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff };
const ITEM_LABEL_STYLE = { fontFamily: FONT_BOLD, fontSize: 11, fill: 0xfbbf24 };
const ITEM_DESC_BASE_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 };
const FOOTER_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: 0x64748b, fontStyle: 'italic' as const };

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_ICONS: Record<number, string> = {
  1: '👆',   // Move Blocks
  2: '✨',   // Clear Lines
  3: '⚡',   // Combos
  4: '🔨',   // Hammer
  5: '🌊',   // Wave
  6: '🗿',   // Totem
  7: '🔻',   // Advanced Bonuses (Shrink/Shuffle)
  8: '🎯',   // Constraints
  9: '🧊',   // Earn Cubes
  10: '🛒',  // The Shop
  11: '👑',  // Boss Levels
};

const STEP_COLORS: Record<number, number> = {
  1: 0x3b82f6,   // Blue
  2: 0x22c55e,   // Green
  3: 0xf59e0b,   // Amber
  4: 0xef4444,   // Red
  5: 0x3b82f6,   // Blue
  6: 0x8b5cf6,   // Purple
  7: 0xec4899,   // Pink
  8: 0xf97316,   // Orange
  9: 0xfbbf24,   // Yellow
  10: 0x22c55e,  // Green
  11: 0xf59e0b,  // Gold
};

// ============================================================================
// STEP CARD
// ============================================================================

const StepCard = ({
  step,
  index,
  y,
  width,
}: {
  step: TutorialStep;
  index: number;
  y: number;
  width: number;
}) => {
  const icon = STEP_ICONS[step.id] || '📖';
  const accentColor = STEP_COLORS[step.id] || 0x3b82f6;
  const isInfo = step.type === 'info';
  const infoStep = isInfo ? (step as InfoStep) : null;

  const stepNumStyle = useMemo(() => ({
    fontFamily: FONT_BOLD, fontSize: 11, fill: accentColor,
  }), [accentColor]);

  const typeBadgeStyle = useMemo(() => ({
    fontFamily: FONT_BOLD, fontSize: 9, fill: accentColor,
  }), [accentColor]);

  const descStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 12, fill: 0x94a3b8,
    wordWrap: true, wordWrapWidth: width - padding * 2 - 12,
  }), [width]);

  const itemDescStyle = useMemo(() => ({
    ...ITEM_DESC_BASE_STYLE,
    wordWrap: true, wordWrapWidth: width / 2 - padding - 20,
  }), [width]);

  const footerWrapStyle = useMemo(() => ({
    ...FOOTER_STYLE,
    wordWrap: true, wordWrapWidth: width - padding * 2 - 12,
  }), [width]);

  // Calculate card height
  const headerH = 50;
  const descH = 32;
  const itemH = 28;
  const itemCount = infoStep?.items?.length ?? 0;
  const itemsH = itemCount * itemH;
  const footerH = infoStep?.footer ? 28 : 0;
  const padding = 14;
  const cardH = headerH + descH + itemsH + footerH + padding;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Card background
      g.setFillStyle({ color: 0x1e293b, alpha: 0.9 });
      g.roundRect(0, 0, width, cardH, 12);
      g.fill();
      // Accent left strip
      g.setFillStyle({ color: accentColor });
      g.roundRect(0, 0, 4, cardH, 2);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.4 });
      g.roundRect(0, 0, width, cardH, 12);
      g.stroke();
    },
    [width, cardH, accentColor]
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Step number badge */}
      <pixiText
        text={`${index + 1}`}
        x={20}
        y={padding + 2}
        style={stepNumStyle}
        eventMode="none"
      />

      {/* Icon */}
      <pixiText
        text={icon}
        x={40}
        y={padding + 12}
        anchor={{ x: 0, y: 0.5 }}
        style={STEP_ICON_STYLE}
        eventMode="none"
      />

      {/* Title */}
      <pixiText
        text={step.title}
        x={70}
        y={padding + 12}
        anchor={{ x: 0, y: 0.5 }}
        style={STEP_TITLE_STYLE}
        eventMode="none"
      />

      {/* Type badge */}
      <pixiText
        text={step.type === 'interactive' ? 'PLAY' : step.type === 'bonus' ? 'BONUS' : 'INFO'}
        x={width - padding}
        y={padding + 12}
        anchor={{ x: 1, y: 0.5 }}
        style={typeBadgeStyle}
        eventMode="none"
      />

      {/* Description */}
      <pixiText
        text={step.mobileDescription || step.description}
        x={padding + 6}
        y={headerH}
        style={descStyle}
        eventMode="none"
      />

      {/* Info items */}
      {infoStep?.items?.map((item, i) => {
        const itemY = headerH + descH + i * itemH;
        const label = item.name
          ? `${item.icon === 'shrink' ? '🔻' : item.icon === 'shuffle' ? '🔀' : item.icon === 'bonus' ? '🎁' : item.icon === 'levelup' ? '⬆️' : item.icon === 'refill' ? '🔄' : '•'} ${item.name}`
          : item.level
          ? `🏰 Levels ${item.level}`
          : item.reward
          ? `🎁 ${item.reward}`
          : item.cubes !== undefined
          ? `🧊 ${item.cubes} CUBE`
          : '•';
        const desc = item.desc || item.condition || '';

        return (
          <pixiContainer key={i} y={itemY}>
            <pixiText
              text={label}
              x={padding + 10}
              y={itemH / 2}
              anchor={{ x: 0, y: 0.5 }}
              style={ITEM_LABEL_STYLE}
              eventMode="none"
            />
            {desc && (
              <pixiText
                text={desc}
                x={width / 2 + 10}
                y={itemH / 2}
                anchor={{ x: 0, y: 0.5 }}
                style={itemDescStyle}
                eventMode="none"
              />
            )}
          </pixiContainer>
        );
      })}

      {/* Footer */}
      {infoStep?.footer && (
        <pixiText
          text={infoStep.footer}
          x={padding + 6}
          y={headerH + descH + itemsH + 4}
          style={footerWrapStyle}
          eventMode="none"
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// TUTORIAL PAGE
// ============================================================================

interface TutorialPageProps {
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
}

export const TutorialPage = ({
  screenWidth,
  screenHeight,
  topBarHeight,
}: TutorialPageProps) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const contentPadding = 16;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;
  const listHeight = screenHeight - contentTop - contentPadding;
  const cardGap = 12;

  // Calculate card heights for each step
  const getCardHeight = (step: TutorialStep) => {
    const headerH = 50;
    const descH = 32;
    const itemH = 28;
    const isInfo = step.type === 'info';
    const infoStep = isInfo ? (step as InfoStep) : null;
    const itemCount = infoStep?.items?.length ?? 0;
    const itemsH = itemCount * itemH;
    const footerH = infoStep?.footer ? 28 : 0;
    const padding = 14;
    return headerH + descH + itemsH + footerH + padding;
  };

  const totalHeight = TUTORIAL_STEPS.reduce((sum, s) => sum + getCardHeight(s) + cardGap, 0);
  const maxScroll = Math.max(0, totalHeight - listHeight);

  const drawScrollHitArea = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, contentWidth, listHeight);
    g.fill({ color: 0xffffff, alpha: 0.001 });
  }, [contentWidth, listHeight]);

  const handlePointerDown = useCallback((e: any) => {
    isDragging.current = true;
    lastY.current = e.data.global.y;
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      const dy = lastY.current - e.data.global.y;
      lastY.current = e.data.global.y;
      setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev + dy)));
    },
    [maxScroll]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Pre-calculate y positions
  let currentY = 0;
  const cardPositions = TUTORIAL_STEPS.map((step) => {
    const y = currentY;
    currentY += getCardHeight(step) + cardGap;
    return y;
  });

  return (
    <pixiContainer>
      <PageTopBar
        title="How to Play"
        subtitle="11 steps to master zKube"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
      />

      <pixiContainer x={contentPadding} y={contentTop}>
        <pixiContainer
          eventMode="static"
          onPointerDown={handlePointerDown}
          onGlobalPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerUpOutside={handlePointerUp}
        >
          <pixiGraphics draw={drawScrollHitArea} />

          <pixiContainer y={-scrollY}>
            {TUTORIAL_STEPS.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                y={cardPositions[i]}
                width={contentWidth}
              />
            ))}
          </pixiContainer>
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
};

export default TutorialPage;
