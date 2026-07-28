import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { stories, type StoryChapter } from '@/data/stories';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { renderStoryContent } from '@/lib/renderStoryContent';
import TextStoryReader from '@/components/TextStoryReader';
import { emitRouteReady } from '@/lib/deepLinkCoordinator';
import { getStoryConfig, type ChapterButtonStyle } from '@/lib/storyThemeConfig';

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
  const story = stories.find((s) => s.id === storyId);
  const config = story ? getStoryConfig(story.id) : null;
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (story) emitRouteReady(`/stories/${storyId}`);
  }, [story, storyId]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chapterId, storyId]);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nc-text-muted">
        <div className="text-center">
          <p className="text-lg mb-4">故事未找到</p>
          <Link to="/stories" className="text-nc-cyan hover:underline">
            返回故事列表
          </Link>
        </div>
      </div>
    );
  }

  if (story.contentSource) {
    return <TextStoryReader story={story} />;
  }

  const chapterIndex = chapterId ? parseInt(chapterId, 10) - 1 : 0;
  const validIndex = !isNaN(chapterIndex) && chapterIndex >= 0 && chapterIndex < story.chapters.length
    ? chapterIndex
    : null;

  if (validIndex === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nc-text-muted">
        <div className="text-center">
          <p className="text-lg mb-4">未找到该章节</p>
          <Link to={`/stories/${storyId}/chapters/1`} className="text-nc-cyan hover:underline">
            返回第一章
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
      <div className="aurora-container aurora-generic-inner max-w-[800px]">
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回故事列表
        </Link>

        {cfg.coverImage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="story-cover"
          >
            <img src={cfg.coverImage} alt={story.title} />
            <div className="story-cover-overlay" aria-hidden="true" />
            <div className="story-cover-content">
              <h1 className="story-cover-title">{story.title}</h1>
              {story.subtitle && <p className="story-cover-subtitle">{story.subtitle}</p>}
              <span className="story-cover-badge">
                <BookOpen className="w-3 h-3" />
                {story.chapters.length} 章
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

        <div className={tabContainerClass} role="tablist" aria-label="故事章节">
          {story.chapters.flatMap((ch, i) => {
            const elements: React.ReactNode[] = [
              <button
                key={i}
                onClick={() => goToChapter(i)}
                role="tab"
                aria-selected={validIndex === i}
                className={tabButtonClass}
                data-number={i + 1}
                aria-label={`第 ${i + 1} 章: ${ch.title}`}
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

        <motion.div
          key={validIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`aurora-reader-paper prose prose-invert max-w-none ${paperClass}`}
        >
          <h2 className="text-xl font-semibold text-nc-text mb-6">{chapter.title}</h2>
          {chapter.image && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={chapter.image} alt={chapter.title} className="w-full object-cover" />
            </div>
          )}
          <div className={`text-nc-text-secondary leading-[1.9] text-[15px] space-y-4 whitespace-pre-wrap ${titleFontClass}`}>
            {renderStoryContent(chapter.content)}
          </div>
        </motion.div>

        <div className="mt-12 flex items-center justify-between">
          {validIndex > 0 ? (
            <button
              onClick={() => goToChapter(validIndex - 1)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-subtle border border-white/[0.06] text-nc-text transition-all ${navClass}`}
            >
              <ChevronLeft className="w-4 h-4" /> 上一章
            </button>
          ) : <div />}

          {validIndex < story.chapters.length - 1 && (
            <button
              onClick={() => goToChapter(validIndex + 1)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-subtle border border-white/[0.06] text-nc-text transition-all ${navClass}`}
            >
              下一章 <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
