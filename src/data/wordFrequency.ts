// zh-CN word-frequency instance. All statistics logic lives in
// ./wordFrequencyEngine so the English instance (./wordFrequencyEn) stays
// byte-for-byte identical in methodology; this file only wires the engine to
// the zh-CN full search index and keeps the historical public API.
import {
  createFrequencyEngine,
} from './wordFrequencyEngine';
import type {
  WordFreq,
  WordFreqDetailed,
  WordFrequencyClouds,
  FrequencyMeta,
} from './wordFrequencyEngine';

export type { WordFreq, WordFreqDetailed, WordFrequencyClouds, FrequencyMeta };

const zhEngine = createFrequencyEngine({
  locale: 'zh-CN',
  weightedStoryId: 'storytext_little-girl-in-giant-country',
});

export const wordFrequency: WordFreq[] = zhEngine.list;
export const wordFrequencyDetailed: WordFreqDetailed[] = zhEngine.detailed;
export const frequencyMeta: FrequencyMeta = zhEngine.meta;
export const frequencyHighlightMap: Map<string, string> = zhEngine.highlightMap;

let loadPromise: Promise<void> | undefined;

export function loadWordFrequency(): Promise<void> {
  if (!loadPromise) {
    loadPromise = import('./fullSearchIndex')
      .then(({ fullSearchIndex }) => zhEngine.build(fullSearchIndex))
      .catch((error) => {
        loadPromise = undefined;
        throw error;
      });
  }
  return loadPromise;
}

export function getRelatedWords(query: string, maxResults = 10): WordFreq[] {
  return zhEngine.getRelated(query, maxResults);
}

export function getPopularWords(maxResults = 16): WordFreq[] {
  return zhEngine.getPopular(maxResults);
}

export function getWordFrequencyClouds(): WordFrequencyClouds {
  return zhEngine.getClouds();
}

export function getWordFreqScore(word: string): number {
  return zhEngine.getScore(word);
}

export function getWordDocumentCount(word: string): number {
  return zhEngine.getDocumentCount(word);
}

export function getWordSaturation(word: string): number {
  return zhEngine.getSaturation(word);
}

export function getWordDensity(word: string): number {
  return zhEngine.getDensity(word);
}

export function getWordFrequencyDetailed(): WordFreqDetailed[] {
  return zhEngine.getDetailed();
}
