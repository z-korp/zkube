import { useState, useEffect, useRef } from 'react';

interface UseAnimatedValueOptions {
  /** Duration of animation in ms */
  duration?: number;
  /** Easing function */
  easing?: (t: number) => number;
  /** Delay before starting animation in ms */
  delay?: number;
}

// Common easing functions
export const easings = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : 
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Hook that animates a numeric value from its previous value to a new target
 * Great for score counters, progress bars, etc.
 */
export function useAnimatedValue(
  targetValue: number,
  options: UseAnimatedValueOptions = {}
): number {
  const {
    duration = 500,
    easing = easings.easeOut,
    delay = 0,
  } = options;

  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(targetValue);
  const previousTargetRef = useRef<number>(targetValue);

  useEffect(() => {
    // If target hasn't changed, skip
    if (targetValue === previousTargetRef.current) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = displayValue;
    const endValue = targetValue;
    previousTargetRef.current = targetValue;
    startValueRef.current = startValue;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay;
      }

      const elapsed = timestamp - startTimeRef.current;
      
      if (elapsed < 0) {
        // Still in delay period
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        startTimeRef.current = 0;
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing, delay, displayValue]);

  return displayValue;
}

/**
 * Hook that provides a pulsing scale value (1.0 -> 1.1 -> 1.0)
 * Great for attention-grabbing animations
 */
export function usePulse(
  active: boolean,
  options: { minScale?: number; maxScale?: number; duration?: number } = {}
): number {
  const { minScale = 1.0, maxScale = 1.1, duration = 1000 } = options;
  const [scale, setScale] = useState(minScale);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setScale(minScale);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = (elapsed % duration) / duration;
      
      // Sine wave for smooth pulsing
      const sineValue = Math.sin(progress * Math.PI * 2);
      const currentScale = minScale + (maxScale - minScale) * (0.5 + sineValue * 0.5);

      setScale(currentScale);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, minScale, maxScale, duration]);

  return scale;
}

/**
 * Hook that provides a glow intensity (0 -> 1 -> 0)
 * Great for highlighting new achievements
 */
export function useGlow(
  trigger: boolean,
  options: { duration?: number; fadeOut?: number } = {}
): number {
  const { duration = 300, fadeOut = 500 } = options;
  const [intensity, setIntensity] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const previousTriggerRef = useRef(trigger);

  useEffect(() => {
    // Only trigger on false -> true transition
    if (trigger && !previousTriggerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = 0;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        
        let value: number;
        if (elapsed < duration) {
          // Fade in
          value = elapsed / duration;
        } else if (elapsed < duration + fadeOut) {
          // Fade out
          value = 1 - (elapsed - duration) / fadeOut;
        } else {
          setIntensity(0);
          animationRef.current = null;
          return;
        }

        setIntensity(value);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    previousTriggerRef.current = trigger;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, duration, fadeOut]);

  return intensity;
}

export default useAnimatedValue;
