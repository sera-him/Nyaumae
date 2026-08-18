import { useEffect, useRef, useState } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { getMotionProfile, MOTION_PROFILE_EVENT, type MotionProfile } from '@/lib/motionPolicy';

type MotionCost = 'normal' | 'high';

interface MotionActivityOptions {
  cost?: MotionCost;
  priority?: number;
}

interface HighCostEntry {
  element: HTMLElement;
  eligible: boolean;
  priority: number;
  setGranted: (granted: boolean) => void;
}

const highCostEntries = new Map<symbol, HighCostEntry>();
let grantedHighCost: symbol | null = null;

function updateHighCostBudget() {
  const viewportCenter = typeof window === 'undefined' ? 0 : window.innerHeight / 2;
  const candidates = [...highCostEntries.entries()]
    .filter(([, entry]) => entry.eligible)
    .sort(([, a], [, b]) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      const aRect = a.element.getBoundingClientRect();
      const bRect = b.element.getBoundingClientRect();
      const aDistance = Math.abs(aRect.top + aRect.height / 2 - viewportCenter);
      const bDistance = Math.abs(bRect.top + bRect.height / 2 - viewportCenter);
      return aDistance - bDistance;
    });
  const nextGranted = candidates[0]?.[0] ?? null;
  if (nextGranted === grantedHighCost) return;
  grantedHighCost = nextGranted;
  highCostEntries.forEach((entry, id) => entry.setGranted(id === grantedHighCost));
}

/**
 * Activity gate for timers, canvas loops and other non-CSS continuous motion.
 * Motion is active only when the element is near the viewport, the page is
 * visible, and the user has not requested reduced motion.
 */
export function useMotionActivity<T extends HTMLElement = HTMLDivElement>(
  rootMargin = '160px 0px',
  { cost = 'normal', priority = 0 }: MotionActivityOptions = {},
) {
  const ref = useRef<T>(null);
  const budgetIdRef = useRef(Symbol('motion-budget'));
  const pageVisible = usePageVisibility();
  const [inView, setInView] = useState(() => (
    typeof window !== 'undefined' && !('IntersectionObserver' in window)
  ));
  const [profile, setProfile] = useState<MotionProfile>(getMotionProfile);
  const [highCostGranted, setHighCostGranted] = useState(false);

  useEffect(() => {
    const sync = () => setProfile(getMotionProfile());
    sync();
    window.addEventListener(MOTION_PROFILE_EVENT, sync);
    return () => window.removeEventListener(MOTION_PROFILE_EVENT, sync);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  const baseActive = pageVisible
    && inView
    && !profile.reducedMotion
    && profile.quality !== 'static';

  useEffect(() => {
    if (cost !== 'high') return;
    const element = ref.current;
    if (!element) return;
    const id = budgetIdRef.current;
    highCostEntries.set(id, {
      element,
      eligible: baseActive,
      priority,
      setGranted: setHighCostGranted,
    });
    updateHighCostBudget();
    return () => {
      highCostEntries.delete(id);
      if (grantedHighCost === id) grantedHighCost = null;
      updateHighCostBudget();
    };
  }, [baseActive, cost, priority]);

  return {
    ref,
    isMotionActive: baseActive && (cost !== 'high' || highCostGranted),
    motionProfile: profile,
  };
}
