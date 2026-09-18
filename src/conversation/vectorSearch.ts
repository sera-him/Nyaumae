import type { AiConfig } from './types.ts';
import { fetchEmbeddings } from './embeddingClient.ts';
import { idbGet, idbSet } from '../lib/idbStorage.ts';

export interface VectorSearchItem {
  id: string;
  text: string;
}

export interface SemanticProvider {
  /** Returns cosine similarity (0..1) per item id, or null when unavailable. */
  rank(query: string, items: VectorSearchItem[]): Promise<Map<string, number> | null>;
}

interface VectorCachePayload {
  signature: string;
  model: string;
  endpoint: string;
  vectors: Record<string, number[]>;
}

const CACHE_PREFIX = 'nyaumae:knowledge-vectors:v1:';
const EMBED_TEXT_LIMIT = 600;
const BATCH_SIZE = 24;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    na += a[index] * a[index];
    nb += b[index] * b[index];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Cheap stable fingerprint so a rebuilt corpus invalidates cached vectors. */
export function corpusSignature(items: VectorSearchItem[]): string {
  let hash = 0x811c9dc5;
  const feed = (value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
  };
  for (const item of items) {
    feed(item.id);
    feed(String(item.text.length));
  }
  feed(String(items.length));
  return (hash >>> 0).toString(36);
}

export function embedTextForItem(item: VectorSearchItem): string {
  return item.text.replace(/\s+/g, ' ').trim().slice(0, EMBED_TEXT_LIMIT);
}

/**
 * BYOK semantic provider: embeds the knowledge corpus once per
 * (endpoint, model, corpus signature), caches vectors in IndexedDB, then
 * answers queries with cosine similarity. Any failure degrades to null so the
 * caller silently falls back to keyword-only retrieval.
 */
export function createEmbeddingSemanticProvider(config: AiConfig): SemanticProvider {
  const endpoint = (config.embeddingBaseUrl || config.baseUrl).trim().replace(/\/+$/, '');
  const model = config.embeddingModel.trim();
  const cacheKey = `${CACHE_PREFIX}${endpoint}::${model}`;
  let vectors: Record<string, number[]> | null = null;
  let signature = '';
  let preparePromise: Promise<boolean> | null = null;
  const queryCache = new Map<string, number[]>();

  async function prepare(items: VectorSearchItem[]): Promise<boolean> {
    const nextSignature = corpusSignature(items);
    if (vectors && signature === nextSignature) return true;
    if (preparePromise && signature === nextSignature) return preparePromise;
    signature = nextSignature;
    preparePromise = (async () => {
      try {
        const cached = await idbGet(cacheKey);
        if (cached) {
          const payload = JSON.parse(cached) as VectorCachePayload;
          if (payload.signature === nextSignature && payload.model === model && payload.endpoint === endpoint && payload.vectors) {
            vectors = payload.vectors;
            return true;
          }
        }
      } catch {
        /* cache unreadable: rebuild */
      }
      const missing = items.filter((item) => !vectors?.[item.id]);
      const nextVectors: Record<string, number[]> = { ...(vectors ?? {}) };
      try {
        for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
          const batch = missing.slice(offset, offset + BATCH_SIZE);
          const embeddings = await fetchEmbeddings(config, batch.map(embedTextForItem));
          batch.forEach((item, index) => {
            nextVectors[item.id] = embeddings[index];
          });
        }
      } catch {
        return false;
      }
      vectors = nextVectors;
      try {
        const payload: VectorCachePayload = { signature: nextSignature, model, endpoint, vectors: nextVectors };
        await idbSet(cacheKey, JSON.stringify(payload));
      } catch {
        /* caching is best-effort */
      }
      return true;
    })().finally(() => {
      preparePromise = null;
    });
    return preparePromise;
  }

  return {
    async rank(query, items) {
      if (!query.trim() || items.length === 0) return null;
      const ready = await prepare(items);
      if (!ready || !vectors) return null;
      const cacheKeyForQuery = query.trim();
      let queryVector = queryCache.get(cacheKeyForQuery);
      if (!queryVector) {
        try {
          [queryVector] = await fetchEmbeddings(config, [cacheKeyForQuery]);
        } catch {
          return null;
        }
        if (queryCache.size > 64) queryCache.clear();
        queryCache.set(cacheKeyForQuery, queryVector);
      }
      const scores = new Map<string, number>();
      for (const item of items) {
        const vector = vectors[item.id];
        if (!vector) continue;
        const score = cosineSimilarity(queryVector, vector);
        if (score > 0) scores.set(item.id, score);
      }
      return scores;
    },
  };
}
