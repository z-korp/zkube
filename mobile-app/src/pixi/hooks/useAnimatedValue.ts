import { useState, useRef, useCallback } from 'react';
import { useTick } from '@pixi/react';

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
 * Hook that animates a numeric value from its previous value to a new target.
 * Uses PixiJS Ticker (useTick) instead of requestAnimationFrame.
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

  // All animation state in refs to avoid re-render loops
  const animRef = useRef({
    active: false,
    startValue: targetValue,
    endValue: targetValue,
    elapsed: 0,
    delayRemaining: 0,
    currentDisplay: targetValue,
  });

  // Detect target changes
  const prevTargetRef = useRef(targetValue);
  if (targetValue !== prevTargetRef.current) {
    prevTargetRef.current = targetValue;
    animRef.current.active = true;
    animRef.current.startValue = animRef.current.currentDisplay;
    animRef.current.endValue = targetValue;
    animRef.current.elapsed = 0;
    animRef.current.delayRemaining = delay;
  }

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    const anim = animRef.current;
    if (!anim.active) return;

    const dt = ticker.deltaMS;

    // Handle delay
    if (anim.delayRemaining > 0) {
      anim.delayRemaining -= dt;
      return;
    }

    anim.elapsed += dt;
    const progress = Math.min(anim.elapsed / duration, 1);
    const easedProgress = easing(progress);
    const newValue = Math.round(
      anim.startValue + (anim.endValue - anim.startValue) * easedProgress
    );

    if (newValue !== anim.currentDisplay) {
      anim.currentDisplay = newValue;
      setDisplayValue(newValue);
    }

    if (progress >= 1) {
      anim.active = false;
      anim.currentDisplay = anim.endValue;
      setDisplayValue(anim.endValue);
    }
  }, [duration, easing, delay]);

  useTick(tickCallback);

  return displayValue;
}

/**
 * Hook that provides a pulsing scale value (1.0 -> 1.1 -> 1.0).
 * Uses PixiJS Ticker instead of requestAnimationFrame.
 */
export function usePulse(
  active: boolean,
  options: { minScale?: number; maxScale?: number; duration?: number } = {}
): number {
  const { minScale = 1.0, maxScale = 1.1, duration = 1000 } = options;
  const [scale, setScale] = useState(minScale);

  const elapsedRef = useRef(0);
  const prevActiveRef = useRef(active);

  // Reset elapsed when becoming active
  if (active && !prevActiveRef.current) {
    elapsedRef.current = 0;
  }
  prevActiveRef.current = active;

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    if (!active) {
      // Reset scale when inactive — only set if changed
      elapsedRef.current = 0;
      return;
    }

    elapsedRef.current += ticker.deltaMS;
    const progress = (elapsedRef.current % duration) / duration;

    // Sine wave for smooth pulsing
    const sineValue = Math.sin(progress * Math.PI * 2);
    const currentScale = minScale + (maxScale - minScale) * (0.5 + sineValue * 0.5);

    setScale(currentScale);
  }, [active, minScale, maxScale, duration]);

  useTick(tickCallback);

  // Return minScale immediately when not active
  if (!active) return minScale;

  return scale;
}

/**
 * Hook that provides a glow intensity (0 -> 1 -> 0).
 * Uses PixiJS Ticker instead of requestAnimationFrame.
 */
export function useGlow(
  trigger: boolean,
  options: { duration?: number; fadeOut?: number } = {}
): number {
  const { duration = 300, fadeOut = 500 } = options;
  const [intensity, setIntensity] = useState(0);

  const animRef = useRef({
    active: false,
    elapsed: 0,
  });
  const prevTriggerRef = useRef(trigger);

  // Only trigger on false -> true transition
  if (trigger && !prevTriggerRef.current) {
    animRef.current.active = true;
    animRef.current.elapsed = 0;
  }
  prevTriggerRef.current = trigger;

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    const anim = animRef.current;
    if (!anim.active) return;

    anim.elapsed += ticker.deltaMS;

    let value: number;
    if (anim.elapsed < duration) {
      // Fade in
      value = anim.elapsed / duration;
    } else if (anim.elapsed < duration + fadeOut) {
      // Fade out
      value = 1 - (anim.elapsed - duration) / fadeOut;
    } else {
      anim.active = false;
      setIntensity(0);
      return;
    }

    setIntensity(value);
  }, [duration, fadeOut]);

  useTick(tickCallback);

  return intensity;
}

export default useAnimatedValue;
