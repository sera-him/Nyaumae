import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { applyMotionProfile, getMotionConnection, MOTION_PROFILE_EVENT } from '@/lib/motionPolicy';

const MOTION_SELECTOR = '[data-motion-loop], [data-motion-reveal]';
const IMPORTANT_CLICK_SELECTOR = '[data-motion-ripple="true"]';
const CLICK_RIPPLE_DURATION = 180;

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
    const mobileViewport = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const connection = getMotionConnection();

    const syncPageState = () => {
      root.dataset.motionPage = document.hidden ? 'hidden' : 'visible';
      applyMotionProfile();
      window.dispatchEvent(new CustomEvent(MOTION_PROFILE_EVENT));
    };

    syncPageState();
    document.addEventListener('visibilitychange', syncPageState);
    reducedMotion.addEventListener('change', syncPageState);
    mobileViewport.addEventListener('change', syncPageState);
    connection?.addEventListener('change', syncPageState);

    const clickRipples = new Set<HTMLElement>();

    const getClickableTarget = (node: EventTarget | null) => {
      if (!(node instanceof Element)) return null;
      const target = node.closest<HTMLElement>(IMPORTANT_CLICK_SELECTOR);
      if (
        !target
        || target.hasAttribute('disabled')
        || target.getAttribute('aria-disabled') === 'true'
      ) return null;
      return target;
    };

    const addClickRipple = (target: HTMLElement, clientX?: number, clientY?: number) => {
      if (reducedMotion.matches || !document.body) return;

      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const ripple = document.createElement('span');
      const diameter = Math.max(32, Math.min(180, Math.max(rect.width, rect.height) * 1.35));
      const color = window.getComputedStyle(target).color;
      ripple.className = 'motion-click-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${clientX ?? rect.left + rect.width / 2}px`;
      ripple.style.top = `${clientY ?? rect.top + rect.height / 2}px`;
      ripple.style.width = `${diameter}px`;
      ripple.style.height = `${diameter}px`;
      if (color && color !== 'rgba(0, 0, 0, 0)') ripple.style.color = color;

      const removeRipple = () => {
        ripple.remove();
        clickRipples.delete(ripple);
      };

      ripple.addEventListener('animationend', removeRipple, { once: true });
      clickRipples.add(ripple);
      document.body.appendChild(ripple);
      window.setTimeout(removeRipple, CLICK_RIPPLE_DURATION + 120);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = getClickableTarget(event.target);
      if (!target) return;
      addClickRipple(target, event.clientX, event.clientY);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      const target = getClickableTarget(event.target);
      if (!target) return;
      addClickRipple(target);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    const cleanupClickEffects = () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      clickRipples.forEach((ripple) => ripple.remove());
      clickRipples.clear();
    };

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll<HTMLElement>(MOTION_SELECTOR).forEach((element) => {
        element.dataset.motionActive = 'true';
      });

      return () => {
        cleanupClickEffects();
        document.removeEventListener('visibilitychange', syncPageState);
        reducedMotion.removeEventListener('change', syncPageState);
        mobileViewport.removeEventListener('change', syncPageState);
        connection?.removeEventListener('change', syncPageState);
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
      cleanupClickEffects();
      mutationObserver.disconnect();
      viewportObserver.disconnect();
      document.removeEventListener('visibilitychange', syncPageState);
      reducedMotion.removeEventListener('change', syncPageState);
      mobileViewport.removeEventListener('change', syncPageState);
      connection?.removeEventListener('change', syncPageState);
    };
  }, [location.pathname]);

  return null;
}
