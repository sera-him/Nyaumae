import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BookOpen, Check, ChevronRight, Copy, Focus, RotateCcw,
  Sparkles, Target, ZoomIn, ZoomOut,
} from 'lucide-react';
import './FractalEcho.css';

type Player = 'A' | 'B';
type PatternId = 'spread' | 'reach' | 'curl';
type Stamp = { pattern: PatternId };
type StampMap = Record<string, Stamp>;
type PlayerMap<T> = Record<Player, T>;

type Pattern = {
  name: string;
  action: string;
  description: string;
  angles: number[];
  scales: number[];
};

type Segment = {
  owner: Player;
  address: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scale: number;
  depth: number;
};

type Contact = { a: Segment; b: Segment; x: number; y: number };

const W = 960;
const H = 620;
const MAX_ROUNDS = 6;
const MAX_TURNS = MAX_ROUNDS * 2;
const LETTERS = ['L', 'M', 'R'] as const;
const COLORS: PlayerMap<string> = { A: '#71f6d2', B: '#ff8fcf' };

const PATTERNS: Record<PatternId, Pattern> = {
  spread: {
    name: '展开',
    action: '向两侧铺开',
    description: '三个分支平均展开，适合抢占更大的区域。',
    angles: [-48, 0, 48],
    scales: [.58, .5, .58],
  },
  reach: {
    name: '直达',
    action: '把中枝推远',
    description: '中间的分支更长，适合伸向远处的空位。',
    angles: [-22, 0, 22],
    scales: [.48, .78, .48],
  },
  curl: {
    name: '回旋',
    action: '沿一侧绕行',
    description: '枝条向一侧弯曲，适合绕开已经拥挤的地方。',
    angles: [-66, -18, 25],
    scales: [.64, .55, .48],
  },
};

const DEFAULT_PATTERN: PatternId = 'spread';

const activePlayer = (turn: number): Player => turn % 2 === 0 ? 'A' : 'B';

const effectivePattern = (address: string, stamps: StampMap): PatternId => {
  for (let i = address.length; i >= 0; i -= 1) {
    const stamp = stamps[address.slice(0, i)];
    if (stamp) return stamp.pattern;
  }
  return DEFAULT_PATTERN;
};

const nearestStamp = (address: string, stamps: StampMap): string | null => {
  for (let i = address.length; i >= 0; i -= 1) {
    if (stamps[address.slice(0, i)]) return address.slice(0, i);
  }
  return null;
};

const makeSegments = (owner: Player, stamps: StampMap, zoom: number): Segment[] => {
  const out: Segment[] = [];
  const rootX = owner === 'A' ? 425 : 535;
  const rootAngle = owner === 'A' ? -78 : -102;
  const baseLength = 116 * zoom;
  const maxDepth = 8;

  const walk = (address: string, x: number, y: number, angle: number, length: number, scale: number) => {
    if (address.length >= maxDepth || length < 1.35) return;
    const pattern = PATTERNS[effectivePattern(address, stamps)];
    const mirror = owner === 'B' ? -1 : 1;

    pattern.angles.forEach((offset, index) => {
      const childAddress = `${address}${LETTERS[index]}`;
      const childAngle = angle + offset * mirror;
      const childScale = pattern.scales[index];
      const childLength = length * childScale;
      const radians = childAngle * Math.PI / 180;
      const x2 = x + Math.cos(radians) * childLength;
      const y2 = y + Math.sin(radians) * childLength;
      out.push({
        owner,
        address: childAddress,
        x1: x,
        y1: y,
        x2,
        y2,
        scale: scale * childScale,
        depth: childAddress.length,
      });
      walk(childAddress, x2, y2, childAngle, childLength, scale * childScale);
    });
  };

  const rootY = 592;
  const rootTopY = 515;
  out.push({ owner, address: '', x1: 480, y1: rootY, x2: rootX, y2: rootTopY, scale: 1, depth: 0 });
  walk('', rootX, rootTopY, rootAngle, baseLength, 1);
  return out;
};

const intersects = (a: Segment, b: Segment) => {
  const den = (a.x1 - a.x2) * (b.y1 - b.y2) - (a.y1 - a.y2) * (b.x1 - b.x2);
  if (Math.abs(den) < .001) return null;
  const t = ((a.x1 - b.x1) * (b.y1 - b.y2) - (a.y1 - b.y1) * (b.x1 - b.x2)) / den;
  const u = -((a.x1 - a.x2) * (a.y1 - b.y1) - (a.y1 - a.y2) * (a.x1 - b.x1)) / den;
  if (t < .04 || t > .96 || u < .04 || u > .96) return null;
  return { x: a.x1 + t * (a.x2 - a.x1), y: a.y1 + t * (a.y2 - a.y1) };
};

const contactsOf = (a: Segment[], b: Segment[]): Contact[] => {
  const contacts: Contact[] = [];
  for (const left of a) {
    if (left.depth < 2) continue;
    for (const right of b) {
      if (right.depth < 2) continue;
      const point = intersects(left, right);
      if (!point) continue;
      contacts.push({ a: left, b: right, ...point });
      if (contacts.length >= 20) return contacts;
    }
  }
  return contacts;
};

const fillGrid = (items: Segment[], n: number) => {
  const cells = new Set<string>();
  items.forEach((segment) => {
    const steps = Math.max(2, Math.ceil(Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) / (W / n)));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = segment.x1 + (segment.x2 - segment.x1) * t;
      const y = segment.y1 + (segment.y2 - segment.y1) * t;
      const gx = Math.max(0, Math.min(n - 1, Math.floor(x / W * n)));
      const gy = Math.max(0, Math.min(n - 1, Math.floor(y / H * n)));
      cells.add(`${gx},${gy}`);
    }
  });
  return cells;
};

const territoryOf = (own: Segment[], opponent: Segment[]) => {
  const ownCells = fillGrid(own, 24);
  const opponentCells = fillGrid(opponent, 24);
  const union = new Set([...ownCells, ...opponentCells]);
  if (!union.size) return .5;
  let ownShare = 0;
  union.forEach((cell) => {
    if (ownCells.has(cell)) ownShare += opponentCells.has(cell) ? .5 : 1;
  });
  return ownShare / union.size;
};

const branchName = (address: string) => {
  if (!address) return '主干';
  const labels: Record<string, string> = { L: '左', M: '中', R: '右' };
  return `第 ${address.length} 层 · ${address.split('').map((part) => labels[part]).join(' · ')}`;
};

const distanceToSegment = (x: number, y: number, segment: Segment) => {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(x - segment.x1, y - segment.y1);
  const t = Math.max(0, Math.min(1, ((x - segment.x1) * dx + (y - segment.y1) * dy) / lengthSquared));
  return Math.hypot(x - (segment.x1 + t * dx), y - (segment.y1 + t * dy));
};

export default function FractalEcho() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [turn, setTurn] = useState(0);
  const [stamps, setStamps] = useState<PlayerMap<StampMap>>({ A: {}, B: {} });
  const [lastPlaced, setLastPlaced] = useState<PlayerMap<Stamp | null>>({ A: null, B: null });
  const [echoes, setEchoes] = useState<PlayerMap<number>>({ A: 2, B: 2 });
  const [selected, setSelected] = useState<PlayerMap<string>>({ A: '', B: '' });
  const [chosenPattern, setChosenPattern] = useState<PatternId>('spread');
  const [zoom, setZoom] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState('先点选一条枝，再选择它的生长形状。');

  const finished = turn >= MAX_TURNS;
  const player: Player = finished ? 'A' : activePlayer(turn);
  const opponent: Player = player === 'A' ? 'B' : 'A';
  const round = Math.min(MAX_ROUNDS, Math.floor(turn / 2) + 1);

  const segments = useMemo(() => ({
    A: makeSegments('A', stamps.A, zoom),
    B: makeSegments('B', stamps.B, zoom),
  }), [stamps, zoom]);
  const contacts = useMemo(() => contactsOf(segments.A, segments.B), [segments]);
  const metrics = useMemo(() => {
    const territoryA = territoryOf(segments.A, segments.B);
    const territoryB = territoryOf(segments.B, segments.A);
    return {
      A: { territory: territoryA, score: Math.round(territoryA * 100) },
      B: { territory: territoryB, score: Math.round(territoryB * 100) },
    };
  }, [segments]);

  const currentAddress = selected[player];
  const currentStamp = stamps[player][currentAddress];
  const inheritedPattern = effectivePattern(currentAddress, stamps[player]);
  const inheritedFrom = nearestStamp(currentAddress, stamps[player]);
  const winner = metrics.A.score === metrics.B.score ? '平局' : metrics.A.score > metrics.B.score ? '玩家 A 获胜' : '玩家 B 获胜';

  const advance = (message: string) => {
    setTurn((value) => Math.min(MAX_TURNS, value + 1));
    setNotice(message);
  };

  const grow = () => {
    if (finished || currentStamp) return;
    const stamp = { pattern: chosenPattern } satisfies Stamp;
    setStamps((all) => ({ ...all, [player]: { ...all[player], [currentAddress]: stamp } }));
    setLastPlaced((all) => ({ ...all, [player]: stamp }));
    advance(`玩家 ${player} 让「${PATTERNS[chosenPattern].name}」从${branchName(currentAddress)}向下回响。`);
  };

  const echo = () => {
    const source = lastPlaced[opponent];
    if (finished || currentStamp || !source || echoes[player] <= 0) return;
    setStamps((all) => ({ ...all, [player]: { ...all[player], [currentAddress]: source } }));
    setLastPlaced((all) => ({ ...all, [player]: source }));
    setEchoes((all) => ({ ...all, [player]: all[player] - 1 }));
    advance(`玩家 ${player} 借用了对手刚刚的「${PATTERNS[source.pattern].name}」，回响到${branchName(currentAddress)}。`);
  };

  const reset = () => {
    setTurn(0);
    setStamps({ A: {}, B: {} });
    setLastPlaced({ A: null, B: null });
    setEchoes({ A: 2, B: 2 });
    setSelected({ A: '', B: '' });
    setChosenPattern('spread');
    setZoom(1);
    setShowRules(false);
    setNotice('先点选一条枝，再选择它的生长形状。');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = W * ratio;
    canvas.height = H * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#071522');
    bg.addColorStop(1, '#030b12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(167,220,255,.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = 'rgba(255,229,139,.12)';
    ctx.beginPath();
    ctx.moveTo(W / 2, 34);
    ctx.lineTo(W / 2, H - 28);
    ctx.stroke();
    ctx.setLineDash([]);

    (['A', 'B'] as Player[]).forEach((owner) => {
      segments[owner].forEach((segment) => {
        const selectedHere = segment.address === selected[owner] && owner === player;
        const stamped = Boolean(stamps[owner][segment.address]);
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
        ctx.strokeStyle = COLORS[owner];
        ctx.globalAlpha = Math.max(.16, .9 - segment.depth * .085);
        ctx.lineWidth = selectedHere ? 5.4 : Math.max(.65, 5.5 * segment.scale);
        ctx.shadowColor = COLORS[owner];
        ctx.shadowBlur = selectedHere ? 18 : stamped ? 8 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (stamped || selectedHere) {
          ctx.beginPath();
          ctx.arc(segment.x2, segment.y2, selectedHere ? 7 : 3.4, 0, Math.PI * 2);
          ctx.fillStyle = selectedHere ? '#ffffff' : '#fff8bd';
          ctx.fill();
        }
      });
    });

    contacts.forEach((contact) => {
      ctx.beginPath();
      ctx.arc(contact.x, contact.y, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe58b';
      ctx.shadowColor = '#ffbd59';
      ctx.shadowBlur = 13;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [segments, contacts, selected, stamps, player]);

  const chooseFromCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (finished) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * W;
    const y = (event.clientY - rect.top) / rect.height * H;
    const hit = segments[player].reduce<{ segment: Segment | null; distance: number }>((best, segment) => {
      const distance = distanceToSegment(x, y, segment);
      return distance < best.distance ? { segment, distance } : best;
    }, { segment: null, distance: 26 });
    if (!hit.segment) return;
    setSelected((all) => ({ ...all, [player]: hit.segment!.address }));
    setNotice(`已选中${branchName(hit.segment.address)}。现在选择它要长成的形状。`);
  };

  const addressParts = currentAddress ? currentAddress.split('') : [];
  const currentPattern = currentStamp?.pattern ?? inheritedPattern;

  return (
    <section className="recursive-echo">
      <header className="re-hero">
        <div>
          <div className="re-kicker"><Sparkles size={13} /> GROW · TOUCH · REPEAT</div>
          <h2>分形回响 <span>Fractal Echo</span></h2>
          <p>两棵树轮流生长。你放下的形状，会沿着枝条一层层重复。</p>
        </div>
        <div className="re-header-actions">
          <button onClick={() => setShowRules((value) => !value)}><BookOpen size={16} /> 怎么玩</button>
          <button className="re-icon" onClick={reset} aria-label="重新开始"><RotateCcw size={17} /></button>
        </div>
      </header>

      <div className="re-howto" aria-label="三步玩法">
        <div className="re-howto-step"><b>1</b><div><strong>点一条枝</strong><span>从画面选你想改变的枝条</span></div></div>
        <ChevronRight className="re-howto-arrow" size={16} />
        <div className="re-howto-step"><b>2</b><div><strong>选一个形状</strong><span>展开、直达，或回旋</span></div></div>
        <ChevronRight className="re-howto-arrow" size={16} />
        <div className="re-howto-step"><b>3</b><div><strong>让它回响</strong><span>12 次生长后，覆盖更多的一方获胜</span></div></div>
      </div>

      <div className="re-score-row">
        {(['A', 'B'] as Player[]).map((side) => (
          <article key={side} className={`re-player re-${side.toLowerCase()} ${player === side && !finished ? 'active' : ''}`}>
            <div className="re-player-heading"><span className="re-player-dot" /> 玩家 {side}<b>{metrics[side].score}</b></div>
            <div className="re-progress"><i style={{ width: `${metrics[side].score}%`, background: COLORS[side] }} /></div>
            <div className="re-metrics">
              <span>覆盖区域 <strong>{metrics[side].score}%</strong></span>
              <span>生长 <strong>{Object.keys(stamps[side]).length}/6</strong></span>
              <span>回响 <strong>{echoes[side]}</strong></span>
            </div>
          </article>
        ))}
        <article className="re-round">
          <small>回合</small><strong>{String(round).padStart(2, '0')}</strong><span>/ {String(MAX_ROUNDS).padStart(2, '0')}</span>
          <em>{finished ? winner : `轮到玩家 ${player}`}</em>
        </article>
      </div>

      <nav className="re-sequence" aria-label="12次行动顺序">
        <span>行动顺序</span>
        {Array.from({ length: MAX_TURNS }, (_, index) => {
          const side = activePlayer(index);
          return <i key={index} className={`${side.toLowerCase()} ${index === turn && !finished ? 'now' : ''} ${index < turn ? 'done' : ''}`}>{side}</i>;
        })}
      </nav>

      {showRules && (
        <aside className="re-rules">
          <div><b>一回合只做一件事</b><p>点击自己的任意枝条，然后放置一个形状。放置后轮到另一位玩家。</p></div>
          <div><b>形状会向下继承</b><p>一枚形状印记会影响这条枝往下的生长；在更深处放新形状，就能从那里改变方向。</p></div>
          <div><b>金色光点是相遇</b><p>两边枝条交叉时会出现光点，它只负责提示空间关系，不需要额外计算或剪断。</p></div>
          <div><b>覆盖区域就是分数</b><p>画面会把被枝条触碰的网格算进你的区域。12 次行动结束，百分比更高的一方获胜。</p></div>
        </aside>
      )}

      <div className="re-workspace">
        <div className="re-board-wrap">
          <div className="re-board-tools">
            <div className="re-address">
              <span className="re-location-label">当前枝条</span>
              <button onClick={() => setSelected((all) => ({ ...all, [player]: '' }))}>主干</button>
              {addressParts.map((part, index) => (
                <span key={`${part}-${index}`}><ChevronRight size={12} /><button onClick={() => setSelected((all) => ({ ...all, [player]: currentAddress.slice(0, index + 1) }))}>{part === 'L' ? '左' : part === 'M' ? '中' : '右'}</button></span>
              ))}
            </div>
            <div className="re-zoom">
              <button onClick={() => setZoom((value) => Math.max(.78, value / 1.15))} aria-label="缩小"><ZoomOut size={15} /></button>
              <b>{Math.round(zoom * 100)}%</b>
              <button onClick={() => setZoom((value) => Math.min(1.8, value * 1.15))} aria-label="放大"><ZoomIn size={15} /></button>
            </div>
          </div>
          <canvas ref={canvasRef} className="re-canvas" onPointerDown={chooseFromCanvas} />
          <div className="re-legend"><span className="a">A 的树</span><span className="b">B 的树</span><span className="knot">相遇光点</span><span>白环 = 当前选择</span></div>
          {finished && <div className="re-finish"><Activity size={28} /><small>12 次生长完成</small><h3>{winner}</h3><p>A {metrics.A.score}% · {metrics.B.score}% B</p><button onClick={reset}>再来一局</button></div>}
        </div>

        <aside className="re-inspector">
          <div className="re-turn-card">
            <div><span className="re-step-caption">现在轮到</span><b style={{ color: COLORS[player] }}>玩家 {player}</b></div>
            <strong>{currentStamp ? '换一条枝继续' : '点选一条枝，然后让它生长'}</strong>
            <p>{currentStamp ? '这条枝已经有形状印记了，点击其他枝条。' : '选中的枝条会被白环标出。'}</p>
          </div>

          <div className="re-selection">
            <div className="re-panel-title"><Focus size={15} /><span>你选中的枝条</span><b>{branchName(currentAddress)}</b></div>
            <div className="re-selection-name">{branchName(currentAddress)}</div>
            <div className="re-selection-meta">当前继承：{PATTERNS[inheritedPattern].name}{inheritedFrom === null ? ' · 默认' : ` · 来自${branchName(inheritedFrom)}`}</div>
          </div>

          <div className="re-rule-picker">
            <div className="re-picker-label"><span>选择生长形状</span><small>放下后会向下回响</small></div>
            <div className="re-pattern-grid">
              {(Object.keys(PATTERNS) as PatternId[]).map((pattern) => (
                <button key={pattern} className={chosenPattern === pattern ? 'selected' : ''} onClick={() => setChosenPattern(pattern)}>
                  <span className={`re-pattern-art ${pattern}`}><i /><i /><i /></span>
                  <span className="re-pattern-copy"><b>{PATTERNS[pattern].name}</b><small>{PATTERNS[pattern].action}</small></span>
                  {chosenPattern === pattern && <Check size={14} className="re-pattern-check" />}
                </button>
              ))}
            </div>
            <p className="re-choice-note">{currentStamp ? `这条枝已经是「${PATTERNS[currentPattern].name}」，不能重复放置。` : PATTERNS[chosenPattern].description}</p>
          </div>

          <div className="re-actions">
            <button className="primary" onClick={grow} disabled={finished || Boolean(currentStamp)}>
              <Target size={15} /> {currentStamp ? '这条枝已生长' : `让「${PATTERNS[chosenPattern].name}」回响`}
            </button>
            <button onClick={echo} disabled={finished || Boolean(currentStamp) || !lastPlaced[opponent] || echoes[player] <= 0}>
              <Copy size={15} /> 借用对手刚才的形状 <b>{echoes[player]}</b>
            </button>
          </div>
        </aside>
      </div>

      <footer className="re-status">
        <span style={{ background: COLORS[player] }} />
        <p>{notice}</p>
        <b>{contacts.length} 个相遇光点</b>
      </footer>
    </section>
  );
}
