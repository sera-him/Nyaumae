import type { LevelEvent, LevelProfile, LevelRule } from './types.ts';
import { conversationRepository, type ConversationRepository } from './storage.ts';
import { createId, nowIso } from './utils.ts';

export const LEVEL_RULES: LevelRule[] = [
  { level: 1, name: 'Awake', requiredPoints: 0, unlocks: ['website-assistant'] },
  { level: 2, name: 'Observer', requiredPoints: 20, unlocks: ['conversation-memory'] },
  { level: 3, name: 'Wayfinder', requiredPoints: 60, unlocks: ['story-query'] },
  { level: 4, name: 'Resonant', requiredPoints: 140, unlocks: ['character-mode'] },
  { level: 5, name: 'Constellation Keeper', requiredPoints: 300, unlocks: ['relationship-memory'] },
  { level: 6, name: 'Atlas Builder', requiredPoints: 600, unlocks: ['world-exploration'] },
];

const EVENT_POINTS: Record<LevelEvent['eventType'], number> = {
  'valid-interaction': 4,
  'discover-knowledge': 8,
  'complete-story-node': 20,
  'complete-game': 24,
  'complete-test': 30,
  'important-choice': 16,
  'trust-gained': 12,
  'conflict-triggered': 5,
  'relationship-repaired': 18,
};

function createProfile(userId: string): LevelProfile {
  return {
    userId,
    interactionPoints: 0,
    aiLevel: 1,
    relationshipLevels: {},
    trust: {},
    explorationProgress: {},
    unlockedFeatures: ['website-assistant'],
    unlockedStoryNodes: [],
    updatedAt: nowIso(),
  };
}

function levelForPoints(points: number): number {
  return LEVEL_RULES.reduce((current, rule) => points >= rule.requiredPoints ? rule.level : current, 1);
}

export class LevelSystem {
  private readonly persist: ConversationRepository;

  constructor(persist: ConversationRepository = conversationRepository) {
    this.persist = persist;
  }

  getProfile(userId = 'local-user'): LevelProfile {
    return this.persist.getLevelProfile(userId) ?? this.persist.saveLevelProfile(createProfile(userId));
  }

  applyEvent(input: {
    userId?: string;
    eventType: LevelEvent['eventType'];
    reason: string;
    triggeredBy?: string;
    relationshipCharacterId?: string;
    relationshipDelta?: number;
    trustDelta?: number;
    explorationId?: string;
    explorationDelta?: number;
    storyNodeId?: string;
    metadata?: Record<string, unknown>;
    reversible?: boolean;
  }): LevelEvent {
    const userId = input.userId ?? 'local-user';
    const profile = this.getProfile(userId);
    const points = EVENT_POINTS[input.eventType];
    const previousLevel = profile.aiLevel;
    const previousRelationshipLevel = input.relationshipCharacterId
      ? profile.relationshipLevels[input.relationshipCharacterId] ?? 0
      : undefined;
    const nextPoints = profile.interactionPoints + points;
    const newLevel = levelForPoints(nextPoints);
    profile.interactionPoints = nextPoints;
    profile.aiLevel = newLevel;
    if (input.relationshipCharacterId && input.relationshipDelta) {
      profile.relationshipLevels[input.relationshipCharacterId] = Math.max(
        0,
        Math.min(100, (profile.relationshipLevels[input.relationshipCharacterId] ?? 0) + input.relationshipDelta),
      );
    }
    if (input.relationshipCharacterId && input.trustDelta) {
      profile.trust[input.relationshipCharacterId] = Math.max(
        0,
        Math.min(100, (profile.trust[input.relationshipCharacterId] ?? 0) + input.trustDelta),
      );
    }
    if (input.explorationId && input.explorationDelta) {
      profile.explorationProgress[input.explorationId] = Math.max(
        0,
        Math.min(100, (profile.explorationProgress[input.explorationId] ?? 0) + input.explorationDelta),
      );
    }
    if (input.storyNodeId && !profile.unlockedStoryNodes.includes(input.storyNodeId)) {
      profile.unlockedStoryNodes.push(input.storyNodeId);
    }
    for (const rule of LEVEL_RULES) {
      if (rule.level <= newLevel) {
        for (const feature of rule.unlocks) {
          if (!profile.unlockedFeatures.includes(feature)) profile.unlockedFeatures.push(feature);
        }
      }
    }
    profile.updatedAt = nowIso();
    this.persist.saveLevelProfile(profile);
    const event: LevelEvent = {
      id: createId('level-event'),
      eventType: input.eventType,
      points,
      reason: input.reason,
      triggeredBy: input.triggeredBy,
      createdAt: nowIso(),
      previousLevel,
      newLevel,
      previousRelationshipLevel,
      newRelationshipLevel: input.relationshipCharacterId
        ? profile.relationshipLevels[input.relationshipCharacterId]
        : undefined,
      reversible: input.reversible ?? false,
      isReverted: false,
      metadata: { ...(input.metadata ?? {}), userId },
    };
    return this.persist.saveLevelEvent(event);
  }

  revertEvent(eventId: string): LevelProfile | undefined {
    const event = this.persist.listLevelEvents().find((item) => item.id === eventId && !item.isReverted && item.reversible);
    if (!event) return undefined;
    const userId = typeof event.metadata.userId === 'string' ? event.metadata.userId : 'local-user';
    const profile = this.getProfile(userId);
    profile.interactionPoints = Math.max(0, profile.interactionPoints - event.points);
    profile.aiLevel = levelForPoints(profile.interactionPoints);
    profile.updatedAt = nowIso();
    this.persist.saveLevelProfile(profile);
    this.persist.saveLevelEvent({ ...event, isReverted: true, metadata: { ...event.metadata, revertedAt: nowIso() } });
    return profile;
  }
}

export const levelSystem = new LevelSystem();
