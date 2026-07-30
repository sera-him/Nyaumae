export type EchoColor = 'empty' | 'blue' | 'orange' | 'ai';
export type Controller = 'neutral' | 'blue' | 'orange' | 'ai';

export type BoardCell =
  | { kind: 'empty' }
  | { kind: 'token'; color: Exclude<EchoColor, 'empty'> }
  | { kind: 'board'; board: Board };

export interface Board {
  readonly id: number;
  readonly key: string;
  readonly cells: readonly BoardCell[];
}

export interface BoardStats {
  readonly votes: Record<Exclude<EchoColor, 'empty'>, bigint>;
  readonly controller: Controller;
  readonly boardCount: bigint;
  readonly controlledBoards: Record<Exclude<EchoColor, 'empty'>, bigint>;
}

export interface TargetStats {
  boards: bigint;
  empty: bigint;
  blue: bigint;
  orange: bigint;
  ai: bigint;
  subboard: bigint;
}

type NonEmptyColor = Exclude<EchoColor, 'empty'>;

export interface BoardStore {
  readonly empty: Board;
  readonly token: (color: NonEmptyColor) => BoardCell;
  readonly board: (cells: readonly BoardCell[]) => Board;
  readonly ownedChild: (color: NonEmptyColor) => Board;
  readonly invadedChild: (attacker: NonEmptyColor, defender: NonEmptyColor) => Board;
}

const EMPTY_CELL: BoardCell = { kind: 'empty' };
const TOKEN_CELLS: Record<NonEmptyColor, BoardCell> = {
  blue: { kind: 'token', color: 'blue' },
  orange: { kind: 'token', color: 'orange' },
  ai: { kind: 'token', color: 'ai' },
};

const colorKey = (color: EchoColor): string => {
  if (color === 'empty') return '.';
  if (color === 'blue') return 'B';
  if (color === 'orange') return 'O';
  return 'A';
};

const cellKey = (cell: BoardCell): string => {
  if (cell.kind === 'empty') return '.';
  if (cell.kind === 'token') return colorKey(cell.color);
  return `#${cell.board.id};`;
};

export function createBoardStore(): BoardStore {
  const cache = new Map<string, Board>();
  let nextId = 1;

  const board = (cells: readonly BoardCell[]): Board => {
    if (cells.length !== 9) throw new Error('递归回响的棋盘必须有 9 个格子');
    const key = cells.map(cellKey).join('');
    const cached = cache.get(key);
    if (cached) return cached;
    const created: Board = { id: nextId, key, cells: [...cells] };
    nextId += 1;
    cache.set(key, created);
    return created;
  };

  const ownedChild = (color: NonEmptyColor): Board => {
    const cells = Array<BoardCell>(9).fill(EMPTY_CELL);
    cells[1] = TOKEN_CELLS[color];
    cells[3] = TOKEN_CELLS[color];
    cells[4] = TOKEN_CELLS[color];
    cells[5] = TOKEN_CELLS[color];
    cells[7] = TOKEN_CELLS[color];
    return board(cells);
  };

  const invadedChild = (attacker: NonEmptyColor, defender: NonEmptyColor): Board => {
    const cells = Array<BoardCell>(9).fill(EMPTY_CELL);
    cells[1] = TOKEN_CELLS[defender];
    cells[3] = TOKEN_CELLS[defender];
    cells[4] = TOKEN_CELLS[attacker];
    cells[5] = TOKEN_CELLS[defender];
    cells[7] = TOKEN_CELLS[defender];
    return board(cells);
  };

  const empty = board(Array<BoardCell>(9).fill(EMPTY_CELL));

  return {
    empty,
    token: (color) => TOKEN_CELLS[color],
    board,
    ownedChild,
    invadedChild,
  };
}

/**
 * Apply one coordinate broadcast. The recursive walk only visits boards that
 * existed before this action; a child created by this walk is returned as-is
 * and therefore first receives a broadcast on the next action.
 */
export function broadcast(root: Board, coordinate: number, actor: NonEmptyColor, store: BoardStore): Board {
  if (!Number.isInteger(coordinate) || coordinate < 0 || coordinate > 8) {
    throw new Error('递归回响坐标必须在 0 到 8 之间');
  }

  const memo = new Map<number, Board>();
  const visit = (source: Board): Board => {
    const cached = memo.get(source.id);
    if (cached) return cached;

    const cells = source.cells.map((cell, index): BoardCell => {
      if (cell.kind === 'board') {
        return { kind: 'board', board: visit(cell.board) };
      }
      if (index !== coordinate) return cell;
      if (cell.kind === 'empty') return store.token(actor);
      if (cell.color === actor) return { kind: 'board', board: store.ownedChild(actor) };
      return { kind: 'board', board: store.invadedChild(actor, cell.color) };
    });

    const next = store.board(cells);
    memo.set(source.id, next);
    return next;
  };

  return visit(root);
}

const zeroVotes = (): Record<NonEmptyColor, bigint> => ({ blue: 0n, orange: 0n, ai: 0n });

function controllerFromVotes(votes: Record<NonEmptyColor, bigint>): Controller {
  const candidates = (Object.keys(votes) as NonEmptyColor[]).filter((color) => votes[color] >= 5n);
  if (candidates.length !== 1) return 'neutral';
  return candidates[0];
}

export function analyzeBoard(root: Board): BoardStats {
  const memo = new Map<number, BoardStats>();
  const visit = (board: Board): BoardStats => {
    const cached = memo.get(board.id);
    if (cached) return cached;

    const votes = zeroVotes();
    const controlledBoards = zeroVotes();
    let boardCount = 0n;

    board.cells.forEach((cell) => {
      if (cell.kind === 'token') {
        votes[cell.color] += 1n;
        return;
      }
      if (cell.kind !== 'board') return;

      const child = visit(cell.board);
      boardCount += 1n + child.boardCount;
      controlledBoards.blue += child.controlledBoards.blue;
      controlledBoards.orange += child.controlledBoards.orange;
      controlledBoards.ai += child.controlledBoards.ai;
      if (child.controller !== 'neutral') {
        votes[child.controller] += 1n;
        controlledBoards[child.controller] += 1n;
      }
    });

    const result: BoardStats = {
      votes,
      controller: controllerFromVotes(votes),
      boardCount,
      controlledBoards,
    };
    memo.set(board.id, result);
    return result;
  };

  return visit(root);
}

export function targetStats(root: Board, coordinate: number): TargetStats {
  const memo = new Map<number, TargetStats>();
  const visit = (board: Board): TargetStats => {
    const cached = memo.get(board.id);
    if (cached) return cached;

    const result: TargetStats = {
      boards: 1n,
      empty: 0n,
      blue: 0n,
      orange: 0n,
      ai: 0n,
      subboard: 0n,
    };

    const target = board.cells[coordinate];
    if (target.kind === 'empty') result.empty += 1n;
    else if (target.kind === 'token') result[target.color] += 1n;
    else result.subboard += 1n;

    board.cells.forEach((cell) => {
      if (cell.kind !== 'board') return;
      const child = visit(cell.board);
      result.boards += child.boards;
      result.empty += child.empty;
      result.blue += child.blue;
      result.orange += child.orange;
      result.ai += child.ai;
      result.subboard += child.subboard;
    });

    memo.set(board.id, result);
    return result;
  };

  return visit(root);
}

export function countBoards(root: Board): bigint {
  return analyzeBoard(root).boardCount;
}

export function getCellController(cell: BoardCell): Controller {
  if (cell.kind !== 'board') return 'neutral';
  return analyzeBoard(cell.board).controller;
}

export function makeRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] ?? Math.floor(Math.random() * 4294967296);
  }
  return Math.floor(Math.random() * 4294967296);
}

export function applyAiTerrain(root: Board, moves: number, seed: number, store: BoardStore): { root: Board; coordinates: number[] } {
  const random = makeRandom(seed);
  const coordinates: number[] = [];
  let next = root;
  for (let index = 0; index < moves; index += 1) {
    const coordinate = Math.floor(random() * 9);
    coordinates.push(coordinate);
    next = broadcast(next, coordinate, 'ai', store);
  }
  return { root: next, coordinates };
}

export const coordinateLabel = (coordinate: number): string => {
  const column = String.fromCharCode(65 + (coordinate % 3));
  const row = Math.floor(coordinate / 3) + 1;
  return `${column}${row}`;
};

export const controllerLabel = (controller: Controller): string => {
  if (controller === 'blue') return '蓝';
  if (controller === 'orange') return '橙';
  if (controller === 'ai') return 'AI';
  return '中立';
};

export const colorLabel = (color: EchoColor): string => {
  if (color === 'blue') return '蓝';
  if (color === 'orange') return '橙';
  if (color === 'ai') return 'AI';
  return '空';
};
