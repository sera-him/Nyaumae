// ============================================================
// 概率三子棋 — Zustand 状态管理
// ============================================================

import { create } from 'zustand';
import type { TTT3GameState, TTT3Player, Skill, Profession } from '@/game/ttt3/types';
import { Skill as SkillEnum } from '@/game/ttt3/types';
import {
  createInitialState,
  startOfTurn,
  placePiece,
  endTurn,
  useSkill,
  buyProfession,
  forgetProfession,
  matthewShift,
  parseMoveInput,
  handleGridRewriteKey,
  getOverloadRate,
} from '@/game/ttt3/engine';

interface TTT3Store {
  // 游戏状态
  gameState: TTT3GameState;
  phase: 'menu' | 'playing' | 'ended';

  // 设置
  controllerO: number;
  controllerX: number;
  setControllerO: (v: number) => void;
  setControllerX: (v: number) => void;

  // 游戏控制
  startGame: () => void;
  resetGame: () => void;
  restartWithSameSettings: () => void;

  // 落子
  makeMove: (logicalPos: number) => void;

  // 技能
  activeSkill: Skill | null;
  setActiveSkill: (skill: Skill | null) => void;
  executeSkill: (skill: Skill, params?: Record<string, unknown>) => void;

  // 职业
  showProfShop: boolean;
  setShowProfShop: (v: boolean) => void;
  buyProf: (prof: Profession, snatch?: boolean) => void;
  forgetProf: (index: number) => void;

  // Matthew Shift
  matthewShiftCells: [number, number] | null;
  setMatthewShiftCells: (cells: [number, number] | null) => void;
  executeMatthewShift: () => void;

  // 跳过回合
  skipTurn: () => void;

  // 信息过载视觉效果
  getOverloadRateForPlayer: (player: TTT3Player) => number;

  // 工具
  isHumanTurn: () => boolean;
  getControllerLabel: (player: TTT3Player) => string;
}

export const useTTT3Store = create<TTT3Store>((set, get) => ({
  gameState: createInitialState(0, 0),
  phase: 'menu',
  controllerO: 0,
  controllerX: 0,
  activeSkill: null,
  showProfShop: false,
  matthewShiftCells: null,

  setControllerO: (v) => set({ controllerO: v }),
  setControllerX: (v) => set({ controllerX: v }),

  startGame: () => {
    const { controllerO, controllerX } = get();
    const initial = createInitialState(controllerO, controllerX);
    initial.controllerO = controllerO;
    initial.controllerX = controllerX;
    initial.phase = 'playing';

    // 应用 Assassin 加成
    // (engine 中的 createInitialState 没有调用 applyAssassinBonus，需要在这里补充)
    // 但 applyAssassinBonus 需要 state 参数，而初始状态没有职业，所以跳过

    // 开始第一个回合
    const afterStart = startOfTurn(initial, 0);

    set({
      gameState: afterStart,
      phase: 'playing',
      activeSkill: null,
      showProfShop: false,
      matthewShiftCells: null,
    });
  },

  resetGame: () => {
    set({
      gameState: createInitialState(0, 0),
      phase: 'menu',
      activeSkill: null,
      showProfShop: false,
      matthewShiftCells: null,
    });
  },

  restartWithSameSettings: () => {
    const { controllerO, controllerX } = get();
    const initial = createInitialState(controllerO, controllerX);
    initial.controllerO = controllerO;
    initial.controllerX = controllerX;
    initial.phase = 'playing';
    initial.playerOWins = get().gameState.playerOWins;
    initial.playerXWins = get().gameState.playerXWins;
    const afterStart = startOfTurn(initial, 0);
    set({
      gameState: afterStart,
      phase: 'playing',
      activeSkill: null,
      showProfShop: false,
      matthewShiftCells: null,
    });
  },

  makeMove: (logicalPos) => {
    const { gameState } = get();
    if (gameState.phase !== 'playing') return;

    const player = gameState.currentPlayer;

    // Grid Rewrite 封锁期间：logicalPos 是键盘数字索引（0-8）
    if (gameState.gridRewriteActive[player]) {
      const keyIndex = logicalPos;
      if (keyIndex < 0 || keyIndex > 8) return;
      if (gameState.gridRewriteKeysUsed[player][keyIndex]) return;

      const { state: afterKey, canPlace, physicalPos } = handleGridRewriteKey(gameState, player, keyIndex);

      if (!canPlace) {
        // 免费解锁，回合继续
        set({ gameState: afterKey });
        return;
      }

      // 可以落子 → 解锁 + 落子
      const result = placePiece(afterKey, player, physicalPos);
      if (result.gamblerRetry) {
        // 赌徒重试，回合不结束，玩家重新选择位置
        set({ gameState: result.state, activeSkill: null });
        return;
      }
      const afterTurn = endTurn(result.state);
      const isEnded = afterTurn.phase !== 'playing';
      set({ gameState: afterTurn, activeSkill: null, phase: isEnded ? 'ended' : 'playing' });
      return;
    }

    // 正常落子
    const physicalPos = parseMoveInput(gameState, logicalPos, player);
    if (physicalPos < 0 || physicalPos > 8) return;
    if (gameState.board[physicalPos] !== 0) return;
    if (gameState.spatialSealPos === physicalPos) return;
    if (gameState.mindMaze[player] > 0) {
      const allowed = gameState.mazeAllowed[player];
      if (allowed && !allowed.includes(physicalPos)) return;
    }

    const result = placePiece(gameState, player, physicalPos);
    if (result.gamblerRetry) {
      // 赌徒重试，回合不结束，玩家重新选择位置
      set({ gameState: result.state, activeSkill: null });
      return;
    }
    // 结束回合（胜负检查在 endTurn 中统一处理）
    const afterTurn = endTurn(result.state);
    const isEnded = afterTurn.phase !== 'playing';
    set({ gameState: afterTurn, activeSkill: null, phase: isEnded ? 'ended' : 'playing' });
  },

  setActiveSkill: (skill) => set({ activeSkill: skill }),

  executeSkill: (skill, params) => {
    const { gameState } = get();
    if (gameState.phase !== 'playing') return;

    const player = gameState.currentPlayer;
    const result = useSkill(gameState, skill, player, params);

    if (!result.success) {
      set({ gameState: result.state });
      return;
    }

    // 结束回合的技能
    const turnEndingSkills = [
      SkillEnum.SP_SIPHON,
      SkillEnum.SKIP_PROTOCOL,
      SkillEnum.CAPACITOR,
    ];

    if ((turnEndingSkills as number[]).includes(skill)) {
      const afterTurn = endTurn(result.state);
      const isEnded = afterTurn.phase !== 'playing';
      set({ gameState: afterTurn, activeSkill: null, phase: isEnded ? 'ended' : 'playing' });
      return;
    }

    set({ gameState: result.state, activeSkill: null });
  },

  setShowProfShop: (v) => set({ showProfShop: v }),

  buyProf: (prof, snatch = false) => {
    const { gameState } = get();
    const player = gameState.currentPlayer;
    const result = buyProfession(gameState, player, prof, snatch);
    if (result.success) {
      set({ gameState: result.state, showProfShop: false });
    }
  },

  forgetProf: (index) => {
    const { gameState } = get();
    const player = gameState.currentPlayer;
    const result = forgetProfession(gameState, player, index);
    if (result.success) {
      set({ gameState: result.state });
    }
  },

  setMatthewShiftCells: (cells) => set({ matthewShiftCells: cells }),

  executeMatthewShift: () => {
    const { gameState, matthewShiftCells } = get();
    if (!matthewShiftCells) return;
    const player = gameState.currentPlayer;
    const result = matthewShift(gameState, player, matthewShiftCells[0], matthewShiftCells[1]);
    if (result.success) {
      set({ gameState: result.state, matthewShiftCells: null });
    }
  },

  skipTurn: () => {
    const { gameState } = get();
    if (gameState.phase !== 'playing') return;
    const player = gameState.currentPlayer;

    // 如果被惩罚，直接结束回合，不使用 Skip Protocol
    if (gameState.skipPunishTurns[player] > 0) {
      const afterTurn = endTurn(gameState);
      set({ gameState: afterTurn });
      return;
    }

    // Skip Protocol 逻辑：如果本回合还没用过 Skip Protocol
    if (gameState.skillUsedTurn[player][SkillEnum.SKIP_PROTOCOL]) {
      // 已用过，只是跳过
      const afterTurn = endTurn(gameState);
      set({ gameState: afterTurn });
      return;
    }

    // 尝试使用 Skip Protocol
    const result = useSkill(gameState, SkillEnum.SKIP_PROTOCOL, player);
    const afterTurn = endTurn(result.state);
    set({ gameState: afterTurn });
  },

  getOverloadRateForPlayer: (player) => {
    const { gameState } = get();
    const opp = 1 - player as TTT3Player;
    return gameState.infoOverload[player]
      ? getOverloadRate(gameState.infoOverloadUses[opp])
      : 0;
  },

  isHumanTurn: () => {
    const { gameState, controllerO, controllerX } = get();
    const p = gameState.currentPlayer;
    return p === 0 ? controllerO === 0 : controllerX === 0;
  },

  getControllerLabel: (player) => {
    const { controllerO, controllerX } = get();
    const ctrl = player === 0 ? controllerO : controllerX;
    if (ctrl === 0) return '玩家';
    return `AI Lv${ctrl}`;
  },
}));
