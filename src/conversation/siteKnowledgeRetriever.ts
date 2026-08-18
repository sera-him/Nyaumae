import { KnowledgeRetriever } from './knowledgeRetriever.ts';

export const knowledgeRetriever = new KnowledgeRetriever();

let loadPromise: Promise<void> | undefined;

export function ensureSiteKnowledgeLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = import('../data/fullSearchIndex.ts')
      .then(({ fullSearchIndex, fullTextSearch }) => {
        knowledgeRetriever.setSource({
          items: fullSearchIndex,
          search: (query) => fullTextSearch(query).map(({ item }) => ({ item })),
        });
      })
      .catch((error) => {
        loadPromise = undefined;
        throw error;
      });
  }
  return loadPromise;
}
