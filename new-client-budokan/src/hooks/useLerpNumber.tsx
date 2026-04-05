import { useState, useEffect, useRef } from "react";

interface LerpOptions {
  duration?: number;
  easing?: (t: number) => number;
  decimals?: number; // Number of decimal places for decimal numbers
  integer?: boolean; // Flag to indicate integer rounding
}

export function useLerpNumber(
  targetValue: number | undefined,
  options: LerpOptions = {},
) {
  // Initialize displayValue to targetValue, which may be undefined
  const [displayValue, setDisplayValue] = useState<number | undefined>(
    targetValue,
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);

  // Refs to store values that should remain constant during the animation
  const startValueRef = useRef<number | undefined>(displayValue);
  const startTimeRef = useRef<number | null>(null);
  const targetRef = useRef<number | undefined>(targetValue);
  const durationRef = useRef(options.duration ?? 1000);
  const easingRef = useRef(options.easing ?? ((t: number) => t));
  const decimalsRef = useRef(options.decimals);
  const integerRef = useRef(options.integer ?? false);

  useEffect(() => {
    if (isFirstRender.current) {
      // On the first render, set displayValue to targetValue without animation
      setDisplayValue(targetValue);
      isFirstRender.current = false;
    } else if (targetValue !== targetRef.current) {
      // Start animating when targetValue changes after the first render
      setIsAnimating(true);
    }
    targetRef.current = targetValue;
  }, [targetValue]);

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    // Initialize values only once per animation
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    durationRef.current = options.duration ?? 1000;
    easingRef.current = options.easing ?? ((t: number) => t);
    decimalsRef.current = options.decimals;
    integerRef.current = options.integer ?? false;

    const startValue = startValueRef.current;
    const target = targetRef.current;
    const duration = durationRef.current;
    const easing = easingRef.current;
    const decimals = decimalsRef.current;
    const integer = integerRef.current;

    // If target or startValue are undefined, set displayValue to target and stop animating
    if (target === undefined || startValue === undefined) {
      setDisplayValue(target);
      setIsAnimating(false);
      return;
    }

    const valueDifference = Math.abs(target - startValue);

    // Threshold to skip animation for small differences
    const MIN_VALUE_DIFFERENCE = 0.01; // Adjust as needed
    if (valueDifference < MIN_VALUE_DIFFERENCE) {
      setDisplayValue(target);
      setIsAnimating(false);
      return;
    }

    const animate = (time: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }

      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const newValue = lerp(startValue, target, easedProgress);

      // Determine how to round based on options
      let roundedValue: number;
      if (integer) {
        // Integer rounding based on the direction of the change
        if (target > startValue) {
          roundedValue = Math.ceil(newValue);
        } else if (target < startValue) {
          roundedValue = Math.floor(newValue);
        } else {
          roundedValue = target;
        }
      } else if (typeof decimals === "number") {
        // Round to specified decimal places
        roundedValue = roundToDecimals(newValue, decimals);
      } else {
        // No rounding
        roundedValue = newValue;
      }

      setDisplayValue(roundedValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        // Ensure the final value is set precisely
        setDisplayValue(target);
      }
    };

    requestAnimationFrame(animate);

    // Clean up function to cancel animation if component unmounts
    return () => {
      setIsAnimating(false);
    };
  }, [isAnimating]);

  return displayValue;
}

// Helper functions
function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function roundToDecimals(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
