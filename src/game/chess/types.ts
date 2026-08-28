// ============================================================
// 复合象棋 — 类型定义
// ============================================================

/** 棋盘大小 */
export const BOARD_SIZE = 12;

/** 坐标 (row, col) */
export interface Position {
  row: number; // 0-11, 0=黑方底线（上方/顶部）, 11=白方底线（下方/底部）
  col: number; // 0-11
}

/** 棋子类型枚举 */
export type PieceType =
  | 'K'    // 王
  | 'Q'    // 后
  | 'R'    // 车
  | 'B'    // 教
  | 'N'    // 马
  | 'P'    // 兵
  | 'T'    // 猫
  | 'Y'    // 缅因猫
  | 'M'    // 老鼠
  | 'E'    // 象
  | 'L'    // 英语
  | 'A'    // 天线
  | 'C'    // 大炮
  | 'W'    // 女巫
  | 'Z'    // 骷髅兵
  | 'IW'   // 反女巫
  | 'IZ'   // 反骷髅兵
  | 'J'    // 圣骑士
  | 'H'    // 巨鲸
  | 'X'    // 火箭
  | 'U'    // 太空人
  | 'S'    // 星舰
  | 'O'    // 鸵鸟
  | 'G';   // 猫娘

/** 所有棋子类型列表 */
export const ALL_PIECE_TYPES: PieceType[] = [
  'K','Q','R','B','N','P','T','Y','M','E','L','A','C',
  'W','Z','IW','IZ','J','H','X','U','S','O','G',
];

/** 玩家 */
export type Player = 'white' | 'black';

/** 棋盘上的棋子 */
export interface Piece {
  type: PieceType;
  owner: Player;
}

/** 格子内容：棋子 | 毒药 | 奶酪 | 空 */
export type CheeseType = 'CY' | 'CO' | 'CB' | 'CP' | 'CK';
export type CellExtra = 'poison' | CheeseType;
export type CellContent = Piece | CellExtra | null;

/** 棋盘 = 12×12 二维数组 */
export type Board = CellContent[][];

/** 中毒状态：按棋子类型记录中毒次数 */
export type PoisonMap = Record<string, number>; // key: "white_K_0", "black_M_1" etc.

/** 老鼠恐惧标记：{ chessKey: 剩余恐惧回合数 } */
export type FearMap = Record<string, number>;

/** 走法 */
export interface Move {
  from: Position;
  to: Position;
  promoteTo?: PieceType; // 升变目标
  isWitchSkill?: 'poison' | 'self_destruct' | 'make_cheese' | 'sacrifice'; // 女巫技能
  witchSkillTarget?: Position; // 女巫技能目标位置
  cheeseType?: CheeseType; // 制作奶酪类型
  isStarshipDeploy?: boolean; // 星舰部署
  starshipDeployType?: PieceType; // 星舰部署棋子类型
  isDecryption?: boolean; // 破译
  isQueenToOstrich?: boolean; // 后变鸵鸟
  isOstrichToQueen?: boolean; // 鸵鸟变回后（同时猫娘变回王）
  isSpacemanToStarship?: boolean; // 太空人合成星舰
}

/** 历史记录条目 */
export interface HistoryEntry {
  move: Move;
  boardBefore: Board;
  poisonBefore?: PoisonMap;  // 修复：保存中毒状态用于撤销
  fearsBefore?: FearMap;     // 修复：保存恐惧状态用于撤销
  captured?: Piece; // 被吃的棋子
  poisonAdded?: { key: string; count: number }; // 新增中毒
  cheeseAdded?: { pos: Position; type: CheeseType }; // 新增奶酪
  hasOstrichBefore?: { white: boolean; black: boolean };
  rocketPosBefore?: { white: Position | null; black: Position | null };
  decryptionActiveBefore?: boolean;
  decryptionStepBefore?: 0 | 1 | 2 | 3;
  blueCheeseControlBefore?: Player | null;
  blueCheeseMouseKeyBefore?: string | null;
  sacrificeCountBefore?: { white: number; black: number };
  // ── 棋钟历史 ──
  clockBefore?: { white: number; black: number };
  clockAccelStepBefore?: { white: number; black: number };
  clockPoolMsBefore?: number;
  clockPerMoveMsBefore?: number;
  clockBountyCellsBefore?: Record<string, number>;
}

/** 游戏阶段 */
export type GamePhase = 'playing' | 'white_wins' | 'black_wins' | 'draw';

/** 完整游戏状态 */
export interface GameState {
  board: Board;
  currentPlayer: Player;
  phase: GamePhase;
  moveCount: number;
  poison: PoisonMap;          // 棋子中毒次数
  fears: FearMap;             // 老鼠恐惧
  history: HistoryEntry[];
  // 特殊标记
  hasOstrich: { white: boolean; black: boolean }; // 是否有鸵鸟
  rocketPos: { white: Position | null; black: Position | null }; // 火箭位置
  // 破译相关
  decryptionActive: boolean;
  decryptionStep: 0 | 1 | 2 | 3; // 0=未激活, 1=第一行动已执行, 2=对手第二行动, 3=破译者执行第三行动
  // 蓝奶酪控制
  blueCheeseControl: Player | null;
  blueCheeseMouseKey: string | null; // 被控制的老鼠坐标键
  // 献祭次数
  sacrificeCount: { white: number; black: number };
  // 状态哈希历史（用于三次重复局面检测）
  stateHashes: string[];
  // ── 棋钟 ──
  clock: { white: number; black: number };
  clockConfigId: number | null;
  /** Accelerando 模式：当前秒数（第N秒扣N） */
  clockAccelStep: { white: number; black: number };
  /** Pool 模式：共享时间（毫秒） */
  clockPoolMs: number;
  /** Pool 模式：当前步限时（毫秒） */
  clockPerMoveMs: number;
  /** Bounty 模式：棋盘时间币 "row,col" → 剩余毫秒 */
  clockBountyCells: Record<string, number>;
}

/** 关键棋子列表（被将死则负） */
export const CRITICAL_PIECES: PieceType[] = ['K', 'G'];

/** 不可移动的棋子 */
export const IMMOBILE_PIECES: PieceType[] = ['X'];

/** 免疫中毒的棋子 */
export const POISON_IMMUNE: PieceType[] = ['K', 'W', 'J', 'U', 'S', 'X', 'IW'];

/** 不可吃子的棋子 */
export const CANNOT_CAPTURE: PieceType[] = ['Y', 'W', 'IW', 'U', 'O'];

/** 鹰（不可阻挡，不阻碍其他棋子吃子检查） */
export const UNBLOCKABLE: PieceType[] = ['T'];

/** 进入英语禁区会被消灭的棋子（* 标记） */
export const ENGLISH_VULNERABLE: PieceType[] = ['P','E','Z','IZ','M','N','T','Y','W','IW','R','C','O','G','H'];
