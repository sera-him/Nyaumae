import type { CanonStatus, Citation, KnowledgeDocument, KnowledgeSearchOptions } from './types.ts';
import { normalizeSearchText, truncateText } from './utils.ts';
import type { SemanticProvider } from './vectorSearch.ts';

export interface SearchIndexItem {
  id: string;
  title: string;
  content: string;
  category: string;
  href: string;
  canonStatus?: CanonStatus;
  relatedIds?: string[];
  spoilerLevel?: number;
}

export interface SearchMatch {
  item: SearchIndexItem;
}

export interface KnowledgeSource {
  items: readonly SearchIndexItem[];
  search(query: string): SearchMatch[];
}

const ROUTE_BY_ANCHOR: Record<string, string> = {
  '#hero': '/',
  '#worldview': '/world/overview',
  '#world': '/world/overview',
  '#characters': '/characters',
  '#extra-characters': '/characters?group=other',
  '#stories': '/stories',
  '#extra-stories': '/miia/world',
  '#timeline': '/world/timeline',
  '#organizations': '/world/organizations',
  '#dictionary': '/world/dictionary',
  '#character-network': '/characters',
  '#miia-world': '/miia/world',
  '#miia-math-notes': '/miia/math',
  '#world-settings': '/world/settings',
  '#prime-focus': '/world/prime-focus',
  '#math': '/math/fsiii',
  '#problems': '/playground/games',
  '#chess': '/playground/games/compound-chess',
  '#skill-ttt': '/playground/games/skill-tic-tac-toe',
};

/** story_ 条目来自 stories 目录，storytext_ 是整本长文的全文文档，两者都按故事处理（剧透分级等）。 */
function isStoryDocId(id: string): boolean {
  return id.startsWith('story_') || id.startsWith('storytext_');
}

function routeForItem(id: string, href: string): string {
  if (id.startsWith('char_')) return `/characters/${id.slice('char_'.length)}`;
  if (id.startsWith('extra_char_')) return `/characters?group=other`;
  if (id.startsWith('story_')) return `/stories/${id.slice('story_'.length)}/chapters/1`;
  if (href.startsWith('/')) return href;
  return ROUTE_BY_ANCHOR[href] ?? '/';
}

function relatedIdsForItem(item: SearchIndexItem): string[] {
  if (item.relatedIds?.length) return [...item.relatedIds];
  if (item.id.startsWith('char_')) return [item.id.slice('char_'.length)];
  if (item.id.startsWith('extra_char_')) return [item.id.slice('extra_char_'.length)];
  if (item.id.startsWith('relation_')) return item.id.slice('relation_'.length).split('_').filter(Boolean);
  if (isStoryDocId(item.id) || item.id.startsWith('poem_')) return [item.id];
  return [];
}

function allowedForCharacter(document: KnowledgeDocument, characterId?: string): boolean {
  if (!characterId?.trim()) return false;
  if (document.type === 'character') return document.relatedIds.includes(characterId);
  if (document.type === 'relationship') return document.relatedIds.includes(characterId);
  return false;
}

function typeForItem(id: string, category: string): KnowledgeDocument['type'] {
  if (id.startsWith('char_') || id.startsWith('extra_char_')) return 'character';
  if (id.startsWith('relation_')) return 'relationship';
  if (isStoryDocId(id) || id.startsWith('poem_')) return 'story';
  if (id.startsWith('timeline_')) return 'timeline';
  if (id.startsWith('org_') || id.startsWith('class_')) return 'organization';
  if (id.startsWith('page_')) return 'feature';
  if (id.startsWith('chess_') || id.startsWith('skill_') || id.startsWith('game_')) return 'game';
  if (category.includes('词典') || id.startsWith('dict_')) return 'world';
  return 'world';
}

function documentFromIndexItem(item: SearchIndexItem): KnowledgeDocument {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    type: typeForItem(item.id, item.category),
    route: routeForItem(item.id, item.href),
    relatedIds: relatedIdsForItem(item),
    canonStatus: item.canonStatus ?? 'inferred',
    spoilerLevel: item.spoilerLevel ?? (isStoryDocId(item.id) || item.id.startsWith('poem_') ? 2 : 0),
    updatedAt: new Date().toISOString(),
    searchableText: `${item.title} ${item.content}`,
  };
}

function excerptFor(document: KnowledgeDocument, query: string): string {
  const source = document.content.replace(/\s+/g, ' ').trim();
  const normalized = normalizeSearchText(source);
  const normalizedQuery = normalizeSearchText(query).split(/\s+/).find(Boolean) ?? '';
  const index = normalizedQuery ? normalized.indexOf(normalizedQuery) : -1;
  if (index < 0) return truncateText(source, 180);
  const start = Math.max(0, index - 70);
  return truncateText(source.slice(start, start + 190), 190);
}

export function citationForDocument(document: KnowledgeDocument, query = ''): Citation {
  return {
    id: document.id,
    title: document.title,
    route: document.route,
    type: document.type,
    relatedIds: document.relatedIds,
    excerpt: excerptFor(document, query),
    canonStatus: document.canonStatus,
    spoilerLevel: document.spoilerLevel,
  };
}

export class KnowledgeRetriever {
  private source?: KnowledgeSource;
  private semanticProvider?: SemanticProvider;

  constructor(source?: KnowledgeSource) {
    this.source = source;
  }

  setSource(source: KnowledgeSource): void {
    this.source = source;
  }

  /** Optional BYOK vector retrieval; merged into searchAsync results. */
  setSemanticProvider(provider: SemanticProvider | undefined): void {
    this.semanticProvider = provider;
  }

  private filterDocuments(items: SearchIndexItem[], options: KnowledgeSearchOptions): KnowledgeDocument[] {
    const maxResults = options.maxResults ?? 6;
    const maxSpoilerLevel = options.maxSpoilerLevel ?? 0;
    const results: KnowledgeDocument[] = [];
    for (const item of items) {
      const document = documentFromIndexItem(item);
      if (document.spoilerLevel > maxSpoilerLevel) continue;
      if (!options.includeDraft && document.canonStatus === 'draft') continue;
      if (options.characterId && !allowedForCharacter(document, options.characterId)) continue;
      if (results.some((entry) => entry.id === document.id)) continue;
      results.push(document);
      if (results.length >= maxResults) break;
    }
    return results;
  }

  search(query: string, options: KnowledgeSearchOptions = {}): KnowledgeDocument[] {
    if (!query.trim()) return [];
    if (!this.source) return [];
    const matches = this.source.search(query);
    return this.filterDocuments(matches.map((match) => match.item), options);
  }

  /**
   * Keyword retrieval merged with BYOK vector similarity. Semantic scores only
   * re-rank and extend the keyword list; any provider failure degrades to the
   * synchronous keyword-only result.
   */
  async searchAsync(query: string, options: KnowledgeSearchOptions = {}): Promise<KnowledgeDocument[]> {
    const keywordResults = this.search(query, options);
    if (!query.trim() || !this.source || !this.semanticProvider) return keywordResults;
    const maxResults = options.maxResults ?? 6;
    const items = this.source.items.map((item) => ({
      id: item.id,
      text: `${item.title} ${item.content}`,
    }));
    let semanticScores: Map<string, number> | null = null;
    try {
      semanticScores = await this.semanticProvider.rank(query, items);
    } catch {
      semanticScores = null;
    }
    if (!semanticScores || semanticScores.size === 0) return keywordResults;

    const keywordRank = new Map<string, number>();
    this.source.search(query).forEach((match, index) => {
      if (!keywordRank.has(match.item.id)) keywordRank.set(match.item.id, index);
    });
    const merged = this.source.items
      .map((item) => {
        const rank = keywordRank.get(item.id);
        const keywordScore = rank === undefined ? 0 : 1 / (rank + 1);
        const semanticScore = semanticScores.get(item.id) ?? 0;
        return { item, score: keywordScore + semanticScore * 1.5 };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(maxResults * 3, 12))
      .map((entry) => entry.item);
    return this.filterDocuments(merged, options);
  }

  getById(id: string): KnowledgeDocument | undefined {
    const item = this.source?.items.find((entry) => entry.id === id);
    return item ? documentFromIndexItem(item) : undefined;
  }

  toCitations(documents: KnowledgeDocument[], query = ''): Citation[] {
    return documents.map((document) => citationForDocument(document, query));
  }
}
