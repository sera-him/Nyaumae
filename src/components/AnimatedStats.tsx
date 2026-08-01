import { useState, useEffect, useRef } from 'react';

/**
 * Animated counter that counts up from 0 to `target` on mount.
 * Uses requestAnimationFrame for smooth animation.
 */
export function useAnimatedCounter(target: number, durationMs: number, active = true): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!active) {
      setValue(reducedMotion.matches ? target : 0);
      return;
    }

    let elapsed = 0;
    let lastTime = performance.now();
    let running = false;

    const animate = (now: number) => {
      running = true;
      elapsed += Math.max(0, now - lastTime);
      lastTime = now;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out quad for smoother deceleration
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));

      if (progress < 1 && !document.hidden && !reducedMotion.matches) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (document.hidden || reducedMotion.matches || running) return;
      lastTime = performance.now();
      running = true;
      rafRef.current = requestAnimationFrame(animate);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        running = false;
      } else {
        start();
      }
    };

    const handleMotionPreference = () => {
      cancelAnimationFrame(rafRef.current);
      running = false;
      if (reducedMotion.matches) {
        setValue(target);
      } else {
        elapsed = 0;
        setValue(0);
        start();
      }
    };

    if (reducedMotion.matches) {
      setValue(target);
    } else {
      setValue(0);
      start();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, [target, durationMs, active]);

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
export function AnimatedWorldStats({ className = '', active = true }: { className?: string; active?: boolean }) {
  const targetPopulation = 1_207_963_268;
  const targetLifespanDays = 74 * 365 + 6 * 30 + 24; // 74y 6m 24d

  // Population: count from 0 to 1,207,963,268 over 2.5s
  const population = useAnimatedCounter(targetPopulation, 6000, active);

  // Lifespan days: count from 0 to target over 6s
  const lifespanDays = useAnimatedCounter(targetLifespanDays, 6000, active);
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
export function AnimatedWorldStatsHero({ className = '', active = true }: { className?: string; active?: boolean }) {
  const targetPopulation = 1_207_963_268;
  const targetLifespanDays = 74 * 365 + 6 * 30 + 24;

  const population = useAnimatedCounter(targetPopulation, 6000, active);
  const lifespanDays = useAnimatedCounter(targetLifespanDays, 6000, active);
  const lifespan = formatLifespan(lifespanDays);

  return (
    <span className={`font-mono ${className}`}>
      世界观人口 {formatNumber(population)} | 人均寿命 {lifespan.years}y {lifespan.months}m {lifespan.days}d
    </span>
  );
}
