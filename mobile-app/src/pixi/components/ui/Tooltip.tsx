import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

interface TooltipProps {
  text: string;
  x: number;
  y: number;
  visible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
}

/**
 * Simple tooltip component for PixiJS
 * Displays text in a styled container
 */
export const Tooltip = ({
  text,
  x,
  y,
  visible,
  position = 'top',
  maxWidth = 200,
}: TooltipProps) => {
  const { colors } = usePixiTheme();

  if (!visible || !text) return null;

  const padding = 8;
  const cornerRadius = 6;
  const arrowSize = 6;
  
  // Estimate text dimensions (approximate)
  const fontSize = 11;
  const lineHeight = fontSize * 1.3;
  const charWidth = fontSize * 0.55;
  
  // Simple word wrap calculation
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length * charWidth > maxWidth - padding * 2) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  const textWidth = Math.min(
    maxWidth - padding * 2,
    Math.max(...lines.map(l => l.length * charWidth))
  );
  const textHeight = lines.length * lineHeight;
  
  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight + padding * 2;
  
  // Calculate offset based on position
  let offsetX = 0;
  let offsetY = 0;
  
  switch (position) {
    case 'top':
      offsetX = -boxWidth / 2;
      offsetY = -boxHeight - arrowSize - 4;
      break;
    case 'bottom':
      offsetX = -boxWidth / 2;
      offsetY = arrowSize + 4;
      break;
    case 'left':
      offsetX = -boxWidth - arrowSize - 4;
      offsetY = -boxHeight / 2;
      break;
    case 'right':
      offsetX = arrowSize + 4;
      offsetY = -boxHeight / 2;
      break;
  }

  const bgColor = 0x1e293b;
  const borderColor = 0x475569;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Main box
    g.roundRect(0, 0, boxWidth, boxHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.95 });
    
    // Border
    g.roundRect(0, 0, boxWidth, boxHeight, cornerRadius);
    g.stroke({ color: borderColor, width: 1, alpha: 0.8 });
    
    // Arrow
    const arrowX = boxWidth / 2;
    let arrowY = 0;
    
    switch (position) {
      case 'top':
        arrowY = boxHeight;
        g.moveTo(arrowX - arrowSize, arrowY);
        g.lineTo(arrowX, arrowY + arrowSize);
        g.lineTo(arrowX + arrowSize, arrowY);
        g.closePath();
        g.fill({ color: bgColor, alpha: 0.95 });
        break;
      case 'bottom':
        arrowY = 0;
        g.moveTo(arrowX - arrowSize, arrowY);
        g.lineTo(arrowX, arrowY - arrowSize);
        g.lineTo(arrowX + arrowSize, arrowY);
        g.closePath();
        g.fill({ color: bgColor, alpha: 0.95 });
        break;
      // Left/right arrows can be added if needed
    }
  }, [boxWidth, boxHeight, cornerRadius, bgColor, borderColor, position, arrowSize]);

  const textStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize,
    fill: 0xffffff,
    wordWrap: true,
    wordWrapWidth: maxWidth - padding * 2,
    lineHeight,
  }), [fontSize, maxWidth, lineHeight]);

  return (
    <pixiContainer x={x + offsetX} y={y + offsetY} alpha={visible ? 1 : 0}>
      <pixiGraphics draw={drawBackground} />
      <pixiText
        text={text}
        x={padding}
        y={padding}
        style={textStyle}
      />
    </pixiContainer>
  );
};

export default Tooltip;
