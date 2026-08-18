import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateCandidate } from '../../src/nctb/generation/generator.ts';
import { generationProviderFromEnvironment } from './cli-provider.ts';
import type { NctbDifficulty, NctbDimensionId } from '../../src/nctb/types.ts';
import { EXAM_QUESTIONS } from '../../src/nctb/questionBank.ts';

const [dimensionId, family, difficultyText, outputPath = 'tmp/nctb/candidate.json'] = process.argv.slice(2);
const difficulty = Number(difficultyText) as NctbDifficulty;
if (!dimensionId || !family || ![1, 2, 3, 4, 5].includes(difficulty)) {
  throw new Error('Usage: generate-items.ts <dimension> <family> <difficulty 1-5> [output.json]');
}

const candidate = await generateCandidate(generationProviderFromEnvironment(), {
  dimensionId: dimensionId as NctbDimensionId,
  family,
  targetDifficulty: difficulty,
  prohibitedPatterns: ['fixed correct option ids', 'number-only difficulty inflation', 'surface rewrites of existing items'],
  existingQuestions: EXAM_QUESTIONS,
  existingItemSummaries: EXAM_QUESTIONS.map((question) => `${question.dimensionId}/${question.family}: ${question.prompt}`),
});
const absoluteOutput = resolve(outputPath);
await mkdir(dirname(absoluteOutput), { recursive: true });
await writeFile(absoluteOutput, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
process.stdout.write(`Candidate written to ${absoluteOutput}\n`);
