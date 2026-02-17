/**
 * TutorialPage — PixiJS tutorial that walks through all 11 game mechanics.
 * Renders step cards with icons, descriptions, and info items in a scrollable list.
 */

import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
import { color, space } from '@/pixi/design/tokens';
import { TUTORIAL_STEPS, type TutorialStep, type InfoStep } from '@/pixi/data/tutorialSteps';

const STEP_ICON_STYLE = { fontSize: 22 };
const STEP_TITLE_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.primary };
const ITEM_LABEL_STYLE = { fontFamily: FONT_BOLD, fontSize: 11, fill: color.accent.gold };
const ITEM_DESC_BASE_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: color.text.secondary };
const FOOTER_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: color.text.muted, fontStyle: 'italic' as const };

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
  7: '🔻',   // Advanced Bonuses
  8: '🎯',   // Constraints
  9: '🧊',   // Earn Cubes
  10: '🛒',  // The Shop
  11: '👑',  // Boss Levels
};

const STEP_COLORS: Record<number, number> = {
  1: color.accent.blue,
  2: color.status.success,
  3: 0xf59e0b,          // amber
  4: color.status.danger,
  5: color.accent.blue,
  6: color.accent.purple,
  7: 0xec4899,          // pink
  8: color.accent.orange,
  9: color.accent.gold,
  10: color.status.success,
  11: 0xf59e0b,         // gold
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
  const accentColor = STEP_COLORS[step.id] || color.accent.blue;
  const isInfo = step.type === 'info';
  const infoStep = isInfo ? (step as InfoStep) : null;

  const stepNumStyle = useMemo(() => ({
    fontFamily: FONT_BOLD, fontSize: 11, fill: accentColor,
  }), [accentColor]);

  const typeBadgeStyle = useMemo(() => ({
    fontFamily: FONT_BOLD, fontSize: 9, fill: accentColor,
  }), [accentColor]);

  const padding = 14;
  const headerH = 50;
  const descH = 32;
  const itemH = 28;
  const itemCount = infoStep?.items?.length ?? 0;
  const itemsH = itemCount * itemH;
  const footerH = infoStep?.footer ? 28 : 0;
  const cardH = headerH + descH + itemsH + footerH + padding;

  const descStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 12, fill: color.text.secondary,
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

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.primary, alpha: 0.9 });
      g.roundRect(0, 0, width, cardH, 12);
      g.fill();
      g.setFillStyle({ color: accentColor });
      g.roundRect(0, 0, 4, cardH, 2);
      g.fill();
      g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.4 });
      g.roundRect(0, 0, width, cardH, 12);
      g.stroke();
    },
    [width, cardH, accentColor],
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Step number badge */}
      <pixiText text={`${index + 1}`} x={20} y={padding + 2} style={stepNumStyle} eventMode="none" />

      {/* Icon */}
      <pixiText text={icon} x={40} y={padding + 12} anchor={{ x: 0, y: 0.5 }} style={STEP_ICON_STYLE} eventMode="none" />

      {/* Title */}
      <pixiText text={step.title.toUpperCase()} x={70} y={padding + 12} anchor={{ x: 0, y: 0.5 }} style={STEP_TITLE_STYLE} eventMode="none" />

      {/* Type badge */}
      <pixiText
        text={step.type === 'interactive' ? 'PLAY' : step.type === 'bonus' ? 'BONUS' : 'INFO'}
        x={width - padding} y={padding + 12}
        anchor={{ x: 1, y: 0.5 }} style={typeBadgeStyle} eventMode="none"
      />

      {/* Description */}
      <pixiText
        text={step.mobileDescription || step.description}
        x={padding + 6} y={headerH}
        style={descStyle} eventMode="none"
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
            <pixiText text={label} x={padding + 10} y={itemH / 2} anchor={{ x: 0, y: 0.5 }} style={ITEM_LABEL_STYLE} eventMode="none" />
            {desc && (
              <pixiText text={desc} x={width / 2 + 10} y={itemH / 2} anchor={{ x: 0, y: 0.5 }} style={itemDescStyle} eventMode="none" />
            )}
          </pixiContainer>
        );
      })}

      {/* Footer */}
      {infoStep?.footer && (
        <pixiText text={infoStep.footer} x={padding + 6} y={headerH + descH + itemsH + 4} style={footerWrapStyle} eventMode="none" />
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
  const contentPadding = space.lg;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;
  const listHeight = screenHeight - contentTop - contentPadding;
  const cardGap = space.md;

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
        title="HOW TO PLAY"
        subtitle="11 STEPS TO MASTER ZKUBE"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
      />

      <PixiScrollContainer
        x={contentPadding}
        y={contentTop}
        width={contentWidth}
        height={listHeight}
        contentHeight={totalHeight}
      >
        {TUTORIAL_STEPS.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            y={cardPositions[i]}
            width={contentWidth - 10}
          />
        ))}
      </PixiScrollContainer>
    </pixiContainer>
  );
};

export default TutorialPage;
