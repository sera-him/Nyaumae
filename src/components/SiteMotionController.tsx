import { useEffect } from 'react';
import { useLocation } from 'react-router';

const MOTION_SELECTOR = '[data-motion-loop], [data-motion-reveal]';

/**
 * Keeps CSS motion honest:
 * - continuous effects pause when the document is hidden;
 * - marked loops only run while they are near the viewport;
 * - dynamically mounted routes and game states are observed as well.
 */
export default function SiteMotionController() {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncPageState = () => {
      root.dataset.motionPage = document.hidden ? 'hidden' : 'visible';
      root.dataset.motionReduced = reducedMotion.matches ? 'true' : 'false';
    };

    syncPageState();
    document.addEventListener('visibilitychange', syncPageState);
    reducedMotion.addEventListener('change', syncPageState);

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll<HTMLElement>(MOTION_SELECTOR).forEach((element) => {
        element.dataset.motionActive = 'true';
      });

      return () => {
        document.removeEventListener('visibilitychange', syncPageState);
        reducedMotion.removeEventListener('change', syncPageState);
      };
    }

    const observed = new WeakSet<Element>();
    const viewportObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (element.hasAttribute('data-motion-reveal')) {
            if (entry.isIntersecting) {
              element.dataset.motionActive = 'true';
              viewportObserver.unobserve(element);
            }
            return;
          }
          element.dataset.motionActive = entry.isIntersecting ? 'true' : 'false';
        });
      },
      { rootMargin: '160px 0px', threshold: 0.01 },
    );

    const observeMotionElements = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(MOTION_SELECTOR).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.dataset.motionActive = 'false';
        viewportObserver.observe(element);
      });
    };

    observeMotionElements(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(MOTION_SELECTOR) && !observed.has(node)) {
            observed.add(node);
            node.dataset.motionActive = 'false';
            viewportObserver.observe(node);
          }
          observeMotionElements(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      viewportObserver.disconnect();
      document.removeEventListener('visibilitychange', syncPageState);
      reducedMotion.removeEventListener('change', syncPageState);
    };
  }, [location.pathname]);

  return null;
}
