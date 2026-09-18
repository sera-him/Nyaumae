import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react';
import { L } from '@/lib/translations/manual';

import { Activity, ArrowRight, Atom, Bolt, CircleHelp, Crosshair, Eye, Flag, RefreshCcw, Shield, Sparkles, Swords, Waves } from 'lucide-react';
import {
  applyAction, createGame, endAction, legalTargets, nodeDegreeSummary, previewNode,
  resolveFinalPulse, resolvePulse, scoreGame,
  type ActionMode, type GameState, type Owner, type Side,
} from '@/game/neuralClash/engine';
import './NeuralClash.css';
import { confirmAction } from '@/lib/confirmAction';
import '@/styles/playground-lab.css';

const OWNER_COLOR: Record<Owner, string> = {
  neutral: '#8390a3', blue: '#4dc7ff', red: '#ff557d', dead: '#343a46',
};
const MODE_COPY: Record<ActionMode, { title: string; hint: string }> = {
  inspect: { title: '观察', hint: '选择节点，查看连接、票数与一跳战场。' },
  expand: { title: '扩张 · 1AP', hint: '先选回合开始时已有的己方节点，再选强化突触相邻的中立节点。' },
  shock: { title: '突触冲击 · 2AP', hint: '先选己方节点，再选强化突触相邻的敌方节点。每轮限一次。' },
  discharge: { title: '定向放电 · 1AP', hint: '先选己方节点，再选任意相邻节点，为本轮结算增加1票。' },
  reverse: { title: '反向脉冲 · 免费', hint: '仅能在本方采取其他行动前，选择回合开始时已有的己方节点。' },
};
const sideName = (side: Side | null) => side === 'blue' ? '蓝方' : side === 'red' ? '红方' : '等待脉冲';

function NeuralCanvas({ game, onNodeClick }: { game: GameState; onNodeClick: (id: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [keyboardNode, setKeyboardNode] = useState(game.selected ?? 0);
  const focus = hovered ?? game.selected;
  const targetSet = useMemo(() => new Set(game.selected === null ? [] : legalTargets(game, game.selected)), [game]);
  const previews = useMemo(() => game.map.nodes.map((node) => previewNode(game, node.id)), [game]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, rect.width, rect.height);
    const pad = 28, px = (x: number) => pad + x * (rect.width - pad * 2), py = (y: number) => pad + y * (rect.height - pad * 2);
    const near = focus === null ? new Set<number>() : new Set([focus, ...game.map.adjacency[focus]]);

    game.map.edges.forEach((edge) => {
      const a = game.map.nodes[edge.a], b = game.map.nodes[edge.b];
      const relevant = focus === null || (near.has(edge.a) && near.has(edge.b));
      ctx.beginPath(); ctx.moveTo(px(a.x), py(a.y)); ctx.lineTo(px(b.x), py(b.y));
      ctx.strokeStyle = edge.enhanced
        ? (relevant ? 'rgba(162,121,255,.78)' : 'rgba(127,91,211,.11)')
        : (relevant ? 'rgba(168,183,207,.2)' : 'rgba(118,132,155,.035)');
      ctx.lineWidth = edge.enhanced ? (relevant ? 1.8 : 1) : (relevant ? .8 : .45);
      ctx.stroke();
    });

    (['blue', 'red'] as Side[]).forEach((side) => {
      const center = game.reverseCenters[side];
      if (center === undefined) return;
      const node = game.map.nodes[center], color = side === 'blue' ? '77,199,255' : '255,85,125';
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.beginPath(); ctx.arc(px(node.x), py(node.y), 22 + ring * 12, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color},${.5 - ring * .12})`; ctx.lineWidth = 1.5; ctx.stroke();
      }
    });

    game.map.nodes.forEach((node) => {
      const x = px(node.x), y = py(node.y), preview = previews[node.id];
      const radius = node.core ? 8.5 : 5.2, faded = focus !== null && !near.has(node.id);
      if (preview.contested && node.owner !== 'dead') {
        ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, radius + 5, -Math.PI / 2, Math.PI / 2); ctx.strokeStyle = '#4dc7ff'; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, radius + 5, Math.PI / 2, Math.PI * 1.5); ctx.strokeStyle = '#ff557d'; ctx.stroke();
      }
      if (preview.willDie) {
        ctx.save(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y, radius + 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffcd70'; ctx.lineWidth = 1.7; ctx.stroke(); ctx.restore();
      }
      if (targetSet.has(node.id)) {
        ctx.beginPath(); ctx.arc(x, y, radius + 8, 0, Math.PI * 2); ctx.strokeStyle = '#fff1a8'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (game.selected === node.id || hovered === node.id) {
        ctx.beginPath(); ctx.arc(x, y, radius + 12, 0, Math.PI * 2);
        ctx.strokeStyle = game.selected === node.id ? '#fff' : 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.globalAlpha = faded ? .28 : 1;
      if (node.core) {
        ctx.beginPath();
        for (let p = 0; p < 6; p += 1) {
          const angle = Math.PI / 6 + p * Math.PI / 3, nx = x + Math.cos(angle) * radius, ny = y + Math.sin(angle) * radius;
          if (p === 0) ctx.moveTo(nx, ny);
          else ctx.lineTo(nx, ny);
        }
        ctx.closePath();
      } else { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); }
      ctx.fillStyle = OWNER_COLOR[node.owner]; ctx.fill();
      ctx.strokeStyle = node.core ? '#fff4c8' : 'rgba(255,255,255,.28)'; ctx.lineWidth = node.core ? 2 : .7; ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [focus, game, hovered, previews, targetSet]);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [draw]);

  const nodeAt = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect(), pad = 28;
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let found: number | null = null, best = 15;
    game.map.nodes.forEach((node) => {
      const d = Math.hypot(x - (pad + node.x * (rect.width - pad * 2)), y - (pad + node.y * (rect.height - pad * 2)));
      if (d < best) { found = node.id; best = d; }
    });
    return found;
  };

  const moveKeyboardFocus = (horizontal: number, vertical: number) => {
    const origin = game.map.nodes[keyboardNode] ?? game.map.nodes[0];
    const candidate = game.map.nodes
      .filter((node) => node.id !== origin.id)
      .map((node) => {
        const dx = node.x - origin.x;
        const dy = node.y - origin.y;
        const forward = dx * horizontal + dy * vertical;
        const sideways = Math.abs(dx * vertical - dy * horizontal);
        return { node, forward, sideways, distance: Math.hypot(dx, dy) };
      })
      .filter((item) => item.forward > 0.001)
      .sort((a, b) => (a.sideways * 1.8 + a.distance - a.forward * .35) - (b.sideways * 1.8 + b.distance - b.forward * .35))[0];
    if (!candidate) return;
    setKeyboardNode(candidate.node.id);
    setHovered(candidate.node.id);
  };

  const handleKeyboard = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveKeyboardFocus(-1, 0); return; }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveKeyboardFocus(1, 0); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveKeyboardFocus(0, -1); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveKeyboardFocus(0, 1); return; }
    if (event.key === 'Home') { event.preventDefault(); setKeyboardNode(0); setHovered(0); return; }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNodeClick(keyboardNode);
    }
  };

  const keyboardNodeLabel = game.map.nodes[keyboardNode] ? `节点 ${keyboardNode + 1}` : '节点 1';

  return (
    <div className="nc-board" ref={wrapRef}>
      <canvas
        ref={canvasRef} tabIndex={0} role="application" aria-describedby="neural-clash-board-help neural-clash-board-status" aria-label={L(`神经交锋棋盘，当前键盘焦点为${keyboardNodeLabel}`)}
        onPointerMove={(event) => setHovered(nodeAt(event))} onPointerLeave={() => setHovered(null)}
        onPointerDown={(event) => { const id = nodeAt(event); if (id !== null) { setKeyboardNode(id); onNodeClick(id); } }} onKeyDown={handleKeyboard} onFocus={() => setHovered(keyboardNode)} onBlur={() => setHovered(null)}
      />
      <p id="neural-clash-board-help" className="sr-only">{L("使用方向键在节点之间移动键盘焦点，按 Enter 或空格选择当前节点。鼠标和触控操作仍可直接选择节点。")}</p>
      <p id="neural-clash-board-status" className="sr-only" aria-live="polite">{L("当前键盘焦点：")}{keyboardNodeLabel}。</p>
      <div className="nc-board-legend" aria-hidden="true">
        <span><i />{L("普通突触")}</span><span><i className="enhanced" />{L("强化突触")}</span><span><b>⬡</b>{L("神经核")}</span>
      </div>
    </div>
  );
}

function ScoreStrip({ game }: { game: GameState }) {
  const blue = scoreGame(game, 'blue'), red = scoreGame(game, 'red');
  const center = game.phase === 'actions' ? `${sideName(game.active)} · ${game.active ? game.ap[game.active] : 0} AP`
    : game.phase === 'final-ready' ? '终局脉冲' : game.phase === 'finished' ? '对局结束' : '脉冲待发';
  return (
    <div className="nc-score-strip">
      <div className="nc-score blue"><span>{L("蓝方")}</span><strong>{blue.total}</strong><small>{blue.cores}{L("核 · ")}{blue.stable}{L("稳定")}</small></div>
      <div className="nc-round"><small>{L("行动轮")}</small><strong>{game.round}<em>/24</em></strong><span>{center}</span></div>
      <div className="nc-score red"><span>{L("红方")}</span><strong>{red.total}</strong><small>{red.cores}{L("核 · ")}{red.stable}{L("稳定")}</small></div>
    </div>
  );
}

function RuleBook({ onClose }: { onClose: () => void }) {
  const rules = [
    ['目标', '24轮后得分更高者获胜。普通节点1分，神经核10分；控制神经核及其至少7个原始邻居，额外3分。控制全部10核立即获胜。'],
    ['行动', '每方每轮3AP。扩张1AP；突触冲击2AP且每轮一次；定向放电1AP。新扩张节点本轮可投票，但不能作为其他行动起点。'],
    ['投票', '普通突触1票，强化突触2票。神经核作为票源再加1票。中立节点至少有一方达到3票才激活；达到阈值后平票则死亡。'],
    ['冲击', '冲击额外提供2票。普通节点获得1稳定票，神经核2稳定票。攻击普通节点须严格领先；攻击神经核须领先至少2票。'],
    ['反向脉冲', '每方整局一次，免费。在本方任何其他行动前，以已有节点为中心公开释放。本轮中心与其一跳范围内的结算获得2票。'],
    ['终局', '第24轮正常脉冲后，再进行一次没有行动与临时加成的终局脉冲，让刚形成的网络继续传播一层。'],
  ];
  return (
    <div className="nc-modal-backdrop" role="presentation" onPointerDown={onClose}>
      <article className="nc-rulebook" role="dialog" aria-modal="true" aria-label={L("游戏规则")} onPointerDown={(event) => event.stopPropagation()}>
        <header><div><small>FIELD MANUAL</small><h2>{L("神经交锋规则速查")}</h2></div><button onClick={onClose}>{L("关闭")}</button></header>
        <div className="nc-rules-grid">{rules.map(([title, body], index) => <section key={title}><b>0{index + 1}</b><h3>{title}</h3><p>{body}</p></section>)}</div>
      </article>
    </div>
  );
}

export default function NeuralClash() {
  const [game, setGame] = useState(() => createGame());
  const [rulesOpen, setRulesOpen] = useState(false);
  const selectedNode = game.selected === null ? null : game.map.nodes[game.selected];
  const selectedPreview = selectedNode ? previewNode(game, selectedNode.id) : null;
  const selectedDegree = selectedNode ? nodeDegreeSummary(game.map, selectedNode.id) : null;

  const onNodeClick = (id: number) => {
    setGame((current) => {
      if (current.phase !== 'actions' || !current.active || current.mode === 'inspect') return { ...current, selected: id };
      if (current.mode === 'reverse') return applyAction({ ...current, selected: id }, id);
      if (current.selected === null) return current.map.nodes[id].owner === current.active ? { ...current, selected: id } : current;
      if (current.selected === id) return { ...current, selected: null };
      if (legalTargets(current, current.selected).includes(id)) return applyAction(current, current.selected, id);
      return current.map.nodes[id].owner === current.active ? { ...current, selected: id } : current;
    });
  };

  const nextStep = () => {
    if (game.phase === 'pulse-ready') setGame(resolvePulse);
    else if (game.phase === 'final-ready') setGame(resolveFinalPulse);
    else if (game.phase === 'actions') setGame(endAction);
  };
  const reset = () => {
    if (!confirmAction({
      title: '生成新地图并重置当前对局？',
      consequence: '当前节点归属、行动点和本局结果都会清空。',
    })) return;
    setGame(createGame());
  };
  const actionButtons: { mode: ActionMode; icon: typeof Eye; disabled: boolean }[] = [
    { mode: 'inspect', icon: Eye, disabled: false },
    { mode: 'expand', icon: ArrowRight, disabled: !game.active || game.ap[game.active] < 1 },
    { mode: 'shock', icon: Bolt, disabled: !game.active || game.ap[game.active] < 2 || game.shockUsed[game.active] },
    { mode: 'discharge', icon: Crosshair, disabled: !game.active || game.ap[game.active] < 1 },
    { mode: 'reverse', icon: Waves, disabled: !game.active || !game.reverseAvailable[game.active] || game.actionTaken[game.active] },
  ];

  return (
    <div className="neural-clash">
      <header className="nc-topbar">
        <div className="nc-brand"><span className="nc-brand-mark"><Atom size={22} /></span><div><small>NEURAL CLASH</small><h2>{L("神经交锋")}</h2></div></div>
        <ScoreStrip game={game} />
        <div className="nc-top-actions"><button onClick={() => setRulesOpen(true)}><CircleHelp size={17} />{L("规则")}</button><button onClick={reset}><RefreshCcw size={16} />{L("新地图")}</button></div>
      </header>

      <div className="nc-layout">
        <aside className="nc-panel nc-command">
          <div className={`nc-turn-card ${game.active ?? 'neutral'}`}>
            <small>{L("当前阶段")}</small><strong>{game.phase === 'actions' ? `${sideName(game.active)}行动` : game.phase === 'pulse-ready' ? '神经脉冲' : game.phase === 'final-ready' ? '终局脉冲' : '对局结束'}</strong>
            {game.active && <div className="nc-ap">{[0, 1, 2].map((index) => <i key={index} className={index < game.ap[game.active!] ? 'filled' : ''} />)}<span>{game.ap[game.active]} AP</span></div>}
          </div>
          <div className="nc-section-label"><span>{L("行动协议")}</span><small>{game.phase === 'actions' ? MODE_COPY[game.mode].hint : '查看票数预测后释放脉冲。'}</small></div>
          <div className="nc-action-grid">
            {actionButtons.map(({ mode, icon: Icon, disabled }) => <button key={mode} className={game.mode === mode ? 'active' : ''} disabled={disabled || game.phase !== 'actions'} onClick={() => setGame((current) => ({ ...current, mode, selected: null }))}><Icon size={18} /><span>{MODE_COPY[mode].title}</span></button>)}
          </div>
          <button className={`nc-primary ${game.phase !== 'actions' ? 'pulse' : ''}`} onClick={nextStep} disabled={game.phase === 'finished'}>
            {game.phase === 'actions' ? <><Flag size={18} />{L("结束本方行动")}</> : game.phase === 'pulse-ready' ? <><Activity size={19} />{L("释放第")}{game.round}{L("轮脉冲")}</> : game.phase === 'final-ready' ? <><Sparkles size={19} />{L("释放终局脉冲")}</> : <><Shield size={19} />{L("对局已结束")}</>}
          </button>
          <div className="nc-log"><div className="nc-section-label"><span>{L("脉冲记录")}</span></div>{game.log.map((entry, index) => <p key={`${entry}-${index}`} className={index === 0 ? 'latest' : ''}><i />{entry}</p>)}</div>
        </aside>

        <section className="nc-battlefield">
          <div className="nc-field-head">
            <div><span>{L("突触网络 # ")}{game.map.seed}</span><small>{L("100节点 · 666突触 · 平衡差异 ")}{(game.map.balance * 100).toFixed(1)}%</small></div>
            <div className="nc-network-counts"><span><b>200</b> {L("强化")}</span><span><b>466</b> {L("普通")}</span><span><b>10</b> {L("神经核")}</span></div>
          </div>
          <NeuralCanvas game={game} onNodeClick={onNodeClick} />
          <div className="nc-tactical-hint"><Swords size={15} /><span>{game.mode === 'inspect' ? '选择节点聚焦一跳战场；双色环表示争议，断裂环表示将在本轮死亡。' : MODE_COPY[game.mode].hint}</span></div>
        </section>

        <aside className="nc-panel nc-inspector">
          {selectedNode && selectedPreview && selectedDegree ? <>
            <div className="nc-node-title">
              <div className={`nc-node-token ${selectedNode.owner} ${selectedNode.core ? 'core' : ''}`}>{selectedNode.core ? '核' : selectedNode.id + 1}</div>
              <div><small>{selectedNode.core ? 'NEURAL CORE' : 'NEURAL NODE'}</small><h2>{selectedNode.core ? `${selectedNode.id + 1}号神经核` : `${selectedNode.id + 1}号节点`}</h2><span className={selectedNode.owner}>{selectedNode.owner === 'blue' ? '蓝方控制' : selectedNode.owner === 'red' ? '红方控制' : selectedNode.owner === 'dead' ? '永久失效' : '中立'}</span></div>
            </div>
            <div className="nc-vote-card">
              <div className="nc-vote-head"><span>{L("本轮预计票数")}</span><small>{L("快照预览")}</small></div>
              <div className="nc-votes"><div className="blue"><strong>{selectedPreview.blue}</strong><span>{L("蓝方票")}</span></div><div className="versus">:</div><div className="red"><strong>{selectedPreview.red}</strong><span>{L("红方票")}</span></div></div>
              <div className={`nc-outcome ${selectedPreview.outcome}`}>{selectedPreview.outcome === selectedNode.owner ? '脉冲后保持当前状态' : selectedPreview.outcome === 'dead' ? '脉冲后节点死亡' : `脉冲后转为${selectedPreview.outcome === 'blue' ? '蓝方' : '红方'}控制`}</div>
            </div>
            <div className="nc-stats">
              <div><span>{L("总度数")}</span><b>{selectedDegree.total}</b></div><div><span>{L("强化突触")}</span><b>{selectedDegree.enhanced}</b></div>
              <div><span>{L("普通突触")}</span><b>{selectedDegree.ordinary}</b></div><div><span>{L("投票加成")}</span><b>{selectedNode.core ? '+1 / 票' : '—'}</b></div>
            </div>
            <div className="nc-neighbors">
              <div className="nc-section-label"><span>{L("一跳邻居")}</span><small>{game.map.adjacency[selectedNode.id].length}{L("个连接")}</small></div>
              <div>{game.map.adjacency[selectedNode.id].map((id) => {
                const node = game.map.nodes[id];
                const edge = game.map.edgeLookup.get(selectedNode.id < id ? `${selectedNode.id}:${id}` : `${id}:${selectedNode.id}`);
                return <button key={id} onClick={() => onNodeClick(id)} className={node.owner}><i />{node.core ? '核' : ''}{id + 1}<em>{edge?.enhanced ? '×2' : '×1'}</em></button>;
              })}</div>
            </div>
          </> : <div className="nc-empty-inspector"><Atom size={34} /><h2>{L("选择一个节点")}</h2><p>{L("查看归属、突触构成与本轮脉冲的预计票数。")}</p></div>}
        </aside>
      </div>

      {game.phase === 'finished' && <div className="nc-result"><div className={`nc-result-card ${game.winner ?? ''}`}>
        <small>FINAL SYNAPSE REPORT</small><h2>{game.winner === 'draw' ? '神经网络达成平衡' : `${game.winner === 'blue' ? '蓝方' : '红方'}赢得交锋`}</h2>
        <div className="nc-final-scores">{(['blue', 'red'] as Side[]).map((side) => {
          const score = scoreGame(game, side);
          return <div key={side} className={side}><span>{side === 'blue' ? '蓝方' : '红方'}</span><strong>{score.total}</strong><small>{score.ordinary}{L("节点 + ")}{score.cores}{L("核 + ")}{score.stable}{L("稳定")}</small></div>;
        })}</div><button onClick={reset}><RefreshCcw size={17} />{L("生成新地图再战")}</button>
      </div></div>}
      {rulesOpen && <RuleBook onClose={() => setRulesOpen(false)} />}
    </div>
  );
}
