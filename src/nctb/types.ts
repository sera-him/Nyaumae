export type NctbMode = 'formal';

export type NctbBankId = 'formal-a-v1';

export type NctbStrategy = 'fixed' | 'adaptive';

export type NctbPhase = 'setup' | 'active' | 'paused' | 'completed' | 'report';

export type NctbPauseReason = 'manual' | 'section-break' | 'friendly-break';

export type NctbDifficulty = 1 | 2 | 3 | 4 | 5;

export type NctbDimensionId =
  | 'pattern'
  | 'memory'
  | 'space'
  | 'quantity'
  | 'language'
  | 'attention'
  | 'speed'
  | 'causality'
  | 'planning'
  | 'transfer';

export type NctbQuestionKind = 'choice' | 'memory';

export interface NctbDimension {
  id: NctbDimensionId;
  index: string;
  title: string;
  english: string;
  description: string;
  skill: string;
  accent: string;
  targetQuestionCount: number;
}

export interface DimensionSpec {
  id: NctbDimensionId;
  construct: string;
  measures: string[];
  shouldNotMeasure: string[];
  itemFamilies: string[];
  difficultyModel: string[];
}

export interface DifficultyProfile {
  level: NctbDifficulty;
  reasoningSteps: number;
  workingMemoryLoad: number;
  distractorSimilarity: number;
  abstraction: number;
  ruleSwitches: number;
  stimulusComplexity: number;
}

export interface NctbOption {
  id: string;
  label: string;
}

/**
 * The browser-facing item shape. It intentionally has no answer key.
 * Exam items never expose feedback; scoring stays in the separate answer-key module.
 */
export interface NctbPublicQuestion {
  id: string;
  version: number;
  bank: NctbMode;
  bankId: NctbBankId;
  dimensionId: NctbDimensionId;
  difficulty: NctbDifficulty;
  difficultyProfile: DifficultyProfile;
  family: string;
  kind: NctbQuestionKind;
  prompt: string;
  stimulus?: string;
  hint?: string;
  explanation?: string;
  options: NctbOption[];
  targetMs: number;
  revealMs?: number;
}

/** Compatibility alias retained for existing NCTB callers. */
export type NctbQuestion = NctbPublicQuestion;

export interface NctbAnswerKey {
  bankId: NctbBankId;
  questionId: string;
  questionVersion: number;
  correctOptionId: string;
}

export interface NctbEditorialReview {
  questionId: string;
  constructMeasured: string;
  difficultyReason: string;
  distractorLogic: string[];
  authorStatus: 'sol-authored' | 'ai-generated-candidate' | 'ai-assisted-sol-redesigned';
  approvalStatus: 'pilot-approved' | 'expert-review-required';
}

export interface NctbResponse {
  id: string;
  itemId: string;
  itemVersion: number;
  dimensionId: NctbDimensionId;
  difficulty: NctbDifficulty;
  optionId: string;
  isCorrect: boolean;
  answeredAt: string;
  activeMs: number;
  timedOut: boolean;
  superseded: boolean;
}

export interface NctbSessionConfig {
  mode: NctbMode;
  bankId: NctbBankId;
  strategy: NctbStrategy;
  friendlyMode: boolean;
  fixedDifficulty: NctbDifficulty;
  focusDimension: NctbDimensionId | 'all';
}

export interface NctbSession {
  id: string;
  schemaVersion: 4;
  bankVersion: number;
  bankId: NctbBankId;
  mode: NctbMode;
  strategy: NctbStrategy;
  friendlyMode: boolean;
  fixedDifficulty: NctbDifficulty;
  focusDimension: NctbDimensionId | 'all';
  phase: NctbPhase;
  pauseReason?: NctbPauseReason;
  seed: number;
  dimensionOrder: NctbDimensionId[];
  currentDimensionIndex: number;
  currentItemId?: string;
  currentItemActiveMs: number;
  currentStimulusSeen: boolean;
  candidateOrderByDimension: Record<NctbDimensionId, string[]>;
  itemOrder: string[];
  responses: NctbResponse[];
  adaptiveDifficulty: Record<NctbDimensionId, NctbDifficulty>;
  activeMs: number;
  interruptionCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  reportId?: string;
  completionEventId?: string;
}

export interface NctbDimensionResult {
  dimensionId: NctbDimensionId;
  answered: number;
  correct: number;
  accuracy: number;
  score: number;
  ciLow: number;
  ciHigh: number;
  medianActiveMs: number;
  averageDifficulty: number;
  scoreModel: 'accuracy' | 'speed-accuracy';
}

export interface NctbCompositeResult {
  score: number;
  coverage: number;
}

export interface NctbReport {
  id: string;
  sessionId: string;
  mode: NctbMode;
  strategy: NctbStrategy;
  friendlyMode: boolean;
  focusDimension: NctbDimensionId | 'all';
  createdAt: string;
  totalAnswered: number;
  totalCorrect: number;
  totalActiveMs: number;
  interruptionCount: number;
  dimensions: NctbDimensionResult[];
  composite?: NctbCompositeResult;
  strengths: NctbDimensionId[];
  focusAreas: NctbDimensionId[];
}

export interface NctbLegacySnapshot {
  answeredCount: number;
  completedParts: number;
  mode: NctbMode;
  updatedAt?: string;
  preservedAt: string;
  sourceVersion?: number;
}

export interface NctbState {
  schemaVersion: 4;
  activeSessionId?: string;
  sessions: NctbSession[];
  reports: NctbReport[];
  legacy?: NctbLegacySnapshot;
}
