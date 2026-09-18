import { useEffect } from 'react';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { AnimatePresence, motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMusic } from '@/contexts/MusicContext';
import { useLocation, useNavigate } from 'react-router';
import { characters } from '@/data/characters';
import { charactersEn } from '@/data/characters.en';
import { extraCharacters } from '@/data/extraCharacters';
import { extraCharactersEn } from '@/data/extraCharacters.en';
import { getCharacterCardImageLocal, getCharacterImageLocal, getCharacterImageSetLocal } from '@/data/characterImages';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { getTierStyle } from '@/lib/fsiiiTiers';
import SmartImage from '@/components/SmartImage';
import RotatingImage from '@/components/RotatingImage';
import ParticleField from '@/components/ParticleField';
import CharacterNetwork from '@/sections/CharacterNetwork';
import { Link } from 'react-router';
import { ArrowRight, Network, Sparkles, Users } from 'lucide-react';
import { AuroraPage, AuroraPanel, AuroraSectionHeading, AuroraStat } from '@/components/aurora';

const FILTER_MAP: Record<string, string> = {
  all: 'all',
  'mia-family': 'mia',
  zhehua: 'zhihua',
  yin: 'impact',
  delansi: 'delan',
  'grownup-country': 'giant',
  other: 'other',
};

const filtersZh = [
  { key: 'all', label: '全部' },
  { key: 'mia-family', label: 'M/I/A 家族' },
  { key: 'zhehua', label: '哲华系' },
  { key: 'yin', label: '因派系' },
  { key: 'delansi', label: '德澜思拓' },
  { key: 'grownup-country', label: '大人国篇' },
  { key: 'other', label: '其他' },
];

const filtersEn = [
  { key: 'all', label: 'All' },
  { key: 'mia-family', label: 'M/I/A Family' },
  { key: 'zhehua', label: 'Zhehua line' },
  { key: 'yin', label: 'Yin faction' },
  { key: 'delansi', label: 'Delanstor' },
  { key: 'grownup-country', label: 'Giant Country arc' },
  { key: 'other', label: 'Other' },
];

const groupColors: Record<string, string> = {
  mia: 'from-violet-500 to-fuchsia-500',
  zhihua: 'from-indigo-500 to-violet-500',
  impact: 'from-cyan-500 to-teal-500',
  delan: 'from-pink-500 to-rose-500',
  giant: 'from-sky-500 to-cyan-500',
  other: 'from-amber-500 to-orange-500',
};

const groupLabelColors: Record<string, string> = {
  mia: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
  zhihua: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  impact: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  delan: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  giant: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  other: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

export default function CharactersPage() {
  const { ref, isVisible } = useScrollReveal();
  const { playTrack, currentTrack, isMuted } = useMusic();
  const location = useLocation();
  const navigate = useNavigate();
  const _en = getLocale() === 'en';
  const source = _en ? charactersEn : characters;
  const extras = _en ? extraCharactersEn : extraCharacters;
  const filters = _en ? filtersEn : filtersZh;
  const filterParam = new URLSearchParams(location.search).get('group') ?? 'all';
  const activeFilterKey = FILTER_MAP[filterParam] ? filterParam : 'all';
  const activeFilter = FILTER_MAP[activeFilterKey];

  useEffect(() => {
    if (isVisible && !isMuted && currentTrack !== '/audio/stars.mp3') {
      playTrack('/audio/stars.mp3');
    }
  }, [currentTrack, isMuted, isVisible, playTrack]);

  const selectFilter = (filter: string) => {
    const params = new URLSearchParams(location.search);
    if (filter === 'all') params.delete('group');
    else params.set('group', filter);
    navigate({ pathname: '/characters', search: params.toString() ? `?${params.toString()}` : '' });
  };

  const filtered = activeFilter === 'all'
    ? source
    : source.filter((c) => c.group === activeFilter);

  return (
    <AuroraPage accent="characters" className="aurora-content-page characters-aurora-page">
      <section className="characters-aurora-main">
        <div className="characters-star-field" aria-hidden="true"><ParticleField type="stars" density={25} /></div>
        <div ref={ref} className="aurora-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="aurora-content-hero characters-hero"
          >
            <div className="aurora-content-copy">
              <p className="aurora-eyebrow">02 / CONSCIOUSNESS INDEX</p>
              <h1 className="aurora-title">{L("角色档案")}</h1>
              <p className="aurora-lead">{source.length} {L("位主角色与 ")}{extras.length} {L("位补充意识体，在不同神经频率上留下各自的存在痕迹。")}</p>
              <div className="aurora-hero-signal"><Users /><span>CHARACTER ARCHIVE ONLINE</span><ArrowRight /></div>
            </div>
            <AuroraPanel className="aurora-hero-stats">
              <AuroraStat label="MAIN CHARACTERS" value={source.length} />
              <AuroraStat label="EXTRA MINDS" value={extras.length} />
              <AuroraStat label="TOTAL SIGNALS" value={source.length + extras.length} />
            </AuroraPanel>
          </motion.div>

          <AuroraPanel className="characters-filter-panel">
            <div className="characters-filter-copy">
              <span>ARCHIVE FILTER</span>
              <p>{L("角色图片为示意图，非立绘")}</p>
            </div>
            <div className="aurora-tabs characters-filter-tabs" role="tablist" aria-label={L("角色阵营筛选")}>
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => selectFilter(f.key)}
                  role="tab"
                  aria-selected={activeFilterKey === f.key}
                  className="aurora-tab"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="characters-era-note"><Sparkles /><span><strong>{L("双纪年基准：")}</strong>{L("公元 2026 年 = 大人国 169 年；大人国纪年 = 公元纪年 − 1857。")}</span></div>
          </AuroraPanel>

          <h2 className="sr-only">{L("角色列表")}</h2>
          <div className="characters-aurora-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((char, i) => (
                <motion.div
                  layout="position"
                  key={char.id}
                  initial={{ opacity: 0, y: 16, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.25), ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/characters/${char.id}`}
                    className="character-aurora-card motion-signal-card group"
                    data-motion-interactive="true"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      {(() => {
                        const locSrc = getCharacterCardImageLocal(char.id);
                        const localImages = getCharacterImageSetLocal(char.id);
                        return localImages && localImages.length > 1 ? (
                          <RotatingImage
                            localImages={localImages}
                            alt={char.name}
                            containerClassName="absolute inset-0"
                            className="character-card-image object-cover"
                          />
                        ) : locSrc ? (
                          <SmartImage
                            localSrc={locSrc}
                            alt={char.name}
                            containerClassName="absolute inset-0"
                            className="character-card-image object-cover"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${char.color} flex items-center justify-center`}>
                            <span className="text-4xl font-bold text-white/80">{char.name.slice(0, 1)}</span>
                          </div>
                        );
                      })()}
                      <div className={`absolute inset-0 bg-gradient-to-t ${groupColors[char.group]} opacity-0 group-hover:opacity-20 group-focus-visible:opacity-20 transition-opacity`} />
                    </div>
                    <div className="character-aurora-card-copy">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-nc-text truncate">
                          {semanticHighlight(char.name)}
                        </h3>
                        {char.fsiii ? (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getTierStyle(char.fsiii).rankBadgeClass}`}>
                            {char.fsiii}
                          </span>
                        ) : (
                          <span className="text-[10px] text-nc-text-muted font-mono">
                            {char.approximateAge ? (_en ? '~' : '约 ') : ''}{char.age} {L("岁\n                          ")}</span>
                        )}
                      </div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${groupLabelColors[char.group]}`}>
                        {char.groupLabel}
                      </span>
                    </div>
                    <span className="character-card-signal" aria-hidden="true" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 补充角色 */}
          <div className="characters-extra-section">
            <AuroraSectionHeading eyebrow="SUPPLEMENTARY MINDS" title={L("补充角色")} description={_en ? 'Minds that wander outside the main factions, yet still connect with the world.' : '游离于主要阵营之外，但依然与世界产生联系的意识体。'} />
            <div className="characters-aurora-grid">
              {extras.map((char, i) => {
                const localSrc = getCharacterImageLocal(char.id);
                return (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to={`/characters/${char.id}`}
                      className="character-aurora-card motion-signal-card group"
                      data-motion-interactive="true"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        {localSrc ? (
                          <SmartImage
                            localSrc={localSrc}
                            alt={char.name}
                            containerClassName="absolute inset-0"
                            className="character-card-image object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-nc-bg-secondary flex items-center justify-center">
                            <span className="text-nc-text-muted text-xs">{L("暂无图片")}</span>
                          </div>
                        )}
                      </div>
                      <div className="character-aurora-card-copy">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-nc-text truncate">{char.name}</h3>
                          {char.fsiii && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getTierStyle(char.fsiii).rankBadgeClass}`}>
                              {char.fsiii}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-nc-text-muted bg-nc-bg-tertiary px-2 py-0.5 rounded-full">
                          {L(char.category)}
                        </span>
                      </div>
                      <span className="character-card-signal" aria-hidden="true" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 角色关系网络 */}
      <section className="characters-network-section">
        <div className="aurora-container">
          <AuroraSectionHeading className="characters-network-heading" eyebrow="RELATIONSHIP MAP" title={L("角色关系网络")} description={<span><Network className="inline w-4 h-4 mr-2" />{L("每一个节点都在回应另一个意识体。")}</span>} />
          <AuroraPanel className="characters-network-panel"><CharacterNetwork /></AuroraPanel>
        </div>
      </section>
    </AuroraPage>
  );
}
