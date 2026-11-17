import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  Globe2,
  HardDrive,
  LoaderCircle,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router';
import { getLocale } from '@/lib/i18n';
import { conversationRepository } from '@/conversation/storage';
import type { AiConfig } from '@/conversation/types';
import { browserSupportsLocalAI, prepareBrowserModel, testModelConnection } from '@/conversation/modelAdapters';
import { safeErrorMessage } from '@/conversation/privacy';
import {
  localConfigFor,
  pickLocalModel,
  probeLocalRuntimes,
  reachableRuntime,
  type LocalRuntimeProbe,
} from '@/conversation/localRuntimeProbe';
import { detectInstallerPlatform, downloadInstaller, installerFileName, siteOrigins } from '@/conversation/oneClickInstaller';
import { LOCAL_MODEL_TIERS } from '@/conversation/localModelCatalog';
import { loadCharLstmModel, preloadCharLstmModel } from '@/conversation/charlstmRuntime';
import './OneClickAiSetup.css';

type Phase = 'checking' | 'ready' | 'empty' | 'waiting' | 'connecting' | 'browser' | 'connected' | 'error';

interface ModelOption {
  model: string;
  label: string;
  note: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { model: 'qwen2.5:3b', label: '轻量 3B', note: '约 1.9 GB，老电脑也能跑' },
  { model: 'qwen3:4b', label: '均衡 4B', note: '约 2.5 GB，日常对话推荐' },
  { model: 'qwen2.5:7b', label: '更强 7B', note: '约 4.7 GB，内存 16 GB 以上更合适' },
];

const MODEL_OPTIONS_EN: ModelOption[] = [
  { model: 'qwen2.5:3b', label: 'Light 3B', note: '~1.9 GB, runs on older machines' },
  { model: 'qwen3:4b', label: 'Balanced 4B', note: '~2.5 GB, recommended for daily chat' },
  { model: 'qwen2.5:7b', label: 'Stronger 7B', note: '~4.7 GB, best with 16 GB RAM or more' },
];

/** 本站自己训练的 CharLSTM：权重就在站点里，浏览器直接加载，不需要任何环境。 */
const OWN_MODELS = [
  { id: 'nyaumae-charlstm-0.56m', label: 'NYM 0.56M', note: '2.3 MB · 原版' },
  { id: 'nyaumae-charlstm-1.25m', label: 'NYM 1.25M', note: '4.6 MB · 改进版' },
];

const OWN_MODELS_EN = [
  { id: 'nyaumae-charlstm-0.56m', label: 'NYM 0.56M', note: '2.3 MB · original' },
  { id: 'nyaumae-charlstm-1.25m', label: 'NYM 1.25M', note: '4.6 MB · improved' },
];

function deviceMemory(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
}

function defaultModel(): string {
  const memoryGb = deviceMemory();
  if ((memoryGb ?? 8) >= 8) return 'qwen3:4b';
  return 'qwen2.5:3b';
}

interface OneClickAiSetupProps {
  config: AiConfig;
  onSaved: (config: AiConfig) => void;
  /** 打开页面下方的「手动配置」，可要求直接落在云端模式。 */
  onOpenManual: (mode?: 'cloud') => void;
}

export default function OneClickAiSetup({ config, onSaved, onOpenManual }: OneClickAiSetupProps) {
  const _en = getLocale() === 'en';
  const models = _en ? MODEL_OPTIONS_EN : MODEL_OPTIONS;

  const configRef = useRef(config);
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    configRef.current = config;
    onSavedRef.current = onSaved;
  }, [config, onSaved]);

  const [phase, setPhase] = useState<Phase>('checking');
  const [probes, setProbes] = useState<LocalRuntimeProbe[]>([]);
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState<{ label: string; model: string } | null>(
    config.enabled ? { label: config.providerLabel || config.provider, model: config.model } : null,
  );
  const [installModel, setInstallModel] = useState(defaultModel);
  const [browserProgress, setBrowserProgress] = useState<number | null>(null);
  const [browserText, setBrowserText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [downloadName, setDownloadName] = useState('');
  /** 检测到多个模型时，记住页面上选中的那个，别让自动选型悄悄换掉用户的模型。 */
  const [modelChoice, setModelChoice] = useState('');
  /** 云端已经在用的用户，默认不推「本机没 AI」，点「改用本地」才进入安装流程。 */
  const [localIntent, setLocalIntent] = useState(false);
  /** 本站模型：默认选更大的 1.25M，点一下在浏览器里加载。 */
  const [ownModel, setOwnModel] = useState('nyaumae-charlstm-1.25m');
  const [ownLoading, setOwnLoading] = useState(false);
  const [ownStage, setOwnStage] = useState('');

  const platform = detectInstallerPlatform();
  const webGpuReady = browserSupportsLocalAI();
  const busyRef = useRef(false);
  const browserAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => browserAbortRef.current?.abort(), []);

  /**
   * 选模型的优先级：当前配置里正在用的那个（只要它还在本机模型列表里）>
   * 按设备内存推荐的最大可跑模型 > 列表里的第一个。
   * 这样用户自己命名、自己训的模型不会被一键流程默默替换掉。
   */
  const preferredModel = useCallback((models: string[]) => {
    const current = configRef.current;
    if (current.provider === 'local' && models.includes(current.model)) return current.model;
    return pickLocalModel(models, deviceMemory());
  }, []);

  const connectTo = useCallback(async (probe: LocalRuntimeProbe, modelOverride?: string) => {
    if (busyRef.current) return;
    const model = modelOverride || preferredModel(probe.models);
    if (!model) {
      setPhase('empty');
      setStatus(_en
        ? `${probe.label} is running but no model is installed yet. The installer below will also download one.`
        : `${probe.label} 正在运行，但还没有下载模型。下面的安装包会顺手帮你下载一个。`);
      return;
    }
    busyRef.current = true;
    setPhase('connecting');
    setStatus(_en ? `Connecting to ${probe.label} · ${model}…` : `正在连接 ${probe.label} · ${model}…`);
    setErrorText('');
    try {
      const next = localConfigFor(probe, model, configRef.current);
      await testModelConnection(next);
      const saved = conversationRepository.saveAiConfig(next);
      onSavedRef.current(saved);
      setConnected({ label: probe.label, model });
      setModelChoice(model);
      setPhase('connected');
      setStatus(_en ? 'Connected. You can start chatting.' : '已连接，可以开始对话了。');
    } catch (error) {
      setErrorText(safeErrorMessage(error));
      setPhase('error');
      setStatus(_en ? 'The service answered but the model test failed.' : '服务有响应，但模型测试没通过。');
    } finally {
      busyRef.current = false;
    }
  }, [_en, preferredModel]);

  const detect = useCallback(async (autoConnect: boolean) => {
    if (busyRef.current) return;
    const results = await probeLocalRuntimes(2_500);
    setProbes(results);
    const hit = reachableRuntime(results);
    if (hit && hit.models.length) {
      if (autoConnect) {
        await connectTo(hit);
        return;
      }
      if (configRef.current.enabled && configRef.current.baseUrl.replace(/\/+$/, '') === hit.baseUrl) {
        setConnected({ label: hit.label, model: configRef.current.model });
        setModelChoice(configRef.current.model);
        setPhase('connected');
        setStatus(_en ? 'Connected.' : '已连接。');
        return;
      }
      setPhase('ready');
      setModelChoice(preferredModel(hit.models));
      setStatus(_en
        ? `${hit.label} detected with ${hit.models.length} model${hit.models.length > 1 ? 's' : ''}.`
        : `检测到 ${hit.label}，已安装 ${hit.models.length} 个模型。`);
      return;
    }
    if (hit) {
      setPhase('empty');
      setStatus(_en
        ? `${hit.label} is running but no model is installed yet.`
        : `${hit.label} 正在运行，但还没有下载模型。`);
      return;
    }
    setPhase('empty');
    setStatus(_en
      ? 'No local AI is running on this computer yet.'
      : '这台电脑上还没有可用的本地 AI 服务。');
  }, [_en, connectTo, preferredModel]);

  useEffect(() => {
    // 放到下一轮事件循环再探测：避免 effect 内同步 setState 造成级联渲染。
    const timer = window.setTimeout(() => { void detect(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [detect]);

  /** 手动「重新检测」：先把状态切到检查中，再走同一套探测。 */
  const recheck = () => {
    setPhase('checking');
    setStatus('');
    void detect(false);
  };

  // 安装期间不需要用户回到页面手动刷新：每 3 秒探一次，服务一就绪就自动接上。
  useEffect(() => {
    if (phase !== 'empty' && phase !== 'waiting') return;
    const timer = window.setInterval(() => { void detect(true); }, 3_000);
    return () => window.clearInterval(timer);
  }, [phase, detect]);

  const handlePrimary = () => {
    if (phase === 'ready') {
      const hit = reachableRuntime(probes);
      if (hit) void connectTo(hit, modelChoice || undefined);
      return;
    }
    if (phase === 'empty' || phase === 'waiting') {
      handleDownload();
      return;
    }
    void detect(true);
  };

  const handleDownload = () => {
    const name = downloadInstaller(platform, { model: installModel, origins: siteOrigins() });
    setDownloadName(name);
    setPhase('waiting');
    setStatus(_en
      ? 'Waiting for the local service to come up. It will connect automatically.'
      : '正在等待本地服务启动，装好后会自动连上。');
  };

  const startBrowserModel = async () => {
    if (!webGpuReady || busyRef.current) return;
    busyRef.current = true;
    setPhase('browser');
    setBrowserProgress(0);
    setBrowserText('');
    const controller = new AbortController();
    browserAbortRef.current = controller;
    try {
      const model = LOCAL_MODEL_TIERS.find((tier) => tier.id === '1b')?.browserModel ?? 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
      await prepareBrowserModel(model, (progress, text) => {
        setBrowserProgress(progress);
        setBrowserText(text);
      }, controller.signal);
      const next: AiConfig = {
        ...configRef.current,
        enabled: true,
        provider: 'browser',
        providerLabel: _en ? 'Browser WebGPU' : '浏览器 WebGPU',
        baseUrl: 'browser://webgpu',
        model,
        apiKey: undefined,
        timeoutMs: Math.max(configRef.current.timeoutMs, 120_000),
        updatedAt: new Date().toISOString(),
      };
      const saved = conversationRepository.saveAiConfig(next);
      onSaved(saved);
      setConnected({ label: _en ? 'In-browser model' : '浏览器内模型', model: _en ? 'Llama 3.2 1B' : 'Llama 3.2 1B' });
      setPhase('connected');
      setStatus(_en ? 'Model cached. You can chat offline now.' : '模型已缓存到浏览器，现在可以离线对话。');
    } catch (error) {
      setErrorText(safeErrorMessage(error));
      setPhase('error');
      setStatus(_en ? 'The browser model could not start.' : '浏览器模型没能启动。');
    } finally {
      busyRef.current = false;
      browserAbortRef.current = null;
      setBrowserProgress(null);
    }
  };

  const runOwnModel = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setOwnLoading(true);
    setOwnStage(_en ? 'Downloading weights…' : '正在下载权重…');
    setErrorText('');
    setStatus(_en ? 'Loading the site model…' : '正在加载本站模型…');
    try {
      await loadCharLstmModel(ownModel, (stage) => {
        if (stage === 'fetch') setOwnStage(_en ? 'Downloading weights…' : '正在下载权重…');
        else if (stage === 'parse') setOwnStage(_en ? 'Reading weights…' : '正在读取权重…');
        else setOwnStage(_en ? 'Ready' : '已就绪');
      });
      setOwnStage(_en ? 'Testing…' : '正在试跑…');
      const next: AiConfig = {
        ...configRef.current,
        enabled: true,
        provider: 'browser',
        providerLabel: _en ? 'Nyaumae CharLSTM' : '本站模型 · 浏览器',
        baseUrl: 'browser://charlstm',
        model: ownModel,
        apiKey: undefined,
        timeoutMs: Math.max(configRef.current.timeoutMs, 120_000),
        updatedAt: new Date().toISOString(),
      };
      await testModelConnection(next);
      const saved = conversationRepository.saveAiConfig(next);
      // 先让面板变成「已连接」，再通知设置页同步状态；
      // 设置页整页重渲染较重，不应挡在用户看到结果之前。
      setConnected({ label: _en ? 'Nyaumae CharLSTM' : '本站模型', model: ownModel.replace('nyaumae-charlstm-', 'NYM ').toUpperCase() });
      setModelChoice(ownModel);
      setPhase('connected');
      setStatus(_en ? 'Loaded in this browser. You can start chatting.' : '已在本浏览器加载，可以开始对话了。');
      await new Promise((resolve) => setTimeout(resolve, 0));
      onSavedRef.current(saved);
    } catch (error) {
      setErrorText(safeErrorMessage(error));
      setPhase('error');
      setStatus(_en ? 'The site model could not start.' : '本站模型没能启动。');
    } finally {
      busyRef.current = false;
      setOwnLoading(false);
      setOwnStage('');
    }
  };

  const installerHint = platform === 'macos'
    ? (_en ? 'Double-click the downloaded .command. If macOS blocks it, right-click and choose Open.' : '双击下载的 .command 文件；若 macOS 拦截，右键选择「打开」。')
    : platform === 'linux'
      ? (_en ? 'Run it in a terminal: bash ~/Downloads/nyaumae-one-click-ai.sh (asks for sudo).' : '在终端运行：bash ~/Downloads/nyaumae-one-click-ai.sh（会要求 sudo 权限）。')
      : (_en ? 'Double-click the downloaded .bat. If Windows asks, choose "Keep".' : '双击下载的 .bat；Windows 提示时选择「保留」。');

  const showCloudCard = config.enabled && config.provider === 'openai-compatible' && !localIntent && phase !== 'connected';
  const showBrowserCard = config.enabled && config.provider === 'browser' && !localIntent && phase !== 'connected';
  const ownBrowserActive = showBrowserCard && config.model.startsWith('nyaumae-charlstm-');
  const ownModels = _en ? OWN_MODELS_EN : OWN_MODELS;
  const showActiveCard = showCloudCard || showBrowserCard;
  const isReady = phase === 'connected' || showActiveCard;
  const localConnected = phase === 'connected' && config.provider === 'local';
  const readyHit = reachableRuntime(probes);
  const readyModels = readyHit?.models ?? [];

  /**
   * 没有本地服务时，用户最可能点的就是「在浏览器里运行」。
   * 页面稳定后先把默认权重抓下来，点击时就不必再等下载。
   * 流量敏感（Save-Data）的设备不预取。
   */
  useEffect(() => {
    if (ownBrowserActive || phase !== 'empty') return undefined;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return undefined;
    const id = window.setTimeout(() => preloadCharLstmModel(OWN_MODELS[1].id), 800);
    return () => window.clearTimeout(id);
  }, [ownBrowserActive, phase]);

  return (
    <section className={`ai-quick-start${isReady ? ' is-connected' : ''}`} id="quick" data-motion-reveal>
      <div className="ai-quick-glow" aria-hidden="true" />
      <header className="ai-quick-head">
        <div>
          <p className="ai-quick-eyebrow">ONE-CLICK AI</p>
          <h2>{showCloudCard
            ? (_en ? 'Cloud AI is already on' : '云端 AI 已启用')
            : ownBrowserActive
              ? (_en ? 'The site model is on' : '本站模型已启用')
              : showBrowserCard
                ? (_en ? 'In-browser AI is already on' : '浏览器 AI 已启用')
                : (_en ? 'Turn on AI in one click' : '一键开启 AI')}</h2>
          <p>{showCloudCard
            ? (_en
              ? `Using ${config.providerLabel || 'a cloud provider'} · ${config.model}. Switch to a free, offline local model anytime.`
              : `正在使用 ${config.providerLabel || '云端服务'} · ${config.model}。想换成免费、可离线的本地模型，随时可以切。`)
            : ownBrowserActive
              ? (_en
                ? 'Nyaumae CharLSTM is running in this page. The few-MB weights are fetched once, then the browser reuses them.'
                : '本站的 Nyaumae CharLSTM 正在这个页面里跑。几 MB 权重只取一次，之后浏览器会复用。')
              : showBrowserCard
                ? (_en
                  ? 'The model is cached in this browser, so chat works without a local service. You can also switch to a local model.'
                  : '模型已缓存在浏览器里，不开本地服务也能直接对话。也可以换成跑在本机的模型。')
                : (_en
                  ? 'No environment setup, no terminal commands. Click once and the page handles the rest.'
                  : '不用装环境、不用敲命令。点一下，剩下的交给页面。')}</p>
        </div>
        <span className="ai-quick-badge"><Zap />{_en ? 'One click' : '一键'}</span>
      </header>

      <div className="ai-quick-actions">
        {showActiveCard ? (
          <>
            <Link className="ai-quick-primary" to="/chat"><Sparkles />{_en ? 'Start chatting' : '开始对话'}<ArrowRight /></Link>
            <button
              type="button"
              className="ai-quick-secondary"
              onClick={() => { setLocalIntent(true); setPhase('checking'); void detect(true); }}
            >
              <HardDrive />{_en ? 'Switch to a local model' : '改用本地模型（一键）'}
            </button>
          </>
        ) : phase === 'connected' ? (
          <>
            <Link className="ai-quick-primary" to="/chat"><Sparkles />{_en ? 'Start chatting' : '开始对话'}<ArrowRight /></Link>
            <button type="button" className="ai-quick-secondary" onClick={recheck}>
              <RefreshCw />{_en ? 'Check again' : '重新检测'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="ai-quick-primary"
              onClick={handlePrimary}
              disabled={phase === 'checking' || phase === 'connecting' || phase === 'browser'}
              data-motion-ripple="true"
            >
              {phase === 'checking' || phase === 'connecting'
                ? <LoaderCircle className="is-spinning" data-motion-loop />
                : <Zap />}
              {phase === 'ready'
                ? (_en ? 'Connect now' : '立即连接')
                : phase === 'connecting'
                  ? (_en ? 'Connecting…' : '正在连接…')
                  : phase === 'empty'
                    ? (_en ? 'Download the installer' : '下载一键安装包')
                    : phase === 'waiting'
                      ? (_en ? 'Download again' : '重新下载安装包')
                      : (_en ? 'Set up local AI in one click' : '一键开启本地 AI')}
            </button>
            <button
              type="button"
              className="ai-quick-secondary"
              onClick={() => void startBrowserModel()}
              disabled={!webGpuReady || phase === 'browser' || phase === 'connecting'}
              title={webGpuReady ? '' : (_en ? 'This browser has no WebGPU. Use Chrome or Edge.' : '当前浏览器没有可用的 WebGPU，请用 Chrome 或 Edge。')}
            >
              <Globe2 />{phase === 'browser' ? (_en ? 'Downloading…' : '正在下载…') : (_en ? 'Run Llama 1B in the browser' : '浏览器跑 Llama 1B（约 800MB）')}
            </button>
          </>
        )}
      </div>

      <div className="ai-quick-status" role="status" aria-live="polite">
        {isReady ? <CheckCircle2 /> : phase === 'error' ? <CircleAlert /> : phase === 'checking' ? <LoaderCircle className="is-spinning" data-motion-loop /> : <Monitor />}
        <div>
          {showCloudCard ? (
            <>
              <strong>{_en ? 'Cloud AI is active' : '云端 AI 运行中'} · {config.providerLabel || 'OpenAI'}</strong>
              <span>{config.model}</span>
            </>
          ) : ownBrowserActive ? (
            <>
              <strong>{_en ? 'Site model running' : '本站模型运行中'} · {_en ? 'browser' : '浏览器内'}</strong>
              <span>{config.model.replace(/^nyaumae-charlstm-/i, 'NYM ').toUpperCase()}</span>
            </>
          ) : showBrowserCard ? (
            <>
              <strong>{_en ? 'In-browser AI is active' : '浏览器 AI 运行中'} · WebGPU</strong>
              <span>{config.model}</span>
            </>
          ) : connected && phase === 'connected' ? (
            <>
              <strong>{_en ? 'Connected' : '已连接'} · {connected.label}</strong>
              <span>{connected.model}</span>
            </>
          ) : (
            <>
              <strong>{status || (_en ? 'Checking this computer…' : '正在检查这台电脑…')}</strong>
              {phase === 'ready' && <span>{_en ? 'Click "Connect now" — no other setup needed.' : '点「立即连接」即可，不需要再做别的。'}</span>}
              {phase === 'waiting' && <span>{_en ? 'Keep the installer window open. This page checks every 3 seconds.' : '保持安装窗口开着，本页每 3 秒自动检测一次。'}</span>}
              {errorText && phase === 'error' && <span className="ai-quick-error-text">{errorText}</span>}
            </>
          )}
        </div>
        {!showActiveCard && phase !== 'connected' && phase !== 'checking' && (
          <button type="button" className="ai-quick-mini" onClick={recheck}>
            <RefreshCw />{_en ? 'Check again' : '重新检测'}
          </button>
        )}
      </div>

      {(phase === 'ready' || localConnected) && readyModels.length > 1 && (
        <div className="ai-quick-model-pick">
          <span>{_en ? 'Use installed model' : '使用已安装的模型'}</span>
          <select
            value={modelChoice || (localConnected ? config.model : '')}
            onChange={(event) => {
              const next = event.target.value;
              setModelChoice(next);
              if (phase === 'connected' && readyHit) void connectTo(readyHit, next);
            }}
            aria-label={_en ? 'Choose which installed model to use' : '选择要使用的已安装模型'}
          >
            {readyModels.map((model) => <option key={model} value={model}>{model}</option>)}
          </select>
        </div>
      )}

      {phase === 'browser' && (
        <div className="ai-quick-browser">
          <div className="ai-quick-progress"><span style={{ width: `${browserProgress ?? 0}%` }} /></div>
          <p><strong>{browserProgress ?? 0}%</strong>{browserText || (_en ? 'Preparing model files…' : '正在准备模型文件…')}</p>
          <button type="button" className="ai-quick-mini" onClick={() => browserAbortRef.current?.abort()}>
            {_en ? 'Cancel' : '取消'}
          </button>
        </div>
      )}

      {(phase === 'empty' || phase === 'waiting') && !showActiveCard && (
        <>
          <div className="ai-quick-own">
            <div className="ai-quick-own-head">
              <span className="ai-quick-own-icon"><Sparkles /></span>
              <div>
                <strong>{_en ? 'Try the site\'s own model — zero install' : '先试本站自己的模型 · 零安装'}</strong>
                <small>{_en
                  ? 'Nyaumae CharLSTM, only a few MB. It runs right in this page: no Python, no terminal, no local service.'
                  : 'Nyaumae CharLSTM，只有几 MB，直接在这个页面里跑：不用 Python、不用终端、不用起服务。'}</small>
              </div>
            </div>
            <div className="ai-quick-own-row">
              <select
                value={ownModel}
                onChange={(event) => setOwnModel(event.target.value)}
                disabled={ownLoading}
                aria-label={_en ? 'Choose a site model' : '选择本站模型'}
              >
                {ownModels.map((option) => (
                  <option key={option.id} value={option.id}>{option.label} — {option.note}</option>
                ))}
              </select>
              <button type="button" className="ai-quick-own-run" onClick={() => void runOwnModel()} disabled={ownLoading}>
                {ownLoading ? <LoaderCircle className="is-spinning" data-motion-loop /> : <Zap />}
                {ownLoading ? (ownStage || (_en ? 'Loading…' : '正在加载…')) : (_en ? 'Run in this browser' : '在浏览器里运行')}
              </button>
            </div>
            <div className="ai-quick-own-foot">
              <a href={`${import.meta.env.BASE_URL}models/nyaumae-charlstm/${ownModel}.npz`} download>
                <Download />{_en ? 'Download weights (.npz)' : '下载权重 .npz'}
              </a>
              <span>{_en ? 'The weights stay on your device.' : '权重只留在你自己的设备上。'}</span>
            </div>
          </div>
          <p className="ai-quick-or">{_en ? 'Or install a stronger local model:' : '或者，装一个更强的本地模型：'}</p>
        </>
      )}

      {(phase === 'empty' || phase === 'waiting') && !showActiveCard && (
        <div className="ai-quick-installer">
          <div className="ai-quick-installer-head">
            <span className="ai-quick-installer-icon"><Download /></span>
            <div>
              <strong>{_en ? 'Download the one-click installer' : '下载一键安装包'}</strong>
              <small>{installerHint}</small>
            </div>
          </div>

          <div className="ai-quick-model-options" role="radiogroup" aria-label={_en ? 'Model size' : '模型大小'}>
            {models.map((option) => (
              <button
                type="button"
                key={option.model}
                role="radio"
                aria-checked={installModel === option.model}
                className={installModel === option.model ? 'is-selected' : ''}
                onClick={() => setInstallModel(option.model)}
              >
                <strong>{option.label}</strong>
                <small>{option.note}</small>
                {installModel === option.model && <Check />}
              </button>
            ))}
          </div>

          <button type="button" className="ai-quick-download" onClick={handleDownload}>
            <Download />
            {_en ? `Download ${installerFileName(platform)}` : `下载 ${installerFileName(platform)}`}
          </button>
          {downloadName && phase === 'waiting' && (
            <p className="ai-quick-downloaded"><CheckCircle2 />{_en ? `Saved as ${downloadName}. Run it, then come back here.` : `已保存为 ${downloadName}，双击运行后回到本页即可。`}</p>
          )}

          <ol className="ai-quick-steps">
            <li><span>1</span><div><strong>{_en ? 'Run the downloaded file' : '双击运行下载的文件'}</strong><small>{_en ? 'It installs Ollama silently and downloads the model.' : '它会静默安装 Ollama，并下载你选的模型。'}</small></div></li>
            <li><span>2</span><div><strong>{_en ? 'Wait for it to finish' : '等它自己跑完'}</strong><small>{_en ? 'About 3–10 minutes, depending on your connection.' : '大约 3–10 分钟，取决于网速和模型大小。'}</small></div></li>
            <li><span>3</span><div><strong>{_en ? 'Come back to this page' : '回到本页'}</strong><small>{_en ? 'No refresh needed — it connects by itself.' : '不用刷新，几秒内会自动变成「已连接」。'}</small></div></li>
          </ol>

          <p className="ai-quick-note">
            <ShieldCheck />
            {_en
              ? 'The script only does three things: install Ollama, allow this site\'s address, and pull the model. It never deletes or overwrites models you already have; it only restarts Ollama so the new setting takes effect.'
              : '安装包只做三件事：安装 Ollama、放行本站在用的网址、下载模型。不会删除或覆盖你已有的模型，只会重启 Ollama 让放行设置生效。'}
          </p>
          <p className="ai-quick-hint">
            {_en
              ? 'If the browser asks whether this site may access your local network, choose Allow — otherwise the page cannot see the local model.'
              : '若浏览器询问「是否允许本站访问本地网络」，请选择允许，否则页面看不到本机模型。'}
          </p>
        </div>
      )}

      <footer className="ai-quick-foot">
        <button type="button" className="ai-quick-link" onClick={() => onOpenManual()}>
          <HardDrive />{_en ? 'Manual setup' : '手动配置'}
        </button>
        <button type="button" className="ai-quick-link" onClick={() => onOpenManual('cloud')}>
          <ExternalLink />{_en ? 'I have a cloud API key' : '我有云端 API Key'}
        </button>
        {probes.some((probe) => probe.reachable) && (
          <span className="ai-quick-detected">
            {probes.filter((probe) => probe.reachable).map((probe) => probe.label).join(' · ')}
          </span>
        )}
      </footer>
    </section>
  );
}
