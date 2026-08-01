import { useEffect, useRef, useState } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';

/**
 * Activity gate for timers, canvas loops and other non-CSS continuous motion.
 * Motion is active only when the element is near the viewport, the page is
 * visible, and the user has not requested reduced motion.
 */
export function useMotionActivity<T extends HTMLElement = HTMLDivElement>(rootMargin = '160px 0px') {
  const ref = useRef<T>(null);
  const pageVisible = usePageVisibility();
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return {
    ref,
    isMotionActive: pageVisible && inView && !reducedMotion,
  };
}
