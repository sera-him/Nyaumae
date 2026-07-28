export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'stopped' | 'failed';

export type ConversationMode =
  | 'website-assistant'
  | 'character'
  | 'story-query'
  | 'nctb-proctor'
  | 'game-assistant'
  | 'creative';

export type MemoryScope = 'conversation' | 'user' | 'project' | 'world' | 'character' | 'plot';

export type MemoryType =
  | 'fact'
  | 'constraint'
  | 'task'
  | 'person'
  | 'date'
  | 'number'
  | 'negative-rule'
  | 'event'
  | 'state'
  | 'summary'
  | 'preference'
  | 'knowledge';

export type CanonStatus = 'canon' | 'draft' | 'deprecated' | 'inferred' | 'user-preference' | 'system-rule';

export interface PageContext {
  route: string;
  title?: string;
  section?: string;
  entityId?: string;
  selectedText?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface Citation {
  id: string;
  title: string;
  route: string;
  type: KnowledgeDocument['type'];
  relatedIds: string[];
  excerpt: string;
  canonStatus: CanonStatus;
  spoilerLevel: number;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'completed' | 'failed';
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  textContent?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  provider?: string;
  characterId?: string;
  pageContext?: PageContext;
  citations: Citation[];
  toolCalls: ToolCallRecord[];
  attachments: Attachment[];
  tokenEstimate: number;
  status: MessageStatus;
  metadata: Record<string, unknown>;
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  content: string;
  preservedConstraints: string[];
  unresolvedTasks: string[];
  importantPeople: string[];
  importantDates: string[];
  importantNumbers: string[];
  negativeRules: string[];
  createdAt: string;
  updatedAt: string;
  sourceMessageIds: string[];
  version: number;
}

export interface Conversation {
  id: string;
  title: string;
  mode: ConversationMode;
  characterId?: string;
  projectId?: string;
  model?: string;
  provider?: string;
  pageContext?: PageContext;
  summary?: ConversationSummary;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  isDeleted: boolean;
  metadata: Record<string, unknown>;
}

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  type: MemoryType;
  title: string;
  content: string;
  source: string;
  sourceId?: string;
  userConfirmed: boolean;
  canonStatus: CanonStatus;
  confidence: number;
  importance: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  applicableCharacters: string[];
  applicableProjects: string[];
  tags: string[];
  version: number;
  supersedes?: string;
  isDeleted: boolean;
}

export interface MemoryQuery {
  query?: string;
  scope?: MemoryScope;
  type?: MemoryType;
  characterId?: string;
  projectId?: string;
  includeDraft?: boolean;
  includeInferred?: boolean;
  includeDeleted?: boolean;
  limit?: number;
}

export interface MemoryInput {
  scope: MemoryScope;
  type: MemoryType;
  title: string;
  content: string;
  source: string;
  sourceId?: string;
  userConfirmed?: boolean;
  canonStatus?: CanonStatus;
  confidence?: number;
  importance?: number;
  expiresAt?: string;
  applicableCharacters?: string[];
  applicableProjects?: string[];
  tags?: string[];
}

export interface LevelEvent {
  id: string;
  eventType:
    | 'valid-interaction'
    | 'discover-knowledge'
    | 'complete-story-node'
    | 'complete-game'
    | 'complete-test'
    | 'important-choice'
    | 'trust-gained'
    | 'conflict-triggered'
    | 'relationship-repaired';
  points: number;
  reason: string;
  triggeredBy?: string;
  createdAt: string;
  previousLevel: number;
  newLevel: number;
  previousRelationshipLevel?: number;
  newRelationshipLevel?: number;
  reversible: boolean;
  isReverted: boolean;
  metadata: Record<string, unknown>;
}

export interface LevelProfile {
  userId: string;
  interactionPoints: number;
  aiLevel: number;
  relationshipLevels: Record<string, number>;
  trust: Record<string, number>;
  explorationProgress: Record<string, number>;
  unlockedFeatures: string[];
  unlockedStoryNodes: string[];
  updatedAt: string;
}

export interface LevelRule {
  level: number;
  name: string;
  requiredPoints: number;
  unlocks: string[];
}

export interface PromptTestCase {
  id: string;
  input: string;
  expected: string;
  tags: string[];
}

export type PromptType =
  | 'core-system'
  | 'website-assistant'
  | 'character'
  | 'world-context'
  | 'story-context'
  | 'canon-guard'
  | 'memory-write'
  | 'memory-retrieve'
  | 'memory-summarize'
  | 'knowledge-retrieval'
  | 'tool-use'
  | 'report-generation'
  | 'safety-privacy'
  | 'nctb-proctor';

export interface PromptDefinition {
  id: string;
  name: string;
  type: PromptType;
  version: number;
  content: string;
  variables: string[];
  applicableModels: string[];
  applicableCharacters: string[];
  applicablePages: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  changelog: string;
  testCases: PromptTestCase[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'character' | 'relationship' | 'world' | 'location' | 'organization' | 'timeline' | 'story' | 'chapter' | 'game' | 'nctb' | 'feature';
  route: string;
  relatedIds: string[];
  canonStatus: CanonStatus;
  spoilerLevel: number;
  updatedAt: string;
  searchableText: string;
}

export interface KnowledgeSearchOptions {
  maxResults?: number;
  maxSpoilerLevel?: number;
  includeDraft?: boolean;
  characterId?: string;
}

export interface ModelMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

export interface ModelRequest {
  messages: ModelMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  timeoutMs: number;
  metadata?: Record<string, unknown>;
}

export interface ModelResult {
  content: string;
  model: string;
  provider: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ModelAdapter {
  readonly provider: string;
  complete(request: ModelRequest, signal?: AbortSignal): Promise<ModelResult>;
  stream(request: ModelRequest, onToken: (token: string) => void, signal?: AbortSignal): Promise<ModelResult>;
}

export type AiProvider = 'openai-compatible' | 'local' | 'browser';

export interface AiConfig {
  enabled: boolean;
  provider: AiProvider;
  providerLabel: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  stream: boolean;
  timeoutMs: number;
  retry: number;
  headers: Record<string, string>;
  updatedAt: string;
}

export interface AiConfigExport {
  enabled: boolean;
  provider: AiProvider;
  providerLabel: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  stream: boolean;
  timeoutMs: number;
  retry: number;
  headers: Record<string, string>;
  hasApiKey: boolean;
  updatedAt: string;
}

export interface ContextBudget {
  maxTokens: number;
  system: number;
  safety: number;
  mode: number;
  character: number;
  page: number;
  world: number;
  canon: number;
  knowledge: number;
  memory: number;
  summary: number;
  recentMessages: number;
}

export interface ContextBlock {
  id: string;
  label: string;
  content: string;
  tokenEstimate: number;
  included: boolean;
}

export interface ContextBuildResult {
  messages: ModelMessage[];
  blocks: ContextBlock[];
  citations: Citation[];
  memoryIds: string[];
  tokenEstimate: number;
}

export interface SendMessageOptions {
  conversationId: string;
  content: string;
  pageContext?: PageContext;
  characterId?: string;
  model?: string;
  onToken?: (token: string, accumulated: string) => void;
  signal?: AbortSignal;
  replaceMessageId?: string;
  regenerate?: boolean;
}

export interface ConversationTurnResult {
  userMessage: Message;
  assistantMessage: Message;
  context: ContextBuildResult;
  levelEvent?: LevelEvent;
}
