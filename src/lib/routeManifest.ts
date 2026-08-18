export type RouteDomain = 'root' | 'world' | 'characters' | 'stories' | 'miia' | 'math' | 'playground' | 'api' | 'chat' | 'settings' | 'codex' | 'analytics';

export interface RouteInfo {
  canonical: string;
  domain: RouteDomain;
  kind: 'page' | 'section' | 'detail' | 'reader';
  label?: string;
}

export interface RouteDirectoryItem {
  label: string;
  to: string;
}

export interface RouteDirectoryGroup {
  id: 'stories' | 'characters' | 'world' | 'miia' | 'math' | 'playground' | 'ai' | 'other';
  root: string;
  label: string;
  caption: string;
  description: string;
  items: RouteDirectoryItem[];
}

// API remains a routable reference surface, but it is never part of the site's
// editorial navigation or the homepage directory. Keep this rule here so a
// future route/group cannot accidentally promote API back into either surface.
const NAVIGATION_EXCLUDED_DOMAINS: ReadonlySet<RouteDomain> = new Set(['api']);
const NAVIGATION_EXCLUDED_PREFIXES = ['/api'];

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
  '/characters': { canonical: '/characters', domain: 'characters', kind: 'section', label: '全部角色' },
  '/characters?group=mia-family': { canonical: '/characters?group=mia-family', domain: 'characters', kind: 'section', label: 'M/I/A 家族' },
  '/characters?group=zhehua': { canonical: '/characters?group=zhehua', domain: 'characters', kind: 'section', label: '哲华系' },
  '/characters?group=yin': { canonical: '/characters?group=yin', domain: 'characters', kind: 'section', label: '因派系' },
  '/characters?group=delansi': { canonical: '/characters?group=delansi', domain: 'characters', kind: 'section', label: '德澜思拓' },
  '/characters?group=grownup-country': { canonical: '/characters?group=grownup-country', domain: 'characters', kind: 'section', label: '大人国篇' },
  '/characters?group=other': { canonical: '/characters?group=other', domain: 'characters', kind: 'section', label: '其他' },
  '/stories': { canonical: '/stories', domain: 'stories', kind: 'page', label: '故事目录' },
  '/stories/mia-world': { canonical: '/stories/mia-world', domain: 'stories', kind: 'detail', label: "M/I/As' World" },
  '/stories/fox-penguin': { canonical: '/stories/fox-penguin', domain: 'stories', kind: 'detail', label: '狐狸与企鹅的彩虹泡泡海' },
  '/stories/zhenhai-refining': { canonical: '/stories/zhenhai-refining', domain: 'stories', kind: 'detail', label: '镇海炼化录' },
  '/stories/agi-land': { canonical: '/stories/agi-land', domain: 'stories', kind: 'detail', label: 'AGI 应许之地' },
  '/stories/little-girl-in-giant-country': { canonical: '/stories/little-girl-in-giant-country', domain: 'stories', kind: 'detail', label: '大人国的小女孩' },
  '/miia/world': { canonical: '/miia/world', domain: 'miia', kind: 'section', label: '咪呀的世界' },
  '/miia/math': { canonical: '/miia/math', domain: 'miia', kind: 'section', label: '数学笔记' },
  '/miia/poems': { canonical: '/miia/poems', domain: 'miia', kind: 'section', label: '诗歌碎片' },
  '/math/fsiii': { canonical: '/math/fsiii', domain: 'math', kind: 'section', label: 'FSIII 排名' },
  '/math/fla': { canonical: '/math/fla', domain: 'math', kind: 'section', label: 'PEMS-L FLA' },
  '/math/height-weight': { canonical: '/math/height-weight', domain: 'math', kind: 'section', label: '身高体重模型' },
  '/playground/games': { canonical: '/playground/games', domain: 'playground', kind: 'section', label: '可玩游戏' },
  '/playground/games/cat-machine': { canonical: '/playground/games/cat-machine', domain: 'playground', kind: 'detail', label: '猫咪机' },
  '/playground/games/city-builder': { canonical: '/playground/games/city-builder', domain: 'playground', kind: 'detail', label: '建设城市' },
  '/playground/scratch': { canonical: '/playground/scratch', domain: 'playground', kind: 'section', label: 'Scratch 小游戏' },
  '/api': { canonical: '/api', domain: 'api', kind: 'page', label: 'API 目录' },
  '/chat': { canonical: '/chat', domain: 'chat', kind: 'page', label: '星海甜梦舱' },
  '/chat/ocean': { canonical: '/chat/ocean', domain: 'chat', kind: 'page', label: '星海甜梦 · 海洋' },
  '/chat/sweetdream': { canonical: '/chat/sweetdream', domain: 'chat', kind: 'page', label: '甜梦小屋 · 粉色' },
  '/chat/aurora': { canonical: '/chat/aurora', domain: 'chat', kind: 'page', label: '极光星语 · 极光' },
  '/settings/ai': { canonical: '/settings/ai', domain: 'settings', kind: 'page', label: 'AI 设置' },
  '/codex': { canonical: '/codex', domain: 'codex', kind: 'page', label: '全站搜索' },
  '/nctb': { canonical: '/nctb', domain: 'math', kind: 'page', label: 'NCTB 认知实验室' },
  '/analytics': { canonical: '/analytics', domain: 'analytics', kind: 'page', label: '数据统计' },
};

function normalizePathname(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return path || '/';
}

export function isNavigationExcluded(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (NAVIGATION_EXCLUDED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return true;
  }
  const route = canonicalRoutes[normalized];
  return Boolean(route && NAVIGATION_EXCLUDED_DOMAINS.has(route.domain));
}

function directoryItems(paths: string[]): RouteDirectoryItem[] {
  return paths.filter((to) => !isNavigationExcluded(to)).map((to) => {
    const route = canonicalRoutes[to];
    if (!route?.label) throw new Error(`Directory route is missing from the canonical manifest: ${to}`);
    return { label: route.label, to };
  });
}

export const ROOT_DIRECTORY_ITEMS: RouteDirectoryItem[] = directoryItems([
  '/settings/ai',
  '/codex',
  '/nctb',
]);

export const ROUTE_DIRECTORY_GROUPS: RouteDirectoryGroup[] = [
  {
    id: 'miia',
    root: '/miia',
    label: '咪呀',
    caption: 'MIIA',
    description: '咪呀的世界、数学笔记与诗歌',
    items: directoryItems(['/miia/world', '/miia/math', '/miia/poems']),
  },
  {
    id: 'world',
    root: '/world',
    label: '世界观',
    caption: 'WORLD',
    description: '世界设定、历史、组织与未来线',
    items: directoryItems([
      '/world/overview',
      '/world/qet',
      '/world/timeline',
      '/world/organizations',
      '/world/settings',
      '/world/dictionary',
      '/world/prime-focus',
      '/world/pacific-islands',
    ]),
  },
  {
    id: 'stories',
    root: '/stories',
    label: '故事',
    caption: 'STORIES',
    description: '五个故事世界与完整阅读目录',
    items: directoryItems([
      '/stories',
      '/stories/mia-world',
      '/stories/fox-penguin',
      '/stories/zhenhai-refining',
      '/stories/agi-land',
      '/stories/little-girl-in-giant-country',
    ]),
  },
  {
    id: 'characters',
    root: '/characters',
    label: '角色',
    caption: 'CHARACTERS',
    description: '角色档案、人物关系与阵营筛选',
    items: directoryItems([
      '/characters',
      '/characters?group=mia-family',
      '/characters?group=zhehua',
      '/characters?group=yin',
      '/characters?group=delansi',
      '/characters?group=grownup-country',
      '/characters?group=other',
    ]),
  },
  {
    id: 'math',
    root: '/math',
    label: '数学',
    caption: 'MATH',
    description: 'FSIII、FLA 与身高体重模型',
    items: directoryItems(['/math/fsiii', '/math/fla', '/math/height-weight']),
  },
  {
    id: 'playground',
    root: '/playground',
    label: '游戏',
    caption: 'PLAYGROUND',
    description: '可玩游戏与 Scratch 作品',
    items: directoryItems(['/playground/games', '/playground/scratch']),
  },
  {
    id: 'ai',
    root: '/chat',
    label: 'AI',
    caption: 'AI CHAT',
    description: '聊天空间、主题与 AI 设置',
    items: [
      ...directoryItems(['/chat', '/chat/ocean', '/chat/sweetdream', '/chat/aurora']),
      ...directoryItems(['/settings/ai']),
    ],
  },
  {
    id: 'other',
    root: '/codex',
    label: '其他',
    caption: 'OTHER',
    description: '全站搜索、认知实验与本机数据',
    items: directoryItems(['/codex', '/nctb', '/analytics']),
  },
];

// This is the single source consumed by the top bar, the expanded navigation
// panel, and the homepage directory. Add future public spaces to the groups
// above; API routes remain filtered even if they are ever listed by mistake.
export const NAVIGATION_GROUPS: RouteDirectoryGroup[] = ROUTE_DIRECTORY_GROUPS.filter(
  (group) => !isNavigationExcluded(group.root),
);

const aliasMap: Record<string, string> = {
  '/world': '/world/overview',
  '/miia': '/miia/world',
  '/math': '/math/fsiii',
  '/settings': '/settings/ai',
  '/playground': '/playground/games',
  '/sweetdream': '/chat/sweetdream',
  '/fsiii': '/math/fsiii',
  '/world/overload': '/world/settings',
  '/playground/combo-chess': '/playground/games/compound-chess',
  '/playground/cat-machine': '/playground/games/cat-machine',
  '/playground/box-duel': '/playground/games/box-battle',
  '/playground/super24': '/playground/games/super-24',
  '/playground/skill-ttt': '/playground/games/skill-tic-tac-toe',
  '/playground/hell-maze': '/playground/games/hell-maze-vi',
  '/playground/three-holes': '/playground/games/cunning-rabbit',
  '/playground/cat-mouse-mystery': '/cat-mouse',
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
const providerLabels: Record<string, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  claude: 'Anthropic Claude',
  gemini: 'Google Gemini',
  copilot: 'GitHub Copilot',
  glm: 'GLM（智谱）',
  mimo: 'MiMo',
  qwen: 'Qwen（通义千问）',
  moonshot: 'Moonshot（月之暗面）',
  baichuan: 'Baichuan（百川）',
  ernie: 'ERNIE（文心一言）',
  minimax: 'MiniMax',
  stepfun: 'StepFun（阶跃星辰）',
  coze: 'Coze（扣子）',
  groq: 'Groq',
  perplexity: 'Perplexity AI',
  opencode: 'OpenCode',
};
const knownProviderIds = new Set(Object.keys(providerLabels));

interface PlaygroundItem {
  category: 'games' | 'scratch';
  label: string;
}

const playgroundItems: Record<string, PlaygroundItem> = {
  'cat-machine': { category: 'games', label: '猫咪机' },
  'city-builder': { category: 'games', label: '建设城市' },
  stellar: { category: 'games', label: '星际战线 Stellar' },
  'compound-chess': { category: 'games', label: '复合象棋' },
  'box-battle': { category: 'games', label: '箱子对决' },
  'super-24': { category: 'games', label: '超级24点' },
  'skill-tic-tac-toe': { category: 'games', label: '技能井字棋' },
  'hell-maze-vi': { category: 'games', label: '地狱迷宫·VI' },
  'cunning-rabbit': { category: 'games', label: '狡兔三窟' },
  quiz: { category: 'games', label: '题目' },
  'fractal-echo': { category: 'games', label: '递归回响' },
  'neural-echo': { category: 'games', label: '神经回响' },
  'neural-clash': { category: 'games', label: '神经交锋' },
  'cat-mouse': { category: 'games', label: '猫鼠迷踪' },
  'dont-touch-cat-2': { category: 'scratch', label: '别碰另一只猫和边缘2' },
  'knife-vs-archer': { category: 'scratch', label: 'Knife V.S Archer' },
  'royal-chess': { category: 'scratch', label: '皇家战棋' },
  'number-klotski': { category: 'scratch', label: '数字华容道' },
  'super-brain': { category: 'scratch', label: '最强大脑' },
  'red-vs-blue': { category: 'scratch', label: '红蓝之战（毒圈模式）' },
  'kitten-world-1': { category: 'scratch', label: '小猫闯天下1' },
  'welcome-to-1v1': { category: 'scratch', label: 'welcome to 1v1' },
  'cat-mouse-38': { category: 'scratch', label: '猫捉老鼠38' },
  'honeycomb-maze': { category: 'scratch', label: '蜂巢迷宫' },
  'reinforcement-simulator': { category: 'scratch', label: '强化模拟器' },
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

export function getProviderLabel(id: string): string | null {
  return providerLabels[id] ?? null;
}

export function isKnownPlaygroundItem(id: string): boolean {
  return id in playgroundItems;
}

export function getPlaygroundItemCategory(id: string): 'games' | 'scratch' | null {
  return playgroundItems[id]?.category ?? null;
}

export function getPlaygroundItemLabel(id: string): string | null {
  return playgroundItems[id]?.label ?? null;
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
