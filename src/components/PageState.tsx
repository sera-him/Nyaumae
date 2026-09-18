import type { ReactNode } from 'react';
import { L } from '@/lib/translations/manual';
import {
  CheckCircle2,
  CircleOff,
  CloudOff,
  LoaderCircle,
  LockKeyhole,
  TriangleAlert,
} from 'lucide-react';

export type PageStateKind = 'loading' | 'empty' | 'error' | 'offline' | 'success' | 'forbidden';

interface PageStateProps {
  kind: PageStateKind;
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  compact?: boolean;
  fullPage?: boolean;
  className?: string;
}

const stateDefaults: Record<PageStateKind, {
  title: string;
  description: string;
  eyebrow: string;
  Icon: typeof CheckCircle2;
}> = {
  loading: {
    title: '正在连接内容',
    description: '内容准备好后会自动显示，请稍候。',
    eyebrow: 'LOADING',
    Icon: LoaderCircle,
  },
  empty: {
    title: '这里暂时没有内容',
    description: '可以返回上一层，或换一个入口继续探索。',
    eyebrow: 'EMPTY',
    Icon: CircleOff,
  },
  error: {
    title: '内容暂时无法显示',
    description: '连接或资源发生了问题，请稍后重试。',
    eyebrow: 'FAILED',
    Icon: TriangleAlert,
  },
  offline: {
    title: '当前处于离线状态',
    description: '恢复网络后即可继续加载尚未缓存的内容。',
    eyebrow: 'OFFLINE',
    Icon: CloudOff,
  },
  success: {
    title: '操作已完成',
    description: '你的更改已经保存。',
    eyebrow: 'SUCCESS',
    Icon: CheckCircle2,
  },
  forbidden: {
    title: '没有访问权限',
    description: '当前账户无法查看或执行此操作。',
    eyebrow: 'NO ACCESS',
    Icon: LockKeyhole,
  },
};

export default function PageState({
  kind,
  title,
  description,
  eyebrow,
  actions,
  compact = false,
  fullPage = false,
  className = '',
}: PageStateProps) {
  const defaults = stateDefaults[kind];
  const { Icon } = defaults;
  const role = kind === 'error' || kind === 'offline' || kind === 'forbidden' ? 'alert' : 'status';
  const resolvedTitle = L(title ?? defaults.title);
  const resolvedDescription = L(description ?? defaults.description);

  return (
    <section
      className={`aurora-state aurora-state--${kind}${compact ? ' aurora-state--compact' : ''}${fullPage ? ' aurora-state--page' : ''}${className ? ` ${className}` : ''}`}
      role={role}
      aria-live={kind === 'loading' ? 'polite' : 'assertive'}
      aria-busy={kind === 'loading' || undefined}
    >
      <div className="aurora-state__icon" aria-hidden="true">
        <Icon className={kind === 'loading' ? 'aurora-state__spinner' : undefined} />
      </div>
      <div className="aurora-state__copy">
        <p className="aurora-state__eyebrow">{eyebrow ?? defaults.eyebrow}</p>
        <h1>{resolvedTitle}</h1>
        <p className="aurora-state__description">{resolvedDescription}</p>
      </div>
      {actions && <div className="aurora-state__actions">{actions}</div>}
    </section>
  );
}
