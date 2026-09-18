import { readJsonStorage, writeJsonStorage } from '@/lib/browserStorage.ts';
import type { NctbDimensionId } from '../types.ts';
import type { NctbIndexId } from '../indices.ts';

/**
 * Interactive trials are web-native ability probes: they measure timing,
 * pointing, sequence playback and manipulation directly in the browser,
 * instead of asking multiple-choice questions. They live next to the formal
 * exam but never touch its item bank, session engine or report scoring.
 *
 * Each trial is mapped to an FSIQ-style index (see ../indices.ts). When an
 * index offers several trials, completing any ONE of them is enough — the
 * best completed score counts, mirroring how Wechsler supplemental subtests
 * can substitute for core ones.
 */

export type TrialTaskId =
  | 'reaction'
  | 'memory-matrix'
  | 'stroop'
  | 'rotation'
  | 'hanoi'
  | 'visual-search'
  | 'digit-span'
  | 'coding'
  | 'symbol-search';

export interface TrialTaskMeta {
  id: TrialTaskId;
  dimensionId: NctbDimensionId;
  indexId: NctbIndexId;
  index: string;
  title: string;
  english: string;
  tagline: string;
  instructions: string[];
  accent: string;
}

export interface TrialResult {
  score: number;
  headline: string;
  detail: string;
}

export interface TrialRecord {
  attempts: number;
  bestScore: number;
  lastScore: number;
  lastHeadline: string;
  updatedAt: string;
}

export type TrialRecords = Partial<Record<TrialTaskId, TrialRecord>>;

export const TRIAL_TASKS: readonly TrialTaskMeta[] = [
  {
    id: 'reaction',
    dimensionId: 'speed',
    indexId: 'psi',
    index: 'T1',
    title: '闪电反应',
    english: 'REFLEX',
    tagline: '信号亮起的瞬间点击，直接测量 5 次纯反应时。',
    instructions: [
      '点击区域后进入待命，等待它变成亮青色。',
      '变色的瞬间立刻点击，共测 5 次。',
      '提前点击算抢跑，会扣分并重来本轮。',
    ],
    accent: '#ffbf7c',
  },
  {
    id: 'memory-matrix',
    dimensionId: 'memory',
    indexId: 'wmi',
    index: 'T2',
    title: '记忆矩阵',
    english: 'SEQUENCE',
    tagline: '九宫格依次亮起，凭记忆按同样顺序点回去。',
    instructions: [
      '先看九宫格依次亮起的顺序，从 3 步开始。',
      '亮完后按相同顺序点击格子。',
      '点对就加长一步，点错即结束，最长 12 步。',
    ],
    accent: '#bfa8ff',
  },
  {
    id: 'stroop',
    dimensionId: 'attention',
    indexId: 'psi',
    index: 'T3',
    title: '色词干扰',
    english: 'STROOP',
    tagline: '字义与墨色打架时，抑制字义、只认墨色。',
    instructions: [
      '屏幕中央会出现一个颜色词，但字的颜色是另一种。',
      '请点击字的「墨水颜色」，不要读字义。',
      '限时 30 秒，答得又快又准分数越高。',
    ],
    accent: '#74efe0',
  },
  {
    id: 'rotation',
    dimensionId: 'space',
    indexId: 'vsi',
    index: 'T4',
    title: '旋转归位',
    english: 'ROTATION',
    tagline: '在脑中预判角度，把箭头转到与目标一致的方向。',
    instructions: [
      '左侧是目标方向，右侧是你的箭头。',
      '用顺 / 逆时针按钮（或方向键）每次旋转 45°。',
      '方向一致即完成一轮，共 6 轮，用时越短越好。',
    ],
    accent: '#91c7ff',
  },
  {
    id: 'hanoi',
    dimensionId: 'planning',
    indexId: 'fri',
    index: 'T5',
    title: '汉诺塔',
    english: 'TOWER',
    tagline: '把 4 层圆盘整体搬到另一根柱子，步数逼近最优解。',
    instructions: [
      '点击柱子拿起最上层圆盘，再点击目标柱子放下。',
      '任何时刻大圆盘都不能压在小圆盘上。',
      '4 层最优解是 15 步，步数越接近分数越高。',
    ],
    accent: '#a6d8ff',
  },
  {
    id: 'visual-search',
    dimensionId: 'pattern',
    indexId: 'psi',
    index: 'T6',
    title: '目标搜索',
    english: 'SEARCH',
    tagline: '在 48 个相似符号里，用眼睛筛出全部 8 个目标。',
    instructions: [
      '网格里混着 ○、◎ 和 8 个 ◉。',
      '找出并点击全部 ◉，点错会扣分。',
      '全部找完即结束，用时越短分数越高。',
    ],
    accent: '#8deee0',
  },
  {
    id: 'digit-span',
    dimensionId: 'memory',
    indexId: 'wmi',
    index: 'T7',
    title: '数字广度',
    english: 'DIGIT SPAN',
    tagline: '韦氏经典分测验：数字逐个出现，先正背、再倒背。',
    instructions: [
      '数字会逐个闪现，每秒一个，看完用键盘复述。',
      '第一阶段按原顺序正背，从 3 位开始逐次加 1。',
      '第二阶段按相反顺序倒背，从 2 位开始逐次加 1。',
    ],
    accent: '#d8b5ff',
  },
  {
    id: 'coding',
    dimensionId: 'speed',
    indexId: 'psi',
    index: 'T8',
    title: '符号译码',
    english: 'CODING',
    tagline: '韦氏经典分测验：对照密码表，60 秒尽量多地破译符号。',
    instructions: [
      '顶部是 9 个符号对应的数字密码表。',
      '下方逐个出现符号，按它对应的数字键。',
      '限时 60 秒，译对越多、错误越少分数越高。',
    ],
    accent: '#ffd17a',
  },
  {
    id: 'symbol-search',
    dimensionId: 'attention',
    indexId: 'psi',
    index: 'T9',
    title: '符号检索',
    english: 'SYMBOL SEARCH',
    tagline: '韦氏经典分测验：判断目标符号是否藏在序列里。',
    instructions: [
      '左侧给出 2 个目标符号，右侧是一排候选符号。',
      '只要任一目标出现就点「有」，都没出现就点「无」。',
      '限时 60 秒，判断又快又准分数越高。',
    ],
    accent: '#9ff2b8',
  },
];

export function getTrialTask(id: TrialTaskId): TrialTaskMeta {
  return TRIAL_TASKS.find((task) => task.id === id) ?? TRIAL_TASKS[0];
}

const TRIAL_STORAGE_KEY = 'neural-connection:nctb-trials:v1';

function isTrialTaskId(value: unknown): value is TrialTaskId {
  return typeof value === 'string' && TRIAL_TASKS.some((task) => task.id === value);
}

function isTrialRecord(value: unknown): value is TrialRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Number.isInteger(record.attempts)
    && (record.attempts as number) > 0
    && typeof record.bestScore === 'number'
    && record.bestScore >= 0
    && record.bestScore <= 100
    && typeof record.lastScore === 'number'
    && record.lastScore >= 0
    && record.lastScore <= 100
    && typeof record.lastHeadline === 'string'
    && typeof record.updatedAt === 'string';
}

export function loadTrialRecords(): TrialRecords {
  try {
    const parsed = readJsonStorage<unknown>(TRIAL_STORAGE_KEY, null).value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([key, value]) => isTrialTaskId(key) && isTrialRecord(value)),
    ) as TrialRecords;
  } catch {
    return {};
  }
}

export function saveTrialRecords(records: TrialRecords): boolean {
  return writeJsonStorage(TRIAL_STORAGE_KEY, records).persisted;
}

export function recordTrialResult(records: TrialRecords, taskId: TrialTaskId, result: TrialResult): TrialRecords {
  const previous = records[taskId];
  const next: TrialRecord = {
    attempts: (previous?.attempts ?? 0) + 1,
    bestScore: Math.max(previous?.bestScore ?? 0, result.score),
    lastScore: result.score,
    lastHeadline: result.headline,
    updatedAt: new Date().toISOString(),
  };
  return { ...records, [taskId]: next };
}

export function clampScore(value: number): number {
  return Math.max(5, Math.min(100, Math.round(value)));
}
