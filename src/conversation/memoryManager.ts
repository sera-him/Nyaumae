import type { MemoryInput, MemoryQuery, MemoryRecord } from './types.ts';
import { conversationRepository, type ConversationRepository } from './storage.ts';
import { createId, normalizeSearchText, nowIso, uniqueStrings } from './utils.ts';

function sameKey(left: MemoryRecord, right: MemoryInput): boolean {
  return left.scope === right.scope
    && left.type === right.type
    && normalizeSearchText(left.title) === normalizeSearchText(right.title)
    && left.applicableCharacters.join('|') === (right.applicableCharacters ?? []).join('|')
    && left.applicableProjects.join('|') === (right.applicableProjects ?? []).join('|');
}

function isExpired(memory: MemoryRecord, timestamp = Date.now()): boolean {
  return Boolean(memory.expiresAt && Date.parse(memory.expiresAt) <= timestamp);
}

function isVisibleToCharacter(memory: MemoryRecord, characterId?: string): boolean {
  if (!characterId) return true;
  if (memory.scope === 'character' && !memory.applicableCharacters.includes(characterId)) return false;
  return memory.applicableCharacters.length === 0 || memory.applicableCharacters.includes(characterId);
}

export class MemoryManager {
  private readonly persist: ConversationRepository;

  constructor(persist: ConversationRepository = conversationRepository) {
    this.persist = persist;
  }

  create(input: MemoryInput): MemoryRecord {
    const memories = this.persist.listMemories();
    const existing = memories
      .filter((memory) => sameKey(memory, input))
      .sort((a, b) => b.version - a.version)[0];
    if (existing && normalizeSearchText(existing.content) === normalizeSearchText(input.content) && !existing.isDeleted) {
      return existing;
    }

    const timestamp = nowIso();
    const next: MemoryRecord = {
      id: createId('memory'),
      scope: input.scope,
      type: input.type,
      title: input.title.trim(),
      content: input.content.trim(),
      source: input.source,
      sourceId: input.sourceId,
      userConfirmed: input.userConfirmed ?? false,
      canonStatus: input.canonStatus ?? 'inferred',
      confidence: Math.min(1, Math.max(0, input.confidence ?? 0.7)),
      importance: Math.min(1, Math.max(0, input.importance ?? 0.5)),
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: input.expiresAt,
      applicableCharacters: uniqueStrings(input.applicableCharacters ?? []),
      applicableProjects: uniqueStrings(input.applicableProjects ?? []),
      tags: uniqueStrings(input.tags ?? []),
      version: existing ? existing.version + 1 : 1,
      supersedes: existing?.id,
      isDeleted: false,
    };
    return this.persist.saveMemory(next);
  }

  query(query: MemoryQuery = {}): MemoryRecord[] {
    const all = this.persist.listMemories(Boolean(query.includeDeleted));
    const activeIds = new Set(
      all
        .filter((memory) => !memory.isDeleted)
        .map((memory) => memory.supersedes)
        .filter((id): id is string => Boolean(id)),
    );
    const queryText = normalizeSearchText(query.query ?? '');
    const results = all.filter((memory) => {
      if (!query.includeDeleted && memory.isDeleted) return false;
      if (!query.includeDeleted && activeIds.has(memory.id)) return false;
      if (query.scope && memory.scope !== query.scope) return false;
      if (query.type && memory.type !== query.type) return false;
      if (!query.includeDraft && memory.canonStatus === 'draft') return false;
      if (!query.includeInferred && memory.canonStatus === 'inferred') return false;
      if (isExpired(memory)) return false;
      if (!isVisibleToCharacter(memory, query.characterId)) return false;
      if (query.projectId && memory.applicableProjects.length > 0 && !memory.applicableProjects.includes(query.projectId)) return false;
      if (!queryText) return true;
      const haystack = normalizeSearchText(`${memory.title} ${memory.content} ${memory.tags.join(' ')}`);
      return queryText.split(/\s+/).every((word) => haystack.includes(word));
    });
    return results
      .sort((left, right) => right.importance - left.importance || right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, query.limit ?? 50);
  }

  update(id: string, patch: Partial<MemoryInput>): MemoryRecord | undefined {
    const current = this.persist.listMemories(true).find((memory) => memory.id === id);
    if (!current) return undefined;
    return this.create({
      scope: patch.scope ?? current.scope,
      type: patch.type ?? current.type,
      title: patch.title ?? current.title,
      content: patch.content ?? current.content,
      source: patch.source ?? current.source,
      sourceId: patch.sourceId ?? current.sourceId,
      userConfirmed: patch.userConfirmed ?? current.userConfirmed,
      canonStatus: patch.canonStatus ?? current.canonStatus,
      confidence: patch.confidence ?? current.confidence,
      importance: patch.importance ?? current.importance,
      expiresAt: patch.expiresAt ?? current.expiresAt,
      applicableCharacters: patch.applicableCharacters ?? current.applicableCharacters,
      applicableProjects: patch.applicableProjects ?? current.applicableProjects,
      tags: patch.tags ?? current.tags,
    });
  }

  softDelete(id: string): boolean {
    return Boolean(this.persist.updateMemory(id, { isDeleted: true }));
  }

  restore(id: string): boolean {
    return Boolean(this.persist.updateMemory(id, { isDeleted: false }));
  }

  merge(ids: string[], input: Omit<MemoryInput, 'source'> & { source?: string }): MemoryRecord {
    const selected = this.persist.listMemories(true).filter((memory) => ids.includes(memory.id));
    const merged = this.create({
      ...input,
      source: input.source ?? `merge:${ids.join(',')}`,
      content: input.content || selected.map((memory) => memory.content).join('\n'),
      tags: uniqueStrings([...(input.tags ?? []), ...selected.flatMap((memory) => memory.tags)]),
    });
    for (const memory of selected) {
      if (memory.id !== merged.id) this.persist.updateMemory(memory.id, { isDeleted: true });
    }
    return merged;
  }

  markCanon(id: string, canonStatus: MemoryRecord['canonStatus'], userConfirmed = true): MemoryRecord | undefined {
    return this.update(id, { canonStatus, userConfirmed });
  }

  getVersionHistory(id: string): MemoryRecord[] {
    const all = this.persist.listMemories(true);
    const target = all.find((memory) => memory.id === id);
    if (!target) return [];
    const rootIds = new Set<string>([target.id]);
    let cursor = target;
    while (cursor.supersedes) {
      rootIds.add(cursor.supersedes);
      const parent = all.find((memory) => memory.id === cursor.supersedes);
      if (!parent) break;
      cursor = parent;
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const memory of all) {
        if (memory.supersedes && rootIds.has(memory.supersedes) && !rootIds.has(memory.id)) {
          rootIds.add(memory.id);
          changed = true;
        }
      }
    }
    return all.filter((memory) => rootIds.has(memory.id)).sort((left, right) => left.version - right.version);
  }

  clearScope(scope: MemoryRecord['scope'], scopeId?: string): number {
    const memories = this.persist.listMemories();
    let count = 0;
    for (const memory of memories) {
      const matchesScope = memory.scope === scope;
      const matchesId = !scopeId
        || scope === 'character' && memory.applicableCharacters.includes(scopeId)
        || scope === 'project' && memory.applicableProjects.includes(scopeId)
        || scope === 'conversation' && memory.sourceId === scopeId;
      if (matchesScope && matchesId && this.softDelete(memory.id)) count += 1;
    }
    return count;
  }

  getSource(id: string): { memory?: MemoryRecord; history: MemoryRecord[] } {
    const memory = this.persist.listMemories(true).find((item) => item.id === id);
    return { memory, history: memory ? this.getVersionHistory(id) : [] };
  }
}

export const memoryManager = new MemoryManager();
