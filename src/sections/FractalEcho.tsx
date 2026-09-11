import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, RotateCcw, Sparkles, Target, Zap } from 'lucide-react';
import {
  analyzeBoard,
  applyAiTerrain,
  broadcast,
  colorLabel,
  controllerLabel,
  coordinateLabel,
  createBoardStore,
  getCellController,
  randomSeed,
  targetStats as getTargetStats,
  type Board,
  type BoardCell,
  type BoardStats,
  type BoardStore,
  type Controller,
  type EchoColor,
} from '@/game/recursiveEcho/engine';
import './FractalEcho.css';
import { confirmAction } from '@/lib/confirmAction';
import ResponsiveImage, { READER_IMAGE_WIDTHS } from '@/components/ResponsiveImage';

type Player = 'blue' | 'orange';
type Actor = Exclude<EchoColor, 'empty'>;
type ModeId = 'rush' | 'light' | 'medium' | 'high';

interface ModeOption {
  readonly id: ModeId;
  readonly label: string;
  readonly turns: number;
  readonly note: string;
}

interface AiOption {
  readonly moves: number;
  readonly label: string;
}

interface ActionLog {
  readonly turn: number;
  readonly actor: Actor;
  readonly coordinate: number;
  readonly boardCount: bigint;
  readonly detail: string;
}

interface GameSession {
  readonly store: BoardStore;
  readonly root: Board;
  readonly turn: number;
  readonly seed: number;
  readonly aiCoordinates: readonly number[];
  readonly log: readonly ActionLog[];
}

const MODES: readonly ModeOption[] = [
  { id: 'rush', label: '极速', turns: 8, note: '8 次' },
  { id: 'light', label: '轻度', turns: 16, note: '16 次' },
  { id: 'medium', label: '中等', turns: 32, note: '32 次' },
  { id: 'high', label: '高强度', turns: 64, note: '64 次' },
];

const AI_OPTIONS: readonly AiOption[] = [
  { moves: 0, label: '关闭（默认）' },
  { moves: 1, label: '微扰 · 1 次' },
  { moves: 2, label: '轻度 · 2 次' },
  { moves: 4, label: '中度 · 4 次' },
  { moves: 8, label: '混沌 · 8 次' },
];

const PLAYER_COLORS: Record<Player, string> = { blue: '#35c6f4', orange: '#ff8753' };
const COORDINATES = Array.from({ length: 9 }, (_, index) => index);

function popcount(value: number): number {
  let remaining = value >>> 0;
  let count = 0;
  while (remaining > 0) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
}

function actionPlayer(turnIndex: number): Player {
  return popcount(turnIndex) % 2 === 0 ? 'blue' : 'orange';
}

function formatCount(value: bigint): string {
  return value.toLocaleString('zh-CN');
}

function formatSeed(seed: number): string {
  return `0x${seed.toString(16).padStart(8, '0')}`;
}

function createSession(aiMoves: number): GameSession {
  const store = createBoardStore();
  const seed = randomSeed();
  const terrain = applyAiTerrain(store.empty, aiMoves, seed, store);
  return {
    store,
    root: terrain.root,
    turn: 0,
    seed,
    aiCoordinates: terrain.coordinates,
    log: [],
  };
}

function tokenClass(color: EchoColor): string {
  return `re-token re-token-${color}`;
}

function cellLabel(cell: BoardCell): string {
  if (cell.kind === 'empty') return '·';
  if (cell.kind === 'token') return colorLabel(cell.color);
  const controller = getCellController(cell);
  return `↗ ${controller === 'neutral' ? '—' : controllerLabel(controller)}`;
}

function cellDescription(cell: BoardCell): string {
  if (cell.kind === 'empty') return '空格';
  if (cell.kind === 'token') return `${colorLabel(cell.color)}色棋子`;
  const stats = analyzeBoard(cell.board);
  return `子盘，${controllerLabel(stats.controller)}控制，含 ${formatCount(1n + stats.boardCount)} 张递归盘`;
}

function reactionDetail(targets: ReturnType<typeof getTargetStats>, actor: Player): string {
  const own = actor === 'blue' ? targets.blue : targets.orange;
  const enemy = (actor === 'blue' ? targets.orange : targets.blue) + targets.ai;
  return `空格播种 ${formatCount(targets.empty)} · 己色生长 ${formatCount(own)} · 敌色入侵 ${formatCount(enemy)} · 子盘递回 ${formatCount(targets.subboard)}`;
}

function resolveWinner(stats: BoardStats): { winner: Player | 'draw'; reason: string } {
  if (stats.controller === 'blue') return { winner: 'blue', reason: '蓝方控制根盘' };
  if (stats.controller === 'orange') return { winner: 'orange', reason: '橙方控制根盘' };

  if (stats.votes.blue !== stats.votes.orange) {
    const winner = stats.votes.blue > stats.votes.orange ? 'blue' : 'orange';
    return { winner, reason: '根盘没有蓝/橙控制者，比较根盘票数' };
  }
  if (stats.controlledBoards.blue !== stats.controlledBoards.orange) {
    const winner = stats.controlledBoards.blue > stats.controlledBoards.orange ? 'blue' : 'orange';
    return { winner, reason: '根盘票数相同，比较全场受控子盘数' };
  }
  return { winner: 'draw', reason: '根盘票数与全场受控子盘数都相同' };
}

function winnerLabel(winner: Player | 'draw'): string {
  if (winner === 'blue') return '蓝方胜出';
  if (winner === 'orange') return '橙方胜出';
  return '平局';
}

function ControllerChip({ controller }: { controller: Controller }) {
  return <span className={`re-controller-chip re-controller-${controller}`}>{controllerLabel(controller)}</span>;
}

function RootBoard({
  root,
  selected,
  onSelect,
  disabled,
}: {
  readonly root: Board;
  readonly selected: number;
  readonly onSelect: (coordinate: number) => void;
  readonly disabled: boolean;
}) {
  return (
    <div className="re-root-board" role="grid" aria-label="根盘 3×3 棋盘">
      {COORDINATES.map((coordinate) => {
        const cell = root.cells[coordinate];
        if (!cell) return null;
        const cellController = cell.kind === 'board' ? getCellController(cell) : 'neutral';
        return (
          <button
            key={coordinate}
            type="button"
            role="gridcell"
            className={`re-root-cell ${selected === coordinate ? 'is-selected' : ''} ${cell.kind === 'board' ? 'is-subboard' : ''}`}
            onClick={() => onSelect(coordinate)}
            disabled={disabled}
            aria-label={`${coordinateLabel(coordinate)}：${cellDescription(cell)}`}
          >
            <span className="re-coordinate">{coordinateLabel(coordinate)}</span>
            <span className={cell.kind === 'token' ? tokenClass(cell.color) : 're-cell-mark'}>{cellLabel(cell)}</span>
            {cell.kind === 'board' && <ControllerChip controller={cellController} />}
          </button>
        );
      })}
    </div>
  );
}

function MiniBoard({ board }: { board: Board }) {
  const stats = analyzeBoard(board);
  return (
    <div className="re-mini-board-wrap">
      <div className="re-mini-board" role="img" aria-label={`子盘示例，${controllerLabel(stats.controller)}控制`}>
        {board.cells.map((cell, index) => (
          <span key={index} className={`re-mini-cell ${cell.kind === 'token' ? `re-mini-${cell.color}` : cell.kind === 'board' ? 're-mini-child' : ''}`}>
            {cell.kind === 'empty' ? '' : cell.kind === 'board' ? '↗' : colorLabel(cell.color)}
          </span>
        ))}
      </div>
      <div className="re-mini-copy">
        <span>选中格里的内层样本</span>
        <strong><ControllerChip controller={stats.controller} /> · {formatCount(1n + stats.boardCount)} 张盘</strong>
      </div>
    </div>
  );
}

export default function FractalEcho() {
  const [mode, setMode] = useState<ModeId>('medium');
  const [aiMoves, setAiMoves] = useState(0);
  const [session, setSession] = useState<GameSession>(() => createSession(0));
  const [selected, setSelected] = useState(4);
  const [showRules, setShowRules] = useState(true);

  const modeOption = MODES.find((option) => option.id === mode) ?? MODES[2];
  const currentPlayer = actionPlayer(session.turn);
  const finished = session.turn >= modeOption.turns;
  const rootStats = useMemo(() => analyzeBoard(session.root), [session.root]);
  const targets = useMemo(() => getTargetStats(session.root, selected), [session.root, selected]);
  const selectedCell = session.root.cells[selected];
  const endResult = useMemo(() => resolveWinner(rootStats), [rootStats]);
  const aiControlledBoards = rootStats.controlledBoards.ai;

  const restart = (nextAiMoves = aiMoves) => {
    setSession(createSession(nextAiMoves));
    setSelected(4);
  };

  const confirmRestart = () => session.turn === 0 || finished || confirmAction({
    title: '重新开始递归回响？',
    consequence: '当前回合、棋盘控制和最近回响记录都会清空。',
  });

  const changeMode = (nextMode: ModeId) => {
    if (!confirmRestart()) return;
    setMode(nextMode);
    setSession(createSession(aiMoves));
    setSelected(4);
  };

  const changeAiMoves = (nextMoves: number) => {
    if (!confirmRestart()) return;
    setAiMoves(nextMoves);
    restart(nextMoves);
  };

  const applyAction = () => {
    if (finished) return;
    const actor = currentPlayer;
    const nextRoot = broadcast(session.root, selected, actor, session.store);
    const nextStats = analyzeBoard(nextRoot);
    const entry: ActionLog = {
      turn: session.turn + 1,
      actor,
      coordinate: selected,
      boardCount: nextStats.boardCount,
      detail: reactionDetail(targets, actor),
    };
    setSession((current) => ({
      ...current,
      root: nextRoot,
      turn: current.turn + 1,
      log: [entry, ...current.log].slice(0, 5),
    }));
  };

  const selectedChild = selectedCell?.kind === 'board' ? selectedCell.board : null;
  const selectionText = selectedCell ? cellDescription(selectedCell) : '空格';
  const aiTerrainText = aiMoves === 0
    ? 'AI 地形关闭'
    : `AI 预先随机广播 ${aiMoves} 次：${session.aiCoordinates.map(coordinateLabel).join('、')}`;

  return (
    <section className="recursive-echo">
      <header className="re-hero">
        <div>
          <div className="re-kicker"><Sparkles size={13} /> SYNCHRONOUS ECHO · 3×3 · BROADCAST</div>
          <h2>递归回响 <span>同步回响版</span></h2>
          <p>同一坐标，所有已存在递归层同时回响。每次行动都在整棵树上按下同一个键。</p>
        </div>
        <div className="re-header-actions">
          <button type="button" onClick={() => setShowRules((value) => !value)}>
            <BookOpen size={15} /> 规则图 {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button type="button" className="re-icon-button" onClick={() => { if (confirmRestart()) restart(); }} aria-label="重新开始">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <div className="re-setup" aria-label="对局设置">
        <div className="re-setup-block">
          <span className="re-setup-label">对局强度</span>
          <div className="re-mode-list">
            {MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={mode === option.id ? 'is-active' : ''}
                onClick={() => changeMode(option.id)}
                aria-pressed={mode === option.id}
              >
                <strong>{option.label}</strong><small>{option.note}</small>
              </button>
            ))}
          </div>
        </div>
        <label className="re-ai-select">
          <span className="re-setup-label">开局 AI 地形</span>
          <select value={aiMoves} onChange={(event) => changeAiMoves(Number(event.target.value))}>
            {AI_OPTIONS.map((option) => <option key={option.moves} value={option.moves}>{option.label}</option>)}
          </select>
        </label>
        <div className="re-seed">
          <span>本局种子</span>
          <code>{formatSeed(session.seed)}</code>
          <small>设置变化会重新开局</small>
        </div>
      </div>

      <div className="re-sync-note">
        <Zap size={15} />
        <span><strong>本局规则：</strong>共 {modeOption.turns} 次行动，蓝/橙各半；第 r 次行动方由 <code>popcount(r−1) mod 2</code> 决定（r 从 1 起：0 为蓝，1 为橙），所有模式共用同一条序列的前缀。{aiTerrainText}。</span>
      </div>

      <div className="re-score-row">
        <article className="re-player-score re-blue-score">
          <div><span className="re-player-dot" />蓝方受控子盘</div>
          <strong>{formatCount(rootStats.controlledBoards.blue)}</strong>
          <small>根盘票数 {formatCount(rootStats.votes.blue)}</small>
        </article>
        <article className="re-root-score">
          <span>根盘控制</span>
          <strong><ControllerChip controller={rootStats.controller} /></strong>
          <small>蓝 {formatCount(rootStats.votes.blue)} · 橙 {formatCount(rootStats.votes.orange)} · AI {formatCount(rootStats.votes.ai)}</small>
        </article>
        <article className="re-player-score re-orange-score">
          <div>橙方受控子盘<span className="re-player-dot" /></div>
          <strong>{formatCount(rootStats.controlledBoards.orange)}</strong>
          <small>根盘票数 {formatCount(rootStats.votes.orange)}</small>
        </article>
      </div>

      <div className="re-sequence" aria-label="行动序列">
        <span>行动序列</span>
        <div className="re-sequence-grid">
          {Array.from({ length: modeOption.turns }, (_, index) => {
            const player = actionPlayer(index);
            return <span key={index} className={`re-sequence-item re-sequence-${player} ${index < session.turn ? 'is-done' : ''} ${index === session.turn && !finished ? 'is-now' : ''}`}><b>{String(index + 1).padStart(2, '0')}</b>{player === 'blue' ? '蓝' : '橙'}</span>;
          })}
        </div>
      </div>

      <div className="re-workspace">
        <div className="re-board-panel">
          <div className="re-panel-head">
            <div><span className="re-eyebrow">ROOT BOARD · 3×3</span><h3>选择一个坐标</h3></div>
            <div className="re-turn-counter"><span>第</span><strong>{Math.min(session.turn + 1, modeOption.turns)}</strong><span>/ {modeOption.turns}</span></div>
          </div>
          <RootBoard root={session.root} selected={selected} onSelect={setSelected} disabled={finished} />
          <div className="re-board-legend">
            <span className="re-legend-blue">蓝</span><span className="re-legend-orange">橙</span><span className="re-legend-ai">AI 地形</span><span className="re-legend-child">↗ 子盘</span><span>白框 = 当前坐标</span>
          </div>
          {selectedChild && <MiniBoard board={selectedChild} />}
        </div>

        <aside className="re-inspector">
          <div className="re-turn-card" style={{ '--turn-color': PLAYER_COLORS[currentPlayer] } as React.CSSProperties}>
            <div className="re-turn-top"><span>当前行动方</span><strong>{finished ? '已结束' : currentPlayer === 'blue' ? '蓝方' : '橙方'}</strong></div>
            <h3>{finished ? '广播序列完成' : `第 ${session.turn + 1} 次：广播一个坐标`}</h3>
            <p>{finished ? '根盘与递归子盘已经完成最终结算。' : '根盘上的一次选择，会同时落到所有已存在棋盘的同一格。'}</p>
          </div>

          <div className="re-selection-card">
            <div className="re-card-label">当前坐标 <b>{coordinateLabel(selected)}</b></div>
            <strong>{selectionText}</strong>
            <p>{selectedCell?.kind === 'empty' ? '将放置行动方颜色，得到 1 票。' : selectedCell?.kind === 'token' && selectedCell.color === currentPlayer ? '己色会变成一个新的子盘，子盘中心与十字格放置己色。' : selectedCell?.kind === 'token' ? '敌色（包括 AI）会触发入侵，子盘中心为行动方、十字格保留敌色。' : '入口保留；这个子盘内部的同坐标会继续递回。'}</p>
          </div>

          <div className="re-target-card">
            <div className="re-card-label"><span>同步命中</span><b>{formatCount(targets.boards)} 张已存在棋盘</b></div>
            <div className="re-target-grid">
              <span><i className="re-target-empty" />空格 <b>{formatCount(targets.empty)}</b></span>
              <span><i className="re-target-blue" />蓝色 <b>{formatCount(targets.blue)}</b></span>
              <span><i className="re-target-orange" />橙色 <b>{formatCount(targets.orange)}</b></span>
              <span><i className="re-target-ai" />AI色 <b>{formatCount(targets.ai)}</b></span>
              <span><i className="re-target-child" />子盘 <b>{formatCount(targets.subboard)}</b></span>
            </div>
            <p className="re-target-note">{reactionDetail(targets, currentPlayer)}</p>
          </div>

          <button type="button" className="re-broadcast-button" onClick={applyAction} disabled={finished}>
            <Target size={16} /> {finished ? '本局已结束' : `广播 ${coordinateLabel(selected)}`}<span>{currentPlayer === 'blue' ? '蓝方' : '橙方'}</span>
          </button>
        </aside>
      </div>

      {finished && (
        <div className={`re-finish-banner re-finish-${endResult.winner}`}>
          <div><span className="re-eyebrow">FINAL ECHO · {modeOption.turns} ACTIONS</span><h3>{winnerLabel(endResult.winner)}</h3><p>{endResult.reason}。蓝方受控子盘 {formatCount(rootStats.controlledBoards.blue)}，橙方 {formatCount(rootStats.controlledBoards.orange)}。</p></div>
          <button type="button" onClick={() => restart()}><RotateCcw size={15} /> 再来一局</button>
        </div>
      )}

      <div className="re-bottom-grid">
        <section className="re-log-panel">
          <div className="re-section-head"><div><span className="re-eyebrow">ECHO LOG</span><h3>最近回响</h3></div><span className="re-muted">AI 控制子盘 {formatCount(aiControlledBoards)} · 不计分</span></div>
          {session.log.length === 0 ? <p className="re-empty-log">还没有玩家行动。先选一个坐标，再广播。</p> : (
            <ol className="re-log-list">
              {session.log.map((entry) => <li key={entry.turn}><span className={`re-log-dot re-log-${entry.actor}`} /><b>#{String(entry.turn).padStart(2, '0')} {entry.actor === 'blue' ? '蓝' : entry.actor === 'orange' ? '橙' : 'AI'}</b><strong>{coordinateLabel(entry.coordinate)}</strong><span>{entry.detail}</span><em>全场 {formatCount(entry.boardCount)} 盘</em></li>)}
            </ol>
          )}
        </section>
        <section className="re-ai-panel">
          <div className="re-section-head"><div><span className="re-eyebrow">TERRAIN ONLY</span><h3>AI 地形</h3></div><span className="re-ai-status">{aiMoves === 0 ? '关闭' : `${aiMoves} 次`}</span></div>
          <p>AI 只在开局前随机广播，使用第三种颜色改变地形。AI 是蓝橙双方的敌色，但不参加行动序列，也不获得胜利分数。</p>
          <div className="re-ai-seed"><span>行动坐标</span><strong>{session.aiCoordinates.length ? session.aiCoordinates.map(coordinateLabel).join(' · ') : '—'}</strong></div>
        </section>
      </div>

      {showRules && (
        <section className="re-rules-section" id="recursive-echo-rules">
          <div className="re-rules-image-wrap">
            <div className="re-section-head"><div><span className="re-eyebrow">RULE IMAGE</span><h3>同步回响版规则图</h3></div></div>
            <ResponsiveImage src="/recursive-echo-rules.png" alt="递归回响同步回响版规则图" widths={READER_IMAGE_WIDTHS} sizes="(max-width: 900px) calc(100vw - 48px), 860px" className="re-rules-image" />
          </div>
          <div className="re-rules-copy">
            <div className="re-section-head"><div><span className="re-eyebrow">TEXT SUPPLEMENT</span><h3>本局补充说明</h3></div></div>
            <div className="re-rule-block"><h4>1 · 行动序列</h4><p>极速、轻度、中等、高强度分别取 8 / 16 / 32 / 64 次行动，都是同一条序列的前缀。第 r 次行动方由 <code>popcount(r−1) mod 2</code> 决定：0 为蓝，1 为橙。</p></div>
            <div className="re-rule-block"><h4>2 · 冻结与广播</h4><p>每次行动开始时冻结所有已存在的棋盘；每张盘只处理一次同坐标。行动中新生成的子盘从下一次行动才进入目标集合，子盘入口在父盘中保留。</p></div>
            <div className="re-rule-block"><h4>3 · 四种反应</h4><p>空格播种行动方颜色；己色生长为己方十字形 5 票子盘；敌色（包括 AI 色）入侵为中心 1 格行动方、十字 4 格敌色的中立子盘；子盘递回则继续在内层结算同坐标。</p></div>
            <div className="re-rule-block"><h4>4 · 控制与 AI</h4><p>一张 3×3 盘有至少 5 票才被控制；受控子盘在父盘中只算 1 票，并由最深处向外重算。AI 只改开局地形，不计入蓝橙分数；若根盘没有蓝/橙控制者，按蓝橙根盘票数，再按蓝橙受控子盘数比较。</p></div>
            <div className="re-rule-note"><strong>忘记规则时停下：</strong>这一区域只补充模式和 AI 地形，其他判定以左侧原规则图为准。</div>
          </div>
        </section>
      )}
    </section>
  );
}
