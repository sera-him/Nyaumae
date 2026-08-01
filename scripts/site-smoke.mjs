const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const REQUEST_TIMEOUT_MS = 8_000;

const ROUTES = [
  { label: '首页', path: '/' },
  { label: '世界', path: '/world/overview' },
  { label: '角色', path: '/characters/all' },
  { label: '故事', path: '/stories' },
  { label: '咪呀空间', path: '/miia/world' },
  { label: '数学模型', path: '/math/fsiii' },
  { label: '游戏', path: '/playground/games' },
  { label: '聊天', path: '/chat' },
  { label: 'AI 设置', path: '/settings/ai' },
  { label: 'SweetDream', path: '/sweetdream' },
  { label: '404 路由', path: '/__site-smoke__-not-found' },
];

const EXPECTED_MARKERS = [
  { label: 'HTML 文档', pattern: /<!doctype\s+html/i },
  { label: '应用挂载点', pattern: /id=["']root["']/i },
  { label: '站点标题', pattern: /Neural Connection/i },
];

function printUsage() {
  console.log('用法: node scripts/site-smoke.mjs [base-url]');
  console.log(`默认地址: ${DEFAULT_BASE_URL}`);
}

function parseBaseUrl(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return null;
  }

  const equalsFlag = argv.find((argument) => argument.startsWith('--base-url='));
  const flagIndex = argv.indexOf('--base-url');
  const positional = argv.find((argument) => !argument.startsWith('-'));
  const rawUrl = equalsFlag
    ? equalsFlag.slice('--base-url='.length)
    : flagIndex >= 0
      ? argv[flagIndex + 1]
      : positional || DEFAULT_BASE_URL;

  if (!rawUrl) throw new Error('--base-url 后需要提供地址。');

  const baseUrl = new URL(rawUrl);
  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    throw new Error('base URL 必须使用 http:// 或 https://。');
  }

  baseUrl.hash = '';
  return baseUrl;
}

function routeUrl(baseUrl, routePath) {
  const url = new URL(baseUrl);
  url.hash = routePath === '/' ? '#/' : `#${routePath}`;
  return url;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: { accept: 'text/html' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRoute(baseUrl, route) {
  const url = routeUrl(baseUrl, route.path);
  const startedAt = Date.now();

  try {
    const response = await fetchWithTimeout(url);
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const failures = [];

    if (response.status !== 200) {
      failures.push(`HTTP ${response.status}（预期 200）`);
    }
    if (!contentType.toLowerCase().includes('text/html')) {
      failures.push(`Content-Type 为 ${contentType || '未提供'}（预期 HTML）`);
    }
    for (const marker of EXPECTED_MARKERS) {
      if (!marker.pattern.test(body)) failures.push(`缺少标志：${marker.label}`);
    }

    return {
      route,
      ok: failures.length === 0,
      failures,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      route,
      ok: false,
      failures: [error.name === 'AbortError' ? `请求超过 ${REQUEST_TIMEOUT_MS}ms` : error.message],
      status: 'ERR',
      elapsedMs: Date.now() - startedAt,
    };
  }
}

async function main() {
  const baseUrl = parseBaseUrl(process.argv.slice(2));
  if (!baseUrl) return;

  console.log(`Site smoke: ${baseUrl.origin}`);
  console.log('检查应用壳、主要 HashRouter 路由和客户端 404 路由的 HTTP 200 响应。');

  const results = [];
  for (const route of ROUTES) {
    results.push(await checkRoute(baseUrl, route));
  }
  let passed = 0;

  for (const result of results) {
    if (result.ok) passed += 1;
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.route.label} ${result.route.path} [${result.status}] ${result.elapsedMs}ms`);
    for (const failure of result.failures) console.log(`  - ${failure}`);
  }

  console.log(`${passed}/${results.length} 路由检查通过。`);
  if (passed !== results.length) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(`Site smoke 无法运行：${error.message}`);
  printUsage();
  process.exitCode = 1;
}
