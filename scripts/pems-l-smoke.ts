import assert from 'node:assert/strict';
import {
  ADULT_REFERENCE_SCORES,
  demoEquivalentAge,
  demoPopulationMaturity,
  dimensionProbability,
  evaluatePemsL,
  PEMS_DIMENSIONS,
  shiftScores,
} from '../src/lib/pemsLModel.ts';

const weightTotal = PEMS_DIMENSIONS.reduce((total, dimension) => total + dimension.weight, 0);
assert.ok(Math.abs(weightTotal - 1) < 1e-12, 'dimension weights must sum to 1');

for (const dimension of PEMS_DIMENSIONS) {
  assert.equal(
    dimensionProbability(dimension.threshold, dimension.threshold, dimension.slope),
    0.5,
    `${dimension.code} should equal 50% at its threshold`,
  );
}

const adultLine = evaluatePemsL(ADULT_REFERENCE_SCORES);
assert.ok(Math.abs(adultLine.maturity - 0.5) < 1e-12, 'adult reference maturity should equal 50%');
assert.ok(Math.abs(adultLine.demoEquivalentAge - 18) < 1e-12, 'adult reference should invert to age 18');

const balancedHigh = evaluatePemsL({ P: 0.8, E: 0.8, M: 0.8, S: 0.8, L: 0.8 });
const executiveGap = evaluatePemsL({ P: 0.8, E: -2.1, M: 0.8, S: 0.8, L: 0.8 });
assert.ok(executiveGap.maturity < balancedHigh.maturity, 'an executive-function gap should lower maturity');
assert.ok(executiveGap.bottleneckGap > balancedHigh.bottleneckGap, 'an uneven profile should increase the soft-bottleneck gap');

for (const profile of [adultLine, balancedHigh, executiveGap]) {
  assert.ok(profile.maturity <= profile.arithmeticMaturity + 1e-12, 'weighted geometric mean must not exceed the arithmetic mean');
  assert.ok(profile.demoEquivalentAge >= 0 && profile.demoEquivalentAge <= 30, 'demo age must stay in the published range');
}

assert.ok(Math.abs(demoEquivalentAge(demoPopulationMaturity(0))) < 1e-10, 'demo curve should round-trip at age 0');
assert.ok(Math.abs(demoEquivalentAge(demoPopulationMaturity(30)) - 30) < 1e-10, 'demo curve should round-trip at age 30');

const shiftedUp = shiftScores(ADULT_REFERENCE_SCORES, 0.25);
const shiftedDown = shiftScores(ADULT_REFERENCE_SCORES, -0.25);
assert.ok(evaluatePemsL(shiftedDown).demoEquivalentAge < 18, 'negative sensitivity shift should lower demo age');
assert.ok(evaluatePemsL(shiftedUp).demoEquivalentAge > 18, 'positive sensitivity shift should raise demo age');

console.log('PEMS-L smoke checks passed (14 assertions).');
