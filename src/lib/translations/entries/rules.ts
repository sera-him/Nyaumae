// Rule families: surface strings whose English form is compositional, so they
// are derived instead of enumerated (board squares, numbered chapter headings,
// amounts with units). Rules run only when the exact dictionary misses, and
// only inside the runtime translator's safe zone (never over prose).

import { EXACT_TRANSLATIONS } from '../dictionary';

const CJK_DIGITS: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100,
};

function parseCjkNumber(input: string): number | null {
  if (/^\d+$/.test(input)) return Number(input);
  let total = 0;
  let section = 0;
  let current = 0;
  for (const ch of input) {
    const value = CJK_DIGITS[ch];
    if (value === undefined) return null;
    if (value === 10 || value === 100) {
      section += (current === 0 ? 1 : current) * value;
      current = 0;
    } else {
      current = value;
    }
  }
  total += section + current;
  return total > 0 ? total : null;
}

/** Board squares from the 9×9 chalk-grid game, e.g. "A1：空格" → "A1: empty". */
const BOARD_SQUARE = /^([A-I])([1-9])\s*[：:]\s*空格$/;

/** Numbered headings: 第一章：降临 / 第 8 章: 尾声·入凡 / 第三篇 巨人的早晨. */
const NUMBERED_HEADING = /^第\s*([0-9零一二三四五六七八九十百两]+)\s*(章|篇|卷)\s*[：:]\s*(.+)$/;
const PART_HEADING = /^第\s*([0-9零一二三四五六七八九十百两]+)\s*(篇|卷)\s+(.+)$/;
const HEADING_KIND: Record<string, string> = { 章: 'Chapter', 篇: 'Part', 卷: 'Volume' };

/** Amounts and durations, e.g. "22 秒" → "22 s", "6 分钟" → "6 min". */
const AMOUNT_UNITS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(\d+(?:[.,]\d+)?)\s*秒$/, '$1 s'],
  [/^(\d+(?:[.,]\d+)?)\s*分钟$/, '$1 min'],
  [/^(\d+(?:[.,]\d+)?)\s*小时$/, '$1 h'],
  [/^(\d+(?:[.,]\d+)?)\s*天$/, '$1 days'],
  [/^(\d+(?:[.,]\d+)?)\s*个结果$/, '$1 results'],
  [/^(\d+(?:[.,]\d+)?)\s*条结果$/, '$1 results'],
  [/^(\d+(?:[.,]\d+)?)\s*个词条$/, '$1 entries'],
  [/^(\d+(?:[.,]\d+)?)\s*次搜索$/, '$1 searches'],
  [/^(\d+(?:[.,]\d+)?)\s*个浏览会话$/, '$1 browsing sessions'],
  [/^<(\d+)\s*分钟$/, '<$1 min'],
  [/^(\d+)\s*章童话$/, 'a $1-chapter fairy tale'],
  [/^(\d+)\s*岁$/, '$1 years old'],
  [/^(\d[\d,]*)\s*项$/, '$1 items'],
  [/^(\d[\d,]*)\s*次访问$/, '$1 visits'],
  [/^(\d[\d,]*)\s*条索引$/, '$1 entries indexed'],
  [/^(\d[\d,]*)\s*条内容已就绪 · 支持自然语言、别名与模糊匹配$/, '$1 entries ready · natural language, aliases and fuzzy matching'],
  // Relative timestamps in the search hub / analytics tables.
  [/^刚刚$/, 'Just now'],
  [/^(\d+)\s*分钟前$/, '$1 min ago'],
  [/^(\d+)\s*小时前$/, '$1 h ago'],
  [/^(\d+)\s*天前$/, '$1 days ago'],
];

/**
 * Random-chapter card. The label used to be three sibling nodes ("第", the
 * number, "章，随手翻开"), which no dictionary can match as a sentence.
 */
const RANDOM_CHAPTER_ARIA = /^随机一章：(.+?)\s*第\s*([0-9零一二三四五六七八九十百两]+)\s*章$/;
const RANDOM_CHAPTER_LABEL = /^第\s*([0-9零一二三四五六七八九十百两]+)\s*章，随手翻开$/;

/**
 * Prefixed path labels: 回到：故事 (portal back-link) and 读到：第三章
 * (continue-reading tooltip). The target keeps its own dictionary entry.
 */
const PREFIXED_LABELS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^回到：(.+)$/, 'Back to: '],
  [/^读到：(.+)$/, 'Read to: '],
];

/**
 * RouteErrorBoundary composes the area label with a suffix at render time:
 * e.g. "故事区域资源版本不一致" / "首页暂时无法显示". Translate the area
 * prefix via the exact dictionary, then attach the English suffix.
 */
const AREA_ERROR_SUFFIX: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(.+?)资源版本不一致$/, ': resource version mismatch'],
  [/^(.+?)暂时无法显示$/, ' is temporarily unavailable'],
];

function lookupPart(part: string): string {
  const trimmed = part.trim();
  if (!trimmed) return trimmed;
  const direct = EXACT_TRANSLATIONS[trimmed];
  if (direct) return direct;
  // Compound subtitles ("尾声·入凡") are translated segment by segment.
  if (trimmed.includes('·')) {
    const parts = trimmed.split('·').map((segment) => EXACT_TRANSLATIONS[segment.trim()] ?? segment.trim());
    return parts.join(' · ');
  }
  return trimmed;
}

/**
 * Returns the English form for a compositional surface string, or null when no
 * rule applies (the caller then keeps the original text untouched).
 */
export function applyTranslationRules(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const square = trimmed.match(BOARD_SQUARE);
  if (square) return input.replace(trimmed, () => `${square[1]}${square[2]}: empty`);

  const aria = trimmed.match(RANDOM_CHAPTER_ARIA);
  if (aria) {
    const count = parseCjkNumber(aria[2]);
    if (count !== null) return input.replace(trimmed, () => `Random chapter: ${aria[1]}, Chapter ${count}`);
  }

  const card = trimmed.match(RANDOM_CHAPTER_LABEL);
  if (card) {
    const count = parseCjkNumber(card[1]);
    if (count !== null) return input.replace(trimmed, () => `Chapter ${count}, opened at random`);
  }

  const heading = trimmed.match(NUMBERED_HEADING) ?? trimmed.match(PART_HEADING);
  if (heading) {
    const count = parseCjkNumber(heading[1]);
    if (count !== null) {
      const label = HEADING_KIND[heading[2]] ?? 'Chapter';
      const rest = heading[3]
        .split(/[·•]/)
        .map((segment) => lookupPart(segment))
        .join(' · ');
      return input.replace(trimmed, () => `${label} ${count}: ${rest}`);
    }
  }

  for (const [pattern, replacement] of AMOUNT_UNITS) {
    if (pattern.test(trimmed)) return input.replace(trimmed, () => trimmed.replace(pattern, replacement));
  }

  for (const [pattern, suffix] of AREA_ERROR_SUFFIX) {
    const match = trimmed.match(pattern);
    if (match) return input.replace(trimmed, () => `${lookupPart(match[1])}${suffix}`);
  }

  for (const [pattern, prefix] of PREFIXED_LABELS) {
    const match = trimmed.match(pattern);
    if (match) return input.replace(trimmed, () => `${prefix}${lookupPart(match[1])}`);
  }

  // ── 2026-09 manual pass: composed runtime strings (former DOM-translator cases) ──
  if (/^(.+?)加载失败，点击重试$/.test(trimmed)) {
    return input.replace(trimmed, () => lookupPart(trimmed.replace(/加载失败，点击重试$/, '')) + ' failed to load — click to retry');
  }
  if (/^(.+?) 当前仍停留在第 (.+?) 篇、第 (.+?) 章，网址和阅读位置不会改变。$/.test(trimmed)) {
    const m = trimmed.match(/^(.+?) 当前仍停留在第 (.+?) 篇、第 (.+?) 章，网址和阅读位置不会改变。$/); if (!m) return null;
    return input.replace(trimmed, () => m[1] + ' — still on Part ' + m[2] + ', Chapter ' + m[3] + '; URL and reading position stay unchanged.');
  }
  if (/^(.+?)插图$/.test(trimmed)) {
    return input.replace(trimmed, () => lookupPart(trimmed.replace(/插图$/, '')) + ' illustration');
  }
  if (/^(.+?)，"词云与月" WordClouds 风格，alpha=([\d.]+)，完整展示 (\d+) 项词频$/.test(trimmed)) {
    const m = trimmed.match(/^(.+?)，"词云与月" WordClouds 风格，alpha=([\d.]+)，完整展示 (\d+) 项词频$/); if (!m) return null;
    return input.replace(trimmed, () => m[1] + ' — "Wordcloud & Moon", WordClouds style, alpha=' + m[2] + ', all ' + m[3] + ' entries');
  }
  {
    const m = trimmed.match(/^(.+?) · ([\d,]+) 次$/);
    if (m) return input.replace(trimmed, () => m[1] + ' · ' + m[2] + ' uses');
  }
  {
    const m = trimmed.match(/^(.+?)，出现 ([\d,]+) 次，(\d+) 篇$/);
    if (m) return input.replace(trimmed, () => m[1] + ' — ' + m[2] + ' uses across ' + m[3] + ' parts');
  }
  {
    const m = trimmed.match(/^(.+?)：([\d,]+) 次 \/ (\d+) 篇$/);
    if (m) return input.replace(trimmed, () => m[1] + ': ' + m[2] + ' uses / ' + m[3] + ' parts');
  }
  {
    const m = trimmed.match(/^FSIII ([\d.]+) · 等级 (.+?) · 点击查看完整排名$/);
    if (m) return input.replace(trimmed, () => 'FSIII ' + m[1] + ' · tier ' + m[2] + ' · click for the full ranking');
  }
  {
    const m = trimmed.match(/^(.+?) 形象 (\d+)$/);
    if (m) return input.replace(trimmed, () => m[1] + ' portrait ' + m[2]);
  }
  {
    const m = trimmed.match(/^专注(.+?)；属性(.+?)；储备(.+)$/);
    if (m) return input.replace(trimmed, () => 'Focus ' + lookupPart(m[1]) + '; attribute ' + m[2] + '; reserve ' + m[3]);
  }
  {
    const m = trimmed.match(/^把(.+?)升级为(.+)$/);
    if (m) return input.replace(trimmed, () => 'Upgrade ' + lookupPart(m[1]) + ' to ' + lookupPart(m[2]));
  }
  {
    const m = trimmed.match(/^换取1点(.+)$/);
    if (m) return input.replace(trimmed, () => 'Swap for 1 ' + lookupPart(m[1]));
  }
  {
    const m = trimmed.match(/^剩余时间 (.+)$/);
    if (m) return input.replace(trimmed, () => 'Time left ' + m[1]);
  }
  {
    const m = trimmed.match(/^(\d+) 个浏览会话$/);
    if (m) return input.replace(trimmed, () => m[1] + ' browsing sessions');
  }
  {
    const m = trimmed.match(/^神经交锋棋盘，当前键盘焦点为(.+)$/);
    if (m) return input.replace(trimmed, () => 'Neural clash board — keyboard focus: ' + m[1]);
  }
  {
    const m = trimmed.match(/^(.+?)玩法说明$/);
    if (m) return input.replace(trimmed, () => m[1] + ' — how to play');
  }
  {
    const m = trimmed.match(/^继续阅读(.+?)，(.+)$/);
    if (m) return input.replace(trimmed, () => 'Continue reading ' + m[1] + ', ' + m[2]);
  }
  {
    const m = trimmed.match(/^当前等级进度 (\d+)%$/);
    if (m) return input.replace(trimmed, () => 'Level progress ' + m[1] + '%');
  }
  {
    const m = trimmed.match(/^摸摸泡芙，当前亲密度 (\d+)%$/);
    if (m) return input.replace(trimmed, () => 'Puff petted — affection ' + m[1] + '%');
  }
  if (/^未找到 API 供应商 "/.test(trimmed)) {
    const m = trimmed.match(/^未找到 API 供应商 "(.+)"$/);
    if (m) return input.replace(trimmed, () => 'API provider not found: ' + m[1]);
  }
  {
    const m = trimmed.match(/^(.+?)未找到 "(.+)"$/);
    if (m) return input.replace(trimmed, () => lookupPart(m[1]) + ' not found: ' + m[2]);
  }
  {
    const m = trimmed.match(/^当前第 (\d+) 班，无限营业$/);
    if (m) return input.replace(trimmed, () => 'Round ' + m[1] + ' — unlimited service');
  }
  {
    const m = trimmed.match(/^第 (\d+) 层工位类型$/);
    if (m) return input.replace(trimmed, () => 'Floor ' + m[1] + ' workstation type');
  }
  {
    const m = trimmed.match(/^把第 (\d+) 层改成(.+)$/);
    if (m) return input.replace(trimmed, () => 'Set floor ' + m[1] + ' to ' + lookupPart(m[2]));
  }
  {
    const m = trimmed.match(/^剩余 (\d+) 次操作$/);
    if (m) return input.replace(trimmed, () => m[1] + ' moves left');
  }
  {
    const m = trimmed.match(/^店铺等级进度 (\d+)%$/);
    if (m) return input.replace(trimmed, () => 'Shop level ' + m[1] + '%');
  }
  {
    const m = trimmed.match(/^复合象棋棋盘，(.+)$/);
    if (m) return input.replace(trimmed, () => 'Compound chess board — ' + m[1]);
  }
  {
    const m = trimmed.match(/^(.+?)标准分$/);
    if (m) return input.replace(trimmed, () => lookupPart(m[1]) + ' standard score');
  }
  {
    const m = trimmed.match(/^([\d.]+)，匹配度 (.+)$/);
    if (m) return input.replace(trimmed, () => m[1] + ' — match ' + m[2]);
  }
  {
    const m = trimmed.match(/^演示年龄刻度 0 到 30 岁，当前结果 ([\d.]+) 岁，成年参考线 18 岁$/);
    if (m) return input.replace(trimmed, () => 'Demo age scale 0–30; current result ' + m[1] + ' yrs; adult line 18');
  }
  {
    const m = trimmed.match(/^子盘示例，(.+?)控制$/);
    if (m) return input.replace(trimmed, () => 'Sub-board sample, controlled by ' + lookupPart(m[1]));
  }
  {
    const m = trimmed.match(/^前进(成功|受阻)$/);
    if (m) return input.replace(trimmed, () => 'Forward — ' + (m[1] === '成功' ? 'success' : 'blocked'));
  }
  {
    const m = trimmed.match(/^(\d+)个空间导航$/);
    if (m) return input.replace(trimmed, () => m[1] + ' space links');
  }
  {
    const m = trimmed.match(/^(.+?)生长点$/);
    if (m) return input.replace(trimmed, () => lookupPart(m[1]) + ' growth point');
  }
  {
    const m = trimmed.match(/^保留第 (\d+) 个子枝(，已选择)?$/);
    if (m) return input.replace(trimmed, () => 'Keep branch ' + m[1] + (m[2] ? ', selected' : ''));
  }
  {
    const m = trimmed.match(/^答案 (\w+)$/);
    if (m) return input.replace(trimmed, () => 'Answer ' + m[1]);
  }

  {
    const m = trimmed.match(/^(\d+) 分 · CI (\d+)–(\d+)$/);
    if (m) return input.replace(trimmed, () => m[1] + ' pts · CI ' + m[2] + '–' + m[3]);
  }
  {
    const m = trimmed.match(/^(\d+) 个维度的描述性汇总$/);
    if (m) return input.replace(trimmed, () => m[1] + ' dimensions summarized');
  }
  {
    const m = trimmed.match(/^(\d+) 个维度有数据$/);
    if (m) return input.replace(trimmed, () => m[1] + ' dimensions with data');
  }
  {
    const m = trimmed.match(/^平均难度 (.+)$/);
    if (m) return input.replace(trimmed, () => 'avg difficulty ' + m[1]);
  }
  {
    const m = trimmed.match(/^(.+?)专项报告$/);
    if (m) return input.replace(trimmed, () => lookupPart(m[1]) + ' focused report');
  }
  {
    const m = trimmed.match(/^(.+?)｜角色档案$/);
    if (m) return input.replace(trimmed, () => lookupPart(m[1]) + ' — character files');
  }
  {
    const m = trimmed.match(/^浏览 Neural Connection 的(.+?)档案与关系设定。$/);
    if (m) return input.replace(trimmed, () => "Browse Neural Connection's " + m[1] + ' files and relationship settings.');
  }

  return null;
}
