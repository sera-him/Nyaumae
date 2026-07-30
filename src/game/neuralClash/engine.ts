export type Side = 'blue' | 'red';
export type Owner = Side | 'neutral' | 'dead';
export type ActionMode = 'inspect' | 'expand' | 'shock' | 'discharge' | 'reverse';
export type GamePhase = 'actions' | 'pulse-ready' | 'final-ready' | 'finished';

export interface NeuralNode { id: number; x: number; y: number; core: boolean; owner: Owner }
export interface Synapse { id: number; a: number; b: number; enhanced: boolean }
export interface NeuralMap {
  seed: number; nodes: NeuralNode[]; edges: Synapse[]; adjacency: number[][];
  edgeLookup: Map<string, Synapse>; spawnBlue: number; spawnRed: number; balance: number;
}
export interface Shock { attacker: Side; source: number; target: number }
export interface Discharge { side: Side; source: number; target: number }
export interface PulsePreview {
  blue: number; red: number; contested: boolean; willDie: boolean; outcome: Owner; shockedBy?: Side;
}
export interface GameState {
  map: NeuralMap; round: number; phase: GamePhase; active: Side | null;
  ap: Record<Side, number>; actionTaken: Record<Side, boolean>; shockUsed: Record<Side, boolean>;
  reverseAvailable: Record<Side, boolean>; reverseCenters: Partial<Record<Side, number>>;
  discharges: Discharge[]; shocks: Shock[]; roundStartOwners: Owner[];
  selected: number | null; mode: ActionMode; log: string[]; winner: Side | 'draw' | null;
}

const CORE_IDS = new Set([11, 18, 33, 36, 44, 55, 63, 66, 81, 88]);
const edgeKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;
const opposite = (side: Side): Side => side === 'blue' ? 'red' : 'blue';
const rotated = (id: number) => 99 - id;
const community = (id: number) => {
  if (id < 17) return 0;
  if (id < 33) return 1;
  if (id < 50) return 2;
  if (id < 67) return 3;
  if (id < 83) return 4;
  return 5;
};

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distance(a: NeuralNode, b: NeuralNode) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function graphDistances(start: number, adjacency: number[][]) {
  const result = Array<number>(100).fill(Infinity);
  result[start] = 0;
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (const next of adjacency[current]) {
      if (result[next] !== Infinity) continue;
      result[next] = result[current] + 1;
      queue.push(next);
    }
  }
  return result;
}

function localMetrics(id: number, nodes: NeuralNode[], edges: Synapse[], adjacency: number[][]) {
  const distances = graphDistances(id, adjacency);
  const within = new Set(nodes.filter((node) => distances[node.id] <= 3).map((node) => node.id));
  const localEdges = edges.filter((edge) => within.has(edge.a) && within.has(edge.b));
  return {
    ordinary: [...within].filter((nodeId) => !nodes[nodeId].core).length,
    enhanced: localEdges.filter((edge) => edge.enhanced).length,
    weight: localEdges.reduce((sum, edge) => sum + (edge.enhanced ? 2 : 1), 0),
    cores: [...within].filter((nodeId) => nodes[nodeId].core).length,
  };
}

const relativeDifference = (a: number, b: number) => Math.abs(a - b) / Math.max(1, (a + b) / 2);

function chooseSpawns(nodes: NeuralNode[], edges: Synapse[], adjacency: number[][]) {
  const enhancedDegree = nodes.map(() => 0);
  const degree = adjacency.map((neighbors) => neighbors.length);
  const adjacentToCore = nodes.map((node) => adjacency[node.id].some((neighbor) => nodes[neighbor].core));
  const allDistances = nodes.map((node) => graphDistances(node.id, adjacency));
  const coreDistances = nodes.map((node) => Math.min(...[...CORE_IDS].map((core) => allDistances[node.id][core])));
  const metrics = nodes.map((node) => localMetrics(node.id, nodes, edges, adjacency));
  edges.forEach((edge) => {
    if (edge.enhanced) { enhancedDegree[edge.a] += 1; enhancedDegree[edge.b] += 1; }
  });
  let best: { a: number; b: number; score: number } | null = null;
  for (let aId = 0; aId < nodes.length; aId += 1) {
    for (let bId = aId + 1; bId < nodes.length; bId += 1) {
      if (nodes[aId].core || nodes[bId].core || adjacentToCore[aId] || adjacentToCore[bId]) continue;
      if (allDistances[aId][bId] !== 6) continue;
      if (enhancedDegree[aId] !== enhancedDegree[bId] || Math.abs(degree[aId] - degree[bId]) > 1) continue;
      if (coreDistances[aId] !== coreDistances[bId]) continue;
      const a = metrics[aId], b = metrics[bId];
      const differences = [
        relativeDifference(a.ordinary, b.ordinary), relativeDifference(a.enhanced, b.enhanced),
        relativeDifference(a.weight, b.weight), relativeDifference(a.cores, b.cores),
      ];
      const score = differences.reduce((sum, value) => sum + value, 0) / differences.length;
      if (!best || score < best.score) best = { a: aId, b: bId, score };
    }
  }
  if (best) return { blue: best.a, red: best.b, balance: best.score };

  let fallback = { a: 0, b: 99, distance: -1 };
  for (const node of nodes) {
    const otherId = rotated(node.id);
    if (node.id >= otherId || node.core || nodes[otherId].core) continue;
    if (adjacentToCore[node.id] || adjacentToCore[otherId]) continue;
    const d = allDistances[node.id][otherId];
    if (d > fallback.distance) fallback = { a: node.id, b: otherId, distance: d };
  }
  return { blue: fallback.a, red: fallback.b, balance: 0 };
}

export function generateMap(seed = Math.floor(Math.random() * 900000) + 100000): NeuralMap {
  const random = mulberry32(seed);
  const nodes: NeuralNode[] = [];
  for (let id = 0; id < 50; id += 1) {
    const row = Math.floor(id / 10);
    const col = id % 10;
    const x = (col + 0.5 + (random() - 0.5) * 0.34) / 10;
    const y = (row + 0.5 + (random() - 0.5) * 0.34) / 10;
    nodes[id] = { id, x, y, core: CORE_IDS.has(id), owner: 'neutral' };
    const mirrorId = rotated(id);
    nodes[mirrorId] = { id: mirrorId, x: 1 - x, y: 1 - y, core: CORE_IDS.has(mirrorId), owner: 'neutral' };
  }

  const edges: Synapse[] = [];
  const lookup = new Map<string, Synapse>();
  const addEdge = (a: number, b: number, enhanced: boolean) => {
    if (a === b || lookup.has(edgeKey(a, b))) return false;
    const edge = { id: edges.length, a: Math.min(a, b), b: Math.max(a, b), enhanced };
    edges.push(edge); lookup.set(edgeKey(a, b), edge); return true;
  };

  // Two overlapping rings give every node four strengthened synapses.
  // The resulting subgraph is connected and remains connected after any one edge is removed.
  for (let id = 0; id < 100; id += 1) {
    addEdge(id, (id + 1) % 100, true);
    addEdge(id, (id + 4) % 100, true);
  }

  const corePairs = [...CORE_IDS].filter((id) => id < rotated(id));
  for (const core of corePairs) {
    const mirrorCore = rotated(core);
    const candidates = nodes
      .filter((node) => !node.core && community(node.id) === community(core) && !lookup.has(edgeKey(core, node.id)))
      .sort((a, b) => distance(nodes[core], a) - distance(nodes[core], b) || a.id - b.id);
    let added = 0;
    for (const candidate of candidates) {
      if (added >= 8) break;
      const mirrorCandidate = rotated(candidate.id);
      if (lookup.has(edgeKey(mirrorCore, mirrorCandidate))) continue;
      if (!addEdge(core, candidate.id, false)) continue;
      addEdge(mirrorCore, mirrorCandidate, false);
      added += 1;
    }
  }

  const candidates: { a: number; b: number; ma: number; mb: number; score: number }[] = [];
  for (let a = 0; a < 100; a += 1) {
    if (nodes[a].core) continue;
    for (let b = a + 1; b < 100; b += 1) {
      if (nodes[b].core || community(a) !== community(b) || lookup.has(edgeKey(a, b))) continue;
      const ma = rotated(a), mb = rotated(b);
      if (edgeKey(a, b) === edgeKey(ma, mb) || edgeKey(a, b) > edgeKey(ma, mb)) continue;
      candidates.push({ a, b, ma, mb, score: distance(nodes[a], nodes[b]) + random() * 0.018 });
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  for (const candidate of candidates) {
    if (edges.length >= 666) break;
    if (lookup.has(edgeKey(candidate.a, candidate.b)) || lookup.has(edgeKey(candidate.ma, candidate.mb))) continue;
    addEdge(candidate.a, candidate.b, false);
    addEdge(candidate.ma, candidate.mb, false);
  }

  const adjacency = Array.from({ length: 100 }, () => [] as number[]);
  edges.forEach((edge) => { adjacency[edge.a].push(edge.b); adjacency[edge.b].push(edge.a); });
  const spawns = chooseSpawns(nodes, edges, adjacency);
  nodes[spawns.blue].owner = 'blue';
  nodes[spawns.red].owner = 'red';
  return { seed, nodes, edges, adjacency, edgeLookup: lookup, spawnBlue: spawns.blue, spawnRed: spawns.red, balance: spawns.balance };
}

export function createGame(seed?: number): GameState {
  const map = generateMap(seed);
  return {
    map, round: 1, phase: 'actions', active: 'blue', ap: { blue: 3, red: 3 },
    actionTaken: { blue: false, red: false }, shockUsed: { blue: false, red: false },
    reverseAvailable: { blue: true, red: true }, reverseCenters: {}, discharges: [], shocks: [],
    roundStartOwners: map.nodes.map((node) => node.owner), selected: map.spawnBlue, mode: 'inspect',
    log: [`地图 #${map.seed} 建立：蓝方先行动。`], winner: null,
  };
}

const isEnhanced = (map: NeuralMap, a: number, b: number) => map.edgeLookup.get(edgeKey(a, b))?.enhanced === true;

export function legalTargets(state: GameState, source: number, mode = state.mode): number[] {
  const side = state.active;
  if (!side || state.phase !== 'actions') return [];
  if (state.map.nodes[source].owner !== side) return [];
  if (mode !== 'inspect' && state.roundStartOwners[source] !== side) return [];
  if (mode === 'reverse') return state.reverseAvailable[side] && !state.actionTaken[side] ? [source] : [];
  if (mode === 'expand') return state.map.adjacency[source].filter((target) => isEnhanced(state.map, source, target) && state.map.nodes[target].owner === 'neutral');
  if (mode === 'shock') {
    if (state.ap[side] < 2 || state.shockUsed[side]) return [];
    return state.map.adjacency[source].filter((target) => isEnhanced(state.map, source, target) && state.map.nodes[target].owner === opposite(side));
  }
  if (mode === 'discharge') return state.map.adjacency[source].filter((target) =>
    state.map.nodes[target].owner !== 'dead' && !state.discharges.some((item) => item.side === side && item.target === target));
  return state.map.adjacency[source];
}

const appendLog = (state: GameState, message: string) => [message, ...state.log].slice(0, 8);

export function applyAction(state: GameState, source: number, target?: number): GameState {
  const side = state.active;
  if (!side || state.phase !== 'actions') return state;
  const label = side === 'blue' ? '蓝方' : '红方';
  const validTargets = legalTargets(state, source);
  if (state.mode === 'reverse') {
    if (!validTargets.includes(source)) return state;
    return {
      ...state, reverseAvailable: { ...state.reverseAvailable, [side]: false },
      reverseCenters: { ...state.reverseCenters, [side]: source }, selected: source, mode: 'inspect',
      log: appendLog(state, `${label}以 ${source + 1} 号节点释放反向脉冲。`),
    };
  }
  if (target === undefined || !validTargets.includes(target)) return state;
  if (state.mode === 'expand' && state.ap[side] >= 1) {
    const map = { ...state.map, nodes: state.map.nodes.map((node) => node.id === target ? { ...node, owner: side } : node) };
    const won = map.nodes.filter((node) => node.core && node.owner === side).length === 10;
    return {
      ...state, map, active: won ? null : state.active, phase: won ? 'finished' : state.phase, winner: won ? side : state.winner,
      ap: { ...state.ap, [side]: state.ap[side] - 1 },
      actionTaken: { ...state.actionTaken, [side]: true }, selected: target, mode: 'inspect',
      log: appendLog(state, won ? `${label}控制全部神经核，立即获胜。` : `${label}沿强化突触扩张至 ${target + 1} 号节点。`),
    };
  }
  if (state.mode === 'shock' && state.ap[side] >= 2) {
    return {
      ...state, ap: { ...state.ap, [side]: state.ap[side] - 2 },
      actionTaken: { ...state.actionTaken, [side]: true }, shockUsed: { ...state.shockUsed, [side]: true },
      shocks: [...state.shocks, { attacker: side, source, target }], selected: target, mode: 'inspect',
      log: appendLog(state, `${label}冲击 ${target + 1} 号${state.map.nodes[target].core ? '神经核' : '节点'}。`),
    };
  }
  if (state.mode === 'discharge' && state.ap[side] >= 1) {
    return {
      ...state, ap: { ...state.ap, [side]: state.ap[side] - 1 },
      actionTaken: { ...state.actionTaken, [side]: true },
      discharges: [...state.discharges, { side, source, target }], selected: target, mode: 'inspect',
      log: appendLog(state, `${label}对 ${target + 1} 号节点定向放电。`),
    };
  }
  return state;
}

const firstPlayer = (round: number): Side => round % 2 === 1 ? 'blue' : 'red';
const secondPlayer = (round: number): Side => opposite(firstPlayer(round));

export function endAction(state: GameState): GameState {
  const side = state.active;
  if (!side || state.phase !== 'actions') return state;
  if (side === secondPlayer(state.round)) {
    return {
      ...state, active: null, phase: 'pulse-ready', selected: null, mode: 'inspect',
      log: appendLog(state, `第 ${state.round} 轮行动结束，神经网络等待脉冲。`),
    };
  }
  const nextSide = opposite(side);
  return {
    ...state, active: nextSide,
    selected: state.map.nodes.find((node) => node.owner === nextSide)?.id ?? null, mode: 'inspect',
    log: appendLog(state, `${nextSide === 'blue' ? '蓝方' : '红方'}开始行动。`),
  };
}

function inReverseRange(state: GameState, side: Side, target: number) {
  const center = state.reverseCenters[side];
  return center !== undefined && (center === target || state.map.adjacency[center].includes(target));
}

function normalVotes(state: GameState, target: number, side: Side) {
  let votes = 0;
  for (const source of state.map.adjacency[target]) {
    const node = state.map.nodes[source];
    if (node.owner !== side) continue;
    votes += isEnhanced(state.map, source, target) ? 2 : 1;
    if (node.core) votes += 1;
  }
  return votes;
}

export function previewNode(state: GameState, target: number, includeTemporary = true): PulsePreview {
  const node = state.map.nodes[target];
  let blue = normalVotes(state, target, 'blue');
  let red = normalVotes(state, target, 'red');
  const shock = includeTemporary ? state.shocks.find((item) => item.target === target) : undefined;
  if (includeTemporary) {
    state.discharges.forEach((item) => { if (item.target === target) item.side === 'blue' ? blue += 1 : red += 1; });
    if (inReverseRange(state, 'blue', target)) blue += 2;
    if (inReverseRange(state, 'red', target)) red += 2;
    if (shock) {
      shock.attacker === 'blue' ? blue += 2 : red += 2;
      const defender = opposite(shock.attacker);
      const stability = node.core ? 2 : 1;
      defender === 'blue' ? blue += stability : red += stability;
    }
  }
  let outcome = node.owner;
  let willDie = false;
  if (node.owner === 'neutral') {
    if (blue >= 3 || red >= 3) {
      if (blue === red) { outcome = 'dead'; willDie = true; }
      else outcome = blue > red ? 'blue' : 'red';
    }
  } else if (shock) {
    const attackVotes = shock.attacker === 'blue' ? blue : red;
    const defenseVotes = shock.attacker === 'blue' ? red : blue;
    if (node.core ? attackVotes >= defenseVotes + 2 : attackVotes > defenseVotes) outcome = shock.attacker;
  }
  return { blue, red, contested: (blue >= 3 && red >= 3) || Boolean(shock), willDie, outcome, shockedBy: shock?.attacker };
}

const countCores = (state: GameState, side: Side) => state.map.nodes.filter((node) => node.core && node.owner === side).length;

export function resolvePulse(state: GameState): GameState {
  if (state.phase !== 'pulse-ready') return state;
  const outcomes = state.map.nodes.map((node) => previewNode(state, node.id).outcome);
  const nodes = state.map.nodes.map((node) => ({ ...node, owner: outcomes[node.id] }));
  const afterPulse = { ...state, map: { ...state.map, nodes } };
  const blueCores = countCores(afterPulse, 'blue'), redCores = countCores(afterPulse, 'red');
  if (blueCores === 10 || redCores === 10) {
    const winner: Side = blueCores === 10 ? 'blue' : 'red';
    return { ...afterPulse, phase: 'finished', winner, log: appendLog(state, `${winner === 'blue' ? '蓝方' : '红方'}控制全部神经核，立即获胜。`) };
  }
  if (state.round === 24) {
    return {
      ...afterPulse, phase: 'final-ready', shocks: [], discharges: [], reverseCenters: {},
      log: appendLog(state, '第 24 轮脉冲完成，终局脉冲已就绪。'),
    };
  }
  const nextRound = state.round + 1, active = firstPlayer(nextRound);
  return {
    ...afterPulse, round: nextRound, phase: 'actions', active, ap: { blue: 3, red: 3 },
    actionTaken: { blue: false, red: false }, shockUsed: { blue: false, red: false },
    reverseCenters: {}, discharges: [], shocks: [], roundStartOwners: nodes.map((node) => node.owner),
    selected: nodes.find((node) => node.owner === active)?.id ?? null, mode: 'inspect',
    log: appendLog(state, `第 ${nextRound} 轮开始，${active === 'blue' ? '蓝方' : '红方'}先行动。`),
  };
}

export function resolveFinalPulse(state: GameState): GameState {
  if (state.phase !== 'final-ready') return state;
  const cleanState = { ...state, shocks: [], discharges: [], reverseCenters: {} };
  const outcomes = state.map.nodes.map((node) => previewNode(cleanState, node.id, false).outcome);
  const nodes = state.map.nodes.map((node) => ({ ...node, owner: outcomes[node.id] }));
  const finished = { ...state, map: { ...state.map, nodes } };
  const blue = scoreGame(finished, 'blue'), red = scoreGame(finished, 'red');
  let winner: Side | 'draw' = 'draw';
  if (blue.total !== red.total) winner = blue.total > red.total ? 'blue' : 'red';
  else if (blue.cores !== red.cores) winner = blue.cores > red.cores ? 'blue' : 'red';
  else if (blue.internalEnhanced !== red.internalEnhanced) winner = blue.internalEnhanced > red.internalEnhanced ? 'blue' : 'red';
  return {
    ...finished, phase: 'finished', winner, active: null,
    log: appendLog(state, winner === 'draw' ? '终局：双方完全平分秋色。' : `终局：${winner === 'blue' ? '蓝方' : '红方'}获胜。`),
  };
}

export function scoreGame(state: GameState, side: Side) {
  const owned = new Set(state.map.nodes.filter((node) => node.owner === side).map((node) => node.id));
  const ordinary = state.map.nodes.filter((node) => !node.core && node.owner === side).length;
  const cores = state.map.nodes.filter((node) => node.core && node.owner === side).length;
  const stable = state.map.nodes.filter((node) => node.core && node.owner === side &&
    state.map.adjacency[node.id].filter((neighbor) => state.map.nodes[neighbor].owner === side).length >= 7).length;
  const internalEnhanced = state.map.edges.filter((edge) => edge.enhanced && owned.has(edge.a) && owned.has(edge.b)).length;
  return { ordinary, cores, stable, internalEnhanced, total: ordinary + cores * 10 + stable * 3 };
}

export function nodeDegreeSummary(map: NeuralMap, id: number) {
  const edges = map.adjacency[id].map((neighbor) => map.edgeLookup.get(edgeKey(id, neighbor))!);
  return { enhanced: edges.filter((edge) => edge.enhanced).length, ordinary: edges.filter((edge) => !edge.enhanced).length, total: edges.length };
}
