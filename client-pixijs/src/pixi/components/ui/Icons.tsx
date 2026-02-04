import { Graphics as PixiGraphics } from 'pixi.js';

/**
 * Utility functions to draw clean, consistent icons in PixiJS
 * All icons are drawn centered at (0,0) with the given size
 */

// Color palette for icons
export const IconColors = {
  primary: 0xffffff,
  secondary: 0x94a3b8,
  accent: 0x3b82f6,
  gold: 0xfbbf24,
  danger: 0xef4444,
  success: 0x22c55e,
};

/**
 * Draw a hamburger menu icon
 */
export const drawMenuIcon = (g: PixiGraphics, size: number, color = IconColors.primary) => {
  const lineWidth = size * 0.12;
  const gap = size * 0.22;
  const lineLength = size * 0.6;
  
  g.clear();
  
  // Three horizontal lines
  for (let i = -1; i <= 1; i++) {
    const y = i * gap;
    g.roundRect(-lineLength / 2, y - lineWidth / 2, lineLength, lineWidth, lineWidth / 2);
    g.fill({ color });
  }
};

/**
 * Draw a star icon (filled or outline)
 */
export const drawStarIcon = (g: PixiGraphics, size: number, filled = true, color = IconColors.gold) => {
  const outerR = size * 0.45;
  const innerR = outerR * 0.4;
  const points = 5;
  
  g.clear();
  g.beginPath();
  
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    
    if (i === 0) {
      g.moveTo(x, y);
    } else {
      g.lineTo(x, y);
    }
  }
  
  g.closePath();
  
  if (filled) {
    g.fill({ color });
  } else {
    g.stroke({ color, width: size * 0.08 });
  }
};

/**
 * Draw a trophy icon
 */
export const drawTrophyIcon = (g: PixiGraphics, size: number, color = IconColors.gold) => {
  g.clear();
  
  const cupWidth = size * 0.5;
  const cupHeight = size * 0.4;
  const handleSize = size * 0.12;
  
  // Cup body
  g.beginPath();
  g.moveTo(-cupWidth / 2, -size * 0.25);
  g.lineTo(-cupWidth / 2 + size * 0.08, size * 0.1);
  g.lineTo(cupWidth / 2 - size * 0.08, size * 0.1);
  g.lineTo(cupWidth / 2, -size * 0.25);
  g.closePath();
  g.fill({ color });
  
  // Cup rim
  g.roundRect(-cupWidth / 2 - size * 0.03, -size * 0.3, cupWidth + size * 0.06, size * 0.08, size * 0.02);
  g.fill({ color });
  
  // Handles
  g.circle(-cupWidth / 2 - handleSize / 2, -size * 0.1, handleSize);
  g.stroke({ color, width: size * 0.06 });
  g.circle(cupWidth / 2 + handleSize / 2, -size * 0.1, handleSize);
  g.stroke({ color, width: size * 0.06 });
  
  // Base
  g.rect(-size * 0.05, size * 0.1, size * 0.1, size * 0.12);
  g.fill({ color });
  g.roundRect(-size * 0.15, size * 0.22, size * 0.3, size * 0.08, size * 0.02);
  g.fill({ color });
};

/**
 * Draw a shop/store icon
 */
export const drawShopIcon = (g: PixiGraphics, size: number, color = IconColors.success) => {
  g.clear();
  
  const bagWidth = size * 0.5;
  const bagHeight = size * 0.45;
  
  // Bag body
  g.roundRect(-bagWidth / 2, -size * 0.05, bagWidth, bagHeight, size * 0.06);
  g.fill({ color });
  
  // Bag handle
  g.beginPath();
  g.moveTo(-size * 0.12, -size * 0.05);
  g.quadraticCurveTo(-size * 0.12, -size * 0.25, 0, -size * 0.28);
  g.quadraticCurveTo(size * 0.12, -size * 0.25, size * 0.12, -size * 0.05);
  g.stroke({ color, width: size * 0.08 });
};

/**
 * Draw a scroll/quests icon
 */
export const drawQuestsIcon = (g: PixiGraphics, size: number, color = IconColors.primary) => {
  g.clear();
  
  const scrollWidth = size * 0.45;
  const scrollHeight = size * 0.55;
  
  // Scroll body
  g.roundRect(-scrollWidth / 2, -scrollHeight / 2, scrollWidth, scrollHeight, size * 0.04);
  g.fill({ color });
  
  // Scroll rolls at top and bottom
  const rollRadius = size * 0.06;
  g.circle(-scrollWidth / 2 + rollRadius, -scrollHeight / 2, rollRadius);
  g.fill({ color });
  g.circle(scrollWidth / 2 - rollRadius, -scrollHeight / 2, rollRadius);
  g.fill({ color });
  
  // Lines on scroll
  const lineColor = 0x1e293b;
  const lineWidth = scrollWidth * 0.6;
  for (let i = 0; i < 3; i++) {
    const y = -scrollHeight / 4 + i * size * 0.12;
    g.rect(-lineWidth / 2, y, lineWidth, size * 0.03);
    g.fill({ color: lineColor, alpha: 0.5 });
  }
};

/**
 * Draw a flag/surrender icon
 */
export const drawFlagIcon = (g: PixiGraphics, size: number, color = IconColors.danger) => {
  g.clear();
  
  // Pole
  const poleX = -size * 0.15;
  g.rect(poleX - size * 0.025, -size * 0.35, size * 0.05, size * 0.7);
  g.fill({ color: IconColors.secondary });
  
  // Flag
  g.beginPath();
  g.moveTo(poleX, -size * 0.35);
  g.lineTo(size * 0.25, -size * 0.2);
  g.lineTo(poleX, -size * 0.05);
  g.closePath();
  g.fill({ color });
};

/**
 * Draw a cube icon (for currency)
 */
export const drawCubeIcon = (g: PixiGraphics, size: number, color = 0x60a5fa) => {
  g.clear();
  
  const s = size * 0.35;
  
  // Top face (lighter)
  g.beginPath();
  g.moveTo(0, -s);
  g.lineTo(s, -s * 0.5);
  g.lineTo(0, 0);
  g.lineTo(-s, -s * 0.5);
  g.closePath();
  g.fill({ color: 0x93c5fd });
  
  // Left face
  g.beginPath();
  g.moveTo(-s, -s * 0.5);
  g.lineTo(0, 0);
  g.lineTo(0, s);
  g.lineTo(-s, s * 0.5);
  g.closePath();
  g.fill({ color });
  
  // Right face (darker)
  g.beginPath();
  g.moveTo(s, -s * 0.5);
  g.lineTo(s, s * 0.5);
  g.lineTo(0, s);
  g.lineTo(0, 0);
  g.closePath();
  g.fill({ color: 0x3b82f6 });
};

/**
 * Draw a close (X) icon
 */
export const drawCloseIcon = (g: PixiGraphics, size: number, color = IconColors.primary) => {
  g.clear();
  
  const s = size * 0.25;
  const lineWidth = size * 0.1;
  
  g.roundRect(-s, -lineWidth / 2, s * 2, lineWidth, lineWidth / 2);
  g.fill({ color });
  
  // Rotate 45 degrees by drawing at angle
  const offset = s * Math.SQRT1_2;
  g.beginPath();
  g.moveTo(-offset, -offset);
  g.lineTo(offset, offset);
  g.stroke({ color, width: lineWidth, cap: 'round' });
  
  g.beginPath();
  g.moveTo(offset, -offset);
  g.lineTo(-offset, offset);
  g.stroke({ color, width: lineWidth, cap: 'round' });
};

/**
 * Draw a combo/fire icon
 */
export const drawComboIcon = (g: PixiGraphics, size: number, color = 0xf97316) => {
  g.clear();
  
  // Flame shape
  g.beginPath();
  g.moveTo(0, size * 0.35);
  g.quadraticCurveTo(-size * 0.25, size * 0.1, -size * 0.2, -size * 0.1);
  g.quadraticCurveTo(-size * 0.15, -size * 0.3, 0, -size * 0.4);
  g.quadraticCurveTo(size * 0.15, -size * 0.3, size * 0.2, -size * 0.1);
  g.quadraticCurveTo(size * 0.25, size * 0.1, 0, size * 0.35);
  g.fill({ color });
  
  // Inner flame (lighter)
  g.beginPath();
  g.moveTo(0, size * 0.25);
  g.quadraticCurveTo(-size * 0.1, size * 0.1, -size * 0.08, 0);
  g.quadraticCurveTo(-size * 0.05, -size * 0.15, 0, -size * 0.15);
  g.quadraticCurveTo(size * 0.05, -size * 0.15, size * 0.08, 0);
  g.quadraticCurveTo(size * 0.1, size * 0.1, 0, size * 0.25);
  g.fill({ color: 0xfbbf24 });
};

/**
 * Draw a moves/steps icon
 */
export const drawMovesIcon = (g: PixiGraphics, size: number, color = IconColors.primary) => {
  g.clear();
  
  // Arrow pointing right
  const arrowWidth = size * 0.5;
  const arrowHeight = size * 0.3;
  const tailWidth = size * 0.25;
  const tailHeight = size * 0.15;
  
  g.beginPath();
  g.moveTo(arrowWidth / 2, 0);
  g.lineTo(0, -arrowHeight / 2);
  g.lineTo(0, -tailHeight / 2);
  g.lineTo(-arrowWidth / 2, -tailHeight / 2);
  g.lineTo(-arrowWidth / 2, tailHeight / 2);
  g.lineTo(0, tailHeight / 2);
  g.lineTo(0, arrowHeight / 2);
  g.closePath();
  g.fill({ color });
};

/**
 * Draw a target/score icon
 */
export const drawTargetIcon = (g: PixiGraphics, size: number, color = IconColors.primary) => {
  g.clear();
  
  // Concentric circles
  const rings = [0.4, 0.28, 0.16];
  rings.forEach((r, i) => {
    g.circle(0, 0, size * r);
    if (i % 2 === 0) {
      g.stroke({ color, width: size * 0.06 });
    } else {
      g.fill({ color });
    }
  });
  
  // Center dot
  g.circle(0, 0, size * 0.06);
  g.fill({ color: IconColors.danger });
};

export default {
  drawMenuIcon,
  drawStarIcon,
  drawTrophyIcon,
  drawShopIcon,
  drawQuestsIcon,
  drawFlagIcon,
  drawCubeIcon,
  drawCloseIcon,
  drawComboIcon,
  drawMovesIcon,
  drawTargetIcon,
  IconColors,
};
