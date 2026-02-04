import { useState, useCallback, useEffect, useRef } from 'react';
import { usePerformanceSettings } from '../../themes/ThemeContext';

interface ShakeState {
  x: number;
  y: number;
  active: boolean;
}

export interface ScreenShakeRef {
  shake: (intensity?: number, duration?: number) => void;
}

/**
 * Hook to manage screen shake effect
 * Returns offset values to apply to the main container
 */
export function useScreenShake() {
  const { enableScreenShake, prefersReducedMotion } = usePerformanceSettings();
  const [offset, setOffset] = useState<ShakeState>({ x: 0, y: 0, active: false });
  const frameRef = useRef<number>();
  const shakeRef = useRef<{
    intensity: number;
    duration: number;
    elapsed: number;
  } | null>(null);

  // Animation loop for shake
  useEffect(() => {
    if (!offset.active) return;
    
    const animate = () => {
      if (!shakeRef.current) {
        setOffset({ x: 0, y: 0, active: false });
        return;
      }
      
      shakeRef.current.elapsed += 16; // ~60fps
      
      if (shakeRef.current.elapsed >= shakeRef.current.duration) {
        shakeRef.current = null;
        setOffset({ x: 0, y: 0, active: false });
        return;
      }
      
      // Decay intensity over time
      const progress = shakeRef.current.elapsed / shakeRef.current.duration;
      const currentIntensity = shakeRef.current.intensity * (1 - progress);
      
      // Random offset
      const x = (Math.random() - 0.5) * 2 * currentIntensity;
      const y = (Math.random() - 0.5) * 2 * currentIntensity;
      
      setOffset({ x, y, active: true });
      
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [offset.active]);

  // Trigger shake
  const shake = useCallback((intensity: number = 5, duration: number = 300) => {
    if (!enableScreenShake || prefersReducedMotion) return;
    
    shakeRef.current = {
      intensity,
      duration,
      elapsed: 0,
    };
    
    setOffset(prev => ({ ...prev, active: true }));
  }, [enableScreenShake, prefersReducedMotion]);

  // Shake presets for different events
  const shakePresets = {
    // Small shake for single line clear
    lineClear: () => shake(3, 150),
    
    // Medium shake for combos (2-3 lines)
    combo: () => shake(5, 200),
    
    // Large shake for big combos (4+ lines)
    bigCombo: () => shake(8, 300),
    
    // Subtle shake for block placement
    drop: () => shake(2, 100),
  };

  return {
    offset,
    shake,
    ...shakePresets,
  };
}

/**
 * Component that wraps children and applies shake offset
 */
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
