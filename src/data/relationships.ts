export type RelationType = 'mentor' | 'colleague' | 'friend' | 'neighbor' | 'rival' | 'partner' | 'other';

export interface CharacterRelation {
  from: string;
  to: string;
  type: RelationType;
}

export interface NetworkNode {
  id: string;
  name: string;
  group: string;
  x: number;
  y: number;
}

export const relationLabels: Record<RelationType, string> = {
  mentor: '作者作品',
  colleague: '同事',
  friend: '亲人/朋友',
  neighbor: '邻居',
  rival: '对面',
  partner: '合作伙伴',
  other: '其他',
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

/* ═══════════════════════════════════════════
   nodes
   ═══════════════════════════════════════════ */
export const networkNodes: NetworkNode[] = [
  // mia-family (6) 粉色
  { id: 'mimi',       name: '米迷',   group: 'mia-family', x: 23.67, y: 19.14 },
  { id: 'qicheng',    name: '棋程',   group: 'mia-family', x: 36.26, y: 22.28 },
  { id: 'miia',       name: '咪呀',   group: 'mia-family', x: 44.13, y: 41.17 },
  { id: 'mia',        name: 'Mia',    group: 'mia-family', x: 26.82, y: 49.04 },
  { id: 'amiya',      name: '米娅',   group: 'mia-family', x: 15.80, y: 39.60 },
  { id: 'miya',       name: '米雅',   group: 'mia-family', x: 12.65, y: 23.86 },

  // zhihua (7) 紫色
  { id: 'zhaozhao',   name: '赵召',   group: 'zhihua',   x: 89.80, y: 45.57 },
  { id: 'nimfa',      name: 'Nimfa',  group: 'zhihua',   x: 94.51, y: 19.14 },
  { id: 'nihilib',    name: 'Nihilib',group: 'zhihua',   x: 98.00, y: 32.52 },
  { id: 'mowen',      name: '墨问',   group: 'zhihua',   x: 80.34, y: 15.99 },
  { id: 'haruka',     name: '星野遥', group: 'zhihua',   x: 67.95, y: 44.65 },
  { id: 'mao',        name: '墨奥幂', group: 'zhihua',   x: 64.60, y: 31.73 },
  { id: 'mxy',        name: '墨璇玥', group: 'zhihua',   x: 65.53, y: 17.04 },

  // impact (4) 青色
  { id: 'linshen',    name: '林深',   group: 'impact',   x: 69.16, y: 68.03 },
  { id: 'linqian',    name: '林浅',   group: 'impact',   x: 81.61, y: 77.43 },
  { id: 'hamster',    name: '哈姆诗', group: 'impact',   x: 67.35, y: 82.89 },
  { id: 'zero',       name: '零',     group: 'impact',   x: 55.20, y: 72.58 },

  // other (2) 橙色
  { id: 'linear',     name: '莱尼尔', group: 'other',    x: 98.00, y: 73.49 },
  { id: 'dora',       name: '朵拉',   group: 'other',    x: 90.41, y: 61.34 },

  // independent (6) 蓝色
  { id: 'miku',       name: '初音ミク', group: 'independent', x: 36.39, y: 71.66 },
  { id: 'alice',      name: '爱丽丝', group: 'independent', x: 23.34, y: 64.99 },
  { id: 'lila',       name: 'Līlā',   group: 'independent', x: 16.66, y: 78.95 },
  { id: 'cola',       name: '可乐',   group: 'independent', x:  9.67, y: 58.32 },
  { id: 'linkmo',     name: '林可梦', group: 'independent', x: 29.71, y: 85.01 },
  { id: 'ifchan',     name: 'あいえふちゃん', group: 'independent', x:  3.00, y: 75.50 },

  // 数字生命 (3) 红色
  { id: 'miacubic',   name: 'mia³',   group: 'ai',       x: 74.62, y: 56.19 },
  { id: 'eirene',     name: 'Eirene', group: 'ai',       x: 41.24, y: 56.49 },
  { id: 'damocles',   name: 'Damocles',group:'ai',       x: 55.20, y: 55.28 },

  // 特殊 (1) 白色
  { id: 'quartus',    name: '卡塔斯', group: 'special',  x: 45.49, y: 85.01 },

  // 《大人国的小女孩》角色集中区
  { id: 'changfeng',  name: '长风',     group: 'giant', x: 20, y: 16 },
  { id: 'chuxia',     name: '初夏',     group: 'giant', x: 36, y: 16 },
  { id: 'xiaoman',    name: '小满',     group: 'giant', x: 18, y: 30 },
  { id: 'xiaogu',     name: '小谷',     group: 'giant', x: 30, y: 38 },
  { id: 'xiaohe',     name: '小禾',     group: 'giant', x: 42, y: 30 },
  { id: 'miaowu',     name: '喵呜',     group: 'giant', x: 50, y: 38 },
  { id: 'xiulan',     name: '秀兰奶奶', group: 'giant', x: 60, y: 16 },
  { id: 'zhouji',     name: '周济',     group: 'giant', x: 74, y: 16 },
  { id: 'high-school-student', name: '陈予安', group: 'giant', x: 68, y: 30 },
];

/* ═══════════════════════════════════════════
   edges
   ═══════════════════════════════════════════ */
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
  { from: 'amiya',   to: 'miya',     type: 'friend' },
  { from: 'miya',    to: 'amiya',    type: 'friend' },
  { from: 'haruka',  to: 'mia',      type: 'friend' },
  { from: 'qicheng', to: 'mia',      type: 'friend' },
  { from: 'qicheng', to: 'amiya',    type: 'friend' },

  // 哲华学校
  { from: 'zhaozhao', to: 'nimfa',   type: 'colleague' },
  { from: 'zhaozhao', to: 'nihilib', type: 'colleague' },
  { from: 'zhaozhao', to: 'mowen',   type: 'colleague' },
  { from: 'zhaozhao', to: 'haruka',  type: 'mentor' },
  { from: 'nimfa',    to: 'nihilib', type: 'rival' },
  { from: 'nimfa',    to: 'mowen',   type: 'colleague' },
  { from: 'nihilib',  to: 'mowen',   type: 'colleague' },
  { from: 'mowen',    to: 'mao',     type: 'friend' },
  { from: 'mowen',    to: 'mxy',     type: 'friend' },
  // mowen→miya 已删除，改为 zhaozhao→miya
  { from: 'zhaozhao', to: 'miya',    type: 'partner' },
  { from: 'mao',      to: 'mxy',     type: 'friend' },
  { from: 'mxy',      to: 'miia',    type: 'friend' },
  { from: 'mxy',      to: 'mia',     type: 'friend' },
  { from: 'mxy',      to: 'amiya',   type: 'friend' },

  // 因派
  { from: 'linshen',  to: 'hamster', type: 'colleague' },
  { from: 'linshen',  to: 'linqian', type: 'friend' },
  { from: 'linshen',  to: 'zero',    type: 'friend' },
  { from: 'hamster',  to: 'linqian', type: 'friend' },

  // 卡可拉家
  { from: 'linear',   to: 'dora',    type: 'friend' },

  // 独立角色 — 可乐只连米娅和Mia
  { from: 'cola',     to: 'amiya',   type: 'friend' },
  { from: 'cola',     to: 'mia',     type: 'friend' },

  // AI
  { from: 'miia',     to: 'miacubic',type: 'mentor' },
  // nimfa→miacubic mentor 已删除（mia³是mia的脑波诞生，不是Nimfa的作品）
  { from: 'miku',     to: 'eirene',  type: 'mentor' },
  { from: 'damocles', to: 'miia',    type: 'mentor' },

  // 特殊
  { from: 'linkmo',   to: 'quartus', type: 'rival' },

  // 新增：其他（浅灰色）
  { from: 'zero',     to: 'eirene',  type: 'other' },
  { from: 'zero',     to: 'damocles',type: 'other' },
  { from: 'eirene',   to: 'damocles',type: 'other' },

  // 新增：亲人/朋友（粉色）
  { from: 'alice',    to: 'linkmo',  type: 'friend' },
  { from: 'alice',    to: 'miia',    type: 'friend' },
  { from: 'dora',     to: 'alice',   type: 'friend' },
  { from: 'linear',   to: 'linqian', type: 'friend' },
  { from: 'miya',     to: 'mia',     type: 'friend' },
  { from: 'ifchan',   to: 'miia',    type: 'friend' },
  { from: 'ifchan',   to: 'lila',    type: 'friend' },

  // 《大人国的小女孩》
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
];
