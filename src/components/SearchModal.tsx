import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, BookOpen, Sparkles, Settings, Swords, BookMarked, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getPopularWords, getRelatedWords, loadWordFrequency, type WordFreq } from '@/data/wordFrequency';

interface FullSearchItem {
  id: string;
  title: string;
  content: string;
  category: string;
  href: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  '角色': User, '故事': BookOpen, '技能': Sparkles,
  '设定': Settings, '棋子': Swords, '词典': BookMarked, '页面': BookOpen,
};

const categoryColors: Record<string, string> = {
  '角色': 'bg-nc-cyan/15 text-nc-cyan',
  '故事': 'bg-nc-rose/15 text-nc-rose',
  '技能': 'bg-nc-gold/15 text-nc-gold',
  '设定': 'bg-nc-violet/15 text-nc-violet',
  '棋子': 'bg-orange-500/15 text-orange-400',
  '词典': 'bg-green-500/15 text-green-400',
  '页面': 'bg-blue-500/15 text-blue-400',
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getSnippet(content: string, query: string, maxLen = 80): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/[\s·.\-—]+/).filter(w => w.length > 0);
  let bestIdx = -1;
  for (const word of words) {
    const idx = lowerContent.indexOf(word);
    if (idx !== -1) { bestIdx = idx; break; }
  }
  if (bestIdx === -1) return content.slice(0, maxLen) + (content.length > maxLen ? '...' : '');
  const start = Math.max(0, bestIdx - 25);
  const end = Math.min(content.length, bestIdx + query.length + 45);
  let snippet = content.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  return snippet;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const words = query.toLowerCase().trim().split(/[\s·.\-—]+/).filter(w => w.length > 0);
  if (words.length === 0) return <>{text}</>;
  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp('(' + escapedWords.join('|') + ')', 'gi');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = words.some(w => w.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-nc-text-muted/25 text-nc-text rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

function resolveRoute(item: FullSearchItem): string {
  const id = item.id;
  const href = item.href;

  if (id.startsWith('char_')) return '/characters/' + id.replace('char_', '');
  if (id.startsWith('extra_char_')) return '/characters';
  if (id.startsWith('story_')) return '/stories/' + id.replace('story_', '');
  if (id.startsWith('fsiii_')) return '/math/fsiii';
  if (id.startsWith('miia_')) return '/miia/world';

  if (id.startsWith('page_') || id.startsWith('nav_')) {
    const target = href.replace('#', '');
    const pageMap: Record<string, string> = {
      'hero': '/', 'footer': '/', 'worldview': '/world/overview',
      'characters': '/characters/all', 'extra-characters': '/characters', 'character-network': '/characters',
      'stories': '/stories', 'extra-stories': '/miia/world', 'miia-world': '/miia/world',
      'miia-math-notes': '/miia/math', 'organizations': '/world/organizations',
      'prime-focus': '/world/prime-focus', 'world-settings': '/world/settings',
      'dictionary': '/world/dictionary', 'qet': '/world/qet', 'timeline': '/world/timeline',
      'math': '/math/fsiii', 'math-models': '/math/fsiii',
      'chess': '/playground/games/compound-chess', 'chess-rules': '/playground/games/compound-chess',
      'skill-ttt': '/playground/games/skill-tic-tac-toe', 'skill-tic-tac-toe': '/playground/games/skill-tic-tac-toe',
      'problems': '/playground/games/quiz', 'overload': '/world/settings',
    };
    if (pageMap[target]) return pageMap[target];
  }

  const anchor = href.replace('#', '');
  const anchorMap: Record<string, string> = {
    'hero': '/', 'footer': '/', 'worldview': '/world/overview',
    'characters': '/characters/all', 'extra-characters': '/characters', 'character-network': '/characters',
    'stories': '/stories', 'extra-stories': '/miia/world', 'miia-world': '/miia/world',
    'miia-math-notes': '/miia/math', 'organizations': '/world/organizations',
    'prime-focus': '/world/prime-focus', 'world-settings': '/world/settings',
    'dictionary': '/world/dictionary', 'qet': '/world/qet', 'timeline': '/world/timeline',
    'math': '/math/fsiii', 'math-models': '/math/fsiii',
    'chess': '/playground/games/compound-chess', 'chess-rules': '/playground/games/compound-chess',
    'skill-ttt': '/playground/games/skill-tic-tac-toe', 'skill-tic-tac-toe': '/playground/games/skill-tic-tac-toe',
    'problems': '/playground/games/quiz', 'overload': '/world/settings',
  };
  if (anchorMap[anchor]) return anchorMap[anchor];

  if (anchor.startsWith('dict-') || anchor.startsWith('term-')) return '/world/dictionary?target=' + anchor;
  if (anchor.startsWith('poison-')) return '/playground/games/compound-chess?target=' + anchor;
  if (anchor.startsWith('ttt-')) return '/playground/games/skill-tic-tac-toe?target=' + anchor;
  if (anchor.startsWith('setting-') || anchor.startsWith('autism-') || anchor.startsWith('caregiver-') || anchor.startsWith('moral-') || anchor.startsWith('qet-')) return '/world/settings?target=' + anchor;
  if (anchor.startsWith('formula-') || anchor.startsWith('model-')) return '/math/fsiii?target=' + anchor;
  if (anchor.startsWith('chess-')) return '/playground/games/compound-chess?target=' + anchor;

  if (href.startsWith('/')) return href;
  return '/' + anchor;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ item: FullSearchItem; score: number }[]>([]);
  const [popularWords, setPopularWords] = useState<WordFreq[]>([]);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchLoadError, setSearchLoadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const trimmedQuery = query.trim();
  const isIndexLoading = isOpen && !isIndexReady && !searchLoadError;
  const isSearchLoading = Boolean(trimmedQuery && trimmedQuery !== searchedQuery);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setTimeout(() => {
        setQuery('');
        setResults([]);
        setSearchedQuery('');
        setSearchLoadError(false);
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void loadWordFrequency().then(() => {
      if (!cancelled) {
        setPopularWords(getPopularWords(18));
        setIsIndexReady(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setPopularWords([]);
        setSearchLoadError(true);
      }
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!isOpen) {
        if (!cancelled) {
          setResults([]);
          setSearchedQuery('');
        }
        return;
      }
      if (!trimmedQuery) {
        setResults([]);
        setSearchedQuery('');
        setSearchLoadError(false);
        return;
      }
      const searchQuery = query.toLowerCase().trim() === 'sera-him' ? query + ' Nyaumæ' : query;
      try {
        const [{ fullTextSearch }] = await Promise.all([
          import('@/data/fullSearchIndex'),
          loadWordFrequency(),
        ]);
        if (!cancelled) {
          setPopularWords(getPopularWords(18));
          const r = fullTextSearch(searchQuery);
          setResults(r);
          setSearchedQuery(trimmedQuery);
          setSearchLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearchedQuery(trimmedQuery);
          setSearchLoadError(true);
        }
      }
    }, trimmedQuery ? 80 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOpen, query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleClick = useCallback((item: FullSearchItem) => {
    onClose();
    if (item.href.startsWith('http')) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }
    const route = resolveRoute(item);
    navigate(route);
  }, [onClose, navigate]);

  const getScoreLabel = (score: number): string => {
    if (score >= 1400) return '完全匹配';
    if (score >= 850) return '短语匹配';
    if (score >= 700) return '前缀匹配';
    if (score >= 500) return '标题匹配';
    if (score >= 400) return '整词匹配';
    if (score >= 250) return '内容匹配';
    if (score >= 150) return '前缀匹配';
    if (score >= 100) return '模糊匹配';
    return '相关';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="site-search-overlay fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4 bg-nc-bg/80 backdrop-blur-xl"
          onClick={onClose}
          role="dialog" aria-modal="true" aria-label="搜索"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="site-search-panel w-[calc(100%-1.5rem)] sm:w-full sm:max-w-xl mx-3 sm:mx-0 bg-nc-bg-secondary border border-nc-violet/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-nc-violet/10">
              <Search className="site-search-input-icon w-5 h-5 text-nc-text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索全站内容...（支持模糊匹配）"
                className="flex-1 bg-transparent text-nc-text placeholder:text-nc-text-muted outline-none text-sm"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-nc-bg-tertiary border border-nc-violet/20 rounded text-nc-text-muted">
                ESC
              </kbd>
              <button onClick={onClose} className="site-search-close p-1 hover:text-nc-text text-nc-text-muted" aria-label="关闭搜索">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {isIndexLoading || isSearchLoading ? (
                <div className="py-8 text-center" role="status" aria-live="polite">
                  <Loader2 className="w-8 h-8 text-nc-cyan mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-nc-text-muted">搜索内容加载中...</p>
                </div>
              ) : searchLoadError ? (
                <div className="py-8 text-center" role="alert">
                  <Search className="w-8 h-8 text-nc-rose mx-auto mb-2 opacity-60" />
                  <p className="text-sm text-nc-text-muted">搜索内容加载失败，请稍后重试</p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {query.toLowerCase().trim() === 'sera-him' && (
                    <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-nc-rose/10 border border-nc-rose/20 text-xs">
                      <span className="text-nc-rose font-medium">发现彩蛋！</span>
                      <span className="text-nc-text-secondary ml-1">sera-him → Nyaumæ</span>
                    </div>
                  )}
                  {(() => {
                    const related = getRelatedWords(query, 5);
                    return related.length > 0 ? (
                      <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-nc-gold/5 border border-nc-gold/15 text-xs flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-nc-gold shrink-0" />
                        <span className="text-nc-text-muted">高频关联：</span>
                        <div className="flex flex-wrap gap-1">
                          {related.map(rw => (
                            <button
                              key={rw.word}
                              onClick={() => setQuery(rw.word)}
                              className="site-search-chip px-1.5 py-0.5 rounded bg-nc-bg-tertiary/50 text-nc-text-secondary hover:text-nc-text hover:bg-nc-bg-tertiary transition-colors"
                            >
                              {rw.word}({rw.count})
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  <p className="px-4 py-1 text-xs text-nc-text-muted">
                    找到 {results.length} 个结果 · 按匹配度排序
                  </p>
                  {results.map(({ item, score }, idx) => {
                    const Icon = categoryIcons[item.category] || Search;
                    const snippet = getSnippet(item.content, query);
                    return (
                      <button
                        key={item.id + idx}
                        onClick={() => handleClick(item)}
                        className="site-search-result w-full text-left px-4 py-2.5 hover:bg-nc-bg-tertiary/50 transition-colors flex items-start gap-3 group"
                      >
                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium shrink-0 ${categoryColors[item.category] || 'bg-nc-bg-tertiary text-nc-text-muted'}`}>
                          {item.category}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-nc-text truncate">
                              <HighlightText text={item.title} query={query} />
                            </p>
                            <span className="text-[11px] text-nc-text-muted shrink-0">
                              {getScoreLabel(score)}
                            </span>
                          </div>
                          <p className="text-xs text-nc-text-muted truncate leading-relaxed">
                            <HighlightText text={snippet} query={query} />
                          </p>
                        </div>
                        <Icon className="w-4 h-4 text-nc-text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-nc-text-muted mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-nc-text-muted">未找到 &quot;{query}&quot; 的相关结果</p>
                  <p className="text-xs text-nc-text-muted mt-1">尝试简化关键词或使用英文</p>
                </div>
              ) : (
                <div className="py-6 px-4">
                  <p className="text-xs text-nc-text-muted mb-3">全站高频词 · 随内容更新</p>
                  <div className="flex flex-wrap gap-1.5">
                    {popularWords.map(({ word: tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        title={`全站出现 ${count} 次`}
                        className="site-search-chip px-2 py-1 rounded-md bg-nc-bg-tertiary border border-nc-violet/10 text-xs text-nc-text-secondary hover:text-nc-text hover:border-nc-violet/30 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
