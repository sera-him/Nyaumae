import { hexKey, hexNeighbor, wallKey } from './types';
import type { HexCoord, MazeState, Difficulty } from './types';

export const DIFFICULTIES: Difficulty[] = [
  { name: '非常简单', radius: 2.5, targets: 0 },
  { name: '简单',     radius: 3.5, targets: 0 },
  { name: '中等',     radius: 4.5, targets: 1 },
  { name: '普通',     radius: 5.5, targets: 1 },
  { name: '困难',     radius: 6.5, targets: 2 },
  { name: '极难',     radius: 7.5, targets: 3 },
  { name: '噩梦',     radius: 8.5, targets: 4 },
  { name: '地狱',     radius: 9.5, targets: 5 },
  { name: '炼狱',     radius: 10.5, targets: 7 },
  { name: '梦魇',     radius: 11.5, targets: 9 },
  { name: '梦魇EX',   radius: 12.5, targets: 11 },
  { name: '诸神黄昏', radius: 13.5, targets: 14 },
];

function hexCells(radius: number): HexCoord[] {
  const R = Math.floor(radius);
  const cells: HexCoord[] = [];
  for (let q = -R; q <= R; q++) {
    const r1 = Math.max(-R, -q - R);
    const r2 = Math.min(R, -q + R);
    for (let r = r1; r <= r2; r++) cells.push({ q, r });
  }
  return cells;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMaze(radius: number, targetCount: number): {
  walls: Set<string>;
  start: HexCoord;
  end: HexCoord;
  exitDir: number;
  targets: HexCoord[];
} {
  const R = Math.floor(radius);
  const cells = hexCells(R);
  const cellKeys = new Set(cells.map(c => hexKey(c.q, c.r)));
  const walls = new Set<string>();

  for (const c of cells) {
    for (let d = 0; d < 6; d++) {
      const n = hexNeighbor(c.q, c.r, d);
      if (cellKeys.has(hexKey(n.q, n.r))) walls.add(wallKey(c, n));
    }
  }

  const unvisited = new Set(cellKeys);
  const start: HexCoord = { q: 0, r: 0 };
  unvisited.delete(hexKey(start.q, start.r));
  let current = start;

  while (unvisited.size > 0) {
    const neighbors: HexCoord[] = [];
    for (let d = 0; d < 6; d++) {
      const n = hexNeighbor(current.q, current.r, d);
      if (cellKeys.has(hexKey(n.q, n.r))) neighbors.push(n);
    }
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    const nk = hexKey(next.q, next.r);
    if (unvisited.has(nk)) {
      walls.delete(wallKey(current, next));
      unvisited.delete(nk);
    }
    current = next;
  }

  // End on perimeter: pick a cell + an outward direction as the exit
  const perimeter = cells.filter(c =>
    Math.abs(c.q) === R || Math.abs(c.r) === R || Math.abs(c.q + c.r) === R
  );
  const end = shuffle(perimeter)[0];
  const outwardDirs: number[] = [];
  for (let d = 0; d < 6; d++) {
    const n = hexNeighbor(end.q, end.r, d);
    if (!cellKeys.has(hexKey(n.q, n.r))) outwardDirs.push(d);
  }
  const exitDir = outwardDirs[Math.floor(Math.random() * outwardDirs.length)];

  const candidates = cells.filter(c => {
    const key = hexKey(c.q, c.r);
    if (key === hexKey(start.q, start.r) || key === hexKey(end.q, end.r)) return false;
    return Math.abs(c.q - start.q) + Math.abs(c.r - start.r) >= 2
        && Math.abs(c.q - end.q) + Math.abs(c.r - end.r) >= 2;
  });

  const targets = shuffle(candidates).slice(0, targetCount);

  return { walls, start, end, exitDir, targets };
}

export function createMazeState(difficulty: Difficulty): MazeState {
  const { radius, targets: targetCount } = difficulty;
  const R = Math.floor(radius);
  const maze = generateMaze(R, targetCount);

  return {
    radius: R,
    cells: new Set(hexCells(R).map(c => hexKey(c.q, c.r))),
    walls: maze.walls,
    start: maze.start,
    end: maze.end,
    exitDir: maze.exitDir,
    targets: maze.targets,
    playerPos: { ...maze.start },
    playerDir: 0,
    collected: new Set(),
    steps: 0,
    surrendered: false,
    won: false,
    started: true,
  };
}

export function moveForward(state: MazeState): { moved: boolean; escaped: boolean } {
  const pk = hexKey(state.playerPos.q, state.playerPos.r);
  const ek = hexKey(state.end.q, state.end.r);

  // Check escape: at exit cell, facing exit, all targets collected
  if (pk === ek && state.playerDir === state.exitDir && state.collected.size >= state.targets.length) {
    state.won = true;
    return { moved: false, escaped: true };
  }

  const n = hexNeighbor(state.playerPos.q, state.playerPos.r, state.playerDir);
  const nk = hexKey(n.q, n.r);
  if (!state.cells.has(nk)) return { moved: false, escaped: false };
  if (state.walls.has(wallKey(state.playerPos, n))) return { moved: false, escaped: false };
  state.playerPos = n;
  state.steps++;
  for (const t of state.targets) {
    if (hexKey(t.q, t.r) === nk) state.collected.add(nk);
  }
  return { moved: true, escaped: false };
}

export function turnLeft(state: MazeState): void {
  state.playerDir = (state.playerDir + 5) % 6;
}

export function turnRight(state: MazeState): void {
  state.playerDir = (state.playerDir + 1) % 6;
}

export function getFeedback(state: MazeState): [boolean, boolean, boolean] {
  const n = hexNeighbor(state.playerPos.q, state.playerPos.r, state.playerDir);
  const nk = hexKey(n.q, n.r);
  const canMove = state.cells.has(nk) && !state.walls.has(wallKey(state.playerPos, n));
  const onTarget = state.targets.some(t => hexKey(t.q, t.r) === hexKey(state.playerPos.q, state.playerPos.r));
  const pk = hexKey(state.playerPos.q, state.playerPos.r);
  const ek = hexKey(state.end.q, state.end.r);
  const facingExit = pk === ek && state.playerDir === state.exitDir;
  return [canMove, onTarget, facingExit];
}
