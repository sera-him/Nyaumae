import { getDimensionSpec } from '../specs/index.ts';
import type { NctbDifficulty, NctbDimensionId } from '../types.ts';
import { buildGenerationPrompt } from './prompts.ts';
import type { NctbAiProvider } from './provider.ts';
import { candidateQuestionSchema, type CandidateQuestion } from './schemas.ts';
import { validateCandidate } from '../validation/validateCandidate.ts';
import type { NctbPublicQuestion } from '../types.ts';

export interface GenerateCandidateInput {
  dimensionId: NctbDimensionId;
  family: string;
  targetDifficulty: NctbDifficulty;
  prohibitedPatterns?: readonly string[];
  existingItemSummaries?: readonly string[];
  existingQuestions?: readonly NctbPublicQuestion[];
}

export async function generateCandidate(
  provider: NctbAiProvider,
  input: GenerateCandidateInput,
): Promise<CandidateQuestion> {
  const spec = getDimensionSpec(input.dimensionId);
  if (!spec.itemFamilies.includes(input.family)) {
    throw new Error(`${input.family} is not an allowed family for ${input.dimensionId}.`);
  }
  const prompt = buildGenerationPrompt({
    dimensionSpec: spec,
    family: input.family,
    targetDifficulty: input.targetDifficulty,
    prohibitedPatterns: input.prohibitedPatterns ?? [],
    existingItemSummaries: input.existingItemSummaries ?? [],
  });
  const candidate = candidateQuestionSchema.parse(await provider.completeJson(prompt));
  if (candidate.dimensionId !== input.dimensionId || candidate.family !== input.family || candidate.difficulty !== input.targetDifficulty) {
    throw new Error('AI candidate does not match the requested dimension, family or difficulty.');
  }
  const validationProblems = validateCandidate(candidate, input.existingQuestions ?? []);
  if (validationProblems.length > 0) {
    throw new Error(`AI candidate failed deterministic validation: ${validationProblems.join('; ')}`);
  }
  return candidate;
}
