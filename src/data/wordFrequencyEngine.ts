// Language-agnostic word-frequency engine.
//
// The zh-CN instance lives in ./wordFrequency and the English instance in
// ./wordFrequencyEn; both share the exact same tokenizing, weighting and
// metric logic so the two languages stay statistically comparable. The only
// per-language inputs are the Intl.Segmenter locale, the comparison locale
// and the id of the document that receives the 0.1 story weight
// (《大人国的小女孩》 / The Little Girl in the Giant Country).

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

export interface SearchIndexItem {
  id: string;
  title: string;
  content: string;
  frequencySegments?: readonly string[];
  category?: string;
  href?: string;
}

export interface FrequencyEngineOptions {
  /** Intl.Segmenter / localeCompare locale ('zh-CN' or 'en'). */
  locale: 'zh-CN' | 'en';
  /** Document id whose words receive the 0.1 story weighting. */
  weightedStoryId: string;
  /** Weight applied to the weighted story document. */
  storyWeight?: number;
}

export interface FrequencyEngine {
  readonly meta: FrequencyMeta;
  readonly list: WordFreq[];
  readonly detailed: WordFreqDetailed[];
  readonly highlightMap: Map<string, string>;
  build: (items: readonly SearchIndexItem[]) => void;
  getClouds: () => WordFrequencyClouds;
  getDetailed: () => WordFreqDetailed[];
  getScore: (word: string) => number;
  getDocumentCount: (word: string) => number;
  getSaturation: (word: string) => number;
  getDensity: (word: string) => number;
  getPopular: (maxResults?: number) => WordFreq[];
  getRelated: (query: string, maxResults?: number) => WordFreq[];
  tokenizeQuery: (query: string) => string[];
  normalizeKey: (word: string) => string;
  wordLength: (word: string) => number;
}

interface TitleTemplate {
  key: string;
  text: string;
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

// 大人国 0.1 加权会让 count 出现浮点尾差（如 12.300000000000001），
// 统计完成后统一保留一位小数，导出/展示都用这个值
const roundCountToTenth = (value: number): number => Math.round(value * 10) / 10;

export function createFrequencyEngine(options: FrequencyEngineOptions): FrequencyEngine {
  const { locale, weightedStoryId } = options;
  const storyWeight = options.storyWeight ?? 0.1;
  const lowerLocale = locale === 'en' ? 'en' : 'zh-CN';

  const frequencyMap = new Map<string, number>();
  const displayWordMap = new Map<string, string>();
  const documentsByWord = new Map<string, Set<number>>();
  let protectedTerms: string[] = [];
  const protectedTermKeys = new Set<string>();
  let indexedItems: readonly SearchIndexItem[] = [];
  let totalWords = 0;

  // Detailed-mode auxiliary state (raw counts, not story-weighted)
  const docLengthsRaw: number[] = [];
  const perWordDocCounts = new Map<string, Map<number, number>>();
  const saturationMap = new Map<string, number>();
  const densityMap = new Map<string, number>();
  const detailedList: WordFreqDetailed[] = [];
  const wordList: WordFreq[] = [];
  const highlightMap = new Map<string, string>();

  const meta: FrequencyMeta = {
    sourceItems: 0,
    totalWords: 0,
    uniqueWords: 0,
    generatedAt: new Date(),
  };

  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(locale, { granularity: 'word' })
    : null;

  function normalizeWord(value: string): string {
    return value.normalize('NFKC').trim().replace(/^[^\p{L}\p{N}+]+|[^\p{L}\p{N}+]+$/gu, '');
  }

  function normalizeWordKey(value: string): string {
    return normalizeWord(value).toLocaleLowerCase(lowerLocale);
  }

  function normalizeSegment(value: string): string {
    return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase(lowerLocale);
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

  function build(items: readonly SearchIndexItem[]): void {
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
    highlightMap.clear();
    wordList.splice(0, wordList.length);
    detailedList.splice(0, detailedList.length);
    saturationMap.clear();
    densityMap.clear();
    perWordDocCounts.clear();
    docLengthsRaw.length = 0;
    for (let i = 0; i < items.length; i += 1) docLengthsRaw.push(0);
    totalWords = 0;

    const seenSegments = new Set<string>();
    const titleTemplates = buildTitleTemplates(items);

    const isStoryDoc = (index: number): boolean => items[index]?.id === weightedStoryId;

    const addSegment = (segment: string, documentIndex: number): void => {
      const segmentKey = normalizeSegment(segment);
      if (!segmentKey || seenSegments.has(segmentKey)) return;

      const words = tokenize(segment);
      if (words.length === 0) return;

      const weight = isStoryDoc(documentIndex) ? storyWeight : 1;

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
        if (!currentLabel || (currentLabel === currentLabel.toLocaleLowerCase(lowerLocale) && word !== word.toLocaleLowerCase(lowerLocale))) {
          displayWordMap.set(normalized, word);
        }
        const documents = documentsByWord.get(normalized) ?? new Set<number>();
        documents.add(documentIndex);
        documentsByWord.set(normalized, documents);
        // raw per-doc counts for saturation/density (story doc keeps raw counts here; only Σ is weighted)
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

    wordList.push(
      ...[...frequencyMap]
        .map(([word, count]) => ({ word: displayWordMap.get(word) ?? word, count: roundCountToTenth(count) }))
        .sort((a, b) => b.count - a.count || b.word.length - a.word.length || a.word.localeCompare(b.word, lowerLocale)),
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
      detailedList.push({
        word: displayWord,
        count: roundCountToTenth(weightedCount),
        docCount,
        docRate: sourceItems ? docCount / sourceItems : 0,
        saturation,
        density,
        length: wordLengthInternal(displayWord),
        isCharacter: protectedTermKeys.has(normalizeSegment(displayWord)),
      });
    }
    detailedList.sort((a, b) => b.count - a.count || b.docCount - a.docCount || a.word.localeCompare(b.word, lowerLocale));
    meta.sourceItems = items.length;
    meta.totalWords = totalWords;
    meta.uniqueWords = wordList.length;
    meta.generatedAt = new Date();

    for (const entry of wordList.filter(item => item.count >= 4 && item.word.length >= 2).slice(0, 140)) {
      highlightMap.set(entry.word, FREQUENCY_COLORS[stableColorIndex(entry.word)]);
    }
    relatedCache.clear();
  }

  const relatedCache = new Map<string, WordFreq[]>();

  function getRelated(query: string, maxResults = 10): WordFreq[] {
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

    const related = wordList
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

  function getPopular(maxResults = 16): WordFreq[] {
    return wordList.filter(entry => entry.count >= 3).slice(0, maxResults);
  }

  function getClouds(): WordFrequencyClouds {
    const all = [...wordList];
    const characters = wordList
      .filter(entry => protectedTermKeys.has(normalizeSegment(entry.word)));
    const ordinary = wordList
      .filter(entry => !protectedTermKeys.has(normalizeSegment(entry.word)));

    return { ordinary, characters, all };
  }

  function getScore(word: string): number {
    return frequencyMap.get(normalizeWordKey(word)) ?? 0;
  }

  function getDocumentCount(word: string): number {
    return documentsByWord.get(normalizeWordKey(word))?.size ?? 0;
  }

  function getSaturation(word: string): number {
    return saturationMap.get(normalizeWordKey(word)) ?? 0;
  }

  function getDensity(word: string): number {
    return densityMap.get(normalizeWordKey(word)) ?? 0;
  }

  function getDetailed(): WordFreqDetailed[] {
    return [...detailedList];
  }

  function tokenizeQuery(query: string): string[] {
    return tokenize(query);
  }

  function wordLengthInternal(word: string): number {
    return [...word].reduce((sum, ch) => sum + (ch.codePointAt(0)! <= 0x7F ? 1 : 2), 0);
  }

  return {
    meta,
    list: wordList,
    detailed: detailedList,
    highlightMap,
    build,
    getClouds,
    getDetailed,
    getScore,
    getDocumentCount,
    getSaturation,
    getDensity,
    getPopular,
    getRelated,
    tokenizeQuery,
    normalizeKey: normalizeWordKey,
    wordLength: wordLengthInternal,
  };
}

/**
 * Mirror of fullSearchIndex's segment collection: split raw content into
 * trimmed, non-technical line segments used by frequency analysis.
 */
const FREQUENCY_METADATA_KEYS = new Set([
  'id', 'key', 'slug', 'group', 'type', 'from', 'to',
  'color', 'accentcolor', 'backgroundcolor',
  'image', 'images', 'icon', 'src', 'href', 'url', 'path', 'route', 'poster', 'videoposter',
]);

function isTechnicalFrequencySegment(segment: string): boolean {
  return /^(?:from|via|to)-[a-z\d-]+(?:\s+(?:from|via|to)-[a-z\d-]+)*$/iu.test(segment)
    || /^#[\da-f]{3,8}$/iu.test(segment)
    || /^(?:https?:\/\/|\/)[^\s]+$/iu.test(segment)
    || /^[^\s]+\.(?:avif|gif|jpe?g|mp4|png|svg|webm|webp)(?:[?#].*)?$/iu.test(segment);
}

export function collectFrequencySegments(value: unknown, key?: string): string[] {
  if (value == null || (key && FREQUENCY_METADATA_KEYS.has(key.toLocaleLowerCase('en-US')))) return [];
  if (typeof value === 'string') {
    return value
      .split(/\r?\n\s*/u)
      .map((segment) => segment.replace(/\s+/gu, ' ').trim())
      .filter((segment) => Boolean(segment) && !isTechnicalFrequencySegment(segment));
  }
  if (Array.isArray(value)) return value.flatMap((entry) => collectFrequencySegments(entry));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([entryKey, entryValue]) => collectFrequencySegments(entryValue, entryKey));
  }
  return [];
}

export function cleanFrequencyText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).replace(/\s+/g, ' ').trim();
  }
  if (Array.isArray(value)) return value.map(cleanFrequencyText).filter(Boolean).join(' · ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(cleanFrequencyText).filter(Boolean).join(' · ');
  }
  return '';
}
