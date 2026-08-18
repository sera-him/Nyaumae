import { useEffect, useRef, useState } from 'react';
import { CloudOff, DatabaseZap, RefreshCw, Wifi } from 'lucide-react';
import {
  BROWSER_STORAGE_ISSUE_EVENT,
  getLatestBrowserStorageIssue,
  type BrowserStorageIssue,
} from '@/lib/browserStorage';

type NetworkNotice = 'offline' | 'restored' | null;

export default function ResilienceNotices() {
  const [networkNotice, setNetworkNotice] = useState<NetworkNotice>(() => (
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : null
  ));
  const [storageIssue, setStorageIssue] = useState<BrowserStorageIssue | null>(() => getLatestBrowserStorageIssue());
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const reloadForUpdateRef = useRef(false);

  useEffect(() => {
    let restoreTimer = 0;
    const onOffline = () => {
      window.clearTimeout(restoreTimer);
      setNetworkNotice('offline');
    };
    const onOnline = () => {
      setNetworkNotice('restored');
      restoreTimer = window.setTimeout(() => setNetworkNotice(null), 5_000);
    };
    const onStorageIssue = (event: Event) => {
      setStorageIssue((event as CustomEvent<BrowserStorageIssue>).detail);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener(BROWSER_STORAGE_ISSUE_EVENT, onStorageIssue);
    return () => {
      window.clearTimeout(restoreTimer);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener(BROWSER_STORAGE_ISSUE_EVENT, onStorageIssue);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return undefined;
    let active = true;
    let registration: ServiceWorkerRegistration | null = null;

    const watchInstalling = (worker: ServiceWorker) => {
      worker.addEventListener('statechange', () => {
        if (active && worker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
        }
      });
    };
    const onControllerChange = () => {
      if (!reloadForUpdateRef.current) return;
      reloadForUpdateRef.current = false;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((nextRegistration) => {
      if (!active) return;
      registration = nextRegistration;
      if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
      if (registration.installing) watchInstalling(registration.installing);
      registration.addEventListener('updatefound', () => {
        if (registration?.installing) watchInstalling(registration.installing);
      });
      void registration.update().catch(() => undefined);
    }).catch(() => undefined);

    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const applyUpdate = () => {
    if (!waitingWorker) return;
    reloadForUpdateRef.current = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!networkNotice && !storageIssue && !waitingWorker) return null;

  return (
    <aside className="pointer-events-none fixed inset-x-3 bottom-3 z-[160] mx-auto flex max-w-xl flex-col gap-2" aria-label="站点状态提示">
      {networkNotice && (
        <div className={`aurora-notice aurora-notice--${networkNotice} pointer-events-auto`} role="status" aria-live="polite">
          {networkNotice === 'offline' ? <CloudOff className="mt-0.5 h-5 w-5 text-amber-300" /> : <Wifi className="mt-0.5 h-5 w-5 text-emerald-300" />}
          <div className="min-w-0 flex-1">
            <strong>{networkNotice === 'offline' ? '当前处于离线状态' : '网络已恢复'}</strong>
            <p className="mt-1 text-xs leading-5 text-nc-text-muted">
              {networkNotice === 'offline' ? '已打开的内容仍可继续浏览；图片、第三方游戏和模型请求需要联网后重试。' : '现在可以重试刚才失败的图片、游戏或聊天请求。'}
            </p>
          </div>
        </div>
      )}
      {waitingWorker && (
        <div className="aurora-notice aurora-notice--info pointer-events-auto" role="status" aria-live="polite">
          <RefreshCw className="mt-0.5 h-5 w-5 text-nc-violet" />
          <div className="min-w-0 flex-1"><strong>发现新版本</strong><p className="mt-1 text-xs text-nc-text-muted">刷新后仍会回到当前网址。</p></div>
          <button type="button" onClick={applyUpdate} className="aurora-button aurora-button-primary">刷新更新</button>
        </div>
      )}
      {storageIssue && (
        <div className="aurora-notice aurora-notice--warning pointer-events-auto" role="alert">
          <DatabaseZap className="mt-0.5 h-5 w-5 text-amber-300" />
          <div className="min-w-0 flex-1"><strong>本机存档需要注意</strong><p className="mt-1 text-xs leading-5 text-nc-text-muted">{storageIssue.message}</p></div>
          <button type="button" onClick={() => setStorageIssue(null)} className="aurora-button">知道了</button>
        </div>
      )}
    </aside>
  );
}
