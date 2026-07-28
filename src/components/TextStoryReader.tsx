import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { renderStoryContent } from '@/lib/renderStoryContent';
import { emitRouteReady } from '@/lib/deepLinkCoordinator';
import { getStoryConfig } from '@/lib/storyThemeConfig';
import type { Story, StoryChapter } from '@/data/stories';

interface TextStoryPart {
  title: string;
  chapters: StoryChapter[];
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
    if (!line.startsWith('## ')) {
      if (currentChapter) currentChapter.lines.push(line);
      continue;
    }

    commitChapter();
    const title = line.slice(3).trim();

    if (/^第.+篇/.test(title)) {
      currentPart = { title, chapters: [] };
      parts.push(currentPart);
    } else if (/^(第.+章|尾声)/.test(title)) {
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

export default function TextStoryReader({ story }: TextStoryReaderProps) {
  const { partId, chapterId } = useParams<{ partId?: string; chapterId?: string }>();
  const navigate = useNavigate();
  const [parts, setParts] = useState<TextStoryPart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const config = getStoryConfig(story.id);
  const paperClass = getPaperClass(config.paperStyle);
  const navClass = getNavClass(config.chapterButtonStyle);

  useEffect(() => {
    emitRouteReady(`/stories/${story.id}`);
  }, [story.id]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(story.contentSource!, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((source) => {
        setParts(parseTextStory(source));
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError('正文暂时无法加载，请稍后重试。');
      });

    return () => controller.abort();
  }, [story.contentSource]);

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

  if (error) {
    return (
      <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
        <div className="aurora-container aurora-generic-inner max-w-[900px]">
          <Link to="/stories" className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回故事列表
          </Link>
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
        <div className="aurora-container aurora-generic-inner max-w-[900px]">
          <Link to="/stories" className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回故事列表
          </Link>
          <div className="flex items-center gap-2 text-nc-text-muted py-12">
            <LoaderCircle className="w-4 h-4 animate-spin" /> 正在载入正文…
          </div>
        </div>
      </div>
    );
  }

  if (validPartIndex === null || !part || validChapterIndex === null || !chapter) {
    return (
      <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
        <div className="aurora-container aurora-generic-inner max-w-[900px]">
          <Link to="/stories" className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回故事列表
          </Link>
          <div className="text-center py-12">
            <p className="text-nc-text-muted mb-4">未找到该章节</p>
            <Link to={`/stories/${story.id}/parts/1/chapters/1`} className="text-nc-cyan hover:underline">
              返回第一章
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aurora-ui aurora-generic-page story-reader-aurora" data-aurora-accent={config.theme}>
      <div className="aurora-container aurora-generic-inner max-w-[900px]">
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回故事列表
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aurora-reader-heading"
        >
          <h1 className="text-3xl font-bold text-nc-text mb-2">{story.title}</h1>
          {story.subtitle && <p className="text-nc-text-secondary">{story.subtitle}</p>}
        </motion.div>

        {story.video && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl shadow-black/20"
          >
            <video
              src={story.video}
              poster={story.videoPoster}
              controls
              playsInline
              preload="metadata"
              className="block max-h-[75vh] w-full bg-black object-contain"
              aria-label={`${story.title} 视频`}
            >
              您的浏览器暂不支持视频播放。
            </video>
          </motion.div>
        )}

        <>
          <div className="mb-4">
            <p className="text-xs font-mono uppercase tracking-widest text-nc-text-muted mb-2">篇目</p>
            <div className="aurora-tabs" role="tablist" aria-label="故事篇目">
              {parts.map((partItem, index) => (
                <button
                  key={partItem.title}
                  onClick={() => {
                    if (index !== validPartIndex) {
                      goToChapter(index, 0);
                    }
                  }}
                  role="tab"
                  aria-selected={validPartIndex === index}
                  className="aurora-tab"
                >
                  {partItem.title}
                </button>
              ))}
            </div>
          </div>

          {part && (
            <div className="mb-8">
              <p className="text-xs font-mono uppercase tracking-widest text-nc-text-muted mb-2">章节</p>
              <div className="aurora-tabs" role="tablist" aria-label="故事章节">
                {part.chapters.map((chapterItem, index) => (
                  <button
                    key={chapterItem.title}
                    onClick={() => {
                      if (index !== validChapterIndex || validPartIndex !== validPartIndex) {
                        goToChapter(validPartIndex, index);
                      }
                    }}
                    role="tab"
                    aria-selected={validChapterIndex === index}
                    className="aurora-tab"
                  >
                    {chapterItem.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chapter && (
            <motion.div
              key={`${validPartIndex}-${validChapterIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`aurora-reader-paper prose prose-invert max-w-none ${paperClass}`}
            >
              {partImage && (
                <img
                  src={partImage}
                  alt={`${part.title}插图`}
                  className="w-full aspect-video object-cover rounded-2xl border border-white/[0.08] mb-8 shadow-2xl shadow-black/20"
                />
              )}
              <p className="text-sm text-nc-text-muted mb-2">{part.title}</p>
              <h2 className="text-xl font-semibold text-nc-text mb-6">{chapter.title}</h2>
              <div className="font-serif-cn text-nc-text-secondary leading-[1.9] text-[15px] space-y-4 whitespace-pre-wrap">
                {renderStoryContent(chapter.content)}
              </div>
            </motion.div>
          )}

          <div className="mt-12 flex items-center justify-between">
            {hasPrevChapter ? (
              <button
                onClick={prevChapter}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-subtle border border-white/[0.06] text-nc-text transition-all ${navClass}`}
              >
                <ArrowLeft className="w-4 h-4" /> 上一章
              </button>
            ) : <div />}

            {hasNextChapter && (
              <button
                onClick={nextChapter}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-subtle border border-white/[0.06] text-nc-text transition-all ${navClass}`}
              >
                下一章 <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      </div>
    </div>
  );
}
