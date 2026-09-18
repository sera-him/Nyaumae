import { Component, type ReactNode } from 'react';
import { L } from '@/lib/translations/manual';

import { Link, useLocation } from 'react-router';
import {
  attemptAsyncModuleRecovery,
  forceAsyncModuleReload,
  isAsyncModuleLoadError,
} from '@/lib/asyncModuleRecovery';

export type RouteArea = 'home' | 'stories' | 'characters' | 'world' | 'games' | 'chat' | 'settings' | 'other';

const AREA_LABELS: Record<RouteArea, string> = {
  home: '首页',
  stories: '故事区域',
  characters: '角色区域',
  world: '世界区域',
  games: '游戏区域',
  chat: '聊天区域',
  settings: '设置区域',
  other: '当前区域',
};

interface BoundaryProps {
  area: RouteArea;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

class AreaBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (isAsyncModuleLoadError(error)) attemptAsyncModuleRecovery();
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const asyncModuleError = isAsyncModuleLoadError(error);
    const label = AREA_LABELS[this.props.area];

    return (
      <section className="min-h-[55vh] flex items-center justify-center px-5 py-16" role="alert" aria-live="assertive">
        <div className="w-full max-w-xl rounded-2xl border border-red-300/20 bg-nc-bg-secondary p-7 text-center shadow-2xl shadow-black/20">
          <p className="mb-3 text-xs font-mono tracking-[0.18em] text-nc-violet">LOCAL RECOVERY</p>
          <h1 className="mb-3 text-2xl font-semibold text-nc-text">
            {asyncModuleError ? `${label}资源版本不一致` : `${label}暂时无法显示`}
          </h1>
          <p className="mb-6 text-sm leading-7 text-nc-text-muted">
            {asyncModuleError
              ? '当前网址已保留。自动恢复只会尝试一次，你也可以手动重新载入这个页面。'
              : '故障已限制在这个区域，站内导航、其他故事、游戏和设置仍可继续使用。'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {!asyncModuleError && (
              <button type="button" onClick={this.retry} className="rounded-xl bg-nc-violet px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
                {L("原地重试\n              ")}</button>
            )}
            <button type="button" onClick={forceAsyncModuleReload} className="rounded-xl border border-nc-violet/30 px-5 py-2.5 text-sm text-nc-text hover:bg-nc-violet/10">
              {L("重新载入当前网址\n            ")}</button>
            <Link to="/" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-nc-text-muted hover:text-nc-text">
              {L("返回首页\n            ")}</Link>
          </div>
        </div>
      </section>
    );
  }
}

export default function RouteErrorBoundary({ area, children }: BoundaryProps) {
  const location = useLocation();
  return (
    <AreaBoundary area={area} key={`${area}:${location.pathname}:${location.search}`}>
      {children}
    </AreaBoundary>
  );
}
