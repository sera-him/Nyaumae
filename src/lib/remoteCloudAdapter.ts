import type { CloudAdapter } from './cloudSync';

// Remote CloudAdapter that talks to the sync worker (cloud/sync-worker).
// Payloads are encrypted client-side with AES-GCM keyed from the sync key
// (PBKDF2), so the server only ever stores ciphertext. The sync key itself
// never leaves the device except as a bearer credential over HTTPS, and the
// worker namespaces data by its SHA-256 hash.

export interface RemoteSyncEnvelope<T = unknown> {
  v: 1;
  updatedAt: string;
  payload: T;
}

export interface RemoteCloudAdapterOptions {
  baseUrl: string;
  syncKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const PBKDF2_ITERATIONS = 150_000;
const KEY_SALT = 'nyaumae-sync-v1';

function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function bytesFromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveAesKey(syncKey: string): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('当前环境不支持 WebCrypto，无法启用加密同步。');
  const material = await subtle.importKey('raw', new TextEncoder().encode(syncKey), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode(KEY_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptEnvelope<T>(syncKey: string, envelope: RemoteSyncEnvelope<T>): Promise<string> {
  const key = await deriveAesKey(syncKey);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(envelope));
  const cipher = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return base64FromBytes(packed);
}

export async function decryptEnvelope<T>(syncKey: string, blob: string): Promise<RemoteSyncEnvelope<T>> {
  const key = await deriveAesKey(syncKey);
  const packed = bytesFromBase64(blob);
  const iv = packed.slice(0, 12);
  const cipher = packed.slice(12);
  const plain = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  const parsed = JSON.parse(new TextDecoder().decode(plain)) as RemoteSyncEnvelope<T>;
  if (parsed?.v !== 1 || typeof parsed.updatedAt !== 'string') throw new Error('同步数据格式无效。');
  return parsed;
}

export function createRemoteCloudAdapter(options: RemoteCloudAdapterOptions): CloudAdapter {
  const base = options.baseUrl.trim().replace(/\/+$/, '');
  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (!base || !options.syncKey.trim()) throw new Error('同步地址或同步密钥为空。');

  async function request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
    try {
      const response = await doFetch(`${base}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.syncKey}`,
          ...(init.headers ?? {}),
        },
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`同步服务返回 ${response.status}`);
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async push(key, value) {
      const envelope: RemoteSyncEnvelope = { v: 1, updatedAt: new Date().toISOString(), payload: value };
      const blob = await encryptEnvelope(options.syncKey, envelope);
      await request(`/sync/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ blob }) });
    },
    async pull(key) {
      const response = await request(`/sync/${encodeURIComponent(key)}`, { method: 'GET' });
      if (response.status === 404) return null;
      const body = (await response.json()) as { blob?: unknown };
      if (typeof body?.blob !== 'string') return null;
      const envelope = await decryptEnvelope(options.syncKey, body.blob);
      return envelope.payload ?? null;
    },
  };
}

/** Pull with its timestamp so callers can do last-write-wins checks. */
export async function pullEnvelope<T>(options: RemoteCloudAdapterOptions, key: string): Promise<RemoteSyncEnvelope<T> | null> {
  const base = options.baseUrl.trim().replace(/\/+$/, '');
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), options.timeoutMs ?? 15_000);
  try {
    const response = await doFetch(`${base}/sync/${encodeURIComponent(key)}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.syncKey}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`同步服务返回 ${response.status}`);
    const body = (await response.json()) as { blob?: unknown };
    if (typeof body?.blob !== 'string') return null;
    return await decryptEnvelope<T>(options.syncKey, body.blob);
  } finally {
    clearTimeout(timer);
  }
}

export async function pushEnvelope<T>(options: RemoteCloudAdapterOptions, key: string, envelope: RemoteSyncEnvelope<T>): Promise<void> {
  const base = options.baseUrl.trim().replace(/\/+$/, '');
  const doFetch = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), options.timeoutMs ?? 15_000);
  try {
    const blob = await encryptEnvelope(options.syncKey, envelope);
    const response = await doFetch(`${base}/sync/${encodeURIComponent(key)}`, {
      method: 'PUT',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.syncKey}` },
      body: JSON.stringify({ blob }),
    });
    if (!response.ok) throw new Error(`同步服务返回 ${response.status}`);
  } finally {
    clearTimeout(timer);
  }
}
