import { useState, useEffect, useRef } from 'react';

/**
 * Animated counter that counts up from 0 to `target` on mount.
 * Uses requestAnimationFrame for smooth animation.
 */
export function useAnimatedCounter(target: number, durationMs: number): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = null;
    const animate = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out quad for smoother deceleration
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return value;
}

/**
 * Format a number with comma separators:
 * 1207963268 → "1,207,963,268"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format lifespan from total days into "XXy Xm Xd" format.
 */
export function formatLifespan(totalDays: number): { years: number; months: number; days: number } {
  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = Math.floor(remainingAfterYears % 30);
  return { years, months, days };
}

/**
 * Display component for animated world stats (Footer style).
 * On load, counts up from 0 to final values.
 */
export function AnimatedWorldStats({ className = '' }: { className?: string }) {
  const targetPopulation = 1_207_963_268;
  const targetLifespanDays = 74 * 365 + 6 * 30 + 24; // 74y 6m 24d

  // Population: count from 0 to 1,207,963,268 over 2.5s
  const population = useAnimatedCounter(targetPopulation, 6000);

  // Lifespan days: count from 0 to target over 6s
  const lifespanDays = useAnimatedCounter(targetLifespanDays, 6000);
  const lifespan = formatLifespan(lifespanDays);

  return (
    <span className={`font-mono ${className}`}>
      世界观人口 {formatNumber(population)} · 人均寿命 {lifespan.years}y {lifespan.months}m {lifespan.days}d
    </span>
  );
}

/**
 * Display component for Hero variant (with pipes).
 */
export function AnimatedWorldStatsHero({ className = '' }: { className?: string }) {
  const targetPopulation = 1_207_963_268;
  const targetLifespanDays = 74 * 365 + 6 * 30 + 24;

  const population = useAnimatedCounter(targetPopulation, 6000);
  const lifespanDays = useAnimatedCounter(targetLifespanDays, 6000);
  const lifespan = formatLifespan(lifespanDays);

  return (
    <span className={`font-mono ${className}`}>
      世界观人口 {formatNumber(population)} | 人均寿命 {lifespan.years}y {lifespan.months}m {lifespan.days}d
    </span>
  );
}
