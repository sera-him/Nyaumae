import { existsSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

import { generateSeoFiles } from './generate-seo-files.mjs';

const root = resolve(import.meta.dirname, '..');
const serverDirectory = resolve(root, 'dist', 'server');
const metadataDirectory = resolve(root, 'dist', '.openai');
const hostingSource = resolve(root, '.openai', 'hosting.json');

mkdirSync(serverDirectory, { recursive: true });
mkdirSync(metadataDirectory, { recursive: true });

writeFileSync(resolve(serverDirectory, 'index.js'), `export default {
  async fetch(request, env) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('Static asset binding is unavailable.', { status: 503 });
  },
};
`, 'utf8');

if (existsSync(hostingSource)) {
  copyFileSync(hostingSource, resolve(metadataDirectory, 'hosting.json'));
}

/**
 * Prune original raster sources that already have responsive variants in
 * dist/optimized/. The site always serves the optimized AVIF/WebP files first
 * (ResponsiveImage renders <picture> sources), so shipping the multi-megabyte
 * originals only bloats every deploy. They stay in public/ for local dev and
 * as the variant-generation source; the deployed fallback chain simply skips
 * straight from optimized variants to the shared backup image.
 */
function pruneOriginalsWithVariants() {
  const manifestPath = resolve(root, 'dist', 'optimized', 'manifest.json');
  if (!existsSync(manifestPath)) return { pruned: 0, savedBytes: 0 };

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    return { pruned: 0, savedBytes: 0 };
  }

  let pruned = 0;
  let savedBytes = 0;
  for (const [reference, entry] of Object.entries(manifest)) {
    const widths = Array.isArray(entry?.widths) ? entry.widths : [];
    if (widths.length === 0) continue;
    const originalPath = resolve(root, 'dist', reference.replace(/^\/+/, ''));
    if (!existsSync(originalPath)) continue;
    try {
      savedBytes += statSync(originalPath).size;
      rmSync(originalPath);
      pruned += 1;
    } catch {
      // Never fail the deploy pipeline over pruning.
    }
  }

  // Remove directories left empty by pruning so the upload stays tidy.
  const distRoot = resolve(root, 'dist');
  const pruneEmptyDirs = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = join(dir, entry.name);
      pruneEmptyDirs(child);
      try {
        if (readdirSync(child).length === 0) rmSync(child, { recursive: true });
      } catch {
        // ignore
      }
    }
  };
  pruneEmptyDirs(distRoot);

  if (pruned > 0) {
    const savedMb = (savedBytes / (1024 * 1024)).toFixed(1);
    console.log(`prepare-sites: pruned ${pruned} originals with optimized variants (saved ${savedMb} MB)`);
  }
  return { pruned, savedBytes };
}

pruneOriginalsWithVariants();
await generateSeoFiles();
