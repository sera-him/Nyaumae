export interface WordFreq {
  word: string;
  count: number;
}

export interface WordFreqDetailed extends WordFreq {
  docCount: number;
  docRate: number;
  saturation: number;
  density: number;
  length: number;
  isCharacter: boolean;
}

export interface WordFrequencyClouds {
  ordinary: WordFreq[];
  characters: WordFreq[];
  all: WordFreq[];
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
  frequencySegments?: readonly string[];
}

const frequencyMap = new Map<string, number>();
const displayWordMap = new Map<string, string>();
const documentsByWord = new Map<string, Set<number>>();
let protectedTerms: string[] = [];
const protectedTermKeys = new Set<string>();
let indexedItems: readonly SearchIndexItem[] = [];
let totalWords = 0;
let loadPromise: Promise<void> | undefined;

// Detailed-mode auxiliary state (raw counts, not story-weighted)
const docLengthsRaw: number[] = [];
const perWordDocCounts = new Map<string, Map<number, number>>();
const saturationMap = new Map<string, number>();
const densityMap = new Map<string, number>();
export const wordFrequencyDetailed: WordFreqDetailed[] = [];

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
  : null;

// 大人国 0.1 加权会让 count 出现浮点尾差（如 12.300000000000001），
// 统计完成后统一保留一位小数，导出/展示都用这个值
const roundCountToTenth = (value: number): number => Math.round(value * 10) / 10;

export const wordFrequency: WordFreq[] = [];

export const frequencyMeta: FrequencyMeta = {
  sourceItems: 0,
  totalWords: 0,
  uniqueWords: 0,
  generatedAt: new Date(),
};

function normalizeWord(value: string): string {
  return value.normalize('NFKC').trim().replace(/^[^\p{L}\p{N}+]+|[^\p{L}\p{N}+]+$/gu, '');
}

function normalizeWordKey(value: string): string {
  return normalizeWord(value).toLocaleLowerCase('zh-CN');
}

function normalizeSegment(value: string): string {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('zh-CN');
}

function isUsefulWord(word: string): boolean {
  if (!word) return false;
  if (normalizeSegment(word) === 'object') return false;
  if (protectedTermKeys.has(normalizeSegment(word))) return true;
  // Dictionary affix notation (for example `mi+`, `+s`, or `+'n`) is
  // grammatical metadata, not a standalone lexical word.
  if (/^(?:\+[^+\s]+|[^+\s]+\+)$/u.test(word)) return false;
  if (/^(?:from|via|to)-[a-z\d-]+$/iu.test(word)) return false;
  if (/^(?:https?:\/\/|\/|#)[^\s]+$/iu.test(word)) return false;
  if (/^\d+$/u.test(word)) return false;
  if (/^[\p{Script=Han}]+$/u.test(word)) return word.length >= 2;
  return /^[\p{L}][\p{L}\p{N}+]+(?:-[\p{L}\p{N}+]+)*$/u.test(word);
}

function mergeSegmentedWords(text: string): string[] {
  if (!segmenter) {
    return text.split(/[\s·.,，。！？：；/()（）-]+/).filter(word => word.length > 0);
  }
  const parts = [...segmenter.segment(text)];
  const words: string[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part.isWordLike) continue;

    let end = index;
    let tokenEnd = part.index + part.segment.length;
    while (text[tokenEnd] === '+') tokenEnd += 1;

    while (end + 2 < parts.length) {
      const connector = text.slice(parts[end].index + parts[end].segment.length, parts[end + 2].index);
      const next = parts[end + 2];
      if (!next?.isWordLike || !/^[+/#.-]+$/u.test(connector)) break;
      if (!/^[\p{L}\p{N}]/u.test(parts[end].segment) || !/^[\p{L}\p{N}]/u.test(next.segment)) break;
      end += 2;
      tokenEnd = next.index + next.segment.length;
      while (text[tokenEnd] === '+') tokenEnd += 1;
    }

    words.push(text.slice(part.index, tokenEnd));
    index = end;
  }

  return words;
}

function tokenize(text: string): string[] {
  const markers = new Map<string, string>();
  let protectedText = text;
  protectedTerms.forEach((term, index) => {
    if (!term || !protectedText.includes(term)) return;
    const marker = `freqterm${index}x`;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const needsLexicalBoundary = /[\p{L}\p{N}]/u.test(term) && !/[\p{Script=Han}]/u.test(term);
    const pattern = needsLexicalBoundary
      ? new RegExp(`(?<![\\p{L}\\p{N}])${escapedTerm}(?![\\p{L}\\p{N}])`, 'gu')
      : new RegExp(escapedTerm, 'gu');
    protectedText = protectedText.replace(pattern, ` ${marker} `);
    markers.set(marker, term);
  });

  const mapToken = (value: string): string => markers.get(normalizeWord(value)) ?? normalizeWord(value);
  const filterToken = (value: string): boolean => markers.has(normalizeWord(value)) || isUsefulWord(value);

  if (segmenter) {
    return mergeSegmentedWords(protectedText)
      .map(mapToken)
      .filter(filterToken);
  }
  return (protectedText.match(/[\p{Script=Han}]{2,}|[\p{L}][\p{L}\p{N}]+/gu) ?? [])
    .map(mapToken)
    .filter(filterToken);
}

interface TitleTemplate {
  key: string;
  text: string;
}

function getTitlePrefix(title: string): string | undefined {
  const separatorIndex = title.search(/[:：]/u);
  if (separatorIndex <= 0) return undefined;
  const prefix = title.slice(0, separatorIndex).trim();
  const lexicalUnits = prefix.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (prefix.length < 4 || lexicalUnits.length < 2) return undefined;
  return prefix;
}

function buildTitleTemplates(items: readonly SearchIndexItem[]): TitleTemplate[] {
  const candidates = new Map<string, { text: string; count: number }>();
  for (const item of items) {
    const prefix = getTitlePrefix(item.title);
    if (!prefix) continue;
    const key = normalizeSegment(prefix);
    const current = candidates.get(key);
    if (current) {
      current.count += 1;
    } else {
      candidates.set(key, { text: prefix, count: 1 });
    }
  }
  return [...candidates.entries()]
    .filter(([, candidate]) => candidate.count >= 3)
    .map(([key, candidate]) => ({ key, text: candidate.text }))
    .sort((a, b) => b.key.length - a.key.length);
}

function getContentSegments(item: SearchIndexItem): readonly string[] {
  return item.frequencySegments ?? [item.content];
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
  protectedTermKeys.clear();
  protectedTerms = items
    .filter(item => item.id.startsWith('char_') || item.id.startsWith('extra_char_'))
    .map(item => item.title.trim())
    .filter(Boolean)
    .filter((term, index, terms) => terms.indexOf(term) === index)
    .sort((a, b) => b.length - a.length);
  protectedTerms.forEach(term => protectedTermKeys.add(normalizeSegment(term)));
  frequencyMap.clear();
  displayWordMap.clear();
  documentsByWord.clear();
  frequencyHighlightMap.clear();
  wordFrequency.splice(0, wordFrequency.length);
  wordFrequencyDetailed.splice(0, wordFrequencyDetailed.length);
  saturationMap.clear();
  densityMap.clear();
  perWordDocCounts.clear();
  docLengthsRaw.length = 0;
  for (let i = 0; i < items.length; i += 1) docLengthsRaw.push(0);
  totalWords = 0;

  const seenSegments = new Set<string>();
  const titleTemplates = buildTitleTemplates(items);

  const STORY_WEIGHT = 0.1;
  const isStoryDoc = (index: number): boolean => items[index]?.id === 'storytext_little-girl-in-giant-country';

  const addSegment = (segment: string, documentIndex: number): void => {
    const segmentKey = normalizeSegment(segment);
    if (!segmentKey || seenSegments.has(segmentKey)) return;

    const words = tokenize(segment);
    if (words.length === 0) return;

    const weight = isStoryDoc(documentIndex) ? STORY_WEIGHT : 1;

    seenSegments.add(segmentKey);
    // count (Σ) is story-weighted, other metrics use raw
    totalWords += words.length * weight;
    docLengthsRaw[documentIndex] += words.length;
    for (const word of words) {
      const normalized = normalizeWordKey(word);
      if (!normalized) continue;
      // weighted count for Σ column
      frequencyMap.set(normalized, (frequencyMap.get(normalized) ?? 0) + weight);
      const currentLabel = displayWordMap.get(normalized);
      if (!currentLabel || (currentLabel === currentLabel.toLocaleLowerCase('zh-CN') && word !== word.toLocaleLowerCase('zh-CN'))) {
        displayWordMap.set(normalized, word);
      }
      const documents = documentsByWord.get(normalized) ?? new Set<number>();
      documents.add(documentIndex);
      documentsByWord.set(normalized, documents);
      // raw per-doc counts for saturation/density (not weighted, per your note: 大人国只有count 0.1，其他正常)
      const perDoc = perWordDocCounts.get(normalized) ?? new Map<number, number>();
      perDoc.set(documentIndex, (perDoc.get(documentIndex) ?? 0) + 1);
      perWordDocCounts.set(normalized, perDoc);
    }
  };

  items.forEach((item, documentIndex) => {
    const titlePrefix = getTitlePrefix(item.title);
    const template = titlePrefix
      ? titleTemplates.find((candidate) => candidate.key === normalizeSegment(titlePrefix))
      : undefined;

    if (template) {
      addSegment(template.text, documentIndex);
    } else {
      addSegment(item.title, documentIndex);
    }

    for (const segment of getContentSegments(item)) {
      addSegment(segment, documentIndex);
    }
  });

  wordFrequency.push(
    ...[...frequencyMap]
      .map(([word, count]) => ({ word: displayWordMap.get(word) ?? word, count: roundCountToTenth(count) }))
      .sort((a, b) => b.count - a.count || b.word.length - a.word.length || a.word.localeCompare(b.word, 'zh-CN')),
  );

  // Build detailed metrics from raw per-doc counts
  const sourceItems = items.length;
  for (const [key, weightedCount] of frequencyMap) {
    const displayWord = displayWordMap.get(key) ?? key;
    const docSet = documentsByWord.get(key);
    const docCount = docSet?.size ?? 0;
    const perDoc = perWordDocCounts.get(key);
    let saturation = 0;
    let density = 0;
    if (perDoc) {
      for (const [docIdx, rawCount] of perDoc) {
        saturation += Math.log(rawCount + 1);
        const denom = docLengthsRaw[docIdx] || 1;
        density += rawCount / denom;
      }
    }
    saturationMap.set(key, saturation);
    densityMap.set(key, density);
    wordFrequencyDetailed.push({
      word: displayWord,
      count: roundCountToTenth(weightedCount),
      docCount,
      docRate: sourceItems ? docCount / sourceItems : 0,
      saturation,
      density,
      length: [...displayWord].reduce((sum, ch) => sum + (ch.codePointAt(0)! <= 0x7F ? 1 : 2), 0),
      isCharacter: protectedTermKeys.has(normalizeSegment(displayWord)),
    });
  }
  wordFrequencyDetailed.sort((a, b) => b.count - a.count || b.docCount - a.docCount || a.word.localeCompare(b.word, 'zh-CN'));
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
  const queryKeys = [...new Set(tokenize(query).map(normalizeWordKey).filter(Boolean))];
  if (queryKeys.length === 0 || indexedItems.length === 0) return [];
  const cacheKey = `${queryKeys.join('|')}:${maxResults}`;
  const cached = relatedCache.get(cacheKey);
  if (cached) return cached;

  const matchingDocuments = new Set<number>();
  for (const queryKey of queryKeys) {
    for (const documentIndex of documentsByWord.get(queryKey) ?? []) matchingDocuments.add(documentIndex);
  }
  if (matchingDocuments.size === 0) return [];

  const related = wordFrequency
    .filter(entry => {
      const entryKey = normalizeWordKey(entry.word);
      if (queryKeys.includes(entryKey)) return false;
      const documents = documentsByWord.get(entryKey);
      return documents && [...documents].some(index => matchingDocuments.has(index));
    })
    .map(entry => {
      const documents = documentsByWord.get(normalizeWordKey(entry.word))!;
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

export function getWordFrequencyClouds(): WordFrequencyClouds {
  const all = [...wordFrequency];
  const characters = wordFrequency
    .filter(entry => protectedTermKeys.has(normalizeSegment(entry.word)));
  const ordinary = wordFrequency
    .filter(entry => !protectedTermKeys.has(normalizeSegment(entry.word)));

  return { ordinary, characters, all };
}

export function getWordFreqScore(word: string): number {
  return frequencyMap.get(normalizeWordKey(word)) ?? 0;
}

export function getWordDocumentCount(word: string): number {
  return documentsByWord.get(normalizeWordKey(word))?.size ?? 0;
}

export function getWordSaturation(word: string): number {
  return saturationMap.get(normalizeWordKey(word)) ?? 0;
}

export function getWordDensity(word: string): number {
  return densityMap.get(normalizeWordKey(word)) ?? 0;
}

export function getWordFrequencyDetailed(): WordFreqDetailed[] {
  return [...wordFrequencyDetailed];
}
