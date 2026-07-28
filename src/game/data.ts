import type { EnemyDef, Weapon, StageCondition, EnemyType, Rune, RuneType } from "./types";
import { lFromSci } from "./math";

// ============================================================
// Enemy Definitions - 5 base types for MVP, more generated procedurally
// ============================================================
export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  grunter: {
    id: "grunter",
    name: "Grunt",
    color: "#EF4444",
    radius: 14,
    speed: 60,
    hpMult: 1.0,
    behavior: "chase",
    damage: lFromSci(1, 1), // 10
  },
  dasher: {
    id: "dasher",
    name: "Dasher",
    color: "#F59E0B",
    radius: 10,
    speed: 120,
    hpMult: 0.6,
    behavior: "dash",
    damage: lFromSci(1.5, 1), // 15
  },
  tank: {
    id: "tank",
    name: "Tank",
    color: "#8B5CF6",
    radius: 22,
    speed: 30,
    hpMult: 3.0,
    behavior: "chase",
    damage: lFromSci(2.5, 1), // 25
  },
  shooter: {
    id: "shooter",
    name: "Shooter",
    color: "#10B981",
    radius: 12,
    speed: 45,
    hpMult: 0.8,
    behavior: "shoot",
    shootInterval: 2.0,
    damage: lFromSci(1, 1),
  },
  circler: {
    id: "circler",
    name: "Circler",
    color: "#06B6D4",
    radius: 11,
    speed: 80,
    hpMult: 0.7,
    behavior: "circle",
    damage: lFromSci(1, 1),
  },
};

// Generate more enemy types procedurally for stages beyond 5
export function generateEnemyDef(index: number): EnemyDef {
  const baseTypes = Object.values(ENEMY_DEFS);
  const base = baseTypes[index % baseTypes.length];
  const hueShift = index * 47; // spread colors
  const hpGrowth = 1 + index * 0.15;
  const speedGrowth = 1 + index * 0.05;
  const behaviors: EnemyDef["behavior"][] = ["chase", "dash", "circle", "shoot"];
  return {
    id: `enemy_${index}`,
    name: `${base.name} ${String.fromCharCode(65 + (index % 26))}`,
    color: `hsl(${(hueShift + baseTypes[index % baseTypes.length].color.length * 60) % 360}, 70%, 55%)`,
    radius: base.radius,
    speed: base.speed * speedGrowth,
    hpMult: base.hpMult * hpGrowth,
    behavior: behaviors[index % behaviors.length],
    shootInterval: base.shootInterval,
    damage: lFromSci(1 + index * 0.2, 1),
  };
}

// ============================================================
// Weapon Definitions - 5 starting weapons
// ============================================================
export const STARTING_WEAPONS: Weapon[] = [
  {
    id: "w_pulse",
    name: "Pulse Rifle",
    rarity: "common",
    targetTypes: ["grunter"],
    basePower: lFromSci(1, 0),
    level: 1,
    tier: 0,
    fragExclusive: 0,
    fragUniversal: 0,
    fragNeedEx: 10,
    fragNeedUni: 20,
    weaknessMult: 2.0,
    runeSlots: [],
    fireRate: 6,
    range: 350,
    projectileSpeed: 500,
  },
  {
    id: "w_blaze",
    name: "Blaze Cannon",
    rarity: "common",
    targetTypes: ["dasher"],
    basePower: lFromSci(1.5, 0),
    level: 1,
    tier: 0,
    fragExclusive: 0,
    fragUniversal: 0,
    fragNeedEx: 10,
    fragNeedUni: 20,
    weaknessMult: 2.0,
    runeSlots: [],
    fireRate: 3,
    range: 300,
    projectileSpeed: 450,
  },
  {
    id: "w_drill",
    name: "Drill Shot",
    rarity: "rare",
    targetTypes: ["tank"],
    basePower: lFromSci(2, 0),
    level: 1,
    tier: 0,
    fragExclusive: 0,
    fragUniversal: 0,
    fragNeedEx: 15,
    fragNeedUni: 30,
    weaknessMult: 2.5,
    runeSlots: [],
    fireRate: 4,
    range: 280,
    projectileSpeed: 600,
    pierce: 1,
  },
  {
    id: "w_sniper",
    name: "Star Sniper",
    rarity: "rare",
    targetTypes: ["shooter"],
    basePower: lFromSci(3, 0),
    level: 1,
    tier: 0,
    fragExclusive: 0,
    fragUniversal: 0,
    fragNeedEx: 15,
    fragNeedUni: 30,
    weaknessMult: 2.5,
    runeSlots: [],
    fireRate: 1.5,
    range: 600,
    projectileSpeed: 900,
  },
  {
    id: "w_venom",
    name: "Venom Burst",
    rarity: "epic",
    targetTypes: ["circler"],
    basePower: lFromSci(2.5, 0),
    level: 1,
    tier: 0,
    fragExclusive: 0,
    fragUniversal: 0,
    fragNeedEx: 20,
    fragNeedUni: 40,
    weaknessMult: 3.0,
    runeSlots: [],
    fireRate: 2.5,
    range: 320,
    projectileSpeed: 400,
    scatter: 3,
  },
];

// Generate weapon for a new enemy type
export function generateWeaponForEnemy(enemyId: EnemyType, index: number): Weapon {
  const rarities: Weapon["rarity"][] = ["common", "rare", "epic", "legendary"];
  const names = ["Void", "Nebula", "Cosmic", "Plasma", "Ion", "Quantum", "Solar", "Lunar"];
  const types = ["Blaster", "Lance", "Rifle", "Cannon", "Beam", "Shard", "Drill", "Pulse"];
  const r = rarities[Math.min(index, 3)];
  return {
    id: `w_gen_${index}`,
    name: `${names[index % names.length]} ${types[index % types.length]}`,
    rarity: r,
    targetTypes: [enemyId],
    basePower: lFromSci(1 + index * 0.3, 0),
    level: 1,
    tier: 0,
    fragExclusive: 0,
    fragUniversal: 0,
    fragNeedEx: r === "legendary" ? 50 : r === "epic" ? 30 : r === "rare" ? 20 : 10,
    fragNeedUni: r === "legendary" ? 100 : r === "epic" ? 60 : r === "rare" ? 40 : 20,
    weaknessMult: r === "legendary" ? 4.0 : r === "epic" ? 3.0 : r === "rare" ? 2.5 : 2.0,
    runeSlots: [],
    fireRate: 2 + (index % 5),
    range: 250 + (index % 4) * 100,
    projectileSpeed: 400 + (index % 3) * 150,
  };
}

// ============================================================
// Stage Conditions
// ============================================================
export const CONDITION_TEMPLATES: Omit<StageCondition, "check">[] = [
  { id: "speed", text: "60秒内通关" },
  { id: "no_hit", text: "不受伤通关" },
  { id: "switch_10", text: "切武器不超过10次" },
  { id: "weak_all", text: "只用弱点伤害击杀" },
  { id: "new_weapon", text: "携带1把等级<5的武器通关" },
];

export function generateConditions(stageId: number): StageCondition[] {
  const conditions: StageCondition[] = [];
  // Pick 3 random from templates
  const picks = [
    CONDITION_TEMPLATES[stageId % CONDITION_TEMPLATES.length],
    CONDITION_TEMPLATES[(stageId + 1) % CONDITION_TEMPLATES.length],
    CONDITION_TEMPLATES[(stageId + 2) % CONDITION_TEMPLATES.length],
  ];
  
  picks.forEach((tmpl) => {
    conditions.push({
      ...tmpl,
      check: (stats: { clearTime: number; hitsTaken: number; weaponSwitchCount: number; allWeakness: boolean; lowestHpWeaponLevel: number }) => {
        if (tmpl.id === "speed") return stats.clearTime <= 60;
        if (tmpl.id === "no_hit") return stats.hitsTaken === 0;
        if (tmpl.id === "switch_10") return stats.weaponSwitchCount <= 10;
        if (tmpl.id === "weak_all") return stats.allWeakness;
        if (tmpl.id === "new_weapon") return stats.lowestHpWeaponLevel < 5;
        return false;
      },
    });
  });
  return conditions;
}

// ============================================================
// Stage Roster Generation
// ============================================================
export function generateRoster(stageId: number): EnemyType[] {
  const baseIds = Object.keys(ENEMY_DEFS);
  // Stage 1: 1 type, Stage 2: 2 types, ... Stage 5+: 5 types from base + generated
  const maxTypes = Math.min(stageId, baseIds.length);
  
  const roster: EnemyType[] = [];
  for (let i = 0; i < maxTypes; i++) {
    roster.push(baseIds[i % baseIds.length]);
  }
  
  // For stages beyond 5, start adding procedural enemy types
  if (stageId > 5) {
    const extraCount = Math.min(stageId - 5, 15); // up to 15 additional types
    for (let i = 0; i < extraCount; i++) {
      roster.push(`enemy_${i}`);
    }
  }
  
  // Cap at 20
  return roster.slice(0, 20);
}

// ============================================================
// Enemy count per stage (waves)
// ============================================================
export function getEnemyCount(stageId: number): number {
  return 3 + stageId * 2; // Stage 1: 5 enemies, Stage 10: 23 enemies
}

// ============================================================
// Stage Rewards
// ============================================================
import type { StageReward } from "./types";
import { lFromInt, lMulScalar } from "./math";

export function getStageReward(stageId: number): StageReward {
  const baseRes = lFromInt(10 + stageId * 5);
  return {
    firstClear: {
      universalResource: lMulScalar(baseRes, 3),
      exclusiveFrags: {}, // populated by caller based on roster
      chestChance: stageId % 5 === 0 ? 1.0 : 0.2, // every 5th stage guaranteed chest
    },
    repeat: {
      universalResource: baseRes,
      exclusiveFrags: {},
    },
  };
}

// ============================================================
// Rune Generation
// ============================================================
export function generateRandomRune(stageId: number): Rune {
  const types: RuneType[] = ["atk", "crit", "speed", "weak", "range", "pierce"];
  const tier = Math.min(5, Math.floor(stageId / 20) + 1);
  return {
    id: `rune_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: types[Math.floor(Math.random() * types.length)],
    level: 1,
    star: Math.max(1, Math.min(5, tier)),
  };
}
