import { difficultyProfile, estimateTargetMs } from '../difficulty.ts';
import type {
  DifficultyProfile,
  NctbBankId,
  NctbDifficulty,
  NctbDimensionId,
  NctbPublicQuestion,
  NctbQuestionKind,
} from '../types.ts';

export interface PublicQuestionInput {
  id: string;
  version?: number;
  bankId: NctbBankId;
  dimensionId: NctbDimensionId;
  difficulty: NctbDifficulty;
  family: string;
  prompt: string;
  stimulus?: string;
  options: readonly [string, string, string, string];
  kind?: NctbQuestionKind;
  hint?: string;
  explanation?: string;
  revealMs?: number;
  profile?: Partial<Omit<DifficultyProfile, 'level'>>;
  targetMs?: number;
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function opaqueOptionId(questionId: string, optionIndex: number): string {
  return `o_${fnv1a(`${questionId}:${optionIndex}:nctb-v2`).toString(16).padStart(8, '0').slice(0, 8)}`;
}

export function definePublicQuestion(input: PublicQuestionInput): NctbPublicQuestion {
  const profile = difficultyProfile(input.difficulty, input.profile);
  return {
    id: input.id,
    version: input.version ?? 1,
    bank: 'formal',
    bankId: input.bankId,
    dimensionId: input.dimensionId,
    difficulty: input.difficulty,
    difficultyProfile: profile,
    family: input.family,
    kind: input.kind ?? 'choice',
    prompt: input.prompt,
    stimulus: input.stimulus,
    hint: input.hint,
    explanation: input.explanation,
    options: input.options.map((label, index) => ({ id: opaqueOptionId(input.id, index), label })),
    targetMs: input.targetMs ?? estimateTargetMs({
      dimension: input.dimensionId,
      family: input.family,
      difficulty: input.difficulty,
      difficultyProfile: profile,
      revealMs: input.revealMs,
    }),
    revealMs: input.revealMs,
  };
}
