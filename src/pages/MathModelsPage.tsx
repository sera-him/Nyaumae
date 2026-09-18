import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { useParams, useNavigate } from 'react-router';
import { FunctionSquare, BarChart3, TrendingUp, Calculator, Scale } from 'lucide-react';
import { Link } from 'react-router';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { characters } from '@/data/characters';
import { extraCharacters } from '@/data/extraCharacters';
import { charactersEn } from '@/data/characters.en';
import { extraCharactersEn } from '@/data/extraCharacters.en';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { getTierStyle, getPositionPercent } from '@/lib/fsiiiTiers';
import type { Tier } from '@/lib/fsiiiTiers';
import HeightWeightChart from '@/sections/HeightWeightChart';
import FLAModel from '@/sections/FLAModel';
import { gaoKaoVolunteerRule } from '@/data/extraStories';
import { gaoKaoVolunteerRuleEn } from '@/data/extraStories.en';
import '@/styles/math-terminal.css';

/* ═══════════════════════════════════════════════
   ANIMATION STYLES
   ═══════════════════════════════════════════════ */

const ANIM_STYLES = `
  @keyframes ex-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes glow-ex {
    0%,100%{ box-shadow: 0 0 6px rgba(224,176,200,0.35), 0 0 12px rgba(245,224,176,0.25), 0 0 24px rgba(176,216,192,0.18); filter: brightness(1); }
    50%{ box-shadow: 0 0 14px rgba(224,176,200,0.65), 0 0 28px rgba(245,224,176,0.5), 0 0 48px rgba(176,216,192,0.35); filter: brightness(1.15); }
  }
  @keyframes glow-ss {
    0%,100%{ box-shadow: 0 0 5px rgba(220,184,200,0.3), 0 0 10px rgba(240,216,168,0.2); filter: brightness(1); }
    50%{ box-shadow: 0 0 12px rgba(220,184,200,0.55), 0 0 24px rgba(240,216,168,0.4); filter: brightness(1.12); }
  }
  @keyframes glow-sp {
    0%,100%{ box-shadow: 0 0 4px rgba(224,216,168,0.25), 0 0 8px rgba(168,208,184,0.18); filter: brightness(1); }
    50%{ box-shadow: 0 0 9px rgba(224,216,168,0.5), 0 0 18px rgba(168,208,184,0.35); filter: brightness(1.08); }
  }
  @keyframes glow-s {
    0%,100%{ box-shadow: 0 0 4px rgba(232,192,160,0.18); filter: brightness(1); }
    50%{ box-shadow: 0 0 8px rgba(232,192,160,0.4); filter: brightness(1.05); }
  }
  @keyframes glow-a {
    0%,100%{ box-shadow: 0 0 3px rgba(168,208,176,0.15); filter: brightness(1); }
    50%{ box-shadow: 0 0 7px rgba(168,208,176,0.35); filter: brightness(1.03); }
  }
  @keyframes sweep-ex  { 0%{left:-30%;opacity:0;} 15%{opacity:0.5;} 85%{opacity:0.5;} 100%{left:130%;opacity:0;} }
  @keyframes sweep-ss  { 0%{left:-30%;opacity:0;} 15%{opacity:0.4;} 85%{opacity:0.4;} 100%{left:130%;opacity:0;} }
  @keyframes sweep-sp  { 0%{left:-30%;opacity:0;} 15%{opacity:0.3;} 85%{opacity:0.3;} 100%{left:130%;opacity:0;} }
  @keyframes sweep-s   { 0%{left:-30%;opacity:0;} 15%{opacity:0.2;} 85%{opacity:0.2;} 100%{left:130%;opacity:0;} }
  @keyframes sweep-a   { 0%{left:-30%;opacity:0;} 15%{opacity:0.12;} 85%{opacity:0.12;} 100%{left:130%;opacity:0;} }
  @keyframes float-up {
    0%   { transform: translateY(0) scale(1); opacity: 0.8; }
    100% { transform: translateY(-14px) scale(0.2); opacity: 0; }
  }
`;

const TIER_GRADIENTS: Record<Tier, string> = {
  EX:  'linear-gradient(90deg, #e0b0c8, #f5e0b0, #e8c8a8, #a8d8c0, #b0d0e8, #c8b8d8, #e0b0c8)',
  SS:  'linear-gradient(90deg, #dcb8c8, #f0d8a8, #c8d8b8, #a8c8d8, #c0b8d8)',
  'S+':'linear-gradient(90deg, #e0d8a8, #a8d0b8, #a0c8d8, #c0b0d0)',
  S:   'linear-gradient(90deg, #e8c0a0, #e0d0a0, #a8d0b0)',
  A:   'linear-gradient(90deg, #a8d0b0, #a0c8d8, #c0b0d8)',
  B:   'linear-gradient(90deg, #a0c8e0, #c0b0e0)',
  C:   'linear-gradient(90deg, #c0b0d8, #d8b0c0)',
  D:   'linear-gradient(90deg, #8890a0, #a090a0)',
  E:   '#687078',
};

interface TierAnim {
  glow?: string; glowDur?: string;
  sweep?: string; sweepDur?: string;
  particles: number;
  particleColor: string;
}

const TIER_ANIM: Record<Tier, TierAnim> = {
  EX:  { glow:'glow-ex',  glowDur:'2s',   sweep:'sweep-ex',  sweepDur:'2.2s',  particles:5, particleColor:'rgba(240,200,160,0.5)' },
  SS:  { glow:'glow-ss',  glowDur:'2.2s', sweep:'sweep-ss',  sweepDur:'2.6s',  particles:4, particleColor:'rgba(220,160,180,0.4)' },
  'S+':{ glow:'glow-sp',  glowDur:'2.5s', sweep:'sweep-sp',  sweepDur:'3s',    particles:3, particleColor:'rgba(160,200,180,0.35)' },
  S:   { glow:'glow-s',   glowDur:'3s',   sweep:'sweep-s',   sweepDur:'3.4s',  particles:2, particleColor:'rgba(220,180,140,0.25)' },
  A:   { glow:'glow-a',   glowDur:'3.5s', sweep:'sweep-a',   sweepDur:'4s',    particles:1, particleColor:'rgba(140,200,220,0.2)' },
  B:   { particles:0, particleColor:'' },
  C:   { particles:0, particleColor:'' },
  D:   { particles:0, particleColor:'' },
  E:   { particles:0, particleColor:'' },
};

const AXIS_TICKS = [85, 100, 115, 130, 145, 160, 175, 190, 205, 220, 235];

function ParticleStrip({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  const particles = Array.from({ length: count }, (_, i) => ({
    left: `${10 + (i * (80 / Math.max(count - 1, 1)))}%`,
    delay: `${i * 0.4 + ((i * 17 + count * 7) % 30) / 100}s`,
    size: `${2 + ((i * 13 + count * 5) % 20) / 10}px`,
    duration: `${2 + ((i * 19 + count * 3) % 10) / 10}s`,
  }));
  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute top-1/2 rounded-full pointer-events-none"
          style={{
            left: p.left, width: p.size, height: p.size,
            background: color,
            boxShadow: `0 0 ${parseInt(p.size) * 2}px ${color}`,
            animation: `float-up ${p.duration} ease-out ${p.delay} infinite`,
            transform: 'translateY(-50%)',
          }}
        />
      ))}
    </>
  );
}

interface FsiiiItem {
  id: string;
  name: string;
  score: number;
}

const tabs = [
  { key: 'fsiii', label: 'FSIII 排名', icon: BarChart3 },
  { key: 'fla', label: 'PEMS-L FLA', icon: Scale },
  { key: 'height-weight', label: '身高体重模型', icon: TrendingUp },
];

/* ═══════════════════════════════════════════════
   FSIII Sub-tab Content
   ═══════════════════════════════════════════════ */

function FsiiiTab() {
  const { ref, isVisible } = useScrollReveal();
  const _en = getLocale() === 'en';

  const aiIds = new Set(['damocles', 'eirene', 'zero', 'gpt']);

  const roster = _en ? charactersEn : characters;
  const rosterExtras = _en ? extraCharactersEn : extraCharacters;

  const allItems: FsiiiItem[] = [
    ...roster.filter((c) => c.fsiii !== undefined)
      .map((c) => ({ id: c.id, name: c.name, score: c.fsiii! })),
    ...rosterExtras.filter((c) => c.fsiii !== undefined)
      .map((c) => ({ id: c.id, name: c.name, score: c.fsiii! })),
  ].sort((a, b) => b.score - a.score);

  const avg = allItems.reduce((sum, c) => sum + c.score, 0) / allItems.length;
  const nonAiItems = allItems.filter((c) => !aiIds.has(c.id));
  const avgNonAi = nonAiItems.length > 0
    ? nonAiItems.reduce((sum, c) => sum + c.score, 0) / nonAiItems.length
    : 0;

  return (
    <div>
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <FunctionSquare className="w-8 h-8 text-nc-cyan" />
            <h2 className="text-3xl sm:text-4xl font-bold text-nc-text tracking-wide">
              {semanticHighlight('FSIII 排名')}
            </h2>
          </div>
          <p className="text-nc-text-secondary text-lg">
            {_en
              ? <>Rational skeleton · {allItems.length} entities · mean {avg.toFixed(1)} (ex-AI: {avgNonAi.toFixed(1)})</>
              : <>理性骨架 · {allItems.length} 个意识体 · 均值 {avg.toFixed(1)}（不含AI: {avgNonAi.toFixed(1)}）</>}
          </p>
          <p className="text-nc-text-muted text-xs mt-2">
            {L("排名 1：Damocles 1314 | 排名 2：Eirene 831 | 排名 3：咪呀 226 · Līlā 226 | 排名 5：あいえふちゃん 180 | 排名 6：墨问 177\r\n          ")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
          className="liquid-glass-subtle border border-white/[0.06] rounded-2xl p-6 mb-10 glass-highlight glass-shine relative"
        >
          <h3 className="text-lg font-semibold text-nc-text mb-3">{L("FSIII 公式")}</h3>
          <p className="text-sm text-nc-text-muted mb-4">
            {_en
              ? "Full Scale Intrinsic Intelligence Index — in short FS3, because III literally is the number 3."
              : L("Full Scale Intrinsic Intelligence Index（全量内在智力指数），也可以叫 FS3，因为 III 就是 3。")}</p>
          <div className="bg-nc-bg rounded-xl p-6 text-center">
            <code className="font-mono text-xl sm:text-2xl text-nc-text-secondary">
              FSIII = 100 + (FSIQ - 85)(FSIQ - 115) / (15√2)
            </code>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25 }}
          className="fsiii-ranking-panel liquid-glass-subtle border border-white/[0.06] rounded-2xl overflow-hidden glass-highlight glass-shine relative math-terminal-panel"
          data-motion-loop
        >
          <div className="px-6 py-4 border-b border-nc-violet/10 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-nc-text-secondary" />
            <h3 className="text-lg font-semibold text-nc-text">{L("FSIII 角色排名")}</h3>
            <span className="text-xs text-nc-text-muted ml-2">{L("全部 ")}{allItems.length} {L("个角色")}</span>
            <span className="ml-auto math-model-badge">MODEL / FSIII-01</span>
          </div>

          <div className="p-6 overflow-x-auto">
            <div className="min-w-[700px]">
              <style>{ANIM_STYLES}</style>

              <div className="flex items-end mb-2 relative" style={{ marginLeft: '120px' }}>
                <div className="absolute bottom-0 left-0 right-0 h-px border-t border-dashed border-slate-600/30" />
                {AXIS_TICKS.map((tick) => {
                  const isMajor = tick % 30 === 0 || tick === 85 || tick === 235;
                  return (
                    <div
                      key={tick}
                      className={`absolute bottom-0 flex flex-col items-center ${isMajor ? 'math-axis-major' : 'math-axis-minor'}`}
                      style={{ left: `${getPositionPercent(tick)}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`tick-line ${isMajor ? '' : ''}`} />
                      <span className={`tick-label ${isMajor ? 'opacity-100' : 'opacity-40 text-[8px]'}`}>{tick}</span>
                    </div>
                  );
                })}
                <div
                  className="absolute bottom-0 z-10 flex items-center justify-center rounded"
                  style={{
                    left: `${getPositionPercent(235) - 3}%`,
                    width: '6%',
                    height: '14px',
                    background: 'linear-gradient(90deg, #1a1b35, #252545, #1a1b35)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                  }}
                >
                  <span className="text-[8px] text-nc-violet/60 font-mono tracking-wider">MAX</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {allItems.map((item, i) => {
                  const style = getTierStyle(item.score);
                  const tier = style.tier;
                  const isOverflow = item.score > 235;
                  const barRight = getPositionPercent(item.score);
                  const anim = TIER_ANIM[tier];
                  const gradient = TIER_GRADIENTS[tier];
                  const isEX = tier === 'EX';
                  const hasGlow = anim.glow;

                  return (
                    <div key={item.id} className="fsiii-rank-row flex items-center h-8">
                      <div className="w-[120px] shrink-0 text-right pr-3 flex items-center justify-end gap-2">
                        <span className="text-[10px] font-mono text-nc-text-muted w-4">{i + 1}</span>
                        <Link
                          to={`/characters/${item.id}`}
                          className="fsiii-character-link text-sm text-nc-text hover:text-nc-cyan transition-colors truncate"
                        >
                          {semanticHighlight(item.name)}
                        </Link>
                      </div>

                      <div className="flex-1 relative h-full flex items-center">
                        <div className="absolute left-0 right-[5%] top-1/2 -translate-y-1/2 h-px border-t border-dashed border-slate-600/20" />
                        <div className="absolute top-0 bottom-0 w-px bg-slate-500/20" style={{ right: '5%' }} />

                        <div
                          className="fsiii-score-bar absolute left-0 top-1/2 h-2.5 rounded-r-full"
                          style={{
                            width: `${barRight}%`,
                            transform: 'translateY(-50%)',
                            background: gradient,
                            backgroundSize: isEX ? '200% 100%' : undefined,
                            animation: isEX
                              ? `ex-shimmer 3s linear infinite, ${anim.glow} ${anim.glowDur} ease-in-out infinite`
                              : hasGlow
                                ? `${anim.glow} ${anim.glowDur} ease-in-out infinite`
                                : undefined,
                          }}
                        >
                          {anim.sweep && (
                            <div className="absolute inset-0 rounded-r-full overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 w-[25%] rounded-full"
                                style={{
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                  animation: `${anim.sweep} ${anim.sweepDur} linear infinite`,
                                }}
                              />
                            </div>
                          )}
                          <ParticleStrip count={anim.particles} color={anim.particleColor} />
                        </div>

                        <span
                          className={`absolute top-1/2 text-xs font-mono font-bold ${style.scoreClass}`}
                          style={{ left: `${barRight}%`, transform: 'translateY(-50%) translateX(8px)' }}
                        >
                          {item.score}
                          {isOverflow && <span className="ml-0.5 text-[9px]">&#128293;</span>}
                        </span>
                      </div>

                      <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded ${style.rankBadgeClass}`}>
                        {tier}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-nc-text-muted">{L("显示全部 ")}{allItems.length} {L("个角色")}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="liquid-glass-subtle border border-white/[0.06] rounded-2xl p-6 mt-10 glass-highlight glass-shine relative"
        >
          <h3 className="text-lg font-semibold text-nc-text mb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-nc-cyan" />
            {_en ? 'Independent rank-position model for gaokao application choices' : L("高考志愿独立位次模型")}</h3>
          <p className="text-sm text-nc-text-secondary leading-relaxed whitespace-pre-wrap">
            {semanticHighlight(_en ? gaoKaoVolunteerRuleEn : gaoKaoVolunteerRule)}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function MathModelsPage() {
  const { section = 'fsiii' } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const activeTab = section;
  const _en = getLocale() === 'en';

  return (
    <div className="aurora-ui aurora-generic-page math-aurora-page" data-aurora-accent="math">
      <section className="aurora-generic-inner">
        <div className="aurora-container">
          {/* Page Header */}
          <div className="aurora-simple-hero">
            <p className="aurora-eyebrow">05 / COGNITION MODELS</p>
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="w-8 h-8 text-nc-cyan" />
              <h1 className="aurora-title">
                MathModels
              </h1>
            </div>
            <p className="text-nc-text-secondary">
              {_en ? 'Math models, ranking systems and quantitative analysis' : L("数学模型、排名系统与量化分析")}</p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="aurora-tabs mb-8" role="tablist" aria-label={L("数学模型章节")}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => navigate(`/math/${tab.key}`, { replace: true })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/math/${tab.key}`, { replace: true });
                    }
                  }}
                  role="tab" aria-selected={isActive} className="aurora-tab inline-flex items-center gap-1.5"
                >
                  <Icon className="w-4 h-4" />
                  {L(tab.label)}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="aurora-legacy-content">{activeTab === 'fsiii' && <FsiiiTab />}
          {activeTab === 'height-weight' && (
            <div className="max-w-[1100px] mx-auto">
              <HeightWeightChart />
            </div>
          )}
          {activeTab === 'fla' && <FLAModel />}</div>
        </div>
      </section>
    </div>
  );
}
