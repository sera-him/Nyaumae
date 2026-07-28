import puzzleBankJson from './puzzles.generated.json';

export type CellMark = 0 | 1 | 2;

export interface PuzzleState {
  n: number;
  k: number;
  regions: number[][];
  solution: boolean[][];
  marks: CellMark[][];
  puzzleId: string;
  surrendered: boolean;
  won: boolean;
}

export interface Difficulty {
  id: string;
  name: string;
  n: number;
  k: number;
}

interface EncodedCertificate {
  status: string;
  regionsConnected: boolean;
  solutionValid: boolean;
}

interface EncodedPuzzle {
  id: string;
  difficultyId: string;
  n: number;
  k: number;
  regions: string[];
  solution: string[];
  certificate: EncodedCertificate;
}

interface PuzzleBank {
  schemaVersion: number;
  puzzles: EncodedPuzzle[];
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'very-easy', name: '非常简单', n: 4, k: 1 },
  { id: 'easy', name: '简单', n: 6, k: 1 },
  { id: 'medium', name: '中等', n: 8, k: 1 },
  { id: 'normal', name: '普通', n: 10, k: 1 },
  { id: 'hard', name: '困难', n: 10, k: 2 },
  { id: 'very-hard', name: '极难', n: 12, k: 2 },
  { id: 'nightmare', name: '噩梦', n: 14, k: 2 },
  { id: 'hell', name: '地狱', n: 14, k: 3 },
  { id: 'purgatory', name: '炼狱', n: 18, k: 3 },
  { id: 'dream', name: '梦魇', n: 20, k: 4 },
  { id: 'dream-ex', name: '梦魇 EX', n: 24, k: 5 },
  { id: 'ragnarok', name: '诸神黄昏', n: 32, k: 6 },
];

const puzzleBank = puzzleBankJson as PuzzleBank;
const puzzlesByDifficulty = new Map(
  puzzleBank.puzzles.map((puzzle) => [puzzle.difficultyId, puzzle]),
);

function decodeRows(rows: string[], n: number): number[][] {
  if (rows.length !== n || rows.some((row) => row.length !== n)) {
    throw new Error(`题库中的 ${n}×${n} 网格尺寸不正确`);
  }
  return rows.map((row) => [...row].map((value) => Number.parseInt(value, 36)));
}

function transformCoord(n: number, row: number, col: number, symmetry: number): [number, number] {
  switch (symmetry) {
    case 0: return [row, col];
    case 1: return [col, n - 1 - row];
    case 2: return [n - 1 - row, n - 1 - col];
    case 3: return [n - 1 - col, row];
    case 4: return [row, n - 1 - col];
    case 5: return [n - 1 - row, col];
    case 6: return [col, row];
    default: return [n - 1 - col, n - 1 - row];
  }
}

function transformGrid<T>(grid: T[][], symmetry: number): T[][] {
  const n = grid.length;
  const transformed = Array.from({ length: n }, () => Array<T>(n));
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const [nextRow, nextCol] = transformCoord(n, row, col, symmetry);
      transformed[nextRow][nextCol] = grid[row][col];
    }
  }
  return transformed;
}

function shuffledRegionLabels(n: number): number[] {
  const labels = Array.from({ length: n }, (_, index) => index);
  for (let index = n - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [labels[index], labels[other]] = [labels[other], labels[index]];
  }
  return labels;
}

function regionsAreConnected(regions: number[][]): boolean {
  const n = regions.length;
  const sizes = Array<number>(n).fill(0);
  const first = Array<number>(n).fill(-1);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const region = regions[row][col];
      if (!Number.isInteger(region) || region < 0 || region >= n) return false;
      sizes[region]++;
      if (first[region] < 0) first[region] = row * n + col;
    }
  }

  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
  for (let region = 0; region < n; region++) {
    if (first[region] < 0) return false;
    const seen = new Uint8Array(n * n);
    const queue = [first[region]];
    seen[first[region]] = 1;
    let reached = 0;
    for (let head = 0; head < queue.length; head++) {
      const value = queue[head];
      const row = Math.floor(value / n);
      const col = value % n;
      reached++;
      for (const [dr, dc] of directions) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (nextRow < 0 || nextRow >= n || nextCol < 0 || nextCol >= n) continue;
        const next = nextRow * n + nextCol;
        if (!seen[next] && regions[nextRow][nextCol] === region) {
          seen[next] = 1;
          queue.push(next);
        }
      }
    }
    if (reached !== sizes[region]) return false;
  }
  return true;
}

function solutionIsValid(
  n: number,
  k: number,
  regions: number[][],
  solution: boolean[][],
): boolean {
  const regionCounts = Array<number>(n).fill(0);
  for (let index = 0; index < n; index++) {
    let rowCount = 0;
    let colCount = 0;
    for (let other = 0; other < n; other++) {
      if (solution[index][other]) rowCount++;
      if (solution[other][index]) colCount++;
    }
    if (rowCount !== k || colCount !== k) return false;
  }

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!solution[row][col]) continue;
      regionCounts[regions[row][col]]++;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (
            nextRow >= 0
            && nextRow < n
            && nextCol >= 0
            && nextCol < n
            && solution[nextRow][nextCol]
          ) return false;
        }
      }
    }
  }
  return regionCounts.every((count) => count === k);
}

function hasNeighboringHole(solution: boolean[][], row: number, col: number): boolean {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (solution[row + dr]?.[col + dc]) return true;
    }
  }
  return false;
}

/**
 * Break up the solver's visually repetitive diagonal lattices with legal
 * 2×2 trades. Each accepted trade preserves every row and column count; the
 * region delta and king-neighbor checks preserve the remaining game rules.
 */
function randomizeSolutionLayout(
  solution: boolean[][],
  regions: number[][],
  attempts: number,
): boolean[][] {
  const n = solution.length;
  const mixed = solution.map((row) => [...row]);

  for (let attempt = 0; attempt < attempts; attempt++) {
    let top = Math.floor(Math.random() * n);
    let bottom = Math.floor(Math.random() * (n - 1));
    if (bottom >= top) bottom++;
    if (top > bottom) [top, bottom] = [bottom, top];

    let left = Math.floor(Math.random() * n);
    let right = Math.floor(Math.random() * (n - 1));
    if (right >= left) right++;
    if (left > right) [left, right] = [right, left];

    const diagonal = mixed[top][left] && mixed[bottom][right]
      && !mixed[top][right] && !mixed[bottom][left];
    const antiDiagonal = mixed[top][right] && mixed[bottom][left]
      && !mixed[top][left] && !mixed[bottom][right];
    if (!diagonal && !antiDiagonal) continue;

    const removed = diagonal
      ? [[top, left], [bottom, right]] as const
      : [[top, right], [bottom, left]] as const;
    const added = diagonal
      ? [[top, right], [bottom, left]] as const
      : [[top, left], [bottom, right]] as const;

    const regionDelta = new Map<number, number>();
    for (const [row, col] of removed) {
      const region = regions[row][col];
      regionDelta.set(region, (regionDelta.get(region) ?? 0) - 1);
      mixed[row][col] = false;
    }
    for (const [row, col] of added) {
      const region = regions[row][col];
      regionDelta.set(region, (regionDelta.get(region) ?? 0) + 1);
      mixed[row][col] = true;
    }

    const regionsPreserved = [...regionDelta.values()].every((delta) => delta === 0);
    const adjacencyPreserved = added.every(
      ([row, col]) => !hasNeighboringHole(mixed, row, col),
    );
    if (regionsPreserved && adjacencyPreserved) continue;

    for (const [row, col] of added) mixed[row][col] = false;
    for (const [row, col] of removed) mixed[row][col] = true;
  }

  return mixed;
}

function loadPuzzle(difficulty: Difficulty): PuzzleState {
  const encoded = puzzlesByDifficulty.get(difficulty.id);
  if (!encoded || encoded.n !== difficulty.n || encoded.k !== difficulty.k) {
    throw new Error(`缺少 ${difficulty.name} 的题目`);
  }
  if (
    encoded.certificate.status !== 'INFEASIBLE'
    || !encoded.certificate.regionsConnected
    || !encoded.certificate.solutionValid
  ) {
    throw new Error(`${difficulty.name} 的题目证书无效`);
  }

  const { n } = difficulty;
  const rawRegions = decodeRows(encoded.regions, n);
  const rawSolution = decodeRows(encoded.solution, n).map(
    (row) => row.map((value) => value === 1),
  );
  const symmetry = Math.floor(Math.random() * 8);
  const relabel = shuffledRegionLabels(n);
  const regions = transformGrid(rawRegions, symmetry).map(
    (row) => row.map((region) => relabel[region]),
  );
  const transformedSolution = transformGrid(rawSolution, symmetry);
  const solution = randomizeSolutionLayout(
    transformedSolution,
    regions,
    Math.max(800, n * n * 12),
  );

  if (!regionsAreConnected(regions) || !solutionIsValid(n, difficulty.k, regions, solution)) {
    throw new Error(`${difficulty.name} 的题目在加载时校验失败`);
  }

  return {
    n,
    k: difficulty.k,
    regions,
    solution,
    // Every new game starts from a genuinely empty board. Generated authoring
    // clues are intentionally not imported into runtime state.
    marks: Array.from({ length: n }, () => Array<CellMark>(n).fill(0)),
    puzzleId: encoded.id,
    surrendered: false,
    won: false,
  };
}

export function createPuzzleState(difficulty: Difficulty): PuzzleState {
  return loadPuzzle(difficulty);
}
