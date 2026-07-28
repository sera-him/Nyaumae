// ============================================================
// 概率三子棋 — AI 系统（含技能使用）
// ============================================================

import type { TTT3GameState, TTT3Player, CellValue, Skill } from './types';
import { Skill as SkillEnum, Profession as ProfessionEnum } from './types';
import {
  computeFinalProb, placePiece, endTurn, deepCloneState,
  canUseSkill, getProfCost,
} from './engine';
import { randMod } from './probGen';

export interface AIAction {
  type: 'move' | 'skill' | 'buy_prof';
  move?: number;
  skill?: Skill;
  params?: Record<string, unknown>;
  prof?: import('./types').Profession;
  snatch?: boolean;
}

/** AI 决定本回合动作 */
export function aiDecideAction(state: TTT3GameState, player: TTT3Player, level: number): AIAction {
  const moves = getLegalMoves(state, player);
  if (moves.length === 0) {
    // Grid Rewrite 封锁中且无解锁格子：尝试解除封锁
    if (state.gridRewriteActive[player] && canUseSkill(state, SkillEnum.GRID_REWRITE, player).ok) {
      return { type: 'skill', skill: SkillEnum.GRID_REWRITE };
    }
    return { type: 'move', move: -1 };
  }

  // 如果恐惧中，只能落子
  if (state.fear[player]) {
    return { type: 'move', move: aiChooseMove(state, player, level) };
  }

  // 检查是否有立即获胜的落子
  for (const m of moves) {
    const tempBoard = [...state.board] as CellValue[];
    tempBoard[m] = (player + 1) as CellValue;
    if (checkLine(tempBoard, player)) {
      return { type: 'move', move: m };
    }
  }

  // 检查是否需要阻止对手获胜
  const opp = 1 - player as TTT3Player;
  for (const m of moves) {
    const tempBoard = [...state.board] as CellValue[];
    tempBoard[m] = (opp + 1) as CellValue;
    if (checkLine(tempBoard, opp)) {
      if (level >= 2) {
        const surgeCheck = canUseSkill(state, SkillEnum.PROB_SURGE, player);
        if (surgeCheck.ok && !state.probSurge[player]) {
          return { type: 'skill', skill: SkillEnum.PROB_SURGE };
        }
      }
      return { type: 'move', move: m };
    }
  }

  // SP 溢出避免：购买避雷针（参考 C++ aiChooseMove）
  if (level >= 2 && state.sp[player] >= state.maxSp[player] - 3 && state.sp[player] >= 10 && state.availableRods[player] < 10) {
    const needed = 10 - state.availableRods[player];
    const toBuy = Math.min(needed, Math.floor(state.sp[player] / 2));
    if (toBuy >= 3) {
      return { type: 'skill', skill: SkillEnum.BUY_ROD, params: { qty: toBuy } };
    }
  }

  // 职业购买（Lv2/Lv3 优先）
  if (level >= 2 && state.profs[player].length < 2) {
    const profAction = aiConsiderBuyProf(state, player, level);
    if (profAction) return profAction;
  }
  if (level === 1 && state.profs[player].length === 0 && randMod(100) < 20) {
    const profAction = aiConsiderBuyProf(state, player, level);
    if (profAction) return profAction;
  }

  // 根据等级选择技能策略
  if (level === 1) {
    return aiLv1SkillOrMove(state, player, moves);
  } else if (level === 2) {
    return aiLv2SkillOrMove(state, player, moves);
  } else {
    return aiLv3SkillOrMove(state, player, moves);
  }
}

/** AI 考虑购买职业 */
function aiConsiderBuyProf(state: TTT3GameState, player: TTT3Player, level: number): AIAction | null {
  const opp = 1 - player as TTT3Player;
  const allProfs = [
    ProfessionEnum.ASSASSIN,    // 5: 角落+33%
    ProfessionEnum.GAMBLER,     // 1: 失败补偿
    ProfessionEnum.INVESTOR,    // 6: SP收益
    ProfessionEnum.TYRANT,      // 3: 恐惧
    ProfessionEnum.MONK,        // 4: 恢复SP
    ProfessionEnum.MATHEMATICIAN, // 2
    ProfessionEnum.MATTHEW,     // 7
    ProfessionEnum.CAPITALIST,  // 8
  ];

  for (const prof of allProfs) {
    const owned = state.profs[player].includes(prof);
    if (owned) continue;

    const oppOwned = state.profs[opp].includes(prof);
    const cost = getProfCost(state, prof, player);
    const buyCost = getProfCost(state, prof, player, 5, 3);
    const snatchCost = getProfCost(state, prof, player, 10, 3);

    // Lv3 更倾向夺取对手职业
    if (level >= 3 && oppOwned && state.sp[player] >= snatchCost + 5) {
      return { type: 'buy_prof', prof, snatch: true };
    }

    // 优先买断（ cheaper ）
    if (oppOwned && state.sp[player] >= buyCost + 5) {
      return { type: 'buy_prof', prof, snatch: false };
    }

    // 直接购买
    if (!oppOwned && state.sp[player] >= cost + 5) {
      return { type: 'buy_prof', prof };
    }
  }

  return null;
}

/** Lv1: 随机使用技能或直接落子 */
function aiLv1SkillOrMove(state: TTT3GameState, player: TTT3Player, moves: number[]): AIAction {
  // 30% 概率尝试使用技能
  if (randMod(100) < 30) {
    const skill = pickRandomAvailableSkill(state, player);
    if (skill !== null) {
      const params = buildSkillParams(state, player, skill);
      return { type: 'skill', skill, params };
    }
  }
  return { type: 'move', move: aiLv1Random(moves) };
}

/** Lv2: 贪心策略 */
function aiLv2SkillOrMove(state: TTT3GameState, player: TTT3Player, moves: number[]): AIAction {
  const sp = state.sp[player];

  // 1. PROB_SURGE: 提高成功率
  if (canUseSkill(state, SkillEnum.PROB_SURGE, player).ok && !state.probSurge[player]) {
    return { type: 'skill', skill: SkillEnum.PROB_SURGE };
  }

  // 2. VENTURE: 如果有高概率格子
  if (canUseSkill(state, SkillEnum.VENTURE, player).ok && !state.venture[player]) {
    const maxProb = Math.max(...moves.map(m => computeFinalProb(state, player, m)));
    if (maxProb >= 50) {
      return { type: 'skill', skill: SkillEnum.VENTURE };
    }
  }

  // 3. COLLAPSE: 如果格子概率普遍较低
  if (canUseSkill(state, SkillEnum.COLLAPSE, player).ok) {
    const avgProb = moves.reduce((sum, m) => sum + state.trueR[m], 0) / moves.length;
    if (avgProb < 35) {
      return { type: 'skill', skill: SkillEnum.COLLAPSE };
    }
  }

  // 4. SPATIAL_SEAL: 封锁对手最有威胁的格子
  const sealTarget = findOpponentThreat(state, player);
  if (sealTarget !== null && canUseSkill(state, SkillEnum.SPATIAL_SEAL, player).ok) {
    return { type: 'skill', skill: SkillEnum.SPATIAL_SEAL, params: { pos: sealTarget } };
  }

  // 5. MIND_MAZE: 如果对手有很多好选择
  if (canUseSkill(state, SkillEnum.MIND_MAZE, player).ok && state.mindMaze[player] === 0) {
    const oppMoves = getLegalMoves(state, 1 - player as TTT3Player);
    if (oppMoves.length >= 4) {
      return { type: 'skill', skill: SkillEnum.MIND_MAZE };
    }
  }

  // 6. RENEW: 如果有概率很低的格子
  const renewTarget = findRenewTarget(state, player, moves);
  if (renewTarget !== null && canUseSkill(state, SkillEnum.RENEW, player).ok) {
    return { type: 'skill', skill: SkillEnum.RENEW, params: { pos: renewTarget } };
  }

  // 7. ROLLING_THUNDER: 对手棋子多且空位少
  if (canUseSkill(state, SkillEnum.ROLLING_THUNDER, player).ok) {
    const oppPieces = state.board.filter(v => v === ((1 - player) + 1)).length;
    if (oppPieces >= 2 && moves.length <= 5) {
      return { type: 'skill', skill: SkillEnum.ROLLING_THUNDER };
    }
  }

  // 8. OVERDRAFT: SP 紧缺时
  if (sp < 10 && canUseSkill(state, SkillEnum.OVERDRAFT, player).ok) {
    return { type: 'skill', skill: SkillEnum.OVERDRAFT };
  }

  // 9. 默认落子
  return { type: 'move', move: aiLv2Greedy(state, player, moves) };
}

/** Lv3: 更积极的技能策略 */
function aiLv3SkillOrMove(state: TTT3GameState, player: TTT3Player, moves: number[]): AIAction {
  const sp = state.sp[player];
  const opp = 1 - player as TTT3Player;

  // 更积极地使用 surge + venture
  if (canUseSkill(state, SkillEnum.PROB_SURGE, player).ok && !state.probSurge[player]) {
    return { type: 'skill', skill: SkillEnum.PROB_SURGE };
  }

  if (canUseSkill(state, SkillEnum.VENTURE, player).ok && !state.venture[player]) {
    const maxProb = Math.max(...moves.map(m => computeFinalProb(state, player, m)));
    if (maxProb >= 40) {
      return { type: 'skill', skill: SkillEnum.VENTURE };
    }
  }

  // INFO_OVERLOAD: 干扰对手
  if (canUseSkill(state, SkillEnum.INFO_OVERLOAD, player).ok && !state.infoOverload[opp]) {
    return { type: 'skill', skill: SkillEnum.INFO_OVERLOAD };
  }

  // ROLLING_THUNDER: 对手棋子多且空位少
  if (canUseSkill(state, SkillEnum.ROLLING_THUNDER, player).ok) {
    const oppPieces = state.board.filter(v => v === (opp + 1)).length;
    if (oppPieces >= 2 && moves.length <= 5) {
      return { type: 'skill', skill: SkillEnum.ROLLING_THUNDER };
    }
  }

  // COLLAPSE: 更激进地使用
  if (canUseSkill(state, SkillEnum.COLLAPSE, player).ok) {
    const avgProb = moves.reduce((acc, m) => acc + state.trueR[m], 0) / moves.length;
    if (avgProb < 45) {
      return { type: 'skill', skill: SkillEnum.COLLAPSE };
    }
  }

  // DECOY: 设陷阱
  const decoyTarget = findDecoyTarget(state, player, moves);
  if (decoyTarget !== null && canUseSkill(state, SkillEnum.DECOY, player).ok) {
    return { type: 'skill', skill: SkillEnum.DECOY, params: { pos: decoyTarget } };
  }

  // SPATIAL_SEAL
  const sealTarget = findOpponentThreat(state, player);
  if (sealTarget !== null && canUseSkill(state, SkillEnum.SPATIAL_SEAL, player).ok) {
    return { type: 'skill', skill: SkillEnum.SPATIAL_SEAL, params: { pos: sealTarget } };
  }

  // MIND_MAZE
  if (canUseSkill(state, SkillEnum.MIND_MAZE, player).ok && state.mindMaze[opp] === 0) {
    const oppMoves = getLegalMoves(state, opp);
    if (oppMoves.length >= 3) {
      return { type: 'skill', skill: SkillEnum.MIND_MAZE };
    }
  }

  // WHEEL: 对低概率格子赌运气
  const wheelTarget = findWheelTarget(state, player, moves);
  if (wheelTarget !== null && canUseSkill(state, SkillEnum.WHEEL, player).ok) {
    return { type: 'skill', skill: SkillEnum.WHEEL, params: { pos: wheelTarget } };
  }

  // RENEW
  const renewTarget = findRenewTarget(state, player, moves);
  if (renewTarget !== null && canUseSkill(state, SkillEnum.RENEW, player).ok) {
    return { type: 'skill', skill: SkillEnum.RENEW, params: { pos: renewTarget } };
  }

  // OVERDRAFT
  if (sp < 15 && canUseSkill(state, SkillEnum.OVERDRAFT, player).ok) {
    return { type: 'skill', skill: SkillEnum.OVERDRAFT };
  }

  // GRID_REWRITE: 偶尔使用
  if (canUseSkill(state, SkillEnum.GRID_REWRITE, player).ok && randMod(100) < 15) {
    return { type: 'skill', skill: SkillEnum.GRID_REWRITE };
  }

  // 落子
  return { type: 'move', move: aiLv3MonteCarlo(state, player, moves) };
}

// ============================================================
// 技能目标选择辅助函数
// ============================================================

/** 寻找需要renew的格子：概率最低的空格 */
function findRenewTarget(state: TTT3GameState, player: TTT3Player, moves: number[]): number | null {
  if (moves.length === 0) return null;
  let best = moves[0];
  let worstProb = Infinity;
  for (const m of moves) {
    const prob = computeFinalProb(state, player, m);
    if (prob < worstProb) {
      worstProb = prob;
      best = m;
    }
  }
  return worstProb < 30 ? best : null;
}

/** 寻找Decoy目标：概率中等（40-60%）的空格 */
function findDecoyTarget(state: TTT3GameState, player: TTT3Player, moves: number[]): number | null {
  const candidates = moves.filter(m => {
    const p = computeFinalProb(state, player, m);
    return p >= 35 && p <= 65;
  });
  if (candidates.length === 0) return null;
  // 选择最接近 50% 的
  return candidates.sort((a, b) => {
    const da = Math.abs(computeFinalProb(state, player, a) - 50);
    const db = Math.abs(computeFinalProb(state, player, b) - 50);
    return da - db;
  })[0];
}

/** 寻找Wheel目标：概率最低的空格 */
function findWheelTarget(state: TTT3GameState, player: TTT3Player, moves: number[]): number | null {
  if (moves.length === 0) return null;
  let best = moves[0];
  let worstProb = Infinity;
  for (const m of moves) {
    const prob = computeFinalProb(state, player, m);
    if (prob < worstProb) {
      worstProb = prob;
      best = m;
    }
  }
  return worstProb < 35 ? best : null;
}

/** 寻找对手最有威胁的格子（能形成三连的空格） */
function findOpponentThreat(state: TTT3GameState, player: TTT3Player): number | null {
  const opp = 1 - player as TTT3Player;
  const oppVal = (opp + 1) as CellValue;
  const lines: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    const cells = [state.board[a], state.board[b], state.board[c]];
    const oppCount = cells.filter(v => v === oppVal).length;
    const emptyCount = cells.filter(v => v === 0).length;
    if (oppCount === 2 && emptyCount === 1) {
      // 返回那个空格
      if (state.board[a] === 0) return a;
      if (state.board[b] === 0) return b;
      if (state.board[c] === 0) return c;
    }
  }
  return null;
}

/** 随机选择一个可用技能 */
function pickRandomAvailableSkill(state: TTT3GameState, player: TTT3Player): Skill | null {
  const quickSkills: Skill[] = [
    SkillEnum.PROB_SURGE, SkillEnum.VENTURE, SkillEnum.RENEW,
    SkillEnum.COLLAPSE, SkillEnum.MIND_MAZE, SkillEnum.SPATIAL_SEAL,
    SkillEnum.DECOY, SkillEnum.WHEEL, SkillEnum.OVERDRAFT,
    SkillEnum.INFO_OVERLOAD, SkillEnum.GRID_REWRITE,
    SkillEnum.ROLLING_THUNDER,
  ];
  const available = quickSkills.filter(s => canUseSkill(state, s, player).ok);
  if (available.length === 0) return null;
  return available[randMod(available.length)];
}

/** 构建技能参数 */
function buildSkillParams(state: TTT3GameState, player: TTT3Player, skill: Skill): Record<string, unknown> | undefined {
  const moves = getLegalMoves(state, player);
  switch (skill) {
    case SkillEnum.RENEW:
      return { pos: findRenewTarget(state, player, moves) ?? moves[0] };
    case SkillEnum.SPATIAL_SEAL:
      return { pos: findOpponentThreat(state, player) ?? moves[0] };
    case SkillEnum.DECOY:
      return { pos: findDecoyTarget(state, player, moves) ?? moves[0] };
    case SkillEnum.WHEEL:
      return { pos: findWheelTarget(state, player, moves) ?? moves[0] };
    case SkillEnum.DEPLOY_ROD: {
      // 部署到概率最高的空格（自己接下来想下的位置）
      if (moves.length === 0) return undefined;
      const best = moves.reduce((best, m) =>
        computeFinalProb(state, player, m) > computeFinalProb(state, player, best) ? m : best
      );
      return { pos: best };
    }
    case SkillEnum.SWAP_FATES: {
      if (moves.length < 2) return undefined;
      const a = moves[randMod(moves.length)];
      let b = moves[randMod(moves.length)];
      while (b === a && moves.length > 1) b = moves[randMod(moves.length)];
      return { a, b };
    }
    default:
      return undefined;
  }
}

// ============================================================
// 原有落子逻辑（保留）
// ============================================================

export function aiChooseMove(state: TTT3GameState, player: TTT3Player, level: number): number {
  const moves = getLegalMoves(state, player);
  if (moves.length === 0) return -1;

  switch (level) {
    case 1:
      return aiLv1Random(moves);
    case 2:
      return aiLv2Greedy(state, player, moves);
    case 3:
      return aiLv3MonteCarlo(state, player, moves);
    default:
      return moves[0];
  }
}

/** 获取合法格子（物理位置 0-8） */
export function getLegalMoves(state: TTT3GameState, player: TTT3Player): number[] {
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (state.board[i] !== 0) continue;
    if (state.spatialSealPos === i) continue;
    if (state.mindMaze[player] > 0) {
      const allowed = state.mazeAllowed[player];
      if (allowed && !allowed.includes(i)) continue;
    }
    // Grid Rewrite 封锁期间，只有已解锁的格子可以落子
    if (state.gridRewriteActive[player] && !state.gridRewriteUnlocked[player][i]) continue;
    moves.push(i);
  }
  return moves;
}

function aiLv1Random(moves: number[]): number {
  return moves[randMod(moves.length)];
}

function aiLv2Greedy(state: TTT3GameState, player: TTT3Player, moves: number[]): number {
  const posWeight = [3, 2, 3, 2, 4, 2, 3, 2, 3];
  const comp = [4, 6, 4, 6, 3, 6, 4, 6, 4];

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    const prob = computeFinalProb(state, player, m);
    const pSuccess = prob / 100;
    const pFail = 1 - pSuccess;

    let score = pSuccess * posWeight[m] * 10 + pFail * comp[m] + state.rods[player][m] * 3.0;

    const tempBoard = [...state.board] as CellValue[];
    tempBoard[m] = (player + 1) as CellValue;
    if (checkLine(tempBoard, player)) {
      score += 1000;
    }

    const opp = 1 - player as TTT3Player;
    const tempBoard2 = [...state.board] as CellValue[];
    tempBoard2[m] = (opp + 1) as CellValue;
    if (checkLine(tempBoard2, opp)) {
      score += 500;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  return bestMove;
}

function aiLv3MonteCarlo(state: TTT3GameState, player: TTT3Player, moves: number[]): number {
  const simulations = 200;
  let bestMove = moves[0];
  let bestWinRate = -1;

  for (const m of moves) {
    let wins = 0;
    for (let s = 0; s < simulations; s++) {
      if (simulateOnce(state, player, m)) wins++;
    }
    const winRate = wins / simulations;
    if (winRate > bestWinRate) {
      bestWinRate = winRate;
      bestMove = m;
    }
  }

  return bestMove;
}

function simulateOnce(initialState: TTT3GameState, player: TTT3Player, firstMove: number): boolean {
  let sim = deepCloneState(initialState);
  const firstResult = placePiece(sim, player, firstMove);
  sim = firstResult.state;

  if (firstResult.success) {
    const { winner } = checkWinnerQuick(sim.board);
    if (winner === player) return true;
    if (winner === (1 - player as TTT3Player)) return false;
    if (isBoardFull(sim.board)) return false;
  }

  sim = endTurn(sim);

  let steps = 0;
  const maxSteps = 20;

  while (steps < maxSteps) {
    const cp = sim.currentPlayer;
    const legal = getLegalMoves(sim, cp);
    if (legal.length === 0) break;

    const move = legal[randMod(legal.length)];
    const result = placePiece(sim, cp, move);
    sim = result.state;

    if (result.success) {
      const { winner } = checkWinnerQuick(sim.board);
      if (winner !== null) {
        return winner === player;
      }
      if (isBoardFull(sim.board)) {
        return false;
      }
    }

    sim = endTurn(sim);
    steps++;
  }

  return evaluateBoard(sim.board, player) > 0;
}

function checkWinnerQuick(board: CellValue[]): { winner: TTT3Player | null } {
  const lines: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
      return { winner: (board[a] - 1) as TTT3Player };
    }
  }
  return { winner: null };
}

function isBoardFull(board: CellValue[]): boolean {
  return board.every(c => c !== 0);
}

function checkLine(board: CellValue[], player: TTT3Player): boolean {
  const val = (player + 1) as CellValue;
  const lines: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  return lines.some(([a, b, c]) => board[a] === val && board[b] === val && board[c] === val);
}

function evaluateBoard(board: CellValue[], player: TTT3Player): number {
  const val = (player + 1) as CellValue;
  const oppVal = (2 - player) as CellValue;
  let score = 0;
  const lines: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    const cells = [board[a], board[b], board[c]];
    const myCount = cells.filter(v => v === val).length;
    const oppCount = cells.filter(v => v === oppVal).length;
    const emptyCount = cells.filter(v => v === 0).length;
    if (myCount === 2 && emptyCount === 1) score += 10;
    if (oppCount === 2 && emptyCount === 1) score -= 8;
    if (myCount === 1 && emptyCount === 2) score += 1;
  }
  return score;
}
