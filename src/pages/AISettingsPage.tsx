import { useMemo, useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  ExternalLink,
  KeyRound,
  Laptop,
  LoaderCircle,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router';
import { conversationRepository } from '@/conversation/storage';
import type { AiConfig } from '@/conversation/types';
import { exportSafeAiConfig, maskSecret, sanitizeImportedConfig, validateAiConfig } from '@/conversation/privacy';
import { testModelConnection } from '@/conversation/modelAdapters';
import './AISettingsPage.css';

type Notice = { kind: 'success' | 'error' | 'info'; text: string } | null;
type PresetId = 'openai' | 'deepseek' | 'kimi' | 'siliconflow' | 'ollama' | 'custom';
type ToneId = 'precise' | 'balanced' | 'creative';

type ProviderPreset = {
  id: PresetId;
  name: string;
  description: string;
  provider: AiConfig['provider'];
  providerLabel: string;
  baseUrl: string;
  model: string;
  models: string[];
  needsKey: boolean;
  icon: typeof Bot;
};

const PROVIDERS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: '使用 OpenAI API',
    provider: 'openai-compatible',
    providerLabel: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    needsKey: true,
    icon: Sparkles,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '国内访问更方便',
    provider: 'openai-compatible',
    providerLabel: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    needsKey: true,
    icon: Zap,
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Moonshot API',
    provider: 'openai-compatible',
    providerLabel: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    needsKey: true,
    icon: Bot,
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    description: '多种开源模型',
    provider: 'openai-compatible',
    providerLabel: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
    needsKey: true,
    icon: Server,
  },
  {
    id: 'ollama',
    name: '本机 Ollama',
    description: '免费且数据不离开电脑',
    provider: 'local',
    providerLabel: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    models: ['qwen2.5:7b', 'llama3.2', 'deepseek-r1:7b'],
    needsKey: false,
    icon: Laptop,
  },
  {
    id: 'custom',
    name: '其他服务',
    description: '任何 OpenAI 兼容接口',
    provider: 'openai-compatible',
    providerLabel: 'OpenAI-compatible',
    baseUrl: '',
    model: '',
    models: [],
    needsKey: true,
    icon: SlidersHorizontal,
  },
];

const TONES: Array<{ id: ToneId; name: string; description: string; temperature: number }> = [
  { id: 'precise', name: '严谨', description: '回答更稳定、直接', temperature: 0.25 },
  { id: 'balanced', name: '平衡', description: '适合大多数对话', temperature: 0.7 },
  { id: 'creative', name: '创意', description: '表达更多样', temperature: 1.15 },
];

function findPreset(config: AiConfig): ProviderPreset {
  return PROVIDERS.find((item) => item.baseUrl && config.baseUrl.replace(/\/+$/, '') === item.baseUrl.replace(/\/+$/, ''))
    ?? (config.provider === 'local' ? PROVIDERS[4] : PROVIDERS[5]);
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

export default function AISettingsPage() {
  const [config, setConfig] = useState<AiConfig>(() => conversationRepository.getAiConfig());
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(() => findPreset(conversationRepository.getAiConfig()).id);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [testing, setTesting] = useState(false);
  const [importText, setImportText] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  const preset = useMemo(
    () => PROVIDERS.find((item) => item.id === selectedPreset) ?? PROVIDERS[5],
    [selectedPreset],
  );
  const hasUsableKey = !preset.needsKey || Boolean(apiKeyDraft.trim() || config.apiKey);

  const update = <K extends keyof AiConfig>(key: K, value: AiConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const chooseProvider = (nextPreset: ProviderPreset) => {
    const keepExistingKey = nextPreset.id === selectedPreset && nextPreset.needsKey;
    setSelectedPreset(nextPreset.id);
    setConfig((current) => ({
      ...current,
      provider: nextPreset.provider,
      providerLabel: nextPreset.providerLabel,
      baseUrl: nextPreset.baseUrl,
      model: nextPreset.model,
      apiKey: keepExistingKey ? current.apiKey : undefined,
    }));
    if (!keepExistingKey) setApiKeyDraft('');
    setNotice(null);
  };

  const chooseTone = (tone: (typeof TONES)[number]) => update('temperature', tone.temperature);

  const buildNextConfig = (): AiConfig => ({
    ...config,
    enabled: true,
    apiKey: preset.needsKey ? (apiKeyDraft.trim() || config.apiKey) : undefined,
    updatedAt: new Date().toISOString(),
  });

  const saveOnly = () => {
    const next = buildNextConfig();
    const errors = validateAiConfig(next);
    if (errors.length) {
      setNotice({ kind: 'error', text: errors.join(' ') });
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

    setTesting(true);
    setNotice({ kind: 'info', text: '正在连接模型，通常只需要几秒钟…' });
    try {
      await testModelConnection(next);
      const saved = conversationRepository.saveAiConfig(next);
      setConfig(saved);
      setApiKeyDraft('');
      setNotice({ kind: 'success', text: '连接成功，设置已经保存。' });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : '连接失败，请检查填写内容后重试。' });
    } finally {
      setTesting(false);
    }
  };

  const clear = () => {
    conversationRepository.clearAiConfig();
    const fresh = conversationRepository.getAiConfig();
    setConfig(fresh);
    setSelectedPreset(findPreset(fresh).id);
    setApiKeyDraft('');
    setNotice({ kind: 'info', text: '这台设备上的 AI 设置已清除。' });
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
      setSelectedPreset(findPreset(next).id);
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
            <p className="aurora-eyebrow">AI CONNECTION</p>
            <h1 className="aurora-title">连接你的 AI</h1>
            <p className="aurora-lead">选一个服务，填入密钥，就可以开始对话。</p>
          </div>
          {config.enabled && (
            <div className="ai-current-status">
              <span><CheckCircle2 />已启用</span>
              <strong>{config.providerLabel || 'AI 服务'}</strong>
              <small>{config.model}</small>
            </div>
          )}
        </header>

        <section className="ai-setup-card" aria-labelledby="provider-title">
          <div className="ai-step-heading">
            <span>1</span>
            <div>
              <h2 id="provider-title">选择 AI 服务</h2>
              <p>不知道怎么选？DeepSeek 通常最容易上手。</p>
            </div>
          </div>
          <div className="ai-provider-grid">
            {PROVIDERS.map((item) => {
              const Icon = item.icon;
              const selected = item.id === selectedPreset;
              return (
                <button
                  type="button"
                  className={`ai-provider-card${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  key={item.id}
                  onClick={() => chooseProvider(item)}
                >
                  <span className="ai-provider-icon"><Icon /></span>
                  <span><strong>{item.name}</strong><small>{item.description}</small></span>
                  <Check className="ai-provider-check" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="ai-setup-card" aria-labelledby="account-title">
          <div className="ai-step-heading">
            <span>2</span>
            <div>
              <h2 id="account-title">{preset.needsKey ? '填写连接信息' : '确认本机模型'}</h2>
              <p>{preset.needsKey ? '密钥只保存在当前浏览器中。' : '请先确认 Ollama 已在这台电脑上运行。'}</p>
            </div>
          </div>

          <div className="ai-primary-fields">
            {preset.needsKey && (
              <label className="ai-field">
                <span>API Key <small>{config.apiKey ? `已保存 ${maskSecret(config.apiKey)}` : '必填'}</small></span>
                <div className="ai-secret-input">
                  <KeyRound />
                  <input
                    type="password"
                    value={apiKeyDraft}
                    onChange={(event) => { setApiKeyDraft(event.target.value); setNotice(null); }}
                    placeholder={config.apiKey ? '留空则继续使用已保存的密钥' : '粘贴你的 API Key'}
                    autoComplete="new-password"
                  />
                </div>
              </label>
            )}

            <label className="ai-field">
              <span>模型 <small>已为你选择推荐项</small></span>
              {preset.models.length > 0 ? (
                <select value={config.model} onChange={(event) => update('model', event.target.value)}>
                  {preset.models.map((model) => <option key={model} value={model}>{model}</option>)}
                  {!preset.models.includes(config.model) && config.model && <option value={config.model}>{config.model}</option>}
                </select>
              ) : (
                <input value={config.model} onChange={(event) => update('model', event.target.value)} placeholder="例如：my-model" />
              )}
            </label>
          </div>

          {selectedPreset === 'custom' && (
            <div className="ai-custom-fields">
              <label className="ai-field">
                <span>服务名称</span>
                <input value={config.providerLabel} onChange={(event) => update('providerLabel', event.target.value)} placeholder="例如：我的 AI 服务" />
              </label>
              <label className="ai-field">
                <span>API 地址</span>
                <input value={config.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} placeholder="https://api.example.com/v1" />
              </label>
            </div>
          )}

          <details className="ai-advanced">
            <summary><SlidersHorizontal />高级设置 <small>大多数人不需要修改</small><ChevronDown /></summary>
            <div className="ai-advanced-body">
              {selectedPreset !== 'custom' && (
                <label className="ai-field">
                  <span>API 地址</span>
                  <input value={config.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} />
                </label>
              )}
              <div className="ai-tone-field">
                <span>回答风格</span>
                <div className="ai-tone-options">
                  {TONES.map((tone) => (
                    <button
                      type="button"
                      className={findTone(config.temperature) === tone.id ? 'is-selected' : ''}
                      onClick={() => chooseTone(tone)}
                      key={tone.id}
                    >
                      <strong>{tone.name}</strong><small>{tone.description}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="ai-advanced-grid">
                <label className="ai-field"><span>最大输出长度</span><input type="number" min="128" max="32768" value={config.maxTokens} onChange={(event) => update('maxTokens', Math.round(numberValue(event.target.value, config.maxTokens)))} /></label>
                <label className="ai-field"><span>超时时间（秒）</span><input type="number" min="5" max="300" value={Math.round(config.timeoutMs / 1000)} onChange={(event) => update('timeoutMs', Math.round(numberValue(event.target.value, config.timeoutMs / 1000) * 1000))} /></label>
              </div>
              <label className="ai-switch-row">
                <span><strong>流式显示回答</strong><small>像打字一样逐字出现</small></span>
                <input type="checkbox" checked={config.stream} onChange={(event) => update('stream', event.target.checked)} />
              </label>
            </div>
          </details>
        </section>

        {notice && (
          <div className={`ai-inline-notice is-${notice.kind}`} role="status" aria-live="polite">
            {testing ? <LoaderCircle className="is-spinning" /> : notice.kind === 'success' ? <CheckCircle2 /> : <ShieldCheck />}
            <span>{notice.text}</span>
          </div>
        )}

        <div className="ai-main-actions">
          <button type="button" className="ai-button ai-button-secondary" onClick={saveOnly} disabled={testing || !hasUsableKey}>
            <Save />仅保存
          </button>
          <button type="button" className="ai-button ai-button-primary" onClick={() => void saveAndTest()} disabled={testing || !hasUsableKey}>
            {testing ? <LoaderCircle className="is-spinning" /> : <Zap />}
            {testing ? '正在连接…' : '保存并测试连接'}
          </button>
        </div>

        <div className="ai-privacy-note">
          <ShieldCheck />
          <span><strong>密钥仅存储在这台设备上</strong>，不会出现在对话导出或配置导出中。</span>
          <Link to="/chat">前往 AI 对话 <ExternalLink /></Link>
        </div>

        <section className="ai-transfer">
          <button type="button" className="ai-transfer-toggle" onClick={() => setShowTransfer((current) => !current)} aria-expanded={showTransfer}>
            <span><Clipboard />配置迁移与清除</span><ChevronDown className={showTransfer ? 'is-open' : ''} />
          </button>
          {showTransfer && (
            <div className="ai-transfer-body">
              <p>可复制或导入不含密钥的配置，适合在不同设备间迁移。</p>
              <div className="ai-settings-actions">
                <button type="button" className="ai-button ai-button-secondary" onClick={() => void exportConfig()}><Clipboard />复制配置</button>
                <button type="button" className="ai-button ai-button-danger" onClick={clear}><Trash2 />清除本机设置</button>
                <button type="button" className="ai-button ai-button-secondary" onClick={() => setImportText('')}><RotateCcw />清空文本</button>
              </div>
              <textarea className="ai-import-box" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="在这里粘贴配置 JSON" rows={6} />
              <button type="button" className="ai-button ai-button-secondary" onClick={importConfig} disabled={!importText.trim()}>载入配置</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
