import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { candidateQuestionSchema } from '../../src/nctb/generation/schemas.ts';
import { reviewCandidate } from '../../src/nctb/generation/reviewer.ts';
import { reviewProviderFromEnvironment } from './cli-provider.ts';
import { EXAM_QUESTIONS } from '../../src/nctb/questionBank.ts';
import { validateCandidate } from '../../src/nctb/validation/validateCandidate.ts';

const [candidatePath, outputPath] = process.argv.slice(2);
if (!candidatePath) throw new Error('Usage: review-items.ts <candidate.json> [reviewed.json]');
const candidate = candidateQuestionSchema.parse(JSON.parse(await readFile(resolve(candidatePath), 'utf8')) as unknown);
const existingQuestions = EXAM_QUESTIONS;
const deterministicProblems = validateCandidate(candidate, existingQuestions);
if (deterministicProblems.length > 0) throw new Error(`Candidate failed deterministic validation before AI review: ${deterministicProblems.join('; ')}`);
const reviewed = await reviewCandidate(
  reviewProviderFromEnvironment(),
  candidate,
  existingQuestions.map((question) => `${question.dimensionId}/${question.family}: ${question.prompt}`),
);
const absoluteOutput = resolve(outputPath ?? candidatePath.replace(/\.json$/i, '.reviewed.json'));
await writeFile(absoluteOutput, `${JSON.stringify(reviewed, null, 2)}\n`, 'utf8');
process.stdout.write(`Independent review written to ${absoluteOutput}; accepted=${reviewed.accepted}\n`);
if (!reviewed.accepted) process.exitCode = 2;
