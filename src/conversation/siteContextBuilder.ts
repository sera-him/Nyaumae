import { ContextBuilder } from './contextBuilder.ts';
import { ensureSiteKnowledgeLoaded, knowledgeRetriever } from './siteKnowledgeRetriever.ts';

export const contextBuilder = new ContextBuilder(undefined, knowledgeRetriever);
export { ensureSiteKnowledgeLoaded };
