import { definePublicQuestion, opaqueOptionId } from '../banks/helpers.ts';
import type {
  NctbAnswerKey,
  NctbBankId,
  NctbEditorialReview,
  NctbPublicQuestion,
} from '../types.ts';
import { validateCandidate } from '../validation/validateCandidate.ts';
import type { ReviewedCandidate } from './schemas.ts';
import { reviewRejectionReasons } from './reviewer.ts';

export interface HumanApprovalRecord {
  approvedBy: string;
  approvedAt: string;
  evidence: string;
}

export interface SolDesignRecord {
  designedBy: 'Sol';
  reviewedAt: string;
  changeSummary: string;
}

export interface FreezeCandidateInput {
  id: string;
  bankId: NctbBankId;
  version: number;
  humanApproval: HumanApprovalRecord;
  solDesignRecord?: SolDesignRecord;
}

export interface FrozenCandidate {
  publicQuestion: NctbPublicQuestion;
  answerKey: NctbAnswerKey;
  editorialReview: NctbEditorialReview;
  humanApproval: HumanApprovalRecord;
  solDesignRecord?: SolDesignRecord;
}

function validIsoDate(value: string): boolean {
  return Boolean(value) && Number.isFinite(Date.parse(value));
}

function validateApproval(record: HumanApprovalRecord): void {
  if (record.approvedBy.trim().length < 2 || !validIsoDate(record.approvedAt) || record.evidence.trim().length < 10) {
    throw new Error('Human approval must include approvedBy, an ISO date and meaningful evidence.');
  }
}

function validateSolDesign(record: SolDesignRecord | undefined): void {
  if (!record || record.designedBy !== 'Sol' || !validIsoDate(record.reviewedAt) || record.changeSummary.trim().length < 10) {
    throw new Error('Formal items require a structured Sol redesign and final-design record.');
  }
}

export function freezeReviewedCandidate(reviewed: ReviewedCandidate, input: FreezeCandidateInput): FrozenCandidate {
  const derivedRejections = reviewRejectionReasons(reviewed.candidate, reviewed.review);
  if (reviewed.accepted !== (derivedRejections.length === 0) || reviewed.rejectionReasons.join('|') !== derivedRejections.join('|')) {
    throw new Error('Reviewed artifact acceptance fields do not match the reviewer metrics.');
  }
  if (derivedRejections.length > 0) throw new Error(`Cannot freeze rejected candidate: ${derivedRejections.join('; ')}`);
  validateApproval(input.humanApproval);
  validateSolDesign(input.solDesignRecord);
  const candidateProblems = validateCandidate(reviewed.candidate);
  if (candidateProblems.length > 0) throw new Error(`Candidate failed deterministic validation: ${candidateProblems.join('; ')}`);
  const publicQuestion = definePublicQuestion({
    id: input.id,
    version: input.version,
    bankId: input.bankId,
    dimensionId: reviewed.candidate.dimensionId,
    difficulty: reviewed.candidate.difficulty,
    family: reviewed.candidate.family,
    kind: reviewed.candidate.kind,
    prompt: reviewed.candidate.prompt,
    stimulus: reviewed.candidate.stimulus,
    options: reviewed.candidate.options.map((option) => option.label) as [string, string, string, string],
    hint: undefined,
    explanation: undefined,
  });
  return {
    publicQuestion,
    answerKey: {
      bankId: input.bankId,
      questionId: input.id,
      questionVersion: input.version,
      correctOptionId: opaqueOptionId(input.id, reviewed.candidate.correctIndex),
    },
    editorialReview: {
      questionId: input.id,
      constructMeasured: reviewed.candidate.rationale.constructMeasured,
      difficultyReason: reviewed.candidate.rationale.difficultyReason,
      distractorLogic: reviewed.candidate.rationale.distractorLogic,
      authorStatus: 'ai-assisted-sol-redesigned',
      approvalStatus: 'pilot-approved',
    },
    humanApproval: input.humanApproval,
    solDesignRecord: input.solDesignRecord,
  };
}
