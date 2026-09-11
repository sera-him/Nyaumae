import { useState, useRef, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  /** Unique ID for scroll anchoring */
  id: string;
  /** Card title (shown in both collapsed & expanded state) */
  title: ReactNode;
  /** One-sentence summary shown when collapsed */
  summary: ReactNode;
  /** Full content shown when expanded */
  children: ReactNode;
  /** Optional icon element */
  icon?: ReactNode;
  /** Whether the card starts expanded (default: false) */
  defaultExpanded?: boolean;
  /** Custom border color class (default: border-[#8B5CF6]/15) */
  borderColor?: string;
  /** Custom title color class (default: text-nc-text) */
  titleColor?: string;
  /** Custom background color class (default: bg-[var(--aurora-brand-bg)]) */
  bgColor?: string;
}

export default function CollapsibleCard({
  id,
  title,
  summary,
  children,
  icon,
  defaultExpanded = false,
  borderColor = 'border-[#8B5CF6]/15',
  titleColor = 'text-nc-text',
  bgColor = 'liquid-glass-subtle',
}: CollapsibleCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      id={id}
      className={`${bgColor} border ${borderColor} rounded-2xl overflow-hidden mb-8 scroll-mt-[100px] transition-all duration-200 glass-highlight glass-shine relative`}
    >
      {/* Clickable header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#1A1025]/50 transition-colors group"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h3 className={`text-base font-semibold ${titleColor} truncate`}>{title}</h3>
            {!expanded && (
              <p className="text-sm text-nc-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                {summary}
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 ml-3 text-nc-text-muted transition-transform duration-200 group-hover:scale-110">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {/* Expandable content area */}
      {expanded && (
        <div ref={contentRef} className="border-t border-[#8B5CF6]/10">
          {children}
        </div>
      )}
    </div>
  );
}
