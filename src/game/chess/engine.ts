// ============================================================
// 复合象棋 — 游戏引擎
// ============================================================

import type {
  Board, Position, Player, Piece, GameState,
  Move, HistoryEntry,
} from './types';
import {
  BOARD_SIZE, ENGLISH_VULNERABLE,
} from './types';
import {
  inBounds, getPiece, isEmpty, cloneBoard,
  opponent, findAllPieces, findCriticalPieces,
  pieceKey, computeStateHash,
} from './board';
import { getRawMoves } from './moves';
import {
  pawnMustPromote, elephantMustPromote,
  skeletonMustPromote, antiSkeletonMustPromote,
  transformKingToCatgirl,
  transformCatgirlToKing, hasOwnOstrich,
  filterWhaleZones,
  filterOstrichDanger, getAttackRange,
  applyCheese, paladinCleanse, whaleCleanse,
  maineCoonFear,
  isPoisonedRemoved,
} from './rules';

// ============================================================
// 自将军检测：执行某走法后是否己方被将军
// ============================================================

function isKingSafeAfterMove(
  board: Board,
  player: Player,
  from: Position,
  to: Position,
  poisonMap?: Record<string, number>,
): boolean {
  // 模拟执行走法
  const simBoard = cloneBoard(board);
  const piece = simBoard[from.row][from.col] as Piece;
  simBoard[to.row][to.col] = piece;
  simBoard[from.row][from.col] = null;

  // 模拟英语捕捉：仅 * 棋子进入敌方英语十字1-2格会被消灭
  if (ENGLISH_VULNERABLE.includes(piece.type)) {
    englishLoop: for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const ep = getPiece(simBoard, { row, col });
        if (ep && ep.owner !== player && ep.type === 'L') {
          // 检查英语是否因中毒失去技能
          if (poisonMap) {
            const lKey = pieceKey(ep, { row, col });
            if ((poisonMap[lKey] || 0) >= 4) continue;
          }
          const dr = Math.abs(to.row - row);
          const dc = Math.abs(to.col - col);
          if ((dr <= 2 && dc === 0) || (dc <= 2 && dr === 0)) {
            simBoard[to.row][to.col] = null;
            break englishLoop;
          }
        }
      }
    }
  }

  // 关键棋子：检查移动后是否被攻击
  const criticals = findCriticalPieces(simBoard, player);
  if (criticals.length === 0) return false; // 没有关键棋子 = 已被将死

  const enemyRange = getAttackRange(simBoard, opponent(player));

  for (const cPos of criticals) {
    if (enemyRange.has(`${cPos.row},${cPos.col}`)) {
      return false;
    }
  }

  return true;
}

// ============================================================
// 获取某格子的所有合法走法（用于玩家交互）
// ============================================================

export function getLegalMoves(
  state: GameState,
  pos: Position,
): { to: Position; isCapture: boolean }[] {
  const { board, currentPlayer, poison, fears } = state;
  const piece = getPiece(board, pos);
  if (!piece) return [];

  // 蓝奶酪控制：对手可操作被控制的老鼠
  const isBlueCheeseMouse = piece.type === 'M' && state.blueCheeseMouseKey !== null && state.blueCheeseMouseKey === pieceKey(piece, pos) && piece.owner !== currentPlayer;
  if (!isBlueCheeseMouse && piece.owner !== currentPlayer) return [];

  if (piece.type === 'X') return []; // 火箭不可主动移动

  const key = pieceKey(piece, pos);
  const poisonCount = poison[key] || 0;

  // 检查中毒是否导致被移除
  if (isPoisonedRemoved(piece, poisonCount)) return [];

  // 老鼠恐惧：被恐惧的老鼠无法移动
  if (piece.type === 'M' && (fears[key] || 0) > 0) return [];

  // 蓝奶酪：原主人不能操作被控制的老鼠
  if (piece.type === 'M' && piece.owner === currentPlayer && state.blueCheeseMouseKey !== null && state.blueCheeseControl === opponent(currentPlayer)) {
    return [];
  }

  let moves = getRawMoves(board, pos, piece, poisonCount);

  // 鸵鸟过滤：不可入敌方攻击范围
  if (piece.type === 'O') {
    moves = filterOstrichDanger(board, currentPlayer, moves);
  }

  // 巨鲸排斥：不可进入巨鲸周围8格（含己方和敌方）
  moves = filterWhaleZones(board, currentPlayer, moves, piece.type);

  // 过滤自将军
  moves = moves.filter(m => isKingSafeAfterMove(board, currentPlayer, pos, m.to, poison));

  return moves;
}

// ============================================================
// 将军检测
// ============================================================

export function isCheck(board: Board, player: Player): boolean {
  const criticals = findCriticalPieces(board, player);
  if (criticals.length === 0) return true; // 没有关键棋子就是被将死
  const enemyRange = getAttackRange(board, opponent(player));
  return criticals.some(cPos => enemyRange.has(`${cPos.row},${cPos.col}`));
}

// ============================================================
// 将死 / 逼和 / 无合法走法检测
// ============================================================

/** 检查玩家是否没有任何合法走法 */
export function hasNoLegalMoves(state: GameState, player: Player): boolean {
  const pieces = findAllPieces(state.board, player);
  for (const { pos } of pieces) {
    const moves = getLegalMoves(state, pos);
    if (moves.length > 0) return false;
  }
  return true;
}

/** 将死：无合法走法 + 被将军 */
export function isCheckmate(state: GameState, player: Player): boolean {
  return hasNoLegalMoves(state, player) && isCheck(state.board, player);
}

/** 逼和：无合法走法 + 未被将军 */
export function isStalemate(state: GameState, player: Player): boolean {
  return hasNoLegalMoves(state, player) && !isCheck(state.board, player);
}

/**
 * 终局检测 + 三次重复 → 封装函数
 * 供 executeMove 中正常走子/女巫技能共用
 */
function finalizeMove(newState: GameState, oldState: GameState): GameState {
  const nextPlayer = newState.currentPlayer;
  if (isCheckmate(newState, nextPlayer)) {
    newState.phase = nextPlayer === 'white' ? 'black_wins' : 'white_wins';
  } else if (isStalemate(newState, nextPlayer)) {
    newState.phase = 'draw';
  }

  // 三次重复局面检测
  const prevHashes = oldState.stateHashes || [];
  const hash = computeStateHash(newState);
  newState.stateHashes = [...prevHashes, hash];
  let hashCount = 0;
  for (const h of newState.stateHashes) {
    if (h === hash) hashCount++;
  }
  if (hashCount >= 3 && newState.phase === 'playing') {
    newState.phase = 'draw';
  }

  return newState;
}

// ============================================================
// 执行走法
// ============================================================

export function executeMove(state: GameState, move: Move): GameState {
  const { board, currentPlayer } = state;
  const { from, to } = move;

  const piece = getPiece(board, from);
  if (!piece) return state;

  let newState: GameState = {
    ...state,
    board: cloneBoard(board),
    poison: { ...state.poison },
    fears: { ...state.fears },
    history: [...state.history],
  };

  const player = currentPlayer;
  const key = pieceKey(piece, from);

  // ---- 特殊行动：破译 ----
  if (move.isDecryption) {
    newState.decryptionActive = true;
    newState.decryptionStep = 1;
    // 破译消耗当前行动，切换回合给对手（步骤2）
    newState.currentPlayer = opponent(currentPlayer);
    newState.moveCount++;
    newState.clock = { ...state.clock };
    newState.clockAccelStep = { ...state.clockAccelStep };
    newState.clockPoolMs = state.clockPoolMs;
    newState.clockPerMoveMs = state.clockPerMoveMs;
    newState.clockBountyCells = { ...state.clockBountyCells };
    const dEntry: HistoryEntry = {
      move,
      boardBefore: cloneBoard(board),
      poisonBefore: { ...state.poison },
      fearsBefore: { ...state.fears },
      hasOstrichBefore: { ...state.hasOstrich },
      rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
      decryptionActiveBefore: state.decryptionActive,
      decryptionStepBefore: state.decryptionStep,
      blueCheeseControlBefore: state.blueCheeseControl,
      blueCheeseMouseKeyBefore: state.blueCheeseMouseKey,
      sacrificeCountBefore: { ...state.sacrificeCount },
      clockBefore: { ...state.clock },
      clockAccelStepBefore: { ...state.clockAccelStep },
      clockPoolMsBefore: state.clockPoolMs,
      clockPerMoveMsBefore: state.clockPerMoveMs,
      clockBountyCellsBefore: { ...state.clockBountyCells },
    };
    newState.history.push(dEntry);
    return newState;
  }

  // ---- 女巫技能 ----
  if ((piece.type === 'W' || piece.type === 'IW') && move.isWitchSkill) {
    // 保存献祭次数用于历史
    newState.sacrificeCount = { ...state.sacrificeCount };

    if (move.isWitchSkill === 'sacrifice' && move.witchSkillTarget) {
      // 献祭：移除己方 Z/IZ，獻祭次数 +1
      newState.board[move.witchSkillTarget.row][move.witchSkillTarget.col] = null;
      newState.sacrificeCount[player] = (state.sacrificeCount[player] || 0) + 1;
    } else if (move.isWitchSkill === 'poison' && move.witchSkillTarget) {
      // 在目标空格放置毒药
      newState.board[move.witchSkillTarget.row][move.witchSkillTarget.col] = 'poison';
    } else if (move.isWitchSkill === 'self_destruct') {
      // 自爆：女巫→骷髅兵 / 反女巫→反骷髅兵，左右格各放1个
      const isWitch = piece.type === 'W';
      const spawnType = isWitch ? 'Z' : 'IZ';
      newState.board[from.row][from.col] = { type: spawnType, owner: player };
      const leftPos = { row: from.row, col: from.col - 1 };
      const rightPos = { row: from.row, col: from.col + 1 };
      if (inBounds(leftPos) && isEmpty(newState.board, leftPos)) {
        newState.board[leftPos.row][leftPos.col] = { type: spawnType, owner: player };
      }
      if (inBounds(rightPos) && isEmpty(newState.board, rightPos)) {
        newState.board[rightPos.row][rightPos.col] = { type: spawnType, owner: player };
      }
    } else if (move.isWitchSkill === 'make_cheese' && move.witchSkillTarget) {
      // 制作奶酪：在目标空格放置指定奶酪
      const cheeseType = move.cheeseType || 'CY';
      newState.board[move.witchSkillTarget.row][move.witchSkillTarget.col] = cheeseType;
      // 橙/黑奶酪消耗献祭次数
      if (cheeseType === 'CO' || cheeseType === 'CK') {
        newState.sacrificeCount[player] = Math.max(0, (state.sacrificeCount[player] || 0) - 1);
      }
    }
    // 女巫技能不移动位置，结束当前回合
    newState.currentPlayer = opponent(currentPlayer);
    newState.moveCount++;

    // 记录历史
    const entry: HistoryEntry = {
      move,
      boardBefore: cloneBoard(board),
      poisonBefore: { ...state.poison },
      fearsBefore: { ...state.fears },
      hasOstrichBefore: { ...state.hasOstrich },
      rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
      decryptionActiveBefore: state.decryptionActive,
      decryptionStepBefore: state.decryptionStep,
      blueCheeseControlBefore: state.blueCheeseControl,
      blueCheeseMouseKeyBefore: state.blueCheeseMouseKey,
      sacrificeCountBefore: { ...state.sacrificeCount },
      clockBefore: { ...state.clock },
      clockAccelStepBefore: { ...state.clockAccelStep },
      clockPoolMsBefore: state.clockPoolMs,
      clockPerMoveMsBefore: state.clockPerMoveMs,
      clockBountyCellsBefore: { ...state.clockBountyCells },
    };
    newState.history.push(entry);
    // 检测终局
    return finalizeMove(newState, state);
  }

  // ---- 后变鸵鸟 ----
  if (move.isQueenToOstrich && piece.type === 'Q') {
    newState.board[from.row][from.col] = { type: 'O', owner: player };
    newState.currentPlayer = opponent(currentPlayer);
    newState.moveCount++;
    const qEntry: HistoryEntry = {
      move,
      boardBefore: cloneBoard(board),
      poisonBefore: { ...state.poison },
      fearsBefore: { ...state.fears },
      hasOstrichBefore: { ...state.hasOstrich },
      rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
      decryptionActiveBefore: state.decryptionActive,
      decryptionStepBefore: state.decryptionStep,
      blueCheeseControlBefore: state.blueCheeseControl,
      blueCheeseMouseKeyBefore: state.blueCheeseMouseKey,
      sacrificeCountBefore: { ...state.sacrificeCount },
      clockBefore: { ...state.clock },
      clockAccelStepBefore: { ...state.clockAccelStep },
      clockPoolMsBefore: state.clockPoolMs,
      clockPerMoveMsBefore: state.clockPerMoveMs,
      clockBountyCellsBefore: { ...state.clockBountyCells },
    };
    newState.history.push(qEntry);

    // ---- 猫娘规则：Q→O 后触发 ----
    const hasO = hasOwnOstrich(newState.board, 'white');
    const hasOb = hasOwnOstrich(newState.board, 'black');
    if (hasO && !newState.hasOstrich.white) {
      newState.board = transformKingToCatgirl(newState.board, 'white');
    } else if (!hasO && newState.hasOstrich.white) {
      newState.board = transformCatgirlToKing(newState.board, 'white');
    }
    if (hasOb && !newState.hasOstrich.black) {
      newState.board = transformKingToCatgirl(newState.board, 'black');
    } else if (!hasOb && newState.hasOstrich.black) {
      newState.board = transformCatgirlToKing(newState.board, 'black');
    }
    newState.hasOstrich = { white: hasO, black: hasOb };

    return finalizeMove(newState, state);
  }

  // ---- 鸵鸟变回后 ----
  if (move.isOstrichToQueen && piece.type === 'O') {
    newState.board[from.row][from.col] = { type: 'Q', owner: player };
    newState.currentPlayer = opponent(currentPlayer);
    newState.moveCount++;

    // 猫娘同步变回王
    const hasO = hasOwnOstrich(newState.board, 'white');
    const hasOb = hasOwnOstrich(newState.board, 'black');
    if (!hasO && newState.hasOstrich.white) {
      newState.board = transformCatgirlToKing(newState.board, 'white');
    }
    if (!hasOb && newState.hasOstrich.black) {
      newState.board = transformCatgirlToKing(newState.board, 'black');
    }
    newState.hasOstrich = { white: hasO, black: hasOb };

    const oEntry: HistoryEntry = {
      move,
      boardBefore: cloneBoard(board),
      poisonBefore: { ...state.poison },
      fearsBefore: { ...state.fears },
      hasOstrichBefore: { ...state.hasOstrich },
      rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
      decryptionActiveBefore: state.decryptionActive,
      decryptionStepBefore: state.decryptionStep,
      blueCheeseControlBefore: state.blueCheeseControl,
      blueCheeseMouseKeyBefore: state.blueCheeseMouseKey,
      sacrificeCountBefore: { ...state.sacrificeCount },
      clockBefore: { ...state.clock },
      clockAccelStepBefore: { ...state.clockAccelStep },
      clockPoolMsBefore: state.clockPoolMs,
      clockPerMoveMsBefore: state.clockPerMoveMs,
      clockBountyCellsBefore: { ...state.clockBountyCells },
    };
    newState.history.push(oEntry);
    return finalizeMove(newState, state);
  }

  // ---- 星舰部署（不移动星舰，在目标空格放置非关键棋子） ----
  if (move.isStarshipDeploy && piece.type === 'S' && move.starshipDeployType) {
    if (isEmpty(newState.board, to)) {
      newState.board[to.row][to.col] = { type: move.starshipDeployType, owner: player };
    }
    newState.currentPlayer = opponent(currentPlayer);
    newState.moveCount++;
    const sEntry: HistoryEntry = {
      move,
      boardBefore: cloneBoard(board),
      poisonBefore: { ...state.poison },
      fearsBefore: { ...state.fears },
      hasOstrichBefore: { ...state.hasOstrich },
      rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
      decryptionActiveBefore: state.decryptionActive,
      decryptionStepBefore: state.decryptionStep,
      blueCheeseControlBefore: state.blueCheeseControl,
      blueCheeseMouseKeyBefore: state.blueCheeseMouseKey,
      sacrificeCountBefore: { ...state.sacrificeCount },
      clockBefore: { ...state.clock },
      clockAccelStepBefore: { ...state.clockAccelStep },
      clockPoolMsBefore: state.clockPoolMs,
      clockPerMoveMsBefore: state.clockPerMoveMs,
      clockBountyCellsBefore: { ...state.clockBountyCells },
    };
    newState.history.push(sEntry);
    return finalizeMove(newState, state);
  }

  // ---- 太空人合成星舰 ----
  if (move.isSpacemanToStarship && piece.type === 'U') {
    newState.board[from.row][from.col] = { type: 'S', owner: player };
    newState.currentPlayer = opponent(currentPlayer);
    newState.moveCount++;
    const uEntry: HistoryEntry = {
      move,
      boardBefore: cloneBoard(board),
      poisonBefore: { ...state.poison },
      fearsBefore: { ...state.fears },
      hasOstrichBefore: { ...state.hasOstrich },
      rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
      decryptionActiveBefore: state.decryptionActive,
      decryptionStepBefore: state.decryptionStep,
      blueCheeseControlBefore: state.blueCheeseControl,
      blueCheeseMouseKeyBefore: state.blueCheeseMouseKey,
      sacrificeCountBefore: { ...state.sacrificeCount },
      clockBefore: { ...state.clock },
      clockAccelStepBefore: { ...state.clockAccelStep },
      clockPoolMsBefore: state.clockPoolMs,
      clockPerMoveMsBefore: state.clockPerMoveMs,
      clockBountyCellsBefore: { ...state.clockBountyCells },
    };
    newState.history.push(uEntry);
    return finalizeMove(newState, state);
  }

  // ---- 升变检查（检查目标位置是否在底线） ----
  const needsPromotion =
    (pawnMustPromote(piece, to) || elephantMustPromote(piece, to) ||
     skeletonMustPromote(piece, to) || antiSkeletonMustPromote(piece, to));

  // ---- 保存旧位置的中毒次数（移动后转移） ----
  const oldPoisonCount = newState.poison[key] || 0;

  // ---- 执行走子 ----
  const captured = getPiece(newState.board, to);

  // 如果目标格有对方棋子，检查中毒状态（继承给老鼠）
  let inheritedPoison = 0;
  if (captured && captured.type === 'M') {
    const capturedKey = pieceKey(captured, to);
    const capturedPoison = state.poison[capturedKey] || 0;
    if (capturedPoison > 0) {
      inheritedPoison = capturedPoison;
    }
  }

  newState.board[to.row][to.col] = piece;
  newState.board[from.row][from.col] = null;

  // 转移中毒次数到新位置
  const newKey = pieceKey(piece, to);
  const totalTransferred = oldPoisonCount + inheritedPoison;
  if (totalTransferred > 0) {
    newState.poison[newKey] = (newState.poison[newKey] || 0) + totalTransferred;
    delete newState.poison[key];
  }

  // ---- 处理升变（E→E 时不重复转移中毒，避免同键删除） ----
  if (needsPromotion && move.promoteTo) {
    newState.board[to.row][to.col] = { type: move.promoteTo, owner: player };
    // 升变后更新 key 引用
    const promoKey = pieceKey({ type: move.promoteTo, owner: player }, to);
    if (newState.poison[newKey] && promoKey !== newKey) {
      newState.poison[promoKey] = newState.poison[newKey];
      delete newState.poison[newKey];
    }
  } else if (skeletonMustPromote(piece, to)) {
    // 骷髅兵到对方底线必须升变为反女巫
    newState.board[to.row][to.col] = { type: 'IW', owner: player };
    const promoKey = pieceKey({ type: 'IW', owner: player }, to);
    if (newState.poison[newKey]) {
      newState.poison[promoKey] = newState.poison[newKey];
      delete newState.poison[newKey];
    }
  } else if (antiSkeletonMustPromote(piece, to)) {
    // 反骷髅兵到己方底线必须升变为女巫
    newState.board[to.row][to.col] = { type: 'W', owner: player };
    const promoKey = pieceKey({ type: 'W', owner: player }, to);
    if (newState.poison[newKey]) {
      newState.poison[promoKey] = newState.poison[newKey];
      delete newState.poison[newKey];
    }
  }

  // ---- 火箭被吃同归于尽（王吃己方火箭除外→合成太空人） ----
  const movedPiece = getPiece(newState.board, to);
  if (captured && captured.type === 'X') {
    const isKingOwnRocket = movedPiece && movedPiece.type === 'K' && captured.owner === player;
    if (isKingOwnRocket) {
      // 王吃己方火箭 → 合成太空人
      newState.board[to.row][to.col] = { type: 'U', owner: player };
      newState.rocketPos = { ...state.rocketPos, [player]: null };
    } else {
      // 任意其他棋子吃火箭 → 吃子方一并被移除（同归于尽）
      newState.board[to.row][to.col] = null;
      // 清理中毒标记
      const deadKey = movedPiece ? pieceKey(movedPiece, to) : null;
      if (deadKey && newState.poison[deadKey]) delete newState.poison[deadKey];
      // 清空被吃火箭方的 rocketPos（己方或敌方）
      newState.rocketPos = { ...state.rocketPos, [captured.owner]: null };
    }
  }

  // ---- 后 Q 变鸵鸟 O 的触发（在移动前选择） ----
  // 此功能需要 UI 交互支持，通过 move 中的特殊标记实现
  // 简化处理：在 UI 中提供按钮

  // ---- 检测是否有鸵鸟（影响猫娘规则） ----
  const hasO = hasOwnOstrich(newState.board, 'white');
  const hasOb = hasOwnOstrich(newState.board, 'black');

  // ---- 猫娘规则：有鸵鸟→王变猫娘；无鸵鸟→猫娘变王 ----
  if (hasO && !newState.hasOstrich.white) {
    newState.board = transformKingToCatgirl(newState.board, 'white');
  } else if (!hasO && newState.hasOstrich.white) {
    newState.board = transformCatgirlToKing(newState.board, 'white');
  }
  if (hasOb && !newState.hasOstrich.black) {
    newState.board = transformKingToCatgirl(newState.board, 'black');
  } else if (!hasOb && newState.hasOstrich.black) {
    newState.board = transformCatgirlToKing(newState.board, 'black');
  }
  newState.hasOstrich = { white: hasO, black: hasOb };

  // ---- 处理踏中毒药 ----
  const finalPiece = getPiece(newState.board, to);
  const beforeCell = board[to.row][to.col];
  if (finalPiece && beforeCell === 'poison') {
    const fKey = pieceKey(finalPiece, to);
    newState.poison[fKey] = (newState.poison[fKey] || 0) + 1;
  }

  // ---- 处理踏奶酪 ----
  if (finalPiece && finalPiece.type === 'M') {
    const beforeCell = board[to.row][to.col];
    if (typeof beforeCell === 'string' && beforeCell.startsWith('C')) {
      newState = applyCheese(newState, to, beforeCell as 'CY' | 'CO' | 'CB' | 'CP' | 'CK', player, finalPiece);
    }
  }

  // ---- 中毒后棋子移除检查 ----
  if (finalPiece) {
    const fKey = pieceKey(finalPiece, to);
    const pCount = newState.poison[fKey] || 0;
    if (isPoisonedRemoved(finalPiece, pCount)) {
      newState.board[to.row][to.col] = null;
      delete newState.poison[fKey];
    }
  }

  // ---- 巨鲸移动后清除前缘3格中的敌方棋子 ----
  if (finalPiece && finalPiece.type === 'H') {
    newState.board = whaleCleanse(newState.board, player, from, to);
  }

  // ---- 圣骑士移动后清除 ----
  if (finalPiece && finalPiece.type === 'J') {
    newState.board = paladinCleanse(newState.board, player, to);
  }

  // ---- 缅因猫移动后恐惧射线（中毒≥4 失去技能） ----
  if (finalPiece && finalPiece.type === 'Y') {
    const yKey = pieceKey(finalPiece, to);
    const yPoison = newState.poison[yKey] || 0;
    if (yPoison < 4) {
      newState.fears = maineCoonFear(newState.board, player, to, newState.fears);
    }
  }

  // ---- 英语的特殊能力（仅 * 棋子进入敌方十字1-2格被移除，中毒≥4 失去技能） ----
  if (finalPiece && ENGLISH_VULNERABLE.includes(finalPiece.type)) {
    englishLoop: for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const ep = getPiece(newState.board, { row, col });
        if (ep && ep.owner !== player && ep.type === 'L') {
          // 检查英语是否因中毒失去技能
          const lKey = pieceKey(ep, { row, col });
          const lPoison = (newState.poison[lKey] || 0);
          if (lPoison >= 4) continue; // 失去技能，跳过
          // 检查 to 是否在英语的范围内
          const dr = Math.abs(to.row - row);
          const dc = Math.abs(to.col - col);
          if ((dr <= 2 && dc === 0) || (dc <= 2 && dr === 0)) {
            // 在英语的上下左右1-2格范围
            // 移除该棋子（被英语捕捉）
            newState.board[to.row][to.col] = null;
            break englishLoop;
          }
        }
      }
    }
  }

  // ---- 记录历史 ----
  const entry: HistoryEntry = {
    move,
    boardBefore: cloneBoard(board),
    poisonBefore: { ...state.poison },
    fearsBefore: { ...state.fears },
    captured: captured && typeof captured === 'object' ? { ...(captured as Piece) } : undefined,
    hasOstrichBefore: { ...state.hasOstrich },
    rocketPosBefore: { white: state.rocketPos.white ? { ...state.rocketPos.white } : null, black: state.rocketPos.black ? { ...state.rocketPos.black } : null },
    decryptionActiveBefore: state.decryptionActive,
    decryptionStepBefore: state.decryptionStep,
    blueCheeseControlBefore: state.blueCheeseControl,
    clockBefore: { ...state.clock },
    clockAccelStepBefore: { ...state.clockAccelStep },
    clockPoolMsBefore: state.clockPoolMs,
    clockPerMoveMsBefore: state.clockPerMoveMs,
    clockBountyCellsBefore: { ...state.clockBountyCells },
  };
  newState.history.push(entry);

  // ---- 切换回合 & 破译步骤推进 ----
  if (newState.decryptionActive) {
    if (newState.decryptionStep === 3) {
      // 第四行动（对手）完成，破译结束
      newState.decryptionActive = false;
      newState.decryptionStep = 0;
    } else {
      newState.decryptionStep = (newState.decryptionStep + 1) as 0 | 1 | 2 | 3;
    }
    newState.currentPlayer = opponent(currentPlayer);
  } else {
    newState.currentPlayer = opponent(currentPlayer);
  }
  newState.moveCount++;

  // ---- 蓝奶酪控制过期 ----
  if (newState.blueCheeseControl === opponent(newState.currentPlayer)) {
    newState.blueCheeseControl = null;
    newState.blueCheeseMouseKey = null;
  }

  // ---- 恐惧计时器 ----
  const newFears: Record<string, number> = {};
  for (const [k, v] of Object.entries(newState.fears)) {
    if (v > 1) newFears[k] = v - 1;
  }
  newState.fears = newFears;

  return finalizeMove(newState, state);
}

// ============================================================
// 撤销走法
// ============================================================

export function undoMove(state: GameState): GameState | null {
  if (state.history.length === 0) return null;

  const lastEntry = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  const prevHashes = (state.stateHashes || []).slice(0, -1);

  return {
    ...state,
    board: cloneBoard(lastEntry.boardBefore),
    currentPlayer: opponent(state.currentPlayer), // 恢复到之前的玩家
    phase: 'playing',
    moveCount: state.moveCount - 1,
    poison: lastEntry.poisonBefore ? { ...lastEntry.poisonBefore } : { ...state.poison },
    fears: lastEntry.fearsBefore ? { ...lastEntry.fearsBefore } : { ...state.fears },
    history: newHistory,
    hasOstrich: lastEntry.hasOstrichBefore ? { ...lastEntry.hasOstrichBefore } : { ...state.hasOstrich },
    rocketPos: lastEntry.rocketPosBefore
      ? { white: lastEntry.rocketPosBefore.white ? { ...lastEntry.rocketPosBefore.white } : null, black: lastEntry.rocketPosBefore.black ? { ...lastEntry.rocketPosBefore.black } : null }
      : { ...state.rocketPos },
    decryptionActive: lastEntry.decryptionActiveBefore ?? state.decryptionActive,
    decryptionStep: lastEntry.decryptionStepBefore ?? state.decryptionStep,
    blueCheeseControl: lastEntry.blueCheeseControlBefore ?? null,
    blueCheeseMouseKey: lastEntry.blueCheeseMouseKeyBefore ?? null,
    sacrificeCount: lastEntry.sacrificeCountBefore
      ? { white: lastEntry.sacrificeCountBefore.white, black: lastEntry.sacrificeCountBefore.black }
      : { white: 0, black: 0 },
    stateHashes: prevHashes,
    // 棋钟恢复
    clock: lastEntry.clockBefore
      ? { white: lastEntry.clockBefore.white, black: lastEntry.clockBefore.black }
      : { white: 0, black: 0 },
    clockAccelStep: lastEntry.clockAccelStepBefore
      ? { white: lastEntry.clockAccelStepBefore.white, black: lastEntry.clockAccelStepBefore.black }
      : { white: 0, black: 0 },
    clockPoolMs: lastEntry.clockPoolMsBefore ?? 0,
    clockPerMoveMs: lastEntry.clockPerMoveMsBefore ?? 0,
    clockBountyCells: lastEntry.clockBountyCellsBefore ? { ...lastEntry.clockBountyCellsBefore } : {},
  };
}
