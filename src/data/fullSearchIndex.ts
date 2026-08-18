import { characters, zeroChar } from './characters';
import { ATTRIBUTE_DEFINITIONS } from '@/game/cityBuilder/model';
import { extraCharacters } from './extraCharacters';
import { stories } from './stories';
import { dictionary } from './dictionary';
import { poems, extraPoems, miiaStoryFragments, absurdNarrative, tinyWish, primeFocus, fosStory, gaoKaiStory } from './extraStories';
import { organizations, zhihuaClasses } from './organizations';
import { timelineEvents } from './timeline';
import { characterRelations, relationLabels } from './relationships';
import { chessPieces, chessSpecialRules } from './chess';
import {
  skillTicTacToeOverview,
  probabilityAlgorithm,
  spSystemRules,
  professions,
  activeSkills,
  lightningRodSystem,
} from './skillTicTacToe';
import {
  worldviewNotes,
  hypothesis,
  qetWritten,
  qetPractical,
  miyaCircle,
  muGuangPlan,
  xinyuanLog,
  autismFeatures,
  moralPrinciplesNote,
  lawValuesNote,
  moralPrinciples,
  nyaumaeismPrinciples,
} from './worldSettings';
import {
  miaWorldBackground,
  paradigmText,
  taskLens2025,
  rtoText,
  yearDayFragment,
  numberFragments,
  dreamPoem,
  badRabbitVersions,
  huaPoem,
  mimiAndMiiaPoem,
  diminutiveText,
  rainyDay,
  p2rDefinition,
  chessPieceTiers,
  chessDiamondWarning,
  mathFormulas,
  caregiverStress,
  fuShuYuStory,
  sheepsFull,
} from './fragments';
import { miiaTexts, miiaWish, miiaAgiLand, miiaAgiPoem, lilaAnalysis, mappingBlock } from './miiaTexts';
import { worldviewStats, regionFsiiiStats, fsiiiRankings, heightWeightModel, worldviewInfo } from './worldview';
import { LAND_ALLOCATION_META, LAND_ALLOCATION_SEARCH_TEXT } from './landAllocationPolicy';

export interface FullSearchItem {
  id: string;
  title: string;
  content: string;
  category: string;
  href: string;
  /** Raw textual units used by frequency analysis before search text flattening. */
  frequencySegments?: string[];
}

const items: FullSearchItem[] = [];

function cleanText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).replace(/\s+/g, ' ').trim();
  }
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(' · ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(cleanText).filter(Boolean).join(' · ');
  }
  return '';
}

const FREQUENCY_METADATA_KEYS = new Set([
  'id', 'key', 'slug', 'group', 'type', 'from', 'to',
  'color', 'accentcolor', 'backgroundcolor',
  'image', 'images', 'icon', 'src', 'href', 'url', 'path', 'route', 'poster', 'videoposter',
]);

function isTechnicalFrequencySegment(segment: string): boolean {
  return /^(?:from|via|to)-[a-z\d-]+(?:\s+(?:from|via|to)-[a-z\d-]+)*$/iu.test(segment)
    || /^#[\da-f]{3,8}$/iu.test(segment)
    || /^(?:https?:\/\/|\/)[^\s]+$/iu.test(segment)
    || /^[^\s]+\.(?:avif|gif|jpe?g|mp4|png|svg|webm|webp)(?:[?#].*)?$/iu.test(segment);
}

function collectFrequencySegments(value: unknown, key?: string): string[] {
  if (value == null || (key && FREQUENCY_METADATA_KEYS.has(key.toLocaleLowerCase('en-US')))) return [];
  if (typeof value === 'string') {
    return value
      .split(/\r?\n\s*/u)
      .map((segment) => segment.replace(/\s+/gu, ' ').trim())
      .filter((segment) => Boolean(segment) && !isTechnicalFrequencySegment(segment));
  }
  if (Array.isArray(value)) return value.flatMap((entry) => collectFrequencySegments(entry));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([entryKey, entryValue]) => collectFrequencySegments(entryValue, entryKey));
  }
  return [];
}

function add(id: string, title: unknown, content: unknown, category: string, href: string): void {
  const safeTitle = cleanText(title);
  const safeContent = cleanText(content);
  if (!safeTitle && !safeContent) return;
  items.push({
    id,
    title: safeTitle || safeContent.slice(0, 80),
    content: safeContent || safeTitle,
    category,
    href,
    frequencySegments: collectFrequencySegments(content),
  });
}

for (const character of [...characters, zeroChar]) {
  add(`char_${character.id}`, character.name, character, '角色', '#characters');
}

for (const character of extraCharacters) {
  add(`extra_char_${character.id}`, character.name, character, character.category === 'AI' ? '技能' : '角色', '#extra-characters');
}

for (const story of stories) {
  const chapterText = story.chapters.map((chapter, index) => `第 ${index + 1} 章 ${chapter.title} ${chapter.content}`).join(' ');
  add(`story_${story.id}`, story.title, `${story.subtitle ?? ''} ${chapterText}`, '故事', '#stories');
}

for (const entry of dictionary) {
  add(`dict_${entry.word}`, `Dadi Sapichi: ${entry.word}`, `${entry.word}: ${entry.meaning} ${(entry.tags ?? []).join(' ')}`, '词典', '#dictionary');
}

for (const entry of [...poems, ...extraPoems, ...miiaStoryFragments]) {
  add(`poem_${entry.title}`, entry.title, entry, '故事', '#extra-stories');
}

for (const [id, entry] of [
  ['absurd-narrative', absurdNarrative],
  ['tiny-wish', tinyWish],
  ['prime-focus', primeFocus],
  ['fos-story', fosStory],
  ['gao-kai-story', gaoKaiStory],
] as const) {
  add(`story_${id}`, typeof entry === 'object' && entry !== null && 'title' in entry ? entry.title : id, entry, '故事', '#extra-stories');
}

for (const [index, entry] of organizations.entries()) add(`org_${index}`, entry.name, entry, '设定', '#organizations');
for (const [index, entry] of zhihuaClasses.entries()) add(`class_${index}`, entry.name, entry, '设定', '#organizations');
for (const [index, event] of timelineEvents.entries()) add(`timeline_${index}`, event.title, event, '设定', '#timeline');
for (const relation of characterRelations) add(`relation_${relation.from}_${relation.to}`, relationLabels[relation.type], relation, '设定', '#character-network');

for (const piece of chessPieces) add(`chess_${piece.letter}`, `${piece.letter} ${piece.name}`, piece, '棋子', '#chess');
for (const [index, rule] of chessSpecialRules.entries()) add(`chess-rule_${index}`, rule, rule, '棋子', '#chess');
for (const [index, tier] of chessPieceTiers.entries()) add(`chess-tier_${index}`, typeof tier === 'object' && tier !== null && 'name' in tier ? tier.name : `棋子阶级 ${index + 1}`, tier, '棋子', '#chess');
add('chess-diamond-warning', '钻石警告', chessDiamondWarning, '棋子', '#chess');

add('skill-overview', skillTicTacToeOverview.title, skillTicTacToeOverview, '技能', '#skill-ttt');
add('skill-probability', '概率生成算法', probabilityAlgorithm, '技能', '#skill-ttt');
add('skill-sp-system', spSystemRules.title, spSystemRules, '技能', '#skill-ttt');
for (const profession of professions) add(`profession_${profession.name}`, profession.name, profession, '技能', '#skill-ttt');
for (const skill of activeSkills) add(`skill_${skill.name}`, skill.name, skill, '技能', '#skill-ttt');
for (const [index, rule] of lightningRodSystem.entries()) add(`lightning_${index}`, `闪电杆规则 ${index + 1}`, rule, '技能', '#skill-ttt');

const settingSources: Array<[string, string, unknown]> = [
  ['worldview-notes', '世界观说明', worldviewNotes],
  ['hypothesis', '世界观假说', hypothesis],
  ['qet-written', 'QET 笔试', qetWritten],
  ['qet-practical', 'QET 实践', qetPractical],
  ['miya-circle', '米雅朋友圈', miyaCircle],
  ['mu-guang-plan', '沐光计划', muGuangPlan],
  ['xinyuan-log', '心渊日志', xinyuanLog],
  ['autism-features', '感知特征', autismFeatures],
  ['moral-principles-note', '伦理原则说明', moralPrinciplesNote],
  ['law-values-note', '法律价值观', lawValuesNote],
  ['moral-principles', '道德原则', moralPrinciples],
  ['nyaumaeism-principles', 'Nyaumaeism 原则', nyaumaeismPrinciples],
];
for (const [id, title, content] of settingSources) add(`setting_${id}`, title, content, '设定', '#world-settings');

const fragmentSources: Array<[string, string, unknown, string]> = [
  ['mia-background', miaWorldBackground.title, miaWorldBackground, '#miia-world'],
  ['paradigm', 'Paradigm', paradigmText, '#miia-math-notes'],
  ['task-lens', 'TaskLens 2025', taskLens2025, '#miia-math-notes'],
  ['rto', 'RTO', rtoText, '#miia-math-notes'],
  ['year-day', 'Year Day', yearDayFragment, '#timeline'],
  ['number-fragments', '数字碎片', numberFragments, '#miia-math-notes'],
  ['dream-poem', '梦境诗', dreamPoem, '#extra-stories'],
  ['bad-rabbit', '坏兔子版本', badRabbitVersions, '#extra-stories'],
  ['hua-poem', '花诗', huaPoem, '#extra-stories'],
  ['mimi-miia-poem', '米迷与米娅', mimiAndMiiaPoem, '#extra-stories'],
  ['diminutive', 'Diminutive', diminutiveText, '#miia-math-notes'],
  ['rainy-day', '下雨天', rainyDay, '#extra-stories'],
  ['p2r', 'p₂r 定义', p2rDefinition, '#miia-math-notes'],
  ['math-formulas', '数学公式', mathFormulas, '#miia-math-notes'],
  ['caregiver-stress', '照护者压力', caregiverStress, '#world-settings'],
  ['fu-shu-yu', '复数域公主梦', fuShuYuStory, '#extra-stories'],
  ['sheeps-full', '羊了个羊', sheepsFull, '#extra-stories'],
];
for (const [id, title, content, href] of fragmentSources) add(`fragment_${id}`, title, content, '设定', href);

for (const text of miiaTexts) add(`miia_${text.id}`, text.title, text, '故事', '#miia-world');
add('miia-wish', '米娅的愿望', miiaWish, '故事', '#miia-world');
add('miia-agi-land', 'AGI Land', miiaAgiLand, '故事', '#miia-world');
add('miia-agi-poem', 'AGI 诗', miiaAgiPoem, '故事', '#miia-world');
add('miia-lila-analysis', 'Lila 分析', lilaAnalysis, '设定', '#miia-world');
add('miia-mapping', '映射区块', mappingBlock, '设定', '#miia-world');

for (const [index, entry] of worldviewStats.entries()) add(`worldview-stat_${index}`, entry.label, entry, '设定', '#worldview');
add('region-fsiii-stats', '区域 FSIII 统计', regionFsiiiStats, '设定', '#worldview');
for (const entry of fsiiiRankings) add(`fsiii_${entry.rank}`, entry.name, entry, '设定', '#math');
for (const [index, entry] of heightWeightModel.entries()) add(`height-weight_${index}`, `身高 ${entry.height}`, entry, '设定', '#math');
add('worldview-info', '世界观信息', worldviewInfo, '设定', '#worldview');
add('world-land-allocation', LAND_ALLOCATION_META.title, LAND_ALLOCATION_SEARCH_TEXT, '设定', '/world/settings');
add('mia-background-data', 'M/I/As World 背景', miaWorldBackground, '设定', '#miia-world');

const pageRecords: Array<[string, string, string, string]> = [
  ['page-home', '首页', 'Neural Connection Aurora Atlas 神经连接', '#hero'],
  ['page-world', '世界观', '世界档案 QET 时间线 组织机构 世界设定', '#worldview'],
  ['page-characters', '角色档案', '角色 补充角色 关系网络', '#characters'],
  ['page-stories', '故事章节', '故事 阅读器', '#stories'],
  ['page-miia', '米娅空间', '米娅的世界 数学笔记 诗歌碎片', '#miia-world'],
  ['page-math', '数学模型', 'FSIII 数学模型 排名系统', '#math'],
  ['page-playground', '游乐场', '游戏 规则 Scratch', '#problems'],
  ['page-settings', '设置与工具', '词典 Prime Focus', '#dictionary'],
];
for (const [id, title, content, href] of pageRecords) add(id, title, content, '页面', href);

const gameRecords: Array<[string, string, string, string]> = [
  ['game-cat-machine', '猫咪机', '九只猫 三层工位 换位 连锁 天赋 突发事件 模块升级', '/playground/games/cat-machine'],
  ['game-city-builder', '建设城市', `实时城市建设 默认3个AI 十二属性 彩色资源 地图规划 跨城项目 区域事件 竞争合作 排名 ${ATTRIBUTE_DEFINITIONS.map(({ label, role }) => `${label} ${role}`).join(' ')}`, '/playground/games/city-builder'],
  ['game-stellar', '星际战线 Stellar', '实时射击 十武器 Stellar Flow 弱点 切换武器', '/playground/games/stellar'],
  ['game-compound-chess', '复合象棋', '传统象棋 立体空间 相位变换 召唤单位', '/playground/games/compound-chess'],
  ['game-box-battle', '箱子对决', '26个箱子 参赛者 资本家 Deal or No Deal 出价 议价', '/playground/games/box-battle'],
  ['game-super-24', '超级24点', '数字 表达式 目标值 平方根 阶乘 幂运算', '/playground/games/super-24'],
  ['game-skill-tic-tac-toe', '技能井字棋', '概率三子棋 SP 技能 职业 落子概率 行动日志', '/playground/games/skill-tic-tac-toe'],
  ['game-hell-maze-vi', '地狱迷宫·VI', '六边形 蜂窝迷宫 全盲 左前右 布尔反馈', '/playground/games/hell-maze-vi'],
  ['game-cunning-rabbit', '狡兔三窟', '逻辑填格 兔子洞 每行每列每区 猞猁活动区', '/playground/games/cunning-rabbit'],
  ['game-fractal-echo', '递归回响', '分形回响 递归棋盘 同坐标广播 蓝方 橙方 入侵子棋盘', '/playground/games/fractal-echo'],
  ['game-neural-echo', '神经回响', '分支生长 剪枝 双人策略 神经网络', '/playground/games/neural-echo'],
  ['game-neural-clash', '神经交锋', 'Neural Clash 100节点 666突触 神经核 强化突触 脉冲', '/playground/games/neural-clash'],
  ['game-cat-mouse', '猫鼠迷踪', '非对称追逐 诱饵 真实气味 疾跑 复盘', '/playground/games/cat-mouse'],
  ['game-quiz', '题目', '烧脑挑战 填空 选择题 二维码 提交答案', '/playground/games/quiz'],
  ['scratch-dont-touch-cat-2', '别碰另一只猫和边缘2', 'Scratch 小游戏', '/playground/scratch/dont-touch-cat-2'],
  ['scratch-knife-vs-archer', 'Knife V.S Archer', 'Scratch 小游戏', '/playground/scratch/knife-vs-archer'],
  ['scratch-royal-chess', '皇家战棋', 'Scratch 小游戏', '/playground/scratch/royal-chess'],
  ['scratch-number-klotski', '数字华容道', 'Scratch 小游戏', '/playground/scratch/number-klotski'],
  ['scratch-super-brain', '最强大脑', 'Scratch 小游戏', '/playground/scratch/super-brain'],
  ['scratch-red-vs-blue', '红蓝之战(毒圈模式)', 'Scratch 小游戏', '/playground/scratch/red-vs-blue'],
  ['scratch-kitten-world-1', '小猫闯天下1', 'Scratch 小游戏', '/playground/scratch/kitten-world-1'],
  ['scratch-welcome-to-1v1', 'welcome to 1v1', 'Scratch 小游戏', '/playground/scratch/welcome-to-1v1'],
  ['scratch-cat-mouse-38', '猫捉老鼠38', 'Scratch 小游戏', '/playground/scratch/cat-mouse-38'],
  ['scratch-honeycomb-maze', '蜂巢迷宫', 'Scratch 小游戏', '/playground/scratch/honeycomb-maze'],
  ['scratch-reinforcement-simulator', '强化模拟器', 'Scratch 小游戏', '/playground/scratch/reinforcement-simulator'],
];
for (const [id, title, content, href] of gameRecords) add(id, title, content, '游戏', href);

export const fullSearchIndex: FullSearchItem[] = items;

const symbolAliases: Record<string, string[]> = {
  lila: ['Lila', 'Lila'],
  'fs3': ['fsiii'],
  fsiq: ['fsiii'],
  asi: ['ASI'],
  agi: ['AGI'],
  qet: ['QET'],
  pf: ['Prime Focus'],
  cf: ['Codeforces'],
  'sera-him': ['nyaumæ'],
};

function expandAliases(words: string[]): string[] {
  const expanded = new Set(words);
  for (const word of words) {
    for (const alias of symbolAliases[word] ?? symbolAliases[word.toLowerCase()] ?? []) expanded.add(alias.toLowerCase());
  }
  return [...expanded];
}

function normalizeUnicode(value: string): string {
  return value.normalize('NFKC').replace(/\u00a0/g, ' ').toLowerCase();
}

/**
 * Keep entity lookup useful when a natural-language question wraps a concise
 * query, for example “咪呀是谁？”. The fallback preserves the original words
 * when removing the question form would leave no searchable text.
 */
export function normalizeSearchQuery(query: string): string {
  const normalized = normalizeUnicode(query).trim();
  const withoutQuestionPunctuation = normalized.replace(/[？?！!。]+$/u, '').trim();
  const withoutQuestionSuffix = withoutQuestionPunctuation
    .replace(/\s*(?:是\s*谁|是\s*什么|什么|怎么样|如何|在哪(?:里)?|有(?:什么)?|多少|几|吗|呢)(?:\s*[呀啊])?\s*$/u, '')
    .trim();
  return withoutQuestionSuffix || withoutQuestionPunctuation;
}

function levenshtein(a: string, b: string): number {
  if (a.length < b.length) [a, b] = [b, a];
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const nextDiagonal = previous[j];
      previous[j] = a[i - 1] === b[j - 1]
        ? diagonal
        : Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + 1);
      diagonal = nextDiagonal;
    }
  }
  return previous[b.length];
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  while (count < 6) {
    const index = haystack.indexOf(needle, from);
    if (index < 0) break;
    count += 1;
    from = index + needle.length;
  }
  return count;
}

function scoreItem(item: FullSearchItem, queryWords: string[], phrase: string): number {
  const title = normalizeUnicode(item.title);
  const content = normalizeUnicode(item.content);
  let score = 0;
  let matchedWords = 0;

  if (phrase && title === phrase) score += 1600;
  else if (phrase && title.includes(phrase)) score += 850;
  if (phrase && content.includes(phrase)) score += 420;

  for (const word of queryWords) {
    if (!word) continue;
    const titleHits = countOccurrences(title, word);
    const contentHits = countOccurrences(content, word);
    if (titleHits || contentHits) matchedWords += 1;
    if (title === word) score += 1000;
    else if (title.startsWith(word)) score += 700;
    else if (title.includes(word)) score += 500;
    if (contentHits) score += 210 + Math.min(contentHits - 1, 4) * 24;
    if (content.startsWith(word)) score += 150;
    if (word.length >= 3) {
      const contentWords = content.split(/[\s·.,，。！？：；/()（）]+/).slice(0, 40);
      if (contentWords.some(candidate => candidate.length >= 3 && levenshtein(candidate, word) <= 2)) score += 100;
    }
    if (title.includes(word) || content.includes(word)) score += 50;
  }
  if (queryWords.length > 1 && matchedWords === queryWords.length) score += 320;
  else if (queryWords.length > 1) score -= (queryWords.length - matchedWords) * 80;
  return score;
}

export function fullTextSearch(query: string): { item: FullSearchItem; score: number }[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const rawWords = normalizedQuery.split(/[\s·.,，。！？：；/()（）-]+/).filter(Boolean);
  if (rawWords.length === 0) return [];
  const queryWords = expandAliases(rawWords);
  return fullSearchIndex
    .map(item => ({ item, score: scoreItem(item, queryWords, normalizedQuery) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length)
    .slice(0, 80);
}
