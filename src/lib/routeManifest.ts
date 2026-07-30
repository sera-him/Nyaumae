export type RouteDomain = 'root' | 'world' | 'characters' | 'stories' | 'miia' | 'math' | 'playground' | 'api' | 'chat' | 'settings';

export interface RouteInfo {
  canonical: string;
  domain: RouteDomain;
  kind: 'page' | 'section' | 'detail' | 'reader';
  label?: string;
}

const canonicalRoutes: Record<string, RouteInfo> = {
  '/': { canonical: '/', domain: 'root', kind: 'page', label: '首页' },
  '/world/overview': { canonical: '/world/overview', domain: 'world', kind: 'section', label: '世界概览' },
  '/world/qet': { canonical: '/world/qet', domain: 'world', kind: 'section', label: 'QET选拔' },
  '/world/timeline': { canonical: '/world/timeline', domain: 'world', kind: 'section', label: '编年史' },
  '/world/organizations': { canonical: '/world/organizations', domain: 'world', kind: 'section', label: '组织机构' },
  '/world/settings': { canonical: '/world/settings', domain: 'world', kind: 'section', label: '世界设定' },
  '/world/dictionary': { canonical: '/world/dictionary', domain: 'world', kind: 'section', label: '词典与诗歌' },
  '/world/prime-focus': { canonical: '/world/prime-focus', domain: 'world', kind: 'section', label: '未来线' },
  '/world/pacific-islands': { canonical: '/world/pacific-islands', domain: 'world', kind: 'section', label: '西太平洋诸岛国' },
  '/characters/all': { canonical: '/characters/all', domain: 'characters', kind: 'section', label: '全部角色' },
  '/characters/mia-family': { canonical: '/characters/mia-family', domain: 'characters', kind: 'section', label: 'M/I/A 家族' },
  '/characters/zhehua': { canonical: '/characters/zhehua', domain: 'characters', kind: 'section', label: '哲华系' },
  '/characters/yin': { canonical: '/characters/yin', domain: 'characters', kind: 'section', label: '因派系' },
  '/characters/delansi': { canonical: '/characters/delansi', domain: 'characters', kind: 'section', label: '德澜思拓' },
  '/characters/grownup-country': { canonical: '/characters/grownup-country', domain: 'characters', kind: 'section', label: '大人国篇' },
  '/characters/other': { canonical: '/characters/other', domain: 'characters', kind: 'section', label: '其他' },
  '/stories': { canonical: '/stories', domain: 'stories', kind: 'page', label: '故事目录' },
  '/miia/world': { canonical: '/miia/world', domain: 'miia', kind: 'section', label: '咪呀的世界' },
  '/miia/math': { canonical: '/miia/math', domain: 'miia', kind: 'section', label: '数学笔记' },
  '/miia/poems': { canonical: '/miia/poems', domain: 'miia', kind: 'section', label: '诗歌碎片' },
  '/math/fsiii': { canonical: '/math/fsiii', domain: 'math', kind: 'section', label: 'FSIII 排名' },
  '/math/fla': { canonical: '/math/fla', domain: 'math', kind: 'section', label: 'PEMS-L FLA' },
  '/math/height-weight': { canonical: '/math/height-weight', domain: 'math', kind: 'section', label: '身高体重模型' },
  '/playground/games': { canonical: '/playground/games', domain: 'playground', kind: 'section', label: '可玩游戏' },
  '/playground/games/cat-machine': { canonical: '/playground/games/cat-machine', domain: 'playground', kind: 'detail', label: '猫咪机' },
  '/playground/rules': { canonical: '/playground/rules', domain: 'playground', kind: 'section', label: '规则说明' },
  '/playground/scratch': { canonical: '/playground/scratch', domain: 'playground', kind: 'section', label: 'Scratch 小游戏' },
  '/api': { canonical: '/api', domain: 'api', kind: 'page', label: 'API 目录' },
  '/chat': { canonical: '/chat', domain: 'chat', kind: 'page', label: '星海甜梦舱' },
  '/settings/ai': { canonical: '/settings/ai', domain: 'settings', kind: 'page', label: 'AI 设置' },
};

const aliasMap: Record<string, string> = {
  '/world': '/world/overview',
  '/characters': '/characters/all',
  '/miia': '/miia/world',
  '/math': '/math/fsiii',
  '/settings': '/settings/ai',
  '/playground': '/playground/games',
  '/fsiii': '/math/fsiii',
  '/world/overload': '/world/settings',
  '/playground/combo-chess': '/playground/games/compound-chess',
  '/playground/cat-machine': '/playground/games/cat-machine',
  '/playground/box-duel': '/playground/games/box-battle',
  '/playground/super24': '/playground/games/super-24',
  '/playground/skill-ttt': '/playground/games/skill-tic-tac-toe',
  '/playground/hell-maze': '/playground/games/hell-maze-vi',
  '/playground/three-holes': '/playground/games/cunning-rabbit',
  '/playground/cat-mouse-mystery': '/playground/rules/cat-mouse',
  '/playground/fractal-war': '/playground/games/fractal-echo',
  '/playground/neural': '/playground/games/neural-clash',
  '/playground/neural-echo': '/playground/games/neural-echo',
  '/playground/quiz': '/playground/games/quiz',
  '/playground/problems': '/playground/games/quiz',
  '/playground/more': '/playground/scratch',
  '/playground/chess': '/playground/games/compound-chess',
  '/playground/space': '/playground/games/stellar',
};

const knownCharacterIds = new Set<string>();
const knownProviderIds = new Set([
  'deepseek', 'openai', 'claude', 'gemini', 'copilot', 'glm', 'mimo',
  'qwen', 'moonshot', 'baichuan', 'ernie', 'minimax', 'stepfun', 'coze',
  'groq', 'perplexity', 'opencode',
]);

const playgroundItems: Record<string, { category: 'games' | 'rules' | 'scratch' }> = {
  'cat-machine': { category: 'games' },
  'stellar': { category: 'games' },
  'compound-chess': { category: 'games' },
  'box-battle': { category: 'games' },
  'super-24': { category: 'games' },
  'skill-tic-tac-toe': { category: 'games' },
  'hell-maze-vi': { category: 'games' },
  'cunning-rabbit': { category: 'games' },
  'quiz': { category: 'games' },
  'fractal-echo': { category: 'games' },
  'neural-echo': { category: 'games' },
  'neural-clash': { category: 'games' },
  'cat-mouse': { category: 'rules' },
  'dont-touch-cat-2': { category: 'scratch' },
  'knife-vs-archer': { category: 'scratch' },
  'royal-chess': { category: 'scratch' },
  'number-klotski': { category: 'scratch' },
  'super-brain': { category: 'scratch' },
  'red-vs-blue': { category: 'scratch' },
  'kitten-world-1': { category: 'scratch' },
  'welcome-to-1v1': { category: 'scratch' },
  'cat-mouse-38': { category: 'scratch' },
  'honeycomb-maze': { category: 'scratch' },
  'reinforcement-simulator': { category: 'scratch' },
};

const worldSections = new Set(['overview', 'qet', 'timeline', 'organizations', 'settings', 'dictionary', 'pacific-islands', 'prime-focus']);
const miiaSections = new Set(['world', 'math', 'poems']);
const mathSections = new Set(['fsiii', 'fla', 'height-weight']);
const characterFilters = new Set(['all', 'mia-family', 'zhehua', 'yin', 'delansi', 'grownup-country', 'other']);

export function isKnownWorldSection(s: string): boolean {
  return worldSections.has(s);
}

export function isKnownMiiaSection(s: string): boolean {
  return miiaSections.has(s);
}

export function isKnownMathSection(s: string): boolean {
  return mathSections.has(s);
}

export function isKnownCharacterFilter(s: string): boolean {
  return characterFilters.has(s);
}

export function isKnownCharacterId(id: string): boolean {
  return knownCharacterIds.has(id);
}

export function isKnownProviderId(id: string): boolean {
  return knownProviderIds.has(id);
}

export function isKnownPlaygroundItem(id: string): boolean {
  return id in playgroundItems;
}

export function getPlaygroundItemCategory(id: string): 'games' | 'rules' | 'scratch' | null {
  return playgroundItems[id]?.category ?? null;
}

export function resolveAlias(pathname: string): string | null {
  return aliasMap[pathname] ?? null;
}

export function getCanonicalInfo(pathname: string): RouteInfo | null {
  return canonicalRoutes[pathname] ?? null;
}

export function exportRouteManifest(): Record<string, RouteInfo> {
  return { ...canonicalRoutes };
}

export function initializeCharacterIds(ids: string[]): void {
  ids.forEach(id => knownCharacterIds.add(id));
}
