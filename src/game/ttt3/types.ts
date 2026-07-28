// ============================================================
// 概率三子棋 — 类型定义（从 C++ TTT3.cpp 移植）
// ============================================================

/** 玩家：0=O(先手), 1=X(后手) */
export type TTT3Player = 0 | 1;

/** 棋盘格子：0=空, 1=O, 2=X */
export type CellValue = 0 | 1 | 2;

/** 职业枚举 */
export const Profession = {
  NONE: 0,
  GAMBLER: 1,
  MATHEMATICIAN: 2,
  TYRANT: 3,
  MONK: 4,
  ASSASSIN: 5,
  INVESTOR: 6,
  MATTHEW: 7,
  CAPITALIST: 8,
} as const;
export type Profession = typeof Profession[keyof typeof Profession];

/** 技能枚举 */
export const Skill = {
  NONE: 0,
  ROLLING_THUNDER: 1,
  BUY_ROD: 2,
  DEPLOY_ROD: 3,
  SWAP_FATES: 4,
  PROB_SURGE: 5,
  RENEW: 6,
  COLLAPSE: 7,
  MIND_MAZE: 8,
  SPATIAL_SEAL: 9,
  DECOY: 10,
  VENTURE: 11,
  WHEEL: 12,
  OVERDRAFT: 13,
  DEBT: 14,
  INFO_OVERLOAD: 15,
  GRID_REWRITE: 16,
  SP_SIPHON: 17,
  SKIP_PROTOCOL: 18,
  CAPACITOR: 19,
  MATTHEW_SHIFT: 20,
  TYRANT_GRIP: 21,
} as const;
export type Skill = typeof Skill[keyof typeof Skill];

/** 游戏状态 */
export interface TTT3GameState {
  board: CellValue[];           // 9 格棋盘
  trueR: number[];              // 真实概率（0-100）
  displayR: number[];           // 显示概率（可能被 Decoy 篡改）
  sp: [number, number];         // 双方 SP
  maxSp: [number, number];      // SP 上限
  overdraft: [number, number];  // 透支次数
  rods: [number[], number[]];   // 双方各格子的 rod 数量（已部署）
  totalRods: [number, number];  // 双方 rod 总数（已部署）
  availableRods: [number, number]; // 双方手头可用的 rod 数量
  profCount: [number, number];  // 职业数量（用于计算税费）
  profs: [Profession[], Profession[]]; // 双方拥有的职业
  fear: [boolean, boolean];     // 恐惧（下回合不能用技能）
  probSurge: [boolean, boolean];// 概率 surge（+20%）
  venture: [boolean, boolean];  // venture（+15%，成功返 15 SP）
  mindMaze: [number, number];   // >0 表示被 maze（值为剩余回合）
  mazeAllowed: [number[] | null, number[] | null]; // maze 允许的格子
  spatialSealPos: number;       // -1=无，否则为被封锁的格子
  prevSealPos: number;           // 回合开始时的 seal 位置（用于 C++ 兼容的 seal 持续时间）
  decoyPos: [number, number];   // -1=无，否则为 decoy 格子
  decoyDisplay: [number, number]; // decoy 显示的虚假概率
  infoOverload: [boolean, boolean]; // 是否被 info overload
  infoOverloadUses: [number, number]; // 使用次数
  gridRewriteMap: [number[], number[]]; // 键盘数字对应的物理格子索引
  gridRewriteActive: [boolean, boolean]; // 是否被 grid rewrite 封锁
  tyrantCost: [number, number]; // 暴君当前费用（永久保留）
  tyrantActive: [boolean, boolean]; // 本回合是否被暴君涨价影响
  gridRewriteUnlocked: [boolean[], boolean[]]; // 哪些物理格子已被解锁
  gridRewriteKeysUsed: [boolean[], boolean[]]; // 哪些键盘数字已被使用
  wheelHidden: boolean[];        // true=该格概率被 wheel 隐藏
  skipPunish: [boolean, boolean]; // 是否被 skip punish
  skipPunishTurns: [number, number]; // 剩余惩罚回合
  siphoned: [boolean, boolean];  // 是否被 siphon（失败时额外扣 SP）
  siphonActive: [boolean, boolean]; // siphon 是否激活
  thunderUses: [number, number]; // thunder 使用次数
  thunderLastTurn: [number, number]; // 上次使用 thunder 的回合
  capacitorUses: [number, number]; // capacitor 使用次数
  assassinBonus: [number[], number[]]; // assassin 角落加成
  assassinSaved: [number[], number[]]; // 遗忘 assassin 时保存的加成
  assassinSavedFlag: [boolean, boolean]; // 是否保存过
  skillUsedTurn: [Record<number, number>, Record<number, number>]; // 本回合已用技能计数
  turnCount: number;             // 当前回合数
  currentPlayer: TTT3Player;     // 当前行动玩家
  phase: 'setup' | 'playing' | 'o_wins' | 'x_wins';
  playerOWins: number;
  playerXWins: number;
  // 控制器：0=玩家, 1-3=AI 等级
  controllerO: number;
  controllerX: number;
  // 行动日志
  actionLog: string[];
}

/** 技能信息（UI 用） */
export interface SkillInfo {
  id: Skill;
  name: string;
  nameCn: string;
  spCost: string;
  effect: string;
  category: 'offensive' | 'prob' | 'buff' | 'trick' | 'spatial' | 'rod' | 'special';
  oncePerTurn: boolean;
}

/** 职业信息（UI 用） */
export interface ProfessionInfo {
  id: Profession;
  name: string;
  nameCn: string;
  baseCost: number;
  effect: string;
  color: string;
}

/** 补偿值常量 */
export const COMP_CENTER = 3;
export const COMP_CORNER = 4;
export const COMP_SIDE = 6;
export const SP_CAP_DEFAULT = 30;
export const SP_INCOME = 3;

/** 获胜连线模式 */
export const WIN_PATTERNS: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // 竖
  [0, 4, 8], [2, 4, 6],             // 对角
];

/** 概率颜色（与 C++ colorByProb 一致） */
export function colorByProb(prob: number): string {
  const p = Math.floor(prob);
  if (prob >= 99.995) return '#ffffff';
  if (p >= 90) return '#00ff00';
  if (p >= 80) return '#00aa00';
  if (p >= 70) return '#00ffff';
  if (p >= 60) return '#00aaaa';
  if (p >= 50) return '#ffff00';
  if (p >= 40) return '#aaaa00';
  if (p >= 30) return '#aa00aa';
  if (p >= 20) return '#ff00ff';
  if (p >= 10) return '#aa0000';
  return '#ff0000';
}

/** 概率颜色 Tailwind 类名（用于 bg/text） */
export function probColorClass(prob: number): string {
  const p = Math.floor(prob);
  if (prob >= 99.995) return 'text-white';
  if (p >= 90) return 'text-green-400';
  if (p >= 80) return 'text-green-500';
  if (p >= 70) return 'text-cyan-300';
  if (p >= 60) return 'text-cyan-400';
  if (p >= 50) return 'text-yellow-300';
  if (p >= 40) return 'text-yellow-400';
  if (p >= 30) return 'text-purple-400';
  if (p >= 20) return 'text-fuchsia-400';
  if (p >= 10) return 'text-red-500';
  return 'text-red-400';
}

/** 概率背景色 */
export function probBgClass(prob: number): string {
  const p = Math.floor(prob);
  if (prob >= 99.995) return 'bg-white/10';
  if (p >= 90) return 'bg-green-500/20';
  if (p >= 80) return 'bg-green-600/20';
  if (p >= 70) return 'bg-cyan-500/20';
  if (p >= 60) return 'bg-cyan-600/20';
  if (p >= 50) return 'bg-yellow-500/20';
  if (p >= 40) return 'bg-yellow-600/20';
  if (p >= 30) return 'bg-purple-500/20';
  if (p >= 20) return 'bg-fuchsia-500/20';
  if (p >= 10) return 'bg-red-500/20';
  return 'bg-red-600/20';
}

/** 职业基础花费 */
export const PROF_BASE_COST: Record<Profession, number> = {
  [Profession.NONE]: 0,
  [Profession.GAMBLER]: 18,
  [Profession.MATHEMATICIAN]: 10,
  [Profession.TYRANT]: 18,
  [Profession.MONK]: 9,
  [Profession.ASSASSIN]: 15,
  [Profession.INVESTOR]: 14,
  [Profession.MATTHEW]: 24,
  [Profession.CAPITALIST]: 27,
};

/** 职业中文名 */
export const PROF_NAME_CN: Record<Profession, string> = {
  [Profession.NONE]: '无',
  [Profession.GAMBLER]: '赌徒',
  [Profession.MATHEMATICIAN]: '数学家',
  [Profession.TYRANT]: '暴君',
  [Profession.MONK]: '僧侣',
  [Profession.ASSASSIN]: '刺客',
  [Profession.INVESTOR]: '投资者',
  [Profession.MATTHEW]: '马太',
  [Profession.CAPITALIST]: '资本家',
};

/** 技能中文名 */
export const SKILL_NAME_CN: Record<Skill, string> = {
  [Skill.NONE]: '无',
  [Skill.ROLLING_THUNDER]: 'Rolling Thunder',
  [Skill.BUY_ROD]: 'Buy Lightning Rod',
  [Skill.DEPLOY_ROD]: 'Deploy Rod',
  [Skill.SWAP_FATES]: 'Swap Fates',
  [Skill.PROB_SURGE]: 'Probability Surge',
  [Skill.RENEW]: 'Renew',
  [Skill.COLLAPSE]: 'Absolutely Collapse',
  [Skill.MIND_MAZE]: 'Mind Maze',
  [Skill.SPATIAL_SEAL]: 'Spatial Seal',
  [Skill.DECOY]: 'Decoy Trap',
  [Skill.VENTURE]: 'Venture Investment',
  [Skill.WHEEL]: 'Wheel of Fate',
  [Skill.OVERDRAFT]: 'Overdraft Protocol',
  [Skill.DEBT]: 'Debt Repayment',
  [Skill.INFO_OVERLOAD]: 'Info Overload',
  [Skill.GRID_REWRITE]: 'Grid Rewrite',
  [Skill.SP_SIPHON]: 'SP Siphon',
  [Skill.SKIP_PROTOCOL]: 'Skip Protocol',
  [Skill.CAPACITOR]: 'Capacitor Core',
  [Skill.MATTHEW_SHIFT]: 'Matthew Shift',
  [Skill.TYRANT_GRIP]: 'Tyrant\'s Grip',
};

/** 基础概率系数（C++ base_r） */
export const BASE_R = [4.0, 6.0, 4.0, 6.0, 3.0, 6.0, 4.0, 6.0, 4.0];
