import { useEffect, useState } from 'react';
import { L } from '@/lib/translations/manual';

import { BookOpen, ChevronLeft, ChevronRight, List, Minus, Plus, X } from 'lucide-react';
import type { ReadingPreferences } from '@/lib/readingState';

export interface StoryReaderChapterItem {
  id: string;
  label: string;
  group?: string;
}

interface StoryReaderToolsProps {
  chapters: StoryReaderChapterItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  preferences: ReadingPreferences;
  onPreferencesChange: (preferences: ReadingPreferences) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)
  );
}

export default function StoryReaderTools({
  chapters,
  activeId,
  onSelect,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  preferences,
  onPreferencesChange,
}: StoryReaderToolsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawerOpen) {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (drawerOpen || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isEditableTarget(event.target)) return;
      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault();
        onPrevious();
      }
      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, hasNext, hasPrevious, onNext, onPrevious]);

  const changeFontSize = (delta: number) => {
    onPreferencesChange({ ...preferences, fontSize: Math.min(22, Math.max(14, preferences.fontSize + delta)) });
  };

  const cycleLineHeight = () => {
    const options = [1.65, 1.9, 2.2];
    const currentIndex = options.findIndex((value) => Math.abs(value - preferences.lineHeight) < 0.05);
    onPreferencesChange({ ...preferences, lineHeight: options[(currentIndex + 1) % options.length] });
  };

  return (
    <>
      <div className="story-reader-tools" aria-label={L("阅读工具")}>
        <button type="button" data-action="menu" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen}>
          <List />{L("章节目录\n        ")}</button>
        <span className="story-reader-tools-divider" aria-hidden="true" />
        <button type="button" onClick={() => changeFontSize(-1)} disabled={preferences.fontSize <= 14} aria-label={L("减小字号")}><Minus /></button>
        <span className="story-reader-tool-value" aria-live="polite">{preferences.fontSize}px</span>
        <button type="button" onClick={() => changeFontSize(1)} disabled={preferences.fontSize >= 22} aria-label={L("增大字号")}><Plus /></button>
        <button type="button" onClick={cycleLineHeight} title={L("切换行距")}>{L("行距 ")}{preferences.lineHeight.toFixed(2)}</button>
        <span className="story-reader-keyboard-hint"><ChevronLeft /> <ChevronRight /> {L("键盘翻章")}</span>
      </div>

      {drawerOpen && (
        <div className="story-chapter-drawer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setDrawerOpen(false);
        }}>
          <aside className="story-chapter-drawer" role="dialog" aria-modal="true" aria-labelledby="story-chapter-drawer-title">
            <header>
              <div><BookOpen /><span><strong id="story-chapter-drawer-title">{L("章节目录")}</strong><small>{chapters.length} {L("个章节")}</small></span></div>
              <button type="button" data-action="close" onClick={() => setDrawerOpen(false)} aria-label={L("关闭章节目录")}><X /></button>
            </header>
            <nav aria-label={L("章节列表")}>
              {chapters.map((chapter) => (
                <button
                  type="button"
                  key={chapter.id}
                  className={chapter.id === activeId ? 'is-active' : ''}
                  aria-current={chapter.id === activeId ? 'page' : undefined}
                  onClick={() => { onSelect(chapter.id); setDrawerOpen(false); }}
                >
                  {chapter.group && <small>{chapter.group}</small>}
                  <span>{chapter.label}</span>
                  {chapter.id === activeId && <strong>{L("正在阅读")}</strong>}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
