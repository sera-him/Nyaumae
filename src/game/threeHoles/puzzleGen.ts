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

function shuffle<T>(values: T[]): T[] {
  for (let index = values.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values;
}

function cellsAreOrthogonalNeighbors(left: number, right: number, n: number): boolean {
  const leftRow = Math.floor(left / n);
  const leftCol = left % n;
  const rightRow = Math.floor(right / n);
  const rightCol = right % n;
  return Math.abs(leftRow - rightRow) + Math.abs(leftCol - rightCol) === 1;
}

/**
 * Make the answer less lattice-like without changing the row/column totals.
 * A cycle move takes one hole from several different rows and rotates their
 * columns. It is the smallest useful move for this puzzle: it preserves both
 * margins, while the final neighbor check keeps the king-neighbor rule intact.
 */
function randomizeSolutionLayout(solution: boolean[][], attempts: number): boolean[][] {
  const n = solution.length;
  const mixed = solution.map((row) => [...row]);

  for (let attempt = 0; attempt < attempts; attempt++) {
    const cycleLength = Math.min(n, 2 + Math.floor(Math.random() * 5));
    const rows = shuffle(Array.from({ length: n }, (_, index) => index))
      .slice(0, cycleLength);
    const usedColumns = new Set<number>();
    const sourceColumns: number[] = [];
    let possible = true;

    for (const row of rows) {
      const choices = mixed[row].flatMap(
        (value, col) => value && !usedColumns.has(col) ? [col] : [],
      );
      if (choices.length === 0) {
        possible = false;
        break;
      }
      const column = choices[Math.floor(Math.random() * choices.length)];
      sourceColumns.push(column);
      usedColumns.add(column);
    }
    if (!possible) continue;

    const direction = Math.random() < 0.5 ? 1 : -1;
    const destinationColumns = sourceColumns.map(
      (_, index) => sourceColumns[(index + direction + cycleLength) % cycleLength],
    );
    const removed = rows.map((row, index) => [row, sourceColumns[index]] as const);
    const added = rows.map((row, index) => [row, destinationColumns[index]] as const);

    if (added.some(([row, col]) => mixed[row][col])) continue;
    for (const [row, col] of removed) mixed[row][col] = false;
    for (const [row, col] of added) mixed[row][col] = true;

    const adjacencyPreserved = added.every(
      ([row, col]) => !hasNeighboringHole(mixed, row, col),
    );
    if (adjacencyPreserved) continue;

    for (const [row, col] of added) mixed[row][col] = false;
    for (const [row, col] of removed) mixed[row][col] = true;
  }

  return mixed;
}

function buildRandomHamiltonianPath(n: number): number[] {
  const path: number[] = [];
  const vertical = Math.random() < 0.5;
  if (vertical) {
    for (let col = 0; col < n; col++) {
      const rows = col % 2 === 0
        ? Array.from({ length: n }, (_, row) => row)
        : Array.from({ length: n }, (_, row) => n - 1 - row);
      for (const row of rows) path.push(row * n + col);
    }
  } else {
    for (let row = 0; row < n; row++) {
      const columns = row % 2 === 0
        ? Array.from({ length: n }, (_, col) => col)
        : Array.from({ length: n }, (_, col) => n - 1 - col);
      for (const col of columns) path.push(row * n + col);
    }
  }
  if (Math.random() < 0.5) path.reverse();

  // Random 2-opt reversals keep the path connected but make the region cuts
  // less stripe-like than the plain serpentine path.
  for (let attempt = 0; attempt < n * n * 8; attempt++) {
    const left = 1 + Math.floor(Math.random() * Math.max(1, path.length - 3));
    const right = left + 1 + Math.floor(Math.random() * Math.max(1, path.length - left - 2));
    if (right >= path.length - 1) continue;
    if (!cellsAreOrthogonalNeighbors(path[left - 1], path[right], n)) continue;
    if (!cellsAreOrthogonalNeighbors(path[left], path[right + 1], n)) continue;
    const reversed = path.slice(left, right + 1).reverse();
    path.splice(left, right - left + 1, ...reversed);
  }
  return path;
}

function buildRegionsForSolution(n: number, k: number, solution: boolean[][]): number[][] {
  const path = buildRandomHamiltonianPath(n);
  const holePositions = path.flatMap((value, position) => (
    solution[Math.floor(value / n)][value % n] ? [position] : []
  ));
  if (holePositions.length !== n * k) {
    throw new Error('题目答案中的兔子洞数量不正确');
  }

  const ends: number[] = [];
  let previous = 0;
  for (let region = 0; region < n - 1; region++) {
    const lower = holePositions[(region + 1) * k - 1] + 1;
    const upper = holePositions[(region + 1) * k];
    const end = lower + Math.floor(Math.random() * (upper - lower + 1));
    if (end <= previous) throw new Error('题目活动区切分失败');
    ends.push(end);
    previous = end;
  }
  ends.push(n * n);

  const labels = Array.from({ length: n }, () => Array<number>(n).fill(-1));
  let start = 0;
  for (let region = 0; region < n; region++) {
    for (let position = start; position < ends[region]; position++) {
      const value = path[position];
      labels[Math.floor(value / n)][value % n] = region;
    }
    start = ends[region];
  }
  return labels;
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
  const storedRegions = decodeRows(encoded.regions, n);
  const rawSolution = decodeRows(encoded.solution, n).map(
    (row) => row.map((value) => value === 1),
  );
  const symmetry = Math.floor(Math.random() * 8);
  const relabel = shuffledRegionLabels(n);
  const transformedSolution = transformGrid(rawSolution, symmetry);
  const solution = randomizeSolutionLayout(
    transformedSolution,
    Math.max(1_200, n * n * 40),
  );
  const regions = buildRegionsForSolution(n, difficulty.k, solution).map(
    (row) => row.map((region) => relabel[region]),
  );

  if (!regionsAreConnected(storedRegions) || !regionsAreConnected(regions)
    || !solutionIsValid(n, difficulty.k, regions, solution)) {
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
