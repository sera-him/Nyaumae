import assert from 'node:assert/strict';

import {
  ATTRIBUTE_BY_ID,
  ATTRIBUTE_DEFINITIONS,
  ATTRIBUTE_IDS,
  BUILDING_BY_ID,
  BUILDINGS,
  EVENTS,
  PROJECTS,
  createAttributeValues,
  type AttributeId,
  type CityBuilderGameState,
} from '../src/game/cityBuilder/model.ts';
import {
  calculateFinalScores,
  calculateScores,
  createCityBuilderGame,
  getProjectRequirements,
  getProjectMinimumContribution,
  getReserveCap,
  isProjectComplete,
  queueBuilding,
  runAutomatedCityStep,
  tickCityBuilderGame,
} from '../src/game/cityBuilder/engine.ts';

const FIXED_STEP_MS = 250;
const FIXED_STEP_SECONDS = FIXED_STEP_MS / 1_000;
const TEST_DURATION_SECONDS = 6 * 60;
const EPSILON = 1e-6;

interface SimulationSummary {
  seed: number;
  winnerIds: string[];
  winnerScore: number;
  completedBuildings: number;
  completedProjects: number;
  resolvedProjects: number;
  resolvedEvents: number;
  successfulEventDefenses: number;
  failedEventDefenses: number;
  totalAttributes: number[];
  tierCounts: [number, number, number];
  buildsByColor: number[];
}

const simulationSummaries: SimulationSummary[] = [];

function assertApproximatelyEqual(actual: number, expected: number, message: string): void {
  assert.ok(
    Math.abs(actual - expected) <= EPSILON,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function assertExactColorCoverage(values: Iterable<AttributeId>, label: string): void {
  const actual = [...new Set(values)].sort();
  const expected = [...ATTRIBUTE_IDS].sort();
  assert.deepEqual(actual, expected, `${label} must cover every attribute color exactly once`);
}

function assertStateBounds(state: CityBuilderGameState, context: string): void {
  assert.ok(Number.isFinite(state.elapsed), `${context}: elapsed time must remain finite`);
  assert.ok(state.elapsed >= -EPSILON, `${context}: elapsed time cannot be negative`);
  assert.ok(
    state.elapsed <= state.durationSeconds + EPSILON,
    `${context}: elapsed time cannot exceed the configured duration`,
  );

  for (const city of state.cities) {
    const reserveCap = getReserveCap(city);
    for (const color of ATTRIBUTE_IDS) {
      const reserve = city.reserves[color];
      const attribute = city.attributes[color];
      assert.ok(Number.isFinite(reserve), `${context}: ${city.id}/${color} reserve must be finite`);
      assert.ok(Number.isFinite(attribute), `${context}: ${city.id}/${color} attribute must be finite`);
      assert.ok(reserve >= -EPSILON, `${context}: ${city.id}/${color} reserve fell below zero (${reserve})`);
      assert.ok(
        reserve <= reserveCap + EPSILON,
        `${context}: ${city.id}/${color} reserve exceeded cap ${reserveCap} (${reserve})`,
      );
      assert.ok(attribute >= -EPSILON, `${context}: ${city.id}/${color} attribute fell below zero (${attribute})`);
      assert.ok(
        attribute <= 15 + EPSILON,
        `${context}: ${city.id}/${color} attribute exceeded 15 (${attribute})`,
      );
    }

    for (const tile of city.tiles) {
      if (!tile) continue;
      assert.ok(BUILDING_BY_ID[tile.buildingId], `${context}: unknown building instance ${tile.buildingId}`);
      assert.equal(tile.color, BUILDING_BY_ID[tile.buildingId].color, `${context}: building color drifted`);
      assert.ok(tile.completeAt + EPSILON >= tile.startedAt, `${context}: construction ends before it starts`);
    }
  }

  if (state.activeProject) {
    for (const [cityId, contribution] of Object.entries(state.activeProject.contributions)) {
      assert.ok(state.cities.some((city) => city.id === cityId), `${context}: project has an unknown contributor`);
      for (const color of ATTRIBUTE_IDS) {
        assert.ok(
          Number.isFinite(contribution[color]) && contribution[color] >= -EPSILON,
          `${context}: invalid project contribution for ${cityId}/${color}`,
        );
      }
    }
  }
}

function validateFinishedGame(state: CityBuilderGameState, seed: number): SimulationSummary {
  assert.equal(state.status, 'finished', `seed ${seed}: simulation must reach the terminal state`);
  assertApproximatelyEqual(state.elapsed, state.durationSeconds, `seed ${seed}: terminal clock`);
  assert.ok(state.winnerIds.length > 0, `seed ${seed}: at least one winner must be assigned`);
  assert.equal(new Set(state.winnerIds).size, state.winnerIds.length, `seed ${seed}: winners must be unique`);
  for (const winnerId of state.winnerIds) {
    assert.ok(
      state.cities.some((city) => city.id === winnerId),
      `seed ${seed}: winner ${winnerId} must reference a city in the game`,
    );
  }
  assert.equal(state.activeProject, null, `seed ${seed}: no project may remain active after the clock expires`);
  assert.equal(state.activeEvent, null, `seed ${seed}: no event may remain active after the clock expires`);

  const scores = calculateScores(state);
  assert.equal(scores.length, state.cities.length, `seed ${seed}: every city must receive a score`);
  for (const score of scores) {
    assert.ok(Number.isFinite(score.total) && score.total > 0, `seed ${seed}: ${score.cityId} score must be positive and finite`);
    assert.ok(Number.isInteger(score.place) && score.place >= 1, `seed ${seed}: ${score.cityId} place must be valid`);
    for (const color of ATTRIBUTE_IDS) {
      assert.ok(Number.isFinite(score.attributeScores[color]), `seed ${seed}: invalid ${color} score`);
      assert.ok(Number.isFinite(score.rankBonuses[color]), `seed ${seed}: invalid ${color} rank bonus`);
    }
  }

  const winnerScore = scores.find((score) => score.cityId === state.winnerIds[0]);
  assert.ok(winnerScore, `seed ${seed}: winner must have a score record`);
  const maximumScore = Math.max(...scores.map((score) => score.total));
  assertApproximatelyEqual(winnerScore.total, maximumScore, `seed ${seed}: winner must have the highest total score`);

  const aiCities = state.cities.filter((city) => !city.isHuman);
  assert.equal(aiCities.length, 3, `seed ${seed}: default game must retain exactly three AI cities`);
  for (const city of aiCities) {
    const completed = city.tiles.filter((tile) => tile?.status === 'complete').length;
    assert.ok(completed > 0, `seed ${seed}: ${city.id} did not complete any building`);
  }

  const completedBuildings = state.cities.reduce(
    (total, city) => total + city.tiles.filter((tile) => tile?.status === 'complete').length,
    0,
  );
  assert.ok(completedBuildings > aiCities.length, `seed ${seed}: the city group built too little to be playable`);
  assert.ok(state.metrics.resolvedProjects > 0, `seed ${seed}: no regional project was resolved`);
  assert.ok(state.metrics.resolvedEvents > 0, `seed ${seed}: no city event was resolved`);

  return {
    seed,
    winnerIds: state.winnerIds,
    winnerScore: winnerScore.total,
    completedBuildings,
    completedProjects: state.metrics.completedProjects,
    resolvedProjects: state.metrics.resolvedProjects,
    resolvedEvents: state.metrics.resolvedEvents,
    successfulEventDefenses: state.metrics.successfulEventDefenses,
    failedEventDefenses: state.metrics.failedEventDefenses,
    totalAttributes: state.cities.map((city) => ATTRIBUTE_IDS.reduce((sum, color) => sum + city.attributes[color], 0)),
    tierCounts: ([1, 2, 3] as const).map((tier) => state.cities.reduce(
      (total, city) => total + city.tiles.filter((tile) => tile?.status === 'complete' && BUILDING_BY_ID[tile.buildingId].tier === tier).length,
      0,
    )) as [number, number, number],
    buildsByColor: ATTRIBUTE_IDS.map((color) => state.metrics.buildsByColor[color]),
  };
}

function simulate(seed: number): CityBuilderGameState {
  const playerCore = ATTRIBUTE_IDS[seed % ATTRIBUTE_IDS.length];
  let state = createCityBuilderGame({
    playerCore,
    durationSeconds: TEST_DURATION_SECONDS,
    seed,
  });
  const expectedSteps = Math.round(TEST_DURATION_SECONDS / FIXED_STEP_SECONDS);

  assertStateBounds(state, `seed ${seed}, initial state`);
  for (let step = 1; state.status === 'running'; step += 1) {
    assert.ok(step <= expectedSteps, `seed ${seed}: simulation exceeded the fixed-step budget`);
    const previousElapsed = state.elapsed;
    state = tickCityBuilderGame(state, FIXED_STEP_SECONDS);

    if (state.status === 'running' && step % 4 === 0) {
      state = runAutomatedCityStep(state, state.humanCityId, 'balanced');
    }

    const expectedElapsed = Math.min(state.durationSeconds, previousElapsed + FIXED_STEP_SECONDS);
    assertApproximatelyEqual(state.elapsed, expectedElapsed, `seed ${seed}, step ${step}: fixed-step clock`);
    assertStateBounds(state, `seed ${seed}, step ${step}`);
  }

  assert.equal(
    Math.round(state.elapsed / FIXED_STEP_SECONDS),
    expectedSteps,
    `seed ${seed}: terminal time must be an exact sequence of 250ms steps`,
  );
  return state;
}

type TestCase = readonly [name: string, run: () => void];
const tests: TestCase[] = [
  ['12-color model data is complete and internally consistent', () => {
    assert.equal(ATTRIBUTE_IDS.length, 12, 'there must be exactly twelve attribute IDs');
    assert.equal(ATTRIBUTE_DEFINITIONS.length, 12, 'there must be exactly twelve attribute definitions');
    assertExactColorCoverage(ATTRIBUTE_DEFINITIONS.map((definition) => definition.id), 'attribute definitions');
    assert.equal(new Set(ATTRIBUTE_DEFINITIONS.map((definition) => definition.color)).size, 12, 'attribute colors must be unique');
    assert.equal(new Set(ATTRIBUTE_DEFINITIONS.map((definition) => definition.icon)).size, 12, 'attribute icons must be unique');

    for (const definition of ATTRIBUTE_DEFINITIONS) {
      assert.equal(ATTRIBUTE_BY_ID[definition.id], definition, `${definition.id} lookup must use the canonical definition`);
      assert.match(definition.color, /^#[0-9a-f]{6}$/i, `${definition.id} must use a six-digit color`);
      assert.ok(definition.label && definition.role && definition.mechanic, `${definition.id} is missing visitor-facing text`);
      assert.equal(definition.dependencies.length, 2, `${definition.id} must have two dependencies`);
      assert.ok(definition.dependencies.every((color) => ATTRIBUTE_IDS.includes(color)), `${definition.id} has an unknown dependency`);
    }

    assert.equal(BUILDINGS.length, 36, 'each color must provide one building for each of three tiers');
    assert.equal(new Set(BUILDINGS.map((building) => building.id)).size, BUILDINGS.length, 'building IDs must be unique');
    assertExactColorCoverage(BUILDINGS.map((building) => building.color), 'building catalog');
    for (const color of ATTRIBUTE_IDS) {
      const tiers = BUILDINGS.filter((building) => building.color === color).map((building) => building.tier).sort();
      assert.deepEqual(tiers, [1, 2, 3], `${color} must contain tier 1, 2, and 3 buildings`);
    }

    assert.equal(PROJECTS.length, 12, 'there must be one regional project per color');
    assert.equal(new Set(PROJECTS.map((project) => project.id)).size, PROJECTS.length, 'project IDs must be unique');
    assertExactColorCoverage(PROJECTS.map((project) => project.color), 'regional projects');
    for (const project of PROJECTS) {
      const definition = ATTRIBUTE_BY_ID[project.color];
      assert.ok((project.requirements[project.color] ?? 0) > 0, `${project.id} must require its own color`);
      assert.ok(
        definition.dependencies.every((color) => (project.requirements[color] ?? 0) > 0),
        `${project.id} must require both dependency colors`,
      );
    }

    assert.equal(EVENTS.length, 12, 'there must be one event per color');
    assert.equal(new Set(EVENTS.map((event) => event.id)).size, EVENTS.length, 'event IDs must be unique');
    assertExactColorCoverage(EVENTS.map((event) => event.color), 'events');
    for (const event of EVENTS) {
      assert.equal(event.responses.length, 3, `${event.id} must provide three response colors`);
      assert.equal(new Set(event.responses).size, 3, `${event.id} response colors must be distinct`);
      assert.ok(event.responses.every((color) => ATTRIBUTE_IDS.includes(color)), `${event.id} has an unknown response color`);
    }
  }],

  ['default setup creates one human city and exactly three AI cities', () => {
    const state = createCityBuilderGame({ playerCore: 'technology', seed: 7 });
    const humanCities = state.cities.filter((city) => city.isHuman);
    const aiCities = state.cities.filter((city) => !city.isHuman);
    assert.equal(humanCities.length, 1);
    assert.equal(aiCities.length, 3);
    assert.equal(state.cities.length, 4);
    assert.equal(state.humanCityId, humanCities[0].id);
    assert.ok(aiCities.every((city) => city.aiStyle !== null), 'every AI city must have an AI style');
    assert.equal(new Set(state.cities.map((city) => city.id)).size, state.cities.length, 'city IDs must be unique');
  }],

  ['engine advances in exact 250ms fixed steps', () => {
    assert.equal(FIXED_STEP_MS, 250);
    let state = createCityBuilderGame({ playerCore: 'infrastructure', durationSeconds: TEST_DURATION_SECONDS, seed: 17 });
    for (let step = 1; step <= 40; step += 1) {
      const previousElapsed = state.elapsed;
      state = tickCityBuilderGame(state, FIXED_STEP_SECONDS);
      assertApproximatelyEqual(state.elapsed - previousElapsed, FIXED_STEP_SECONDS, `fixed step ${step}`);
    }
    assertApproximatelyEqual(state.elapsed, 10, 'forty 250ms steps');
  }],

  ['in-place upgrades add only the next tier delta', () => {
    const prepare = (tier: 1 | 2 | 3) => {
      const state = createCityBuilderGame({ playerCore: 'technology', durationSeconds: TEST_DURATION_SECONDS, seed: 19 + tier });
      const city = state.cities.find((candidate) => candidate.id === state.humanCityId)!;
      for (const color of ATTRIBUTE_IDS) city.reserves[color] = 10;
      if (tier === 1) return { state, expected: 3 };

      state.elapsed = tier === 2 ? TEST_DURATION_SECONDS / 3 : TEST_DURATION_SECONDS * 2 / 3;
      state.era = tier;
      for (const color of ATTRIBUTE_IDS) city.attributes[color] = 4;
      city.attributes.technology = tier === 2 ? 4 : 8;
      city.attributes.industry = tier === 2 ? 3 : 6;
      city.attributes.culture = tier === 2 ? 3 : 6;
      city.tiles[6] = {
        instanceId: `fixture-technology-${tier - 1}`,
        buildingId: `technology-${tier - 1}`,
        color: 'technology',
        startedAt: 0,
        completeAt: 0,
        status: 'complete',
      };
      return { state, expected: city.attributes.technology + 1 };
    };

    for (const tier of [1, 2, 3] as const) {
      const prepared = prepare(tier);
      const cityId = prepared.state.humanCityId;
      let state = queueBuilding(prepared.state, cityId, `technology-${tier}`, 6);
      const construction = state.cities.find((city) => city.id === cityId)!.tiles[6];
      assert.equal(construction?.status, 'building', `tier ${tier} construction must enter the queue`);
      construction!.completeAt = state.elapsed + 0.01;
      state = tickCityBuilderGame(state, FIXED_STEP_SECONDS);
      const city = state.cities.find((candidate) => candidate.id === cityId)!;
      assertApproximatelyEqual(city.attributes.technology, prepared.expected, `tier ${tier} completion gain`);
    }
  }],

  ['failed projects refund ninety percent in the original colors', () => {
    let state = createCityBuilderGame({ playerCore: 'welfare', durationSeconds: TEST_DURATION_SECONDS, seed: 21 });
    const city = state.cities[0];
    city.reserves.industry = 0;
    state.activeProject = {
      definitionId: 'project-technology',
      startedAt: 0,
      endsAt: 0,
      contributions: Object.fromEntries(state.cities.map((candidate) => [candidate.id, createAttributeValues(0)])),
    };
    state.activeProject.contributions[city.id].industry = 2;
    state = tickCityBuilderGame(state, 0.001);
    assert.equal(state.activeProject, null);
    assert.ok(city.reserves.industry === 0, 'the immutable input snapshot should remain untouched');
    const refundedCity = state.cities.find((candidate) => candidate.id === city.id)!;
    assert.ok(refundedCity.reserves.industry >= 1.8 && refundedCity.reserves.industry < 1.81, 'two invested industry points should refund at 90%');
  }],

  ['a complete final tie produces joint winners and clears unsettled activity', () => {
    let state = createCityBuilderGame({ playerCore: 'technology', durationSeconds: TEST_DURATION_SECONDS, seed: 27 });
    state.elapsed = state.durationSeconds - FIXED_STEP_SECONDS;
    state.nextProjectAt = Number.POSITIVE_INFINITY;
    state.nextEventAt = Number.POSITIVE_INFINITY;
    for (const city of state.cities) city.nextAiAt = Number.POSITIVE_INFINITY;
    state.activeProject = {
      definitionId: 'project-ecology',
      startedAt: state.elapsed,
      endsAt: state.durationSeconds + 10,
      contributions: Object.fromEntries(state.cities.map((city) => [city.id, createAttributeValues(0)])),
    };
    state.activeEvent = {
      definitionId: 'event-security',
      startedAt: state.elapsed,
      warningEndsAt: state.elapsed,
      endsAt: state.durationSeconds + 10,
      responses: Object.fromEntries(state.cities.map((city) => [city.id, createAttributeValues(0)])),
    };
    state = tickCityBuilderGame(state, FIXED_STEP_SECONDS);
    assert.equal(state.status, 'finished');
    assert.deepEqual(new Set(state.winnerIds), new Set(state.cities.map((city) => city.id)));
    assert.equal(state.activeProject, null);
    assert.equal(state.activeEvent, null);
  }],

  ['final ranking places use the same tie-breaks as winner selection', () => {
    let state = createCityBuilderGame({
      playerCore: 'technology',
      aiCount: 1,
      durationSeconds: TEST_DURATION_SECONDS,
      seed: 29,
    });
    const human = state.cities.find((city) => city.isHuman)!;
    const rival = state.cities.find((city) => !city.isHuman)!;
    human.core = 'technology';
    rival.core = 'healthcare';
    for (const color of ATTRIBUTE_IDS) {
      human.attributes[color] = 2;
      rival.attributes[color] = 2;
    }
    human.attributes.food = 5;
    rival.attributes.healthcare = 3;

    const scores = calculateFinalScores(state);
    const humanScore = scores.find((score) => score.cityId === human.id)!;
    const rivalScore = scores.find((score) => score.cityId === rival.id)!;
    assertApproximatelyEqual(humanScore.total, rivalScore.total, 'fixture total scores');
    assert.equal(humanScore.place, 1, 'higher attribute total must win the first tie-break');
    assert.equal(rivalScore.place, 2, 'the runner-up must not still be displayed as joint first');

    state.elapsed = state.durationSeconds - FIXED_STEP_SECONDS;
    state.nextProjectAt = Number.POSITIVE_INFINITY;
    state.nextEventAt = Number.POSITIVE_INFINITY;
    for (const city of state.cities) city.nextAiAt = Number.POSITIVE_INFINITY;
    state = tickCityBuilderGame(state, FIXED_STEP_SECONDS);
    assert.deepEqual(state.winnerIds, [human.id]);
  }],

  ['regional projects cannot complete with fewer than two contributing cities', () => {
    const state = createCityBuilderGame({ playerCore: 'ecology', durationSeconds: TEST_DURATION_SECONDS, seed: 23 });
    const definition = PROJECTS[0];
    state.activeProject = {
      definitionId: definition.id,
      startedAt: state.elapsed,
      endsAt: state.elapsed + 30,
      contributions: Object.fromEntries(state.cities.map((city) => [city.id, createAttributeValues(0)])),
    };
    const requirements = getProjectRequirements(state);
    const firstCity = state.cities[0].id;
    const secondCity = state.cities[1].id;
    for (const color of ATTRIBUTE_IDS) {
      state.activeProject.contributions[firstCity][color] = requirements[color] ?? 0;
    }
    assert.equal(isProjectComplete(state), false, 'one city cannot complete a regional project alone');

    let amountToShare = getProjectMinimumContribution(state);
    for (const color of ATTRIBUTE_IDS) {
      const share = Math.min(requirements[color] ?? 0, amountToShare);
      state.activeProject.contributions[firstCity][color] -= share;
      state.activeProject.contributions[secondCity][color] += share;
      amountToShare -= share;
      if (amountToShare <= EPSILON) break;
    }
    assert.ok(amountToShare <= EPSILON, 'project requirements must be large enough for a second qualified contributor');
    assert.equal(isProjectComplete(state), true, 'the same totals should complete after a second city reaches the 15% threshold');
  }],

  ['tied attribute ranks share the occupied ranking bonuses equally', () => {
    const state = createCityBuilderGame({ playerCore: 'food', durationSeconds: TEST_DURATION_SECONDS, seed: 31 });
    const values = [10, 10, 5, 2];
    state.cities.forEach((city, index) => {
      city.attributes.technology = values[index];
    });
    const scores = calculateScores(state);
    const topBonuses = state.cities.slice(0, 2).map((city) => (
      scores.find((score) => score.cityId === city.id)?.rankBonuses.technology
    ));
    assert.deepEqual(topBonuses, [3, 3], 'first and second bonuses (4 and 2) must average to 3 for a tie');
    assert.equal(scores.find((score) => score.cityId === state.cities[2].id)?.rankBonuses.technology, 1);
    assert.equal(scores.find((score) => score.cityId === state.cities[3].id)?.rankBonuses.technology, 0);
  }],

  ['same seed and fixed-step inputs produce identical terminal state', () => {
    const first = simulate(0x5eed1234);
    const second = simulate(0x5eed1234);
    assert.deepEqual(second, first, 'seeded simulations must be byte-for-byte deterministic in state shape');
  }],

  ['multiple auto-driven games finish with valid AI construction, bounds, winners, and scores', () => {
    const seeds = [1, 2, 3, 42, 2_026_081_6, 0xffff_ffff];
    for (const seed of seeds) {
      const finalState = simulate(seed >>> 0);
      simulationSummaries.push(validateFinishedGame(finalState, seed >>> 0));
    }
    for (const summary of simulationSummaries) {
      assert.ok(summary.completedProjects > 0, `seed ${summary.seed}: cooperation never completed a project`);
      assert.ok(summary.successfulEventDefenses > 0, `seed ${summary.seed}: no city defended an event`);
      assert.ok(summary.failedEventDefenses > 0, `seed ${summary.seed}: events never created meaningful risk`);
    }
    for (const [index, color] of ATTRIBUTE_IDS.entries()) {
      const builds = simulationSummaries.reduce((sum, summary) => sum + summary.buildsByColor[index], 0);
      assert.ok(builds > 0, `${color}: no automated city used this building color across the seed set`);
    }
    const landmarks = simulationSummaries.reduce((sum, summary) => sum + summary.tierCounts[2], 0);
    assert.ok(landmarks > 0, 'automated cities never completed a tier-three landmark');
  }],
];

let passed = 0;
for (const [name, run] of tests) {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

for (const summary of simulationSummaries) {
  console.log(
    `SIM seed=${summary.seed} winners=${summary.winnerIds.join('+')} score=${summary.winnerScore.toFixed(2)}`
    + ` buildings=${summary.completedBuildings} tiers=${summary.tierCounts.join('/')}`
    + ` attributes=${summary.totalAttributes.map((value) => value.toFixed(1)).join('/')}`
    + ` projects=${summary.completedProjects}/${summary.resolvedProjects}`
    + ` events=${summary.successfulEventDefenses}/${summary.failedEventDefenses}`
    + ` colors=${summary.buildsByColor.join('/')}`,
  );
}

console.log(`${passed}/${tests.length} city-builder smoke checks passed.`);
if (passed !== tests.length) process.exitCode = 1;
