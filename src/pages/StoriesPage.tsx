import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { stories } from '@/data/stories';
import { Link } from 'react-router';
import { ArrowRight, BookOpen } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import RotatingImage from '@/components/RotatingImage';
import '../styles/stories-index.css'
import { getLatestReadingProgress } from '@/lib/readingState';

function getStoryCovers(storyId: string): string[] {
  const coverMap: Record<string, string[]> = {
    'mia-world': ['/story-mia-world-1.jpg'],
    'fox-penguin': ['/story-fox-penguin.jpg'],
    'agi-land': ['/story-agi-land.jpg'],
    'zhenhai-refining': ['/story-zhenhai-refining.png'],
    'little-girl-in-giant-country': ['/story-miia-dream-generated.png'],
  };
  return coverMap[storyId] || [`/story-${storyId}.jpg`];
}

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
                  <div className="story-card-footer p-4 flex items-center justify-between">
                    <span className="flex items-center text-xs text-nc-text-muted">
                      <span className="story-theme-dot" style={{ backgroundColor: getStoryDotColor(story.id) }} />
                      {story.chapterCount ?? story.chapters.length} 章节
                    </span>
                    <ArrowRight className="story-card-arrow w-4 h-4 text-nc-text-muted group-hover:text-nc-cyan transition-all" />
                  </div>
                </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
