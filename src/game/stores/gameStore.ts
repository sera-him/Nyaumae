import { create } from "zustand";
import type {
  GameScreen,
  Weapon,
  PlayerProgress,
  ShipState,
  StageProgressMap,
  Rune,
  GameSaveData,
  BattleState,
} from "../types";
import { STARTING_WEAPONS } from "../data";
import { lAdd, lMulScalar, lGte } from "../math";
import type { LValue } from "../math";
import { readJsonStorage, readStorageValue, writeJsonStorage, writeStorageValue } from "@/lib/browserStorage";

// ============================================================
// Save/Load helpers
// ============================================================
const SALT = "nc_stellar_v1_";

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function packSave(state: GameStoreState): GameSaveData {
  return {
    key: state.saveKey,
    playerState: state.playerState,
    shipState: state.shipState,
    stageProgress: state.stageProgress,
    unlockedWeapons: state.unlockedWeapons,
    weaponInventory: state.weaponInventory,
    quickBar: state.quickBar,
    runeInventory: state.runeInventory,
    lastSaveTime: Date.now(),
    checksum: "",
  };
}

// ============================================================
// Store Interface
// ============================================================
interface GameStoreState {
  // Navigation
  screen: GameScreen;
  setScreen: (s: GameScreen) => void;

  // Save Key
  saveKey: string;
  setSaveKey: (k: string) => void;
  generateKey: () => string;

  // Player Progress
  playerState: PlayerProgress;
  addResource: (amount: LValue) => void;
  spendResource: (amount: LValue) => boolean;

  // Weapon Inventory
  unlockedWeapons: string[];
  weaponInventory: Weapon[];
  quickBar: (string | null)[]; // weapon IDs

  unlockWeapon: (w: Weapon) => void;
  upgradeWeapon: (weaponId: string) => boolean;
  evolveWeapon: (weaponId: string) => boolean;
  setQuickBarSlot: (slot: number, weaponId: string | null) => void;
  getWeaponById: (id: string) => Weapon | undefined;

  // Rune Inventory
  runeInventory: Rune[];
  addRune: (r: Rune) => void;
  equipRune: (runeId: string, weaponId: string, slotIdx: number) => boolean;
  unequipRune: (weaponId: string, slotIdx: number) => Rune | null;

  // Stage Progress
  stageProgress: StageProgressMap;
  recordStageClear: (stageId: number, stars: number, isFirst: boolean) => void;
  getMaxClearedStage: () => number;

  // Ship
  shipState: ShipState;
  collectShipStorage: () => LValue;
  upgradeShip: () => boolean;

  // Battle (runtime only, not saved)
  battleState: BattleState | null;
  setBattleState: (b: BattleState | null) => void;

  // Save/Load
  saveGame: () => void;
  loadGame: (key: string) => { success: boolean; error?: string; offlineIncome?: LValue };
  hasSave: (key: string) => boolean;
  calculateOfflineIncome: (seconds: number) => LValue;

  // Init new game
  // Stage selection (runtime)
  currentStageId: number;

  initNewGame: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  // Screen
  screen: "menu",
  setScreen: (s) => set({ screen: s }),

  // Save Key
  saveKey: "",
  setSaveKey: (k) => set({ saveKey: k }),
  generateKey: () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let key = "";
    for (let i = 0; i < 6; i++) key += chars[Math.floor(Math.random() * chars.length)];
    writeStorageValue("nc_stellar_active_key", key);
    set({ saveKey: key });
    return key;
  },

  // Player
  playerState: {
    universalResource: { b: 0, e: 0 },
    currentStage: 0,
    totalKills: 0,
  },
  addResource: (amount) => {
    set((s) => ({
      playerState: {
        ...s.playerState,
        universalResource: lAdd(s.playerState.universalResource, amount),
      },
    }));
  },
  spendResource: (amount) => {
    const s = get();
    if (!lGte(s.playerState.universalResource, amount)) return false;
    set({
      playerState: {
        ...s.playerState,
        universalResource: lSub(s.playerState.universalResource, amount),
      },
    });
    return true;
  },

  // Weapons
  unlockedWeapons: STARTING_WEAPONS.map((w) => w.id),
  weaponInventory: STARTING_WEAPONS.map((w) => ({ ...w })),
  quickBar: ["w_pulse", "w_blaze", "w_drill", "w_sniper", "w_venom", null, null, null, null, null],

  unlockWeapon: (w) => {
    set((s) => {
      if (s.unlockedWeapons.includes(w.id)) return s;
      return {
        unlockedWeapons: [...s.unlockedWeapons, w.id],
        weaponInventory: [...s.weaponInventory, { ...w }],
      };
    });
  },
  upgradeWeapon: (weaponId) => {
    const s = get();
    const idx = s.weaponInventory.findIndex((w) => w.id === weaponId);
    if (idx === -1) return false;
    const w = s.weaponInventory[idx];
    const cost = upgradeCost(w.level);
    if (!s.spendResource(cost)) return false;

    const updated = [...s.weaponInventory];
    updated[idx] = { ...w, level: w.level + 1 };
    set({ weaponInventory: updated });
    return true;
  },
  evolveWeapon: (weaponId) => {
    const s = get();
    const idx = s.weaponInventory.findIndex((w) => w.id === weaponId);
    if (idx === -1) return false;
    const w = s.weaponInventory[idx];
    if (w.fragExclusive < w.fragNeedEx || w.fragUniversal < w.fragNeedUni) return false;

    const updated = [...s.weaponInventory];
    updated[idx] = {
      ...w,
      tier: w.tier + 1,
      fragExclusive: w.fragExclusive - w.fragNeedEx,
      fragUniversal: w.fragUniversal - w.fragNeedUni,
      fragNeedEx: Math.ceil(w.fragNeedEx * 1.8),
      fragNeedUni: Math.ceil(w.fragNeedUni * 1.5),
      weaknessMult: w.weaknessMult + 0.3,
      runeSlots: [...w.runeSlots, null], // add slot each evolve for MVP
    };
    set({ weaponInventory: updated });
    return true;
  },
  setQuickBarSlot: (slot, weaponId) => {
    set((s) => {
      const qb = [...s.quickBar];
      qb[slot] = weaponId;
      return { quickBar: qb };
    });
  },
  getWeaponById: (id) => {
    return get().weaponInventory.find((w) => w.id === id);
  },

  // Runes
  runeInventory: [],
  addRune: (r) => set((s) => ({ runeInventory: [...s.runeInventory, r] })),
  equipRune: (runeId, weaponId, slotIdx) => {
    const s = get();
    const wIdx = s.weaponInventory.findIndex((w) => w.id === weaponId);
    if (wIdx === -1) return false;
    const w = s.weaponInventory[wIdx];
    if (slotIdx >= w.runeSlots.length) return false;

    const rIdx = s.runeInventory.findIndex((r) => r.id === runeId);
    if (rIdx === -1) return false;

    const updatedWeapons = [...s.weaponInventory];
    const updatedRunes = [...s.runeInventory];
    const [removed] = updatedRunes.splice(rIdx, 1);

    // Put existing rune back to inventory if any
    const existing = updatedWeapons[wIdx].runeSlots[slotIdx];
    if (existing) updatedRunes.push(existing);

    const newSlots = [...updatedWeapons[wIdx].runeSlots];
    newSlots[slotIdx] = removed;
    updatedWeapons[wIdx] = { ...updatedWeapons[wIdx], runeSlots: newSlots };

    set({ weaponInventory: updatedWeapons, runeInventory: updatedRunes });
    return true;
  },
  unequipRune: (weaponId, slotIdx) => {
    const s = get();
    const wIdx = s.weaponInventory.findIndex((w) => w.id === weaponId);
    if (wIdx === -1) return null;
    const w = s.weaponInventory[wIdx];
    if (slotIdx >= w.runeSlots.length) return null;

    const rune = w.runeSlots[slotIdx];
    if (!rune) return null;

    const updated = [...s.weaponInventory];
    const newSlots = [...updated[wIdx].runeSlots];
    newSlots[slotIdx] = null;
    updated[wIdx] = { ...updated[wIdx], runeSlots: newSlots };

    set({ weaponInventory: updated, runeInventory: [...s.runeInventory, rune] });
    return rune;
  },

  // Stage Progress
  stageProgress: {},
  currentStageId: 1,
  recordStageClear: (stageId, stars) => {
    set((s) => {
      const sp = { ...s.stageProgress };
      const existing = sp[stageId] || { cleared: false, bestStars: 0, clearCount: 0 };
      sp[stageId] = {
        cleared: true,
        bestStars: Math.max(existing.bestStars, stars),
        clearCount: existing.clearCount + 1,
      };
      return {
        stageProgress: sp,
        currentStageId: stageId + 1,
        playerState: {
          ...s.playerState,
          currentStage: Math.max(s.playerState.currentStage, stageId),
          totalKills: s.playerState.totalKills + 1,
        },
      };
    });
  },
  getMaxClearedStage: () => {
    const s = get();
    return Math.max(0, ...Object.keys(s.stageProgress).map(Number));
  },

  // Ship
  shipState: {
    level: 1,
    productionRate: { b: 1, e: 0 }, // 1/sec
    storageCap: { b: 5, e: 2 }, // 500
    currentStorage: { b: 0, e: 0 },
    weapons: [],
  },
  collectShipStorage: () => {
    const s = get();
    const amount = { ...s.shipState.currentStorage };
    if (amount.b === 0) return amount;
    set({
      shipState: { ...s.shipState, currentStorage: { b: 0, e: 0 } },
    });
    return amount;
  },
  upgradeShip: () => {
    const s = get();
    const cost = lMulScalar({ b: 5, e: 1 + s.shipState.level * 0.1 }, 1); // 50 * 1.25^level
    if (!s.spendResource(cost)) return false;
    set({
      shipState: {
        ...s.shipState,
        level: s.shipState.level + 1,
        productionRate: lMulScalar(s.shipState.productionRate, 1.2),
        storageCap: lMulScalar(s.shipState.storageCap, 1.3),
      },
    });
    return true;
  },

  // Battle
  battleState: null,
  setBattleState: (b) => set({ battleState: b }),

  // Save/Load
  saveGame: () => {
    const s = get();
    if (!s.saveKey) return;
    const data = packSave(s);
    data.checksum = hash(JSON.stringify(data) + SALT);
    writeJsonStorage(`nc_save_${s.saveKey}`, data);
  },
  loadGame: (key) => {
    const stored = readJsonStorage<GameSaveData | null>(`nc_save_${key}`, null);
    if (!stored.value) {
      return {
        success: false,
        error: stored.status === 'corrupt' ? "存档数据已损坏，未载入任何进度。" : "未找到这个存档。",
      };
    }

    try {
      const data = stored.value;
      const now = Date.now();

      if (now < data.lastSaveTime) {
        return { success: false, error: "检测到设备时间早于存档时间，为避免异常收益，本次未载入。" };
      }

      const check = hash(JSON.stringify({ ...data, checksum: "" }) + SALT);
      if (check !== data.checksum) {
        return { success: false, error: "存档校验失败，数据可能已损坏或被修改。" };
      }

      const offlineSec = Math.floor((now - data.lastSaveTime) / 1000);
      const income = get().calculateOfflineIncome(offlineSec);

      set({
        saveKey: data.key,
        playerState: data.playerState,
        shipState: {
          ...data.shipState,
          currentStorage: lAdd(data.shipState.currentStorage, income),
        },
        stageProgress: data.stageProgress,
        unlockedWeapons: data.unlockedWeapons,
        weaponInventory: data.weaponInventory,
        quickBar: data.quickBar,
        runeInventory: data.runeInventory,
      });
      writeStorageValue("nc_stellar_active_key", key);

      return { success: true, offlineIncome: income.b > 0 ? income : undefined };
    } catch {
      return { success: false, error: "存档格式无效，未载入任何进度。" };
    }
  },
  hasSave: (key) => {
    return readStorageValue(`nc_save_${key}`).value !== null;
  },
  calculateOfflineIncome: (seconds) => {
    const s = get();
    const perSecond = s.shipState.productionRate;
    const total = lMulScalar(perSecond, seconds);
    return lAdd({ b: 0, e: 0 }, total); // min with cap handled by caller
  },

  // Init new game
  initNewGame: () => {
    get().generateKey();
    set({
      playerState: { universalResource: { b: 1, e: 3 }, currentStage: 0, totalKills: 0 }, // start with 1000
      shipState: {
        level: 1,
        productionRate: { b: 1, e: 0 },
        storageCap: { b: 5, e: 2 },
        currentStorage: { b: 0, e: 0 },
        weapons: [],
      },
      stageProgress: {},
      currentStageId: 1,
      weaponInventory: STARTING_WEAPONS.map((w) => ({ ...w })),
      unlockedWeapons: STARTING_WEAPONS.map((w) => w.id),
      quickBar: ["w_pulse", "w_blaze", "w_drill", "w_sniper", "w_venom", null, null, null, null, null],
      runeInventory: [],
      screen: "menu",
    });
    get().saveGame();
  },
}));

// ============================================================
// Local upgrade cost helper
// ============================================================
function upgradeCost(level: number): LValue {
  if (level <= 0) return { b: 0, e: 0 };
  const e = (level - 1) * 0.176;
  return { b: 1.0 / 10 ** (e % 1), e: Math.floor(e + 2) };
}

function lSub(a: LValue, b: LValue): LValue {
  if (a.b === 0) return { b: 0, e: 0 };
  const va = a.b * 10 ** a.e;
  const vb = b.b * 10 ** b.e;
  const diff = Math.max(0, va - vb);
  if (diff <= 0) return { b: 0, e: 0 };
  const e = Math.floor(Math.log10(diff));
  return { b: diff / 10 ** e, e };
}
