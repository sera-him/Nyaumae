import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import { characters, type Character } from '@/data/characters';
import { extraCharacters } from '@/data/extraCharacters';
import { characterRelations, relationLabels, relationColors } from '@/data/relationships';
import { stories } from '@/data/stories';
import { getStoryCover } from '@/data/storyCovers';
import { getCharacterImageLocal, getCharacterImageSetLocal } from '@/data/characterImages';
import SmartImage from '@/components/SmartImage';
import RotatingImage from '@/components/RotatingImage';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { getTierStyle, getPositionPercent } from '@/lib/fsiiiTiers';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Network, BookOpen, User, FolderKanban, X, EyeOff, ChevronDown, Images, Fingerprint } from 'lucide-react';
import './CharacterDetail.css';
import WordFrequencyCloud from '@/components/WordFrequencyCloud';
import WordFrequencyTable from '@/components/WordFrequencyTable';
import WordFrequencyDetailedList from '@/components/WordFrequencyDetailedList';
import { frequencyMeta, getWordFrequencyClouds, getWordFrequencyDetailed, loadWordFrequency, type WordFreqDetailed } from '@/data/wordFrequency';

const DEFAULT_WORD_CLOUD_ALPHA = 1.35;

function isDeepArchiveUrl(id: string | undefined, search: string, hash: string): boolean {
  if (id !== 'miia') return false;
  return new URLSearchParams(search).get('archive') === '1' || hash === '#deep-archive';
}


export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const all = [...characters, ...extraCharacters] as (Character | typeof extraCharacters[0])[];
  const char = all.find((c) => c.id === id);
  const archiveUrl = isDeepArchiveUrl(id, location.search, location.hash);
  const [showArchive, setShowArchive] = useState(() => {
    if (typeof window === 'undefined') return false;
    return archiveUrl;
  });
  // Open the archive when the URL starts asking for it (e.g. ?archive=1#deep-archive)
  // while this page stays mounted; re-render adjustment instead of a setState effect.
  const [prevArchiveUrl, setPrevArchiveUrl] = useState(archiveUrl);
  if (archiveUrl !== prevArchiveUrl) {
    setPrevArchiveUrl(archiveUrl);
    if (archiveUrl) setShowArchive(true);
  }
  const [frequencyClouds, setFrequencyClouds] = useState(getWordFrequencyClouds);
  const [frequencyDetailed, setFrequencyDetailed] = useState<WordFreqDetailed[]>(() => getWordFrequencyDetailed());
  const [freqMode, setFreqMode] = useState<'simple' | 'detailed'>('simple');
  const [alphaText, setAlphaText] = useState(String(DEFAULT_WORD_CLOUD_ALPHA));
  const [alpha, setAlpha] = useState(DEFAULT_WORD_CLOUD_ALPHA);

  const parsedAlpha = Number(alphaText.trim());
  const alphaInputIsValid = alphaText.trim() !== '' && Number.isFinite(parsedAlpha);
  const rangeAlpha = Math.min(2, Math.max(1, alpha));

  const handleAlphaInputChange = (value: string) => {
    setAlphaText(value);
    if (value.trim() !== '' && Number.isFinite(Number(value))) setAlpha(Number(value));
  };

  const handleAlphaInputBlur = () => {
    if (!alphaInputIsValid) setAlphaText(String(alpha));
  };

  const handleAlphaRangeChange = (value: string) => {
    const nextAlpha = Number(value);
    setAlpha(nextAlpha);
    setAlphaText(String(nextAlpha));
  };

  useEffect(() => {
    if (!showArchive) return;
    let cancelled = false;
    void loadWordFrequency().then(() => {
      if (!cancelled) {
        setFrequencyClouds(getWordFrequencyClouds());
        setFrequencyDetailed(getWordFrequencyDetailed());
      }
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
        className="tap-safe inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 返回角色总览
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="char-hero mb-10"
      >
        {localSrc && (
          <div className="char-hero-backdrop" aria-hidden="true">
            <SmartImage
              localSrc={localSrc}
              alt=""
              containerClassName="w-full h-full"
              className="object-cover"
              loading="eager"
            />
          </div>
        )}
        <div className="char-hero-content">
          <div className="shrink-0">
            <div className="char-portrait character-detail-portrait-motion">
              {localImages && localImages.length > 1 ? (
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
                  loading="eager"
                />
              ) : (
                <User className="w-16 h-16 text-nc-text-muted opacity-30" />
              )}
            </div>
            <p className="text-xs text-nc-text-muted mt-2 text-center">示意图，非立绘</p>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-nc-text mb-1">
              {semanticHighlight(char.name)}
              {mainChar?.pinyin && (
                <span className="text-lg font-normal text-nc-text-muted ml-2">{mainChar.pinyin}</span>
              )}
            </h1>
            {(mainChar?.title || char.alias) && (
              <p className="text-sm text-nc-text-muted mb-3">
                {[mainChar?.title, char.alias && char.alias !== char.name ? char.alias : null].filter(Boolean).join(' · ')}
              </p>
            )}
          <div className="flex flex-wrap gap-2 mb-4">
            {mainChar && (
              <>
                <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                  {mainChar.groupLabel}
                </span>
                <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                  {mainChar.approximateAge ? '约 ' : ''}{mainChar.age} 岁
                </span>
                {mainChar.birthYear !== null && (
                  <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                    {mainChar.approximateAge ? '约 ' : ''}公元 {mainChar.birthYear} 年生 {mainChar.birthday ? `· ${mainChar.birthday}` : ''}
                  </span>
                )}
                {mainChar.birthYear === null && (
                  <span className="px-3 py-1 rounded-full liquid-glass-subtle border border-white/[0.06] text-xs text-nc-text-secondary">
                    年龄只是形象年龄
                  </span>
                )}
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
          <p className="text-nc-text-secondary leading-relaxed">{char.bio.replaceAll('巨人国', '大人国')}</p>
          </div>
        </div>
      </motion.div>

      {mainChar?.profile && mainChar.profile.length > 0 && (
        <section className="char-section">
          <h2 className="char-section-title">
            <Fingerprint className="w-5 h-5 text-nc-cyan" /> 档案
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {mainChar.profile.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + Math.min(index * 0.04, 0.28), duration: 0.35 }}
                className="character-profile-item rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3"
              >
                <p className="text-[11px] text-nc-text-muted mb-1">{item.label.replaceAll('巨人国', '大人国')}</p>
                <p className="text-sm text-nc-text font-medium">{item.value.replaceAll('巨人国', '大人国')}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {(id === 'miia' || mainChar?.extra || extraCharacters.find((c) => c.id === id)?.hidden) && (
        <section className="char-section">
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
        </section>
      )}

      {localImages && localImages.length > 1 && (
        <section className="char-section">
          <h2 className="char-section-title">
            <Images className="w-5 h-5 text-nc-violet" /> 形象图集
          </h2>
          <div className="char-gallery-grid">
            {localImages.map((src, i) => (
              <div key={src} className="char-gallery-item">
                <SmartImage
                  localSrc={src}
                  alt={`${char.name} 形象 ${i + 1}`}
                  containerClassName="w-full h-full"
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="char-section">
          <h2 className="char-section-title">
            <Network className="w-5 h-5 text-nc-violet" /> 关联
          </h2>
          <div className="char-relation-grid">
            {related.map((r, i) => {
              const otherId = r.from === id ? r.to : r.from;
              const other = all.find((c) => c.id === otherId);
              if (!other) return null;
              const otherImage = getCharacterImageLocal(otherId);
              return (
                <Link
                  key={i}
                  to={`/characters/${otherId}`}
                  className="char-relation-card"
                  data-motion-interactive="true"
                >
                  <span className="char-relation-avatar">
                    {otherImage ? (
                      <SmartImage
                        localSrc={otherImage}
                        alt={other.name}
                        containerClassName="w-full h-full"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-nc-text-muted opacity-40" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-nc-text truncate">{semanticHighlight(other.name)}</span>
                    <span
                      className="inline-block mt-1 text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: relationColors[r.type] + '20',
                        color: relationColors[r.type],
                      }}
                    >
                      {relationLabels[r.type]}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {charStories.length > 0 && (
        <section className="char-section">
          <h2 className="char-section-title">
            <BookOpen className="w-5 h-5 text-nc-cyan" /> 出场故事
          </h2>
          <div className="char-story-grid">
            {charStories.map((s) => {
              const cover = getStoryCover(s.id);
              return (
                <Link
                  key={s.id}
                  to={`/stories/${s.id}`}
                  className="char-story-card"
                  data-motion-interactive="true"
                >
                  {cover && (
                    <SmartImage
                      localSrc={cover}
                      alt={s.title}
                      containerClassName="char-story-cover"
                      className="object-cover w-full h-full"
                    />
                  )}
                  <span className="char-story-body block">
                    <h3 className="text-base font-medium text-nc-text mb-1">{s.title}</h3>
                    {s.subtitle && <p className="text-sm text-nc-text-secondary">{s.subtitle}</p>}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 深层档案 — 词频统计面板 */}
      <AnimatePresence>
        {showArchive && (
          <motion.div
            id="deep-archive"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-nc-gold/15 p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-nc-text-muted flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-nc-gold" />
                  词云与月
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
                {frequencyMeta.uniqueWords.toLocaleString('zh-CN')} 个唯一词汇。
                这张 WordClouds 风格的词云与月覆盖完整词频集；文字实际面积按“词频^alpha”分配。
              </p>
              <div className="word-frequency-alpha-control" aria-label="词云与月面积权重控制">
                <div className="word-frequency-alpha-heading">
                  <label htmlFor="word-frequency-alpha-range">面积权重 alpha</label>
                  <output htmlFor="word-frequency-alpha-range">当前 {alpha}</output>
                </div>
                <input
                  id="word-frequency-alpha-range"
                  type="range"
                  min="1"
                  max="2"
                  step="0.01"
                  value={rangeAlpha}
                  onChange={(event) => handleAlphaRangeChange(event.target.value)}
                  aria-label="alpha 滑条范围 1 到 2"
                />
                <div className="word-frequency-alpha-input-row">
                  <label htmlFor="word-frequency-alpha-input">自定义 alpha</label>
                  <input
                    id="word-frequency-alpha-input"
                    type="text"
                    inputMode="text"
                    value={alphaText}
                    onChange={(event) => handleAlphaInputChange(event.target.value)}
                    onBlur={handleAlphaInputBlur}
                    aria-invalid={!alphaInputIsValid}
                  />
                </div>
              </div>
              <div className="space-y-6 mb-5">
                <WordFrequencyCloud
                  id="all-word-cloud"
                  title="总云图"
                  entries={frequencyClouds.all}
                  alpha={alpha}
                  shape="wordclouds"
                  shapeLabel="WordClouds 风格自然词团"
                  emptyText="正在自动生成总云图"
                />
              </div>
              <div className="word-frequency-mode-switch" role="group" aria-label="词频明细模式">
                <button type="button" className={freqMode === 'simple' ? 'is-active' : ''} onClick={() => setFreqMode('simple')}>简洁</button>
                <button type="button" className={freqMode === 'detailed' ? 'is-active' : ''} onClick={() => setFreqMode('detailed')}>详细</button>
              </div>
              {freqMode === 'simple' ? (
                <WordFrequencyTable entries={frequencyClouds.all} />
              ) : (
                <WordFrequencyDetailedList entries={frequencyDetailed} />
              )}
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
