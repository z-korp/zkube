import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { FONT_BODY } from '../../utils/colors';

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

  const padding = 8;
  const cornerRadius = 6;
  const arrowSize = 6;
  const fontSize = 11;
  const lineHeight = fontSize * 1.3;
  const charWidth = fontSize * 0.55;

  const { boxWidth, boxHeight, offsetX, offsetY } = useMemo(() => {
    const words = (text || '').split(' ');
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
    
    const bw = textWidth + padding * 2;
    const bh = textHeight + padding * 2;
    
    let ox = 0;
    let oy = 0;
    
    switch (position) {
      case 'top':
        ox = -bw / 2;
        oy = -bh - arrowSize - 4;
        break;
      case 'bottom':
        ox = -bw / 2;
        oy = arrowSize + 4;
        break;
      case 'left':
        ox = -bw - arrowSize - 4;
        oy = -bh / 2;
        break;
      case 'right':
        ox = arrowSize + 4;
        oy = -bh / 2;
        break;
    }
    
    return { boxWidth: bw, boxHeight: bh, offsetX: ox, offsetY: oy };
  }, [text, maxWidth, position, charWidth, lineHeight, arrowSize]);

  const bgColor = 0x1e293b;
  const borderColor = 0x475569;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    g.roundRect(0, 0, boxWidth, boxHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.95 });
    
    g.roundRect(0, 0, boxWidth, boxHeight, cornerRadius);
    g.stroke({ color: borderColor, width: 1, alpha: 0.8 });
    
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
    }
  }, [boxWidth, boxHeight, position, arrowSize]);

  const textStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize,
    fill: 0xffffff,
    wordWrap: true,
    wordWrapWidth: maxWidth - padding * 2,
    lineHeight,
  }), [maxWidth, lineHeight]);

  if (!visible || !text) return null;

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
