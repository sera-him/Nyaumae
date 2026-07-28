// ============================================================
// 棋钟预设数据
// ============================================================

export type EntropyType = 'erosion' | 'accelerando' | 'surge' | 'pool' | 'bounty' | 'tug_of_war';

export interface ClockPreset {
  id: number;
  category: string;
  label: string;
  /** 初始时间（毫秒） */
  initialMs: number;
  /** 每步加时（毫秒） */
  incrementMs: number;
  /** 首步额外时间（毫秒） */
  firstMoveExtraMs: number;
  /** 是否正计时（不计胜负） */
  isCountUp: boolean;
  /** Entropy 变体类型 */
  entropyType?: EntropyType;
  /** 规则说明（UI 显示） */
  description: string;
}

export const CLOCK_PRESETS: ClockPreset[] = [
  // ── Flash ──
  { id: 1,  category: 'Flash',     label: '1/4+1', initialMs:  15_000, incrementMs:  1_000, firstMoveExtraMs: 0, isCountUp: false, description: '15s 基础，每步 +1s' },
  { id: 2,  category: 'Flash',     label: '1+0',   initialMs:  60_000, incrementMs:      0, firstMoveExtraMs: 0, isCountUp: false, description: '1min 基础，无加时' },
  { id: 3,  category: 'Flash',     label: '2+1',   initialMs: 120_000, incrementMs:  1_000, firstMoveExtraMs: 0, isCountUp: false, description: '2min 基础，每步 +1s' },

  // ── Bullet ──
  { id: 4,  category: 'Bullet',    label: '3+1',   initialMs: 180_000, incrementMs:  1_000, firstMoveExtraMs: 0, isCountUp: false, description: '3min 基础，每步 +1s' },
  { id: 5,  category: 'Bullet',    label: '5+0',   initialMs: 300_000, incrementMs:      0, firstMoveExtraMs: 0, isCountUp: false, description: '5min 基础，无加时' },
  { id: 6,  category: 'Bullet',    label: '5+2',   initialMs: 300_000, incrementMs:  2_000, firstMoveExtraMs: 0, isCountUp: false, description: '5min 基础，每步 +2s' },

  // ── Blitz ──
  { id: 7,  category: 'Blitz',     label: '10+3',  initialMs: 600_000, incrementMs:  3_000, firstMoveExtraMs: 0, isCountUp: false, description: '10min 基础，每步 +3s' },
  { id: 8,  category: 'Blitz',     label: '15+0',  initialMs: 900_000, incrementMs:      0, firstMoveExtraMs: 0, isCountUp: false, description: '15min 基础，无加时' },

  // ── Rapid ──
  { id: 9,  category: 'Rapid',     label: '20+10', initialMs: 1_200_000, incrementMs: 10_000, firstMoveExtraMs: 0, isCountUp: false, description: '20min 基础，每步 +10s' },
  { id: 10, category: 'Rapid',     label: '30+5',  initialMs: 1_800_000, incrementMs:  5_000, firstMoveExtraMs: 0, isCountUp: false, description: '30min 基础，每步 +5s' },

  // ── Classical ──
  { id: 11, category: 'Classical', label: '30+30', initialMs: 1_800_000, incrementMs: 30_000, firstMoveExtraMs: 0, isCountUp: false, description: '30min 基础，每步 +30s' },
  { id: 12, category: 'Classical', label: '60+30', initialMs: 3_600_000, incrementMs: 30_000, firstMoveExtraMs: 0, isCountUp: false, description: '60min 基础，每步 +30s' },
  { id: 13, category: 'Classical', label: '90+30', initialMs: 5_400_000, incrementMs: 30_000, firstMoveExtraMs: 0, isCountUp: false, description: '90min 基础，每步 +30s' },

  // ── Turtle（含正计时）──
  { id: 14, category: 'Turtle',    label: '150+30', initialMs: 9_000_000, incrementMs: 30_000, firstMoveExtraMs: 0, isCountUp: false, description: '150min 基础，每步 +30s' },
  { id: 15, category: 'Turtle',    label: '正计时',  initialMs: 0, incrementMs: 0, firstMoveExtraMs: 0, isCountUp: true,  description: '不计胜负，纯记录用时' },

  // ── Entropy ──
  // Erosion：初始60min，每步扣5s。先判胜负再扣时间。
  { id: 16, category: 'Entropy',   label: 'Erosion',   initialMs: 3_600_000, incrementMs: 0, firstMoveExtraMs: 0, isCountUp: false, entropyType: 'erosion',     description: '初始 60min，每走一步扣 5s。先判胜负再扣时' },
  // Accelerando：1,209,600（86400×14）token，第N秒扣N token
  { id: 17, category: 'Entropy',   label: 'Accelerando', initialMs: 1_209_600, incrementMs: 0, firstMoveExtraMs: 0, isCountUp: false, entropyType: 'accelerando', description: '1,209,600 Token（2周）。第1秒扣1、第2秒扣2……越扣越快' },
  // Surge：基础1min，每步+60s
  { id: 18, category: 'Entropy',   label: 'Surge',      initialMs: 60_000,  incrementMs: 60_000, firstMoveExtraMs: 0, isCountUp: false, entropyType: 'surge',       description: '初始仅 1min，每步 +60s，越走时间越多' },
  // Pool：共享60min，超步限判负，共享耗尽平局
  { id: 19, category: 'Entropy',   label: 'Pool',       initialMs: 3_600_000, incrementMs: 0, firstMoveExtraMs: 0, isCountUp: false, entropyType: 'pool',        description: '共享 60min，超限判负；共享耗尽平局' },
  // Bounty：初始10min，无每步加时。棋盘中间4行（row 5-8, 0-indexed 4-7）每格120s，序列递减
  { id: 20, category: 'Entropy',   label: 'Bounty',     initialMs: 600_000, incrementMs: 0, firstMoveExtraMs: 0, isCountUp: false, entropyType: 'bounty',      description: '初始 10min，无加时。棋盘中间4行（row 5–8）每格藏有 120s 时间币，踩到加时，序列递减（120→60→30→20→15→10→5）' },
  // Tug of War：拔河。白方走棋扣时、黑方走棋加时，到±5min判负
  { id: 21, category: 'Entropy',   label: 'Tug of War', initialMs: 0, incrementMs: 0, firstMoveExtraMs: 0, isCountUp: false, entropyType: 'tug_of_war', description: '白方走棋扣时、黑方走棋加时，到 -5min 白方输、到 +5min 黑方输' },
];

/** 根据 preset id 查找 */
export function getPreset(id: number): ClockPreset | undefined {
  return CLOCK_PRESETS.find(p => p.id === id);
}

/** 分类排序 */
export const CATEGORY_ORDER = ['Flash', 'Bullet', 'Blitz', 'Rapid', 'Classical', 'Turtle', 'Entropy'];
