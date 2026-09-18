import { FORMAL_A_V1_QUESTIONS } from './banks/formal-a.v1.ts';
import { FORMAL_A_V2_QUESTIONS } from './banks/formal-a.v2.ts';
import { FORMAL_A_V1_QUESTIONS_EN } from './banks/formal-a.v1.en.ts';
import { FORMAL_FOUNDATION_V1_QUESTIONS_EN } from './banks/formal-foundation.v1.en.ts';
import { FORMAL_A_V2_QUESTIONS_EN } from './banks/formal-a.v2.en.ts';
import { FORMAL_FOUNDATION_V1_QUESTIONS } from './banks/formal-foundation.v1.ts';
import type {
  NctbBankId,
  NctbDimensionId,
  NctbMode,
  NctbPublicQuestion,
} from './types.ts';

export const FORMAL_QUESTIONS = [...FORMAL_A_V1_QUESTIONS, ...FORMAL_FOUNDATION_V1_QUESTIONS, ...FORMAL_A_V2_QUESTIONS];
export const FORMAL_QUESTIONS_EN = [...FORMAL_A_V1_QUESTIONS_EN, ...FORMAL_FOUNDATION_V1_QUESTIONS_EN, ...FORMAL_A_V2_QUESTIONS_EN];

export type NctbTextLocale = 'zh-CN' | 'en';
export const EXAM_QUESTIONS = FORMAL_QUESTIONS;

const BANKS: Readonly<Record<NctbBankId, readonly NctbPublicQuestion[]>> = {
  'formal-a-v1': FORMAL_QUESTIONS,
};

const BANKS_EN: Readonly<Record<NctbBankId, readonly NctbPublicQuestion[]>> = {
  'formal-a-v1': FORMAL_QUESTIONS_EN,
};
const BY_BANK_AND_ID = new Map<NctbBankId, Map<string, NctbPublicQuestion>>(
  Object.entries(BANKS).map(([bankId, questions]) => [
    bankId as NctbBankId,
    new Map(questions.map((question) => [question.id, question])),
  ]),
);
const BY_BANK_AND_ID_EN = new Map<NctbBankId, Map<string, NctbPublicQuestion>>(
  Object.entries(BANKS_EN).map(([bankId, questions]) => [
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
  locale: NctbTextLocale = 'zh-CN',
): NctbPublicQuestion[] {
  const source = locale === 'en' ? BANKS_EN[bankId] : BANKS[bankId];
  return source.filter((question) => question.dimensionId === dimensionId);
}

export function getNctbQuestion(
  mode: NctbMode,
  id: string | undefined,
  bankId: NctbBankId = defaultBankForMode(mode),
  locale: NctbTextLocale = 'zh-CN',
): NctbPublicQuestion | undefined {
  if (!id) return undefined;
  const source = locale === 'en' ? BY_BANK_AND_ID_EN : BY_BANK_AND_ID;
  return source.get(bankId)?.get(id);
}

export function questionsInBank(bankId: NctbBankId, locale: NctbTextLocale = 'zh-CN'): readonly NctbPublicQuestion[] {
  return (locale === 'en' ? BANKS_EN : BANKS)[bankId];
}
