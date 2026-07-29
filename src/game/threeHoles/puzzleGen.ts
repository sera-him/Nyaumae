import puzzleBankJson from './puzzles.generated.json';

export type CellMark = 0 | 1 | 2;

export interface PuzzleState {
  n: number;
  k: number;
  regions: number[][];
  solution: boolean[][];
  marks: CellMark[][];
  givens: boolean[][];
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
  naturalRegions?: boolean;
  clueCount?: number;
}

interface EncodedGiven {
  cell: number;
  value: 0 | 1;
}

interface EncodedPuzzle {
  id: string;
  difficultyId: string;
  n: number;
  k: number;
  regions: string[];
  solution: string[];
  givens?: EncodedGiven[];
  // Backward-compatible input for older generated banks. Merged banks use
  // `givens`, which can represent both fixed holes and fixed exclusions.
  clues?: number[];
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
const puzzlesByDifficulty = new Map<string, EncodedPuzzle[]>();
for (const puzzle of puzzleBank.puzzles) {
  const puzzles = puzzlesByDifficulty.get(puzzle.difficultyId) ?? [];
  puzzles.push(puzzle);
  puzzlesByDifficulty.set(puzzle.difficultyId, puzzles);
}
const lastPuzzleByDifficulty = new Map<string, string>();

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

function loadPuzzle(difficulty: Difficulty): PuzzleState {
  const candidates = puzzlesByDifficulty.get(difficulty.id)?.filter(
    (puzzle) => puzzle.n === difficulty.n && puzzle.k === difficulty.k,
  ) ?? [];
  if (candidates.length === 0) {
    throw new Error(`缺少 ${difficulty.name} 的题目`);
  }
  const previousId = lastPuzzleByDifficulty.get(difficulty.id);
  const freshCandidates = candidates.length > 1
    ? candidates.filter((puzzle) => puzzle.id !== previousId)
    : candidates;
  const encoded = freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
  lastPuzzleByDifficulty.set(difficulty.id, encoded.id);
  const encodedGivens: EncodedGiven[] = encoded.givens ?? (encoded.clues ?? []).map(
    (cell) => ({ cell, value: 1 }),
  );
  if (
    encoded.certificate.status !== 'INFEASIBLE'
    || !encoded.certificate.regionsConnected
    || !encoded.certificate.solutionValid
    || encoded.certificate.naturalRegions !== true
    || (encoded.certificate.clueCount ?? encodedGivens.length) !== encodedGivens.length
    || (encoded.givens !== undefined && encoded.clues !== undefined)
  ) {
    throw new Error(`${difficulty.name} 的题目证书无效`);
  }

  const { n } = difficulty;
  const rawRegions = decodeRows(encoded.regions, n);
  const rawSolution = decodeRows(encoded.solution, n).map(
    (row) => row.map((value) => value === 1),
  );
  const rawGivens = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const rawMarks = Array.from({ length: n }, () => Array<CellMark>(n).fill(0));
  const seenGivens = new Set<number>();
  for (const given of encodedGivens) {
    const row = Math.floor(given.cell / n);
    const col = given.cell % n;
    if (
      !Number.isInteger(given.cell)
      || row < 0
      || row >= n
      || col < 0
      || col >= n
      || (given.value !== 0 && given.value !== 1)
      || rawSolution[row][col] !== (given.value === 1)
      || seenGivens.has(given.cell)
    ) {
      throw new Error(`${difficulty.name} 的固定题面线索无效`);
    }
    seenGivens.add(given.cell);
    rawGivens[row][col] = true;
    rawMarks[row][col] = given.value === 1 ? 2 : 1;
  }
  const symmetry = Math.floor(Math.random() * 8);
  const relabel = shuffledRegionLabels(n);
  const regions = transformGrid(rawRegions, symmetry).map(
    (row) => row.map((region) => relabel[region]),
  );
  const solution = transformGrid(rawSolution, symmetry);
  const givens = transformGrid(rawGivens, symmetry);
  const marks = transformGrid(rawMarks, symmetry);

  if (!regionsAreConnected(regions) || !solutionIsValid(n, difficulty.k, regions, solution)) {
    throw new Error(`${difficulty.name} 的题目在加载时校验失败`);
  }

  return {
    n,
    k: difficulty.k,
    regions,
    solution,
    marks,
    givens,
    puzzleId: encoded.id,
    surrendered: false,
    won: false,
  };
}

export function createPuzzleState(difficulty: Difficulty): PuzzleState {
  return loadPuzzle(difficulty);
}
