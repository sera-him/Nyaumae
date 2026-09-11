import { readJsonStorage, writeJsonStorage } from './browserStorage';
import { idbGet, idbSet } from './idbStorage';

// Local-first cloud-sync abstraction for comments / likes / reading progress.
// Today it persists locally (localStorage + IndexedDB mirror) and exposes a
// CloudAdapter seam; when a backend exists, implement push/pull without
// changing callers.
export interface CloudAdapter {
  push(key: string, value: unknown): Promise<void>;
  pull(key: string): Promise<unknown | null>;
}

let adapter: CloudAdapter | null = null;
export function setCloudAdapter(next: CloudAdapter | null): void {
  adapter = next;
}

async function writeBoth(key: string, value: unknown): Promise<void> {
  writeJsonStorage(key, value, 'local');
  try {
    await idbSet(key, JSON.stringify(value));
  } catch {
    /* local-only is fine */
  }
  if (adapter) {
    try {
      await adapter.push(key, value);
    } catch {
      /* offline: keep local copy */
    }
  }
}

async function readMerged<T>(key: string, fallback: T): Promise<T> {
  if (adapter) {
    try {
      const remote = await adapter.pull(key);
      if (remote !== null && remote !== undefined) {
        await writeBoth(key, remote as T);
        return remote as T;
      }
    } catch {
      /* fall through to local */
    }
  }
  const local = readJsonStorage<T>(key, fallback).value;
  if (local !== fallback) return local;
  try {
    const mirrored = await idbGet(key);
    if (mirrored !== null) return JSON.parse(mirrored) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

// --- Comments ---
const COMMENT_KEY = 'nc:comments:v1';
export type CommentMap = Record<string, Array<{ id: string; text: string; at: string }>>;
export const getComments = (): Promise<CommentMap> => readMerged(COMMENT_KEY, {});
export async function addComment(route: string, text: string): Promise<void> {
  const all = await getComments();
  const list = all[route] ?? [];
  list.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: text.slice(0, 500), at: new Date().toISOString() });
  await writeBoth(COMMENT_KEY, { ...all, [route]: list });
}

// --- Likes ---
const LIKE_KEY = 'nc:likes:v1';
export type LikeMap = Record<string, number>;
export const getLikes = (): Promise<LikeMap> => readMerged(LIKE_KEY, {});
export async function toggleLike(route: string): Promise<number> {
  const all = await getLikes();
  const next = (all[route] ?? 0) > 0 ? 0 : 1;
  await writeBoth(LIKE_KEY, { ...all, [route]: next });
  return next;
}

// --- Reading progress ---
const PROGRESS_KEY = 'nc:progress:v1';
export type ProgressMap = Record<string, number>;
export const getProgress = (): Promise<ProgressMap> => readMerged(PROGRESS_KEY, {});
export async function saveProgress(route: string, ratio: number): Promise<void> {
  const all = await getProgress();
  await writeBoth(PROGRESS_KEY, { ...all, [route]: Math.min(1, Math.max(0, ratio)) });
}
