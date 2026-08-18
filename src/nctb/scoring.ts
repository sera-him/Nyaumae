import { NCTB_DIMENSION_IDS } from './catalog.ts';
import { effectiveResponses } from './sessionEngine.ts';
import { getNctbQuestion } from './questionBank.ts';
import type { NctbDimensionResult, NctbReport, NctbSession } from './types.ts';

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function wilsonInterval(correct: number, total: number, z = 1.96): [number, number] {
  if (total <= 0) return [0, 0];
  const proportion = correct / total;
  const zSquared = z ** 2;
  const denominator = 1 + zSquared / total;
  const center = (proportion + zSquared / (2 * total)) / denominator;
  const margin = z * Math.sqrt((proportion * (1 - proportion) + zSquared / (4 * total)) / total) / denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function dimensionResult(session: NctbSession, dimensionId: NctbDimensionResult['dimensionId']): NctbDimensionResult | undefined {
  const responses = effectiveResponses(session).filter((response) => response.dimensionId === dimensionId);
  if (responses.length === 0) return undefined;
  const correct = responses.filter((response) => response.isCorrect).length;
  const [low, high] = wilsonInterval(correct, responses.length);
  const smoothedScore = (correct + 1) / (responses.length + 2);
  const speedTimingCredit = dimensionId === 'speed'
    ? responses.reduce((total, response) => {
      if (!response.isCorrect) return total;
      const question = getNctbQuestion(session.mode, response.itemId, session.bankId);
      if (!question) return total;
      const activeMs = response.activeMs > 0 ? response.activeMs : question.targetMs;
      return total + clamp(question.targetMs / activeMs, 0.25, 1);
    }, 0) / responses.length
    : 0;
  const score = dimensionId === 'speed'
    ? smoothedScore * 75 + speedTimingCredit * 25
    : smoothedScore * 100;
  return {
    dimensionId,
    answered: responses.length,
    correct,
    accuracy: round(correct / responses.length * 100, 1),
    score: round(score),
    ciLow: round(low * 100),
    ciHigh: round(high * 100),
    medianActiveMs: Math.round(median(responses.map((response) => response.activeMs))),
    averageDifficulty: round(responses.reduce((total, response) => total + response.difficulty, 0) / responses.length, 1),
    scoreModel: dimensionId === 'speed' ? 'speed-accuracy' : 'accuracy',
  };
}

export function scoreNctbSession(session: NctbSession): NctbReport {
  const responses = effectiveResponses(session);
  const dimensions = NCTB_DIMENSION_IDS
    .map((dimensionId) => dimensionResult(session, dimensionId))
    .filter((result): result is NctbDimensionResult => Boolean(result));
  const ranked = [...dimensions].sort((left, right) => right.score - left.score || right.answered - left.answered);
  const completeCoverage = dimensions.length === NCTB_DIMENSION_IDS.length;
  const composite = completeCoverage ? {
    score: round(dimensions.reduce((total, result) => total + result.score, 0) / dimensions.length),
    coverage: dimensions.length,
  } : undefined;
  return {
    id: `nctb-report-${session.id}`,
    sessionId: session.id,
    mode: session.mode,
    strategy: session.strategy,
    friendlyMode: session.friendlyMode,
    focusDimension: session.focusDimension,
    createdAt: session.completedAt ?? new Date().toISOString(),
    totalAnswered: responses.length,
    totalCorrect: responses.filter((response) => response.isCorrect).length,
    totalActiveMs: Math.round(session.activeMs),
    interruptionCount: session.interruptionCount,
    dimensions,
    composite,
    strengths: ranked.slice(0, Math.min(2, ranked.length)).map((result) => result.dimensionId),
    focusAreas: [...ranked].reverse().slice(0, Math.min(2, ranked.length)).map((result) => result.dimensionId),
  };
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportToCsv(report: NctbReport): string {
  const header = ['report_id', 'session_id', 'created_at', 'mode', 'strategy', 'friendly_mode', 'dimension', 'answered', 'correct', 'accuracy_percent', 'score', 'ci_low', 'ci_high', 'median_active_ms', 'average_difficulty'];
  const rows = report.dimensions.map((result) => [
    report.id,
    report.sessionId,
    report.createdAt,
    report.mode,
    report.strategy,
    report.friendlyMode,
    result.dimensionId,
    result.answered,
    result.correct,
    result.accuracy,
    result.score,
    result.ciLow,
    result.ciHigh,
    result.medianActiveMs,
    result.averageDifficulty,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
