import type { RouteDomain } from '@/lib/routeManifest';
import { getCanonicalInfo, resolveAlias } from '@/lib/routeManifest';
import {
  listStorageEntries,
  readJsonStorage,
  readStorageValue,
  removeStorageValue,
  writeJsonStorage,
  writeStorageValue,
} from '@/lib/browserStorage';

export const ANALYTICS_STORAGE_KEY = 'neural-connection:site-analytics:v1';
export const ANALYTICS_DATA_EVENT = 'neural-connection:analytics-updated';
export const ANALYTICS_ARCHIVE_VERSION = 1 as const;

const MAX_VISITS = 800;
const MAX_SEARCHES = 300;

export const ANALYTICS_CATEGORIES = [
  '首页',
  '故事',
  '角色',
  '世界观',
  '咪呀',
  '数学',
  '游戏',
  'AI',
  'API',
  '其他',
] as const;

export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number];

export interface AnalyticsPage {
  path: string;
  label: string;
  category: AnalyticsCategory;
}

export interface AnalyticsVisit extends AnalyticsPage {
  id: string;
  sessionId: string;
  startedAt: number;
  durationMs: number;
}

export interface AnalyticsSearch {
  query: string;
  at: number;
  resultCount: number;
}

export interface AnalyticsData {
  schemaVersion: 1;
  createdAt: number;
  updatedAt: number;
  visits: AnalyticsVisit[];
  searches: AnalyticsSearch[];
}

export interface ActivePageView extends AnalyticsPage {
  startedAt: number;
  sessionId: string;
}

export interface SiteDataArchive {
  archiveVersion: typeof ANALYTICS_ARCHIVE_VERSION;
  product: 'Neural Connection';
  exportedAt: number;
  analytics: AnalyticsData;
  localStorage: Record<string, string>;
  excludedStorageKeys: string[];
}

const DOMAIN_CATEGORY: Partial<Record<RouteDomain, AnalyticsCategory>> = {
  root: '首页',
  stories: '故事',
  characters: '角色',
  world: '世界观',
  miia: '咪呀',
  math: '数学',
  playground: '游戏',
  chat: 'AI',
  settings: 'AI',
  api: 'API',
  codex: '其他',
};

let fallbackSessionId: string | null = null;

function getSessionId(): string {
  if (fallbackSessionId) return fallbackSessionId;

  const key = 'neural-connection:analytics-session';
  const existing = readStorageValue(key, 'session').value;
  if (existing) {
    fallbackSessionId = existing;
    return existing;
  }
  const next = createId('session');
  writeStorageValue(key, next, 'session');
  fallbackSessionId = next;
  return next;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyAnalytics(now = Date.now()): AnalyticsData {
  return {
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    visits: [],
    searches: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCategory(value: unknown): value is AnalyticsCategory {
  return typeof value === 'string' && (ANALYTICS_CATEGORIES as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isAnalyticsVisit(value: unknown): value is AnalyticsVisit {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.sessionId === 'string'
    && typeof value.path === 'string'
    && typeof value.label === 'string'
    && isCategory(value.category)
    && isFiniteNumber(value.startedAt)
    && isFiniteNumber(value.durationMs)
    && value.durationMs >= 0;
}

function isAnalyticsSearch(value: unknown): value is AnalyticsSearch {
  if (!isRecord(value)) return false;
  return typeof value.query === 'string'
    && isFiniteNumber(value.at)
    && isFiniteNumber(value.resultCount)
    && value.resultCount >= 0;
}

function isAnalyticsData(value: unknown): value is AnalyticsData {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1
    && isFiniteNumber(value.createdAt)
    && isFiniteNumber(value.updatedAt)
    && Array.isArray(value.visits)
    && value.visits.every(isAnalyticsVisit)
    && Array.isArray(value.searches)
    && value.searches.every(isAnalyticsSearch);
}

function emitAnalyticsUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ANALYTICS_DATA_EVENT));
  }
}

function writeAnalyticsData(data: AnalyticsData): boolean {
  const persisted = writeJsonStorage(ANALYTICS_STORAGE_KEY, data).persisted;
  emitAnalyticsUpdate();
  return persisted;
}

export function readAnalyticsData(): AnalyticsData {
  const parsed = readJsonStorage(ANALYTICS_STORAGE_KEY, createEmptyAnalytics(), {
    currentVersion: 1,
    migrations: {
      0: (value) => ({ ...(isRecord(value) ? value : {}), schemaVersion: 1 }),
    },
    validate: isAnalyticsData,
  }).value;
  return {
    ...parsed,
    visits: parsed.visits.slice(-MAX_VISITS),
    searches: parsed.searches.slice(-MAX_SEARCHES),
  };
}

/**
 * Returns the most recent unique searches for local discovery surfaces.
 * Search records remain in chronological order in the archive; this helper
 * presents them newest-first without changing the stored analytics shape.
 */
export function readSearchHistory(limit = 8): AnalyticsSearch[] {
  const maxResults = Math.max(1, Math.floor(limit));
  const seen = new Set<string>();
  const history: AnalyticsSearch[] = [];

  for (const entry of [...readAnalyticsData().searches].reverse()) {
    const key = entry.query.toLocaleLowerCase('zh-CN');
    if (seen.has(key)) continue;
    seen.add(key);
    history.push(entry);
    if (history.length >= maxResults) break;
  }

  return history;
}

export function getAnalyticsPage(pathname: string): AnalyticsPage {
  const pathWithoutQuery = pathname.split(/[?#]/, 1)[0] || '/';
  const alias = resolveAlias(pathWithoutQuery);
  const path = alias ?? (pathWithoutQuery.replace(/\/+$/, '') || '/');
  const routeInfo = getCanonicalInfo(path);
  const category = routeInfo ? (DOMAIN_CATEGORY[routeInfo.domain] ?? '其他') : inferCategory(path);
  const lastSegment = path.split('/').filter(Boolean).at(-1);
  const fallbackLabel = lastSegment
    ? `${category} · ${decodeSegment(lastSegment)}`
    : category;

  return {
    path,
    label: routeInfo?.label ?? fallbackLabel,
    category,
  };
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment).replace(/[-_]+/g, ' ');
  } catch {
    return segment.replace(/[-_]+/g, ' ');
  }
}

function inferCategory(path: string): AnalyticsCategory {
  if (path === '/') return '首页';
  if (path === '/stories' || path.startsWith('/stories/')) return '故事';
  if (path === '/characters' || path.startsWith('/characters/')) return '角色';
  if (path === '/world' || path.startsWith('/world/')) return '世界观';
  if (path === '/miia' || path.startsWith('/miia/')) return '咪呀';
  if (path === '/math' || path.startsWith('/math/')) return '数学';
  if (path === '/playground' || path.startsWith('/playground/') || path === '/cat-mouse') return '游戏';
  if (path === '/chat' || path.startsWith('/chat/') || path === '/settings' || path.startsWith('/settings/')) return 'AI';
  if (path === '/api' || path.startsWith('/api/')) return 'API';
  return '其他';
}

export function startPageView(pathname: string): ActivePageView {
  return {
    ...getAnalyticsPage(pathname),
    startedAt: Date.now(),
    sessionId: getSessionId(),
  };
}

export function finishPageView(view: ActivePageView, endedAt = Date.now()): void {
  const durationMs = Math.max(0, endedAt - view.startedAt);
  const current = readAnalyticsData();
  const next: AnalyticsData = {
    ...current,
    updatedAt: endedAt,
    visits: [
      ...current.visits,
      {
        ...view,
        id: createId('visit'),
        durationMs,
      },
    ].slice(-MAX_VISITS),
  };
  writeAnalyticsData(next);
}

export function recordSearch(query: string, resultCount: number): void {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ').slice(0, 120);
  if (!normalizedQuery) return;
  const now = Date.now();
  const current = readAnalyticsData();
  const previous = current.searches.at(-1);
  if (previous?.query === normalizedQuery && now - previous.at < 1_000) return;

  writeAnalyticsData({
    ...current,
    updatedAt: now,
    searches: [
      ...current.searches,
      { query: normalizedQuery, at: now, resultCount: Math.max(0, Math.floor(resultCount)) },
    ].slice(-MAX_SEARCHES),
  });
}

export function clearAnalyticsData(): void {
  removeStorageValue(ANALYTICS_STORAGE_KEY);
  emitAnalyticsUpdate();
}

function isSensitiveStorageKey(key: string): boolean {
  return /(?:ai-config|api[-_:]?key|access[-_:]?token|refresh[-_:]?token|secret|password|credential)/i.test(key);
}

export function createDataArchive(): SiteDataArchive {
  const storageEntries: Record<string, string> = {};
  const excludedStorageKeys: string[] = [];
  const entries = listStorageEntries();
  for (const [key, value] of Object.entries(entries)) {
    if (key === ANALYTICS_STORAGE_KEY) continue;
    if (isSensitiveStorageKey(key)) {
      excludedStorageKeys.push(key);
      continue;
    }
    storageEntries[key] = value;
  }

  return {
    archiveVersion: ANALYTICS_ARCHIVE_VERSION,
    product: 'Neural Connection',
    exportedAt: Date.now(),
    analytics: readAnalyticsData(),
    localStorage: storageEntries,
    excludedStorageKeys,
  };
}

export function parseDataArchive(text: string): SiteDataArchive | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed) || parsed.archiveVersion !== ANALYTICS_ARCHIVE_VERSION || parsed.product !== 'Neural Connection') return null;
    if (!isAnalyticsData(parsed.analytics) || !isRecord(parsed.localStorage) || !Array.isArray(parsed.excludedStorageKeys)) return null;

    const localStorage: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.localStorage)) {
      if (typeof value === 'string' && !isSensitiveStorageKey(key) && key !== ANALYTICS_STORAGE_KEY) {
        localStorage[key] = value;
      }
    }

    return {
      archiveVersion: ANALYTICS_ARCHIVE_VERSION,
      product: 'Neural Connection',
      exportedAt: isFiniteNumber(parsed.exportedAt) ? parsed.exportedAt : Date.now(),
      analytics: {
        ...parsed.analytics,
        visits: parsed.analytics.visits.slice(-MAX_VISITS),
        searches: parsed.analytics.searches.slice(-MAX_SEARCHES),
      },
      localStorage,
      excludedStorageKeys: parsed.excludedStorageKeys.filter((key): key is string => typeof key === 'string'),
    };
  } catch {
    return null;
  }
}

export function restoreDataArchive(archive: SiteDataArchive): { restored: number; failed: number } {
  let restored = writeAnalyticsData(archive.analytics) ? 1 : 0;
  let failed = restored ? 0 : 1;
  for (const [key, value] of Object.entries(archive.localStorage)) {
    if (!isSensitiveStorageKey(key) && key !== ANALYTICS_STORAGE_KEY) {
      if (writeStorageValue(key, value).persisted) restored += 1;
      else failed += 1;
    }
  }
  emitAnalyticsUpdate();
  return { restored, failed };
}
