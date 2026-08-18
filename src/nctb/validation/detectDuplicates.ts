import type { NctbPublicQuestion } from '../types.ts';

export type DuplicateKind = 'normalized-text' | 'same-template' | 'option-permutation';

export interface DuplicateFinding {
  kind: DuplicateKind;
  leftId: string;
  rightId: string;
}

export function normalizeQuestionText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim();
}

function templateSignature(question: NctbPublicQuestion): string {
  return `${question.dimensionId}:${normalizeQuestionText(`${question.prompt}\n${question.stimulus ?? ''}`)
    .replace(/\d+(?:\.\d+)?/g, '#')
    .replace(/[a-z]/g, 'x')}`;
}

function optionPermutationSignature(question: NctbPublicQuestion): string {
  return question.options.map((option) => normalizeQuestionText(option.label)).sort().join('|');
}

export function detectDuplicates(questions: readonly NctbPublicQuestion[]): DuplicateFinding[] {
  const findings: DuplicateFinding[] = [];
  for (let leftIndex = 0; leftIndex < questions.length; leftIndex += 1) {
    const left = questions[leftIndex];
    const leftText = normalizeQuestionText(`${left.prompt}\n${left.stimulus ?? ''}`);
    const leftTemplate = templateSignature(left);
    const leftOptions = optionPermutationSignature(left);
    for (let rightIndex = leftIndex + 1; rightIndex < questions.length; rightIndex += 1) {
      const right = questions[rightIndex];
      const rightText = normalizeQuestionText(`${right.prompt}\n${right.stimulus ?? ''}`);
      if (leftText === rightText) {
        findings.push({ kind: 'normalized-text', leftId: left.id, rightId: right.id });
        continue;
      }
      if (leftTemplate === templateSignature(right)) {
        findings.push({ kind: 'same-template', leftId: left.id, rightId: right.id });
      }
      if (
        leftTemplate === templateSignature(right)
        && leftOptions === optionPermutationSignature(right)
        && left.dimensionId === right.dimensionId
      ) {
        findings.push({ kind: 'option-permutation', leftId: left.id, rightId: right.id });
      }
    }
  }
  return findings;
}
