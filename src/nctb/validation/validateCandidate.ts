import { getDimensionSpec } from '../specs/index.ts';
import type { NctbPublicQuestion } from '../types.ts';
import type { CandidateQuestion } from '../generation/schemas.ts';
import { normalizeQuestionText } from './detectDuplicates.ts';

function templateText(value: string): string {
  return normalizeQuestionText(value).replace(/\d+(?:\.\d+)?/g, '#').replace(/[a-z]/g, 'x');
}

export function validateCandidate(
  candidate: CandidateQuestion,
  existingQuestions: readonly NctbPublicQuestion[] = [],
): string[] {
  const problems: string[] = [];
  const spec = getDimensionSpec(candidate.dimensionId);
  if (!spec.itemFamilies.includes(candidate.family)) problems.push('family is not allowed by the dimension specification');
  const labels = candidate.options.map((option) => option.label.trim());
  if (new Set(labels).size !== labels.length) problems.push('option labels are not unique');
  if (!labels[candidate.correctIndex]) problems.push('correctIndex does not point to a non-empty option');
  if (candidate.rationale.distractorLogic.length !== candidate.options.length - 1) problems.push('distractorLogic must explain every wrong option');
  const exposedText = `${candidate.prompt}\n${candidate.stimulus ?? ''}`;
  if (/\bcorrect(?:OptionId)?\b/i.test(exposedText) || /(?:答案|正确选项)\s*[:：=]/.test(exposedText)) {
    problems.push('prompt or stimulus contains an answer-leakage marker');
  }
  const normalized = normalizeQuestionText(exposedText);
  const template = templateText(exposedText);
  for (const question of existingQuestions) {
    const existingText = `${question.prompt}\n${question.stimulus ?? ''}`;
    if (normalizeQuestionText(existingText) === normalized) problems.push(`normalized duplicate of ${question.id}`);
    else if (question.dimensionId === candidate.dimensionId && templateText(existingText) === template) problems.push(`same-template duplicate of ${question.id}`);
  }
  return [...new Set(problems)];
}
