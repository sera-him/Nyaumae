import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { chessPieces, chessSpecialRules } from '@/data/chess';
import { chessPieceTiers, chessDiamondWarning } from '@/data/fragments';
import { Swords, Grid3X3, ScrollText, Gem, Skull, Shield, AlertTriangle, Play, RotateCcw, Undo2 } from 'lucide-react';
import { fullColorizeMultiline } from '@/lib/highlightUtils';
import { pieceTierColorMap } from '@/lib/highlightUtils';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { useChessStore } from '@/stores/chessStore';
import type { Player, CheeseType, PieceType } from '@/game/chess/types';
import { BOARD_SIZE, POISON_IMMUNE } from '@/game/chess/types';
import { getPiece } from '@/game/chess/board';
import { canDecrypt, applyPoisonFilter, getNonCriticalVariety } from '@/game/chess/rules';
import { CLOCK_PRESETS, CATEGORY_ORDER } from '@/game/chess/clockPresets';
import { confirmAction } from '@/lib/confirmAction';

function formatClock(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSecs = Math.ceil(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatSignedClock(ms: number): string {
  if (ms === 0) return '0:00';
  const sign = ms < 0 ? '-' : '+';
  const absMs = Math.abs(ms);
  const totalSecs = Math.ceil(absMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${sign}${mins}:${String(secs).padStart(2, '0')}`;
}

/** 将秒数转为 周-日-时-分-秒 格式 */
function formatDuration(seconds: number): string {
  const w = Math.floor(seconds / (7 * 86400));
  const rem = seconds % (7 * 86400);
  const d = Math.floor(rem / 86400);
  const h = Math.floor((rem % 86400) / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const s = rem % 60;
  return `${w}-${d}-${String(h).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')}`;
}

/** 分类排序 */


const tierColors: Record<string, string> = {
  '钻石': 'text-yellow-300',
  '辉金': 'text-amber-300',
  '金色': 'text-yellow-400',
  '紫色': 'text-purple-400',
  '蓝色': 'text-blue-400',
  '绿色': 'text-green-400',
  '白色': 'text-gray-300',
};

const tierBgColors: Record<string, string> = {
  '钻石': 'bg-yellow-500/10 border-yellow-500/20',
  '辉金': 'bg-amber-500/10 border-amber-500/20',
  '金色': 'bg-yellow-500/8 border-yellow-500/15',
  '紫色': 'bg-purple-500/8 border-purple-500/15',
  '蓝色': 'bg-blue-500/8 border-blue-500/15',
  '绿色': 'bg-green-500/8 border-green-500/15',
  '白色': 'bg-gray-500/8 border-gray-500/15',
};

const tierIcons = ['◆', '◈', '★', '●', '⬤', '▸', '○'];

// Poison data from source document
interface PoisonEntry {
  letter: string;
  piece: string;
  levels: string[];
  immune?: boolean;
  note?: string;
}

const poisonData: PoisonEntry[] = [
  { letter: 'P/E/Z/IZ', piece: '兵 / 象 / 骷髅兵 / 反骷髅兵', levels: ['不可吃子', '被移除'] },
  { letter: 'N', piece: '马', levels: ['加"蹩腿"', '被移除'] },
  { letter: 'B', piece: '教', levels: ['走"田"且有"蹩腿"', '己方半场不可过中线', '被移除'] },
  { letter: 'R', piece: '车', levels: ['横竖最多2格', '横竖最多1格', '被移除'] },
  { letter: 'Q/O', piece: '后 / 鸵鸟', levels: ['8方向最多2格', '8方向最多1格', '4方向最多1格', '被移除'], note: '切换形态保留中毒' },
  { letter: 'H', piece: '巨鲸', levels: ['被移除'] },
  { letter: 'M', piece: '老鼠', levels: ['马步只能走一个日字', '斜线最多2格', '直线最多2格', '斜线最多1格', '直线最多1格', '无法走马步', '无法走斜线', '被移除'], note: '每次增加限制时，未提到的原有能力保留；被吃后继承毒' },
  { letter: 'T/Y/L/A', piece: '猫 / 缅因猫 / 英语 / 天线', levels: ['免疫', '免疫', '免疫', '失去技能', '失去技能', '失去技能', '被移除'] },
  { letter: 'C', piece: '大炮', levels: ['免疫', '免疫', '免疫', '直线最多移动1格（攻击范围不变）', '直线最多移动1格（攻击范围不变）', '直线最多移动1格（攻击范围不变）', '被移除'] },
  { letter: 'K/W/J/U/S/X/IW', piece: '王 / 女巫 / 圣骑士 / 太空人 / 星舰 / 火箭 / 反女巫', levels: [], immune: true },
];

const cheeseData = [
  { name: '黄奶酪 CY', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', effect: '减少 1 次中毒' },
  { name: '橙奶酪 CO', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', effect: '减少 4 次中毒' },
  { name: '蓝奶酪 CB', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10', border: 'border-[#6366F1]/20', effect: '下回合对手可操纵这只老鼠' },
  { name: '紫奶酪 CP', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', effect: '增加 2 次中毒' },
  { name: '黑奶酪 CK', color: 'text-gray-400', bg: 'bg-gray-800/50', border: 'border-gray-700/30', effect: '增加 8 次中毒' },
];

type TabKey = 'pieces' | 'tiers' | 'board' | 'rules' | 'poison';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'pieces', label: '棋子规则', icon: Swords },
  { key: 'tiers', label: '棋子等级', icon: Gem },
  { key: 'board', label: '对  弈', icon: Grid3X3 },
  { key: 'rules', label: '特殊机制', icon: ScrollText },
  { key: 'poison', label: '中毒查询', icon: Skull },
];

export default function ChessRules() {
  const { ref, isVisible } = useScrollReveal();
  const [activeTab, setActiveTab] = useState<TabKey>('board');

  return (
    <section id="chess" className="py-24 px-4 sm:px-6 relative">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <Swords className="w-7 h-7 text-nc-cyan" />
            <h2 className="text-3xl sm:text-4xl font-bold text-nc-text tracking-wide">{semanticHighlight("复合象棋")}</h2>
          </div>
          <p className="text-nc-text-secondary text-lg">
            12×12 棋盘 · 融合国际象棋、中国象棋及原创机制
          </p>
          <p className="text-sm text-nc-text-secondary mt-2 flex items-center gap-2">
            <Gem className="w-4 h-4" />
            {chessDiamondWarning}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
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

        {/* Pieces Table */}
        {activeTab === 'pieces' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <thead>
                  <tr className="border-b border-nc-violet/10">
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">字母</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">名称</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">移动</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">吃子</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {chessPieces.map((piece, idx) => (
                    <tr
                      key={piece.letter}
                      className={`border-b border-nc-violet/5 hover:bg-nc-bg-tertiary/50 transition-colors ${
                        idx % 2 === 0 ? '' : 'bg-nc-bg-tertiary/20'
                      }`}
                    >
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`inline-block w-8 h-8 rounded-lg bg-nc-bg border border-nc-violet/20 flex items-center justify-center font-mono font-bold ${pieceTierColorMap[piece.letter] || 'text-nc-text'}`}>
                          {piece.letter}
                        </span>
                      </td>
                      <td className={`px-3 sm:px-4 py-3 font-medium ${pieceTierColorMap[piece.name] || 'text-nc-text'}`}>{piece.name}</td>
                      <td className="px-3 sm:px-4 py-3 text-nc-text-secondary text-xs max-w-[200px]">
                        <span className="text-nc-violet">{piece.move}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs">
                        <span className="text-nc-rose">{piece.eat}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs max-w-[250px]">
                        {piece.notes ? fullColorizeMultiline(piece.notes) : <span className="text-nc-text-muted">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tiers - Visual Cards */}
        {activeTab === 'tiers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-xs text-nc-text-muted">* 表示该棋子进入敌方英语（L）十字1-2格禁区会被消灭</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {chessPieceTiers.map((piece, i) => {
                const tierKey = piece.tier.replace('*', '');
                const colorClass = tierColors[tierKey] || 'text-gray-300';
                const bgClass = tierBgColors[tierKey] || 'bg-gray-500/8 border-gray-500/15';
                const tierIdx = Object.keys(tierColors).indexOf(tierKey);
                const icon = tierIcons[Math.min(tierIdx, tierIcons.length - 1)] || '○';
                return (
                  <motion.div
                    key={piece.letter}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`rounded-xl p-4 border ${bgClass} hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-block w-8 h-8 rounded-lg bg-nc-bg border border-nc-violet/20 flex items-center justify-center font-mono font-bold text-sm ${pieceTierColorMap[piece.letter] || 'text-nc-text'}`}>
                        {piece.letter}
                      </span>
                      <span className={`text-lg ${colorClass}`}>{icon}</span>
                    </div>
                    <p className={`text-sm font-medium ${pieceTierColorMap[piece.name] || 'text-nc-text'}`}>{piece.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-medium ${colorClass}`}>{piece.tier}</span>
                      <span className="font-mono text-xs text-nc-text-muted">×{piece.count}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Board Layout - Interactive Game */}
        {activeTab === 'board' && (
          <ChessGameBoard />
        )}

        {/* Special Rules */}
        {activeTab === 'rules' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {chessSpecialRules.map((rule, i) => {
              // Assign a distinct left-border color per rule card
              const borderColors = [
                'border-l-nc-cyan',
                'border-l-nc-violet',
                'border-l-nc-rose',
                'border-l-nc-gold',
                'border-l-green-400',
              ];
              const titleColors = [
                'text-nc-cyan',
                'text-nc-violet',
                'text-nc-rose',
                'text-nc-gold',
                'text-green-400',
              ];
              const borderColor = borderColors[i % borderColors.length];
              const titleColor = titleColors[i % titleColors.length];

              return (
                <div
                  key={i}
                  className={`bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5 hover:border-nc-violet/20 transition-all border-l-4 ${borderColor}`}
                >
                  <h4 className={`text-base font-semibold mb-2 flex items-center gap-2 ${titleColor}`}>
                    <ScrollText className="w-4 h-4" />
                    {rule.title}
                  </h4>
                  <pre className="text-sm text-nc-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                    {fullColorizeMultiline(rule.content)}
                  </pre>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Poison */}
        {activeTab === 'poison' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Cheese reference */}
            <div className="bg-nc-bg-secondary border border-[#F59E0B]/15 rounded-xl p-4 sm:p-5">
              <h4 className="text-sm font-semibold text-[#F59E0B] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                奶酪规则 —— 当老鼠踏入有奶酪的格子时
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 text-xs">
                {cheeseData.map((c) => (
                  <div key={c.name} className={`px-3 py-2 rounded-lg ${c.bg} border ${c.border} text-center`}>
                    <span className={`${c.color} font-bold block mb-0.5`}>{c.name}</span>
                    <span className="text-nc-text">{c.effect}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-nc-text-muted">
                {semanticHighlight("女巫制作橙奶酪或黑奶酪前需要献祭周围 8 格的一个己方 Z/IZ。除老鼠外的棋子踏入奶酪格会踩坏奶酪。")}
              </p>
            </div>

            {/* Poison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {poisonData.map((entry, i) => (
                <motion.div
                  key={entry.letter}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className={`rounded-xl overflow-hidden border transition-all ${
                    entry.immune
                      ? 'bg-[#0A0614] border-nc-violet/10 hover:border-nc-violet/25'
                      : 'bg-nc-bg-secondary border-[#EF4444]/10 hover:border-[#EF4444]/25'
                  }`}
                >
                  <div className={`px-4 py-3 border-b flex items-center gap-3 ${
                    entry.immune ? 'border-nc-violet/10' : 'border-[#EF4444]/10'
                  }`}>
                    <span className={`inline-block w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                      entry.immune
                        ? 'bg-[#1A1025] border-nc-violet/30 text-nc-violet'
                        : 'bg-[#1A1025] border-[#EF4444]/30 text-[#EF4444]'
                    }`}>
                      {entry.immune ? <Shield className="w-4 h-4" /> : entry.letter.split('/')[0]}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-nc-text truncate">{semanticHighlight(entry.piece)}</h3>
                      {!entry.immune && <p className="text-[10px] text-nc-text-muted font-mono truncate">{entry.letter}</p>}
                    </div>
                    {entry.immune && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-nc-violet/15 text-nc-violet font-medium shrink-0">
                        免疫
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {entry.immune ? (
                      <p className="text-xs text-nc-text-muted text-center py-2">不受中毒影响</p>
                    ) : (
                      <div className="space-y-1">
                        {entry.levels.map((level, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
                              level === '免疫'
                                ? 'bg-nc-violet/8 text-nc-text'
                                : level === '被移除'
                                ? 'bg-[#EF4444]/15 text-[#EF4444]'
                                : 'bg-[#EF4444]/6 text-nc-text'
                            }`}
                          >
                            <span className={`inline-block w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                              level === '免疫'
                                ? 'bg-nc-violet/20 text-nc-violet'
                                : level === '被移除'
                                ? 'bg-[#EF4444]/25 text-[#EF4444]'
                                : 'bg-[#EF4444]/15 text-[#EF4444]'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="leading-snug">{semanticHighlight(level)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.note && <p className="mt-2 text-[10px] text-nc-text-muted border-t border-nc-violet/10 pt-1.5">{semanticHighlight(entry.note)}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// Interactive Chess Game Board Component
// ============================================================

function ChessGameBoard() {
  const {
    gameState, gameStarted, selectedPos, legalMoves,
    promoteChoice, witchSkillMode, selectedCheeseType, startGame, resetGame,
    selectCell, confirmPromotion, undoLastMove,
    setWitchSkillMode, setCheeseType, transformQueen, executeDecrypt,
    skillConfirmTarget, confirmSkill, cancelSkill, requestSelfDestruct,
    antennaPushMode, antennaPushTargets, antennaPushPlayer,
    ostrichRevertChoice, confirmOstrichRevert, cancelOstrichRevert,
    starshipDeployMode, starshipDeployTarget, setStarshipDeployMode, confirmStarshipDeploy, synthesizeStarship,
    clockRunning, tick, setClockConfig,
  } = useChessStore();

  const preset = gameState.clockConfigId ? (CLOCK_PRESETS.find(p => p.id === gameState.clockConfigId) ?? null) : null;
  const { board, currentPlayer, phase, moveCount, poison, clock } = gameState;

  // 棋钟 tick —— 每秒一次
  useEffect(() => {
    if (!clockRunning || phase !== 'playing') return;
    const interval = setInterval(() => { tick(); }, 1000);
    return () => clearInterval(interval);
  }, [clockRunning, phase, tick]);

  // Pool 模式宽限重置 per-move
  useEffect(() => {
    if (preset?.entropyType === 'pool' && phase === 'playing') {
      // 切换回合时重置 perMoveMs
      // 这个由 tick 处理，此处预留
    }
  }, [currentPlayer, preset, phase]);

  const handleCellClick = useCallback((row: number, col: number) => {
    selectCell({ row, col });
  }, [selectCell]);

  const legalSet = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`));
  const captureSet = new Set(legalMoves.filter(m => m.isCapture).map(m => `${m.to.row},${m.to.col}`));
  // 推子目标：推子来源位置（玩家点棋子本身即可推）
  const pushFromSet = new Set(antennaPushTargets.map(t => `${t.from.row},${t.from.col}`));
  const pushToSet = new Set(antennaPushTargets.map(t => `${t.to.row},${t.to.col}`));

  // Color helpers
  const getPieceColor = (letter: string, owner: Player): string => {
    const key = owner === 'white' ? letter.toUpperCase() : letter.toLowerCase();
    return pieceTierColorMap[key] || (owner === 'white' ? 'text-nc-cyan' : 'text-nc-rose');
  };

  const getPieceLabel = (piece: ReturnType<typeof getPiece>): string => {
    if (!piece || typeof piece !== 'object' || !('type' in piece)) return '';
    const p = piece as { type: string; owner: Player };
    return p.owner === 'white' ? p.type : p.type.toLowerCase();
  };

  const boardStatusLabel = !gameStarted
    ? '尚未开始'
    : phase === 'playing'
      ? `轮到${currentPlayer === 'white' ? '白方' : '黑方'}走子`
      : phase === 'white_wins'
        ? '白方获胜'
        : phase === 'black_wins'
          ? '黑方获胜'
          : '和棋';

  const cellSize = 'min(calc((100vw - 80px) / 12), 44px)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 棋钟预设选择器（游戏未开始时显示） */}
      {!gameStarted && (<>
        <div className="space-y-2">
          <div className="text-xs text-nc-text-secondary font-medium">⏱ 棋钟</div>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_ORDER.map(cat => {
              const catPresets = CLOCK_PRESETS.filter(p => p.category === cat);
              return (
                <div key={cat} className="flex items-center gap-0.5">
                  <span className="text-[10px] text-nc-text-secondary px-1 select-none">{cat}</span>
                  {catPresets.map(p => {
                    const active = (gameState.clockConfigId ?? 15) === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setClockConfig(p.id)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                          active
                            ? 'bg-nc-violet/30 text-nc-violet border border-nc-violet/40'
                            : 'bg-nc-bg-tertiary text-nc-text-secondary border border-transparent hover:border-nc-violet/20'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {/* 选中预设的规则说明 */}
        {(() => {
          const selPreset = CLOCK_PRESETS.find(p => p.id === (gameState.clockConfigId ?? 15));
          return selPreset ? (
            <div className="text-[11px] text-nc-text-muted leading-relaxed">
              {selPreset.description}
            </div>
          ) : null;
        })()}
      </>)}

      {/* Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {!gameStarted ? (
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nc-violet/20 text-nc-violet border border-nc-violet/30 hover:bg-nc-violet/30 text-sm font-medium transition-all"
            >
              <Play className="w-4 h-4" />
              开始对弈
            </button>
          ) : (
            <>
              {/* Turn Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                antennaPushMode
                  ? antennaPushPlayer === 'white'
                    ? 'bg-nc-gold/10 border-nc-gold/30 text-nc-gold'
                    : 'bg-nc-gold/10 border-nc-gold/30 text-nc-gold'
                  : currentPlayer === 'white'
                    ? 'bg-nc-cyan/10 border-nc-cyan/30 text-nc-cyan'
                    : 'bg-nc-rose/10 border-nc-rose/30 text-nc-rose'
              }`}>
                <span className={`w-3 h-3 rounded-full ${
                  antennaPushMode
                    ? 'bg-nc-gold'
                    : currentPlayer === 'white' ? 'bg-nc-cyan' : 'bg-nc-rose'
                }`} />
                {antennaPushMode
                  ? `${antennaPushPlayer === 'white' ? '白方' : '黑方'}推子`
                  : currentPlayer === 'white' ? '白方走子' : '黑方走子'
                }
              </div>

              {/* Blue Cheese Indicator */}
              {gameState.blueCheeseControl && (
                <div className="px-3 py-1.5 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] text-xs font-medium">
                  🧀 蓝奶酪：{gameState.blueCheeseControl === 'white' ? '白方可控对方老鼠' : '黑方可控对方老鼠'}
                </div>
              )}

              {phase !== 'playing' && (
                <div className="px-3 py-1.5 rounded-lg bg-nc-gold/10 border border-nc-gold/30 text-nc-gold text-sm font-bold">
                  {phase === 'white_wins' ? '白方胜！' : phase === 'black_wins' ? '黑方胜！' : '和棋'}
                </div>
              )}
            </>
          )}
        </div>

        {gameStarted && (
          <div className="flex items-center gap-2">
            <button
              onClick={undoLastMove}
              disabled={gameState.history.length === 0 || phase !== 'playing'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-nc-bg-tertiary text-nc-text-secondary hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-3.5 h-3.5" />
              撤销
            </button>
            <button
              onClick={() => {
                if (confirmAction({ title: '重新开始组合棋对局？', consequence: '当前棋盘、计时、历史步骤和技能状态都会清空。' })) resetGame();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-nc-bg-tertiary text-nc-text-secondary hover:text-rose-400 border border-nc-violet/10 hover:border-rose-400/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新开始
            </button>
          </div>
        )}
      </div>

      {/* Witch Skill Bar */}
      {/* Witch / Anti-Witch Skill Bar */}
      {gameStarted && selectedPos && phase === 'playing' && (() => {
        const selPiece = getPiece(board, selectedPos);
        if (!selPiece || selPiece.owner !== currentPlayer) return null;

        // W / IW 全部技能
        if (selPiece.type === 'W' || selPiece.type === 'IW') {
          const isWitch = selPiece.type === 'W';
          const sc = gameState.sacrificeCount?.[currentPlayer] || 0;
          const cheeseTypes: { type: CheeseType; label: string; color: string; activeColor: string; needsSacrifice?: boolean }[] = [
            { type: 'CY', label: '黄奶酪', color: 'text-yellow-400', activeColor: 'bg-yellow-500/20 border-yellow-500/40' },
            { type: 'CO', label: '橙奶酪', color: 'text-orange-400', activeColor: 'bg-orange-500/20 border-orange-500/40', needsSacrifice: true },
            { type: 'CB', label: '蓝奶酪', color: 'text-indigo-400', activeColor: 'bg-indigo-500/20 border-indigo-500/40' },
            { type: 'CP', label: '紫奶酪', color: 'text-red-400', activeColor: 'bg-red-500/20 border-red-500/40' },
            { type: 'CK', label: '黑奶酪', color: 'text-gray-400', activeColor: 'bg-gray-500/20 border-gray-500/40', needsSacrifice: true },
          ];

          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-nc-text-muted">{isWitch ? '女巫' : '反女巫'}技能：</span>
                <span className="text-xs text-nc-text-muted">献祭次数：{sc}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 下毒 */}
                <button
                  onClick={() => setWitchSkillMode(witchSkillMode === 'poison' ? 'none' : 'poison')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    witchSkillMode === 'poison'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-red-500/30'
                  }`}
                >
                  ☠️ 下毒
                </button>
                {/* 5种奶酪 */}
                {cheeseTypes.map(({ type, label, color, activeColor, needsSacrifice }) => {
                  const isActive = witchSkillMode === 'cheese' && selectedCheeseType === type;
                  const disabled = needsSacrifice && sc <= 0;
                  return (
                    <button
                      key={type}
                      onClick={() => !disabled &&
                        (isActive ? setWitchSkillMode('none') : setCheeseType(type))
                      }
                      disabled={disabled}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        disabled
                          ? 'bg-nc-bg-tertiary/50 text-nc-text-muted/40 border-nc-violet/5 cursor-not-allowed'
                          : isActive
                            ? `${activeColor} ${color}`
                            : `bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:${activeColor}`
                      }`}
                    >
                      🧀 {label} {type} {needsSacrifice && sc <= 0 ? '(需献祭)' : ''}
                    </button>
                  );
                })}
                {/* 献祭 */}
                <button
                  onClick={() => setWitchSkillMode(witchSkillMode === 'sacrifice' ? 'none' : 'sacrifice')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    witchSkillMode === 'sacrifice'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      : 'bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-purple-500/30'
                  }`}
                >
                  🙏 献祭 {isWitch ? 'IZ' : 'Z'}
                </button>
                {/* 自爆 */}
                <button
                  onClick={requestSelfDestruct}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all border bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-orange-500/30"
                >
                  💥 自爆
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Starship Deploy Bar */}
      {gameStarted && selectedPos && phase === 'playing' && (() => {
        const selPiece = getPiece(board, selectedPos);
        if (selPiece && selPiece.type === 'S' && selPiece.owner === currentPlayer) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStarshipDeployMode(!starshipDeployMode)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                  starshipDeployMode
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-nc-bg-tertiary text-nc-text-secondary border-nc-violet/10 hover:border-emerald-500/30'
                }`}
              >
                🚀 {starshipDeployMode ? '取消部署' : '部署棋子'}
              </button>
              {starshipDeployMode && (
                <span className="text-xs text-emerald-400">点击 9×9 范围内空格</span>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Spaceman Info + Synthesize */}
      {gameStarted && selectedPos && phase === 'playing' && (() => {
        const selPiece = getPiece(board, selectedPos);
        if (selPiece && selPiece.type === 'U' && selPiece.owner === currentPlayer) {
          const variety = getNonCriticalVariety(board, currentPlayer);
          const canSynth = variety.current >= variety.total;
          return (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-nc-text-muted">
                👨‍🚀 太空人（{variety.current}/{variety.total}）
              </span>
              {canSynth && (
                <button
                  onClick={synthesizeStarship}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all border bg-nc-gold/20 text-nc-gold border-nc-gold/40 hover:bg-nc-gold/30"
                >
                  ✨ 合成星舰
                </button>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Queen→Ostrich Button */}
      {gameStarted && selectedPos && phase === 'playing' && (() => {
        const selPiece = getPiece(board, selectedPos);
        if (selPiece && selPiece.type === 'Q' && selPiece.owner === currentPlayer) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={transformQueen}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all border bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
              >
                🦢 变为鸵鸟 O
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Decryption Button */}
      {gameStarted && phase === 'playing' && !gameState.decryptionActive && canDecrypt(board, currentPlayer) && (
        <div className="flex items-center gap-2">
          <button
            onClick={executeDecrypt}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all border bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
          >
            🔓 发动破译
          </button>
        </div>
      )}

      {/* Board + 棋钟侧栏 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        {/* 棋盘 */}
        <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-3 sm:p-4 overflow-x-auto flex-shrink-0">
          <div className="flex justify-center">
            <div
              role="grid"
              aria-label={`复合象棋棋盘，${boardStatusLabel}`}
              aria-rowcount={BOARD_SIZE}
              aria-colcount={BOARD_SIZE}
              className="grid gap-0.5 bg-nc-violet/10 rounded-lg overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize})`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize})`,
              }}
            >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
              const row = Math.floor(i / BOARD_SIZE);
              const col = i % BOARD_SIZE;
              const isDark = row % 2 === 0 ? col % 2 === 0 : col % 2 === 1;
              const piece = getPiece(board, { row, col });
              const isSelected = selectedPos?.row === row && selectedPos?.col === col;
              const isLegal = legalSet.has(`${row},${col}`);
              const isCapture = captureSet.has(`${row},${col}`);
              const isPushFrom = pushFromSet.has(`${row},${col}`);
              const isPushTo = pushToSet.has(`${row},${col}`);
              // 星舰部署模式：高亮 9×9 范围内的空格
              const isDeployTarget = starshipDeployMode && selectedPos && !piece && (
                Math.abs(row - selectedPos.row) <= 4 && Math.abs(col - selectedPos.col) <= 4
              );
              const key = `${row},${col}`;
              
              // Check for extra content (poison, cheese)
              const cell = gameStarted ? board[row][col] : null;
              const isPoison = cell === 'poison';
              const isCheese = typeof cell === 'string' && cell !== 'poison' && cell !== null;

              // 中毒次数
              const pKey = piece ? `${piece.owner}_${piece.type}_${row}_${col}` : '';
              const poisonCount = piece && gameStarted ? (poison[pKey] || 0) : 0;
              const isPermImmune = piece ? POISON_IMMUNE.includes(piece.type) : false;
              const poisonEffect = piece && !isPermImmune && poisonCount > 0 ? applyPoisonFilter(piece, poisonCount) : null;
              const isTempImmune = poisonEffect === null && poisonCount > 0 && !isPermImmune;

              // 格子阵营：0-3行=黑方，4-7行=中立，8-11行=白方
              // 角标颜色：根据该格棋子的归属方
              const pieceOwner = piece?.owner;
              const triangleColor = pieceOwner === 'white' ? '#ffffff' : pieceOwner === 'black' ? '#111' : null;
              const cellLabel = [
                `第 ${row + 1} 行，第 ${col + 1} 列`,
                piece ? `${piece.owner === 'white' ? '白方' : '黑方'} ${getPieceLabel(piece)} 棋子` : null,
                isPoison ? '毒药' : null,
                isCheese ? `奶酪 ${cell as string}` : null,
                isSelected ? '已选中' : null,
                isCapture ? '可吃子' : isLegal ? '可移动' : null,
                isPushFrom ? '可推子' : null,
                isPushTo ? '推子目标' : null,
                isDeployTarget ? '可部署' : null,
              ].filter(Boolean).join('，');

              return (
                <div
                  key={key}
                  onClick={() => gameStarted && handleCellClick(row, col)}
                  onKeyDown={(event) => {
                    if (!gameStarted || event.repeat) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleCellClick(row, col);
                    }
                  }}
                  role="gridcell"
                  tabIndex={gameStarted ? 0 : -1}
                  aria-label={cellLabel}
                  aria-rowindex={row + 1}
                  aria-colindex={col + 1}
                  aria-selected={isSelected}
                  aria-disabled={!gameStarted || phase !== 'playing'}
                  className={`aspect-square flex items-center justify-center font-mono font-bold cursor-pointer transition-all relative select-none ${
                    isDark ? 'bg-[#1A1025]' : 'bg-[#251836]'
                  } ${
                    isSelected
                      ? 'ring-2 ring-nc-cyan scale-[1.1] z-10 rounded-sm shadow-lg shadow-nc-cyan/20'
                      : isLegal
                      ? isCapture
                        ? 'ring-2 ring-nc-rose/60 rounded-sm cursor-crosshair'
                        : 'ring-1 ring-nc-violet/40 bg-nc-violet/15 rounded-sm'
                      : isPushFrom
                      ? 'ring-2 ring-nc-gold rounded-sm cursor-pointer animate-pulse'
                      : isPushTo
                      ? 'ring-1 ring-nc-gold/40 bg-nc-gold/10 rounded-sm'
                      : isDeployTarget
                      ? 'ring-1 ring-emerald-400/50 bg-emerald-400/10 rounded-sm cursor-pointer'
                      : ''
                  }`}
                  style={{ fontSize: `calc(${cellSize} * 0.55)` }}
                >
                  {/* 右上角棋子归属三角 */}
                  {triangleColor !== null && gameStarted && (
                    <span className="absolute top-0 right-0" style={{
                      width: 0, height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 7px 7px 0',
                      borderColor: `transparent ${triangleColor} transparent transparent`,
                    }} />
                  )}

                  {/* 左上角中毒次数 */}
                  {/* 左上角中毒次数：永久免疫不显示，暂时免疫绿色，有影响红色 */}
                  {!isPermImmune && poisonCount > 0 && (
                    <span className={`absolute top-0 left-0 text-[9px] font-bold leading-none px-0.5 z-20 ${
                      isTempImmune ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {poisonCount}
                    </span>
                  )}

                  {piece && (
                    <span className={`${getPieceColor(piece.type, piece.owner)} drop-shadow-sm`}>
                      {getPieceLabel(piece)}
                    </span>
                  )}
                  {!piece && isPoison && gameStarted && (
                    <span className="text-red-400/60 text-[60%]">D</span>
                  )}
                  {!piece && isCheese && gameStarted && (
                    <span className="text-yellow-400/60 text-[60%]">{cell as string}</span>
                  )}

                  {/* Bounty 格子右下角时间币 */}
                  {gameStarted && preset?.entropyType === 'bounty' && (() => {
                    const reward = gameState.clockBountyCells[`${row},${col}`];
                    if (reward === undefined || reward <= 0) return null;
                    return (
                      <span className="absolute bottom-0 right-0 text-[8px] font-bold text-amber-400/80 leading-none px-0.5 z-20">
                        +{Math.ceil(reward / 1000)}
                      </span>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 棋钟侧栏 */}
      {gameStarted && preset && (() => {
        const isTug = preset.entropyType === 'tug_of_war';
        const isAccel = preset.entropyType === 'accelerando';
        const isPool = preset.entropyType === 'pool';
        const wMs = clock.white;
        const bMs = clock.black;
        const wActive = currentPlayer === 'white' && !antennaPushMode;
        const bActive = currentPlayer === 'black' && !antennaPushMode;

        if (isTug) {
          // 拔河：显示单一时间值 + 方向标
          const t = wMs;
          const txt = formatSignedClock(t);
          const nearWhiteLoss = t <= -240_000; // 4min 警告
          const nearBlackLoss = t >= 240_000;
          return (
            <div className="flex flex-col gap-3 w-36 flex-shrink-0">
              <div className={`rounded-xl p-3 border transition-all bg-nc-bg-secondary border-nc-violet/10`}>
                <div className="text-[10px] font-medium mb-1 opacity-60">拔河</div>
                <div className={`font-mono text-2xl font-bold tabular-nums leading-tight ${
                  t < 0 ? 'text-nc-cyan' : t > 0 ? 'text-nc-rose' : ''
                }`}>
                  <span className="text-sm opacity-60">{t < 0 ? '◀' : t > 0 ? '▶' : ''}</span>
                  {' '}{txt}
                  {(nearWhiteLoss || nearBlackLoss) && <span className="text-sm ml-1 text-red-400">⚠</span>}
                </div>
                <div className="flex justify-between text-[10px] text-nc-text-muted mt-2 pt-2 border-t border-nc-violet/10">
                  <span className={wActive ? 'text-nc-cyan font-medium' : ''}>白方 -5min 输</span>
                  <span className={bActive ? 'text-nc-rose font-medium' : ''}>黑方 +5min 输</span>
                </div>
              </div>
              <div className="text-[10px] text-nc-text-muted text-center">{preset.category} · {preset.label}</div>
            </div>
          );
        }

        if (isPool) {
          // Pool：共享池（动态） + 白方步限框 + 黑方步限框
          const poolStr = formatClock(gameState.clockPoolMs);
          const moveStr = formatClock(gameState.clockPerMoveMs);
          const poolEmpty = gameState.clockPoolMs <= 0;
          const moveEmpty = gameState.clockPerMoveMs <= 0;
          const wActivePool = currentPlayer === 'white';
          const bActivePool = currentPlayer === 'black';
          return (
            <div className="flex flex-col gap-3 w-36 flex-shrink-0">
              {/* 共享池时间 */}
              <div className={`rounded-xl p-3 border transition-all bg-nc-bg-secondary ${
                poolEmpty ? 'border-red-500/50' : 'border-nc-violet/10'
              }`}>
                <div className="text-[10px] font-medium mb-1 opacity-60">池 · 共享</div>
                <div className={`font-mono text-2xl font-bold tabular-nums leading-tight ${
                  poolEmpty ? 'text-red-400 animate-pulse' : 'text-nc-cyan'
                }`}>
                  {poolStr}{poolEmpty && <span className="text-sm ml-1">⚠</span>}
                </div>
              </div>
              {/* 白方步限 */}
              <div className={`rounded-xl p-3 border transition-all ${
                wActivePool
                  ? 'bg-nc-cyan/10 border-nc-cyan/30'
                  : 'hidden'
              }`}>
                <div className="text-[10px] font-medium mb-1 opacity-60">白方 · 步限</div>
                <div className={`font-mono text-xl font-bold tabular-nums leading-tight ${
                  moveEmpty ? 'text-red-400 animate-pulse' : wActivePool ? 'text-nc-cyan' : ''
                }`}>
                  {moveStr}{moveEmpty && <span className="text-sm ml-1">⚠</span>}
                </div>
              </div>
              {/* 黑方步限 */}
              <div className={`rounded-xl p-3 border transition-all ${
                bActivePool
                  ? 'bg-nc-rose/10 border-nc-rose/30'
                  : 'hidden'
              }`}>
                <div className="text-[10px] font-medium mb-1 opacity-60">黑方 · 步限</div>
                <div className={`font-mono text-xl font-bold tabular-nums leading-tight ${
                  moveEmpty ? 'text-red-400 animate-pulse' : bActivePool ? 'text-nc-rose' : ''
                }`}>
                  {moveStr}{moveEmpty && <span className="text-sm ml-1">⚠</span>}
                </div>
              </div>
              <div className="text-[10px] text-nc-text-muted text-center">{preset.category} · {preset.label}</div>
            </div>
          );
        }

        const wTxt = isAccel ? wMs.toLocaleString() : formatClock(wMs);
        const bTxt = isAccel ? bMs.toLocaleString() : formatClock(bMs);
        const wLow = !preset.isCountUp && !isAccel && wMs < 30000 && wMs > 0;
        const bLow = !preset.isCountUp && !isAccel && bMs < 30000 && bMs > 0;
        const wCrit = !preset.isCountUp && !isAccel && wMs > 0 && wMs < 10000;
        const bCrit = !preset.isCountUp && !isAccel && bMs > 0 && bMs < 10000;
        return (
          <div className="flex flex-col gap-3 w-36 flex-shrink-0">
            {/* 白方时钟 */}
            <div className={`rounded-xl p-3 border transition-all ${
              wActive
                ? 'bg-nc-cyan/10 border-nc-cyan/30'
                : 'bg-nc-bg-secondary border-nc-violet/10'
            }`}>
              <div className="text-[10px] font-medium mb-1 opacity-60">白方</div>
              <div className={`font-mono text-2xl font-bold tabular-nums leading-tight ${
                wActive ? 'text-nc-cyan' : wCrit ? 'text-red-400 animate-pulse' : wLow ? 'text-amber-400' : ''
              }`}>
                {wTxt}{wCrit && <span className="text-sm ml-1">⚠</span>}
              </div>
              {isAccel && <div className="text-[10px] text-nc-text-muted mt-1">Token<br/><span className="font-tva text-xs font-bold tracking-wider text-green-400">{formatDuration(wMs)}</span></div>}
            </div>
            {/* 黑方时钟 */}
            <div className={`rounded-xl p-3 border transition-all ${
              bActive
                ? 'bg-nc-rose/10 border-nc-rose/30'
                : 'bg-nc-bg-secondary border-nc-violet/10'
            }`}>
              <div className="text-[10px] font-medium mb-1 opacity-60">黑方</div>
              <div className={`font-mono text-2xl font-bold tabular-nums leading-tight ${
                bActive ? 'text-nc-rose' : bCrit ? 'text-red-400 animate-pulse' : bLow ? 'text-amber-400' : ''
              }`}>
                {bTxt}{bCrit && <span className="text-sm ml-1">⚠</span>}
              </div>
              {isAccel && <div className="text-[10px] text-nc-text-muted mt-1">Token<br/><span className="font-tva text-xs font-bold tracking-wider text-green-400">{formatDuration(bMs)}</span></div>}
            </div>
            {/* 预设名称 */}
            <div className="text-[10px] text-nc-text-muted text-center">{preset.category} · {preset.label}</div>
          </div>
        );
      })()}
    </div>

    {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-nc-text-muted px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-nc-cyan/30 inline-block" /> 白方（大写字母）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-nc-rose/30 inline-block" /> 黑方（小写字母）
        </span>
        {gameStarted && (
          <span className="text-nc-text-muted">第 {moveCount} 手</span>
        )}
      </div>

      {/* Promotion Dialog */}
      <AnimatePresence>
        {promoteChoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-nc-text mb-2">选择升变棋子</h3>
              <p className="text-sm text-nc-text-secondary mb-4">
                兵/象已到达对方底线，请选择升变目标
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {promoteChoice.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => confirmPromotion(opt)}
                    className={`px-3 py-2 rounded-lg font-mono font-bold text-sm transition-all border hover:scale-105 cursor-pointer active:scale-95 ${
                      pieceTierColorMap[opt] || 'text-nc-text'
                    } bg-nc-bg border-nc-violet/10 hover:border-nc-violet/30`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-nc-text-muted text-center">象可选 E 保留为象；横移仍在底线可再次升变</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Self-Destruct Confirmation Dialog */}
      <AnimatePresence>
        {skillConfirmTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-nc-bg-secondary border border-orange-500/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-orange-400 mb-2">💥 确认自爆</h3>
              <p className="text-sm text-nc-text-secondary mb-1">
                {(getPiece(board, skillConfirmTarget)?.type === 'W')
                  ? '女巫将变成骷髅兵，并在左右各召唤 1 个骷髅兵。'
                  : '反女巫将变成反骷髅兵，并在左右各召唤 1 个反骷髅兵。'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmSkill}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 border border-orange-500 transition-all"
                >
                  确认自爆
                </button>
                <button
                  onClick={cancelSkill}
                  className="flex-1 py-2.5 rounded-lg text-sm text-nc-text-secondary hover:text-nc-text border border-nc-violet/20 hover:border-nc-violet/30 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Starship Deploy Dialog */}
      <AnimatePresence>
        {starshipDeployTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-nc-bg-secondary border border-emerald-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-emerald-400 mb-2">🚀 星舰部署</h3>
              <p className="text-sm text-nc-text-secondary mb-4">
                选择要部署的非关键棋子
              </p>
              <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                {['Q','R','B','N','P','T','Y','M','E','L','A','C','W','Z','J','H','X','O'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => confirmStarshipDeploy(opt as PieceType)}
                    className={`px-2 py-2 rounded-lg font-mono font-bold text-sm transition-all border hover:scale-105 ${
                      pieceTierColorMap[opt] || 'text-nc-text'
                    } bg-nc-bg border-nc-violet/10 hover:border-emerald-500/40`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStarshipDeployMode(false)}
                className="mt-4 w-full py-2 rounded-lg text-sm text-nc-text-muted hover:text-nc-text border border-nc-violet/10 hover:border-nc-violet/20 transition-all"
              >
                取消部署
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ostrich → Queen Revert Dialog */}
      <AnimatePresence>
        {ostrichRevertChoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-nc-bg-secondary border border-nc-cyan/30 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-bold text-nc-cyan mb-2">🦢 鸵鸟变回皇后</h3>
              <p className="text-sm text-nc-text-secondary mb-4">
                鸵鸟已移动，是否变回皇后？变回后猫娘将同步变回王。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmOstrichRevert}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-nc-cyan hover:bg-cyan-400 border border-nc-cyan transition-all"
                >
                  变回皇后
                </button>
                <button
                  onClick={cancelOstrichRevert}
                  className="flex-1 py-2.5 rounded-lg text-sm text-nc-text-secondary hover:text-nc-text border border-nc-violet/20 hover:border-nc-violet/30 transition-all"
                >
                  保持鸵鸟
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
