import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { stories } from '@/data/stories';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, Shuffle } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import RotatingImage from '@/components/RotatingImage';
import '../styles/stories-index.css'
import { getLatestReadingProgress, getReadingProgressMap } from '@/lib/readingState';
import { getStoryCovers } from '@/data/storyCovers';

function getStoryThemeClass(storyId: string): string {
  const map: Record<string, string> = {
    'mia-world': 'story-card-mia',
    'fox-penguin': 'story-card-ocean',
    'zhenhai-refining': 'story-card-zhenhai',
    'agi-land': 'story-card-agi',
    'little-girl-in-giant-country': 'story-card-giant',
  };
  return map[storyId] || '';
}

function getStoryDotColor(storyId: string): string {
  const map: Record<string, string> = {
    'mia-world': '#b9a0ff',
    'fox-penguin': '#56e8dc',
    'zhenhai-refining': '#d59a55',
    'agi-land': '#e9bf72',
    'little-girl-in-giant-country': '#93c9ff',
  };
  return map[storyId] || '#ff8fc7';
}

export default function StoriesPage() {
  const { ref, isVisible } = useScrollReveal();
  const latestProgress = getLatestReadingProgress();
  const progressMap = getReadingProgressMap();
  const totalChapters = stories.reduce((sum, story) => sum + (story.chapterCount ?? story.chapters.length), 0);
  // Stable per visit: one random chapter door into the library.
  const randomTarget = useMemo(() => {
    const story = stories[Math.floor(Math.random() * stories.length)];
    const count = story.chapterCount ?? story.chapters.length;
    const chapter = 1 + Math.floor(Math.random() * count);
    return { story, chapter, href: `/stories/${story.id}/chapters/${chapter}` };
  }, []);

  return (
    <div className="aurora-ui aurora-generic-page stories-aurora-page" data-aurora-accent="stories">
      <section className="aurora-generic-inner">
        <div ref={ref} className="aurora-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="aurora-simple-hero"
          >
            <p className="aurora-eyebrow">03 / STORY DIRECTORY</p>
            <h1 className="aurora-title">故事章节</h1>
            <p className="aurora-lead">
              {stories.length} 个叙事宇宙，等待神经连接
            </p>
          </motion.div>

          {latestProgress && (
            <Link to={latestProgress.href} className="story-continue-card" aria-label={`继续阅读${latestProgress.storyTitle}，${latestProgress.chapterTitle}`}>
              <span><BookOpen /></span>
              <div><small>CONTINUE READING / 继续阅读</small><strong>{latestProgress.storyTitle}</strong><p>{latestProgress.chapterTitle}</p></div>
              <ArrowRight />
            </Link>
          )}

          <h2 className="sr-only">故事目录</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story, i) => {
              const covers = getStoryCovers(story.id);

              return (
                <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <Link
                  to={`/stories/${story.id}`}
                  className={`story-aurora-card motion-signal-card group ${getStoryThemeClass(story.id)}`}
                  data-motion-interactive="true"
                >
                  <div className="story-motion-cover aspect-video relative overflow-hidden bg-nc-bg">
                    {covers.length > 1 ? (
                      <div className="absolute inset-0">
                        <RotatingImage
                          localImages={covers}
                          alt={story.title}
                          interval={4000}
                          containerClassName="w-full h-full"
                          className="group-hover:scale-105 transition-transform duration-500"
                          remoteFirst={false}
                        />
                      </div>
                    ) : (
                      <SmartImage
                        localSrc={covers[0]}
                        alt={story.title}
                        containerClassName="absolute inset-0"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-nc-bg via-nc-bg/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-nc-text mb-1">{story.title}</h3>
                      {story.subtitle && (
                        <p className="text-sm text-nc-text-secondary">{story.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="story-card-footer p-4 flex items-center justify-between gap-3">
                    <span className="flex items-center text-xs text-nc-text-muted shrink-0">
                      <span className="story-theme-dot" style={{ backgroundColor: getStoryDotColor(story.id) }} />
                      {story.chapterCount ?? story.chapters.length} 章节
                    </span>
                    {progressMap[story.id] && (
                      <span className="story-card-progress" title={`读到：${progressMap[story.id].chapterTitle}`}>
                        读到 {progressMap[story.id].chapterTitle}
                      </span>
                    )}
                    <ArrowRight className="story-card-arrow w-4 h-4 text-nc-text-muted group-hover:text-nc-cyan transition-all shrink-0" />
                  </div>
                </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="stories-footer-band">
            <div className="stories-footer-stat">
              <small>UNIVERSES / 叙事宇宙</small>
              <strong>{stories.length}</strong>
            </div>
            <div className="stories-footer-stat">
              <small>CHAPTERS / 总章节</small>
              <strong>{totalChapters}</strong>
            </div>
            <Link to={randomTarget.href} className="stories-random-card" aria-label={`随机一章：${randomTarget.story.title} 第 ${randomTarget.chapter} 章`}>
              <Shuffle />
              <div><small>SERENDIPITY / 随机一章</small><strong>{randomTarget.story.title}</strong><p>第 {randomTarget.chapter} 章，随手翻开</p></div>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
