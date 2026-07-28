import { ContextBuilder } from './contextBuilder.ts';
import { knowledgeRetriever } from './siteKnowledgeRetriever.ts';

export const contextBuilder = new ContextBuilder(undefined, knowledgeRetriever);
