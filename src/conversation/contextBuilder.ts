import type { Conversation, ContextBlock, ContextBudget, ContextBuildResult, Message, PageContext } from './types.ts';
import { KnowledgeRetriever } from './knowledgeRetriever.ts';
import { MemoryManager, memoryManager } from './memoryManager.ts';
import { PromptRegistry, promptRegistry } from './promptRegistry.ts';
import { estimateTokens, truncateText } from './utils.ts';
import { characters } from '../data/characters.ts';
import { STICKER_SYSTEM_PROMPT } from './stickers.ts';

export const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  maxTokens: 12_000,
  system: 1_000,
  safety: 500,
  mode: 700,
  character: 900,
  page: 500,
  world: 700,
  canon: 900,
  knowledge: 2_000,
  memory: 1_500,
  summary: 1_400,
  recentMessages: 2_800,
};

export interface ContextBuildInput {
  conversation: Conversation;
  currentInput: string;
  recentMessages: Message[];
  model?: string;
  pageContext?: PageContext;
  characterId?: string;
  worldTime?: string;
  budget?: Partial<ContextBudget>;
  /** Pre-resolved knowledge documents (used by buildAsync after vector merge). */
  preparedDocuments?: import('./types.ts').KnowledgeDocument[];
}

function promptText(
  registry: PromptRegistry,
  type: Parameters<PromptRegistry['select']>[0],
  variables: Record<string, string | number | boolean> = {},
  options: Parameters<PromptRegistry['select']>[1] = {},
): string {
  const prompt = registry.select(type, options);
  return prompt ? registry.render(prompt, variables) : '';
}

function budgetWithDefault(input?: Partial<ContextBudget>): ContextBudget {
  return { ...DEFAULT_CONTEXT_BUDGET, ...(input ?? {}) };
}

export class ContextBuilder {
  private readonly memories: MemoryManager;
  private readonly knowledge: KnowledgeRetriever;
  private readonly prompts: PromptRegistry;

  constructor(
    memories: MemoryManager = memoryManager,
    knowledge: KnowledgeRetriever = new KnowledgeRetriever(),
    prompts: PromptRegistry = promptRegistry,
  ) {
    this.memories = memories;
    this.knowledge = knowledge;
    this.prompts = prompts;
  }

  build(input: ContextBuildInput): ContextBuildResult {
    const budget = budgetWithDefault(input.budget);
    const blocks: ContextBlock[] = [];
    const messages = [] as ContextBuildResult['messages'];
    const citations = [] as ContextBuildResult['citations'];
    const memoryIds: string[] = [];
    let tokenEstimate = 0;
    const pageRoute = input.pageContext?.route ?? input.conversation.pageContext?.route ?? '/';
    const characterId = input.characterId ?? input.conversation.characterId;
    const promptOptions = {
      model: input.model ?? input.conversation.model,
      characterId,
      pageRoute,
    };

    const addBlock = (id: string, label: string, content: string, maxTokens: number, appendAsSystemMessage = true): boolean => {
      if (!content.trim() || maxTokens <= 0) {
        blocks.push({ id, label, content: '', tokenEstimate: 0, included: false });
        return false;
      }
      const limited = truncateText(content, maxTokens * 3);
      const tokens = estimateTokens(limited);
      const included = tokenEstimate + tokens <= budget.maxTokens;
      blocks.push({ id, label, content: included ? limited : '', tokenEstimate: tokens, included });
      if (included && appendAsSystemMessage) {
        tokenEstimate += tokens;
        messages.push({ role: 'system', content: limited, name: label });
      } else if (included) {
        tokenEstimate += tokens;
      }
      return included;
    };

    addBlock('core-system', 'core-system', promptText(this.prompts, 'core-system', {}, promptOptions), budget.system);
    addBlock('sticker-pack', 'sticker-pack', STICKER_SYSTEM_PROMPT, 260);
    addBlock('safety-privacy', 'safety-privacy', promptText(this.prompts, 'safety-privacy', {}, promptOptions), budget.safety);

    const modePromptType = input.conversation.mode === 'character'
      ? 'character'
      : input.conversation.mode === 'story-query'
        ? 'story-context'
        : input.conversation.mode === 'nctb-proctor'
          ? 'nctb-proctor'
          : 'website-assistant';
    addBlock('mode', modePromptType, promptText(this.prompts, modePromptType, {
      pageRoute: input.pageContext?.route ?? input.conversation.pageContext?.route ?? '/',
      storyId: input.pageContext?.entityId ?? '',
    }, promptOptions), budget.mode);

    const pageContext = input.pageContext ?? input.conversation.pageContext;
    if (pageContext) {
      addBlock('page-context', 'page', [
        `Current route: ${pageContext.route}`,
        pageContext.title ? `Title: ${pageContext.title}` : '',
        pageContext.section ? `Section: ${pageContext.section}` : '',
        pageContext.entityId ? `Entity: ${pageContext.entityId}` : '',
        pageContext.selectedText ? `Selected text: ${pageContext.selectedText}` : '',
      ].filter(Boolean).join('\n'), budget.page);
    }

    addBlock('world-context', 'world', promptText(this.prompts, 'world-context', { worldTime: input.worldTime ?? 'current site time' }, promptOptions), budget.world);
    addBlock('canon-guard', 'canon-guard', promptText(this.prompts, 'canon-guard', {}, promptOptions), budget.canon);

    const maxSpoilerLevel = input.conversation.mode === 'story-query' ? 2 : 0;
    const selectedCharacter = input.conversation.mode === 'character' && characterId
      ? characters.find((character) => character.id === characterId)
      : undefined;
    const knowledgeQuery = selectedCharacter
      ? [input.currentInput, selectedCharacter.name, selectedCharacter.alias].filter(Boolean).join(' ')
      : input.currentInput;
    const documents = input.preparedDocuments ?? this.knowledge.search(knowledgeQuery, {
      maxResults: 6,
      maxSpoilerLevel,
      characterId: input.conversation.mode === 'character' ? characterId : undefined,
    });
    if (documents.length > 0) {
      citations.push(...this.knowledge.toCitations(documents, input.currentInput));
      addBlock('knowledge', 'knowledge-retrieval', [
        promptText(this.prompts, 'knowledge-retrieval', { documents: String(documents.length) }, promptOptions),
        ...documents.map((document, index) => `${index + 1}. [${document.title}] ${document.content.slice(0, 520)}\nRoute: ${document.route}\nStatus: ${document.canonStatus}`),
      ].join('\n'), budget.knowledge);
    }

    const memories = this.memories.query({
      query: input.currentInput,
      characterId: input.characterId ?? input.conversation.characterId,
      projectId: input.conversation.projectId,
      includeInferred: false,
      includeDraft: false,
      limit: 12,
    });
    if (memories.length > 0) {
      memoryIds.push(...memories.map((memory) => memory.id));
      addBlock('memory', 'memory-retrieve', [
        promptText(this.prompts, 'memory-retrieve', { memoryItems: String(memories.length) }, promptOptions),
        ...memories.map((memory, index) => `${index + 1}. ${memory.title}: ${memory.content} (v${memory.version}; ${memory.canonStatus})`),
      ].join('\n'), budget.memory);
    }

    if (input.conversation.summary) {
      const summary = input.conversation.summary;
      addBlock('summary', 'conversation-summary', [
        summary.content,
        `Confirmed constraints: ${summary.preservedConstraints.join('；')}`,
        `Unfinished tasks: ${summary.unresolvedTasks.join('；')}`,
        `Important people: ${summary.importantPeople.join('；')}`,
        `Important dates: ${summary.importantDates.join('；')}`,
        `Important numbers: ${summary.importantNumbers.join('；')}`,
        `Negative rules: ${summary.negativeRules.join('；')}`,
      ].join('\n'), budget.summary);
    }

    const recent = input.recentMessages
      .filter((message) => message.status === 'completed' && message.content.trim())
      .slice(-12);
    const recentContent = recent.map((message) => `${message.role}: ${message.content}`).join('\n');
    if (recentContent) {
      const recentIncluded = addBlock('recent-messages', 'recent-messages', recentContent, budget.recentMessages, false);
      if (recentIncluded) {
        for (const message of recent) messages.push({ role: message.role, content: message.content });
      }
    }

    messages.push({ role: 'user', content: input.currentInput });
    tokenEstimate += estimateTokens(input.currentInput);
    return { messages, blocks, citations, memoryIds, tokenEstimate };
  }

  /**
   * Async variant: resolves knowledge documents through the retriever's
   * semantic-merge path (BYOK vector search) before delegating to the
   * synchronous build. Falls back to keyword-only retrieval on any failure.
   */
  async buildAsync(input: ContextBuildInput): Promise<ContextBuildResult> {
    const characterId = input.characterId ?? input.conversation.characterId;
    const selectedCharacter = input.conversation.mode === 'character' && characterId
      ? characters.find((character) => character.id === characterId)
      : undefined;
    const knowledgeQuery = selectedCharacter
      ? [input.currentInput, selectedCharacter.name, selectedCharacter.alias].filter(Boolean).join(' ')
      : input.currentInput;
    let preparedDocuments: ContextBuildInput['preparedDocuments'];
    try {
      preparedDocuments = await this.knowledge.searchAsync(knowledgeQuery, {
        maxResults: 6,
        maxSpoilerLevel: input.conversation.mode === 'story-query' ? 2 : 0,
        characterId: input.conversation.mode === 'character' ? characterId : undefined,
      });
    } catch {
      preparedDocuments = undefined;
    }
    return this.build({ ...input, preparedDocuments });
  }
}
