const CACHE_PREFIX = 'neural-connection-';
const CACHE_VERSION = 'v11';
const PRECACHE_NAME = `${CACHE_PREFIX}precache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const CURRENT_CACHE_NAMES = [PRECACHE_NAME, STATIC_CACHE_NAME];
const OFFLINE_FALLBACK_URL = '/index.html';
const MAX_STATIC_ENTRIES = 80;

const STATIC_ASSETS = [
  '/',
  OFFLINE_FALLBACK_URL,
  '/manifest.json',
];

const STATIC_ASSET_PATTERN = /\.(?:css|js)$/i;

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isCacheableStaticAsset(request) {
  if (!isSameOrigin(request)) return false;

  const url = new URL(request.url);
  return request.destination === 'script'
    || request.destination === 'style'
    || STATIC_ASSET_PATTERN.test(url.pathname);
}

function isSuccessfulStaticResponse(response) {
  return Boolean(response)
    && response.status === 200
    && response.type === 'basic';
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const staleRequests = requests.slice(0, Math.max(0, requests.length - maxEntries));

  await Promise.all(staleRequests.map((request) => cache.delete(request)));
}

async function storeStaticAsset(request, response) {
  if (!isSuccessfulStaticResponse(response)) return;

  const cache = await caches.open(STATIC_CACHE_NAME);
  await cache.put(request, response);
  await trimCache(STATIC_CACHE_NAME, MAX_STATIC_ENTRIES);
}

async function networkFirstNavigation(event) {
  try {
    const response = await fetch(event.request);

    // Cache only successful same-origin HTML. Failed responses must never
    // replace the offline shell with an error page.
    if (response.ok && response.type === 'basic') {
      event.waitUntil(
        caches.open(PRECACHE_NAME).then((cache) => (
          cache.put(OFFLINE_FALLBACK_URL, response.clone())
        ))
      );
    }

    return response;
  } catch {
    return caches.match(OFFLINE_FALLBACK_URL);
  }
}

async function cacheFirstStaticAsset(event) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(event.request);
  if (cached) return cached;

  try {
    const response = await fetch(event.request);

    // Only JS/CSS assets reach this function. Images, video, audio, API
    // responses, opaque responses, and failures are deliberately not cached.
    if (isSuccessfulStaticResponse(response)) {
      event.waitUntil(storeStaticAsset(event.request, response.clone()));
    }

    return response;
  } catch {
    // Let the browser surface a failed asset request when no cached copy is
    // available. The document-level offline fallback is handled above.
    return Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHE_NAMES.includes(name))
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isSameOrigin(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (isCacheableStaticAsset(request)) {
    event.respondWith(cacheFirstStaticAsset(event));
  }
});
