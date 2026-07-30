import { useMemo, useState } from 'react';
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
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router';
import { conversationRepository } from '@/conversation/storage';
import type { AiConfig } from '@/conversation/types';
import { exportSafeAiConfig, maskSecret, sanitizeImportedConfig, validateAiConfig } from '@/conversation/privacy';
import { browserSupportsLocalAI, prepareBrowserModel, testModelConnection } from '@/conversation/modelAdapters';
import {
  findModelTier,
  LOCAL_MODEL_TIERS,
  recommendedTier,
  type LocalModelTier,
} from '@/conversation/localModelCatalog';
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
  { id: 'openai', name: 'OpenAI', description: 'GPT-5 系列 API', providerLabel: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-5.4', models: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex', 'gpt-5-pro', 'gpt-5-mini'], icon: Sparkles },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 5 系列 API', providerLabel: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-opus-5', models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-5', 'claude-opus-4-1'], icon: Bot },
  { id: 'google', name: 'Google AI', description: 'Gemini 3 系列 API', providerLabel: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.0-pro', models: ['gemini-3.0-pro', 'gemini-3.0-flash', 'gemini-3.0-ultra', 'gemini-2.5-pro'], icon: Globe2 },
  { id: 'deepseek', name: 'DeepSeek', description: 'V4 新一代推理模型', providerLabel: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-v4-pro', models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-r1', 'deepseek-chat'], icon: Zap },
  { id: 'moonshot', name: 'Kimi / Moonshot AI', description: 'Kimi 新一代模型 API', providerLabel: 'Kimi / Moonshot AI', baseUrl: 'https://api.moonshot.cn/v1', model: 'kimi-k3', models: ['kimi-k3', 'kimi-k2.6', 'kimi-k2.5', 'kimi-k2', 'moonshot-v1-128k'], icon: Bot },
  { id: 'zai', name: 'Z.ai', description: 'GLM 新一代 API', providerLabel: 'Z.ai', baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-7', models: ['glm-7', 'glm-7-flash', 'glm-7-vision', 'glm-6'], icon: Sparkles },
  { id: 'qwen', name: 'Qwen / 通义千问', description: 'Qwen 6 系列兼容接口', providerLabel: 'Qwen / 通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen6-max', models: ['qwen6-max', 'qwen6-plus', 'qwen6-turbo', 'qwen6-vl', 'qwen6-coder', 'qwen6-math', 'qwen6-omni'], icon: Cpu },
  { id: 'minimax', name: 'MiniMax', description: 'MiniMax API', providerLabel: 'MiniMax', baseUrl: 'https://api.minimax.io/v1', model: 'MiniMax-M2.5', models: ['MiniMax-M2.5', 'MiniMax-M2', 'MiniMax-01'], icon: Server },
  { id: 'mistral', name: 'Mistral AI', description: 'Mistral 新一代 API', providerLabel: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-large-latest', models: ['mistral-large-latest', 'magistral-medium-latest', 'codestral-latest', 'devstral-latest'], icon: Cloud },
  { id: 'xai', name: 'xAI', description: 'Grok API', providerLabel: 'xAI', baseUrl: 'https://api.x.ai/v1', model: 'grok-4', models: ['grok-4', 'grok-4-fast', 'grok-3-mini'], icon: Zap },
  { id: 'siliconflow', name: '硅基流动', description: '多种新一代开源模型', providerLabel: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V4-Pro', models: ['deepseek-ai/DeepSeek-V4-Pro', 'deepseek-ai/DeepSeek-V4-Flash', 'deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen3-235B-A22B', 'moonshotai/Kimi-K2.5'], icon: Server },
  { id: 'openrouter', name: 'OpenRouter', description: '统一聚合最新模型', providerLabel: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-v4-pro', models: ['deepseek/deepseek-v4-pro', 'openai/gpt-5.4', 'anthropic/claude-opus-5', 'google/gemini-3.0-pro', 'moonshotai/kimi-k2.5', 'z-ai/glm-7'], icon: Cloud },
  { id: 'custom', name: '自定义连接', description: '手动填写服务与模型', providerLabel: 'OpenAI-compatible', baseUrl: '', model: '', models: [], icon: SlidersHorizontal },
]; 

const TONES: Array<{ id: ToneId; name: string; description: string; temperature: number }> = [
  { id: 'precise', name: '严谨', description: '回答稳定直接', temperature: 0.25 },
  { id: 'balanced', name: '平衡', description: '适合多数对话', temperature: 0.7 },
  { id: 'creative', name: '创意', description: '表达更多样', temperature: 1.15 },
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
  const initialConfig = useMemo(() => conversationRepository.getAiConfig(), []);
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

  const cloudPreset = CLOUD_PROVIDERS.find((item) => item.id === cloudPresetId) ?? CLOUD_PROVIDERS.find((item) => item.id === 'custom')!;
  const selectedTier = LOCAL_MODEL_TIERS.find((tier) => tier.id === selectedTierId) ?? LOCAL_MODEL_TIERS.find((tier) => tier.id === '1_7b')!;
  const recommended = recommendedTier(memoryGb, mode === 'browser' ? 'browser' : 'device');
  const webGpuReady = useMemo(() => browserSupportsLocalAI(), []);
  const hasUsableKey = mode !== 'cloud' || Boolean(apiKeyDraft.trim() || config.apiKey);
  const isCustomCloudModel = cloudPreset.models.length === 0 || !cloudPreset.models.includes(config.model);

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
        providerLabel: '浏览器 WebGPU',
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
        : { providerLabel: '本地 OpenAI 兼容服务', baseUrl: '' };
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
      setNotice({ kind: 'info', text: `${tier.label} 已选择。浏览器暂时没有这个尺寸的内置权重，请切换到“电脑本地”模式运行。` });
    }
  };

  const buildNextConfig = (): AiConfig => ({
    ...config,
    enabled: true,
    apiKey: mode === 'cloud' ? (apiKeyDraft.trim() || config.apiKey) : undefined,
    updatedAt: new Date().toISOString(),
  });

  const saveOnly = () => {
    const next = buildNextConfig();
    const errors = validateAiConfig(next);
    if (errors.length) {
      setNotice({ kind: 'error', text: errors.join(' ') });
      return;
    }
    if (mode === 'browser' && !selectedTier.browserModel) {
      setNotice({ kind: 'error', text: '当前选择的尺寸没有可供浏览器加载的内置权重，请切换到“电脑本地”模式后再保存。' });
      return;
    }
    const saved = conversationRepository.saveAiConfig(next);
    setConfig(saved);
    setApiKeyDraft('');
    setNotice({ kind: 'success', text: '设置已保存，可以开始对话了。' });
  };

  const saveAndTest = async () => {
    const next = buildNextConfig();
    const errors = validateAiConfig(next);
    if (errors.length) {
      setNotice({ kind: 'error', text: errors.join(' ') });
      return;
    }
    if (mode === 'browser' && !selectedTier.browserModel) {
      setNotice({ kind: 'error', text: '当前选择的尺寸没有可供浏览器加载的内置权重，请切换到“电脑本地”模式后再保存并测试。' });
      return;
    }
    setTesting(true);
    setNotice({ kind: 'info', text: mode === 'browser' ? '正在准备浏览器本地模型…' : '正在连接模型…' });
    try {
      if (mode === 'browser') {
        setDownloadProgress(0);
        await prepareBrowserModel(next.model, (progress, text) => {
          setDownloadProgress(progress);
          setDownloadText(text);
        });
      }
      await testModelConnection(next);
      const saved = conversationRepository.saveAiConfig(next);
      setConfig(saved);
      setApiKeyDraft('');
      setDownloadProgress(mode === 'browser' ? 100 : null);
      setNotice({ kind: 'success', text: mode === 'browser' ? '模型已保存在浏览器缓存中，可以离线对话。' : '连接成功，设置已经保存。' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : '连接失败，请检查填写内容后重试。' });
    } finally {
      setTesting(false);
    }
  };

  const copyCommand = async () => {
    const model = selectedTier.ollamaModel ?? config.model;
    await navigator.clipboard?.writeText(`ollama pull ${model}`);
    setNotice({ kind: 'success', text: '安装命令已复制。' });
  };

  const clear = () => {
    conversationRepository.clearAiConfig();
    const fresh = conversationRepository.getAiConfig();
    setConfig(fresh);
    setMode('cloud');
    setCloudPresetId(findCloudPreset(fresh).id);
    setApiKeyDraft('');
    setNotice({ kind: 'info', text: '这台设备上的 AI 设置已清除。浏览器模型缓存可在浏览器的网站数据中清除。' });
  };

  const exportConfig = async () => {
    const safe = JSON.stringify(exportSafeAiConfig(buildNextConfig()), null, 2);
    try {
      await navigator.clipboard.writeText(safe);
      setNotice({ kind: 'success', text: '配置已复制，内容不包含 API Key。' });
    } catch {
      setImportText(safe);
      setNotice({ kind: 'info', text: '配置已放入下方文本框，可手动复制。' });
    }
  };

  const importConfig = () => {
    try {
      const next = sanitizeImportedConfig(JSON.parse(importText) as unknown, config);
      setConfig(next);
      setMode(initialMode(next));
      setCloudPresetId(findCloudPreset(next).id);
      setRuntime(runtimeFromConfig(next));
      setSelectedTierId(findModelTier(next.model)?.id ?? selectedTierId);
      setNotice({ kind: 'success', text: '配置已载入。确认无误后，请点击“仅保存”。' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : '无法识别这份配置。' });
    }
  };

  return (
    <main className="ai-settings-page aurora-ui">
      <div className="aurora-container ai-settings-inner">
        <header className="ai-settings-hero">
          <div>
            <p className="aurora-eyebrow">AI SETUP / 1M — 2.8T</p>
            <h1 className="aurora-title">选择你的 AI</h1>
            <p className="aurora-lead">云端、电脑本地或浏览器内运行，一步一步完成。</p>
          </div>
          {config.enabled && (
            <div className="ai-current-status">
              <span><CheckCircle2 />已启用</span>
              <strong>{config.providerLabel || 'AI 服务'}</strong>
              <small>{config.model}</small>
            </div>
          )}
        </header>

        <section className="ai-setup-card">
          <div className="ai-step-heading"><span>1</span><div><h2>AI 放在哪里运行？</h2><p>本地模式不会把对话发送给云端模型服务商。</p></div></div>
          <div className="ai-placement-grid">
            <button type="button" className={`ai-placement-card${mode === 'cloud' ? ' is-selected' : ''}`} onClick={() => selectMode('cloud')} aria-pressed={mode === 'cloud'}>
              <Cloud /><span><strong>云端 API</strong><small>最省设备空间，需 API Key</small></span><Check />
            </button>
            <button type="button" className={`ai-placement-card${mode === 'device' ? ' is-selected' : ''}`} onClick={() => selectMode('device')} aria-pressed={mode === 'device'}>
              <HardDrive /><span><strong>放在电脑本地</strong><small>Ollama / LM Studio，支持 1M—2.8T</small></span><Check />
            </button>
            <button type="button" className={`ai-placement-card${mode === 'browser' ? ' is-selected' : ''}`} onClick={() => selectMode('browser')} aria-pressed={mode === 'browser'}>
              <Globe2 /><span><strong>放在浏览器</strong><small>无需安装，模型保存在浏览器缓存</small></span><Check />
            </button>
          </div>
        </section>

        {mode === 'cloud' ? (
          <section className="ai-setup-card">
            <div className="ai-step-heading"><span>2</span><div><h2>选择云端服务</h2><p>选择后只需填写密钥。</p></div></div>
            <div className="ai-provider-grid">
              {CLOUD_PROVIDERS.map((item) => {
                const Icon = item.icon;
                const selected = item.id === cloudPresetId;
                return (
                  <button type="button" className={`ai-provider-card${selected ? ' is-selected' : ''}`} aria-pressed={selected} key={item.id} onClick={() => chooseCloudProvider(item)}>
                    <span className="ai-provider-icon"><Icon /></span>
                    <span><strong>{item.name}</strong><small>{item.description}</small></span>
                    <Check className="ai-provider-check" />
                  </button>
                );
              })}
            </div>
            <div className="ai-primary-fields ai-cloud-fields">
              <label className="ai-field">
                <span>API Key <small>{config.apiKey ? `已保存 ${maskSecret(config.apiKey)}` : '必填'}</small></span>
                <div className="ai-secret-input"><KeyRound /><input type="password" value={apiKeyDraft} onChange={(event) => { setApiKeyDraft(event.target.value); setNotice(null); }} placeholder={config.apiKey ? '留空则继续使用已保存的密钥' : '粘贴你的 API Key'} autoComplete="new-password" /></div>
              </label>
              <label className="ai-field">
                <span>模型</span>
                {cloudPreset.models.length ? (
                  <div className="ai-model-picker">
                    <select
                      value={isCustomCloudModel ? CUSTOM_MODEL_VALUE : config.model}
                      onChange={(event) => update('model', event.target.value === CUSTOM_MODEL_VALUE ? '' : event.target.value)}
                    >
                      {cloudPreset.models.map((model) => <option key={model}>{model}</option>)}
                      <option value={CUSTOM_MODEL_VALUE}>手动填写模型…</option>
                    </select>
                    {isCustomCloudModel && <input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder="例如：deepseek-v4-pro" aria-label="自定义模型名称" />}
                  </div>
                ) : <input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder="手动填写模型名称" />}
              </label>
            </div>
            {cloudPresetId === 'custom' && <div className="ai-custom-fields"><label className="ai-field"><span>服务名称</span><input value={config.providerLabel} onChange={(event) => update('providerLabel', event.target.value)} /></label><label className="ai-field"><span>API 地址</span><input value={config.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} placeholder="https://api.example.com/v1" /></label></div>}
          </section>
        ) : (
          <>
            <section className="ai-setup-card">
              <div className="ai-step-heading">
                <span>2</span>
                <div><h2>选择模型尺寸</h2><p>完整覆盖 1M 到 2.8T；默认已按这台设备推荐。</p></div>
                <div className="ai-device-memory"><MemoryStick /><span>检测到<strong>{memoryGb ? `约 ${memoryGb} GB` : '未知内存'}</strong></span></div>
              </div>
              <div className="ai-scale-legend"><span>微型</span><span>个人设备</span><span>工作站</span><span>服务器</span><span>集群</span></div>
              <div className="ai-size-grid" role="list" aria-label="模型参数规模">
                {LOCAL_MODEL_TIERS.map((tier) => {
                  const unavailable = mode === 'browser' && !tier.browserModel;
                  return (
                    <button
                      type="button"
                      key={tier.id}
                      className={`${tier.id === selectedTierId ? 'is-selected' : ''}${tier.id === recommended.id ? ' is-recommended' : ''}`}
                      onClick={() => chooseTier(tier)}
                      title={unavailable ? '该尺寸不适合在浏览器中运行，请选择电脑本地模式' : tier.hardware}
                    >
                      <strong>{tier.label}</strong>
                      {tier.id === recommended.id && <small>推荐</small>}
                    </button>
                  );
                })}
              </div>
              <div className="ai-tier-detail">
                <div><Cpu /><span><small>已选尺寸</small><strong>{selectedTier.label}</strong></span></div>
                <div><MemoryStick /><span><small>4-bit 约需</small><strong>{selectedTier.quantizedMemory}</strong></span></div>
                <div><Monitor /><span><small>建议设备</small><strong>{selectedTier.hardware}</strong></span></div>
                <p>{selectedTier.description}</p>
              </div>
              {mode === 'browser' && <div className={`ai-capability-note ${webGpuReady ? 'is-ready' : 'is-warning'}`}>{webGpuReady ? <CheckCircle2 /> : <CircleAlert />}<span><strong>{webGpuReady ? '当前浏览器支持 WebGPU' : '当前浏览器没有可用的 WebGPU'}</strong>{webGpuReady ? ' 模型会下载到浏览器缓存，之后可离线使用。' : ' 请使用最新版 Chrome/Edge，或改用“电脑本地”。'}</span></div>}
              {mode === 'device' && selectedTier.parameters >= 7e10 && <div className="ai-capability-note is-warning"><CircleAlert /><span><strong>这不是普通电脑能轻松运行的尺寸。</strong> 页面允许配置到 2.8T，但 70B 以上通常需要专业工作站、多 GPU 或分布式集群。</span></div>}
            </section>

            <section className="ai-setup-card">
              <div className="ai-step-heading"><span>3</span><div><h2>{mode === 'browser' ? '下载到浏览器' : '连接电脑上的 AI'}</h2><p>{mode === 'browser' ? '首次下载后，模型权重会留在当前浏览器。' : '按照下面三步即可完成本地部署。'}</p></div></div>
              {mode === 'device' ? (
                <>
                  <div className="ai-runtime-grid">
                    <button type="button" className={runtime === 'ollama' ? 'is-selected' : ''} onClick={() => chooseRuntime('ollama')}><Terminal /><span><strong>Ollama</strong><small>最简单，推荐</small></span></button>
                    <button type="button" className={runtime === 'lmstudio' ? 'is-selected' : ''} onClick={() => chooseRuntime('lmstudio')}><Laptop /><span><strong>LM Studio</strong><small>图形界面</small></span></button>
                    <button type="button" className={runtime === 'custom' ? 'is-selected' : ''} onClick={() => chooseRuntime('custom')}><Server /><span><strong>其他本地服务</strong><small>OpenAI 兼容接口</small></span></button>
                  </div>
                  <ol className="ai-deploy-steps">
                    <li><span>1</span><div><strong>安装运行器</strong><p>{runtime === 'ollama' ? '下载安装 Ollama。' : runtime === 'lmstudio' ? '下载安装 LM Studio，并在 Local Server 中启动服务。' : '启动你的本地推理服务并打开 OpenAI 兼容接口。'}</p>{runtime !== 'custom' && <a href={runtime === 'ollama' ? 'https://ollama.com/download' : 'https://lmstudio.ai/'} target="_blank" rel="noreferrer">打开官方下载页 <ExternalLink /></a>}</div></li>
                    <li><span>2</span><div><strong>{runtime === 'ollama' ? '下载模型' : '加载模型'}</strong>{runtime === 'ollama' && selectedTier.ollamaModel ? <button type="button" className="ai-command" onClick={() => void copyCommand()}><code>ollama pull {selectedTier.ollamaModel}</code><Copy /></button> : <p>{runtime === 'ollama' ? '这个尺寸没有预设模型，请在下方填写可用的 Ollama 模型名称。' : '在运行器里下载并加载对应尺寸的模型，然后填写它显示的模型名称。'}</p>}</div></li>
                    <li><span>3</span><div><strong>测试连接</strong><p>保持本地服务运行，再点击页面底部的“保存并测试”。</p></div></li>
                  </ol>
                  <div className="ai-primary-fields">
                    <label className="ai-field"><span>本地 API 地址</span><input value={config.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} placeholder="http://localhost:11434/v1" /></label>
                    <label className="ai-field"><span>模型名称</span><input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder="例如：qwen2.5:7b" /></label>
                  </div>
                </>
              ) : (
                <div className={`ai-browser-install${selectedTier.browserModel ? '' : ' is-model-unavailable'}`}>
                  {!selectedTier.browserModel && <div className="ai-capability-note is-warning"><CircleAlert /><span><strong>此尺寸可以选择</strong> 浏览器暂时没有对应权重，请切换到“电脑本地”模式运行。</span></div>}
                  <div className="ai-browser-model"><Globe2 /><div><small>将下载到当前浏览器</small><strong>{selectedTier.label} · {selectedTier.browserModel ?? '暂无内置浏览器权重'}</strong><span>{selectedTier.browserModel ? `${selectedTier.browserDownload} · 无需 API Key · 对话不离开设备` : '请切换到“电脑本地”模式运行这个尺寸。'}</span></div></div>
                  <div className="ai-browser-facts"><span><Check />刷新页面后仍可使用</span><span><Check />模型由浏览器网站数据管理</span><span><Check />首次下载需要网络</span></div>
                  {downloadProgress !== null && <div className="ai-download-progress"><div><span style={{ width: `${downloadProgress}%` }} /></div><p><strong>{downloadProgress}%</strong>{downloadText || '正在准备模型文件…'}</p></div>}
                </div>
              )}
            </section>
          </>
        )}

        <details className="ai-setup-card ai-advanced">
          <summary><SlidersHorizontal />高级生成设置 <small>大多数人不需要修改</small><ChevronDown /></summary>
          <div className="ai-advanced-body">
            <div className="ai-tone-field"><span>回答风格</span><div className="ai-tone-options">{TONES.map((tone) => <button type="button" className={findTone(config.temperature) === tone.id ? 'is-selected' : ''} onClick={() => update('temperature', tone.temperature)} key={tone.id}><strong>{tone.name}</strong><small>{tone.description}</small></button>)}</div></div>
            <div className="ai-advanced-grid">
              <label className="ai-field"><span>最大输出长度</span><input type="number" min="128" max="32768" value={config.maxTokens} onChange={(event) => update('maxTokens', Math.round(numberValue(event.target.value, config.maxTokens)))} /></label>
              <label className="ai-field"><span>超时时间（秒）</span><input type="number" min="5" max="300" value={Math.round(config.timeoutMs / 1000)} onChange={(event) => update('timeoutMs', Math.round(numberValue(event.target.value, config.timeoutMs / 1000) * 1000))} /></label>
            </div>
            <label className="ai-switch-row"><span><strong>流式显示回答</strong><small>像打字一样逐字出现</small></span><input type="checkbox" checked={config.stream} onChange={(event) => update('stream', event.target.checked)} /></label>
          </div>
        </details>

        {notice && <div className={`ai-inline-notice is-${notice.kind}`} role="status" aria-live="polite">{testing ? <LoaderCircle className="is-spinning" /> : notice.kind === 'success' ? <CheckCircle2 /> : <ShieldCheck />}<span>{notice.text}</span></div>}

        <div className="ai-main-actions">
          <button type="button" className="ai-button ai-button-secondary" onClick={saveOnly} disabled={testing || !hasUsableKey}><Save />仅保存</button>
          <button type="button" className="ai-button ai-button-primary" onClick={() => void saveAndTest()} disabled={testing || !hasUsableKey || (mode === 'browser' && !webGpuReady)}>{testing ? <LoaderCircle className="is-spinning" /> : mode === 'browser' ? <Download /> : <Zap />}{testing ? (mode === 'browser' ? '正在下载并加载…' : '正在连接…') : mode === 'browser' ? '下载模型并启用' : '保存并测试连接'}</button>
        </div>

        <div className="ai-privacy-note"><ShieldCheck /><span><strong>{mode === 'cloud' ? '密钥仅存储在这台设备上' : '本地模式不会把对话发送给云端模型服务商'}</strong>，配置导出中也不会包含密钥。</span><Link to="/chat">前往 AI 对话 <ExternalLink /></Link></div>

        <section className="ai-transfer">
          <button type="button" className="ai-transfer-toggle" onClick={() => setShowTransfer((current) => !current)} aria-expanded={showTransfer}><span><Clipboard />配置迁移与清除</span><ChevronDown className={showTransfer ? 'is-open' : ''} /></button>
          {showTransfer && <div className="ai-transfer-body"><p>可复制或导入不含密钥的配置，适合在不同设备间迁移。</p><div className="ai-settings-actions"><button type="button" className="ai-button ai-button-secondary" onClick={() => void exportConfig()}><Clipboard />复制配置</button><button type="button" className="ai-button ai-button-danger" onClick={clear}><Trash2 />清除本机设置</button><button type="button" className="ai-button ai-button-secondary" onClick={() => setImportText('')}><RotateCcw />清空文本</button></div><textarea className="ai-import-box" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="在这里粘贴配置 JSON" rows={6} /><button type="button" className="ai-button ai-button-secondary" onClick={importConfig} disabled={!importText.trim()}>载入配置</button></div>}
        </section>
      </div>
    </main>
  );
}
