import { conversationRepository, type ConversationState } from './storage.ts';
import { exportSafeAiConfig, sanitizeImportedConfig } from './privacy.ts';
import type { AiConfigExport } from './types.ts';
import { setCloudAdapter } from '../lib/cloudSync.ts';
import {
  createRemoteCloudAdapter,
  pullEnvelope,
  pushEnvelope,
  type RemoteCloudAdapterOptions,
} from '../lib/remoteCloudAdapter.ts';
import { readJsonStorage, removeStorageValue, writeJsonStorage } from '../lib/browserStorage.ts';

// Server-side persistence for conversations and AI config. The sync key and
// all payloads follow the same rule as BYOK keys: secrets never leave the
// device — AI config syncs via exportSafeAiConfig (no apiKey), and every
// payload is AES-GCM encrypted client-side before upload.

export interface SyncConfig {
  enabled: boolean;
  baseUrl: string;
  syncKey?: string;
  updatedAt: string;
}

export type SyncStatus =
  | { state: 'disabled' }
  | { state: 'idle'; lastSyncAt?: string }
  | { state: 'syncing' }
  | { state: 'error'; message: string };

const SYNC_CONFIG_KEY = 'nyaumae:sync-config:v1';
const STATE_SYNC_KEY = 'conversation-state';
const AI_CONFIG_SYNC_KEY = 'ai-config';
const PUSH_DEBOUNCE_MS = 2_500;

const DEFAULT_SYNC_CONFIG: SyncConfig = { enabled: false, baseUrl: '', updatedAt: new Date(0).toISOString() };

export function getSyncConfig(): SyncConfig {
  const stored = readJsonStorage<Partial<SyncConfig>>(SYNC_CONFIG_KEY, {}).value;
  return { ...DEFAULT_SYNC_CONFIG, ...stored };
}

export function saveSyncConfig(config: SyncConfig): SyncConfig {
  const next = { ...config, updatedAt: new Date().toISOString() };
  writeJsonStorage(SYNC_CONFIG_KEY, next);
  return next;
}

export function clearSyncConfig(): void {
  removeStorageValue(SYNC_CONFIG_KEY);
}

let status: SyncStatus = { state: 'disabled' };
const statusListeners = new Set<(next: SyncStatus) => void>();

function setStatus(next: SyncStatus): void {
  status = next;
  for (const listener of statusListeners) {
    try {
      listener(next);
    } catch {
      /* UI listener failures must not break sync */
    }
  }
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: (next: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function optionsFromConfig(config: SyncConfig): RemoteCloudAdapterOptions | null {
  if (!config.enabled || !config.baseUrl.trim() || !config.syncKey?.trim()) return null;
  return { baseUrl: config.baseUrl, syncKey: config.syncKey };
}

let initialized = false;
let applyingRemote = false;
let pushTimer: number | undefined;
let inFlight: Promise<void> | null = null;
let dirtyWhileInFlight = false;

async function pullFromServer(options: RemoteCloudAdapterOptions): Promise<void> {
  applyingRemote = true;
  try {
    const remoteState = await pullEnvelope<ConversationState>(options, STATE_SYNC_KEY);
    if (remoteState && remoteState.updatedAt > conversationRepository.getStateUpdatedAt()) {
      conversationRepository.replaceStateFromSync(remoteState.payload);
    }
    const remoteConfig = await pullEnvelope<AiConfigExport>(options, AI_CONFIG_SYNC_KEY);
    if (remoteConfig && remoteConfig.updatedAt > conversationRepository.getAiConfig().updatedAt) {
      const merged = sanitizeImportedConfig(remoteConfig.payload, conversationRepository.getAiConfig());
      conversationRepository.saveAiConfig(merged);
    }
  } finally {
    applyingRemote = false;
  }
}

async function pushToServer(options: RemoteCloudAdapterOptions): Promise<void> {
  const snapshot = conversationRepository.getStateSnapshot();
  await pushEnvelope(options, STATE_SYNC_KEY, { v: 1, updatedAt: snapshot.updatedAt, payload: snapshot });
  const config = conversationRepository.getAiConfig();
  await pushEnvelope(options, AI_CONFIG_SYNC_KEY, { v: 1, updatedAt: config.updatedAt, payload: exportSafeAiConfig(config) });
}

async function runSync(options: RemoteCloudAdapterOptions, pullFirst: boolean): Promise<void> {
  if (inFlight) {
    dirtyWhileInFlight = true;
    return inFlight;
  }
  setStatus({ state: 'syncing' });
  inFlight = (async () => {
    try {
      if (pullFirst) await pullFromServer(options);
      await pushToServer(options);
      setStatus({ state: 'idle', lastSyncAt: new Date().toISOString() });
    } catch (error) {
      setStatus({ state: 'error', message: error instanceof Error ? error.message : '同步失败。' });
    } finally {
      inFlight = null;
      if (dirtyWhileInFlight) {
        dirtyWhileInFlight = false;
        schedulePush();
      }
    }
  })();
  return inFlight;
}

function schedulePush(): void {
  if (applyingRemote) return;
  const options = optionsFromConfig(getSyncConfig());
  if (!options) return;
  if (pushTimer !== undefined) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = undefined;
    void runSync(options, false);
  }, PUSH_DEBOUNCE_MS) as unknown as number;
}

/**
 * Boot entry: enables the remote adapter (also upgrading comments / likes /
 * reading progress to cloud sync), pulls newer remote snapshots, then pushes
 * local changes debounced. Safe to call once at app start; no-op when sync is
 * disabled or the device is offline.
 */
export function initSyncBridge(): void {
  if (initialized) return;
  initialized = true;
  const config = getSyncConfig();
  const options = optionsFromConfig(config);
  if (!options) {
    setStatus({ state: 'disabled' });
    return;
  }
  setCloudAdapter(createRemoteCloudAdapter(options));
  conversationRepository.subscribe(() => schedulePush());
  conversationRepository.subscribeAiConfig(() => schedulePush());
  void runSync(options, true);
}

/** Re-initialise after the user changes sync settings. */
export function restartSyncBridge(): Promise<void> {
  const options = optionsFromConfig(getSyncConfig());
  if (!options) {
    setCloudAdapter(null);
    setStatus({ state: 'disabled' });
    return Promise.resolve();
  }
  setCloudAdapter(createRemoteCloudAdapter(options));
  if (!initialized) {
    initialized = true;
    conversationRepository.subscribe(() => schedulePush());
    conversationRepository.subscribeAiConfig(() => schedulePush());
  }
  return runSync(options, true);
}

/** Manual "sync now" from the settings page. */
export function syncNow(): Promise<void> {
  const options = optionsFromConfig(getSyncConfig());
  if (!options) {
    setStatus({ state: 'error', message: '请先填写同步地址和同步密钥。' });
    return Promise.resolve();
  }
  return runSync(options, true);
}
