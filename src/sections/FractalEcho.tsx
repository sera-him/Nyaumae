import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BookOpen, ChevronRight, Copy, FlipHorizontal2, Focus,
  RotateCcw, Scissors, Sparkles, ZoomIn, ZoomOut,
} from 'lucide-react';
import './FractalEcho.css';

type Player = 'A' | 'B';
type BaseRule = 'balanced' | 'needle' | 'crown' | 'left' | 'right';
type RuleStamp = { rule: BaseRule; inverted: boolean };
type StampMap = Record<string, RuleStamp>;
type PlayerMap<T> = Record<Player, T>;

type Segment = {
  owner: Player;
  address: string;
  parent: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scale: number;
  depth: number;
};

type Contact = { attacker: Segment; target: Segment; x: number; y: number };

const W = 960;
const H = 620;
const COLORS: PlayerMap<string> = { A: '#71f6d2', B: '#ff8fcf' };
const DEFAULT_RULE: RuleStamp = { rule: 'balanced', inverted: false };
const LETTERS = ['L', 'M', 'R'] as const;

const RULES: Record<BaseRule, { name: string; angles: number[]; scales: number[]; note: string }> = {
  balanced: { name: '均衡', angles: [-42, 0, 42], scales: [.63, .63, .63], note: '对称、稳定，适合建立骨架' },
  needle: { name: '针刺', angles: [-20, 0, 20], scales: [.52, .78, .52], note: '中央路径推进，适合穿入狭窄区域' },
  crown: { name: '展冠', angles: [-68, 0, 68], scales: [.7, .47, .7], note: '快速横向覆盖，形成包围' },
  left: { name: '左旋', angles: [-74, -28, 16], scales: [.72, .61, .56], note: '递归向左卷曲，绕开障碍' },
  right: { name: '右旋', angles: [-16, 28, 74], scales: [.56, .61, .72], note: '左旋的镜像，向右卷曲' },
};

const firstPlayer = (round: number): Player => {
  let x = round - 1;
  let parity = 0;
  while (x > 0) {
    parity ^= 1;
    x -= x & -x;
  }
  return parity ? 'B' : 'A';
};

const activePlayer = (turn: number): Player => {
  const round = Math.floor(turn / 2) + 1;
  const first = firstPlayer(round);
  return turn % 2 === 0 ? first : first === 'A' ? 'B' : 'A';
};

const isUnder = (address: string, prefixes: string[]) =>
  prefixes.some((prefix) => address === prefix || address.startsWith(prefix));

const effectiveRule = (address: string, stamps: StampMap): RuleStamp => {
  for (let i = address.length; i >= 0; i -= 1) {
    const stamp = stamps[address.slice(0, i)];
    if (stamp) return stamp;
  }
  return DEFAULT_RULE;
};

const nearestStamp = (address: string, stamps: StampMap): string | null => {
  for (let i = address.length; i >= 0; i -= 1) {
    if (stamps[address.slice(0, i)]) return address.slice(0, i);
  }
  return null;
};

const ruleGeometry = (stamp: RuleStamp) => {
  const sourceRule = stamp.inverted
    ? stamp.rule === 'left' ? 'right' : stamp.rule === 'right' ? 'left' : stamp.rule
    : stamp.rule;
  const source = RULES[sourceRule];
  if (!stamp.inverted) return source;
  return {
    ...source,
    angles: [...source.angles].reverse().map((angle) => -angle),
    scales: [...source.scales].reverse(),
  };
};

const makeSegments = (
  owner: Player,
  stamps: StampMap,
  pruned: string[],
  focus: string,
  zoom: number,
): Segment[] => {
  const out: Segment[] = [];
  const rootX = owner === 'A' ? 430 : 530;
  const rootAngle = owner === 'A' ? -100 : -80;
  const baseLength = 112 * zoom;
  const maxDepth = Math.min(11, Math.max(6, focus.length + 5));

  const walk = (address: string, x: number, y: number, angle: number, length: number, scale: number) => {
    if (address.length >= maxDepth || length < 1.1 || isUnder(address, pruned)) return;
    const stamp = effectiveRule(address, stamps);
    const geo = ruleGeometry(stamp);
    geo.angles.forEach((offset, rawIndex) => {
      const index = stamp.inverted ? 2 - rawIndex : rawIndex;
      const childAddress = `${address}${LETTERS[index]}`;
      if (isUnder(childAddress, pruned)) return;
      const childScale = geo.scales[rawIndex];
      const childAngle = angle + offset;
      const childLength = length * childScale;
      const radians = childAngle * Math.PI / 180;
      const x2 = x + Math.cos(radians) * childLength;
      const y2 = y + Math.sin(radians) * childLength;
      const segment: Segment = {
        owner, address: childAddress, parent: address, x1: x, y1: y, x2, y2,
        scale: scale * childScale, depth: childAddress.length,
      };
      out.push(segment);
      walk(childAddress, x2, y2, childAngle, childLength, scale * childScale);
    });
  };

  const rootY = 590;
  const rootTopY = 518;
  out.push({ owner, address: '', parent: '', x1: 480, y1: rootY, x2: rootX, y2: rootTopY, scale: 1, depth: 0 });
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
      if (left.scale >= right.scale * .75) contacts.push({ attacker: left, target: right, ...point });
      if (right.scale >= left.scale * .75) contacts.push({ attacker: right, target: left, ...point });
      if (contacts.length > 24) return contacts;
    }
  }
  return contacts;
};

const compactPrefixes = (prefixes: string[]) =>
  prefixes.filter((prefix, index) => !prefixes.some((other, otherIndex) =>
    otherIndex !== index && prefix.startsWith(other)));

const massOf = (pruned: string[]) =>
  Math.max(0, 1 - compactPrefixes(pruned).reduce((sum, address) => sum + 1 / 3 ** address.length, 0));

const coverageOf = (segments: Segment[], opponent: Segment[]) => {
  let result = 0;
  for (let k = 2; k <= 8; k += 1) {
    const n = 2 ** k;
    const own = new Set<string>();
    const other = new Set<string>();
    const fill = (items: Segment[], set: Set<string>) => {
      items.forEach((s) => {
        const steps = Math.max(2, Math.ceil(Math.hypot(s.x2 - s.x1, s.y2 - s.y1) / (W / n)));
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const gx = Math.max(0, Math.min(n - 1, Math.floor((s.x1 + (s.x2 - s.x1) * t) / W * n)));
          const gy = Math.max(0, Math.min(n - 1, Math.floor((s.y1 + (s.y2 - s.y1) * t) / H * n)));
          set.add(`${gx},${gy}`);
        }
      });
    };
    fill(segments, own);
    fill(opponent, other);
    const union = new Set([...own, ...other]);
    let share = 0;
    union.forEach((cell) => {
      if (own.has(cell)) share += other.has(cell) ? .5 : 1;
    });
    result += (1 / 2 ** (k - 1)) * (union.size ? share / union.size : 0);
  }
  return Math.min(1, result);
};

export default function FractalEcho() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [turn, setTurn] = useState(0);
  const [stamps, setStamps] = useState<PlayerMap<StampMap>>({ A: {}, B: {} });
  const [pruned, setPruned] = useState<PlayerMap<string[]>>({ A: [], B: [] });
  const [scars, setScars] = useState<PlayerMap<string[]>>({ A: [], B: [] });
  const [echoes, setEchoes] = useState<PlayerMap<number>>({ A: 3, B: 3 });
  const [focus, setFocus] = useState<PlayerMap<string>>({ A: '', B: '' });
  const [selected, setSelected] = useState<PlayerMap<string>>({ A: '', B: '' });
  const [chosenRule, setChosenRule] = useState<BaseRule>('balanced');
  const [inverted, setInverted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState('选择己方分形箱，然后写入第一枚规则印记。');

  const player = turn >= 64 ? 'A' : activePlayer(turn);
  const opponent: Player = player === 'A' ? 'B' : 'A';
  const round = Math.min(32, Math.floor(turn / 2) + 1);
  const phase = round <= 4 ? '展开阶段' : '回响阶段';

  const segments = useMemo(() => ({
    A: makeSegments('A', stamps.A, pruned.A, focus.A, zoom),
    B: makeSegments('B', stamps.B, pruned.B, focus.B, zoom),
  }), [stamps, pruned, focus, zoom]);
  const contacts = useMemo(() => contactsOf(segments.A, segments.B), [segments]);
  const validCuts = contacts.filter((contact) => contact.attacker.owner === player);
  const metrics = useMemo(() => {
    const MA = massOf(pruned.A);
    const MB = massOf(pruned.B);
    const RA = coverageOf(segments.A, segments.B);
    const RB = coverageOf(segments.B, segments.A);
    return {
      A: { M: MA, R: RA, score: 100 * (.5 * MA + .5 * RA) },
      B: { M: MB, R: RB, score: 100 * (.5 * MB + .5 * RB) },
    };
  }, [segments, pruned]);

  const currentAddress = selected[player];
  const currentStamp = stamps[player][currentAddress];
  const inherited = effectiveRule(currentAddress, stamps[player]);
  const ancestor = nearestStamp(currentAddress, stamps[player]);
  const internalStampCount = Object.keys(stamps[player]).filter((address) =>
    address.length > currentAddress.length && address.startsWith(currentAddress)).length;

  const advance = (message: string) => {
    setTurn((value) => Math.min(64, value + 1));
    setNotice(message);
  };

  const writeRule = () => {
    if (turn >= 64 || currentStamp || isUnder(currentAddress, pruned[player])) return;
    setStamps((all) => ({
      ...all,
      [player]: { ...all[player], [currentAddress]: { rule: chosenRule, inverted } },
    }));
    advance(`${player} 已在 ${currentAddress || 'ε'} 写入${inverted ? '反相' : ''}${RULES[chosenRule].name}。深层印记保持，但几何位置已重排。`);
  };

  const cloneEcho = () => {
    const enemyEntries = Object.entries(stamps[opponent]);
    if (!enemyEntries.length || echoes[player] <= 0 || currentStamp) {
      setNotice('克隆需要：对方至少一枚印记、己方目标箱未写入、且仍有克隆次数。');
      return;
    }
    const [sourceAddress, sourceRule] = enemyEntries[enemyEntries.length - 1];
    setStamps((all) => ({ ...all, [player]: { ...all[player], [currentAddress]: sourceRule } }));
    setEchoes((all) => ({ ...all, [player]: all[player] - 1 }));
    advance(`${player} 从对方 ${sourceAddress || 'ε'} 克隆了${sourceRule.inverted ? '反相' : ''}${RULES[sourceRule.rule].name}。`);
  };

  const cut = () => {
    if (round <= 4 || !validCuts.length) {
      setNotice(round <= 4 ? '前4轮只能形成接触结，不能剪断。' : '当前没有满足0.75尺度条件的己方接触结。');
      return;
    }
    const contact = validCuts[0];
    if (contact.target.depth <= 1) return;
    const victim = contact.target.owner;
    setPruned((all) => ({ ...all, [victim]: compactPrefixes([...all[victim], contact.target.address]) }));
    setScars((all) => ({ ...all, [player]: [...all[player], contact.attacker.address] }));
    advance(`${player} 牺牲 ${contact.attacker.address}，剪除了 ${victim} 的 ${contact.target.address} 及其全部无限后代。`);
  };

  const reset = () => {
    setTurn(0);
    setStamps({ A: {}, B: {} });
    setPruned({ A: [], B: [] });
    setScars({ A: [], B: [] });
    setEchoes({ A: 3, B: 3 });
    setFocus({ A: '', B: '' });
    setSelected({ A: '', B: '' });
    setZoom(1);
    setNotice('选择己方分形箱，然后写入第一枚规则印记。');
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
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    (['A', 'B'] as Player[]).forEach((owner) => {
      segments[owner].forEach((s) => {
        const selectedHere = s.address === selected[owner];
        const stamped = Boolean(stamps[owner][s.address]);
        const scarred = scars[owner].includes(s.address);
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.strokeStyle = scarred ? '#657382' : COLORS[owner];
        ctx.globalAlpha = Math.max(.14, .92 - s.depth * .075);
        ctx.lineWidth = selectedHere ? 4.6 : Math.max(.55, 5.4 * s.scale);
        ctx.shadowColor = COLORS[owner];
        ctx.shadowBlur = selectedHere ? 17 : stamped ? 8 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        if (stamped || selectedHere) {
          ctx.beginPath();
          ctx.arc(s.x2, s.y2, selectedHere ? 6 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = stamped ? '#fff8bd' : COLORS[owner];
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
  }, [segments, contacts, selected, stamps, scars]);

  const chooseFromCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (turn >= 64) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * W;
    const y = (event.clientY - rect.top) / rect.height * H;
    const options = segments[player].filter((s) => !isUnder(s.address, pruned[player]));
    const hit = options.reduce<{ segment: Segment | null; distance: number }>((best, segment) => {
      const distance = Math.hypot(x - segment.x2, y - segment.y2);
      return distance < best.distance ? { segment, distance } : best;
    }, { segment: null, distance: 28 });
    if (hit.segment) {
      setSelected((all) => ({ ...all, [player]: hit.segment!.address }));
      setNotice(`已选择 ${player} · ${hit.segment.address || 'ε'}。可写入规则，或继续进入这个分形箱。`);
    }
  };

  const enterSelected = () => {
    setFocus((all) => ({ ...all, [player]: currentAddress }));
    setZoom((value) => Math.min(2.2, value * 1.16));
    setNotice(`已进入 ${currentAddress || 'ε'}。画面继续展开更深层；数学结构仍然无限。`);
  };

  const addressParts = currentAddress ? currentAddress.split('') : [];
  const finished = turn >= 64;
  const winner = metrics.A.score === metrics.B.score ? '平局' : metrics.A.score > metrics.B.score ? 'A 获胜' : 'B 获胜';

  return (
    <section className="recursive-echo">
      <header className="re-hero">
        <div>
          <div className="re-kicker"><Sparkles size={13} /> INFINITE REWRITE STRATEGY</div>
          <h2>递归回响 <span>Recursive Echo</span></h2>
          <p>用有限的32次操作，编写、攻击并重构两株无限递归程序。</p>
        </div>
        <div className="re-header-actions">
          <button onClick={() => setShowRules((value) => !value)}><BookOpen size={16} /> 规则</button>
          <button className="re-icon" onClick={reset} aria-label="重新开始"><RotateCcw size={17} /></button>
        </div>
      </header>

      <div className="re-score-row">
        {(['A', 'B'] as Player[]).map((side) => (
          <article key={side} className={`re-player re-${side.toLowerCase()} ${player === side && !finished ? 'active' : ''}`}>
            <div><span className="re-player-dot" /> 玩家 {side}<b>{metrics[side].score.toFixed(1)}</b></div>
            <div className="re-metrics">
              <span>生命质量 <strong>{metrics[side].M.toFixed(3)}</strong></span>
              <span>空间回响 <strong>{metrics[side].R.toFixed(3)}</strong></span>
              <span>印记 <strong>{Object.keys(stamps[side]).length}/32</strong></span>
            </div>
          </article>
        ))}
        <article className="re-round">
          <small>ROUND</small><strong>{String(round).padStart(2, '0')}</strong><span>/ 32</span>
          <em>{finished ? winner : `${player} 行动 · ${phase}`}</em>
        </article>
      </div>

      <nav className="re-sequence" aria-label="32轮先手序列">
        <span>先手序列</span>
        {Array.from({ length: 32 }, (_, i) => {
          const side = firstPlayer(i + 1);
          return <i key={i} className={`${side.toLowerCase()} ${i + 1 === round ? 'now' : ''}`}>{side}</i>;
        })}
      </nav>

      {showRules && (
        <aside className="re-rules">
          <div><b>无限地址</b><p>每个有限的 L/M/R 字符串都指向一个无限子结构。界面只停止绘制像素级细节，不截断规则。</p></div>
          <div><b>层叠继承</b><p>箱子继承最近祖先印记。外层改写会重排内部，但不会删除更深层独立印记。</p></div>
          <div><b>剪断交换</b><p>接触后，攻击尺度至少达到目标入口的0.75才可剪断；攻击箱同时变为永久伤痕。</p></div>
          <div><b>双指标计分</b><p>生命质量按 3⁻ᵈ 精确结算；空间回响用多尺度网格的无限加权和近似显示。</p></div>
        </aside>
      )}

      <div className="re-workspace">
        <div className="re-board-wrap">
          <div className="re-board-tools">
            <div className="re-address">
              <button onClick={() => setSelected((all) => ({ ...all, [player]: '' }))}>ε</button>
              {addressParts.map((part, index) => (
                <span key={`${part}-${index}`}><ChevronRight size={12} /><button onClick={() => setSelected((all) => ({ ...all, [player]: currentAddress.slice(0, index + 1) }))}>{part}</button></span>
              ))}
            </div>
            <div>
              <button onClick={() => setZoom((value) => Math.max(.72, value / 1.15))} aria-label="缩小"><ZoomOut size={15} /></button>
              <b>{Math.round(zoom * 100)}%</b>
              <button onClick={() => setZoom((value) => Math.min(2.2, value * 1.15))} aria-label="放大"><ZoomIn size={15} /></button>
            </div>
          </div>
          <canvas ref={canvasRef} className="re-canvas" onPointerDown={chooseFromCanvas} />
          <div className="re-legend"><span className="a">A 结构</span><span className="b">B 结构</span><span className="knot">接触结</span><span>亮点 = 规则印记</span></div>
          {finished && <div className="re-finish"><Activity size={28} /><small>第32轮测量完成</small><h3>{winner}</h3><p>A {metrics.A.score.toFixed(1)} · {metrics.B.score.toFixed(1)} B</p><button onClick={reset}>再来一局</button></div>}
        </div>

        <aside className="re-inspector">
          <div className="re-panel-title"><Focus size={15} /><span>分形箱检查器</span><b>{player} · {currentAddress || 'ε'}</b></div>
          <dl>
            <div><dt>当前地址</dt><dd>{currentAddress || 'ε'}</dd></div>
            <div><dt>局部尺度</dt><dd>{(segments[player].find((s) => s.address === currentAddress)?.scale ?? 1).toFixed(4)}</dd></div>
            <div><dt>有效规则</dt><dd>{inherited.inverted ? '反相·' : ''}{RULES[inherited.rule].name}</dd></div>
            <div><dt>最近印记祖先</dt><dd>{ancestor === null ? '默认规则' : ancestor || 'ε'}</dd></div>
            <div><dt>内部独立印记</dt><dd>{internalStampCount}</dd></div>
            <div><dt>包含生命质量</dt><dd>{(1 / 3 ** currentAddress.length).toFixed(6)}</dd></div>
          </dl>

          <button className="re-enter" onClick={enterSelected}><ZoomIn size={14} /> 进入这个分形箱</button>
          <div className="re-rule-picker">
            <label>写入规则</label>
            <div className="re-rule-grid">
              {(Object.keys(RULES) as BaseRule[]).map((rule) => (
                <button key={rule} className={chosenRule === rule ? 'selected' : ''} onClick={() => setChosenRule(rule)}>
                  <span>{RULES[rule].name}</span><small>{RULES[rule].angles.join('° / ')}°</small>
                </button>
              ))}
            </div>
            <button className={`re-invert ${inverted ? 'on' : ''}`} onClick={() => setInverted((value) => !value)}>
              <FlipHorizontal2 size={15} /> 反相版本 <span>{inverted ? 'ON' : 'OFF'}</span>
            </button>
            <p>{RULES[chosenRule].note}</p>
          </div>

          <div className="re-actions">
            <button className="primary" onClick={writeRule} disabled={finished || Boolean(currentStamp)}>
              <Sparkles size={15} /> {currentStamp ? '此箱已有印记' : '确认写入'}
            </button>
            <button onClick={cloneEcho} disabled={finished || echoes[player] <= 0 || Boolean(currentStamp)}>
              <Copy size={15} /> 克隆回声 <b>{echoes[player]}</b>
            </button>
            <button className="danger" onClick={cut} disabled={finished || round <= 4 || !validCuts.length}>
              <Scissors size={15} /> 剪断接触结 <b>{validCuts.length}</b>
            </button>
          </div>
        </aside>
      </div>

      <footer className="re-status">
        <span style={{ background: COLORS[player] }} />
        <p>{notice}</p>
        <b>{contacts.length} 个接触结</b>
      </footer>
    </section>
  );
}
