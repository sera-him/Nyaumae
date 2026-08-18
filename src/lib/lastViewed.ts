import { getCanonicalInfo, resolveAlias } from '@/lib/routeManifest';
import { readJsonStorage, writeJsonStorage } from '@/lib/browserStorage';

export const LAST_VIEWED_STORAGE_KEY = 'neural-connection:last-viewed';
export const LAST_VIEWED_HISTORY_STORAGE_KEY = 'neural-connection:last-viewed:history';
export const LAST_VIEWED_DATA_EVENT = 'neural-connection:last-viewed-updated';

export type LastViewedDomain = 'world' | 'stories' | 'characters';

export interface LastViewedEntry {
  path: string;
  label: string;
  domain: LastViewedDomain;
  viewedAt: number;
}

const MAX_LAST_VIEWED = 8;

function isLastViewedDomain(value: unknown): value is LastViewedDomain {
  return value === 'world' || value === 'stories' || value === 'characters';
}

function parseLastViewed(value: unknown): LastViewedEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const entry = value as Partial<LastViewedEntry>;
  if (typeof entry.path !== 'string' || typeof entry.label !== 'string' || !isLastViewedDomain(entry.domain)) {
    return null;
  }

  return {
    path: entry.path,
    label: entry.label,
    domain: entry.domain,
    viewedAt: typeof entry.viewedAt === 'number' ? entry.viewedAt : 0,
  };
}

function uniqueHistory(entries: LastViewedEntry[], limit: number): LastViewedEntry[] {
  const seen = new Set<string>();
  return entries
    .filter((entry) => {
      if (seen.has(entry.path)) return false;
      seen.add(entry.path);
      return true;
    })
    .slice(0, Math.max(1, Math.floor(limit)));
}

export function readLastViewed(): LastViewedEntry | null {
  try {
    const history = readJsonStorage<unknown>(LAST_VIEWED_HISTORY_STORAGE_KEY, null).value;
    if (Array.isArray(history)) {
      const latest = uniqueHistory(history.map(parseLastViewed).filter((entry): entry is LastViewedEntry => Boolean(entry)), 1)[0];
      if (latest) return latest;
    }

    return parseLastViewed(readJsonStorage<unknown>(LAST_VIEWED_STORAGE_KEY, null).value);
  } catch {
    return null;
  }
}

export function readLastViewedHistory(limit = 6): LastViewedEntry[] {
  try {
    const history = readJsonStorage<unknown>(LAST_VIEWED_HISTORY_STORAGE_KEY, null).value;
    if (Array.isArray(history)) {
      const parsed = history.map(parseLastViewed).filter((entry): entry is LastViewedEntry => Boolean(entry));
      if (parsed.length > 0) return uniqueHistory(parsed, limit);
    }

    const latest = parseLastViewed(readJsonStorage<unknown>(LAST_VIEWED_STORAGE_KEY, null).value);
    return latest ? [latest] : [];
  } catch {
    return [];
  }
}

function getDomain(pathname: string): LastViewedDomain | null {
  if (pathname === '/world' || pathname.startsWith('/world/')) return 'world';
  if (pathname === '/stories' || pathname.startsWith('/stories/')) return 'stories';
  if (pathname === '/characters' || pathname.startsWith('/characters/')) return 'characters';
  return null;
}

export function recordLastViewed(pathname: string): void {
  const canonicalPath = resolveAlias(pathname) ?? pathname;
  const domain = getDomain(canonicalPath);
  if (!domain) return;

  const routeInfo = getCanonicalInfo(canonicalPath);
  const fallbackLabels: Record<LastViewedDomain, string> = {
    world: '世界观',
    stories: '故事',
    characters: '角色',
  };
  const entry: LastViewedEntry = {
    path: canonicalPath,
    label: routeInfo?.label ?? fallbackLabels[domain],
    domain,
    viewedAt: Date.now(),
  };
  const history = uniqueHistory(
    [entry, ...readLastViewedHistory(MAX_LAST_VIEWED)].filter((candidate, index, all) => (
      all.findIndex((value) => value.path === candidate.path) === index
    )),
    MAX_LAST_VIEWED,
  );

  writeJsonStorage(LAST_VIEWED_STORAGE_KEY, entry);
  writeJsonStorage(LAST_VIEWED_HISTORY_STORAGE_KEY, history);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LAST_VIEWED_DATA_EVENT));
}
