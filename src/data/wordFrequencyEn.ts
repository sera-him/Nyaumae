// English word-frequency instance. It mirrors ./wordFrequency exactly:
// the same engine, the same filters and the same 0.1 weighting for the
// full-length The Little Girl in the Giant Country text.
//
// Corpus source: the English search index `fullSearchIndexEn`, built in
// ./fullSearchIndex with `addEn()` in perfect 1:1 correspondence with the
// Chinese `fullSearchIndex`. Keeping the two engines on the two parallel
// indexes is what keeps zh/en statistics comparable — both count the same
// set of documents, only tokenized by their own Intl.Segmenter.
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

const enEngine = createFrequencyEngine({
  locale: 'en',
  weightedStoryId: 'storytext_little-girl-in-giant-country',
});

export const wordFrequencyEn: WordFreq[] = enEngine.list;
export const wordFrequencyDetailedEn: WordFreqDetailed[] = enEngine.detailed;
export const frequencyMetaEn: FrequencyMeta = enEngine.meta;

let loadPromise: Promise<void> | undefined;

export function loadWordFrequencyEn(): Promise<void> {
  if (!loadPromise) {
    loadPromise = import('./fullSearchIndex')
      .then(({ fullSearchIndexEn }) => enEngine.build(fullSearchIndexEn))
      .catch((error) => {
        loadPromise = undefined;
        throw error;
      });
  }
  return loadPromise;
}

export function getWordFrequencyCloudsEn(): WordFrequencyClouds {
  return enEngine.getClouds();
}

export function getWordFrequencyDetailedEn(): WordFreqDetailed[] {
  return enEngine.getDetailed();
}

export function getEnWordDocumentCount(word: string): number {
  return enEngine.getDocumentCount(word);
}

export function getEnWordFreqScore(word: string): number {
  return enEngine.getScore(word);
}
