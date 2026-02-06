import { createContext, useContext, useMemo } from 'react';
import { useTheme } from '@/ui/elements/theme-provider/hooks';
import { 
  getThemeColors, 
  isProceduralTheme, 
  type ThemeColors 
} from '../utils/colors';

export type GridTheme = 'tiki' | 'neon';

interface PixiThemeContextValue {
  /** Current theme name */
  themeName: string;
  /** Whether to use procedural rendering (neon) or textures (tiki) */
  isProcedural: boolean;
  /** Theme color palette */
  colors: ThemeColors;
  /** Whether device is mobile (for performance adjustments) */
  isMobile: boolean;
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Get asset path for current theme */
  getAssetPath: (asset: string) => string;
}

const PixiThemeContext = createContext<PixiThemeContextValue | null>(null);

interface PixiThemeProviderProps {
  children: React.ReactNode;
}

export function PixiThemeProvider({ children }: PixiThemeProviderProps) {
  const { themeTemplate } = useTheme();
  
  const value = useMemo<PixiThemeContextValue>(() => {
    const themeName = themeTemplate;
    const isProcedural = isProceduralTheme(themeName);
    const colors = getThemeColors(themeName);
    
    // Detect mobile device
    const isMobile = typeof navigator !== 'undefined' && 
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Detect reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    
    // Get asset path based on theme
    const getAssetPath = (asset: string) => {
      // For procedural themes, we still might need some assets
      if (isProcedural) {
        return `/assets/theme-neon/${asset}`;
      }
      // Use tiki assets for all non-procedural themes
      return `/assets/tiki/${asset}`;
    };
    
    return {
      themeName,
      isProcedural,
      colors,
      isMobile,
      prefersReducedMotion,
      getAssetPath,
    };
  }, [themeTemplate]);
  
  return (
    <PixiThemeContext.Provider value={value}>
      {children}
    </PixiThemeContext.Provider>
  );
}

export function usePixiTheme(): PixiThemeContextValue {
  const context = useContext(PixiThemeContext);
  if (!context) {
    throw new Error('usePixiTheme must be used within a PixiThemeProvider');
  }
  return context;
}

/**
 * Hook to get performance settings based on device
 */
export function usePerformanceSettings() {
  const { isMobile, prefersReducedMotion } = usePixiTheme();
  
  return useMemo(() => ({
    // Particle limits
    maxParticles: isMobile ? 100 : 200,
    
    // Filter quality (0-1)
    glowQuality: isMobile ? 0.2 : 0.4,
    
    // Animation settings
    enableTrails: !prefersReducedMotion && !isMobile,
    enableScreenShake: !prefersReducedMotion,
    enableAmbientParticles: !isMobile,
    
    // Frame rate target
    targetFPS: isMobile ? 30 : 60,
  }), [isMobile, prefersReducedMotion]);
}
