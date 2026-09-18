import { useState } from 'react';
import { L } from '@/lib/translations/manual';

import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { chessPieces, chessSpecialRules } from '@/data/chess';
import { chessPieceTiers, chessDiamondWarning } from '@/data/fragments';
import { Swords, ScrollText, Gem, Shield, AlertTriangle } from 'lucide-react';
import { fullColorizeMultiline, pieceTierColorMap } from '@/lib/highlightUtils';
import { semanticHighlight } from '@/lib/semanticHighlight';

import type { TabKey } from './chessRulesModel';
import { ChessGameBoard } from './ChessGameBoard';
import {
  tierColors,
  tierBgColors,
  tierIcons,
  poisonData,
  cheeseData,
  tabs,
} from './chessRulesModel';

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
            {L("12×12 棋盘 · 融合国际象棋、中国象棋及原创机制\n          ")}</p>
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
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">{L("字母")}</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">{L("名称")}</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">{L("移动")}</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">{L("吃子")}</th>
                    <th className="text-left px-3 sm:px-4 py-3 text-nc-text-muted font-medium">{L("备注")}</th>
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
            <p className="text-xs text-nc-text-muted">{L("* 表示该棋子进入敌方英语（L）十字1-2格禁区会被消灭")}</p>
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
              <h4 className="text-sm font-semibold text-[var(--aurora-brand-amber)] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {L("奶酪规则 —— 当老鼠踏入有奶酪的格子时\n              ")}</h4>
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
                      ? 'bg-[var(--aurora-brand-bg-night)] border-nc-violet/10 hover:border-nc-violet/25'
                      : 'bg-nc-bg-secondary border-[#EF4444]/10 hover:border-[#EF4444]/25'
                  }`}
                >
                  <div className={`px-4 py-3 border-b flex items-center gap-3 ${
                    entry.immune ? 'border-nc-violet/10' : 'border-[#EF4444]/10'
                  }`}>
                    <span className={`inline-block w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                      entry.immune
                        ? 'bg-[var(--aurora-brand-bg-raised)] border-nc-violet/30 text-nc-violet'
                        : 'bg-[var(--aurora-brand-bg-raised)] border-[#EF4444]/30 text-[var(--aurora-brand-red)]'
                    }`}>
                      {entry.immune ? <Shield className="w-4 h-4" /> : entry.letter.split('/')[0]}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-nc-text truncate">{semanticHighlight(entry.piece)}</h3>
                      {!entry.immune && <p className="text-[10px] text-nc-text-muted font-mono truncate">{entry.letter}</p>}
                    </div>
                    {entry.immune && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-nc-violet/15 text-nc-violet font-medium shrink-0">
                        {L("免疫\n                      ")}</span>
                    )}
                  </div>
                  <div className="p-3">
                    {entry.immune ? (
                      <p className="text-xs text-nc-text-muted text-center py-2">{L("不受中毒影响")}</p>
                    ) : (
                      <div className="space-y-1">
                        {entry.levels.map((level, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
                              level === '免疫'
                                ? 'bg-nc-violet/8 text-nc-text'
                                : level === '被移除'
                                ? 'bg-[#EF4444]/15 text-[var(--aurora-brand-red)]'
                                : 'bg-[#EF4444]/6 text-nc-text'
                            }`}
                          >
                            <span className={`inline-block w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                              level === '免疫'
                                ? 'bg-nc-violet/20 text-nc-violet'
                                : level === '被移除'
                                ? 'bg-[#EF4444]/25 text-[var(--aurora-brand-red)]'
                                : 'bg-[#EF4444]/15 text-[var(--aurora-brand-red)]'
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
