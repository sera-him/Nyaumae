// Merged zh-CN + en word frequency.
//
// Merging rule (decided with the site owner):
//   “中文 +1、英语 +1，算作两个词” — the two language tables are concatenated
//   with NO translation-level merging. “苹果” and “apple” stay two separate
//   words; only identical surface forms (e.g. “AGI” appearing in both corpora)
//   naturally add together, keyed by their lower-cased normalized form.
import { wordFrequencyDetailed, frequencyMeta, getWordDocumentCount } from './wordFrequency';
import { wordFrequencyDetailedEn, frequencyMetaEn, getEnWordDocumentCount } from './wordFrequencyEn';
import type { WordFreq, WordFreqDetailed, WordFrequencyClouds, FrequencyMeta } from './wordFrequencyEngine';

export type { WordFreq, WordFreqDetailed, WordFrequencyClouds, FrequencyMeta };

interface MergedAccumulator {
  word: string;
  count: number;
  docCount: number;
  saturation: number;
  density: number;
  isCharacter: boolean;
}

const wordLength = (word: string): number =>
  [...word].reduce((sum, ch) => sum + (ch.codePointAt(0)! <= 0x7F ? 1 : 2), 0);

const normalizeMergeKey = (word: string): string =>
  word.normalize('NFKC').trim().replace(/^[^\p{L}\p{N}+]+|[^\p{L}\p{N}+]+$/gu, '').toLocaleLowerCase('zh-CN');

function preferDisplay(current: string, candidate: string): string {
  if (!current) return candidate;
  const currentIsLower = current === current.toLocaleLowerCase('zh-CN');
  const candidateHasCase = candidate !== candidate.toLocaleLowerCase('zh-CN');
  return currentIsLower && candidateHasCase ? candidate : current;
}

export interface MergedFrequency {
  clouds: WordFrequencyClouds;
  detailed: WordFreqDetailed[];
  meta: FrequencyMeta;
}

/**
 * Build a fresh merged snapshot from whatever the two language engines have
 * computed so far. Call it after both loadWordFrequency()/loadWordFrequencyEn()
 * have resolved.
 */
export function buildMergedFrequency(): MergedFrequency {
  const accumulators = new Map<string, MergedAccumulator>();

  const absorb = (entries: readonly WordFreqDetailed[]): void => {
    for (const entry of entries) {
      const key = normalizeMergeKey(entry.word);
      if (!key) continue;
      const current = accumulators.get(key);
      if (current) {
        current.count += entry.count;
        current.docCount += entry.docCount;
        current.saturation += entry.saturation;
        current.density += entry.density;
        current.isCharacter = current.isCharacter || entry.isCharacter;
        current.word = preferDisplay(current.word, entry.word);
      } else {
        accumulators.set(key, {
          word: entry.word,
          count: entry.count,
          docCount: entry.docCount,
          saturation: entry.saturation,
          density: entry.density,
          isCharacter: entry.isCharacter,
        });
      }
    }
  };

  absorb(wordFrequencyDetailed);
  absorb(wordFrequencyDetailedEn);

  const sourceItems = frequencyMeta.sourceItems + frequencyMetaEn.sourceItems;
  const totalWords = frequencyMeta.totalWords + frequencyMetaEn.totalWords;
  const roundToTenth = (value: number) => Math.round(value * 10) / 10;

  const detailed: WordFreqDetailed[] = [...accumulators.values()]
    .map((entry) => ({
      word: entry.word,
      count: roundToTenth(entry.count),
      docCount: entry.docCount,
      docRate: sourceItems ? entry.docCount / sourceItems : 0,
      saturation: entry.saturation,
      density: entry.density,
      length: wordLength(entry.word),
      isCharacter: entry.isCharacter,
    }))
    .sort((a, b) => b.count - a.count || b.docCount - a.docCount || a.word.localeCompare(b.word, 'zh-CN'));

  const all: WordFreq[] = detailed.map(({ word, count }) => ({ word, count }));
  const characters = detailed
    .filter(entry => entry.isCharacter)
    .map(({ word, count }) => ({ word, count }));
  const ordinary = detailed
    .filter(entry => !entry.isCharacter)
    .map(({ word, count }) => ({ word, count }));

  return {
    clouds: { all, characters, ordinary },
    detailed,
    meta: {
      sourceItems,
      totalWords: roundToTenth(totalWords),
      uniqueWords: detailed.length,
      generatedAt: new Date(),
    },
  };
}

/** Document breadth for a word across both language corpora. */
export function getMergedWordDocumentCount(word: string): number {
  return getWordDocumentCount(word) + getEnWordDocumentCount(word);
}
