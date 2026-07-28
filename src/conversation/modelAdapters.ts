import type { AiConfig, ModelAdapter, ModelMessage, ModelRequest, ModelResult } from './types.ts';
import { redactSensitiveText, safeErrorMessage } from './privacy.ts';

export type ModelErrorCode =
  | 'missing-api-key'
  | 'invalid-api-key'
  | 'model-not-found'
  | 'local-service-unavailable'
  | 'timeout'
  | 'network'
  | 'context-too-long'
  | 'rate-limited'
  | 'aborted'
  | 'invalid-response'
  | 'unknown';

export class ModelAdapterError extends Error {
  readonly code: ModelErrorCode;
  readonly status?: number;

  constructor(code: ModelErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ModelAdapterError';
  }
}

function endpointFor(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return /\/chat\/completions$/i.test(trimmed) ? trimmed : `${trimmed}/chat/completions`;
}

function requestBody(request: ModelRequest, stream: boolean): Record<string, unknown> {
  return {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    stream,
  };
}

function extractContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return '';
  const first = choices[0] as { message?: { content?: unknown }; text?: unknown };
  if (typeof first.message?.content === 'string') return first.message.content;
  if (Array.isArray(first.message?.content)) {
    return first.message.content
      .map((part) => typeof part === 'object' && part !== null && 'text' in part ? String((part as { text: unknown }).text) : '')
      .join('');
  }
  return typeof first.text === 'string' ? first.text : '';
}

function errorCodeForStatus(status: number, local: boolean): ModelErrorCode {
  if (status === 401 || status === 403) return 'invalid-api-key';
  if (status === 404) return 'model-not-found';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 413) return 'context-too-long';
  if (status === 429) return 'rate-limited';
  return local ? 'local-service-unavailable' : 'unknown';
}

function messageForCode(code: ModelErrorCode, fallback: string): string {
  const messages: Partial<Record<ModelErrorCode, string>> = {
    'missing-api-key': '未配置 API Key，请先打开 AI 设置。',
    'invalid-api-key': 'API Key 无效或无权访问该服务。',
    'model-not-found': '找不到指定模型，请检查模型名称。',
    'local-service-unavailable': '本地模型服务不可用，请确认服务已启动并允许浏览器跨域访问。',
    timeout: '模型请求超时，请稍后重试。',
    network: '网络请求失败，请检查 API 地址、网络和跨域设置。',
    'context-too-long': '上下文过长，请清理会话或降低上下文预算。',
    'rate-limited': '服务商限流，请稍后重试。',
    aborted: '已停止生成。',
    'invalid-response': '模型返回格式异常。',
  };
  return messages[code] ?? fallback;
}

export class OpenAICompatibleAdapter implements ModelAdapter {
  readonly provider: string;
  protected readonly config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
    this.provider = config.providerLabel || config.provider;
  }

  async complete(request: ModelRequest, signal?: AbortSignal): Promise<ModelResult> {
    const response = await this.fetchWithRetry(request, false, signal);
    const payload = await this.readJson(response);
    const content = extractContent(payload);
    if (!content) throw new ModelAdapterError('invalid-response', messageForCode('invalid-response', 'Invalid response.'));
    const usage = payload && typeof payload === 'object' && 'usage' in payload
      ? (payload as { usage?: ModelResult['usage'] }).usage
      : undefined;
    return {
      content,
      model: request.model,
      provider: this.provider,
      finishReason: this.finishReason(payload),
      usage,
    };
  }

  async stream(request: ModelRequest, onToken: (token: string) => void, signal?: AbortSignal): Promise<ModelResult> {
    const response = await this.fetchWithRetry(request, true, signal);
    if (!response.body) return this.complete(request, signal);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let finishReason: string | undefined;
    let usage: ModelResult['usage'];
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          let payload: unknown;
          try { payload = JSON.parse(raw); } catch { continue; }
          const token = this.extractDelta(payload);
          if (token) {
            content += token;
            onToken(token);
          }
          if (payload && typeof payload === 'object' && 'usage' in payload) usage = (payload as { usage?: ModelResult['usage'] }).usage;
          const reason = this.finishReason(payload);
          if (reason) finishReason = reason;
        }
      }
      buffer += decoder.decode();
      if (buffer.startsWith('{')) {
        try {
          const payload = JSON.parse(buffer) as unknown;
          const remaining = extractContent(payload);
          if (remaining && !content) {
            content = remaining;
            onToken(remaining);
          }
          usage = usage ?? (payload && typeof payload === 'object' && 'usage' in payload
            ? (payload as { usage?: ModelResult['usage'] }).usage
            : undefined);
        } catch {
          // Some providers end with an SSE delimiter instead of a JSON object.
        }
      }
    } catch (error) {
      if (signal?.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
      throw error;
    } finally {
      reader.releaseLock();
    }
    if (!content) throw new ModelAdapterError('invalid-response', messageForCode('invalid-response', 'Invalid response.'));
    return { content, model: request.model, provider: this.provider, finishReason, usage };
  }

  private async fetchWithRetry(request: ModelRequest, stream: boolean, signal?: AbortSignal): Promise<Response> {
    if (this.config.provider !== 'local' && !this.config.apiKey?.trim()) {
      throw new ModelAdapterError('missing-api-key', messageForCode('missing-api-key', 'Missing API key.'));
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
    if (this.config.apiKey?.trim()) headers.Authorization = `Bearer ${this.config.apiKey.trim()}`;
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.config.retry; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = globalThis.setTimeout(() => controller.abort(), Math.max(1000, this.config.timeoutMs));
        const forwardAbort = () => controller.abort();
        signal?.addEventListener('abort', forwardAbort, { once: true });
        try {
          const response = await fetch(endpointFor(this.config.baseUrl), {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody(request, stream)),
            signal: controller.signal,
          });
          if (!response.ok) {
            const body = await response.text().catch(() => '');
            const code = errorCodeForStatus(response.status, this.config.provider === 'local');
            throw new ModelAdapterError(code, messageForCode(code, redactSensitiveText(body).slice(0, 240)), response.status);
          }
          return response;
        } finally {
          globalThis.clearTimeout(timeout);
          signal?.removeEventListener('abort', forwardAbort);
        }
      } catch (error) {
        lastError = error;
        if (signal?.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
        if (error instanceof ModelAdapterError && !['timeout', 'rate-limited', 'network', 'local-service-unavailable'].includes(error.code)) throw error;
        if (attempt >= this.config.retry) break;
      }
    }
    if (lastError instanceof ModelAdapterError) throw lastError;
    if (lastError instanceof DOMException && lastError.name === 'AbortError') {
      throw new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'));
    }
    throw new ModelAdapterError('network', messageForCode('network', safeErrorMessage(lastError)));
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      throw new ModelAdapterError('invalid-response', safeErrorMessage(error));
    }
  }

  private extractDelta(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return '';
    const choices = (payload as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return '';
    const delta = (choices[0] as { delta?: { content?: unknown } }).delta;
    return typeof delta?.content === 'string' ? delta.content : '';
  }

  private finishReason(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined;
    const choices = (payload as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return undefined;
    const reason = (choices[0] as { finish_reason?: unknown }).finish_reason;
    return typeof reason === 'string' ? reason : undefined;
  }
}

export class LocalModelAdapter extends OpenAICompatibleAdapter {
  constructor(config: AiConfig) {
    super({ ...config, provider: 'local', apiKey: undefined });
  }
}

export class EchoModelAdapter implements ModelAdapter {
  readonly provider = 'test-echo';

  async complete(request: ModelRequest): Promise<ModelResult> {
    const last = request.messages.at(-1)?.content ?? '';
    return { content: `ECHO: ${last}`, model: request.model, provider: this.provider };
  }

  async stream(request: ModelRequest, onToken: (token: string) => void): Promise<ModelResult> {
    const result = await this.complete(request);
    for (const token of Array.from(result.content)) onToken(token);
    return result;
  }
}

export function createModelAdapter(config: AiConfig): ModelAdapter {
  return config.provider === 'local' ? new LocalModelAdapter(config) : new OpenAICompatibleAdapter(config);
}

export async function testModelConnection(config: AiConfig, signal?: AbortSignal): Promise<ModelResult> {
  const adapter = createModelAdapter(config);
  const messages: ModelMessage[] = [{ role: 'user', content: 'Reply with exactly: connection-ok' }];
  return adapter.complete({
    messages,
    model: config.model,
    temperature: 0,
    maxTokens: 32,
    stream: false,
    timeoutMs: config.timeoutMs,
  }, signal);
}
