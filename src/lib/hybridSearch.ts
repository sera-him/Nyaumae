import { fullTextSearch, type FullSearchItem } from '@/data/fullSearchIndex';
import type { Locale } from '@/lib/i18n';

export interface HybridHit {
  item: FullSearchItem;
  score: number;
  why: Array<'keyword' | 'fuzzy' | 'vector'>;
}

/** Char-bigram vector for dependency-free semantic-ish similarity. */
function bigrams(text: string): Map<string, number> {
  const norm = text.toLowerCase().replace(/\s+/g, ' ').slice(0, 500);
  const map = new Map<string, number>();
  for (let i = 0; i + 2 <= norm.length; i += 1) {
    const gram = norm.slice(i, i + 2);
    map.set(gram, (map.get(gram) ?? 0) + 1);
  }
  return map;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  for (const [k, v] of a) {
    const w = b.get(k);
    if (w) dot += v * w;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q || !t) return 0;
  if (t.includes(q)) return 1;
  // Ordered-char recall: cheap typo tolerance for CJK + latin.
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) qi += 1;
  }
  return qi / q.length >= 0.7 ? (qi / q.length) * 0.5 : 0;
}

/**
 * Hybrid retrieval: keyword (existing fullTextSearch) + fuzzy + bigram-vector.
 * Drop-in replacement where fullTextSearch is used; no new dependencies.
 *
 * locale selects the corpus: zh-CN searches the Chinese index, 'en' searches
 * the English mirror (the AI assistant knowledge base follows the site
 * language, per the locale-partitioned corpus agreement).
 */
export function hybridSearch(query: string, limit = 20, locale: Locale = 'zh-CN'): HybridHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const keywordHits = new Map<string, FullSearchItem>();
  for (const hit of fullTextSearch(trimmed, locale).slice(0, 100)) {
    keywordHits.set(hit.item.id, hit.item);
  }
  const qv = bigrams(trimmed);
  const scored = new Map<string, HybridHit>();
  const consider = (item: FullSearchItem, keyword: boolean) => {
    const hay = `${item.title} ${item.content.slice(0, 300)} ${item.category}`;
    const fuzzy = fuzzyScore(trimmed, hay);
    const vector = cosine(qv, bigrams(hay));
    const score = (keyword ? 2 : 0) + fuzzy * 1.2 + vector * 2.5;
    if (score <= 0.05) return;
    const why: HybridHit['why'] = [];
    if (keyword) why.push('keyword');
    if (fuzzy >= 0.5) why.push('fuzzy');
    if (vector >= 0.08) why.push('vector');
    const prev = scored.get(item.id);
    if (!prev || prev.score < score) scored.set(item.id, { item, score, why });
  };

  for (const item of keywordHits.values()) consider(item, true);
  return [...scored.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
