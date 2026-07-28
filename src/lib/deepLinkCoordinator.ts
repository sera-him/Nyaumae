export type ScrollPolicy = 'page-top' | 'content-start' | 'target';
export type FocusPolicy = 'page-heading' | 'content-heading' | 'target' | 'none';

export interface SearchTarget {
  kind: 'internal';
  route: string;
  targetId?: string;
  ancestorToOpen: string[];
  scrollPolicy: ScrollPolicy;
  focusPolicy: FocusPolicy;
}

export interface ExternalSearchTarget {
  kind: 'external';
  url: string;
}

export type SearchRecordTarget = SearchTarget | ExternalSearchTarget;

export interface SearchRecord {
  id: string;
  title: string;
  excerpt: string;
  keywords: string[];
  sourceKind: string;
  target: SearchRecordTarget;
}

class TargetRegistry {
  private targets = new Map<string, HTMLElement>();
  private readyRoutes = new Set<string>();

  registerTarget(targetId: string, element: HTMLElement): void {
    this.targets.set(targetId, element);
  }

  unregisterTarget(targetId: string): void {
    this.targets.delete(targetId);
  }

  getTarget(targetId: string): HTMLElement | undefined {
    return this.targets.get(targetId);
  }

  markRouteReady(route: string): void {
    this.readyRoutes.add(route);
  }

  isRouteReady(route: string): boolean {
    return this.readyRoutes.has(route);
  }

  clear(): void {
    this.targets.clear();
    this.readyRoutes.clear();
  }
}

export const targetRegistry = new TargetRegistry();

/** Targets that live inside a lazy section. Keep this mapping here so there is
 * one deep-link implementation instead of a second scroll helper. */
const SECTION_PARENT_MAP: Record<string, string> = {
  chess: 'chess-rules',
  math: 'math-models',
  'skill-ttt': 'skill-tic-tac-toe',
  overload: 'world-settings',
};

export function getParentSectionId(targetId: string): string {
  return SECTION_PARENT_MAP[targetId] ?? targetId;
}

export function emitRouteReady(route: string): void {
  window.dispatchEvent(new CustomEvent('kimi:routeReady', { detail: route }));
}

export function emitExpandSection(sectionId: string): void {
  window.dispatchEvent(new CustomEvent('kimi:expandSection', { detail: sectionId }));
}

interface PendingTarget {
  route: string;
  targetId?: string;
  ancestorToOpen: string[];
  scrollPolicy: ScrollPolicy;
  focusPolicy: FocusPolicy;
}

let pendingTarget: PendingTarget | null = null;

function processTarget(): void {
  if (!pendingTarget) return;
  const { route, targetId, ancestorToOpen, scrollPolicy, focusPolicy } = pendingTarget;

  if (!targetRegistry.isRouteReady(route)) return;

  // Ask lazy sections to mount before looking up the final target. The
  // section component handles this event whether or not it is registered yet.
  for (const ancestor of ancestorToOpen) emitExpandSection(ancestor);

  const allAncestorsOpen = ancestorToOpen.every(a => {
    const el = targetRegistry.getTarget(a);
    return el && el.isConnected;
  });
  if (!allAncestorsOpen) return;

  if (targetId) {
    const el = targetRegistry.getTarget(targetId);
    if (!el || !el.isConnected) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      setTimeout(() => el.removeAttribute('tabindex'), 3000);
    });
  } else if (scrollPolicy === 'page-top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (focusPolicy === 'page-heading') {
      const h1 = document.querySelector('h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
        setTimeout(() => h1.removeAttribute('tabindex'), 3000);
      }
    }
  }

  pendingTarget = null;
}

function handleRouteReady(e: Event): void {
  const detail = (e as CustomEvent).detail;
  if (typeof detail === 'string') {
    targetRegistry.markRouteReady(detail);
    processTarget();
  }
}

function handleExpandSection(e: Event): void {
  const sectionId = (e as CustomEvent).detail;
  if (typeof sectionId === 'string') {
    const el = targetRegistry.getTarget(sectionId);
    if (el) {
      const expandBtn = el.querySelector('[data-expand-trigger]') as HTMLElement;
      expandBtn?.click();
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('kimi:routeReady', handleRouteReady);
  window.addEventListener('kimi:expandSection', handleExpandSection);
}

export function scheduleDeepLink(target: PendingTarget): void {
  pendingTarget = target;
  processTarget();
  if (pendingTarget) {
    const retry = setInterval(() => {
      processTarget();
      if (!pendingTarget) clearInterval(retry);
    }, 200);
    setTimeout(() => clearInterval(retry), 8000);
  }
}

/** Compatibility entry point for links that only know an anchor id. */
export function expandAndScrollTo(targetId: string): void {
  const sectionId = getParentSectionId(targetId);
  emitExpandSection(sectionId);
  window.setTimeout(() => {
    const element = targetRegistry.getTarget(targetId) ?? document.getElementById(targetId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    window.setTimeout(() => element.removeAttribute('tabindex'), 3000);
  }, 100);
}

export function buildSearchUrl(target: SearchTarget): string {
  const base = target.route;
  return target.targetId ? `${base}?target=${encodeURIComponent(target.targetId)}` : base;
}
