// ============================================================
// 复合象棋 — 25种棋子走法生成（走子/吃子逻辑分离）
// ============================================================

import type { Board, Position, Player, Piece, PieceType } from './types';
import {
  BOARD_SIZE, CANNOT_CAPTURE,
} from './types';
import {
  inBounds, getPiece, isEmptyOrExtra, isEmpty,
  forwardDir,
} from './board';

/** 分离后的走子/吃子结果 */
interface SeparatedMoves {
  moves: Position[];
  captures: Position[];
}

// ---- 方向向量 ----
const STRAIGHT_DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
const DIAGONAL_DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];
const ALL_8_DIRS = [...STRAIGHT_DIRS, ...DIAGONAL_DIRS];
const KNIGHT_MOVES = [
  [-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1],
];

// ---- 工具 ----

/** 检查位置是否有可吃的敌方棋子 */
function canEatAt(board: Board, pos: Position, player: Player, eaterType: PieceType): boolean {
  const target = getPiece(board, pos);
  if (!target) return false;
  if (target.owner === player) return false;
  if (CANNOT_CAPTURE.includes(eaterType)) return false;
  if (eaterType === 'T' && target.type !== 'M') return false;
  if (eaterType === 'S' && (target.type === 'K' || target.type === 'G')) return false;
  return true;
}

/** 沿方向滑动，返回分离的走子和吃子 */
function slideMovesSep(
  board: Board, pos: Position, player: Player, pieceType: PieceType,
  dirs: number[][], maxSteps: number = Infinity,
): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];

  for (const [dr, dc] of dirs) {
    for (let i = 1; i <= maxSteps; i++) {
      const to = { row: pos.row + dr * i, col: pos.col + dc * i };
      if (!inBounds(to)) break;
      const target = getPiece(board, to);
      if (target) {
        if (target.owner !== player) {
          // 猫只能吃老鼠
          if (pieceType === 'T' && target.type !== 'M') break;
          // 星舰不能吃关键棋子
          if (pieceType === 'S' && (target.type === 'K' || target.type === 'G')) break;
          if (!CANNOT_CAPTURE.includes(pieceType)) {
            captures.push(to);
          }
        }
        break;
      }
      moves.push(to); // 空格可走
    }
  }
  return { moves, captures };
}

// ---- 各棋子走法 ----

/** K — 王：8方向各1格，可移动到己方火箭上合成太空人 */
function kingMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  for (const [dr, dc] of ALL_8_DIRS) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    const target = getPiece(board, to);
    if (!target) {
      moves.push(to);
    } else if (target.owner !== player) {
      captures.push(to);
    } else if (target.type === 'X') {
      // 王可以"吃"己方火箭合成太空人
      captures.push(to);
    }
  }
  return { moves, captures };
}

/** Q — 后：直线/斜线任意格 */
function queenMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  return slideMovesSep(board, pos, player, 'Q', ALL_8_DIRS);
}

/** R — 车：横竖任意格 */
function rookMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  return slideMovesSep(board, pos, player, 'R', STRAIGHT_DIRS);
}

/** B — 教：斜线任意格 */
function bishopMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  return slideMovesSep(board, pos, player, 'B', DIAGONAL_DIRS);
}

/** N — 马：走"日"，可跳子 */
function knightMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  for (const [dr, dc] of KNIGHT_MOVES) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    const target = getPiece(board, to);
    if (!target) {
      moves.push(to);
    } else if (target.owner !== player) {
      captures.push(to);
    }
  }
  return { moves, captures };
}

/** P — 兵：前进1格（初始可2格），斜前吃子 */
function pawnMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const fwd = forwardDir(player);
  const startRows = player === 'white' ? [8, 9] : [2, 3]; // 白方兵在Row 8-9, 黑方兵在Row 2-3

  // 前进1格
  const fwd1 = { row: pos.row + fwd, col: pos.col };
  if (inBounds(fwd1) && isEmptyOrExtra(board, fwd1)) {
    moves.push(fwd1);
    // 前进2格（仅初始行）
    if (startRows.includes(pos.row)) {
      const fwd2 = { row: pos.row + fwd * 2, col: pos.col };
      if (isEmptyOrExtra(board, fwd2)) {
        moves.push(fwd2);
      }
    }
  }

  // 斜前吃子
  for (const dc of [-1, 1]) {
    const cap = { row: pos.row + fwd, col: pos.col + dc };
    if (!inBounds(cap)) continue;
    if (canEatAt(board, cap, player, 'P')) {
      captures.push(cap);
    }
  }

  return { moves, captures };
}

/** E — 象：前/左/右各1格，初始可2格，斜前吃子 */
function elephantMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const fwd = forwardDir(player);
  const startRow = player === 'white' ? 9 : 2; // 白方象在Row 9, 黑方象在Row 2

  // 移动方向：前、左、右
  const moveDirs: [number, number][] = [[fwd, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of moveDirs) {
    const to1 = { row: pos.row + dr, col: pos.col + dc };
    if (inBounds(to1) && isEmptyOrExtra(board, to1)) {
      moves.push(to1);
      // 初始可走2格
      if (pos.row === startRow) {
        const to2 = { row: pos.row + dr * 2, col: pos.col + dc * 2 };
        if (inBounds(to2) && isEmptyOrExtra(board, to2)) {
          moves.push(to2);
        }
      }
    }
  }

  // 斜前吃子（同兵）
  for (const dc of [-1, 1]) {
    const cap = { row: pos.row + fwd, col: pos.col + dc };
    if (!inBounds(cap)) continue;
    if (canEatAt(board, cap, player, 'E')) {
      captures.push(cap);
    }
  }

  return { moves, captures };
}

/** T — 猫：5×5 范围任意走（即切比雪夫距离 ≤2），仅吃老鼠，不可阻挡 */
function tigerMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (dr === 0 && dc === 0) continue;
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!inBounds(to)) continue;
      const target = getPiece(board, to);
      if (!target) {
        moves.push(to);
      } else if (target.owner !== player && target.type === 'M') {
        captures.push(to); // 猫只能吃老鼠
      }
    }
  }
  return { moves, captures };
}

/** Y — 缅因猫：5×5 范围任意走，不可吃子 */
function maineCoonMovesSep(board: Board, pos: Position): SeparatedMoves {
  const moves: Position[] = [];
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (dr === 0 && dc === 0) continue;
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!inBounds(to)) continue;
      if (isEmptyOrExtra(board, to)) {
        moves.push(to);
      }
    }
  }
  return { moves, captures: [] };
}

/** M — 老鼠：直线/斜线/马步任意格，不可越子 */
function mouseMovesSep(
  board: Board, pos: Position, player: Player,
  poisonCount: number,
): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];

  // 马步（滑动，沿方向重复直到被阻挡）
  if (poisonCount < 6) {
    for (let ki = 0; ki < KNIGHT_MOVES.length; ki++) {
      const [dr, dc] = KNIGHT_MOVES[ki];
      if (poisonCount >= 1) {
        // 中毒1级后马步只能走1个特定方向
        if (dr !== KNIGHT_MOVES[0][0] || dc !== KNIGHT_MOVES[0][1]) continue;
      }
      for (let i = 1; i < BOARD_SIZE; i++) {
        const to = { row: pos.row + dr * i, col: pos.col + dc * i };
        if (!inBounds(to)) break;
        const target = getPiece(board, to);
        if (target) {
          if (target.owner !== player) captures.push(to);
          break;
        }
        moves.push(to);
      }
    }
  }

  // 斜线
  if (poisonCount < 7) {
    const maxDiag = poisonCount >= 2 ? (poisonCount >= 4 ? 1 : 2) : Infinity;
    for (const [dr, dc] of DIAGONAL_DIRS) {
      for (let i = 1; i <= (maxDiag === Infinity ? BOARD_SIZE : maxDiag); i++) {
        const to = { row: pos.row + dr * i, col: pos.col + dc * i };
        if (!inBounds(to)) break;
        const target = getPiece(board, to);
        if (target) {
          if (target.owner !== player) captures.push(to);
          break;
        }
        moves.push(to);
      }
    }
  }

  // 直线
  if (poisonCount < 6) {
    const maxStraight = poisonCount >= 3 ? (poisonCount >= 5 ? 1 : 2) : Infinity;
    for (const [dr, dc] of STRAIGHT_DIRS) {
      for (let i = 1; i <= (maxStraight === Infinity ? BOARD_SIZE : maxStraight); i++) {
        const to = { row: pos.row + dr * i, col: pos.col + dc * i };
        if (!inBounds(to)) break;
        const target = getPiece(board, to);
        if (target) {
          if (target.owner !== player) captures.push(to);
          break;
        }
        moves.push(to);
      }
    }
  }

  return { moves, captures };
}

/** L — 英语：上下左右1-2格，走2格中间需空 */
function englishMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  for (const [dr, dc] of STRAIGHT_DIRS) {
    // 1格
    const to1 = { row: pos.row + dr, col: pos.col + dc };
    if (inBounds(to1)) {
      const target = getPiece(board, to1);
      if (!target) {
        moves.push(to1);
      } else if (target.owner !== player) {
        captures.push(to1);
      }
    }
    // 2格
    const mid = { row: pos.row + dr, col: pos.col + dc };
    const to2 = { row: pos.row + dr * 2, col: pos.col + dc * 2 };
    if (inBounds(to2) && isEmptyOrExtra(board, mid)) {
      const target = getPiece(board, to2);
      if (!target) {
        moves.push(to2);
      } else if (target.owner !== player) {
        captures.push(to2);
      }
    }
  }
  return { moves, captures };
}

/** A — 天线：(r±2,c∓1)/(r±2,c±1)/(r,c±2) + 8方向1格 */
function antennaMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];

  // 跳跃走法（可以吃子）
  const allJumps: [number, number][] = [
    [2,-1],[2,1],[-2,-1],[-2,1],
    [0,2],[0,-2],
  ];
  for (const [dr, dc] of allJumps) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    const target = getPiece(board, to);
    if (!target) {
      moves.push(to);
    } else if (target.owner !== player) {
      captures.push(to);
    }
  }

  // 8方向1格（不可吃子，仅走空格/毒格）
  for (const [dr, dc] of ALL_8_DIRS) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    if (isEmptyOrExtra(board, to)) moves.push(to);
  }

  return { moves, captures };
}

/** C — 大炮：走法同车不可越子，吃子需炮架 */
function cannonMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];

  for (const [dr, dc] of STRAIGHT_DIRS) {
    // 走法：同车不可越子（可踏毒药/奶酪等额外格）
    for (let i = 1; i < BOARD_SIZE; i++) {
      const to = { row: pos.row + dr * i, col: pos.col + dc * i };
      if (!inBounds(to)) break;
      if (!isEmptyOrExtra(board, to)) break; // 可走过毒药/奶酪格
      moves.push(to);
    }

    // 吃子：沿直线方向，遇到的第一个任意棋子为炮架（不限距离），
    // 跳过炮架后遇到的第一个敌方棋子可被吃
    let foundMount = false;
    for (let i = 1; i < BOARD_SIZE; i++) {
      const to = { row: pos.row + dr * i, col: pos.col + dc * i };
      if (!inBounds(to)) break;
      const target = getPiece(board, to);
      if (target && !foundMount) {
        // 遇到的第一个棋子 = 炮架（任何人任意距离）
        foundMount = true;
        continue;
      }
      if (foundMount) {
        if (target) {
          if (target.owner !== player) {
            captures.push(to);
          }
          break; // 遇到第二个棋子后停止
        }
      }
    }
  }

  return { moves, captures };
}

/** W — 女巫：8方向1格，不可吃子 */
function witchMovesSep(board: Board, pos: Position): SeparatedMoves {
  const moves: Position[] = [];
  for (const [dr, dc] of ALL_8_DIRS) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    if (isEmptyOrExtra(board, to)) {
      moves.push(to);
    }
  }
  return { moves, captures: [] };
}

/** Z — 骷髅兵：前/左/右各1格（前为己方前进方向） */
function skeletonMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const fwd = forwardDir(player);
  const dirs: [number, number][] = [[fwd, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    const target = getPiece(board, to);
    if (!target) {
      moves.push(to);
    } else if (target.owner !== player) {
      captures.push(to);
    }
  }
  return { moves, captures };
}

/** IW — 反女巫：8方向1格，不可吃子 */
function antiWitchMovesSep(board: Board, pos: Position): SeparatedMoves {
  return witchMovesSep(board, pos);
}

/** IZ — 反骷髅兵：前/左/右各1格（前为反向，朝己方底线） */
function antiSkeletonMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const fwd = -forwardDir(player);
  const dirs: [number, number][] = [[fwd, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    const target = getPiece(board, to);
    if (!target) {
      moves.push(to);
    } else if (target.owner !== player) {
      captures.push(to);
    }
  }
  return { moves, captures };
}

/** J — 圣骑士：走"日"，可跳子 */
function paladinMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  return knightMovesSep(board, pos, player);
}

/** H — 巨鲸：上下左右1格，不可到棋盘边缘
 *  巨鲸本质上是3×3大棋子（表现1×1），移动前检查3个前缘格子：
 *  如有己方棋子则不可走；否则可走，移动后前缘3格中的敌方棋子被清除。
 */
function whaleMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  for (const [dr, dc] of STRAIGHT_DIRS) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    // 不可到棋盘边缘
    if (to.row === 0 || to.row === BOARD_SIZE - 1 || to.col === 0 || to.col === BOARD_SIZE - 1) continue;

    // 目标格有己方棋子 → 不可走
    const target = getPiece(board, to);
    if (target && target.owner === player) continue;

    // 检查3个前缘格子是否有己方棋子
    let hasFriendlyLeading = false;
    let leadingCells: Position[] = [];
    if (dr === -1) { // 上
      leadingCells = [
        { row: to.row - 1, col: to.col - 1 },
        { row: to.row - 1, col: to.col },
        { row: to.row - 1, col: to.col + 1 },
      ];
    } else if (dr === 1) { // 下
      leadingCells = [
        { row: to.row + 1, col: to.col - 1 },
        { row: to.row + 1, col: to.col },
        { row: to.row + 1, col: to.col + 1 },
      ];
    } else if (dc === -1) { // 左
      leadingCells = [
        { row: to.row - 1, col: to.col - 1 },
        { row: to.row, col: to.col - 1 },
        { row: to.row + 1, col: to.col - 1 },
      ];
    } else { // 右
      leadingCells = [
        { row: to.row - 1, col: to.col + 1 },
        { row: to.row, col: to.col + 1 },
        { row: to.row + 1, col: to.col + 1 },
      ];
    }
    for (const lc of leadingCells) {
      if (inBounds(lc)) {
        const lp = getPiece(board, lc);
        if (lp && lp.owner === player) {
          hasFriendlyLeading = true;
          break;
        }
      }
    }
    if (hasFriendlyLeading) continue;

    if (!target) {
      moves.push(to);
    } else {
      captures.push(to);
    }
  }
  return { moves, captures };
}

/** X — 火箭：不可主动移动 */
function rocketMovesSep(): SeparatedMoves {
  return { moves: [], captures: [] };
}

/** U — 太空人：9×9范围任意走（切比雪夫距离≤4），不可吃子 */
function spacemanMovesSep(board: Board, pos: Position): SeparatedMoves {
  const moves: Position[] = [];
  for (let dr = -4; dr <= 4; dr++) {
    for (let dc = -4; dc <= 4; dc++) {
      if (dr === 0 && dc === 0) continue;
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!inBounds(to)) continue;
      if (isEmptyOrExtra(board, to)) {
        moves.push(to);
      }
    }
  }
  return { moves, captures: [] };
}

/** S — 星舰：9×9范围任意走，不可吃关键棋子 */
function starshipMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  for (let dr = -4; dr <= 4; dr++) {
    for (let dc = -4; dc <= 4; dc++) {
      if (dr === 0 && dc === 0) continue;
      const to = { row: pos.row + dr, col: pos.col + dc };
      if (!inBounds(to)) continue;
      const target = getPiece(board, to);
      if (!target) {
        moves.push(to);
      } else if (target.owner !== player) {
        if (target.type !== 'K' && target.type !== 'G') {
          captures.push(to);
        }
      }
    }
  }
  return { moves, captures };
}

/** O — 鸵鸟：直线/斜线任意格，不可吃子，不可入敌方攻击范围 */
function ostrichMovesSep(board: Board, pos: Position): SeparatedMoves {
  const moves: Position[] = [];
  for (const [dr, dc] of ALL_8_DIRS) {
    for (let i = 1; i < BOARD_SIZE; i++) {
      const to = { row: pos.row + dr * i, col: pos.col + dc * i };
      if (!inBounds(to)) break;
      const target = getPiece(board, to);
      if (target) break;
      moves.push(to);
    }
  }
  return { moves, captures: [] };
}

/** G — 猫娘：8方向各1格 */
function catgirlMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  return kingMovesSep(board, pos, player);
}

// ---- 工具：中毒移动限制过滤 ----

/** 教(B)中毒1级+：走"田"字（斜线2格）+蹩腿检查 */
function bishopFieldMovesSep(board: Board, pos: Position, player: Player): SeparatedMoves {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const fieldDirs: [number, number][] = [[-2,-2],[-2,2],[2,-2],[2,2]];
  for (const [dr, dc] of fieldDirs) {
    const to = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(to)) continue;
    // 蹩腿检查：中点必须为空
    const eye = { row: pos.row + dr / 2, col: pos.col + dc / 2 };
    if (!isEmpty(board, eye)) continue;
    const target = getPiece(board, to);
    if (!target) {
      moves.push(to);
    } else if (target.owner !== player) {
      captures.push(to);
    }
  }
  return { moves, captures };
}

/** 根据中毒次数过滤走法（所有非免疫棋子） */
function filterMovesByPoison(
  board: Board,
  pos: Position,
  piece: Piece,
  poisonCount: number,
  merged: { to: Position; isCapture: boolean }[],
): { to: Position; isCapture: boolean }[] {
  const { type, owner: player } = piece;
  if (poisonCount <= 0) return merged;

  const midline = BOARD_SIZE / 2; // 行<6=黑方半场(顶), 行>=6=白方半场(底)

  switch (type) {
    case 'P':
    case 'E':
    case 'Z':
    case 'IZ': {
      // 中毒≥1：不可吃子
      if (poisonCount >= 1) return merged.filter(m => !m.isCapture);
      break;
    }
    case 'N': {
      // 中毒≥1：加"蹩腿"（马腿位置有棋子则不能跳）
      if (poisonCount >= 1) {
        return merged.filter(m => {
          const dr = m.to.row - pos.row;
          const dc = m.to.col - pos.col;
          // 蹩腿位置：长腿方向的前一格
          const blockDr = Math.abs(dr) === 2 ? Math.sign(dr) : 0;
          const blockDc = Math.abs(dc) === 2 ? Math.sign(dc) : 0;
          const block = { row: pos.row + blockDr, col: pos.col + blockDc };
          return isEmpty(board, block);
        });
      }
      // 中毒≥2：被移除（在 isPoisonedRemoved 中处理，这里留空）
      break;
    }
    case 'B': {
      // 中毒≥1：走"田"字有蹩腿（完全替换走法）
      if (poisonCount >= 1) {
        const field = bishopFieldMovesSep(board, pos, player);
        let fieldMerged = mergeSep(field);
        // 中毒≥2：不可过中线
        if (poisonCount >= 2) {
          fieldMerged = fieldMerged.filter(m => {
            if (player === 'white') return m.to.row >= midline;
            else return m.to.row < midline;
          });
        }
        return fieldMerged;
      }
      break;
    }
    case 'R': {
      const maxSteps = poisonCount >= 2 ? 1 : 2;
      return merged.filter(m => {
        const dr = Math.abs(m.to.row - pos.row);
        const dc = Math.abs(m.to.col - pos.col);
        // 横竖移动
        if (dr === 0) return dc <= maxSteps;
        if (dc === 0) return dr <= maxSteps;
        return false; // 非直线不可能（R只有横竖走法）
      });
    }
    case 'Q':
    case 'O': {
      if (poisonCount >= 3) {
        // 仅4方向最多1格
        return merged.filter(m => {
          const dr = Math.abs(m.to.row - pos.row);
          const dc = Math.abs(m.to.col - pos.col);
          return ((dr === 0 && dc === 1) || (dc === 0 && dr === 1));
        });
      }
      const maxDist = poisonCount >= 2 ? 1 : 2;
      return merged.filter(m => {
        const dr = Math.abs(m.to.row - pos.row);
        const dc = Math.abs(m.to.col - pos.col);
        return Math.max(dr, dc) <= maxDist;
      });
    }
    case 'C': {
      // 中毒≥4：直线移动最多1格（吃子不受影响）
      if (poisonCount >= 4) {
        return merged.filter(m => {
          if (m.isCapture) return true;
          const dr = Math.abs(m.to.row - pos.row);
          const dc = Math.abs(m.to.col - pos.col);
          return Math.max(dr, dc) <= 1;
        });
      }
      break;
    }
  }
  return merged;
}

// ---- 工具：合并走子和吃子为统一格式 ----

function mergeSep(sep: SeparatedMoves): { to: Position; isCapture: boolean }[] {
  const result: { to: Position; isCapture: boolean }[] = [];
  for (const to of sep.moves) result.push({ to, isCapture: false });
  for (const to of sep.captures) result.push({ to, isCapture: true });
  return result;
}

// ---- 主分发函数 ----

/** 获取棋子的原始走法（含走子和吃子，用 isCapture 区分） */
export function getRawMoves(
  board: Board,
  pos: Position,
  piece: Piece,
  poisonCount: number = 0,
): { to: Position; isCapture: boolean }[] {
  const { type, owner: player } = piece;

  let sep: SeparatedMoves = { moves: [], captures: [] };

  switch (type) {
    case 'K': sep = kingMovesSep(board, pos, player); break;
    case 'Q': sep = queenMovesSep(board, pos, player); break;
    case 'R': sep = rookMovesSep(board, pos, player); break;
    case 'B': sep = bishopMovesSep(board, pos, player); break;
    case 'N': sep = knightMovesSep(board, pos, player); break;
    case 'P': sep = pawnMovesSep(board, pos, player); break;
    case 'T': sep = tigerMovesSep(board, pos, player); break;
    case 'Y': sep = maineCoonMovesSep(board, pos); break;
    case 'M': sep = mouseMovesSep(board, pos, player, poisonCount); break;
    case 'E': sep = elephantMovesSep(board, pos, player); break;
    case 'L': sep = englishMovesSep(board, pos, player); break;
    case 'A': sep = antennaMovesSep(board, pos, player); break;
    case 'C': sep = cannonMovesSep(board, pos, player); break;
    case 'W': sep = witchMovesSep(board, pos); break;
    case 'Z': sep = skeletonMovesSep(board, pos, player); break;
    case 'IW': sep = antiWitchMovesSep(board, pos); break;
    case 'IZ': sep = antiSkeletonMovesSep(board, pos, player); break;
    case 'J': sep = paladinMovesSep(board, pos, player); break;
    case 'H': sep = whaleMovesSep(board, pos, player); break;
    case 'X': sep = rocketMovesSep(); break;
    case 'U': sep = spacemanMovesSep(board, pos); break;
    case 'S': sep = starshipMovesSep(board, pos, player); break;
    case 'O': sep = ostrichMovesSep(board, pos); break;
    case 'G': sep = catgirlMovesSep(board, pos, player); break;
  }

  return filterMovesByPoison(board, pos, piece, poisonCount, mergeSep(sep));
}

/**
 * 获取某棋子的所有走子位置（不含吃子）
 * 走子/吃子逻辑已分离，直接返回 moves
 */
export function getMoves(
  board: Board,
  pos: Position,
  piece: Piece,
  poisonCount: number = 0,
): Position[] {
  const { type, owner: player } = piece;
  switch (type) {
    case 'K': return kingMovesSep(board, pos, player).moves;
    case 'Q': return queenMovesSep(board, pos, player).moves;
    case 'R': return rookMovesSep(board, pos, player).moves;
    case 'B': return bishopMovesSep(board, pos, player).moves;
    case 'N': return knightMovesSep(board, pos, player).moves;
    case 'P': return pawnMovesSep(board, pos, player).moves;
    case 'T': return tigerMovesSep(board, pos, player).moves;
    case 'Y': return maineCoonMovesSep(board, pos).moves;
    case 'M': return mouseMovesSep(board, pos, player, poisonCount).moves;
    case 'E': return elephantMovesSep(board, pos, player).moves;
    case 'L': return englishMovesSep(board, pos, player).moves;
    case 'A': return antennaMovesSep(board, pos, player).moves;
    case 'C': return cannonMovesSep(board, pos, player).moves;
    case 'W': return witchMovesSep(board, pos).moves;
    case 'Z': return skeletonMovesSep(board, pos, player).moves;
    case 'IW': return antiWitchMovesSep(board, pos).moves;
    case 'IZ': return antiSkeletonMovesSep(board, pos, player).moves;
    case 'J': return paladinMovesSep(board, pos, player).moves;
    case 'H': return whaleMovesSep(board, pos, player).moves;
    case 'X': return [];
    case 'U': return spacemanMovesSep(board, pos).moves;
    case 'S': return starshipMovesSep(board, pos, player).moves;
    case 'O': return ostrichMovesSep(board, pos).moves;
    case 'G': return catgirlMovesSep(board, pos, player).moves;
  }
  return [];
}

/**
 * 获取某棋子的所有吃子位置
 */
export function getCaptures(
  board: Board,
  pos: Position,
  piece: Piece,
  poisonCount: number = 0,
): Position[] {
  const { type, owner: player } = piece;
  switch (type) {
    case 'K': return kingMovesSep(board, pos, player).captures;
    case 'Q': return queenMovesSep(board, pos, player).captures;
    case 'R': return rookMovesSep(board, pos, player).captures;
    case 'B': return bishopMovesSep(board, pos, player).captures;
    case 'N': return knightMovesSep(board, pos, player).captures;
    case 'P': return pawnMovesSep(board, pos, player).captures;
    case 'T': return tigerMovesSep(board, pos, player).captures;
    case 'Y': return [];
    case 'M': return mouseMovesSep(board, pos, player, poisonCount).captures;
    case 'E': return elephantMovesSep(board, pos, player).captures;
    case 'L': return englishMovesSep(board, pos, player).captures;
    case 'A': return antennaMovesSep(board, pos, player).captures;
    case 'C': return cannonMovesSep(board, pos, player).captures;
    case 'W': return [];
    case 'Z': return skeletonMovesSep(board, pos, player).captures;
    case 'IW': return [];
    case 'IZ': return antiSkeletonMovesSep(board, pos, player).captures;
    case 'J': return paladinMovesSep(board, pos, player).captures;
    case 'H': return whaleMovesSep(board, pos, player).captures;
    case 'X': return [];
    case 'U': return [];
    case 'S': return starshipMovesSep(board, pos, player).captures;
    case 'O': return [];
    case 'G': return catgirlMovesSep(board, pos, player).captures;
  }
  return [];
}
