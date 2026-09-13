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

  return null;
}
