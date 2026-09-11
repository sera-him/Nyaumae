/**
 * Zero-dependency static server for dist/ — used as the deploy start command.
 *
 * Why not `vite preview`: the publishing sandbox exposes a single HTTP port and
 * runs one start command, and a production build is what we want to serve.
 * This server:
 *   - builds dist/ first when it is missing (the deploy upload may exclude it),
 *   - serves the prerendered route folders (dist/<route>/index.html),
 *   - falls back to dist/index.html for unknown SPA paths,
 *   - sets long-lived immutable caching for hashed assets,
 *   - listens on $PORT and 0.0.0.0 as required by the sandbox.
 *
 * Usage: node scripts/serve-dist.mjs
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const distDir = join(root, 'dist');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

const IMMUTABLE_PREFIXES = ['/assets/', '/fonts/', '/optimized/'];

function ensureBuild() {
  const indexHtml = join(distDir, 'index.html');
  if (existsSync(indexHtml)) {
    console.log('[serve-dist] dist/ 已存在，直接使用');
    return;
  }
  console.log('[serve-dist] dist/ 缺失，先执行生产构建…');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0 || !existsSync(indexHtml)) {
    console.error('[serve-dist] 构建失败，服务无法启动');
    process.exit(1);
  }
}

function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const safe = normalize(clean).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(distDir, safe);

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  // Prerendered route folders: /characters/miia -> dist/characters/miia/index.html
  const asDirectory = join(candidate, 'index.html');
  if (existsSync(asDirectory)) return asDirectory;
  // Directory-style path with trailing slash
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const indexPath = join(candidate, 'index.html');
    if (existsSync(indexPath)) return indexPath;
  }
  const hasExtension = extname(safe) !== '';
  if (hasExtension) return null;
  return join(distDir, 'index.html'); // SPA fallback
}

ensureBuild();

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const target = resolveTarget(url.pathname);

  if (!target) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('404 Not Found');
    return;
  }

  let body;
  try {
    body = readFileSync(target);
  } catch {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('500 Internal Server Error');
    return;
  }

  const extension = extname(target).toLowerCase();
  const headers = {
    'content-type': MIME[extension] || 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  };
  if (IMMUTABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  } else if (extension === '.html') {
    headers['cache-control'] = 'public, max-age=0, must-revalidate';
  } else {
    headers['cache-control'] = 'public, max-age=3600';
  }

  response.writeHead(200, headers);
  response.end(body);
});

server.listen(port, host, () => {
  console.log(`[serve-dist] listening on http://${host}:${port} (dist=${distDir})`);
});
