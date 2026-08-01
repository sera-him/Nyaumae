import { useMemo, useState } from 'react';
import { Check, Copy, Info, Leaf, RotateCcw, Sparkles } from 'lucide-react';
import './NeuralEcho.css';

type Player = 'A' | 'B';

interface Branch {
  id: number;
  parentId: number | null;
  owner: Player;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  length: number;
  depth: number;
  active: boolean;
}

interface Candidate {
  angle: number;
  length: number;
  x2: number;
  y2: number;
}

interface EchoState {
  A: number;
  B: number;
}

const WIDTH = 760;
const HEIGHT = 560;
const PLAYER_COLOR: Record<Player, string> = { A: '#5eead4', B: '#f0abfc' };
const PLAYER_NAME: Record<Player, string> = { A: '青枝 A', B: '紫枝 B' };

const firstPlayer = (round: number): Player => {
  let value = round - 1;
  let parity = 0;
  while (value > 0) {
    parity ^= value & 1;
    value >>>= 1;
  }
  return parity === 0 ? 'A' : 'B';
};

const phaseFor = (round: number) => {
  if (round <= 4) return { name: '萌生', maxTips: 2, note: '建立树冠 · 暂无剪枝' };
  if (round <= 16) return { name: '扩张', maxTips: 2, note: '双枝扩张 · 开放剪枝' };
  if (round <= 24) return { name: '收束', maxTips: 1, note: '每次仅保留一个生长枝' };
  return { name: '决胜', maxTips: 1, note: '无紧急再生 · 空间定胜负' };
};

const seedBranches = (): Branch[] => [
  { id: 1, parentId: null, owner: 'A', x1: 205, y1: 548, x2: 205, y2: 500, angle: -90, length: 48, depth: 0, active: true },
  { id: 2, parentId: null, owner: 'B', x1: 555, y1: 548, x2: 555, y2: 500, angle: -90, length: 48, depth: 0, active: true },
];

const scoreOf = (branches: Branch[], player: Player) =>
  Math.round(branches.filter((branch) => branch.owner === player).reduce((sum, branch) => sum + Math.max(1, branch.depth) * branch.length, 0));

const distanceToSegment = (px: number, py: number, branch: Branch) => {
  const dx = branch.x2 - branch.x1;
  const dy = branch.y2 - branch.y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - branch.x1) * dx + (py - branch.y1) * dy) / lengthSquared));
  return Math.hypot(px - (branch.x1 + t * dx), py - (branch.y1 + t * dy));
};

function descendantsOf(branches: Branch[], rootId: number) {
  const ids = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    branches.forEach((branch) => {
      if (branch.parentId !== null && ids.has(branch.parentId) && !ids.has(branch.id)) {
        ids.add(branch.id);
        changed = true;
      }
    });
  }
  return ids;
}

export default function NeuralEcho() {
  const [branches, setBranches] = useState<Branch[]>(seedBranches);
  const [turnIndex, setTurnIndex] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<number[]>([]);
  const [echoes, setEchoes] = useState<EchoState>({ A: 1, B: 1 });
  const [usingEcho, setUsingEcho] = useState(false);
  const [lastPattern, setLastPattern] = useState<Record<Player, number[]>>({ A: [0, 2], B: [0, 2] });
  const [notice, setNotice] = useState('点击发光的枝梢，安排下一次三叉生长。');
  const [showRules, setShowRules] = useState(false);

  const finished = turnIndex >= 64;
  const round = Math.min(32, Math.floor(turnIndex / 2) + 1);
  const first = firstPlayer(round);
  const player: Player = turnIndex % 2 === 0 ? first : first === 'A' ? 'B' : 'A';
  const phase = phaseFor(round);
  const tip = branches.find((branch) => branch.id === selectedTip) ?? null;
  const activeCounts = {
    A: branches.filter((branch) => branch.owner === 'A' && branch.active).length,
    B: branches.filter((branch) => branch.owner === 'B' && branch.active).length,
  };
  const scores = { A: scoreOf(branches, 'A'), B: scoreOf(branches, 'B') };

  const candidates = useMemo<Candidate[]>(() => {
    if (!tip) return [];
    const opponent = player === 'A' ? 'B' : 'A';
    const offsets = usingEcho
      ? [-34, 0, 34].map((offset, index) => offset + (lastPattern[opponent].includes(index) ? (player === 'A' ? 5 : -5) : 0))
      : [-34, 0, 34];
    const length = Math.max(15, 54 * Math.pow(0.91, tip.depth));
    return offsets.map((offset) => {
      const angle = tip.angle + offset;
      const radians = angle * Math.PI / 180;
      return {
        angle,
        length,
        x2: Math.max(12, Math.min(WIDTH - 12, tip.x2 + Math.cos(radians) * length)),
        y2: Math.max(12, Math.min(HEIGHT - 12, tip.y2 + Math.sin(radians) * length)),
      };
    });
  }, [tip, usingEcho, lastPattern, player]);

  const selectTip = (branch: Branch) => {
    if (finished || branch.owner !== player || !branch.active) return;
    const remainingCapacity = 16 - (activeCounts[player] - 1);
    const allowed = Math.max(0, Math.min(phase.maxTips, remainingCapacity));
    const opponentPattern = lastPattern[player === 'A' ? 'B' : 'A'];
    const initial = usingEcho ? opponentPattern.slice(0, allowed) : allowed === 2 ? [0, 2] : allowed === 1 ? [1] : [];
    setSelectedTip(branch.id);
    setSelectedChildren(initial);
    setNotice(allowed > 0 ? `选择最多 ${allowed} 根发光子枝作为新生长点。` : '生长点已达上限；本次三枝仍会保留并计分。');
  };

  const toggleChild = (index: number) => {
    if (!tip) return;
    const capacity = Math.max(0, Math.min(phase.maxTips, 16 - (activeCounts[player] - 1)));
    setSelectedChildren((current) => {
      if (current.includes(index)) return current.filter((item) => item !== index);
      if (current.length >= capacity) return current;
      return [...current, index].sort();
    });
  };

  const toggleEcho = () => {
    if (echoes[player] <= 0 || !lastPattern[player === 'A' ? 'B' : 'A'].length) return;
    setUsingEcho((value) => !value);
    setSelectedTip(null);
    setSelectedChildren([]);
    setNotice(!usingEcho ? '回声已就绪：下一次生长将复刻对手最近保留的分支节奏。' : '已取消克隆回声。');
  };

  const confirmGrowth = () => {
    if (!tip || candidates.length !== 3) return;
    let next = branches.map((branch) => branch.id === tip.id ? { ...branch, active: false } : branch);
    let nextId = Math.max(...branches.map((branch) => branch.id)) + 1;
    let cuts = 0;

    candidates.forEach((candidate, index) => {
      const target = round >= 5
        ? next.find((branch) => branch.owner !== player && distanceToSegment(candidate.x2, candidate.y2, branch) < 6)
        : undefined;
      if (target) {
        const removed = descendantsOf(next, target.id);
        next = next.filter((branch) => !removed.has(branch.id));
        cuts += removed.size;
      }
      next.push({
        id: nextId++,
        parentId: tip.id,
        owner: player,
        x1: tip.x2,
        y1: tip.y2,
        x2: candidate.x2,
        y2: candidate.y2,
        angle: candidate.angle,
        length: Math.hypot(candidate.x2 - tip.x2, candidate.y2 - tip.y2),
        depth: tip.depth + 1,
        active: selectedChildren.includes(index),
      });
    });

    const nextTurn = turnIndex + 1;
    setBranches(next);
    setLastPattern((patterns) => ({ ...patterns, [player]: selectedChildren }));
    if (usingEcho) setEchoes((stock) => ({ ...stock, [player]: stock[player] - 1 }));
    if ([16, 32, 48].includes(nextTurn)) setEchoes((stock) => ({ A: Math.min(2, stock.A + 1), B: Math.min(2, stock.B + 1) }));
    setTurnIndex(nextTurn);
    setSelectedTip(null);
    setSelectedChildren([]);
    setUsingEcho(false);
    setNotice(cuts > 0 ? `剪落 ${cuts} 根对方枝条。现在轮到下一位玩家。` : '生长完成。现在轮到下一位玩家。');
  };

  const reset = () => {
    setBranches(seedBranches());
    setTurnIndex(0);
    setSelectedTip(null);
    setSelectedChildren([]);
    setEchoes({ A: 1, B: 1 });
    setUsingEcho(false);
    setLastPattern({ A: [0, 2], B: [0, 2] });
    setNotice('点击发光的枝梢，安排下一次三叉生长。');
  };

  const winner = scores.A === scores.B ? '平局' : scores.A > scores.B ? '青枝 A 获胜' : '紫枝 B 获胜';

  return (
    <section className="fractal-game neural-echo-game">
      <div className="fractal-orb fractal-orb-a" />
      <div className="fractal-orb fractal-orb-b" />
      <header className="fractal-header">
        <div>
          <div className="fractal-kicker"><Sparkles size={13} /> NEURAL ECHO · GROWTH DUEL</div>
          <h2>神经回响 <span>Neural Echo</span></h2>
          <p>在共享的连续平面上生长、迁移与剪枝。32轮，双方严格公平先手。</p>
        </div>
        <div className="fractal-header-actions">
          <button type="button" className="fractal-icon-button" onClick={() => setShowRules((value) => !value)} aria-label="查看规则"><Info size={17} /></button>
          <button type="button" className="fractal-icon-button" onClick={reset} aria-label="重新开始"><RotateCcw size={17} /></button>
        </div>
      </header>

      <div className="fractal-scoreboard">
        {(['A', 'B'] as Player[]).map((side) => (
          <div key={side} className={`fractal-player-card player-${side.toLowerCase()} ${!finished && player === side ? 'is-active' : ''}`}>
            <div className="fractal-player-label"><span /> {PLAYER_NAME[side]}</div>
            <strong>{scores[side].toLocaleString()}</strong>
            <small>{activeCounts[side]} / 16 生长点 · {echoes[side]} 回声</small>
          </div>
        ))}
        <div className="fractal-round-card"><div><span>ROUND</span><strong>{String(round).padStart(2, '0')}</strong><span>/ 32</span></div><p>{finished ? winner : `${PLAYER_NAME[player]} 行动`}</p></div>
      </div>

      <div className="fractal-phase-track" aria-label="游戏阶段">
        {[['萌生', '01–04'], ['扩张', '05–16'], ['收束', '17–24'], ['决胜', '25–32']].map(([name, range]) => (
          <div key={name} className={phase.name === name ? 'is-current' : ''}><span>{name}</span><small>{range}</small></div>
        ))}
      </div>

      {showRules && <div className="fractal-rules"><p><b>当前阶段 · {phase.name}</b> {phase.note}</p><p>每次点击一个己方生长点，生成三根计分子枝；第17轮起最多保留一根新生长枝。新枝端点距对手枝条不足6px时剪去该枝及后代。</p><p>每人最多16个有效生长点。回声在第9、17、25轮补充1次，最多储存2次；它会复刻对手最近一次的保留节奏。</p></div>}

      <div className="fractal-board-shell">
        <svg className="fractal-board" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="神经回响游戏棋盘">
          <defs>
            <filter id="neural-echo-branch-glow"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <pattern id="neural-echo-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,.035)" strokeWidth="1" /></pattern>
          </defs>
          <rect width={WIDTH} height={HEIGHT} fill="url(#neural-echo-grid)" />
          <line x1={WIDTH / 2} y1="28" x2={WIDTH / 2} y2={HEIGHT - 22} className="fractal-midline" />
          {branches.map((branch) => (
            <g key={branch.id}>
              <line x1={branch.x1} y1={branch.y1} x2={branch.x2} y2={branch.y2} stroke={PLAYER_COLOR[branch.owner]} strokeOpacity={0.38 + Math.min(0.5, branch.depth * 0.035)} strokeWidth={Math.max(1.4, 5.5 - branch.depth * 0.22)} strokeLinecap="round" />
              {branch.active && <circle cx={branch.x2} cy={branch.y2} r={branch.owner === player && !finished ? 8 : 4.5} fill={PLAYER_COLOR[branch.owner]} className={branch.owner === player && !finished ? 'fractal-tip active-tip' : 'fractal-tip'} onClick={() => selectTip(branch)} role="button" aria-label={`${PLAYER_NAME[branch.owner]}生长点`} />}
            </g>
          ))}
          {tip && candidates.map((candidate, index) => (
            <g key={index} className="fractal-preview" onClick={() => toggleChild(index)}>
              <line x1={tip.x2} y1={tip.y2} x2={candidate.x2} y2={candidate.y2} stroke={PLAYER_COLOR[player]} strokeWidth={selectedChildren.includes(index) ? 4 : 2} strokeDasharray={selectedChildren.includes(index) ? undefined : '5 5'} />
              <circle cx={candidate.x2} cy={candidate.y2} r="9" fill={selectedChildren.includes(index) ? PLAYER_COLOR[player] : '#111827'} stroke={PLAYER_COLOR[player]} strokeWidth="2" />
              {selectedChildren.includes(index) && <path d={`M ${candidate.x2 - 3.5} ${candidate.y2} l 2.5 2.7 l 5 -6`} fill="none" stroke="#07110f" strokeWidth="2" />}
            </g>
          ))}
        </svg>

        {finished && <div className="fractal-result"><Leaf size={28} /><span>32轮生长结束</span><h3>{winner}</h3><p>A {scores.A.toLocaleString()} · {scores.B.toLocaleString()} B</p><button type="button" onClick={reset}><RotateCcw size={15} /> 再生一局</button></div>}
      </div>

      <footer className="fractal-controls">
        <div className="fractal-notice"><span style={{ background: PLAYER_COLOR[player] }} /> {finished ? '点击“再生一局”重新开始。' : notice}</div>
        <div className="fractal-buttons">
          <button type="button" className={`fractal-echo-button ${usingEcho ? 'is-on' : ''}`} onClick={toggleEcho} disabled={finished || echoes[player] <= 0}><Copy size={15} /> 克隆回声 <b>{echoes[player]}</b></button>
          <button type="button" className="fractal-confirm-button" onClick={confirmGrowth} disabled={!tip || finished}><Check size={16} /> 确认生长</button>
        </div>
      </footer>

      <div className="fractal-sequence"><span>神经节拍</span>{Array.from({ length: 32 }, (_, index) => { const side = firstPlayer(index + 1); return <i key={index} className={`${side === 'A' ? 'a' : 'b'} ${index + 1 === round ? 'now' : ''}`}>{side}</i>; })}</div>
    </section>
  );
}
