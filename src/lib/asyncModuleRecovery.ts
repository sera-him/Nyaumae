import { readStorageValue, removeStorageValue, writeStorageValue } from '@/lib/browserStorage';

const RECOVERY_KEY = 'aurora:async-module-recovery';
const MAX_AUTO_RELOADS = 1;
const ASYNC_MODULE_ERROR = /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk|load failed/i;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error ?? '');
}

export function isAsyncModuleLoadError(error: unknown): boolean {
  return ASYNC_MODULE_ERROR.test(errorMessage(error));
}

function recoveryToken(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function attemptAsyncModuleRecovery(): boolean {
  const token = recoveryToken();
  const stored = readStorageValue(RECOVERY_KEY, 'session');
  let attempts = 0;
  if (stored.value) {
    try {
      const marker = JSON.parse(stored.value) as { token?: unknown; attempts?: unknown };
      if (marker.token === token && typeof marker.attempts === 'number') attempts = marker.attempts;
    } catch {
      // Older markers were the URL token itself and therefore count as one attempt.
      if (stored.value === token) attempts = 1;
    }
  }
  if (attempts >= MAX_AUTO_RELOADS) return false;

  const written = writeStorageValue(RECOVERY_KEY, JSON.stringify({ token, attempts: attempts + 1 }), 'session');
  // Never auto-reload if the limiter cannot survive the reload (for example in privacy mode).
  if (!written.persisted) return false;

  window.location.reload();
  return true;
}

export function clearAsyncModuleRecoveryMarker(): void {
  const stored = readStorageValue(RECOVERY_KEY, 'session').value;
  if (!stored) return;
  try {
    const marker = JSON.parse(stored) as { token?: unknown };
    if (marker.token === recoveryToken()) removeStorageValue(RECOVERY_KEY, 'session');
  } catch {
    if (stored === recoveryToken()) removeStorageValue(RECOVERY_KEY, 'session');
  }
}

export function forceAsyncModuleReload(): void {
  removeStorageValue(RECOVERY_KEY, 'session');
  window.location.reload();
}

export function installAsyncModuleRecovery(): () => void {
  const onPreloadError = (event: Event) => {
    if (attemptAsyncModuleRecovery()) event.preventDefault();
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (!isAsyncModuleLoadError(event.reason)) return;
    if (attemptAsyncModuleRecovery()) event.preventDefault();
  };

  window.addEventListener('vite:preloadError', onPreloadError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('vite:preloadError', onPreloadError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
