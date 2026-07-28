import assert from 'node:assert/strict';
import test from 'node:test';

import { ConversationRepository } from '../src/conversation/storage.ts';
import { MemoryManager } from '../src/conversation/memoryManager.ts';
import { PromptRegistry } from '../src/conversation/promptRegistry.ts';
import { LevelSystem } from '../src/conversation/levelSystem.ts';
import { EchoModelAdapter, ModelAdapterError, OpenAICompatibleAdapter } from '../src/conversation/modelAdapters.ts';
import { exportSafeAiConfig, maskSecret, safeErrorMessage, sanitizeImportedConfig } from '../src/conversation/privacy.ts';
import { ContextBuilder } from '../src/conversation/contextBuilder.ts';
import { KnowledgeRetriever } from '../src/conversation/knowledgeRetriever.ts';
import { CanonGuard } from '../src/conversation/canonGuard.ts';
import { LOCAL_MODEL_TIERS } from '../src/conversation/localModelCatalog.ts';

test('memory conflicts create versions and retrieval prefers the latest valid record', () => {
  const repository = new ConversationRepository();
  const memories = new MemoryManager(repository);
  const first = memories.create({
    scope: 'project',
    type: 'constraint',
    title: 'Image policy',
    content: 'Do not regenerate character portraits.',
    source: 'user',
    canonStatus: 'canon',
    userConfirmed: true,
  });
  const second = memories.create({
    scope: 'project',
    type: 'constraint',
    title: 'Image policy',
    content: 'Only add non-character site visuals.',
    source: 'user',
    canonStatus: 'canon',
    userConfirmed: true,
  });
  assert.equal(second.version, 2);
  assert.equal(second.supersedes, first.id);
  assert.deepEqual(memories.query({}).map((memory) => memory.id), [second.id]);
  assert.equal(memories.getVersionHistory(second.id).length, 2);
});

test('character memory isolation rejects another character', () => {
  const repository = new ConversationRepository();
  const memories = new MemoryManager(repository);
  const privateMemory = memories.create({
    scope: 'character',
    type: 'fact',
    title: 'Private observation',
    content: 'Only Mia witnessed this.',
    source: 'story-scene',
    applicableCharacters: ['mia'],
    canonStatus: 'canon',
  });
  assert.equal(memories.query({ characterId: 'other' }).length, 0);
  assert.equal(memories.query({ characterId: 'mia' })[0]?.id, privateMemory.id);
});

test('prompt registry versions, diffs, disable and rollback without overwriting history', () => {
  const repository = new ConversationRepository();
  const registry = new PromptRegistry(repository);
  const original = registry.get('canon-guard');
  assert.ok(original);
  const next = registry.createVersion('canon-guard', { content: `${original.content}\nNever silently merge conflicts.`, changelog: 'Smoke test version.' });
  assert.equal(next.version, original.version + 1);
  assert.ok(registry.diff('canon-guard', original.version, next.version).some((line) => line.includes('Never silently')));
  registry.setEnabled('canon-guard', false);
  assert.equal(registry.select('canon-guard'), undefined);
  const rollback = registry.rollback('canon-guard', original.version);
  assert.equal(rollback.version, next.version + 1);
  assert.equal(registry.get('canon-guard', original.version)?.content, original.content);
});

test('level changes are event-driven and reversible', () => {
  const repository = new ConversationRepository();
  const levels = new LevelSystem(repository);
  const event = levels.applyEvent({ eventType: 'complete-game', reason: 'Completed a playable game.', triggeredBy: 'game-1', reversible: true });
  assert.equal(event.points, 24);
  assert.equal(levels.getProfile().interactionPoints, 24);
  levels.revertEvent(event.id);
  assert.equal(levels.getProfile().interactionPoints, 0);
});

test('echo adapter supports the provider-neutral adapter contract', async () => {
  const adapter = new EchoModelAdapter();
  const tokens = [];
  const result = await adapter.stream({
    messages: [{ role: 'user', content: 'hello' }],
    model: 'test-model',
    temperature: 0,
    maxTokens: 20,
    stream: true,
    timeoutMs: 1000,
  }, (token) => tokens.push(token));
  assert.equal(result.provider, 'test-echo');
  assert.equal(tokens.join(''), 'ECHO: hello');
});

test('AI config export and masking never include the secret value', () => {
  const config = {
    enabled: true,
    provider: 'openai-compatible',
    providerLabel: 'Test',
    baseUrl: 'https://example.test/v1',
    model: 'test-model',
    apiKey: 'sk-test-secret-value',
    temperature: 0.5,
    maxTokens: 100,
    contextWindow: 1000,
    stream: true,
    timeoutMs: 1000,
    retry: 0,
    headers: { 'X-Client': 'smoke' },
    updatedAt: new Date().toISOString(),
  };
  const exported = JSON.stringify(exportSafeAiConfig(config));
  assert.equal(exported.includes(config.apiKey), false);
  assert.equal(maskSecret(config.apiKey).includes(config.apiKey), false);
  assert.equal(sanitizeImportedConfig({ ...JSON.parse(exported), apiKey: 'should-not-import' }, config).apiKey, config.apiKey);
});

test('local model catalog covers 1M through 2.8T and browser mode imports safely', () => {
  assert.equal(LOCAL_MODEL_TIERS[0]?.parameters, 1_000_000);
  assert.equal(LOCAL_MODEL_TIERS.at(-1)?.parameters, 2_800_000_000_000);
  assert.ok(LOCAL_MODEL_TIERS.some((tier) => Boolean(tier.browserModel)));
  const current = {
    enabled: false,
    provider: 'openai-compatible',
    providerLabel: 'Test',
    baseUrl: 'https://example.test/v1',
    model: 'test-model',
    temperature: 0.5,
    maxTokens: 100,
    contextWindow: 1000,
    stream: true,
    timeoutMs: 1000,
    retry: 0,
    headers: {},
    updatedAt: new Date().toISOString(),
  };
  const browserConfig = sanitizeImportedConfig({
    provider: 'browser',
    providerLabel: 'Browser WebGPU',
    baseUrl: 'browser://webgpu',
    model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  }, current);
  assert.equal(browserConfig.provider, 'browser');
});

test('website knowledge citations navigate to verified routes and character search stays isolated', () => {
  const items = [
    { id: 'char_mia', title: 'Mia', content: 'Mia character record.', category: 'character', href: '#characters' },
    { id: 'char_other', title: 'Other', content: 'Another character record.', category: 'character', href: '#characters' },
    { id: 'relation_mia_other', title: 'Mia relation', content: 'A relation involving Mia.', category: 'relationship', href: '#character-network' },
    { id: 'story_secret', title: 'Secret story', content: 'A story record.', category: 'story', href: '#stories' },
  ];
  const retriever = new KnowledgeRetriever({ items, search: () => items.map((item) => ({ item })) });
  const documents = retriever.search('mia', { maxResults: 10, maxSpoilerLevel: 2, characterId: 'mia' });
  assert.deepEqual(documents.map((document) => document.id), ['char_mia', 'relation_mia_other']);
  const citation = retriever.toCitations(documents, 'mia')[0];
  assert.equal(citation.route, '/characters/mia');
  assert.equal(citation.relatedIds[0], 'mia');
});

test('remote adapter reports missing keys without contacting the provider and redacts errors', async () => {
  const config = {
    enabled: true,
    provider: 'openai-compatible',
    providerLabel: 'Test',
    baseUrl: 'https://example.test/v1',
    model: 'test-model',
    apiKey: undefined,
    temperature: 0.5,
    maxTokens: 100,
    contextWindow: 1000,
    stream: false,
    timeoutMs: 1000,
    retry: 0,
    headers: {},
    updatedAt: new Date().toISOString(),
  };
  const adapter = new OpenAICompatibleAdapter(config);
  await assert.rejects(
    adapter.complete({ messages: [{ role: 'user', content: 'hello' }], model: 'test-model', temperature: 0, maxTokens: 10, stream: false, timeoutMs: 1000 }),
    (error) => error instanceof ModelAdapterError && error.code === 'missing-api-key',
  );
  assert.equal(safeErrorMessage('Authorization: Bearer sk-test-secret-value'), 'Authorization: Bearer [redacted]');
});

test('context order keeps recent messages as chat messages without duplicating the system block', () => {
  const repository = new ConversationRepository();
  const conversation = repository.createConversation({ mode: 'website-assistant', title: 'Context smoke test' });
  const builder = new ContextBuilder(new MemoryManager(repository), new KnowledgeRetriever(), new PromptRegistry(repository));
  const result = builder.build({
    conversation,
    currentInput: 'unmatched-context-smoke-input',
    recentMessages: [
      {
        id: 'user-1',
        conversationId: conversation.id,
        role: 'user',
        content: 'Remember this recent question.',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        citations: [],
        toolCalls: [],
        attachments: [],
        tokenEstimate: 5,
        status: 'completed',
        metadata: {},
      },
      {
        id: 'assistant-1',
        conversationId: conversation.id,
        role: 'assistant',
        content: 'I will keep it in the current context.',
        createdAt: '2026-01-01T00:00:01.000Z',
        updatedAt: '2026-01-01T00:00:01.000Z',
        citations: [],
        toolCalls: [],
        attachments: [],
        tokenEstimate: 7,
        status: 'completed',
        metadata: {},
      },
    ],
  });
  const recentBlock = result.blocks.find((block) => block.id === 'recent-messages');
  assert.equal(recentBlock?.included, true);
  assert.equal(result.messages.filter((message) => message.name === 'recent-messages').length, 0);
  assert.deepEqual(result.messages.slice(-3).map((message) => message.content), [
    'Remember this recent question.',
    'I will keep it in the current context.',
    'unmatched-context-smoke-input',
  ]);
});

test('canon guard blocks overwriting locked canon but allows a labeled draft for review', () => {
  const repository = new ConversationRepository();
  const memories = new MemoryManager(repository);
  const guard = new CanonGuard(repository);
  memories.create({
    scope: 'world',
    type: 'fact',
    title: 'Giant-country scale',
    content: 'The canonical height scale is twelve to one.',
    source: 'locked-setting',
    canonStatus: 'canon',
    userConfirmed: true,
    tags: ['scale'],
  });
  const candidate = {
    scope: 'world',
    type: 'fact',
    title: 'Giant-country scale',
    content: 'The height scale is ten to one.',
    source: 'manual-editor',
    canonStatus: 'canon',
    userConfirmed: true,
    tags: ['scale'],
  };
  assert.equal(guard.assessMemory(candidate).verdict, 'blocked');
  assert.equal(guard.assessMemory({ ...candidate, canonStatus: 'draft' }).verdict, 'review');
});

test('character context includes the selected public profile and a strict knowledge boundary', () => {
  const repository = new ConversationRepository();
  const conversation = repository.createConversation({ mode: 'character', title: 'Character context', characterId: 'xiaoman' });
  const builder = new ContextBuilder(new MemoryManager(repository), new KnowledgeRetriever({ items: [], search: () => [] }), new PromptRegistry(repository));
  const result = builder.build({ conversation, currentInput: 'Introduce yourself.', recentMessages: [], characterId: 'xiaoman' });
  const profile = result.blocks.find((block) => block.id === 'character-profile');
  assert.equal(profile?.included, true);
  assert.match(profile?.content ?? '', /小满/);
  assert.match(profile?.content ?? '', /Knowledge boundary/);
});

test('built-in prompts are practical Chinese instructions and render page variables', () => {
  const repository = new ConversationRepository();
  const registry = new PromptRegistry(repository);
  const core = registry.get('core-system');
  const website = registry.get('website-assistant');
  assert.equal(core?.version, 3);
  assert.match(core?.content ?? '', /先直接回答最重要的结论/);
  assert.equal(website?.version, 2);
  const rendered = registry.render(website, { pageRoute: '/stories' });
  assert.match(rendered, /当前页面路径是 \/stories/);
  assert.equal(rendered.includes('{{pageRoute}}'), false);
});

test('character and story mode prompts are injected only once', () => {
  const repository = new ConversationRepository();
  const registry = new PromptRegistry(repository);
  const builder = new ContextBuilder(
    new MemoryManager(repository),
    new KnowledgeRetriever({ items: [], search: () => [] }),
    registry,
  );

  const characterConversation = repository.createConversation({ mode: 'character', characterId: 'xiaoman' });
  const characterResult = builder.build({
    conversation: characterConversation,
    currentInput: '你好',
    recentMessages: [],
    characterId: 'xiaoman',
  });
  const characterRules = characterResult.messages
    .map((message) => message.content)
    .join('\n')
    .match(/只有在用户明确选择角色后/g) ?? [];
  assert.equal(characterRules.length, 1);

  const storyConversation = repository.createConversation({
    mode: 'story-query',
    pageContext: { route: '/stories/example', entityId: 'example' },
  });
  const storyResult = builder.build({
    conversation: storyConversation,
    currentInput: '总结这个故事',
    recentMessages: [],
  });
  const storyRules = storyResult.messages
    .map((message) => message.content)
    .join('\n')
    .match(/当前故事标识是/g) ?? [];
  assert.equal(storyRules.length, 1);
});
