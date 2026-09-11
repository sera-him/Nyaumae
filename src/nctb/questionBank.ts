import { FORMAL_A_V1_QUESTIONS } from './banks/formal-a.v1.ts';
import { FORMAL_A_V2_QUESTIONS } from './banks/formal-a.v2.ts';
import { FORMAL_FOUNDATION_V1_QUESTIONS } from './banks/formal-foundation.v1.ts';
import type {
  NctbBankId,
  NctbDimensionId,
  NctbMode,
  NctbPublicQuestion,
} from './types.ts';

export const FORMAL_QUESTIONS = [...FORMAL_A_V1_QUESTIONS, ...FORMAL_FOUNDATION_V1_QUESTIONS, ...FORMAL_A_V2_QUESTIONS];
export const EXAM_QUESTIONS = FORMAL_QUESTIONS;

const BANKS: Readonly<Record<NctbBankId, readonly NctbPublicQuestion[]>> = {
  'formal-a-v1': FORMAL_QUESTIONS,
};

const BY_BANK_AND_ID = new Map<NctbBankId, Map<string, NctbPublicQuestion>>(
  Object.entries(BANKS).map(([bankId, questions]) => [
    bankId as NctbBankId,
    new Map(questions.map((question) => [question.id, question])),
  ]),
);

export function defaultBankForMode(_mode: NctbMode): NctbBankId {
  return 'formal-a-v1';
}

export function questionsFor(
  mode: NctbMode,
  dimensionId: NctbDimensionId,
  bankId: NctbBankId = defaultBankForMode(mode),
): NctbPublicQuestion[] {
  return BANKS[bankId].filter((question) => question.dimensionId === dimensionId);
}

export function getNctbQuestion(
  mode: NctbMode,
  id: string | undefined,
  bankId: NctbBankId = defaultBankForMode(mode),
): NctbPublicQuestion | undefined {
  if (!id) return undefined;
  return BY_BANK_AND_ID.get(bankId)?.get(id);
}

export function questionsInBank(bankId: NctbBankId): readonly NctbPublicQuestion[] {
  return BANKS[bankId];
}
