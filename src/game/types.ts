import type { LValue } from "./math";

// ============================================================
// Core Types
// ============================================================

export type EnemyType = string;

export type WeaponRarity = "common" | "rare" | "epic" | "legendary";

export type RuneType = "atk" | "crit" | "speed" | "weak" | "range" | "pierce";

export type Rune = {
  id: string;
  type: RuneType;
  level: number; // 1~inf
  star: number; // 1~5
};

export type Weapon = {
  id: string;
  name: string;
  rarity: WeaponRarity;
  targetTypes: EnemyType[]; // primary + optional secondary
  basePower: LValue;
  level: number; // resource upgrade, no cap
  tier: number; // evolve tier, 0~inf
  fragExclusive: number;
  fragUniversal: number;
  fragNeedEx: number;
  fragNeedUni: number;
  weaknessMult: number; // increases with tier
  runeSlots: (Rune | null)[]; // unlocked by tier
  fireRate: number; // shots per second
  range: number; // pixels
  projectileSpeed: number;
  pierce?: number; // pierce count from tier unlocks
  scatter?: number; // scatter count from tier unlocks
};

export type EnemyDef = {
  id: EnemyType;
  name: string;
  color: string;
  radius: number;
  speed: number; // pixels per second
  hpMult: number; // multiplier on base stage HP
  behavior: "chase" | "circle" | "dash" | "shoot";
  shootInterval?: number; // for shoot behavior
  damage: LValue;
};

export type Enemy = {
  defId: EnemyType;
  x: number;
  y: number;
  hp: LValue;
  maxHp: LValue;
  vx: number;
  vy: number;
  alive: boolean;
  invulnTimer: number; // iframe after hit
};

export type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: LValue;
  pierceLeft: number;
  fromWeaponId: string;
  color: string;
  alive: boolean;
};

export type Player = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number; // pixels per second
  invulnTimer: number;
};

export type StageCondition = {
  id: string;
  text: string;
  check: (stats: RunStats) => boolean;
};

export type RunStats = {
  clearTime: number; // seconds
  hitsTaken: number;
  weaponSwitchCount: number;
  lowestHpWeaponLevel: number; // lowest level weapon used
  allWeakness: boolean; // whether all kills were weakness hits
  killLog: { weaponId: string; wasWeakness: boolean }[];
};

export type StageReward = {
  firstClear: {
    universalResource: LValue;
    exclusiveFrags: Record<string, number>;
    chestChance: number; // 0~1
  };
  repeat: {
    universalResource: LValue;
    exclusiveFrags: Record<string, number>;
  };
};

export type GameSaveData = {
  key: string;
  playerState: PlayerProgress;
  shipState: ShipState;
  stageProgress: StageProgressMap;
  unlockedWeapons: string[]; // weapon IDs unlocked
  weaponInventory: Weapon[];
  quickBar: (string | null)[]; // weapon IDs in slots 0-9
  runeInventory: Rune[];
  lastSaveTime: number;
  checksum: string;
};

export type PlayerProgress = {
  universalResource: LValue;
  currentStage: number; // max stage reached
  totalKills: number;
};

export type ShipState = {
  level: number;
  productionRate: LValue;
  storageCap: LValue;
  currentStorage: LValue;
  weapons: ShipWeaponState[];
};

export type ShipWeaponState = {
  slot: number;
  level: number;
  damage: LValue;
  fireRate: number;
  range: number;
};

export type StageProgressMap = {
  [stageId: number]: {
    cleared: boolean;
    bestStars: number;
    clearCount: number;
  };
};

// ============================================================
// In-battle runtime state
// ============================================================
export type BattleState = {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  enemyProjectiles: Projectile[]; // enemy bullets
  currentWeaponIndex: number; // 0-9
  weaponsInBar: (Weapon | null)[];
  stageId: number;
  elapsed: number;
  flow: number;
  flowTimer: number;
  stellarFlowTimer: number;
  swapTimer: number;
  flowSwitchWindow: number;
  flowSourceWeaponId: string | null;
  lastHitWeaponId: string | null;
  stats: RunStats;
  paused: boolean;
  completed: boolean;
  failed: boolean;
};

// ============================================================
// Game mode
// ============================================================
export type GameScreen =
  | "menu"
  | "stage-select"
  | "loadout"
  | "playing"
  | "paused"
  | "victory"
  | "defeat"
  | "ship";
