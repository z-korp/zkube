/**
 * zKube V3 Animation Utilities
 * Choreographed animation sequences, tweens, and path helpers
 * Uses easing functions from tokens.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTick } from '@pixi/react';

// ============================================================================
// 1. MATH HELPERS
// ============================================================================

/** Linear interpolation between two values */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Quadratic Bezier point for arc paths (e.g., coin fly animation) */
export function bezierPoint(
  t: number,
  start: { x: number; y: number },
  control: { x: number; y: number },
  end: { x: number; y: number },
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
  };
}

// ============================================================================
// 2. ANIMATION STEP TYPES
// ============================================================================

export type EasingFn = (t: number) => number;

export interface AnimStep {
  /** Unique key to reference this animated value */
  id: string;
  /** Delay in ms before animation starts */
  delay: number;
  /** Duration in ms */
  duration: number;
  /** Start value */
  from: number;
  /** End value */
  to: number;
  /** Easing function (from tokens.ts ease.*) */
  ease: EasingFn;
}

export interface AnimSequenceState {
  /** Get current interpolated value for a step by id */
  get: (id: string) => number;
  /** Start the animation sequence */
  play: () => void;
  /** Reset all values to initial state */
  reset: () => void;
  /** Whether any animation is still running */
  isPlaying: boolean;
  /** Elapsed time in ms since play() was called */
  elapsed: number;
}

// ============================================================================
// 3. useAnimationSequence — Choreographed multi-step animations
// ============================================================================

/**
 * Hook for choreographed animation sequences (modal enter, level complete, etc.)
 *
 * Usage:
 *   const seq = useAnimationSequence([
 *     { id: 'backdrop', delay: 0, duration: 300, from: 0, to: 0.6, ease: ease.linear },
 *     { id: 'titleScale', delay: 100, duration: 300, from: 0.8, to: 1.0, ease: ease.outCubic },
 *     { id: 'star1', delay: 400, duration: 400, from: 0, to: 1.0, ease: ease.outBack },
 *   ]);
 *
 *   // In render:
 *   <pixiContainer alpha={seq.get('backdrop')} scale={seq.get('titleScale')}>
 *
 *   // Trigger:
 *   useEffect(() => { if (isOpen) seq.play(); else seq.reset(); }, [isOpen]);
 */
export function useAnimationSequence(steps: AnimStep[]): AnimSequenceState {
  const valuesRef = useRef<Map<string, number>>(new Map());
  const elapsedRef = useRef(0);
  const playingRef = useRef(false);
  const startTimeRef = useRef(0);
  const [, setFrame] = useState(0);

  useEffect(() => {
    const m = valuesRef.current;
    for (const s of steps) {
      if (!m.has(s.id)) m.set(s.id, s.from);
    }
  }, [steps]);

  const play = useCallback(() => {
    playingRef.current = true;
    startTimeRef.current = performance.now();
    elapsedRef.current = 0;
    for (const s of steps) {
      valuesRef.current.set(s.id, s.from);
    }
    setFrame((n) => n + 1);
  }, [steps]);

  const reset = useCallback(() => {
    playingRef.current = false;
    elapsedRef.current = 0;
    for (const s of steps) {
      valuesRef.current.set(s.id, s.from);
    }
    setFrame((n) => n + 1);
  }, [steps]);

  const get = useCallback((id: string): number => {
    return valuesRef.current.get(id) ?? 0;
  }, []);

  useTick(() => {
    if (!playingRef.current) return;

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    elapsedRef.current = elapsed;

    let allDone = true;
    const m = valuesRef.current;

    for (const s of steps) {
      if (elapsed < s.delay) {
        m.set(s.id, s.from);
        allDone = false;
      } else {
        const localT = clamp((elapsed - s.delay) / s.duration, 0, 1);
        m.set(s.id, lerp(s.from, s.to, s.ease(localT)));
        if (localT < 1) allDone = false;
      }
    }

    setFrame((n) => n + 1);

    if (allDone) {
      playingRef.current = false;
    }
  });

  return {
    get,
    play,
    reset,
    isPlaying: playingRef.current,
    elapsed: elapsedRef.current,
  };
}

// ============================================================================
// 4. useCountUp — Animate a number from current to target
// ============================================================================

/**
 * Animates a displayed number toward a target value.
 * Returns the current display value (integer).
 *
 * Usage:
 *   const displayScore = useCountUp(score, 500, ease.outCubic);
 *   <pixiText text={String(displayScore)} />
 */
export function useCountUp(
  target: number,
  durationMs: number,
  easingFn: EasingFn,
): number {
  const fromRef = useRef(target);
  const toRef = useRef(target);
  const startRef = useRef(0);
  const currentRef = useRef(target);
  const animatingRef = useRef(false);
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (toRef.current === target) return;
    fromRef.current = currentRef.current;
    toRef.current = target;
    startRef.current = performance.now();
    animatingRef.current = true;
  }, [target]);

  useTick(() => {
    if (!animatingRef.current) return;

    const elapsed = performance.now() - startRef.current;
    const t = clamp(elapsed / durationMs, 0, 1);
    const eased = easingFn(t);
    const value = lerp(fromRef.current, toRef.current, eased);
    currentRef.current = value;

    const rounded = Math.round(value);
    setDisplay(rounded);

    if (t >= 1) {
      animatingRef.current = false;
      currentRef.current = toRef.current;
      setDisplay(Math.round(toRef.current));
    }
  });

  return display;
}

// ============================================================================
// 5. usePulse — Looping alpha/scale pulse for attention states
// ============================================================================

/**
 * Returns a value that oscillates between min and max.
 * Useful for danger pulse, button glow, etc.
 *
 * Usage:
 *   const pulseAlpha = usePulse(0.8, 1.0, 800, active);
 *   <pixiContainer alpha={pulseAlpha}>
 */
export function usePulse(
  min: number,
  max: number,
  periodMs: number,
  active: boolean,
): number {
  const timeRef = useRef(0);
  const [value, setValue] = useState(max);

  useTick((ticker) => {
    if (!active) {
      if (value !== max) setValue(max);
      timeRef.current = 0;
      return;
    }
    timeRef.current += ticker.deltaMS;
    // Sine wave oscillation: smooth min→max→min
    const phase = (timeRef.current % periodMs) / periodMs;
    const sine = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    setValue(lerp(min, max, sine));
  });

  return value;
}

// ============================================================================
// 6. useCoinFly — Bezier arc from source to target position
// ============================================================================

export interface CoinFlyState {
  /** Current position */
  x: number;
  y: number;
  /** Current scale (1.0 → 0.5) */
  scale: number;
  /** Current alpha */
  alpha: number;
  /** Whether animation is playing */
  active: boolean;
  /** Start the fly animation */
  fly: (from: { x: number; y: number }, to: { x: number; y: number }) => void;
}

/**
 * Bezier arc animation for coin/cube fly effects.
 * Control point is placed 60px above the midpoint.
 *
 * Usage:
 *   const coin = useCoinFly(600, ease.inCubic);
 *   coin.fly({ x: 100, y: 300 }, { x: 350, y: 20 });
 *   {coin.active && <pixiSprite x={coin.x} y={coin.y} scale={coin.scale} alpha={coin.alpha} />}
 */
export function useCoinFly(
  durationMs: number,
  easingFn: EasingFn,
): CoinFlyState {
  const startRef = useRef({ x: 0, y: 0 });
  const endRef = useRef({ x: 0, y: 0 });
  const controlRef = useRef({ x: 0, y: 0 });
  const startTimeRef = useRef(0);
  const activeRef = useRef(false);
  const [state, setState] = useState({ x: 0, y: 0, scale: 1, alpha: 1, active: false });

  const fly = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    startRef.current = from;
    endRef.current = to;
    controlRef.current = {
      x: (from.x + to.x) / 2,
      y: Math.min(from.y, to.y) - 60,
    };
    startTimeRef.current = performance.now();
    activeRef.current = true;
    setState({ x: from.x, y: from.y, scale: 1, alpha: 1, active: true });
  }, []);

  useTick(() => {
    if (!activeRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;
    const t = clamp(elapsed / durationMs, 0, 1);
    const eased = easingFn(t);

    const pos = bezierPoint(eased, startRef.current, controlRef.current, endRef.current);
    const scale = lerp(1.0, 0.5, eased);
    const alpha = t < 0.8 ? 1 : lerp(1, 0, (t - 0.8) / 0.2);

    setState({ x: pos.x, y: pos.y, scale, alpha, active: true });

    if (t >= 1) {
      activeRef.current = false;
      setState((prev) => ({ ...prev, active: false }));
    }
  });

  return { ...state, fly };
}
