export interface Organization {
  id: string;
  name: string;
  shortName?: string;
  budget: string;
  budgetNote?: string;
  members: string[];
  color: string;
  accentColor: string;
  description: string;
  image: string;
  icon: string;
  facultyCount?: number;
  facultyNote?: string;
}

export interface SchoolClass {
  college: string;
  name: string;
  undergradPerYear: number;
  undergradYears: number;
  gradPerYear: number;
  gradYears: number;
  direction: string;
}

export const zhihuaClasses: SchoolClass[] = [
  {
    college: '科照真学院',
    name: '冯·诺伊曼班',
    undergradPerYear: 20,
    undergradYears: 4,
    gradPerYear: 16,
    gradYears: 2,
    direction: '数学 · 量子 · QuaAGI',
  },
  {
    college: '科照真学院',
    name: '巴别塔班',
    undergradPerYear: 20,
    undergradYears: 4,
    gradPerYear: 10,
    gradYears: 2,
    direction: '生物意识 · 神经化学',
  },
  {
    college: '观学院',
    name: '美术班',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 4,
    gradYears: 2,
    direction: '视觉意识 · 大众审美',
  },
  {
    college: '观学院',
    name: '音乐班',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 4,
    gradYears: 2,
    direction: '听觉意识 · 情感计算',
  },
  {
    college: '观学院',
    name: '哲学班',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 3,
    gradYears: 2,
    direction: '意识哲学 · 心灵哲学',
  },
  {
    college: '观学院',
    name: '语言学班',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 5,
    gradYears: 2,
    direction: '语言 · 思维 · NLP 基础',
  },
];

export const organizations: Organization[] = [
  {
    id: 'zhihua',
    name: '哲华学校',
    shortName: '哲华',
    budget: '约 8000 万元',
    budgetNote: '教学运行经费（含设备折旧与设施维护），不含科研经费。科研经费由科照真学院与德澜思拓联合拨付。',
    members: ['赵召', '墨问', 'Nimfa', 'Nihilib', '星野遥', '墨奥幂.fc'],
    color: 'from-violet-600 to-indigo-600',
    accentColor: '#8B5CF6',
    description:
      '科照真学院（冯·诺伊曼班、巴别塔班）与观学院（美术、音乐、哲学、语言学）并立。围绕 AGI 是否有意识这一核心问题的学科融合研究院。',
    image: '/org-zhihua.jpg',
    icon: '/icons/org-zhihua.png',
    facultyCount: 10,
    facultyNote: '教授 10 人，其中赵召（院长）、Nimfa（冯班）、墨问（巴别塔班班主任）、Nihilib（巴别塔班）已出场',
  },
  {
    id: 'impact',
    name: '因派 (Impact Inc.)',
    shortName: '因派',
    budget: '约 2 亿元',
    members: ['林深', '哈姆诗', '林浅'],
    color: 'from-cyan-600 to-teal-600',
    accentColor: '#00E5CC',
    description: '研发全国首款二次元 VR 游戏《心界》，All in 下一代沉浸式体验。',
    image: '/org-impact.jpg',
    icon: '/icons/org-impact.png',
  },
  {
    id: 'delan',
    name: '德澜思拓公司',
    shortName: '德澜思拓',
    budget: '约 5 亿元',
    members: ['米雅'],
    color: 'from-pink-600 to-rose-600',
    accentColor: '#F472B6',
    description: '由年轻领导者米雅掌舵的科技巨头，与哲华学校科照真学院深度合作。',
    image: '/org-delan.jpg',
    icon: '/icons/org-delan.png',
  },
  {
    id: 'xinjie',
    name: '《心界》项目',
    shortName: '心界',
    budget: '约 2 亿元',
    members: ['零'],
    color: 'from-slate-400 to-gray-400',
    accentColor: '#CBD5E1',
    description: '因派投资一亿美元研发的全国首款二次元 VR 游戏。2026 年迎来首个活动"沐诚艺柏"。',
    image: '/org-xinjie.jpg',
    icon: '/icons/org-xinjie.png',
  },
  {
    id: 'trinity',
    name: '三一学院',
    shortName: '三一',
    budget: '未公开',
    members: ['耶稣', 'Agents'],
    color: 'from-amber-500 to-orange-600',
    accentColor: '#F59E0B',
    description: '三场考试构成：圣子占5%（10套简单题取A）、圣父占85%（多场中等难度）、圣灵占10%（最难考试+3-5名Agents面试）。未绑定特定学段，独立于QET体系。',
    image: '/org-zhihua.jpg',
    icon: '/icons/org-zhihua.png',
  },
];
