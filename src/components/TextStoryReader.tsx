import { useEffect, useState } from 'react';
import { L } from '@/lib/translations/manual';

import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, ListTree, Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageState from '@/components/PageState';
import { renderStoryContent, renderStoryContentEn } from '@/lib/renderStoryContent';
import ReadingProgress from '@/components/ReadingProgress';
import { emitRouteReady } from '@/lib/deepLinkCoordinator';
import { getStoryConfig } from '@/lib/storyThemeConfig';
import type { Story, StoryChapter } from '@/data/stories';
import SmartImage from '@/components/SmartImage';
import { READER_IMAGE_WIDTHS } from '@/components/ResponsiveImage';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import { useLocale } from '@/hooks/useLocale';
import { recordReadingProgress } from '@/lib/readingState';

interface TextStoryPart {
  title: string;
  chapters: StoryChapter[];
}

interface LoadedTextStory {
  source: string;
  parts: TextStoryPart[];
  error: string | null;
}

const textStoryCache = new Map<string, TextStoryPart[]>();
const textStoryRequests = new Map<string, Promise<TextStoryPart[]>>();

function isStoryFormattingArtifact(line: string): boolean {
  const trimmed = line.trim();
  return /^-+$/.test(trimmed) || /^=+$/.test(trimmed) || /^<a id="[^"]+"><\/a>$/.test(trimmed);
}

const partImages: Partial<Record<number, string>> = {
  0: '/story-giant-part-1.png',
  1: '/story-giant-part-2.png',
  2: '/story-giant-part-3.png',
  3: '/story-giant-part-4.png',
  4: '/story-giant-part-5.png',
  5: '/story-giant-part-6.png',
  6: '/story-giant-part-7.png',
  7: '/story-giant-part-8.png',
};

function parseTextStory(source: string): TextStoryPart[] {
  const parts: TextStoryPart[] = [];
  let currentPart: TextStoryPart | null = null;
  let currentChapter: { title: string; lines: string[] } | null = null;

  const commitChapter = () => {
    if (!currentPart || !currentChapter) return;
    currentPart.chapters.push({
      title: currentChapter.title,
      content: currentChapter.lines.join('\n').trim(),
    });
    currentChapter = null;
  };

  for (const line of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (isStoryFormattingArtifact(line)) continue;

    if (!line.startsWith('## ')) {
      if (currentChapter) currentChapter.lines.push(line);
      continue;
    }

    commitChapter();
    const title = line.slice(3).trim();

    // 中文文件：`## 第一篇 …` / `## 第一章：…` / `## 尾声 …`
    // 英文文件：`## Part 1: …` / `## Part Six: …` / `## Chapter 1: …` / `## Epilogue: …`
    const isPartHeading = /^第.+篇/.test(title) || /^Part\b/i.test(title);
    const isChapterHeading = /^(第.+章|尾声)/.test(title) || /^(Chapter|Epilogue)\b/i.test(title);

    if (isPartHeading) {
      currentPart = { title, chapters: [] };
      parts.push(currentPart);
    } else if (isChapterHeading) {
      if (!currentPart) {
        currentPart = { title: '正文', chapters: [] };
        parts.push(currentPart);
      }
      currentChapter = { title, lines: [] };
    }
  }

  commitChapter();
  return parts.filter((part) => part.chapters.length > 0);
}

function loadTextStory(sourceUrl: string): Promise<TextStoryPart[]> {
  const cached = textStoryCache.get(sourceUrl);
  if (cached) return Promise.resolve(cached);

  const pending = textStoryRequests.get(sourceUrl);
  if (pending) return pending;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort('story-timeout'), 15_000);
  const request = fetch(sourceUrl, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((source) => {
      window.clearTimeout(timeout);
      const parts = parseTextStory(source);
      if (parts.length === 0) throw new Error('EMPTY_STORY');
      textStoryCache.set(sourceUrl, parts);
      textStoryRequests.delete(sourceUrl);
      return parts;
    })
    .catch((error) => {
      window.clearTimeout(timeout);
      textStoryRequests.delete(sourceUrl);
      throw error;
    });

  textStoryRequests.set(sourceUrl, request);
  return request;
}

function getPaperClass(paperStyle: string): string {
  switch (paperStyle) {
    case 'light-glass': return 'story-paper-ocean';
    case 'warm-paper': return 'story-paper-zhenhai';
    case 'dark-library': return 'story-paper-mia';
    case 'dark': return 'story-paper-agi';
    case 'diary': return 'story-paper-giant';
    default: return '';
  }
}

function getNavClass(style: string): string {
  switch (style) {
    case 'bubble': return 'story-nav-ocean';
    case 'process': return 'story-nav-zhenhai';
    case 'index': return 'story-nav-mia';
    case 'terminal': return 'story-nav-agi';
    default: return 'story-nav-giant';
  }
}

interface TextStoryReaderProps {
  story: Story;
}

interface ChapterDirectoryProps {
  parts: TextStoryPart[];
  activePart: number;
  activeChapter: number;
  onSelect: (partIndex: number, chapterIndex: number) => void;
}

function ChapterDirectory({ parts, activePart, activeChapter, onSelect }: ChapterDirectoryProps) {
  return (
    <nav className="story-reader-directory-list" aria-label={L("章节目录")}>
      {parts.map((partItem, partIndex) => (
        <section key={partItem.title} className={partIndex === activePart ? 'is-active' : undefined}>
          <p>{partItem.title}</p>
          <ol>
            {partItem.chapters.map((chapterItem, chapterIndex) => {
              const selected = partIndex === activePart && chapterIndex === activeChapter;
              return (
                <li key={chapterItem.title}>
                  <button
                    type="button"
                    onClick={() => onSelect(partIndex, chapterIndex)}
                    aria-current={selected ? 'page' : undefined}
                  >
                    <span>{String(chapterIndex + 1).padStart(2, '0')}</span>
                    <strong>{chapterItem.title}</strong>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </nav>
  );
}

export default function TextStoryReader({ story }: TextStoryReaderProps) {
  const { partId, chapterId } = useParams<{ partId?: string; chapterId?: string }>();
  const navigate = useNavigate();
  const locale = useLocale();
  const sourceUrl = story.contentSource!;
  const enSourceUrl = sourceUrl.replace(/\.txt$/, '.en.txt');
  const activeSourceUrl = locale === 'en' ? enSourceUrl : sourceUrl;
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedStory, setLoadedStory] = useState<LoadedTextStory>(() => ({
    source: activeSourceUrl,
    parts: textStoryCache.get(activeSourceUrl) ?? [],
    error: null,
  }));
  const { preferences, updatePreferences } = useReadingPreferences();
  const englishReader = locale === 'en';
  const parts = loadedStory.source === activeSourceUrl
    ? loadedStory.parts
    : textStoryCache.get(activeSourceUrl) ?? [];
  const error = loadedStory.source === activeSourceUrl ? loadedStory.error : null;
  const config = getStoryConfig(story.id);
  const paperClass = getPaperClass(config.paperStyle);
  const navClass = getNavClass(config.chapterButtonStyle);

  useEffect(() => {
    emitRouteReady(`/stories/${story.id}`);
  }, [story.id]);

  useEffect(() => {
    let active = true;

    void loadTextStory(activeSourceUrl)
      .then((nextParts) => {
        if (active) setLoadedStory({ source: activeSourceUrl, parts: nextParts, error: null });
      })
      .catch((loadError: unknown) => {
        if (active) {
          const reason = !navigator.onLine
            ? (englishReader ? 'You are offline and the text is not cached yet. Reconnect to retry in place.' : '当前处于离线状态，正文尚未缓存。联网后可原地重试。')
            : loadError instanceof DOMException && loadError.name === 'AbortError'
              ? (englishReader ? 'The text request timed out after 15 seconds and was stopped.' : '正文请求超过 15 秒，已停止等待。')
              : loadError instanceof Error && loadError.message.startsWith('HTTP ')
                ? (englishReader ? `The text service responded with ${loadError.message.replace('HTTP ', '')}.` : `正文服务返回 ${loadError.message.replace('HTTP ', '')}。`)
                : (englishReader ? 'The text content is temporarily unavailable.' : '正文资源暂时不可用。');
          setLoadedStory((current) => ({
            source: activeSourceUrl,
            parts: current.source === activeSourceUrl ? current.parts : [],
            error: reason,
          }));
        }
      });

    return () => { active = false; };
  }, [loadAttempt, activeSourceUrl, englishReader]);

  const partIndex = partId ? parseInt(partId, 10) - 1 : 0;
  const validPartIndex = !isNaN(partIndex) && partIndex >= 0 && partIndex < parts.length ? partIndex : null;
  const part = validPartIndex !== null ? parts[validPartIndex] : null;

  const chapterIndex = chapterId ? parseInt(chapterId, 10) - 1 : 0;
  const validChapterIndex = part && !isNaN(chapterIndex) && chapterIndex >= 0 && chapterIndex < part.chapters.length ? chapterIndex : null;
  const chapter = validChapterIndex !== null && part ? part.chapters[validChapterIndex] : null;

  const partImage = validPartIndex !== null ? partImages[validPartIndex] : undefined;

  const goToChapter = (pIdx: number, cIdx: number) => {
    const url = `/stories/${story.id}/parts/${pIdx + 1}/chapters/${cIdx + 1}`;
    navigate(url, { replace: false });
  };

  const nextChapter = () => {
    if (validPartIndex === null || validChapterIndex === null || !part) return;
    if (validChapterIndex < part.chapters.length - 1) {
      goToChapter(validPartIndex, validChapterIndex + 1);
    } else if (validPartIndex < parts.length - 1) {
      goToChapter(validPartIndex + 1, 0);
    }
  };

  const prevChapter = () => {
    if (validPartIndex === null || validChapterIndex === null || !part) return;
    if (validChapterIndex > 0) {
      goToChapter(validPartIndex, validChapterIndex - 1);
    } else if (validPartIndex > 0) {
      const prevPart = parts[validPartIndex - 1];
      goToChapter(validPartIndex - 1, prevPart.chapters.length - 1);
    }
  };

  const hasNextChapter = Boolean(
    validPartIndex !== null && validChapterIndex !== null && part &&
    (validChapterIndex < part.chapters.length - 1 || validPartIndex < parts.length - 1)
  );

  const hasPrevChapter = Boolean(
    validPartIndex !== null && validChapterIndex !== null &&
    (validChapterIndex > 0 || validPartIndex > 0)
  );

  const previousChapterTitle = hasPrevChapter && validPartIndex !== null && validChapterIndex !== null
    ? validChapterIndex > 0
      ? parts[validPartIndex].chapters[validChapterIndex - 1]?.title
      : parts[validPartIndex - 1]?.chapters.at(-1)?.title
    : null;
  const nextChapterTitle = hasNextChapter && validPartIndex !== null && validChapterIndex !== null && part
    ? validChapterIndex < part.chapters.length - 1
      ? part.chapters[validChapterIndex + 1]?.title
      : parts[validPartIndex + 1]?.chapters[0]?.title
    : null;

  const retryLoad = () => {
    setLoadedStory((current) => ({
      source: activeSourceUrl,
      parts: current.source === activeSourceUrl ? current.parts : [],
      error: null,
    }));
    setLoadAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    if (validPartIndex === null || validChapterIndex === null || !part || !chapter) return;
    recordReadingProgress({
      storyId: story.id,
      storyTitle: story.title,
      chapterTitle: `${part.title} · ${chapter.title}`,
      href: `/stories/${story.id}/parts/${validPartIndex + 1}/chapters/${validChapterIndex + 1}`,
    });
  }, [chapter, part, story.id, story.title, validChapterIndex, validPartIndex]);

  useEffect(() => {
    const handleChapterKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName))) return;
      if (event.key === 'ArrowLeft' && hasPrevChapter) {
        event.preventDefault();
        prevChapter();
      }
      if (event.key === 'ArrowRight' && hasNextChapter) {
        event.preventDefault();
        nextChapter();
      }
    };
    window.addEventListener('keydown', handleChapterKey);
    return () => window.removeEventListener('keydown', handleChapterKey);
  });

  if (error) {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    return (
      <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
        <div className="aurora-container aurora-generic-inner story-reader-shell">
          <PageState
            kind={offline ? 'offline' : 'error'}
            title={offline ? `${story.title} · ${englishReader ? 'Cannot load while offline' : '离线时无法载入'}` : `${story.title} · ${englishReader ? 'The text could not be loaded right now' : '正文暂时无法加载'}`}
            description={englishReader
              ? `${error} You are still on part ${partId ?? '1'}, chapter ${chapterId ?? '1'}; the URL and reading position do not change.`
              : L(`${error} 当前仍停留在第 ${partId ?? '1'} 篇、第 ${chapterId ?? '1'} 章，网址和阅读位置不会改变。`)}
            actions={<>
              <button type="button" data-action="retry" className="aurora-button aurora-button-primary" onClick={retryLoad}>{L("原地重试正文")}</button>
              <Link to="/stories" data-action="back" className="aurora-button">{L("返回故事列表")}</Link>
            </>}
          />
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
        <div className="aurora-container aurora-generic-inner story-reader-shell">
          <PageState kind="loading" title={L("正在载入正文")} description="章节与阅读进度准备好后会自动显示。" />
        </div>
      </div>
    );
  }

  if (validPartIndex === null || !part || validChapterIndex === null || !chapter) {
    return (
      <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
        <div className="aurora-container aurora-generic-inner story-reader-shell">
          <PageState
            kind="empty"
            title={L("未找到该章节")}
            description="章节地址可能已更新，可以从第一章重新开始。"
            actions={<>
              <Link to={`/stories/${story.id}/parts/1/chapters/1`} className="aurora-button aurora-button-primary">{L("返回第一章")}</Link>
              <Link to="/stories" className="aurora-button">{L("故事列表")}</Link>
            </>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
      <ReadingProgress resetKey={`${story.id}-${validPartIndex}-${validChapterIndex}`} />
      <div className="aurora-container aurora-generic-inner story-reader-shell">
        <Link
          to="/stories"
          data-action="back"
          className="story-reader-back aurora-button aurora-button-quiet"
        >
          <ArrowLeft className="w-4 h-4" /> {L("返回故事列表\n        ")}</Link>

        <div className="story-reader-tools" aria-label={L("阅读显示设置")}>
          <button type="button" onClick={() => updatePreferences({ ...preferences, fontSize: Math.max(14, preferences.fontSize - 1) })} disabled={preferences.fontSize <= 14} aria-label={L("减小字号")}><Minus /></button>
          <span className="story-reader-tool-value">{preferences.fontSize}px</span>
          <button type="button" onClick={() => updatePreferences({ ...preferences, fontSize: Math.min(22, preferences.fontSize + 1) })} disabled={preferences.fontSize >= 22} aria-label={L("增大字号")}><Plus /></button>
          <button type="button" onClick={() => updatePreferences({ ...preferences, lineHeight: preferences.lineHeight >= 2.15 ? 1.65 : preferences.lineHeight >= 1.85 ? 2.2 : 1.9 })}>{L("行距 ")}{preferences.lineHeight.toFixed(2)}</button>
          <span className="story-reader-keyboard-hint"><ChevronLeft /><ChevronRight /> {L("键盘翻章")}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aurora-reader-heading"
        >
          <p className="aurora-eyebrow">STORY READER</p>
          <h1>{story.title}</h1>
          {story.subtitle && <p>{story.subtitle}</p>}
        </motion.div>

        <details className="story-reader-directory story-reader-directory--mobile">
          <summary><ListTree aria-hidden="true" />{L("章节目录")}<span>{validPartIndex + 1}.{validChapterIndex + 1}</span></summary>
          <ChapterDirectory parts={parts} activePart={validPartIndex} activeChapter={validChapterIndex} onSelect={goToChapter} />
        </details>

        <div className="story-reader-layout">
          <aside className="story-reader-directory story-reader-directory--desktop">
            <div className="story-reader-directory-heading"><ListTree aria-hidden="true" /><span><small>CONTENTS</small><strong>{L("章节目录")}</strong></span></div>
            <ChapterDirectory parts={parts} activePart={validPartIndex} activeChapter={validChapterIndex} onSelect={goToChapter} />
          </aside>

          <div className="story-reader-content">
          <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={`${validPartIndex}-${validChapterIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`aurora-reader-paper prose prose-invert max-w-none ${paperClass}`}
              >
                {partImage && (
                  <SmartImage
                    localSrc={partImage}
                    alt={L(`${part.title}插图`)}
                    responsiveWidths={READER_IMAGE_WIDTHS}
                    sizes="(max-width: 840px) calc(100vw - 32px), 800px"
                    loading="lazy"
                    aspectRatio="16 / 9"
                    containerClassName="w-full rounded-2xl border border-white/[0.08] mb-8 shadow-2xl shadow-black/20"
                    className="object-cover"
                  />
                )}
                <header className="story-reader-article-heading">
                  <p>{part.title}</p>
                  <h2>{chapter.title}</h2>
                </header>
                {englishReader && null}
                <div className="story-reader-prose font-serif-cn whitespace-pre-wrap" data-no-translate style={{ fontSize: `${preferences.fontSize}px`, lineHeight: preferences.lineHeight }}>
                  {englishReader ? renderStoryContentEn(chapter.content) : renderStoryContent(chapter.content)}
                </div>
              </motion.article>
          </AnimatePresence>

          <nav className="story-reader-nav-area" aria-label={L("章节翻页")}>
            {hasPrevChapter && (
              <button
                type="button"
                onClick={prevChapter}
                className={`story-reader-nav story-reader-nav--previous ${navClass}`}
              >
                <ArrowLeft aria-hidden="true" />
                <span><small>{L("上一章")}</small><strong>{previousChapterTitle}</strong></span>
              </button>
            )}

            {hasNextChapter && (
              <button
                type="button"
                onClick={nextChapter}
                className={`story-reader-nav story-reader-nav--next ${navClass}`}
              >
                <span><small>{L("下一章")}</small><strong>{nextChapterTitle}</strong></span>
                <ChevronRight aria-hidden="true" />
              </button>
            )}
          </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
