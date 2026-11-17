// Auto-extracted model block: types, static content tables and pure helpers.
// Kept in a separate module so the UI file only holds rendering concerns.
import type { ElementType } from 'react';
import { Gem, Grid3X3, ScrollText, Skull, Swords } from 'lucide-react';

export function formatClock(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSecs = Math.ceil(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatSignedClock(ms: number): string {
  if (ms === 0) return '0:00';
  const sign = ms < 0 ? '-' : '+';
  const absMs = Math.abs(ms);
  const totalSecs = Math.ceil(absMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${sign}${mins}:${String(secs).padStart(2, '0')}`;
}

/** 将秒数转为 周-日-时-分-秒 格式 */
export function formatDuration(seconds: number): string {
  const w = Math.floor(seconds / (7 * 86400));
  const rem = seconds % (7 * 86400);
  const d = Math.floor(rem / 86400);
  const h = Math.floor((rem % 86400) / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const s = rem % 60;
  return `${w}-${d}-${String(h).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')}`;
}

/** 分类排序 */


// 中毒：每一段 = 一个等级区间 + 效果 + 中毒后的价值等级。
// tier 为空表示该段结束时棋子已被移除。
export interface PoisonStage {
  from: number;
  to?: number;
  effect: string;
  tier?: string;
}

export interface PoisonEntry {
  letter: string;
  piece: string;
  base?: string;
  levels: PoisonStage[];
  immune?: boolean;
  note?: string;
}

export const poisonData: PoisonEntry[] = [
  {
    letter: 'P', piece: '兵', base: '白II',
    levels: [
      { from: 1, to: 3, effect: '不可吃子', tier: '白I' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'E', piece: '象', base: '绿I',
    levels: [
      { from: 1, to: 3, effect: '不可吃子', tier: '白II' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'Z', piece: '骷髅兵', base: '白I',
    levels: [
      { from: 1, to: 3, effect: '不可吃子', tier: '白I' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'IZ', piece: '反骷髅兵', base: '白I',
    levels: [
      { from: 1, to: 3, effect: '不可吃子', tier: '白I' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'N', piece: '马', base: '蓝I',
    levels: [
      { from: 1, to: 3, effect: '加"蹩腿"', tier: '绿III' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'B', piece: '教', base: '蓝II',
    levels: [
      { from: 1, effect: '走"田"且有"蹩腿"', tier: '绿II' },
      { from: 2, to: 3, effect: '己方半场不可过中线', tier: '白II' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'R', piece: '车', base: '紫II',
    levels: [
      { from: 1, effect: '横竖最多2格', tier: '绿III' },
      { from: 2, effect: '横竖最多1格', tier: '绿I' },
      { from: 3, effect: '横竖最多1格且不可吃子', tier: '白I' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'C', piece: '大炮', base: '紫I',
    levels: [
      { from: 1, effect: '直线最多移动1格（攻击范围不变）', tier: '蓝III' },
      { from: 2, to: 3, effect: '不能移动，只能当炮架攻击', tier: '绿III' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'Q', piece: '后', base: '金III',
    levels: [
      { from: 1, effect: '8方向最多2格', tier: '紫II' },
      { from: 2, effect: '8方向最多1格', tier: '蓝III' },
      { from: 3, effect: '4方向最多1格', tier: '绿I' },
      { from: 4, effect: '被移除' },
    ],
  },
  {
    letter: 'O', piece: '鸵鸟', base: '金I',
    levels: [
      { from: 1, effect: '8方向最多2格', tier: '紫I' },
      { from: 2, effect: '8方向最多1格', tier: '蓝II' },
      { from: 3, effect: '4方向最多1格', tier: '白III' },
      { from: 4, effect: '被移除' },
    ],
    note: '与后共用中毒阶梯；切换形态保留中毒',
  },
  {
    letter: 'H', piece: '巨鲸', base: '金II',
    levels: [{ from: 1, effect: '被移除' }],
  },
  {
    letter: 'M', piece: '老鼠', base: '辉金',
    levels: [
      { from: 1, effect: '马步只能走一个日字', tier: '辉金' },
      { from: 2, effect: '斜线最多2格、直线最多2格', tier: '紫III' },
      { from: 3, effect: '斜线最多1格、直线最多1格', tier: '蓝III' },
      { from: 4, effect: '无法走马步、无法走斜线', tier: '绿I' },
      { from: 5, effect: '无法移动', tier: '白II' },
      { from: 6, effect: '不可吃子', tier: '白I' },
      { from: 7, effect: '失去"被吃后继承毒"', tier: '白I' },
      { from: 8, effect: '被移除' },
    ],
    note: '每次增加限制时，未提到的原有能力保留；被吃后继承毒',
  },
  {
    letter: 'T', piece: '猫', base: '绿III',
    levels: [
      { from: 1, to: 3, effect: '免疫', tier: '绿III' },
      { from: 4, to: 6, effect: '不能捕鼠', tier: '绿II' },
      { from: 7, effect: '被移除' },
    ],
  },
  {
    letter: 'Y', piece: '缅因猫', base: '蓝I',
    levels: [
      { from: 1, to: 3, effect: '免疫', tier: '蓝I' },
      { from: 4, to: 6, effect: '恐惧失效', tier: '绿II' },
      { from: 7, effect: '被移除' },
    ],
  },
  {
    letter: 'L', piece: '英语', base: '蓝II',
    levels: [
      { from: 1, to: 3, effect: '免疫', tier: '蓝II' },
      { from: 4, to: 6, effect: '失效，禁区消失', tier: '绿III' },
      { from: 7, effect: '被移除' },
    ],
  },
  {
    letter: 'A', piece: '天线', base: '蓝III',
    levels: [
      { from: 1, to: 3, effect: '免疫', tier: '蓝III' },
      { from: 4, to: 6, effect: '失去推子/破译', tier: '蓝II' },
      { from: 7, effect: '被移除' },
    ],
  },
  {
    letter: 'G', piece: '猫娘', base: '钻',
    levels: [{ from: 1, to: 4, effect: '失去猫能力，只能像王走8方向1格', tier: '钻' }],
    note: '关键棋子：掉能力但仍是钻，不带罗马数字',
  },
  {
    letter: 'K/W/J/U/S/X/IW',
    piece: '王 / 女巫 / 圣骑士 / 太空人 / 星舰 / 火箭 / 反女巫',
    levels: [],
    immune: true,
  },
];

export const cheeseData = [
  { name: '黄奶酪 CY', color: 'text-[var(--aurora-brand-amber)]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', effect: '减少 1 次中毒' },
  { name: '橙奶酪 CO', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', effect: '减少 4 次中毒' },
  { name: '蓝奶酪 CB', color: 'text-[var(--aurora-brand-indigo)]', bg: 'bg-[#6366F1]/10', border: 'border-[#6366F1]/20', effect: '下回合对手可操纵这只老鼠' },
  { name: '紫奶酪 CP', color: 'text-[var(--aurora-brand-red)]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', effect: '增加 2 次中毒' },
  { name: '黑奶酪 CK', color: 'text-gray-400', bg: 'bg-gray-800/50', border: 'border-gray-700/30', effect: '增加 8 次中毒' },
];

export type TabKey = 'pieces' | 'tiers' | 'board' | 'rules' | 'poison';

export const tabs: { key: TabKey; label: string; icon: ElementType }[] = [
  { key: 'pieces', label: '棋子规则', icon: Swords },
  { key: 'tiers', label: '棋子等级', icon: Gem },
  { key: 'board', label: '对  弈', icon: Grid3X3 },
  { key: 'rules', label: '特殊机制', icon: ScrollText },
  { key: 'poison', label: '中毒查询', icon: Skull },
];
