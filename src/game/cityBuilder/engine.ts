import {
  ATTRIBUTE_BY_ID,
  ATTRIBUTE_IDS,
  BASELINE_DURATION_SECONDS,
  BUILDING_BY_ID,
  BUILDINGS,
  CITY_HALL_INDEX,
  CITY_MAP_SIZE,
  EVENTS,
  PROJECTS,
  createAttributeValues,
  type AiStyle,
  type AttributeCosts,
  type AttributeId,
  type AttributeValues,
  type BuildingDefinition,
  type BuildingInstance,
  type BuildingTier,
  type CityBuilderGameState,
  type CityScore,
  type CityState,
  type Era,
  type EventState,
  type GameConfig,
  type ProjectState,
} from './model.ts';

const BUILD_COSTS: Record<BuildingTier, readonly [number, number, number]> = {
  1: [3, 2, 1],
  2: [5, 3, 2],
  3: [8, 5, 4],
};

const BUILD_SECONDS: Record<BuildingTier, number> = { 1: 16, 2: 26, 3: 42 };
const BUILD_PRODUCTION: Record<BuildingTier, number> = { 1: 0.022, 2: 0.045, 3: 0.075 };
const AI_STYLES: readonly AiStyle[] = ['balanced', 'specialist', 'cooperator', 'resilient'];
const AI_NAMES = ['棱镜市', '潮汐城', '旷野城', '星桥市', '云港城'];
const PROJECT_WINDOW_SECONDS = 25;
const EVENT_WARNING_SECONDS = 10;
const EVENT_RESPONSE_SECONDS = 30;
const PROJECT_REFUND_RATE = 0.9;

export interface BuildCheck {
  ok: boolean;
  reason: string;
  cost: AttributeCosts;
  durationSeconds: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function cloneValues(values: AttributeValues): AttributeValues {
  return { ...values };
}

function cloneCity(city: CityState): CityState {
  return {
    ...city,
    attributes: cloneValues(city.attributes),
    reserves: cloneValues(city.reserves),
    tiles: city.tiles.map((tile) => tile ? { ...tile } : null),
  };
}

function cloneValueMap(map: Record<string, AttributeValues>): Record<string, AttributeValues> {
  return Object.fromEntries(
    Object.entries(map).map(([cityId, values]) => [cityId, cloneValues(values)]),
  );
}

function cloneProject(project: ProjectState | null): ProjectState | null {
  return project ? { ...project, contributions: cloneValueMap(project.contributions) } : null;
}

function cloneEvent(event: EventState | null): EventState | null {
  return event ? { ...event, responses: cloneValueMap(event.responses) } : null;
}

function cloneGame(state: CityBuilderGameState): CityBuilderGameState {
  return {
    ...state,
    cities: state.cities.map(cloneCity),
    activeProject: cloneProject(state.activeProject),
    activeEvent: cloneEvent(state.activeEvent),
    regionalFailures: cloneValues(state.regionalFailures),
    logs: [...state.logs],
    metrics: {
      ...state.metrics,
      buildsByColor: cloneValues(state.metrics.buildsByColor),
    },
  };
}

function durationScale(state: Pick<CityBuilderGameState, 'durationSeconds'>): number {
  return state.durationSeconds / BASELINE_DURATION_SECONDS;
}

function paceMultiplier(state: Pick<CityBuilderGameState, 'durationSeconds'>): number {
  return BASELINE_DURATION_SECONDS / state.durationSeconds;
}

function nextRandom(state: CityBuilderGameState): number {
  state.rngState = (Math.imul(state.rngState, 1664525) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function addLog(
  state: CityBuilderGameState,
  color: AttributeId,
  text: string,
  tone: 'info' | 'success' | 'warning' = 'info',
): void {
  state.logs = [
    { id: state.nextLogId, at: state.elapsed, color, text, tone },
    ...state.logs,
  ].slice(0, 14);
  state.nextLogId += 1;
}

function findCity(state: CityBuilderGameState, cityId: string): CityState | null {
  return state.cities.find((city) => city.id === cityId) ?? null;
}

function makeCity(
  id: string,
  name: string,
  core: AttributeId,
  isHuman: boolean,
  aiStyle: AiStyle | null,
  nextAiAt: number,
): CityState {
  return {
    id,
    name,
    isHuman,
    aiStyle,
    core,
    focus: core,
    attributes: createAttributeValues(2),
    reserves: createAttributeValues(3),
    tiles: Array.from({ length: CITY_MAP_SIZE ** 2 }, () => null),
    nextExchangeAt: 0,
    nextProjectContributionAt: 0,
    nextAiAt,
  };
}

function chooseAiCores(playerCore: AttributeId, aiCount: number, seed: number): AttributeId[] {
  const choices = ATTRIBUTE_IDS.filter((id) => id !== playerCore);
  const offset = seed % choices.length;
  return Array.from({ length: aiCount }, (_, index) => choices[(offset + index * 5) % choices.length]);
}

export function createCityBuilderGame(config: GameConfig): CityBuilderGameState {
  const aiCount = clamp(Math.round(config.aiCount ?? 3), 1, 5);
  const durationSeconds = clamp(Math.round(config.durationSeconds ?? 12 * 60), 6 * 60, 18 * 60);
  const seed = (config.seed ?? Date.now()) >>> 0;
  const scale = durationSeconds / BASELINE_DURATION_SECONDS;
  const aiCores = chooseAiCores(config.playerCore, aiCount, seed);
  const cities = [
    makeCity('human', '你的城市', config.playerCore, true, null, Number.POSITIVE_INFINITY),
    ...aiCores.map((core, index) => makeCity(
      `ai-${index + 1}`,
      AI_NAMES[index],
      core,
      false,
      AI_STYLES[index % AI_STYLES.length],
      Math.max(0.45, (1.1 + index * 0.18) * scale),
    )),
  ];

  return {
    status: 'running',
    seed,
    rngState: seed || 1,
    durationSeconds,
    elapsed: 0,
    era: 1,
    humanCityId: 'human',
    cities,
    activeProject: null,
    nextProjectAt: 45 * scale,
    activeEvent: null,
    nextEventAt: 60 * scale,
    regionalFailures: createAttributeValues(0),
    logs: [{ id: 1, at: 0, color: config.playerCore, text: '城市群已同步启动：没有回合，所有城市同时发展。', tone: 'info' }],
    nextLogId: 2,
    metrics: {
      buildsByColor: createAttributeValues(0),
      exchanges: 0,
      projectContributions: 0,
      completedProjects: 0,
      resolvedProjects: 0,
      eventResponses: 0,
      resolvedEvents: 0,
      successfulEventDefenses: 0,
      failedEventDefenses: 0,
    },
    winnerIds: [],
  };
}

export function getBuildingCost(building: BuildingDefinition): AttributeCosts {
  const [main, dependencyA, dependencyB] = BUILD_COSTS[building.tier];
  const dependencies = ATTRIBUTE_BY_ID[building.color].dependencies;
  return {
    [building.color]: main,
    [dependencies[0]]: dependencyA,
    [dependencies[1]]: dependencyB,
  };
}

function getCompletedBuildingGain(building: BuildingDefinition): number {
  if (building.tier === 1) return building.gain;
  const previousTier = BUILDINGS.find((candidate) => (
    candidate.color === building.color && candidate.tier === building.tier - 1
  ));
  return Math.max(0, building.gain - (previousTier?.gain ?? 0));
}

export function getConstructionSlots(city: CityState): number {
  const infrastructure = city.attributes.infrastructure;
  return 2 + (infrastructure >= 6 ? 1 : 0) + (infrastructure >= 10 ? 1 : 0);
}

export function getOccupiedTileCount(city: CityState): number {
  return city.tiles.filter(Boolean).length;
}

export function getDevelopmentCapacity(state: CityBuilderGameState, city: CityState): number {
  const eraCapacity: Record<Era, number> = { 1: 8, 2: 12, 3: 16 };
  const infrastructureBonus = city.attributes.infrastructure >= 6 ? 1 : 0;
  const populationBonus = city.attributes.population >= 6 ? 1 : 0;
  return eraCapacity[state.era] + infrastructureBonus + populationBonus;
}

export function getTileUnlockEra(tileIndex: number): Era {
  const row = Math.floor(tileIndex / CITY_MAP_SIZE);
  const column = tileIndex % CITY_MAP_SIZE;
  const distanceFromHall = Math.max(Math.abs(row - 2), Math.abs(column - 2));
  if (distanceFromHall <= 1) return 1;
  return (row + column) % 2 === 0 ? 2 : 3;
}

export function getActiveConstructionCount(city: CityState): number {
  return city.tiles.filter((tile) => tile?.status === 'building').length;
}

export function getConstructionDuration(
  state: CityBuilderGameState,
  city: CityState,
  building: BuildingDefinition,
): number {
  const infrastructureReduction = Math.min(0.35, Math.max(0, city.attributes.infrastructure - 2) * 0.04);
  return BUILD_SECONDS[building.tier] * durationScale(state) * (1 - infrastructureReduction);
}

function hasResources(city: CityState, cost: AttributeCosts): boolean {
  return ATTRIBUTE_IDS.every((id) => city.reserves[id] + 0.0001 >= (cost[id] ?? 0));
}

function tierRequirementReason(city: CityState, building: BuildingDefinition, era: Era): string | null {
  const dependencies = ATTRIBUTE_BY_ID[building.color].dependencies;
  if (building.tier > era) return `${building.tier}级方案将在第${building.tier}时代开放`;
  if (building.tier === 2) {
    if (city.attributes.technology < 2.5) return '需要科技达到 2.5 以解锁高级施工';
    if (city.attributes[building.color] < 4) return `需要${ATTRIBUTE_BY_ID[building.color].label}达到 4`;
    if (city.attributes[dependencies[0]] < 3 || city.attributes[dependencies[1]] < 3) {
      return `两种依赖属性都需要达到 3`;
    }
  }
  if (building.tier === 3) {
    if (city.attributes.technology < 4) return '需要科技达到 4 以解锁地标施工';
    if (city.attributes[building.color] < 8) return `需要${ATTRIBUTE_BY_ID[building.color].label}达到 8`;
    if (city.attributes[dependencies[0]] < 6 || city.attributes[dependencies[1]] < 6) {
      return `两种依赖属性都需要达到 6`;
    }
    const developedColors = ATTRIBUTE_IDS.filter((id) => city.attributes[id] >= 4).length;
    if (developedColors < 6) return '需要至少 6 种属性达到 4';
  }
  return null;
}

export function canQueueBuilding(
  state: CityBuilderGameState,
  cityId: string,
  buildingId: string,
  tileIndex: number,
): BuildCheck {
  const city = findCity(state, cityId);
  const building = BUILDING_BY_ID[buildingId];
  const cost = building ? getBuildingCost(building) : {};
  if (state.status !== 'running') return { ok: false, reason: '本局已经结束', cost, durationSeconds: 0 };
  if (!city || !building) return { ok: false, reason: '建设方案不存在', cost, durationSeconds: 0 };
  if (tileIndex < 0 || tileIndex >= city.tiles.length || tileIndex === CITY_HALL_INDEX) {
    return { ok: false, reason: '请选择可建设地块', cost, durationSeconds: 0 };
  }
  if (getTileUnlockEra(tileIndex) > state.era) {
    return { ok: false, reason: `该地块将在第${getTileUnlockEra(tileIndex)}时代开放`, cost, durationSeconds: 0 };
  }
  const existing = city.tiles[tileIndex];
  if (building.tier === 1 && existing) {
    return { ok: false, reason: '1级建筑需要空地块', cost, durationSeconds: 0 };
  }
  if (building.tier === 1 && getOccupiedTileCount(city) >= getDevelopmentCapacity(state, city)) {
    return { ok: false, reason: '当前时代的发展容量已满；升级现有建筑，或提高基建、人口后再扩建', cost, durationSeconds: 0 };
  }
  if (building.tier > 1) {
    if (!existing) return { ok: false, reason: `请在同色 T${building.tier - 1} 建筑上升级`, cost, durationSeconds: 0 };
    const existingBuilding = BUILDING_BY_ID[existing.buildingId];
    if (existing.status !== 'complete' || !existingBuilding) {
      return { ok: false, reason: '该建筑仍在施工', cost, durationSeconds: 0 };
    }
    if (existing.color !== building.color || existingBuilding.tier !== building.tier - 1) {
      return { ok: false, reason: `只能从同色 T${building.tier - 1} 升级`, cost, durationSeconds: 0 };
    }
  }
  if (getActiveConstructionCount(city) >= getConstructionSlots(city)) {
    return { ok: false, reason: '施工槽已满；提高基建可扩充施工槽', cost, durationSeconds: 0 };
  }
  const requirement = tierRequirementReason(city, building, state.era);
  if (requirement) return { ok: false, reason: requirement, cost, durationSeconds: 0 };
  if (!hasResources(city, cost)) return { ok: false, reason: '彩色储备不足', cost, durationSeconds: 0 };
  const durationSeconds = getConstructionDuration(state, city, building);
  if (state.elapsed + durationSeconds > state.durationSeconds) {
    return { ok: false, reason: '剩余时间不足以完成施工', cost, durationSeconds };
  }
  return { ok: true, reason: '', cost, durationSeconds };
}

export function queueBuilding(
  state: CityBuilderGameState,
  cityId: string,
  buildingId: string,
  tileIndex: number,
): CityBuilderGameState {
  const check = canQueueBuilding(state, cityId, buildingId, tileIndex);
  if (!check.ok) return state;
  const next = cloneGame(state);
  const city = findCity(next, cityId);
  const building = BUILDING_BY_ID[buildingId];
  if (!city || !building) return state;

  for (const id of ATTRIBUTE_IDS) city.reserves[id] = Math.max(0, city.reserves[id] - (check.cost[id] ?? 0));
  const instance: BuildingInstance = {
    instanceId: `${city.id}-${tileIndex}-${Math.round(next.elapsed * 1000)}-${next.nextLogId}`,
    buildingId,
    color: building.color,
    startedAt: next.elapsed,
    completeAt: next.elapsed + check.durationSeconds,
    status: 'building',
  };
  city.tiles[tileIndex] = instance;
  if (city.isHuman) addLog(next, building.color, `${building.name}已进入施工队列。`);
  return next;
}

function neighborIndexes(index: number): number[] {
  const row = Math.floor(index / CITY_MAP_SIZE);
  const column = index % CITY_MAP_SIZE;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - CITY_MAP_SIZE);
  if (row < CITY_MAP_SIZE - 1) neighbors.push(index + CITY_MAP_SIZE);
  if (column > 0) neighbors.push(index - 1);
  if (column < CITY_MAP_SIZE - 1) neighbors.push(index + 1);
  return neighbors;
}

function colorsConnect(a: AttributeId, b: AttributeId): boolean {
  return ATTRIBUTE_BY_ID[a].dependencies.includes(b) || ATTRIBUTE_BY_ID[b].dependencies.includes(a);
}

function completeConstruction(state: CityBuilderGameState, city: CityState, tileIndex: number): void {
  const instance = city.tiles[tileIndex];
  if (!instance || instance.status !== 'building') return;
  const building = BUILDING_BY_ID[instance.buildingId];
  if (!building) return;
  instance.status = 'complete';
  city.attributes[building.color] = Math.min(
    15,
    city.attributes[building.color] + getCompletedBuildingGain(building),
  );

  const adjacencyBase = 0.1 * (1 + Math.max(0, city.attributes.culture - 2) * 0.035);
  for (const neighborIndex of neighborIndexes(tileIndex)) {
    const neighbor = city.tiles[neighborIndex];
    if (!neighbor || neighbor.status !== 'complete' || neighbor.color === building.color) continue;
    if (!colorsConnect(building.color, neighbor.color)) continue;
    city.attributes[building.color] = Math.min(15, city.attributes[building.color] + adjacencyBase);
    city.attributes[neighbor.color] = Math.min(15, city.attributes[neighbor.color] + adjacencyBase * 0.5);
  }
  state.metrics.buildsByColor[building.color] += 1;
  addLog(state, building.color, `${city.name}完成${building.name}，${ATTRIBUTE_BY_ID[building.color].label}网络增长。`, 'success');
}

function completeReadyConstructions(state: CityBuilderGameState): void {
  for (const city of state.cities) {
    city.tiles.forEach((tile, tileIndex) => {
      if (tile?.status === 'building' && tile.completeAt <= state.elapsed + 0.0001) {
        completeConstruction(state, city, tileIndex);
      }
    });
  }
}

export function getReserveCap(city: CityState): number {
  return clamp(10 + Math.floor(city.attributes.population / 3), 10, 15);
}

function completedProduction(city: CityState, color: AttributeId): number {
  return city.tiles.reduce((total, tile) => {
    if (!tile || tile.status !== 'complete' || tile.color !== color) return total;
    const building = BUILDING_BY_ID[tile.buildingId];
    return total + (building ? BUILD_PRODUCTION[building.tier] : 0);
  }, 0);
}

export function getProductionRate(
  state: CityBuilderGameState,
  city: CityState,
  color: AttributeId,
): number {
  const rank = calculateScores(state).find((score) => score.cityId === city.id)?.place ?? 1;
  const industryMultiplier = 1 + Math.min(0.32, Math.max(0, city.attributes.industry - 2) * 0.025);
  const pressure = Math.max(0, city.attributes.industry + city.attributes.population - city.attributes.ecology * 2 - 4);
  const ecologyMultiplier = Math.max(0.7, 1 - pressure * 0.018);
  const foodGap = city.attributes.population - city.attributes.food;
  const foodMultiplier = foodGap <= 0 ? 1.05 : Math.max(0.76, 0.94 - foodGap * 0.025);
  const catchupMultiplier = 1 + Math.max(0, rank - 1) * (0.025 + Math.max(0, city.attributes.welfare - 2) * 0.0025);
  const focusMultiplier = 1 + Math.max(0, city.attributes.food - 2) * 0.01 + Math.max(0, city.attributes.population - 2) * 0.008;
  const base = 0.008
    + (color === city.core ? 0.006 : 0)
    + (color === city.focus ? 0.012 * focusMultiplier : 0)
    + completedProduction(city, color)
    + Math.max(0, city.attributes[color] - 2) * 0.001;
  return base * industryMultiplier * ecologyMultiplier * foodMultiplier * catchupMultiplier * paceMultiplier(state);
}

function produceResources(state: CityBuilderGameState, deltaSeconds: number): void {
  for (const city of state.cities) {
    const cap = getReserveCap(city);
    for (const color of ATTRIBUTE_IDS) {
      city.reserves[color] = Math.min(cap, city.reserves[color] + getProductionRate(state, city, color) * deltaSeconds);
    }
  }
}

export function setCityFocus(
  state: CityBuilderGameState,
  cityId: string,
  color: AttributeId,
): CityBuilderGameState {
  const city = findCity(state, cityId);
  if (!city || state.status !== 'running' || city.focus === color) return state;
  const next = cloneGame(state);
  const nextCity = findCity(next, cityId);
  if (nextCity) nextCity.focus = color;
  return next;
}

export function getExchangeCost(city: CityState): number {
  return round(Math.max(1.25, 2.5 - city.attributes.economy * 0.09), 2);
}

export function exchangeColor(
  state: CityBuilderGameState,
  cityId: string,
  source: AttributeId,
  target: AttributeId,
): CityBuilderGameState {
  const city = findCity(state, cityId);
  if (!city || state.status !== 'running' || source === target || state.elapsed < city.nextExchangeAt) return state;
  const cost = getExchangeCost(city);
  if (city.reserves[source] + 0.0001 < cost || city.reserves[target] >= getReserveCap(city) - 0.01) return state;
  const next = cloneGame(state);
  const nextCity = findCity(next, cityId);
  if (!nextCity) return state;
  nextCity.reserves[source] = Math.max(0, nextCity.reserves[source] - cost);
  nextCity.reserves[target] = Math.min(getReserveCap(nextCity), nextCity.reserves[target] + 1);
  nextCity.nextExchangeAt = next.elapsed + 4 * durationScale(next);
  next.metrics.exchanges += 1;
  if (nextCity.isHuman) {
    addLog(next, 'economy', `区域交换完成：${round(cost, 1)} ${ATTRIBUTE_BY_ID[source].label} → 1 ${ATTRIBUTE_BY_ID[target].label}。`);
  }
  return next;
}

export function getProjectDefinition(state: CityBuilderGameState) {
  return state.activeProject ? PROJECTS.find((project) => project.id === state.activeProject?.definitionId) ?? null : null;
}

export function getProjectRequirements(state: CityBuilderGameState): AttributeCosts {
  const definition = getProjectDefinition(state);
  if (!definition) return {};
  const cityFactor = clamp(state.cities.length / 4, 0.65, 1.5);
  return Object.fromEntries(
    ATTRIBUTE_IDS
      .filter((color) => (definition.requirements[color] ?? 0) > 0)
      .map((color) => [color, Math.round((definition.requirements[color] ?? 0) * cityFactor * 2) / 2]),
  ) as AttributeCosts;
}

export function getProjectTotals(state: CityBuilderGameState): AttributeValues {
  const totals = createAttributeValues(0);
  if (!state.activeProject) return totals;
  for (const contribution of Object.values(state.activeProject.contributions)) {
    for (const color of ATTRIBUTE_IDS) totals[color] += contribution[color];
  }
  return totals;
}

function projectContributionAmount(values: AttributeValues): number {
  return ATTRIBUTE_IDS.reduce((sum, color) => sum + values[color], 0);
}

function projectRequirementTotal(state: CityBuilderGameState): number {
  const requirements = getProjectRequirements(state);
  return ATTRIBUTE_IDS.reduce((sum, color) => sum + (requirements[color] ?? 0), 0);
}

export function getProjectMinimumContribution(state: CityBuilderGameState): number {
  return projectRequirementTotal(state) * 0.15;
}

function qualifiedProjectContributorCount(state: CityBuilderGameState): number {
  if (!state.activeProject) return 0;
  const minimum = getProjectMinimumContribution(state);
  return Object.values(state.activeProject.contributions)
    .filter((values) => projectContributionAmount(values) + 0.0001 >= minimum).length;
}

export function isProjectComplete(state: CityBuilderGameState): boolean {
  if (!state.activeProject || qualifiedProjectContributorCount(state) < 2) return false;
  const requirements = getProjectRequirements(state);
  const totals = getProjectTotals(state);
  return ATTRIBUTE_IDS.every((color) => totals[color] + 0.0001 >= (requirements[color] ?? 0));
}

function resolveProject(state: CityBuilderGameState, completed: boolean): CityBuilderGameState {
  if (!state.activeProject) return state;
  const next = cloneGame(state);
  const project = next.activeProject;
  const definition = getProjectDefinition(next);
  if (!project || !definition) return state;
  const contributions = Object.entries(project.contributions).map(([cityId, values]) => ({
    cityId,
    amount: projectContributionAmount(values),
  }));
  const minimumContribution = getProjectMinimumContribution(next);
  const bestContribution = Math.max(0, ...contributions.map((entry) => entry.amount));

  if (completed) {
    for (const city of next.cities) {
      const amount = contributions.find((entry) => entry.cityId === city.id)?.amount ?? 0;
      const tourismMultiplier = 1 + Math.max(0, city.attributes.tourism - 2) * 0.035;
      city.attributes[definition.color] = Math.min(15, city.attributes[definition.color] + 0.1);
      if (amount + 0.0001 >= minimumContribution) {
        city.attributes[definition.color] = Math.min(
          15,
          city.attributes[definition.color] + 0.7,
        );
        city.reserves[definition.color] = Math.min(
          getReserveCap(city),
          city.reserves[definition.color] + (0.75 + (amount === bestContribution ? 0.5 : 0)) * tourismMultiplier,
        );
      } else if (amount > 0) {
        city.reserves[definition.color] = Math.min(getReserveCap(city), city.reserves[definition.color] + 0.25);
      }
    }
    next.metrics.completedProjects += 1;
    addLog(next, definition.color, `${definition.name}完成，${qualifiedProjectContributorCount(next)}座城市达到有效贡献。`, 'success');
  } else {
    next.regionalFailures[definition.color] += 1;
    for (const city of next.cities) {
      const contributed = project.contributions[city.id];
      if (contributed) {
        for (const color of ATTRIBUTE_IDS) {
          city.reserves[color] = Math.min(
            getReserveCap(city),
            city.reserves[color] + contributed[color] * PROJECT_REFUND_RATE,
          );
        }
      }
      city.reserves[definition.color] = Math.max(0, city.reserves[definition.color] - 0.5);
    }
    addLog(next, definition.color, `${definition.name}未能完成，已按原色退回 90% 投入；所有城市损失少量${ATTRIBUTE_BY_ID[definition.color].label}储备。`, 'warning');
  }
  next.metrics.resolvedProjects += 1;
  next.activeProject = null;
  next.nextProjectAt = next.elapsed + 60 * durationScale(next);
  return next;
}

export function contributeToProject(
  state: CityBuilderGameState,
  cityId: string,
  color: AttributeId,
): CityBuilderGameState {
  const city = findCity(state, cityId);
  if (
    !city
    || !state.activeProject
    || state.elapsed >= state.activeProject.endsAt
    || state.elapsed < city.nextProjectContributionAt
  ) return state;
  const requirements = getProjectRequirements(state);
  const totals = getProjectTotals(state);
  const remaining = (requirements[color] ?? 0) - totals[color];
  const amount = Math.min(1, remaining, city.reserves[color]);
  if (amount <= 0.0001) return state;
  const next = cloneGame(state);
  const nextCity = findCity(next, cityId);
  if (!nextCity || !next.activeProject) return state;
  nextCity.reserves[color] = Math.max(0, nextCity.reserves[color] - amount);
  nextCity.nextProjectContributionAt = next.elapsed + Math.max(0.35, 0.8 * durationScale(next));
  next.activeProject.contributions[cityId][color] += amount;
  next.metrics.projectContributions += 1;
  return isProjectComplete(next) ? resolveProject(next, true) : next;
}

function spawnProject(state: CityBuilderGameState): void {
  const windowSeconds = PROJECT_WINDOW_SECONDS * durationScale(state);
  if (state.elapsed + windowSeconds > state.durationSeconds + 0.0001) {
    state.nextProjectAt = Number.POSITIVE_INFINITY;
    return;
  }
  const index = (state.seed + state.metrics.resolvedProjects * 5) % PROJECTS.length;
  const definition = PROJECTS[index];
  state.activeProject = {
    definitionId: definition.id,
    startedAt: state.elapsed,
    endsAt: state.elapsed + windowSeconds,
    contributions: Object.fromEntries(state.cities.map((city) => [city.id, createAttributeValues(0)])),
  };
  addLog(state, definition.color, `区域项目“${definition.name}”开放共同投入。`);
}

export function getEventDefinition(state: CityBuilderGameState) {
  return state.activeEvent ? EVENTS.find((event) => event.id === state.activeEvent?.definitionId) ?? null : null;
}

export function getEventDefense(
  state: CityBuilderGameState,
  cityId: string,
): { defense: number; threshold: number; ready: boolean } {
  const city = findCity(state, cityId);
  const definition = getEventDefinition(state);
  if (!city || !definition || !state.activeEvent) return { defense: 0, threshold: 0, ready: false };
  const response = state.activeEvent.responses[cityId] ?? createAttributeValues(0);
  const attributeDefense = definition.responses.reduce((sum, color) => sum + city.attributes[color] * 0.55, 0);
  const activeDefense = definition.responses.reduce((sum, color) => sum + response[color] * 1.4, 0);
  const specialistDefense = city.attributes.healthcare * definition.healthcareWeight
    + city.attributes.security * definition.securityWeight;
  const threshold = 7.5 + state.era * 2.2 + Math.max(0, city.attributes.population - 2) * 0.1;
  const defense = attributeDefense + activeDefense + specialistDefense;
  return { defense, threshold, ready: defense + 0.0001 >= threshold };
}

function getEventFailureLoss(city: CityState): number {
  return Math.max(
    0.4,
    1.8 - Math.max(0, city.attributes.welfare - 2) * 0.05 - Math.max(0, city.attributes.security - 2) * 0.06,
  );
}

export function respondToEvent(
  state: CityBuilderGameState,
  cityId: string,
  color: AttributeId,
): CityBuilderGameState {
  const city = findCity(state, cityId);
  const definition = getEventDefinition(state);
  if (!city || !definition || !state.activeEvent) return state;
  if (state.elapsed < state.activeEvent.warningEndsAt || state.elapsed >= state.activeEvent.endsAt) return state;
  if (!definition.responses.includes(color) || city.reserves[color] < 1) return state;
  const next = cloneGame(state);
  const nextCity = findCity(next, cityId);
  if (!nextCity || !next.activeEvent) return state;
  nextCity.reserves[color] = Math.max(0, nextCity.reserves[color] - 1);
  next.activeEvent.responses[cityId][color] += 1;
  next.metrics.eventResponses += 1;
  return next;
}

function resolveEvent(state: CityBuilderGameState): CityBuilderGameState {
  if (!state.activeEvent) return state;
  const next = cloneGame(state);
  const definition = getEventDefinition(next);
  if (!definition) return state;
  const outcomes = Object.fromEntries(next.cities.map((city) => [city.id, getEventDefense(next, city.id)]));
  for (const city of next.cities) {
    const outcome = outcomes[city.id];
    if (outcome.ready) {
      city.attributes[definition.color] = Math.min(15, city.attributes[definition.color] + 0.25);
      city.reserves[definition.color] = Math.min(getReserveCap(city), city.reserves[definition.color] + 1);
      next.metrics.successfulEventDefenses += 1;
    } else {
      const loss = getEventFailureLoss(city);
      city.reserves[definition.color] = Math.max(0, city.reserves[definition.color] - loss);
      next.metrics.failedEventDefenses += 1;
    }
  }
  const protectedCities = next.cities.filter((city) => outcomes[city.id].ready).length;
  addLog(
    next,
    definition.color,
    `${definition.name}结束：${protectedCities}/${next.cities.length} 座城市守住了对应颜色。`,
    protectedCities === next.cities.length ? 'success' : 'warning',
  );
  next.metrics.resolvedEvents += 1;
  next.activeEvent = null;
  next.nextEventAt = next.elapsed + 50 * durationScale(next);
  return next;
}

function spawnEvent(state: CityBuilderGameState): void {
  const warningSeconds = EVENT_WARNING_SECONDS * durationScale(state);
  const responseSeconds = EVENT_RESPONSE_SECONDS * durationScale(state);
  if (state.elapsed + warningSeconds + responseSeconds > state.durationSeconds + 0.0001) {
    state.nextEventAt = Number.POSITIVE_INFINITY;
    return;
  }
  const index = (state.seed * 3 + state.metrics.resolvedEvents * 7) % EVENTS.length;
  const definition = EVENTS[index];
  const warningEndsAt = state.elapsed + warningSeconds;
  state.activeEvent = {
    definitionId: definition.id,
    startedAt: state.elapsed,
    warningEndsAt,
    endsAt: warningEndsAt + responseSeconds,
    responses: Object.fromEntries(state.cities.map((city) => [city.id, createAttributeValues(0)])),
  };
  addLog(state, definition.color, `${definition.name}预警：准备${definition.responses.map((color) => ATTRIBUTE_BY_ID[color].label).join('、')}响应。`, 'warning');
}

export function getRankingPointSchedule(cityCount: number): number[] {
  return Array.from({ length: cityCount }, (_, index) => {
    if (index === 0) return cityCount;
    return Math.max(0, cityCount - index - 1);
  });
}

function attributeRankBonuses(state: CityBuilderGameState, color: AttributeId): Record<string, number> {
  const schedule = getRankingPointSchedule(state.cities.length);
  const sorted = [...state.cities].sort((a, b) => b.attributes[color] - a.attributes[color]);
  const bonuses: Record<string, number> = {};
  let index = 0;
  while (index < sorted.length) {
    let end = index + 1;
    while (end < sorted.length && Math.abs(sorted[end].attributes[color] - sorted[index].attributes[color]) < 0.001) end += 1;
    const average = schedule.slice(index, end).reduce((sum, value) => sum + value, 0) / (end - index);
    for (let cursor = index; cursor < end; cursor += 1) bonuses[sorted[cursor].id] = average;
    index = end;
  }
  return bonuses;
}

export function calculateScores(state: CityBuilderGameState): CityScore[] {
  const bonusesByColor = Object.fromEntries(
    ATTRIBUTE_IDS.map((color) => [color, attributeRankBonuses(state, color)]),
  ) as Record<AttributeId, Record<string, number>>;
  const scores = state.cities.map((city) => {
    const attributeScores = createAttributeValues(0);
    const rankBonuses = createAttributeValues(0);
    for (const color of ATTRIBUTE_IDS) {
      const rankBonus = bonusesByColor[color][city.id] ?? 0;
      rankBonuses[color] = rankBonus;
      attributeScores[color] = (city.attributes[color] + rankBonus) * (city.core === color ? 2 : 1);
    }
    return {
      cityId: city.id,
      total: ATTRIBUTE_IDS.reduce((sum, color) => sum + attributeScores[color], 0),
      place: 1,
      attributeScores,
      rankBonuses,
    };
  });
  const ordered = [...scores].sort((a, b) => b.total - a.total);
  ordered.forEach((score, index) => {
    const previous = ordered[index - 1];
    score.place = previous && Math.abs(previous.total - score.total) < 0.001 ? previous.place : index + 1;
  });
  return scores;
}

export function calculateFinalScores(state: CityBuilderGameState): CityScore[] {
  const scores = calculateScores(state);
  const cityById = new Map(state.cities.map((city) => [city.id, city]));
  const ordered = [...scores].sort((a, b) => {
    const totalDifference = b.total - a.total;
    if (Math.abs(totalDifference) > 0.001) return totalDifference;
    const cityA = cityById.get(a.cityId)!;
    const cityB = cityById.get(b.cityId)!;
    const attributeDifference = totalAttributes(cityB) - totalAttributes(cityA);
    if (Math.abs(attributeDifference) > 0.001) return attributeDifference;
    return developedColorCount(cityB) - developedColorCount(cityA);
  });
  ordered.forEach((score, index) => {
    const previous = ordered[index - 1];
    const city = cityById.get(score.cityId)!;
    const previousCity = previous ? cityById.get(previous.cityId)! : null;
    const isCompleteTie = previous && previousCity
      && Math.abs(previous.total - score.total) < 0.001
      && Math.abs(totalAttributes(previousCity) - totalAttributes(city)) < 0.001
      && developedColorCount(previousCity) === developedColorCount(city);
    score.place = isCompleteTie ? previous.place : index + 1;
  });
  return scores;
}

function scoreForCity(state: CityBuilderGameState, cityId: string): CityScore | null {
  return calculateScores(state).find((score) => score.cityId === cityId) ?? null;
}

function candidateTileIndexes(state: CityBuilderGameState, city: CityState, building: BuildingDefinition): number[] {
  if (building.tier > 1) {
    return city.tiles
      .map((tile, index) => {
        if (!tile || tile.status !== 'complete' || tile.color !== building.color) return -1;
        const existing = BUILDING_BY_ID[tile.buildingId];
        return existing?.tier === building.tier - 1 && getTileUnlockEra(index) <= state.era ? index : -1;
      })
      .filter((index) => index >= 0);
  }
  return city.tiles
    .map((tile, index) => (!tile && index !== CITY_HALL_INDEX && getTileUnlockEra(index) <= state.era ? index : -1))
    .filter((index) => index >= 0);
}

function tileUtility(city: CityState, building: BuildingDefinition, tileIndex: number): number {
  const row = Math.floor(tileIndex / CITY_MAP_SIZE);
  const column = tileIndex % CITY_MAP_SIZE;
  const centrality = 4 - (Math.abs(row - 2) + Math.abs(column - 2));
  const adjacency = neighborIndexes(tileIndex).reduce((score, neighborIndex) => {
    const neighbor = city.tiles[neighborIndex];
    if (!neighbor || neighbor.status !== 'complete') return score;
    if (neighbor.color === building.color) return score + 0.25;
    return score + (colorsConnect(building.color, neighbor.color) ? 2 : 0.1);
  }, 0);
  return adjacency + centrality * 0.08;
}

function bestTileFor(state: CityBuilderGameState, city: CityState, building: BuildingDefinition): number | null {
  const candidates = candidateTileIndexes(state, city, building);
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => tileUtility(city, building, b) - tileUtility(city, building, a))[0];
}

function buildingUtility(
  state: CityBuilderGameState,
  city: CityState,
  building: BuildingDefinition,
  style: AiStyle,
  tileIndex: number,
): number {
  const current = city.attributes[building.color];
  const completedGain = getCompletedBuildingGain(building);
  const remainingShare = Math.max(0, (state.durationSeconds - state.elapsed) / state.durationSeconds);
  const previousTierProduction = building.tier === 1 ? 0 : BUILD_PRODUCTION[(building.tier - 1) as BuildingTier];
  const productionGain = BUILD_PRODUCTION[building.tier] - previousTierProduction;
  let utility = 5 / (1 + current * 0.35)
    + building.tier * 1.8
    + tileUtility(city, building, tileIndex)
    + productionGain * BASELINE_DURATION_SECONDS * remainingShare * 0.08;
  if (building.color === city.core) utility += style === 'specialist' ? 4.2 : 2.2;
  if (ATTRIBUTE_BY_ID[city.core].dependencies.includes(building.color)) {
    utility += style === 'specialist' ? 3.1 : 2.2;
  }
  if (building.color === 'technology' && city.attributes.technology < 4) {
    utility += Math.min(2.4, (4 - city.attributes.technology) * 0.8);
  }
  if (building.color === 'infrastructure' && getConstructionSlots(city) < 4) utility += 1.2;
  if (building.color === 'industry') {
    utility += remainingShare * (1.6 + getOccupiedTileCount(city) * 0.08);
  }
  if (building.color === 'population') {
    const projectedCap = clamp(10 + Math.floor((city.attributes.population + completedGain) / 3), 10, 15);
    utility += Math.max(0, projectedCap - getReserveCap(city)) * 2.2;
  }
  if (building.color === 'economy') utility += Math.max(0, getExchangeCost(city) - 1.25) * 0.8;
  if (building.color === 'ecology') {
    const pressure = Math.max(0, city.attributes.industry + city.attributes.population - city.attributes.ecology * 2 - 4);
    utility += Math.min(2.4, pressure * 0.25);
  }
  if (building.color === 'food') utility += Math.min(2, Math.max(0, city.attributes.population - city.attributes.food) * 0.35);
  if (building.color === 'tourism' && state.activeProject) utility += 0.8;
  if (building.color === 'culture' && getOccupiedTileCount(city) >= 5) utility += 0.75;
  if (building.color === 'welfare') {
    const place = scoreForCity(state, city.id)?.place ?? 1;
    utility += Math.max(0, place - 1) * 0.35;
  }
  if (style === 'balanced') utility += Math.max(0, 5 - current) * 0.65;
  if (style === 'cooperator' && getProjectDefinition(state)?.color === building.color) utility += 2;
  if (style === 'resilient' && ['welfare', 'ecology', 'healthcare', 'security'].includes(building.color)) utility += 1.8;
  const event = getEventDefinition(state);
  if (event?.responses.includes(building.color)) utility += 1.4;
  if (event && building.color === 'healthcare') utility += event.healthcareWeight * 2;
  if (event && building.color === 'security') utility += event.securityWeight * 2;
  return utility;
}

function scheduleNextAi(state: CityBuilderGameState, cityId: string): CityBuilderGameState {
  const next = cloneGame(state);
  const city = findCity(next, cityId);
  if (!city) return state;
  const interval = Math.max(0.45, (1.05 + nextRandom(next) * 0.5) * durationScale(next));
  city.nextAiAt = next.elapsed + interval;
  return next;
}

function chooseProjectColor(state: CityBuilderGameState, city: CityState): AttributeId | null {
  if (!state.activeProject) return null;
  const requirements = getProjectRequirements(state);
  const totals = getProjectTotals(state);
  return ATTRIBUTE_IDS
    .filter((color) => (requirements[color] ?? 0) > totals[color] + 0.001 && city.reserves[color] > 1.5)
    .sort((a, b) => city.reserves[b] - city.reserves[a])[0] ?? null;
}

function chooseExchangeSource(city: CityState, target: AttributeId): AttributeId | null {
  const cost = getExchangeCost(city);
  return ATTRIBUTE_IDS
    .filter((color) => color !== target && city.reserves[color] >= cost + 1)
    .sort((a, b) => city.reserves[b] - city.reserves[a])[0] ?? null;
}

export function runAutomatedCityStep(
  state: CityBuilderGameState,
  cityId: string,
  styleOverride?: AiStyle,
): CityBuilderGameState {
  const city = findCity(state, cityId);
  if (!city || state.status !== 'running') return state;
  const style = styleOverride ?? city.aiStyle ?? 'balanced';
  let next = cloneGame(state);
  let workingCity = findCity(next, cityId);
  if (!workingCity) return state;

  const responseCity = workingCity;
  const event = getEventDefinition(next);
  const eventDefense = getEventDefense(next, cityId);
  const neededResponseUnits = Math.ceil(Math.max(0, eventDefense.threshold - eventDefense.defense) / 1.4);
  const availableResponseUnits = event
    ? event.responses.reduce((sum, color) => sum + Math.floor(responseCity.reserves[color]), 0)
    : 0;
  const responseValue = event
    ? getEventFailureLoss(responseCity) + 1 + (event.color === responseCity.core ? 4 : 2)
    : 0;
  const responseBudget = Math.ceil(responseValue * (style === 'resilient' ? 1.15 : 1));
  if (
    event
    && next.activeEvent
    && next.elapsed >= next.activeEvent.warningEndsAt
    && !eventDefense.ready
    && neededResponseUnits > 0
    && availableResponseUnits >= neededResponseUnits
    && neededResponseUnits <= responseBudget
  ) {
    const responseColor = [...event.responses]
      .filter((color) => responseCity.reserves[color] >= 1)
      .sort((a, b) => responseCity.reserves[b] - responseCity.reserves[a])[0];
    if (responseColor) next = respondToEvent(next, cityId, responseColor);
    workingCity = findCity(next, cityId);
    if (!workingCity) return scheduleNextAi(next, cityId);
  }

  const project = getProjectDefinition(next);
  const ownProjectContribution = next.activeProject
    ? ATTRIBUTE_IDS.reduce((sum, color) => sum + next.activeProject!.contributions[cityId][color], 0)
    : 0;
  const minimumProjectContribution = getProjectMinimumContribution(next);
  const projectSupportsCore = project
    ? project.color === workingCity.core || ATTRIBUTE_BY_ID[workingCity.core].dependencies.includes(project.color)
    : false;
  const cooperationCap = workingCity.isHuman
    ? 6
    : style === 'cooperator'
      ? Math.max(5, minimumProjectContribution + 2)
      : project?.color === workingCity.core
        ? Math.max(4, minimumProjectContribution + 1)
        : projectSupportsCore
          ? Math.max(3, minimumProjectContribution)
          : minimumProjectContribution;
  const currentProjectTotal = next.activeProject
    ? Object.values(next.activeProject.contributions).reduce(
      (sum, values) => sum + projectContributionAmount(values),
      0,
    )
    : 0;
  const contributionTimeRemaining = next.activeProject
    ? next.activeProject.endsAt - next.elapsed
    : 0;
  const canReachMinimumBeforeClose = ownProjectContribution + 0.0001 >= minimumProjectContribution
    || contributionTimeRemaining >= Math.max(1, minimumProjectContribution - ownProjectContribution)
      * Math.max(0.35, 0.8 * durationScale(next));
  const shouldCooperate = project
    && next.activeProject
    && cooperationCap + 0.0001 >= minimumProjectContribution
    && ownProjectContribution < cooperationCap
    && canReachMinimumBeforeClose
    && (
      ownProjectContribution > 0
      || style === 'cooperator'
      || project.color === workingCity.core
      || (projectSupportsCore && nextRandom(next) < 0.5)
      || (workingCity.isHuman && nextRandom(next) < 0.35)
      || (currentProjectTotal >= minimumProjectContribution && nextRandom(next) < 0.18)
    );
  if (shouldCooperate && next.activeProject) {
    const projectColor = chooseProjectColor(next, workingCity);
    if (projectColor) next = contributeToProject(next, cityId, projectColor);
  }

  const cityAfterResponses = findCity(next, cityId);
  if (!cityAfterResponses) return scheduleNextAi(next, cityId);
  const buildOptions = BUILDINGS.flatMap((building) => {
    const tileIndex = bestTileFor(next, cityAfterResponses, building);
    if (tileIndex === null) return [];
    const check = canQueueBuilding(next, cityId, building.id, tileIndex);
    return check.ok ? [{ building, tileIndex, utility: buildingUtility(next, cityAfterResponses, building, style, tileIndex) }] : [];
  }).sort((a, b) => b.utility - a.utility);
  if (buildOptions.length > 0) {
    const best = buildOptions[0];
    next = queueBuilding(next, cityId, best.building.id, best.tileIndex);
    return scheduleNextAi(next, cityId);
  }

  const targetBuilding = BUILDINGS
    .filter((building) => building.tier <= next.era)
    .sort((a, b) => buildingUtility(next, cityAfterResponses, b, style, CITY_HALL_INDEX - 1)
      - buildingUtility(next, cityAfterResponses, a, style, CITY_HALL_INDEX - 1))[0];
  if (targetBuilding) {
    const targetCost = getBuildingCost(targetBuilding);
    const missingColor = ATTRIBUTE_IDS
      .filter((color) => (targetCost[color] ?? 0) > cityAfterResponses.reserves[color] + 0.001)
      .sort((a, b) => ((targetCost[b] ?? 0) - cityAfterResponses.reserves[b]) - ((targetCost[a] ?? 0) - cityAfterResponses.reserves[a]))[0];
    if (missingColor) {
      const source = chooseExchangeSource(cityAfterResponses, missingColor);
      if (source && next.elapsed >= cityAfterResponses.nextExchangeAt) {
        next = exchangeColor(next, cityId, source, missingColor);
      } else {
        next = setCityFocus(next, cityId, missingColor);
      }
    } else {
      const dependencies = ATTRIBUTE_BY_ID[targetBuilding.color].dependencies;
      const weakestDependency = [...dependencies].sort((a, b) => cityAfterResponses.attributes[a] - cityAfterResponses.attributes[b])[0];
      next = setCityFocus(next, cityId, weakestDependency);
    }
  }
  return scheduleNextAi(next, cityId);
}

function currentEra(state: CityBuilderGameState): Era {
  const progress = state.elapsed / state.durationSeconds;
  if (progress >= 2 / 3) return 3;
  if (progress >= 1 / 3) return 2;
  return 1;
}

function totalAttributes(city: CityState): number {
  return ATTRIBUTE_IDS.reduce((sum, color) => sum + city.attributes[color], 0);
}

function developedColorCount(city: CityState): number {
  return ATTRIBUTE_IDS.filter((color) => city.attributes[color] >= 6).length;
}

function determineWinners(state: CityBuilderGameState): string[] {
  return calculateFinalScores(state)
    .filter((score) => score.place === 1)
    .map((score) => score.cityId);
}

function refundUnsettledProject(state: CityBuilderGameState): void {
  const project = state.activeProject;
  if (!project) return;
  const definition = getProjectDefinition(state);
  let refunded = 0;
  for (const city of state.cities) {
    const contribution = project.contributions[city.id];
    if (!contribution) continue;
    for (const color of ATTRIBUTE_IDS) {
      refunded += contribution[color];
      city.reserves[color] = Math.min(getReserveCap(city), city.reserves[color] + contribution[color]);
    }
  }
  if (refunded > 0.0001) {
    addLog(state, definition?.color ?? 'welfare', `${definition?.name ?? '区域项目'}因终局关闭，投入已按原色全额退回。`, 'info');
  }
  state.activeProject = null;
  state.nextProjectAt = Number.POSITIVE_INFINITY;
}

function refundUnsettledEvent(state: CityBuilderGameState): void {
  const event = state.activeEvent;
  if (!event) return;
  const definition = getEventDefinition(state);
  let refunded = 0;
  for (const city of state.cities) {
    const response = event.responses[city.id];
    if (!response) continue;
    for (const color of ATTRIBUTE_IDS) {
      refunded += response[color];
      city.reserves[color] = Math.min(getReserveCap(city), city.reserves[color] + response[color]);
    }
  }
  if (refunded > 0.0001) {
    addLog(state, definition?.color ?? 'healthcare', `${definition?.name ?? '区域事件'}未进入完整结算，响应投入已按原色全额退回。`, 'info');
  }
  state.activeEvent = null;
  state.nextEventAt = Number.POSITIVE_INFINITY;
}

function finishGame(state: CityBuilderGameState): CityBuilderGameState {
  const next = cloneGame(state);
  next.elapsed = next.durationSeconds;
  completeReadyConstructions(next);
  refundUnsettledProject(next);
  refundUnsettledEvent(next);
  next.status = 'finished';
  next.winnerIds = determineWinners(next);
  const winners = next.winnerIds.map((cityId) => findCity(next, cityId)).filter(Boolean) as CityState[];
  addLog(
    next,
    winners[0]?.core ?? 'technology',
    winners.length > 1
      ? `${winners.map((city) => city.name).join('、')}并列城市群综合排名第一。`
      : `${winners[0]?.name ?? '城市'}获得城市群综合排名第一。`,
    'success',
  );
  return next;
}

export function tickCityBuilderGame(
  state: CityBuilderGameState,
  deltaSeconds: number,
): CityBuilderGameState {
  if (state.status !== 'running' || deltaSeconds <= 0) return state;
  let next = cloneGame(state);
  const previousElapsed = next.elapsed;
  next.elapsed = Math.min(next.durationSeconds, next.elapsed + deltaSeconds);
  const appliedDelta = next.elapsed - previousElapsed;

  const era = currentEra(next);
  if (era !== next.era) {
    next.era = era;
    addLog(next, era === 2 ? 'technology' : 'infrastructure', `进入第${era}时代：${era === 2 ? '高级建筑' : '城市地标'}已开放。`, 'success');
  }

  completeReadyConstructions(next);
  produceResources(next, appliedDelta);

  if (!next.activeProject && next.elapsed >= next.nextProjectAt) {
    if (next.elapsed + PROJECT_WINDOW_SECONDS * durationScale(next) <= next.durationSeconds + 0.0001) {
      spawnProject(next);
    } else {
      next.nextProjectAt = Number.POSITIVE_INFINITY;
    }
  }
  if (next.activeProject && next.elapsed >= next.activeProject.endsAt) next = resolveProject(next, isProjectComplete(next));

  if (!next.activeEvent && next.elapsed >= next.nextEventAt) {
    const eventWindow = (EVENT_WARNING_SECONDS + EVENT_RESPONSE_SECONDS) * durationScale(next);
    if (next.elapsed + eventWindow <= next.durationSeconds + 0.0001) {
      spawnEvent(next);
    } else {
      next.nextEventAt = Number.POSITIVE_INFINITY;
    }
  }
  if (next.activeEvent && next.elapsed >= next.activeEvent.endsAt) next = resolveEvent(next);

  for (const cityId of next.cities.filter((city) => !city.isHuman).map((city) => city.id)) {
    const aiCity = findCity(next, cityId);
    if (aiCity && next.elapsed >= aiCity.nextAiAt) next = runAutomatedCityStep(next, cityId);
  }

  return next.elapsed >= next.durationSeconds ? finishGame(next) : next;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
}

export function getScoreForCity(state: CityBuilderGameState, cityId: string): CityScore | null {
  return scoreForCity(state, cityId);
}
