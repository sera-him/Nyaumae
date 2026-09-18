import type { AiConfig, AiConfigExport } from './types.ts';

const SECRET_KEYS = ['apiKey', 'apikey', 'authorization', 'token', 'secret', 'password'];

export function maskSecret(secret?: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 3)}${'•'.repeat(Math.min(12, Math.max(4, secret.length - 7)))}${secret.slice(-4)}`;
}

export function exportSafeAiConfig(config: AiConfig): AiConfigExport {
  return {
    enabled: config.enabled,
    provider: config.provider,
    providerLabel: config.providerLabel,
    baseUrl: config.baseUrl,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    contextWindow: config.contextWindow,
    stream: config.stream,
    timeoutMs: config.timeoutMs,
    retry: config.retry,
    headers: Object.fromEntries(Object.entries(config.headers).filter(([key]) => !SECRET_KEYS.includes(key.toLowerCase()))),
    hasApiKey: Boolean(config.apiKey),
    semanticSearch: config.semanticSearch,
    embeddingModel: config.embeddingModel,
    embeddingBaseUrl: config.embeddingBaseUrl,
    updatedAt: config.updatedAt,
  };
}

export function sanitizeImportedConfig(value: unknown, current: AiConfig): AiConfig {
  if (!value || typeof value !== 'object') throw new Error('配置文件格式无效。');
  const candidate = value as Partial<AiConfig>;
  return {
    ...current,
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : current.enabled,
    provider: candidate.provider === 'local' || candidate.provider === 'browser' ? candidate.provider : 'openai-compatible',
    providerLabel: typeof candidate.providerLabel === 'string' ? candidate.providerLabel : current.providerLabel,
    baseUrl: typeof candidate.baseUrl === 'string' ? candidate.baseUrl : current.baseUrl,
    model: typeof candidate.model === 'string' ? candidate.model : current.model,
    temperature: typeof candidate.temperature === 'number' ? Math.min(2, Math.max(0, candidate.temperature)) : current.temperature,
    maxTokens: typeof candidate.maxTokens === 'number' ? Math.max(1, Math.round(candidate.maxTokens)) : current.maxTokens,
    contextWindow: typeof candidate.contextWindow === 'number' ? Math.max(256, Math.round(candidate.contextWindow)) : current.contextWindow,
    stream: typeof candidate.stream === 'boolean' ? candidate.stream : current.stream,
    timeoutMs: typeof candidate.timeoutMs === 'number' ? Math.max(1000, Math.round(candidate.timeoutMs)) : current.timeoutMs,
    retry: typeof candidate.retry === 'number' ? Math.min(3, Math.max(0, Math.round(candidate.retry))) : current.retry,
    headers: typeof candidate.headers === 'object' && candidate.headers !== null
      ? filterHeaders(candidate.headers as Record<string, unknown>)
      : current.headers,
    semanticSearch: typeof candidate.semanticSearch === 'boolean' ? candidate.semanticSearch : current.semanticSearch,
    embeddingModel: typeof candidate.embeddingModel === 'string' ? candidate.embeddingModel : current.embeddingModel,
    embeddingBaseUrl: typeof candidate.embeddingBaseUrl === 'string' ? candidate.embeddingBaseUrl : current.embeddingBaseUrl,
    updatedAt: new Date().toISOString(),
  };
}

function filterHeaders(headers: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key, value]) => !SECRET_KEYS.includes(key.toLowerCase()) && typeof value === 'string')
      .map(([key, value]) => [key, String(value)]),
  );
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;}]+/gi, '$1[redacted]')
    .replace(/((?:api[-_ ]?key|token|secret|password)\s*[:=]\s*)[^\s,;}]+/gi, '$1[redacted]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, '[redacted-key]')
    .replace(/\bAIza[A-Za-z0-9_-]{12,}\b/g, '[redacted-key]');
}

export function validateAiConfig(config: AiConfig): string[] {
  const errors: string[] = [];
  if (!config.enabled) return errors;
  if (!config.model.trim()) errors.push('请填写模型名称。');
  if (config.provider !== 'browser' && !config.baseUrl.trim()) errors.push('请填写 API 地址。');
  if (config.provider === 'openai-compatible' && !config.apiKey?.trim()) {
    errors.push('请填写 API Key；密钥只会保存在当前浏览器。');
  }
  if (config.provider === 'local' && !/^https?:\/\//i.test(config.baseUrl)) {
    errors.push('本地服务地址需要以 http:// 或 https:// 开头。');
  }
  if (config.provider === 'browser' && !config.model.trim()) {
    errors.push('请选择要下载到浏览器的模型。');
  }
  return errors;
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactSensitiveText(message).slice(0, 500);
}
