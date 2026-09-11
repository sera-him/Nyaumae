import { useCallback, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, RotateCcw, Sparkles } from 'lucide-react';
import './GiantCatch.css';

/**
 * 《大人国抓小人》——以《大人国的小女孩》停车场为舞台的非对称追逐游戏。
 * 喵呜（🐹）在石灰格子上躲避小满（👆）的指尖；撑过限定回合即获胜，
 * 被指尖轻轻点到则被"温柔抓住"。支持双阵营游玩。
 */

type Point = { x: number; y: number };
type Role = 'mouse' | 'giant';
type PresetKey = 'quick' | 'standard' | 'long';
type Phase = 'setup' | 'playing' | 'ended';
type Outcome = 'caught' | 'survived' | null;

interface Preset {
  label: string;
  note: string;
  turns: number;
}

const PRESETS: Record<PresetKey, Preset> = {
  quick: { label: '快速局', note: '撑过 16 回合', turns: 16 },
  standard: { label: '标准局', note: '撑过 24 回合', turns: 24 },
  long: { label: '长局', note: '撑过 32 回合', turns: 32 },
};

const GRID = 9;
const MOUSE_START: Point = { x: 0, y: 7 };
const GIANT_START: Point = { x: 8, y: 1 };
const MOUSE_DASHES = 3;
/** 小满每隔一回合才伸一次手指：偶数回合行动。 */
const giantActsOn = (turn: number) => turn % 2 === 0;

/** 停车场障碍：小满会小心绕开的杂物（她跨不过去时会绕，但指尖可以越过头顶）。 */
const CONES: Point[] = [
  { x: 3, y: 3 },
  { x: 5, y: 6 },
  { x: 2, y: 5 },
];
const TIRES: Point[] = [
  { x: 6, y: 3 },
  { x: 4, y: 8 },
];
const BOXES: Point[] = [
  { x: 1, y: 2 },
  { x: 7, y: 6 },
];
const OBSTACLES: readonly Point[] = [...CONES, ...TIRES, ...BOXES];
const obstacleKey = (p: Point) => `${p.x},${p.y}`;
const OBSTACLE_SET = new Set(OBSTACLES.map(obstacleKey));
const obstacleAt = (p: Point) => OBSTACLE_SET.has(obstacleKey(p));
const inBounds = (p: Point) => p.x >= 0 && p.x < GRID && p.y >= 0 && p.y < GRID;
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const chebyshev = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const ORTHO: readonly Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

interface LogEntry {
  readonly id: number;
  readonly turn: number;
  readonly side: 'mouse' | 'giant' | 'system';
  readonly text: string;
}

interface GameState {
  readonly role: Role;
  readonly presetKey: PresetKey;
  readonly turn: number;
  readonly mouse: Point;
  readonly giant: Point;
  readonly dashesLeft: number;
  readonly phase: Phase;
  readonly outcome: Outcome;
  readonly log: readonly LogEntry[];
  readonly nextLogId: number;
}

interface MoveOption {
  readonly target: Point;
  readonly path: readonly Point[];
  readonly dash: boolean;
}

function createGame(role: Role, presetKey: PresetKey): GameState {
  return {
    role,
    presetKey,
    turn: 1,
    mouse: { ...MOUSE_START },
    giant: { ...GIANT_START },
    dashesLeft: MOUSE_DASHES,
    phase: 'playing',
    outcome: null,
    log: [
      {
        id: 1,
        turn: 0,
        side: 'system',
        text: role === 'mouse'
          ? '小满把指尖悬在停车场上空：“我们来玩抓小人！你跑，我轻轻地抓。”'
          : '喵呜在石灰格子里缩了缩：“那……你数到一，就开始啦。”',
      },
    ],
    nextLogId: 2,
  };
}

function appendLog(state: GameState, side: LogEntry['side'], text: string): GameState {
  return {
    ...state,
    log: [{ id: state.nextLogId, turn: state.turn, side, text }, ...state.log].slice(0, 40),
    nextLogId: state.nextLogId + 1,
  };
}

const coordLabel = (p: Point) => `${String.fromCharCode(65 + p.x)}${p.y + 1}`;

/** 喵呜的普通移动：1 格正交；冲刺：直线 2 格（中途格也必须可走）。 */
function mouseMoveOptions(state: GameState): MoveOption[] {
  const options: MoveOption[] = [];
  for (const delta of ORTHO) {
    const target = { x: state.mouse.x + delta.x, y: state.mouse.y + delta.y };
    if (!inBounds(target) || obstacleAt(target) || same(target, state.giant)) continue;
    options.push({ target, path: [target], dash: false });
    if (state.dashesLeft > 0) {
      const far = { x: target.x + delta.x, y: target.y + delta.y };
      if (inBounds(far) && !obstacleAt(far) && !same(far, state.giant)) {
        options.push({ target: far, path: [target, far], dash: true });
      }
    }
  }
  return options;
}

/** 小满的行动：1 格正交，或直线 2 格（指尖越过杂物上方）。 */
function giantMoveOptions(state: GameState): MoveOption[] {
  const options: MoveOption[] = [];
  for (const delta of ORTHO) {
    const one = { x: state.giant.x + delta.x, y: state.giant.y + delta.y };
    if (!inBounds(one)) continue;
    options.push({ target: one, path: [one], dash: false });
    const two = { x: one.x + delta.x, y: one.y + delta.y };
    if (inBounds(two)) {
      options.push({ target: two, path: [one, two], dash: false });
    }
  }
  return options;
}

function bfsDistance(from: Point, to: Point): number {
  if (same(from, to)) return 0;
  const queue: Point[] = [from];
  const seen = new Map<string, number>([[obstacleKey(from), 0]]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = seen.get(obstacleKey(current))!;
    for (const delta of ORTHO) {
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      if (!inBounds(next) || seen.has(obstacleKey(next))) continue;
      // 小满本体绕障碍，但指尖可越过：BFS 计 giant 身位距离时绕行，目标格本身可为障碍邻位
      // 终点允许落在障碍格的邻位距离，但本体不穿障碍
      if (obstacleAt(next) && !same(next, to)) continue;
      const nextDepth = depth + 1;
      if (same(next, to)) return nextDepth;
      seen.set(obstacleKey(next), nextDepth);
      queue.push(next);
    }
  }
  return Number.POSITIVE_INFINITY;
}

/** AI 小满：从合法行动中挑“之后离喵呜 BFS 距离最近”的一步；能碰到就直接抓。 */
function aiGiantMove(state: GameState): MoveOption {
  const options = giantMoveOptions(state);
  let best = options[0];
  let bestKey = Number.POSITIVE_INFINITY;
  for (const option of options) {
    if (option.path.some((cell) => same(cell, state.mouse))) return option;
    const nextDist = bfsDistance(option.target, state.mouse);
    const key = nextDist * 100 - option.path.length;
    if (key < bestKey) {
      bestKey = key;
      best = option;
    }
  }
  return best;
}

/** AI 喵呜：最大化“小满下次行动可及范围中的最小距离”，冲刺留到危险时用。 */
function aiMouseMove(state: GameState): MoveOption {
  const options = mouseMoveOptions(state);
  let best = options[0] ?? null;
  let bestKey = Number.NEGATIVE_INFINITY;
  for (const option of options) {
    const projected: GameState = {
      ...state,
      mouse: option.target,
      turn: state.turn + 1,
      dashesLeft: state.dashesLeft - (option.dash ? 1 : 0),
    };
    const danger = giantDanger(projected);
    const openness = ORTHO.filter((delta) => {
      const neighbor = { x: option.target.x + delta.x, y: option.target.y + delta.y };
      return inBounds(neighbor) && !obstacleAt(neighbor) && !same(neighbor, state.giant);
    }).length;
    const key = danger * 10 + openness * 0.1 - (option.dash ? 2.5 : 0);
    if (key > bestKey) {
      bestKey = key;
      best = option;
    }
  }
  return best;
}

/** 小满下次行动时，指尖能覆盖到的所有格子。 */
function giantReach(state: GameState): Point[] {
  if (!giantActsOn(state.turn)) return [];
  const cells: Point[] = [];
  for (const delta of ORTHO) {
    const one = { x: state.giant.x + delta.x, y: state.giant.y + delta.y };
    if (!inBounds(one)) continue;
    cells.push(one);
    const two = { x: one.x + delta.x, y: one.y + delta.y };
    if (inBounds(two)) cells.push(two);
  }
  return cells;
}

function giantDanger(state: GameState): number {
  const reach = giantReach(state);
  if (reach.length === 0) {
    return chebyshev(state.mouse, state.giant) + 1.5;
  }
  let min = Number.POSITIVE_INFINITY;
  for (const cell of reach) {
    const dist = Math.abs(cell.x - state.mouse.x) + Math.abs(cell.y - state.mouse.y);
    if (dist < min) min = dist;
  }
  return min;
}

function resolveGiantMove(state: GameState, option: MoveOption): GameState {
  const caught = option.path.some((cell) => same(cell, state.mouse));
  let next: GameState = { ...state, giant: option.target };
  next = appendLog(
    next,
    'giant',
    caught
      ? `小满的指尖轻轻落在 ${coordLabel(option.target)}——正好碰到你。`
      : `小满的指尖落在 ${coordLabel(option.target)}，地面轻轻震了一下。`,
  );
  if (caught) {
    return {
      ...next,
      phase: 'ended',
      outcome: 'caught',
    };
  }
  if (state.turn >= PRESETS[state.presetKey].turns) {
    return { ...next, phase: 'ended', outcome: 'survived' };
  }
  return { ...next, turn: state.turn + 1 };
}

function resolveMouseMove(state: GameState, option: MoveOption): GameState {
  const dashNote = option.dash ? '（冲刺！）' : '';
  let next: GameState = {
    ...state,
    mouse: option.target,
    dashesLeft: state.dashesLeft - (option.dash ? 1 : 0),
  };
  next = appendLog(next, 'mouse', `喵呜${dashNote}跑到了 ${coordLabel(option.target)}。`);
  if (same(option.target, state.giant)) {
    return { ...next, phase: 'ended', outcome: 'caught' };
  }
  if (!giantActsOn(next.turn)) {
    return { ...next, turn: next.turn + 1 };
  }
  return next;
}

function outcomeTitle(outcome: Outcome, role: Role): string {
  if (outcome === 'caught') {
    return role === 'giant' ? '温柔抓捕成功！' : '被轻轻碰到了';
  }
  return role === 'mouse' ? '你撑到了最后！' : '指尖落空了';
}

function outcomeDetail(outcome: Outcome, role: Role): string {
  if (outcome === 'caught') {
    return role === 'giant'
      ? '“抓到啦，小仓鼠。”她把你放在掌心，很暖。你们的约定又多了一个。'
      : '她用一根手指轻轻碰到了你——不疼，但这一局的胜利归她。';
  }
  return role === 'mouse'
    ? '天色暗了。小满把手收回去：“明天……我还能来找你玩吗？”你赢得了这场追逐，也收获了一个约定。'
    : '喵呜从石灰格子另一头冲了出去。小满撇撇嘴，但眼睛是弯的。';
}

function cellIcon(p: Point, state: GameState): string {
  if (state.phase !== 'ended' && same(p, state.giant)) return '👆';
  if (same(p, state.mouse)) return '🐹';
  if (state.phase === 'ended' && same(p, state.giant)) return '👆';
  if (CONES.some((c) => same(c, p))) return '🚧';
  if (TIRES.some((c) => same(c, p))) return '🛞';
  if (BOXES.some((c) => same(c, p))) return '📦';
  return '';
}

function cellHint(p: Point, state: GameState): string {
  if (same(p, state.mouse)) return '喵呜（你操控的小不点）';
  if (same(p, state.giant)) return '小满的指尖';
  if (CONES.some((c) => same(c, p))) return '交通锥（会挡住喵呜）';
  if (TIRES.some((c) => same(c, p))) return '轮胎（会挡住喵呜）';
  if (BOXES.some((c) => same(c, p))) return '纸箱棋子（会挡住喵呜）';
  return `${coordLabel(p)}：空格`;
}

export default function GiantCatch() {
  const [state, setState] = useState<GameState>(() => createGame('mouse', 'standard'));
  const [showRules, setShowRules] = useState(true);

  const preset = PRESETS[state.presetKey];
  const playerIsMouse = state.role === 'mouse';
  const mouseOptions = useMemo(() => (state.phase === 'playing' ? mouseMoveOptions(state) : []), [state]);
  const giantOptions = useMemo(() => (state.phase === 'playing' ? giantMoveOptions(state) : []), [state]);
  const pendingGiantTurn = state.phase === 'playing' && giantActsOn(state.turn);
  const mouseTargets = useMemo(
    () => new Set(state.phase === 'playing' && !pendingGiantTurn ? mouseOptions.map((option) => obstacleKey(option.target)) : []),
    [mouseOptions, pendingGiantTurn, state.phase],
  );
  const giantTargets = useMemo(
    () => new Set(pendingGiantTurn && !playerIsMouse ? giantOptions.map((option) => obstacleKey(option.target)) : []),
    [giantOptions, pendingGiantTurn, playerIsMouse],
  );
  // 危险预览始终按“小满下一次行动”计算，不区分当前是不是她的回合。
  const reachPreview = useMemo(
    () => new Set(giantReach({ ...state, turn: giantActsOn(state.turn) ? state.turn : state.turn + 1 }).map(obstacleKey)),
    [state],
  );

  const restart = useCallback((nextRole: Role, nextPreset: PresetKey) => {
    setState(createGame(nextRole, nextPreset));
  }, []);

  const handleCellClick = useCallback((p: Point) => {
    setState((current) => {
      if (current.phase !== 'playing') return current;
      const key = obstacleKey(p);
      if (playerIsMouse && !pendingGiantTurn) {
        const option = mouseMoveOptions(current).find((candidate) => key === obstacleKey(candidate.target));
        if (!option) return current;
        return resolveMouseMove(current, option);
      }
      if (!playerIsMouse && pendingGiantTurn) {
        const option = giantMoveOptions(current).find((candidate) => key === obstacleKey(candidate.target));
        if (!option) return current;
        return resolveGiantMove(current, option);
      }
      return current;
    });
  }, [pendingGiantTurn, playerIsMouse]);

  const passTurn = useCallback(() => {
    setState((current) => {
      if (current.phase !== 'playing') return current;
      if (playerIsMouse && pendingGiantTurn) {
        return resolveGiantMove(current, aiGiantMove(current));
      }
      if (!playerIsMouse && !pendingGiantTurn) {
        const option = aiMouseMove(current);
        if (!option) {
          const stalled = appendLog(current, 'system', '喵呜被围住了，只能停在原地。');
          return { ...stalled, turn: stalled.turn + 1 };
        }
        return resolveMouseMove(current, option);
      }
      return current;
    });
  }, [pendingGiantTurn, playerIsMouse]);

  const statusText = state.phase === 'ended'
    ? (state.outcome === 'caught' ? '本局结束：被温柔抓住' : '本局结束：成功甩开')
    : pendingGiantTurn
      ? (playerIsMouse ? '小满的回合：屏住呼吸——' : '你的回合：选择指尖落点')
      : (playerIsMouse ? '你的回合：跑！' : '喵呜的回合：它正在找空隙——');

  return (
    <section className="giant-catch" aria-label="大人国抓小游戏">
      <header className="gc-hero">
        <div>
          <div className="gc-kicker"><Sparkles size={13} /> GIANT &amp; TINY · 停车场 · 石灰格子</div>
          <h2>大人国抓小人</h2>
          <p>小满把停车场的石灰格子当成棋盘，用一根手指轻轻地“抓”你。撑过限定回合，或者被她碰到——都是这个下午的一部分。</p>
        </div>
        <div className="gc-header-actions">
          <button type="button" onClick={() => setShowRules((value) => !value)}>
            <BookOpen size={15} /> 规则 {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" onClick={() => restart(state.role, state.presetKey)} aria-label="重新开始">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {showRules && (
        <section className="gc-rules" aria-label="游戏规则">
          <div><h3>1 · 棋盘</h3><p>9×9 石灰格子。🚧 交通锥、🛞 轮胎、📦 纸箱棋子会挡住喵呜，但挡不住小满的指尖——她太大啦。</p></div>
          <div><h3>2 · 喵呜（🐹）</h3><p>每回合移动 1 格（上下左右）。全场共有 3 次“冲刺”：直线连跑 2 格，中途格也必须可走。不能踏上小满的指尖。</p></div>
          <div><h3>3 · 小满（👆）</h3><p>她每两回合才郑重地伸一次手指：移动 1 格，或直线 2 格。指尖经过的每一格（包括中途）只要碰到你，就算温柔抓住。</p></div>
          <div><h3>4 · 胜负</h3><p>喵呜撑过限定回合即获胜；被指尖碰到则小满获胜。追逐从 {coordLabel(MOUSE_START)} 对 {coordLabel(GIANT_START)} 开始。</p></div>
        </section>
      )}

      {state.phase === 'ended' && (
        <div className={`gc-banner gc-banner-${state.outcome}`}>
          <div>
            <h3>{outcomeTitle(state.outcome, state.role)}</h3>
            <p>{outcomeDetail(state.outcome, state.role)}</p>
          </div>
          <button type="button" onClick={() => restart(state.role, state.presetKey)}><RotateCcw size={15} /> 再来一局</button>
        </div>
      )}

      <div className="gc-status-row" aria-live="polite">
        <span className={`gc-turn-chip ${pendingGiantTurn ? 'is-giant' : 'is-mouse'}`}>{statusText}</span>
        <span className="gc-counter">第 <strong>{Math.min(state.turn, preset.turns)}</strong> / {preset.turns} 回合</span>
        <span className="gc-dash">冲刺余量 <strong>{state.dashesLeft}</strong></span>
      </div>

      <div className="gc-workspace">
        <div className="gc-board-panel">
          <div className="gc-board" role="grid" aria-label="停车场石灰格子棋盘">
            {Array.from({ length: GRID * GRID }, (_, index) => {
              const p = { x: index % GRID, y: Math.floor(index / GRID) };
              const key = obstacleKey(p);
              const clickable = playerIsMouse ? mouseTargets.has(key) : giantTargets.has(key);
              const inDanger = playerIsMouse && reachPreview.has(key) && state.phase === 'playing';
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={[
                    'gc-cell',
                    clickable ? 'is-clickable' : '',
                    inDanger ? 'is-danger' : '',
                    (p.x + p.y) % 2 === 0 ? 'is-even' : 'is-odd',
                  ].join(' ')}
                  onClick={() => handleCellClick(p)}
                  disabled={state.phase !== 'playing' || !clickable}
                  aria-label={cellHint(p, state)}
                >
                  {cellIcon(p, state)}
                </button>
              );
            })}
          </div>
          <div className="gc-legend">
            <span>🐹 喵呜</span><span>👆 小满的指尖</span><span>🚧 交通锥</span><span>🛞 轮胎</span><span>📦 纸箱棋子</span><span className="gc-danger-legend">红框 = 指尖下一跳可覆盖</span>
          </div>
          {!playerIsMouse && state.phase === 'playing' && !pendingGiantTurn && (
            <button type="button" className="gc-primary-button" onClick={passTurn}>让喵呜先跑</button>
          )}
          {playerIsMouse && state.phase === 'playing' && pendingGiantTurn && (
            <button type="button" className="gc-primary-button" onClick={passTurn}>让小满伸手指</button>
          )}
        </div>

        <aside className="gc-side-panel">
          <section className="gc-setup-card" aria-label="对局设置">
            <div className="gc-setup-block">
              <span className="gc-setup-label">你的阵营</span>
              <div className="gc-role-list">
                <button type="button" className={state.role === 'mouse' ? 'is-active' : ''} onClick={() => restart('mouse', state.presetKey)}>
                  <strong>🐹 喵呜</strong><small>逃跑 · 撑过回合</small>
                </button>
                <button type="button" className={state.role === 'giant' ? 'is-active' : ''} onClick={() => restart('giant', state.presetKey)}>
                  <strong>👆 小满</strong><small>追逐 · 温柔抓捕</small>
                </button>
              </div>
            </div>
            <div className="gc-setup-block">
              <span className="gc-setup-label">对局长短</span>
              <div className="gc-preset-list">
                {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={state.presetKey === key ? 'is-active' : ''}
                    onClick={() => restart(state.role, key)}
                  >
                    <strong>{PRESETS[key].label}</strong><small>{PRESETS[key].note}</small>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="gc-log-panel" aria-label="追逐记录">
            <h3>追逐记录</h3>
            {state.log.length === 0 ? <p className="gc-empty-log">还没有动作。</p> : (
              <ol className="gc-log-list">
                {state.log.map((entry) => (
                  <li key={entry.id} className={`gc-log-${entry.side}`}>
                    <b>{entry.side === 'mouse' ? '🐹' : entry.side === 'giant' ? '👆' : '✳'}</b>
                    <span>{entry.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
