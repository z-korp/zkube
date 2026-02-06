/**
 * PageTopBar - Consistent top bar for all pages
 * 
 * Layout: [Home Button] [Title] [Action Button (optional)]
 * Uses theme-1 style with tropical/sky colors
 */

import { useState, useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePageNavigator } from './PageNavigator';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TYPES
// ============================================================================

interface PageTopBarProps {
  title: string;
  subtitle?: string;
  screenWidth: number;
  topBarHeight: number;
  showHomeButton?: boolean;
  actionIcon?: string;
  onAction?: () => void;
  cubeBalance?: number;
  showCubeBalance?: boolean;
}

// ============================================================================
// ICON BUTTON
// ============================================================================

const IconButton = ({
  x,
  y,
  size,
  icon,
  onClick,
  bgColor = 0x1E293B,
}: {
  x: number;
  y: number;
  size: number;
  icon: string;
  onClick: () => void;
  bgColor?: number;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = pressed ? 0.9 : hovered ? 1.05 : 1;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: hovered ? 0x334155 : bgColor, alpha: 0.9 });
      g.roundRect(0, 0, size, size, 10);
      g.fill();
      g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
      g.roundRect(0, 0, size, size, 10);
      g.stroke();
    },
    [size, hovered, bgColor]
  );

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      <pixiGraphics
        draw={draw}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => {
          setPressed(false);
          onClick();
        }}
        onPointerUpOutside={() => {
          setPressed(false);
          setHovered(false);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => {
          setHovered(false);
          setPressed(false);
        }}
      />
      <pixiText
        text={icon}
        x={size / 2}
        y={size / 2}
        anchor={0.5}
        style={{ fontSize: size * 0.5 }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// CUBE BALANCE DISPLAY
// ============================================================================

const CubeBalanceDisplay = ({
  balance,
  x,
  y,
  height,
}: {
  balance: number;
  x: number;
  y: number;
  height: number;
}) => {
  const width = 100;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1E293B, alpha: 0.9 });
      g.roundRect(0, 0, width, height, height / 2);
      g.fill();
      g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
      g.roundRect(0, 0, width, height, height / 2);
      g.stroke();
    },
    [height]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
      <pixiText
        text="\u{1F9CA}"
        x={14}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontSize: height * 0.5 }}
      />
      <pixiText
        text={String(balance)}
        x={40}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{
          fontFamily: FONT,
          fontSize: 16,
          fill: 0xFFFFFF,
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// PAGE TOP BAR
// ============================================================================

export const PageTopBar = ({
  title,
  subtitle,
  screenWidth,
  topBarHeight,
  showHomeButton = true,
  actionIcon,
  onAction,
  cubeBalance,
  showCubeBalance = false,
}: PageTopBarProps) => {
  const { goHome } = usePageNavigator();

  const btnSize = Math.min(42, topBarHeight - 12);
  const padding = 12;
  const centerY = (topBarHeight - btnSize) / 2;

  // Draw background
  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Semi-transparent dark background
      g.rect(0, 0, screenWidth, topBarHeight);
      g.fill({ color: 0x0F172A, alpha: 0.85 });
      // Bottom border
      g.rect(0, topBarHeight - 1, screenWidth, 1);
      g.fill({ color: 0x334155, alpha: 0.4 });
    },
    [screenWidth, topBarHeight]
  );

  return (
    <pixiContainer>
      <pixiGraphics
        draw={drawBg}
        eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()}
      />

      {/* Home button (left) */}
      {showHomeButton && (
        <IconButton
          x={padding}
          y={centerY}
          size={btnSize}
          icon="\u{1F3E0}"
          onClick={goHome}
        />
      )}

      {/* Title (center) */}
      <pixiContainer x={screenWidth / 2} y={topBarHeight / 2}>
        <pixiText
          text={title}
          x={0}
          y={subtitle ? -8 : 0}
          anchor={0.5}
          style={{
            fontFamily: FONT,
            fontSize: 20,
            fill: 0xFFFFFF,
            dropShadow: {
              alpha: 0.3,
              angle: Math.PI / 4,
              blur: 2,
              distance: 1,
              color: 0x000000,
            },
          }}
        />
        {subtitle && (
          <pixiText
            text={subtitle}
            x={0}
            y={10}
            anchor={0.5}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: 11,
              fill: 0x94A3B8,
            }}
          />
        )}
      </pixiContainer>

      {/* Cube balance or action button (right) */}
      {showCubeBalance && cubeBalance !== undefined ? (
        <CubeBalanceDisplay
          balance={cubeBalance}
          x={screenWidth - padding - 100}
          y={centerY}
          height={btnSize}
        />
      ) : actionIcon && onAction ? (
        <IconButton
          x={screenWidth - padding - btnSize}
          y={centerY}
          size={btnSize}
          icon={actionIcon}
          onClick={onAction}
        />
      ) : null}
    </pixiContainer>
  );
};

export default PageTopBar;
