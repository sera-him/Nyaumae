import type { DimensionSpec, NctbDifficulty } from '../types.ts';
import type { CandidateQuestion } from './schemas.ts';

export interface GenerationPromptInput {
  dimensionSpec: DimensionSpec;
  family: string;
  targetDifficulty: NctbDifficulty;
  prohibitedPatterns: readonly string[];
  existingItemSummaries: readonly string[];
}

const CANDIDATE_SCHEMA_TEXT = `{
  "dimensionId": "pattern|memory|space|quantity|language|attention|speed|causality|planning|transfer",
  "difficulty": 1|2|3|4|5,
  "family": "string",
  "kind": "choice|memory",
  "prompt": "string",
  "stimulus": "optional string",
  "options": [{"label":"string"}, {"label":"string"}, {"label":"string"}, {"label":"string"}],
  "correctIndex": 0|1|2|3,
  "hint": "optional string",
  "explanation": "string",
  "rationale": {
    "constructMeasured": "string",
    "difficultyReason": "string",
    "distractorLogic": ["one explanation for each wrong option"]
  }
}`;

export function buildGenerationPrompt(input: GenerationPromptInput): { system: string; user: string } {
  return {
    system: [
      'You generate candidate cognitive-assessment items for offline editorial review.',
      'Return exactly one JSON object and no markdown.',
      'Exactly one option must be correct and derivable only from supplied information.',
      'Use concise, culturally neutral language. Avoid ambiguity, trick wording, cold knowledge and hidden assumptions.',
      'Every distractor must represent a plausible cognitive error, not random noise.',
      'Do not merely change numbers or nouns from an existing item.',
      'Do not expose the answer in the prompt or option identifiers.',
      'Difficulty must arise from cognitive complexity: steps, memory load, interference, abstraction, switching or distractor similarity.',
    ].join('\n'),
    user: [
      `DIMENSION SPECIFICATION:\n${JSON.stringify(input.dimensionSpec, null, 2)}`,
      `TARGET ITEM FAMILY: ${input.family}`,
      `TARGET DIFFICULTY: ${input.targetDifficulty}`,
      `PROHIBITED PATTERNS:\n${input.prohibitedPatterns.map((item) => `- ${item}`).join('\n') || '- none beyond the global rules'}`,
      `EXISTING ITEM SUMMARIES TO AVOID:\n${input.existingItemSummaries.map((item) => `- ${item}`).join('\n') || '- none'}`,
      `OUTPUT JSON SCHEMA:\n${CANDIDATE_SCHEMA_TEXT}`,
      'Before returning, solve the item yourself and ensure the explanation proves the selected answer and no other option.',
    ].join('\n\n'),
  };
}

export function buildReviewPrompt(
  candidate: CandidateQuestion,
  dimensionSpec: DimensionSpec,
  existingItemSummaries: readonly string[],
): { system: string; user: string } {
  const blindCandidate = {
    dimensionId: candidate.dimensionId,
    difficulty: candidate.difficulty,
    family: candidate.family,
    kind: candidate.kind,
    prompt: candidate.prompt,
    stimulus: candidate.stimulus,
    options: candidate.options,
  };
  return {
    system: [
      'You are an independent adversarial reviewer of a cognitive-assessment item.',
      'The author answer is intentionally hidden. Solve the item independently.',
      'Return exactly one JSON object and no markdown.',
      'Reject ambiguity, multiple valid answers, missing information, cultural or specialist knowledge dependence, construct contamination, weak distractors, duplicates and mislabeled difficulty.',
    ].join('\n'),
    user: [
      `DIMENSION SPECIFICATION:\n${JSON.stringify(dimensionSpec, null, 2)}`,
      `BLIND CANDIDATE:\n${JSON.stringify(blindCandidate, null, 2)}`,
      `EXISTING ITEM SUMMARIES:\n${existingItemSummaries.map((item) => `- ${item}`).join('\n') || '- none'}`,
      `Return this shape:
{
  "valid": boolean,
  "dimensionFit": number from 0 to 1,
  "predictedDifficulty": number from 1 to 5,
  "ambiguityRisk": number from 0 to 1,
  "knowledgeDependency": number from 0 to 1,
  "distractorQuality": number from 0 to 1,
  "duplicateRisk": number from 0 to 1,
  "detectedCorrectIndex": 0|1|2|3|null,
  "problems": ["string"],
  "suggestedFixes": ["string"]
}`,
    ].join('\n\n'),
  };
}
