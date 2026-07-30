import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowUpRight, BookOpen, Bot, BrainCircuit, Check, ChevronDown, ChevronRight,
  Compass, Copy, Edit3, Eraser, FileDown, Home, Menu, MessageCircle,
  MoreHorizontal, Plus, RotateCcw, Search, Send, Settings2, Shield, SmilePlus,
  Sparkles, Square, Trash2, UserRound, X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { characters } from '@/data/characters';
import { conversationEngine } from '@/conversation/conversationEngine';
import { LEVEL_RULES, levelSystem } from '@/conversation/levelSystem';
import { memoryManager } from '@/conversation/memoryManager';
import { maskSecret } from '@/conversation/privacy';
import { conversationRepository } from '@/conversation/storage';
import type {
  Citation, Conversation, ConversationMode, Message, MessageStatus,
} from '@/conversation/types';
import { CHAT_STICKERS, parseMessageParts, stickerToken } from '@/conversation/stickers';
import './ThemedChat.css';

type ChatTheme = 'ocean' | 'sweet';

interface ThemedChatProps {
  theme: ChatTheme;
}

const themeCopy = {
  ocean: {
    brand: '星海甜梦',
    subtitle: 'STARRY SWEET DREAMS',
    assistant: '星海甜梦 AI',
    welcome: '今晚想从哪一颗星开始聊？',
    pet: '泡芙',
    petLine: '带着一小团甜梦来陪你啦～',
  },
  sweet: {
    brand: '甜梦小屋',
    subtitle: 'SWEET DREAM CHAT',
    assistant: '甜梦 AI',
    welcome: '今天想聊些什么呢？',
    pet: '泡芙',
    petLine: '把好心情分给你一点～',
  },
} as const;

const suggestions = [
  ['🌌', '探索世界观', '带我看看这个世界', '请介绍一下站内的世界观入口。'],
  ['📖', '寻找故事', '有什么故事可以读？', '这个网站有哪些故事可以阅读？'],
  ['✨', '认识角色', '从主要角色开始', '请介绍几位主要角色，并附上站内来源。'],
] as const;

const SELECTED_CHAT_KEY = 'nyaumae:chat-selected:v1';
const CHAT_DRAFTS_KEY = 'nyaumae:chat-drafts:v1';
const AFFECTION_KEY = 'nyaumae:chat-affection:v1';
const MAX_INPUT_LENGTH = 8_000;

const MODE_LABELS: Record<ConversationMode, string> = {
  'website-assistant': '网站助手',
  character: '角色对话',
  'story-query': '故事查询',
  'nctb-proctor': 'NCTB 监考',
  'game-assistant': '游戏助手',
  creative: '创作模式',
};

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: '等待中',
  streaming: '生成中',
  completed: '已完成',
  stopped: '已停止',
  failed: '发送失败',
};

const LEVEL_NAMES: Record<number, string> = {
  1: '初醒者',
  2: '观察者',
  3: '寻路者',
  4: '共鸣者',
  5: '星图守护者',
  6: '世界绘图师',
};

type ConfirmationState =
  | { type: 'rename'; value: string }
  | { type: 'delete' | 'clear' }
  | null;

function readLocalValue(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeLocalValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Device-local UI preferences are optional.
  }
}

function readDrafts(): Record<string, string> {
  try {
    const raw = readLocalValue(CHAT_DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

function readAffection(): number {
  const value = Number(readLocalValue(AFFECTION_KEY));
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 78;
}

function formatTime(value: string): string {
  try {
    const date = new Date(value);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return new Intl.DateTimeFormat('zh-CN', sameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { month: 'numeric', day: 'numeric' }).format(date);
  } catch {
    return '';
  }
}

function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function messageName(message: Message, assistant: string): string {
  if (message.role === 'user') return '你';
  if (message.role === 'assistant') return assistant;
  if (message.role === 'tool') return '工具';
  return '系统';
}

export default function ThemedChat({ theme }: ThemedChatProps) {
  const p = theme;
  const copy = themeCopy[theme];
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(() => readLocalValue(SELECTED_CHAT_KEY));
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>(readDrafts);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [notice, setNotice] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [memoryIds, setMemoryIds] = useState<string[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820);
  const [affection, setAffection] = useState(readAffection);
  const [profile, setProfile] = useState(() => levelSystem.getProfile());
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const stickerPanelRef = useRef<HTMLElement | null>(null);
  const controlsRef = useRef<HTMLElement | null>(null);
  const controlsButtonRef = useRef<HTMLButtonElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const activeMode = selectedConversation?.mode ?? 'website-assistant';
  const selectedCharacter = selectedConversation?.characterId ?? '';
  const aiConfig = conversationRepository.getAiConfig();
  const visibleConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? conversations.filter((conversation) => conversation.title.toLocaleLowerCase().includes(query))
      : conversations;
  }, [conversations, search]);
  const currentRule = [...LEVEL_RULES].reverse().find((rule) => rule.level <= profile.aiLevel) ?? LEVEL_RULES[0];
  const nextRule = LEVEL_RULES.find((rule) => rule.level > profile.aiLevel);
  const pointsToNextLevel = nextRule ? Math.max(0, nextRule.requiredPoints - profile.interactionPoints) : 0;
  const levelProgress = nextRule
    ? Math.round(((profile.interactionPoints - currentRule.requiredPoints)
      / Math.max(1, nextRule.requiredPoints - currentRule.requiredPoints)) * 100)
    : 100;

  const restoreInspector = (nextMessages: Message[]) => {
    const latestAssistant = [...nextMessages].reverse().find((message) => message.role === 'assistant');
    const rawMemoryIds = latestAssistant?.metadata.memoryIds;
    setMemoryIds(Array.isArray(rawMemoryIds) ? rawMemoryIds.filter((id): id is string => typeof id === 'string') : []);
    setCitations(latestAssistant?.citations ?? []);
  };

  const refresh = (preferredId?: string) => {
    const next = conversationEngine.listConversations();
    const nextId = preferredId && next.some((item) => item.id === preferredId)
      ? preferredId
      : selectedId && next.some((item) => item.id === selectedId)
        ? selectedId
        : next[0]?.id ?? '';
    setConversations(next);
    setSelectedId(nextId);
    const nextMessages = nextId ? conversationEngine.getMessages(nextId) : [];
    setMessages(nextMessages);
    restoreInspector(nextMessages);
    setProfile(levelSystem.getProfile());
    return nextId;
  };

  useEffect(() => {
    queueMicrotask(() => {
      const existing = conversationEngine.listConversations();
      if (existing.length === 0) {
        const created = conversationEngine.createConversation({ mode: 'website-assistant', title: '网站助手' });
        setInput(drafts[created.id] ?? '');
        refresh(created.id);
      } else {
        const savedId = readLocalValue(SELECTED_CHAT_KEY);
        const initialId = existing.some((conversation) => conversation.id === savedId) ? savedId : existing[0].id;
        setInput(drafts[initialId] ?? '');
        refresh(initialId);
      }
    });
    // Repository hydration is intentionally performed once when the themed shell mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText]);

  useEffect(() => {
    if (!selectedId) return;
    writeLocalValue(SELECTED_CHAT_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const nextDrafts = { ...drafts, [selectedId]: input };
    if (!input) delete nextDrafts[selectedId];
    const timer = window.setTimeout(() => {
      setDrafts(nextDrafts);
      writeLocalValue(CHAT_DRAFTS_KEY, JSON.stringify(nextDrafts));
    }, 180);
    return () => window.clearTimeout(timer);
    // Draft persistence follows the current conversation and input only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, selectedId]);

  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [input]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!showStickers) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!stickerPanelRef.current?.contains(event.target as Node)) setShowStickers(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [showStickers]);

  useEffect(() => {
    if (!showControls) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!controlsRef.current?.contains(target) && !controlsButtonRef.current?.contains(target)) {
        setShowControls(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [showControls]);

  const selectConversation = (id: string) => {
    if (id === selectedId) {
      if (window.innerWidth <= 820) setSidebarOpen(false);
      return;
    }
    setSelectedId(id);
    const nextMessages = conversationEngine.getMessages(id);
    setMessages(nextMessages);
    restoreInspector(nextMessages);
    setEditingId('');
    setInput(drafts[id] ?? '');
    setNotice('');
    setShowControls(false);
    setShowContext(false);
    if (window.innerWidth <= 820) setSidebarOpen(false);
  };

  const newConversation = () => {
    const created = conversationEngine.createConversation({
      mode: activeMode,
      characterId: selectedCharacter || undefined,
      title: '新对话',
    });
    refresh(created.id);
    setEditingId('');
    setInput('');
    setShowControls(false);
    window.setTimeout(() => composerRef.current?.focus(), 0);
    if (window.innerWidth <= 820) setSidebarOpen(false);
  };

  const renameConversation = () => {
    if (!selectedConversation) return;
    setConfirmation({ type: 'rename', value: selectedConversation.title });
  };

  const deleteConversation = () => {
    if (!selectedConversation) return;
    setConfirmation({ type: 'delete' });
  };

  const confirmAction = () => {
    if (!selectedConversation || !confirmation) return;
    if (confirmation.type === 'rename') {
      const title = confirmation.value.trim();
      if (!title) return;
      conversationRepository.updateConversation(selectedConversation.id, { title: title.slice(0, 80) });
      refresh(selectedConversation.id);
      setNotice('对话名称已更新。');
    } else if (confirmation.type === 'delete') {
      const deletedId = selectedConversation.id;
      conversationRepository.softDeleteConversation(deletedId);
      const nextDrafts = { ...drafts };
      delete nextDrafts[deletedId];
      setDrafts(nextDrafts);
      writeLocalValue(CHAT_DRAFTS_KEY, JSON.stringify(nextDrafts));
      const nextId = refresh();
      setInput(nextDrafts[nextId] ?? '');
      setNotice('对话已移到本机回收状态。');
    } else {
      conversationEngine.clearConversationContext(selectedConversation.id);
      refresh(selectedConversation.id);
      setCitations([]);
      setMemoryIds([]);
      setNotice('会话上下文已清空。');
    }
    setConfirmation(null);
    setShowControls(false);
  };

  const updateConversation = (patch: Partial<Pick<Conversation, 'mode' | 'characterId' | 'model'>>) => {
    if (!selectedConversation) return;
    conversationRepository.updateConversation(selectedConversation.id, patch);
    refresh(selectedConversation.id);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setNotice('消息已复制。');
    } catch {
      setNotice('无法访问剪贴板，请手动选择消息文字。');
    }
  };

  const send = async (event?: FormEvent, explicitContent?: string) => {
    event?.preventDefault();
    const content = (explicitContent ?? input).trim();
    if (!content || !selectedConversation || isGenerating) return;
    if (activeMode === 'character' && !selectedCharacter) {
      setShowControls(true);
      setNotice('请先在对话设置中选择一位角色。');
      return;
    }
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
        model: selectedConversation.model ?? undefined,
        characterId: selectedCharacter || undefined,
        pageContext: { route: location.pathname, title: document.title, section: activeMode },
        replaceMessageId: editingId || undefined,
        signal: controller.signal,
        onToken: (_token, accumulated) => setStreamingText(accumulated),
      });
      setCitations(result.context.citations);
      setMemoryIds(result.context.memoryIds);
      if (result.assistantMessage.status === 'failed') setNotice(result.assistantMessage.content);
      if (result.assistantMessage.status === 'stopped') setNotice('生成已停止，已保留已经生成的内容。');
      setEditingId('');
      setStreamingText('');
      refresh(selectedConversation.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '发送失败。');
      setInput(content);
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const sendSticker = (id: string) => {
    setShowStickers(false);
    void send(undefined, stickerToken(id));
  };

  const renderMessageContent = (content: string, keyPrefix: string) => (
    <div className="original-chat-rich-message">
      {parseMessageParts(content).map((part, index) => part.type === 'sticker'
        ? <img className="original-chat-sticker-message" src={part.sticker.src} alt={part.sticker.label} title={part.sticker.label} key={`${keyPrefix}-sticker-${index}`} />
        : part.value.split('\n').map((line, lineIndex) => <p key={`${keyPrefix}-text-${index}-${lineIndex}`}>{line || '\u00a0'}</p>))}
    </div>
  );

  const regenerate = async () => {
    if (!selectedConversation || isGenerating) return;
    setIsGenerating(true);
    setStreamingText('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await conversationEngine.regenerateLatest(selectedConversation.id, {
        characterId: selectedCharacter || undefined,
        model: selectedConversation.model ?? undefined,
        pageContext: { route: location.pathname, title: document.title, section: activeMode },
        signal: controller.signal,
        onToken: (_token, accumulated) => setStreamingText(accumulated),
      });
      if (result) {
        setCitations(result.context.citations);
        setMemoryIds(result.context.memoryIds);
        if (result.assistantMessage.status === 'failed') setNotice(result.assistantMessage.content);
        if (result.assistantMessage.status === 'stopped') setNotice('生成已停止，已保留已经生成的内容。');
      }
      setStreamingText('');
      refresh(selectedConversation.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '重新生成失败。');
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const clearContext = () => {
    if (!selectedConversation) return;
    setConfirmation({ type: 'clear' });
  };

  const petPoffy = () => {
    const next = Math.min(100, affection + 1);
    setAffection(next);
    writeLocalValue(AFFECTION_KEY, String(next));
    if (next === 100 && affection < 100) setNotice('泡芙和你的亲密度已经满啦！');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        newConversation();
        return;
      }
      if (event.key !== 'Escape') return;
      if (confirmation) setConfirmation(null);
      else if (showStickers) setShowStickers(false);
      else if (showControls) setShowControls(false);
      else if (showContext) setShowContext(false);
      else if (window.innerWidth <= 820 && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const memoryRecords = memoryIds
    .map((id) => memoryManager.getSource(id).memory)
    .filter((memory): memory is NonNullable<typeof memory> => Boolean(memory));
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const canRegenerate = messages.some((message) => message.role === 'assistant') && Boolean(lastUser) && !isGenerating;
  const nearInputLimit = input.length >= MAX_INPUT_LENGTH * 0.8;
  const confirmationTitle = confirmation?.type === 'rename'
    ? '重命名对话'
    : confirmation?.type === 'delete'
      ? '删除这段对话？'
      : '清空当前上下文？';

  return (
    <div className={`${p}-chat`} data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      <div className={`${p}-chat-sky`} aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
        <span className={`${p}-planet ${p}-planet-one`} />
        <span className={`${p}-planet ${p}-planet-two`} />
        <span className={`${p}-comet`} />
        {theme === 'sweet' && <span className="sweet-comet-trail" />}
        <span className={`${p}-cloud ${p}-cloud-one`} />
        <span className={`${p}-cloud ${p}-cloud-two`} />
        {theme === 'sweet' && <><span className="sweet-cloud sweet-cloud-three" /><span className="sweet-waves" /></>}
      </div>

      {sidebarOpen && <button type="button" className="original-chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="关闭对话列表" />}

      <aside className={`${p}-sidebar`} aria-label="对话列表">
        <div className={`${p}-sidebar-brand`}>
          <div className={`${p}-brand-orbit`}><Sparkles /></div>
          <div><strong>{copy.brand}</strong><span>{copy.subtitle}</span></div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="收起侧栏"><Menu /></button>
        </div>
        <button type="button" className={`${p}-new-chat`} onClick={newConversation}>
          <Plus /><span>新建对话</span><kbd>Ctrl K</kbd>
        </button>
        <label className={`${p}-search`}>
          <Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索对话" />
        </label>
        <div className={`${p}-history`}>
          <p>最近对话</p>
          {visibleConversations.map((conversation) => (
            <button type="button" key={conversation.id} className={conversation.id === selectedId ? 'is-active' : ''} onClick={() => selectConversation(conversation.id)}>
              <MessageCircle /><b>{conversation.title}</b><small>{formatTime(conversation.updatedAt)}</small>
            </button>
          ))}
          {visibleConversations.length === 0 && <small className="original-chat-empty">没有匹配的对话</small>}
        </div>
        <div className={`${p}-voyage-card`}>
          <div><Compass /><span>{LEVEL_NAMES[profile.aiLevel] ?? '世界探索'}</span><strong>旅程等级 {profile.aiLevel}</strong></div>
          <div className={`${p}-voyage-track`} aria-label={`当前等级进度 ${levelProgress}%`}><span style={{ width: `${levelProgress}%` }} /></div>
          <small>{nextRule ? `再获得 ${pointsToNextLevel} 点星光解锁 ${LEVEL_NAMES[nextRule.level] ?? `等级 ${nextRule.level}`}` : '全部旅程等级已解锁'}</small>
        </div>
        <div className={`${p}-profile`}>
          <span>旅</span><div><strong>旅行者</strong><small>{aiConfig.apiKey ? `Key ${maskSecret(aiConfig.apiKey)}` : '尚未配置模型'}</small></div>
          <Link to="/settings/ai" aria-label="AI 设置"><Settings2 /></Link>
        </div>
      </aside>

      <main className={`${p}-chat-main`}>
        <header className={`${p}-chat-header`}>
          <div className={`${p}-header-left`}>
            {!sidebarOpen && <button type="button" className={`${p}-icon-btn`} onClick={() => setSidebarOpen(true)} aria-label="打开侧栏"><Menu /></button>}
            <div className={`${p}-model-mark`}><Bot /></div>
            <div>
              <p><strong>{selectedConversation?.title ?? copy.assistant}</strong><button ref={controlsButtonRef} type="button" onClick={() => setShowControls((value) => !value)} aria-label="对话设置" aria-expanded={showControls}><ChevronDown /></button></p>
              <span><i />{aiConfig.enabled ? `${aiConfig.providerLabel} · ${selectedConversation?.model ?? aiConfig.model}` : '本地星光预览 · 记忆与护栏运行中'}</span>
            </div>
          </div>
          <div className={`${p}-header-actions`}>
            <button type="button" className={`${p}-icon-btn${showContext ? ' is-active' : ''}`} onClick={() => setShowContext((value) => !value)} aria-label="查看引用和记忆" aria-pressed={showContext}><Shield /></button>
            <button type="button" className={`${p}-icon-btn`} onClick={renameConversation} aria-label="重命名对话"><Edit3 /></button>
            <button type="button" className={`${p}-share`} onClick={() => {
              if (!selectedConversation) return;
              downloadFile(`conversation-${selectedConversation.id}.json`, conversationEngine.exportConversation(selectedConversation.id));
              setNotice('对话已导出，文件不包含 API Key。');
            }}><FileDown /><span>导出</span></button>
          </div>
        </header>

        {showControls && (
          <section className="original-chat-controls" aria-label="对话设置" ref={controlsRef}>
            <header><div><strong>对话设置</strong><span>按当前会话单独保存</span></div><button type="button" onClick={() => setShowControls(false)} aria-label="关闭对话设置"><X /></button></header>
            <label>模式<select value={activeMode} onChange={(event) => updateConversation({ mode: event.target.value as ConversationMode })}>
              <option value="website-assistant">网站助手</option><option value="character">角色对话</option><option value="story-query">故事查询</option>
            </select></label>
            {activeMode === 'character' && <label>角色<select value={selectedCharacter} onChange={(event) => updateConversation({ characterId: event.target.value || undefined, mode: 'character' })}>
              <option value="">选择角色</option>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
            </select></label>}
            <label>模型<input key={`${selectedConversation?.id}-${selectedConversation?.model ?? aiConfig.model}`} defaultValue={selectedConversation?.model ?? aiConfig.model} onBlur={(event) => updateConversation({ model: event.currentTarget.value.trim() || undefined })} /></label>
            <Link to="/settings/ai"><Settings2 />连接设置</Link>
            <Link to="/chat/system"><BrainCircuit />记忆与正史管理</Link>
            <button type="button" onClick={clearContext}><Eraser />清空上下文</button>
            <button type="button" className="is-danger" onClick={deleteConversation}><Trash2 />删除对话</button>
          </section>
        )}

        <section className={`${p}-conversation`} aria-live="polite">
          <div className={`${p}-date`}>今天 · 在这里安心地聊聊吧</div>
          {messages.length === 0 && (
            <article className={`${p}-message`}>
              <div className={`${p}-avatar`}><Sparkles /></div>
              <div className={`${p}-message-content`}>
                <div className={`${p}-message-label`}><strong>{copy.assistant}</strong><span>刚刚</span></div>
                <div className={`${p}-bubble`}><p>{copy.welcome}</p><p>我可以帮你查找站内故事、角色和世界资料，并把来源一起带回来。</p></div>
                <div className={`${p}-suggestions`}>
                  {suggestions.map(([emoji, title, subtitle, prompt]) => <button type="button" key={title} onClick={() => setInput(prompt)}><span>{emoji}</span><div><strong>{title}</strong><small>{subtitle}</small></div><ChevronRight /></button>)}
                </div>
              </div>
            </article>
          )}
          {messages.filter((message) => message.role !== 'system').map((message) => (
            <article key={message.id} className={`${p}-message${message.role === 'user' ? ` ${p}-message-user` : ''}`}>
              <div className={`${p}-avatar`}>{message.role === 'user' ? <UserRound /> : <Sparkles />}</div>
              <div className={`${p}-message-content`}>
                <div className={`${p}-message-label`}><strong>{messageName(message, copy.assistant)}</strong><span className={`original-chat-status is-${message.status}`}>{formatTime(message.createdAt)} · {STATUS_LABELS[message.status]}</span></div>
                <div className={`${p}-bubble`}>{renderMessageContent(message.content, message.id)}</div>
                <div className="original-chat-message-actions">
                  {message.status === 'completed' && <button type="button" onClick={() => void copyMessage(message.content)}><Copy />复制</button>}
                  {message.role === 'user' && !isGenerating && <button type="button" onClick={() => { setInput(message.content); setEditingId(message.id); composerRef.current?.focus(); }}><Edit3 />编辑</button>}
                  {message.role === 'assistant' && message.id === lastAssistant?.id && message.citations.length > 0 && <button type="button" onClick={() => { setCitations(message.citations); setShowContext(true); }}><BookOpen />{message.citations.length} 条来源</button>}
                </div>
              </div>
            </article>
          ))}
          {isGenerating && streamingText && <article className={`${p}-message`}>
            <div className={`${p}-avatar`}><Sparkles /></div><div className={`${p}-message-content`}><div className={`${p}-message-label`}><strong>{copy.assistant}</strong><span>生成中</span></div><div className={`${p}-bubble`}>{renderMessageContent(streamingText, 'streaming')}</div></div>
          </article>}

          {showContext && <section className="original-chat-context" aria-label="来源与记忆">
            <header><div><Shield /><span><strong>本轮来源与记忆</strong><small>{MODE_LABELS[activeMode]} · 仅显示实际注入内容</small></span></div><button type="button" onClick={() => setShowContext(false)} aria-label="关闭来源与记忆"><X /></button></header>
            <div className="original-chat-context-summary">
              <span><strong>{citations.length}</strong> 条站内来源</span>
              <span><strong>{memoryRecords.length}</strong> 条长期记忆</span>
              <span><Check /><strong>本机存储</strong> 隐私保护</span>
            </div>
            <div className="original-chat-context-column"><h3>引用来源</h3>{citations.length ? citations.map((citation) => <Link to={citation.route} key={citation.id}><BookOpen /><span><strong>{citation.title}</strong><small>{citation.excerpt || citation.route}</small></span><ArrowUpRight /></Link>) : <p>本次请求没有检索到可靠的站内来源。</p>}</div>
            <div className="original-chat-context-column"><h3>使用记忆</h3>{memoryRecords.length ? memoryRecords.map((memory) => <article className="original-chat-memory" key={memory.id}><strong>{memory.title}</strong><span>{memory.content}</span><small>{memory.scope} · v{memory.version}</small></article>) : <p>本次请求没有注入长期记忆。</p>}</div>
            <footer><Link to="/chat/system"><BrainCircuit />打开完整记忆与正史管理<ArrowUpRight /></Link></footer>
          </section>}
          <div ref={threadEndRef} />
        </section>

        {notice && <div className="original-chat-notice" role="status"><Shield /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="关闭提示"><X /></button></div>}

        <section className={`${p}-composer-shell`} ref={stickerPanelRef}>
          {editingId && <div className="original-chat-editing">正在编辑历史消息；发送后将从这里重新生成 <button type="button" onClick={() => { setEditingId(''); setInput(''); composerRef.current?.focus(); }}>取消</button></div>}
          <div className={`${p}-quick-replies`}>
            {canRegenerate && <button type="button" onClick={() => void regenerate()}><RotateCcw />重新生成</button>}
            {lastUser && !isGenerating && <button type="button" onClick={() => { setInput(lastUser.content); setEditingId(lastUser.id); composerRef.current?.focus(); }}><Edit3 />编辑上一条</button>}
            <button type="button" onClick={() => setShowContext((value) => !value)}><Shield />来源与记忆</button>
          </div>
          <div className="original-chat-sticker-anchor">
            {showStickers && <div className="original-chat-sticker-panel" role="dialog" aria-label="猫猫表情包">
              <header><div><strong>猫猫表情</strong><span>点击即可发送</span></div><button type="button" onClick={() => setShowStickers(false)} aria-label="关闭表情面板">×</button></header>
              <div className="original-chat-sticker-grid">
                {CHAT_STICKERS.map((sticker) => <button type="button" key={sticker.id} onClick={() => sendSticker(sticker.id)} title={sticker.label} aria-label={`发送${sticker.label}表情`}>
                  <img src={sticker.src} alt="" /><span>{sticker.label}</span>
                </button>)}
              </div>
            </div>}
          </div>
          <form className={`${p}-composer`} onSubmit={(event) => void send(event)}>
            <button type="button" onClick={() => setShowStickers((value) => !value)} aria-label="打开猫猫表情" title="猫猫表情" aria-expanded={showStickers} disabled={isGenerating}><SmilePlus /></button>
            <textarea ref={composerRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
            }} placeholder={activeMode === 'character' && !selectedCharacter ? '先从对话设置中选择角色…' : '在星海里说点什么…'} rows={1} maxLength={MAX_INPUT_LENGTH} aria-label="聊天消息" />
            <button type="button" className={`${p}-tool`} onClick={() => setShowContext((value) => !value)} aria-label="查看来源与记忆"><Shield />{memoryRecords.length ? `${memoryRecords.length} 条记忆` : '隐私上下文'}</button>
            {isGenerating
              ? <button type="button" className={`${p}-send`} onClick={() => abortRef.current?.abort()} aria-label="停止生成"><Square /></button>
              : <button type="submit" className={`${p}-send`} disabled={!input.trim()} aria-label="发送"><Send /></button>}
          </form>
          <p><span>AI 可能会犯错，请通过引用核对重要信息 · API Key 仅保存在本机</span>{nearInputLimit && <strong>{input.length.toLocaleString('zh-CN')} / {MAX_INPUT_LENGTH.toLocaleString('zh-CN')}</strong>}</p>
        </section>

        <aside className={`${p}-pet-dock`} aria-label="陪伴角色">
          <div className={`${p}-pet-bubble`}><strong>{copy.pet}</strong><span>{copy.petLine}</span></div>
          <button type="button" className={`${p}-pet`} onClick={petPoffy} aria-label={`摸摸泡芙，当前亲密度 ${affection}%`}>
            <span className={`${p}-pet-halo`} /><img src="/pets/poffy.png" alt="泡芙" /><i>♥</i>
            {theme === 'sweet' && <span className="sweet-pet-toppings"><b className="sweet-topping" /><b className="sweet-topping" /><b className="sweet-topping" /><b className="sweet-topping" /><b className="sweet-topping" /></span>}
          </button>
          <div className={`${p}-pet-card`}><div><span>亲密度</span><strong>{affection}%</strong></div><div className={`${p}-affection`}><span style={{ width: `${affection}%` }} /></div><small>点击摸摸泡芙</small></div>
        </aside>

        <nav className={`${p}-mobile-nav`} aria-label="聊天快捷导航">
          <button type="button" onClick={() => setSidebarOpen(true)}><MessageCircle />对话</button>
          <Link to="/"><Home />首页</Link>
          <button type="button" className="is-active" onClick={() => setInput('带我探索这个网站。')}><Compass />探索</button>
          <Link to="/settings/ai"><Settings2 />设置</Link>
          <button type="button" onClick={() => setShowControls((value) => !value)}><MoreHorizontal />更多</button>
        </nav>
      </main>

      {confirmation && <div className="original-chat-dialog-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.currentTarget === event.target) setConfirmation(null);
      }}>
        <section className="original-chat-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-dialog-title">
          <header><div className={confirmation.type === 'rename' ? '' : 'is-danger'}>{confirmation.type === 'rename' ? <Edit3 /> : <Trash2 />}</div><button type="button" onClick={() => setConfirmation(null)} aria-label="关闭"><X /></button></header>
          <h2 id="chat-dialog-title">{confirmationTitle}</h2>
          {confirmation.type === 'rename'
            ? <><p>取一个方便回看的名字，最多 80 个字符。</p><input autoFocus value={confirmation.value} maxLength={80} onChange={(event) => setConfirmation({ type: 'rename', value: event.target.value })} onKeyDown={(event) => {
              if (event.key === 'Enter') confirmAction();
            }} aria-label="对话名称" /></>
            : <p>{confirmation.type === 'delete' ? '这段对话会从列表中移除，但底层仍保留为可恢复状态。' : '当前消息、摘要和会话级记忆会被清除；全局与角色长期记忆不受影响。'}</p>}
          <footer><button type="button" onClick={() => setConfirmation(null)}>取消</button><button type="button" className={confirmation.type === 'rename' ? 'is-primary' : 'is-danger'} onClick={confirmAction} disabled={confirmation.type === 'rename' && !confirmation.value.trim()}>{confirmation.type === 'rename' ? '保存名称' : confirmation.type === 'delete' ? '确认删除' : '确认清空'}</button></footer>
        </section>
      </div>}
    </div>
  );
}
