export interface WordFreq {
  word: string;
  count: number;
}

export interface FrequencyMeta {
  sourceItems: number;
  totalWords: number;
  uniqueWords: number;
  generatedAt: Date;
}

interface SearchIndexItem {
  id: string;
  title: string;
  content: string;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'are', 'was',
]);

const characterNames = new Set<string>();
const frequencyMap = new Map<string, number>();
const documentsByWord = new Map<string, Set<number>>();
let indexedItems: readonly SearchIndexItem[] = [];
let totalWords = 0;
let loadPromise: Promise<void> | undefined;

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
  : null;

export const wordFrequency: WordFreq[] = [];

export const frequencyMeta: FrequencyMeta = {
  sourceItems: 0,
  totalWords: 0,
  uniqueWords: 0,
  generatedAt: new Date(),
};

function normalizeWord(value: string): string {
  return value.normalize('NFKC').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function isUsefulWord(word: string): boolean {
  const lower = word.toLowerCase();
  if (!word || STOP_WORDS.has(lower) || characterNames.has(lower)) return false;
  if (/^\d+$/u.test(word)) return false;
  if (/^[\p{Script=Han}]+$/u.test(word)) return word.length >= 2;
  return /^[\p{L}][\p{L}\p{N}+]{1,}$/u.test(word);
}

function tokenize(text: string): string[] {
  if (segmenter) {
    return [...segmenter.segment(text)]
      .filter(part => part.isWordLike)
      .map(part => normalizeWord(part.segment))
      .filter(isUsefulWord);
  }
  return (text.match(/[\p{Script=Han}]{2,}|[\p{L}][\p{L}\p{N}]+/gu) ?? [])
    .map(normalizeWord)
    .filter(isUsefulWord);
}

const FREQUENCY_COLORS = [
  'text-cyan-300 font-medium',
  'text-violet-300 font-medium',
  'text-rose-300 font-medium',
  'text-amber-300 font-medium',
  'text-emerald-300 font-medium',
  'text-sky-300 font-medium',
];

function stableColorIndex(word: string): number {
  let hash = 0;
  for (const char of word) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return hash % FREQUENCY_COLORS.length;
}

export const frequencyHighlightMap = new Map<string, string>();

function buildFrequencyIndex(items: readonly SearchIndexItem[]): void {
  indexedItems = items;
  characterNames.clear();
  frequencyMap.clear();
  documentsByWord.clear();
  frequencyHighlightMap.clear();
  wordFrequency.splice(0, wordFrequency.length);
  totalWords = 0;

  for (const item of items) {
    if (!item.id.startsWith('char_') && !item.id.startsWith('extra_char_')) continue;
    for (const word of item.title.split(/[\s/()]+/).map(value => value.toLowerCase()).filter(Boolean)) {
      characterNames.add(word);
    }
  }

  items.forEach((item, documentIndex) => {
    const words = tokenize(`${item.title} ${item.content}`);
    totalWords += words.length;
    for (const word of words) {
      const normalized = /[A-Z]/.test(word) ? word : word.toLowerCase();
      frequencyMap.set(normalized, (frequencyMap.get(normalized) ?? 0) + 1);
      const documents = documentsByWord.get(normalized) ?? new Set<number>();
      documents.add(documentIndex);
      documentsByWord.set(normalized, documents);
    }
  });

  wordFrequency.push(
    ...[...frequencyMap]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count || b.word.length - a.word.length || a.word.localeCompare(b.word, 'zh-CN')),
  );
  frequencyMeta.sourceItems = items.length;
  frequencyMeta.totalWords = totalWords;
  frequencyMeta.uniqueWords = wordFrequency.length;
  frequencyMeta.generatedAt = new Date();

  for (const entry of wordFrequency.filter(item => item.count >= 4 && item.word.length >= 2).slice(0, 140)) {
    frequencyHighlightMap.set(entry.word, FREQUENCY_COLORS[stableColorIndex(entry.word)]);
  }
  relatedCache.clear();
}

export function loadWordFrequency(): Promise<void> {
  if (!loadPromise) {
    loadPromise = import('./fullSearchIndex')
      .then(({ fullSearchIndex }) => buildFrequencyIndex(fullSearchIndex))
      .catch((error) => {
        loadPromise = undefined;
        throw error;
      });
  }
  return loadPromise;
}

const relatedCache = new Map<string, WordFreq[]>();

export function getRelatedWords(query: string, maxResults = 10): WordFreq[] {
  const q = normalizeWord(query).toLowerCase();
  if (!q || indexedItems.length === 0) return [];
  const cacheKey = `${q}:${maxResults}`;
  const cached = relatedCache.get(cacheKey);
  if (cached) return cached;

  const matchingDocuments = new Set<number>();
  indexedItems.forEach((item, index) => {
    if (`${item.title} ${item.content}`.toLowerCase().includes(q)) matchingDocuments.add(index);
  });

  const related = wordFrequency
    .filter(entry => {
      if (entry.word.toLowerCase() === q || entry.word.toLowerCase().includes(q)) return false;
      const documents = documentsByWord.get(entry.word);
      return documents && [...documents].some(index => matchingDocuments.has(index));
    })
    .map(entry => {
      const documents = documentsByWord.get(entry.word)!;
      const sharedDocuments = [...documents].filter(index => matchingDocuments.has(index)).length;
      return { entry, score: sharedDocuments * 100 + Math.log2(entry.count + 1) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(result => result.entry);

  relatedCache.set(cacheKey, related);
  return related;
}

export function getPopularWords(maxResults = 16): WordFreq[] {
  return wordFrequency.filter(entry => entry.count >= 3).slice(0, maxResults);
}

export function getWordFreqScore(word: string): number {
  return frequencyMap.get(normalizeWord(word).toLowerCase()) ?? 0;
}
