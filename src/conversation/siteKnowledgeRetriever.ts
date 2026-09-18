import { KnowledgeRetriever } from './knowledgeRetriever.ts';
import { createEmbeddingSemanticProvider, type SemanticProvider } from './vectorSearch.ts';
import type { AiConfig } from './types.ts';
import { getLocale, LOCALE_EVENT, type Locale } from '@/lib/i18n';

export const knowledgeRetriever = new KnowledgeRetriever();

let activeSemanticKey = '';
let activeSemanticProvider: SemanticProvider | undefined;

/**
 * Binds (or clears) the BYOK vector provider according to the saved AI
 * config. Safe to call on every send: the provider is only rebuilt when the
 * semantic-relevant fields change, keeping its query cache warm.
 */
export function configureSemanticRetrieval(config: AiConfig): void {
  const enabled = config.semanticSearch && config.provider !== 'browser' && config.embeddingModel.trim().length > 0;
  const key = enabled
    ? [config.embeddingBaseUrl || config.baseUrl, config.embeddingModel, config.apiKey ? 'keyed' : 'anon'].join('::')
    : '';
  if (key === activeSemanticKey) return;
  activeSemanticKey = key;
  activeSemanticProvider = enabled ? createEmbeddingSemanticProvider(config) : undefined;
  knowledgeRetriever.setSemanticProvider(activeSemanticProvider);
}

let loadPromise: Promise<void> | undefined;

/**
 * The AI assistant knowledge base follows the site language (locale-partitioned
 * corpus agreement): zh-CN binds the Chinese index, 'en' binds the English
 * mirror. A LOCALE_EVENT listener re-binds the source whenever the user
 * switches language, so the assistant's retrieval and citations use the same
 * corpus as the site search.
 */
export function ensureSiteKnowledgeLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = import('../data/fullSearchIndex.ts')
      .then(({ fullSearchIndex, fullSearchIndexEn, fullTextSearch }) => {
        const bind = (locale: Locale) => {
          const corpus = locale === 'en' ? fullSearchIndexEn : fullSearchIndex;
          knowledgeRetriever.setSource({
            items: corpus,
            search: (query) => fullTextSearch(query, locale).map(({ item }) => ({ item })),
          });
        };
        bind(getLocale());
        if (typeof window !== 'undefined') {
          window.addEventListener(LOCALE_EVENT, () => bind(getLocale()));
        }
      })
      .catch((error) => {
        loadPromise = undefined;
        throw error;
      });
  }
  return loadPromise;
}
