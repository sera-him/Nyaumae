import type {
  AiConfig,
  Conversation,
  ConversationMode,
  ConversationSummary,
  LevelEvent,
  LevelProfile,
  Message,
  MemoryRecord,
  PromptDefinition,
} from './types.ts';
import { createId, nowIso } from './utils.ts';

const STORAGE_KEY = 'nyaumae:conversation-state:v1';
const AI_CONFIG_KEY = 'nyaumae:ai-config:v1';
const SCHEMA_VERSION = 1;

export interface ConversationState {
  schemaVersion: number;
  conversations: Conversation[];
  messages: Message[];
  memories: MemoryRecord[];
  levelEvents: LevelEvent[];
  levelProfiles: LevelProfile[];
  prompts: PromptDefinition[];
}

const EMPTY_STATE: ConversationState = {
  schemaVersion: SCHEMA_VERSION,
  conversations: [],
  messages: [],
  memories: [],
  levelEvents: [],
  levelProfiles: [],
  prompts: [],
};

const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
  provider: 'openai-compatible',
  providerLabel: 'OpenAI-compatible',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1200,
  contextWindow: 16_000,
  stream: true,
  timeoutMs: 45_000,
  retry: 1,
  headers: {},
  updatedAt: nowIso(),
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readState(): ConversationState {
  const storage = getStorage();
  if (!storage) return clone(EMPTY_STATE);
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return clone(EMPTY_STATE);
    const parsed = JSON.parse(raw) as Partial<ConversationState>;
    return {
      schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION,
      conversations: parsed.conversations ?? [],
      messages: parsed.messages ?? [],
      memories: parsed.memories ?? [],
      levelEvents: parsed.levelEvents ?? [],
      levelProfiles: parsed.levelProfiles ?? [],
      prompts: parsed.prompts ?? [],
    };
  } catch {
    return clone(EMPTY_STATE);
  }
}

function writeState(state: ConversationState): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or privacy-mode failures should not stop the current conversation.
  }
}

function normalizeMessage(message: Message): Message {
  return {
    ...message,
    citations: message.citations ?? [],
    toolCalls: message.toolCalls ?? [],
    attachments: message.attachments ?? [],
    metadata: message.metadata ?? {},
  };
}

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    isDeleted: conversation.isDeleted ?? false,
    metadata: conversation.metadata ?? {},
  };
}

function normalizeMemory(memory: MemoryRecord): MemoryRecord {
  return {
    ...memory,
    applicableCharacters: memory.applicableCharacters ?? [],
    applicableProjects: memory.applicableProjects ?? [],
    tags: memory.tags ?? [],
    isDeleted: memory.isDeleted ?? false,
    version: memory.version ?? 1,
  };
}

export class ConversationRepository {
  private state: ConversationState;

  constructor() {
    this.state = readState();
    this.state.conversations = this.state.conversations.map(normalizeConversation);
    this.state.messages = this.state.messages.map(normalizeMessage);
    this.state.memories = this.state.memories.map(normalizeMemory);
  }

  private commit(): void {
    this.state.schemaVersion = SCHEMA_VERSION;
    writeState(this.state);
  }

  listConversations(includeDeleted = false): Conversation[] {
    return clone(this.state.conversations)
      .filter((conversation) => includeDeleted || !conversation.isDeleted)
      .sort((a, b) => (b.lastMessageAt ?? b.updatedAt).localeCompare(a.lastMessageAt ?? a.updatedAt));
  }

  getConversation(id: string): Conversation | undefined {
    const conversation = this.state.conversations.find((item) => item.id === id && !item.isDeleted);
    return conversation ? clone(conversation) : undefined;
  }

  createConversation(input: {
    title?: string;
    mode?: ConversationMode;
    characterId?: string;
    projectId?: string;
    pageContext?: Conversation['pageContext'];
    model?: string;
    provider?: string;
  } = {}): Conversation {
    const timestamp = nowIso();
    const conversation: Conversation = {
      id: createId('conversation'),
      title: input.title?.trim() || 'New conversation',
      mode: input.mode ?? 'website-assistant',
      characterId: input.characterId,
      projectId: input.projectId,
      pageContext: input.pageContext,
      model: input.model,
      provider: input.provider,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false,
      metadata: {},
    };
    this.state.conversations.push(conversation);
    this.commit();
    return clone(conversation);
  }

  updateConversation(id: string, patch: Partial<Omit<Conversation, 'id' | 'createdAt'>>): Conversation | undefined {
    const index = this.state.conversations.findIndex((item) => item.id === id && !item.isDeleted);
    if (index < 0) return undefined;
    const current = this.state.conversations[index];
    const next: Conversation = { ...current, ...patch, updatedAt: nowIso() };
    this.state.conversations[index] = next;
    this.commit();
    return clone(next);
  }

  softDeleteConversation(id: string): boolean {
    const conversation = this.state.conversations.find((item) => item.id === id && !item.isDeleted);
    if (!conversation) return false;
    conversation.isDeleted = true;
    conversation.updatedAt = nowIso();
    this.commit();
    return true;
  }

  restoreConversation(id: string): boolean {
    const conversation = this.state.conversations.find((item) => item.id === id && item.isDeleted);
    if (!conversation) return false;
    conversation.isDeleted = false;
    conversation.updatedAt = nowIso();
    this.commit();
    return true;
  }

  listMessages(conversationId: string): Message[] {
    return clone(this.state.messages)
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getMessage(id: string): Message | undefined {
    const message = this.state.messages.find((item) => item.id === id);
    return message ? clone(message) : undefined;
  }

  saveMessage(message: Message): Message {
    const normalized = normalizeMessage(message);
    const index = this.state.messages.findIndex((item) => item.id === message.id);
    if (index >= 0) this.state.messages[index] = normalized;
    else this.state.messages.push(normalized);
    const conversation = this.state.conversations.find((item) => item.id === message.conversationId);
    if (conversation) {
      conversation.updatedAt = normalized.updatedAt;
      conversation.lastMessageAt = normalized.updatedAt;
      if (['New conversation', '新对话'].includes(conversation.title) && message.role === 'user') {
        conversation.title = message.content.trim().slice(0, 42) || conversation.title;
      }
    }
    this.commit();
    return clone(normalized);
  }

  updateMessage(id: string, patch: Partial<Omit<Message, 'id' | 'conversationId' | 'createdAt'>>): Message | undefined {
    const index = this.state.messages.findIndex((item) => item.id === id);
    if (index < 0) return undefined;
    const next = normalizeMessage({ ...this.state.messages[index], ...patch, updatedAt: nowIso() });
    this.state.messages[index] = next;
    this.commit();
    return clone(next);
  }

  removeMessage(id: string): boolean {
    const before = this.state.messages.length;
    this.state.messages = this.state.messages.filter((message) => message.id !== id);
    if (this.state.messages.length === before) return false;
    this.commit();
    return true;
  }

  removeMessagesAfter(conversationId: string, messageId: string): void {
    const index = this.state.messages.findIndex((message) => message.id === messageId && message.conversationId === conversationId);
    if (index < 0) return;
    this.state.messages = this.state.messages.filter((message, messageIndex) => message.conversationId !== conversationId || messageIndex <= index);
    this.commit();
  }

  clearConversationMessages(conversationId: string): void {
    this.state.messages = this.state.messages.filter((message) => message.conversationId !== conversationId);
    const conversation = this.state.conversations.find((item) => item.id === conversationId);
    if (conversation) {
      conversation.summary = undefined;
      conversation.updatedAt = nowIso();
      conversation.lastMessageAt = undefined;
    }
    this.commit();
  }

  setConversationSummary(conversationId: string, summary: ConversationSummary): void {
    const conversation = this.state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    conversation.summary = clone(summary);
    conversation.updatedAt = nowIso();
    this.commit();
  }

  exportConversation(conversationId: string): { conversation?: Conversation; messages: Message[] } {
    return {
      conversation: this.getConversation(conversationId),
      messages: this.listMessages(conversationId),
    };
  }

  listMemories(includeDeleted = false): MemoryRecord[] {
    return clone(this.state.memories).filter((memory) => includeDeleted || !memory.isDeleted);
  }

  saveMemory(memory: MemoryRecord): MemoryRecord {
    const normalized = normalizeMemory(memory);
    const index = this.state.memories.findIndex((item) => item.id === memory.id);
    if (index >= 0) this.state.memories[index] = normalized;
    else this.state.memories.push(normalized);
    this.commit();
    return clone(normalized);
  }

  updateMemory(id: string, patch: Partial<Omit<MemoryRecord, 'id' | 'createdAt'>>): MemoryRecord | undefined {
    const index = this.state.memories.findIndex((memory) => memory.id === id);
    if (index < 0) return undefined;
    const next = normalizeMemory({ ...this.state.memories[index], ...patch, updatedAt: nowIso() });
    this.state.memories[index] = next;
    this.commit();
    return clone(next);
  }

  getLevelProfile(userId: string): LevelProfile | undefined {
    const profile = this.state.levelProfiles.find((item) => item.userId === userId);
    return profile ? clone(profile) : undefined;
  }

  saveLevelProfile(profile: LevelProfile): LevelProfile {
    const index = this.state.levelProfiles.findIndex((item) => item.userId === profile.userId);
    if (index >= 0) this.state.levelProfiles[index] = clone(profile);
    else this.state.levelProfiles.push(clone(profile));
    this.commit();
    return clone(profile);
  }

  listLevelEvents(userId?: string): LevelEvent[] {
    const events = userId
      ? this.state.levelEvents.filter((event) => event.metadata.userId === userId)
      : this.state.levelEvents;
    return clone(events).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  saveLevelEvent(event: LevelEvent): LevelEvent {
    this.state.levelEvents.push(clone(event));
    this.commit();
    return clone(event);
  }

  listPrompts(): PromptDefinition[] {
    return clone(this.state.prompts);
  }

  savePrompt(prompt: PromptDefinition): PromptDefinition {
    const index = this.state.prompts.findIndex((item) => item.id === prompt.id && item.version === prompt.version);
    if (index >= 0) this.state.prompts[index] = clone(prompt);
    else this.state.prompts.push(clone(prompt));
    this.commit();
    return clone(prompt);
  }

  getAiConfig(): AiConfig {
    const storage = getStorage();
    if (!storage) return clone(DEFAULT_AI_CONFIG);
    try {
      const raw = storage.getItem(AI_CONFIG_KEY);
      if (!raw) return clone(DEFAULT_AI_CONFIG);
      return { ...clone(DEFAULT_AI_CONFIG), ...(JSON.parse(raw) as Partial<AiConfig>) };
    } catch {
      return clone(DEFAULT_AI_CONFIG);
    }
  }

  saveAiConfig(config: AiConfig): AiConfig {
    const next = { ...clone(config), updatedAt: nowIso() };
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(AI_CONFIG_KEY, JSON.stringify(next));
      } catch {
        // The in-memory caller still receives the config for the current request.
      }
    }
    return clone(next);
  }

  clearAiConfig(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(AI_CONFIG_KEY);
    } catch {
      // Ignore privacy-mode failures.
    }
  }

  clearAllConversationData(): void {
    this.state = clone(EMPTY_STATE);
    this.commit();
  }
}

export const conversationRepository = new ConversationRepository();
export const defaultAiConfig = clone(DEFAULT_AI_CONFIG);
