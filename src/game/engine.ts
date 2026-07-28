import type { BattleState, Weapon, Enemy, Player, EnemyType } from "./types";
import { ENEMY_DEFS, generateEnemyDef } from "./data";
import { enemyHP, lFromSci, lMulScalar, lGte } from "./math";
import type { LValue } from "./math";

// ============================================================
// Canvas & Rendering
// ============================================================
const CANVAS_W = 960;
const CANVAS_H = 540;

export function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx, w: CANVAS_W, h: CANVAS_H };
}

// ============================================================
// Input
// ============================================================
export type InputState = {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  weaponSlot: number; // 0-9
};

export function createInput(): InputState {
  return {
    keys: new Set(),
    mouseX: CANVAS_W / 2,
    mouseY: CANVAS_H / 2,
    mouseDown: false,
    weaponSlot: 0,
  };
}

export function setupInputListeners(
  canvas: HTMLCanvasElement,
  input: InputState,
  onSwitchWeapon: (slot: number) => void
) {
  const keydown = (e: KeyboardEvent) => {
    input.keys.add(e.key.toLowerCase());
    if (e.key >= "0" && e.key <= "9") {
      const slot = e.key === "0" ? 9 : parseInt(e.key) - 1;
      input.weaponSlot = slot;
      onSwitchWeapon(slot);
    }
  };
  const keyup = (e: KeyboardEvent) => {
    input.keys.delete(e.key.toLowerCase());
  };
  const mousemove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    input.mouseX = (e.clientX - rect.left) * scaleX;
    input.mouseY = (e.clientY - rect.top) * scaleY;
  };
  const mousedown = () => {
    input.mouseDown = true;
  };
  const mouseup = () => {
    input.mouseDown = false;
  };

  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  canvas.addEventListener("mousemove", mousemove);
  canvas.addEventListener("mousedown", mousedown);
  canvas.addEventListener("mouseup", mouseup);

  return () => {
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    canvas.removeEventListener("mousemove", mousemove);
    canvas.removeEventListener("mousedown", mousedown);
    canvas.removeEventListener("mouseup", mouseup);
  };
}

// ============================================================
// Battle Initialization
// ============================================================
export function initBattle(
  stageId: number,
  weaponsInBar: (Weapon | null)[]
): BattleState {
  fireAccumulators.fill(0);
  const roster = getStageRoster(stageId);
  const enemyCount = 3 + stageId * 2;

  const player: Player = {
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    hp: 100,
    maxHp: 100,
    speed: 180,
    invulnTimer: 0,
  };

  const enemies = spawnEnemies(roster, enemyCount, stageId);

  return {
    player,
    enemies,
    projectiles: [],
    enemyProjectiles: [],
    currentWeaponIndex: 0,
    weaponsInBar,
    stageId,
    elapsed: 0,
    flow: 0,
    flowTimer: 0,
    stellarFlowTimer: 0,
    swapTimer: 0,
    flowSwitchWindow: 0,
    flowSourceWeaponId: null,
    lastHitWeaponId: null,
    paused: false,
    completed: false,
    failed: false,
    stats: {
      clearTime: 0,
      hitsTaken: 0,
      weaponSwitchCount: 0,
      lowestHpWeaponLevel: Infinity,
      allWeakness: true,
      killLog: [],
    },
  };
}

export function switchWeapon(state: BattleState, slot: number) {
  if (slot < 0 || slot > 9 || !state.weaponsInBar[slot] || slot === state.currentWeaponIndex) return;
  const previousWeapon = state.weaponsInBar[state.currentWeaponIndex];
  state.currentWeaponIndex = slot;
  state.stats.weaponSwitchCount += 1;
  state.flowSourceWeaponId = state.lastHitWeaponId ?? previousWeapon?.id ?? null;
  state.flowSwitchWindow = 1.5;
  const fastSwap = state.flow >= 8 ? 0 : 0.3;
  state.swapTimer = state.stellarFlowTimer > 0 ? fastSwap * 0.3 : fastSwap;
}

function getStageRoster(stageId: number): EnemyType[] {
  const baseIds = Object.keys(ENEMY_DEFS);
  const count = Math.min(stageId, 20);
  const roster: EnemyType[] = [];
  for (let i = 0; i < count; i++) {
    if (i < baseIds.length) {
      roster.push(baseIds[i]);
    } else {
      roster.push(`enemy_${i - baseIds.length}`);
    }
  }
  return roster;
}

function spawnEnemies(
  roster: EnemyType[],
  count: number,
  stageId: number
): Enemy[] {
  const enemies: Enemy[] = [];
  for (let i = 0; i < count; i++) {
    const typeIdx = i % roster.length;
    const typeId = roster[typeIdx];
    const def = ENEMY_DEFS[typeId] || generateEnemyDef(parseInt(typeId.split("_")[1]) || 0);

    // Spawn at edge
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    switch (edge) {
      case 0: x = Math.random() * CANVAS_W; y = -20; break;
      case 1: x = CANVAS_W + 20; y = Math.random() * CANVAS_H; break;
      case 2: x = Math.random() * CANVAS_W; y = CANVAS_H + 20; break;
      case 3: x = -20; y = Math.random() * CANVAS_H; break;
    }

    const hp = lMulScalar(enemyHP(stageId), def.hpMult);
    enemies.push({
      defId: typeId,
      x,
      y,
      hp: { ...hp },
      maxHp: { ...hp },
      vx: 0,
      vy: 0,
      alive: true,
      invulnTimer: 0,
    });
  }
  return enemies;
}

// ============================================================
// Game Loop
// ============================================================
export function updateBattle(
  state: BattleState,
  input: InputState,
  dt: number
): BattleState {
  if (state.paused || state.completed || state.failed) return state;

  // Cache mouse position for firing (update every frame, not just in render)
  inputCache.mouseX = input.mouseX;
  inputCache.mouseY = input.mouseY;

  state.elapsed += dt;
  const player = state.player;

  if (state.swapTimer > 0) state.swapTimer = Math.max(0, state.swapTimer - dt);
  if (state.flowSwitchWindow > 0) state.flowSwitchWindow = Math.max(0, state.flowSwitchWindow - dt);
  if (state.stellarFlowTimer > 0) {
    state.stellarFlowTimer = Math.max(0, state.stellarFlowTimer - dt);
    if (state.stellarFlowTimer === 0) {
      state.flow = 10;
      state.flowTimer = 2.5;
    }
  } else if (state.flow > 0) {
    state.flowTimer = Math.max(0, state.flowTimer - dt);
    if (state.flowTimer === 0) state.flow = 0;
  }

  // --- Player Movement (WASD) ---
  let dx = 0, dy = 0;
  if (input.keys.has("w") || input.keys.has("arrowup")) dy -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) dy += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) dx -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    const stellarSpeed = state.stellarFlowTimer > 0 ? 1.2 : 1;
    player.x += dx * player.speed * stellarSpeed * dt;
    player.y += dy * player.speed * stellarSpeed * dt;
    player.x = Math.max(15, Math.min(CANVAS_W - 15, player.x));
    player.y = Math.max(15, Math.min(CANVAS_H - 15, player.y));
  }

  // Invuln timer
  if (player.invulnTimer > 0) player.invulnTimer -= dt;

  // --- Weapon Firing ---
  const weapon = state.weaponsInBar[state.currentWeaponIndex];
  if (weapon && input.mouseDown && state.swapTimer <= 0) {
    fireWeapon(state, weapon, dt);
  }

  // --- Projectiles Update ---
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -50 || p.x > CANVAS_W + 50 || p.y < -50 || p.y > CANVAS_H + 50) {
      p.alive = false;
    }
  }

  for (const p of state.enemyProjectiles) {
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -50 || p.x > CANVAS_W + 50 || p.y < -50 || p.y > CANVAS_H + 50) {
      p.alive = false;
    }
  }

  // --- Enemies Update ---
  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.invulnTimer > 0) e.invulnTimer -= dt;
    updateEnemyAI(e, player, state, dt);
  }

  // --- Collision: Player Bullets vs Enemies ---
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    for (const e of state.enemies) {
      if (!e.alive || e.invulnTimer > 0) continue;
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      const def = ENEMY_DEFS[e.defId] || generateEnemyDef(parseInt(e.defId.split("_")[1]) || 0);
      if (dist < def.radius + 6) {
        // Hit!
        p.pierceLeft--;
        if (p.pierceLeft <= 0) p.alive = false;

        // Weakness damage and Weapon Flow are resolved on impact.
        const wasWeakness = checkWeakness(p.fromWeaponId, e.defId, state.weaponsInBar);
        const hitWeapon = state.weaponsInBar.find((w) => w?.id === p.fromWeaponId) ?? null;
        let hitDamage = p.damage;
        if (wasWeakness && hitWeapon) {
          const primary = hitWeapon.targetTypes[0] === e.defId;
          const weakness = primary ? hitWeapon.weaknessMult : 1 + (hitWeapon.weaknessMult - 1) * 0.6;
          hitDamage = lMulScalar(hitDamage, weakness);
        }
        e.hp = lSub(e.hp, hitDamage);
        e.invulnTimer = 0.05;

        if (
          wasWeakness &&
          state.flowSwitchWindow > 0 &&
          state.flowSourceWeaponId &&
          state.flowSourceWeaponId !== p.fromWeaponId
        ) {
          state.flow = Math.min(20, state.flow + 1);
          state.flowSwitchWindow = 0;
          state.flowTimer = 2.5;
          if (state.flow >= 20) state.stellarFlowTimer = 5;
        } else if (wasWeakness && state.flow > 0) {
          state.flowTimer = 2.5;
        }
        state.lastHitWeaponId = p.fromWeaponId;

        if (!wasWeakness) state.stats.allWeakness = false;

        if (lGte(lFromSci(0, 0), e.hp)) {
          e.alive = false;
          if (wasWeakness && state.flow >= 15) player.hp = Math.min(player.maxHp, player.hp + 1);
          state.stats.killLog.push({
            weaponId: p.fromWeaponId,
            wasWeakness,
          });
        }
        break;
      }
    }
  }

  // --- Collision: Enemy Bullets vs Player ---
  for (const p of state.enemyProjectiles) {
    if (!p.alive) continue;
    const dist = Math.hypot(p.x - player.x, p.y - player.y);
    if (dist < 12 && player.invulnTimer <= 0) {
      p.alive = false;
      // Simplified: enemy projectiles do flat damage for MVP
      player.hp -= 10;
      player.invulnTimer = 0.5;
      state.stats.hitsTaken++;
      if (player.hp <= 0) {
        state.failed = true;
        state.stats.clearTime = state.elapsed;
      }
    }
  }

  // --- Collision: Enemies vs Player (touch damage) ---
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const def = ENEMY_DEFS[e.defId] || generateEnemyDef(parseInt(e.defId.split("_")[1]) || 0);
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < def.radius + 10 && player.invulnTimer <= 0) {
      player.hp -= 5;
      player.invulnTimer = 0.5;
      state.stats.hitsTaken++;
      if (player.hp <= 0) {
        state.failed = true;
        state.stats.clearTime = state.elapsed;
      }
    }
  }

  // --- Check victory ---
  const allDead = state.enemies.every((e) => !e.alive);
  if (allDead && !state.completed) {
    state.completed = true;
    state.stats.clearTime = state.elapsed;
  }

  // Cleanup dead entities
  state.projectiles = state.projectiles.filter((p) => p.alive);
  state.enemyProjectiles = state.enemyProjectiles.filter((p) => p.alive);

  return state;
}

// Fire rate accumulator (per weapon)
const fireAccumulators: number[] = new Array(10).fill(0);

function fireWeapon(state: BattleState, weapon: Weapon, dt: number) {
  const idx = state.currentWeaponIndex;
  fireAccumulators[idx] += dt;
  const flowFireRate = state.flow >= 5 ? 1.15 : 1;
  const stellarFireRate = state.stellarFlowTimer > 0 ? 1.3 : 1;
  const interval = 1 / (weapon.fireRate * flowFireRate * stellarFireRate);

  while (fireAccumulators[idx] >= interval) {
    fireAccumulators[idx] -= interval;

    // Direction toward mouse
    const dx = state.player.x - inputCache.mouseX;
    const dy = state.player.y - inputCache.mouseY;
    const angle = Math.atan2(-dy, -dx);

    // Calculate damage
    const levelMult = Math.pow(1.15, Math.max(0, weapon.level - 1));
    const tierMult = 1 + weapon.tier * 0.08;
    const flowMult = state.flow >= 10 ? 1.25 : state.flow >= 3 ? 1.1 : state.flow >= 2 ? 1.05 : 1;
    const stellarMult = state.stellarFlowTimer > 0 ? 1.2 : 1;
    const baseDmg = lMulScalar(weapon.basePower, levelMult * tierMult * flowMult * stellarMult);

    const count = weapon.scatter || 1;
    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
      const a = angle + spread;
      state.projectiles.push({
        x: state.player.x,
        y: state.player.y,
        vx: Math.cos(a) * weapon.projectileSpeed,
        vy: Math.sin(a) * weapon.projectileSpeed,
        damage: baseDmg,
        pierceLeft: (weapon.pierce || 0) + 1,
        fromWeaponId: weapon.id,
        color: rarityColor(weapon.rarity),
        alive: true,
      });
    }
  }
}

// Cache for input in fireWeapon
const inputCache = { mouseX: 0, mouseY: 0 };

function updateEnemyAI(
  e: Enemy,
  player: Player,
  state: BattleState,
  dt: number
) {
  const def = ENEMY_DEFS[e.defId] || generateEnemyDef(parseInt(e.defId.split("_")[1]) || 0);

  switch (def.behavior) {
    case "chase": {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        e.vx = (dx / dist) * def.speed;
        e.vy = (dy / dist) * def.speed;
      }
      break;
    }
    case "dash": {
      // Move fast toward player with slight randomness
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        e.vx = (dx / dist) * def.speed * (1 + Math.sin(state.elapsed * 3) * 0.3);
        e.vy = (dy / dist) * def.speed * (1 + Math.cos(state.elapsed * 3) * 0.3);
      }
      break;
    }
    case "circle": {
      // Orbit around player
      const cx = player.x - e.x;
      const cy = player.y - e.y;
      const angle = Math.atan2(cy, cx) + dt * 1.5;
      e.vx = Math.cos(angle) * def.speed * 0.7;
      e.vy = Math.sin(angle) * def.speed * 0.7;
      break;
    }
    case "shoot": {
      // Keep distance and shoot
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);
      const desiredDist = 250;
      if (dist > desiredDist + 20) {
        e.vx = (dx / dist) * def.speed * 0.5;
        e.vy = (dy / dist) * def.speed * 0.5;
      } else if (dist < desiredDist - 20) {
        e.vx = -(dx / dist) * def.speed * 0.5;
        e.vy = -(dy / dist) * def.speed * 0.5;
      } else {
        e.vx *= 0.9;
        e.vy *= 0.9;
      }
      // Shoot at player
      if (def.shootInterval && Math.random() < dt / def.shootInterval) {
        const bdx = dx / dist;
        const bdy = dy / dist;
        state.enemyProjectiles.push({
          x: e.x,
          y: e.y,
          vx: bdx * 200,
          vy: bdy * 200,
          damage: def.damage,
          pierceLeft: 1,
          fromWeaponId: "enemy",
          color: def.color,
          alive: true,
        });
      }
      break;
    }
  }

  e.x += e.vx * dt;
  e.y += e.vy * dt;
  e.x = Math.max(10, Math.min(CANVAS_W - 10, e.x));
  e.y = Math.max(10, Math.min(CANVAS_H - 10, e.y));
}

// ============================================================
// Damage helpers
// ============================================================
function checkWeakness(
  weaponId: string,
  enemyType: EnemyType,
  weapons: (Weapon | null)[]
): boolean {
  const w = weapons.find((w) => w?.id === weaponId);
  if (!w) return false;
  return w.targetTypes.includes(enemyType);
}

function lSub(a: LValue, b: LValue): LValue {
  // Simplified subtraction for MVP (treat as real numbers)
  if (a.b === 0) return { b: 0, e: 0 };
  const va = a.b * 10 ** a.e;
  const vb = b.b * 10 ** b.e;
  const diff = Math.max(0, va - vb);
  if (diff <= 0) return { b: 0, e: 0 };
  const e = Math.floor(Math.log10(diff));
  return { b: diff / 10 ** e, e };
}

// ============================================================
// Rendering
// ============================================================
export function renderBattle(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  input: InputState
) {
  // Clear
  ctx.fillStyle = "#0A0514";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid background
  ctx.strokeStyle = "rgba(139, 92, 246, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  // --- Draw Aim Line ---
  const player = state.player;
  const angle = Math.atan2(input.mouseY - player.y, input.mouseX - player.x);
  ctx.strokeStyle = "rgba(0, 229, 204, 0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(angle) * 200, player.y + Math.sin(angle) * 200);
  ctx.stroke();
  ctx.setLineDash([]);

  // --- Draw Player ---
  ctx.save();
  ctx.translate(player.x, player.y);
  // Glow
  ctx.shadowColor = "#00E5CC";
  ctx.shadowBlur = 15;
  // Body
  ctx.fillStyle = player.invulnTimer > 0 ? "rgba(0,229,204,0.3)" : "#00E5CC";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  // Direction indicator
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
  ctx.stroke();
  ctx.restore();

  // HP bar
  const hpPct = player.hp / player.maxHp;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(player.x - 20, player.y + 16, 40, 4);
  ctx.fillStyle = hpPct > 0.5 ? "#10B981" : hpPct > 0.25 ? "#F59E0B" : "#EF4444";
  ctx.fillRect(player.x - 20, player.y + 16, 40 * hpPct, 4);

  // --- Draw Enemies ---
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const def = ENEMY_DEFS[e.defId] || generateEnemyDef(parseInt(e.defId.split("_")[1]) || 0);

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = def.color;
    ctx.beginPath();

    // Different shapes per behavior
    switch (def.behavior) {
      case "chase": {
        // Square for tanky chase enemies
        if (def.hpMult > 1.5) {
          ctx.fillRect(-def.radius, -def.radius, def.radius * 2, def.radius * 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, def.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "dash": {
        ctx.moveTo(def.radius, 0);
        ctx.lineTo(-def.radius * 0.7, def.radius * 0.7);
        ctx.lineTo(-def.radius * 0.7, -def.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "circle": {
        ctx.beginPath();
        ctx.arc(0, 0, def.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, def.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      default: {
        ctx.beginPath();
        ctx.arc(0, 0, def.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // HP bar for enemies
    const eHp = e.hp.b * 10 ** e.hp.e;
    const eMax = e.maxHp.b * 10 ** e.maxHp.e;
    const ePct = Math.max(0, Math.min(1, eHp / eMax));
    const barW = def.radius * 2;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(e.x - barW / 2, e.y - def.radius - 8, barW, 3);
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(e.x - barW / 2, e.y - def.radius - 8, barW * ePct, 3);
  }

  // --- Draw Player Projectiles ---
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    ctx.save();
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Draw Enemy Projectiles ---
  for (const p of state.enemyProjectiles) {
    if (!p.alive) continue;
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function rarityColor(r: string): string {
  switch (r) {
    case "common": return "#94A3B8";
    case "rare": return "#60A5FA";
    case "epic": return "#A78BFA";
    case "legendary": return "#FBBF24";
    default: return "#FFFFFF";
  }
}

// ============================================================
// Calculate damage with weakness
// ============================================================
export function calcWeaponDamage(
  weapon: Weapon,
  enemyType: EnemyType
): LValue {
  const levelMult = Math.pow(1.15, Math.max(0, weapon.level - 1));
  const tierMult = 1 + weapon.tier * 0.08;
  let dmg = lMulScalar(weapon.basePower, levelMult * tierMult);

  if (weapon.targetTypes.includes(enemyType)) {
    const isPrimary = weapon.targetTypes[0] === enemyType;
    const mult = isPrimary ? weapon.weaknessMult : 1 + (weapon.weaknessMult - 1) * 0.6;
    dmg = lMulScalar(dmg, mult);
  }

  return dmg;
}
