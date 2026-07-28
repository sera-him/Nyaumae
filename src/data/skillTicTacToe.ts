// Skill Tic-Tac-Toe (概率三子棋) Rules
// Extracted from C++ source code

export interface Profession {
  name: string;
  type: string;
  spCost: number | string;
  effect: string;
  color: string;
}

export interface Skill {
  name: string;
  type: string;
  spCost: string;
  effect: string;
  detail?: string;
}

export interface PassiveEffect {
  name: string;
  effect: string;
}

export const skillTicTacToeOverview = {
  title: 'Skill Tic-Tac-Toe — 概率三子棋',
  subtitle: '传统三子棋 × 概率机制 × SP技能系统',
  objective: '将三个己方符号（O 或 X）连成一行、一列或一条对角线',
  coreMechanic: '每个格子有独立的行动成功概率。落子时掷概率骰，若失败则跳过本回合。游戏没有平局（棋盘满时仍可 Rolling Thunder 清空）。',
};

// 概率生成算法说明
export const probabilityAlgorithm = `
概率生成基于正态分布扰动系统：

1. 定义权重函数：p[i] = i^(11/16)，i = 1..N (N = 2,000,000)
2. 定义衰减核：nn[i] = exp(-i²d²/2) / √(2π)，d = 1/120000
3. 通过带排斥采样的轮盘赌选取 9 个互不相同的代表值 res[0..8]
4. 每次抽取后，对全部 p[i] 进行衰减：p[i] /= (1 + nn[|i-res|])
5. 最终每个格子的实际成功率 = 基础值 × res[idx] × d

这确保了 9 个格子的成功率既有关联又有差异，形成复杂的策略空间。
`;

// SP系统规则
export const spSystemRules = {
  title: 'SP (Skill Point) 系统',
  initialSP: [
    { player: '先手 (O)', sp: 10, note: '开局优势较小，拥有信息优势' },
    { player: '后手 (X)', sp: 15, note: '开局优势较大，拥有资源补偿' },
  ],
  spCap: 30,
  spIncome: '+3 SP / 回合',
  failureCompensation: [
    { cell: '中心 (5)', sp: '+3 SP' },
    { cell: '边角 (1,3,7,9)', sp: '+4 SP' },
    { cell: '其他', sp: '+6 SP' },
  ],
  professionTax: [
    { count: '第1个', extra: '0 SP' },
    { count: '第2个', extra: '+5 SP' },
    { count: '第3个', extra: '+10 SP' },
    { count: '第4个', extra: '+15 SP' },
    { count: '第5个', extra: '+20 SP' },
    { count: '第6个', extra: '+25 SP' },
    { count: '第7个', extra: '+30 SP' },
    { count: '第8个', extra: '+35 SP' },
  ],
  buyRules: [
    '购买对手职业：花费 5/3 × 原价',
    '夺取对手职业：花费 10/3 × 原价',
    '遗忘己方职业：返还 ⌊原价/3⌋ SP',
  ],
};

// 职业表
export const professions: Profession[] = [
  {
    name: 'Gambler',
    type: 'Profession',
    spCost: 18,
    effect: '每次行动失败时，20% 概率不跳过回合（获得一次重试机会）',
    color: 'from-rose-400 to-red-400',
  },
  {
    name: 'Mathematician',
    type: 'Profession',
    spCost: 10,
    effect: '可以看到精确到两位小数的成功率（他人只能看到最近的 5% 整数倍）',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    name: 'Tyrant',
    type: 'Profession',
    spCost: 18,
    effect: '获得专属技能「Tyrant\'s Grip」。使用后对手下回合所有 SP 消耗涨价',
    color: 'from-purple-500 to-violet-500',
  },
  {
    name: 'Monk',
    type: 'Profession',
    spCost: 9,
    effect: '每回合开始时，若 SP < 5，自动恢复至 5 SP',
    color: 'from-amber-400 to-yellow-400',
  },
  {
    name: 'Assassin',
    type: 'Profession',
    spCost: 15,
    effect: '对于角落格子 (1,3,7,9)，总成功率 +33%（随机分配）',
    color: 'from-red-500 to-red-600',
  },
  {
    name: 'Investor',
    type: 'Profession',
    spCost: 14,
    effect: '每回合开始时，每持有 7 SP，额外获得 +1 SP',
    color: 'from-emerald-400 to-green-400',
  },
  {
    name: 'Matthew',
    type: 'Profession',
    spCost: 24,
    effect: '每回合可花费 2 SP，选择 2 个空格；较高概率者 +10%，较低概率者 -10%',
    color: 'from-indigo-400 to-blue-500',
  },
  {
    name: 'Capitalist',
    type: 'Profession',
    spCost: 27,
    effect: '对手每次花费 SP 时，你获得其花费量的 10%（四舍五入）。SP Siphon 成功后自动再次触发 Siphon',
    color: 'from-yellow-400 to-amber-500',
  },
];

// 主动技能表
export const activeSkills: Skill[] = [
  {
    name: 'Rolling Thunder',
    type: 'Active',
    spCost: 'max(1, 25 + n(n+1)/2 - r - ⌊r²/42⌋)',
    effect: '落雷攻击所有已占用的棋子，每颗棋子独立判定是否被移除',
    detail: 'n = 已使用次数, r = 距上次使用回合数。价格随使用次数递增，随冷却时间递减',
  },
  {
    name: 'Swap Fates',
    type: 'Active',
    spCost: '15',
    effect: '交换任意两个格子的成功率。若涉及中心格则消耗 +10 SP',
  },
  {
    name: 'Probability Surge',
    type: 'Active',
    spCost: '10',
    effect: '本回合落子时成功率 +20%',
  },
  {
    name: 'Renew',
    type: 'Active',
    spCost: '10',
    effect: '永久重掷指定格子的成功率（按完整概率生成算法重新生成）',
  },
  {
    name: 'Absolutely Collapse',
    type: 'Active',
    spCost: '22',
    effect: '重新生成全部 9 个格子的成功率',
  },
  {
    name: 'Mind Maze',
    type: 'Active',
    spCost: '12',
    effect: '对手下一回合只能从随机的半数（向上取整）空格中选择',
  },
  {
    name: 'Spatial Seal',
    type: 'Active',
    spCost: '8',
    effect: '指定任意一个格子，持续到对手回合结束前双方均不可选择该格',
  },
  {
    name: 'Decoy Trap',
    type: 'Active',
    spCost: '6',
    effect: '指定任意一个格子，对手看到虚假高概率（显示 = 原真实值 + 14~16%，真实值 = 原真实值 - 4~6%）',
    detail: '显示值比新真实值高约 18~22%',
  },
  {
    name: 'Venture Investment',
    type: 'Active',
    spCost: '20',
    effect: '本回合落子时成功率 +15%；若成功则返还 15 SP，失败不返还',
  },
  {
    name: 'Wheel of Fate',
    type: 'Active',
    spCost: '10',
    effect: '指定任意格子（可占用，自由选择），其成功率变为 0%~100% 完全随机（真实值隐藏，显示白色 ???）',
  },
  {
    name: 'Overdraft Protocol',
    type: 'Active',
    spCost: '-3（恢复 3 SP）',
    effect: '行动成功率 -3% × 透支次数。最大透支次数 = round(SP 上限 / 6)',
  },
  {
    name: 'Debt Repayment',
    type: 'Active',
    spCost: '5',
    effect: '透支次数 -1',
  },
  {
    name: 'Info Overload',
    type: 'Active',
    spCost: '17',
    effect: '对手下一回合受到严重干扰，无法正常读取信息。第 15 次使用后变为永久',
  },
  {
    name: 'Grid Rewrite',
    type: 'Active',
    spCost: '5 + 2x',
    effect: '封锁对手全部格子，给对手一个 1-9 键盘（数字随机对应物理格子）。对手点击数字解锁对应格子并尝试落子；若对手也使用 Grid Rewrite 则解除封锁',
  },
  {
    name: 'SP Siphon',
    type: 'Active / Special',
    spCost: '0',
    effect: '跳过本回合（不落子），从对手吸取 1 SP；若对手本回合失败，额外吸取其 30% SP（向下取整）',
  },
  {
    name: 'Skip Protocol',
    type: 'Active / Special',
    spCost: '-5（恢复 5 SP）',
    effect: '跳过本回合（不落子）。若对手上回合使用了 SP Siphon，则 Siphon 被无效化，且对手接下来 1 回合（若对手为资本家）或 2 回合（否则）无法获得任何 SP，也无法使用 SP Siphon',
  },
  {
    name: 'Capacitor Core',
    type: 'Active / Special',
    spCost: '-3（恢复 3 SP）',
    effect: '跳过本回合（不落子）。SP 上限永久 ×1.2（向下取整），上限不超过 2^60',
  },
  {
    name: 'Matthew Shift',
    type: 'Active',
    spCost: '2',
    effect: '选择任意两个格子；较高概率者 +10%，较低概率者 -10%（花费 2 SP）。必须拥有 Matthew 职业',
  },
  {
    name: 'Tyrant\'s Grip',
    type: 'Active',
    spCost: '0 + 每用 +5 / 每停 -3（最低 0）',
    effect: '对手下回合所有 SP 消耗涨价为 ceil(1.5x+5)，最低 -5。职业价格也受影响。必须拥有 Tyrant 职业',
  },
];

// Lightning Rod 系列（被动/物品系统）
export const lightningRodSystem = [
  {
    name: 'Lightning Rod — Purchase',
    type: 'Item',
    spCost: 'round(42·ln(1+4x/27))',
    effect: 'x = 单次购买数量，批量购买有折扣。获得 Lightning Rod 道具',
  },
  {
    name: 'Lightning Rod — Deploy',
    type: 'Active',
    spCost: '0（消耗道具）',
    effect: '在任意格子部署，成功放置概率 = 该格成功率 × 35% + 20%。每玩家每格最多 9 根，总计最多 10 根。超限后成功率固定为 27.5%，成功后对手失去 1 根',
  },
  {
    name: 'Lightning Rod — Shield',
    type: 'Passive',
    spCost: '0',
    effect: 'a = (自身杆数 × 2 + (自己的雷?4:3)) × (自己的雷?1.2:1)。落雷命中概率 = 3×(1-(a/26.5)²)/a',
  },
  {
    name: 'Lightning Rod — Reckoning',
    type: 'Passive',
    spCost: '0',
    effect: '落雷命中后，该格双方杆数量均减半（向上取整）。棋子被劈掉的主人获得 ceil(自己的杆数/2) SP，对方不给',
  },
];

// 概率颜色参考

