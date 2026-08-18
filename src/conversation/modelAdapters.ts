import type { AiConfig, ModelAdapter, ModelMessage, ModelRequest, ModelResult } from './types.ts';
import { redactSensitiveText, safeErrorMessage } from './privacy.ts';
import type { ChatCompletionMessageParam, MLCEngine } from '@mlc-ai/web-llm';

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

function runWithDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal,
  interrupt?: () => void | Promise<void>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = () => {
      void interrupt?.();
      finish(() => reject(new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'))));
    };
    const timer = globalThis.setTimeout(() => {
      void interrupt?.();
      finish(() => reject(new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'))));
    }, Math.max(1_000, timeoutMs));

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => finish(() => resolve(value)),
      (error) => finish(() => reject(error)),
    );
  });
}

export class OpenAICompatibleAdapter implements ModelAdapter {
  readonly provider: string;
  protected readonly config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
    this.provider = config.providerLabel || config.provider;
  }

  async complete(request: ModelRequest, signal?: AbortSignal): Promise<ModelResult> {
    const deadline = await this.fetchWithRetry(request, false, signal);
    try {
      const payload = await this.readJson(deadline.response);
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
    } catch (error) {
      if (signal?.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
      if (deadline.timedOut() || error instanceof DOMException && error.name === 'AbortError') {
        throw new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'));
      }
      throw error;
    } finally {
      deadline.cleanup();
    }
  }

  async stream(request: ModelRequest, onToken: (token: string) => void, signal?: AbortSignal): Promise<ModelResult> {
    const deadline = await this.fetchWithRetry(request, true, signal);
    if (!deadline.response.body) {
      deadline.cleanup();
      return this.complete(request, signal);
    }
    const reader = deadline.response.body.getReader();
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
      if (deadline.timedOut() || error instanceof DOMException && error.name === 'AbortError') {
        throw new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'));
      }
      throw error;
    } finally {
      deadline.cleanup();
      reader.releaseLock();
    }
    if (!content) throw new ModelAdapterError('invalid-response', messageForCode('invalid-response', 'Invalid response.'));
    return { content, model: request.model, provider: this.provider, finishReason, usage };
  }

  private async fetchWithRetry(request: ModelRequest, stream: boolean, signal?: AbortSignal): Promise<{
    response: Response;
    cleanup: () => void;
    timedOut: () => boolean;
  }> {
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
        let didTimeout = false;
        const timeout = globalThis.setTimeout(() => {
          didTimeout = true;
          controller.abort('timeout');
        }, Math.max(1000, this.config.timeoutMs));
        const forwardAbort = () => controller.abort();
        signal?.addEventListener('abort', forwardAbort, { once: true });
        const cleanup = () => {
          globalThis.clearTimeout(timeout);
          signal?.removeEventListener('abort', forwardAbort);
        };
        let handedOff = false;
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
          handedOff = true;
          return { response, cleanup, timedOut: () => didTimeout };
        } catch (error) {
          if (didTimeout) throw new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'));
          throw error;
        } finally {
          if (!handedOff) cleanup();
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
    const networkMessage = typeof navigator !== 'undefined' && !navigator.onLine
      ? '当前处于离线状态，恢复联网后可重试。'
      : messageForCode('network', safeErrorMessage(lastError));
    throw new ModelAdapterError('network', networkMessage);
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

let browserEngine: MLCEngine | undefined;
let browserEngineModel = '';
let browserEnginePromise: Promise<MLCEngine> | undefined;

export function browserSupportsLocalAI(): boolean {
  if (typeof navigator === 'undefined') return false;
  return Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

export async function prepareBrowserModel(
  model: string,
  onProgress?: (progress: number, text: string) => void,
  signal?: AbortSignal,
): Promise<MLCEngine> {
  if (!browserSupportsLocalAI()) {
    throw new ModelAdapterError('local-service-unavailable', '当前浏览器不支持 WebGPU，请更新 Chrome、Edge 或使用电脑本地部署。');
  }
  if (browserEngine && browserEngineModel === model) return browserEngine;
  if (browserEnginePromise && browserEngineModel === model) return browserEnginePromise;

  browserEngineModel = model;
  browserEnginePromise = import('@mlc-ai/web-llm')
    .then(({ CreateMLCEngine }) => CreateMLCEngine(model, {
      initProgressCallback: (report) => onProgress?.(Math.round(report.progress * 100), report.text),
    }))
    .then((engine) => {
      browserEngine = engine;
      return engine;
    })
    .catch((error) => {
      browserEnginePromise = undefined;
      browserEngine = undefined;
      throw new ModelAdapterError('local-service-unavailable', `浏览器模型加载失败：${safeErrorMessage(error)}`);
    });
  if (!signal) return browserEnginePromise;
  if (signal.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
  return new Promise<MLCEngine>((resolve, reject) => {
    const onAbort = () => reject(new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.')));
    signal.addEventListener('abort', onAbort, { once: true });
    browserEnginePromise!.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

function toBrowserMessages(messages: ModelMessage[]): ChatCompletionMessageParam[] {
  return messages.flatMap((message): ChatCompletionMessageParam[] => {
    if (message.role === 'system') return [{ role: 'system', content: message.content }];
    if (message.role === 'assistant') return [{ role: 'assistant', content: message.content }];
    if (message.role === 'user') return [{ role: 'user', content: message.content }];
    return [];
  });
}

export class BrowserModelAdapter implements ModelAdapter {
  readonly provider = 'Browser WebGPU';
  private readonly config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  async complete(request: ModelRequest, signal?: AbortSignal): Promise<ModelResult> {
    if (signal?.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
    const engine = await prepareBrowserModel(this.config.model, undefined, signal);
    const response = await runWithDeadline(engine.chat.completions.create({
      messages: toBrowserMessages(request.messages),
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false,
    }), this.config.timeoutMs, signal, () => engine.interruptGenerate());
    const content = response.choices[0]?.message?.content;
    if (typeof content !== 'string' || !content) {
      throw new ModelAdapterError('invalid-response', messageForCode('invalid-response', 'Invalid response.'));
    }
    return {
      content,
      model: request.model,
      provider: this.provider,
      finishReason: response.choices[0]?.finish_reason ?? undefined,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  async stream(request: ModelRequest, onToken: (token: string) => void, signal?: AbortSignal): Promise<ModelResult> {
    const engine = await prepareBrowserModel(this.config.model, undefined, signal);
    const chunks = await engine.chat.completions.create({
      messages: toBrowserMessages(request.messages),
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
    });
    let content = '';
    let finishReason: string | undefined;
    let timedOut = false;
    const timeout = globalThis.setTimeout(() => {
      timedOut = true;
      void engine.interruptGenerate();
    }, Math.max(1_000, this.config.timeoutMs));
    const onAbort = () => { void engine.interruptGenerate(); };
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      for await (const chunk of chunks) {
        if (signal?.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
        if (timedOut) throw new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'));
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) {
          content += token;
          onToken(token);
        }
        finishReason = chunk.choices[0]?.finish_reason ?? finishReason;
      }
      if (signal?.aborted) throw new ModelAdapterError('aborted', messageForCode('aborted', 'Generation stopped.'));
      if (timedOut) throw new ModelAdapterError('timeout', messageForCode('timeout', 'Request timed out.'));
    } finally {
      globalThis.clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
    if (!content) throw new ModelAdapterError('invalid-response', messageForCode('invalid-response', 'Invalid response.'));
    return { content, model: request.model, provider: this.provider, finishReason };
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
  if (config.provider === 'browser') return new BrowserModelAdapter(config);
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
