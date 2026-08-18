import { useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  getPlaygroundItemCategory,
  getPlaygroundItemLabel,
  getProviderLabel,
  isKnownCharacterFilter,
  isKnownPlaygroundItem,
  isKnownProviderId,
  isKnownMathSection,
  isKnownMiiaSection,
  isKnownWorldSection,
  resolveAlias,
} from '@/lib/routeManifest';
import { characters } from '@/data/characters';
import { extraCharacters } from '@/data/extraCharacters';
import { stories } from '@/data/stories';

const SITE_NAME = 'Neural Connection';
const SITE_TITLE = 'Neural Connection — nyaumæ 的故事宇宙';
const DEFAULT_DESCRIPTION = '由 nyaumæ 创作的故事宇宙，收录长篇故事、角色档案、世界观设定、可玩游戏、数学实验与创作工具。';

interface PageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex?: boolean;
}

const WORLD_SECTION_LABELS: Record<string, string> = {
  overview: '世界概览',
  qet: 'QET选拔',
  timeline: '编年史',
  organizations: '组织机构',
  settings: '世界设定',
  dictionary: '词典与诗歌',
  'prime-focus': '未来线',
  'pacific-islands': '西太平洋诸岛国',
};

const MIIA_SECTION_LABELS: Record<string, string> = {
  world: '咪呀的世界',
  math: '咪呀的数学笔记',
  poems: '咪呀的诗歌碎片',
};

const MATH_SECTION_LABELS: Record<string, string> = {
  fsiii: 'FSIII 排名',
  fla: 'PEMS-L FLA',
  'height-weight': '身高体重模型',
};

const CHARACTER_FILTER_LABELS: Record<string, string> = {
  'mia-family': 'M/I/A 家族',
  zhehua: '哲华系',
  yin: '因派系',
  delansi: '德澜思拓',
  'grownup-country': '大人国篇',
  other: '其他角色',
};

const charactersById = new Map([...characters, ...extraCharacters].map((character) => [character.id, character]));

function page(title: string, description: string, canonicalPath: string): PageMetadata {
  return {
    title: `${title} — ${SITE_NAME}`,
    description,
    canonicalPath,
  };
}

function normalizePath(pathname: string): string {
  const withoutTrailingSlash = pathname.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function isPositiveInteger(value: string | undefined): value is string {
  return Boolean(value && /^[1-9]\d*$/.test(value));
}

function getStoryMetadata(canonicalPath: string): PageMetadata {
  const segments = canonicalPath.split('/').filter(Boolean);
  const storyId = segments[1];
  const story = stories.find((entry) => entry.id === storyId);
  if (!story) return notFound(canonicalPath);

  const storyTitle = `《${story.title}》`;
  if (segments.length === 2) {
    return page(
      `${story.title}｜故事阅读`,
      `阅读 ${storyTitle}${story.subtitle ? `：${story.subtitle}` : ''}。`,
      canonicalPath,
    );
  }

  let partId: string | undefined;
  let chapterId: string | undefined;
  if (segments.length === 4 && segments[2] === 'chapters') {
    chapterId = segments[3];
  } else if (segments.length === 4 && segments[2] === 'parts') {
    partId = segments[3];
  } else if (segments.length === 6 && segments[2] === 'parts' && segments[4] === 'chapters') {
    partId = segments[3];
    chapterId = segments[5];
  } else {
    return notFound(canonicalPath);
  }

  if ((partId && !isPositiveInteger(partId)) || (chapterId && !isPositiveInteger(chapterId))) {
    return notFound(canonicalPath);
  }

  if (!chapterId) {
    if (!story.contentSource && partId) return notFound(canonicalPath);
    if (story.contentSource && story.chapterCount && partId && Number(partId) > story.chapterCount) {
      return notFound(canonicalPath);
    }
    return page(`${story.title}｜故事阅读`, `阅读 ${storyTitle}${story.subtitle ? `：${story.subtitle}` : ''}。`, canonicalPath);
  }

  const chapterNumber = Number(chapterId);
  if (!story.contentSource) {
    if (partId || chapterNumber > story.chapters.length) return notFound(canonicalPath);
    const chapter = story.chapters[chapterNumber - 1];
    return page(
      `${story.title}｜${chapter.title}`,
      `阅读 ${storyTitle}第 ${chapterNumber} 章「${chapter.title}」。`,
      canonicalPath,
    );
  }

  if (story.chapterCount && (chapterNumber > story.chapterCount || (partId && Number(partId) > story.chapterCount))) {
    return notFound(canonicalPath);
  }

  return page(
    `${story.title}｜第 ${chapterNumber} 章`,
    `阅读 ${storyTitle}第 ${chapterNumber} 章${partId ? `（第 ${partId} 篇）` : ''}。`,
    canonicalPath,
  );
}

function getPlaygroundMetadata(canonicalPath: string): PageMetadata {
  const segments = canonicalPath.split('/').filter(Boolean);
  if (segments.length === 2) {
    if (segments[1] !== 'games' && segments[1] !== 'scratch') return notFound(canonicalPath);
    const category = segments[1] === 'scratch' ? 'Scratch 小游戏' : '游戏实验场';
    return page(category, `进入 Neural Connection ${category}，探索规则、概率与互动体验。`, canonicalPath);
  }

  if (segments.length !== 3 || (segments[1] !== 'games' && segments[1] !== 'scratch')) {
    return notFound(canonicalPath);
  }

  const category = segments[1];
  const itemId = segments[2];
  const itemCategory = getPlaygroundItemCategory(itemId);
  const itemLabel = getPlaygroundItemLabel(itemId);
  if (!isKnownPlaygroundItem(itemId) || !itemLabel || itemCategory !== category) {
    return notFound(canonicalPath);
  }

  const categoryLabel = category === 'scratch' ? 'Scratch 小游戏' : '游戏实验场';
  return page(
    `${itemLabel}｜${categoryLabel}`,
    `在 Neural Connection ${categoryLabel}体验「${itemLabel}」。`,
    canonicalPath,
  );
}

function getPageMetadata(pathname: string, search = ''): PageMetadata {
  const normalizedPath = normalizePath(pathname);
  const redirectedPath = normalizedPath === '/cat-mouse'
    ? '/playground/games/cat-mouse'
    : normalizedPath === '/neural-clash'
      ? '/playground/games/neural-clash'
      : normalizedPath;
  const alias = resolveAlias(redirectedPath);
  const canonicalPath = normalizePath(alias ?? redirectedPath);

  if (canonicalPath === '/') {
    return {
      title: SITE_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonicalPath,
    };
  }

  if (canonicalPath === '/world/overview') {
    return page(
      '世界观',
      '探索 Neural Connection 的世界观：编年史、组织机构、世界设定、QET 选拔、词典与未来线。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/world/')) {
    const section = canonicalPath.slice('/world/'.length);
    if (!isKnownWorldSection(section)) return notFound(canonicalPath);
    return page(
      WORLD_SECTION_LABELS[section] ?? '世界观',
      '探索 Neural Connection 的世界观：编年史、组织机构、世界设定、QET 选拔、词典与未来线。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/characters') {
    const requestedFilter = new URLSearchParams(search).get('group') ?? '';
    const filterLabel = CHARACTER_FILTER_LABELS[requestedFilter];
    const canonicalWithFilter = filterLabel ? `/characters?group=${encodeURIComponent(requestedFilter)}` : '/characters';
    return page(
      filterLabel ? `${filterLabel}｜角色档案` : '角色档案',
      filterLabel
        ? `浏览 Neural Connection 的${filterLabel}角色档案与关系设定。`
        : '浏览 Neural Connection 的37个意识体角色档案，了解 M/I/A 家族、哲华系、因派系、德澜思拓与《大人国的小女孩》角色群。',
      canonicalWithFilter,
    );
  }

  if (canonicalPath.startsWith('/characters/')) {
    const id = canonicalPath.slice('/characters/'.length);
    if (isKnownCharacterFilter(id)) {
      return page(
        `${CHARACTER_FILTER_LABELS[id] ?? '角色档案'}｜角色档案`,
        `浏览 Neural Connection 的${CHARACTER_FILTER_LABELS[id] ?? '角色'}档案与关系设定。`,
        id === 'all' ? '/characters' : `/characters?group=${encodeURIComponent(id)}`,
      );
    }
    const character = charactersById.get(id);
    if (!character) return notFound(canonicalPath);
    const role = 'title' in character && character.title
      ? character.title
      : 'category' in character
        ? character.category
        : '角色';
    return page(
      `${character.name}｜角色档案`,
      `阅读 ${character.name} 的角色档案：${role}。${character.bio}`,
      canonicalPath,
    );
  }

  if (canonicalPath === '/stories') {
    return page(
      '故事目录',
      '阅读 Neural Connection 的 5 个叙事宇宙与24+诗歌碎片，从星界馆的午后到大人国的三十天，进入不同时间流速的故事。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/stories/')) {
    return getStoryMetadata(canonicalPath);
  }

  if (canonicalPath === '/miia/world') {
    return page(
      '咪呀的世界',
      '进入咪呀的内心空间，阅读咪呀的世界、数学笔记与诗歌碎片，感受一个二年级生对存在与被爱的温柔质问。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/miia/')) {
    const section = canonicalPath.slice('/miia/'.length);
    if (!isKnownMiiaSection(section)) return notFound(canonicalPath);
    return page(
      MIIA_SECTION_LABELS[section] ?? '咪呀空间',
      '进入咪呀的内心空间，阅读咪呀的世界、数学笔记与诗歌碎片，感受一个二年级生对存在与被爱的温柔质问。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/math/fsiii') {
    return page(
      '数学模型',
      '查看 FSIII 排名、PEMS-L FLA 与身高体重模型，用公式和数据理解 Neural Connection 中的认知体系。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/math/')) {
    const section = canonicalPath.slice('/math/'.length);
    if (!isKnownMathSection(section)) return notFound(canonicalPath);
    return page(
      MATH_SECTION_LABELS[section] ?? '数学模型',
      '查看 FSIII 排名、PEMS-L FLA 与身高体重模型，用公式和数据理解 Neural Connection 中的认知体系。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/playground/games' || canonicalPath === '/playground/scratch' || canonicalPath.startsWith('/playground/')) {
    return getPlaygroundMetadata(canonicalPath);
  }

  if (canonicalPath === '/api') {
    return page(
      'API 目录',
      '查看 Neural Connection 的模型接口参考与供应商说明，并前往 AI 设置配置自己的模型连接。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/api/')) {
    const providerId = canonicalPath.slice('/api/'.length);
    if (providerId.includes('/') || !isKnownProviderId(providerId)) return notFound(canonicalPath);
    const providerLabel = getProviderLabel(providerId);
    if (!providerLabel) return notFound(canonicalPath);
    return page(
      `${providerLabel} API 参考`,
      `查看 ${providerLabel} 的模型接口、端点与配置说明。`,
      canonicalPath,
    );
  }

  if (
    canonicalPath === '/chat'
    || canonicalPath.startsWith('/chat/')
  ) {
    return page(
      'AI 对话',
      '进入 Neural Connection AI 对话空间，与角色交流，选择不同的聊天场景与模型配置。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/settings/ai') {
    return page(
      'AI 设置',
      '配置 Neural Connection 的 AI 模型、供应商、隐私与本地对话选项。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/codex') {
    return page(
      '全站搜索｜Neural Connection',
      '统一搜索角色、章节正文、词典、人物关系、世界设定、数学资料与游戏内容。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/nctb') {
    return page(
      'NCTB 认知实验室',
      '十个认知维度、完整标准考试、可恢复进度和能力图谱。结果用于个人探索，不替代医疗、心理或教育诊断。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/analytics') {
    return page(
      '数据统计',
      '查看 Neural Connection 的本机浏览时间、内容分布、搜索记录、浏览路径与可导入导出的本地存档。',
      canonicalPath,
    );
  }

  return notFound(canonicalPath);
}

function notFound(canonicalPath: string): PageMetadata {
  return {
    title: '页面未找到 — Neural Connection',
    description: '这条内容路径不存在。请返回首页，或按 Ctrl+K 打开全站搜索。',
    canonicalPath,
    noIndex: true,
  };
}

function upsertMeta(attribute: 'name' | 'property', value: string, content: string): void {
  const selector = `meta[${attribute}="${value}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function getCanonicalUrl(pathname: string): string {
  // This app intentionally uses HashRouter. Keep the route in the canonical
  // URL's hash so metadata never advertises a clean path that the server would
  // serve as the homepage instead of the requested client-side route.
  const routePath = pathname === '/' ? '/' : pathname;
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = `#${routePath}`;
  return url.toString();
}

export default function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const metadata = getPageMetadata(normalizePath(location.pathname), location.search);
    const canonicalUrl = getCanonicalUrl(metadata.canonicalPath);

    document.title = metadata.title;
    upsertMeta('name', 'description', metadata.description);
    upsertMeta('property', 'og:title', metadata.title);
    upsertMeta('property', 'og:description', metadata.description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', metadata.title);
    upsertMeta('name', 'twitter:description', metadata.description);
    upsertMeta('name', 'robots', metadata.noIndex ? 'noindex,follow' : 'index,follow');
    upsertCanonical(canonicalUrl);
  }, [location.pathname, location.search]);

  return null;
}
