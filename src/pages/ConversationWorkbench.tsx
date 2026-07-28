import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertTriangle,
  Archive,
  BookOpen,
  BookmarkPlus,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  Clock3,
  Copy,
  Database,
  Download,
  Eraser,
  FileText,
  History,
  Layers3,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { characters, type Character } from '@/data/characters';
import { getCharacterCardImageLocal } from '@/data/characterImages';
import { conversationEngine } from '@/conversation/conversationEngine';
import { conversationRepository } from '@/conversation/storage';
import { memoryManager } from '@/conversation/memoryManager';
import { canonGuard } from '@/conversation/canonGuard';
import { levelSystem, LEVEL_RULES } from '@/conversation/levelSystem';
import { promptRegistry } from '@/conversation/promptRegistry';
import type {
  CanonStatus,
  Citation,
  ContextBuildResult,
  Conversation,
  ConversationMode,
  MemoryRecord,
  Message,
  MemoryScope,
} from '@/conversation/types';
import './ConversationWorkbench.css';

type InspectorTab = 'context' | 'memory' | 'canon';

const FEATURED_CHARACTER_IDS = ['xiaoman', 'miaowu', 'miia', 'gpt', 'xiaohe', 'xiaogu', 'chuxia', 'changfeng'];
const DEFAULT_CONTEXT_BLOCKS = [
  ['core-system', '核心规则', '身份、行为边界与回答原则'],
  ['character-profile', '角色状态', '人物档案、所处时间与知情范围'],
  ['world-context', '世界状态', '当前地点、时间和可见事件'],
  ['canon-guard', '正史护栏', '来源优先级与冲突停止规则'],
  ['knowledge', '设定检索', '与本轮问题最相关的站内证据'],
  ['memory', '长期记忆', '经确认且当前角色可读取的记忆'],
  ['summary', '历史摘要', '较早对话的结构化压缩'],
  ['recent-messages', '近期对话', '最近十二条有效消息'],
] as const;

const MODE_LABELS: Record<ConversationMode, string> = {
  'website-assistant': '站点向导',
  character: '角色扮演',
  'story-query': '设定问答',
  'nctb-proctor': '测验助手',
  'game-assistant': '游戏搭档',
  creative: '共同创作',
};

const MEMORY_SCOPE_LABELS: Record<MemoryScope, string> = {
  conversation: '本次对话',
  user: '关于我',
  project: '项目',
  world: '世界',
  character: '角色',
  plot: '剧情',
};

const CANON_LABELS: Record<CanonStatus, string> = {
  canon: '正史',
  draft: '草案',
  deprecated: '已废弃',
  inferred: '推断',
  'user-preference': '用户偏好',
  'system-rule': '系统规则',
};

function formatTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  } catch {
    return '';
  }
}

function compactDate(value: string): string {
  try {
    return new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' }).format(
      Math.max(-30, Math.min(0, Math.round((Date.parse(value) - Date.now()) / 86_400_000))),
      'day',
    );
  } catch {
    return '';
  }
}

function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function resolveCharacter(id?: string): Character {
  return characters.find((character) => character.id === id)
    ?? characters.find((character) => character.id === 'xiaoman')
    ?? characters[0];
}

function statusText(message: Message): string {
  if (message.status === 'streaming') return '正在回应';
  if (message.status === 'failed') return '发送失败';
  if (message.status === 'stopped') return '已停止';
  return formatTime(message.createdAt);
}

export default function ConversationWorkbench() {
  const location = useLocation();
  const endRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [notice, setNotice] = useState('');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('context');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastContext, setLastContext] = useState<ContextBuildResult | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [profile, setProfile] = useState(() => levelSystem.getProfile());
  const [memoryComposerOpen, setMemoryComposerOpen] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryScope, setMemoryScope] = useState<MemoryScope>('character');
  const [memoryCanon, setMemoryCanon] = useState<CanonStatus>('user-preference');

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const activeMode = selectedConversation?.mode ?? 'character';
  const selectedCharacter = resolveCharacter(selectedConversation?.characterId);
  const portrait = getCharacterCardImageLocal(selectedCharacter.id);
  const aiConfig = conversationRepository.getAiConfig();
  const featuredCharacters = useMemo(
    () => FEATURED_CHARACTER_IDS.map((id) => characters.find((character) => character.id === id)).filter((character): character is Character => Boolean(character)),
    [],
  );
  const visibleConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const character = characters.find((item) => item.id === conversation.characterId);
      return `${conversation.title} ${character?.name ?? ''}`.toLocaleLowerCase().includes(query);
    });
  }, [conversations, search]);
  const activeMemories = useMemo(
    () => memories.filter((memory) => !memory.isDeleted && memory.canonStatus !== 'deprecated'),
    [memories],
  );
  const currentRelationship = profile.relationshipLevels[selectedCharacter.id] ?? 0;
  const currentTrust = profile.trust[selectedCharacter.id] ?? 0;
  const nextLevel = LEVEL_RULES.find((rule) => rule.level > profile.aiLevel);
  const currentRule = [...LEVEL_RULES].reverse().find((rule) => rule.level <= profile.aiLevel) ?? LEVEL_RULES[0];
  const previousRequired = currentRule.requiredPoints;
  const nextRequired = nextLevel?.requiredPoints ?? Math.max(profile.interactionPoints, currentRule.requiredPoints);
  const levelProgress = nextLevel
    ? Math.max(0, Math.min(100, ((profile.interactionPoints - previousRequired) / (nextRequired - previousRequired)) * 100))
    : 100;
  const contextLimit = Math.max(2_048, aiConfig.contextWindow - aiConfig.maxTokens);
  const contextUsage = lastContext ? Math.min(100, Math.round((lastContext.tokenEstimate / contextLimit) * 100)) : 0;
  const enabledPrompts = promptRegistry.list().filter((prompt) => prompt.enabled);
  const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const latestCitations: Citation[] = latestAssistant?.citations ?? lastContext?.citations ?? [];

  const refreshMemories = (characterId = selectedCharacter.id) => {
    setMemories(memoryManager.query({
      characterId,
      includeDraft: true,
      includeInferred: true,
      limit: 60,
    }));
  };

  const refresh = (preferredId?: string) => {
    const next = conversationEngine.listConversations();
    setConversations(next);
    const nextId = preferredId && next.some((conversation) => conversation.id === preferredId)
      ? preferredId
      : selectedId && next.some((conversation) => conversation.id === selectedId)
        ? selectedId
        : next[0]?.id ?? '';
    setSelectedId(nextId);
    setMessages(nextId ? conversationEngine.getMessages(nextId) : []);
    const nextCharacter = resolveCharacter(next.find((conversation) => conversation.id === nextId)?.characterId);
    refreshMemories(nextCharacter.id);
    setProfile(levelSystem.getProfile());
  };

  useEffect(() => {
    queueMicrotask(() => {
      const existing = conversationEngine.listConversations();
      if (existing.length > 0) {
        const preferred = existing.find((conversation) => conversation.mode === 'character') ?? existing[0];
        setConversations(existing);
        setSelectedId(preferred.id);
        setMessages(conversationEngine.getMessages(preferred.id));
        refreshMemories(resolveCharacter(preferred.characterId).id);
        return;
      }
      const created = conversationEngine.createConversation({
        title: '小满 · 雨后的初见',
        mode: 'character',
        characterId: 'xiaoman',
        projectId: 'giant-country',
        pageContext: { route: '/chat', title: '角色对话', section: '东海市 · 雨后' },
      });
      setConversations([created]);
      setSelectedId(created.id);
      setMessages([]);
      refreshMemories('xiaoman');
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText]);

  const selectConversation = (id: string) => {
    const next = conversations.find((conversation) => conversation.id === id);
    setSelectedId(id);
    setMessages(conversationEngine.getMessages(id));
    setInput('');
    setEditingId('');
    setLastContext(null);
    setNotice('');
    setSidebarOpen(false);
    refreshMemories(resolveCharacter(next?.characterId).id);
  };

  const createConversation = (character = selectedCharacter) => {
    const created = conversationEngine.createConversation({
      title: `${character.name} · 新对话`,
      mode: 'character',
      characterId: character.id,
      projectId: character.group === 'giant' ? 'giant-country' : character.group,
      pageContext: { route: '/chat', title: `${character.name}角色对话`, section: character.groupLabel },
    });
    refresh(created.id);
    setSidebarOpen(false);
  };

  const updateMode = (mode: ConversationMode) => {
    if (!selectedConversation) return;
    conversationRepository.updateConversation(selectedConversation.id, { mode });
    refresh(selectedConversation.id);
  };

  const updateCharacter = (character: Character) => {
    if (!selectedConversation) {
      createConversation(character);
      return;
    }
    conversationRepository.updateConversation(selectedConversation.id, {
      characterId: character.id,
      mode: 'character',
      projectId: character.group === 'giant' ? 'giant-country' : character.group,
      title: messages.length === 0 ? `${character.name} · 新对话` : selectedConversation.title,
    });
    refresh(selectedConversation.id);
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = input.trim();
    if (!content || !selectedConversation || isGenerating) return;
    setInput('');
    setNotice('');
    setStreamingText('');
    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await conversationEngine.sendMessage({
        conversationId: selectedConversation.id,
        content,
        model: selectedConversation.model,
        characterId: selectedCharacter.id,
        pageContext: {
          route: location.pathname,
          title: document.title,
          section: `${selectedCharacter.groupLabel} · 角色对话`,
          entityId: selectedCharacter.id,
          metadata: { spoilerLevel: 0, canonGuard: true },
        },
        replaceMessageId: editingId || undefined,
        signal: controller.signal,
        onToken: (_token, accumulated) => setStreamingText(accumulated),
      });
      setLastContext(result.context);
      setMessages(conversationEngine.getMessages(selectedConversation.id));
      setEditingId('');
      setStreamingText('');
      setProfile(levelSystem.getProfile());
      refreshMemories(selectedCharacter.id);
      if (result.assistantMessage.status === 'failed') setNotice(result.assistantMessage.content);
      if (result.assistantMessage.metadata.previewMode) {
        setNotice('当前为本地证据预览；角色边界、检索和正史护栏已运行。连接模型后可获得完整自然语言回复。');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '这条消息没有发送成功。');
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
      refresh(selectedConversation.id);
    }
  };

  const regenerate = async () => {
    if (!selectedConversation || isGenerating) return;
    setIsGenerating(true);
    setStreamingText('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await conversationEngine.regenerateLatest(selectedConversation.id, {
        characterId: selectedCharacter.id,
        pageContext: { route: location.pathname, title: document.title, section: selectedCharacter.groupLabel, entityId: selectedCharacter.id },
        signal: controller.signal,
        onToken: (_token, accumulated) => setStreamingText(accumulated),
      });
      if (result) setLastContext(result.context);
      setMessages(conversationEngine.getMessages(selectedConversation.id));
      setProfile(levelSystem.getProfile());
    } finally {
      setStreamingText('');
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const saveMemory = () => {
    const title = memoryTitle.trim();
    const content = memoryContent.trim();
    if (!title || !content) {
      setNotice('请补充记忆标题和内容。');
      return;
    }
    const inputRecord = {
      scope: memoryScope,
      type: memoryCanon === 'canon' ? 'fact' as const : 'preference' as const,
      title,
      content,
      source: 'manual-memory-editor',
      sourceId: selectedConversation?.id,
      userConfirmed: true,
      canonStatus: memoryCanon,
      confidence: 1,
      importance: memoryCanon === 'canon' ? 0.95 : 0.75,
      applicableCharacters: memoryScope === 'character' ? [selectedCharacter.id] : [],
      applicableProjects: selectedConversation?.projectId ? [selectedConversation.projectId] : [],
      tags: ['manual', selectedCharacter.id],
    };
    const assessment = canonGuard.assessMemory(inputRecord);
    if (assessment.verdict === 'blocked') {
      setNotice(assessment.conflicts[0]?.explanation ?? '这条记录与已锁定正史冲突，已阻止写入。');
      setInspectorTab('canon');
      return;
    }
    memoryManager.create(inputRecord);
    setMemoryTitle('');
    setMemoryContent('');
    setMemoryComposerOpen(false);
    refreshMemories(selectedCharacter.id);
    setNotice(assessment.verdict === 'review' ? '已作为草案保存；与正史不一致的内容不会进入角色上下文。' : '已写入长期记忆，并记录了来源与适用范围。');
  };

  const removeMemory = (id: string) => {
    memoryManager.softDelete(id);
    refreshMemories(selectedCharacter.id);
    setNotice('记忆已软删除，可通过版本记录恢复。');
  };

  const renameConversation = () => {
    if (!selectedConversation) return;
    const name = window.prompt('为这段对话命名', selectedConversation.title)?.trim();
    if (!name) return;
    conversationRepository.updateConversation(selectedConversation.id, { title: name });
    refresh(selectedConversation.id);
  };

  const deleteConversation = () => {
    if (!selectedConversation || !window.confirm('删除这段对话？长期记忆不会被一并删除。')) return;
    conversationRepository.softDeleteConversation(selectedConversation.id);
    refresh();
  };

  return (
    <div className="dialogue-os">
      <div className="dialogue-ambient dialogue-ambient-one" aria-hidden="true" />
      <div className="dialogue-ambient dialogue-ambient-two" aria-hidden="true" />

      <aside className={`dialogue-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="dialogue-brand">
          <span className="dialogue-brand-mark"><Sparkles /></span>
          <span><strong>织忆</strong><small>CHARACTER DIALOGUE OS</small></span>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="关闭会话栏"><X /></button>
        </div>

        <button type="button" className="dialogue-new" onClick={() => createConversation()}>
          <Plus />新建一场对话
        </button>

        <label className="dialogue-search">
          <Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索对话…" />
          <kbd>⌘ K</kbd>
        </label>

        <div className="dialogue-section-label"><span>最近对话</span><MoreHorizontal /></div>
        <div className="dialogue-session-list">
          {visibleConversations.map((conversation) => {
            const character = resolveCharacter(conversation.characterId);
            return (
              <button
                type="button"
                key={conversation.id}
                className={conversation.id === selectedId ? 'is-active' : ''}
                onClick={() => selectConversation(conversation.id)}
              >
                <span className="dialogue-session-avatar">
                  {getCharacterCardImageLocal(character.id)
                    ? <img src={getCharacterCardImageLocal(character.id)} alt="" />
                    : character.name.slice(0, 1)}
                  {conversation.id === selectedId && <i />}
                </span>
                <span>
                  <strong>{conversation.title}</strong>
                  <small>{MODE_LABELS[conversation.mode]} · {compactDate(conversation.updatedAt)}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="dialogue-section-label dialogue-character-label"><span>快速切换角色</span><ChevronRight /></div>
        <div className="dialogue-character-stack">
          {featuredCharacters.slice(0, 5).map((character) => (
            <button
              type="button"
              key={character.id}
              className={character.id === selectedCharacter.id ? 'is-active' : ''}
              onClick={() => updateCharacter(character)}
              title={character.name}
            >
              {getCharacterCardImageLocal(character.id)
                ? <img src={getCharacterCardImageLocal(character.id)} alt={character.name} />
                : character.name.slice(0, 1)}
            </button>
          ))}
          <button type="button" title="更多角色" onClick={() => setNotice(`角色库中共有 ${characters.length} 位角色，可从角色档案进入对话。`)}>+{Math.max(0, characters.length - 5)}</button>
        </div>

        <div className="dialogue-level-card">
          <div className="dialogue-level-top">
            <span><Zap />共鸣等级 {profile.aiLevel}</span>
            <strong>{currentRule.name}</strong>
          </div>
          <div className="dialogue-progress"><i style={{ width: `${levelProgress}%` }} /></div>
          <small>{nextLevel ? `再获得 ${Math.max(0, nextLevel.requiredPoints - profile.interactionPoints)} 点解锁「${nextLevel.unlocks[0]}」` : '所有成长能力均已解锁'}</small>
        </div>

        <div className="dialogue-sidebar-footer">
          <Link to="/"><Archive />返回世界档案</Link>
          <Link to="/settings/ai"><Settings2 />模型与隐私设置</Link>
          <span><LockKeyhole />记忆仅保存在本机</span>
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="dialogue-backdrop" onClick={() => setSidebarOpen(false)} aria-label="关闭会话栏" />}

      <main className="dialogue-main">
        <header className="dialogue-header">
          <div className="dialogue-header-identity">
            <button type="button" className="dialogue-mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="打开会话栏"><Menu /></button>
            <span className="dialogue-header-avatar">
              {portrait ? <img src={portrait} alt="" /> : <Bot />}
              <i />
            </span>
            <div>
              <p>
                <strong>{selectedCharacter.name}</strong>
                <span>{selectedCharacter.title ?? selectedCharacter.groupLabel}</span>
              </p>
              <small><Radio />在线 · 正史护栏已开启</small>
            </div>
          </div>

          <div className="dialogue-scene-controls">
            <label>
              <span>对话模式</span>
              <select value={activeMode} onChange={(event) => updateMode(event.target.value as ConversationMode)}>
                <option value="character">角色扮演</option>
                <option value="story-query">设定问答</option>
                <option value="creative">共同创作</option>
                <option value="website-assistant">站点向导</option>
              </select>
              <ChevronDown />
            </label>
            <span className="dialogue-scene-chip"><Clock3 />东海市 · 雨后</span>
            <span className="dialogue-spoiler-chip"><ShieldCheck />剧透 0</span>
          </div>

          <div className="dialogue-header-actions">
            <button type="button" onClick={renameConversation} aria-label="重命名对话"><FileText /></button>
            <button
              type="button"
              onClick={() => selectedConversation && downloadJson(`dialogue-${selectedConversation.id}.json`, conversationEngine.exportConversation(selectedConversation.id))}
              aria-label="导出对话"
            ><Download /></button>
            <button type="button" onClick={() => setInspectorOpen((open) => !open)} aria-label={inspectorOpen ? '关闭检查器' : '打开检查器'}>
              {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
            </button>
          </div>
        </header>

        <section className="dialogue-thread" aria-live="polite">
          {messages.length === 0 && (
            <div className="dialogue-welcome">
              <div className="dialogue-welcome-portrait">
                <span className="dialogue-portrait-glow" />
                {portrait ? <img src={portrait} alt={selectedCharacter.name} /> : <UserRound />}
                <span className="dialogue-character-state"><i />情绪：平静而好奇</span>
              </div>
              <div className="dialogue-welcome-copy">
                <span className="dialogue-kicker"><Sparkles />一段受正史保护的新对话</span>
                <h1>和{selectedCharacter.name}聊聊</h1>
                <p>{selectedCharacter.bio}</p>
                <div className="dialogue-role-facts">
                  <span><Network />{selectedCharacter.groupLabel}</span>
                  <span><BrainCircuit />只读取角色已知信息</span>
                  <span><ShieldCheck />冲突时停止并出示证据</span>
                  <span><Sparkles />羁绊 {currentRelationship}</span>
                  <span><LockKeyhole />信赖 {currentTrust}</span>
                </div>
              </div>
              <div className="dialogue-suggestions">
                {[
                  `你还记得我们第一次见面时发生了什么吗？`,
                  `现在的你最担心什么？`,
                  `用你自己的话介绍一下你的家人吧。`,
                ].map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => setInput(suggestion)}>
                    <span>{suggestion}</span><ChevronRight />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.filter((message) => message.role !== 'system').map((message) => (
            <article key={message.id} className={`dialogue-message is-${message.role}`}>
              <div className="dialogue-message-avatar">
                {message.role === 'user'
                  ? <UserRound />
                  : portrait
                    ? <img src={portrait} alt="" />
                    : <Sparkles />}
              </div>
              <div className="dialogue-message-body">
                <div className="dialogue-message-meta">
                  <strong>{message.role === 'user' ? '你' : selectedCharacter.name}</strong>
                  <span>{statusText(message)}</span>
                  {Boolean(message.metadata.previewMode) && <em>本地证据预览</em>}
                </div>
                <div className="dialogue-bubble">
                  {message.content.split('\n').map((line, index) => <p key={`${message.id}-${index}`}>{line || '\u00a0'}</p>)}
                </div>
                {message.citations.length > 0 && (
                  <div className="dialogue-citations">
                    {message.citations.slice(0, 3).map((citation) => (
                      <Link to={citation.route} key={citation.id}><BookOpen />{citation.title}<span>{CANON_LABELS[citation.canonStatus]}</span></Link>
                    ))}
                  </div>
                )}
                <div className="dialogue-message-actions">
                  <button type="button" onClick={() => navigator.clipboard?.writeText(message.content)}><Copy />复制</button>
                  {message.role === 'user' && (
                    <button type="button" onClick={() => { setInput(message.content); setEditingId(message.id); }}><FileText />编辑</button>
                  )}
                  {message.role === 'assistant' && message.status === 'completed' && (
                    <button type="button" onClick={() => void regenerate()}><RotateCcw />重试</button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {isGenerating && (
            <article className="dialogue-message is-assistant">
              <div className="dialogue-message-avatar">{portrait ? <img src={portrait} alt="" /> : <Sparkles />}</div>
              <div className="dialogue-message-body">
                <div className="dialogue-message-meta"><strong>{selectedCharacter.name}</strong><span>正在组织记忆与设定…</span></div>
                <div className="dialogue-bubble dialogue-streaming">
                  {streamingText
                    ? streamingText.split('\n').map((line, index) => <p key={index}>{line || '\u00a0'}</p>)
                    : <span><i /><i /><i /></span>}
                </div>
              </div>
            </article>
          )}
          <div ref={endRef} />
        </section>

        {notice && <div className="dialogue-notice" role="status"><ShieldCheck /><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X /></button></div>}

        <section className="dialogue-composer-shell">
          <div className="dialogue-composer-meta">
            <span><ShieldCheck />发送前检查正史冲突</span>
            <span><BrainCircuit />可用长期记忆 {activeMemories.length} 条</span>
            <button type="button" onClick={() => { setInspectorTab('context'); setInspectorOpen(true); }}><CircleGauge />上下文 {contextUsage}%</button>
          </div>
          {editingId && (
            <div className="dialogue-editing">
              正在编辑较早的消息；其后的回答会被重新生成。
              <button type="button" onClick={() => { setEditingId(''); setInput(''); }}>取消</button>
            </div>
          )}
          <form className="dialogue-composer" onSubmit={(event) => void send(event)}>
            <button type="button" className="dialogue-composer-tool" onClick={() => { setInspectorTab('memory'); setInspectorOpen(true); setMemoryComposerOpen(true); }} aria-label="添加长期记忆">
              <BookmarkPlus />
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder={`对${selectedCharacter.name}说些什么…`}
            />
            <span className="dialogue-model-chip"><WandSparkles />{aiConfig.enabled ? aiConfig.model : '本地预览'}</span>
            {isGenerating
              ? <button type="button" className="dialogue-send" onClick={() => abortRef.current?.abort()} aria-label="停止生成"><Square /></button>
              : <button type="submit" className="dialogue-send" disabled={!input.trim()} aria-label="发送"><Send /></button>}
          </form>
          <p>Enter 发送 · Shift + Enter 换行 · 明确说“请记住：…”才会自动写入长期记忆</p>
        </section>
      </main>

      <aside className={`dialogue-inspector${inspectorOpen ? ' is-open' : ''}`}>
        <header className="dialogue-inspector-header">
          <div><span>对话检查器</span><small>每条回复是怎样形成的</small></div>
          <button type="button" onClick={() => setInspectorOpen(false)} aria-label="关闭检查器"><X /></button>
        </header>
        <div className="dialogue-inspector-tabs" role="tablist">
          <button type="button" className={inspectorTab === 'context' ? 'is-active' : ''} onClick={() => setInspectorTab('context')}><Layers3 />上下文</button>
          <button type="button" className={inspectorTab === 'memory' ? 'is-active' : ''} onClick={() => setInspectorTab('memory')}><BrainCircuit />记忆</button>
          <button type="button" className={inspectorTab === 'canon' ? 'is-active' : ''} onClick={() => setInspectorTab('canon')}><ShieldCheck />正史</button>
        </div>

        {inspectorTab === 'context' && (
          <div className="dialogue-inspector-content">
            <section className="dialogue-context-meter">
              <div className="dialogue-meter-ring" style={{ '--meter': `${contextUsage * 3.6}deg` } as React.CSSProperties}>
                <span><strong>{contextUsage}%</strong><small>已使用</small></span>
              </div>
              <div>
                <span>本轮上下文预算</span>
                <strong>{lastContext?.tokenEstimate.toLocaleString() ?? '0'} / {contextLimit.toLocaleString()}</strong>
                <small>旧对话会先压缩成结构化摘要</small>
              </div>
            </section>

            <section className="dialogue-inspector-section">
              <div className="dialogue-inspector-title"><span>组织顺序</span><small>{lastContext ? '本轮实际结果' : '等待第一条消息'}</small></div>
              <div className="dialogue-context-stack">
                {DEFAULT_CONTEXT_BLOCKS.map(([id, label, description], index) => {
                  const actual = lastContext?.blocks.find((block) => block.id === id);
                  const included = actual?.included ?? index < 4;
                  return (
                    <div key={id} className={included ? 'is-included' : ''}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <p><strong>{label}</strong><small>{description}</small></p>
                      <em>{actual ? `${actual.tokenEstimate} tk` : included ? '常驻' : '按需'}</em>
                      {included ? <Check /> : <ChevronRight />}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="dialogue-inspector-section">
              <div className="dialogue-inspector-title"><span>本轮证据</span><small>{latestCitations.length} 条</small></div>
              {latestCitations.length > 0 ? latestCitations.slice(0, 4).map((citation) => (
                <Link className="dialogue-evidence" to={citation.route} key={citation.id}>
                  <BookOpen />
                  <span><strong>{citation.title}</strong><small>{citation.excerpt.slice(0, 62)}…</small></span>
                  <em>{CANON_LABELS[citation.canonStatus]}</em>
                </Link>
              )) : <div className="dialogue-empty"><Database /><span>发送消息后，这里会显示实际检索到的设定证据。</span></div>}
            </section>
          </div>
        )}

        {inspectorTab === 'memory' && (
          <div className="dialogue-inspector-content">
            <section className="dialogue-memory-summary">
              <span><BrainCircuit /></span>
              <div><strong>{activeMemories.length} 条可用记忆</strong><small>当前角色只能读取适用于自己的记录</small></div>
              <button type="button" onClick={() => setMemoryComposerOpen((open) => !open)}><Plus /></button>
            </section>

            {memoryComposerOpen && (
              <section className="dialogue-memory-form">
                <div className="dialogue-inspector-title"><span>写入长期记忆</span><small>保存前检查冲突</small></div>
                <input value={memoryTitle} onChange={(event) => setMemoryTitle(event.target.value)} placeholder="一句话标题" />
                <textarea value={memoryContent} onChange={(event) => setMemoryContent(event.target.value)} placeholder="需要长期保留的事实、偏好或限制…" rows={4} />
                <div>
                  <select value={memoryScope} onChange={(event) => setMemoryScope(event.target.value as MemoryScope)}>
                    <option value="character">仅当前角色</option>
                    <option value="user">关于我</option>
                    <option value="world">世界设定</option>
                    <option value="plot">剧情状态</option>
                  </select>
                  <select value={memoryCanon} onChange={(event) => setMemoryCanon(event.target.value as CanonStatus)}>
                    <option value="user-preference">用户偏好</option>
                    <option value="draft">设定草案</option>
                    <option value="canon">申请写入正史</option>
                  </select>
                </div>
                <button type="button" onClick={saveMemory}><ShieldCheck />检查并保存</button>
              </section>
            )}

            <section className="dialogue-inspector-section">
              <div className="dialogue-inspector-title"><span>{selectedCharacter.name}可读取</span><small>按重要性排序</small></div>
              <div className="dialogue-memory-list">
                {activeMemories.map((memory) => (
                  <article key={memory.id}>
                    <div><span>{CANON_LABELS[memory.canonStatus]}</span><em>{MEMORY_SCOPE_LABELS[memory.scope]} · v{memory.version}</em></div>
                    <strong>{memory.title}</strong>
                    <p>{memory.content}</p>
                    <footer><small><History />{memory.source}</small><button type="button" onClick={() => removeMemory(memory.id)} aria-label="删除记忆"><Trash2 /></button></footer>
                  </article>
                ))}
                {activeMemories.length === 0 && <div className="dialogue-empty"><BrainCircuit /><span>还没有长期记忆。你可以手动添加，或在对话中明确说“请记住：…”。</span></div>}
              </div>
            </section>
          </div>
        )}

        {inspectorTab === 'canon' && (
          <div className="dialogue-inspector-content">
            <section className="dialogue-guard-state">
              <span><ShieldCheck /></span>
              <div><strong>正史护栏运行中</strong><small>冲突不会被静默合并或覆盖</small></div>
              <em>ON</em>
            </section>

            <section className="dialogue-inspector-section">
              <div className="dialogue-inspector-title"><span>来源优先级</span><small>高 → 低</small></div>
              <ol className="dialogue-priority-list">
                {canonGuard.sourcePriority.map((source, index) => (
                  <li key={source}><span>{index + 1}</span><p><strong>{source}</strong><small>{index < 2 ? '不可被低优先级内容覆盖' : '需要来源与状态标签'}</small></p>{index < 2 && <LockKeyhole />}</li>
                ))}
              </ol>
            </section>

            <section className="dialogue-inspector-section">
              <div className="dialogue-inspector-title"><span>四道防线</span><small>本轮全部启用</small></div>
              <div className="dialogue-guard-grid">
                <div><Check /><span><strong>时间线</strong><small>未来事件不可提前知晓</small></span></div>
                <div><Check /><span><strong>知情权</strong><small>私有记忆按角色隔离</small></span></div>
                <div><Check /><span><strong>剧透级别</strong><small>当前仅公开信息</small></span></div>
                <div><Check /><span><strong>冲突停止</strong><small>先出示双边证据</small></span></div>
              </div>
            </section>

            <section className="dialogue-inspector-section">
              <div className="dialogue-inspector-title"><span>内置 Prompt</span><small>{enabledPrompts.length} 个启用</small></div>
              <div className="dialogue-prompt-list">
                {enabledPrompts.slice(0, 6).map((prompt) => (
                  <div key={prompt.id}><FileText /><span><strong>{prompt.name}</strong><small>{prompt.type} · v{prompt.version}</small></span><i /></div>
                ))}
              </div>
            </section>

            <div className="dialogue-conflict-tip">
              <AlertTriangle />
              <span><strong>发生冲突时</strong>系统保留两份记录、停止写入正史，并要求单独裁决版本；角色不会直接得知后台冲突详情。</span>
            </div>
          </div>
        )}

        <footer className="dialogue-inspector-footer">
          <button type="button" onClick={() => { setInspectorTab('context'); setNotice('检查器已切换为本轮可审计视图。'); }}><CircleGauge />查看本轮审计</button>
          <button type="button" onClick={() => {
            if (!selectedConversation || !window.confirm('清空这段对话的消息与对话级记忆？长期角色记忆会保留。')) return;
            conversationEngine.clearConversationContext(selectedConversation.id);
            setLastContext(null);
            refresh(selectedConversation.id);
          }}><Eraser />清空上下文</button>
          <button type="button" onClick={deleteConversation}><Trash2 />删除</button>
        </footer>
      </aside>
    </div>
  );
}
