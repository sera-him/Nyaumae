import { getDimensionSpec } from '../specs/index.ts';
import type { NctbAnswerKey, NctbPublicQuestion } from '../types.ts';
import type { ValidationIssue } from './types.ts';

const LEAKAGE_PATTERNS: readonly { code: string; pattern: RegExp }[] = [
  { code: 'leak.correct-token', pattern: /\bcorrect(?:OptionId)?\b/i },
  { code: 'leak.answer-marker', pattern: /(?:答案|正确选项)\s*[:：=]/ },
  { code: 'leak.explanation-marker', pattern: /\bexplanation\b/i },
];

function issue(question: NctbPublicQuestion, code: string, message: string, severity: ValidationIssue['severity'] = 'error'): ValidationIssue {
  return { code, severity, message, questionId: question.id };
}

function hasScaleOutsideRange(question: NctbPublicQuestion): boolean {
  const profile = question.difficultyProfile;
  return [
    profile.reasoningSteps,
    profile.workingMemoryLoad,
    profile.distractorSimilarity,
    profile.abstraction,
    profile.ruleSwitches,
    profile.stimulusComplexity,
  ].some((value) => !Number.isInteger(value) || value < 0 || value > 5);
}

export function validateQuestion(question: NctbPublicQuestion, answerKey?: NctbAnswerKey): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!question.id.trim()) issues.push(issue(question, 'question.id.empty', '题目 ID 不能为空。'));
  if (!question.prompt.trim()) issues.push(issue(question, 'question.prompt.empty', '题面不能为空。'));
  if (question.options.length !== 4) issues.push(issue(question, 'question.options.count', '每题必须恰好有 4 个选项。'));

  const optionIds = question.options.map((option) => option.id);
  const optionLabels = question.options.map((option) => option.label.trim());
  if (new Set(optionIds).size !== optionIds.length) issues.push(issue(question, 'question.options.duplicate-id', '选项 ID 不得重复。'));
  if (new Set(optionLabels).size !== optionLabels.length) issues.push(issue(question, 'question.options.duplicate-label', '选项文本不得重复。'));
  if (optionLabels.some((label) => !label)) issues.push(issue(question, 'question.options.empty-label', '选项文本不能为空。'));
  if (optionIds.some((id) => !/^o_[0-9a-f]{8}$/.test(id))) issues.push(issue(question, 'question.options.non-opaque-id', '选项必须使用不透明 ID。'));

  if (question.difficultyProfile.level !== question.difficulty || hasScaleOutsideRange(question)) {
    issues.push(issue(question, 'difficulty.profile.invalid', '难度画像必须与难度等级一致，且各因子位于 0–5。'));
  }

  const spec = getDimensionSpec(question.dimensionId);
  if (!spec.itemFamilies.includes(question.family)) {
    issues.push(issue(question, 'dimension.family.mismatch', `题型 ${question.family} 不属于 ${question.dimensionId} specification。`));
  }

  if (!Number.isFinite(question.targetMs) || question.targetMs < 5_000 || question.targetMs > 120_000) {
    issues.push(issue(question, 'question.target-ms.invalid', 'targetMs 必须在 5–120 秒之间。'));
  }

  if (question.kind === 'memory' && (!question.revealMs || question.revealMs < 1_500 || question.revealMs > 15_000)) {
    issues.push(issue(question, 'memory.reveal-ms.invalid', '记忆题 revealMs 必须在 1.5–15 秒之间。'));
  }

  if (question.bank === 'formal' && (question.hint !== undefined || question.explanation !== undefined)) {
    issues.push(issue(question, 'formal.feedback.exposed', '正式公题不得包含 hint 或 explanation。'));
  }

  const exposedText = `${question.prompt}\n${question.stimulus ?? ''}`;
  for (const leakage of LEAKAGE_PATTERNS) {
    if (leakage.pattern.test(exposedText)) {
      issues.push(issue(question, leakage.code, '题面或刺激材料包含可能泄露答案结构的标记。'));
    }
  }

  if (!answerKey) {
    issues.push(issue(question, 'answer-key.missing', '公题缺少答案键。'));
  } else {
    if (answerKey.bankId !== question.bankId || answerKey.questionId !== question.id || answerKey.questionVersion !== question.version) {
      issues.push(issue(question, 'answer-key.mismatch', '答案键与题目 ID、版本或题库不匹配。'));
    }
    if (!question.options.some((option) => option.id === answerKey.correctOptionId)) {
      issues.push(issue(question, 'answer-key.unknown-option', '答案键没有指向题目中的一个选项。'));
    }
  }

  return issues;
}
