// Nyaumæ sync worker: encrypted key-value persistence for conversations,
// AI config (keyless), comments, likes and reading progress.
//
// Auth: every request carries `Authorization: Bearer <syncKey>`. Data is
// namespaced by SHA-256(syncKey), so the store never sees the raw key, and
// payloads are client-side AES-GCM ciphertext — the worker is blind storage.
//
// Routes:
//   GET  /sync/:key  -> 200 { blob } | 404
//   PUT  /sync/:key  { blob } -> 200 { ok: true }
//   OPTIONS *        -> CORS preflight

const MAX_BLOB_BYTES = 4 * 1024 * 1024;
const MAX_KEY_LENGTH = 128;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function namespaceFor(request) {
  const header = request.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const syncKey = match[1].trim();
  if (syncKey.length < 8 || syncKey.length > 256) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(syncKey));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    const match = /^\/sync\/([^/]+)$/.exec(url.pathname);
    if (!match) {
      return json({ error: 'not-found' }, 404);
    }
    const dataKey = decodeURIComponent(match[1]);
    if (!dataKey || dataKey.length > MAX_KEY_LENGTH) {
      return json({ error: 'bad-key' }, 400);
    }
    const namespace = await namespaceFor(request);
    if (!namespace) {
      return json({ error: 'unauthorized' }, 401);
    }
    const storageKey = `${namespace}:${dataKey}`;

    if (request.method === 'GET') {
      const blob = await env.SYNC_KV.get(storageKey);
      if (blob === null) return json({ error: 'not-found' }, 404);
      return json({ blob });
    }

    if (request.method === 'PUT') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'bad-json' }, 400);
      }
      if (typeof body?.blob !== 'string' || body.blob.length === 0) {
        return json({ error: 'bad-blob' }, 400);
      }
      if (body.blob.length > MAX_BLOB_BYTES) {
        return json({ error: 'too-large' }, 413);
      }
      await env.SYNC_KV.put(storageKey, body.blob);
      return json({ ok: true });
    }

    return json({ error: 'method-not-allowed' }, 405);
  },
};
