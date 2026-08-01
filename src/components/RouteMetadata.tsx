import { useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  isKnownMathSection,
  isKnownMiiaSection,
  isKnownWorldSection,
  resolveAlias,
} from '@/lib/routeManifest';

const SITE_NAME = 'Neural Connection';
const SITE_TITLE = 'Neural Connection — Nyaumæ的创意世界观';
const DEFAULT_DESCRIPTION = 'Neural Connection — 由Nyaumæ创作的个人创意世界观展示网站。包含37个意识体角色档案、4个长篇叙事、复合象棋、概率三子棋、Dadi Sapichi词典、AGI哲学探讨、感官过载体验等丰富内容。';

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

function getPageMetadata(pathname: string): PageMetadata {
  const alias = resolveAlias(pathname);
  const canonicalPath = normalizePath(alias ?? pathname);

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

  if (canonicalPath === '/characters/all') {
    return page(
      '角色档案',
      '浏览 Neural Connection 的37个意识体角色档案，了解 M/I/A 家族、哲华系、因派系、德澜思拓与《大人国的小女孩》角色群。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/characters/')) {
    return page(
      '角色档案',
      '浏览 Neural Connection 的37个意识体角色档案，了解 M/I/A 家族、哲华系、因派系、德澜思拓与《大人国的小女孩》角色群。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/stories') {
    return page(
      '故事目录',
      '阅读 Neural Connection 的4个长篇叙事与24+诗歌碎片，从星界馆的午后到大人国的三十天，进入不同时间流速的故事。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/stories/')) {
    return page(
      '故事阅读',
      '阅读 Neural Connection 的长篇叙事与诗歌碎片，让故事在时间流速错叠的角落里展开。',
      canonicalPath,
    );
  }

  if (canonicalPath === '/miia/world') {
    return page(
      '咪呀的世界',
      '进入咪呀的内心空间，阅读她的世界、数学笔记与诗歌碎片，感受一个二年级生对存在与被爱的温柔质问。',
      canonicalPath,
    );
  }

  if (canonicalPath.startsWith('/miia/')) {
    const section = canonicalPath.slice('/miia/'.length);
    if (!isKnownMiiaSection(section)) return notFound(canonicalPath);
    return page(
      MIIA_SECTION_LABELS[section] ?? '咪呀空间',
      '进入咪呀的内心空间，阅读她的世界、数学笔记与诗歌碎片，感受一个二年级生对存在与被爱的温柔质问。',
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

  if (
    canonicalPath === '/playground/games'
    || canonicalPath.startsWith('/playground/games/')
    || canonicalPath === '/playground/scratch'
    || canonicalPath.startsWith('/playground/scratch/')
    || canonicalPath === '/cat-mouse'
    || canonicalPath === '/neural-clash'
  ) {
    return page(
      '游戏实验场',
      '进入 Neural Connection 游戏实验场，体验复合象棋、技能井字棋、谜题与其他规则和概率交界处的小游戏。',
      canonicalPath === '/neural-clash' ? '/playground/games/neural-clash' : canonicalPath,
    );
  }

  if (canonicalPath === '/api' || canonicalPath.startsWith('/api/')) {
    return page(
      'API 目录',
      '查看 Neural Connection 的模型接口参考与供应商说明，并前往 AI 设置配置自己的模型连接。',
      canonicalPath,
    );
  }

  if (
    canonicalPath === '/chat'
    || canonicalPath.startsWith('/chat/')
    || canonicalPath === '/sweetdream'
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

  return notFound(canonicalPath);
}

function notFound(canonicalPath: string): PageMetadata {
  return {
    title: '页面未找到 — Neural Connection',
    description: '这条神经通路不存在。请返回首页，或按 Ctrl+K 打开全站搜索。',
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
  const appBasePath = window.location.hash.startsWith('#/')
    ? window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '')
    : '';
  const routePath = pathname === '/' ? '/' : pathname;
  const url = new URL(`${appBasePath}${routePath}`, window.location.origin);
  url.search = '';
  url.hash = '';
  return url.toString();
}

export default function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const metadata = getPageMetadata(normalizePath(location.pathname));
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
  }, [location.pathname]);

  return null;
}
