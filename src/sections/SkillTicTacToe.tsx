import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMusic } from '@/contexts/MusicContext';
import { useTTT3Store } from '@/stores/ttt3Store';
import type { TTT3GameState, TTT3Player } from '@/game/ttt3/types';
import {
  Profession as ProfessionEnum, Skill as SkillEnum,
  SKILL_NAME_CN, PROF_NAME_CN, probColorClass,
} from '@/game/ttt3/types';
import { roundTo5 } from '@/game/ttt3/probGen';
import type { Skill as GameSkill } from '@/game/ttt3/types';
import {
  canUseSkill, getSkillCost, getProfCost, hasProf, getRodCost, isSkillOncePerTurn,
} from '@/game/ttt3/engine';
import {
  professions as profData,
  activeSkills,
  skillTicTacToeOverview,
} from '@/data/skillTicTacToe';
import ParticleField from '@/components/ParticleField';
import {
  Zap, Crosshair, Sparkles, TrendingUp, Eye, Coins,
  Play, RotateCcw, Settings, Shield, Brain,
  ArrowUpCircle, CircleDot, Flame, Ghost, Grid3X3,
  AlertTriangle, Swords, BookOpen, ChevronRight,
  Briefcase, PlusCircle, Scale,
} from 'lucide-react';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { aiDecideAction } from '@/game/ttt3/ai';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

// 3500常用字子集（约800字）用于信息过载随机化
const COMMON_HANZI =
  '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取完举色或兴许剑位情运器入难观调包温境步算层百连确传视须件革色容需象空母节马调参商深志风斗万究近低矿响精武离县万居委局具类革批承科杀委运维么府敌除传低断拉派阳织推营镜省写居容府调烟右雨顺州否刚辉航送音游却包济浪份馆召承咱翻剩厂藏景瑞缺针窗洋康减露继兴祖饮显材缺担景遇游松救渐居委航宜拥灯承阴逐浪辉承承承场村户专星转置达走供乐容确究科广饭七形引团集劳科丈热七容积八石七油持清院久越织乐吗七世确怕校征六素七承父统亲六复七承容承确承容承承承';

function seededRandom(seed: number, index: number): number {
  let s = ((seed + index * 0x9e3779b9) & 0xffffffff) >>> 0;
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return s;
}

function scrambleText(text: string, seed: number): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    if (code >= 32 && code <= 126) {
      const r = seededRandom(seed, i);
      result += String.fromCharCode(32 + (r % 95));
    } else if (code >= 0x4e00 && code <= 0x9fff) {
      const r = seededRandom(seed, i);
      result += COMMON_HANZI[r % COMMON_HANZI.length];
    } else {
      result += char;
    }
  }
  return result;
}

type TabKey = 'game' | 'rules' | 'professions' | 'skills';
const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'game', label: '对弈', icon: Swords },
  { key: 'rules', label: '规则', icon: BookOpen },
  { key: 'professions', label: '职业', icon: Briefcase },
  { key: 'skills', label: '技能', icon: Sparkles },
];

const skillIcons: Record<number, React.ElementType> = {
  [SkillEnum.ROLLING_THUNDER]: Zap,
  [SkillEnum.BUY_ROD]: PlusCircle,
  [SkillEnum.DEPLOY_ROD]: ArrowUpCircle,
  [SkillEnum.PROB_SURGE]: ArrowUpCircle,
  [SkillEnum.VENTURE]: TrendingUp,
  [SkillEnum.RENEW]: RotateCcw,
  [SkillEnum.COLLAPSE]: Flame,
  [SkillEnum.MIND_MAZE]: Brain,
  [SkillEnum.SPATIAL_SEAL]: Shield,
  [SkillEnum.DECOY]: Ghost,
  [SkillEnum.WHEEL]: CircleDot,
  [SkillEnum.OVERDRAFT]: Zap,
  [SkillEnum.DEBT]: Coins,
  [SkillEnum.INFO_OVERLOAD]: AlertTriangle,
  [SkillEnum.GRID_REWRITE]: Grid3X3,
  [SkillEnum.SP_SIPHON]: Zap,
  [SkillEnum.SKIP_PROTOCOL]: ChevronRight,
  [SkillEnum.CAPACITOR]: Crosshair,
  [SkillEnum.MATTHEW_SHIFT]: Scale,
  [SkillEnum.TYRANT_GRIP]: Swords,
};

const quickSkills: GameSkill[] = [
  SkillEnum.ROLLING_THUNDER, SkillEnum.BUY_ROD, SkillEnum.DEPLOY_ROD,
  SkillEnum.SWAP_FATES, SkillEnum.PROB_SURGE, SkillEnum.VENTURE,
  SkillEnum.RENEW, SkillEnum.COLLAPSE, SkillEnum.MIND_MAZE,
  SkillEnum.SPATIAL_SEAL, SkillEnum.DECOY, SkillEnum.WHEEL,
  SkillEnum.OVERDRAFT, SkillEnum.DEBT, SkillEnum.INFO_OVERLOAD,
  SkillEnum.GRID_REWRITE, SkillEnum.SP_SIPHON, SkillEnum.SKIP_PROTOCOL,
  SkillEnum.CAPACITOR, SkillEnum.MATTHEW_SHIFT, SkillEnum.TYRANT_GRIP,
];

export default function SkillTicTacToe() {
  const { ref, isVisible } = useScrollReveal();
  const { playTrack, currentTrack } = useMusic();
  const [activeTab, setActiveTab] = useState<TabKey>('game');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (isVisible && currentTrack !== '/audio/math-ambient.mp3') {
      playTrack('/audio/math-ambient.mp3');
    }
  }, [isVisible, playTrack, currentTrack]);

  return (
    <section id="skill-ttt" className="py-24 px-4 sm:px-6 bg-[#0D0614] relative overflow-hidden">
      <ParticleField type="math" density={22} />
      <div ref={ref} className="max-w-[1100px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-7 h-7 text-nc-gold" />
            <h2 className="text-3xl sm:text-4xl font-bold text-nc-text tracking-wide">
              {semanticHighlight("概率三子棋")}
            </h2>
          </div>
          <p className="text-nc-cyan text-lg">
            {skillTicTacToeOverview.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 flex-wrap"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-nc-violet/20 text-nc-violet border border-nc-violet/30'
                  : 'text-nc-text-muted hover:text-nc-text hover:bg-nc-bg-tertiary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'game' && (
            <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GamePanel onOpenSetup={() => setShowSetup(true)} />
            </motion.div>
          )}
          {activeTab === 'rules' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <RulesPanel />
            </motion.div>
          )}
          {activeTab === 'professions' && (
            <motion.div key="professions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ProfessionsPanel />
            </motion.div>
          )}
          {activeTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SkillsPanel />
            </motion.div>
          )}
        </AnimatePresence>

        <SetupModal open={showSetup} onClose={() => setShowSetup(false)} />
      </div>
    </section>
  );
}

// ============================================================
// Game Panel
// ============================================================

function GamePanel({ onOpenSetup }: { onOpenSetup: () => void }) {
  const store = useTTT3Store();
  const {
    gameState, phase,
    startGame, restartWithSameSettings, resetGame,
    makeMove, activeSkill, setActiveSkill, executeSkill,
    showProfShop, setShowProfShop,
    buyProf, forgetProf,
    isHumanTurn, getControllerLabel,
  } = store;

  const [buyRodQty, setBuyRodQty] = useState(1);
  const [skillModal, setSkillModal] = useState<{ open: boolean; skill: GameSkill | null }>({ open: false, skill: null });

  const player = gameState.currentPlayer;
  const isHuman = isHumanTurn();
  const pName = player === 0 ? 'O' : 'X';
  const pColor = player === 0 ? 'text-green-400' : 'text-rose-400';
  const pBg = player === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-rose-500/10 border-rose-500/20';
  const isOverloaded = gameState.infoOverload[player];
  const overloadSeed = gameState.turnCount * 12345 + 67890 + player * 11111;
  const s = (text: string) => isOverloaded ? scrambleText(text, overloadSeed) : text;

  const handleCellClick = useCallback((logicalPos: number) => {
    if (phase !== 'playing') return;
    if (!isHuman) return;

    makeMove(logicalPos);
  }, [phase, isHuman, makeMove]);

  // AI 自动回合
  useEffect(() => {
    if (phase !== 'playing' || isHuman) return;
    const ctrl = player === 0 ? gameState.controllerO : gameState.controllerX;
    if (ctrl < 1 || ctrl > 3) return;

    const timer = setTimeout(() => {
      const action = aiDecideAction(gameState, player, ctrl);
      if (action.type === 'buy_prof' && action.prof !== undefined) {
        buyProf(action.prof, action.snatch);
      } else if (action.type === 'skill' && action.skill !== undefined) {
        executeSkill(action.skill, action.params);
      } else if (action.type === 'move' && action.move !== undefined && action.move >= 0) {
        // Grid Rewrite 封锁期间，AI 返回的是物理位置，需要转换为键盘数字索引
        if (gameState.gridRewriteActive[player]) {
          const keyIndex = gameState.gridRewriteMap[player].indexOf(action.move);
          if (keyIndex >= 0) makeMove(keyIndex);
        } else {
          makeMove(action.move);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [gameState.currentPlayer, phase, isHuman, player, gameState.controllerO, gameState.controllerX, gameState, makeMove, executeSkill, buyProf]);

  if (phase === 'menu') {
    return (
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-nc-text mb-4">概率三子棋 v3</h3>
        <p className="text-nc-text-secondary mb-6 max-w-md mx-auto">
          传统三子棋 × 概率机制 × SP 技能系统。每个格子有独立的成功概率，落子需要运气与策略！
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={startGame}
            className="px-6 py-3 rounded-lg font-bold text-white bg-nc-violet hover:bg-violet-500 transition-all flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            开始对弈
          </button>
          <button
            onClick={onOpenSetup}
            className="px-6 py-3 rounded-lg font-medium text-nc-text border border-nc-violet/20 hover:border-nc-violet/40 transition-all flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            设置
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'ended') {
    const winner = gameState.phase === 'o_wins' ? 0 : 1;
    return (
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-8 text-center">
        <h3 className={`text-3xl font-bold mb-4 ${winner === 0 ? 'text-green-400' : 'text-rose-400'}`}>
          {s(`玩家 ${winner === 0 ? 'O' : 'X'} 获胜！`)}
        </h3>
        <div className="flex gap-4 justify-center mb-6">
          <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-green-400 font-bold">O</span>
            <span className="text-nc-text-muted ml-2">{gameState.playerOWins} {s('胜')}</span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <span className="text-rose-400 font-bold">X</span>
            <span className="text-nc-text-muted ml-2">{gameState.playerXWins} {s('胜')}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={restartWithSameSettings}
            className="px-6 py-3 rounded-lg font-bold text-white bg-nc-violet hover:bg-violet-500 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {s('再来一局')}
          </button>
          <button
            onClick={resetGame}
            className="px-6 py-3 rounded-lg font-medium text-nc-text border border-nc-violet/20 hover:border-nc-violet/40 transition-all"
          >
            {s('返回菜单')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${pBg} ${pColor}`}>
          <span className={`w-3 h-3 rounded-full ${player === 0 ? 'bg-green-400' : 'bg-rose-400'}`} />
          {s(`回合 ${gameState.turnCount} · ${pName} (${getControllerLabel(player)})`)}
          {gameState.fear[player] && <span className="text-purple-400 text-xs">[{s('恐惧')}]</span>}
          {gameState.probSurge[player] && <span className="text-cyan-400 text-xs">[{s('Surge')}]</span>}
          {gameState.venture[player] && <span className="text-yellow-400 text-xs">[{s('Venture')}]</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenSetup} className="p-2 rounded-lg bg-nc-bg-tertiary text-nc-text-muted hover:text-nc-text border border-nc-violet/10">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={restartWithSameSettings} className="p-2 rounded-lg bg-nc-bg-tertiary text-nc-text-muted hover:text-nc-text border border-nc-violet/10">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SP Panels */}
      <div className="grid grid-cols-2 gap-3">
        <SpPanel player={0} gameState={gameState} isCurrent={player === 0} isOverloaded={isOverloaded} seed={overloadSeed} />
        <SpPanel player={1} gameState={gameState} isCurrent={player === 1} isOverloaded={isOverloaded} seed={overloadSeed} />
      </div>

      {/* Board + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Board
            gameState={gameState}
            currentPlayer={player}
            onCellClick={handleCellClick}
          />
        </div>

        <div className="space-y-3">
          <ActionLog logs={gameState.actionLog} isOverloaded={isOverloaded} seed={overloadSeed} />

          {isHuman && !gameState.fear[player] && (
            <SkillBar
              gameState={gameState}
              player={player}
              activeSkill={activeSkill}
              onSelectSkill={setActiveSkill}
              onExecute={executeSkill}
              isOverloaded={isOverloaded}
              seed={overloadSeed}
              onOpenModal={(skill) => {
                setSkillModal({ open: true, skill });
                if (skill === SkillEnum.BUY_ROD) setBuyRodQty(1);
              }}
            />
          )}

          {isHuman && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfShop(!showProfShop)}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-nc-bg-tertiary text-nc-text-secondary border border-nc-violet/10 hover:border-nc-violet/30 transition-all"
              >
                <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                {s('职业商店')}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showProfShop && (
          <ProfShopModal
            gameState={gameState}
            player={player}
            onBuy={buyProf}
            onForget={forgetProf}
            onClose={() => setShowProfShop(false)}
          />
        )}
      </AnimatePresence>

      {/* Skill Parameter Modal */}
      {skillModal.open && skillModal.skill && (
        <SkillParamModal
          skill={skillModal.skill}
          gameState={gameState}
          player={player}
          onClose={() => setSkillModal({ open: false, skill: null })}
          onConfirm={(params) => {
            executeSkill(skillModal.skill!, params);
            setSkillModal({ open: false, skill: null });
          }}
          buyRodQty={buyRodQty}
          setBuyRodQty={setBuyRodQty}
          isOverloaded={isOverloaded}
          seed={overloadSeed}
        />
      )}
    </div>
  );
}

// ============================================================
// SP Panel
// ============================================================

function SpPanel({ player, gameState, isCurrent, isOverloaded, seed }: { player: TTT3Player; gameState: TTT3GameState; isCurrent: boolean; isOverloaded: boolean; seed: number }) {
  const isO = player === 0;
  const color = isO ? 'text-green-400' : 'text-rose-400';
  const borderColor = isO ? 'border-green-500/20' : 'border-rose-500/20';
  const bg = isO ? 'bg-green-500/5' : 'bg-rose-500/5';
  const profNames = gameState.profs[player].map(p => PROF_NAME_CN[p]).join(', ') || '无职业';
  const s = (text: string) => isOverloaded ? scrambleText(text, seed) : text;

  return (
    <div className={`rounded-lg border p-3 ${borderColor} ${bg} ${isCurrent ? 'ring-1 ring-nc-violet/30' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-bold ${color}`}>{s(isO ? 'O' : 'X')}</span>
        <span className="text-xs text-nc-text-muted truncate max-w-[60%]">{s(profNames)}</span>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-mono font-bold ${color}`}>{s(`${gameState.sp[player]}`)}</span>
          <span className="text-xs text-nc-text-muted">{s(`/ ${gameState.maxSp[player]} SP`)}</span>
          {gameState.overdraft[player] > 0 && (
            <span className="text-xs text-red-400 ml-1">{s(`透${gameState.overdraft[player]}/${Math.round(gameState.maxSp[player] / 6)}`)}</span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {gameState.fear[player] && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">{s('恐惧')}</span>}
          {gameState.probSurge[player] && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">{s('Surge')}</span>}
          {gameState.venture[player] && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">{s('Venture')}</span>}
          {gameState.mindMaze[player] > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-400">{s(`Maze×${gameState.mindMaze[player]}`)}</span>}
          {gameState.skipPunishTurns[player] > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{s(`Punish×${gameState.skipPunishTurns[player]}`)}</span>}
          {gameState.infoOverload[player] && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">
              {s(gameState.infoOverloadUses[1 - player] >= 15 ? 'Overload∞' : 'Overload')}
            </span>
          )}
          {gameState.infoOverloadUses[player] > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">
              {s(`IO×${gameState.infoOverloadUses[player]}`)}
            </span>
          )}
          {gameState.availableRods[player] > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">
              {s(`杆×${gameState.availableRods[player]}`)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Board
// ============================================================

function seededShuffle(seed: number, arr: number[]): number[] {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Board({
  gameState,
  currentPlayer,
  onCellClick,
}: {
  gameState: TTT3GameState;
  currentPlayer: TTT3Player;
  onCellClick: (pos: number) => void;
}) {
  const isMath = hasProf(gameState, currentPlayer, ProfessionEnum.MATHEMATICIAN);
  const hasAssassin = hasProf(gameState, currentPlayer, ProfessionEnum.ASSASSIN);
  const isOverloaded = gameState.infoOverload[currentPlayer];
  const isGridRewrite = gameState.gridRewriteActive[currentPlayer];

  const overloadLabels = useMemo(() => {
    if (!isOverloaded) return null;
    return seededShuffle(
      gameState.turnCount * 12345 + 67890 + currentPlayer * 11111,
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
    );
  }, [isOverloaded, gameState.turnCount, currentPlayer]);

  return (
    <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 sm:p-6">
      <div className="grid grid-cols-3 gap-2 max-w-[360px] mx-auto">
        {Array.from({ length: 9 }, (_, physicalPos) => {
          const cellValue = gameState.board[physicalPos];
          const displayProb = gameState.displayR[physicalPos];
          const isSealed = gameState.spatialSealPos === physicalPos;
          const isMazeBlocked = !!(gameState.mindMaze[currentPlayer] > 0 &&
            gameState.mazeAllowed[currentPlayer] &&
            !gameState.mazeAllowed[currentPlayer]!.includes(physicalPos));
          const isUnlocked = isGridRewrite && gameState.gridRewriteUnlocked[currentPlayer][physicalPos];

          return (
            <button
              key={physicalPos}
              onClick={() => onCellClick(physicalPos)}
              disabled={cellValue !== 0 || isSealed || isMazeBlocked || isGridRewrite}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border-2 ${
                cellValue !== 0
                  ? 'bg-nc-bg-tertiary border-nc-violet/10'
                  : isGridRewrite && !isUnlocked
                    ? 'bg-red-500/5 border-red-500/20 opacity-50'
                    : isGridRewrite && isUnlocked
                      ? 'bg-green-500/5 border-green-500/20'
                      : isSealed
                        ? 'bg-red-500/10 border-red-500/30 opacity-50'
                        : isMazeBlocked
                          ? 'bg-nc-bg-tertiary/50 border-nc-violet/5 opacity-30'
                          : 'bg-nc-bg-tertiary border-nc-violet/10 hover:border-nc-violet/30 hover:scale-[1.02]'
              }`}
            >
              {/* Occupied cells */}
              {cellValue !== 0 && (
                isOverloaded && (
                  (currentPlayer === 0 && cellValue === 2) || (currentPlayer === 1 && cellValue === 1)
                ) ? (
                  <span className="text-4xl font-bold text-gray-500">?</span>
                ) : (
                  <span className={`text-4xl font-bold ${cellValue === 1 ? 'text-green-400' : 'text-rose-400'}`}>
                    {cellValue === 1 ? 'O' : 'X'}
                  </span>
                )
              )}

              {cellValue === 0 && (
                <>
                  <span className="text-xs text-nc-text-muted absolute top-1.5 left-2">
                    {isOverloaded && overloadLabels ? overloadLabels[physicalPos] : physicalPos + 1}
                  </span>

                  {isOverloaded ? (
                    <span className="text-lg font-bold text-gray-500">???</span>
                  ) : isSealed ? (
                    <span className="text-xs text-red-400 font-bold">封印</span>
                  ) : isGridRewrite && !isUnlocked ? (
                    <span className="text-xs text-red-400 font-bold">封锁</span>
                  ) : gameState.wheelHidden[physicalPos] ? (
                    <span className="text-lg font-bold text-white">???</span>
                  ) : (
                    <span className={`text-lg font-mono font-bold ${probColorClass(displayProb)}`}>
                      {isMath ? displayProb.toFixed(2) : Math.round(roundTo5(displayProb))}%
                    </span>
                  )}

                  {hasAssassin && !isOverloaded && cellValue === 0 && (physicalPos === 0 || physicalPos === 2 || physicalPos === 6 || physicalPos === 8) && gameState.assassinBonus[currentPlayer][physicalPos] > 0 && (
                    <span className="text-[9px] text-rose-400 font-bold mt-0.5">
                      +{gameState.assassinBonus[currentPlayer][physicalPos].toFixed(1)}%
                    </span>
                  )}

                  {!isOverloaded && (gameState.rods[0][physicalPos] > 0 || gameState.rods[1][physicalPos] > 0) && (
                    <div className="absolute bottom-1 flex gap-1">
                      {gameState.rods[0][physicalPos] > 0 && (
                        <span className="text-[8px] text-green-400">⚡{gameState.rods[0][physicalPos]}</span>
                      )}
                      {gameState.rods[1][physicalPos] > 0 && (
                        <span className="text-[8px] text-rose-400">⚡{gameState.rods[1][physicalPos]}</span>
                      )}
                    </div>
                  )}
                </>
              )}

              {isOverloaded && cellValue === 0 && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none opacity-20"
                  style={{
                    background: `repeating-linear-gradient(
                      ${45 + physicalPos * 15}deg,
                      transparent,
                      transparent 8px,
                      rgba(255,0,0,0.1) 8px,
                      rgba(255,0,0,0.1) 16px
                    )`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid Rewrite 键盘 */}
      {isGridRewrite && (
        <div className="mt-4">
          <p className="text-xs text-nc-text-muted text-center mb-2">Grid Rewrite 封锁中 — 点击数字解锁并尝试落子</p>
          <div className="grid grid-cols-3 gap-2 max-w-[360px] mx-auto">
            {Array.from({ length: 9 }, (_, i) => {
              const used = gameState.gridRewriteKeysUsed[currentPlayer][i];
              return (
                <button
                  key={i}
                  onClick={() => onCellClick(i)}
                  disabled={used}
                  className={`aspect-square rounded-lg font-bold text-lg transition-all border-2 ${
                    used
                      ? 'bg-nc-bg-tertiary/20 text-gray-600 border-nc-violet/5 opacity-40'
                      : 'bg-nc-bg-tertiary border-nc-violet/20 hover:border-nc-violet/40 hover:scale-[1.02] text-nc-text'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-1 mt-4">
        {[
          { label: '≥90%', color: 'text-green-400' },
          { label: '70-89%', color: 'text-cyan-400' },
          { label: '50-69%', color: 'text-yellow-400' },
          { label: '30-49%', color: 'text-purple-400' },
          { label: '10-29%', color: 'text-red-500' },
          { label: '<10%', color: 'text-red-400' },
        ].map(item => (
          <span key={item.label} className={`text-[10px] px-2 py-0.5 rounded bg-nc-bg-tertiary ${item.color}`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Action Log
// ============================================================

function ActionLog({ logs, isOverloaded, seed }: { logs: string[]; isOverloaded: boolean; seed: number }) {
  const s = (text: string) => isOverloaded ? scrambleText(text, seed) : text;
  return (
    <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-3 h-40 overflow-y-auto">
      <h4 className="text-xs font-medium text-nc-text-muted mb-2 flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {s('行动日志')}
      </h4>
      <div className="space-y-1">
        {logs.length === 0 && (
          <p className="text-xs text-nc-text-muted/50">{s('暂无记录')}</p>
        )}
        {logs.slice(-8).map((log, i) => (
          <p key={i} className="text-[11px] text-nc-text-secondary leading-tight">
            <span className="text-nc-text-muted">{s(`${logs.length - 8 + i + 1}.`)}</span> {s(log)}
          </p>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Skill Bar
// ============================================================

function SkillBar({
  gameState,
  player,
  activeSkill,
  onExecute,
  isOverloaded,
  seed,
  onOpenModal,
}: {
  gameState: TTT3GameState;
  player: TTT3Player;
  activeSkill: GameSkill | null;
  onSelectSkill: (s: GameSkill | null) => void;
  onExecute: (s: GameSkill, params?: Record<string, unknown>) => void;
  isOverloaded: boolean;
  seed: number;
  onOpenModal: (skill: GameSkill) => void;
}) {
  const s = (text: string) => isOverloaded ? scrambleText(text, seed) : text;
  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-3">
        <h4 className="text-xs font-medium text-nc-text-muted mb-2">{s('技能')}</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {quickSkills.filter(skill =>
            (skill !== SkillEnum.MATTHEW_SHIFT || hasProf(gameState, player, ProfessionEnum.MATTHEW)) &&
            (skill !== SkillEnum.TYRANT_GRIP || hasProf(gameState, player, ProfessionEnum.TYRANT))
          ).map((skill) => {
            const check = canUseSkill(gameState, skill, player);
            const cost = getSkillCost(gameState, skill, player);
            const isActive = activeSkill === skill;
            const Icon = skillIcons[skill] || Zap;
            const used = isSkillOncePerTurn(skill) && (gameState.skillUsedTurn[player][skill] || 0) > 0;

            const needsInputSkills: number[] = [
              SkillEnum.RENEW, SkillEnum.SWAP_FATES, SkillEnum.SPATIAL_SEAL,
              SkillEnum.DECOY, SkillEnum.WHEEL, SkillEnum.DEPLOY_ROD,
              SkillEnum.BUY_ROD, SkillEnum.MATTHEW_SHIFT,
            ];
            const needsInput = needsInputSkills.includes(skill);

            const btn = (
              <button
                onClick={() => {
                  if (!check.ok) return;
                  if (needsInput) {
                    onOpenModal(skill);
                  } else {
                    onExecute(skill);
                  }
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border text-left ${
                  isActive
                    ? 'bg-nc-violet/20 text-nc-violet border-nc-violet/40'
                    : !check.ok
                      ? 'bg-nc-bg-tertiary/30 text-nc-text-muted/30 border-nc-violet/5 cursor-not-allowed'
                      : used
                        ? 'bg-nc-bg-tertiary/50 text-nc-text-muted border-nc-violet/5'
                        : 'bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-nc-violet/30'
                }`}
              >
                <Icon className="w-3 h-3 inline mr-1" />
                {s(SKILL_NAME_CN[skill])}
                <span className={`ml-1 ${cost < 0 ? 'text-green-400' : 'text-nc-text-muted'}`}>
                  {s(cost < 0 ? `+${-cost}` : `${cost}`)}
                </span>
                {used && <span className="text-nc-text-muted/50 ml-0.5">✓</span>}
              </button>
            );

            if (!check.ok) {
              return (
                <Tooltip key={skill}>
                  <TooltipTrigger asChild>
                    <div className="w-full">{btn}</div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={4}
                    className="bg-red-500/90 text-white text-[10px] px-2 py-1 rounded border-none z-50"
                  >
                    {s(check.reason || '')}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={skill}>{btn}</div>;
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// Skill Parameter Modal
// ============================================================

function SkillParamModal({
  skill,
  gameState,
  player,
  onClose,
  onConfirm,
  buyRodQty,
  setBuyRodQty,
  isOverloaded,
  seed,
}: {
  skill: GameSkill;
  gameState: TTT3GameState;
  player: TTT3Player;
  onClose: () => void;
  onConfirm: (params: Record<string, unknown>) => void;
  buyRodQty: number;
  setBuyRodQty: (v: number | ((p: number) => number)) => void;
  isOverloaded: boolean;
  seed: number;
}) {
  const s = (text: string) => isOverloaded ? scrambleText(text, seed) : text;
  const [selectedCells, setSelectedCells] = useState<number[]>([]);

  useEffect(() => {
    setSelectedCells([]);
  }, [skill]);

  // Buy Rod
  if (skill === SkillEnum.BUY_ROD) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-5 max-w-[240px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-sm font-bold text-nc-text mb-3 text-center">{s('Buy Lightning Rod')}</h3>
          <div className="flex items-center justify-between mb-3">
            <div className="bg-black/40 rounded px-3 py-2 font-mono text-xl text-green-400 min-w-[80px] text-right">
              {buyRodQty}
            </div>
            <div className="text-[10px] text-nc-text-muted text-right leading-tight">
              <div>{s('Cost')}: {getRodCost(buyRodQty)} SP</div>
              <div>{s('Have')}: {gameState.sp[player]} SP</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {['7','8','9','4','5','6','1','2','3'].map(key => (
              <button key={key} onClick={() => setBuyRodQty(q => q.toString().length < 5 ? q * 10 + parseInt(key) : q)}
                className="h-9 rounded bg-nc-violet/15 hover:bg-nc-violet/25 text-xs text-nc-text flex items-center justify-center">{key}</button>
            ))}
            <button onClick={() => setBuyRodQty(q => Math.floor(q / 10))}
              className="h-9 rounded bg-nc-violet/15 hover:bg-nc-violet/25 text-xs text-nc-text flex items-center justify-center">←</button>
            <button onClick={() => setBuyRodQty(q => q.toString().length < 5 ? q * 10 : q)}
              className="h-9 rounded bg-nc-violet/15 hover:bg-nc-violet/25 text-xs text-nc-text flex items-center justify-center">0</button>
            <button onClick={() => { onConfirm({ qty: Math.max(1, buyRodQty) }); onClose(); }}
              className="h-9 rounded bg-green-500/20 hover:bg-green-500/30 text-xs text-green-400 flex items-center justify-center font-bold">OK</button>
          </div>
          <button onClick={onClose} className="w-full py-1.5 rounded-lg text-[10px] text-nc-text-muted hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 transition-all">Cancel</button>
        </div>
      </div>
    );
  }

  // Single cell picker
  const singleCellSkills: GameSkill[] = [SkillEnum.RENEW, SkillEnum.SPATIAL_SEAL, SkillEnum.DECOY, SkillEnum.WHEEL, SkillEnum.DEPLOY_ROD];
  if (singleCellSkills.includes(skill)) {
    const toggle = (pos: number) => {
      setSelectedCells([pos]);
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-5 max-w-[240px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-sm font-bold text-nc-text mb-1 text-center">{s(SKILL_NAME_CN[skill])}</h3>
          <p className="text-[10px] text-nc-text-muted text-center mb-3">{s('Select a cell')}</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3 max-w-[180px] mx-auto">
            {Array.from({ length: 9 }, (_, i) => {
              const isSelected = selectedCells[0] === i;
              return (
                <button key={i} onClick={() => toggle(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all border-2 ${
                    isSelected ? 'bg-nc-violet/30 text-nc-violet border-nc-violet/50' :
                    'bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-nc-violet/30'
                  }`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-1.5 rounded-lg text-[10px] text-nc-text-muted hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 transition-all">Cancel</button>
            <button onClick={() => { if (selectedCells.length > 0) { onConfirm({ pos: selectedCells[0] }); onClose(); } }}
              disabled={selectedCells.length === 0}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-nc-violet/20 text-nc-violet border border-nc-violet/30 hover:bg-nc-violet/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Confirm</button>
          </div>
        </div>
      </div>
    );
  }

  // Swap Fates - two cell picker
  if (skill === SkillEnum.SWAP_FATES || skill === SkillEnum.MATTHEW_SHIFT) {
    const toggle = (pos: number) => {
      if (selectedCells.includes(pos)) setSelectedCells(selectedCells.filter(p => p !== pos));
      else if (selectedCells.length < 2) setSelectedCells([...selectedCells, pos]);
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-5 max-w-[240px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-sm font-bold text-nc-text mb-1 text-center">{s(SKILL_NAME_CN[skill])}</h3>
          {skill === SkillEnum.SWAP_FATES && (
            <p className="text-[9px] text-nc-text-muted text-center mb-2">{s('基础 15 SP，涉及中心格 +10 SP')}</p>
          )}
          <p className="text-[10px] text-nc-text-muted text-center mb-3">{s(skill === SkillEnum.SWAP_FATES ? 'Select 2 cells' : 'Select 2 cells to shift')}</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3 max-w-[180px] mx-auto">
            {Array.from({ length: 9 }, (_, i) => {
              const isSelected = selectedCells.includes(i);
              const isCenterBlocked = skill === SkillEnum.SWAP_FATES && i === 4 && gameState.sp[player] < 25;
              return (
                <button key={i} onClick={() => !isCenterBlocked && toggle(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all border-2 ${
                    isCenterBlocked ? 'bg-nc-bg-tertiary/30 text-nc-text-muted/30 border-nc-violet/5 cursor-not-allowed' :
                    isSelected ? 'bg-nc-violet/30 text-nc-violet border-nc-violet/50' :
                    'bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-nc-violet/30'
                  }`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-1.5 rounded-lg text-[10px] text-nc-text-muted hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 transition-all">Cancel</button>
            <button onClick={() => { if (selectedCells.length === 2) { onConfirm({ a: selectedCells[0], b: selectedCells[1] }); onClose(); } }}
              disabled={selectedCells.length !== 2}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-nc-violet/20 text-nc-violet border border-nc-violet/30 hover:bg-nc-violet/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Confirm</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// Prof Shop Modal
// ============================================================

function ProfShopModal({
  gameState,
  player,
  onBuy,
  onForget,
  onClose,
}: {
  gameState: TTT3GameState;
  player: TTT3Player;
  onBuy: (prof: ProfessionEnum, snatch?: boolean) => void;
  onForget: (index: number) => void;
  onClose: () => void;
}) {
  const opp = 1 - player as TTT3Player;
  const allProfs = [
    ProfessionEnum.GAMBLER, ProfessionEnum.MATHEMATICIAN, ProfessionEnum.TYRANT,
    ProfessionEnum.MONK, ProfessionEnum.ASSASSIN, ProfessionEnum.INVESTOR,
    ProfessionEnum.MATTHEW, ProfessionEnum.CAPITALIST,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-lg font-bold text-nc-text mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-nc-gold" />
          职业商店
        </h3>

        <div className="space-y-2 mb-4">
          {allProfs.map((prof) => {
            const owned = hasProf(gameState, player, prof);
            const oppOwned = hasProf(gameState, opp, prof);
            const cost = getProfCost(gameState, prof, player);
            const buyCost = getProfCost(gameState, prof, player, 5, 3);
            const snatchCost = getProfCost(gameState, prof, player, 10, 3);
            const profInfo = profData.find(p => p.name === Object.keys(ProfessionEnum).find(k => (ProfessionEnum as unknown as Record<string, number>)[k] === prof));

            return (
              <div key={prof} className={`p-3 rounded-lg border ${owned ? 'border-green-500/20 bg-green-500/5' : 'border-nc-violet/10 bg-nc-bg-tertiary'}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 mr-2">
                    <span className="text-sm font-bold text-nc-text">{PROF_NAME_CN[prof]}</span>
                    {profInfo && (
                      <span className="text-[10px] text-nc-text-muted ml-2">{profInfo.effect}</span>
                    )}
                  </div>
                  {owned ? (
                    <span className="text-xs text-green-400 font-medium shrink-0">已拥有</span>
                  ) : oppOwned ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => onBuy(prof, false)}
                        disabled={gameState.sp[player] < buyCost}
                        className="px-2 py-1 rounded text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 disabled:opacity-30"
                      >
                        买断 {buyCost}
                      </button>
                      <button
                        onClick={() => onBuy(prof, true)}
                        disabled={gameState.sp[player] < snatchCost}
                        className="px-2 py-1 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 disabled:opacity-30"
                      >
                        夺取 {snatchCost}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuy(prof)}
                      disabled={gameState.sp[player] < cost}
                      className="px-2 py-1 rounded text-[10px] bg-nc-violet/15 text-nc-violet border border-nc-violet/20 disabled:opacity-30 shrink-0"
                    >
                      {cost} SP
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {gameState.profs[player].length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs text-nc-text-muted mb-2">已拥有职业（点击遗忘）</h4>
            <div className="flex gap-2 flex-wrap">
              {gameState.profs[player].map((prof, i) => (
                <button
                  key={i}
                  onClick={() => onForget(i)}
                  disabled={gameState.skipPunishTurns[player] > 0}
                  className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-30"
                >
                  遗忘 {PROF_NAME_CN[prof]}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg text-sm text-nc-text-muted hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 transition-all"
        >
          关闭
        </button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Setup Modal
// ============================================================

function SetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { controllerO, controllerX, setControllerO, setControllerX, startGame } = useTTT3Store();

  if (!open) return null;

  const options = [
    { value: 0, label: '玩家' },
    { value: 1, label: 'AI Lv1 (随机)' },
    { value: 2, label: 'AI Lv2 (贪心)' },
    { value: 3, label: 'AI Lv3 (MC)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-lg font-bold text-nc-text mb-4">游戏设置</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-green-400 font-medium mb-2 block">O (先手)</label>
            <div className="flex gap-2">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setControllerO(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    controllerO === opt.value
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-nc-bg-tertiary text-nc-text-muted border-nc-violet/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-rose-400 font-medium mb-2 block">X (后手)</label>
            <div className="flex gap-2">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setControllerX(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    controllerX === opt.value
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-nc-bg-tertiary text-nc-text-muted border-nc-violet/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { startGame(); onClose(); }}
            className="flex-1 py-2.5 rounded-lg font-bold text-white bg-nc-violet hover:bg-violet-500 transition-all"
          >
            开始游戏
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm text-nc-text-muted hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 transition-all"
          >
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Rules Panel
// ============================================================

function RulesPanel() {
  return (
    <div className="space-y-6">
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5">
        <h3 className="text-lg font-bold text-nc-text mb-3">核心机制</h3>
        <div className="space-y-2 text-sm text-nc-text-secondary">
          <p>• 每个格子有独立的成功概率，落子时掷概率骰判定是否成功</p>
          <p>• 失败跳过回合，但根据格子位置获得 SP 补偿：中心 +3，角 +4，边 +6</p>
          <p>• SP 上限 30，每回合 +3 收入，可用技能/购买职业</p>
          <p>• 先连成三连者获胜</p>
        </div>
      </div>


    </div>
  );
}

// ============================================================
// Professions Panel
// ============================================================

function ProfessionsPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5">
        <h3 className="text-lg font-bold text-nc-text mb-4">职业系统（8 种）</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {profData.map((prof, i) => (
            <motion.div
              key={prof.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`bg-nc-bg-secondary border rounded-xl p-4 hover:scale-[1.02] transition-transform bg-gradient-to-br ${prof.color} bg-opacity-5 border-white/10`}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-bold text-nc-text">{semanticHighlight(prof.name)}</h5>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-nc-bg text-nc-text-secondary font-bold">{prof.spCost} SP</span>
              </div>
              <p className="text-xs text-nc-text-secondary leading-relaxed">{semanticHighlight(prof.effect)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Skills Panel
// ============================================================

function SkillsPanel() {
  return (
    <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="border-b border-nc-violet/10">
              <th className="text-left px-4 py-3 text-nc-text-muted font-medium">技能</th>
              <th className="text-left px-4 py-3 text-nc-text-muted font-medium">SP</th>
              <th className="text-left px-4 py-3 text-nc-text-muted font-medium">效果</th>
            </tr>
          </thead>
          <tbody>
            {activeSkills.map((skill, i) => (
              <tr key={i} className={`border-b border-nc-violet/5 hover:bg-nc-bg-tertiary/30 transition-colors ${i % 2 === 1 ? 'bg-nc-bg-tertiary/15' : ''}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-nc-text-secondary">{semanticHighlight(skill.name)}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-nc-text-secondary whitespace-nowrap">{skill.spCost}</td>
                <td className="px-4 py-3 text-nc-text-secondary text-xs max-w-[400px]">
                  <span>{semanticHighlight(skill.effect)}</span>
                  {skill.detail && <p className="text-[10px] text-nc-text-muted mt-1">{semanticHighlight(skill.detail)}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
