// 价值等级：颜色 + 罗马数字表示"先后"，不表示分值。
// 钻是关键棋子，不计价值，单独排在最上。
import { getLocale } from '@/lib/i18n';

export type TierColor = '钻' | '辉金' | '金' | '紫' | '蓝' | '绿' | '白';

export interface Tier {
  label: string;
  color: TierColor;
  roman?: 'I' | 'II' | 'III';
}

/** 16 级价值阶梯：数组顺序即高低，不携带任何分数。 */
export const VALUE_LADDER: Tier[] = [
  { label: '辉金', color: '辉金' },
  { label: '金III', color: '金', roman: 'III' },
  { label: '金II', color: '金', roman: 'II' },
  { label: '金I', color: '金', roman: 'I' },
  { label: '紫III', color: '紫', roman: 'III' },
  { label: '紫II', color: '紫', roman: 'II' },
  { label: '紫I', color: '紫', roman: 'I' },
  { label: '蓝III', color: '蓝', roman: 'III' },
  { label: '蓝II', color: '蓝', roman: 'II' },
  { label: '蓝I', color: '蓝', roman: 'I' },
  { label: '绿III', color: '绿', roman: 'III' },
  { label: '绿II', color: '绿', roman: 'II' },
  { label: '绿I', color: '绿', roman: 'I' },
  { label: '白III', color: '白', roman: 'III' },
  { label: '白II', color: '白', roman: 'II' },
  { label: '白I', color: '白', roman: 'I' },
];

export const DIAMOND_TIER: Tier = { label: '钻', color: '钻' };

/**
 * 星号是额外含义（进敌方英语禁区会被消灭），不是等级的一部分。
 * 解析颜色/排序时只临时忽略它，绝不修改原字符串。
 */
export function stripStar(label: string): string {
  return label.replace(/\*/g, '');
}

export function parseTier(label: string): Tier | null {
  const base = stripStar(label).trim();
  if (!base) return null;
  if (base === DIAMOND_TIER.label) return DIAMOND_TIER;
  return VALUE_LADDER.find((tier) => tier.label === base) ?? null;
}

/** 排序用：0 = 钻（最上），1..16 = 阶梯位置。 */
export function tierOrder(label: string): number {
  const base = stripStar(label).trim();
  if (base === DIAMOND_TIER.label) return 0;
  const index = VALUE_LADDER.findIndex((tier) => tier.label === base);
  return index < 0 ? VALUE_LADDER.length + 1 : index + 1;
}

export function compareTier(a: string, b: string): number {
  return tierOrder(a) - tierOrder(b);
}

const COLOR_EN: Record<TierColor, string> = {
  钻: 'Diamond',
  辉金: 'Glowing Gold',
  金: 'Gold',
  紫: 'Purple',
  蓝: 'Blue',
  绿: 'Green',
  白: 'White',
};

/** 展示文案：中文原样；英文把底色与罗马分开拼，星号原样留在末尾。 */
export function tierText(label: string): string {
  if (getLocale() !== 'en') return label;
  const star = label.includes('*') ? '*' : '';
  const tier = parseTier(label);
  if (!tier) return label;
  return `${COLOR_EN[tier.color]}${tier.roman ? ` ${tier.roman}` : ''}${star}`;
}

export const tierColors: Record<TierColor, string> = {
  '钻': 'text-yellow-300',
  '辉金': 'text-amber-300',
  '金': 'text-yellow-400',
  '紫': 'text-purple-400',
  '蓝': 'text-blue-400',
  '绿': 'text-green-400',
  '白': 'text-gray-300',
};

export const tierBgColors: Record<TierColor, string> = {
  '钻': 'bg-yellow-500/10 border-yellow-500/20',
  '辉金': 'bg-amber-500/10 border-amber-500/20',
  '金': 'bg-yellow-500/8 border-yellow-500/15',
  '紫': 'bg-purple-500/8 border-purple-500/15',
  '蓝': 'bg-blue-500/8 border-blue-500/15',
  '绿': 'bg-green-500/8 border-green-500/15',
  '白': 'bg-gray-500/8 border-gray-500/15',
};

export const tierIcons: Record<TierColor, string> = {
  '钻': '◆',
  '辉金': '◈',
  '金': '★',
  '紫': '●',
  '蓝': '⬤',
  '绿': '▸',
  '白': '○',
};

export function tierColorClass(label: string): string {
  const tier = parseTier(label);
  return tier ? tierColors[tier.color] : 'text-gray-300';
}

export function tierBgClass(label: string): string {
  const tier = parseTier(label);
  return tier ? tierBgColors[tier.color] : 'bg-gray-500/8 border-gray-500/15';
}

export function tierIcon(label: string): string {
  const tier = parseTier(label);
  return tier ? tierIcons[tier.color] : '○';
}
