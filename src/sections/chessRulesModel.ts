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


export const tierColors: Record<string, string> = {
  '钻石': 'text-yellow-300',
  '辉金': 'text-amber-300',
  '金色': 'text-yellow-400',
  '紫色': 'text-purple-400',
  '蓝色': 'text-blue-400',
  '绿色': 'text-green-400',
  '白色': 'text-gray-300',
};

export const tierBgColors: Record<string, string> = {
  '钻石': 'bg-yellow-500/10 border-yellow-500/20',
  '辉金': 'bg-amber-500/10 border-amber-500/20',
  '金色': 'bg-yellow-500/8 border-yellow-500/15',
  '紫色': 'bg-purple-500/8 border-purple-500/15',
  '蓝色': 'bg-blue-500/8 border-blue-500/15',
  '绿色': 'bg-green-500/8 border-green-500/15',
  '白色': 'bg-gray-500/8 border-gray-500/15',
};

export const tierIcons = ['◆', '◈', '★', '●', '⬤', '▸', '○'];

// Poison data from source document
export interface PoisonEntry {
  letter: string;
  piece: string;
  levels: string[];
  immune?: boolean;
  note?: string;
}

export const poisonData: PoisonEntry[] = [
  { letter: 'P/E/Z/IZ', piece: '兵 / 象 / 骷髅兵 / 反骷髅兵', levels: ['不可吃子', '被移除'] },
  { letter: 'N', piece: '马', levels: ['加"蹩腿"', '被移除'] },
  { letter: 'B', piece: '教', levels: ['走"田"且有"蹩腿"', '己方半场不可过中线', '被移除'] },
  { letter: 'R', piece: '车', levels: ['横竖最多2格', '横竖最多1格', '被移除'] },
  { letter: 'Q/O', piece: '后 / 鸵鸟', levels: ['8方向最多2格', '8方向最多1格', '4方向最多1格', '被移除'], note: '切换形态保留中毒' },
  { letter: 'H', piece: '巨鲸', levels: ['被移除'] },
  { letter: 'M', piece: '老鼠', levels: ['马步只能走一个日字', '斜线最多2格', '直线最多2格', '斜线最多1格', '直线最多1格', '无法走马步', '无法走斜线', '被移除'], note: '每次增加限制时，未提到的原有能力保留；被吃后继承毒' },
  { letter: 'T/Y/L/A', piece: '猫 / 缅因猫 / 英语 / 天线', levels: ['免疫', '免疫', '免疫', '失去技能', '失去技能', '失去技能', '被移除'] },
  { letter: 'C', piece: '大炮', levels: ['免疫', '免疫', '免疫', '直线最多移动1格（攻击范围不变）', '直线最多移动1格（攻击范围不变）', '直线最多移动1格（攻击范围不变）', '被移除'] },
  { letter: 'K/W/J/U/S/X/IW', piece: '王 / 女巫 / 圣骑士 / 太空人 / 星舰 / 火箭 / 反女巫', levels: [], immune: true },
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
