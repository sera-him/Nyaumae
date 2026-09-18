import type { NctbDimensionId, NctbReport } from './types.ts';
import { TRIAL_TASKS, type TrialRecords, type TrialTaskId } from './interactive/trials.ts';

/**
 * FSIQ-style index layer, modeled on the Wechsler structure (WAIS-IV /
 * WISC-V / WAIS-5): five primary indices — Verbal Comprehension (VCI),
 * Visual Spatial (VSI), Fluid Reasoning (FRI), Working Memory (WMI) and
 * Processing Speed (PSI) — combine into a full-scale composite. NCTB keeps
 * its two signature dimensions (planning, transfer) as an ancillary index.
 *
 * Evidence for each index comes from two sources:
 *  - exam dimensions (the formal 10-dimension question battery), and
 *  - interactive trials (web-native subtests). When an index offers several
 *    trials, ANY ONE completed trial is enough — the best score counts,
 *    mirroring Wechsler supplemental-subtest substitution.
 *
 * Everything is rescaled onto the familiar Wechsler-style metrics for
 * readability only: subtest scaled scores M=10/SD=3 (shown 1–19) and index
 * standard scores M=100/SD=15 (shown 55–145). These are LOCAL EXPLORATION
 * numbers computed from this device's data — not normed, not a clinical IQ.
 */

export type NctbIndexId = 'vci' | 'vsi' | 'fri' | 'wmi' | 'psi' | 'stp';

export interface NctbIndexDef {
  id: NctbIndexId;
  code: string;
  title: string;
  english: string;
  description: string;
  dimensionIds: NctbDimensionId[];
  trialIds: TrialTaskId[];
  accent: string;
  ancillary?: boolean;
}

export const NCTB_INDICES: readonly NctbIndexDef[] = [
  {
    id: 'vci',
    code: 'VCI',
    title: '言语理解',
    english: 'VERBAL COMPREHENSION',
    description: '从文本中提取条件、含义与逻辑关系，对应韦氏的类同 / 词汇 / 常识分测验。',
    dimensionIds: ['language'],
    trialIds: [],
    accent: '#ff9fc8',
  },
  {
    id: 'vsi',
    code: 'VSI',
    title: '视觉空间',
    english: 'VISUAL SPATIAL',
    description: '在脑中旋转、映射和比较空间结构，对应积木图案 / 视觉拼图分测验。',
    dimensionIds: ['space'],
    trialIds: ['rotation'],
    accent: '#91c7ff',
  },
  {
    id: 'fri',
    code: 'FRI',
    title: '流体推理',
    english: 'FLUID REASONING',
    description: '发现新规律、推演因果与数量关系，对应矩阵推理 / 图形称重分测验。',
    dimensionIds: ['pattern', 'quantity', 'causality'],
    trialIds: ['hanoi'],
    accent: '#8deee0',
  },
  {
    id: 'wmi',
    code: 'WMI',
    title: '工作记忆',
    english: 'WORKING MEMORY',
    description: '在有限时间内保持、更新和重排信息，对应数字广度 / 图片广度分测验。',
    dimensionIds: ['memory'],
    trialIds: ['memory-matrix', 'digit-span'],
    accent: '#bfa8ff',
  },
  {
    id: 'psi',
    code: 'PSI',
    title: '加工速度',
    english: 'PROCESSING SPEED',
    description: '在干扰与时间压力下保持又快又准，对应译码 / 符号检索 / 划消分测验。',
    dimensionIds: ['speed', 'attention'],
    trialIds: ['reaction', 'stroop', 'coding', 'symbol-search', 'visual-search'],
    accent: '#ffbf7c',
  },
  {
    id: 'stp',
    code: 'STP',
    title: '策略与迁移',
    english: 'STRATEGY & TRANSFER',
    description: 'NCTB 特色补充指数：拆解目标、管理资源，并把策略迁移到新问题。',
    dimensionIds: ['planning', 'transfer'],
    trialIds: [],
    accent: '#a6d8ff',
    ancillary: true,
  },
];

export const PRIMARY_INDICES = NCTB_INDICES.filter((index) => !index.ancillary);

export function getNctbIndex(id: NctbIndexId): NctbIndexDef {
  return NCTB_INDICES.find((index) => index.id === id) ?? NCTB_INDICES[0];
}

/** Wechsler-style classification bands for standard scores (M=100, SD=15). */
export function classifyStandardScore(score: number): string {
  if (score >= 130) return '极优秀';
  if (score >= 120) return '优秀';
  if (score >= 110) return '中上';
  if (score >= 90) return '平均范围';
  if (score >= 80) return '中下';
  if (score >= 70) return '边界';
  return '低于边界';
}

/** Map a 0–100 descriptive score onto the M=100 / SD=15 display scale (55–145). */
export function toStandardScore(raw: number): number {
  return Math.round(55 + Math.max(0, Math.min(100, raw)) * 0.9);
}

/** Map a 0–100 descriptive score onto the M=10 / SD=3 subtest scale (1–19). */
export function toScaledScore(raw: number): number {
  return Math.max(1, Math.min(19, Math.round(1 + Math.max(0, Math.min(100, raw)) * 0.18)));
}

export interface IndexEvidence {
  kind: 'exam' | 'trial';
  refId: string;
  label: string;
  raw: number;
  scaled: number;
  counted: boolean;
}

export interface IndexScore {
  index: NctbIndexDef;
  raw: number | null;
  standard: number | null;
  classification: string | null;
  evidence: IndexEvidence[];
  /** 'none' = 无数据；'partial' = 只有考试或只有试炼；'full' = 两类证据都有 */
  coverage: 'none' | 'partial' | 'full';
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((total, value) => total + value, 0) / values.length;
}

export function computeIndexScores(report: NctbReport | undefined, trials: TrialRecords): IndexScore[] {
  return NCTB_INDICES.map((index) => {
    const evidence: IndexEvidence[] = [];

    const examScores: number[] = [];
    for (const dimensionId of index.dimensionIds) {
      const result = report?.dimensions.find((item) => item.dimensionId === dimensionId);
      if (!result) continue;
      examScores.push(result.score);
      evidence.push({
        kind: 'exam',
        refId: dimensionId,
        label: dimensionId,
        raw: Math.round(result.score),
        scaled: toScaledScore(result.score),
        counted: true,
      });
    }

    const completedTrials = index.trialIds
      .map((taskId) => ({ taskId, record: trials[taskId] }))
      .filter((entry): entry is { taskId: TrialTaskId; record: NonNullable<TrialRecords[TrialTaskId]> } => Boolean(entry.record));
    const bestTrial = completedTrials.reduce<(typeof completedTrials)[number] | undefined>(
      (best, entry) => (!best || entry.record.bestScore > best.record.bestScore ? entry : best),
      undefined,
    );
    for (const entry of completedTrials) {
      const meta = TRIAL_TASKS.find((task) => task.id === entry.taskId);
      evidence.push({
        kind: 'trial',
        refId: entry.taskId,
        label: meta?.title ?? entry.taskId,
        raw: entry.record.bestScore,
        scaled: toScaledScore(entry.record.bestScore),
        counted: bestTrial?.taskId === entry.taskId,
      });
    }

    const examPart = mean(examScores);
    const trialPart = bestTrial ? bestTrial.record.bestScore : null;
    const parts = [examPart, trialPart].filter((value): value is number => value !== null);
    const raw = mean(parts);
    const standard = raw === null ? null : toStandardScore(raw);
    return {
      index,
      raw: raw === null ? null : Math.round(raw),
      standard,
      classification: standard === null ? null : classifyStandardScore(standard),
      evidence,
      coverage: examPart !== null && trialPart !== null ? 'full' : raw === null ? 'none' : 'partial',
    };
  });
}

export interface CompositeScore {
  standard: number;
  classification: string;
  coverage: number;
  total: number;
}

/** FSIQ-style composite: mean of the available primary-index standard scores. */
export function computeComposite(scores: IndexScore[]): CompositeScore | null {
  const primary = scores.filter((score) => !score.index.ancillary && score.standard !== null);
  if (primary.length === 0) return null;
  const standard = Math.round(primary.reduce((total, score) => total + (score.standard ?? 0), 0) / primary.length);
  return {
    standard,
    classification: classifyStandardScore(standard),
    coverage: primary.length,
    total: PRIMARY_INDICES.length,
  };
}
