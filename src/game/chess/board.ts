// ============================================================
// 复合象棋 — 棋盘工具 & 初始化
// ============================================================

import { chessBoardLayout } from '../../data/chess';
import type {
  Board, Position, Player, Piece, PieceType,
  GameState, PoisonMap,
} from './types';
import { BOARD_SIZE, ALL_PIECE_TYPES } from './types';

// ---- 基础工具 ----

/** 坐标是否在棋盘内 */
export function inBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/** 两个位置是否相同 */
export function posEq(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/** 获取棋盘上的棋子（空位/null/毒药/奶酪返回 null） */
export function getPiece(board: Board, pos: Position): Piece | null {
  if (!inBounds(pos)) return null;
  const cell = board[pos.row][pos.col];
  if (cell && typeof cell === 'object' && 'type' in cell) return cell as Piece;
  return null;
}

/** 是否为空格（null 或 毒药/奶酪） */
export function isEmptyOrExtra(board: Board, pos: Position): boolean {
  if (!inBounds(pos)) return false;
  const cell = board[pos.row][pos.col];
  if (cell === null) return true;
  if (typeof cell === 'string') return true; // poison or cheese
  return false;
}

/** 是否为纯空格（可落子） */
export function isEmpty(board: Board, pos: Position): boolean {
  if (!inBounds(pos)) return false;
  return board[pos.row][pos.col] === null;
}

/** 对方玩家 */
export function opponent(player: Player): Player {
  return player === 'white' ? 'black' : 'white';
}

/** 己方底线行号（白方 Row 11 底部，黑方 Row 0 顶部） */
export function baseline(player: Player): number {
  return player === 'white' ? BOARD_SIZE - 1 : 0;
}

/** 对方底线行号 */
export function enemyBaseline(player: Player): number {
  return player === 'white' ? 0 : BOARD_SIZE - 1;
}

/** 前进方向 deltaRow（白方朝 row 0 为上=-1，黑方朝 row 11 为下=+1） */
export function forwardDir(player: Player): number {
  return player === 'white' ? -1 : 1;
}

/** 全场扫描给定玩家的所有棋子位置 */
export function findAllPieces(board: Board, player: Player): { piece: Piece; pos: Position }[] {
  const result: { piece: Piece; pos: Position }[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.owner === player) result.push({ piece: p, pos: { row, col } });
    }
  }
  return result;
}

/** 查找玩家的关键棋子 */
export function findCriticalPieces(board: Board, player: Player): Position[] {
  const result: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.owner === player && (p.type === 'K' || p.type === 'G')) {
        result.push({ row, col });
      }
    }
  }
  return result;
}

/** 查找玩家的火箭 */
export function findRocket(board: Board, player: Player): Position | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.owner === player && p.type === 'X') return { row, col };
    }
  }
  return null;
}

/** 查找指定类型棋子 */
export function findPieceType(board: Board, player: Player, type: PieceType): Position[] {
  const result: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.owner === player && p.type === type) result.push({ row, col });
    }
  }
  return result;
}

/** 克隆棋盘 */
export function cloneBoard(board: Board): Board {
  return board.map(row =>
    row.map(cell => {
      if (cell === null || typeof cell === 'string') return cell;
      const p = cell as Piece;
      return { type: p.type, owner: p.owner };
    })
  );
}

/** 获取某棋子的中毒次数 */
export function getPoison(board: Board, pos: Position, poison: PoisonMap): number {
  const p = getPiece(board, pos);
  if (!p) return 0;
  const key = `${p.owner}_${p.type}_${pos.row}_${pos.col}`;
  return poison[key] || 0;
}

/** 生成棋子唯一键（用于中毒/恐惧跟踪） */
export function pieceKey(piece: Piece, pos: Position): string {
  return `${piece.owner}_${piece.type}_${pos.row}_${pos.col}`;
}

/** 获取女巫相邻8格 */
export function getAdjacent8(pos: Position): Position[] {
  const dirs = [
    [-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]
  ];
  return dirs.map(([dr, dc]) => ({ row: pos.row + dr, col: pos.col + dc })).filter(inBounds);
}

/** 获取相邻4格（上下左右） */
export function getAdjacent4(pos: Position): Position[] {
  const dirs = [[-1,0],[0,-1],[0,1],[1,0]];
  return dirs.map(([dr, dc]) => ({ row: pos.row + dr, col: pos.col + dc })).filter(inBounds);
}

/** 获取某格周围8格（用于巨鲸排斥和圣骑士清除） */
export function getSurrounding8(pos: Position): Position[] {
  return getAdjacent8(pos);
}

/** 获取某格周围4格 */
export function getSurrounding4(pos: Position): Position[] {
  return getAdjacent4(pos);
}

// ---- 棋盘初始化 ----

/** 从小写字母转大写 */
/** 从初始布局字符串创建棋盘 */
export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = chessBoardLayout[row][col];
      if (cell === 'x') continue;

      const upper = cell.toUpperCase();
      const type = upper as PieceType;

      // 检测是否为合法棋子类型
      if (!ALL_PIECE_TYPES.includes(type)) continue;

      const owner: Player = cell === upper ? 'white' : 'black';
      board[row][col] = { type, owner };
    }
  }

  return board;
}

/** 创建初始状态 */
export function createInitialState(): GameState {
  const board = createInitialBoard();
  const state: GameState = {
    board,
    currentPlayer: 'white',
    phase: 'playing',
    moveCount: 0,
    poison: {},
    fears: {},
    history: [],
    hasOstrich: { white: false, black: false },
    rocketPos: {
      white: findRocket(board, 'white'),
      black: findRocket(board, 'black'),
    },
    decryptionActive: false,
    decryptionStep: 0,
    blueCheeseControl: null,
    blueCheeseMouseKey: null,
    sacrificeCount: { white: 0, black: 0 },
    stateHashes: [],
    clock: { white: 0, black: 0 },
    clockConfigId: null,
    clockAccelStep: { white: 0, black: 0 },
    clockPoolMs: 0,
    clockPerMoveMs: 0,
    clockBountyCells: {},
  };
  // 初始状态也记入哈希
  state.stateHashes.push(computeStateHash(state));
  return state;
}

/** 深克隆游戏状态 */
export function cloneState(state: GameState): GameState {
  return {
    board: cloneBoard(state.board),
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    moveCount: state.moveCount,
    poison: { ...state.poison },
    fears: { ...state.fears },
    history: state.history.map(h => ({
      ...h,
      boardBefore: cloneBoard(h.boardBefore),
      poisonBefore: h.poisonBefore ? { ...h.poisonBefore } : undefined,
      fearsBefore: h.fearsBefore ? { ...h.fearsBefore } : undefined,
      captured: h.captured ? { ...h.captured } : undefined,
      poisonAdded: h.poisonAdded ? { ...h.poisonAdded } : undefined,
      cheeseAdded: h.cheeseAdded ? { ...h.cheeseAdded } : undefined,
    })),
    hasOstrich: { ...state.hasOstrich },
    rocketPos: { ...state.rocketPos },
    decryptionActive: state.decryptionActive,
    decryptionStep: state.decryptionStep,
    blueCheeseControl: state.blueCheeseControl,
    blueCheeseMouseKey: state.blueCheeseMouseKey,
    sacrificeCount: { ...state.sacrificeCount },
    stateHashes: [...state.stateHashes],
    clock: { ...state.clock },
    clockConfigId: state.clockConfigId,
    clockAccelStep: { ...state.clockAccelStep },
    clockPoolMs: state.clockPoolMs,
    clockPerMoveMs: state.clockPerMoveMs,
    clockBountyCells: { ...state.clockBountyCells },
  };
}

/** 计算状态的哈希值（用于三次重复局面检测）
 *  包含: 棋盘, 当前玩家, 中毒, 恐惧, 鸵鸟状态, 火箭位置,
 *       破译状态, 蓝奶酪控制, 献祭次数
 */
export function computeStateHash(state: GameState): string {
  // 对 map 按键排序以保证一致性
  const sortedPoison: Record<string, number> = {};
  for (const k of Object.keys(state.poison).sort()) {
    sortedPoison[k] = state.poison[k];
  }
  const sortedFears: Record<string, number> = {};
  for (const k of Object.keys(state.fears).sort()) {
    sortedFears[k] = state.fears[k];
  }
  const obj = {
    b: state.board.map(row => row.map(cell => {
      if (!cell) return '.';
      if (typeof cell === 'string') return cell;
      return `${cell.owner[0]}${cell.type}`;
    })),
    p: state.currentPlayer,
    po: sortedPoison,
    f: sortedFears,
    ho: state.hasOstrich,
    rp: state.rocketPos,
    da: state.decryptionActive,
    ds: state.decryptionStep,
    bc: state.blueCheeseControl,
    bk: state.blueCheeseMouseKey,
    sc: state.sacrificeCount,
  };
  return JSON.stringify(obj);
}

/** 曼哈顿距离 */
export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/** 切比雪夫距离 */
export function chebyshev(a: Position, b: Position): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}
