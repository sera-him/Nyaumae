import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { characters, type Character } from '@/data/characters';
import { extraCharacters } from '@/data/extraCharacters';
import { characterRelations, relationLabels, relationColors } from '@/data/relationships';
import { stories } from '@/data/stories';
import { getCharacterImageLocal, getCharacterImageSetLocal } from '@/data/characterImages';
import SmartImage from '@/components/SmartImage';
import RotatingImage from '@/components/RotatingImage';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { getTierStyle, getPositionPercent } from '@/lib/fsiiiTiers';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Network, BookOpen, User, FolderKanban, X, EyeOff, ChevronDown } from 'lucide-react';
import { frequencyMeta, loadWordFrequency, wordFrequency } from '@/data/wordFrequency';


export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const all = [...characters, ...extraCharacters] as (Character | typeof extraCharacters[0])[];
  const char = all.find((c) => c.id === id);
  const [showArchive, setShowArchive] = useState(false);
  const [, setFrequencyRevision] = useState(0);

  useEffect(() => {
    if (!showArchive) return;
    let cancelled = false;
    void loadWordFrequency().then(() => {
      if (!cancelled) setFrequencyRevision((revision) => revision + 1);
    }).catch(() => {
      // The archive is supplementary; keep the character page usable if it fails to load.
    });
    return () => { cancelled = true; };
  }, [showArchive]);

  if (!char) {
    return (
      <div className="min-h-screen flex items-center justify-center text-nc-text-muted">
        <div className="text-center">
          <p className="text-lg mb-4">角色未找到</p>
          <Link to="/characters" className="text-nc-cyan hover:underline">
            返回角色总览
          </Link>
        </div>
      </div>
    );
  }

  const isMain = 'group' in char;
  const mainChar = isMain ? (char as Character) : null;
  const localSrc = getCharacterImageLocal(char.id);
  const localImages = getCharacterImageSetLocal(char.id);

  const related = characterRelations.filter((r) => r.from === id || r.to === id);
  const charStories = stories.filter((s) =>
    s.chapters.some((ch) => ch.content.includes(char.name))
  );

  return (
    <div className="aurora-ui aurora-generic-page aurora-detail-page" data-aurora-accent="characters">
      <div className="aurora-container aurora-generic-inner max-w-[900px]">
      <Link
        to="/characters"
        className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回角色总览
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="aurora-detail-hero flex flex-col md:flex-row gap-8 mb-12"
      >
        <div className="shrink-0">
          <div className="aurora-detail-portrait character-detail-portrait-motion w-48 h-48 rounded-2xl overflow-hidden flex items-center justify-center relative">
            {(() => {
              return localImages && localImages.length > 1 ? (
                <RotatingImage
                  localImages={localImages}
                  alt={char.name}
                  containerClassName="w-full h-full"
                  className="object-cover"
                />
              ) : localSrc ? (
                <SmartImage
                  localSrc={localSrc}
                  alt={char.name}
                  containerClassName="w-full h-full"
                  className="object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-nc-text-muted opacity-30" />
              );
            })()}
          </div>
          <p className="text-xs text-nc-text-muted mt-1 text-center">示意图，非立绘</p>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-nc-text mb-1">
            {semanticHighlight(char.name)}
            {mainChar?.pinyin && (
              <span className="text-lg font-normal text-nc-text-muted ml-2">{mainChar.pinyin}</span>
            )}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {mainChar && (
              <>
                <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                  {mainChar.groupLabel}
                </span>
                <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                  {mainChar.approximateAge ? '约 ' : ''}{mainChar.age} 岁
                </span>
                <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                  {mainChar.approximateAge ? '约 ' : ''}公元 {mainChar.birthYear} 年生 {mainChar.birthday ? `· ${mainChar.birthday}` : ''}
                </span>
                {mainChar.giantBirthYear !== undefined && !['miaowu', 'delivery-rider', 'zhouji', 'xiulan'].includes(mainChar.id) && (
                  <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-sky-400/15 text-xs text-sky-300">
                    {mainChar.approximateAge ? '约 ' : ''}大人国 {mainChar.giantBirthYear} 年生
                  </span>
                )}
                {mainChar.fsiii && (() => {
                  const ts = getTierStyle(mainChar.fsiii);
                  const pct = getPositionPercent(mainChar.fsiii);
                  const barGradients: Record<string, string> = {
                    EX: 'linear-gradient(90deg, #e0b0c8, #f5e0b0, #a8d8c0)',
                    SS: 'linear-gradient(90deg, #dcb8c8, #f0d8a8, #c8d8b8)',
                    'S+': 'linear-gradient(90deg, #e0d8a8, #a8d0b8, #a0c8d8)',
                    S: 'linear-gradient(90deg, #e8c0a0, #a8d0b0)',
                    A: 'linear-gradient(90deg, #a8d0b0, #c0b0d8)',
                    B: 'linear-gradient(90deg, #a0c8e0, #c0b0e0)',
                    C: 'linear-gradient(90deg, #c0b0d8, #d8b0c0)',
                    D: 'linear-gradient(90deg, #8890a0, #a090a0)',
                    E: '#687078',
                  };
                  return (
                    <Link
                      to="/math/fsiii"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all hover:scale-105 group"
                      title={`FSIII ${mainChar.fsiii} · 等级 ${ts.tier} · 点击查看完整排名`}
                    >
                      {/* Mini bar */}
                      <span className="w-10 h-1.5 rounded-full bg-nc-bg-tertiary overflow-hidden inline-block relative">
                        <span
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%`, background: barGradients[ts.tier] || '#8B5CF6' }}
                        />
                      </span>
                      <span className={`font-mono font-bold ${ts.scoreClass}`}>{mainChar.fsiii}</span>
                      <span className={`${ts.rankBadgeClass} px-1.5 py-0.5 rounded text-[10px] font-mono`}>{ts.tier}</span>
                    </Link>
                  );
                })()}
              </>
            )}
            {!isMain && 'category' in char && (
              <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                {char.category}
              </span>
            )}
          </div>
          <p className="text-nc-text-secondary leading-relaxed mb-4">{char.bio.replaceAll('巨人国', '大人国')}</p>
          {mainChar?.profile && mainChar.profile.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {mainChar.profile.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + Math.min(index * 0.045, 0.28), duration: 0.35 }}
                  className="character-profile-item rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"
                >
                  <p className="text-[11px] text-nc-text-muted mb-0.5">{item.label.replaceAll('巨人国', '大人国')}</p>
                  <p className="text-sm text-nc-text font-medium">{item.value.replaceAll('巨人国', '大人国')}</p>
                </motion.div>
              ))}
            </div>
          )}
          {id === 'miia' && (
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="inline-flex items-center gap-1.5 text-xs text-nc-text-muted hover:text-nc-gold mb-4 transition-colors group"
            >
              <FolderKanban className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              深层档案
            </button>
          )}
          {mainChar?.extra && (
            <div className="space-y-1">
              {mainChar.extra.filter((ex) => !['miaowu', 'delivery-rider', 'zhouji', 'xiulan'].includes(mainChar.id) || !ex.includes('巨人国')).map((ex, i) => (
                <p key={i} className="text-sm text-nc-text-muted font-mono">{ex}</p>
              ))}
            </div>
          )}

          {/* ASI隐藏档案 — 折叠组件 */}
          {(() => {
            const extra = extraCharacters.find((c) => c.id === id);
            if (!extra?.hidden) return null;
            return <AsiHiddenLog title="系统日志" content={extra.hidden} />;
          })()}
        </div>
      </motion.div>

      {related.length > 0 && (
        <section className="mb-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-nc-text mb-4">
            <Network className="w-5 h-5 text-nc-violet" /> 关联
          </h2>
          <div className="flex flex-wrap gap-3">
            {related.map((r, i) => {
              const otherId = r.from === id ? r.to : r.from;
              const other = all.find((c) => c.id === otherId);
              if (!other) return null;
              return (
                <Link
                  key={i}
                  to={`/characters/${otherId}`}
                  className="character-relation-link motion-signal-card flex items-center gap-2 rounded-xl liquid-glass-subtle border border-white/[0.06] px-3 py-2 hover:border-cyan-400/20 transition-all"
                  data-motion-interactive="true"
                >
                  <span className="text-sm text-nc-text">{semanticHighlight(other.name)}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: relationColors[r.type] + '20',
                      color: relationColors[r.type],
                    }}
                  >
                    {relationLabels[r.type]}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {charStories.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-nc-text mb-4">
            <BookOpen className="w-5 h-5 text-nc-cyan" /> 出场故事
          </h2>
          <div className="space-y-3">
            {charStories.map((s) => (
              <Link
                key={s.id}
                to={`/stories/${s.id}`}
                className="character-story-link motion-signal-card block rounded-xl liquid-glass-subtle border border-white/[0.06] p-4 hover:border-cyan-400/20 transition-all"
                data-motion-interactive="true"
              >
                <h3 className="text-base font-medium text-nc-text mb-1">{s.title}</h3>
                {s.subtitle && <p className="text-sm text-nc-text-secondary">{s.subtitle}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 深层档案 — 词频统计面板 */}
      <AnimatePresence>
        {showArchive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-nc-gold/15 liquid-glass-subtle p-6 glass-highlight glass-shine relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-nc-text-muted flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-nc-gold" />
                  词频统计
                </h3>
                <button
                  onClick={() => setShowArchive(false)}
                  className="text-nc-text-muted hover:text-nc-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-nc-text-muted mb-4 leading-relaxed">
                从当前 {frequencyMeta.sourceItems} 条站内内容实时统计：
                {frequencyMeta.totalWords.toLocaleString('zh-CN')} 次有效用词，
                {frequencyMeta.uniqueWords.toLocaleString('zh-CN')} 个非角色词汇。
                内容更新后刷新页面即可同步，无需再手工生成词频表。
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[400px] overflow-y-auto">
                {wordFrequency.map(({ word, count }) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-nc-bg-tertiary border border-nc-violet/10 text-xs text-nc-text-secondary hover:border-nc-gold/30 hover:text-nc-text transition-colors cursor-default"
                    title={`出现 ${count} 次`}
                  >
                    {word}
                    <span className="text-[11px] text-nc-text-muted">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ASI隐藏档案 — 折叠组件
   ═══════════════════════════════════════════ */

function AsiHiddenLog({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border border-nc-violet/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-nc-text-muted hover:text-nc-text hover:bg-nc-bg-tertiary/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <EyeOff className="w-3 h-3" />
          {title}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-nc-violet/10">
              <div className="text-sm text-nc-text-secondary leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
