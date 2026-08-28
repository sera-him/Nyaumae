// ============================================================
// 复合象棋 — 特殊规则
// ============================================================

import type {
  Board, Position, Player, Piece, PieceType, GameState,
  CheeseType, FearMap,
} from './types';
import {
  BOARD_SIZE, POISON_IMMUNE,
} from './types';
import {
  inBounds, getPiece, findAllPieces,
  getSurrounding8, getSurrounding4, opponent,
  enemyBaseline, cloneBoard, isEmpty,
  pieceKey, baseline,
} from './board';
import { getCaptures } from './moves';

// ============================================================
// 中毒效果 — 限制走法
// ============================================================

/** 根据中毒次数修正走法 */
export function applyPoisonFilter(
  piece: Piece,
  poisonCount: number,
): string | null {
  // 中毒限制描述（用于 UI 显示）
  if (POISON_IMMUNE.includes(piece.type)) return null;
  if (poisonCount <= 0) return null;

  const type = piece.type;

  // P/E/Z/IZ: 1级中毒 → 不可吃子
  if ((type === 'P' || type === 'E' || type === 'Z' || type === 'IZ') && poisonCount >= 1) {
    return '不可吃子';
  }

  // N: 1级加蹩腿
  if (type === 'N' && poisonCount >= 1) return '加"蹩腿"';

  // B: 1级走"田"且有蹩腿, 2级己方半场不可过中线
  if (type === 'B') {
    if (poisonCount >= 2) return '己方半场不可过中线';
    if (poisonCount >= 1) return '走"田"且有"蹩腿"';
  }

  // R: 1级横竖最多2格, 2级横竖最多1格
  if (type === 'R') {
    if (poisonCount >= 2) return '横竖最多1格';
    if (poisonCount >= 1) return '横竖最多2格';
  }

  // Q/O: 1级最多2格, 2级最多1格, 3级4方向最多1格
  if (type === 'Q' || type === 'O') {
    if (poisonCount >= 3) return '4方向最多1格';
    if (poisonCount >= 2) return '8方向最多1格';
    if (poisonCount >= 1) return '8方向最多2格';
  }

  // T/Y/L/A: 1-3免疫, 4-6失去技能
  if ((type === 'T' || type === 'Y' || type === 'L' || type === 'A') && poisonCount >= 4) {
    return '失去技能';
  }

  // C: 1-3免疫, 4-6直线最多移动1格
  if (type === 'C' && poisonCount >= 4) {
    return '直线最多移动1格';
  }

  // H: 1级被移除
  if (type === 'H' && poisonCount >= 1) return '被移除';

  // M: 老鼠走法在 getRawMoves 中已处理

  return null;
}

/** 中毒是否导致棋子移除 */
export function isPoisonedRemoved(piece: Piece, poisonCount: number): boolean {
  if (POISON_IMMUNE.includes(piece.type)) return false;
  if (poisonCount <= 0) return false;

  const type = piece.type;

  // P/E/Z/IZ: 2级移除
  if ((type === 'P' || type === 'E' || type === 'Z' || type === 'IZ') && poisonCount >= 2) return true;
  // N: 2级移除
  if (type === 'N' && poisonCount >= 2) return true;
  // B: 3级移除
  if (type === 'B' && poisonCount >= 3) return true;
  // R: 3级移除
  if (type === 'R' && poisonCount >= 3) return true;
  // Q/O: 4级移除
  if ((type === 'Q' || type === 'O') && poisonCount >= 4) return true;
  // T/Y/L/A: 7级移除
  if ((type === 'T' || type === 'Y' || type === 'L' || type === 'A') && poisonCount >= 7) return true;
  // C: 7级移除
  if (type === 'C' && poisonCount >= 7) return true;
  // H: 1级移除
  if (type === 'H' && poisonCount >= 1) return true;
  // M: 8级移除
  if (type === 'M' && poisonCount >= 8) return true;

  return false;
}

// ============================================================
// 升变规则
// ============================================================

/** 兵可以升变的棋子（P不能→C） */
export const PAWN_PROMOTIONS: PieceType[] = ['R', 'N', 'Q', 'E', 'B'];

/** 象可以升变的棋子 */
export const ELEPHANT_PROMOTIONS: PieceType[] = [
  'R', 'N', 'C', 'Q', 'T', 'Y', 'L', 'A', 'B', 'M', 'X', 'O', 'E', 'J',
];

/** 兵是否需要升变 */
export function pawnMustPromote(piece: Piece, pos: Position): boolean {
  if (piece.type !== 'P') return false;
  return pos.row === enemyBaseline(piece.owner);
}

/** 象是否需要升变 */
export function elephantMustPromote(piece: Piece, pos: Position): boolean {
  if (piece.type !== 'E') return false;
  return pos.row === enemyBaseline(piece.owner);
}

/** 骷髅兵是否需要升变为反女巫 */
export function skeletonMustPromote(piece: Piece, pos: Position): boolean {
  if (piece.type !== 'Z') return false;
  return pos.row === enemyBaseline(piece.owner);
}

/** 反骷髅兵是否需要升变为女巫 */
export function antiSkeletonMustPromote(piece: Piece, pos: Position): boolean {
  if (piece.type !== 'IZ') return false;
  return pos.row === baseline(piece.owner); // 到己方底线
}

// ============================================================
// 猫娘规则
// ============================================================

/** 检查己方是否有鸵鸟 */
export function hasOwnOstrich(board: Board, player: Player): boolean {
  const pieces = findAllPieces(board, player);
  return pieces.some(p => p.piece.type === 'O');
}

/** 王自动变为猫娘的条件：己方有鸵鸟 */
export function shouldBecomeCatgirl(board: Board, player: Player): boolean {
  return hasOwnOstrich(board, player);
}

/** 将场上所有己方 K 变为 G */
export function transformKingToCatgirl(board: Board, player: Player): Board {
  const newBoard = cloneBoard(board);
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(newBoard, { row, col });
      if (p && p.owner === player && p.type === 'K') {
        newBoard[row][col] = { type: 'G', owner: player };
      }
    }
  }
  return newBoard;
}

/** 将场上的 G 变回 K（鸵鸟消失时） */
export function transformCatgirlToKing(board: Board, player: Player): Board {
  const newBoard = cloneBoard(board);
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(newBoard, { row, col });
      if (p && p.owner === player && p.type === 'G') {
        newBoard[row][col] = { type: 'K', owner: player };
      }
    }
  }
  return newBoard;
}

/** 将场上的 O 变回 Q（鸵鸟决定变回后时） */
export function transformOstrichToQueen(board: Board, player: Player): Board {
  const newBoard = cloneBoard(board);
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(newBoard, { row, col });
      if (p && p.owner === player && p.type === 'O') {
        newBoard[row][col] = { type: 'Q', owner: player };
      }
    }
  }
  return newBoard;
}

// 非关键棋子种类映射：IW→W, IZ→Z；关键棋子(K,G,U,S)不计入
const NON_CRITICAL_VARIETY_MAP: Record<string, string> = {
  Q:'Q',R:'R',B:'B',N:'N',P:'P',T:'T',Y:'Y',M:'M',E:'E',L:'L',A:'A',C:'C',
  W:'W',IW:'W',Z:'Z',IZ:'Z',J:'J',H:'H',X:'X',O:'O',
};

/** 统计玩家当前拥有的非关键棋子种类数 / 总种类数(18) */
export function getNonCriticalVariety(board: Board, player: Player): { current: number; total: number } {
  const types = new Set<string>();
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.owner === player) {
        const mapped = NON_CRITICAL_VARIETY_MAP[p.type];
        if (mapped) types.add(mapped);
      }
    }
  }
  return { current: types.size, total: 18 };
}

/** 检查玩家是否可以合成星舰（太空人 + 所有18种非关键棋子） */
export function canSynthesizeStarship(board: Board, player: Player): boolean {
  const { current, total } = getNonCriticalVariety(board, player);
  return current >= total && findAllPieces(board, player).some(p => p.piece.type === 'U');
}

// ============================================================
// 巨鲸排斥领域
// ============================================================

/** 获取棋盘上所有巨鲸的排斥区（周围8格），可指定玩家过滤 */
export function getWhaleZones(board: Board, owner?: Player): Set<string> {
  const zones = new Set<string>();
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.type === 'H' && (!owner || p.owner === owner)) {
        for (const adj of getSurrounding8({ row, col })) {
          zones.add(`${adj.row},${adj.col}`);
        }
      }
    }
  }
  return zones;
}

/** 过滤掉进入巨鲸排斥区的走法
 *  规则：其他棋子无法移动到巨鲸周围 8 格（含己方和敌方巨鲸）
 *  巨鲸自身不受限制 */
export function filterWhaleZones(
  board: Board,
  _player: Player,
  moves: { to: Position; isCapture: boolean }[],
  pieceType?: PieceType,
): { to: Position; isCapture: boolean }[] {
  // 巨鲸自身不受排斥区影响
  if (pieceType === 'H') return moves;

  // 获取所有巨鲸的排斥区（含己方和敌方）
  const allZones = getWhaleZones(board);
  return moves.filter(m => {
    // 吃子时允许进入巨鲸区域
    if (m.isCapture) return true;
    if (allZones.has(`${m.to.row},${m.to.col}`)) {
      return false;
    }
    return true;
  });
}

// ============================================================
// 鸵鸟安全区（计算敌方全体攻击范围）
// ============================================================

/** 计算某玩家的所有棋子的攻击范围（所有可达吃子位置） */
export function getAttackRange(board: Board, player: Player): Set<string> {
  const range = new Set<string>();
  const pieces = findAllPieces(board, player);
  for (const { piece, pos } of pieces) {
    if (piece.type === 'T') continue; // 猫无攻击范围
    // 直接使用分离后的 getCaptures，更精确
    const caps = getCaptures(board, pos, piece);
    for (const to of caps) {
      range.add(`${to.row},${to.col}`);
    }
  }
  return range;
}

/** 过滤鸵鸟不能进入的格子 */
export function filterOstrichDanger(
  board: Board,
  player: Player,
  moves: { to: Position; isCapture: boolean }[],
): { to: Position; isCapture: boolean }[] {
  const enemyRange = getAttackRange(board, opponent(player));
  return moves.filter(m => !enemyRange.has(`${m.to.row},${m.to.col}`));
}

// ============================================================
// 奶酪效果
// ============================================================

/** 应用奶酪效果 */
export function applyCheese(
  state: GameState,
  pos: Position,
  cheeseType: CheeseType,
  mouseOwner: Player,
  mousePiece: Piece,
): GameState {
  const newState = { ...state, poison: { ...state.poison } };
  const key = pieceKey(mousePiece, pos);

  switch (cheeseType) {
    case 'CY': // 黄奶酪：减少1次中毒
      newState.poison[key] = Math.max(0, (state.poison[key] || 0) - 1);
      break;
    case 'CO': // 橙奶酪：减少4次中毒
      newState.poison[key] = Math.max(0, (state.poison[key] || 0) - 4);
      break;
    case 'CB': // 蓝奶酪：下回合对手可操纵这只老鼠
      newState.blueCheeseControl = opponent(mouseOwner);
      newState.blueCheeseMouseKey = pieceKey(mousePiece, pos);
      break;
    case 'CP': // 紫奶酪：增加2次中毒
      newState.poison[key] = (state.poison[key] || 0) + 2;
      break;
    case 'CK': // 黑奶酪：增加8次中毒
      newState.poison[key] = (state.poison[key] || 0) + 8;
      break;
  }

  // 奶酪已被老鼠踏入（棋子已占据该格，无需修改棋盘）
  return newState;
}

// ============================================================
// 圣骑士清除
// ============================================================

/** 圣骑士移动后清除周围8格毒药和敌方骷髅/反骷髅，周围4格敌方女巫/反女巫 */
export function paladinCleanse(board: Board, player: Player, pos: Position): Board {
  const newBoard = cloneBoard(board);

  // 清除周围8格毒药
  for (const adj of getSurrounding8(pos)) {
    const cell = newBoard[adj.row][adj.col];
    if (cell === 'poison') {
      newBoard[adj.row][adj.col] = null;
    }
    // 清除敌方骷髅/反骷髅
    const p = getPiece(newBoard, adj);
    if (p && p.owner !== player && (p.type === 'Z' || p.type === 'IZ')) {
      newBoard[adj.row][adj.col] = null;
    }
  }

  // 清除周围4格敌方女巫/反女巫
  for (const adj of getSurrounding4(pos)) {
    const p = getPiece(newBoard, adj);
    if (p && p.owner !== player && (p.type === 'W' || p.type === 'IW')) {
      newBoard[adj.row][adj.col] = null;
    }
  }

  return newBoard;
}

// ============================================================
// 巨鲸移动后清除效果
// ============================================================

/** 巨鲸移动后清除前缘3格中的敌方棋子
 *  巨鲸是3×3大棋子，从from移到to后，3个前缘格中的敌方棋子被清除。
 */
export function whaleCleanse(board: Board, player: Player, from: Position, to: Position): Board {
  const newBoard = cloneBoard(board);
  const dr = to.row - from.row;
  const dc = to.col - from.col;

  // 计算3个前缘格子
  let leadingCells: Position[];
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

  for (const cell of leadingCells) {
    if (inBounds(cell)) {
      const p = getPiece(newBoard, cell);
      if (p && p.owner !== player) {
        newBoard[cell.row][cell.col] = null;
      }
    }
  }
  return newBoard;
}

// ============================================================
// 缅因猫恐惧射线
// ============================================================

/** 缅因猫移动后向8方向发射射线，第一个遇到的敌方老鼠恐惧1回合 */
export function maineCoonFear(
  board: Board,
  player: Player,
  pos: Position,
  fears: FearMap,
): FearMap {
  const newFears = { ...fears };
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  for (const [dr, dc] of dirs) {
    for (let i = 1; i < BOARD_SIZE; i++) {
      const to = { row: pos.row + dr * i, col: pos.col + dc * i };
      if (!inBounds(to)) break;
      const p = getPiece(board, to);
      if (p) {
        if (p.owner !== player && p.type === 'M') {
          newFears[pieceKey(p, to)] = 2; // 恐惧1回合（设为2以跨过本回合递减）
        }
        break; // 遇到任何棋子停止
      }
    }
  }

  return newFears;
}

// ============================================================
// 天线推子
// ============================================================

/** 获取天线可推的相邻棋子（方向：把左边甩到右边） */
export function getAntennaPushTargets(
  board: Board,
  antennaPos: Position,
): { from: Position; to: Position; piece: Piece }[] {
  const targets: { from: Position; to: Position; piece: Piece }[] = [];
  const adjDirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
  
  // 获取所有巨鲸排斥区，推子目标不能进入巨鲸区
  const whaleZones = getWhaleZones(board);
  
  for (const [adr, adc] of adjDirs) {
    const adjPos = { row: antennaPos.row + adr, col: antennaPos.col + adc };
    const adjPiece = getPiece(board, adjPos);
    if (!adjPiece) continue;
    
    // 推子目标：棋子向对面方向移2格（反射过天线位置）
    const pushTarget = { row: antennaPos.row - adr, col: antennaPos.col - adc };
    if (!inBounds(pushTarget)) continue;
    if (!isEmpty(board, pushTarget)) continue;
    // 不可推入巨鲸排斥区
    if (whaleZones.has(`${pushTarget.row},${pushTarget.col}`)) continue;
    
    targets.push({
      from: adjPos,
      to: pushTarget,
      piece: adjPiece,
    });
  }
  
  return targets;
}

// ============================================================
// 破译检测
// ============================================================

/** 检查玩家是否可以发动破译 */
export function canDecrypt(board: Board, player: Player): boolean {
  // 需要己方至少两个天线，且它们的理论移动范围内都存在己方火箭
  const antennas: Position[] = [];
  const rockets: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const p = getPiece(board, { row, col });
      if (p && p.owner === player) {
        if (p.type === 'A') antennas.push({ row, col });
        if (p.type === 'X') rockets.push({ row, col });
      }
    }
  }

  if (antennas.length < 2 || rockets.length === 0) return false;

  // 天线理论可达范围（跳跃+1格，不考虑棋子阻挡）
  const jumpDirs: [number, number][] = [
    [2, -1], [2, 1], [-2, -1], [-2, 1],
    [0, 2], [0, -2],
  ];
  const adjDirs: [number, number][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  let count = 0;
  for (const aPos of antennas) {
    const reachable = new Set<string>();
    for (const [dr, dc] of jumpDirs) {
      const to = { row: aPos.row + dr, col: aPos.col + dc };
      if (inBounds(to)) reachable.add(`${to.row},${to.col}`);
    }
    for (const [dr, dc] of adjDirs) {
      const to = { row: aPos.row + dr, col: aPos.col + dc };
      if (inBounds(to)) reachable.add(`${to.row},${to.col}`);
    }
    for (const rPos of rockets) {
      if (reachable.has(`${rPos.row},${rPos.col}`)) {
        count++;
        break;
      }
    }
  }

  return count >= 2;
}
