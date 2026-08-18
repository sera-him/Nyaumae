export type PemsDimensionCode = 'P' | 'E' | 'M' | 'S' | 'L';

export type PemsScores = Record<PemsDimensionCode, number>;

export interface PemsDimensionConfig {
  code: PemsDimensionCode;
  title: string;
  shortLabel: string;
  weight: number;
  threshold: number;
  slope: number;
  color: string;
}

export interface PemsDimensionResult extends PemsDimensionConfig {
  score: number;
  probability: number;
}

export interface PemsEvaluation {
  dimensions: PemsDimensionResult[];
  maturity: number;
  arithmeticMaturity: number;
  bottleneckGap: number;
  demoEquivalentAge: number;
  adultReference: number;
  limitingDimension: PemsDimensionResult;
}

export const PEMS_DIMENSIONS: readonly PemsDimensionConfig[] = [
  { code: 'P', title: '生理发育', shortLabel: '生理', weight: 0.05, threshold: -1.5, slope: 1, color: '#22d3ee' },
  { code: 'E', title: '执行功能', shortLabel: '执行', weight: 0.3, threshold: -0.75, slope: 1.6, color: '#a78bfa' },
  { code: 'M', title: '情绪调节', shortLabel: '情绪', weight: 0.25, threshold: -1, slope: 1.3, color: '#f472b6' },
  { code: 'S', title: '社会互动', shortLabel: '社会', weight: 0.15, threshold: -1.25, slope: 1, color: '#34d399' },
  { code: 'L', title: '语言 / 符号', shortLabel: '语言', weight: 0.25, threshold: -0.75, slope: 1.5, color: '#fbbf24' },
] as const;

export const ADULT_REFERENCE_SCORES = Object.fromEntries(
  PEMS_DIMENSIONS.map((dimension) => [dimension.code, dimension.threshold]),
) as PemsScores;

const DEMO_CURVE_CENTER = 18;
const DEMO_CURVE_SLOPE = 0.22;
const MIN_DEMO_AGE = 0;
const MAX_DEMO_AGE = 30;
const MIN_PROBABILITY = 1e-6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function logistic(value: number) {
  if (value >= 0) {
    const exp = Math.exp(-value);
    return 1 / (1 + exp);
  }

  const exp = Math.exp(value);
  return exp / (1 + exp);
}

export function dimensionProbability(score: number, threshold: number, slope: number) {
  return logistic(slope * (score - threshold));
}

export function demoPopulationMaturity(age: number) {
  return logistic(DEMO_CURVE_SLOPE * (age - DEMO_CURVE_CENTER));
}

export function demoEquivalentAge(maturity: number) {
  const boundedMaturity = clamp(maturity, MIN_PROBABILITY, 1 - MIN_PROBABILITY);
  const rawAge = DEMO_CURVE_CENTER
    + Math.log(boundedMaturity / (1 - boundedMaturity)) / DEMO_CURVE_SLOPE;

  return clamp(rawAge, MIN_DEMO_AGE, MAX_DEMO_AGE);
}

export function evaluatePemsL(scores: PemsScores): PemsEvaluation {
  const dimensions = PEMS_DIMENSIONS.map((dimension) => ({
    ...dimension,
    score: scores[dimension.code],
    probability: dimensionProbability(scores[dimension.code], dimension.threshold, dimension.slope),
  }));

  const maturity = Math.exp(
    dimensions.reduce(
      (total, dimension) => total + dimension.weight * Math.log(Math.max(dimension.probability, MIN_PROBABILITY)),
      0,
    ),
  );
  const arithmeticMaturity = dimensions.reduce(
    (total, dimension) => total + dimension.weight * dimension.probability,
    0,
  );
  const limitingDimension = dimensions.reduce((lowest, dimension) => (
    dimension.probability < lowest.probability ? dimension : lowest
  ));

  return {
    dimensions,
    maturity,
    arithmeticMaturity,
    bottleneckGap: Math.max(0, arithmeticMaturity - maturity),
    demoEquivalentAge: demoEquivalentAge(maturity),
    adultReference: demoPopulationMaturity(DEMO_CURVE_CENTER),
    limitingDimension,
  };
}

export function shiftScores(scores: PemsScores, amount: number): PemsScores {
  return Object.fromEntries(
    PEMS_DIMENSIONS.map((dimension) => [
      dimension.code,
      clamp(scores[dimension.code] + amount, -3, 3),
    ]),
  ) as PemsScores;
}
