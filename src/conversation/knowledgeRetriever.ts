import type { CanonStatus, Citation, KnowledgeDocument, KnowledgeSearchOptions } from './types.ts';
import { normalizeSearchText, truncateText } from './utils.ts';

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
  '#characters': '/characters/all',
  '#extra-characters': '/characters/other',
  '#stories': '/stories',
  '#extra-stories': '/stories',
  '#timeline': '/world/timeline',
  '#organizations': '/world/organizations',
  '#dictionary': '/world/dictionary',
  '#character-network': '/characters/all',
  '#miia-world': '/miia/world',
  '#math': '/math/fsiii',
  '#problems': '/playground/games',
  '#chess': '/playground/rules/compound-chess',
};

function routeForItem(id: string, href: string): string {
  if (id.startsWith('char_')) return `/characters/${id.slice('char_'.length)}`;
  if (id.startsWith('extra_char_')) return `/characters/other`;
  if (id === 'story_mia-world') return '/stories/mia-world/chapters/1';
  if (id === 'story_fox-penguin') return '/stories/fox-penguin/chapters/1';
  if (id === 'story_zhenhai-refining') return '/stories/zhenhai-refining/chapters/1';
  if (id === 'story_little-girl-in-giant-country') return '/stories/little-girl-in-giant-country/chapters/1';
  return ROUTE_BY_ANCHOR[href] ?? '/';
}

function relatedIdsForItem(item: SearchIndexItem): string[] {
  if (item.relatedIds?.length) return [...item.relatedIds];
  if (item.id.startsWith('char_')) return [item.id.slice('char_'.length)];
  if (item.id.startsWith('extra_char_')) return [item.id.slice('extra_char_'.length)];
  if (item.id.startsWith('relation_')) return item.id.slice('relation_'.length).split('_').filter(Boolean);
  if (item.id.startsWith('story_') || item.id.startsWith('poem_')) return [item.id];
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
  if (id.startsWith('story_') || id.startsWith('poem_')) return 'story';
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
    spoilerLevel: item.spoilerLevel ?? (item.id.startsWith('story_') || item.id.startsWith('poem_') ? 2 : 0),
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

  constructor(source?: KnowledgeSource) {
    this.source = source;
  }

  setSource(source: KnowledgeSource): void {
    this.source = source;
  }

  search(query: string, options: KnowledgeSearchOptions = {}): KnowledgeDocument[] {
    if (!query.trim()) return [];
    if (!this.source) return [];
    const maxResults = options.maxResults ?? 6;
    const maxSpoilerLevel = options.maxSpoilerLevel ?? 0;
    const matches = this.source.search(query);
    const results: KnowledgeDocument[] = [];
    for (const match of matches) {
      const document = documentFromIndexItem(match.item);
      if (document.spoilerLevel > maxSpoilerLevel) continue;
      if (!options.includeDraft && document.canonStatus === 'draft') continue;
      if (options.characterId && !allowedForCharacter(document, options.characterId)) continue;
      if (results.some((item) => item.id === document.id)) continue;
      results.push(document);
      if (results.length >= maxResults) break;
    }
    return results;
  }

  getById(id: string): KnowledgeDocument | undefined {
    const item = this.source?.items.find((entry) => entry.id === id);
    return item ? documentFromIndexItem(item) : undefined;
  }

  toCitations(documents: KnowledgeDocument[], query = ''): Citation[] {
    return documents.map((document) => citationForDocument(document, query));
  }
}
