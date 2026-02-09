import { useState, useCallback, useRef } from 'react';
import { useTick } from '@pixi/react';
import { usePerformanceSettings } from '../../themes/ThemeContext';

interface ShakeState {
  x: number;
  y: number;
  active: boolean;
}

export interface ScreenShakeRef {
  shake: (intensity?: number, duration?: number) => void;
}

export function useScreenShake() {
  const { enableScreenShake, prefersReducedMotion } = usePerformanceSettings();
  const [offset, setOffset] = useState<ShakeState>({ x: 0, y: 0, active: false });

  const shakeRef = useRef<{
    intensity: number;
    duration: number;
    elapsed: number;
  } | null>(null);

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    if (!shakeRef.current) return;

    shakeRef.current.elapsed += ticker.deltaMS;

    if (shakeRef.current.elapsed >= shakeRef.current.duration) {
      shakeRef.current = null;
      setOffset({ x: 0, y: 0, active: false });
      return;
    }

    const progress = shakeRef.current.elapsed / shakeRef.current.duration;
    const currentIntensity = shakeRef.current.intensity * (1 - progress);

    const x = (Math.random() - 0.5) * 2 * currentIntensity;
    const y = (Math.random() - 0.5) * 2 * currentIntensity;

    setOffset({ x, y, active: true });
  }, []);

  useTick(tickCallback);

  const shake = useCallback((intensity: number = 5, duration: number = 300) => {
    if (!enableScreenShake || prefersReducedMotion) return;

    shakeRef.current = {
      intensity,
      duration,
      elapsed: 0,
    };

    setOffset(prev => ({ ...prev, active: true }));
  }, [enableScreenShake, prefersReducedMotion]);

  const shakePresets = {
    lineClear: () => shake(3, 150),
    combo: () => shake(5, 200),
    bigCombo: () => shake(8, 300),
    drop: () => shake(2, 100),
  };

  return {
    offset,
    shake,
    ...shakePresets,
  };
}

interface ScreenShakeContainerProps {
  children: React.ReactNode;
  offset: { x: number; y: number };
}

export const ScreenShakeContainer = ({ children, offset }: ScreenShakeContainerProps) => {
  return (
    <pixiContainer x={offset.x} y={offset.y}>
      {children}
    </pixiContainer>
  );
};

export default ScreenShakeContainer;
