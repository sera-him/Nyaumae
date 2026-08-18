/**
 * Calculate the Full Scale Intrinsic Intelligence Index from FSIQ.
 *
 * FSIII = 100 + (FSIQ - 85)(FSIQ - 115) / (15√2)
 *
 * Scores are rounded to the nearest integer because the character records and
 * ranking UI present FSIII as a whole-number index.
 */
export function calculateFsiii(fsiq: number): number {
  return Math.round(100 + ((fsiq - 85) * (fsiq - 115)) / (15 * Math.sqrt(2)));
}
