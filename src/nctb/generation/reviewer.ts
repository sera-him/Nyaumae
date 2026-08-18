import { getDimensionSpec } from '../specs/index.ts';
import { buildReviewPrompt } from './prompts.ts';
import type { NctbAiProvider } from './provider.ts';
import {
  itemReviewSchema,
  type CandidateQuestion,
  type ItemReview,
  type ReviewedCandidate,
} from './schemas.ts';

export function reviewRejectionReasons(candidate: CandidateQuestion, review: ItemReview): string[] {
  const rejectionReasons: string[] = [];
  if (!review.valid) rejectionReasons.push('reviewer marked item invalid');
  if (review.dimensionFit < 0.8) rejectionReasons.push('dimensionFit < 0.8');
  if (review.ambiguityRisk > 0.15) rejectionReasons.push('ambiguityRisk > 0.15');
  if (review.knowledgeDependency > 0.2) rejectionReasons.push('knowledgeDependency > 0.2');
  if (review.distractorQuality < 0.7) rejectionReasons.push('distractorQuality < 0.7');
  if (review.duplicateRisk > 0.25) rejectionReasons.push('duplicateRisk > 0.25');
  if (review.detectedCorrectIndex !== candidate.correctIndex) rejectionReasons.push('reviewer answer differs from author answer');
  if (Math.abs(review.predictedDifficulty - candidate.difficulty) > 1) rejectionReasons.push('predicted difficulty differs by more than one level');
  return rejectionReasons;
}

export async function reviewCandidate(
  provider: NctbAiProvider,
  candidate: CandidateQuestion,
  existingItemSummaries: readonly string[] = [],
): Promise<ReviewedCandidate> {
  const prompt = buildReviewPrompt(candidate, getDimensionSpec(candidate.dimensionId), existingItemSummaries);
  const review = itemReviewSchema.parse(await provider.completeJson(prompt));
  const rejectionReasons = reviewRejectionReasons(candidate, review);
  return { candidate, review, accepted: rejectionReasons.length === 0, rejectionReasons };
}
