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
import { corpusSignature } from '../src/conversation/vectorSearch.ts';
import { createRemoteCloudAdapter, decryptEnvelope, encryptEnvelope } from '../src/lib/remoteCloudAdapter.ts';
import syncWorker from '../cloud/sync-worker/worker.mjs';

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

test('localized new conversations receive a useful title from the first user message', () => {
  const repository = new ConversationRepository();
  const conversation = repository.createConversation({ title: '新对话' });
  const timestamp = new Date().toISOString();
  repository.saveMessage({
    id: 'localized-title-message',
    conversationId: conversation.id,
    role: 'user',
    content: '请带我认识这个世界的主要角色',
    createdAt: timestamp,
    updatedAt: timestamp,
    citations: [],
    toolCalls: [],
    attachments: [],
    tokenEstimate: 8,
    status: 'completed',
    metadata: {},
  });
  assert.equal(repository.getConversation(conversation.id)?.title, '请带我认识这个世界的主要角色');
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

test('local model downloads distinguish verified Ollama packages from official weights', () => {
  const ollamaTiers = LOCAL_MODEL_TIERS.filter((tier) => tier.download.kind === 'ollama');
  const weightTiers = LOCAL_MODEL_TIERS.filter((tier) => tier.download.kind === 'huggingface');
  assert.ok(ollamaTiers.length > 0);
  assert.ok(ollamaTiers.every((tier) => tier.ollamaModel && tier.download.command === `ollama pull ${tier.ollamaModel}`));
  assert.ok(weightTiers.length > 0);
  assert.ok(weightTiers.every((tier) => !tier.ollamaModel && tier.download.command.startsWith('hf download ')));

  const kimiK3 = LOCAL_MODEL_TIERS.find((tier) => tier.id === '2_8t');
  assert.equal(kimiK3?.ollamaModel, undefined);
  assert.equal(kimiK3?.download.kind, 'huggingface');
  assert.equal(kimiK3?.download.command, 'hf download moonshotai/Kimi-K3 --local-dir "./models/Kimi-K3"');
  assert.match(kimiK3?.download.note ?? '', /不能直接通过 Ollama/);
  assert.equal(LOCAL_MODEL_TIERS.some((tier) => tier.ollamaModel === 'kimi-k3'), false);
  assert.equal(LOCAL_MODEL_TIERS.some((tier) => tier.deviceModel === 'EleutherAI/pythia-35m'), false);
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

test('character context retrieves the selected profile instead of injecting a static profile', () => {
  const repository = new ConversationRepository();
  const conversation = repository.createConversation({ mode: 'character', title: 'Character context', characterId: 'xiaoman' });
  let searchQuery = '';
  const item = {
    id: 'char_xiaoman',
    title: '小满',
    content: '小满的公开角色资料。',
    category: '角色',
    href: '#characters',
    relatedIds: ['xiaoman'],
    canonStatus: 'canon',
    spoilerLevel: 0,
  };
  const knowledge = new KnowledgeRetriever({
    items: [item],
    search: (query) => {
      searchQuery = query;
      return [{ item }];
    },
  });
  const builder = new ContextBuilder(new MemoryManager(repository), knowledge, new PromptRegistry(repository));
  const result = builder.build({ conversation, currentInput: 'Introduce yourself.', recentMessages: [], characterId: 'xiaoman' });
  const profile = result.blocks.find((block) => block.id === 'character-profile');
  const retrieved = result.blocks.find((block) => block.id === 'knowledge');
  assert.equal(profile, undefined);
  assert.match(searchQuery, /小满/);
  assert.match(retrieved?.content ?? '', /小满/);
});

test('built-in prompts are practical Chinese instructions and render page variables', () => {
  const repository = new ConversationRepository();
  const registry = new PromptRegistry(repository);
  const core = registry.get('core-system');
  const website = registry.get('website-assistant');
  assert.equal(core?.version, 6);
  assert.match(core?.content ?? '', /先直接回答最重要的结论/);
  assert.equal(website?.version, 3);
  assert.equal(registry.list().some((prompt) => /小满|xiaoman/i.test(prompt.content)), false);
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
  const characterPrompt = registry.get('character');
  assert.equal(characterPrompt?.version, 6);
  assert.equal(/小满|xiaoman/i.test(characterPrompt?.content ?? ''), false);
  const characterRules = characterResult.messages
    .map((message) => message.content)
    .join('\n')
    .match(/只有在用户明确选择角色/g) ?? [];
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

test('semantic searchAsync surfaces vector-only matches and degrades on provider failure', async () => {
  const keywordItem = {
    id: 'char_mia', title: 'Mia', content: 'Mia 的公开资料。', category: '角色', href: '#characters',
    relatedIds: ['mia'], canonStatus: 'canon', spoilerLevel: 0,
  };
  const semanticOnlyItem = {
    id: 'world_tides', title: '潮汐引擎', content: '世界观设定：潮汐引擎驱动浮岛。', category: '世界观', href: '#world',
    relatedIds: [], canonStatus: 'canon', spoilerLevel: 0,
  };
  const knowledge = new KnowledgeRetriever({
    items: [keywordItem, semanticOnlyItem],
    search: (query) => (query.includes('Mia') ? [{ item: keywordItem }] : []),
  });

  // No provider: keyword-only behaviour is preserved.
  assert.deepEqual((await knowledge.searchAsync('Mia')).map((doc) => doc.id), ['char_mia']);
  assert.deepEqual((await knowledge.searchAsync('浮岛能源')).map((doc) => doc.id), []);

  // Provider returns a vector hit for an item keyword search missed.
  knowledge.setSemanticProvider({
    rank: async () => new Map([[semanticOnlyItem.id, 0.9]]),
  });
  const merged = await knowledge.searchAsync('浮岛能源');
  assert.deepEqual(merged.map((doc) => doc.id), ['world_tides']);

  // Provider failure degrades to keyword-only instead of breaking the turn.
  knowledge.setSemanticProvider({ rank: async () => { throw new Error('embedding down'); } });
  assert.deepEqual((await knowledge.searchAsync('Mia')).map((doc) => doc.id), ['char_mia']);
});

test('corpus signature changes with content and stays stable for identical corpora', () => {
  const items = [{ id: 'a', text: 'alpha' }, { id: 'b', text: 'beta' }];
  assert.equal(corpusSignature(items), corpusSignature([...items]));
  assert.notEqual(corpusSignature(items), corpusSignature([{ id: 'a', text: 'alpha!' }, { id: 'b', text: 'beta' }]));
  assert.notEqual(corpusSignature(items), corpusSignature([{ id: 'a', text: 'alpha' }]));
});

test('AI config export carries semantic fields but never the key; import keeps them', () => {
  const repository = new ConversationRepository();
  const config = repository.saveAiConfig({
    ...repository.getAiConfig(),
    apiKey: 'sk-test-secret-value',
    semanticSearch: true,
    embeddingModel: 'text-embedding-3-small',
    embeddingBaseUrl: 'https://embed.example.com/v1',
  });
  const exported = exportSafeAiConfig(config);
  assert.equal(exported.semanticSearch, true);
  assert.equal(exported.embeddingModel, 'text-embedding-3-small');
  assert.equal(exported.embeddingBaseUrl, 'https://embed.example.com/v1');
  assert.equal(JSON.stringify(exported).includes('sk-test-secret-value'), false);
  const imported = sanitizeImportedConfig(exported, repository.getAiConfig());
  assert.equal(imported.semanticSearch, true);
  assert.equal(imported.embeddingModel, 'text-embedding-3-small');
  assert.equal(imported.apiKey, undefined);
});

test('remote sync envelope encrypts and decrypts with the sync key only', async () => {
  const envelope = { v: 1, updatedAt: new Date().toISOString(), payload: { hello: '世界', n: 42 } };
  const blob = await encryptEnvelope('sync-key-alpha', envelope);
  assert.equal(blob.includes('世界'), false);
  const roundTrip = await decryptEnvelope('sync-key-alpha', blob);
  assert.deepEqual(roundTrip.payload, envelope.payload);
  await assert.rejects(() => decryptEnvelope('sync-key-beta', blob));
});

function makeKvMock() {
  const map = new Map();
  return {
    get: async (key) => (map.has(key) ? map.get(key) : null),
    put: async (key, value) => { map.set(key, value); },
  };
}

test('remote cloud adapter pushes and pulls through the worker protocol', async () => {
  const kv = makeKvMock();
  const fetchImpl = async (url, init = {}) => {
    const request = new Request(url, { method: init.method ?? 'GET', headers: init.headers, body: init.body });
    return syncWorker.fetch(request, { SYNC_KV: kv });
  };
  const adapter = createRemoteCloudAdapter({ baseUrl: 'https://sync.example', syncKey: 'sync-key-alpha', fetchImpl });
  assert.equal(await adapter.pull('ai-config'), null);
  await adapter.push('ai-config', { enabled: true, hasApiKey: true });
  assert.deepEqual(await adapter.pull('ai-config'), { enabled: true, hasApiKey: true });
});

test('sync worker authenticates, isolates namespaces and validates payloads', async () => {
  const env = { SYNC_KV: makeKvMock() };
  const put = (key, blob) => new Request(`https://w.example/sync/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sync-key-alpha' },
    body: JSON.stringify({ blob }),
  });

  const unauthorized = await syncWorker.fetch(new Request('https://w.example/sync/x'), env);
  assert.equal(unauthorized.status, 401);

  assert.equal((await syncWorker.fetch(put('state', 'ciphertext'), env)).status, 200);
  const found = await syncWorker.fetch(new Request('https://w.example/sync/state', { headers: { Authorization: 'Bearer sync-key-alpha' } }), env);
  assert.equal(found.status, 200);
  assert.deepEqual(await found.json(), { blob: 'ciphertext' });

  // A different sync key sees a different namespace.
  const otherKey = await syncWorker.fetch(new Request('https://w.example/sync/state', { headers: { Authorization: 'Bearer sync-key-beta' } }), env);
  assert.equal(otherKey.status, 404);

  const badBlob = await syncWorker.fetch(put('state', ''), env);
  assert.equal(badBlob.status, 400);
});

test('conversation state sync snapshot replaces only through the sync entry point', () => {
  const repository = new ConversationRepository();
  const before = repository.getStateUpdatedAt();
  const snapshot = repository.getStateSnapshot();
  snapshot.conversations.push({
    id: 'conv_remote', title: 'From another device', mode: 'website-assistant',
    createdAt: before, updatedAt: before, isDeleted: false, metadata: {},
  });
  assert.equal(repository.replaceStateFromSync(snapshot), true);
  assert.equal(repository.listConversations().some((item) => item.id === 'conv_remote'), true);
  assert.equal(repository.replaceStateFromSync({ schemaVersion: 99 }), false);
});
