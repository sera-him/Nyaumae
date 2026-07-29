import { useCallback, useMemo, useState } from 'react';
import {
  BookOpen, Cat, ChevronRight, Crosshair, Eye, Flag, Footprints,
  HelpCircle, Mouse, Play, Radar, RotateCcw, Sparkles, Wind, X,
} from 'lucide-react';
import './CatMouseGame.css';

type Point = { x: number; y: number };
type Role = 'cat' | 'mouse';
type Phase = 'setup' | 'mouse-move' | 'bait' | 'cat-move' | 'ended';
type PresetKey = 'quick' | 'standard' | 'long';

type Preset = {
  label: string;
  turns: number;
  start: number;
  scents: number;
  sprints: number;
};

type Frame = {
  turn: number;
  cat: Point;
  mouse: Point;
  bait: Point;
  catAim: Point;
  distance: number;
  sprint: boolean;
  scent: boolean;
};

const PRESETS: Record<PresetKey, Preset> = {
  quick: { label: '快速局', turns: 20, start: 4.5, scents: 2, sprints: 2 },
  standard: { label: '标准局', turns: 35, start: 5.5, scents: 3, sprints: 3 },
  long: { label: '长局', turns: 50, start: 7, scents: 4, sprints: 4 },
};

const WORLD = 18;
const clamp = (v: number) => Math.max(-WORLD, Math.min(WORLD, v));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const moveLimit = (p: Point, normal: number) => Math.max(Math.abs(p.x), Math.abs(p.y)) > 15 ? normal / 2 : normal;
const toward = (from: Point, target: Point, limit: number): Point => {
  const d = distance(from, target);
  if (!d || d <= limit) return { x: clamp(target.x), y: clamp(target.y) };
  return { x: clamp(from.x + (target.x - from.x) * limit / d), y: clamp(from.y + (target.y - from.y) * limit / d) };
};
const jitter = (amount: number) => (Math.random() - .5) * amount;
const fmt = (n: number) => n.toFixed(1);

function randomMouseStart(radius: number): Point {
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function aiMouseMove(mouse: Point, cat: Point, sprint: boolean): Point {
  const limit = moveLimit(mouse, sprint ? 2 : 1);
  const dx = mouse.x - cat.x;
  const dy = mouse.y - cat.y;
  const len = Math.hypot(dx, dy) || 1;
  const tangent = Math.random() > .5 ? 1 : -1;
  const target = {
    x: mouse.x + dx / len * limit * .82 - tangent * dy / len * limit * .42,
    y: mouse.y + dy / len * limit * .82 + tangent * dx / len * limit * .42,
  };
  return toward(mouse, target, limit);
}

function aiBait(mouse: Point, cat: Point): Point {
  const dx = cat.x - mouse.x;
  const dy = cat.y - mouse.y;
  const len = Math.hypot(dx, dy) || 1;
  const side = Math.random() > .5 ? 1 : -1;
  const r = 1.3 + Math.random() * .7;
  return {
    x: clamp(mouse.x + (dx / len * .25 - side * dy / len * .97) * r),
    y: clamp(mouse.y + (dy / len * .25 + side * dx / len * .97) * r),
  };
}

function initialCloud(radius: number): Point[] {
  return Array.from({ length: 260 }, (_, i) => {
    const a = i / 260 * Math.PI * 2;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  });
}

function evolveCloud(cloud: Point[], bait: Point, maxMove: number, truth?: Point): Point[] {
  if (truth) return Array.from({ length: 80 }, () => ({ x: truth.x + jitter(.08), y: truth.y + jitter(.08) }));
  const expanded: Point[] = [];
  cloud.forEach((p, index) => {
    for (let i = 0; i < 5; i++) {
      const a = (index * 2.399 + i * 1.257) % (Math.PI * 2);
      const r = maxMove * (i / 4);
      const q = { x: clamp(p.x + Math.cos(a) * r), y: clamp(p.y + Math.sin(a) * r) };
      if (distance(q, bait) <= 2.03) expanded.push(q);
    }
  });
  if (expanded.length < 30) {
    return Array.from({ length: 140 }, (_, i) => {
      const a = i / 140 * Math.PI * 2;
      const r = 2 * Math.sqrt((i % 17) / 17);
      return { x: clamp(bait.x + Math.cos(a) * r), y: clamp(bait.y + Math.sin(a) * r) };
    });
  }
  return expanded.filter((_, i) => i % Math.max(1, Math.floor(expanded.length / 300)) === 0).slice(0, 320);
}

function centroid(points: Point[], fallback: Point): Point {
  if (!points.length) return fallback;
  return points.reduce((a, p) => ({ x: a.x + p.x / points.length, y: a.y + p.y / points.length }), { x: 0, y: 0 });
}

function Board({
  catPos, mousePos, bait, role, phase, tutorial, cloud, selected, onPick, frames, replayAt, sprintOn,
}: {
  catPos: Point; mousePos: Point; bait: Point | null; role: Role; phase: Phase; tutorial: boolean;
  cloud: Point[]; selected: Point | null; onPick: (p: Point) => void; frames: Frame[]; replayAt: number | null; sprintOn: boolean;
}) {
  const size = 720;
  const pad = 28;
  const scale = (size - pad * 2) / 36;
  const sx = (x: number) => pad + (x + 18) * scale;
  const sy = (y: number) => size - pad - (y + 18) * scale;
  const shown = replayAt == null ? null : frames[replayAt];
  const c = shown?.cat ?? catPos;
  const m = shown?.mouse ?? mousePos;
  const b = shown?.bait ?? bait;
  const canPick = replayAt == null && ['mouse-move', 'bait', 'cat-move'].includes(phase);
  const activeLimit = phase === 'cat-move' ? moveLimit(c, 1.25) : phase === 'bait' ? 2 : moveLimit(m, sprintOn ? 2 : 1);
  const activeOrigin = phase === 'cat-move' ? c : m;
  const revealMouse = role === 'mouse' || phase === 'ended' || replayAt != null;
  const showCloud = role === 'cat' && tutorial && replayAt == null;
  const click = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!canPick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onPick({
      x: clamp(((event.clientX - rect.left) / rect.width * size - pad) / scale - 18),
      y: clamp(-(((event.clientY - rect.top) / rect.height * size - (size - pad)) / scale) - 18),
    });
  };
  const path = (key: 'cat' | 'mouse' | 'bait') => frames.slice(0, replayAt == null ? frames.length : replayAt + 1)
    .map((f, i) => `${i ? 'L' : 'M'}${sx(f[key].x)},${sy(f[key].y)}`).join(' ');

  return (
    <div className="cm-board-wrap">
      <svg className={`cm-board ${canPick ? 'is-pickable' : ''}`} viewBox={`0 0 ${size} ${size}`} onClick={click} aria-label="猫鼠迷踪游戏棋盘">
        <defs>
          <pattern id="minorGrid" width={scale} height={scale} patternUnits="userSpaceOnUse">
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="rgba(119,135,164,.12)" strokeWidth="1" />
          </pattern>
          <radialGradient id="fog"><stop offset="0" stopColor="#8b5cf6" stopOpacity=".28" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" /></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect x={pad} y={pad} width={size-pad*2} height={size-pad*2} rx="16" fill="#101522" />
        <path d={`M${pad},${pad}H${size-pad}V${size-pad}H${pad}Z M${sx(-15)},${sy(15)}H${sx(15)}V${sy(-15)}H${sx(-15)}Z`} fill="#ee8f5b" fillOpacity=".09" fillRule="evenodd" />
        <rect x={pad} y={pad} width={size-pad*2} height={size-pad*2} rx="16" fill="url(#minorGrid)" />
        <rect x={sx(-15)} y={sy(15)} width={30*scale} height={30*scale} fill="none" stroke="#e58a5a" strokeOpacity=".32" strokeDasharray="8 8" />
        <line x1={sx(0)} y1={pad} x2={sx(0)} y2={size-pad} className="cm-axis" />
        <line x1={pad} y1={sy(0)} x2={size-pad} y2={sy(0)} className="cm-axis" />
        {showCloud && cloud.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="2.2" fill="#8b5cf6" opacity=".3" />)}
        {b && <circle cx={sx(b.x)} cy={sy(b.y)} r={2*scale} fill="url(#fog)" stroke="#a78bfa" strokeWidth="2" strokeDasharray="7 6" />}
        {phase !== 'setup' && replayAt == null && (
          <circle cx={sx(activeOrigin.x)} cy={sy(activeOrigin.y)} r={activeLimit*scale} fill="none" stroke={phase === 'cat-move' ? '#67e8f9' : '#f8b4cc'} strokeWidth="2" strokeDasharray="6 6" opacity=".75" />
        )}
        {frames.length > 0 && <path d={path('bait')} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 7" opacity=".45" />}
        {replayAt != null && <>
          <path d={path('cat')} fill="none" stroke="#67e8f9" strokeWidth="3" opacity=".7" />
          <path d={path('mouse')} fill="none" stroke="#fb7185" strokeWidth="3" opacity=".7" />
        </>}
        {selected && replayAt == null && <g className="cm-target" transform={`translate(${sx(selected.x)} ${sy(selected.y)})`}><circle r="10" /><path d="M-15 0H15M0-15V15" /></g>}
        {b && <g transform={`translate(${sx(b.x)} ${sy(b.y)})`} className="cm-bait"><circle r="9" /><path d="M-5 1C-1-6 6-4 5 2C4 7-4 8-5 1Z" /></g>}
        <g transform={`translate(${sx(c.x)} ${sy(c.y)})`} className="cm-cat" filter="url(#glow)">
          <circle r="15" /><path d="M-10-8L-7-19L0-12L8-19L11-7" /><circle cx="-5" cy="-1" r="1.5" /><circle cx="5" cy="-1" r="1.5" />
        </g>
        {revealMouse && <g transform={`translate(${sx(m.x)} ${sy(m.y)})`} className="cm-mouse" filter="url(#glow)">
          <circle r="12" /><circle cx="-8" cy="-9" r="5" /><circle cx="7" cy="-9" r="5" /><circle cx="5" cy="-1" r="1.4" />
        </g>}
        {!revealMouse && <g transform={`translate(${sx(m.x)} ${sy(m.y)})`} opacity="0"><circle r="12" /></g>}
        <text x={pad+8} y={pad+19} className="cm-zone-label">阻力区 · 速度减半</text>
      </svg>
      <div className="cm-board-legend">
        <span><i className="dot cat" />猫</span>
        {(revealMouse || replayAt != null) && <span><i className="dot mouse" />老鼠</span>}
        <span><i className="dot bait" />诱饵</span>
        {tutorial && role === 'cat' && <span><i className="dot fog" />可能位置</span>}
      </div>
    </div>
  );
}

export default function CatMouseGame() {
  const [presetKey, setPresetKey] = useState<PresetKey>('standard');
  const [role, setRole] = useState<Role>('cat');
  const [tutorial, setTutorial] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState(0);
  const [catPos, setCatPos] = useState<Point>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Point>({ x: 5.5, y: 0 });
  const [bait, setBait] = useState<Point | null>(null);
  const [selected, setSelected] = useState<Point | null>(null);
  const [cloud, setCloud] = useState<Point[]>([]);
  const [scents, setScents] = useState(3);
  const [sprints, setSprints] = useState(3);
  const [sprintOn, setSprintOn] = useState(false);
  const [lastSprint, setLastSprint] = useState(-2);
  const [lastScent, setLastScent] = useState(-2);
  const [scentThisTurn, setScentThisTurn] = useState(false);
  const [sprintThisTurn, setSprintThisTurn] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [result, setResult] = useState('');
  const [replayAt, setReplayAt] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [message, setMessage] = useState('选择阵营与模式，开始这场信息不对称的追逐。');
  const preset = PRESETS[presetKey];

  const statusText = useMemo(() => {
    if (phase === 'setup') return '等待开局';
    if (phase === 'mouse-move') return role === 'mouse' ? '选择老鼠的新位置' : '老鼠正在移动';
    if (phase === 'bait') return '放置一个误导诱饵';
    if (phase === 'cat-move') return role === 'cat' ? '判断并移动猫' : '猫正在判断';
    return result;
  }, [phase, role, result]);

  const beginTurnForCat = useCallback((n: number, currentMouse: Point, currentCat: Point, currentCloud: Point[]) => {
    const canSprint = sprints > 0 && n - lastSprint > 1;
    const useSprint = canSprint && (distance(currentMouse, currentCat) < 4.2 || Math.random() < .13);
    const nextMouse = aiMouseMove(currentMouse, currentCat, useSprint);
    const nextBait = aiBait(nextMouse, currentCat);
    const nextCloud = evolveCloud(currentCloud, nextBait, useSprint ? 2 : 1);
    setTurn(n);
    setMousePos(nextMouse);
    setBait(nextBait);
    setCloud(nextCloud);
    setSprintThisTurn(useSprint);
    if (useSprint) {
      setSprints(v => v - 1);
      setLastSprint(n);
    }
    setScentThisTurn(false);
    setSelected(null);
    setPhase('cat-move');
    setMessage(useSprint ? '老鼠公开宣布了疾跑。诱饵已出现——它在诱导你走向哪里？' : '诱饵已出现。先判断可信度，再决定是否使用真实气味。');
  }, [lastSprint, sprints]);

  const startGame = () => {
    const m = randomMouseStart(preset.start);
    const initial = initialCloud(preset.start);
    setTurn(role === 'cat' ? 1 : 1);
    setCatPos({ x: 0, y: 0 });
    setMousePos(m);
    setBait(null);
    setSelected(null);
    setCloud(initial);
    setScents(preset.scents);
    setSprints(preset.sprints);
    setLastSprint(-2);
    setLastScent(-2);
    setScentThisTurn(false);
    setSprintThisTurn(false);
    setFrames([]);
    setResult('');
    setReplayAt(null);
    if (role === 'cat') {
      const useSprint = Math.random() < .1;
      const nextMouse = aiMouseMove(m, { x: 0, y: 0 }, useSprint);
      const nextBait = aiBait(nextMouse, { x: 0, y: 0 });
      setMousePos(nextMouse);
      setBait(nextBait);
      setCloud(evolveCloud(initial, nextBait, useSprint ? 2 : 1));
      setSprintThisTurn(useSprint);
      if (useSprint) {
        setSprints(preset.sprints - 1);
        setLastSprint(1);
      }
      setPhase('cat-move');
      setMessage(useSprint ? '第1回合：老鼠宣布疾跑。观察诱饵，开始推断。' : '第1回合：诱饵已出现。紫色区域只是可能性，不是答案。');
    } else {
      setPhase('mouse-move');
      setMessage('第1回合：点击移动范围内的位置。你始终能看见猫。');
    }
  };

  const pickPoint = (p: Point) => {
    if (phase === 'mouse-move') {
      const limit = moveLimit(mousePos, sprintOn ? 2 : 1);
      if (distance(mousePos, p) > limit + .02) {
        setMessage(`超出本回合移动范围（最多 ${fmt(limit)}）。`);
        return;
      }
    }
    if (phase === 'bait' && distance(mousePos, p) > 2.02) {
      setMessage('诱饵必须放在真实位置半径 2 内。');
      return;
    }
    if (phase === 'cat-move') {
      const limit = moveLimit(catPos, 1.25);
      if (distance(catPos, p) > limit + .02) {
        setMessage(`猫本回合最多移动 ${fmt(limit)}。`);
        return;
      }
    }
    setSelected(p);
  };

  const endOrNext = (frame: Frame, nextCloud: Point[]) => {
    const captured = frame.distance <= 1;
    const final = frame.turn >= preset.turns;
    if (captured || final) {
      const catWin = captured || frame.distance <= 3;
      setResult(catWin ? (captured ? '猫完成捕获' : '猫完成终局封锁') : '老鼠成功逃脱');
      setPhase('ended');
      setReplayAt(frame.turn - 1);
      setMessage(catWin ? '猎手锁定了真相。打开复盘，看看诱饵在哪些回合奏效。' : '假信号拖慢了追踪。打开复盘，检查关键误判。');
      return;
    }
    const next = frame.turn + 1;
    if (role === 'cat') {
      beginTurnForCat(next, frame.mouse, frame.cat, nextCloud);
    } else {
      setTurn(next);
      setPhase('mouse-move');
      setSelected(null);
      setBait(null);
      setSprintOn(false);
      setSprintThisTurn(false);
      setScentThisTurn(false);
      setMessage(`第${next}回合：先走位，再决定诱饵要讲一个怎样的故事。`);
    }
  };

  const useScent = () => {
    if (phase !== 'cat-move' || role !== 'cat' || scents <= 0 || turn - lastScent <= 1) return;
    setScents(v => v - 1);
    setLastScent(turn);
    setScentThisTurn(true);
    setCloud(evolveCloud(cloud, bait ?? mousePos, 0, mousePos));
    setMessage(`真实位置已揭示：(${fmt(mousePos.x)}, ${fmt(mousePos.y)})。诱饵偏移 ${fmt(distance(mousePos, bait ?? mousePos))}。`);
  };

  const confirmAction = () => {
    if (!selected) return;
    if (phase === 'mouse-move' && role === 'mouse') {
      setMousePos(selected);
      if (sprintOn) {
        setSprints(v => v - 1);
        setLastSprint(turn);
        setSprintThisTurn(true);
      }
      setSelected(null);
      setPhase('bait');
      setMessage('现在放置诱饵：离真实位置不超过 2。猫只会看见它。');
      return;
    }
    if (phase === 'bait' && role === 'mouse') {
      const newBait = selected;
      const aiCanScent = scents > 0 && turn - lastScent > 1;
      const aiUsesScent = aiCanScent && (distance(catPos, mousePos) < 4.5 || Math.random() < .1);
      const knownCloud = evolveCloud(cloud, newBait, sprintThisTurn ? 2 : 1, aiUsesScent ? mousePos : undefined);
      const aim = aiUsesScent ? mousePos : centroid(knownCloud, newBait);
      const nextCat = toward(catPos, aim, moveLimit(catPos, 1.25));
      const frame: Frame = { turn, cat: nextCat, mouse: mousePos, bait: newBait, catAim: aim, distance: distance(nextCat, mousePos), sprint: sprintThisTurn, scent: aiUsesScent };
      setBait(newBait);
      setCatPos(nextCat);
      setCloud(knownCloud);
      setFrames(v => [...v, frame]);
      setSelected(null);
      if (aiUsesScent) {
        setScents(v => v - 1);
        setLastScent(turn);
        setScentThisTurn(true);
        setMessage('猫使用了真实气味！你的真实位置已暴露。');
      }
      endOrNext(frame, knownCloud);
      return;
    }
    if (phase === 'cat-move' && role === 'cat') {
      const nextCat = selected;
      const aim = scentThisTurn ? mousePos : centroid(cloud, bait ?? mousePos);
      const frame: Frame = { turn, cat: nextCat, mouse: mousePos, bait: bait ?? mousePos, catAim: aim, distance: distance(nextCat, mousePos), sprint: sprintThisTurn, scent: scentThisTurn };
      const nextCloud = scentThisTurn ? evolveCloud(cloud, bait ?? mousePos, 0, mousePos) : cloud;
      setCatPos(nextCat);
      setFrames(v => [...v, frame]);
      setSelected(null);
      endOrNext(frame, nextCloud);
    }
  };

  const currentDistance = distance(catPos, mousePos);
  const actionLabel = phase === 'mouse-move' ? '确认移动' : phase === 'bait' ? '放置诱饵' : '确认追踪';
  const sprintAvailable = phase === 'mouse-move' && role === 'mouse' && sprints > 0 && turn - lastSprint > 1;
  const scentAvailable = phase === 'cat-move' && role === 'cat' && scents > 0 && turn - lastScent > 1 && !scentThisTurn;

  return (
    <div className="cm-page">
      <div className="cm-noise" aria-hidden="true" />
      <header className="cm-header">
        <div>
          <p className="cm-kicker"><Radar size={15} /> 非对称推理追逐</p>
          <h1>猫鼠<span>迷踪</span></h1>
        </div>
        <div className="cm-header-actions">
          <button className="cm-ghost" onClick={() => setRulesOpen(true)}><BookOpen size={17} />规则</button>
          {phase !== 'setup' && <button className="cm-ghost" onClick={() => setPhase('setup')}><RotateCcw size={17} />重开</button>}
        </div>
      </header>

      {phase === 'setup' ? (
        <main className="cm-setup">
          <section className="cm-hero-copy">
            <div className="cm-eyebrow">灵感源自 IMO 2017 · 猎人与兔子</div>
            <h2>你追逐的，<br />是真相还是<span>诱饵？</span></h2>
            <p>在连续平面上展开一场信息不对称的心理战。猫用三次真实气味收紧可能区域；老鼠用假信号与疾跑，把判断引向错误方向。</p>
            <div className="cm-principles">
              <div><Crosshair /><b>推断</b><span>从诱饵与轨迹收缩可能区域</span></div>
              <div><Sparkles /><b>欺骗</b><span>用半径 2 的诱饵制造错误叙事</span></div>
              <div><Wind /><b>突围</b><span>把握不可连续使用的稀缺资源</span></div>
            </div>
          </section>
          <section className="cm-start-card">
            <div className="cm-step">
              <span>01</span><div><b>选择阵营</b><small>另一方由电脑控制</small></div>
            </div>
            <div className="cm-choice-grid">
              <button className={role === 'cat' ? 'active cat' : ''} onClick={() => setRole('cat')}><Cat /><b>扮演猫</b><small>观察 · 推断 · 封锁</small></button>
              <button className={role === 'mouse' ? 'active mouse' : ''} onClick={() => setRole('mouse')}><Mouse /><b>扮演老鼠</b><small>走位 · 欺骗 · 逃脱</small></button>
            </div>
            <div className="cm-step"><span>02</span><div><b>选择局长</b><small>规则与资源自动匹配</small></div></div>
            <div className="cm-presets">
              {(Object.keys(PRESETS) as PresetKey[]).map(key => (
                <button key={key} className={presetKey === key ? 'active' : ''} onClick={() => setPresetKey(key)}>
                  <b>{PRESETS[key].label}</b><small>{PRESETS[key].turns} 回合 · 起距 {PRESETS[key].start}</small>
                </button>
              ))}
            </div>
            <label className="cm-toggle-row">
              <span><Eye size={18} /><span><b>教学模式</b><small>为猫自动显示完整可能区域</small></span></span>
              <input type="checkbox" checked={tutorial} onChange={e => setTutorial(e.target.checked)} />
              <i />
            </label>
            <button className="cm-primary cm-start" onClick={startGame}><Play size={18} fill="currentColor" />开始追逐<ChevronRight size={18} /></button>
          </section>
        </main>
      ) : (
        <main className="cm-game">
          <section className="cm-game-main">
            <div className="cm-game-bar">
              <div><span>回合</span><b>{turn}<i>/ {preset.turns}</i></b></div>
              <div className="cm-phase"><i />{statusText}</div>
              <div className="cm-distance"><span>当前距离</span><b>{role === 'mouse' || phase === 'ended' ? fmt(currentDistance) : '未知'}</b></div>
            </div>
            <Board catPos={catPos} mousePos={mousePos} bait={bait} role={role} phase={phase} tutorial={tutorial} cloud={cloud} selected={selected} onPick={pickPoint} frames={frames} replayAt={replayAt} sprintOn={sprintOn} />
            {phase === 'ended' && frames.length > 0 && (
              <div className="cm-replay">
                <button onClick={() => setReplayAt(v => v === null ? 0 : v === 0 ? frames.length - 1 : v - 1)}>‹</button>
                <input aria-label="复盘回合" type="range" min="0" max={frames.length - 1} value={replayAt ?? frames.length - 1} onChange={e => setReplayAt(Number(e.target.value))} />
                <button onClick={() => setReplayAt(v => v === null || v === frames.length - 1 ? 0 : v + 1)}>›</button>
                <b>第 {(replayAt ?? frames.length - 1) + 1} 回合</b>
              </div>
            )}
          </section>

          <aside className="cm-panel">
            <div className="cm-role-banner">
              <div className={role}><span>{role === 'cat' ? <Cat /> : <Mouse />}</span><div><small>你正在扮演</small><b>{role === 'cat' ? '追踪者 · 猫' : '欺骗者 · 老鼠'}</b></div></div>
              <span className="cm-mode">{tutorial ? '教学' : '竞技'}</span>
            </div>
            <div className="cm-message"><HelpCircle size={18} /><p>{message}</p></div>
            <div className="cm-resources">
              <h3>战术资源</h3>
              <div>
                <span className="resource-icon scent"><Radar /></span>
                <p><b>真实气味</b><small>揭示本回合真实位置</small></p>
                <strong>{Array.from({ length: preset.scents }, (_, i) => <i key={i} className={i < scents ? 'on' : ''} />)}</strong>
              </div>
              <div>
                <span className="resource-icon sprint"><Wind /></span>
                <p><b>疾跑</b><small>移动上限由 1 变为 2</small></p>
                <strong>{Array.from({ length: preset.sprints }, (_, i) => <i key={i} className={i < sprints ? 'on' : ''} />)}</strong>
              </div>
            </div>
            {phase !== 'ended' ? (
              <div className="cm-controls">
                {role === 'cat' && phase === 'cat-move' && (
                  <button className="cm-scent" disabled={!scentAvailable} onClick={useScent}>
                    <Radar size={19} /><span><b>{scentThisTurn ? '真实位置已揭示' : '使用真实气味'}</b><small>{scentAvailable ? '本回合可用' : '冷却中或已耗尽'}</small></span>
                  </button>
                )}
                {role === 'mouse' && phase === 'mouse-move' && (
                  <button className={`cm-sprint ${sprintOn ? 'active' : ''}`} disabled={!sprintAvailable} onClick={() => { setSprintOn(v => !v); setSelected(null); }}>
                    <Wind size={19} /><span><b>{sprintOn ? '已宣布疾跑' : '宣布疾跑'}</b><small>{sprintAvailable ? `移动上限 ${sprintOn ? 2 : 1}` : '冷却中或已耗尽'}</small></span>
                  </button>
                )}
                <button className="cm-primary" disabled={!selected} onClick={confirmAction}>{actionLabel}<ChevronRight size={17} /></button>
                <p className="cm-coordinate">{selected ? `目标坐标 (${fmt(selected.x)}, ${fmt(selected.y)})` : '在棋盘上点击一个有效位置'}</p>
              </div>
            ) : (
              <div className="cm-result-card">
                <Flag />
                <small>对局结束</small>
                <h2>{result}</h2>
                <p>{frames.length} 回合 · 终局距离 {fmt(frames.at(-1)?.distance ?? currentDistance)}</p>
                <button className="cm-primary" onClick={() => setPhase('setup')}><RotateCcw size={17} />再来一局</button>
              </div>
            )}
            <div className="cm-log">
              <h3>公开记录</h3>
              {frames.length === 0 ? <p>对局记录将在这里出现。</p> : [...frames].reverse().slice(0, 5).map(f => (
                <div key={f.turn}><b>R{f.turn}</b><span>{f.sprint ? '疾跑 ' : ''}{f.scent ? '· 真实气味 ' : ''}· 距离 {fmt(f.distance)}</span></div>
              ))}
            </div>
          </aside>
        </main>
      )}

      {rulesOpen && (
        <div className="cm-modal-backdrop" onMouseDown={() => setRulesOpen(false)}>
          <section className="cm-rules" onMouseDown={e => e.stopPropagation()}>
            <button className="cm-close" onClick={() => setRulesOpen(false)} aria-label="关闭规则"><X /></button>
            <p className="cm-kicker"><Footprints size={15} /> 规则速览</p>
            <h2>在 36 × 36 的连续平面上博弈</h2>
            <div className="cm-rule-grid">
              <article><b>01 · 老鼠移动</b><p>每回合移动不超过 1；疾跑时不超过 2，且不可连续使用。</p></article>
              <article><b>02 · 放置诱饵</b><p>诱饵距离真实位置不超过 2。猫能看见诱饵，却看不见老鼠。</p></article>
              <article><b>03 · 真实气味</b><p>猫在移动前揭示本回合真实位置，总次数有限且不可连续使用。</p></article>
              <article><b>04 · 猫移动</b><p>每回合移动不超过 1.25。移动后距离 ≤ 1，立即完成捕获。</p></article>
              <article><b>阻力区</b><p>回合开始时若 max(|x|, |y|) &gt; 15，本回合移动上限减半。</p></article>
              <article><b>终局封锁</b><p>最后一回合结束时距离 ≤ 3，猫胜；否则老鼠成功逃脱。</p></article>
            </div>
            <button className="cm-primary" onClick={() => setRulesOpen(false)}>明白了，开始判断</button>
          </section>
        </div>
      )}
    </div>
  );
}
