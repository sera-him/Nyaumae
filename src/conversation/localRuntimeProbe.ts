import { findModelTier, recommendedTier } from './localModelCatalog.ts';
import type { AiConfig } from './types.ts';

export type LocalRuntimeId = 'ollama' | 'lmstudio' | 'bundled';

export interface LocalRuntimeTarget {
  id: LocalRuntimeId;
  label: string;
  /** OpenAI 兼容的 base URL，结尾带 /v1。 */
  baseUrl: string;
  /** 用户从未装过运行器时可以打开的官方页面。 */
  downloadUrl: string;
}

/**
 * 站点会主动探测的本机服务。顺序即优先级：Ollama 最通用，LM Studio 次之，
 * 最后是仓库自带的字符级模型服务（scripts/charlstm_serve.py）。
 */
export const LOCAL_RUNTIME_TARGETS: LocalRuntimeTarget[] = [
  { id: 'ollama', label: 'Ollama', baseUrl: 'http://127.0.0.1:11434/v1', downloadUrl: 'https://ollama.com/download' },
  { id: 'lmstudio', label: 'LM Studio', baseUrl: 'http://127.0.0.1:1234/v1', downloadUrl: 'https://lmstudio.ai/' },
  { id: 'bundled', label: '本站自带模型', baseUrl: 'http://127.0.0.1:8000/v1', downloadUrl: '' },
];

export interface LocalRuntimeProbe extends LocalRuntimeTarget {
  reachable: boolean;
  models: string[];
}

/**
 * 本机 loopback 探测：GET {baseUrl}/models。
 * 服务没装、没启动或被 CORS 拒绝时都会抛出 TypeError，统一按不可用处理。
 */
async function probeTarget(target: LocalRuntimeTarget, timeoutMs: number, signal?: AbortSignal): Promise<LocalRuntimeProbe> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort('probe-timeout'), Math.max(400, timeoutMs));
  const relayAbort = () => controller.abort('probe-aborted');
  signal?.addEventListener('abort', relayAbort, { once: true });
  try {
    const response = await fetch(`${target.baseUrl}/models`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return { ...target, reachable: false, models: [] };
    const payload = (await response.json()) as { data?: Array<{ id?: unknown }> };
    const models = Array.isArray(payload?.data)
      ? payload.data.map((item) => (typeof item?.id === 'string' ? item.id : '')).filter(Boolean)
      : [];
    return { ...target, reachable: true, models };
  } catch {
    return { ...target, reachable: false, models: [] };
  } finally {
    globalThis.clearTimeout(timer);
    signal?.removeEventListener('abort', relayAbort);
  }
}

export async function probeLocalRuntimes(timeoutMs = 2_500, signal?: AbortSignal): Promise<LocalRuntimeProbe[]> {
  return Promise.all(LOCAL_RUNTIME_TARGETS.map((target) => probeTarget(target, timeoutMs, signal)));
}

/**
 * 在已安装的模型里挑一个「这台设备跑得动且尽量大」的。
 * 目录里查不到的模型名不参与比较，全都不认识时退回第一个。
 */
export function pickLocalModel(models: string[], memoryGb?: number): string {
  if (!models.length) return '';
  const known = models
    .map((model) => ({ model, tier: findModelTier(model) }))
    .filter((entry): entry is { model: string; tier: NonNullable<ReturnType<typeof findModelTier>> } => Boolean(entry.tier));
  if (!known.length) return models[0];

  const budget = recommendedTier(memoryGb, 'device').parameters * 1.2;
  const sorted = [...known].sort((a, b) => a.tier.parameters - b.tier.parameters);
  const fitting = sorted.filter((entry) => entry.tier.parameters <= budget);
  return (fitting.at(-1) ?? sorted[0]).model;
}

/** 把探测结果转成可以保存的 AI 配置。 */
export function localConfigFor(probe: LocalRuntimeProbe, model: string, base: AiConfig): AiConfig {
  return {
    ...base,
    enabled: true,
    provider: 'local',
    providerLabel: probe.label,
    baseUrl: probe.baseUrl,
    model,
    apiKey: undefined,
    // 本地模型第一次推理要加载权重，45 秒对核显机器偏紧。
    timeoutMs: Math.max(base.timeoutMs, 120_000),
    updatedAt: new Date().toISOString(),
  };
}

export function reachableRuntime(probes: LocalRuntimeProbe[]): LocalRuntimeProbe | undefined {
  return probes.find((probe) => probe.reachable && probe.models.length > 0)
    ?? probes.find((probe) => probe.reachable);
}
