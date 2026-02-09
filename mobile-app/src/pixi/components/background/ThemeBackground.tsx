import { useState, useEffect, useCallback } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import type { FullscreenLayout } from '../../hooks/useFullscreenLayout';

interface ThemeBackgroundProps {
  layout: FullscreenLayout;
  themeName?: string;
}

const loadTextureCached = async (path: string): Promise<Texture> => {
  const cached = Assets.get(path) as Texture | undefined;
  if (cached) {
    return cached;
  }
  return (await Assets.load(path)) as Texture;
};

/**
 * Full-screen themed background that covers the entire canvas
 * Loads theme background image and scales to fit
 */
export const ThemeBackground = ({ 
  layout, 
  themeName = 'theme-1' 
}: ThemeBackgroundProps) => {
  const [texture, setTexture] = useState<Texture | null>(null);

  // Load background texture
  useEffect(() => {
    const bgPath = `/assets/${themeName}/theme-2-1.png`;
    let cancelled = false;

    loadTextureCached(bgPath)
      .then((tex) => {
        if (!cancelled) setTexture(tex);
      })
      .catch(() => {
        loadTextureCached('/assets/theme-2-1.png')
          .then((tex) => {
            if (!cancelled) setTexture(tex);
          })
          .catch(() => {
            if (!cancelled) setTexture(null);
          });
      });

    return () => {
      cancelled = true;
    };
  }, [themeName]);

  // Draw vignette overlay
  const drawVignette = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const { screenWidth, screenHeight } = layout;
    
    // Top gradient (darker)
    for (let i = 0; i < 5; i++) {
      const alpha = 0.3 - (i * 0.05);
      const height = 60 - (i * 10);
      g.rect(0, i * 10, screenWidth, height);
      g.fill({ color: 0x000000, alpha });
    }
    
    // Bottom gradient
    for (let i = 0; i < 3; i++) {
      const alpha = 0.2 - (i * 0.05);
      g.rect(0, screenHeight - 80 + (i * 25), screenWidth, 30);
      g.fill({ color: 0x000000, alpha });
    }
    
    // Side gradients (subtle)
    g.rect(0, 0, 30, screenHeight);
    g.fill({ color: 0x000000, alpha: 0.15 });
    g.rect(screenWidth - 30, 0, 30, screenHeight);
    g.fill({ color: 0x000000, alpha: 0.15 });
  }, [layout]);

  // Calculate scale to cover screen while maintaining aspect ratio
  const getBackgroundScale = () => {
    if (!texture) return { scaleX: 1, scaleY: 1, x: 0, y: 0 };
    
    const { screenWidth, screenHeight } = layout;
    const texWidth = texture.width;
    const texHeight = texture.height;
    
    // Cover mode - fill entire screen, crop excess
    const scaleX = screenWidth / texWidth;
    const scaleY = screenHeight / texHeight;
    const scale = Math.max(scaleX, scaleY);
    
    // Center the image
    const scaledWidth = texWidth * scale;
    const scaledHeight = texHeight * scale;
    const x = (screenWidth - scaledWidth) / 2;
    const y = (screenHeight - scaledHeight) / 2;
    
    return { scaleX: scale, scaleY: scale, x, y };
  };

  const bgScale = getBackgroundScale();

  return (
    <pixiContainer>
      {/* Background image */}
      {texture && (
        <pixiSprite
          texture={texture}
          x={bgScale.x}
          y={bgScale.y}
          scale={{ x: bgScale.scaleX, y: bgScale.scaleY }}
        />
      )}
      
      {/* Fallback solid color if no texture */}
      {!texture && (
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, layout.screenWidth, layout.screenHeight);
            g.fill({ color: 0x1a2744 });
          }}
        />
      )}
      
      {/* Vignette overlay for depth */}
      <pixiGraphics draw={drawVignette} />
    </pixiContainer>
  );
};

export default ThemeBackground;
