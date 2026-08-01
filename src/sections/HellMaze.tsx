import { useState, useCallback, useEffect, useRef } from 'react';
import { DIFFICULTIES, createMazeState, moveForward, turnLeft, turnRight, getFeedback } from '@/game/hellMaze/mazeGen';
import type { MazeState } from '@/game/hellMaze/types';
import { hexKey, hexNeighbor } from '@/game/hellMaze/types';

const H3 = Math.sqrt(3) / 2;

function hexVertices(cx: number, cy: number, s: number): string {
  const pts = [
    [cx, cy - s],
    [cx + s * H3, cy - s / 2],
    [cx + s * H3, cy + s / 2],
    [cx, cy + s],
    [cx - s * H3, cy + s / 2],
    [cx - s * H3, cy - s / 2],
  ];
  return pts.map(p => p.join(',')).join(' ');
}

// Edge vertices for each of the 6 hex directions
const EDGE_VERTICES: [number, number][] = [
  [1, 2], // dir 0 (1,0)  → right
  [2, 3], // dir 1 (0,1)  → ↘
  [3, 4], // dir 2 (-1,1) → ↙
  [4, 5], // dir 3 (-1,0) → left
  [5, 0], // dir 4 (0,-1) → ↖
  [0, 1], // dir 5 (1,-1) → ↗
];

function hexCenter(q: number, r: number, s: number): [number, number] {
  return [s * H3 * (2 * q + r), s * 1.5 * r];
}

function MazeMap({ state }: { state: MazeState }) {
  const { radius, walls, start, end, targets, playerPos, collected, exitDir } = state;
  const R = radius;
  const s = Math.max(4, Math.min(22, Math.floor(500 / (R * 2 + 1))));
  const padding = s * 2;
  const playerKey = hexKey(playerPos.q, playerPos.r);
  const endKey = hexKey(end.q, end.r);
  const startKey = hexKey(start.q, start.r);
  const targetSet = new Set(targets.map(t => hexKey(t.q, t.r)));
  const collectedSet = collected;

  // SVG viewport size
  const maxDim = R * s * 3 + padding * 2;

  const elements: React.ReactNode[] = [];
  const wallElements: React.ReactNode[] = [];

  for (let q = -R; q <= R; q++) {
    const r1 = Math.max(-R, -q - R);
    const r2 = Math.min(R, -q + R);
    for (let r = r1; r <= r2; r++) {
      const key = hexKey(q, r);
      const [cx, cy] = hexCenter(q, r, s);
      const vx = cx + padding + radius * s * 1.5;
      const vy = cy + padding + radius * s;

      // Determine fill color
      let fill = '#1a1a2e';
      if (key === playerKey) fill = '#f59e0b';
      else if (key === endKey) fill = collectedSet.size >= targets.length ? '#06b6d4' : '#1e3a5f';
      else if (key === startKey) fill = '#065f46';
      else if (targetSet.has(key) && !collectedSet.has(key)) fill = '#b91c1c';
      else if (targetSet.has(key)) fill = '#92400e';

      let label = '';
      if (key === playerKey) label = '😵';
      else if (key === endKey) label = collectedSet.size >= targets.length ? '★' : '☆';
      else if (key === startKey) label = 'S';
      else if (targetSet.has(key) && !collectedSet.has(key)) label = '!';

      elements.push(
        <polygon
          key={key}
          points={hexVertices(vx, vy, s * 0.88)}
          fill={fill}
          stroke="#334155"
          strokeWidth={0.5}
        />
      );
      if (label) {
        elements.push(
          <text
            key={`t-${key}`}
            x={vx}
            y={vy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={Math.max(6, s * 0.55)}
            fontWeight="bold"
          >
            {label}
          </text>
        );
      }

      const pts = hexVertices(vx, vy, s * 0.88).split(' ').map(p => p.split(',').map(Number));

      // Draw walls
      for (let d = 0; d < 6; d++) {
        const n = hexNeighbor(q, r, d);
        const nk = hexKey(n.q, n.r);
        const wk = [key, nk].sort().join('|');
        if (!walls.has(wk)) continue;

        if (key > nk) continue;

        const [v1, v2] = EDGE_VERTICES[d];
        const p1 = pts[v1];
        const p2 = pts[v2];

        wallElements.push(
          <line
            key={`w-${wk}`}
            x1={p1[0]}
            y1={p1[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="#ef4444"
            strokeWidth={Math.max(1.5, s * 0.15)}
            strokeLinecap="round"
          />
        );
      }

      // Draw outer walls (outward-facing edges on perimeter)
      for (let d = 0; d < 6; d++) {
        const n = hexNeighbor(q, r, d);
        if (Math.abs(n.q) <= R && Math.abs(n.r) <= R && Math.abs(n.q + n.r) <= R) continue;

        // Skip exit door
        if (key === endKey && d === exitDir) continue;

        const [v1, v2] = EDGE_VERTICES[d];
        const p1 = pts[v1];
        const p2 = pts[v2];

        wallElements.push(
          <line
            key={`ow-${key}-${d}`}
            x1={p1[0]}
            y1={p1[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="#ef4444"
            strokeWidth={Math.max(1.5, s * 0.15)}
            strokeLinecap="round"
          />
        );
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${maxDim} ${maxDim}`}
      className="w-full max-w-[500px] h-auto bg-nc-bg rounded-xl"
    >
      {elements}
      {wallElements}
    </svg>
  );
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function HellMaze() {
  const [diffIdx, setDiffIdx] = useState(0);
  const [state, setState] = useState<MazeState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);

  const start = useCallback(() => {
    setState(createMazeState(DIFFICULTIES[diffIdx]));
    startTimeRef.current = Date.now();
    setElapsed(0);
  }, [diffIdx]);

  useEffect(() => {
    if (!state || state.won || state.surrendered) {
      if (startTimeRef.current) setElapsed(Date.now() - startTimeRef.current);
      return;
    }
    const id = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 200);
    return () => clearInterval(id);
  }, [state, state?.won, state?.surrendered]);

  const surrender = useCallback(() => {
    setState((current) => current ? { ...current, surrendered: true } : current);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-nc-bg text-nc-text flex flex-col items-center gap-6 p-6">
        <h1 className="text-3xl font-bold">地狱迷宫·VI</h1>

        <div className="max-w-md text-xs text-nc-text-secondary bg-nc-bg-secondary rounded-xl p-4 space-y-1.5 border border-white/5">
          <p><span className="text-amber-400">●</span> 六边形蜂窝迷宫，全盲。你看不到地图。</p>
          <p><span className="text-amber-400">●</span> 起点在正中央，初始方向朝右（→）。</p>
          <p><span className="text-amber-400">●</span> 终点是围墙上一道打开的边，找到它并朝外穿越即获胜。</p>
          <p><span className="text-amber-400">●</span> 仅三个操作键：↺ 左转 60° / ↑ 前进 / ↻ 右转 60°。</p>
          <p><span className="text-amber-400">●</span> 三条布尔反馈：前进成功？目标点？终点了？</p>
          <p><span className="text-amber-400">●</span> 找到出口的边，面对它按下前进即可逃脱获胜。</p>
          <p><span className="text-amber-400">●</span> 投降后公布全图 + 位置 + 方向。</p>
        </div>
        <select
          value={diffIdx}
          onChange={e => setDiffIdx(Number(e.target.value))}
          className="bg-nc-bg-secondary border border-white/10 rounded-lg px-4 py-2 text-nc-text"
        >
          {DIFFICULTIES.map((d, i) => (
            <option key={i} value={i}>{d.name}（半径{d.radius}，{d.targets}目标）</option>
          ))}
        </select>
        <button
          onClick={start}
          className="px-8 py-3 bg-gradient-to-r from-red-700 to-red-600 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-500 transition-all"
        >
          开始挑战
        </button>
      </div>
    );
  }

  const isOver = state.surrendered || state.won;

  if (isOver) {
    return (
      <div className="min-h-screen bg-nc-bg text-nc-text flex flex-col items-center gap-6 p-6">
        <h1 className="text-3xl font-bold text-red-400">迷 宫 揭 秘</h1>
        <p className="text-sm text-nc-text-muted">{DIFFICULTIES[diffIdx].name}</p>

        <div className="flex flex-wrap gap-3 justify-center text-xs bg-nc-bg-secondary rounded-lg px-4 py-2">
          <span>😵 位置：({state.playerPos.q}, {state.playerPos.r})</span>
          <span>🧭 朝向：{['→','↘','↙','←','↖','↗'][state.playerDir]}</span>
          <span>🚪 出口：({state.end.q},{state.end.r})→{['→','↘','↙','←','↖','↗'][state.exitDir]}</span>
          <span>👣 {state.steps}步</span>
          <span>⏱ {formatTime(elapsed)}</span>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-nc-text-muted">
          <span><span className="text-red-500">■</span> 墙壁</span>
          <span><span className="text-amber-500">■</span> 当前位置</span>
          <span><span className="text-green-800">■</span> 起点</span>
          <span><span className="text-red-800">■</span> 未收集!</span>
          <span><span className="text-amber-800">■</span> 已收集✓</span>
          <span><span className="text-cyan-600">■</span> 终点</span>
        </div>

        <MazeMap state={state} />

        {state.won && (
          <p className="text-xs text-amber-400">
            ✨ 通关！评级：{state.steps <= DIFFICULTIES[diffIdx].radius * 10 ? 'S' : state.steps <= DIFFICULTIES[diffIdx].radius * 20 ? 'A' : state.steps <= DIFFICULTIES[diffIdx].radius * 35 ? 'B' : 'C'}
          </p>
        )}

        <button onClick={() => setState(null)} className="px-6 py-2 rounded-lg bg-nc-bg-secondary border border-white/10 hover:border-white/30 transition-all">返回</button>
      </div>
    );
  }

  const [b1, b2, b3] = getFeedback(state);

  return (
    <div className="min-h-screen bg-nc-bg text-nc-text flex flex-col items-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">地狱迷宫·VI</h1>
        <p className="text-sm text-nc-text-muted">{DIFFICULTIES[diffIdx].name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        <div className={`maze-feedback rounded-xl p-4 text-center border ${b1 ? 'bg-emerald-900/40 border-emerald-500/40' : 'bg-red-900/40 border-red-500/40'}`} data-status={b1 ? 'success' : 'blocked'}>
          <div className="text-xs text-nc-text-muted mb-1">前进成功</div>
          <div className="text-2xl">{b1 ? '✓' : '✗'}</div>
        </div>
        <div className={`maze-feedback rounded-xl p-4 text-center border ${b2 ? 'bg-amber-900/40 border-amber-500/40' : 'bg-nc-bg-secondary border-white/10'}`} data-status={b2 ? 'target' : 'idle'}>
          <div className="text-xs text-nc-text-muted mb-1">目标点</div>
          <div className="text-2xl">{b2 ? '●' : '○'}</div>
        </div>
        <div className={`maze-feedback rounded-xl p-4 text-center border ${b3 ? 'bg-cyan-900/40 border-cyan-500/40' : 'bg-nc-bg-secondary border-white/10'}`} data-status={b3 ? 'finish' : 'idle'}>
          <div className="text-xs text-nc-text-muted mb-1">终点</div>
          <div className="text-2xl">{b3 ? '★' : '☆'}</div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <button
          onClick={() => { turnLeft(state); setState({ ...state }); }}
          className="maze-control w-16 h-16 rounded-full bg-nc-bg-secondary border border-white/10 text-2xl hover:bg-white/5 active:scale-95 transition-all"
        >↺</button>
        <button
          onClick={() => { moveForward(state); setState({ ...state }); }}
          className="maze-control is-primary w-20 h-20 rounded-full bg-gradient-to-b from-amber-600/80 to-amber-800/80 text-3xl border border-amber-500/30 hover:from-amber-500/80 active:scale-95 transition-all"
        >↑</button>
        <button
          onClick={() => { turnRight(state); setState({ ...state }); }}
          className="maze-control w-16 h-16 rounded-full bg-nc-bg-secondary border border-white/10 text-2xl hover:bg-white/5 active:scale-95 transition-all"
        >↻</button>
      </div>

      <div className="flex gap-2 text-xs text-nc-text-muted">
        <span className="px-2 py-1 rounded bg-nc-bg-secondary">⏱ {formatTime(elapsed)}</span>
        <span className="px-2 py-1 rounded bg-nc-bg-secondary">步数 {state.steps}</span>
        <span className="px-2 py-1 rounded bg-nc-bg-secondary">已收集 {state.collected.size}/{state.targets.length}</span>
      </div>

      <button
        onClick={surrender}
        className="px-4 py-1.5 text-xs rounded border border-red-800/50 text-red-400 hover:bg-red-900/30 transition-all"
      >投降</button>
    </div>
  );
}
