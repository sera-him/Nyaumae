import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { useLocation, useNavigate } from 'react-router';
import { ExternalLink, ArrowLeft, CircleHelp, LoaderCircle, LogOut, Pause, Play, RotateCcw, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/playground-lab.css';
const LazyChessRules = lazy(() => import('@/sections/ChessRules'));
const LazySkillTicTacToe = lazy(() => import('@/sections/SkillTicTacToe'));
const LazyProblems = lazy(() => import('@/sections/Problems'));
const LazyBoxDuel = lazy(() => import('@/sections/BoxDuel'));
const LazySuper24 = lazy(() => import('@/sections/Super24'));
const LazyHellMaze = lazy(() => import('@/sections/HellMaze'));
const LazyThreeHoles = lazy(() => import('@/sections/ThreeHoles'));
const LazySpaceGame = lazy(() => import('@/sections/SpaceGame'));
const LazyFractalEcho = lazy(() => import('@/sections/FractalEcho'));
const LazyGiantCatch = lazy(() => import('@/sections/GiantCatch'));
const LazyNeuralEcho = lazy(() => import('@/sections/NeuralEcho'));
const LazyCatMachine = lazy(() => import('@/sections/CatMachine'));
const LazyNeuralClash = lazy(() => import('@/pages/NeuralClash'));
const LazyCatMouseGame = lazy(() => import('@/pages/CatMouseGame'));
const LazyCityBuilder = lazy(() => import('@/pages/CityBuilderGame'));

/* ─── Types ─── */

interface GameEntry {
  id: string;
  name: string;
  desc: string;
  category: 'games' | 'scratch';
  icon: string;
  color: string;
  component?: React.ComponentType;
  scratchId?: number;
  sessionNote?: string;
  sessionNoteEn?: string;
}

const CATEGORIES: { key: GameEntry['category']; label: string }[] = [
  { key: 'games', label: '可玩游戏' },
  { key: 'scratch', label: 'Scratch 小游戏' },
];

/* ─── Game data ─── */

const games: GameEntry[] = [
  {
    id: 'cat-machine', name: '猫咪机',
    desc: '九只猫、三层工位与两步决策。换位、连锁、天赋、突发事件和模块升级，一晚八班刚刚好。',
    category: 'games', icon: '🐾', color: '#f8796f',
    component: LazyCatMachine, sessionNote: '自动保存到本机', sessionNoteEn: 'Auto-saved on this device',
  },
  {
    id: 'city-builder', name: '建设城市',
    desc: '十二种属性就是十二种资源。与默认3个AI实时建设、交换、应对事件，在竞争中完成跨城项目。',
    category: 'games', icon: '🏙️', color: '#4ea8de',
    component: LazyCityBuilder, sessionNote: '当前局仅在本页保留', sessionNoteEn: 'This session stays on this page',
  },
  {
    id: 'stellar', name: '星际战线 Stellar',
    desc: '俯视角实时射击与十武器即时切换。识别弱点，连续正确切枪，点燃 Stellar Flow。',
    category: 'games', icon: '✦', color: '#00e5cc',
    component: LazySpaceGame, sessionNote: '支持本机存档', sessionNoteEn: 'Local save supported',
  },
  {
    id: 'compound-chess', name: '复合象棋',
    desc: '传统象棋与多种机制的融合变体，包含立体空间、相位变换和召唤单位等创新玩法。',
    category: 'games', icon: '♝', color: '#7c3aed',
    component: LazyChessRules,
  },
  {
    id: 'box-battle', name: '箱子对决',
    desc: '26个箱子、两种角色——参赛者与资本家的资本博弈。Deal or No Deal 式心理战。',
    category: 'games', icon: '💼', color: '#e9c46a',
    component: LazyBoxDuel,
  },
  {
    id: 'super-24', name: '超级24点',
    desc: '用给定的数字构造表达式，使结果逼近目标值。支持 √ ! ^ 等高级运算。',
    category: 'games', icon: '🔢', color: '#00d4ff',
    component: LazySuper24,
  },
  {
    id: 'skill-tic-tac-toe', name: '技能井字棋',
    desc: '"每个棋子都有独特技能"的井字棋变体。包含突进、击退、封印、替身等多种技能。',
    category: 'games', icon: '✦', color: '#06b6d4',
    component: LazySkillTicTacToe,
  },
  {
    id: 'hell-maze-vi', name: '地狱迷宫·VI',
    desc: '六边形蜂窝迷宫，全盲。只有左/前/右三键、三条布尔反馈。玩家什么也看不见。',
    category: 'games', icon: '🔥', color: '#dc2626',
    component: LazyHellMaze,
  },
  {
    id: 'cunning-rabbit', name: '狡兔三窟',
    desc: 'n×n 草原，n 个猞猁活动区。每行每列每区恰好 k 个兔子洞。逻辑推理找出全部。',
    category: 'games', icon: '🐰', color: '#ec4899',
    component: LazyThreeHoles,
  },
  {
    id: 'fractal-echo', name: '递归回响',
    desc: '用32次操作编写、攻击和重构无限递归程序。规则继承、祖先改写、克隆回声与尺度剪断。',
    category: 'games', icon: '❋', color: '#10b981',
    component: LazyFractalEcho,
  },
  {
    id: 'neural-echo', name: '神经回响',
    desc: '分支生长与剪枝的双人策略对战。安排三叉生长、克隆对手节奏，在连续平面上争夺神经网络。',
    category: 'games', icon: '✦', color: '#2dd4bf',
    component: LazyNeuralEcho,
  },

  /* ─── Rule-based ─── */

  {
    id: 'neural-clash', name: '神经交锋',
    desc: '100节点·666突触的大图博弈。神经核控场、强化突触主攻、脉冲自动结算。',
    category: 'games', icon: '🧠', color: '#06b6d4',
    component: LazyNeuralClash,
  },
  {
    id: 'cat-mouse', name: '猫鼠迷踪',
    desc: '连续平面上的非对称追逐。诱饵骗术、真实气味、疾跑与终局封锁。支持双阵营实战与完整复盘。',
    category: 'games', icon: '🐱', color: '#9d7df6',
    component: LazyCatMouseGame,
  },
  {
    id: 'giant-catch', name: '大人国抓小人',
    desc: '停车场石灰格子上的非对称追逐。喵呜用冲刺甩开小满的指尖，小满每两回合郑重地伸一次手指。双阵营可玩。',
    category: 'games', icon: '👆', color: '#f0a4c0',
    component: LazyGiantCatch, sessionNote: '当前局仅在本页保留', sessionNoteEn: 'This session stays on this page',
  },

  /* ─── Scratch games ─── */
  { id: 'dont-touch-cat-2', name: '别碰另一只猫和边缘2', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🐈', color: '#f59e0b', scratchId: 301511 },
  { id: 'knife-vs-archer', name: 'Knife V.S Archer', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🗡️', color: '#dc2626', scratchId: 563324 },
  { id: 'royal-chess', name: '皇家战棋', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '👑', color: '#7c3aed', scratchId: 626638 },
  { id: 'number-klotski', name: '数字华容道', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '#️⃣', color: '#06b6d4', scratchId: 660671 },
  { id: 'super-brain', name: '最强大脑', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🧠', color: '#8b5cf6', scratchId: 678882 },
  { id: 'red-vs-blue', name: '红蓝之战(毒圈模式)', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🔴', color: '#ef4444', scratchId: 743213 },
  { id: 'kitten-world-1', name: '小猫闯天下1', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🐱', color: '#f97316', scratchId: 1430192 },
  { id: 'welcome-to-1v1', name: 'welcome to 1v1', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '⚔️', color: '#10b981', scratchId: 1551975 },
  { id: 'cat-mouse-38', name: '猫捉老鼠38', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🐭', color: '#ec4899', scratchId: 1696466 },
  { id: 'honeycomb-maze', name: '蜂巢迷宫', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '🐝', color: '#f59e0b', scratchId: 1783262 },
  { id: 'reinforcement-simulator', name: '强化模拟器', desc: '案达成苹果创作的 Scratch 小游戏', category: 'scratch', icon: '⚡', color: '#f59e0b', scratchId: 1896461 },
];

/* ─── English overrides (only consulted when getLocale() === 'en') ─── */

const EN_CATEGORY: Record<GameEntry['category'], string> = {
  games: 'Playable games',
  scratch: 'Scratch mini-games',
};

interface GameEn { name?: string; desc?: string; sessionNote?: string; }
const SCRATCH_DESC_EN = 'A Scratch mini-game by Case Accomplishment Apple';

const EN_GAMES: Record<string, GameEn> = {
  'cat-machine': {
    name: 'Cat Machine',
    desc: 'Nine cats, three stations, two moves per shift. Swap, chain, traits, surprise events and module upgrades — eight shifts a night.',
    sessionNote: 'Auto-saved on this device',
  },
  'city-builder': {
    name: 'City Builder',
    desc: 'Twelve attributes are twelve resources. Build, trade and respond to events in real time with 3 AI cities and finish cross-city projects.',
    sessionNote: 'This session stays on this page',
  },
  stellar: {
    name: 'Stellar Frontline',
    desc: 'Top-down real-time shooter with instant 10-weapon switching. Spot weak points, keep switching correctly and ignite Stellar Flow.',
    sessionNote: 'Local save supported',
  },
  'compound-chess': {
    name: 'Compound Chess',
    desc: 'A fusion variant of classic chess with 3D space, phase shifting and summoned units.',
  },
  'box-battle': {
    name: 'Briefcase Showdown',
    desc: '26 briefcases, two roles — contestant vs. banker. Deal or No Deal style mind game.',
  },
  'super-24': {
    name: 'Super 24',
    desc: 'Build expressions from given numbers to hit a target. Supports advanced ops like √ ! ^.',
  },
  'skill-tic-tac-toe': {
    name: 'Skill Tic-Tac-Toe',
    desc: 'A tic-tac-toe variant where every piece has its own skill: dash, knockback, seal, decoy and more.',
  },
  'hell-maze-vi': {
    name: 'Hell Maze VI',
    desc: 'A fully blind hexagonal honeycomb maze. Only left/forward/right keys and three boolean feedbacks. You see nothing.',
  },
  'cunning-rabbit': {
    name: 'Sly Rabbit',
    desc: 'An n×n meadow with n lynx patrol zones. Exactly k burrows per row, column and zone. Deduce them all.',
  },
  'fractal-echo': {
    name: 'Fractal Echo',
    desc: 'Write, attack and rewrite infinite recursive programs in 32 moves. Rule inheritance, ancestor rewrite, cloned echo and scale cuts.',
  },
  'neural-echo': {
    name: 'Neural Echo',
    desc: 'Two-player branching growth and pruning. Schedule three-way growth, clone the opponent\'s rhythm and fight over a neural network.',
  },
  'neural-clash': {
    name: 'Neural Clash',
    desc: 'A big-graph game of 100 nodes and 666 synapses. Nuclear core for control, reinforced synapses to attack, pulses auto-resolve.',
  },
  'cat-mouse': {
    name: 'Cat & Mouse Chase',
    desc: 'Asymmetric chase on a continuous plane. Decoys, real scent, dashes and endgame lockdown. Playable on both sides with full replay.',
  },
  'giant-catch': {
    name: 'Giant Catch',
    desc: 'Asymmetric chase on a parking-lot grid. Meowmeow dashes away from Xiao Man\'s fingertip; she solemnly reaches once every two turns. Both sides playable.',
    sessionNote: 'This session stays on this page',
  },
  /* ─── Scratch games ─── */
  'dont-touch-cat-2': { name: "Don't Touch the Other Cat & Edge 2", desc: SCRATCH_DESC_EN },
  'knife-vs-archer': { desc: SCRATCH_DESC_EN },
  'royal-chess': { name: 'Royal Chess', desc: SCRATCH_DESC_EN },
  'number-klotski': { name: 'Number Klotski', desc: SCRATCH_DESC_EN },
  'super-brain': { name: 'Super Brain', desc: SCRATCH_DESC_EN },
  'red-vs-blue': { name: 'Red vs Blue (Toxic Zone)', desc: SCRATCH_DESC_EN },
  'kitten-world-1': { name: "Kitten's Big World 1", desc: SCRATCH_DESC_EN },
  'welcome-to-1v1': { desc: SCRATCH_DESC_EN },
  'cat-mouse-38': { name: 'Cat & Mouse 38', desc: SCRATCH_DESC_EN },
  'honeycomb-maze': { name: 'Honeycomb Maze', desc: SCRATCH_DESC_EN },
  'reinforcement-simulator': { name: 'Reinforcement Simulator', desc: SCRATCH_DESC_EN },
};

const EN_LEGACY: Record<string, GameEn> = {
  quiz: {
    name: 'Quizzes',
    desc: 'Each item has a passage followed by several choices. Read the passage and pick the best answer.',
  },
};

const EN_FRACTAL_DESC = 'A recursive board that broadcasts on a shared 3×3 coordinate: blue and orange act in turns. Speeds from blitz to intense, with opening AI terrain.';

/* ─── Legacy alias map (backward compat) ─── */

const NAV_ALIAS: Record<string, { category: GameEntry['category']; id: string }> = {
  'combo-chess': { category: 'games', id: 'compound-chess' },
  'box-duel': { category: 'games', id: 'box-battle' },
  'super24': { category: 'games', id: 'super-24' },
  'skill-ttt': { category: 'games', id: 'skill-tic-tac-toe' },
  'hell-maze': { category: 'games', id: 'hell-maze-vi' },
  'three-holes': { category: 'games', id: 'cunning-rabbit' },
  'fractal-war': { category: 'games', id: 'fractal-echo' },
  'neural': { category: 'games', id: 'neural-clash' },
  'neural-echo': { category: 'games', id: 'neural-echo' },
  'quiz': { category: 'games', id: 'quiz' },
  'problems': { category: 'games', id: 'quiz' },
  'more': { category: 'scratch', id: 'scratch' },
  'chess': { category: 'games', id: 'compound-chess' },
  'space': { category: 'games', id: 'stellar' },
};

const KEPT_LEGACY_GAMES: GameEntry[] = [
  {
    id: 'quiz', name: '题目',
    desc: '由语段和题项两部分组成。阅读语段后，从多个题项中选择一个最合适的答案。',
    category: 'games', icon: '?', color: '#ef4444',
    component: LazyProblems,
  },
];

function resolvePlaygroundPath(pathname: string) {
  const rest = pathname.replace(/^\/playground/, '');
  const parts = rest.split('/').filter(Boolean);

  if (parts.length === 0) return { category: null as GameEntry['category'] | null, item: null as string | null };

  const rawCategory = parts[0];
  const category = (rawCategory === 'games' || rawCategory === 'scratch') ? rawCategory as GameEntry['category'] : null;
  const item = parts.length > 1 ? parts.slice(1).join('/') : null;

  if (category) return { category, item };

  /* Legacy single-segment path like /playground/stellar */
  const alias = NAV_ALIAS[rawCategory];
  if (alias) return { category: alias.category, item: alias.id };

  const game = games.find(g => g.id === rawCategory);
  if (game) return { category: game.category, item: game.id };

  return { category: 'games' as GameEntry['category'], item: rawCategory };
}

/* ─── Helpers ─── */

const scratchUrl = (id: number) => `https://www.haohaodada.com/new/Scratch3/index.html?id=${id}`;
const SCRATCH_DESKTOP_WIDTH = 1200;
const SCRATCH_DESKTOP_HEIGHT = 650;

const gameOverride = (game: GameEntry): GameEn | undefined => EN_GAMES[game.id] ?? EN_LEGACY[game.id];
const displayGameName = (game: GameEntry, en: boolean) => (en ? (gameOverride(game)?.name ?? game.name) : game.name);
const displayGameDescription = (game: GameEntry, en: boolean) => {
  if (game.id === 'fractal-echo') return en ? EN_FRACTAL_DESC : '3×3 同坐标广播的递归棋盘：蓝橙对半行动，支持极速到高强度与开局 AI 地形。';
  return en ? (gameOverride(game)?.desc ?? game.desc) : game.desc;
};

/* ─── GameIcon ─── */

function GameIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <div
      className="playground-game-icon w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
      style={{ background: `linear-gradient(135deg, ${color}33, ${color}88)`, color }}
    >{icon}</div>
  );
}

/* ─── GameCard ─── */

function GameCard({ game, onClick }: { game: GameEntry; onClick: () => void }) {
  const en = getLocale() === 'en';
  return (
    <button
      onClick={onClick}
      className="playground-aurora-card playground-game-card motion-signal-card flex items-center gap-3 px-4 py-3 text-left w-full text-nc-text-secondary hover:text-nc-text"
      style={{ '--game-accent': game.color } as React.CSSProperties}
      data-game={game.id}
      data-motion-interactive="true"
    >
      <GameIcon icon={game.icon} color={game.color} />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{displayGameName(game, en)}</div>
        <div className="text-xs text-nc-text-muted/50 truncate">{displayGameDescription(game, en)}</div>
      </div>
    </button>
  );
}

/* ─── Scratch detail ─── */

function ScratchFrame({ src, title }: { src: string; title: string }) {
  const en = getLocale() === 'en';
  const hostRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>(0);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'timeout' | 'offline' | 'failed'>(() => (
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'loading'
  ));
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const updateScale = () => {
      const availableWidth = host.getBoundingClientRect().width;
      setScale(Math.min(1, Math.max(0.2, availableWidth / SCRATCH_DESKTOP_WIDTH)));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    if (!navigator.onLine) return undefined;
    timeoutRef.current = window.setTimeout(() => setStatus('timeout'), 15_000);
    return () => window.clearTimeout(timeoutRef.current);
  }, [reloadKey, src]);

  const handleLoad = () => {
    window.clearTimeout(timeoutRef.current);
    setStatus('ready');
  };

  const frameSrc = `${src}${src.includes('?') ? '&' : '?'}reload=${reloadKey}`;
  const ready = status === 'ready';
  const reload = () => {
    setStatus(navigator.onLine ? 'loading' : 'offline');
    setReloadKey((key) => key + 1);
  };

  return (
    <div
      ref={hostRef}
      className="relative w-full overflow-hidden bg-black/30"
      style={{ height: `${SCRATCH_DESKTOP_HEIGHT * scale}px` }}
      aria-busy={status === 'loading'}
    >
      {status === 'loading' && <div className="scratch-load-state" role="status" aria-live="polite">
        <LoaderCircle className="h-7 w-7 animate-spin text-nc-violet" aria-hidden="true" />
        <div><p>{L("正在加载 Scratch 游戏…")}</p><small>{L("页面收到第三方框架的实际加载信号后才会进入游戏。")}</small></div>
      </div>}
      {status !== 'loading' && status !== 'ready' && <div className="scratch-load-state is-timeout" role="alert">
        <CircleHelp aria-hidden="true" />
        <div>
          <p>{en
            ? (status === 'offline' ? "Can't open Scratch while offline" : status === 'failed' ? 'Scratch embed failed to load' : 'Scratch took too long to load')
            : (status === 'offline' ? '离线时无法打开 Scratch' : status === 'failed' ? 'Scratch 嵌入加载失败' : 'Scratch 加载时间过长')}</p>
          <small>{en
            ? (status === 'offline' ? 'Reconnect and retry here.' : 'The project may be blocked by the network, your browser or the third-party service. Other pages are unaffected.')
            : (status === 'offline' ? '恢复联网后可在这里重试。' : '项目可能被网络、浏览器拦截或第三方服务阻塞。站内其他页面不受影响。')}</small>
        </div>
        <div className="scratch-load-actions">
          <button type="button" data-action="retry" onClick={reload}><RotateCcw />{L("重新加载")}</button>
          <a href={src} target="_blank" rel="noopener noreferrer"><ExternalLink />{L("在外部打开")}</a>
        </div>
      </div>}
      <iframe
        key={reloadKey}
        src={frameSrc}
        title={title}
        width={SCRATCH_DESKTOP_WIDTH}
        height={SCRATCH_DESKTOP_HEIGHT}
        className="absolute left-0 top-0 border-0"
        style={{
          width: `${SCRATCH_DESKTOP_WIDTH}px`,
          maxWidth: 'none',
          height: `${SCRATCH_DESKTOP_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          visibility: ready ? 'visible' : 'hidden',
        }}
        allow="fullscreen"
        onLoad={handleLoad}
        onError={() => {
          window.clearTimeout(timeoutRef.current);
          setStatus('failed');
        }}
        tabIndex={ready ? 0 : -1}
      />
    </div>
  );
}

function ScratchDetail({ game, onBack }: { game: GameEntry; onBack: () => void }) {
  const en = getLocale() === 'en';
  const name = displayGameName(game, en);
  const desc = displayGameDescription(game, en);
  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/[0.06] pg-lab-frame"
      data-game={game.id}
      data-motion-loop
      style={{ '--game-accent': game.color } as React.CSSProperties}
    >
      <div className="pg-experiment-bar">
        <span className="pg-status-dot" style={{ backgroundColor: game.color }} />
        <span className="text-xs font-mono font-semibold" style={{ color: game.color }}>{name}</span>
        <span className="text-xs text-nc-text-muted/50">EXPERIMENT / {game.id.toUpperCase()}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-nc-bg-tertiary/50">
        <div className="flex items-center gap-2">
          <GameIcon icon={game.icon} color={game.color} />
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-nc-text-muted/50">{desc}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {game.scratchId && (
            <a href={scratchUrl(game.scratchId)} target="_blank" rel="noopener noreferrer"
              data-action="exit"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-nc-violet/20 text-nc-violet hover:bg-nc-violet/30 transition-colors">
              <ExternalLink className="w-3 h-3" /> {L("在好好搭搭上打开\r\n            ")}</a>
          )}
          <button type="button" data-action="back" onClick={onBack} aria-label={L("返回 Scratch 游戏列表")} className="flex items-center gap-1 text-xs text-nc-text-muted hover:text-nc-text transition-colors px-2 py-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{L("返回")}</span>
          </button>
        </div>
      </div>
      <div className="scratch-session-note"><CircleHelp /><span><strong>{L("玩法说明")}</strong>{desc}</span><small><Save />{L("第三方项目，存档由外部平台管理")}</small></div>
      {game.scratchId && <ScratchFrame key={game.id} src={scratchUrl(game.scratchId)} title={name} />}
    </div>
  );
}

/* ─── Playable game component ─── */

function PlayableGame({ game, onBack }: { game: GameEntry; onBack: () => void }) {
  const GameComponent = game.component;
  const en = getLocale() === 'en';
  const name = displayGameName(game, en);
  const desc = displayGameDescription(game, en);
  const sessionFallback = en ? 'This session stays on this page' : '当前局仅在本页保留';
  const [paused, setPaused] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    if (!paused) return undefined;
    const blockInput = (event: KeyboardEvent) => {
      if (['Escape', 'Tab', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener('keydown', blockInput, true);
    return () => window.removeEventListener('keydown', blockInput, true);
  }, [paused]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nc-game-session-state', {
      detail: { gameId: game.id, paused },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('nc-game-session-state', {
        detail: { gameId: game.id, paused: false },
      }));
    };
  }, [game.id, paused]);

  const togglePaused = () => {
    if (game.id === 'stellar') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    }
    setPaused((value) => !value);
  };

  const restart = () => {
    setConfirmRestart(false);
    setPaused(false);
    setRestartKey((key) => key + 1);
  };

  if (GameComponent) {
    return (
      <div
        className="relative pg-lab-frame"
        data-game={game.id}
        data-motion-loop
        style={{ '--game-accent': game.color } as React.CSSProperties}
      >
        <div className="pg-experiment-bar">
          <span className="pg-status-dot" style={{ backgroundColor: game.color }} />
          <span className="text-xs font-mono font-semibold" style={{ color: game.color }}>{name}</span>
          <span className="text-xs text-nc-text-muted/50">{L("PLAYABLE / 站内游戏")}</span>
        </div>
        <div className="game-session-toolbar">
          <div className="game-session-title"><GameIcon icon={game.icon} color={game.color} /><span><strong>{name}</strong><small><Save />{en ? (game.sessionNoteEn ?? sessionFallback) : (game.sessionNote ?? sessionFallback)}</small></span></div>
          <div className="game-session-actions">
            <button type="button" onClick={() => setRulesOpen((value) => !value)} aria-expanded={rulesOpen}><CircleHelp />{L("玩法说明")}</button>
            <button type="button" onClick={togglePaused}>{paused ? <Play /> : <Pause />}{paused ? (en ? 'Resume' : '继续') : (en ? 'Pause' : '暂停')}</button>
            <button type="button" data-action="reset" onClick={() => setConfirmRestart(true)}><RotateCcw />{L("重新开始")}</button>
            <button type="button" data-action="exit" onClick={onBack}><LogOut />{L("退出")}</button>
          </div>
        </div>
        {rulesOpen && <section className="game-session-rules" aria-label={L(`${game.name}玩法说明`)}><strong>{L("玩法说明")}</strong><p>{desc}</p><small>{L("游戏内如有专用按键或规则面板，以其提示为准。暂停后页面会拦截键盘、鼠标与触控操作。")}</small><button type="button" data-action="close" onClick={() => setRulesOpen(false)} aria-label={L("关闭玩法说明")}><X /></button></section>}
        <Suspense fallback={<div className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-nc-text-muted" role="status"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />{L("正在下载游戏模块…")}</div>}>
          <div className={`game-session-stage${paused ? ' is-paused' : ''}`} aria-hidden={paused || undefined} inert={paused || undefined}>
            <GameComponent key={`${game.id}-${restartKey}`} />
          </div>
        </Suspense>
        {paused && <div className="game-session-pause" role="status"><Pause /><strong>{L("游戏已暂停")}</strong><p>{L("当前输入已锁定，点击继续返回游戏。")}</p><button type="button" onClick={togglePaused}><Play />{L("继续游戏")}</button></div>}
        {confirmRestart && <div className="game-session-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmRestart(false); }}><section className="game-session-dialog" role="dialog" aria-modal="true" aria-labelledby="game-restart-title"><header><strong id="game-restart-title">{L("重新开始当前游戏？")}</strong><button type="button" data-action="close" onClick={() => setConfirmRestart(false)} aria-label={L("关闭")}><X /></button></header><p>{game.id === 'cat-machine'
              ? (en ? 'Your automatic save is handled by the game\'s own rules.' : '当前自动存档会由游戏自身规则处理。')
              : (en ? 'Your current progress on this page will be cleared.' : '当前页面中的本局进度会被清空。')}</p><footer><button type="button" data-action="cancel" onClick={() => setConfirmRestart(false)}>{L("取消")}</button><button type="button" data-action="reset" onClick={restart}>{L("确认重新开始")}</button></footer></section></div>}
      </div>
    );
  }
  return null;
}

/* ─── Landing Page (no category selected) ─── */

function LandingPage({ onCategory }: { onCategory: (cat: GameEntry['category']) => void }) {
  const en = getLocale() === 'en';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CATEGORIES.map(c => (
        <button
          key={c.key}
          onClick={() => onCategory(c.key)}
          className="playground-aurora-card motion-signal-card flex items-center justify-center px-4 py-8 text-nc-text-secondary hover:text-nc-text"
          data-motion-interactive="true"
        >
          <span className="text-lg font-medium">{en ? EN_CATEGORY[c.key] : c.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Main ─── */

export default function Playground() {
  const location = useLocation();
  const navigate = useNavigate();
  const en = getLocale() === 'en';
  const { category, item } = useMemo(() => resolvePlaygroundPath(location.pathname), [location.pathname]);

  const allGames = useMemo(() => {
    const q = KEPT_LEGACY_GAMES.find(g => g.id === 'quiz');
    return q ? [...games, q] : games;
  }, []);

  const selectedGame = item ? allGames.find(g => g.id === item) ?? null : null;
  const filtered = allGames.filter(g => g.category === category);

  /* Navigate helper */
  const goToCategory = (cat: GameEntry['category']) => navigate(`/playground/${cat}`);
  const goToGame = (g: GameEntry) => navigate(`/playground/${g.category}/${g.id}`);
  const goBack = () => { if (category) navigate(`/playground/${category}`); else navigate('/playground'); };

  return (
    <div className="aurora-ui aurora-generic-page playground-aurora-page" data-aurora-accent="playground">
      <div className={`aurora-container aurora-generic-inner ${selectedGame?.id === 'city-builder' ? 'max-w-[1400px]' : 'max-w-5xl'}`}>
      {!selectedGame && <div className="aurora-simple-hero text-center"><p className="aurora-eyebrow">06 / INTERACTIVE LAB</p><h1 className="aurora-title">Playground</h1><p className="aurora-lead mx-auto">{L("探索各种游戏、实验与互动体验")}</p></div>}

      {category && !selectedGame && (
        /* Tabs */
        <div className="aurora-tabs justify-center mb-8" role="tablist" aria-label={L("游戏分类")}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => goToCategory(c.key)}
              role="tab" aria-selected={category === c.key} className="aurora-tab"
            >{en ? EN_CATEGORY[c.key] : c.label}</button>
          ))}
        </div>
      )}

      {!category && <LandingPage onCategory={goToCategory} />}

      {category && !selectedGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(g => (
            <GameCard key={g.id} game={g} onClick={() => goToGame(g)} />
          ))}
        </div>
      )}

      {/* Selected game detail */}
      <AnimatePresence mode="wait">
        {selectedGame && category === 'games' && (
          <motion.div key={selectedGame.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <PlayableGame game={selectedGame} onBack={goBack} />
          </motion.div>
        )}
        {selectedGame && category === 'scratch' && (
          <motion.div key={selectedGame.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <ScratchDetail game={selectedGame} onBack={goBack} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
