import { loadWordFrequency } from '@/data/wordFrequency';

type SearchIndexModule = typeof import('@/data/fullSearchIndex');

let searchDataPromise: Promise<SearchIndexModule> | undefined;

/**
 * Loads the searchable document index and its derived frequency data once.
 * Idle preloading and an immediate search share the same promise.
 */
export function loadSearchData(): Promise<SearchIndexModule> {
  if (!searchDataPromise) {
    searchDataPromise = Promise.all([
      import('@/data/fullSearchIndex'),
      loadWordFrequency(),
    ])
      .then(([searchIndex]) => searchIndex)
      .catch((error) => {
        searchDataPromise = undefined;
        throw error;
      });
  }

  return searchDataPromise;
}
