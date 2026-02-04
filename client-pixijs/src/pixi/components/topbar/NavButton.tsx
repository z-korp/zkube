import { useCallback, useState, useEffect } from 'react';
import { Graphics as PixiGraphics, Assets, Texture, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

type NavIcon = 'quests' | 'trophy' | 'shop' | 'settings';

interface NavButtonProps {
  icon: NavIcon;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  label?: string;
  badge?: number; // Optional notification badge
}

// Icon paths and fallback drawing functions
const ICON_PATHS: Record<NavIcon, string> = {
  quests: '/assets/icons/quests.png',
  trophy: '/assets/icons/trophy.png',
  shop: '/assets/icons/shop.png',
  settings: '/assets/icons/settings.png',
};

/**
 * Generic navigation button with icon
 * Used for Quests, Trophy, Shop buttons in top bar
 */
export const NavButton = ({
  icon,
  x,
  y,
  width,
  height,
  onClick,
  label,
  badge,
}: NavButtonProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const [texture, setTexture] = useState<Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Load icon texture
  useEffect(() => {
    const iconPath = ICON_PATHS[icon];
    Assets.load(iconPath)
      .then((tex) => setTexture(tex as Texture))
      .catch(() => setTexture(null));
  }, [icon]);
  
  const bgColor = isProcedural ? 0x1a1a2e : 0x1e293b;
  const hoverBgColor = isProcedural ? 0x2a2a4e : 0x334155;
  const accentColor = isProcedural ? colors.accent : 0x3b82f6;
  
  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
  }, []);
  
  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    onClick?.();
  }, [onClick]);
  
  const handlePointerOver = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);
  
  const iconSize = Math.min(width, height) * 0.55;
  const hasLabel = label && width > 50;
  
  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isPressed ? 0.95 : isHovered ? 1.02 : 1;
    const radius = height / 4;
    
    // Background
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.fill({ color: isHovered ? hoverBgColor : bgColor, alpha: 0.9 });
    
    // Border
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.stroke({ color: accentColor, width: 1, alpha: isHovered ? 0.6 : 0.3 });
  }, [width, height, bgColor, hoverBgColor, accentColor, isHovered, isPressed]);

  // Fallback icon drawing
  const drawFallbackIcon = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const size = iconSize;
    const cx = size / 2;
    const cy = size / 2;
    const alpha = isHovered ? 1 : 0.8;
    
    switch (icon) {
      case 'quests':
        // Clipboard/checklist icon
        g.roundRect(cx - size * 0.3, cy - size * 0.4, size * 0.6, size * 0.75, 2);
        g.stroke({ color: 0xffffff, width: 2, alpha });
        // Clip at top
        g.roundRect(cx - size * 0.15, cy - size * 0.45, size * 0.3, size * 0.1, 1);
        g.fill({ color: 0xffffff, alpha });
        // Check lines
        for (let i = 0; i < 3; i++) {
          const ly = cy - size * 0.15 + i * size * 0.2;
          g.moveTo(cx - size * 0.15, ly);
          g.lineTo(cx + size * 0.15, ly);
          g.stroke({ color: 0xffffff, width: 1.5, alpha: alpha * 0.7 });
        }
        break;
        
      case 'trophy':
        // Trophy cup
        g.moveTo(cx - size * 0.3, cy - size * 0.35);
        g.lineTo(cx - size * 0.2, cy + size * 0.15);
        g.lineTo(cx + size * 0.2, cy + size * 0.15);
        g.lineTo(cx + size * 0.3, cy - size * 0.35);
        g.closePath();
        g.fill({ color: 0xfbbf24, alpha });
        // Base
        g.roundRect(cx - size * 0.15, cy + size * 0.2, size * 0.3, size * 0.1, 1);
        g.fill({ color: 0xfbbf24, alpha });
        // Stand
        g.rect(cx - size * 0.05, cy + size * 0.1, size * 0.1, size * 0.15);
        g.fill({ color: 0xfbbf24, alpha });
        break;
        
      case 'shop':
        // Shopping bag
        g.roundRect(cx - size * 0.3, cy - size * 0.15, size * 0.6, size * 0.55, 3);
        g.fill({ color: 0x22c55e, alpha });
        // Handle
        g.moveTo(cx - size * 0.15, cy - size * 0.15);
        g.quadraticCurveTo(cx - size * 0.15, cy - size * 0.35, cx, cy - size * 0.35);
        g.quadraticCurveTo(cx + size * 0.15, cy - size * 0.35, cx + size * 0.15, cy - size * 0.15);
        g.stroke({ color: 0x22c55e, width: 2.5, alpha });
        break;
        
      case 'settings':
        // Gear icon
        const teeth = 6;
        const outerR = size * 0.4;
        const innerR = size * 0.25;
        g.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
          const angle = (i * Math.PI) / teeth;
          const r = i % 2 === 0 ? outerR : innerR;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.fill({ color: 0x94a3b8, alpha });
        // Center hole
        g.circle(cx, cy, size * 0.1);
        g.fill({ color: bgColor, alpha: 1 });
        break;
    }
  }, [icon, iconSize, isHovered, bgColor]);

  const labelStyle = new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 10,
    fill: 0xffffff,
    alpha: isHovered ? 1 : 0.8,
  });

  return (
    <pixiContainer x={x} y={y}>
      {/* Background */}
      <pixiGraphics
        draw={drawBackground}
        eventMode="static"
        cursor="pointer"
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerover={handlePointerOver}
        onpointerout={handlePointerOut}
      />
      
      {/* Icon */}
      {texture ? (
        <pixiSprite
          texture={texture}
          x={(width - iconSize) / 2}
          y={hasLabel ? (height - iconSize) / 2 - 6 : (height - iconSize) / 2}
          width={iconSize}
          height={iconSize}
          alpha={isHovered ? 1 : 0.8}
        />
      ) : (
        <pixiGraphics
          x={(width - iconSize) / 2}
          y={hasLabel ? (height - iconSize) / 2 - 6 : (height - iconSize) / 2}
          draw={drawFallbackIcon}
        />
      )}
      
      {/* Optional label */}
      {hasLabel && (
        <pixiText
          text={label}
          x={width / 2}
          y={height - 8}
          anchor={{ x: 0.5, y: 1 }}
          style={labelStyle}
        />
      )}
      
      {/* Notification badge */}
      {badge !== undefined && badge > 0 && (
        <pixiGraphics
          draw={(g) => {
            g.clear();
            const badgeSize = 14;
            g.circle(width - 4, 4, badgeSize / 2);
            g.fill({ color: 0xef4444 });
          }}
        />
      )}
    </pixiContainer>
  );
};

export default NavButton;
