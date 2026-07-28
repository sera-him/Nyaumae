export type ChapterButtonStyle = 'default' | 'bubble' | 'pill' | 'index' | 'process' | 'terminal';
export type PaperStyle = 'dark' | 'light-glass' | 'warm-paper' | 'dark-library' | 'diary';

export interface StoryThemeConfig {
  theme: string;
  coverImage: string;
  accentColor: string;
  chapterButtonStyle: ChapterButtonStyle;
  paperStyle: PaperStyle;
  bgTextureClass: string;
  titleFontClass: string;
}

const configs: Record<string, StoryThemeConfig> = {
  'mia-world': {
    theme: 'story-mia',
    coverImage: '/story-mia-world-1.jpg',
    accentColor: '#b9a0ff',
    chapterButtonStyle: 'index',
    paperStyle: 'dark-library',
    bgTextureClass: 'mia-star-bg',
    titleFontClass: 'font-serif-cn',
  },
  'fox-penguin': {
    theme: 'story-ocean',
    coverImage: '/fox-penguin-ch01.png',
    accentColor: '#56e8dc',
    chapterButtonStyle: 'bubble',
    paperStyle: 'light-glass',
    bgTextureClass: 'ocean-bg-bubbles',
    titleFontClass: '',
  },
  'zhenhai-refining': {
    theme: 'story-zhenhai',
    coverImage: '/story-zhenhai-refining.png',
    accentColor: '#d59a55',
    chapterButtonStyle: 'process',
    paperStyle: 'warm-paper',
    bgTextureClass: '',
    titleFontClass: 'font-song-cn',
  },
  'agi-land': {
    theme: 'story-agi',
    coverImage: '',
    accentColor: '#e9bf72',
    chapterButtonStyle: 'terminal',
    paperStyle: 'dark',
    bgTextureClass: 'agi-ring-bg',
    titleFontClass: 'font-mono',
  },
  'little-girl-in-giant-country': {
    theme: 'story-giant',
    coverImage: '/story-giant-part-1.png',
    accentColor: '#93c9ff',
    chapterButtonStyle: 'default',
    paperStyle: 'diary',
    bgTextureClass: '',
    titleFontClass: 'font-serif-cn',
  },
};

export function getStoryConfig(storyId: string): StoryThemeConfig {
  return configs[storyId] ?? {
    theme: 'stories',
    coverImage: '',
    accentColor: '#ff8fc7',
    chapterButtonStyle: 'default',
    paperStyle: 'dark',
    bgTextureClass: '',
    titleFontClass: '',
  };
}
