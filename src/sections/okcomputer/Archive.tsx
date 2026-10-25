import { useEffect, useMemo, useState } from 'react';
import {
  DIM_LABEL,
  DOMAIN_LIST,
  observations,
  type Dimension,
  type Domain,
} from '@/data/okcomputerObservations';
import { dimTagClass } from './dimStyle';
import { ARCHIVE_REVEAL_EVENT } from './archiveNavigation';

type DimFilter = Dimension | 'ALL';

const dimTabs: DimFilter[] = ['ALL', 'ASD', 'ADHD', 'CROSS', 'META'];

const tabLabel: Record<DimFilter, string> = {
  ALL: '全部 46',
  ASD: '谱系相关',
  ADHD: '多动注意相关',
  CROSS: '交叉共享',
  META: '时间标注',
};

export default function Archive() {
  const [dim, setDim] = useState<DimFilter>('ALL');
  const [domain, setDomain] = useState<Domain | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [showNotes, setShowNotes] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const numericQuery = /^\d{1,2}$/.test(q) ? Number(q) : null;
    return observations.filter((o) => {
      const matchesDim = dim === 'ALL' || o.dim === dim || o.dimSecondary === dim;
      const matchesDomain = domain === 'ALL' || o.domains.includes(domain);
      const matchesQuery =
        !q ||
        (numericQuery !== null
          ? o.id === numericQuery
          : `${o.text} ${o.note} ${o.domains.join(' ')} ${DIM_LABEL[o.dim]}`
              .toLocaleLowerCase()
              .includes(q));
      return matchesDim && matchesDomain && matchesQuery;
    });
  }, [dim, domain, query]);

  const hasFilters = dim !== 'ALL' || domain !== 'ALL' || query.trim().length > 0;

  const resetFilters = () => {
    setDim('ALL');
    setDomain('ALL');
    setQuery('');
  };

  // 其他区块的编号链接会先清除筛选，再定位，避免目标条目被隐藏。
  useEffect(() => {
    const handleReveal = (event: Event) => {
      const id = (event as CustomEvent<number>).detail;
      resetFilters();
      setPendingId(id);
    };
    window.addEventListener(ARCHIVE_REVEAL_EVENT, handleReveal);
    return () => window.removeEventListener(ARCHIVE_REVEAL_EVENT, handleReveal);
  }, []);

  useEffect(() => {
    if (pendingId === null) return;
    const element = document.getElementById(`obs-${pendingId}`);
    if (!element) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      element.focus({ preventScroll: true });
      setHighlighted(pendingId);
      setPendingId(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingId, list]);

  useEffect(() => {
    if (highlighted === null) return;
    const timer = window.setTimeout(() => setHighlighted(null), 1800);
    return () => window.clearTimeout(timer);
  }, [highlighted]);

  return (
    <section id="archive" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex items-baseline gap-4">
          <span className="font-mono2 text-[12px] uppercase tracking-[0.25em] text-mute">
            02 — Archive
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-inkstrong md:text-4xl">
            逐条档案
          </h2>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-6 text-mute">
          原文与整理注解分开呈现。可搜索编号或关键词、按维度与功能域筛选，也可切换成低干扰的纯原文模式。
        </p>

        {/* 搜索与阅读模式 */}
        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="archive-search" className="sr-only">
              搜索档案
            </label>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                id="archive-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setQuery('');
                }}
                placeholder="搜索编号、原文或关键词，如“启动”“08”"
                autoComplete="off"
                className="min-h-[48px] w-full border border-line bg-cardok py-3 pl-11 pr-12 text-[15px] text-inkstrong placeholder:text-mute focus:border-acc focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="清除搜索"
                  className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-mute transition-colors hover:text-acc-deep"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex border border-line bg-cream p-1" role="group" aria-label="阅读模式">
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              aria-pressed={showNotes}
              className={`min-h-[44px] flex-1 whitespace-nowrap px-4 font-mono2 text-[12px] tracking-wider transition-colors lg:flex-none ${
                showNotes ? 'bg-inkstrong text-cardok' : 'text-ink hover:bg-paper'
              }`}
            >
              原文 + 对照
            </button>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              aria-pressed={!showNotes}
              className={`min-h-[44px] flex-1 whitespace-nowrap px-4 font-mono2 text-[12px] tracking-wider transition-colors lg:flex-none ${
                !showNotes ? 'bg-inkstrong text-cardok' : 'text-ink hover:bg-paper'
              }`}
            >
              仅原文
            </button>
          </div>
        </div>

        {/* 维度筛选 */}
        <div className="mt-4 flex flex-wrap gap-1 border border-line bg-cream p-1" role="group" aria-label="按维度筛选">
          {dimTabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDim(t)}
              aria-pressed={dim === t}
              className={`min-h-[44px] px-3 font-mono2 text-[12px] tracking-wider transition-colors md:px-4 ${
                dim === t
                  ? 'bg-inkstrong text-cardok'
                  : 'text-ink hover:bg-paper focus-visible:bg-paper'
              }`}
            >
              {tabLabel[t]}
            </button>
          ))}
        </div>

        {/* 功能域筛选 */}
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="按功能域筛选">
          <button
            type="button"
            onClick={() => setDomain('ALL')}
            aria-pressed={domain === 'ALL'}
            className={`min-h-[44px] border px-3 font-mono2 text-[12px] tracking-wider transition-colors ${
              domain === 'ALL'
                ? 'border-acc bg-tint text-acc-deep'
                : 'border-line bg-cardok text-mute hover:border-mute hover:text-ink'
            }`}
          >
            全部功能域
          </button>
          {DOMAIN_LIST.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(domain === d ? 'ALL' : d)}
              aria-pressed={domain === d}
              className={`min-h-[44px] border px-3 font-mono2 text-[12px] tracking-wider transition-colors ${
                domain === d
                  ? 'border-acc bg-tint text-acc-deep'
                  : 'border-line bg-cardok text-mute hover:border-mute hover:text-ink'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="mt-4 flex min-h-[36px] flex-wrap items-center justify-between gap-2">
          <p className="font-mono2 text-[12px] tracking-wider text-mute" aria-live="polite">
            {list.length} / 46 条{query.trim() && ` · 搜索“${query.trim()}”`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[44px] px-2 font-mono2 text-[12px] tracking-wider text-acc-deep underline decoration-line underline-offset-4 transition-colors hover:decoration-acc"
            >
              重置筛选
            </button>
          )}
        </div>

        {/* 档案卡列表 */}
        {list.length > 0 && (
          <div className="mt-2 grid gap-px border border-line bg-line lg:grid-cols-2">
            {list.map((o) => (
              <article
                key={o.id}
                id={`obs-${o.id}`}
                tabIndex={-1}
                aria-label={`第 ${o.id} 条观察`}
                className={`scroll-mt-28 bg-cardok p-5 outline-none transition-colors md:p-6 ${
                  highlighted === o.id ? 'bg-cream ring-2 ring-inset ring-acc' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono2 shrink-0 text-xl font-semibold tracking-tight text-acc-deep">
                    {String(o.id).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 font-mono2 text-[12px] tracking-wider ${dimTagClass[o.dim]}`}
                      >
                        {DIM_LABEL[o.dim]}
                      </span>
                      {o.dimSecondary && (
                        <span
                          className={`px-2 py-0.5 font-mono2 text-[12px] tracking-wider ${dimTagClass[o.dimSecondary]}`}
                        >
                          次 · {DIM_LABEL[o.dimSecondary]}
                        </span>
                      )}
                      {o.domains.map((dm) => (
                        <span
                          key={dm}
                          className="border border-line px-2 py-0.5 font-mono2 text-[12px] tracking-wider text-mute"
                        >
                          {dm}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[15px] leading-7 text-inkstrong">
                      {o.text}
                    </p>
                    {showNotes && (
                      <p className="mt-3 border-t border-line pt-3 text-[13px] leading-6 text-mute">
                        <span className="font-mono2 mr-1.5 text-[12px] tracking-wider text-acc-deep">
                          整理线索 · 非证据
                        </span>
                        {o.note}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {list.length === 0 && (
          <div className="mt-2 border border-line bg-cardok p-8 text-center">
            <p className="text-sm text-ink">当前条件下没有匹配条目。</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 min-h-[44px] px-4 font-mono2 text-[12px] tracking-wider text-acc-deep underline decoration-line underline-offset-4 hover:decoration-acc"
            >
              清除条件并显示全部
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
