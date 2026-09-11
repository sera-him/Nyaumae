// ============================================================
// 复合象棋 — Zustand 状态管理
// ============================================================

import { create } from 'zustand';
import type { Position, Piece, PieceType, CheeseType, GameState, Player, Move } from '../game/chess/types';
import { createInitialState } from '../game/chess/board';
import { getLegalMoves, executeMove, undoMove } from '../game/chess/engine';
import { getPiece, inBounds, isEmpty, pieceKey } from '../game/chess/board';
import { pawnMustPromote, elephantMustPromote, skeletonMustPromote, antiSkeletonMustPromote, canDecrypt, getAntennaPushTargets, getWhaleZones, canSynthesizeStarship } from '../game/chess/rules';
import { PAWN_PROMOTIONS, ELEPHANT_PROMOTIONS } from '../game/chess/rules';
import { getPreset } from '../game/chess/clockPresets';


export interface PromoteChoice {
  from: Position;
  to: Position;
  options: PieceType[];
}

interface ChessStoreState {
  gameState: GameState;
  gameStarted: boolean;

  selectedPos: Position | null;
  legalMoves: { to: Position; isCapture: boolean }[];

  promoteChoice: PromoteChoice | null;
  witchSkillMode: 'none' | 'poison' | 'cheese' | 'sacrifice' | 'self_destruct';
  selectedCheeseType: CheeseType;

  antennaPushMode: boolean;
  antennaPushTargets: { from: Position; to: Position; piece: Piece }[];
  antennaPushPlayer: Player | null;

  skillConfirmTarget: Position | null;

  // ── 鸵鸟变回后 ──
  ostrichRevertChoice: { pos: Position; player: Player } | null;

  // ── 星舰部署 ──
  starshipDeployMode: boolean;
  starshipDeployTarget: Position | null;

  // ── 棋钟 ──
  clockRunning: boolean;

  startGame: () => void;
  resetGame: () => void;
  selectCell: (pos: Position) => void;
  confirmMove: (to: Position) => void;
  confirmPromotion: (type: PieceType) => void;
  cancelPromotion: () => void;
  undoLastMove: () => void;
  setWitchSkillMode: (mode: 'none' | 'poison' | 'cheese' | 'sacrifice' | 'self_destruct') => void;
  setCheeseType: (type: CheeseType) => void;
  executeWitchSkill: (pos: Position) => void;
  transformQueen: () => void;
  executeAntennaPush: (from: Position) => void;
  executeDecrypt: () => void;
  confirmSkill: () => void;
  cancelSkill: () => void;
  requestSelfDestruct: () => void;
  confirmOstrichRevert: () => void;
  cancelOstrichRevert: () => void;
  synthesizeStarship: () => void;
  setStarshipDeployMode: (mode: boolean) => void;
  confirmStarshipDeploy: (type: PieceType) => void;
  // 棋钟
  tick: () => void;
  setClockConfig: (id: number) => void;
}

/**
 * 走子后处理：加时/扣时/拾取
 * 在 executeMove 返回后调用，newState.clock 已被 executeMove 从 oldState 复制
 */
function applyClockAfterMove(newState: GameState, oldState: GameState): GameState {
  const preset = getPreset(oldState.clockConfigId ?? -1);
  if (!preset) return newState;
  if (oldState.phase !== 'playing') return newState; // 游戏已结束则不处理

  const movedPlayer = oldState.currentPlayer;
  const clock = { ...newState.clock };

  if (preset.isCountUp) {
    // Infinity：不加时，正计时由 tick 处理
  } else if (preset.entropyType === 'erosion') {
    // Erosion：每步扣 5s（先判胜负，所以这里不判负）
    clock[movedPlayer] = Math.max(0, clock[movedPlayer] - 5000);
  } else if (preset.entropyType === 'surge') {
    // Surge：每步加超大量
    clock[movedPlayer] += preset.incrementMs;
  } else if (preset.entropyType === 'pool') {
    // Pool：每步重置 per-move 计时器（给对手的新步限）
    newState.clockPerMoveMs = Math.floor(newState.clockPoolMs / 12) + 5000;
  } else if (preset.entropyType === 'bounty') {
    // Bounty：检查目标格是否有时间币
    const move = newState.history[newState.history.length - 1]?.move;
    if (move) {
      const cellKey = `${move.to.row},${move.to.col}`;
      const bountyCells = { ...newState.clockBountyCells };
      const reward = bountyCells[cellKey];
      if (reward !== undefined && reward > 0) {
        clock[movedPlayer] += reward;
        bountyCells[cellKey] = Math.max(5000, Math.floor(reward / 2)); // 减半，下限5s
        return { ...newState, clock, clockBountyCells: bountyCells };
      }
    }
  } else if (preset.entropyType === 'accelerando') {
    // Accelerando：每步重置步进（从 1 重新开始扣）
    newState.clockAccelStep = { ...newState.clockAccelStep, [movedPlayer]: 1 };
  } else {
    // 常规：加时
    clock[movedPlayer] += preset.incrementMs;
  }

  return { ...newState, clock };
}

/**
 * 应用走子 + 棋钟后处理，统一入口
 */
function executeMoveWithClock(oldState: GameState, move: Move): GameState {
  const newState = executeMove(oldState, move);
  return applyClockAfterMove(newState, oldState);
}

export const useChessStore = create<ChessStoreState>((set, get) => ({
  gameState: createInitialState(),
  gameStarted: false,
  selectedPos: null,
  legalMoves: [],
  promoteChoice: null,
  witchSkillMode: 'none',
  selectedCheeseType: 'CY',
  antennaPushMode: false,
  antennaPushTargets: [],
  antennaPushPlayer: null,
  skillConfirmTarget: null,
  ostrichRevertChoice: null,
  starshipDeployMode: false,
  starshipDeployTarget: null,
  clockRunning: false,

  startGame: () => {
    const preset = getPreset(get().gameState.clockConfigId ?? 15); // default 正计时
    if (!preset) return;
    const initial = createInitialState();
    const clockMs = preset.isCountUp
      ? { white: 0, black: 0 }
      : { white: preset.initialMs, black: preset.initialMs };
    let bountyCells: Record<string, number> = {};
    if (preset.entropyType === 'bounty') {
      // Bounty：row 4-7（中间4行）每格初始 120s（120000ms）
      // 序列 120→60→30→20→15→10→5
      bountyCells = {};
      for (let r = 4; r <= 7; r++) {
        for (let c = 0; c < 12; c++) {
          bountyCells[`${r},${c}`] = 120_000;
        }
      }
    }
    let poolMs = 0;
    let perMoveMs = 0;
    if (preset.entropyType === 'pool') {
      poolMs = preset.initialMs;         // 共享 60min
      perMoveMs = Math.floor(preset.initialMs / 12) + 5000; // 公共×1/12+5s
    }
    set({
      gameState: {
        ...initial,
        clock: clockMs,
        clockConfigId: preset.id,
        clockAccelStep: { white: 1, black: 1 },
        clockPoolMs: poolMs,
        clockPerMoveMs: perMoveMs,
        clockBountyCells: bountyCells,
      },
      gameStarted: true,
      clockRunning: true,  // 所有模式开局即开始计时
      selectedPos: null,
      legalMoves: [],
      promoteChoice: null,
      witchSkillMode: 'none',
      selectedCheeseType: 'CY',
      antennaPushMode: false,
      antennaPushTargets: [],
      antennaPushPlayer: null,
      skillConfirmTarget: null,
      ostrichRevertChoice: null,
      starshipDeployMode: false,
      starshipDeployTarget: null,
    });
  },

  resetGame: () => {
    set({
      gameState: createInitialState(),
      gameStarted: false,
      clockRunning: false,
      selectedPos: null,
      legalMoves: [],
      promoteChoice: null,
      witchSkillMode: 'none',
      selectedCheeseType: 'CY',
      antennaPushMode: false,
      antennaPushTargets: [],
      antennaPushPlayer: null,
      skillConfirmTarget: null,
      ostrichRevertChoice: null,
      starshipDeployMode: false,
      starshipDeployTarget: null,
    });
  },

  setClockConfig: (id: number) => {
    set(state => ({
      gameState: { ...state.gameState, clockConfigId: id },
    }));
  },

  tick: () => {
    const { gameState } = get();
    if (gameState.phase !== 'playing') return;

    const preset = getPreset(gameState.clockConfigId ?? -1);
    if (!preset) return;

    const player = gameState.currentPlayer;
    const clock = { ...gameState.clock };

    if (preset.isCountUp) {
      // Infinity：正计时
      clock[player] += 1000;
      set({ gameState: { ...gameState, clock } });
      return;
    }

    if (preset.entropyType === 'accelerando') {
      // Accelerando：第N秒扣N token
      const step = { ...gameState.clockAccelStep };
      const deduction = step[player];
      clock[player] -= deduction;
      step[player] += 1;
      if (clock[player] <= 0) {
        clock[player] = 0;
        set({
          gameState: { ...gameState, clock, clockAccelStep: step, phase: player === 'white' ? 'black_wins' : 'white_wins' },
          clockRunning: false,
        });
        return;
      }
      set({ gameState: { ...gameState, clock, clockAccelStep: step } });
      return;
    }

    if (preset.entropyType === 'pool') {
      // Pool：共享时间 + 步限同步递减
      const poolMs = gameState.clockPoolMs - 1000;
      const perMoveMs = gameState.clockPerMoveMs - 1000;
      if (perMoveMs <= 0) {
        // 步限耗尽 → 判负
        set({
          gameState: { ...gameState, clock, clockPoolMs: Math.max(0, poolMs), clockPerMoveMs: 0, phase: player === 'white' ? 'black_wins' : 'white_wins' },
          clockRunning: false,
        });
        return;
      }
      if (poolMs <= 0) {
        // 共享时间耗尽 → 和棋
        set({
          gameState: { ...gameState, clock, clockPoolMs: 0, clockPerMoveMs: perMoveMs, phase: 'draw' },
          clockRunning: false,
        });
        return;
      }
      set({ gameState: { ...gameState, clock, clockPoolMs: poolMs, clockPerMoveMs: perMoveMs } });
      return;
    }

    if (preset.entropyType === 'tug_of_war') {
      // 拔河：白方扣时、黑方加时
      const t = clock.white;
      if (player === 'white') {
        clock.white = t - 1000;
      } else {
        clock.white = t + 1000;
      }
      if (clock.white <= -300_000) {
        // 到 -5min → 白方输
        set({
          gameState: { ...gameState, clock, phase: 'black_wins' },
          clockRunning: false,
        });
        return;
      }
      if (clock.white >= 300_000) {
        // 到 +5min → 黑方输
        set({
          gameState: { ...gameState, clock, phase: 'white_wins' },
          clockRunning: false,
        });
        return;
      }
      set({ gameState: { ...gameState, clock } });
      return;
    }

    // 常规：扣时
    clock[player] -= 1000;
    if (clock[player] <= 0) {
      clock[player] = 0;
      set({
        gameState: { ...gameState, clock, phase: player === 'white' ? 'black_wins' : 'white_wins' },
        clockRunning: false,
      });
      return;
    }
    set({ gameState: { ...gameState, clock } });
  },

  selectCell: (pos: Position) => {
    const { gameState, selectedPos, legalMoves, witchSkillMode, selectedCheeseType, antennaPushMode, antennaPushTargets, skillConfirmTarget } = get();
    const { board, currentPlayer } = gameState;

    if (gameState.phase !== 'playing') return;

    // 有待确认技能时，点击棋盘取消确认
    if (skillConfirmTarget) {
      set({ skillConfirmTarget: null });
      return;
    }

    const piece = getPiece(board, pos);

    // 天线推子模式：点击可推的棋子执行推子
    // 星舰部署模式：点击范围内空格触发部署弹窗
    if (get().starshipDeployMode && selectedPos) {
      const selPiece = getPiece(board, selectedPos);
      if (selPiece && selPiece.type === 'S' && selPiece.owner === currentPlayer) {
        const dr = Math.abs(pos.row - selectedPos.row);
        const dc = Math.abs(pos.col - selectedPos.col);
        if (dr <= 4 && dc <= 4 && isEmpty(board, pos)) {
          set({ starshipDeployTarget: pos });
          return;
        }
      }
      // 点击范围外取消部署
      set({ starshipDeployMode: false, starshipDeployTarget: null, selectedPos: null, legalMoves: [] });
      return;
    }

    if (antennaPushMode) {
      const target = antennaPushTargets.find(
        t => t.from.row === pos.row && t.from.col === pos.col
      );
      if (target) {
        get().executeAntennaPush(pos);
      } else {
        // 点击其他地方取消推子
        set({ antennaPushMode: false, antennaPushTargets: [], selectedPos: null, legalMoves: [], antennaPushPlayer: null });
      }
      return;
    }

    // 取消选中
    if (selectedPos && selectedPos.row === pos.row && selectedPos.col === pos.col) {
      set({ selectedPos: null, legalMoves: [], witchSkillMode: 'none' });
      return;
    }

    // ---- 女巫技能模式（支持所有技能：下毒/奶酪/献祭/自爆）----
    if (witchSkillMode !== 'none' && selectedPos) {
      const witchPiece = getPiece(board, selectedPos);
      if (witchPiece && (witchPiece.type === 'W' || witchPiece.type === 'IW') && witchPiece.owner === currentPlayer) {
        const dr = pos.row - selectedPos.row;
        const dc = pos.col - selectedPos.col;
        const inRange = Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0);
        if (!inRange) return;

        const doWitchSkill = (moveOverrides: Partial<Move> = {}) => {
          const move: Move = {
            from: selectedPos,
            to: selectedPos,
            isWitchSkill: 'poison',
            witchSkillTarget: pos,
            ...moveOverrides,
          };
          const newState = executeMoveWithClock(gameState, move);
          set({ gameState: newState, selectedPos: null, legalMoves: [], witchSkillMode: 'none', selectedCheeseType: 'CY', skillConfirmTarget: null, antennaPushMode: false, antennaPushTargets: [], clockRunning: true });
        };

        // 献祭：点击己方 Z/IZ
        if (witchSkillMode === 'sacrifice') {
          const targetPiece = getPiece(board, pos);
          if (!targetPiece || targetPiece.owner !== currentPlayer) return;
          if (witchPiece.type === 'W' && targetPiece.type !== 'IZ') return;
          if (witchPiece.type === 'IW' && targetPiece.type !== 'Z') return;
          doWitchSkill({ isWitchSkill: 'sacrifice' });
          return;
        }

        // 以下技能都需要空格子
        if (!isEmpty(board, pos)) return;

        const whaleZones = getWhaleZones(board);

        // 下毒
        if (witchSkillMode === 'poison') {
          if (whaleZones.has(`${pos.row},${pos.col}`)) return;
          doWitchSkill({ isWitchSkill: 'poison' });
          return;
        }

        // 奶酪
        if (witchSkillMode === 'cheese') {
          if (whaleZones.has(`${pos.row},${pos.col}`)) return;
          if ((selectedCheeseType === 'CO' || selectedCheeseType === 'CK') && (gameState.sacrificeCount?.[currentPlayer] || 0) <= 0) return;
          doWitchSkill({ isWitchSkill: 'make_cheese', cheeseType: selectedCheeseType });
          return;
        }

        // 自爆（不再需要点击目标格，通过确认弹窗处理）
        if (witchSkillMode === 'self_destruct') {
          return; // 自爆由 requestSelfDestruct 触发，不在此处理
        }
      }
      // 异常：选中棋子不是女巫/反女巫
      set({ selectedPos: null, legalMoves: [], witchSkillMode: 'none', selectedCheeseType: 'CY', skillConfirmTarget: null, antennaPushMode: false, antennaPushTargets: [] });
      return;
    }

    // 点击合法目标 → 走子
    if (selectedPos) {
      const isLegal = legalMoves.some(m => m.to.row === pos.row && m.to.col === pos.col);
      if (isLegal) {
        get().confirmMove(pos);
        return;
      }
    }

    // 选中己方棋子
    if (piece && piece.owner === currentPlayer) {
      if (witchSkillMode !== 'none' && (piece.type === 'W' || piece.type === 'IW')) {
        // 再次点击女巫取消技能模式（已在上面处理）
        set({ selectedPos: null, legalMoves: [], witchSkillMode: 'none' });
        return;
      }

      const moves = getLegalMoves(gameState, pos);
      set({ selectedPos: pos, legalMoves: moves, witchSkillMode: 'none' });
      return;
    }

    // 蓝奶酪控制：对手可操作被控制的那只老鼠
    if (piece && piece.type === 'M' && piece.owner !== currentPlayer &&
        gameState.blueCheeseControl === currentPlayer && gameState.blueCheeseMouseKey !== null) {
      const pKey = pieceKey(piece, pos);
      if (gameState.blueCheeseMouseKey === pKey) {
        const moves = getLegalMoves(gameState, pos);
        set({ selectedPos: pos, legalMoves: moves, witchSkillMode: 'none' });
        return;
      }
    }

    set({ selectedPos: null, legalMoves: [], witchSkillMode: 'none' });
  },

  confirmMove: (to: Position) => {
    const { gameState, selectedPos } = get();
    if (!selectedPos) return;

    const piece = getPiece(gameState.board, selectedPos);
    if (!piece) return;

    // 升变检测
    const needsPromo =
      pawnMustPromote(piece, to) ||
      elephantMustPromote(piece, to);

    if (needsPromo) {
      const options = piece.type === 'P' ? [...PAWN_PROMOTIONS] : [...ELEPHANT_PROMOTIONS];
      set({
        promoteChoice: { from: selectedPos, to, options },
        selectedPos: null,
        legalMoves: [],
      });
      return;
    }

    // 骷髅兵/反骷髅兵自动升变
    if (skeletonMustPromote(piece, to) || antiSkeletonMustPromote(piece, to)) {
      const move: Move = { from: selectedPos, to };
      const newState = executeMoveWithClock(gameState, move);
      set({ gameState: newState, selectedPos: null, legalMoves: [], clockRunning: true });
      return;
    }

    const dr = to.row - selectedPos.row;
    const dc = to.col - selectedPos.col;
    const isJumpMove = (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (dr === 0 && Math.abs(dc) === 2);

    const move: Move = { from: selectedPos, to };
    const wasJump = isJumpMove;
    const movedType = piece.type;
    const mover = piece.owner;
    const newState = executeMoveWithClock(gameState, move);

    // 天线规则：每次移动完白送一次推子（原仅天线跳跃触发，现所有走子后都触发）
    // 收集走子方所有天线的可推目标，仍为单次免费，不消耗回合（回合已在 executeMove 中切换）
    {
      const antennas: Position[] = [];
      for (let row = 0; row < newState.board.length; row++) {
        for (let col = 0; col < newState.board[row].length; col++) {
          const p = getPiece(newState.board, { row, col });
          if (p && p.owner === mover && p.type === 'A') antennas.push({ row, col });
        }
      }
      const allTargets: { from: Position; to: Position; piece: Piece }[] = [];
      for (const aPos of antennas) {
        allTargets.push(...getAntennaPushTargets(newState.board, aPos));
      }
      // 去重（同一棋子被多天线同时可推只保留一次）
      const seen = new Set<string>();
      const pushTargets = allTargets.filter((t) => {
        const k = `${t.from.row},${t.from.col}->${t.to.row},${t.to.col}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (pushTargets.length > 0) {
        set({
          gameState: newState,
          selectedPos: to,
          legalMoves: [],
          antennaPushMode: true,
          antennaPushTargets: pushTargets,
          antennaPushPlayer: mover,
          clockRunning: true,
        });
        void wasJump;
        void movedType;
        return;
      }
    }

    // 鸵鸟移动后询问是否变回皇后
    let ostrichRevert: { pos: Position; player: Player } | null = null;
    if (piece.type === 'O' && (to.row !== selectedPos.row || to.col !== selectedPos.col)) {
      ostrichRevert = { pos: to, player: piece.owner };
    }

    set({ gameState: newState, selectedPos: null, legalMoves: [], clockRunning: true, ostrichRevertChoice: ostrichRevert });
  },

  confirmPromotion: (type: PieceType) => {
    const { gameState, promoteChoice } = get();
    if (!promoteChoice) return;

    const move: Move = {
      from: promoteChoice.from,
      to: promoteChoice.to,
      promoteTo: type,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({ gameState: newState, promoteChoice: null, clockRunning: true });
  },

  cancelPromotion: () => {
    set({ promoteChoice: null, selectedPos: null, legalMoves: [] });
  },

  undoLastMove: () => {
    const { gameState } = get();
    const undone = undoMove(gameState);
    if (undone) {
      set({ gameState: undone, selectedPos: null, legalMoves: [], witchSkillMode: 'none', selectedCheeseType: 'CY', skillConfirmTarget: null, antennaPushMode: false, antennaPushTargets: [], antennaPushPlayer: null, clockRunning: false });
    }
  },

  setWitchSkillMode: (mode) => {
    const { selectedPos, gameState } = get();
    // 确保当前选中的是己方女巫/反女巫
    if (mode !== 'none' && selectedPos) {
      const piece = getPiece(gameState.board, selectedPos);
      if (!piece || piece.owner !== gameState.currentPlayer) {
        set({ witchSkillMode: 'none', legalMoves: [] });
        return;
      }
      // W 和 IW 都可以使用全部技能
      if (piece.type !== 'W' && piece.type !== 'IW') {
        set({ witchSkillMode: 'none', legalMoves: [] });
        return;
      }
    }
    set({ witchSkillMode: mode, selectedCheeseType: 'CY', skillConfirmTarget: null, legalMoves: [], antennaPushMode: false, antennaPushTargets: [] });
  },

  setCheeseType: (type: CheeseType) => {
    const { selectedPos, gameState } = get();
    if (!selectedPos) return;
    const piece = getPiece(gameState.board, selectedPos);
    if (!piece || (piece.type !== 'W' && piece.type !== 'IW') || piece.owner !== gameState.currentPlayer) return;
    set({ witchSkillMode: 'cheese', selectedCheeseType: type, skillConfirmTarget: null, legalMoves: [], antennaPushMode: false, antennaPushTargets: [] });
  },

  confirmSkill: () => {
    const { gameState, selectedPos } = get();
    if (!selectedPos) return;
    const piece = getPiece(gameState.board, selectedPos);
    if (!piece || (piece.type !== 'W' && piece.type !== 'IW')) { set({ skillConfirmTarget: null }); return; }
    // 自爆固定以女巫位置为基准
    const move: Move = {
      from: selectedPos,
      to: selectedPos,
      isWitchSkill: 'self_destruct',
    };
    const newState = executeMoveWithClock(gameState, move);
    set({
      gameState: newState,
      selectedPos: null,
      legalMoves: [],
      witchSkillMode: 'none',
      selectedCheeseType: 'CY',
      antennaPushMode: false,
      antennaPushTargets: [],
      antennaPushPlayer: null,
      skillConfirmTarget: null,
      clockRunning: true,
    });
  },

  cancelSkill: () => {
    set({ skillConfirmTarget: null });
  },

  requestSelfDestruct: () => {
    const { selectedPos, gameState } = get();
    if (!selectedPos) return;
    const piece = getPiece(gameState.board, selectedPos);
    if (!piece || (piece.type !== 'W' && piece.type !== 'IW') || piece.owner !== gameState.currentPlayer) return;
    const board = gameState.board;
    // 与引擎一致：左右各放一个，有空就放（单侧可爆）。仅当两侧都越界才拒绝。
    const leftPos = { row: selectedPos.row, col: selectedPos.col - 1 };
    const rightPos = { row: selectedPos.row, col: selectedPos.col + 1 };
    const leftIn = inBounds(leftPos);
    const rightIn = inBounds(rightPos);
    if (!leftIn && !rightIn) return;
    const whaleZones = getWhaleZones(board);
    const leftOk = leftIn && isEmpty(board, leftPos) && !whaleZones.has(`${leftPos.row},${leftPos.col}`);
    const rightOk = rightIn && isEmpty(board, rightPos) && !whaleZones.has(`${rightPos.row},${rightPos.col}`);
    // 即使两侧都被堵，变身本身仍生效（引擎会执行 W->Z），允许弹窗确认
    void leftOk;
    void rightOk;
    set({ skillConfirmTarget: selectedPos });
  },

  executeWitchSkill: (pos: Position) => {
    const { gameState, witchSkillMode, selectedPos, selectedCheeseType } = get();
    if (witchSkillMode === 'none' || !selectedPos) return;

    const modeMap: Record<string, Move['isWitchSkill']> = {
      poison: 'poison',
      cheese: 'make_cheese',
      sacrifice: 'sacrifice',
      self_destruct: 'self_destruct',
    };
    const move: Move = {
      from: selectedPos,
      to: selectedPos,
      isWitchSkill: modeMap[witchSkillMode] || 'poison',
      witchSkillTarget: pos,
      cheeseType: witchSkillMode === 'cheese' ? selectedCheeseType : undefined,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({
      gameState: newState,
      witchSkillMode: 'none',
      selectedCheeseType: 'CY',
      selectedPos: null,
      legalMoves: [],
      antennaPushMode: false,
      antennaPushTargets: [],
      skillConfirmTarget: null,
      clockRunning: true,
    });
  },

  transformQueen: () => {
    const { gameState, selectedPos } = get();
    if (!selectedPos) return;
    const piece = getPiece(gameState.board, selectedPos);
    if (!piece || piece.type !== 'Q' || piece.owner !== gameState.currentPlayer) return;

    const move: Move = {
      from: selectedPos,
      to: selectedPos,
      isQueenToOstrich: true,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({ gameState: newState, selectedPos: null, legalMoves: [], witchSkillMode: 'none', skillConfirmTarget: null, antennaPushMode: false, antennaPushTargets: [], antennaPushPlayer: null, clockRunning: true });
  },

  executeAntennaPush: (from: Position) => {
    const { gameState, antennaPushTargets } = get();
    const target = antennaPushTargets.find(
      t => t.from.row === from.row && t.from.col === from.col
    );
    if (!target) return;

    // 免费推子：记历史、可撤销；带毒一起搬；被控老鼠键跟随；判吃王胜负；不二次切换回合
    const boardBefore = gameState.board.map(row => [...row]);
    const poisonBefore = { ...gameState.poison };
    const newBoard = gameState.board.map(row => [...row]);
    newBoard[target.to.row][target.to.col] = target.piece;
    newBoard[target.from.row][target.from.col] = null;

    const newPoison: Record<string, number> = { ...gameState.poison };
    const oldKey = pieceKey(target.piece, target.from);
    const newKey = pieceKey(target.piece, target.to);
    if (newPoison[oldKey]) {
      newPoison[newKey] = (newPoison[newKey] || 0) + newPoison[oldKey];
      delete newPoison[oldKey];
    }
    let newMouseKey = gameState.blueCheeseMouseKey;
    if (newMouseKey !== null && newMouseKey === oldKey) newMouseKey = newKey;

    // 吃王判胜（含被推子撞掉王的极端情况）：沿用终局规则
    let phase = gameState.phase;
    {
      let whiteKing = false;
      let blackKing = false;
      for (let r = 0; r < newBoard.length; r++) {
        for (let c = 0; c < newBoard[r].length; c++) {
          const cell = newBoard[r][c];
          if (cell && typeof cell === 'object' && 'type' in cell) {
            const p = cell as Piece;
            if (p.type === 'K' || p.type === 'G') {
              if (p.owner === 'white') whiteKing = true;
              else blackKing = true;
            }
          }
        }
      }
      if (!whiteKing && !blackKing) phase = 'draw';
      else if (!whiteKing) phase = 'black_wins';
      else if (!blackKing) phase = 'white_wins';
    }

    const newState = {
      ...gameState,
      board: newBoard,
      poison: newPoison,
      blueCheeseMouseKey: newMouseKey,
      phase,
      history: [
        ...gameState.history,
        {
          move: { from: target.from, to: target.to },
          boardBefore,
          poisonBefore,
          fearsBefore: { ...gameState.fears },
          hasOstrichBefore: { ...gameState.hasOstrich },
          rocketPosBefore: {
            white: gameState.rocketPos.white ? { ...gameState.rocketPos.white } : null,
            black: gameState.rocketPos.black ? { ...gameState.rocketPos.black } : null,
          },
          decryptionActiveBefore: gameState.decryptionActive,
          decryptionStepBefore: gameState.decryptionStep,
          blueCheeseControlBefore: gameState.blueCheeseControl,
          blueCheeseMouseKeyBefore: gameState.blueCheeseMouseKey,
          sacrificeCountBefore: { ...gameState.sacrificeCount },
          clockBefore: { ...gameState.clock },
          clockAccelStepBefore: { ...gameState.clockAccelStep },
          clockPoolMsBefore: gameState.clockPoolMs,
          clockPerMoveMsBefore: gameState.clockPerMoveMs,
          clockBountyCellsBefore: { ...gameState.clockBountyCells },
        },
      ],
    };
    set({
      gameState: newState,
      antennaPushMode: false,
      antennaPushTargets: [],
      antennaPushPlayer: null,
      skillConfirmTarget: null,
      selectedPos: null,
      legalMoves: [],
      clockRunning: true,
    });
  },

  executeDecrypt: () => {
    const { gameState } = get();
    if (gameState.decryptionActive) return;
    if (!canDecrypt(gameState.board, gameState.currentPlayer)) return;

    const move: Move = {
      from: { row: -1, col: -1 },
      to: { row: -1, col: -1 },
      isDecryption: true,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({ gameState: newState, selectedPos: null, legalMoves: [], skillConfirmTarget: null, antennaPushMode: false, antennaPushTargets: [], clockRunning: true });
  },

  confirmOstrichRevert: () => {
    const { gameState, ostrichRevertChoice } = get();
    if (!ostrichRevertChoice) return;

    const move: Move = {
      from: ostrichRevertChoice.pos,
      to: ostrichRevertChoice.pos,
      isOstrichToQueen: true,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({ gameState: newState, ostrichRevertChoice: null, clockRunning: true });
  },

  cancelOstrichRevert: () => {
    set({ ostrichRevertChoice: null });
  },

  synthesizeStarship: () => {
    const { gameState, selectedPos } = get();
    if (!selectedPos) return;
    const piece = getPiece(gameState.board, selectedPos);
    if (!piece || piece.type !== 'U' || piece.owner !== gameState.currentPlayer) return;
    if (!canSynthesizeStarship(gameState.board, gameState.currentPlayer)) return;

    const move: Move = {
      from: selectedPos,
      to: selectedPos,
      isSpacemanToStarship: true,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({ gameState: newState, selectedPos: null, legalMoves: [], witchSkillMode: 'none', skillConfirmTarget: null, antennaPushMode: false, antennaPushTargets: [], antennaPushPlayer: null, starshipDeployMode: false, starshipDeployTarget: null, clockRunning: true });
  },

  setStarshipDeployMode: (mode: boolean) => {
    const { selectedPos, gameState } = get();
    if (mode && selectedPos) {
      const piece = getPiece(gameState.board, selectedPos);
      if (piece && piece.type === 'S' && piece.owner === gameState.currentPlayer) {
        set({ starshipDeployMode: true, legalMoves: [], witchSkillMode: 'none', antennaPushMode: false, antennaPushTargets: [], antennaPushPlayer: null, skillConfirmTarget: null });
        return;
      }
    }
    set({ starshipDeployMode: false, starshipDeployTarget: null });
  },

  confirmStarshipDeploy: (type: PieceType) => {
    const { gameState, selectedPos, starshipDeployTarget } = get();
    if (!selectedPos || !starshipDeployTarget) return;
    const piece = getPiece(gameState.board, selectedPos);
    if (!piece || piece.type !== 'S') return;
    // 星舰只能部署非关键子：禁 K/G/U/S/X，与引擎一致
    if ((['K', 'G', 'U', 'S', 'X'] as PieceType[]).includes(type)) return;

    const move: Move = {
      from: selectedPos,
      to: starshipDeployTarget,
      isStarshipDeploy: true,
      starshipDeployType: type,
    };
    const newState = executeMoveWithClock(gameState, move);
    set({ gameState: newState, selectedPos: null, legalMoves: [], starshipDeployMode: false, starshipDeployTarget: null, clockRunning: true });
  },
}));
