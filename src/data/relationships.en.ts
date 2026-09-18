// English mirror of ./relationships — same ids/edges, English display names & labels.
import type { RelationType, CharacterRelation, NetworkNode } from './relationships';

export const relationLabelsEn: Record<RelationType, string> = {
  mentor: 'Creator/Work',
  colleague: 'Colleague',
  friend: 'Family/Friend',
  neighbor: 'Neighbor',
  rival: 'Rival',
  partner: 'Partner',
  other: 'Other',
};

export const relationColors: Record<RelationType, string> = {
  mentor: '#8B5CF6',
  colleague: '#00E5CC',
  friend: '#F472B6',
  neighbor: '#38BDF8',
  rival: '#EF4444',
  partner: '#F59E0B',
  other: '#94A3B8',
};

export const networkNodesEn: NetworkNode[] = [
  // mia-family (6)
  { id: 'mimi',       name: 'Mimi',      group: 'mia-family', x: 23.67, y: 19.14 },
  { id: 'qicheng',    name: 'Qicheng',   group: 'mia-family', x: 36.26, y: 22.28 },
  { id: 'miia',       name: 'Miia',      group: 'mia-family', x: 44.13, y: 41.17 },
  { id: 'mia',        name: 'Mia',       group: 'mia-family', x: 26.82, y: 49.04 },
  { id: 'amiya',      name: 'Amiya',     group: 'mia-family', x: 15.80, y: 39.60 },
  { id: 'miya',       name: 'Miya',      group: 'mia-family', x: 12.65, y: 23.86 },

  // zhihua (7)
  { id: 'zhaozhao',   name: 'Zhao Zhao', group: 'zhihua',   x: 89.80, y: 45.57 },
  { id: 'nimfa',      name: 'Nimfa',     group: 'zhihua',   x: 94.51, y: 19.14 },
  { id: 'nihilib',    name: 'Nihilib',   group: 'zhihua',   x: 98.00, y: 32.52 },
  { id: 'mowen',      name: 'Mo Wen',    group: 'zhihua',   x: 80.34, y: 15.99 },
  { id: 'haruka',     name: 'Hoshino Haruka', group: 'zhihua', x: 67.95, y: 44.65 },
  { id: 'mao',        name: 'Mo Aomi',   group: 'zhihua',   x: 64.60, y: 31.73 },
  { id: 'mxy',        name: 'Mo Xuanyue',group: 'zhihua',   x: 65.53, y: 17.04 },

  // impact (4)
  { id: 'linshen',    name: 'Lin Shen',  group: 'impact',   x: 69.16, y: 68.03 },
  { id: 'linqian',    name: 'Lin Qian',  group: 'impact',   x: 81.61, y: 77.43 },
  { id: 'hamster',    name: 'Hamster',   group: 'impact',   x: 67.35, y: 82.89 },
  { id: 'zero',       name: 'Zero',      group: 'impact',   x: 55.20, y: 72.58 },

  // other (2)
  { id: 'linear',     name: 'Linear',    group: 'other',    x: 98.00, y: 73.49 },
  { id: 'dora',       name: 'Dora',      group: 'other',    x: 90.41, y: 61.34 },

  // independent (6)
  { id: 'miku',       name: 'Hatsune Miku', group: 'independent', x: 36.39, y: 71.66 },
  { id: 'alice',      name: 'Alice',     group: 'independent', x: 23.34, y: 64.99 },
  { id: 'lila',       name: 'Līlā',      group: 'independent', x: 16.66, y: 78.95 },
  { id: 'cola',       name: 'Cola',      group: 'independent', x:  9.67, y: 58.32 },
  { id: 'linkmo',     name: 'Linkmo',    group: 'independent', x: 29.71, y: 85.01 },
  { id: 'ifchan',     name: 'Aiefu-chan',group: 'independent', x:  3.00, y: 75.50 },

  // digital lifeforms (3)
  { id: 'miacubic',   name: 'mia³',      group: 'ai',       x: 74.62, y: 56.19 },
  { id: 'eirene',     name: 'Eirene',    group: 'ai',       x: 41.24, y: 56.49 },
  { id: 'damocles',   name: 'Damocles',  group: 'ai',       x: 55.20, y: 55.28 },

  // special (1)
  { id: 'quartus',    name: 'Quartus',   group: 'special',  x: 45.49, y: 85.01 },

  // The Little Girl in the Giant Country
  { id: 'changfeng',  name: 'Chang Feng',   group: 'giant', x: 20, y: 16 },
  { id: 'chuxia',     name: 'Chu Xia',      group: 'giant', x: 36, y: 16 },
  { id: 'xiaoman',    name: 'Xiaoman',      group: 'giant', x: 18, y: 30 },
  { id: 'xiaogu',     name: 'Xiaogu',       group: 'giant', x: 30, y: 38 },
  { id: 'xiaohe',     name: 'Xiaohe',       group: 'giant', x: 42, y: 30 },
  { id: 'miaowu',     name: 'Miaowu',       group: 'giant', x: 50, y: 38 },
  { id: 'xiulan',     name: 'Grandma Xiulan', group: 'giant', x: 60, y: 16 },
  { id: 'zhouji',     name: 'Zhou Ji',      group: 'giant', x: 74, y: 16 },
  { id: 'high-school-student', name: 'Chen Yu\'an', group: 'giant', x: 68, y: 30 },
  { id: 'delivery-rider', name: 'Delivery Rider', group: 'giant', x: 93, y: 37 },

  // remaining characters (grouping follows legend semantics)
  { id: 'linmo',      name: 'Su Luo',    group: 'independent', x: 76, y: 6 },
  { id: 'gpt',        name: 'GPT',       group: 'ai', x: 56, y: 41 },
  { id: 'wangshu',    name: 'Xiaoya',    group: 'independent', x: 55, y: 10 },
  { id: 'neon',       name: 'Neon',      group: 'independent', x: 36.5, y: 7 },
  { id: 'retina',     name: 'Retina',    group: 'independent', x: 65, y: 4 },
];

export const characterRelations: CharacterRelation[] = [
  // M/I/A family
  { from: 'mimi',    to: 'miia',     type: 'friend' },
  { from: 'mimi',    to: 'amiya',    type: 'friend' },
  { from: 'mimi',    to: 'mia',      type: 'friend' },
  { from: 'qicheng', to: 'miia',     type: 'friend' },
  { from: 'miia',    to: 'mia',      type: 'friend' },
  { from: 'miia',    to: 'amiya',    type: 'friend' },
  { from: 'miia',    to: 'miya',     type: 'friend' },
  { from: 'mia',     to: 'amiya',    type: 'friend' },
  { from: 'miya',    to: 'amiya',    type: 'friend' },
  { from: 'haruka',  to: 'mia',      type: 'friend' },
  { from: 'qicheng', to: 'mia',      type: 'friend' },
  { from: 'qicheng', to: 'amiya',    type: 'friend' },

  // Zhehua School
  { from: 'zhaozhao', to: 'nimfa',   type: 'colleague' },
  { from: 'zhaozhao', to: 'nihilib', type: 'colleague' },
  { from: 'zhaozhao', to: 'mowen',   type: 'colleague' },
  { from: 'zhaozhao', to: 'haruka',  type: 'mentor' },
  { from: 'nimfa',    to: 'nihilib', type: 'rival' },
  { from: 'nimfa',    to: 'mowen',   type: 'colleague' },
  { from: 'nihilib',  to: 'mowen',   type: 'colleague' },
  { from: 'mowen',    to: 'mao',     type: 'friend' },
  { from: 'mowen',    to: 'mxy',     type: 'friend' },
  { from: 'zhaozhao', to: 'miya',    type: 'partner' },
  { from: 'mao',      to: 'mxy',     type: 'friend' },
  { from: 'mxy',      to: 'miia',    type: 'friend' },
  { from: 'mxy',      to: 'mia',     type: 'friend' },
  { from: 'mxy',      to: 'amiya',   type: 'friend' },

  // Yin Pai
  { from: 'linshen',  to: 'hamster', type: 'colleague' },
  { from: 'linshen',  to: 'linqian', type: 'friend' },
  { from: 'linshen',  to: 'zero',    type: 'friend' },
  { from: 'hamster',  to: 'linqian', type: 'friend' },

  // Calcla family
  { from: 'linear',   to: 'dora',    type: 'friend' },

  // independent — Cola only links to Amiya and Mia
  { from: 'cola',     to: 'amiya',   type: 'friend' },
  { from: 'cola',     to: 'mia',     type: 'friend' },

  // AI
  { from: 'miia',     to: 'miacubic',type: 'mentor' },
  { from: 'miku',     to: 'eirene',  type: 'mentor' },
  { from: 'damocles', to: 'miia',    type: 'mentor' },

  // special
  { from: 'linkmo',   to: 'quartus', type: 'rival' },

  // other (light gray)
  { from: 'zero',     to: 'eirene',  type: 'other' },
  { from: 'zero',     to: 'damocles',type: 'other' },
  { from: 'eirene',   to: 'damocles',type: 'other' },

  // family/friend (pink)
  { from: 'alice',    to: 'linkmo',  type: 'friend' },
  { from: 'alice',    to: 'miia',    type: 'friend' },
  { from: 'dora',     to: 'alice',   type: 'friend' },
  { from: 'linear',   to: 'linqian', type: 'friend' },
  { from: 'miya',     to: 'mia',     type: 'friend' },
  { from: 'ifchan',   to: 'miia',    type: 'friend' },
  { from: 'ifchan',   to: 'lila',    type: 'friend' },

  // The Little Girl in the Giant Country
  { from: 'changfeng', to: 'chuxia',  type: 'friend' },
  { from: 'changfeng', to: 'xiaoman', type: 'friend' },
  { from: 'changfeng', to: 'xiaogu',  type: 'friend' },
  { from: 'changfeng', to: 'xiaohe',  type: 'friend' },
  { from: 'chuxia',    to: 'xiaoman', type: 'friend' },
  { from: 'chuxia',    to: 'xiaogu',  type: 'friend' },
  { from: 'chuxia',    to: 'xiaohe',  type: 'friend' },
  { from: 'xiaoman',   to: 'xiaogu',  type: 'friend' },
  { from: 'xiaoman',   to: 'xiaohe',  type: 'friend' },
  { from: 'xiaogu',    to: 'xiaohe',  type: 'friend' },
  { from: 'xiaoman',   to: 'miaowu',  type: 'friend' },
  { from: 'xiaogu',    to: 'miaowu',  type: 'friend' },
  { from: 'xiaohe',    to: 'miaowu',  type: 'friend' },
  { from: 'miaowu',    to: 'xiulan',  type: 'neighbor' },
  { from: 'miaowu',    to: 'high-school-student', type: 'neighbor' },
  { from: 'miaowu',    to: 'zhouji',  type: 'neighbor' },
  { from: 'xiulan',    to: 'high-school-student', type: 'neighbor' },
  { from: 'xiulan',    to: 'zhouji',  type: 'friend' },
  { from: 'zhouji',    to: 'high-school-student', type: 'neighbor' },
  { from: 'miaowu',    to: 'miia',    type: 'friend' },
  { from: 'miaowu',    to: 'mxy',     type: 'friend' },

  // Giant Country help squad (per character files & the text)
  { from: 'xiaoman',   to: 'xiulan',  type: 'friend' },
  { from: 'xiaoman',   to: 'zhouji',  type: 'other' },
  { from: 'xiaoman',   to: 'high-school-student', type: 'friend' },
  { from: 'delivery-rider', to: 'miaowu',  type: 'friend' },
  { from: 'delivery-rider', to: 'xiulan',  type: 'friend' },
  { from: 'delivery-rider', to: 'zhouji',  type: 'friend' },
  { from: 'delivery-rider', to: 'high-school-student', type: 'friend' },

  // other group characters (per character files)
  { from: 'gpt',       to: 'wangshu', type: 'friend' },
  { from: 'linmo',     to: 'high-school-student', type: 'other' },
  { from: 'retina',    to: 'miaowu',  type: 'other' },
  { from: 'wangshu',   to: 'miaowu',  type: 'friend' },
  { from: 'neon',      to: 'wangshu', type: 'friend' },
];
