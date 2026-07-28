import type { Message, ModelMessage } from './types.ts';

export function createId(prefix = 'id'): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}_${uuid}` : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function estimateTokens(value: string | ModelMessage[] | Message[]): number {
  if (typeof value === 'string') return Math.max(1, Math.ceil(Array.from(value).length / 3));
  return Math.max(1, value.reduce((total, item) => total + estimateTokens(item.content), 0));
}

export function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

export function truncateText(value: string, maxCharacters: number): string {
  if (Array.from(value).length <= maxCharacters) return value;
  return `${Array.from(value).slice(0, Math.max(0, maxCharacters - 1)).join('')}…`;
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
    || error instanceof Error && error.name === 'AbortError';
}
