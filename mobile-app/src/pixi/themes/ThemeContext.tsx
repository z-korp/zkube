import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    window.addEventListener('orientationchange', updateIsMobile);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
      window.removeEventListener('orientationchange', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);
  
  const value = useMemo<PixiThemeContextValue>(() => {
    const themeName = themeTemplate;
    const isProcedural = isProceduralTheme(themeName);
    const colors = getThemeColors(themeName);
    
    const getAssetPath = (asset: string) => {
      return `/assets/${themeName}/${asset}`;
    };
    
    return {
      themeName,
      isProcedural,
      colors,
      isMobile,
      prefersReducedMotion,
      getAssetPath,
    };
  }, [themeTemplate, isMobile, prefersReducedMotion]);
  
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

export function usePerformanceSettings() {
  const { isMobile, prefersReducedMotion } = usePixiTheme();
  
  return useMemo(() => ({
    maxParticles: isMobile ? 100 : 200,
    glowQuality: isMobile ? 0.2 : 0.4,
    enableTrails: !prefersReducedMotion && !isMobile,
    enableScreenShake: !prefersReducedMotion,
    enableAmbientParticles: !isMobile,
    targetFPS: isMobile ? 30 : 60,
    prefersReducedMotion,
  }), [isMobile, prefersReducedMotion]);
}
