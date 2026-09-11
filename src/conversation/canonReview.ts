import { canonGuard } from './canonGuard.ts';
import type { MemoryInput } from './types.ts';

export type ReviewDecision = 'approve' | 'request-changes' | 'reject';
export interface ReviewEntry {
  input: MemoryInput;
  reviewer: string;
  decision: ReviewDecision;
  note: string;
  at: string;
}

const log: ReviewEntry[] = [];

/**
 * Editorial review flow on top of CanonGuard:
 * draft -> review -> canon. Guard blocks silent overwrites;
 * this records the human decision for the changelog.
 */
export function submitForReview(input: MemoryInput): { verdict: string; needsReview: boolean } {
  const assessment = canonGuard.assessMemory(input);
  return { verdict: assessment.verdict, needsReview: assessment.verdict !== 'pass' || input.canonStatus === 'draft' };
}

export function recordDecision(entry: ReviewEntry): void {
  log.push(entry);
}

export function listDecisions(): ReviewEntry[] {
  return [...log];
}
