import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChessRules from '@/sections/ChessRules';
import SkillTicTacToe from '@/sections/SkillTicTacToe';
import Problems from '@/sections/Problems';
import BoxDuel from '@/sections/BoxDuel';
import Super24 from '@/sections/Super24';
import HellMaze from '@/sections/HellMaze';
import ThreeHoles from '@/sections/ThreeHoles';
import SpaceGame from '@/sections/SpaceGame';
import FractalEcho from '@/sections/FractalEcho';
import NeuralEcho from '@/sections/NeuralEcho';
import CatMachine from '@/sections/CatMachine';
import NeuralClash from '@/pages/NeuralClash';

/* ─── Types ─── */

interface GameEntry {
  id: string;
  name: string;
  desc: string;
  category: 'games' | 'rules' | 'scratch';
  icon: string;
  color: string;
  rules?: string[];
  component?: React.ComponentType;
  scratchId?: number;
}

const CATEGORIES: { key: GameEntry['category']; label: string }[] = [
  { key: 'games', label: '可玩游戏' },
  { key: 'rules', label: '规则说明' },
  { key: 'scratch', label: 'Scratch 小游戏' },
];

/* ─── Game data ─── */

const games: GameEntry[] = [
  {
    id: 'cat-machine', name: '猫咪机',
    desc: '九只猫、三层工位与两步决策。换位、连锁、天赋、突发事件和模块升级，一晚八班刚刚好。',
    category: 'games', icon: '🐾', color: '#f8796f',
    component: CatMachine,
  },
  {
    id: 'stellar', name: '星际战线 Stellar',
    desc: '俯视角实时射击与十武器即时切换。识别弱点，连续正确切枪，点燃 Stellar Flow。',
    category: 'games', icon: '✦', color: '#00e5cc',
    component: SpaceGame,
  },
  {
    id: 'compound-chess', name: '复合象棋',
    desc: '传统象棋与多种机制的融合变体，包含立体空间、相位变换和召唤单位等创新玩法。',
    category: 'games', icon: '♝', color: '#7c3aed',
    component: ChessRules,
  },
  {
    id: 'box-battle', name: '箱子对决',
    desc: '26个箱子、两种角色——参赛者与资本家的资本博弈。Deal or No Deal 式心理战。',
    category: 'games', icon: '💼', color: '#e9c46a',
    component: BoxDuel,
  },
  {
    id: 'super-24', name: '超级24点',
    desc: '用给定的数字构造表达式，使结果逼近目标值。支持 √ ! ^ 等高级运算。',
    category: 'games', icon: '🔢', color: '#00d4ff',
    component: Super24,
  },
  {
    id: 'skill-tic-tac-toe', name: '技能井字棋',
    desc: '"每个棋子都有独特技能"的井字棋变体。包含突进、击退、封印、替身等多种技能。',
    category: 'games', icon: '✦', color: '#06b6d4',
    component: SkillTicTacToe,
  },
  {
    id: 'hell-maze-vi', name: '地狱迷宫·VI',
    desc: '六边形蜂窝迷宫，全盲。只有左/前/右三键、三条布尔反馈。玩家什么也看不见。',
    category: 'games', icon: '🔥', color: '#dc2626',
    component: HellMaze,
  },
  {
    id: 'cunning-rabbit', name: '狡兔三窟',
    desc: 'n×n 草原，n 个猞猁活动区。每行每列每区恰好 k 个兔子洞。逻辑推理找出全部。',
    category: 'games', icon: '🐰', color: '#ec4899',
    component: ThreeHoles,
  },
  {
    id: 'fractal-echo', name: '递归回响',
    desc: '用32次操作编写、攻击和重构无限递归程序。规则继承、祖先改写、克隆回声与尺度剪断。',
    category: 'games', icon: '❋', color: '#10b981',
    component: FractalEcho,
  },
  {
    id: 'neural-echo', name: '神经回响',
    desc: '分支生长与剪枝的双人策略对战。安排三叉生长、克隆对手节奏，在连续平面上争夺神经网络。',
    category: 'games', icon: '✦', color: '#2dd4bf',
    component: NeuralEcho,
  },

  /* ─── Rule-based ─── */

  {
    id: 'neural-clash', name: '神经交锋',
    desc: '100节点·666突触的大图博弈。神经核控场、强化突触主攻、脉冲自动结算。',
    category: 'games', icon: '🧠', color: '#06b6d4',
    component: NeuralClash,
    rules: [
      '图结构：100节点（含10个神经核）+ ~666条突触（200条强化突触为可操作边，466条普通突触仅被动投票）',
      '每人每回合3行动点（AP）：占据邻接空节点（强化突触，1AP），攻击邻接敌节点（强化突触，2AP，每回合限1次）',
      '双方行动后→神经脉冲自动结算：攻击每个中立节点，统计邻接投票（普通=1票，强化=2票，邻接神经核+1票）',
      '得票多者占领该节点；平票→节点变为死亡（双方永久无法占领）',
      '反向脉冲（每人1次）：指定一个节点，对其及所有邻居立即触发一次脉冲结算（己方得票+2）',
      '25轮后或一方占领全部10个神经核时结束：神经核=10分，普通节点=1分，控制神经核多数邻居另有加成',
      '先手平衡：双方出生点图距离5-7且度数中心性相近；不平则后手+3目',
    ],
  },
  {
    id: 'cat-mouse', name: '猫鼠迷踪',
    desc: '连续平面上的非对称追逐。诱饵骗术、真实气味、疾跑与终局封锁。支持双阵营实战与完整复盘。',
    category: 'games', icon: '🐱', color: '#9d7df6',
    rules: [
      '连续二维平面，每回合分三步走：①老鼠在自己的半径1圆上选新位置（猫看不见） ②老鼠在新位置的半径2圆内放一个诱饵位置（猫看得见） ③猫在自己的半径1圆上选新位置',
      '捕获判定：每回合结束后，若猫鼠距离 ≤1，猫胜',
      '特殊资源——猫：真实气味（3次）。使用时，老鼠第②步必须把诱饵放在真实位置（猫强制获取真相）',
      '特殊资源——鼠：疾跑（3次）。使用时，老鼠第①步的移动半径变为2',
      '鼠胜条件：存活35回合，且结束时猫鼠距离 >3',
      '平面边界：±50（软边界，超出则拉回）',
      '灵感来源：IMO 2017 第3题（猎人与兔子）',
    ],
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

/* ─── Legacy alias map (backward compat) ─── */

const NAV_ALIAS: Record<string, { category: GameEntry['category']; id: string }> = {
  'combo-chess': { category: 'games', id: 'compound-chess' },
  'box-duel': { category: 'games', id: 'box-battle' },
  'super24': { category: 'games', id: 'super-24' },
  'skill-ttt': { category: 'games', id: 'skill-tic-tac-toe' },
  'hell-maze': { category: 'games', id: 'hell-maze-vi' },
  'three-holes': { category: 'games', id: 'cunning-rabbit' },
  'cat-mouse-mystery': { category: 'rules', id: 'cat-mouse' },
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
    component: Problems,
  },
];

function resolvePlaygroundPath(pathname: string) {
  const rest = pathname.replace(/^\/playground/, '');
  const parts = rest.split('/').filter(Boolean);

  if (parts.length === 0) return { category: null as GameEntry['category'] | null, item: null as string | null };

  const rawCategory = parts[0];
  const category = (rawCategory === 'games' || rawCategory === 'rules' || rawCategory === 'scratch') ? rawCategory as GameEntry['category'] : null;
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

const displayGameName = (game: GameEntry) => game.name;
const displayGameDescription = (game: GameEntry) => game.id === 'fractal-echo'
  ? '3×3 同坐标广播的递归棋盘：蓝橙对半行动，支持极速到高强度与开局 AI 地形。'
  : game.desc;

/* ─── GameIcon ─── */

function GameIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
      style={{ background: `linear-gradient(135deg, ${color}33, ${color}88)`, color }}
    >{icon}</div>
  );
}

/* ─── GameCard ─── */

function GameCard({ game, onClick }: { game: GameEntry; onClick: () => void }) {
  return (
    <button onClick={onClick} className="playground-aurora-card flex items-center gap-3 px-4 py-3 text-left w-full text-nc-text-secondary hover:text-nc-text">
      <GameIcon icon={game.icon} color={game.color} />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{displayGameName(game)}</div>
        <div className="text-xs text-nc-text-muted/50 truncate">{displayGameDescription(game)}</div>
      </div>
    </button>
  );
}

/* ─── Scratch detail ─── */

function ScratchDetail({ game, onBack }: { game: GameEntry; onBack: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] pg-lab-frame">
      <div className="pg-experiment-bar">
        <span className="pg-status-dot" style={{ backgroundColor: game.color }} />
        <span className="text-xs font-mono font-semibold" style={{ color: game.color }}>{game.name}</span>
        <span className="text-xs text-nc-text-muted/50">EXPERIMENT / {game.id.toUpperCase()}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-nc-bg-tertiary/50">
        <div className="flex items-center gap-2">
          <GameIcon icon={game.icon} color={game.color} />
          <div>
            <div className="text-sm font-medium">{game.name}</div>
            <div className="text-xs text-nc-text-muted/50">{game.desc}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {game.scratchId && (
            <a href={scratchUrl(game.scratchId)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-nc-violet/20 text-nc-violet hover:bg-nc-violet/30 transition-colors">
              <ExternalLink className="w-3 h-3" /> 在好好搭搭上打开
            </a>
          )}
          <button onClick={onBack} className="text-xs text-nc-text-muted hover:text-nc-text transition-colors px-2 py-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
      {game.scratchId && <iframe src={scratchUrl(game.scratchId)} title={game.name} className="w-full border-0" style={{ height: '650px' }} allow="autoplay; fullscreen" />}
    </div>
  );
}

/* ─── Rules detail ─── */

function RulesDetail({ game, onBack }: { game: GameEntry; onBack: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] pg-lab-frame">
      <div className="pg-experiment-bar">
        <span className="pg-status-dot" style={{ backgroundColor: game.color }} />
        <span className="text-xs font-mono font-semibold" style={{ color: game.color }}>{game.name}</span>
        <span className="text-xs text-nc-text-muted/50">EXPERIMENT / {game.id.toUpperCase()}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-nc-bg-tertiary/50">
        <div className="flex items-center gap-2">
          <GameIcon icon={game.icon} color={game.color} />
          <div>
            <div className="text-sm font-medium">{game.name}</div>
            <div className="text-xs text-nc-text-muted/50">{game.desc}</div>
          </div>
        </div>
        <button onClick={onBack} className="text-xs text-nc-text-muted hover:text-nc-text transition-colors px-2 py-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-3 text-sm text-nc-text-secondary bg-nc-bg-tertiary/20">
        {game.rules!.map((r, i) => (
          <div key={i} className="pg-stepped-rule">
            <span className="pg-rule-number">{i + 1}</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Playable game component ─── */

function PlayableGame({ game, onBack }: { game: GameEntry; onBack: () => void }) {
  if (game.component) {
    return (
      <div className="relative pg-lab-frame">
        <div className="pg-experiment-bar">
          <span className="pg-status-dot" style={{ backgroundColor: game.color }} />
          <span className="text-xs font-mono font-semibold" style={{ color: game.color }}>{displayGameName(game)}</span>
          <span className="text-xs text-nc-text-muted/50">EXPERIMENT / {game.id.toUpperCase()}</span>
        </div>
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-nc-bg/80 backdrop-blur-sm border-b border-white/[0.06] rounded-t-2xl">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-nc-text-muted hover:text-nc-text transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <span className="text-xs text-nc-text-muted/50">|</span>
          <GameIcon icon={game.icon} color={game.color} />
          <span className="text-sm font-medium">{displayGameName(game)}</span>
        </div>
        <game.component />
      </div>
    );
  }
  return null;
}

/* ─── Landing Page (no category selected) ─── */

function LandingPage({ onCategory }: { onCategory: (cat: GameEntry['category']) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {CATEGORIES.map(c => (
        <button
          key={c.key}
          onClick={() => onCategory(c.key)}
          className="playground-aurora-card flex items-center justify-center px-4 py-8 text-nc-text-secondary hover:text-nc-text"
        >
          <span className="text-lg font-medium">{c.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Main ─── */

export default function Playground() {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, item } = useMemo(() => resolvePlaygroundPath(location.pathname), [location.pathname]);

  const allGames = useMemo(() => {
    const q = KEPT_LEGACY_GAMES.find(g => g.id === 'quiz');
    return q ? [...games, q] : games;
  }, []);

  const selectedGame = item ? allGames.find(g => g.id === item) ?? null : null;
  const filtered = allGames.filter(g => g.category === category);

  /* Navigate helper */
  const goToCategory = (cat: GameEntry['category']) => navigate(`/playground/${cat}`);
  const goToGame = (g: GameEntry) => {
    if (g.id === 'cat-mouse') {
      navigate('/cat-mouse');
      return;
    }
    navigate(`/playground/${g.category}/${g.id}`);
  };
  const goBack = () => { if (category) navigate(`/playground/${category}`); else navigate('/playground'); };

  return (
    <div className="aurora-ui aurora-generic-page playground-aurora-page" data-aurora-accent="playground">
      <div className="aurora-container aurora-generic-inner max-w-5xl">
      <div className="aurora-simple-hero text-center"><p className="aurora-eyebrow">06 / INTERACTIVE LAB</p><h1 className="aurora-title">Playground</h1><p className="aurora-lead mx-auto">探索各种游戏、实验与互动体验</p></div>

      {category && (
        /* Tabs */
        <div className="aurora-tabs justify-center mb-8" role="tablist" aria-label="游戏分类">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => goToCategory(c.key)}
              role="tab" aria-selected={category === c.key} className="aurora-tab"
            >{c.label}</button>
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
        {selectedGame && category === 'rules' && (
          <motion.div key={selectedGame.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <RulesDetail game={selectedGame} onBack={goBack} />
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
