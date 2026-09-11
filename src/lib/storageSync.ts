import { listStorageEntries, readJsonStorage, writeJsonStorage } from './browserStorage';
import { idbGet, idbKeys, idbSet } from './idbStorage';

export const STORAGE_EXPORT_VERSION = 1;

export interface StorageExport {
  version: number;
  exportedAt: string;
  localStorage: Record<string, string>;
  indexedDb: Record<string, string>;
}

export type ConflictStrategy = 'last-write-wins' | 'keep-local';

/** Dump everything (localStorage + IndexedDB) to a portable JSON object. */
export async function exportAllStorage(): Promise<StorageExport> {
  const indexedDb: Record<string, string> = {};
  for (const key of await idbKeys()) {
    const value = await idbGet(key);
    if (value !== null) indexedDb[key] = value;
  }
  return {
    version: STORAGE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    localStorage: listStorageEntries('local'),
    indexedDb,
  };
}

export function serializeExport(data: StorageExport): string {
  return JSON.stringify(data);
}

/**
 * Import a previous export. Unknown/future versions throw so callers
 * never silently corrupt data. Conflicts resolve per strategy.
 */
export async function importAllStorage(
  raw: string,
  strategy: ConflictStrategy = 'last-write-wins',
): Promise<{ imported: number; skipped: number }> {
  let data: StorageExport;
  try {
    data = JSON.parse(raw) as StorageExport;
  } catch {
    throw new Error('invalid-storage-export');
  }
  if (!data || typeof data !== 'object' || data.version > STORAGE_EXPORT_VERSION) {
    throw new Error('unsupported-storage-version');
  }
  let imported = 0;
  let skipped = 0;
  for (const [key, value] of Object.entries(data.localStorage ?? {})) {
    const existing = readJsonStorage<unknown>(key, null);
    if (existing.status === 'ok' && strategy === 'keep-local') {
      skipped += 1;
      continue;
    }
    writeJsonStorage(key, tryParse(value) ?? value, 'local');
    imported += 1;
  }
  for (const [key, value] of Object.entries(data.indexedDb ?? {})) {
    const existing = await idbGet(key);
    if (existing !== null && strategy === 'keep-local') {
      skipped += 1;
      continue;
    }
    await idbSet(key, value);
    imported += 1;
  }
  return { imported, skipped };
}

function tryParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Run versioned migrations step-by-step; throws with context on failure. */
export function migrateVersioned<T>(
  value: unknown,
  from: number,
  to: number,
  migrations: Record<number, (v: unknown) => unknown>,
): T {
  let current = value;
  let version = from;
  while (version < to) {
    const fn = migrations[version];
    if (!fn) throw new Error(`missing-migration:${version}`);
    try {
      current = fn(current);
    } catch (error) {
      throw new Error(`migration-failed:${version}:${(error as Error).message}`);
    }
    version += 1;
  }
  return current as T;
}
