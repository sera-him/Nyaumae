import type {
  DifficultyProfile,
  NctbDifficulty,
  NctbDimensionId,
} from './types.ts';

const BASE_PROFILES: Record<NctbDifficulty, DifficultyProfile> = {
  1: { level: 1, reasoningSteps: 1, workingMemoryLoad: 1, distractorSimilarity: 1, abstraction: 1, ruleSwitches: 0, stimulusComplexity: 1 },
  2: { level: 2, reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 2, abstraction: 1, ruleSwitches: 0, stimulusComplexity: 2 },
  3: { level: 3, reasoningSteps: 2, workingMemoryLoad: 3, distractorSimilarity: 3, abstraction: 2, ruleSwitches: 1, stimulusComplexity: 3 },
  4: { level: 4, reasoningSteps: 3, workingMemoryLoad: 4, distractorSimilarity: 4, abstraction: 3, ruleSwitches: 1, stimulusComplexity: 4 },
  5: { level: 5, reasoningSteps: 3, workingMemoryLoad: 4, distractorSimilarity: 5, abstraction: 5, ruleSwitches: 2, stimulusComplexity: 5 },
};

const DIMENSION_BASE_MS: Record<NctbDimensionId, number> = {
  pattern: 19_000,
  memory: 12_000,
  space: 20_000,
  quantity: 22_000,
  language: 24_000,
  attention: 11_000,
  speed: 7_000,
  causality: 25_000,
  planning: 28_000,
  transfer: 27_000,
};

const FAMILY_ADJUSTMENT_MS: Record<string, number> = {
  'recursive-pattern': 4_000,
  'matrix-relation': 5_000,
  'sequence-transformation': 3_000,
  'memory-updating': 3_500,
  'binding-memory': 2_500,
  'mental-rotation': 4_000,
  'paper-folding': 5_000,
  'proportional-comparison': 3_000,
  'ambiguity-resolution': 3_000,
  'rule-switching': 2_000,
  'rapid-same-different': -2_500,
  'visual-code-match': -1_500,
  'causal-graph': 5_000,
  'constraint-planning': 5_000,
  'far-transfer': 5_000,
};

function clampScale(value: number): number {
  return Math.max(0, Math.min(5, Math.round(value)));
}

export function difficultyProfile(
  level: NctbDifficulty,
  overrides: Partial<Omit<DifficultyProfile, 'level'>> = {},
): DifficultyProfile {
  const base = BASE_PROFILES[level];
  return {
    level,
    reasoningSteps: clampScale(overrides.reasoningSteps ?? base.reasoningSteps),
    workingMemoryLoad: clampScale(overrides.workingMemoryLoad ?? base.workingMemoryLoad),
    distractorSimilarity: clampScale(overrides.distractorSimilarity ?? base.distractorSimilarity),
    abstraction: clampScale(overrides.abstraction ?? base.abstraction),
    ruleSwitches: clampScale(overrides.ruleSwitches ?? base.ruleSwitches),
    stimulusComplexity: clampScale(overrides.stimulusComplexity ?? base.stimulusComplexity),
  };
}

export interface TargetTimeInput {
  dimension: NctbDimensionId;
  family: string;
  difficulty: NctbDifficulty;
  stimulusComplexity?: number;
  difficultyProfile?: DifficultyProfile;
  revealMs?: number;
}

export function estimateTargetMs(input: TargetTimeInput): number {
  const profile = input.difficultyProfile ?? difficultyProfile(input.difficulty, {
    stimulusComplexity: input.stimulusComplexity,
  });
  const familyAdjustment = FAMILY_ADJUSTMENT_MS[input.family] ?? 0;
  const revealAdjustment = Math.round((input.revealMs ?? 0) * 0.2);

  if (input.dimension === 'speed') {
    return Math.max(6_000, Math.round(
      DIMENSION_BASE_MS.speed
      + familyAdjustment
      + profile.stimulusComplexity * 1_050
      + profile.distractorSimilarity * 550,
    ));
  }

  if (input.dimension === 'attention') {
    return Math.round(
      DIMENSION_BASE_MS.attention
      + familyAdjustment
      + profile.stimulusComplexity * 1_250
      + profile.distractorSimilarity * 850
      + profile.ruleSwitches * 2_200,
    );
  }

  return Math.round(
    DIMENSION_BASE_MS[input.dimension]
    + familyAdjustment
    + profile.reasoningSteps * 2_500
    + profile.workingMemoryLoad * 1_100
    + profile.distractorSimilarity * 650
    + profile.abstraction * 1_350
    + profile.ruleSwitches * 1_900
    + profile.stimulusComplexity * 600
    + revealAdjustment,
  );
}
