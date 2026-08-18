export const BROWSER_STORAGE_ISSUE_EVENT = 'neural-connection:storage-issue';

export type BrowserStorageArea = 'local' | 'session';
export type BrowserStorageIssueCode =
  | 'unavailable'
  | 'quota-exceeded'
  | 'corrupt-data'
  | 'migration-failed'
  | 'unsupported-version';

export interface BrowserStorageIssue {
  area: BrowserStorageArea;
  code: BrowserStorageIssueCode;
  key: string;
  message: string;
}

export interface StorageWriteResult {
  ok: boolean;
  persisted: boolean;
  issue?: BrowserStorageIssue;
}

export interface StorageReadResult<T> {
  value: T;
  status: 'ok' | 'missing' | 'memory-fallback' | 'corrupt' | 'migrated';
  issue?: BrowserStorageIssue;
}

interface JsonStorageOptions<T> {
  area?: BrowserStorageArea;
  validate?: (value: unknown) => value is T;
  currentVersion?: number;
  getVersion?: (value: unknown) => number;
  migrations?: Record<number, (value: unknown) => unknown>;
}

const memoryFallback: Record<BrowserStorageArea, Map<string, string>> = {
  local: new Map(),
  session: new Map(),
};
const emittedIssues = new Set<string>();
let latestIssue: BrowserStorageIssue | null = null;

function issueMessage(code: BrowserStorageIssueCode): string {
  switch (code) {
    case 'quota-exceeded': return '浏览器存储空间不足，最新更改只保留在当前页面。';
    case 'corrupt-data': return '检测到损坏的本机数据，已跳过该项并使用安全默认值。';
    case 'migration-failed': return '旧版本机数据无法迁移，已保留原数据并使用安全默认值。';
    case 'unsupported-version': return '这份本机数据来自更新版本，当前页面不会覆盖它。';
    default: return '浏览器阻止了本机存储，当前更改只在本次打开期间有效。';
  }
}

function createIssue(area: BrowserStorageArea, code: BrowserStorageIssueCode, key: string): BrowserStorageIssue {
  return { area, code, key, message: issueMessage(code) };
}

function emitIssue(issue: BrowserStorageIssue): void {
  latestIssue = issue;
  if (typeof window === 'undefined') return;
  const token = `${issue.area}:${issue.code}:${issue.key}`;
  if (emittedIssues.has(token)) return;
  emittedIssues.add(token);
  window.dispatchEvent(new CustomEvent<BrowserStorageIssue>(BROWSER_STORAGE_ISSUE_EVENT, { detail: issue }));
}

export function getLatestBrowserStorageIssue(): BrowserStorageIssue | null {
  return latestIssue;
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (
    error.name === 'QuotaExceededError'
    || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error.code === 22
    || error.code === 1014
  );
}

function nativeStorage(area: BrowserStorageArea): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = area === 'local' ? window.localStorage : window.sessionStorage;
    // Accessing Storage can succeed while every operation is blocked in privacy mode.
    void storage.length;
    return storage;
  } catch {
    return null;
  }
}

export function readStorageValue(key: string, area: BrowserStorageArea = 'local'): StorageReadResult<string | null> {
  if (typeof window === 'undefined') return { value: null, status: 'missing' };
  const storage = nativeStorage(area);
  if (!storage) {
    const issue = createIssue(area, 'unavailable', key);
    emitIssue(issue);
    return {
      value: memoryFallback[area].get(key) ?? null,
      status: memoryFallback[area].has(key) ? 'memory-fallback' : 'missing',
      issue,
    };
  }

  try {
    const value = storage.getItem(key);
    if (value === null && memoryFallback[area].has(key)) {
      return { value: memoryFallback[area].get(key) ?? null, status: 'memory-fallback' };
    }
    return { value, status: value === null ? 'missing' : 'ok' };
  } catch {
    const issue = createIssue(area, 'unavailable', key);
    emitIssue(issue);
    return {
      value: memoryFallback[area].get(key) ?? null,
      status: memoryFallback[area].has(key) ? 'memory-fallback' : 'missing',
      issue,
    };
  }
}

export function writeStorageValue(
  key: string,
  value: string,
  area: BrowserStorageArea = 'local',
): StorageWriteResult {
  if (typeof window === 'undefined') return { ok: true, persisted: false };
  memoryFallback[area].set(key, value);
  const storage = nativeStorage(area);
  if (!storage) {
    const issue = createIssue(area, 'unavailable', key);
    emitIssue(issue);
    return { ok: true, persisted: false, issue };
  }

  try {
    storage.setItem(key, value);
    return { ok: true, persisted: true };
  } catch (error) {
    const issue = createIssue(area, isQuotaError(error) ? 'quota-exceeded' : 'unavailable', key);
    emitIssue(issue);
    return { ok: true, persisted: false, issue };
  }
}

export function removeStorageValue(key: string, area: BrowserStorageArea = 'local'): StorageWriteResult {
  if (typeof window === 'undefined') return { ok: true, persisted: false };
  memoryFallback[area].delete(key);
  const storage = nativeStorage(area);
  if (!storage) {
    const issue = createIssue(area, 'unavailable', key);
    emitIssue(issue);
    return { ok: true, persisted: false, issue };
  }

  try {
    storage.removeItem(key);
    return { ok: true, persisted: true };
  } catch {
    const issue = createIssue(area, 'unavailable', key);
    emitIssue(issue);
    return { ok: true, persisted: false, issue };
  }
}

export function readJsonStorage<T>(
  key: string,
  fallback: T,
  options: JsonStorageOptions<T> = {},
): StorageReadResult<T> {
  const area = options.area ?? 'local';
  const rawResult = readStorageValue(key, area);
  if (rawResult.value === null) return { value: fallback, status: 'missing', issue: rawResult.issue };

  let value: unknown;
  try {
    value = JSON.parse(rawResult.value);
  } catch {
    const issue = createIssue(area, 'corrupt-data', key);
    emitIssue(issue);
    return { value: fallback, status: 'corrupt', issue };
  }

  let migrated = false;
  if (options.currentVersion !== undefined) {
    const getVersion = options.getVersion ?? ((candidate: unknown) => {
      if (!candidate || typeof candidate !== 'object' || !('schemaVersion' in candidate)) return 0;
      const version = (candidate as { schemaVersion?: unknown }).schemaVersion;
      return typeof version === 'number' && Number.isInteger(version) ? version : 0;
    });
    let version = getVersion(value);

    if (version > options.currentVersion) {
      const issue = createIssue(area, 'unsupported-version', key);
      emitIssue(issue);
      return { value: fallback, status: 'corrupt', issue };
    }

    try {
      while (version < options.currentVersion) {
        const migration = options.migrations?.[version];
        if (!migration) throw new Error(`Missing storage migration ${version}`);
        value = migration(value);
        version += 1;
        migrated = true;
      }
    } catch {
      const issue = createIssue(area, 'migration-failed', key);
      emitIssue(issue);
      return { value: fallback, status: 'corrupt', issue };
    }
  }

  if (options.validate && !options.validate(value)) {
    const issue = createIssue(area, 'corrupt-data', key);
    emitIssue(issue);
    return { value: fallback, status: 'corrupt', issue };
  }

  if (migrated) {
    const writeResult = writeJsonStorage(key, value as T, area);
    return { value: value as T, status: 'migrated', issue: writeResult.issue };
  }

  return {
    value: value as T,
    status: rawResult.status === 'memory-fallback' ? 'memory-fallback' : 'ok',
    issue: rawResult.issue,
  };
}

export function writeJsonStorage<T>(
  key: string,
  value: T,
  area: BrowserStorageArea = 'local',
): StorageWriteResult {
  try {
    return writeStorageValue(key, JSON.stringify(value), area);
  } catch {
    const issue = createIssue(area, 'corrupt-data', key);
    emitIssue(issue);
    return { ok: false, persisted: false, issue };
  }
}

export function listStorageEntries(area: BrowserStorageArea = 'local'): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const entries = Object.fromEntries(memoryFallback[area]);
  const storage = nativeStorage(area);
  if (!storage) {
    const issue = createIssue(area, 'unavailable', '*');
    emitIssue(issue);
    return entries;
  }

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      const value = storage.getItem(key);
      if (value !== null) entries[key] = value;
    }
  } catch {
    const issue = createIssue(area, 'unavailable', '*');
    emitIssue(issue);
  }
  return entries;
}
