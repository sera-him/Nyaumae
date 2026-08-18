import type {
  Conversation,
  ConversationTurnResult,
  Message,
  MessageStatus,
  SendMessageOptions,
  ConversationSummary,
} from './types.ts';
import { conversationRepository, type ConversationRepository } from './storage.ts';
import { ContextBuilder } from './contextBuilder.ts';
import { contextBuilder, ensureSiteKnowledgeLoaded } from './siteContextBuilder.ts';
import { createModelAdapter, ModelAdapterError } from './modelAdapters.ts';
import { LevelSystem, levelSystem } from './levelSystem.ts';
import { isAbortError, estimateTokens, nowIso } from './utils.ts';
import { safeErrorMessage, validateAiConfig } from './privacy.ts';
import { memoryManager, MemoryManager } from './memoryManager.ts';

function messageTemplate(input: {
  conversationId: string;
  role: Message['role'];
  content: string;
  status: MessageStatus;
  model?: string;
  provider?: string;
  characterId?: string;
  pageContext?: Message['pageContext'];
  metadata?: Record<string, unknown>;
}): Message {
  const timestamp = nowIso();
  return {
    id: `${input.role}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    createdAt: timestamp,
    updatedAt: timestamp,
    model: input.model,
    provider: input.provider,
    characterId: input.characterId,
    pageContext: input.pageContext,
    citations: [],
    toolCalls: [],
    attachments: [],
    tokenEstimate: estimateTokens(input.content),
    status: input.status,
    metadata: input.metadata ?? {},
  };
}

function summarize(messages: Message[], conversationId: string): ConversationSummary {
  const older = messages.slice(0, Math.max(0, messages.length - 12));
  const lines = older.map((message) => `${message.role}: ${message.content}`).join('\n');
  const explicit = older.filter((message) => message.role === 'user').map((message) => message.content).slice(0, 8);
  const constraints = older
    .flatMap((message) => message.content.split(/[。！？\n]/))
    .filter((line) => /必须|不要|不能|不得|仅|只可以|禁止|必须保留/i.test(line))
    .slice(0, 12);
  const tasks = older
    .flatMap((message) => message.content.split(/[。！？\n]/))
    .filter((line) => /未完成|待办|TODO|接下来|之后|继续/i.test(line))
    .slice(0, 12);
  const importantDates = [...lines.matchAll(/\b(?:19|20)\d{2}(?:[-/.]\d{1,2})?(?:[-/.]\d{1,2})?\b/g)].map((match) => match[0]).slice(0, 12);
  const importantNumbers = [...lines.matchAll(/\b\d+(?:\.\d+)?\b/g)].map((match) => match[0]).slice(0, 12);
  const timestamp = nowIso();
  return {
    id: `summary_${conversationId}_${Date.now()}`,
    conversationId,
    content: lines.slice(0, 5000),
    preservedConstraints: [...new Set([...explicit, ...constraints])].slice(0, 16),
    unresolvedTasks: [...new Set(tasks)].slice(0, 12),
    importantPeople: [],
    importantDates: [...new Set(importantDates)],
    importantNumbers: [...new Set(importantNumbers)],
    negativeRules: constraints.filter((line) => /不要|不能|不得|禁止/i.test(line)).slice(0, 12),
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceMessageIds: older.map((message) => message.id),
    version: 1,
  };
}

function buildGroundedPreview(context: ConversationTurnResult['context']): string {
  const evidence = context.citations.slice(0, 2);
  const evidenceText = evidence.length > 0
    ? evidence.map((citation) => `「${citation.excerpt.replace(/\s+/g, ' ').slice(0, 150)}」`).join('\n')
    : '我在当前可读取的设定中没有找到足够证据。';
  return [
    '我已经检查了当前对话可用的站内资料。',
    evidenceText,
    '',
    '这是本地证据预览：检索、记忆隔离与正史护栏已经运行，但还没有调用语言模型。连接模型后会生成更自然、完整的角色回复。',
  ].join('\n');
}

export interface ConversationEngineDependencies {
  persist?: ConversationRepository;
  context?: ContextBuilder;
  levels?: LevelSystem;
  memories?: MemoryManager;
}

export class ConversationEngine {
  private readonly persist: ConversationRepository;
  private readonly context: ContextBuilder;
  private readonly levels: LevelSystem;
  private readonly memories: MemoryManager;

  constructor(dependencies: ConversationEngineDependencies = {}) {
    this.persist = dependencies.persist ?? conversationRepository;
    this.context = dependencies.context ?? contextBuilder;
    this.levels = dependencies.levels ?? levelSystem;
    this.memories = dependencies.memories ?? memoryManager;
  }

  createConversation(input?: Parameters<ConversationRepository['createConversation']>[0]): Conversation {
    return this.persist.createConversation(input);
  }

  listConversations(): Conversation[] {
    return this.persist.listConversations();
  }

  getConversation(id: string): Conversation | undefined {
    return this.persist.getConversation(id);
  }

  getMessages(id: string): Message[] {
    return this.persist.listMessages(id);
  }

  async sendMessage(options: SendMessageOptions): Promise<ConversationTurnResult> {
    const conversation = this.persist.getConversation(options.conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    const content = options.content.trim();
    if (!content) throw new Error('Message cannot be empty.');
    const config = this.persist.getAiConfig();
    const model = options.model?.trim() || config.model;
    const characterId = options.characterId ?? conversation.characterId;
    if (conversation.mode === 'character' && !characterId) {
      throw new Error('请先选择角色，再开始角色对话。');
    }

    let userMessage: Message;
    if (options.replaceMessageId) {
      const existing = this.persist.getMessage(options.replaceMessageId);
      if (!existing || existing.role !== 'user' || existing.conversationId !== conversation.id) throw new Error('Message to edit was not found.');
      this.persist.removeMessagesAfter(conversation.id, existing.id);
      userMessage = this.persist.updateMessage(existing.id, {
        content,
        updatedAt: nowIso(),
        status: 'completed',
        tokenEstimate: estimateTokens(content),
        pageContext: options.pageContext ?? existing.pageContext,
        characterId,
      }) ?? existing;
    } else {
      userMessage = this.persist.saveMessage(messageTemplate({
        conversationId: conversation.id,
        role: 'user',
        content,
        status: 'completed',
        model,
        provider: config.providerLabel,
        characterId,
        pageContext: options.pageContext,
      }));
    }

    const previousMessages = this.persist.listMessages(conversation.id).filter((message) => message.id !== userMessage.id);
    if (previousMessages.length > 20 || estimateTokens(previousMessages) > config.contextWindow * 0.75) {
      this.persist.setConversationSummary(conversation.id, summarize(previousMessages, conversation.id));
    }
    const latestConversation = this.persist.getConversation(conversation.id) ?? conversation;
    await ensureSiteKnowledgeLoaded();
    const builtContext = this.context.build({
      conversation: latestConversation,
      currentInput: content,
      recentMessages: previousMessages,
      model,
      pageContext: options.pageContext,
      characterId,
      budget: { maxTokens: Math.max(2048, config.contextWindow - config.maxTokens) },
    });

    const assistant = this.persist.saveMessage(messageTemplate({
      conversationId: conversation.id,
      role: 'assistant',
      content: '',
      status: 'pending',
      model,
      provider: config.providerLabel,
      characterId,
      pageContext: options.pageContext,
      metadata: { contextTokenEstimate: builtContext.tokenEstimate, memoryIds: builtContext.memoryIds },
    }));

    const invalidConfig = !config.enabled ? ['AI 总开关已关闭，请先在 AI 设置中开启。'] : validateAiConfig({ ...config, model });
    if (invalidConfig.length > 0) {
      if (!config.enabled) {
        const preview = buildGroundedPreview(builtContext);
        const completed = this.persist.updateMessage(assistant.id, {
          content: preview,
          status: 'completed',
          provider: 'local-grounded-preview',
          model: 'evidence-preview',
          citations: builtContext.citations,
          tokenEstimate: estimateTokens(preview),
          metadata: { ...assistant.metadata, previewMode: true },
        }) ?? assistant;
        const levelEvent = this.levels.applyEvent({
          eventType: 'valid-interaction',
          reason: 'Completed a grounded local preview turn.',
          triggeredBy: userMessage.id,
          relationshipCharacterId: conversation.mode === 'character' ? characterId : undefined,
          relationshipDelta: conversation.mode === 'character' ? 1 : undefined,
          trustDelta: conversation.mode === 'character' ? 1 : undefined,
          metadata: { conversationId: conversation.id, previewMode: true },
        });
        this.captureExplicitMemory(content, latestConversation, userMessage.id, characterId);
        return { userMessage, assistantMessage: completed, context: builtContext, levelEvent };
      }
      const failed = this.persist.updateMessage(assistant.id, {
        content: invalidConfig.join(' '),
        status: 'failed',
        metadata: { ...assistant.metadata, errorCode: 'configuration' },
      }) ?? assistant;
      return { userMessage, assistantMessage: failed, context: builtContext };
    }

    const adapter = createModelAdapter({ ...config, model });
    let accumulated = '';
    this.persist.updateMessage(assistant.id, { status: config.stream ? 'streaming' : 'pending' });
    const onToken = (token: string) => {
      accumulated += token;
      options.onToken?.(token, accumulated);
      const current = this.persist.getMessage(assistant.id);
      if (current && (Date.now() - Date.parse(current.updatedAt) > 120 || token.length > 20)) {
        this.persist.updateMessage(assistant.id, { content: accumulated, status: 'streaming', tokenEstimate: estimateTokens(accumulated) });
      }
    };

    try {
      const result = config.stream
        ? await adapter.stream({
          messages: builtContext.messages,
          model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          stream: true,
          timeoutMs: config.timeoutMs,
          metadata: { conversationId: conversation.id, mode: conversation.mode },
        }, onToken, options.signal)
        : await adapter.complete({
          messages: builtContext.messages,
          model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          stream: false,
          timeoutMs: config.timeoutMs,
          metadata: { conversationId: conversation.id, mode: conversation.mode },
        }, options.signal);
      accumulated = result.content;
      const completed = this.persist.updateMessage(assistant.id, {
        content: result.content,
        status: 'completed',
        provider: result.provider,
        model: result.model,
        citations: builtContext.citations,
        tokenEstimate: result.usage?.completionTokens ?? estimateTokens(result.content),
        metadata: { ...assistant.metadata, finishReason: result.finishReason, usage: result.usage },
      }) ?? assistant;
      const levelEvent = this.levels.applyEvent({
        eventType: 'valid-interaction',
        reason: 'Completed a model-assisted conversation turn.',
        triggeredBy: userMessage.id,
        relationshipCharacterId: conversation.mode === 'character' ? characterId : undefined,
        relationshipDelta: conversation.mode === 'character' ? 2 : undefined,
        trustDelta: conversation.mode === 'character' ? 1 : undefined,
        metadata: { conversationId: conversation.id },
      });
      this.captureExplicitMemory(content, latestConversation, userMessage.id, characterId);
      return { userMessage, assistantMessage: completed, context: builtContext, levelEvent };
    } catch (error) {
      const stopped = isAbortError(error) || error instanceof ModelAdapterError && error.code === 'aborted' || options.signal?.aborted;
      const status: MessageStatus = stopped ? 'stopped' : 'failed';
      const message = stopped
        ? (accumulated || '已停止生成。')
        : safeErrorMessage(error);
      const failed = this.persist.updateMessage(assistant.id, {
        content: message,
        status,
        citations: builtContext.citations,
        tokenEstimate: estimateTokens(message),
        metadata: {
          ...assistant.metadata,
          errorCode: error instanceof ModelAdapterError ? error.code : 'unknown',
        },
      }) ?? assistant;
      return { userMessage, assistantMessage: failed, context: builtContext };
    }
  }

  async regenerateLatest(conversationId: string, options: Omit<SendMessageOptions, 'conversationId' | 'content' | 'regenerate'> = {}): Promise<ConversationTurnResult | undefined> {
    const messages = this.persist.listMessages(conversationId);
    const assistant = [...messages].reverse().find((message) => message.role === 'assistant');
    const user = assistant ? [...messages].reverse().find((message) => message.role === 'user' && message.createdAt < assistant.createdAt) : undefined;
    if (!assistant || !user) return undefined;
    this.persist.removeMessage(assistant.id);
    return this.sendMessage({ ...options, conversationId, content: user.content, replaceMessageId: user.id, regenerate: true });
  }

  exportConversation(conversationId: string): string {
    return JSON.stringify(this.persist.exportConversation(conversationId), null, 2);
  }

  clearConversationContext(conversationId: string): void {
    this.persist.clearConversationMessages(conversationId);
    this.memories.clearScope('conversation', conversationId);
  }

  private captureExplicitMemory(
    content: string,
    conversation: Conversation,
    sourceMessageId: string,
    characterId?: string,
  ): void {
    const explicit = content.match(/(?:请|帮我)?记住[：:\s]+(.+)/s)?.[1]?.trim();
    const negative = content.match(/(?:以后)?(?:请)?(?:不要|禁止)[：:\s]*(.+)/s)?.[1]?.trim();
    const remembered = explicit || negative;
    if (!remembered) return;
    const isNegative = Boolean(negative);
    this.memories.create({
      scope: characterId ? 'character' : 'user',
      type: isNegative ? 'negative-rule' : 'preference',
      title: `${isNegative ? '不要' : '记住'}：${remembered.slice(0, 24)}`,
      content: remembered,
      source: 'explicit-user-message',
      sourceId: sourceMessageId,
      userConfirmed: true,
      canonStatus: 'user-preference',
      confidence: 1,
      importance: isNegative ? 0.9 : 0.75,
      applicableCharacters: characterId ? [characterId] : [],
      applicableProjects: conversation.projectId ? [conversation.projectId] : [],
      tags: ['explicit', isNegative ? 'negative-rule' : 'preference'],
    });
  }
}

export const conversationEngine = new ConversationEngine();
