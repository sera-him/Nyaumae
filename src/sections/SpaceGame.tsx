import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Crosshair,
  Heart,
  Keyboard,
  Lock,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ENEMY_DEFS, generateConditions, generateEnemyDef, generateRandomRune, generateRoster, getStageReward } from '@/game/data';
import {
  createInput,
  initBattle,
  initCanvas,
  renderBattle,
  setupInputListeners,
  switchWeapon,
  updateBattle,
} from '@/game/engine';
import { lFormatCompact } from '@/game/math';
import { useGameStore } from '@/game/stores/gameStore';
import type { BattleState, EnemyDef, RunStats, StageCondition, Weapon } from '@/game/types';

type View = 'menu' | 'stages' | 'loadout' | 'playing' | 'victory' | 'defeat';

type BattleResult = {
  stats: RunStats;
  stars: number;
  conditions: StageCondition[];
  reward: string;
};

const rarityLabel: Record<Weapon['rarity'], string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const rarityColor: Record<Weapon['rarity'], string> = {
  common: '#94A3B8',
  rare: '#60A5FA',
  epic: '#A78BFA',
  legendary: '#FBBF24',
};

function enemyDef(id: string): EnemyDef {
  if (ENEMY_DEFS[id]) return ENEMY_DEFS[id];
  return generateEnemyDef(Number(id.split('_')[1]) || 0);
}

function BattleArena({ battle, onEnd }: { battle: BattleState; onEnd: (won: boolean, state: BattleState) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef(createInput());
  const activeBattleRef = useRef(battle);
  const frameRef = useRef(0);
  const endedRef = useRef(false);
  const [hud, setHud] = useState(() => ({
    hp: battle.player.hp,
    alive: battle.enemies.filter((enemy) => enemy.alive).length,
    elapsed: 0,
    weapon: battle.currentWeaponIndex,
    flow: 0,
    stellar: 0,
    paused: false,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx } = initCanvas(canvas);
    const input = inputRef.current;
    let last = performance.now();
    let lastHud = 0;

    const cleanupInput = setupInputListeners(canvas, input, (slot) => switchWeapon(battle, slot));
    const togglePause = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'p' || event.key === 'Escape') {
        event.preventDefault();
        battle.paused = !battle.paused;
      }
    };
    const stopFiring = () => { input.mouseDown = false; };
    window.addEventListener('keydown', togglePause);
    window.addEventListener('pointerup', stopFiring);

    const loop = (now: number) => {
      const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
      last = now;
      updateBattle(battle, input, dt);
      renderBattle(ctx, battle, input);

      if (now - lastHud > 80) {
        lastHud = now;
        setHud({
          hp: battle.player.hp,
          alive: battle.enemies.filter((enemy) => enemy.alive).length,
          elapsed: battle.elapsed,
          weapon: battle.currentWeaponIndex,
          flow: battle.flow,
          stellar: battle.stellarFlowTimer,
          paused: battle.paused,
        });
      }

      if ((battle.completed || battle.failed) && !endedRef.current) {
        endedRef.current = true;
        onEnd(battle.completed, battle);
        return;
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      cleanupInput();
      window.removeEventListener('keydown', togglePause);
      window.removeEventListener('pointerup', stopFiring);
    };
  }, [battle, onEnd]);

  const pointAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    inputRef.current.mouseX = (event.clientX - rect.left) * (960 / rect.width);
    inputRef.current.mouseY = (event.clientY - rect.top) * (540 / rect.height);
  };

  const holdMove = (key: string, down: boolean) => {
    if (down) inputRef.current.keys.add(key);
    else inputRef.current.keys.delete(key);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#06030d] shadow-2xl shadow-violet-950/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-black/35 px-4 py-3 font-mono text-xs">
        <div className="flex items-center gap-4">
          <span className="text-cyan-300">STAGE {battle.stageId}</span>
          <span className="flex items-center gap-1.5 text-emerald-300"><Heart className="h-3.5 w-3.5" /> {Math.ceil(hud.hp)}</span>
          <span className="text-white/55">目标 {hud.alive}</span>
          <span className="text-white/55">{hud.elapsed.toFixed(1)}s</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 ${hud.stellar > 0 ? 'text-amber-300' : hud.flow > 0 ? 'text-violet-300' : 'text-white/35'}`}>
            <Zap className="h-3.5 w-3.5" />
            {hud.stellar > 0 ? `STELLAR ${hud.stellar.toFixed(1)}s` : `FLOW ×${hud.flow}`}
          </div>
          <button
            type="button"
            onClick={() => { activeBattleRef.current.paused = !activeBattleRef.current.paused; }}
            className="rounded-md border border-white/10 p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="暂停"
          >
            {hud.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block aspect-video w-full touch-none cursor-crosshair"
          onPointerDown={(event) => { pointAt(event); inputRef.current.mouseDown = true; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={pointAt}
          onPointerUp={() => { inputRef.current.mouseDown = false; }}
          onContextMenu={(event) => event.preventDefault()}
        />
        {hud.paused && (
          <div className="absolute inset-0 grid place-items-center bg-[#06030d]/70 backdrop-blur-sm">
            <button type="button" onClick={() => { activeBattleRef.current.paused = false; }} className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-sm font-medium text-cyan-200">
              <Play className="h-4 w-4" /> 继续战斗
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-black/45 px-2 py-2 sm:px-4">
        <div className="grid grid-cols-10 gap-1.5">
          {battle.weaponsInBar.map((weapon, index) => (
            <button
              type="button"
              key={index}
              disabled={!weapon}
              onClick={() => switchWeapon(battle, index)}
              className={`min-w-0 rounded-lg border px-1 py-2 text-center transition ${
                index === hud.weapon
                  ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(0,229,204,0.15)]'
                  : 'border-white/[0.07] bg-white/[0.025] text-white/45 hover:border-white/20'
              } disabled:opacity-25`}
            >
              <span className="block font-mono text-[9px] sm:text-[11px]">{index === 9 ? 0 : index + 1}</span>
              <span className="hidden truncate text-[9px] sm:block" style={{ color: weapon ? rarityColor[weapon.rarity] : undefined }}>{weapon?.name ?? '—'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-white/[0.04] bg-black/25 p-3 sm:hidden">
        <div className="grid grid-cols-3 gap-1">
          <span />
          <button type="button" onPointerDown={() => holdMove('w', true)} onPointerUp={() => holdMove('w', false)} className="h-10 w-10 rounded-lg bg-white/10">↑</button>
          <span />
          <button type="button" onPointerDown={() => holdMove('a', true)} onPointerUp={() => holdMove('a', false)} className="h-10 w-10 rounded-lg bg-white/10">←</button>
          <button type="button" onPointerDown={() => holdMove('s', true)} onPointerUp={() => holdMove('s', false)} className="h-10 w-10 rounded-lg bg-white/10">↓</button>
          <button type="button" onPointerDown={() => holdMove('d', true)} onPointerUp={() => holdMove('d', false)} className="h-10 w-10 rounded-lg bg-white/10">→</button>
        </div>
        <div className="max-w-[180px] text-right text-[10px] leading-relaxed text-white/35">在战场中拖动瞄准<br />按住战场持续射击</div>
      </div>
    </div>
  );
}

export default function SpaceGame() {
  const {
    saveKey,
    playerState,
    weaponInventory,
    quickBar,
    stageProgress,
    initNewGame,
    setQuickBarSlot,
    addResource,
    addRune,
    recordStageClear,
    saveGame,
    loadGame,
    setBattleState,
  } = useGameStore();
  const [view, setView] = useState<View>('menu');
  const [selectedStage, setSelectedStage] = useState(1);
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(weaponInventory[0]?.id ?? null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);

  const maxCleared = useMemo(() => Math.max(0, ...Object.keys(stageProgress).map(Number)), [stageProgress]);
  const maxUnlocked = Math.max(1, maxCleared + 1);
  const roster = useMemo(() => generateRoster(selectedStage), [selectedStage]);
  const stageCount = Math.max(8, maxUnlocked + 2);

  useEffect(() => {
    if (saveKey) return;
    const activeKey = localStorage.getItem('nc_stellar_active_key');
    if (activeKey) loadGame(activeKey);
  }, [loadGame, saveKey]);

  const beginCampaign = () => {
    if (!saveKey) initNewGame();
    setSelectedStage(maxUnlocked);
    setView('stages');
  };

  const placeWeapon = (slot: number) => {
    if (!selectedWeapon) return;
    quickBar.forEach((weaponId, index) => {
      if (weaponId === selectedWeapon && index !== slot) setQuickBarSlot(index, null);
    });
    setQuickBarSlot(slot, selectedWeapon);
  };

  const startBattle = () => {
    const currentWeapons = useGameStore.getState().weaponInventory;
    const currentBar = useGameStore.getState().quickBar;
    const equipped = currentBar.map((id) => currentWeapons.find((weapon) => weapon.id === id) ?? null);
    if (!equipped.some(Boolean)) return;
    const nextBattle = initBattle(selectedStage, equipped);
    setBattle(nextBattle);
    setBattleState(nextBattle);
    setResult(null);
    setView('playing');
  };

  const finishBattle = useCallback((won: boolean, finalState: BattleState) => {
    setBattleState(null);
    if (!won) {
      setResult({ stats: finalState.stats, stars: 0, conditions: [], reward: '' });
      setView('defeat');
      return;
    }

    const conditions = generateConditions(finalState.stageId);
    const stars = conditions.filter((condition) => condition.check(finalState.stats)).length;
    const first = !useGameStore.getState().stageProgress[finalState.stageId]?.cleared;
    const rewards = getStageReward(finalState.stageId);
    const matter = first ? rewards.firstClear.universalResource : rewards.repeat.universalResource;
    addResource(matter);
    recordStageClear(finalState.stageId, stars, first);
    if (stars === 3) addRune(generateRandomRune(finalState.stageId));
    saveGame();
    setResult({
      stats: finalState.stats,
      stars,
      conditions,
      reward: `${lFormatCompact(matter)} Stellar Matter${stars === 3 ? ' + 随机符文' : ''}`,
    });
    setView('victory');
  }, [addResource, addRune, recordStageClear, saveGame, setBattleState]);

  const selectedWeaponData = weaponInventory.find((weapon) => weapon.id === selectedWeapon) ?? null;

  return (
    <section className="relative isolate min-h-[720px] overflow-hidden rounded-3xl border border-white/[0.06] bg-[#07040e] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_10%,rgba(0,229,204,.12),transparent_30%),radial-gradient(circle_at_80%_35%,rgba(139,92,246,.16),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(139,92,246,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,.12)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {view !== 'menu' && (
          <div className="mb-5 flex items-center justify-between gap-4">
            <button type="button" onClick={() => { setBattleState(null); setBattle(null); setView('menu'); }} className="flex items-center gap-2 text-xs text-white/45 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> 返回主界面
            </button>
            <div className="flex items-center gap-3 font-mono text-[10px] text-white/35">
              {saveKey && <span>ID {saveKey}</span>}
              <span>{lFormatCompact(playerState.universalResource)} MATTER</span>
            </div>
          </div>
        )}

        {view === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex min-h-[650px] max-w-4xl flex-col items-center justify-center py-10 text-center">
            <div className="mb-6 grid h-20 w-20 place-items-center rounded-[28px] border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_60px_rgba(0,229,204,.16)]">
              <Crosshair className="h-9 w-9 text-cyan-300" />
            </div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.45em] text-cyan-300/70">Frontline Protocol</p>
            <h2 className="text-4xl font-black tracking-tight sm:text-6xl">星际战线 <span className="text-gradient-cyan">Stellar</span></h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
              识别敌人弱点，在十把武器间高速调度。每一次正确切枪都会累积 Weapon Flow，直到点燃 Stellar Flow。
            </p>

            <div className="mt-9 grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {[
                [Keyboard, '移动', 'WASD / 方向键'],
                [MousePointer2, '瞄准射击', '鼠标指向并按住'],
                [Zap, '武器流', '数字键 1—0 切枪'],
              ].map(([Icon, title, copy]) => {
                const ItemIcon = Icon as typeof Keyboard;
                return (
                  <div key={title as string} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <ItemIcon className="mb-3 h-4 w-4 text-violet-300" />
                    <div className="text-sm font-medium">{title as string}</div>
                    <div className="mt-1 text-xs text-white/35">{copy as string}</div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={beginCampaign} className="group mt-9 flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-7 py-3.5 text-sm font-bold text-[#06100f] shadow-lg shadow-cyan-500/15 transition hover:scale-[1.02]">
              <Play className="h-4 w-4 fill-current" /> {maxCleared > 0 ? `继续 Stage ${maxUnlocked}` : '开始战线'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <div className="mt-4 text-[10px] text-white/25">进度保存在当前浏览器中</div>
          </motion.div>
        )}

        {view === 'stages' && (
          <div className="mx-auto max-w-4xl py-4">
            <div className="mb-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-violet-300/65">Frontline Map</p>
              <h2 className="mt-2 text-3xl font-bold">选择战区</h2>
              <p className="mt-2 text-sm text-white/40">每个战区都会组合新的敌人弱点与行动方式。</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: stageCount }, (_, index) => index + 1).map((stage) => {
                const locked = stage > maxUnlocked;
                const progress = stageProgress[stage];
                return (
                  <button
                    type="button"
                    key={stage}
                    disabled={locked}
                    onClick={() => { setSelectedStage(stage); setView('loadout'); }}
                    className="group relative min-h-36 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] text-white/35">STAGE</span>
                      {locked ? <Lock className="h-3.5 w-3.5 text-white/30" /> : progress?.cleared ? <span className="text-[10px] text-amber-300">{'★'.repeat(progress.bestStars)}{'☆'.repeat(3 - progress.bestStars)}</span> : <Crosshair className="h-3.5 w-3.5 text-cyan-300/70" />}
                    </div>
                    <div className="mt-5 font-mono text-3xl font-bold text-white/90">{String(stage).padStart(2, '0')}</div>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-white/30">
                      <span>{Math.min(stage, 5)} 种威胁</span>
                      {!locked && <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'loadout' && (
          <div className="mx-auto max-w-5xl py-2">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-300/65">Enemy Preview</p>
                <h2 className="mt-2 text-3xl font-bold">Stage {selectedStage} · 战前配装</h2>
              </div>
              <button type="button" onClick={() => setView('stages')} className="text-xs text-white/40 hover:text-white">更换战区</button>
            </div>

            <div className="mb-6 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/55"><Shield className="h-4 w-4 text-violet-300" /> 敌方阵容</div>
              <div className="flex flex-wrap gap-2">
                {roster.map((id) => {
                  const def = enemyDef(id);
                  const counter = weaponInventory.find((weapon) => weapon.targetTypes.includes(id));
                  return (
                    <div key={id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: def.color, boxShadow: `0 0 10px ${def.color}` }} />
                      <div><div className="text-xs">{def.name}</div><div className="text-[9px] text-white/30">弱点：{counter?.name ?? '未知'}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="mb-3 text-xs font-medium text-white/55">武器库 · 选择一把武器</div>
                <div className="space-y-2">
                  {weaponInventory.map((weapon) => (
                    <button type="button" key={weapon.id} onClick={() => setSelectedWeapon(weapon.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedWeapon === weapon.id ? 'border-cyan-300/35 bg-cyan-300/[0.07]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'}`}>
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-black/30" style={{ color: rarityColor[weapon.rarity] }}><Swords className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{weapon.name}</div><div className="mt-0.5 text-[10px]" style={{ color: rarityColor[weapon.rarity] }}>{rarityLabel[weapon.rarity]} · Lv.{weapon.level} · 弱点 ×{weapon.weaknessMult.toFixed(1)}</div></div>
                      <span className="text-[9px] text-white/25">{weapon.fireRate}/s</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between text-xs font-medium text-white/55"><span>十格快捷栏 · 点击槽位装配</span><span className="text-white/25">1—9 / 0</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {quickBar.map((weaponId, index) => {
                    const weapon = weaponInventory.find((item) => item.id === weaponId);
                    return (
                      <button type="button" key={index} onClick={() => placeWeapon(index)} className="min-h-24 rounded-xl border border-white/[0.07] bg-black/20 p-3 text-left transition hover:border-cyan-300/30">
                        <div className="font-mono text-[10px] text-cyan-300/55">{index === 9 ? 0 : index + 1}</div>
                        <div className="mt-3 truncate text-xs font-medium" style={{ color: weapon ? rarityColor[weapon.rarity] : undefined }}>{weapon?.name ?? '空槽位'}</div>
                        <div className="mt-1 truncate text-[9px] text-white/25">{weapon ? `克制 ${weapon.targetTypes.map((id) => enemyDef(id).name).join(' / ')}` : selectedWeaponData ? `装配 ${selectedWeaponData.name}` : '选择武器'}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-violet-300/10 bg-violet-300/[0.04] p-3 text-xs leading-6 text-white/40">
                  <Sparkles className="mr-2 inline h-3.5 w-3.5 text-violet-300" />
                  先用武器 A 命中，切至武器 B 后在 1.5 秒内造成弱点伤害，即可累积 Flow。
                </div>
                <button type="button" onClick={startBattle} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3.5 text-sm font-bold text-[#06100f] transition hover:bg-cyan-200">
                  <Crosshair className="h-4 w-4" /> 进入战场
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'playing' && battle && <BattleArena battle={battle} onEnd={finishBattle} />}

        {(view === 'victory' || view === 'defeat') && result && (
          <div className="mx-auto flex min-h-[620px] max-w-2xl flex-col items-center justify-center py-10 text-center">
            <div className={`mb-5 grid h-16 w-16 place-items-center rounded-2xl border ${view === 'victory' ? 'border-amber-300/25 bg-amber-300/10 text-amber-300' : 'border-rose-400/25 bg-rose-400/10 text-rose-300'}`}>
              {view === 'victory' ? <Trophy className="h-7 w-7" /> : <Shield className="h-7 w-7" />}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/35">Stage {selectedStage}</p>
            <h2 className="mt-3 text-4xl font-bold">{view === 'victory' ? '战线已清除' : '战线失守'}</h2>
            {view === 'victory' && <div className="mt-4 text-3xl tracking-[0.25em] text-amber-300">{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</div>}
            <div className="mt-7 grid w-full grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-lg font-mono">{result.stats.clearTime.toFixed(1)}s</div><div className="mt-1 text-[10px] text-white/30">用时</div></div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-lg font-mono">{result.stats.hitsTaken}</div><div className="mt-1 text-[10px] text-white/30">受击</div></div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-lg font-mono">{result.stats.weaponSwitchCount}</div><div className="mt-1 text-[10px] text-white/30">切枪</div></div>
            </div>
            {view === 'victory' && (
              <div className="mt-4 w-full rounded-xl border border-white/[0.06] bg-black/20 p-4 text-left">
                {result.conditions.map((condition) => <div key={condition.id} className="flex items-center justify-between py-1.5 text-xs"><span className="text-white/50">{condition.text}</span><span className={condition.check(result.stats) ? 'text-emerald-300' : 'text-white/20'}>{condition.check(result.stats) ? '完成' : '未完成'}</span></div>)}
                <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-cyan-300">奖励：{result.reward}</div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={startBattle} className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs text-white/60 hover:bg-white/5 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> 再来一次</button>
              <button type="button" onClick={() => { setSelectedStage(Math.min(maxUnlocked, selectedStage + 1)); setView('loadout'); }} className="flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-xs font-bold text-[#06100f]">{view === 'victory' ? '下一战区' : '调整配装'} <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
