import { NCTB_DIMENSION_IDS } from '../catalog.ts';
import { seededShuffle } from '../runtime/seededRandom.ts';
import type { NctbAnswerKey, NctbPublicQuestion } from '../types.ts';
import { detectDuplicates } from './detectDuplicates.ts';
import type { BankValidationResult, ValidationIssue } from './types.ts';
import { validateQuestion } from './validateQuestion.ts';

function bankIssue(code: string, message: string, severity: ValidationIssue['severity'] = 'error'): ValidationIssue {
  return { code, severity, message };
}

export interface BankValidationOptions {
  requireEveryDimension?: boolean;
  requireEveryDifficulty?: boolean;
  minimumFamiliesPerDimension?: number;
  rejectTemplateDuplicates?: boolean;
}

export function validateBank(
  questions: readonly NctbPublicQuestion[],
  answerKeys: readonly NctbAnswerKey[],
  options: BankValidationOptions = {},
): BankValidationResult {
  const issues: ValidationIssue[] = [];
  const keyGroups = new Map<string, NctbAnswerKey[]>();
  for (const key of answerKeys) {
    const keys = keyGroups.get(`${key.bankId}:${key.questionId}`) ?? [];
    keys.push(key);
    keyGroups.set(`${key.bankId}:${key.questionId}`, keys);
  }

  const ids = questions.map((question) => question.id);
  if (new Set(ids).size !== ids.length) issues.push(bankIssue('bank.duplicate-id', '题库中存在重复题目 ID。'));

  for (const question of questions) {
    const keys = keyGroups.get(`${question.bankId}:${question.id}`) ?? [];
    if (keys.length > 1) issues.push(bankIssue('answer-key.multiple', `${question.id} 存在多个答案键。`));
    issues.push(...validateQuestion(question, keys[0]));
  }

  const questionKeys = new Set(questions.map((question) => `${question.bankId}:${question.id}`));
  for (const key of answerKeys) {
    if (!questionKeys.has(`${key.bankId}:${key.questionId}`)) {
      issues.push(bankIssue('answer-key.orphan', `答案键 ${key.questionId} 没有对应公题。`));
    }
  }

  if (options.requireEveryDimension ?? true) {
    for (const dimensionId of NCTB_DIMENSION_IDS) {
      if (!questions.some((question) => question.dimensionId === dimensionId)) {
        issues.push(bankIssue('coverage.dimension', `题库缺少维度 ${dimensionId}。`));
      }
    }
  }

  if (options.requireEveryDifficulty ?? true) {
    for (const difficulty of [1, 2, 3, 4, 5] as const) {
      if (!questions.some((question) => question.difficulty === difficulty)) {
        issues.push(bankIssue('coverage.difficulty', `题库缺少难度 ${difficulty}。`));
      }
    }
  }

  const minimumFamilies = options.minimumFamiliesPerDimension ?? 2;
  for (const dimensionId of NCTB_DIMENSION_IDS) {
    const families = new Set(questions.filter((question) => question.dimensionId === dimensionId).map((question) => question.family));
    if (families.size < minimumFamilies) {
      issues.push(bankIssue('coverage.family', `${dimensionId} 只有 ${families.size} 个 item family，要求至少 ${minimumFamilies} 个。`));
    }
  }

  for (const duplicate of detectDuplicates(questions)) {
    const severity = duplicate.kind === 'same-template' && !(options.rejectTemplateDuplicates ?? false) ? 'warning' : 'error';
    issues.push(bankIssue(`duplicate.${duplicate.kind}`, `${duplicate.leftId} 与 ${duplicate.rightId} 被判定为 ${duplicate.kind} 重复。`, severity));
  }

  const sample = questions[0]?.options.map((option) => option.id) ?? [];
  if (sample.length > 1) {
    const first = seededShuffle(sample, 0x5eed1234);
    const second = seededShuffle(sample, 0x5eed1234);
    if (first.join('|') !== second.join('|')) issues.push(bankIssue('shuffle.not-repeatable', '相同 seed 的选项顺序不可复现。'));
  }

  const correctPositionCounts = [0, 0, 0, 0];
  for (const question of questions) {
    const key = keyGroups.get(`${question.bankId}:${question.id}`)?.[0];
    const position = key ? question.options.findIndex((option) => option.id === key.correctOptionId) : -1;
    if (position >= 0) correctPositionCounts[position] += 1;
  }
  if (questions.length >= 12) {
    const spread = Math.max(...correctPositionCounts) - Math.min(...correctPositionCounts);
    if (spread > Math.ceil(questions.length * 0.3)) {
      issues.push(bankIssue('answer-position.bias', `答案原始位置分布偏差明显：${correctPositionCounts.join('/')}`, 'warning'));
    }
  }

  return { valid: issues.every((item) => item.severity !== 'error'), issues };
}
