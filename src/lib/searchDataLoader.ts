import { loadWordFrequency } from '@/data/wordFrequency';
import { loadWordFrequencyEn } from '@/data/wordFrequencyEn';

type SearchIndexModule = typeof import('@/data/fullSearchIndex');

let searchDataPromise: Promise<SearchIndexModule> | undefined;

/**
 * Loads the searchable document index (zh-CN + en mirror) and its derived
 * frequency data once. Idle preloading and an immediate search share the same
 * promise.
 */
export function loadSearchData(): Promise<SearchIndexModule> {
  if (!searchDataPromise) {
    searchDataPromise = Promise.all([
      import('@/data/fullSearchIndex'),
      loadWordFrequency(),
      loadWordFrequencyEn(),
    ])
      .then(([searchIndex]) => searchIndex)
      .catch((error) => {
        searchDataPromise = undefined;
        throw error;
      });
  }

  return searchDataPromise;
}
