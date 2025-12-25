"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
}

const defaultConfig: Required<SpringConfig> = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  precision: 0.01,
};

/**
 * Spring-physics based animation hook for smooth number transitions.
 * Provides natural, bouncy animations that feel more organic than linear interpolation.
 */
export function useSpringValue(
  targetValue: number,
  config: SpringConfig = {}
): {
  value: number;
  isAnimating: boolean;
  velocity: number;
} {
  const { stiffness, damping, mass, precision } = {
    ...defaultConfig,
    ...config,
  };

  const [value, setValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const targetRef = useRef(targetValue);

  // Update target when prop changes
  useEffect(() => {
    targetRef.current = targetValue;
    if (Math.abs(targetValue - value) > precision) {
      setIsAnimating(true);
    }
  }, [targetValue, value, precision]);

  // Spring physics animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = (currentTime: number) => {
      if (previousTimeRef.current === null) {
        previousTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time in seconds (cap at 64ms to prevent large jumps)
      const deltaTime = Math.min((currentTime - previousTimeRef.current) / 1000, 0.064);
      previousTimeRef.current = currentTime;

      setValue((currentValue) => {
        const target = targetRef.current;
        const displacement = target - currentValue;

        // Spring force: F = -kx - cv
        // where k = stiffness, x = displacement, c = damping, v = velocity
        const springForce = stiffness * displacement;
        const dampingForce = damping * velocityRef.current;
        const acceleration = (springForce - dampingForce) / mass;

        // Update velocity and position
        velocityRef.current += acceleration * deltaTime;
        const newValue = currentValue + velocityRef.current * deltaTime;

        // Check if we've settled
        if (
          Math.abs(displacement) < precision &&
          Math.abs(velocityRef.current) < precision
        ) {
          velocityRef.current = 0;
          setIsAnimating(false);
          previousTimeRef.current = null;
          return target;
        }

        return newValue;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, stiffness, damping, mass, precision]);

  return {
    value,
    isAnimating,
    velocity: velocityRef.current,
  };
}

/**
 * Simpler hook for animated counting with configurable duration.
 * Good for displaying metrics that should animate on mount or value change.
 */
export function useAnimatedValue(
  targetValue: number,
  duration: number = 1000,
  easing: "linear" | "easeOut" | "easeInOut" | "spring" = "easeOut"
): number {
  const [value, setValue] = useState(0);
  const startValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    spring: (t: number) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0
        ? 0
        : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
  };

  useEffect(() => {
    startValueRef.current = value;
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunctions[easing](progress);

      const newValue =
        startValueRef.current +
        (targetValue - startValueRef.current) * easedProgress;

      setValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing]);

  return value;
}

/**
 * Hook that tracks the previous value for comparison.
 * Useful for detecting changes and triggering animations.
 */
export function usePreviousValue<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Hook that returns true when a value has changed since the last render.
 * Useful for triggering one-time animations on value changes.
 */
export function useValueChanged(value: number, threshold: number = 0): boolean {
  const previousValue = usePreviousValue(value);
  const [changed, setChanged] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (previousValue !== undefined && Math.abs(value - previousValue) > threshold) {
      setChanged(true);

      // Reset changed state after animation completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setChanged(false);
      }, 400);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, previousValue, threshold]);

  return changed;
}

/**
 * Format a number for display with proper thousand separators.
 */
export function formatAnimatedNumber(
  value: number,
  options: {
    decimals?: number;
    suffix?: string;
    prefix?: string;
  } = {}
): string {
  const { decimals = 0, suffix = "", prefix = "" } = options;
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${prefix}${formatted}${suffix}`;
}
