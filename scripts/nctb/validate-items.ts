import { EXAM_QUESTIONS } from '../../src/nctb/questionBank.ts';
import { NCTB_ANSWER_KEYS } from '../../src/nctb/scoring/answerKeys.ts';
import { validateBank } from '../../src/nctb/validation/validateBank.ts';

const result = validateBank(EXAM_QUESTIONS, NCTB_ANSWER_KEYS, {
  minimumFamiliesPerDimension: 3,
  rejectTemplateDuplicates: true,
});
for (const issue of result.issues) process.stdout.write(`${issue.severity.toUpperCase()} ${issue.code}${issue.questionId ? ` ${issue.questionId}` : ''}: ${issue.message}\n`);
if (!result.valid) {
  process.stderr.write(`NCTB validation failed with ${result.issues.filter((issue) => issue.severity === 'error').length} errors.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`NCTB validation passed for ${EXAM_QUESTIONS.length} exam items across 10 dimensions, with ${NCTB_ANSWER_KEYS.length} answer keys.\n`);
}
