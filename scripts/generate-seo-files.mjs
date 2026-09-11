/**
 * Generates SEO entry points into dist/ after `vite build`:
 *
 *  - sitemap.xml  — every canonical route (single source: src/lib/routeManifest.ts)
 *  - robots.txt   — allow all, sitemap reference
 *  - <route>/index.html for every static canonical route: a copy of the app shell
 *    with route-specific <title>/description/OG tags. Crawlers and social cards
 *    therefore see real metadata even before JavaScript runs, while users still
 *    get the SPA. (Cloudflare Pages serves its SPA fallback for paths that have
 *    no directory here, so BrowserRouter deep links keep working.)
 *
 * Route titles/descriptions come from RouteMetadata.getPageMetadata via esbuild
 * bundling (see scripts/seo-route-source.ts) so build-time metadata can never
 * drift from what the running app writes into document.head.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const dist = resolve(root, 'dist');

const FALLBACK_SITE_URL = 'https://zhi-yi-dialogue-os.nyaumae.chatgpt.site/';
const OG_IMAGE = '/icons/icon-512x512.png';

async function loadRouteSource() {
  const outfile = resolve(root, 'tmp', 'seo-route-source.bundle.mjs');
  mkdirSync(dirname(outfile), { recursive: true });
  await build({
    entryPoints: [resolve(scriptDir, 'seo-route-source.ts')],
    bundle: true,
    format: 'esm',
    outfile,
    platform: 'node',
    logLevel: 'silent',
  });
  return import(pathToFileURL(outfile).href);
}

function extractSiteUrl(template) {
  const match = template.match(/<meta\s+property="og:url"\s+content="([^"]+)"/);
  if (!match) return FALLBACK_SITE_URL;
  try {
    const origin = new URL(match[1]).origin;
    return origin.endsWith('/') ? origin : `${origin}/`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function replaceTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function siteUrlJoin(siteUrl, route) {
  return `${siteUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`;
}

function routeHtml(template, siteUrl, meta) {
  const canonicalUrl = siteUrlJoin(siteUrl, meta.canonicalPath);
  let output = template;
  output = replaceTag(output, /<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`);
  output = replaceTag(
    output,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${meta.description}" />`,
  );
  output = replaceTag(output, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${meta.title}" />`);
  output = replaceTag(output, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${meta.description}" />`);
  output = replaceTag(output, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  output = replaceTag(output, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${meta.title}" />`);
  output = replaceTag(output, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${meta.description}" />`);
  output = replaceTag(output, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  // The build-time template ships no robots meta; add one so noindex routes stay out of indexes.
  output = replaceTag(
    output,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />\n    <meta name="robots" content="${meta.noIndex ? 'noindex,follow' : 'index,follow'}" />`,
  );
  if (!output.includes('og:image')) {
    const ogImage = siteUrlJoin(siteUrl, meta.image ?? OG_IMAGE);
    output = output.replace(
      /<meta\s+property="og:url"[^\n]*\n/,
      (line) => `${line}    <meta property="og:image" content="${ogImage}" />\n    <meta name="twitter:image" content="${ogImage}" />\n`,
    );
  }
  return output;
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function generateSeoFiles() {
  if (!exists(dist)) {
    console.log('generate-seo: dist missing, skipped');
    return { pages: 0 };
  }

  const template = readFileSync(resolve(dist, 'index.html'), 'utf-8');
  const siteUrl = extractSiteUrl(template);
  const { routeManifest, getPageMetadata } = await loadRouteSource();

  const routes = Object.keys(routeManifest());
  const staticRoutes = routes.filter((route) => !route.includes('?'));

  let pages = 0;
  for (const route of staticRoutes) {
    const meta = getPageMetadata(route);
    if (!meta || meta.noIndex) continue;
    const html = routeHtml(template, siteUrl, meta);
    const outDir = resolve(dist, meta.canonicalPath.replace(/^\/+/, ''));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
    pages += 1;
  }

  const sitemapEntries = routes.map((route) => {
    const location = siteUrlJoin(siteUrl, route);
    const lastmod = new Date().toISOString().slice(0, 10);
    return `  <url><loc>${escapeXml(location)}</loc><lastmod>${lastmod}</lastmod></url>`;
  });
  writeFileSync(
    resolve(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>\n`,
    'utf-8',
  );

  writeFileSync(
    resolve(dist, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
    'utf-8',
  );

  const feedItems = staticRoutes
    .filter((route) => !getPageMetadata(route)?.noIndex)
    .slice(0, 50)
    .map((route) => {
      const meta = getPageMetadata(route);
      const link = siteUrlJoin(siteUrl, route);
      return `  <item><title>${escapeXml(meta.title)}</title><link>${escapeXml(link)}</link><guid>${escapeXml(link)}</guid><description>${escapeXml(meta.description)}</description></item>`;
    });
  writeFileSync(
    resolve(dist, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Neural Connection</title><link>${escapeXml(siteUrl)}</link><description>nyaumae 的故事宇宙更新</description>\n${feedItems.join('\n')}\n</channel></rss>\n`,
    'utf-8',
  );

  console.log(`generate-seo: ${pages} route pages, sitemap with ${routes.length} URLs`);
  return { pages };
}

function exists(path) {
  try {
    readFileSync(resolve(path, 'index.html'));
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  generateSeoFiles().catch((error) => {
    console.error('generate-seo failed:', error);
    process.exitCode = 1;
  });
}
