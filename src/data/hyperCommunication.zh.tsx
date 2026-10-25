// Chinese source of truth for the HyperCommunication section, extracted from
// ../sections/HyperCommunication.tsx (2026-10-12) so that fullSearchIndex can
// register it with proper titles / hrefs. Same field names and array order as
// hyperCommunication.en.tsx. The icon elements are JSX, so this file is .tsx
// and owns the lucide imports (mirroring the .en module).
import type { JSX } from 'react';
import { Radio, MessageCircle, Shuffle, Eye } from 'lucide-react';

export interface HcMode {
  icon: JSX.Element;
  name: string;
  desc: string;
}

export const modes: HcMode[] = [
  {
    icon: <Radio className="w-5 h-5" />,
    name: '汇报',
    desc: '各项目集群 10 分钟闪电汇报，全体师生旁听提问',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    name: '碰撞',
    desc: '预设跨学科议题（如"AGI 能感受颜色吗？"），随机分组辩论',
  },
  {
    icon: <Shuffle className="w-5 h-5" />,
    name: '错位',
    desc: '学生必须用非本学科语言汇报研究进展（冯班用画画、美术班用公式）',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    name: '静默',
    desc: '全员进入星界馆，不使用语言，仅用书写 / 图像 / 代码交流 1.5 小时',
  },
];

export const rules: string[] = [
  '赵召本人必须参加，缺席视为教学事故',
  '不允许说"这是你们科照真的问题不关我观学院的事"',
  '每学期每位学生至少发言 / 展示 3 次',
  '内容原则上不记录、不存档、不追溯——鼓励冒险表达',
  '大型 HC 分组必须计算机随机分配，禁止同班抱团',
];

export interface LargeHc {
  name: string;
  time: string;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export const largeHc: LargeHc[] = [
  {
    name: '收敛 HC',
    time: '1 月初 · 秋季学期末',
    theme: '回顾、总结、收束',
    morning: '各项目集群年度成果展示',
    afternoon: '跨学院辩论：评选"年度最佳集群"',
    evening: '赵召总结：哪些路径被证明无效，该放弃',
  },
  {
    name: '发散 HC',
    time: '6 月底 · 春季学期末',
    theme: '展望、开题、发散',
    morning: '赵召亲自主持发布新年度主题',
    afternoon: '自由组队：学生自主提出新集群方向',
    evening: '点评：哪些方向值得下学期资源倾斜',
  },
];

export interface HcCalendarRow {
  week: string;
  label: string;
  hc: string;
  off?: boolean;
}

export const calendar: HcCalendarRow[] = [
  { week: '1-16', label: '秋季学期', hc: '每周五 19:00-21:30' },
  { week: '17-18', label: '1 月初', hc: '大型 HC（收敛）' },
  { week: '—', label: '寒假', hc: '暂停', off: true },
  { week: '19-34', label: '春季学期', hc: '每周五 19:00-21:30' },
  { week: '35-36', label: '6 月底', hc: '大型 HC（发散）' },
  { week: '—', label: '暑假', hc: '暂停', off: true },
];
