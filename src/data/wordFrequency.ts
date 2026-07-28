import { fullSearchIndex } from './fullSearchIndex';

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

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '她', '他', '它', '你', '您', '和', '与', '及', '着',
  '上', '下', '一个', '一种', '一些', '不', '也', '都', '被', '把', '对', '中', '里',
  '这', '那', '有', '没有', '而', '或', '但', '就', '又', '还', '很', '更', '最',
  '从', '到', '为', '由', '以', '于', '其', '之', '则', '所', '让', '给', '将',
  '可以', '能够', '需要', '进行', '以及', '因为', '所以', '如果', '并且', '已经',
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'are', 'was',
]);

const characterNames = new Set(
  fullSearchIndex
    .filter(item => item.category === '角色')
    .flatMap(item => item.title.split(/[·/（）()\s]+/))
    .map(word => word.toLowerCase())
    .filter(Boolean),
);

const frequencyMap = new Map<string, number>();
const documentsByWord = new Map<string, Set<number>>();
let totalWords = 0;

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
  : null;

function normalizeWord(value: string): string {
  return value.normalize('NFKC').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function isUsefulWord(word: string): boolean {
  const lower = word.toLowerCase();
  if (!word || STOP_WORDS.has(lower) || characterNames.has(lower)) return false;
  if (/^\d+$/u.test(word)) return false;
  if (/^[\p{Script=Han}]+$/u.test(word)) return word.length >= 2;
  return /^[\p{L}][\p{L}\p{N}μ₂Ⅲ+-]{1,}$/u.test(word);
}

function tokenize(text: string): string[] {
  if (segmenter) {
    return [...segmenter.segment(text)]
      .filter(part => part.isWordLike)
      .map(part => normalizeWord(part.segment))
      .filter(isUsefulWord);
  }
  return (text.match(/[\p{Script=Han}]{2,}|[\p{L}][\p{L}\p{N}μ₂Ⅲ+-]+/gu) ?? [])
    .map(normalizeWord)
    .filter(isUsefulWord);
}

fullSearchIndex.forEach((item, documentIndex) => {
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

export const wordFrequency: WordFreq[] = [...frequencyMap]
  .map(([word, count]) => ({ word, count }))
  .sort((a, b) => b.count - a.count || b.word.length - a.word.length || a.word.localeCompare(b.word, 'zh-CN'));

const generatedAt = new Date();

export const frequencyMeta: FrequencyMeta = {
  sourceItems: fullSearchIndex.length,
  totalWords,
  uniqueWords: wordFrequency.length,
  generatedAt,
};

const relatedCache = new Map<string, WordFreq[]>();

export function getRelatedWords(query: string, maxResults = 10): WordFreq[] {
  const q = normalizeWord(query).toLowerCase();
  if (!q) return [];
  const cacheKey = `${q}:${maxResults}`;
  const cached = relatedCache.get(cacheKey);
  if (cached) return cached;

  const matchingDocuments = new Set<number>();
  fullSearchIndex.forEach((item, index) => {
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

export const frequencyHighlightMap = new Map(
  wordFrequency
    .filter(entry => entry.count >= 4 && entry.word.length >= 2)
    .slice(0, 140)
    .map(entry => [entry.word, FREQUENCY_COLORS[stableColorIndex(entry.word)]]),
);
