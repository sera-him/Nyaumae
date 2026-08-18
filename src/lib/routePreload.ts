import type { ComponentType } from 'react';
import { isKnownCharacterFilter, resolveAlias } from '@/lib/routeManifest';

interface LazyPageModule {
  default: ComponentType;
}

export type PageLoader = () => Promise<LazyPageModule>;
export type PreloadTask = () => Promise<unknown>;

function memoizePageLoader<T extends LazyPageModule>(importer: () => Promise<T>): PageLoader {
  let promise: Promise<T> | undefined;

  return () => {
    if (!promise) {
      promise = importer().catch((error) => {
        promise = undefined;
        throw error;
      });
    }
    return promise;
  };
}

export const routeLoaders = {
  portal: memoizePageLoader(() => import('@/pages/Portal')),
  characters: memoizePageLoader(() => import('@/pages/CharactersPage')),
  characterDetail: memoizePageLoader(() => import('@/pages/CharacterDetail')),
  stories: memoizePageLoader(() => import('@/pages/StoriesPage')),
  storyReader: memoizePageLoader(() => import('@/pages/StoryReader')),
  miia: memoizePageLoader(() => import('@/pages/MiiaSpace')),
  playground: memoizePageLoader(() => import('@/pages/Playground')),
  math: memoizePageLoader(() => import('@/pages/MathModelsPage')),
  world: memoizePageLoader(() => import('@/pages/WorldPage')),
  api: memoizePageLoader(() => import('@/pages/ApiDocs')),
  oceanChat: memoizePageLoader(() => import('@/pages/ChatSkin')),
  sweetDreamChat: memoizePageLoader(() => import('@/pages/SweetDreamChat')),
  auroraChat: memoizePageLoader(() => import('@/pages/AuroraChat')),
  chatSelect: memoizePageLoader(() => import('@/pages/ChatSelect')),
  aiSettings: memoizePageLoader(() => import('@/pages/AISettingsPage')),
  codex: memoizePageLoader(() => import('@/pages/CodexPage')),
  nctb: memoizePageLoader(() => import('@/pages/NctbPage')),
  analytics: memoizePageLoader(() => import('@/pages/DataStatsPage')),
  catMouse: memoizePageLoader(() => import('@/pages/CatMouseGame')),
} satisfies Record<string, PageLoader>;

function normalizePathname(pathname: string): string {
  const clean = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return clean || '/';
}

export function getRouteLoader(pathname: string): PageLoader | null {
  const path = normalizePathname(pathname);
  const alias = resolveAlias(path);
  if (alias && alias !== path) return getRouteLoader(alias);

  if (path === '/') return routeLoaders.portal;
  if (path === '/cat-mouse') return routeLoaders.catMouse;
  if (path === '/neural-clash') return routeLoaders.playground;
  if (path === '/codex') return routeLoaders.codex;
  if (path === '/nctb') return routeLoaders.nctb;
  if (path === '/analytics') return routeLoaders.analytics;

  if (path === '/world' || path.startsWith('/world/')) return routeLoaders.world;
  if (path === '/miia' || path.startsWith('/miia/')) return routeLoaders.miia;
  if (path === '/math' || path.startsWith('/math/')) return routeLoaders.math;
  if (path === '/playground' || path.startsWith('/playground/')) return routeLoaders.playground;
  if (path === '/api' || path.startsWith('/api/')) return routeLoaders.api;
  if (path === '/settings' || path.startsWith('/settings/')) return routeLoaders.aiSettings;

  if (path === '/characters') return routeLoaders.characters;
  if (path.startsWith('/characters/')) {
    const id = path.slice('/characters/'.length).split('/')[0];
    return isKnownCharacterFilter(id) ? routeLoaders.characters : routeLoaders.characterDetail;
  }

  if (path === '/stories') return routeLoaders.stories;
  if (path.startsWith('/stories/')) return routeLoaders.storyReader;

  if (path === '/chat' || path === '/chat/legacy') return routeLoaders.chatSelect;
  if (path === '/chat/ocean') return routeLoaders.oceanChat;
  if (path === '/chat/sweetdream') return routeLoaders.sweetDreamChat;
  if (path === '/chat/aurora') return routeLoaders.auroraChat;

  return null;
}

export function getRouteHierarchy(pathname: string): string[] {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return ['/'];

  const segments = normalized.split('/').filter(Boolean);
  const hierarchy: string[] = [];
  for (let length = segments.length; length >= 1; length -= 1) {
    hierarchy.push(`/${segments.slice(0, length).join('/')}`);
  }
  return hierarchy;
}

export function preloadRoute(pathname: string): Promise<unknown> {
  const loader = getRouteLoader(pathname);
  return loader ? loader() : Promise.resolve();
}

function canIdlePreload(): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;

  return !connection?.saveData && connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g';
}

function scheduleIdle(callback: () => void): () => void {
  const idleWindow = window as typeof window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 2_500 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 600);
  return () => window.clearTimeout(handle);
}

/**
 * Starts the current route immediately, then warms each distinct parent route
 * in its own idle period. Optional tail tasks run last.
 * `/a/b/c` therefore has the priority `/a/b/c -> /a/b -> /a`.
 */
export function scheduleRouteHierarchyPreload(
  pathname: string,
  tailTasks: PreloadTask[] = [],
): () => void {
  const seen = new Set<PageLoader>();
  const routeTasks = getRouteHierarchy(pathname)
    .map(getRouteLoader)
    .filter((loader): loader is PageLoader => Boolean(loader))
    .filter((loader) => {
      if (seen.has(loader)) return false;
      seen.add(loader);
      return true;
    });

  let cancelled = false;
  let cancelScheduledIdle: (() => void) | undefined;
  const idleTasks = canIdlePreload() ? [...routeTasks.slice(1), ...tailTasks] : [];

  const runIdleTask = (index: number) => {
    if (cancelled || index >= idleTasks.length) return;
    cancelScheduledIdle = scheduleIdle(() => {
      if (cancelled) return;
      void idleTasks[index]().catch(() => {
        // Preloading is opportunistic; the normal on-demand path can retry.
      }).finally(() => runIdleTask(index + 1));
    });
  };

  if (routeTasks[0]) {
    void routeTasks[0]().catch(() => {
      // The route's Suspense/error boundary owns user-visible recovery.
    }).finally(() => runIdleTask(0));
  } else {
    runIdleTask(0);
  }

  return () => {
    cancelled = true;
    cancelScheduledIdle?.();
  };
}
