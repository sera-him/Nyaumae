import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AuroraAccent = 'world' | 'characters' | 'stories' | 'miia' | 'math' | 'playground';

interface AuroraPageProps extends HTMLAttributes<HTMLDivElement> {
  accent?: AuroraAccent;
}

export function AuroraPage({ accent = 'characters', className, children, ...props }: AuroraPageProps) {
  return <div className={cn('aurora-ui', className)} data-aurora-accent={accent} {...props}>{children}</div>;
}

interface AuroraHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function AuroraHeader({ eyebrow, title, description, actions, className, ...props }: AuroraHeaderProps) {
  return (
    <header className={cn('aurora-container aurora-page', className)} {...props}>
      <p className="aurora-eyebrow">{eyebrow}</p>
      <h1 className="aurora-title">{title}</h1>
      {description && <div className="aurora-lead">{description}</div>}
      {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

interface AuroraPanelProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function AuroraPanel({ interactive = false, className, children, ...props }: AuroraPanelProps) {
  return <div className={cn('aurora-glass aurora-panel', interactive && 'aurora-panel-interactive', className)} {...props}>{children}</div>;
}

interface AuroraSectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export function AuroraSectionHeading({ eyebrow, title, description, className, ...props }: AuroraSectionHeadingProps) {
  return (
    <div className={cn('aurora-stack', className)} {...props}>
      <div>{eyebrow && <p className="aurora-eyebrow">{eyebrow}</p>}<h2 className="aurora-section-title">{title}</h2></div>
      {description && <div className="text-sm leading-7 text-[var(--aurora-text-secondary)]">{description}</div>}
    </div>
  );
}

interface AuroraStatProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
}

export function AuroraStat({ label, value, className, ...props }: AuroraStatProps) {
  return <div className={cn('aurora-stat', className)} {...props}><span className="aurora-stat-label">{label}</span><strong className="aurora-stat-value">{value}</strong></div>;
}

export const auroraButton = (variant: 'primary' | 'secondary' | 'quiet' = 'secondary') =>
  cn('aurora-button', variant === 'primary' && 'aurora-button-primary', variant === 'quiet' && 'aurora-button-quiet');
