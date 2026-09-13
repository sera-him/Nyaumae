import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('hybridSearch module exists and exports hybridSearch', () => {
  const src = readFileSync('src/lib/hybridSearch.ts', 'utf-8');
  assert.match(src, /export function hybridSearch/);
});

test('storageSync has versioned migration + import guards', () => {
  const src = readFileSync('src/lib/storageSync.ts', 'utf-8');
  assert.match(src, /STORAGE_EXPORT_VERSION/);
  assert.match(src, /unsupported-storage-version/);
  assert.match(src, /migrateVersioned/);
});

test('cloudSync covers comments/likes/progress', () => {
  const src = readFileSync('src/lib/cloudSync.ts', 'utf-8');
  assert.match(src, /addComment/);
  assert.match(src, /toggleLike/);
  assert.match(src, /saveProgress/);
});

test('i18n defaults to zh-CN with en toggle', () => {
  const src = readFileSync('src/lib/i18n.ts', 'utf-8');
  assert.match(src, /zh-CN/);
  assert.match(src, /'en'|"en"/);
  const html = readFileSync('index.html', 'utf-8');
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /feed\.xml/);
});

test('site language switch translates the rendered page instead of reloading', () => {
  const dict = readFileSync('src/lib/translations/dictionary.ts', 'utf-8');
  assert.match(dict, /EXACT_TRANSLATIONS/);
  assert.match(dict, /PHRASE_TRANSLATIONS/);

  const translator = readFileSync('src/lib/translations/pageTranslator.ts', 'utf-8');
  assert.match(translator, /export function startPageTranslation/);
  assert.match(translator, /MutationObserver/);
  assert.match(translator, /data-no-translate/);
  // Bare glyphs must never be swapped: split-rendered prose would break.
  assert.match(translator, /trimmed\.length < 2/);

  const aids = readFileSync('src/components/SiteAids.tsx', 'utf-8');
  assert.match(aids, /startPageTranslation/);
  assert.doesNotMatch(aids, /location\.reload\(\)/);
});

test('canon review flow wraps guard', () => {
  const src = readFileSync('src/conversation/canonReview.ts', 'utf-8');
  assert.match(src, /canonGuard/);
  assert.match(src, /recordDecision/);
});
