// Minimal IndexedDB key-value adapter with memory fallback.
// Keeps the existing browserStorage.ts (localStorage) API intact;
// use this for larger payloads and cross-session durability.
const DB_NAME = 'neural-connection';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

const mem = new Map<string, string>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function supported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      if (!supported()) {
        resolve(null);
        return;
      }
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE_NAME)) {
            req.result.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then((db) => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
      try {
        const t = db.transaction(STORE_NAME, mode);
        const store = t.objectStore(STORE_NAME);
        const req = run(store);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  });
}

export async function idbGet(key: string): Promise<string | null> {
  const hit = await tx('readonly', (s) => s.get(key));
  if (typeof hit === 'string') return hit;
  return mem.get(key) ?? null;
}

export async function idbSet(key: string, value: string): Promise<boolean> {
  mem.set(key, value);
  const db = await openDb();
  if (!db) return false;
  const ok = await tx('readwrite', (s) => s.put(value, key));
  return ok !== null;
}

export async function idbRemove(key: string): Promise<void> {
  mem.delete(key);
  await tx('readwrite', (s) => s.delete(key));
}

export async function idbKeys(): Promise<string[]> {
  const keys = await tx('readonly', (s) => s.getAllKeys());
  const fromDb = Array.isArray(keys) ? keys.filter((k): k is string => typeof k === 'string') : [];
  return Array.from(new Set([...fromDb, ...mem.keys()]));
}
