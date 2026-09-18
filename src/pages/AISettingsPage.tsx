import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { L } from '@/lib/translations/manual';

import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Cloud,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Globe2,
  HardDrive,
  Images,
  KeyRound,
  Laptop,
  LoaderCircle,
  MemoryStick,
  Monitor,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { confirmAction } from '@/lib/confirmAction';
import { readJsonStorage, readStorageValue, removeStorageValue, writeJsonStorage } from '@/lib/browserStorage';
import { getLocale } from '@/lib/i18n';
import { Link } from 'react-router';
import { conversationRepository } from '@/conversation/storage';
import type { AiConfig } from '@/conversation/types';
import { exportSafeAiConfig, maskSecret, sanitizeImportedConfig, validateAiConfig } from '@/conversation/privacy';
import { browserSupportsLocalAI, prepareBrowserModel, testModelConnection } from '@/conversation/modelAdapters';
import {
  getSyncConfig,
  getSyncStatus,
  restartSyncBridge,
  saveSyncConfig,
  subscribeSyncStatus,
  syncNow,
  type SyncStatus,
} from '@/conversation/syncBridge';
import {
  findModelTier,
  LOCAL_MODEL_TIERS,
  recommendedTier,
  type LocalModelTier,
} from '@/conversation/localModelCatalog';
import { getShowOriginalImages, setShowOriginalImages, subscribeShowOriginalImages } from '@/lib/imagePreference';
import './AISettingsPage.css';

type Notice = { kind: 'success' | 'error' | 'info'; text: string } | null;
type SetupMode = 'cloud' | 'device' | 'browser';
type CloudPresetId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'moonshot'
  | 'zai'
  | 'qwen'
  | 'minimax'
  | 'mistral'
  | 'xai'
  | 'siliconflow'
  | 'openrouter'
  | 'custom';
type LocalRuntime = 'ollama' | 'lmstudio' | 'custom';
type ToneId = 'precise' | 'balanced' | 'creative';

const AI_SETTINGS_DRAFT_KEY = 'neural-connection:ai-settings-draft:v1';

function readSettingsDraft(fallback: AiConfig): AiConfig {
  const draft = readJsonStorage<Partial<AiConfig> | null>(AI_SETTINGS_DRAFT_KEY, null).value;
  return draft ? { ...fallback, ...draft, apiKey: fallback.apiKey } : fallback;
}

function writeSettingsDraft(config: AiConfig): void {
  const safeDraft: Partial<AiConfig> = { ...config };
  delete safeDraft.apiKey;
  writeJsonStorage(AI_SETTINGS_DRAFT_KEY, safeDraft);
}

function clearSettingsDraft(): void {
  removeStorageValue(AI_SETTINGS_DRAFT_KEY);
}

const CUSTOM_MODEL_VALUE = '__custom_model__';

type CloudPreset = {
  id: CloudPresetId;
  name: string;
  description: string;
  providerLabel: string;
  baseUrl: string;
  model: string;
  models: string[];
  icon: typeof Bot;
};

const CLOUD_PROVIDERS: CloudPreset[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-5.6 系列 API', providerLabel: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.6-sol', models: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'], icon: Sparkles },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 5 系列 API', providerLabel: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-opus-5', models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5', 'claude-fable-5', 'claude-opus-4-8', 'claude-sonnet-4-6'], icon: Bot },
  { id: 'google', name: 'Google AI', description: 'Gemini 3.1 系列 API', providerLabel: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.1-pro', models: ['gemini-3.1-pro', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash'], icon: Globe2 },
  { id: 'deepseek', name: 'DeepSeek', description: 'V4 新一代推理模型', providerLabel: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-v4-pro', models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-r1'], icon: Zap },
  { id: 'moonshot', name: 'Kimi / Moonshot AI', description: 'Kimi K3 云端 API（不下载本地权重）', providerLabel: 'Kimi / Moonshot AI', baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-k3', models: ['kimi-k3', 'kimi-k2.7-code', 'kimi-k2.6'], icon: Bot },
  { id: 'zai', name: 'Z.ai', description: 'GLM-5 新一代 API', providerLabel: 'Z.ai', baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-5.2', models: ['glm-5.2', 'glm-5.1', 'glm-5', 'glm-4.7'], icon: Sparkles },
  { id: 'qwen', name: 'Qwen / 通义千问', description: 'Qwen 3.7 系列兼容接口', providerLabel: 'Qwen / 通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen3.7-max', models: ['qwen3.7-max', 'qwen3.7-plus', 'qwen3.7-flash', 'qwen3.5-plus', 'qwen3.5-flash', 'qwen-max', 'qwen-plus', 'qwen-flash'], icon: Cpu },
  { id: 'minimax', name: 'MiniMax', description: 'MiniMax M3 系列 API', providerLabel: 'MiniMax', baseUrl: 'https://api.minimax.io/v1', model: 'MiniMax-M3', models: ['MiniMax-M3', 'MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed', 'MiniMax-M2.1', 'MiniMax-M2'], icon: Server },
  { id: 'mistral', name: 'Mistral AI', description: 'Mistral 新一代 API', providerLabel: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-large-latest', models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest'], icon: Cloud },
  { id: 'xai', name: 'xAI', description: 'Grok API', providerLabel: 'xAI', baseUrl: 'https://api.x.ai/v1', model: 'grok-4.5', models: ['grok-4.5', 'grok-4.3', 'grok-4.20-0309-reasoning', 'grok-4.20-0309-non-reasoning'], icon: Zap },
  { id: 'siliconflow', name: '硅基流动', description: '多种新一代开源模型', providerLabel: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V4-Pro', models: ['deepseek-ai/DeepSeek-V4-Pro', 'deepseek-ai/DeepSeek-V4-Flash', 'deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-R1', 'zai-org/GLM-5.1', 'zai-org/GLM-5', 'moonshotai/Kimi-K2.7-Code', 'moonshotai/Kimi-K2.6', 'MiniMaxAI/MiniMax-M2.5', 'Qwen/Qwen3.6-35B-A3B', 'Qwen/Qwen3.5-397B-A17B'], icon: Server },
  { id: 'openrouter', name: 'OpenRouter', description: '统一聚合最新模型', providerLabel: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-v4-pro', models: ['deepseek/deepseek-v4-pro', 'deepseek/deepseek-v4-flash', 'anthropic/claude-opus-5', 'anthropic/claude-sonnet-5', 'openai/gpt-5.6-sol', 'google/gemini-3.6-flash', 'moonshotai/kimi-k3', 'z-ai/glm-5.1'], icon: Cloud },
  { id: 'custom', name: '自定义连接', description: '手动填写服务与模型', providerLabel: 'OpenAI-compatible', baseUrl: '', model: '', models: [], icon: SlidersHorizontal },
]; 

const CLOUD_ONLY_MODEL_NOTICES: Record<string, string> = {
  'kimi-k3': '这里的 kimi-k3 是云端 API 模型名，不会把 Kimi K3 权重下载到本机。要下载真实权重，请切换到“电脑本地”，选择 2.8T，然后使用 Hugging Face 官方命令。',
  'moonshotai/kimi-k3': '这里的 moonshotai/kimi-k3 是聚合服务中的云端模型名，不会把 Kimi K3 权重下载到本机。真实权重下载请使用“电脑本地”模式中的 Hugging Face 官方命令。',
  'kimi-k2.6': '这里的 kimi-k2.6 是云端 API 模型名，不会把 Kimi K2.6 权重下载到本机。真实权重下载请切换到“电脑本地”，选择 1T，然后使用 Hugging Face 官方命令。',
  'moonshotai/Kimi-K2.6': '这里的 moonshotai/Kimi-K2.6 是聚合服务中的云端模型名，不会把 Kimi K2.6 权重下载到本机。真实权重下载请使用“电脑本地”模式中的 Hugging Face 官方命令。',
};

const CLOUD_PROVIDER_EN: Record<string, { description: string; providerLabel?: string; name?: string }> = {
  openai: { description: 'GPT-5.6 series API' },
  anthropic: { description: 'Claude 5 series API' },
  google: { description: 'Gemini 3.1 series API' },
  deepseek: { description: 'V4 next-gen reasoning models' },
  moonshot: { description: 'Kimi K3 cloud API (no local weights downloaded)' },
  zai: { description: 'GLM-5 next-gen API' },
  qwen: { description: 'Qwen 3.7 series compatible endpoint', providerLabel: 'Qwen / Tongyi', name: 'Qwen / Tongyi Qianwen' },
  minimax: { description: 'MiniMax M3 series API' },
  mistral: { description: 'Mistral next-gen API' },
  xai: { description: 'Grok API' },
  siliconflow: { description: 'A variety of next-gen open models', providerLabel: 'SiliconFlow', name: 'SiliconFlow' },
  openrouter: { description: 'Unified aggregation of the latest models' },
  custom: { description: 'Manually enter service and model', name: 'Custom connection' },
};

const CLOUD_ONLY_MODEL_NOTICES_EN: Record<string, string> = {
  'kimi-k3': 'The kimi-k3 here is a cloud API model name; it does not download Kimi K3 weights to this device. To download the real weights, switch to "On this computer", pick 2.8T, then use the official Hugging Face command.',
  'moonshotai/kimi-k3': 'The moonshotai/kimi-k3 here is a cloud model name on the aggregation service; it does not download Kimi K3 weights to this device. For real weights, use the official Hugging Face command in "On this computer" mode.',
  'kimi-k2.6': 'The kimi-k2.6 here is a cloud API model name; it does not download Kimi K2.6 weights to this device. For real weights, switch to "On this computer", pick 1T, then use the official Hugging Face command.',
  'moonshotai/Kimi-K2.6': 'The moonshotai/Kimi-K2.6 here is a cloud model name on the aggregation service; it does not download Kimi K2.6 weights to this device. For real weights, use the official Hugging Face command in "On this computer" mode.',
};

const TONES: Array<{ id: ToneId; name: string; description: string; temperature: number }> = [
  { id: 'precise', name: '严谨', description: '回答稳定直接', temperature: 0.25 },
  { id: 'balanced', name: '平衡', description: '适合多数对话', temperature: 0.7 },
  { id: 'creative', name: '创意', description: '表达更多样', temperature: 1.15 },
];

const TONES_EN: Array<{ id: ToneId; name: string; description: string; temperature: number }> = [
  { id: 'precise', name: 'Precise', description: 'Steady and direct answers', temperature: 0.25 },
  { id: 'balanced', name: 'Balanced', description: 'Good for most chats', temperature: 0.7 },
  { id: 'creative', name: 'Creative', description: 'More varied expression', temperature: 1.15 },
];

function initialMode(config: AiConfig): SetupMode {
  if (config.provider === 'browser') return 'browser';
  if (config.provider === 'local') return 'device';
  return 'cloud';
}

function findCloudPreset(config: AiConfig): CloudPreset {
  return CLOUD_PROVIDERS.find((item) => item.baseUrl && config.baseUrl.replace(/\/+$/, '') === item.baseUrl.replace(/\/+$/, ''))
    ?? CLOUD_PROVIDERS.find((item) => item.id === 'custom')!;
}

function deviceMemory(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
}

function findTone(temperature: number): ToneId {
  if (temperature <= 0.4) return 'precise';
  if (temperature >= 1) return 'creative';
  return 'balanced';
}

function numberValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function runtimeFromConfig(config: AiConfig): LocalRuntime {
  if (config.baseUrl.includes('1234')) return 'lmstudio';
  if (config.baseUrl.includes('11434')) return 'ollama';
  return 'custom';
}

export default function AISettingsPage() {
  const _en = getLocale() === 'en';
  const initialConfig = useMemo(() => readSettingsDraft(conversationRepository.getAiConfig()), []);
  const memoryGb = useMemo(() => deviceMemory(), []);
  const [config, setConfig] = useState<AiConfig>(initialConfig);
  const [mode, setMode] = useState<SetupMode>(() => initialMode(initialConfig));
  const [cloudPresetId, setCloudPresetId] = useState<CloudPresetId>(() => findCloudPreset(initialConfig).id);
  const [runtime, setRuntime] = useState<LocalRuntime>(() => runtimeFromConfig(initialConfig));
  const [selectedTierId, setSelectedTierId] = useState(() => (
    findModelTier(initialConfig.model)?.id ?? recommendedTier(memoryGb, initialMode(initialConfig) === 'browser' ? 'browser' : 'device').id
  ));
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [testing, setTesting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadText, setDownloadText] = useState('');
  const [importText, setImportText] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [draftSaved, setDraftSaved] = useState(() => readStorageValue(AI_SETTINGS_DRAFT_KEY).value !== null);
  const [syncConfig, setSyncConfig] = useState(() => getSyncConfig());
  const [syncKeyDraft, setSyncKeyDraft] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => getSyncStatus());
  const [syncBusy, setSyncBusy] = useState(false);
  const showOriginalImages = useSyncExternalStore(subscribeShowOriginalImages, getShowOriginalImages);

  useEffect(() => subscribeSyncStatus(setSyncStatus), []);
  const actionLockRef = useRef(false);
  const skipDraftWriteRef = useRef(false);
  const testAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => testAbortRef.current?.abort(), []);

  useEffect(() => {
    if (skipDraftWriteRef.current) {
      skipDraftWriteRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      writeSettingsDraft(config);
      setDraftSaved(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [config]);

  const cloudPreset = CLOUD_PROVIDERS.find((item) => item.id === cloudPresetId) ?? CLOUD_PROVIDERS.find((item) => item.id === 'custom')!;
  const selectedTier = LOCAL_MODEL_TIERS.find((tier) => tier.id === selectedTierId) ?? LOCAL_MODEL_TIERS.find((tier) => tier.id === '1_7b')!;
  const recommended = recommendedTier(memoryGb, mode === 'browser' ? 'browser' : 'device');
  const webGpuReady = useMemo(() => browserSupportsLocalAI(), []);
  const hasUsableKey = mode !== 'cloud' || Boolean(apiKeyDraft.trim() || config.apiKey);
  const isCustomCloudModel = cloudPreset.models.length === 0 || !cloudPreset.models.includes(config.model);
  const cloudModelNotice = (_en ? CLOUD_ONLY_MODEL_NOTICES_EN : CLOUD_ONLY_MODEL_NOTICES)[config.model.trim()];
  const ollamaModelSelectionNeedsAttention = mode === 'device'
    && runtime === 'ollama'
    && selectedTier.download.kind === 'huggingface'
    && config.model === selectedTier.deviceModel;

  const update = <K extends keyof AiConfig>(key: K, value: AiConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const selectMode = (nextMode: SetupMode) => {
    setMode(nextMode);
    setNotice(null);
    setDownloadProgress(null);
    if (nextMode === 'cloud') {
      const preset = CLOUD_PROVIDERS[0];
      setCloudPresetId(preset.id);
      setConfig((current) => ({
        ...current,
        provider: 'openai-compatible',
        providerLabel: preset.providerLabel,
        baseUrl: preset.baseUrl,
        model: preset.model,
        apiKey: undefined,
      }));
      return;
    }

    const nextTier = recommendedTier(memoryGb, nextMode);
    setSelectedTierId(nextTier.id);
    setApiKeyDraft('');
    if (nextMode === 'browser') {
      setConfig((current) => ({
        ...current,
        provider: 'browser',
        providerLabel: _en ? 'Browser WebGPU' : '浏览器 WebGPU',
        baseUrl: 'browser://webgpu',
        model: nextTier.browserModel ?? LOCAL_MODEL_TIERS.find((tier) => tier.browserModel)?.browserModel ?? '',
        apiKey: undefined,
      }));
    } else {
      setRuntime('ollama');
      setConfig((current) => ({
        ...current,
        provider: 'local',
        providerLabel: 'Ollama',
        baseUrl: 'http://localhost:11434/v1',
        model: nextTier.ollamaModel ?? nextTier.deviceModel,
        apiKey: undefined,
      }));
    }
  };

  const chooseCloudProvider = (preset: CloudPreset) => {
    const keepKey = mode === 'cloud' && preset.id === cloudPresetId;
    setCloudPresetId(preset.id);
    setConfig((current) => ({
      ...current,
      provider: 'openai-compatible',
      providerLabel: preset.providerLabel,
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: keepKey ? current.apiKey : undefined,
    }));
    if (!keepKey) setApiKeyDraft('');
    setNotice(null);
  };

  const chooseRuntime = (nextRuntime: LocalRuntime) => {
    setRuntime(nextRuntime);
    const runtimeConfig = nextRuntime === 'ollama'
      ? { providerLabel: 'Ollama', baseUrl: 'http://localhost:11434/v1' }
      : nextRuntime === 'lmstudio'
        ? { providerLabel: 'LM Studio', baseUrl: 'http://localhost:1234/v1' }
        : { providerLabel: _en ? 'Local OpenAI-compatible service' : '本地 OpenAI 兼容服务', baseUrl: '' };
    setConfig((current) => ({
      ...current,
      provider: 'local',
      ...runtimeConfig,
      model: selectedTier.ollamaModel ?? selectedTier.deviceModel,
      apiKey: undefined,
    }));
    setNotice(null);
  };

  const chooseTier = (tier: LocalModelTier) => {
    setSelectedTierId(tier.id);
    update('model', mode === 'browser' ? (tier.browserModel ?? tier.deviceModel) : (tier.ollamaModel ?? tier.deviceModel));
    if (mode === 'browser' && !tier.browserModel) {
      setNotice({ kind: 'info', text: _en ? `${tier.label} selected. The browser has no built-in weights of this size yet; switch to "On this computer" to run it.` : `${tier.label} 已选择。浏览器暂时没有这个尺寸的内置权重，请切换到“电脑本地”模式运行。` });
    }
  };

  const buildNextConfig = (): AiConfig => ({
    ...config,
    enabled: true,
    apiKey: mode === 'cloud' ? (apiKeyDraft.trim() || config.apiKey) : undefined,
    updatedAt: new Date().toISOString(),
  });

  const saveOnly = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    const next = buildNextConfig();
    const errors = validateAiConfig(next);
    if (errors.length) {
      setNotice({ kind: 'error', text: errors.join(' ') });
      actionLockRef.current = false;
      return;
    }
    if (mode === 'browser' && !selectedTier.browserModel) {
      setNotice({ kind: 'error', text: _en ? 'The selected size has no browser-loadable built-in weights. Switch to "On this computer" mode before saving.' : '当前选择的尺寸没有可供浏览器加载的内置权重，请切换到“电脑本地”模式后再保存。' });
      actionLockRef.current = false;
      return;
    }
    const saved = conversationRepository.saveAiConfig(next);
    skipDraftWriteRef.current = true;
    setConfig(saved);
    setApiKeyDraft('');
    clearSettingsDraft();
    setDraftSaved(false);
    setNotice({ kind: 'success', text: _en ? 'Settings saved. You can start chatting now.' : '设置已保存，可以开始对话了。' });
    queueMicrotask(() => { actionLockRef.current = false; });
  };

  const saveAndTest = async () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    const next = buildNextConfig();
    const errors = validateAiConfig(next);
    if (errors.length) {
      setNotice({ kind: 'error', text: errors.join(' ') });
      actionLockRef.current = false;
      return;
    }
    if (mode === 'browser' && !selectedTier.browserModel) {
      setNotice({ kind: 'error', text: _en ? 'The selected size has no browser-loadable built-in weights. Switch to "On this computer" mode before saving and testing.' : '当前选择的尺寸没有可供浏览器加载的内置权重，请切换到“电脑本地”模式后再保存并测试。' });
      actionLockRef.current = false;
      return;
    }
    if (ollamaModelSelectionNeedsAttention) {
      setNotice({ kind: 'error', text: _en ? 'The current model has no official Ollama local package. Switch to a runner that supports official weights and fill in its model name, or pick a model available in Ollama before testing.' : '当前模型没有 Ollama 官方本地包。请切换到支持官方权重的运行器并填写其模型名称，或选择 Ollama 可用的模型后再测试。' });
      actionLockRef.current = false;
      return;
    }
    setTesting(true);
    const controller = new AbortController();
    testAbortRef.current = controller;
    setNotice({ kind: 'info', text: mode === 'browser' ? (_en ? 'Preparing the local browser model…' : '正在准备浏览器本地模型…') : (_en ? 'Connecting to the model…' : '正在连接模型…') });
    try {
      if (mode === 'browser') {
        setDownloadProgress(0);
        await prepareBrowserModel(next.model, (progress, text) => {
          setDownloadProgress(progress);
          setDownloadText(text);
        }, controller.signal);
      }
      await testModelConnection(next, controller.signal);
      const saved = conversationRepository.saveAiConfig(next);
      skipDraftWriteRef.current = true;
      setConfig(saved);
      setApiKeyDraft('');
      clearSettingsDraft();
      setDraftSaved(false);
      setDownloadProgress(mode === 'browser' ? 100 : null);
      setNotice({ kind: 'success', text: mode === 'browser'
        ? (_en ? 'Model saved to the browser cache; you can chat offline now.' : '模型已保存在浏览器缓存中，可以离线对话。')
        : (_en ? 'Connected. Settings saved.' : '连接成功，设置已经保存。') });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : (_en ? 'Connection failed. Check what you entered and retry.' : '连接失败，请检查填写内容后重试。') });
    } finally {
      setTesting(false);
      testAbortRef.current = null;
      actionLockRef.current = false;
    }
  };

  const copyCommand = async () => {
    await navigator.clipboard?.writeText(selectedTier.download.command);
    setNotice({ kind: 'success', text: selectedTier.download.kind === 'ollama'
      ? (_en ? 'The Ollama local model command is copied.' : 'Ollama 本地模型命令已复制。')
      : (_en ? 'The official weights download command is copied.' : '官方权重下载命令已复制。') });
  };

  const clear = () => {
    if (!confirmAction({
      title: _en ? 'Clear the AI settings on this device?' : '清除这台设备上的 AI 设置？',
      consequence: _en ? 'The service URL, model parameters and saved keys will be removed; already-downloaded browser model caches are not deleted automatically.' : '服务地址、模型参数和已保存的密钥都会移除；已经下载的浏览器模型缓存不会自动删除。',
    })) return;
    conversationRepository.clearAiConfig();
    const fresh = conversationRepository.getAiConfig();
    skipDraftWriteRef.current = true;
    setConfig(fresh);
    setMode('cloud');
    setCloudPresetId(findCloudPreset(fresh).id);
    setApiKeyDraft('');
    clearSettingsDraft();
    setDraftSaved(false);
    setNotice({ kind: 'info', text: _en ? 'AI settings on this device have been cleared. Browser model caches can be cleared in the browser\'s site data.' : '这台设备上的 AI 设置已清除。浏览器模型缓存可在浏览器的网站数据中清除。' });
  };

  const exportConfig = async () => {
    const safe = JSON.stringify(exportSafeAiConfig(buildNextConfig()), null, 2);
    try {
      await navigator.clipboard.writeText(safe);
      setNotice({ kind: 'success', text: _en ? 'Config copied — it contains no API key.' : '配置已复制，内容不包含 API Key。' });
    } catch {
      setImportText(safe);
      setNotice({ kind: 'info', text: _en ? 'The config has been placed in the box below; you can copy it manually.' : '配置已放入下方文本框，可手动复制。' });
    }
  };

  const importConfig = () => {
    try {
      const next = sanitizeImportedConfig(JSON.parse(importText) as unknown, config);
      if (!confirmAction({
        title: _en ? 'Load this AI config?' : '载入这份 AI 配置？',
        consequence: _en ? 'The service, model and parameters in the current form will be replaced; the imported content has no API key, and you still need to review and save it yourself.' : '当前表单中的服务、模型和参数会被替换；导入内容不包含 API Key，仍需你自行确认后保存。',
      })) return;
      setConfig(next);
      setMode(initialMode(next));
      setCloudPresetId(findCloudPreset(next).id);
      setRuntime(runtimeFromConfig(next));
      setSelectedTierId(findModelTier(next.model)?.id ?? selectedTierId);
      setNotice({ kind: 'success', text: _en ? 'Config loaded. Once you have reviewed it, click "Save only".' : '配置已载入。确认无误后，请点击“仅保存”。' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : (_en ? 'Could not recognize this config.' : '无法识别这份配置。') });
    }
  };

  const saveSync = async () => {
    if (syncBusy) return;
    setSyncBusy(true);
    try {
      const next = saveSyncConfig({
        ...syncConfig,
        syncKey: syncKeyDraft.trim() || syncConfig.syncKey,
      });
      setSyncConfig(next);
      setSyncKeyDraft('');
      await restartSyncBridge();
      setNotice({ kind: 'success', text: L("同步设置已保存。") });
    } finally {
      setSyncBusy(false);
    }
  };

  const runSyncNow = async () => {
    if (syncBusy) return;
    setSyncBusy(true);
    try {
      await syncNow();
      const latest = getSyncStatus();
      setNotice(latest.state === 'error'
        ? { kind: 'error', text: latest.message }
        : { kind: 'success', text: L("同步完成。") });
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <div className="ai-settings-page aurora-ui">
      <div className="aurora-container ai-settings-inner">
        <header className="ai-settings-hero">
          <div>
            <p className="aurora-eyebrow">AI SETUP / 1M — 2.8T</p>
            <h1 className="aurora-title">{L("选择你的 AI")}</h1>
            <p className="aurora-lead">{L("云端、电脑本地或浏览器内运行，一步一步完成。")}</p>
          </div>
          {config.enabled && (
            <div className="ai-current-status" data-motion-reveal>
              <span><CheckCircle2 />{L("已启用")}</span>
              <strong>{config.providerLabel || (_en ? 'AI service' : 'AI 服务')}</strong>
              <small>{config.model}</small>
            </div>
          )}
        </header>

        <section className="ai-setup-card" data-motion-reveal>
          <div className="ai-step-heading"><span>1</span><div><h2>{L("AI 放在哪里运行？")}</h2><p>{L("本地模式不会把对话发送给云端模型服务商。")}</p></div></div>
          <div className="ai-placement-grid">
            <button type="button" className={`ai-placement-card${mode === 'cloud' ? ' is-selected' : ''}`} onClick={() => selectMode('cloud')} aria-pressed={mode === 'cloud'}>
              <Cloud /><span><strong>{L("云端 API")}</strong><small>{L("最省设备空间，需 API Key")}</small></span><Check />
            </button>
            <button type="button" className={`ai-placement-card${mode === 'device' ? ' is-selected' : ''}`} onClick={() => selectMode('device')} aria-pressed={mode === 'device'}>
              <HardDrive /><span><strong>{L("放在电脑本地")}</strong><small>{L("Ollama 或官方权重下载，支持 1M—2.8T")}</small></span><Check />
            </button>
            <button type="button" className={`ai-placement-card${mode === 'browser' ? ' is-selected' : ''}`} onClick={() => selectMode('browser')} aria-pressed={mode === 'browser'}>
              <Globe2 /><span><strong>{L("放在浏览器")}</strong><small>{L("无需安装，模型保存在浏览器缓存")}</small></span><Check />
            </button>
          </div>
        </section>

        {mode === 'cloud' ? (
          <section className="ai-setup-card" data-motion-reveal>
            <div className="ai-step-heading"><span>2</span><div><h2>{L("选择云端服务")}</h2><p>{L("选择后只需填写密钥。")}</p></div></div>
            <div className="ai-provider-grid">
              {CLOUD_PROVIDERS.map((item) => {
                const Icon = item.icon;
                const selected = item.id === cloudPresetId;
                const en = CLOUD_PROVIDER_EN[item.id];
                const name = _en && en?.name ? en.name : item.name;
                const description = _en && en?.description ? en.description : item.description;
                return (
                  <button type="button" className={`ai-provider-card${selected ? ' is-selected' : ''}`} aria-pressed={selected} key={item.id} onClick={() => chooseCloudProvider(item)}>
                    <span className="ai-provider-icon"><Icon /></span>
                    <span><strong>{name}</strong><small>{description}</small></span>
                    <Check className="ai-provider-check" />
                  </button>
                );
              })}
            </div>
            <div className="ai-primary-fields ai-cloud-fields">
              <label className="ai-field">
                <span>API Key <small>{config.apiKey ? (_en ? `Saved ${maskSecret(config.apiKey)}` : `已保存 ${maskSecret(config.apiKey)}`) : (_en ? 'Required' : '必填')}</small></span>
                <div className="ai-secret-input"><KeyRound /><input type="password" value={apiKeyDraft} onChange={(event) => { setApiKeyDraft(event.target.value); setNotice(null); }} placeholder={config.apiKey ? (_en ? 'Leave blank to keep the saved key' : '留空则继续使用已保存的密钥') : (_en ? 'Paste your API Key' : '粘贴你的 API Key')} autoComplete="new-password" /></div>
              </label>
              <label className="ai-field">
                <span>{L("模型")}</span>
                {cloudPreset.models.length ? (
                  <div className="ai-model-picker">
                    <select
                      value={isCustomCloudModel ? CUSTOM_MODEL_VALUE : config.model}
                      onChange={(event) => update('model', event.target.value === CUSTOM_MODEL_VALUE ? '' : event.target.value)}
                    >
                      {cloudPreset.models.map((model) => <option key={model}>{model}</option>)}
                      <option value={CUSTOM_MODEL_VALUE}>{L("手动填写模型…")}</option>
                    </select>
                    {isCustomCloudModel && <input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder={L("例如：deepseek-v4-pro")} aria-label={L("自定义模型名称")} />}
                  </div>
                ) : <input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder={L("手动填写模型名称")} />}
              </label>
            </div>
            {cloudPresetId === 'custom' && <div className="ai-custom-fields"><label className="ai-field"><span>{L("服务名称")}</span><input value={config.providerLabel} onChange={(event) => update('providerLabel', event.target.value)} /></label><label className="ai-field"><span>{L("API 地址")}</span><input value={config.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} placeholder="https://api.example.com/v1" /></label></div>}
            {cloudModelNotice && <div className="ai-capability-note is-warning ai-cloud-model-note"><CircleAlert /><span><strong>{L("这是云端模型标识。")}</strong> {cloudModelNotice}</span></div>}
          </section>
        ) : (
          <>
            <section className="ai-setup-card" data-motion-reveal>
              <div className="ai-step-heading">
                <span>2</span>
                <div><h2>{L("选择模型尺寸")}</h2><p>{L("完整覆盖 1M 到 2.8T；默认已按这台设备推荐。")}</p></div>
                <div className="ai-device-memory"><MemoryStick /><span>{L("检测到")}<strong>{memoryGb ? (_en ? `~ ${memoryGb} GB` : `约 ${memoryGb} GB`) : (_en ? 'Unknown memory' : '未知内存')}</strong></span></div>
              </div>
              <div className="ai-scale-legend"><span>{L("微型")}</span><span>{L("个人设备")}</span><span>{L("工作站")}</span><span>{L("服务器")}</span><span>{L("集群")}</span></div>
              <div className="ai-size-grid" role="list" aria-label={L("模型参数规模")}>
                {LOCAL_MODEL_TIERS.map((tier) => {
                  const unavailable = mode === 'browser' && !tier.browserModel;
                  return (
                    <button
                      type="button"
                      key={tier.id}
                      className={`${tier.id === selectedTierId ? 'is-selected' : ''}${tier.id === recommended.id ? ' is-recommended' : ''}`}
                      onClick={() => chooseTier(tier)}
                      title={unavailable ? (_en ? 'This size is not suitable for running in the browser; choose computer-local mode' : '该尺寸不适合在浏览器中运行，请选择电脑本地模式') : tier.hardware}
                    >
                      <strong>{tier.label}</strong>
                      {tier.id === recommended.id && <small>{L("推荐")}</small>}
                    </button>
                  );
                })}
              </div>
              <div className="ai-tier-detail">
                <div><Cpu /><span><small>{L("已选尺寸")}</small><strong>{selectedTier.label}</strong></span></div>
                <div><MemoryStick /><span><small>{L("权重/量化内存估算")}</small><strong>{selectedTier.quantizedMemory}</strong></span></div>
                <div><Monitor /><span><small>{L("建议设备")}</small><strong>{selectedTier.hardware}</strong></span></div>
                <p>{selectedTier.description}</p>
              </div>
              {mode === 'browser' && <div className={`ai-capability-note ${webGpuReady ? 'is-ready' : 'is-warning'}`}>{webGpuReady ? <CheckCircle2 /> : <CircleAlert />}<span><strong>{webGpuReady ? (_en ? 'This browser supports WebGPU' : '当前浏览器支持 WebGPU') : (_en ? 'This browser has no usable WebGPU' : '当前浏览器没有可用的 WebGPU')}</strong>{webGpuReady
                ? (_en ? ' The model will download to the browser cache and can be used offline afterwards.' : ' 模型会下载到浏览器缓存，之后可离线使用。')
                : (_en ? ' Please use the latest Chrome/Edge, or switch to "On this computer".' : ' 请使用最新版 Chrome/Edge，或改用“电脑本地”。')}</span></div>}
              {mode === 'device' && selectedTier.parameters >= 7e10 && <div className="ai-capability-note is-warning"><CircleAlert /><span><strong>{L("这不是普通电脑能轻松运行的尺寸。")}</strong> {L("页面允许配置到 2.8T，但 70B 以上通常需要专业工作站、多 GPU 或分布式集群。")}</span></div>}
            </section>

            <section className="ai-setup-card" data-motion-reveal>
              <div className="ai-step-heading"><span>3</span><div><h2>{mode === 'browser' ? (_en ? 'Download to the browser' : '下载到浏览器') : (_en ? 'Connect the AI on this computer' : '连接电脑上的 AI')}</h2><p>{mode === 'browser' ? (_en ? 'After the first download, the model weights stay in this browser.' : '首次下载后，模型权重会留在当前浏览器。') : (_en ? 'Follow the three steps below to finish local setup.' : '按照下面三步即可完成本地部署。')}</p></div></div>
              {mode === 'device' ? (
                <>
                  <div className="ai-runtime-grid">
                    <button type="button" className={runtime === 'ollama' ? 'is-selected' : ''} onClick={() => chooseRuntime('ollama')}><Terminal /><span><strong>Ollama</strong><small>{L("最简单，推荐")}</small></span></button>
                    <button type="button" className={runtime === 'lmstudio' ? 'is-selected' : ''} onClick={() => chooseRuntime('lmstudio')}><Laptop /><span><strong>LM Studio</strong><small>{L("图形界面")}</small></span></button>
                    <button type="button" className={runtime === 'custom' ? 'is-selected' : ''} onClick={() => chooseRuntime('custom')}><Server /><span><strong>{L("其他本地服务")}</strong><small>{L("OpenAI 兼容接口")}</small></span></button>
                  </div>
                  <ol className="ai-deploy-steps">
                    <li><span>1</span><div><strong>{L("安装运行器")}</strong><p>{runtime === 'ollama'
                      ? (_en ? 'Download and install Ollama.' : '下载安装 Ollama。')
                      : runtime === 'lmstudio'
                        ? (_en ? 'Download and install LM Studio, then start the service in Local Server.' : '下载安装 LM Studio，并在 Local Server 中启动服务。')
                        : (_en ? 'Start your local inference service and open its OpenAI-compatible endpoint.' : '启动你的本地推理服务并打开 OpenAI 兼容接口。')}</p>{runtime !== 'custom' && <a href={runtime === 'ollama' ? 'https://ollama.com/download' : 'https://lmstudio.ai/'} target="_blank" rel="noreferrer">{L("打开官方下载页 ")}<ExternalLink /></a>}</div></li>
                    <li>
                      <span>2</span>
                      <div>
                        <strong>{runtime === 'ollama' ? (_en ? 'Download model' : '下载模型') : (_en ? 'Load model' : '加载模型')}</strong>
                        <div className={`ai-model-download is-${selectedTier.download.kind}`}>
                          <div className="ai-model-download-heading">
                            <span className="ai-model-download-kind">{selectedTier.download.kind === 'ollama' ? (_en ? 'Ollama local package' : 'Ollama 本地包') : (_en ? 'Official Hugging Face weights' : 'Hugging Face 官方权重')}</span>
                            <a href={selectedTier.download.sourceUrl} target="_blank" rel="noreferrer">{L("官方来源 ")}<ExternalLink /></a>
                          </div>
                          {(runtime === 'ollama' || selectedTier.download.kind === 'huggingface') && <button type="button" className="ai-command" onClick={() => void copyCommand()}><code>{selectedTier.download.command}</code><Copy /></button>}
                          {runtime === 'ollama' && selectedTier.download.kind === 'huggingface' && <div className="ai-capability-note is-warning"><CircleAlert /><span><strong>{L("Ollama 没有这个本地模型包。")}</strong> {L("不要对这个模型名使用 Ollama 命令；上面只下载真实原始权重，下载后需要支持它的推理工具。")}</span></div>}
                          {runtime !== 'ollama' && selectedTier.download.kind === 'ollama' && <p>{L("当前运行器不是 Ollama，请在它的模型管理界面中加载对应模型；Ollama 命令只适用于 Ollama。")}</p>}
                          <p>{selectedTier.download.note}</p>
                        </div>
                      </div>
                    </li>
                    <li><span>3</span><div><strong>{L("测试连接")}</strong><p>{L("保持本地服务运行，再点击页面底部的“保存并测试”。")}</p></div></li>
                  </ol>
                  <div className="ai-primary-fields">
                    <label className="ai-field"><span>{L("本地 API 地址")}</span><input value={config.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} placeholder="http://localhost:11434/v1" /></label>
                    <label className="ai-field"><span>{L("模型名称")}</span><input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder={L("例如：qwen2.5:7b")} /></label>
                  </div>
                </>
              ) : (
                <div className={`ai-browser-install${selectedTier.browserModel ? '' : ' is-model-unavailable'}`}>
                  {!selectedTier.browserModel && <div className="ai-capability-note is-warning"><CircleAlert /><span><strong>{L("此尺寸可以选择")}</strong> {L("浏览器暂时没有对应权重，请切换到“电脑本地”模式运行。")}</span></div>}
                  <div className="ai-browser-model"><Globe2 /><div><small>{L("将下载到当前浏览器")}</small><strong>{selectedTier.label} · {selectedTier.browserModel ?? (_en ? 'No built-in browser weights' : '暂无内置浏览器权重')}</strong><span>{selectedTier.browserModel
                    ? (_en ? `${selectedTier.browserDownload} · no API key · chats stay on-device` : `${selectedTier.browserDownload} · 无需 API Key · 对话不离开设备`)
                    : (_en ? 'Switch to "On this computer" mode to run this size.' : '请切换到“电脑本地”模式运行这个尺寸。')}</span></div></div>
                  <div className="ai-browser-facts"><span><Check />{L("刷新页面后仍可使用")}</span><span><Check />{L("模型由浏览器网站数据管理")}</span><span><Check />{L("首次下载需要网络")}</span></div>
                  {downloadProgress !== null && <div className="ai-download-progress"><div><span style={{ width: `${downloadProgress}%` }} /></div><p><strong>{downloadProgress}%</strong>{downloadText || (_en ? 'Preparing model files…' : '正在准备模型文件…')}</p></div>}
                </div>
              )}
            </section>
          </>
        )}

        <details className="ai-setup-card ai-advanced" data-motion-reveal>
          <summary><SlidersHorizontal />{L("高级生成设置 ")}<small>{L("大多数人不需要修改")}</small><ChevronDown /></summary>
          <div className="ai-advanced-body">
            <div className="ai-tone-field"><span>{L("回答风格")}</span><div className="ai-tone-options">{(_en ? TONES_EN : TONES).map((tone) => <button type="button" className={findTone(config.temperature) === tone.id ? 'is-selected' : ''} onClick={() => update('temperature', tone.temperature)} key={tone.id}><strong>{tone.name}</strong><small>{tone.description}</small></button>)}</div></div>
            <div className="ai-advanced-grid">
              <label className="ai-field"><span>{L("最大输出长度")}</span><input type="number" min="128" max="32768" value={config.maxTokens} onChange={(event) => update('maxTokens', Math.round(numberValue(event.target.value, config.maxTokens)))} /></label>
              <label className="ai-field"><span>{L("超时时间（秒）")}</span><input type="number" min="5" max="300" value={Math.round(config.timeoutMs / 1000)} onChange={(event) => update('timeoutMs', Math.round(numberValue(event.target.value, config.timeoutMs / 1000) * 1000))} /></label>
            </div>
            <label className="ai-switch-row"><span><strong>{L("流式显示回答")}</strong><small>{L("像打字一样逐字出现")}</small></span><input type="checkbox" checked={config.stream} onChange={(event) => update('stream', event.target.checked)} /></label>
            <label className="ai-switch-row"><span><strong>{L("语义检索（向量）")}</strong><small>{L("用词义相近而不仅是关键词匹配站内资料；首次使用会把知识库嵌入一次并缓存在本机。")}</small></span><input type="checkbox" checked={config.semanticSearch} onChange={(event) => update('semanticSearch', event.target.checked)} /></label>
            {config.semanticSearch && (
              <>
                <div className="ai-advanced-grid">
                  <label className="ai-field"><span>{L("嵌入模型")}</span><input value={config.embeddingModel} onChange={(event) => update('embeddingModel', event.target.value)} placeholder={L("例如：text-embedding-3-small")} /></label>
                  <label className="ai-field"><span>{L("嵌入服务地址（可选）")}</span><input value={config.embeddingBaseUrl} onChange={(event) => update('embeddingBaseUrl', event.target.value)} placeholder={L("留空则复用上面的 API 地址")} /></label>
                </div>
                <p className="ai-draft-status"><ShieldCheck />{L("语义检索复用对话服务的 API Key，不会单独保存。")}</p>
              </>
            )}
          </div>
        </details>

        {notice && <div className={`ai-inline-notice is-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'} aria-live="polite">{testing ? <LoaderCircle className="is-spinning" data-motion-loop /> : notice.kind === 'success' ? <CheckCircle2 /> : <ShieldCheck />}<span>{notice.text}</span>{notice.kind === 'error' && !testing && <button type="button" data-action="retry" onClick={() => void saveAndTest()}><RotateCcw />{L("重试")}</button>}</div>}

        {draftSaved && <p className="ai-draft-status"><Save />{L("表单草稿已保存在本机（不包含 API Key）")}</p>}

        <div className="ai-main-actions">
          <button type="button" className="ai-button ai-button-secondary" onClick={saveOnly} disabled={testing || !hasUsableKey}><Save />{L("仅保存")}</button>
          <button type="button" className="ai-button ai-button-primary" data-motion-ripple="true" onClick={() => void saveAndTest()} disabled={testing || !hasUsableKey || (mode === 'browser' && !webGpuReady) || ollamaModelSelectionNeedsAttention}>{testing ? <LoaderCircle className="is-spinning" data-motion-loop /> : mode === 'browser' ? <Download /> : <Zap />}{testing ? (mode === 'browser' ? (_en ? 'Downloading & loading…' : '正在下载并加载…') : (_en ? 'Connecting…' : '正在连接…')) : mode === 'browser' ? (_en ? 'Download model & enable' : '下载模型并启用') : (_en ? 'Save & test connection' : '保存并测试连接')}</button>
          {testing && <button type="button" className="ai-button ai-button-danger" onClick={() => testAbortRef.current?.abort()}><Square />{L("取消连接")}</button>}
        </div>

        <div className="ai-privacy-note"><ShieldCheck /><span><strong>{mode === 'cloud' ? (_en ? 'Keys are stored only on this device' : '密钥仅存储在这台设备上') : (_en ? 'Local mode does not send chats to cloud model providers' : '本地模式不会把对话发送给云端模型服务商')}</strong>{L("，配置导出中也不会包含密钥。")}</span><Link to="/chat">{L("前往 AI 对话 ")}<ExternalLink /></Link></div>

        <section className="ai-transfer">
          <button type="button" className="ai-transfer-toggle" onClick={() => setShowTransfer((current) => !current)} aria-expanded={showTransfer}><span><Clipboard />{L("配置迁移与清除")}</span><ChevronDown className={showTransfer ? 'is-open' : ''} /></button>
          {showTransfer && <div className="ai-transfer-body"><p>{L("可复制或导入不含密钥的配置，适合在不同设备间迁移。")}</p><div className="ai-settings-actions"><button type="button" className="ai-button ai-button-secondary" onClick={() => void exportConfig()}><Clipboard />{L("复制配置")}</button><button type="button" className="ai-button ai-button-danger" onClick={clear}><Trash2 />{L("清除本机设置")}</button><button type="button" className="ai-button ai-button-secondary" onClick={() => setImportText('')}><RotateCcw />{L("清空文本")}</button></div><textarea className="ai-import-box" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={_en ? 'Paste the config JSON here' : '在这里粘贴配置 JSON'} rows={6} /><button type="button" className="ai-button ai-button-secondary" onClick={importConfig} disabled={!importText.trim()}>{L("载入配置")}</button></div>}
        </section>

        <section className="ai-setup-card" data-motion-reveal>
          <div className="ai-step-heading"><span><Cloud /></span><div><h2>{L("云端同步")}</h2><p>{L("把对话和配置（不含 API Key）加密后保存到同步服务，多台设备用同一个同步密钥共享。")}</p></div></div>
          <div className="ai-primary-fields ai-cloud-fields">
            <label className="ai-field">
              <span>{L("同步地址")}</span>
              <input value={syncConfig.baseUrl} onChange={(event) => { setSyncConfig((current) => ({ ...current, baseUrl: event.target.value })); setNotice(null); }} placeholder="https://nyaumae-sync.example.workers.dev" />
            </label>
            <label className="ai-field">
              <span>{L("同步密钥")} <small>{syncConfig.syncKey ? (_en ? `Saved ${maskSecret(syncConfig.syncKey)}` : `已保存 ${maskSecret(syncConfig.syncKey)}`) : L("至少 8 位；忘记密钥无法找回云端数据")}</small></span>
              <div className="ai-secret-input"><KeyRound /><input type="password" value={syncKeyDraft} onChange={(event) => { setSyncKeyDraft(event.target.value); setNotice(null); }} placeholder={syncConfig.syncKey ? (_en ? 'Leave blank to keep the saved key' : '留空则继续使用已保存的密钥') : L("同步密钥")} autoComplete="new-password" /></div>
            </label>
          </div>
          <label className="ai-switch-row"><span><strong>{L("启用云端同步")}</strong><small>{L("所有数据在浏览器内加密后才上传，服务端只存密文；API Key 永不上传。")}</small></span><input type="checkbox" checked={syncConfig.enabled} onChange={(event) => setSyncConfig((current) => ({ ...current, enabled: event.target.checked }))} /></label>
          <div className="ai-settings-actions">
            <button type="button" className="ai-button ai-button-secondary" onClick={() => void saveSync()} disabled={syncBusy}><Save />{L("保存同步设置")}</button>
            <button type="button" className="ai-button ai-button-secondary" onClick={() => void runSyncNow()} disabled={syncBusy || !syncConfig.enabled}>{syncBusy ? <LoaderCircle className="is-spinning" data-motion-loop /> : <RotateCcw />}{L("立即同步")}</button>
          </div>
          <p className="ai-draft-status">
            <ShieldCheck />
            {syncStatus.state === 'disabled' && L("未启用")}
            {syncStatus.state === 'syncing' && L("同步中…")}
            {syncStatus.state === 'idle' && `${L("上次同步")}：${syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : '—'}`}
            {syncStatus.state === 'error' && `${L("同步出错")}：${syncStatus.message}`}
          </p>
        </section>

        <section className="ai-setup-card" data-motion-reveal>
          <div className="ai-step-heading"><span><Images /></span><div><h2>{L("图片显示")}</h2><p>{_en ? 'How site images are loaded.' : '控制站点图片的加载方式。'}</p></div></div>
          <label className="ai-switch-row">
            <span>
              <strong>{L("展示原始图片")}</strong>
              <small>{_en
                ? 'Show the untouched original files everywhere instead of the auto-optimized AVIF/WebP variants. Full detail, but slower to load and uses more data.'
                : '全站图片改用未经压缩优化的原始文件，细节最完整，但加载更慢、更耗流量；关闭则使用自动优化的 AVIF/WebP 变体。'}</small>
            </span>
            <input type="checkbox" checked={showOriginalImages} onChange={(event) => setShowOriginalImages(event.target.checked)} />
          </label>
        </section>
      </div>
    </div>
  );
}
