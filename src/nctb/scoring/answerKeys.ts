import { opaqueOptionId } from '../banks/helpers.ts';
import type { NctbAnswerKey, NctbBankId } from '../types.ts';

const CORRECT_INDEX_BY_QUESTION: Readonly<Record<string, number>> = {
  'formal-a-v1-foundation-pattern-01': 0,
  'formal-a-v1-foundation-pattern-02': 2,
  'formal-a-v1-foundation-memory-01': 1,
  'formal-a-v1-foundation-memory-02': 2,
  'formal-a-v1-foundation-space-01': 1,
  'formal-a-v1-foundation-space-02': 3,
  'formal-a-v1-foundation-quantity-01': 2,
  'formal-a-v1-foundation-quantity-02': 1,
  'formal-a-v1-foundation-language-01': 2,
  'formal-a-v1-foundation-language-02': 3,
  'formal-a-v1-foundation-attention-01': 1,
  'formal-a-v1-foundation-attention-02': 2,
  'formal-a-v1-foundation-speed-01': 0,
  'formal-a-v1-foundation-speed-02': 1,
  'formal-a-v1-foundation-causality-01': 0,
  'formal-a-v1-foundation-causality-02': 2,
  'formal-a-v1-foundation-planning-01': 1,
  'formal-a-v1-foundation-planning-02': 3,
  'formal-a-v1-foundation-transfer-01': 0,
  'formal-a-v1-foundation-transfer-02': 2,
  'formal-a-v1-pattern-01': 1,
  'formal-a-v1-pattern-02': 3,
  'formal-a-v1-pattern-03': 2,
  'formal-a-v1-memory-01': 0,
  'formal-a-v1-memory-02': 2,
  'formal-a-v1-memory-03': 1,
  'formal-a-v1-space-01': 0,
  'formal-a-v1-space-02': 2,
  'formal-a-v1-space-03': 3,
  'formal-a-v1-quantity-01': 0,
  'formal-a-v1-quantity-02': 2,
  'formal-a-v1-quantity-03': 1,
  'formal-a-v1-language-01': 1,
  'formal-a-v1-language-02': 3,
  'formal-a-v1-language-03': 2,
  'formal-a-v1-attention-01': 0,
  'formal-a-v1-attention-02': 0,
  'formal-a-v1-attention-03': 0,
  'formal-a-v1-speed-01': 1,
  'formal-a-v1-speed-02': 2,
  'formal-a-v1-speed-03': 1,
  'formal-a-v1-causality-01': 1,
  'formal-a-v1-causality-02': 2,
  'formal-a-v1-causality-03': 3,
  'formal-a-v1-planning-01': 1,
  'formal-a-v1-planning-02': 1,
  'formal-a-v1-planning-03': 3,
  'formal-a-v1-transfer-01': 1,
  'formal-a-v1-transfer-02': 2,
  'formal-a-v1-transfer-03': 3,
};

function bankIdForQuestion(_questionId: string): NctbBankId {
  return 'formal-a-v1';
}

export const NCTB_ANSWER_KEYS: readonly NctbAnswerKey[] = Object.entries(CORRECT_INDEX_BY_QUESTION)
  .map(([questionId, correctIndex]) => ({
    bankId: bankIdForQuestion(questionId),
    questionId,
    questionVersion: 1,
    correctOptionId: opaqueOptionId(questionId, correctIndex),
  }));

const ANSWER_KEY_BY_ID = new Map(NCTB_ANSWER_KEYS.map((key) => [`${key.bankId}:${key.questionId}`, key]));

export function getNctbAnswerKey(bankId: NctbBankId, questionId: string): NctbAnswerKey | undefined {
  return ANSWER_KEY_BY_ID.get(`${bankId}:${questionId}`);
}

export function isNctbAnswerCorrect(bankId: NctbBankId, questionId: string, optionId: string): boolean | undefined {
  const key = getNctbAnswerKey(bankId, questionId);
  return key ? key.correctOptionId === optionId : undefined;
}
