import { Component, type ReactNode } from 'react';
import { L } from '@/lib/translations/manual';

import {
  attemptAsyncModuleRecovery,
  forceAsyncModuleReload,
  isAsyncModuleLoadError,
} from '@/lib/asyncModuleRecovery';
import PageState from '@/components/PageState';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (isAsyncModuleLoadError(error)) attemptAsyncModuleRecovery();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const asyncModuleError = isAsyncModuleLoadError(error);
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    return (
      <main className="aurora-ui min-h-screen px-3">
        <PageState
          kind={offline ? 'offline' : 'error'}
          eyebrow={asyncModuleError ? 'RESOURCE UPDATED' : undefined}
          title={offline ? '当前处于离线状态' : asyncModuleError ? '页面资源已更新' : '页面暂时无法显示'}
          description={offline
            ? '这个页面尚未缓存。恢复网络后重新加载，即可继续打开当前页面。'
            : asyncModuleError
              ? '浏览器仍保留着旧版本资源。重新加载后会继续打开当前页面。'
              : '发生了未预期的问题。你可以重新加载页面后再试。'}
          fullPage
          actions={(
            <button type="button" onClick={forceAsyncModuleReload} className="aurora-button aurora-button-primary">
              {L("重新加载\n            ")}</button>
          )}
        />
      </main>
    );
  }
}
