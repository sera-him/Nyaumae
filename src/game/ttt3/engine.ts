// ============================================================
// 概率三子棋 — 核心游戏引擎（从 C++ TTT3.cpp 移植）
// 原则：C++ 代码与网页描述不一致时，以代码为准
// ============================================================

import type { TTT3GameState, TTT3Player, CellValue, Profession, Skill } from './types';
import {
  SP_CAP_DEFAULT, SP_INCOME,
  WIN_PATTERNS, Profession as ProfessionEnum, Skill as SkillEnum,
  PROF_BASE_COST, PROF_NAME_CN,
} from './types';
import { generateProbabilities, generateCellProb, roundTo5, getCompensation, rand, randMod } from './probGen';

// ============================================================
// 初始化
// ============================================================

export function createInitialState(
  controllerO: number = 0,
  controllerX: number = 0,
): TTT3GameState {
  const trueR = generateProbabilities();
  return {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0] as CellValue[],
    trueR: [...trueR],
    displayR: [...trueR],
    sp: [10, 15],
    maxSp: [SP_CAP_DEFAULT, SP_CAP_DEFAULT],
    overdraft: [0, 0],
    rods: [new Array(9).fill(0), new Array(9).fill(0)],
    totalRods: [0, 0],
    availableRods: [0, 0],
    profCount: [0, 0],
    profs: [[], []],
    fear: [false, false],
    probSurge: [false, false],
    venture: [false, false],
    mindMaze: [0, 0],
    mazeAllowed: [null, null],
    spatialSealPos: -1,
    prevSealPos: -1,
    decoyPos: [-1, -1],
    decoyDisplay: [0, 0],
    infoOverload: [false, false],
    infoOverloadUses: [0, 0],
    gridRewriteMap: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
    ],
    gridRewriteActive: [false, false],
    gridRewriteUnlocked: [
      new Array(9).fill(false),
      new Array(9).fill(false),
    ],
    gridRewriteKeysUsed: [
      new Array(9).fill(false),
      new Array(9).fill(false),
    ],
    tyrantCost: [0, 0],
    tyrantActive: [false, false],
    wheelHidden: new Array(9).fill(false),
    skipPunish: [false, false],
    skipPunishTurns: [0, 0],
    siphoned: [false, false],
    siphonActive: [false, false],
    thunderUses: [0, 0],
    thunderLastTurn: [-1, -1],
    capacitorUses: [0, 0],
    assassinBonus: [new Array(9).fill(0), new Array(9).fill(0)],
    assassinSaved: [new Array(9).fill(0), new Array(9).fill(0)],
    assassinSavedFlag: [false, false],
    skillUsedTurn: [{}, {}],
    turnCount: 0,
    currentPlayer: 0,
    phase: 'setup',
    playerOWins: 0,
    playerXWins: 0,
    controllerO,
    controllerX,
    actionLog: [],
  };
}

// ============================================================
// 工具函数
// ============================================================

/** 检查玩家是否拥有某职业 */
export function hasProf(state: TTT3GameState, player: TTT3Player, prof: Profession): boolean {
  return state.profs[player].includes(prof);
}

/** 计算职业花费 */
export function getProfCost(
  state: TTT3GameState,
  prof: Profession,
  player: TTT3Player,
  multiplier: number = 1,
  divisor: number = 1,
): number {
  const base = PROF_BASE_COST[prof];
  const tax = state.profCount[player] * 5;
  const cost = Math.floor((base * multiplier) / divisor) + tax;
  // 暴君涨价：职业价格也受影响
  if (state.tyrantActive[player]) {
    return Math.ceil(1.5 * cost + 5);
  }
  return cost;
}

/** 计算技能花费 */
export function getSkillCost(state: TTT3GameState, skill: Skill, player: TTT3Player): number {
  switch (skill) {
    case SkillEnum.TYRANT_GRIP: return state.tyrantCost[player];
    case SkillEnum.ROLLING_THUNDER: {
      const n = state.thunderUses[player];
      const r = state.thunderLastTurn[player] < 0
        ? state.turnCount
        : state.turnCount - state.thunderLastTurn[player];
      return applyTyrantTax(state, player, Math.max(1, Math.floor(25 + n * (n + 1) / 2 - r - r * r / 42)));
    }
    case SkillEnum.BUY_ROD: return 0;
    case SkillEnum.DEPLOY_ROD: return 0;
    case SkillEnum.SWAP_FATES: return applyTyrantTax(state, player, 15);
    case SkillEnum.PROB_SURGE: return applyTyrantTax(state, player, 10);
    case SkillEnum.RENEW: return applyTyrantTax(state, player, 10);
    case SkillEnum.COLLAPSE: return applyTyrantTax(state, player, 22);
    case SkillEnum.MIND_MAZE: return applyTyrantTax(state, player, 12);
    case SkillEnum.SPATIAL_SEAL: return applyTyrantTax(state, player, 8);
    case SkillEnum.DECOY: return applyTyrantTax(state, player, 6);
    case SkillEnum.VENTURE: return applyTyrantTax(state, player, 20);
    case SkillEnum.WHEEL: return applyTyrantTax(state, player, 10);
    case SkillEnum.OVERDRAFT: return applyTyrantTax(state, player, -3);
    case SkillEnum.DEBT: return applyTyrantTax(state, player, 5);
    case SkillEnum.INFO_OVERLOAD: return applyTyrantTax(state, player, 17);
    case SkillEnum.GRID_REWRITE: {
      let empty = 0;
      for (let i = 0; i < 9; i++) if (state.board[i] === 0) empty++;
      return applyTyrantTax(state, player, 5 + 2 * empty);
    }
    case SkillEnum.SP_SIPHON: return applyTyrantTax(state, player, 0);
    case SkillEnum.SKIP_PROTOCOL: return applyTyrantTax(state, player, -5);
    case SkillEnum.CAPACITOR: return applyTyrantTax(state, player, -3);
    case SkillEnum.MATTHEW_SHIFT: return applyTyrantTax(state, player, 2);
    default: return 999;
  }
}

/** 暴君涨价：被 tyrantActive 影响时，价格变为 max(-5, ceil(1.5x + 5)) */
function applyTyrantTax(state: TTT3GameState, player: TTT3Player, baseCost: number): number {
  if (!state.tyrantActive[player]) return baseCost;
  return Math.max(-5, Math.ceil(1.5 * baseCost + 5));
}

/** 技能是否每回合限一次 */
export function isSkillOncePerTurn(skill: Skill): boolean {
  switch (skill) {
    case SkillEnum.SWAP_FATES:
    case SkillEnum.PROB_SURGE:
    case SkillEnum.RENEW:
    case SkillEnum.COLLAPSE:
    case SkillEnum.MIND_MAZE:
    case SkillEnum.SPATIAL_SEAL:
    case SkillEnum.DECOY:
    case SkillEnum.VENTURE:
    case SkillEnum.WHEEL:
    case SkillEnum.GRID_REWRITE:
    case SkillEnum.SP_SIPHON:
    case SkillEnum.SKIP_PROTOCOL:
    case SkillEnum.CAPACITOR:
    case SkillEnum.MATTHEW_SHIFT:
    case SkillEnum.TYRANT_GRIP:
      return true;
    default:
      return false;
  }
}

/** 同步 displayR（处理 decoy） */
export function syncDisplayR(state: TTT3GameState): void {
  for (let i = 0; i < 9; i++) {
    if (state.decoyPos[0] !== i && state.decoyPos[1] !== i) {
      state.displayR[i] = state.trueR[i];
    }
  }
}

/** 获取显示概率（考虑 Mathematician） */
export function getDisplayProb(state: TTT3GameState, player: TTT3Player, pos: number): number {
  const isMath = hasProf(state, player, ProfessionEnum.MATHEMATICIAN);
  if (state.wheelHidden[pos]) return -1; // 隐藏
  if (state.board[pos] !== 0) return -2; // 已占用
  if (state.spatialSealPos === pos) return -3; // 被封印

  let p: number;
  if (state.decoyPos[0] === pos || state.decoyPos[1] === pos) {
    p = state.displayR[pos];
  } else {
    p = state.trueR[pos];
  }

  if (!isMath) {
    p = roundTo5(p);
  }
  if (p > 99) p = 99;
  if (p < 0) p = 0;
  return p;
}

/** 应用 Assassin 加成 */
export function applyAssassinBonus(state: TTT3GameState, player: TTT3Player): void {
  state.assassinBonus[player].fill(0);
  if (!hasProf(state, player, ProfessionEnum.ASSASSIN)) return;

  if (state.assassinSavedFlag[player]) {
    for (let i = 0; i < 9; i++) {
      state.assassinBonus[player][i] = state.assassinSaved[player][i];
    }
  } else {
    const corners = [0, 2, 6, 8];
    // Fisher-Yates shuffle
    for (let i = corners.length - 1; i > 0; i--) {
      const j = randMod(i + 1);
      [corners[i], corners[j]] = [corners[j], corners[i]];
    }
    let bonus = 33.0;
    for (let i = 0; i < 4 && bonus > 0; i++) {
      const add = bonus < (randMod(10) + 5) ? bonus : (randMod(10) + 5);
      state.assassinBonus[player][corners[i]] = add;
      bonus -= add;
    }
  }
  state.assassinSavedFlag[player] = false;
}

// ============================================================
// 回合流程
// ============================================================

/** 回合开始 */
export function startOfTurn(state: TTT3GameState, player: TTT3Player): TTT3GameState {
  const newState = deepCloneState(state);
  // 深拷贝可变数组
  newState.skillUsedTurn = [ { ...state.skillUsedTurn[0] }, { ...state.skillUsedTurn[1] } ];
  newState.skillUsedTurn[player] = {};
  // 心灵迷宫：按当前空格重抽（数量=施放时的半数），避免快照过期：
  // 施放后同回合若接 Collapse/Thunder 改了棋盘，旧名单会有占用格、新空格反而不让下
  if (newState.mindMaze[player] > 0 && newState.mazeAllowed[player]) {
    const keep = newState.mazeAllowed[player]!.length;
    const empty: number[] = [];
    for (let i = 0; i < 9; i++) if (newState.board[i] === 0) empty.push(i);
    if (empty.length === 0) {
      newState.mazeAllowed[player] = [];
    } else {
      for (let i = empty.length - 1; i > 0; i--) {
        const j = randMod(i + 1);
        [empty[i], empty[j]] = [empty[j], empty[i]];
      }
      newState.mazeAllowed[player] = empty.slice(0, Math.min(keep, empty.length));
    }
    logAction(newState, `心灵迷宫生效！本回合只能选 ${newState.mazeAllowed[player]!.length} 个格子：${newState.mazeAllowed[player]!.map(x => x + 1).join(', ')}`);
  }

  // 记录回合开始时的 seal 位置（C++ prev_seal 机制）
  newState.prevSealPos = state.spatialSealPos;

  const isPunished = state.skipPunishTurns[player] > 0;

  // 清除恐惧（只持续一回合）
  newState.fear[player] = false;

  if (!isPunished) {
    newState.skipPunish[player] = false;

    // Monk: SP < 5 恢复至 5
    if (hasProf(newState, player, ProfessionEnum.MONK) && newState.sp[player] < 5) {
      newState.sp[player] = 5;
      logAction(newState, `玩家 ${player === 0 ? 'O' : 'X'} 的僧侣恢复了 SP 到 5`);
    }

    // Investor: +1 SP per 7 held
    if (hasProf(newState, player, ProfessionEnum.INVESTOR)) {
      const bonus = Math.floor(newState.sp[player] / 7);
      if (bonus > 0) {
        newState.sp[player] += bonus;
        logAction(newState, `投资者获得 ${bonus} 额外 SP`);
      }
    }

    // 基础收入
    newState.sp[player] += SP_INCOME;
    if (newState.sp[player] > newState.maxSp[player]) {
      newState.sp[player] = newState.maxSp[player];
    }
  }

  // 重置 siphon active
  newState.siphonActive[player] = false;

  return newState;
}

// ============================================================
// 落子逻辑
// ============================================================

/** 计算最终成功率（包含所有修正） */
export function computeFinalProb(state: TTT3GameState, player: TTT3Player, move: number): number {
  let prob = state.trueR[move] + state.assassinBonus[player][move];
  if (state.probSurge[player]) {
    prob += 20.0;
  }
  if (state.venture[player]) {
    prob += 15.0;
  }
  prob -= state.overdraft[player] * 3.0;
  if (prob < 0.01) prob = 0.01;
  if (prob > 99.99) prob = 99.99;
  return prob;
}

/** 执行落子（成功/失败判定） */
export function placePiece(
  state: TTT3GameState,
  player: TTT3Player,
  move: number,
): { state: TTT3GameState; success: boolean; log: string; gamblerRetry?: boolean } {
  // 心灵迷宫引擎层真拦：禁选格直接失败且不消耗迷宫（与 getLegalMoves/Store 一致）
  if (state.mindMaze[player] > 0 && state.mazeAllowed[player] && !state.mazeAllowed[player]!.includes(move)) {
    return { state: deepCloneState(state), success: false, log: `心灵迷宫限制：本回合只能选 ${state.mazeAllowed[player]!.map(x => x + 1).join(', ')}` };
  }
  const newState = deepCloneState(state);
  const pName = player === 0 ? 'O' : 'X';
  const opp = 1 - player as TTT3Player;

  // 合法落子尝试即消耗迷宫（成功失败都耗；跳过/虹吸等不落子则不耗，防跳过躲限选）
  // 赌徒重试是同回合再选，重试时保留迷宫（见下方 retry 分支恢复）
  const hadMaze = newState.mindMaze[player] > 0;
  const hadAllowed = hadMaze ? newState.mazeAllowed[player] : null;
  if (hadMaze) {
    newState.mindMaze[player] = 0;
    newState.mazeAllowed[player] = null;
  }

  const finalProb = computeFinalProb(newState, player, move);
  // probSurge 在计算最终概率后立即消耗（无论成功失败）
  newState.probSurge[player] = false;
  const randVal = (rand() / 32768.0 + rand()) / 327.68;
  const success = randVal < finalProb;

  if (success) {
    newState.board[move] = (player + 1) as CellValue;
    newState.wheelHidden[move] = false;

    // Venture 返还
    if (newState.venture[player] && newState.skipPunishTurns[player] <= 0) {
      newState.sp[player] += 15;
      if (newState.sp[player] > newState.maxSp[player]) {
        newState.sp[player] = newState.maxSp[player];
      }
      newState.venture[player] = false;
    } else if (newState.venture[player]) {
      newState.venture[player] = false;
    }

    // 清除 siphoned
    if (newState.siphoned[player]) {
      newState.siphoned[player] = false;
    }

    // 清除 prob surge（已消耗）
    newState.probSurge[player] = false;

    return {
      state: newState,
      success: true,
      log: `${pName} 成功放置在格子 ${move + 1}！`,
    };
  } else {
    // 失败补偿
    const comp = getCompensation(move);
    if (newState.skipPunishTurns[player] <= 0) {
      newState.sp[player] += comp;
      if (newState.sp[player] > newState.maxSp[player]) {
        newState.sp[player] = newState.maxSp[player];
      }
    }

    // Venture 失败清除
    if (newState.venture[player]) {
      newState.venture[player] = false;
    }

    // Gambler: 20% 重试（与 C++ 一致：重新选择位置），重试仍吃迷宫限选
    if (hasProf(newState, player, ProfessionEnum.GAMBLER) && randMod(5) === 0) {
      if (hadMaze) {
        newState.mindMaze[player] = 1;
        newState.mazeAllowed[player] = hadAllowed;
      }
      logAction(newState, `赌徒触发了重试！`);
      return { state: newState, success: false, log: `赌徒触发了重试！`, gamblerRetry: true };
    }

    // Siphon 惩罚
    if (newState.siphoned[player]) {
      const drain = Math.floor(newState.sp[player] * 0.3);
      newState.sp[player] -= drain;
      if (newState.sp[player] < 0) newState.sp[player] = 0;
      if (newState.skipPunishTurns[opp] <= 0) {
        newState.sp[opp] += drain;
        if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
      }
      logAction(newState, `SP 虹吸额外吸取了 ${drain} SP！`);

      // Capitalist 加成
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST) && newState.sp[player] > 0) {
        const drain2 = Math.floor(newState.sp[player] * 0.3);
        newState.sp[player] -= drain2;
        if (newState.sp[player] < 0) newState.sp[player] = 0;
        if (newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += drain2;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
        logAction(newState, `资本家额外吸取了 ${drain2} SP！`);
      }
      newState.siphoned[player] = false;
    }

    return {
      state: newState,
      success: false,
      log: `${pName} 在格子 ${move + 1} 失败！${newState.skipPunishTurns[player] <= 0 ? `+${comp} SP 补偿` : '补偿被跳过惩罚阻止'}`,
    };
  }
}

// ============================================================
// 胜负判定
// ============================================================

export function checkWinner(board: CellValue[]): { winner: TTT3Player | null; pattern: number[] | null } {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
      return { winner: (board[a] - 1) as TTT3Player, pattern: [a, b, c] };
    }
  }
  return { winner: null, pattern: null };
}

export function isBoardFull(board: CellValue[]): boolean {
  return board.every(cell => cell !== 0);
}

// ============================================================
// 技能系统
// ============================================================

/** 检查技能是否可用 */
export function canUseSkill(state: TTT3GameState, skill: Skill, player: TTT3Player): { ok: boolean; reason?: string } {
  if (state.fear[player]) return { ok: false, reason: '被恐惧，无法使用技能' };
  if (skill === SkillEnum.SP_SIPHON && state.skipPunishTurns[player] > 0) {
    return { ok: false, reason: '跳过惩罚阻止了 SP 虹吸' };
  }
  if (skill === SkillEnum.VENTURE && state.skipPunishTurns[player] > 0) {
    return { ok: false, reason: '跳过惩罚阻止了风险投资' };
  }
  if (skill === SkillEnum.DEPLOY_ROD && state.availableRods[player] <= 0) {
    return { ok: false, reason: '没有可用的避雷针' };
  }
  if (skill === SkillEnum.DEBT && state.overdraft[player] <= 0) {
    return { ok: false, reason: '没有透支需要偿还' };
  }
  if (skill === SkillEnum.MATTHEW_SHIFT && !hasProf(state, player, ProfessionEnum.MATTHEW)) {
    return { ok: false, reason: '必须拥有 Matthew 职业' };
  }
  if (skill === SkillEnum.TYRANT_GRIP && !hasProf(state, player, ProfessionEnum.TYRANT)) {
    return { ok: false, reason: '必须拥有 Tyrant 职业' };
  }
  if (isSkillOncePerTurn(skill) && (state.skillUsedTurn[player][skill] || 0) > 0) {
    return { ok: false, reason: '本回合已使用过' };
  }
  const cost = getSkillCost(state, skill, player);
  if (cost > 0 && state.sp[player] < cost) {
    return { ok: false, reason: `SP 不足（需要 ${cost}）` };
  }
  return { ok: true };
}

/** 使用技能 */
export function applySkill(
  state: TTT3GameState,
  skill: Skill,
  player: TTT3Player,
  params?: Record<string, unknown>,
): { state: TTT3GameState; success: boolean; log: string } {
  const check = canUseSkill(state, skill, player);
  if (!check.ok) {
    return { state: deepCloneState(state), success: false, log: check.reason || '无法使用' };
  }

  const newState = deepCloneState(state);
  const opp = 1 - player as TTT3Player;
  const cost = getSkillCost(newState, skill, player);

  // 扣除 SP（除了需要输入的技能在各自分支中处理）
  const needsInputSkills: number[] = [
    SkillEnum.SWAP_FATES,
    SkillEnum.RENEW,
    SkillEnum.SPATIAL_SEAL,
    SkillEnum.DECOY,
    SkillEnum.WHEEL,
    SkillEnum.MATTHEW_SHIFT,
  ];
  const needsInput = needsInputSkills.includes(skill);

  if (cost > 0 && !needsInput) {
    newState.sp[player] -= cost;
    // Capitalist 返利
    if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
      const gain = Math.round(cost * 0.1);
      if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
        newState.sp[opp] += gain;
        if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        logAction(newState, `对手的资本家获得了 ${gain} SP 返利`);
      }
    }
  }

  if (!needsInput) {
    newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
  }

  switch (skill) {
    case SkillEnum.PROB_SURGE:
      newState.probSurge[player] = true;
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      return { state: newState, success: true, log: '概率 Surge 激活！下回合 +20%' };

    case SkillEnum.VENTURE:
      newState.venture[player] = true;
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      return { state: newState, success: true, log: '风险投资激活！+15%，成功返 15 SP' };

    case SkillEnum.OVERDRAFT: {
      const maxOd = Math.round(newState.maxSp[player] / 6);
      if (newState.overdraft[player] >= maxOd) {
        return { state: newState, success: false, log: '已达到最大透支次数' };
      }
      const odGain = newState.skipPunishTurns[player] > 0 ? 0 : 3;
      newState.sp[player] += odGain;
      if (newState.sp[player] > newState.maxSp[player]) {
        newState.sp[player] = newState.maxSp[player];
      }
      newState.overdraft[player]++;
      return { state: newState, success: true, log: `透支！${odGain > 0 ? `+${odGain} SP，` : '惩罚期间不获得 SP，'}当前透支 ${newState.overdraft[player]} 层` };
    }

    case SkillEnum.DEBT:
      if (newState.overdraft[player] <= 0) {
        return { state: newState, success: false, log: '没有透支需要偿还' };
      }
      newState.overdraft[player]--;
      return { state: newState, success: true, log: `偿还债务！剩余透支 ${newState.overdraft[player]} 层` };

    case SkillEnum.INFO_OVERLOAD: {
      newState.infoOverloadUses[player]++;
      newState.infoOverload[opp] = true;
      const rate = getOverloadRate(newState.infoOverloadUses[player]);
      return {
        state: newState,
        success: true,
        log: `信息过载 #${newState.infoOverloadUses[player]}！对手 UI 被 ${Math.round(rate * 100)}% 扰动`,
      };
    }

    case SkillEnum.SP_SIPHON: {
      let drained = 0;
      if (newState.sp[opp] > 0) {
        newState.sp[opp]--;
        if (newState.sp[player] < newState.maxSp[player]) {
          newState.sp[player]++;
        }
        drained++;
      }
      newState.siphonActive[player] = true;
      newState.siphoned[opp] = true;
      // Capitalist 加成
      if (hasProf(newState, player, ProfessionEnum.CAPITALIST) && newState.sp[opp] > 0) {
        newState.sp[opp]--;
        if (newState.sp[player] < newState.maxSp[player]) {
          newState.sp[player]++;
        }
        drained++;
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      return {
        state: newState,
        success: true,
        log: `SP 虹吸！吸取了 ${drained} SP [你: ${newState.sp[player]}/${newState.maxSp[player]}, 对手: ${newState.sp[opp]}/${newState.maxSp[opp]}]`,
      };
    }

    case SkillEnum.SKIP_PROTOCOL: {
      const skipGain = newState.skipPunishTurns[player] > 0 ? 0 : 5;
      newState.sp[player] += skipGain;
      if (newState.sp[player] > newState.maxSp[player]) {
        newState.sp[player] = newState.maxSp[player];
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      if (newState.siphonActive[opp]) {
        newState.siphonActive[opp] = false;
        newState.skipPunish[opp] = true;
        newState.skipPunishTurns[opp] = hasProf(newState, opp, ProfessionEnum.CAPITALIST) ? 1 : 2;
        return {
          state: newState,
          success: true,
          log: `跳过协议反制了对手的 SP 虹吸！对手 ${newState.skipPunishTurns[opp]} 回合内无法获得 SP`,
        };
      }
      return { state: newState, success: true, log: `跳过协议！${skipGain > 0 ? `+${skipGain} SP，` : '惩罚期间不获得 SP，'}跳过本回合` };
    }

    case SkillEnum.CAPACITOR: {
      const oldCap = newState.maxSp[player];
      const capGain = newState.skipPunishTurns[player] > 0 ? 0 : 3;
      newState.sp[player] += capGain;
      if (newState.sp[player] > newState.maxSp[player]) {
        newState.sp[player] = newState.maxSp[player];
      }
      const newCap = Math.min(Math.floor(newState.maxSp[player] * 1.2), Number.MAX_SAFE_INTEGER);
      newState.maxSp[player] = newCap;
      newState.capacitorUses[player]++;
      return { state: newState, success: true, log: `电容器核心！${capGain > 0 ? `+${capGain} SP，` : '惩罚期间不获得 SP，'}上限 ${oldCap} → ${newCap}` };
    }

    case SkillEnum.TYRANT_GRIP: {
      // 费用已在通用扣费处扣除（含资本家返利），此处只生效，不二次扣费
      // canUseSkill 已校验 SP 充足，直接生效即可
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      newState.tyrantCost[player] += 5;
      newState.tyrantActive[opp] = true;
      return { state: newState, success: true, log: `暴君之握！对手下回合所有费用涨价` };
    }

    case SkillEnum.BUY_ROD: {
      const qty = (params?.qty as number) ?? 1;
      return buyRod(newState, player, qty);
    }

    case SkillEnum.DEPLOY_ROD: {
      const pos = params?.pos as number;
      if (pos === undefined) {
        return { state: newState, success: false, log: '请选择部署位置' };
      }
      return deployRod(newState, player, pos);
    }

    case SkillEnum.ROLLING_THUNDER:
      return rollingThunder(newState, player);

    case SkillEnum.COLLAPSE:
      return skillCollapse(newState, player);

    case SkillEnum.MIND_MAZE:
      return skillMindMaze(newState, player);

    case SkillEnum.GRID_REWRITE:
      return skillGridRewrite(newState, player);

    // 需要输入参数的技能
    case SkillEnum.RENEW:
    case SkillEnum.SWAP_FATES:
    case SkillEnum.SPATIAL_SEAL:
    case SkillEnum.DECOY:
    case SkillEnum.WHEEL:
    case SkillEnum.MATTHEW_SHIFT:
      // 这些技能需要 params，在各自处理函数中处理
      return handleInputSkill(newState, skill, player, params);

    default:
      return { state: newState, success: false, log: '技能暂未实现' };
  }
}

/** 处理需要输入参数的技能 */
function handleInputSkill(
  state: TTT3GameState,
  skill: Skill,
  player: TTT3Player,
  params?: Record<string, unknown>,
): { state: TTT3GameState; success: boolean; log: string } {
  if (!params) {
    return { state, success: false, log: '缺少参数' };
  }
  const opp = 1 - player as TTT3Player;

  switch (skill) {
    case SkillEnum.RENEW: {
      const pos = params.pos as number;
      if (pos < 0 || pos > 8) {
        return { state, success: false, log: '无效的格子' };
      }
      const newState = deepCloneState(state);
      const cost = getSkillCost(newState, skill, player);
      newState.sp[player] -= cost;
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
        const gain = Math.round(cost * 0.1);
        if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += gain;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      const newVal = generateCellProb(pos);
      newState.trueR[pos] = newVal;
      if (newState.decoyPos[0] !== pos && newState.decoyPos[1] !== pos) {
        newState.displayR[pos] = newVal;
      }
      return { state: newState, success: true, log: `Renew 格子 ${pos + 1}：${roundTo5(newVal)}%` };
    }

    case SkillEnum.SWAP_FATES: {
      const a = params.a as number;
      const b = params.b as number;
      if (a < 0 || a > 8 || b < 0 || b > 8 || a === b) {
        return { state, success: false, log: '无效的选择' };
      }
      const newState = deepCloneState(state);
      const baseCost = getSkillCost(newState, skill, player);
      const usesCenter = (a === 4 || b === 4);
      const actualCost = usesCenter ? baseCost + 10 : baseCost;
      if (actualCost > newState.sp[player]) {
        return { state, success: false, log: 'SP 不足' };
      }
      newState.sp[player] -= actualCost;
      const deduction = actualCost;
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
        const gain = Math.round(deduction * 0.1);
        if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += gain;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      [newState.trueR[a], newState.trueR[b]] = [newState.trueR[b], newState.trueR[a]];
      newState.displayR[a] = newState.trueR[a];
      newState.displayR[b] = newState.trueR[b];
      for (let pl = 0; pl < 2; pl++) {
        if (newState.decoyPos[pl] === a) newState.displayR[a] = newState.decoyDisplay[pl];
        if (newState.decoyPos[pl] === b) newState.displayR[b] = newState.decoyDisplay[pl];
      }
      return { state: newState, success: true, log: `交换了格子 ${a + 1} 和 ${b + 1} 的概率` };
    }

    case SkillEnum.SPATIAL_SEAL: {
      const pos = params.pos as number;
      if (pos < 0 || pos > 8) {
        return { state, success: false, log: '无效的格子' };
      }
      const newState = deepCloneState(state);
      const cost = getSkillCost(newState, skill, player);
      newState.sp[player] -= cost;
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
        const gain = Math.round(cost * 0.1);
        if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += gain;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      newState.spatialSealPos = pos;
      return { state: newState, success: true, log: `封印了格子 ${pos + 1}` };
    }

    case SkillEnum.DECOY: {
      const pos = params.pos as number;
      if (pos < 0 || pos > 8) {
        return { state, success: false, log: '无效的格子' };
      }
      const newState = deepCloneState(state);
      const cost = getSkillCost(newState, skill, player);
      newState.sp[player] -= cost;
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
        const gain = Math.round(cost * 0.1);
        if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += gain;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      const fakeBonus = 14.0 + randMod(3);
      const truePenalty = 4.0 + randMod(3);
      let display = newState.trueR[pos] + fakeBonus;
      if (display > 99.99) display = 99.99;
      newState.trueR[pos] = Math.max(0.01, newState.trueR[pos] - truePenalty);
      newState.decoyPos[player] = pos;
      newState.decoyDisplay[player] = display;
      newState.displayR[pos] = display;
      return { state: newState, success: true, log: `在格子 ${pos + 1} 设置了诱饵！显示 ${roundTo5(display)}%，实际降低` };
    }

    case SkillEnum.WHEEL: {
      const pos = params.pos as number;
      if (pos < 0 || pos > 8) {
        return { state, success: false, log: '无效的格子' };
      }
      const newState = deepCloneState(state);
      const cost = getSkillCost(newState, skill, player);
      newState.sp[player] -= cost;
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
        const gain = Math.round(cost * 0.1);
        if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += gain;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      newState.trueR[pos] = (rand() / 32768.0 + rand()) / 327.68;
      if (newState.trueR[pos] < 0.01) newState.trueR[pos] = 0.01;
      if (newState.trueR[pos] > 99.99) newState.trueR[pos] = 99.99;
      newState.displayR[pos] = newState.trueR[pos];
      newState.wheelHidden[pos] = true;
      return { state: newState, success: true, log: `命运之轮旋转格子 ${pos + 1}！概率已随机化并隐藏` };
    }

    case SkillEnum.MATTHEW_SHIFT: {
      const a = params.a as number;
      const b = params.b as number;
      if (!hasProf(state, player, ProfessionEnum.MATTHEW)) {
        return { state, success: false, log: '没有马太职业' };
      }
      if (a < 0 || a > 8 || b < 0 || b > 8 || a === b) {
        return { state, success: false, log: '无效的选择' };
      }
      const newState = deepCloneState(state);
      const cost = getSkillCost(newState, skill, player);
      newState.sp[player] -= cost;
      if (hasProf(newState, opp, ProfessionEnum.CAPITALIST)) {
        const gain = Math.round(cost * 0.1);
        if (gain > 0 && newState.skipPunishTurns[opp] <= 0) {
          newState.sp[opp] += gain;
          if (newState.sp[opp] > newState.maxSp[opp]) newState.sp[opp] = newState.maxSp[opp];
        }
      }
      newState.skillUsedTurn[player][skill] = (newState.skillUsedTurn[player][skill] || 0) + 1;
      let high = a, low = b;
      if (newState.trueR[low] > newState.trueR[high]) {
        [high, low] = [low, high];
      }
      newState.trueR[high] = Math.min(99.99, newState.trueR[high] + 10.0);
      newState.trueR[low] = Math.max(0.01, newState.trueR[low] - 10.0);
      if (newState.decoyPos[0] !== high && newState.decoyPos[1] !== high) {
        newState.displayR[high] = newState.trueR[high];
      }
      if (newState.decoyPos[0] !== low && newState.decoyPos[1] !== low) {
        newState.displayR[low] = newState.trueR[low];
      }
      return {
        state: newState,
        success: true,
        log: `马太转移：格子 ${high + 1} +10%，格子 ${low + 1} -10%`,
      };
    }

    default:
      return { state, success: false, log: '未知技能' };
  }
}

// ============================================================
// Rod 系统（避雷针）
// ============================================================

/** 计算购买 rod 的花费 */
export function getRodCost(qty: number): number {
  return Math.round(42.0 * Math.log(1.0 + 4.0 * qty / 27.0));
}

/** 购买避雷针 */
function buyRod(state: TTT3GameState, player: TTT3Player, qty: number): { state: TTT3GameState; success: boolean; log: string } {
  if (qty <= 0) {
    return { state, success: false, log: '购买数量无效' };
  }
  const cost = getRodCost(qty);
  if (state.sp[player] < cost) {
    return { state, success: false, log: `SP 不足（需要 ${cost}）` };
  }
  const newState = deepCloneState(state);
  newState.sp[player] -= cost;
  newState.availableRods[player] += qty;
  return {
    state: newState,
    success: true,
    log: `购买了 ${qty} 根避雷针！（花费 ${cost} SP，可用: ${newState.availableRods[player]}）`,
  };
}

/** 部署避雷针 */
function deployRod(state: TTT3GameState, player: TTT3Player, pos: number): { state: TTT3GameState; success: boolean; log: string } {
  if (state.availableRods[player] <= 0) {
    return { state, success: false, log: '没有可用的避雷针，请先购买' };
  }
  if (pos < 0 || pos > 8) {
    return { state, success: false, log: '无效的格子' };
  }

  const newState = deepCloneState(state);
  const exceeded = newState.totalRods[player] >= 10 || newState.rods[player][pos] >= 9;
  const baseProb = exceeded ? 27.5 : newState.trueR[pos] * 0.35 + 20.0;
  const randVal = (rand() / 32768.0 + rand()) / 327.68;

  if (randVal < baseProb) {
    // 部署成功
    newState.rods[player][pos]++;
    newState.totalRods[player]++;
    newState.availableRods[player]--;

    if (exceeded) {
      const opp = 1 - player as TTT3Player;
      if (newState.rods[opp][pos] > 0) {
        newState.rods[opp][pos]--;
        newState.totalRods[opp]--;
      }
    }
    return {
      state: newState,
      success: true,
      log: `避雷针成功部署在格子 ${pos + 1}！`,
    };
  } else {
    // 部署失败，消耗一根
    newState.availableRods[player]--;
    return {
      state: newState,
      success: true,
      log: `避雷针部署失败！消耗了 1 根可用避雷针`,
    };
  }
}

/** 计算落雷命中概率（返回 0-1） */
export function getThunderStrikeProb(state: TTT3GameState, attacker: TTT3Player, targetPlayer: TTT3Player, cell: number): number {
  const selfRods = state.rods[targetPlayer][cell];
  const isOwn = targetPlayer === attacker;
  const a = (selfRods * 2.0 + (isOwn ? 4.0 : 3.0)) * (isOwn ? 1.2 : 1.0);
  const prob = 3.0 * (1.0 - Math.pow(a / 26.5, 2)) / a;
  return Math.max(0, Math.min(1, prob));
}

/** 落雷技能 */
function rollingThunder(state: TTT3GameState, player: TTT3Player): { state: TTT3GameState; success: boolean; log: string } {
  const newState = deepCloneState(state);
  const logs: string[] = ['⚡ 落雷滚滚！'];
  let anyStruck = false;

  for (let pos = 0; pos < 9; pos++) {
    if (newState.board[pos] === 0) continue;

    const targetOwner = (newState.board[pos] - 1) as TTT3Player;
    const strikeProb = getThunderStrikeProb(newState, player, targetOwner, pos);
    const randVal = (rand() / 32768.0 + rand()) / 327.68 / 100.0;

    if (randVal < strikeProb) {
      anyStruck = true;
      logs.push(`格子 ${pos + 1} (${targetOwner === 0 ? 'O' : 'X'}): 命中！棋子被摧毁`);
      newState.board[pos] = 0;
      newState.wheelHidden[pos] = false;

      // 第一步：棋子主人获得 ceil(自己的针数/2) 的 SP
      const ownerLost = Math.ceil(newState.rods[targetOwner][pos] / 2);
      if (ownerLost > 0 && newState.skipPunishTurns[targetOwner] <= 0) {
        newState.sp[targetOwner] += ownerLost;
        if (newState.sp[targetOwner] > newState.maxSp[targetOwner]) {
          newState.sp[targetOwner] = newState.maxSp[targetOwner];
        }
        logs.push(`  玩家 ${targetOwner === 0 ? 'O' : 'X'} 损失 ${ownerLost} 根杆，获得 ${ownerLost} SP`);
      } else if (ownerLost > 0) {
        logs.push(`  玩家 ${targetOwner === 0 ? 'O' : 'X'} 损失 ${ownerLost} 根杆（SP 被跳过惩罚阻止）`);
      }

      // 第二步：该格所有针（双方）都减少
      for (let pl = 0; pl < 2; pl++) {
        const lost = Math.ceil(newState.rods[pl][pos] / 2);
        if (lost > 0) {
          newState.rods[pl][pos] -= lost;
          newState.totalRods[pl] -= lost;
        }
      }
    } else {
      logs.push(`格子 ${pos + 1} (${targetOwner === 0 ? 'O' : 'X'}): 未命中 (${(strikeProb * 100).toFixed(1)}%)`);
    }
  }

  if (!anyStruck) {
    logs.push('所有落雷都未命中！');
  }

  newState.thunderUses[player]++;
  newState.thunderLastTurn[player] = newState.turnCount;

  // 记录日志
  for (const log of logs) {
    logAction(newState, log);
  }

  return { state: newState, success: true, log: logs.join('\n') };
}

/** 绝对崩溃：重掷全部 9 格 */
function skillCollapse(state: TTT3GameState, _player: TTT3Player): { state: TTT3GameState; success: boolean; log: string } {
  const newState = deepCloneState(state);
  const occupied = newState.board.map(v => v !== 0);

  const newProbs = generateProbabilities();
  for (let i = 0; i < 9; i++) {
    if (!occupied[i]) {
      newState.trueR[i] = newProbs[i];
      newState.displayR[i] = newProbs[i];
      newState.wheelHidden[i] = false;
    }
  }

  // 恢复 decoy 显示
  for (let pl = 0; pl < 2; pl++) {
    if (newState.decoyPos[pl] >= 0) {
      newState.displayR[newState.decoyPos[pl]] = newState.decoyDisplay[pl];
    }
  }

  syncDisplayR(newState);
  newState.skillUsedTurn[_player][SkillEnum.COLLAPSE] = (newState.skillUsedTurn[_player][SkillEnum.COLLAPSE] || 0) + 1;
  return { state: newState, success: true, log: '绝对崩溃！全部 9 格概率已重掷' };
}

/** 心灵迷宫 */
function skillMindMaze(state: TTT3GameState, player: TTT3Player): { state: TTT3GameState; success: boolean; log: string } {
  const newState = deepCloneState(state);
  const opp = 1 - player as TTT3Player;
  const empty: number[] = [];
  for (let i = 0; i < 9; i++) if (newState.board[i] === 0) empty.push(i);
  // 无空格时不可施放，避免发空名单锁死对手一回合
  if (empty.length === 0) {
    return { state: deepCloneState(state), success: false, log: '棋盘已满，无空格可限' };
  }
  const half = Math.floor((empty.length + 1) / 2);

  // Fisher-Yates shuffle
  for (let i = empty.length - 1; i > 0; i--) {
    const j = randMod(i + 1);
    [empty[i], empty[j]] = [empty[j], empty[i]];
  }

  newState.mazeAllowed[opp] = empty.slice(0, half);
  newState.mindMaze[opp] = 1;
  newState.skillUsedTurn[player][SkillEnum.MIND_MAZE] = (newState.skillUsedTurn[player][SkillEnum.MIND_MAZE] || 0) + 1;
  return {
    state: newState,
    success: true,
    // 名单在对手回合开始按当前空格重抽，这里只报数量，实际名单以对手回合开始为准
    log: `心灵迷宫！对手下次落子只能从随机的 ${half} 个空格中选择`,
  };
}

/** 网格重写 */
function skillGridRewrite(state: TTT3GameState, player: TTT3Player): { state: TTT3GameState; success: boolean; log: string } {
  const newState = deepCloneState(state);

  // 若自身已被封锁，使用 Grid Rewrite 解除
  if (newState.gridRewriteActive[player]) {
    newState.gridRewriteActive[player] = false;
    newState.gridRewriteUnlocked[player] = new Array(9).fill(false);
    newState.gridRewriteKeysUsed[player] = new Array(9).fill(false);
    return { state: newState, success: true, log: 'Grid Rewrite 解除！格子封锁已清除' };
  }

  // 对对手施加封锁
  const opp = 1 - player as TTT3Player;
  const ids = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randMod(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  newState.gridRewriteMap[opp] = ids;
  newState.gridRewriteActive[opp] = true;
  newState.gridRewriteUnlocked[opp] = new Array(9).fill(false);
  newState.gridRewriteKeysUsed[opp] = new Array(9).fill(false);
  newState.skillUsedTurn[player][SkillEnum.GRID_REWRITE] = (newState.skillUsedTurn[player][SkillEnum.GRID_REWRITE] || 0) + 1;
  return { state: newState, success: true, log: 'Grid Rewrite！对手格子已被封锁' };
}

/** Grid Rewrite 键盘点击：解锁 + 返回是否可以落子 */
export function handleGridRewriteKey(
  state: TTT3GameState,
  player: TTT3Player,
  keyIndex: number,
): { state: TTT3GameState; canPlace: boolean; physicalPos: number } {
  const newState = deepCloneState(state);
  const physicalPos = newState.gridRewriteMap[player][keyIndex];

  newState.gridRewriteKeysUsed[player][keyIndex] = true;
  newState.gridRewriteUnlocked[player][physicalPos] = true;

  const canPlace =
    physicalPos >= 0 && physicalPos <= 8 &&
    newState.board[physicalPos] === 0 &&
    newState.spatialSealPos !== physicalPos &&
    !(newState.mindMaze[player] > 0 && newState.mazeAllowed[player] && !newState.mazeAllowed[player]!.includes(physicalPos));

  return { state: newState, canPlace, physicalPos };
}

/** 信息过载强度 */
export function getOverloadRate(uses: number): number {
  if (uses >= 15) return 1.0;
  if (uses <= 0) return 0.0;
  return Math.min(1.0, 0.55 + 0.03 * uses);
}

// ============================================================
// 职业系统
// ============================================================

/** 购买职业 */
export function buyProfession(
  state: TTT3GameState,
  player: TTT3Player,
  prof: Profession,
  snatch: boolean = false,
): { state: TTT3GameState; success: boolean; log: string } {
  if (hasProf(state, player, prof)) {
    return { state, success: false, log: '已拥有该职业' };
  }

  const opp = 1 - player as TTT3Player;
  const oppOwned = hasProf(state, opp, prof);
  let cost: number;

  if (oppOwned) {
    cost = snatch
      ? getProfCost(state, prof, player, 10, 3)
      : getProfCost(state, prof, player, 5, 3);
  } else {
    cost = getProfCost(state, prof, player);
  }

  if (state.sp[player] < cost) {
    return { state, success: false, log: 'SP 不足' };
  }

  const newState = deepCloneState(state);
  newState.sp[player] -= cost;

  if (oppOwned && snatch) {
    newState.profs[opp] = newState.profs[opp].filter(p => p !== prof);
    newState.profCount[opp]--;
  }

  newState.profs[player].push(prof);
  newState.profCount[player]++;

  if (prof === ProfessionEnum.ASSASSIN) {
    applyAssassinBonus(newState, player);
    syncDisplayR(newState);
  }

  return {
    state: newState,
    success: true,
    log: `${snatch ? '夺取' : '购买'}了 ${PROF_NAME_CN[prof]}！`,
  };
}

/** 遗忘职业 */
export function forgetProfession(
  state: TTT3GameState,
  player: TTT3Player,
  index: number,
): { state: TTT3GameState; success: boolean; log: string } {
  if (index < 0 || index >= state.profs[player].length) {
    return { state, success: false, log: '无效的职业索引' };
  }
  if (state.skipPunishTurns[player] > 0) {
    return { state, success: false, log: '跳过惩罚期间不能遗忘职业' };
  }

  const newState = deepCloneState(state);
  const prof = newState.profs[player][index];
  const refund = Math.floor(PROF_BASE_COST[prof] / 3);

  if (prof === ProfessionEnum.ASSASSIN) {
    for (let i = 0; i < 9; i++) {
      newState.assassinSaved[player][i] = newState.assassinBonus[player][i];
    }
    newState.assassinSavedFlag[player] = true;
    newState.assassinBonus[player].fill(0);
  }

  newState.profs[player].splice(index, 1);
  newState.profCount[player]--;
  newState.sp[player] += refund;
  if (newState.sp[player] > newState.maxSp[player]) {
    newState.sp[player] = newState.maxSp[player];
  }

  return { state: newState, success: true, log: `遗忘了职业，返还 ${refund} SP` };
}

// ============================================================
// 回合结束与结算
// ============================================================

/** 结束当前玩家回合，切换到下一个玩家 */
export function endTurn(state: TTT3GameState): TTT3GameState {
  const newState = deepCloneState(state);
  const prevPlayer = newState.currentPlayer;

  // Mind Maze 改为落子消耗制（placePiece 中清除），回合结束不再自动清：
  // 对手用 Siphon/Skip/Capacitor 空过不再能躲掉限选，必须吃一次限选落子才消
  void prevPlayer;

  // Spatial Seal 清除（C++ prev_seal 机制）
  // 回合开始时有 seal，且该位置未被新 seal 覆盖，则在当前回合结束后清除
  if (newState.prevSealPos !== -1 && newState.spatialSealPos === newState.prevSealPos) {
    newState.spatialSealPos = -1;
  }

  // Info Overload 清除（如果被施加者的回合结束，且施加者使用次数 < 15）
  const opp = 1 - prevPlayer as TTT3Player;
  if (newState.infoOverload[prevPlayer] && newState.infoOverloadUses[opp] > 0 && newState.infoOverloadUses[opp] < 15) {
    newState.infoOverload[prevPlayer] = false;
  }

  // Skip Punish 递减（只在拥有者回合结束时递减）
  if (newState.skipPunishTurns[prevPlayer] > 0) {
    newState.skipPunishTurns[prevPlayer]--;
    if (newState.skipPunishTurns[prevPlayer] === 0) {
      newState.skipPunish[prevPlayer] = false;
    }
  }

  // 暴君费用递减（本回合没用暴君技能则 -3）
  if (!newState.skillUsedTurn[prevPlayer][SkillEnum.TYRANT_GRIP]) {
    newState.tyrantCost[prevPlayer] = Math.max(0, newState.tyrantCost[prevPlayer] - 3);
  }
  // 暴君涨价效果在当前回合结束时清除（持续恰好 1 个回合）
  newState.tyrantActive[prevPlayer] = false;

  // 切换玩家
  newState.currentPlayer = opp;
  newState.turnCount++;

  // 检查胜负
  const { winner } = checkWinner(newState.board);
  if (winner !== null) {
    newState.phase = winner === 0 ? 'o_wins' : 'x_wins';
    if (winner === 0) newState.playerOWins++;
    else newState.playerXWins++;
    return newState;
  }

  // 注：本游戏没有平局，即使棋盘满了也可用 Rolling Thunder 清空

  // 开始新回合
  return startOfTurn(newState, newState.currentPlayer);
}

// ============================================================
// 行动日志
// ============================================================

export function logAction(state: TTT3GameState, msg: string): void {
  state.actionLog.push(msg);
  if (state.actionLog.length > 20) {
    state.actionLog.shift();
  }
}

// ============================================================
// 深拷贝
// ============================================================

export function deepCloneState(state: TTT3GameState): TTT3GameState {
  return {
    ...state,
    board: [...state.board] as CellValue[],
    trueR: [...state.trueR],
    displayR: [...state.displayR],
    sp: [...state.sp] as [number, number],
    maxSp: [...state.maxSp] as [number, number],
    overdraft: [...state.overdraft] as [number, number],
    rods: [
      [...state.rods[0]],
      [...state.rods[1]],
    ],
    totalRods: [...state.totalRods] as [number, number],
    availableRods: [...state.availableRods] as [number, number],
    profCount: [...state.profCount] as [number, number],
    profs: [
      [...state.profs[0]],
      [...state.profs[1]],
    ],
    fear: [...state.fear] as [boolean, boolean],
    probSurge: [...state.probSurge] as [boolean, boolean],
    venture: [...state.venture] as [boolean, boolean],
    mindMaze: [...state.mindMaze] as [number, number],
    mazeAllowed: [
      state.mazeAllowed[0] ? [...state.mazeAllowed[0]] : null,
      state.mazeAllowed[1] ? [...state.mazeAllowed[1]] : null,
    ],
    decoyPos: [...state.decoyPos] as [number, number],
    decoyDisplay: [...state.decoyDisplay] as [number, number],
    infoOverload: [...state.infoOverload] as [boolean, boolean],
    infoOverloadUses: [...state.infoOverloadUses] as [number, number],
    gridRewriteMap: [
      [...state.gridRewriteMap[0]],
      [...state.gridRewriteMap[1]],
    ],
    gridRewriteActive: [...state.gridRewriteActive] as [boolean, boolean],
    gridRewriteUnlocked: [
      [...state.gridRewriteUnlocked[0]],
      [...state.gridRewriteUnlocked[1]],
    ],
    gridRewriteKeysUsed: [
      [...state.gridRewriteKeysUsed[0]],
      [...state.gridRewriteKeysUsed[1]],
    ],
    tyrantCost: [...state.tyrantCost] as [number, number],
    tyrantActive: [...state.tyrantActive] as [boolean, boolean],
    wheelHidden: [...state.wheelHidden],
    skipPunish: [...state.skipPunish] as [boolean, boolean],
    skipPunishTurns: [...state.skipPunishTurns] as [number, number],
    siphoned: [...state.siphoned] as [boolean, boolean],
    siphonActive: [...state.siphonActive] as [boolean, boolean],
    thunderUses: [...state.thunderUses] as [number, number],
    thunderLastTurn: [...state.thunderLastTurn] as [number, number],
    capacitorUses: [...state.capacitorUses] as [number, number],
    assassinBonus: [
      [...state.assassinBonus[0]],
      [...state.assassinBonus[1]],
    ],
    assassinSaved: [
      [...state.assassinSaved[0]],
      [...state.assassinSaved[1]],
    ],
    assassinSavedFlag: [...state.assassinSavedFlag] as [boolean, boolean],
    skillUsedTurn: [
      { ...state.skillUsedTurn[0] },
      { ...state.skillUsedTurn[1] },
    ],
    actionLog: [...state.actionLog],
  };
}

// ============================================================
// 解析输入（Grid Rewrite 映射）
// ============================================================

export function parseMoveInput(logical: number): number {
  // logical 是 0-8 的物理位置（Grid Rewrite 期间由 makeMove 直接处理键盘输入）
  if (logical < 0 || logical > 8) return -1;
  return logical;
}

// ============================================================
// Matthew Shift
// ============================================================

export function matthewShift(
  state: TTT3GameState,
  player: TTT3Player,
  a: number,
  b: number,
): { state: TTT3GameState; success: boolean; log: string } {
  if (!hasProf(state, player, ProfessionEnum.MATTHEW)) {
    return { state, success: false, log: '没有马太职业' };
  }
  if (a < 0 || a > 8 || b < 0 || b > 8 || a === b || state.board[a] !== 0 || state.board[b] !== 0) {
    return { state, success: false, log: '无效的格子选择' };
  }

  const newState = deepCloneState(state);
  let high = a, low = b;
  if (newState.trueR[low] > newState.trueR[high]) {
    [high, low] = [low, high];
  }

  // 让高的更高，低的更低（与 C++ 相反，按用户要求保留）
  newState.trueR[high] = Math.min(99.99, newState.trueR[high] + 10.0);
  newState.trueR[low] = Math.max(0.01, newState.trueR[low] - 10.0);

  if (newState.decoyPos[0] !== high && newState.decoyPos[1] !== high) {
    newState.displayR[high] = newState.trueR[high];
  }
  if (newState.decoyPos[0] !== low && newState.decoyPos[1] !== low) {
    newState.displayR[low] = newState.trueR[low];
  }
  newState.skillUsedTurn[player][SkillEnum.MATTHEW_SHIFT] = (newState.skillUsedTurn[player][SkillEnum.MATTHEW_SHIFT] || 0) + 1;

  return {
    state: newState,
    success: true,
    log: `马太转移：格子 ${high + 1} +10%，格子 ${low + 1} -10%`,
  };
}
