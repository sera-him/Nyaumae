import { useState, useEffect, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LazyCollapsibleSectionProps {
  /** Unique ID for scroll anchoring */
  id: string;
  /** Section title (shown in both collapsed & expanded state) */
  title: ReactNode;
  /** One-sentence summary shown when collapsed */
  summary: ReactNode;
  /** The lazy-loaded section content */
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
  /**
   * Additional IDs that should trigger expansion of this section.
   * Useful when nav/search targets use a different ID than the section itself
   * (e.g. the inner `<section id="chess">` should expand the parent with id="chess-rules").
   */
  expandMatchIds?: string[];
}

export default function LazyCollapsibleSection({
  id,
  title,
  summary,
  children,
  icon,
  defaultExpanded = false,
  borderColor = 'border-[#8B5CF6]/15',
  titleColor = 'text-nc-text',
  bgColor = 'bg-[var(--aurora-brand-bg)]',
  expandMatchIds,
}: LazyCollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(defaultExpanded);

  // Listen for navigation expand events
  useEffect(() => {
    const handler = (e: Event) => {
      const targetId = (e as CustomEvent).detail;
      if (!targetId) return;

      // Check if this section should expand in response to the navigation event
      const matchIds = [id, ...(expandMatchIds ?? [])];
      if (matchIds.includes(targetId)) {
        setExpanded(true);
        setHasBeenExpanded(true);
      }
    };

    window.addEventListener('kimi:expandSection', handler);
    return () => window.removeEventListener('kimi:expandSection', handler);
  }, [id, expandMatchIds]);

  return (
    <div
      id={id}
      className={`${bgColor} border ${borderColor} rounded-xl overflow-hidden mb-8 scroll-mt-[100px] transition-all duration-200`}
    >
      {/* Clickable header — always visible */}
      <button
        onClick={() => {
          const nextExpanded = !expanded;
          setExpanded(nextExpanded);
          if (nextExpanded) setHasBeenExpanded(true);
        }}
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

      {/* Expandable content area — once expanded, keep mounted */}
      {hasBeenExpanded && (
        <div
          className="border-t border-[#8B5CF6]/10"
          style={{ display: expanded ? '' : 'none' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
