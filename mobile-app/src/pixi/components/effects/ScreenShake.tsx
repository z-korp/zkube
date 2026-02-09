import { useCallback, useRef } from 'react';
import { Container } from 'pixi.js';
import { useTick } from '@pixi/react';
import { usePerformanceSettings } from '../../themes/ThemeContext';

export interface ScreenShakeRef {
  shake: (intensity?: number, duration?: number) => void;
}

export function useScreenShake() {
  const { enableScreenShake, prefersReducedMotion } = usePerformanceSettings();
  const containerRef = useRef<Container>(null);

  const shakeRef = useRef<{
    intensity: number;
    duration: number;
    elapsed: number;
  } | null>(null);

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    if (!shakeRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    shakeRef.current.elapsed += ticker.deltaMS;

    if (shakeRef.current.elapsed >= shakeRef.current.duration) {
      shakeRef.current = null;
      container.position.set(0, 0);
      return;
    }

    const progress = shakeRef.current.elapsed / shakeRef.current.duration;
    const currentIntensity = shakeRef.current.intensity * (1 - progress);

    const x = (Math.random() - 0.5) * 2 * currentIntensity;
    const y = (Math.random() - 0.5) * 2 * currentIntensity;

    container.position.set(x, y);
  }, []);

  useTick(tickCallback);

  const shake = useCallback((intensity: number = 5, duration: number = 300) => {
    if (!enableScreenShake || prefersReducedMotion) return;

    shakeRef.current = {
      intensity,
      duration,
      elapsed: 0,
    };
  }, [enableScreenShake, prefersReducedMotion]);

  const shakePresets = {
    lineClear: () => shake(3, 150),
    combo: () => shake(5, 200),
    bigCombo: () => shake(8, 300),
    drop: () => shake(2, 100),
  };

  return {
    containerRef,
    shake,
    ...shakePresets,
  };
}

interface ScreenShakeContainerProps {
  children: React.ReactNode;
  containerRef: React.RefObject<Container | null>;
}

export const ScreenShakeContainer = ({ children, containerRef }: ScreenShakeContainerProps) => {
  return (
    <pixiContainer ref={containerRef}>
      {children}
    </pixiContainer>
  );
};

export default ScreenShakeContainer;
