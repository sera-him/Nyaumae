import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { freezeReviewedCandidate, type HumanApprovalRecord, type SolDesignRecord } from '../../src/nctb/generation/freeze.ts';
import { candidateQuestionSchema, itemReviewSchema } from '../../src/nctb/generation/schemas.ts';
import type { NctbBankId } from '../../src/nctb/types.ts';

const [reviewedPath, id, bankId, versionText, approvalPath, optionalRecordPath, optionalOutputPath] = process.argv.slice(2);
if (!reviewedPath || !id || bankId !== 'formal-a-v1' || !versionText || !approvalPath) {
  throw new Error('Usage: freeze-item.ts <reviewed.json> <item-id> formal-a-v1 <version> <approval.json> <sol-redesign.json> [output.json]');
}
const raw = JSON.parse(await readFile(resolve(reviewedPath), 'utf8')) as Record<string, unknown>;
const reviewed = {
  candidate: candidateQuestionSchema.parse(raw.candidate),
  review: itemReviewSchema.parse(raw.review),
  accepted: raw.accepted === true,
  rejectionReasons: Array.isArray(raw.rejectionReasons) ? raw.rejectionReasons.filter((item): item is string => typeof item === 'string') : [],
};
const humanApproval = JSON.parse(await readFile(resolve(approvalPath), 'utf8')) as HumanApprovalRecord;
const solDesignRecord = optionalRecordPath
  ? JSON.parse(await readFile(resolve(optionalRecordPath), 'utf8')) as SolDesignRecord
  : undefined;
const frozen = freezeReviewedCandidate(reviewed, {
  id,
  bankId: bankId as NctbBankId,
  version: Number(versionText),
  humanApproval,
  solDesignRecord,
});
const outputPath = optionalOutputPath;
const absoluteOutput = resolve(outputPath ?? reviewedPath.replace(/\.reviewed\.json$/i, '.frozen.json'));
await writeFile(absoluteOutput, `${JSON.stringify(frozen, null, 2)}\n`, 'utf8');
process.stdout.write(`Frozen item artifact written to ${absoluteOutput}. Commit it to a versioned bank only after review.\n`);
