import { useEffect, useRef } from 'react';
import { L } from '@/lib/translations/manual';

import { useParams, useNavigate, Link } from 'react-router';
import { stories, type StoryChapter } from '@/data/stories';
import { storiesEn } from '@/data/stories.en';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { renderStoryContent, renderStoryContentEn } from '@/lib/renderStoryContent';
import TextStoryReader from '@/components/TextStoryReader';
import ReadingProgress from '@/components/ReadingProgress';
import { emitRouteReady } from '@/lib/deepLinkCoordinator';
import { getStoryConfig, type ChapterButtonStyle } from '@/lib/storyThemeConfig';
import StoryReaderTools from '@/components/StoryReaderTools';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import { recordReadingProgress } from '@/lib/readingState';
import SmartImage from '@/components/SmartImage';
import { READER_IMAGE_WIDTHS } from '@/components/ResponsiveImage';
import { useLocale } from '@/hooks/useLocale';
import '@/styles/story-themes.css';

function getTabLabel(chapter: StoryChapter, style: ChapterButtonStyle, index: number): string {
  if (style === 'bubble') return String(index + 1);
  if (style === 'process') {
    const prefix = chapter.title.split('·')[0].split('：')[0].split(' ')[0];
    return prefix || String(index + 1);
  }
  return chapter.title.split(' ')[0];
}

function getTabContainerClass(style: ChapterButtonStyle): string {
  if (style === 'process') return 'story-process-tabs';
  if (style === 'index') return 'story-index-tabs';
  return 'aurora-tabs';
}

function getTabButtonClass(style: ChapterButtonStyle): string {
  switch (style) {
    case 'bubble': return 'story-chapter-bubble';
    case 'process': return 'story-chapter-process';
    case 'index': return 'story-chapter-index';
    case 'terminal': return 'story-chapter-terminal';
    default: return 'aurora-tab';
  }
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

function getNavClass(style: ChapterButtonStyle): string {
  switch (style) {
    case 'bubble': return 'story-nav-ocean';
    case 'process': return 'story-nav-zhenhai';
    case 'index': return 'story-nav-mia';
    case 'terminal': return 'story-nav-agi';
    default: return 'story-nav-giant';
  }
}

export default function StoryReader() {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const locale = useLocale();
  const isEn = locale === 'en';
  const source = isEn ? storiesEn : stories;
  const story = source.find((s) => s.id === storyId);
  const config = story ? getStoryConfig(story.id) : null;
  const topRef = useRef<HTMLDivElement>(null);
  const { preferences, updatePreferences } = useReadingPreferences();
  const chapterIndex = chapterId ? parseInt(chapterId, 10) - 1 : 0;
  const validIndex = story && !isNaN(chapterIndex) && chapterIndex >= 0 && chapterIndex < story.chapters.length
    ? chapterIndex
    : null;
  const activeChapter = validIndex !== null ? story?.chapters[validIndex] : null;

  useEffect(() => {
    if (story) emitRouteReady(`/stories/${storyId}`);
  }, [story, storyId]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    topRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [chapterId, storyId]);

  useEffect(() => {
    if (!story || validIndex === null || !activeChapter) return;
    recordReadingProgress({
      storyId: story.id,
      storyTitle: story.title,
      chapterTitle: activeChapter.title,
      href: `/stories/${story.id}/chapters/${validIndex + 1}`,
    });
  }, [activeChapter, story, validIndex]);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nc-text-muted">
        <div className="text-center">
          <p className="text-lg mb-4">{isEn ? 'Story not found' : '故事未找到'}</p>
          <Link to="/stories" className="tap-safe text-nc-cyan hover:underline">
            {isEn ? 'Back to story list' : '返回故事列表'}
          </Link>
        </div>
      </div>
    );
  }

  if (story.contentSource) {
    return <TextStoryReader story={story} />;
  }

  if (validIndex === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nc-text-muted">
        <div className="text-center">
          <p className="text-lg mb-4">{isEn ? 'Chapter not found' : '未找到该章节'}</p>
          <Link to={`/stories/${storyId}/chapters/1`} className="tap-safe text-nc-cyan hover:underline">
            {isEn ? 'Go to chapter 1' : '返回第一章'}
          </Link>
        </div>
      </div>
    );
  }

  const chapter = story.chapters[validIndex];
  const cfg = config!;
  const tabContainerClass = getTabContainerClass(cfg.chapterButtonStyle);
  const tabButtonClass = getTabButtonClass(cfg.chapterButtonStyle);
  const paperClass = getPaperClass(cfg.paperStyle);
  const navClass = getNavClass(cfg.chapterButtonStyle);
  const titleFontClass = cfg.titleFontClass;

  const goToChapter = (index: number) => {
    if (index >= 0 && index < story.chapters.length) {
      navigate(`/stories/${storyId}/chapters/${index + 1}`, { replace: false });
    }
  };

  return (
    <div ref={topRef} className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={cfg.theme}>
      <ReadingProgress resetKey={`${storyId}-${validIndex}`} />
      <div className="aurora-container aurora-generic-inner max-w-[800px]">
        <Link
          to="/stories"
          data-action="back"
          className="tap-safe inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {isEn ? 'Back to story list' : '返回故事列表'}
        </Link>

        <StoryReaderTools
          chapters={story.chapters.map((item, index) => ({ id: String(index), label: item.title }))}
          activeId={String(validIndex)}
          onSelect={(id) => goToChapter(Number(id))}
          onPrevious={() => goToChapter(validIndex - 1)}
          onNext={() => goToChapter(validIndex + 1)}
          hasPrevious={validIndex > 0}
          hasNext={validIndex < story.chapters.length - 1}
          preferences={preferences}
          onPreferencesChange={updatePreferences}
        />

        <p className="aurora-eyebrow story-reader-eyebrow">STORY READER</p>

        {cfg.coverImage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="story-cover"
          >
            <SmartImage
              localSrc={cfg.coverImage}
              alt={story.title}
              responsiveWidths={READER_IMAGE_WIDTHS}
              sizes="(max-width: 840px) calc(100vw - 32px), 800px"
              loading="eager"
              fetchPriority="high"
              containerClassName="h-full w-full"
              className="object-cover"
            />
            <div className="story-cover-overlay" aria-hidden="true" />
            <div className="story-cover-content">
              <h1 className="story-cover-title">{story.title}</h1>
              {story.subtitle && <p className="story-cover-subtitle">{story.subtitle}</p>}
              <span className="story-cover-badge">
                <BookOpen className="w-3 h-3" />
                {story.chapters.length} {isEn ? 'ch.' : '章'}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aurora-reader-heading"
          >
            <h1 className="text-3xl font-bold text-nc-text mb-2">{story.title}</h1>
            {story.subtitle && <p className="text-nc-text-secondary">{story.subtitle}</p>}
          </motion.div>
        )}

        <div className={`${tabContainerClass} story-reader-chapter-tabs`} role="tablist" aria-label={isEn ? 'Story chapters' : '故事章节'}>
          {story.chapters.flatMap((ch, i) => {
            const elements: React.ReactNode[] = [
              <button
                key={i}
                onClick={() => goToChapter(i)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    goToChapter(i);
                  }
                }}
                role="tab"
                aria-selected={validIndex === i}
                className={tabButtonClass}
                data-number={i + 1}
                aria-label={L(`${isEn ? 'Chapter' : '第'} ${i + 1}${isEn ? '' : '章'}: ${ch.title}`)}
              >
                {getTabLabel(ch, cfg.chapterButtonStyle, i)}
              </button>,
            ];
            if (cfg.chapterButtonStyle === 'process' && i < story.chapters.length - 1) {
              elements.push(<span key={`pipe-${i}`} className="zhenhai-process-pipe" aria-hidden="true" />);
            }
            return elements;
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={validIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`aurora-reader-paper prose prose-invert max-w-none ${paperClass}`}
          >
            <h2 className="text-xl font-semibold text-nc-text mb-6">{chapter.title}</h2>
            {(chapter.image || chapter.images?.length) && (
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                {[chapter.image, ...(chapter.images ?? [])].filter((image): image is string => Boolean(image)).map((image, imageIndex) => (
                  <SmartImage
                    key={image}
                    localSrc={image}
                    alt={L(`${chapter.title} ${isEn ? 'image' : '图片'} ${imageIndex + 1}`)}
                    responsiveWidths={READER_IMAGE_WIDTHS}
                    sizes="(max-width: 767px) calc(100vw - 64px), 368px"
                    aspectRatio="16 / 9"
                    containerClassName="rounded-xl"
                    className="object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            <div
              className={`text-nc-text-secondary space-y-4 whitespace-pre-wrap ${titleFontClass}`}
              style={{ fontSize: `${preferences.fontSize}px`, lineHeight: preferences.lineHeight }}
            >
              {isEn ? renderStoryContentEn(chapter.content) : renderStoryContent(chapter.content)}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          {validIndex > 0 ? (
            <button
              onClick={() => goToChapter(validIndex - 1)}
              className={`story-reader-nav flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-subtle border border-white/[0.06] text-nc-text transition-all ${navClass}`}
            >
              <ChevronLeft className="w-4 h-4" /> {isEn ? 'Previous chapter' : '上一章'}
            </button>
          ) : <div />}

          {validIndex < story.chapters.length - 1 && (
            <button
              onClick={() => goToChapter(validIndex + 1)}
              className={`story-reader-nav flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-subtle border border-white/[0.06] text-nc-text transition-all ${navClass}`}
            >
              {isEn ? 'Next chapter' : '下一章'} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
