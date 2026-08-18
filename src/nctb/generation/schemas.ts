import { z } from 'zod';

export const nctbDimensionIdSchema = z.enum([
  'pattern',
  'memory',
  'space',
  'quantity',
  'language',
  'attention',
  'speed',
  'causality',
  'planning',
  'transfer',
]);

export const candidateQuestionSchema = z.object({
  dimensionId: nctbDimensionIdSchema,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  family: z.string().min(1),
  kind: z.enum(['choice', 'memory']),
  prompt: z.string().min(1),
  stimulus: z.string().optional(),
  options: z.array(z.object({ label: z.string().min(1) })).length(4),
  correctIndex: z.number().int().min(0).max(3),
  hint: z.string().optional(),
  explanation: z.string().min(1),
  rationale: z.object({
    constructMeasured: z.string().min(1),
    difficultyReason: z.string().min(1),
    distractorLogic: z.array(z.string().min(1)).length(3),
  }),
});

export type CandidateQuestion = z.infer<typeof candidateQuestionSchema>;

export const itemReviewSchema = z.object({
  valid: z.boolean(),
  dimensionFit: z.number().min(0).max(1),
  predictedDifficulty: z.number().min(1).max(5),
  ambiguityRisk: z.number().min(0).max(1),
  knowledgeDependency: z.number().min(0).max(1),
  distractorQuality: z.number().min(0).max(1),
  duplicateRisk: z.number().min(0).max(1),
  detectedCorrectIndex: z.number().int().min(0).max(3).nullable(),
  problems: z.array(z.string()),
  suggestedFixes: z.array(z.string()),
});

export type ItemReview = z.infer<typeof itemReviewSchema>;

export interface ReviewedCandidate {
  candidate: CandidateQuestion;
  review: ItemReview;
  accepted: boolean;
  rejectionReasons: string[];
}
