import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  Gamepad2,
  Globe2,
  History,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Swords,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { getPopularWords, getRelatedWords, type WordFreq } from '@/data/wordFrequency';
import type { FullSearchItem } from '@/data/fullSearchIndex';
import {
  ANALYTICS_DATA_EVENT,
  ANALYTICS_STORAGE_KEY,
  readSearchHistory,
  recordSearch,
  type AnalyticsSearch,
} from '@/lib/analytics';
import {
  LAST_VIEWED_DATA_EVENT,
  LAST_VIEWED_HISTORY_STORAGE_KEY,
  readLastViewedHistory,
  type LastViewedEntry,
} from '@/lib/lastViewed';
import { loadSearchData } from '@/lib/searchDataLoader';
import { useSearchSession } from '@/hooks/useSearchSession';
import './CodexPage.css';

type SearchIndexModule = Awaited<ReturnType<typeof loadSearchData>>;
type SearchResult = { item: FullSearchItem; score: number };
type ContentGroupKey = 'all' | 'stories' | 'characters' | 'world' | 'games' | 'other';
type ConcreteContentGroupKey = Exclude<ContentGroupKey, 'all'>;

interface ContentGroup {
  key: ConcreteContentGroupKey;
  label: string;
  description: string;
  icon: LucideIcon;
  categories: readonly string[];
}

const contentGroups: ContentGroup[] = [
  { key: 'stories', label: '故事', description: '章节与叙事内容', icon: BookOpen, categories: ['故事'] },
  { key: 'characters', label: '角色', description: '人物与关系资料', icon: User, categories: ['角色'] },
  { key: 'world', label: '世界观', description: '设定、词典与档案', icon: Globe2, categories: ['设定', '词典'] },
  { key: 'games', label: '游戏', description: '游戏、规则与棋子', icon: Gamepad2, categories: ['游戏', '棋子'] },
  { key: 'other', label: '其他', description: '技能与页面索引', icon: Sparkles, categories: ['技能', '页面'] },
];

const categoryIcons: Record<string, LucideIcon> = {
  角色: User,
  故事: BookOpen,
  技能: Sparkles,
  设定: Settings,
  棋子: Swords,
  词典: BookMarked,
  页面: Globe2,
  游戏: Gamepad2,
};

const domainLabels: Record<LastViewedEntry['domain'], string> = {
  stories: '故事',
  characters: '角色',
  world: '世界观',
};

const searchExamples = [
  '咪呀是谁？',
  '猫鼠迷踪怎么玩？',
  '世界观里有哪些区域？',
  '谁和小满关系最好？',
];

const anchorRoutes: Record<string, string> = {
  hero: '/',
  footer: '/',
  worldview: '/world/overview',
  characters: '/characters',
  'extra-characters': '/characters?group=other',
  'character-network': '/characters',
  stories: '/stories',
  'extra-stories': '/miia/world',
  'miia-world': '/miia/world',
  'miia-math-notes': '/miia/math',
  organizations: '/world/organizations',
  'prime-focus': '/world/prime-focus',
  'world-settings': '/world/settings',
  dictionary: '/world/dictionary',
  qet: '/world/qet',
  timeline: '/world/timeline',
  math: '/math/fsiii',
  'math-models': '/math/fsiii',
  chess: '/playground/games/compound-chess',
  'chess-rules': '/playground/games/compound-chess',
  'skill-ttt': '/playground/games/skill-tic-tac-toe',
  'skill-tic-tac-toe': '/playground/games/skill-tic-tac-toe',
  problems: '/playground/games/quiz',
  overload: '/world/settings',
};

function resolveRoute(item: FullSearchItem): string {
  const { id, href } = item;

  if (id.startsWith('char_')) return `/characters/${id.slice('char_'.length)}`;
  if (id.startsWith('extra_char_')) return '/characters';
  if (id.startsWith('story_')) return `/stories/${id.slice('story_'.length)}`;
  if (id.startsWith('fsiii_')) return '/math/fsiii';
  if (id.startsWith('miia_')) return '/miia/world';

  const anchor = href.replace('#', '');
  if (anchorRoutes[anchor]) return anchorRoutes[anchor];
  if (anchor.startsWith('dict-') || anchor.startsWith('term-')) return `/world/dictionary?target=${anchor}`;
  if (anchor.startsWith('poison-')) return `/playground/games/compound-chess?target=${anchor}`;
  if (anchor.startsWith('ttt-')) return `/playground/games/skill-tic-tac-toe?target=${anchor}`;
  if (/^(setting-|autism-|caregiver-|moral-|qet-)/.test(anchor)) return `/world/settings?target=${anchor}`;
  if (/^(formula-|model-)/.test(anchor)) return `/math/fsiii?target=${anchor}`;
  if (anchor.startsWith('chess-')) return `/playground/games/compound-chess?target=${anchor}`;
  if (href.startsWith('/')) return href;
  return `/${anchor}`;
}

function getSnippet(content: string, query: string, maxLength = 210): string {
  const normalizedContent = content.toLocaleLowerCase('zh-CN');
  const words = query.toLocaleLowerCase('zh-CN').trim().split(/[\s·.,，。！？：；/()（）-]+/).filter(Boolean);
  const matchIndex = words.reduce((best, word) => {
    const index = normalizedContent.indexOf(word);
    if (index < 0) return best;
    return best < 0 ? index : Math.min(best, index);
  }, -1);
  const start = matchIndex < 0 ? 0 : Math.max(0, matchIndex - 48);
  const end = Math.min(content.length, start + maxLength);
  return `${start > 0 ? '…' : ''}${content.slice(start, end)}${end < content.length ? '…' : ''}`;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/[\s·.,，。！？：；/()（）-]+/).filter(Boolean);
  if (words.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return <>{text.split(pattern).map((part, index) => words.some((word) => word.toLocaleLowerCase('zh-CN') === part.toLocaleLowerCase('zh-CN')) ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>)}</>;
}

function getScoreLabel(score: number): string {
  if (score >= 1400) return '完全匹配';
  if (score >= 850) return '短语匹配';
  if (score >= 700) return '前缀匹配';
  if (score >= 500) return '标题匹配';
  if (score >= 400) return '整词匹配';
  if (score >= 250) return '内容匹配';
  if (score >= 100) return '模糊匹配';
  return '相关内容';
}

function discoveryOrder(id: string, seed: number): number {
  let value = seed + 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    value ^= id.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function getContentGroup(category: string): ContentGroup | undefined {
  return contentGroups.find((group) => group.categories.includes(category));
}

function isInGroup(item: FullSearchItem, groupKey: ContentGroupKey): boolean {
  if (groupKey === 'all') return true;
  return getContentGroup(item.category)?.key === groupKey;
}

function formatSearchTime(timestamp: number): string {
  const age = Math.max(0, Date.now() - timestamp);
  if (age < 60_000) return '刚刚';
  if (age < 3_600_000) return `${Math.floor(age / 60_000)} 分钟前`;
  if (age < 86_400_000) return `${Math.floor(age / 3_600_000)} 小时前`;
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(timestamp);
}

export default function CodexPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { query, setQuery, status: sharedStatus, resultCount: sharedResultCount, setSearchState } = useSearchSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const inputWrapRef = useRef<HTMLLabelElement>(null);
  const inputSentinelRef = useRef<HTMLDivElement>(null);
  const resultButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastUrlQueryRef = useRef(new URLSearchParams(location.search).get('q') ?? '');
  const [searchIndex, setSearchIndex] = useState<SearchIndexModule | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popularWords, setPopularWords] = useState<WordFreq[]>([]);
  const [recentSearches, setRecentSearches] = useState<AnalyticsSearch[]>(() => (
    typeof window === 'undefined' ? [] : readSearchHistory(8)
  ));
  const [lastViewed, setLastViewed] = useState<LastViewedEntry[]>(() => (
    typeof window === 'undefined' ? [] : readLastViewedHistory(6)
  ));
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ContentGroupKey>('all');
  const [visibleResultCount, setVisibleResultCount] = useState(20);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const [isInputPinned, setIsInputPinned] = useState(false);
  const trimmedQuery = query.trim();

  useEffect(() => {
    const urlQuery = new URLSearchParams(location.search).get('q') ?? '';
    lastUrlQueryRef.current = urlQuery;
    const frame = window.requestAnimationFrame(() => {
      if (urlQuery !== query) setQuery(urlQuery);
    });
    return () => window.cancelAnimationFrame(frame);
    // URL changes are authoritative; query edits are synchronized by the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, setQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === lastUrlQueryRef.current) return;
      lastUrlQueryRef.current = query;
      const params = new URLSearchParams();
      if (trimmedQuery) params.set('q', trimmedQuery);
      navigate({ pathname: '/codex', search: params.toString() ? `?${params}` : '' }, { replace: true });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [navigate, query, trimmedQuery]);

  useEffect(() => {
    let cancelled = false;
    setSearchState({ status: 'loading', resultCount: null });
    void loadSearchData().then((module) => {
      if (cancelled) return;
      setSearchIndex(module);
      setPopularWords(getPopularWords(24));
      setLoadError(false);
    }).catch(() => {
      if (!cancelled) {
        setLoadError(true);
        setSearchState({ status: 'error', resultCount: null });
      }
    });
    return () => { cancelled = true; };
  }, [loadAttempt, setSearchState]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!trimmedQuery) {
        setResults([]);
        setSearchedQuery('');
        setActiveFilter('all');
        setVisibleResultCount(20);
        setActiveResultIndex(-1);
        setSearchState({ status: 'idle', resultCount: 0 });
        return;
      }
      if (!searchIndex) return;
      setSearchState({ status: 'loading', resultCount: null });
      const effectiveQuery = trimmedQuery.toLocaleLowerCase('zh-CN') === 'sera-him' ? `${query} nyaum忙` : query;
      const nextResults = searchIndex.fullTextSearch(effectiveQuery);
      if (!cancelled) {
        setResults(nextResults);
        setSearchedQuery(trimmedQuery);
        setActiveFilter('all');
        setVisibleResultCount(20);
        setActiveResultIndex(-1);
        recordSearch(trimmedQuery, nextResults.length);
        setRecentSearches(readSearchHistory(8));
        setSearchState({ status: 'success', resultCount: nextResults.length });
      }
    }, trimmedQuery ? 80 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, searchIndex, setSearchState, trimmedQuery]);

  useEffect(() => {
    const refreshSearchHistory = () => setRecentSearches(readSearchHistory(8));
    const refreshLastViewed = () => setLastViewed(readLastViewedHistory(6));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ANALYTICS_STORAGE_KEY) refreshSearchHistory();
      if (event.key === LAST_VIEWED_HISTORY_STORAGE_KEY) refreshLastViewed();
    };

    window.addEventListener(ANALYTICS_DATA_EVENT, refreshSearchHistory);
    window.addEventListener(LAST_VIEWED_DATA_EVENT, refreshLastViewed);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(ANALYTICS_DATA_EVENT, refreshSearchHistory);
      window.removeEventListener(LAST_VIEWED_DATA_EVENT, refreshLastViewed);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const updatePinnedState = () => {
      const sentinel = inputSentinelRef.current;
      const workspace = workspaceRef.current;
      const inputWrap = inputWrapRef.current;
      if (!sentinel || !workspace || !inputWrap) return;

      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const stickyTop = (window.innerWidth <= 700 ? 3.65 : 4.15) * rootFontSize;
      const shouldPin = sentinel.getBoundingClientRect().top <= stickyTop
        && workspace.getBoundingClientRect().bottom > stickyTop + inputWrap.offsetHeight + 4;
      setIsInputPinned((current) => current === shouldPin ? current : shouldPin);
    };

    const initialFrame = window.requestAnimationFrame(updatePinnedState);
    window.addEventListener('scroll', updatePinnedState, { passive: true });
    window.addEventListener('resize', updatePinnedState);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener('scroll', updatePinnedState);
      window.removeEventListener('resize', updatePinnedState);
    };
  }, []);

  const relatedWords = useMemo(() => {
    if (!trimmedQuery || searchedQuery !== trimmedQuery || results.length === 0) return [];
    return getRelatedWords(query, 8);
  }, [query, results.length, searchedQuery, trimmedQuery]);

  const groupCounts = useMemo(() => {
    const counts = new Map<ContentGroupKey, number>(contentGroups.map((group) => [group.key, 0]));
    if (!searchIndex) return counts;
    for (const item of searchIndex.fullSearchIndex) {
      const group = getContentGroup(item.category);
      if (group) counts.set(group.key, (counts.get(group.key) ?? 0) + 1);
    }
    return counts;
  }, [searchIndex]);

  const resultGroupSummary = useMemo(() => {
    const counts = new Map<ContentGroupKey, number>(contentGroups.map((group) => [group.key, 0]));
    results.forEach(({ item }) => {
      const group = getContentGroup(item.category);
      if (group) counts.set(group.key, (counts.get(group.key) ?? 0) + 1);
    });
    return contentGroups.filter((group) => (counts.get(group.key) ?? 0) > 0).map((group) => ({
      ...group,
      count: counts.get(group.key) ?? 0,
    }));
  }, [results]);

  const filteredResults = useMemo(() => (
    activeFilter === 'all' ? results : results.filter(({ item }) => isInGroup(item, activeFilter))
  ), [activeFilter, results]);

  const browseResults = useMemo(() => {
    if (!searchIndex || activeFilter === 'all') return [];
    return searchIndex.fullSearchIndex
      .filter((item) => isInGroup(item, activeFilter))
      .map((item) => ({ item, score: 0 }));
  }, [activeFilter, searchIndex]);

  const visibleEntries = useMemo(() => (
    (trimmedQuery ? filteredResults : browseResults).slice(0, visibleResultCount)
  ), [browseResults, filteredResults, trimmedQuery, visibleResultCount]);

  const allEntries = trimmedQuery ? filteredResults : browseResults;
  const isSearching = Boolean(trimmedQuery && (!searchIndex || searchedQuery !== trimmedQuery));
  const hasQueryResults = Boolean(trimmedQuery && results.length > 0);
  const hasBrowseResults = Boolean(!trimmedQuery && activeFilter !== 'all' && browseResults.length > 0);
  const filterCounts = trimmedQuery
    ? resultGroupSummary
    : contentGroups.filter((group) => (groupCounts.get(group.key) ?? 0) > 0).map((group) => ({
      ...group,
      count: groupCounts.get(group.key) ?? 0,
    }));

  const randomDiscoveries = useMemo(() => {
    if (!searchIndex) return [];
    const candidates = searchIndex.fullSearchIndex.filter((item) => ['故事', '角色', '设定'].includes(item.category));
    return [...candidates]
      .sort((left, right) => discoveryOrder(left.id, randomSeed) - discoveryOrder(right.id, randomSeed))
      .slice(0, 4);
  }, [randomSeed, searchIndex]);

  useEffect(() => {
    if (activeResultIndex < 0) return;
    resultButtonRefs.current[activeResultIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeResultIndex]);

  const openResult = useCallback((item: FullSearchItem) => {
    if (item.href.startsWith('http')) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(resolveRoute(item));
  }, [navigate]);

  const runSearch = useCallback((nextQuery: string) => {
    setActiveFilter('all');
    setActiveResultIndex(-1);
    setQuery(nextQuery);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [setQuery]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setActiveFilter('all');
    setActiveResultIndex(-1);
    inputRef.current?.focus();
  }, [setQuery]);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (query) clearSearch();
      else setActiveFilter('all');
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (visibleEntries.length === 0) return;
      event.preventDefault();
      setActiveResultIndex((current) => {
        if (event.key === 'ArrowDown') return current < visibleEntries.length - 1 ? current + 1 : 0;
        return current > 0 ? current - 1 : visibleEntries.length - 1;
      });
      return;
    }

    if (event.key === 'Enter' && activeResultIndex >= 0 && visibleEntries[activeResultIndex]) {
      event.preventDefault();
      openResult(visibleEntries[activeResultIndex].item);
    }
  }, [activeResultIndex, clearSearch, openResult, query, visibleEntries]);

  const renderResultList = (entries: SearchResult[]) => (
    <div className="full-search-results" id="full-search-results-list" role="listbox" aria-label="搜索结果">
      {entries.map(({ item, score }, index) => {
        const Icon = categoryIcons[item.category] ?? Search;
        const resultId = `full-search-result-${index}`;
        return <button
          type="button"
          className={`full-search-result${activeResultIndex === index ? ' is-active' : ''}`}
          id={resultId}
          role="option"
          aria-selected={activeResultIndex === index}
          key={`${item.id}-${index}`}
          ref={(node) => { resultButtonRefs.current[index] = node; }}
          onMouseEnter={() => setActiveResultIndex(index)}
          onFocus={() => setActiveResultIndex(index)}
          onClick={() => openResult(item)}
        >
          <span className={`full-search-result-icon category-${item.category}`}><Icon size={18} /></span>
          <span className="full-search-result-copy">
            <span className="full-search-result-heading"><strong><HighlightText text={item.title} query={query} /></strong><small>{item.category} · {score ? getScoreLabel(score) : '内容浏览'}</small></span>
            <span className="full-search-result-snippet"><HighlightText text={getSnippet(item.content, query)} query={query} /></span>
          </span>
          <ArrowUpRight className="full-search-result-open" size={17} aria-hidden="true" />
        </button>;
      })}
    </div>
  );

  const statusText = loadError
    ? '搜索索引加载失败，可重新加载。'
    : isSearching
      ? '正在搜索共享索引……'
      : trimmedQuery
        ? `${filteredResults.length}${activeFilter === 'all' ? '' : ` 个${contentGroups.find((group) => group.key === activeFilter)?.label ?? ''}`}结果 · 按匹配度排序`
        : searchIndex
          ? `${searchIndex.fullSearchIndex.length} 条内容已就绪 · 支持自然语言、别名与模糊匹配`
          : '正在准备全站搜索……';

  const searchInputElement = (
    <label ref={inputWrapRef} className={`full-search-input-wrap${isInputPinned ? ' is-pinned' : ''}`}>
      <Search size={23} aria-hidden="true" />
      <span className="full-search-visually-hidden">搜索全站内容</span>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="搜索人物、故事、设定、游戏……"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="full-search-results-list"
        aria-expanded={visibleEntries.length > 0}
        aria-activedescendant={activeResultIndex >= 0 ? `full-search-result-${activeResultIndex}` : undefined}
      />
      {query && <button type="button" onClick={clearSearch} aria-label="清除搜索内容"><X size={18} /></button>}
    </label>
  );

  return <main className="full-search-page">
    <div className="full-search-ambient" aria-hidden="true"><span /><span /><span /></div>
    <div className="full-search-shell">
      <header className="full-search-hero">
        <div>
          <p className="full-search-eyebrow"><span>SEARCH / ALL CONTENT</span> 全站搜索</p>
          <h1>全站搜索</h1>
          <p>从故事、角色、世界观和游戏中，找到一个人、一段设定或一个可以继续探索的入口。</p>
        </div>
        <div className="full-search-index-stat" aria-label={searchIndex ? `已载入 ${searchIndex.fullSearchIndex.length} 条内容` : '正在载入全站内容'}>
          <strong>{searchIndex ? searchIndex.fullSearchIndex.length : '—'}</strong>
          <span>条索引内容</span>
          <small>共享站内搜索数据</small>
        </div>
      </header>

      <section ref={workspaceRef} className="full-search-workspace" aria-label="全站搜索">
        <div ref={inputSentinelRef} className={`full-search-input-sentinel${isInputPinned ? ' is-active' : ''}`} aria-hidden="true" />
        {!isInputPinned && searchInputElement}
        {isInputPinned && typeof document !== 'undefined' ? createPortal(searchInputElement, document.body) : null}

        <div className="full-search-meta-line" aria-live="polite">
          <span>{sharedStatus === 'loading' ? '搜索中' : sharedStatus === 'error' ? '搜索异常' : '全站索引'}</span>
          <small>{statusText}{sharedResultCount !== null && trimmedQuery && sharedResultCount !== filteredResults.length ? ` · ${sharedResultCount} 条总结果` : ''}</small>
        </div>

        {loadError ? <div className="full-search-state" role="alert">
          <Search size={32} />
          <h2>全站内容加载失败</h2>
          <p>搜索索引暂时不可用，可以立即重试。</p>
          <button type="button" onClick={() => { setLoadError(false); setLoadAttempt((value) => value + 1); }}>重新加载</button>
        </div> : !searchIndex || isSearching ? <div className="full-search-state" role="status">
          <Loader2 className="full-search-spinner" size={32} />
          <h2>{trimmedQuery ? '正在搜索全站内容' : '正在载入全站索引'}</h2>
          <p>故事、角色、设定、词典和游戏资料正在汇入同一个结果列表。</p>
        </div> : (hasQueryResults || hasBrowseResults) ? <div className="full-search-results-wrap">
          {trimmedQuery.toLocaleLowerCase('zh-CN') === 'sera-him' && <div className="full-search-easter"><strong>发现彩蛋</strong><span>sera-him → nyaum忙</span></div>}
          <div className="full-search-refine">
            <div className="full-search-refine-heading">
              <span><BarChart3 size={14} /> {trimmedQuery ? '结果分布' : '按内容筛选'}</span>
              <small>{trimmedQuery ? '点击分类只看对应结果' : `从 ${searchIndex.fullSearchIndex.length} 条索引中继续浏览`}</small>
            </div>
            <div className="full-search-filter-chips">
              <button type="button" className={`full-search-filter-chip${activeFilter === 'all' ? ' is-active' : ''}`} aria-pressed={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); setActiveResultIndex(-1); }}>
                全部<small>{trimmedQuery ? results.length : searchIndex.fullSearchIndex.length}</small>
              </button>
              {filterCounts.map((group) => {
                const Icon = group.icon;
                return <button type="button" className={`full-search-filter-chip${activeFilter === group.key ? ' is-active' : ''}`} aria-pressed={activeFilter === group.key} key={group.key} onClick={() => { setActiveFilter(group.key); setActiveResultIndex(-1); setVisibleResultCount(20); }}>
                  <Icon size={13} /> {group.label}<small>{group.count}</small>
                </button>;
              })}
            </div>
            {trimmedQuery && relatedWords.length > 0 && <div className="full-search-related">
              <span>高频关联</span>
              <div>{relatedWords.map((word) => <button type="button" key={word.word} onClick={() => runSearch(word.word)}>{word.word}<small>{word.count}</small></button>)}</div>
            </div>}
          </div>

          <div className="full-search-results-toolbar">
            <span>{activeFilter === 'all' ? (trimmedQuery ? `找到 ${results.length} 个结果` : '全部索引内容') : `正在浏览「${contentGroups.find((group) => group.key === activeFilter)?.label}」`}</span>
            <small>已显示 {Math.min(visibleResultCount, allEntries.length)} / {allEntries.length} · ↑↓ 选择，Enter 打开</small>
          </div>

          {visibleEntries.length > 0 ? renderResultList(visibleEntries) : <div className="full-search-state full-search-filter-empty">
            <Search size={28} />
            <h2>这个分类没有匹配结果</h2>
            <p>换一个内容分类，或恢复查看全部结果。</p>
            <button type="button" onClick={() => setActiveFilter('all')}>查看全部结果</button>
          </div>}

          {visibleEntries.length < allEntries.length && <div className="full-search-load-more">
            <button type="button" onClick={() => setVisibleResultCount((count) => count + 20)}>继续加载 <span>{Math.min(visibleResultCount + 20, allEntries.length)} / {allEntries.length}</span></button>
          </div>}
        </div> : trimmedQuery ? <div className="full-search-state">
          <Search size={32} />
          <h2>没有找到“{trimmedQuery}”</h2>
          <p>可以缩短句子、换用人物别名，或从下面的搜索示例重新开始。</p>
          <button type="button" onClick={clearSearch}>查看探索入口</button>
        </div> : <div className="full-search-discovery">
          <section className="full-search-section full-search-explore-section" aria-labelledby="full-search-explore-title" data-testid="full-search-category-explore">
            <div className="full-search-section-heading">
              <div><span className="full-search-section-kicker">01 / CONTENT MAP</span><h2 id="full-search-explore-title">按内容探索</h2></div>
              <small>{searchIndex.fullSearchIndex.length} 条索引</small>
            </div>
            <div className="full-search-category-grid">
              {contentGroups.map((group) => {
                const Icon = group.icon;
                return <button type="button" className="full-search-category-card" key={group.key} onClick={() => { setActiveFilter(group.key); setVisibleResultCount(20); }}>
                  <span className="full-search-category-card-icon"><Icon size={18} /></span>
                  <span><strong>{group.label}</strong><small>{group.description}</small></span>
                  <b>{groupCounts.get(group.key) ?? 0}</b>
                </button>;
              })}
            </div>
          </section>

          <div className="full-search-discovery-columns">
            <section className="full-search-section full-search-module" aria-labelledby="full-search-recent-title" data-testid="full-search-recent-searches">
              <div className="full-search-section-heading"><div><span className="full-search-section-kicker">02 / LOCAL MEMORY</span><h2 id="full-search-recent-title">最近搜索</h2></div><History size={16} /></div>
              {recentSearches.length > 0 ? <div className="full-search-history-list">
                {recentSearches.map((entry) => <button type="button" className="full-search-history-item" key={`${entry.query}-${entry.at}`} onClick={() => runSearch(entry.query)}>
                  <span className="full-search-history-icon"><Clock3 size={14} /></span>
                  <span><strong>{entry.query}</strong><small>{entry.resultCount} 条结果 · {formatSearchTime(entry.at)}</small></span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>)}
              </div> : <p className="full-search-module-empty">这里会显示本机搜索过的词，一键即可重新搜索。</p>}
            </section>

            <section className="full-search-section full-search-module" aria-labelledby="full-search-examples-title" data-testid="full-search-examples">
              <div className="full-search-section-heading"><div><span className="full-search-section-kicker">03 / TRY A QUESTION</span><h2 id="full-search-examples-title">试试这样搜</h2></div><Sparkles size={16} /></div>
              <div className="full-search-example-list">
                {searchExamples.map((example) => <button type="button" key={example} onClick={() => runSearch(example)}><span>“{example}”</span><ArrowUpRight size={14} aria-hidden="true" /></button>)}
              </div>
            </section>
          </div>

          <div className="full-search-discovery-columns">
            <section className="full-search-section full-search-module" aria-labelledby="full-search-continue-title" data-testid="full-search-continue-browsing">
              <div className="full-search-section-heading"><div><span className="full-search-section-kicker">04 / PICK UP</span><h2 id="full-search-continue-title">继续浏览</h2></div><BookOpen size={16} /></div>
              {lastViewed.length > 0 ? <div className="full-search-history-list">
                {lastViewed.slice(0, 4).map((entry) => <button type="button" className="full-search-history-item" key={`${entry.path}-${entry.viewedAt}`} onClick={() => navigate(entry.path)}>
                  <span className={`full-search-history-icon domain-${entry.domain}`}><BookOpen size={14} /></span>
                  <span><strong>{entry.label}</strong><small>{domainLabels[entry.domain]} · {formatSearchTime(entry.viewedAt)}</small></span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>)}
              </div> : <p className="full-search-module-empty">打开故事、角色或世界设定后，它们会出现在这里。</p>}
            </section>

            <section className="full-search-section full-search-module" aria-labelledby="full-search-random-title" data-testid="full-search-random-discovery">
              <div className="full-search-section-heading"><div><span className="full-search-section-kicker">05 / SERENDIPITY</span><h2 id="full-search-random-title">随机发现</h2></div><button type="button" className="full-search-icon-button" onClick={() => setRandomSeed((seed) => seed + 1)} aria-label="换一组随机发现"><RefreshCw size={15} /></button></div>
              <div className="full-search-random-list">
                {randomDiscoveries.map((item) => <button type="button" className="full-search-random-item" key={item.id} onClick={() => openResult(item)}>
                  <span className={`full-search-random-dot category-${item.category}`} />
                  <span><strong>{item.title}</strong><small>{getContentGroup(item.category)?.label ?? item.category}</small></span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </button>)}
              </div>
            </section>
          </div>

          <section className="full-search-section full-search-popular-section" aria-labelledby="full-search-popular-title" data-testid="full-search-popular-words">
            <div className="full-search-section-heading"><div><span className="full-search-section-kicker">06 / FREQUENCY</span><h2 id="full-search-popular-title">高频词</h2></div><button type="button" className="full-search-expand-button" onClick={() => setShowAllPopular((value) => !value)}>{showAllPopular ? '收起' : '展开全部'} {showAllPopular ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>
            <div className="full-search-popular-tags">
              {popularWords.slice(0, showAllPopular ? popularWords.length : 10).map((word) => <button type="button" key={word.word} onClick={() => runSearch(word.word)} title={`全站出现 ${word.count} 次`}><span>{word.word}</span><small>{word.count}</small></button>)}
            </div>
          </section>
        </div>}
      </section>
    </div>
  </main>;
}
