import { useCallback, useState, useEffect } from 'react';
import { Graphics as PixiGraphics, Assets, Texture, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

interface CubeBalanceProps {
  balance: number;
  x: number;
  y: number;
  height: number;
  uiScale?: number;
}

/**
 * Currency display showing CUBE balance
 * Shows cube icon + formatted balance number
 */
export const CubeBalance = ({
  balance,
  x,
  y,
  height,
  uiScale = 1,
}: CubeBalanceProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const [cubeTexture, setCubeTexture] = useState<Texture | null>(null);
  
  // Load cube icon
  useEffect(() => {
    Assets.load('/assets/cube-icon.png')
      .then((tex) => setCubeTexture(tex as Texture))
      .catch(() => {
        // Fallback - try alternate path
        Assets.load('/assets/icons/cube.png')
          .then((tex) => setCubeTexture(tex as Texture))
          .catch(() => setCubeTexture(null));
      });
  }, []);
  
  const iconSize = height * 0.7;
  const padding = 8 * uiScale;
  const minWidth = 70 * uiScale;
  
  // Format balance with comma separators
  const formattedBalance = balance.toLocaleString();
  
  // Calculate text width (approximate)
  const textWidth = formattedBalance.length * 9 * uiScale;
  const containerWidth = Math.max(minWidth, iconSize + padding + textWidth + padding * 2);
  
  const bgColor = isProcedural ? 0x1a1a2e : 0x1e293b;
  const accentColor = isProcedural ? colors.accent : 0x3b82f6;
  
  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Pill-shaped background
    const radius = height / 2;
    g.roundRect(0, 0, containerWidth, height, radius);
    g.fill({ color: bgColor, alpha: 0.9 });
    
    // Border
    g.roundRect(0, 0, containerWidth, height, radius);
    g.stroke({ color: accentColor, width: 1.5, alpha: 0.5 });
  }, [containerWidth, height, bgColor, accentColor]);

  const drawCubeIcon = useCallback((g: PixiGraphics) => {
    if (cubeTexture) return; // Use sprite instead
    
    g.clear();
    
    // Fallback: draw a simple cube shape
    const size = iconSize * 0.8;
    const cx = iconSize / 2;
    const cy = iconSize / 2;
    
    // Simple cube representation
    g.rect(cx - size/2 + 2, cy - size/2 + 2, size - 4, size - 4);
    g.fill({ color: accentColor, alpha: 0.9 });
    
    // Shine
    g.moveTo(cx - size/3, cy - size/3);
    g.lineTo(cx - size/4, cy - size/3);
    g.lineTo(cx - size/4, cy - size/4);
    g.lineTo(cx - size/3, cy - size/4);
    g.fill({ color: 0xffffff, alpha: 0.5 });
  }, [cubeTexture, iconSize, accentColor]);

  const textStyle = new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  });

  return (
    <pixiContainer x={x} y={y}>
      {/* Background */}
      <pixiGraphics draw={drawBackground} />
      
      {/* Cube icon */}
      {cubeTexture ? (
        <pixiSprite
          texture={cubeTexture}
          x={padding}
          y={(height - iconSize) / 2}
          width={iconSize}
          height={iconSize}
        />
      ) : (
        <pixiGraphics
          x={padding}
          y={(height - iconSize) / 2}
          draw={drawCubeIcon}
        />
      )}
      
      {/* Balance text */}
      <pixiText
        text={formattedBalance}
        x={padding + iconSize + padding / 2}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={textStyle}
      />
    </pixiContainer>
  );
};

export default CubeBalance;
