import { fullSearchIndex, fullTextSearch } from '../data/fullSearchIndex';
import { KnowledgeRetriever } from './knowledgeRetriever.ts';

export const knowledgeRetriever = new KnowledgeRetriever({
  items: fullSearchIndex,
  search: fullTextSearch,
});
