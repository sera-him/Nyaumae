import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  BookOpen, Bot, ChevronDown, ChevronRight, Compass, Copy, Edit3, Eraser,
  FileDown, Home, Menu, MessageCircle, MoreHorizontal, Paperclip,
  Plus, RotateCcw, Search, Send, Settings2, Shield, Sparkles, Square,
  Trash2, UserRound, WandSparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { characters } from '@/data/characters';
import { conversationEngine } from '@/conversation/conversationEngine';
import { memoryManager } from '@/conversation/memoryManager';
import { maskSecret } from '@/conversation/privacy';
import { conversationRepository } from '@/conversation/storage';
import type { Citation, Conversation, ConversationMode, Message } from '@/conversation/types';
import './ThemedChat.css';

type ChatTheme = 'ocean' | 'sweet';

interface ThemedChatProps {
  theme: ChatTheme;
}

const themeCopy = {
  ocean: {
    brand: 'NYAUMÆ',
    subtitle: 'OCEAN OF THOUGHTS',
    assistant: 'Nyaumæ AI',
    welcome: '想从哪里开始探索？',
    pet: '泡芙',
    petLine: '今天也陪你一起探索～',
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

function formatTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
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
  link.click();
  URL.revokeObjectURL(url);
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
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [notice, setNotice] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [memoryIds, setMemoryIds] = useState<string[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820);
  const [affection, setAffection] = useState(78);
  const abortRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

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
  };

  useEffect(() => {
    queueMicrotask(() => {
      const existing = conversationEngine.listConversations();
      if (existing.length === 0) {
        const created = conversationEngine.createConversation({ mode: 'website-assistant', title: '网站助手' });
        refresh(created.id);
      } else {
        refresh(existing[0].id);
      }
    });
    // Repository hydration is intentionally performed once when the themed shell mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText]);

  const selectConversation = (id: string) => {
    setSelectedId(id);
    const nextMessages = conversationEngine.getMessages(id);
    setMessages(nextMessages);
    restoreInspector(nextMessages);
    setEditingId('');
    setInput('');
    setNotice('');
    if (window.innerWidth <= 820) setSidebarOpen(false);
  };

  const newConversation = () => {
    const created = conversationEngine.createConversation({
      mode: activeMode,
      characterId: selectedCharacter || undefined,
      title: '新对话',
    });
    refresh(created.id);
    if (window.innerWidth <= 820) setSidebarOpen(false);
  };

  const renameConversation = () => {
    if (!selectedConversation) return;
    const title = window.prompt('为对话命名', selectedConversation.title)?.trim();
    if (!title) return;
    conversationRepository.updateConversation(selectedConversation.id, { title });
    refresh(selectedConversation.id);
  };

  const deleteConversation = () => {
    if (!selectedConversation || !window.confirm('删除这个对话？对话会被软删除。')) return;
    conversationRepository.softDeleteConversation(selectedConversation.id);
    refresh();
  };

  const updateConversation = (patch: Partial<Pick<Conversation, 'mode' | 'characterId' | 'model'>>) => {
    if (!selectedConversation) return;
    conversationRepository.updateConversation(selectedConversation.id, patch);
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
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
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
      }
      setStreamingText('');
      refresh(selectedConversation.id);
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const clearContext = () => {
    if (!selectedConversation || !window.confirm('清空当前会话上下文？会话消息和会话级记忆会被删除。')) return;
    conversationEngine.clearConversationContext(selectedConversation.id);
    refresh(selectedConversation.id);
    setCitations([]);
    setMemoryIds([]);
    setNotice('会话上下文已清空。');
  };

  const memoryRecords = memoryIds
    .map((id) => memoryManager.getSource(id).memory)
    .filter((memory): memory is NonNullable<typeof memory> => Boolean(memory));
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const canRegenerate = messages.some((message) => message.role === 'assistant') && Boolean(lastUser) && !isGenerating;

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

      <aside className={`${p}-sidebar`} aria-label="对话列表">
        <div className={`${p}-sidebar-brand`}>
          <div className={`${p}-brand-orbit`}><Sparkles /></div>
          <div><strong>{copy.brand}</strong><span>{copy.subtitle}</span></div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="收起侧栏"><Menu /></button>
        </div>
        <button type="button" className={`${p}-new-chat`} onClick={newConversation}>
          <Plus /><span>新建对话</span><kbd>⌘ K</kbd>
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
          <div><Compass /><span>世界探索</span><strong>旅程等级 4</strong></div>
          <div className={`${p}-voyage-track`}><span /></div>
          <small>再发现 2 条资料即可解锁下一等级</small>
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
              <p><strong>{selectedConversation?.title ?? copy.assistant}</strong><button type="button" onClick={() => setShowControls((value) => !value)} aria-label="对话设置"><ChevronDown /></button></p>
              <span><i />{aiConfig.enabled ? `${aiConfig.providerLabel} · ${selectedConversation?.model ?? aiConfig.model}` : 'AI 尚未启用'}</span>
            </div>
          </div>
          <div className={`${p}-header-actions`}>
            <button type="button" className={`${p}-icon-btn`} onClick={() => setShowContext((value) => !value)} aria-label="查看引用和记忆"><Shield /></button>
            <button type="button" className={`${p}-icon-btn`} onClick={renameConversation} aria-label="重命名对话"><Edit3 /></button>
            <button type="button" className={`${p}-share`} onClick={() => {
              if (!selectedConversation) return;
              downloadFile(`conversation-${selectedConversation.id}.json`, conversationEngine.exportConversation(selectedConversation.id));
              setNotice('对话已导出，文件不包含 API Key。');
            }}><FileDown /><span>导出</span></button>
          </div>
        </header>

        {showControls && (
          <section className="original-chat-controls" aria-label="对话设置">
            <label>模式<select value={activeMode} onChange={(event) => updateConversation({ mode: event.target.value as ConversationMode })}>
              <option value="website-assistant">网站助手</option><option value="character">角色对话</option><option value="story-query">故事查询</option>
            </select></label>
            {activeMode === 'character' && <label>角色<select value={selectedCharacter} onChange={(event) => updateConversation({ characterId: event.target.value || undefined, mode: 'character' })}>
              <option value="">选择角色</option>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
            </select></label>}
            <label>模型<input key={`${selectedConversation?.id}-${selectedConversation?.model ?? aiConfig.model}`} defaultValue={selectedConversation?.model ?? aiConfig.model} onBlur={(event) => event.currentTarget.value.trim() && updateConversation({ model: event.currentTarget.value.trim() })} /></label>
            <Link to="/settings/ai"><Settings2 />连接设置</Link>
            <button type="button" onClick={clearContext}><Eraser />清空上下文</button>
            <button type="button" onClick={deleteConversation}><Trash2 />删除对话</button>
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
                <div className={`${p}-message-label`}><strong>{messageName(message, copy.assistant)}</strong><span>{formatTime(message.createdAt)} · {message.status}</span></div>
                <div className={`${p}-bubble`}>{message.content.split('\n').map((line, index) => <p key={`${message.id}-${index}`}>{line || '\u00a0'}</p>)}</div>
                {message.role === 'assistant' && message.status === 'completed' && <div className="original-chat-message-actions"><button type="button" onClick={() => navigator.clipboard?.writeText(message.content)}><Copy />复制</button></div>}
              </div>
            </article>
          ))}
          {isGenerating && streamingText && <article className={`${p}-message`}>
            <div className={`${p}-avatar`}><Sparkles /></div><div className={`${p}-message-content`}><div className={`${p}-message-label`}><strong>{copy.assistant}</strong><span>生成中</span></div><div className={`${p}-bubble`}><p>{streamingText}</p></div></div>
          </article>}

          {showContext && <section className="original-chat-context">
            <header><Shield /><strong>本次使用的上下文</strong><button type="button" onClick={() => setShowContext(false)}>×</button></header>
            <div><h3>引用来源</h3>{citations.length ? citations.map((citation) => <Link to={citation.route} key={citation.id}><BookOpen /><span>{citation.title}<small>{citation.route}</small></span></Link>) : <p>本次请求没有检索到站内来源。</p>}</div>
            <div><h3>使用记忆</h3>{memoryRecords.length ? memoryRecords.map((memory) => <span className="original-chat-memory" key={memory.id}>{memory.title} · v{memory.version}</span>) : <p>本次请求没有注入长期记忆。</p>}</div>
          </section>}
          <div ref={threadEndRef} />
        </section>

        {notice && <div className="original-chat-notice" role="status"><Shield />{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}

        <section className={`${p}-composer-shell`}>
          {editingId && <div className="original-chat-editing">正在编辑上一条消息 <button type="button" onClick={() => { setEditingId(''); setInput(''); }}>取消</button></div>}
          <div className={`${p}-quick-replies`}>
            {canRegenerate && <button type="button" onClick={() => void regenerate()}><RotateCcw />重新生成</button>}
            {lastUser && !isGenerating && <button type="button" onClick={() => { setInput(lastUser.content); setEditingId(lastUser.id); }}><Edit3 />编辑上一条</button>}
            <button type="button" onClick={() => setShowContext((value) => !value)}><Shield />来源与记忆</button>
          </div>
          <form className={`${p}-composer`} onSubmit={(event) => void send(event)}>
            <button type="button" aria-label="附件暂未开放" title="附件功能暂未开放"><Paperclip /></button>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
            }} placeholder={aiConfig.enabled ? '输入消息…' : '请先在设置中配置 AI 模型…'} rows={1} />
            <span className={`${p}-tool`}><WandSparkles />记忆已开启</span>
            {isGenerating
              ? <button type="button" className={`${p}-send`} onClick={() => abortRef.current?.abort()} aria-label="停止生成"><Square /></button>
              : <button type="submit" className={`${p}-send`} disabled={!input.trim()} aria-label="发送"><Send /></button>}
          </form>
          <p>AI 可能会犯错，请通过引用核对重要信息 · API Key 仅保存在本机</p>
        </section>

        <aside className={`${p}-pet-dock`} aria-label="陪伴角色">
          <div className={`${p}-pet-bubble`}><strong>{copy.pet}</strong><span>{copy.petLine}</span></div>
          <button type="button" className={`${p}-pet`} onClick={() => setAffection((value) => Math.min(100, value + 1))} aria-label="摸摸泡芙">
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
    </div>
  );
}
