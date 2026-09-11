/**
 * Builds public/fonts.css + public/fonts/*.woff2 from the installed
 * @fontsource packages (self-hosted replacement for fonts.googleapis.com).
 *
 * The generated stylesheet is loaded ASYNC (media="print" onload swap in
 * index.html) so the unicode-range @font-face sheet never blocks first
 * paint; font-display: swap shows text in the fallback face until the needed
 * slices arrive. Only the woff2 slices whose unicode-range matches rendered
 * text are ever downloaded by the browser.
 *
 * Size trims applied here (2026-09):
 * - Latin-only families (JetBrains Mono, Quicksand) keep just their `latin`
 *   subset; cyrillic/greek/vietnamese/latin-ext blocks and slices are dropped
 *   (U+0000-00FF covers the site's Latin needs, including "æ" in nyaumæ).
 * - CJK families keep every numbered slice: AI chat and reader content can
 *   render any Han codepoint, and unicode-range slicing already means
 *   untouched slices are never downloaded.
 * - Dead `.woff` fallback URLs are stripped (woff2 support is universal
 *   among the site's browsers), and the sheet is minified.
 *
 * Derived artifacts are gitignored (public/fonts.css, public/fonts/); this
 * script runs before both `dev` and `build`.
 */
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const publicDir = resolve(root, 'public');
const fontsDir = resolve(publicDir, 'fonts');

// Weight audit (2026-09): CSS/TSX only use 400/500/600/650/700/750.
// 600/650 snap up to 700 and 750 snaps down per CSS font matching, so the
// 600 cuts of the two heavy CJK families are omitted.
const FONT_RULES = [
  ['@fontsource/noto-sans-sc', [400, 500, 700]],
  ['@fontsource/noto-serif-sc', [400, 600]],
  ['@fontsource/jetbrains-mono', [400, 500, 700], { latinOnly: true }],
  ['@fontsource/quicksand', [400, 600, 700], { latinOnly: true }],
  ['@fontsource/zcool-kuaile', [400]],
  ['@fontsource/ma-shan-zheng', [400]],
];

// Subset tags that `latinOnly` filters out of a fontsource block's URL.
const NON_LATIN_SUBSET = /-(?:cyrillic(?:-ext)?|greek(?:-ext)?|vietnamese|latin-ext)-/;

// One fontsource entry: "/* family-subset-weight-style */ @font-face { ... }".
const BLOCK_PATTERN = /\/\*[^*]*\*\/\s*@font-face\s*\{[^}]*\}/g;
// Dead woff fallback in `src: url(...woff2) format('woff2'), url(...woff) format('woff')`.
const WOFF_FALLBACK_PATTERN = /, url\(\.\/files\/[^)]+\.woff\) format\('woff'\)/;

function minifyBlock(block) {
  let body = block.replace(/\/\*[^*]*\*\//, '').trim();
  body = body.replace(WOFF_FALLBACK_PATTERN, '');
  body = body.replaceAll('url(./files/', 'url(/fonts/');
  body = body.replace(/\s+/g, ' ');
  body = body.replace(/\s*([{}:;,])\s*/g, '$1');
  return body;
}

function generate() {
  mkdirSync(fontsDir, { recursive: true });
  const blocks = [];
  const referenced = new Set();
  let droppedBlocks = 0;

  for (const [pkg, weights, options] of FONT_RULES) {
    for (const weight of weights) {
      const cssPath = resolve(root, 'node_modules', pkg, `${weight}.css`);
      let css;
      try {
        css = readFileSync(cssPath, 'utf-8');
      } catch {
        console.warn(`generate-font-css: missing ${pkg}/${weight}.css, skipped`);
        continue;
      }

      const kept = [];
      for (const block of css.match(BLOCK_PATTERN) ?? []) {
        if (options?.latinOnly && NON_LATIN_SUBSET.test(block)) {
          droppedBlocks += 1;
          continue;
        }
        const minified = minifyBlock(block);
        for (const match of minified.matchAll(/url\(\/fonts\/([^)]+\.woff2)\)/g)) {
          const fileName = match[1];
          if (!referenced.has(fileName)) {
            referenced.add(fileName);
            copyFileSync(resolve(root, 'node_modules', pkg, 'files', fileName), resolve(fontsDir, fileName));
          }
        }
        kept.push(minified);
      }
      if (kept.length > 0) {
        blocks.push(`/* ${pkg} ${weight} */\n${kept.join('\n')}`);
      }
    }
  }

  const output = blocks.join('\n') + '\n';
  writeFileSync(resolve(publicDir, 'fonts.css'), output, 'utf-8');

  // Remove stale slices whose weights/subsets were trimmed, so dist never
  // ships woff2 files the stylesheet no longer references. If the environment
  // blocks bulk deletes, keep going — orphans are harmless, just wasted bytes.
  let removed = 0;
  try {
    for (const entry of readdirSync(fontsDir)) {
      if (entry.endsWith('.woff2') && !referenced.has(entry)) {
        unlinkSync(resolve(fontsDir, entry));
        removed += 1;
      }
    }
  } catch (error) {
    console.warn(`generate-font-css: could not prune stale woff2 (${error.message.split('\n')[0]}); orphan files kept`);
  }

  const kb = (statSync(resolve(publicDir, 'fonts.css')).size / 1024).toFixed(1);
  console.log(`generate-font-css: ${referenced.size} woff2 slices referenced (${droppedBlocks} non-latin blocks dropped), ${removed} stale slices pruned, fonts.css ${kb} KB`);
}

generate();
