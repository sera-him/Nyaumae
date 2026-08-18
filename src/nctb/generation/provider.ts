export interface NctbAiRequest {
  system: string;
  user: string;
}

export interface NctbAiProvider {
  readonly id: string;
  completeJson(request: NctbAiRequest): Promise<unknown>;
}

export interface OpenAiCompatibleProviderConfig {
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function extractContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') throw new Error('AI response is not an object.');
  const choices = Reflect.get(payload, 'choices');
  if (!Array.isArray(choices) || choices.length === 0) throw new Error('AI response has no choices.');
  const message = choices[0] && typeof choices[0] === 'object' ? Reflect.get(choices[0], 'message') : undefined;
  const content = message && typeof message === 'object' ? Reflect.get(message, 'content') : undefined;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI response has no JSON text content.');
  return content;
}

export function createOpenAiCompatibleProvider(config: OpenAiCompatibleProviderConfig): NctbAiProvider {
  return {
    id: config.id,
    async completeJson(request: NctbAiRequest): Promise<unknown> {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), config.timeoutMs ?? 90_000);
      try {
        const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.25,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: request.system },
              { role: 'user', content: request.user },
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}.`);
        return JSON.parse(extractContent(await response.json())) as unknown;
      } finally {
        globalThis.clearTimeout(timeout);
      }
    },
  };
}
