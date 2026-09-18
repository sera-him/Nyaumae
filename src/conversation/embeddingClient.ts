import type { AiConfig } from './types.ts';
import { redactSensitiveText, safeErrorMessage } from './privacy.ts';

export class EmbeddingError extends Error {
  readonly code: 'missing-config' | 'invalid-response' | 'network' | 'http';

  constructor(code: EmbeddingError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'EmbeddingError';
  }
}

function embeddingsEndpointFor(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return /\/embeddings$/i.test(trimmed) ? trimmed : `${trimmed}/embeddings`;
}

export function embeddingEndpointForConfig(config: AiConfig): string {
  const base = (config.embeddingBaseUrl || config.baseUrl).trim();
  if (!base || config.provider === 'browser') {
    throw new EmbeddingError('missing-config', '语义检索需要云端或本地 OpenAI 兼容服务；浏览器内置模型不支持嵌入。');
  }
  if (!config.embeddingModel.trim()) {
    throw new EmbeddingError('missing-config', '请先在 AI 设置中填写嵌入模型名称。');
  }
  if (config.provider === 'openai-compatible' && !config.apiKey?.trim()) {
    throw new EmbeddingError('missing-config', '语义检索复用对话服务的 API Key，请先填写。');
  }
  return embeddingsEndpointFor(base);
}

/**
 * OpenAI-compatible /embeddings client. Reuses the chat BYOK credentials and
 * never logs request bodies; errors are redacted before surfacing.
 */
export async function fetchEmbeddings(
  config: AiConfig,
  texts: string[],
  signal?: AbortSignal,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const endpoint = embeddingEndpointForConfig(config);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };
  if (config.apiKey?.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`;

  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort('timeout'), Math.max(5_000, config.timeoutMs));
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: config.embeddingModel.trim(), input: texts }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new EmbeddingError('http', `嵌入服务返回 ${response.status}：${redactSensitiveText(body).slice(0, 200)}`);
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new EmbeddingError('invalid-response', safeErrorMessage(error));
    }
    const data = (payload as { data?: unknown })?.data;
    if (!Array.isArray(data) || data.length !== texts.length) {
      throw new EmbeddingError('invalid-response', '嵌入服务返回格式异常。');
    }
    const vectors = data.map((entry) => {
      const embedding = (entry as { embedding?: unknown })?.embedding;
      if (!Array.isArray(embedding) || embedding.some((value) => typeof value !== 'number')) {
        throw new EmbeddingError('invalid-response', '嵌入向量格式异常。');
      }
      return embedding as number[];
    });
    const dimension = vectors[0]?.length ?? 0;
    if (dimension === 0 || vectors.some((vector) => vector.length !== dimension)) {
      throw new EmbeddingError('invalid-response', '嵌入向量维度不一致。');
    }
    return vectors;
  } catch (error) {
    if (error instanceof EmbeddingError) throw error;
    if (signal?.aborted) throw new EmbeddingError('network', '已取消。');
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new EmbeddingError('network', '嵌入请求超时。');
    }
    throw new EmbeddingError('network', safeErrorMessage(error));
  } finally {
    globalThis.clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
