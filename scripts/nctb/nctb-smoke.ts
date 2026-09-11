import assert from 'node:assert/strict';
import { NCTB_DIMENSION_IDS, questionsRequiredForDimension } from '../../src/nctb/catalog.ts';
import { estimateTargetMs } from '../../src/nctb/difficulty.ts';
import { buildGenerationPrompt } from '../../src/nctb/generation/prompts.ts';
import { freezeReviewedCandidate } from '../../src/nctb/generation/freeze.ts';
import { reviewCandidate } from '../../src/nctb/generation/reviewer.ts';
import { candidateQuestionSchema } from '../../src/nctb/generation/schemas.ts';
import { EXAM_QUESTIONS, getNctbQuestion } from '../../src/nctb/questionBank.ts';
import { FORMAL_A_V1_EDITORIAL_REVIEWS } from '../../src/nctb/review/formal-a.v1.ts';
import { hashSeed, seededShuffle } from '../../src/nctb/runtime/seededRandom.ts';
import { getNctbAnswerKey, NCTB_ANSWER_KEYS } from '../../src/nctb/scoring/answerKeys.ts';
import {
  advanceNctbSession,
  answerCurrentQuestion,
  createNctbSession,
  currentResponse,
  effectiveResponses,
  orderedQuestionOptions,
  resumeNctbSession,
  startNctbSession,
} from '../../src/nctb/sessionEngine.ts';
import { scoreNctbSession } from '../../src/nctb/scoring.ts';
import { isValidNctbSession, saveNctbState } from '../../src/nctb/storage.ts';
import type { NctbMode, NctbSession } from '../../src/nctb/types.ts';
import { DIMENSION_SPECS, getDimensionSpec } from '../../src/nctb/specs/index.ts';
import { validateBank } from '../../src/nctb/validation/validateBank.ts';

const allQuestions = EXAM_QUESTIONS;
const ids = allQuestions.map((question) => question.id);
assert.equal(new Set(ids).size, ids.length, 'Every public item ID must be unique.');

const validation = validateBank(allQuestions, NCTB_ANSWER_KEYS, {
  minimumFamiliesPerDimension: 3,
  rejectTemplateDuplicates: true,
});
const validationErrors = validation.issues.filter((issue) => issue.severity === 'error');
assert.deepEqual(validationErrors, [], `Bank validation errors:\n${validationErrors.map((issue) => `${issue.code}: ${issue.message}`).join('\n')}`);

for (const question of allQuestions) {
  assert.equal(question.options.length, 4, `${question.id} must have four options.`);
  assert.equal(new Set(question.options.map((option) => option.label)).size, 4, `${question.id} must not repeat option labels.`);
  assert.equal(Object.hasOwn(question, 'correctOptionId'), false, `${question.id} must not expose correctOptionId.`);
}

for (const dimensionId of NCTB_DIMENSION_IDS) {
  const dimensionItems = allQuestions.filter((question) => question.dimensionId === dimensionId);
  assert.ok(dimensionItems.length > 0, `${dimensionId} must have items.`);
  assert.ok(new Set(dimensionItems.map((question) => question.family)).size >= 3, `${dimensionId} must have multiple item families.`);
}
for (const difficulty of [1, 2, 3, 4, 5] as const) {
  assert.ok(allQuestions.some((question) => question.difficulty === difficulty), `Difficulty ${difficulty} must be covered.`);
}

assert.ok(allQuestions.every((question) => question.hint === undefined && question.explanation === undefined), 'Exam public items must omit feedback.');

assert.equal(NCTB_ANSWER_KEYS.length, allQuestions.length, 'Every public item needs exactly one answer key.');
for (const question of allQuestions) {
  const key = getNctbAnswerKey(question.bankId, question.id);
  assert.ok(key, `${question.id} must have an answer key.`);
  assert.ok(question.options.some((option) => option.id === key.correctOptionId), `${question.id} key must point to a public option.`);
}

const optionIds = allQuestions[0].options.map((option) => option.id);
assert.deepEqual(seededShuffle(optionIds, 42), seededShuffle(optionIds, 42), 'Seeded shuffle must repeat.');
const observedOrders = new Set(Array.from({ length: 12 }, (_, index) => seededShuffle(optionIds, hashSeed(index + 1, 'options')).join('|')));
assert.ok(observedOrders.size > 1, 'Different seeds should produce more than one option order.');

const positionCounts = [0, 0, 0, 0];
for (const question of allQuestions) {
  const key = getNctbAnswerKey(question.bankId, question.id);
  assert.ok(key);
  positionCounts[question.options.findIndex((option) => option.id === key.correctOptionId)] += 1;
}
assert.ok(Math.max(...positionCounts) - Math.min(...positionCounts) <= 8, `Formal answer positions are too biased: ${positionCounts.join('/')}`);

for (const question of allQuestions.filter((item) => item.kind === 'memory')) {
  assert.ok(question.revealMs && question.revealMs >= 1_500 && question.revealMs <= 15_000, `${question.id} revealMs must be valid.`);
}

let session = createNctbSession({ mode: 'formal', focusDimension: 'pattern', strategy: 'fixed', fixedDifficulty: 2 });
session = startNctbSession(session);
const currentQuestion = getNctbQuestion(session.mode, session.currentItemId, session.bankId);
assert.ok(currentQuestion, 'A started session must select a question.');
const correctKey = getNctbAnswerKey(session.bankId, currentQuestion.id);
assert.ok(correctKey, 'Selected question must have a score key.');
session = answerCurrentQuestion(session, correctKey.correctOptionId);
assert.equal(currentResponse(session)?.isCorrect, true, 'Scoring API must accept the keyed answer.');
assert.deepEqual(orderedQuestionOptions(session), orderedQuestionOptions(session), 'Session option order must remain stable.');

function completeAllCorrect(mode: NctbMode): NctbSession {
  let current = startNctbSession(createNctbSession({ mode, strategy: 'fixed', fixedDifficulty: 3, focusDimension: 'all' }));
  for (let guard = 0; guard < 200 && current.phase !== 'completed'; guard += 1) {
    if (current.phase === 'paused') {
      current = resumeNctbSession(current);
      continue;
    }
    assert.equal(current.phase, 'active', `Unexpected session phase ${current.phase}.`);
    const question = getNctbQuestion(current.mode, current.currentItemId, current.bankId);
    assert.ok(question, 'Every selected item must resolve in the frozen bank.');
    const key = getNctbAnswerKey(current.bankId, question.id);
    assert.ok(key, 'Every selected item must resolve in the scoring key.');
    current = advanceNctbSession(answerCurrentQuestion(current, key.correctOptionId));
  }
  assert.equal(current.phase, 'completed', `${mode} session must be able to reach completion.`);
  return current;
}

const completedFormal = completeAllCorrect('formal');
const expectedFormalItems = NCTB_DIMENSION_IDS.reduce(
  (total, dimensionId) => total + questionsRequiredForDimension(dimensionId, 'all', 'formal'),
  0,
);
assert.equal(effectiveResponses(completedFormal).length, expectedFormalItems, 'The complete exam must administer every required item.');
const formalReport = scoreNctbSession(completedFormal);
assert.equal(formalReport.dimensions.length, 10, 'A completed formal report must cover ten dimensions.');
assert.equal(formalReport.totalCorrect, expectedFormalItems, 'Scoring API must retain all correct exam responses.');

assert.equal(DIMENSION_SPECS.length, 10, 'Exactly ten dimension specifications are required.');
for (const spec of DIMENSION_SPECS) assert.ok(spec.itemFamilies.length >= 6, `${spec.id} spec must define at least six families.`);
assert.equal(FORMAL_A_V1_EDITORIAL_REVIEWS.length, allQuestions.length, 'Every exam item needs editorial rationale.');

const sameDifficultyDifferentFamily = [
  estimateTargetMs({ dimension: 'pattern', family: 'matrix-relation', difficulty: 3, stimulusComplexity: 3 }),
  estimateTargetMs({ dimension: 'pattern', family: 'recursive-pattern', difficulty: 3, stimulusComplexity: 3 }),
];
assert.notEqual(sameDifficultyDifferentFamily[0], sameDifficultyDifferentFamily[1], 'targetMs must account for item family.');

const generationPrompt = buildGenerationPrompt({
  dimensionSpec: getDimensionSpec('transfer'),
  family: 'far-transfer',
  targetDifficulty: 5,
  prohibitedPatterns: ['surface-only rewrite'],
  existingItemSummaries: ['serial bottleneck example'],
});
assert.match(generationPrompt.system, /Exactly one option must be correct/i);
assert.match(generationPrompt.system, /culturally neutral/i);
assert.match(generationPrompt.user, /OUTPUT JSON SCHEMA/);

const candidate = candidateQuestionSchema.parse({
  dimensionId: 'pattern',
  difficulty: 2,
  family: 'matrix-relation',
  kind: 'choice',
  prompt: '两行使用同一位置交换规则，第三行应选择哪项？',
  stimulus: '示例材料仅用于管线测试。',
  options: [{ label: '甲' }, { label: '乙' }, { label: '丙' }, { label: '丁' }],
  correctIndex: 2,
  explanation: '丙符合给定交换规则。',
  rationale: {
    constructMeasured: '位置关系抽取',
    difficultyReason: '一步关系映射',
    distractorLogic: ['未交换', '交换方向相反', '交换了错误位置'],
  },
});
let blindReviewPrompt = '';
const reviewed = await reviewCandidate({
  id: 'fake-independent-reviewer',
  async completeJson(request) {
    blindReviewPrompt = request.user;
    return {
      valid: true,
      dimensionFit: 0.9,
      predictedDifficulty: 2,
      ambiguityRisk: 0.1,
      knowledgeDependency: 0,
      distractorQuality: 0.8,
      duplicateRisk: 0.1,
      detectedCorrectIndex: 2,
      problems: [],
      suggestedFixes: [],
    };
  },
}, candidate);
assert.equal(reviewed.accepted, true, 'Independent reviewer thresholds should accept a passing review.');
assert.doesNotMatch(blindReviewPrompt, /correctIndex|explanation/, 'Reviewer prompt must hide the author answer and explanation.');
const humanApproval = {
  approvedBy: 'independent-human-reviewer',
  approvedAt: '2026-08-12T00:00:00.000Z',
  evidence: 'Reviewed the candidate, answer derivation and distractor rationale.',
};
const solDesignRecord = {
  designedBy: 'Sol' as const,
  reviewedAt: '2026-08-12T00:05:00.000Z',
  changeSummary: 'Re-derived the construct, reasoning path and final distractor design.',
};
assert.throws(
  () => freezeReviewedCandidate(reviewed, { id: 'formal-a-v1-pattern-99', bankId: 'formal-a-v1', version: 1, humanApproval }),
  /Sol redesign/i,
  'Formal AI candidates must not freeze without a Sol redesign record.',
);
assert.throws(
  () => freezeReviewedCandidate({ ...reviewed, accepted: false }, {
    id: 'formal-a-v1-pattern-99',
    bankId: 'formal-a-v1',
    version: 1,
    humanApproval,
    solDesignRecord,
  }),
  /acceptance fields do not match/i,
  'Freeze must re-derive acceptance instead of trusting edited intermediate JSON.',
);
const frozen = freezeReviewedCandidate(reviewed, {
  id: 'formal-a-v1-pattern-99',
  bankId: 'formal-a-v1',
  version: 1,
  humanApproval,
  solDesignRecord,
});
assert.equal(frozen.publicQuestion.explanation, undefined, 'Frozen formal public items must omit explanation.');
assert.ok(frozen.publicQuestion.options.some((option) => option.id === frozen.answerKey.correctOptionId));

const validStoredSession = createNctbSession({ mode: 'formal' });
assert.equal(isValidNctbSession(validStoredSession), true, 'A newly created v4 session must pass storage validation.');
assert.equal(isValidNctbSession({ ...validStoredSession, strategy: 'tampered' }), false, 'Storage validation must reject invalid strategies.');
assert.equal(isValidNctbSession({ ...validStoredSession, responses: [{ itemId: 'partial-shape' }] }), false, 'Storage validation must reject malformed responses.');
assert.equal(saveNctbState({ schemaVersion: 4, sessions: [], reports: [] }), false, 'Saving without browser storage must report failure.');

process.stdout.write(`NCTB smoke passed: ${EXAM_QUESTIONS.length} exam items across 10 dimensions.\n`);
