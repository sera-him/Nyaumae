import type { Character } from '@/data/characters';
import type { MemoryRecord } from './types.ts';
import { MemoryManager, memoryManager } from './memoryManager.ts';

export interface CharacterState {
  characterId: string;
  currentStoryTime?: string;
  currentLocation?: string;
  presentCharacterIds: string[];
  occurredEventIds: string[];
  futureEventIds: string[];
  currentKnowledgeMemoryIds: string[];
  unresolvedPlotIds: string[];
  updatedAt: string;
}

export interface CharacterKnowledgePolicy {
  characterId: string;
  allowMemoryIds?: string[];
  cutoffTime?: string;
}

export function canCharacterRead(memory: MemoryRecord, policy: CharacterKnowledgePolicy): boolean {
  if (memory.isDeleted || memory.canonStatus === 'deprecated') return false;
  if (memory.applicableCharacters.length > 0 && !memory.applicableCharacters.includes(policy.characterId)) return false;
  if (memory.scope === 'character' && !memory.applicableCharacters.includes(policy.characterId)) return false;
  if (policy.allowMemoryIds && !policy.allowMemoryIds.includes(memory.id)) return false;
  if (policy.cutoffTime && memory.createdAt > policy.cutoffTime) return false;
  return true;
}

export class CharacterStateManager {
  private readonly memories: MemoryManager;

  constructor(memories: MemoryManager = memoryManager) {
    this.memories = memories;
  }

  getAccessibleMemories(policy: CharacterKnowledgePolicy, query?: string): MemoryRecord[] {
    return this.memories
      .query({ query, characterId: policy.characterId, includeInferred: false, includeDraft: false, limit: 100 })
      .filter((memory) => canCharacterRead(memory, policy));
  }

  buildCharacterContext(character: Pick<Character, 'id' | 'name' | 'bio'>, policy: CharacterKnowledgePolicy): string {
    const accessible = this.getAccessibleMemories(policy);
    const memoryText = accessible.length > 0
      ? accessible.map((memory) => `- ${memory.title}: ${memory.content}`).join('\n')
      : '- No private character memories are available in this request.';
    return [
      `Selected character: ${character.name} (${character.id})`,
      `Public profile: ${character.bio}`,
      'Knowledge boundary: only use the public profile and the memories listed below.',
      memoryText,
    ].join('\n');
  }
}

export const characterStateManager = new CharacterStateManager();
