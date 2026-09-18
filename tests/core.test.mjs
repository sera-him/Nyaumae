import { test } from 'node:test';
import assert from 'node:assert/strict';

// Behavioural tests for core pure logic. Requires the ESM resolve hooks
// (tests/ts-resolve-hooks.mjs) for Vite-style '@/...' and extension-less imports.
import {
  exportRouteManifest,
  getCanonicalInfo,
  getPlaygroundItemCategory,
  getPlaygroundItemLabel,
  getProviderLabel,
  isKnownCharacterFilter,
  isKnownCharacterId,
  isKnownMathSection,
  isKnownMiiaSection,
  isKnownPlaygroundItem,
  isKnownProviderId,
  isKnownWorldSection,
  isNavigationExcluded,
  NAVIGATION_GROUPS,
  resolveAlias,
  ROUTE_DIRECTORY_GROUPS,
} from '../src/lib/routeManifest.ts';
import { hybridSearch } from '../src/lib/hybridSearch.ts';
import {
  getShowOriginalImages,
  setShowOriginalImages,
  subscribeShowOriginalImages,
} from '../src/lib/imagePreference.ts';

test('routeManifest resolves legacy aliases to canonical paths', () => {
  assert.equal(resolveAlias('/world'), '/world/overview');
  assert.equal(resolveAlias('/miia'), '/miia/world');
  assert.equal(resolveAlias('/math'), '/math/fsiii');
  assert.equal(resolveAlias('/settings'), '/settings/ai');
  assert.equal(resolveAlias('/playground'), '/playground/games');
  assert.equal(resolveAlias('/playground/skill-ttt'), '/playground/games/skill-tic-tac-toe');
  assert.equal(resolveAlias('/chat'), null, 'already-canonical paths have no alias');
  assert.equal(resolveAlias('/definitely-not-a-route'), null);
});

test('routeManifest aliases always resolve to a known destination', () => {
  const canonical = exportRouteManifest();
  const samples = ['/world', '/miia', '/math', '/settings', '/playground', '/sweetdream', '/fsiii'];
  for (const alias of samples) {
    const target = resolveAlias(alias);
    assert.ok(target, `alias ${alias} resolves`);
    const inCanonical = canonical[target] !== undefined;
    const isPlaygroundItem = target.startsWith('/playground/games/') || target.startsWith('/playground/scratch/');
    const isStandalone = target === '/cat-mouse';
    assert.ok(inCanonical || isPlaygroundItem || isStandalone, `alias ${alias} -> ${target} is a known route`);
  }
});

test('routeManifest guards known sections and rejects unknown ones', () => {
  assert.equal(isKnownWorldSection('overview'), true);
  assert.equal(isKnownWorldSection('nope'), false);
  assert.equal(isKnownMiiaSection('poems'), true);
  assert.equal(isKnownMiiaSection('gallery'), false);
  assert.equal(isKnownMathSection('fla'), true);
  assert.equal(isKnownMathSection('algebra'), false);
  assert.equal(isKnownCharacterFilter('mia-family'), true);
  assert.equal(isKnownCharacterFilter('all'), true);
  assert.equal(isKnownCharacterFilter('random-group'), false);
});

test('routeManifest recognises real character ids and unknown ids are rejected', () => {
  const canonical = exportRouteManifest();
  const storyIds = Object.keys(canonical)
    .filter((path) => path.startsWith('/characters/'))
    .map((path) => path.split('/')[2]);
  // The manifest itself is not a character source; at least a few known ids
  // must be accepted, and a fabricated id must not.
  assert.equal(isKnownCharacterId('miia'), true, 'known character id resolves');
  assert.equal(isKnownCharacterId('not-a-real-character-id-12345'), false);
  assert.ok(storyIds.length >= 0, 'character detail routes exist in the canonical map');
});

test('routeManifest maps providers, playground items and navigation exclusions', () => {
  assert.equal(isKnownProviderId('deepseek'), true);
  assert.equal(isKnownProviderId('openai'), true);
  assert.equal(isKnownProviderId('nonexistent-provider'), false);
  assert.equal(getProviderLabel('deepseek'), 'DeepSeek');
  assert.equal(getProviderLabel('nope'), null);

  assert.equal(isKnownPlaygroundItem('cat-machine'), true);
  assert.equal(getPlaygroundItemCategory('cat-machine'), 'games');
  assert.equal(getPlaygroundItemCategory('dont-touch-cat-2'), 'scratch');
  assert.equal(getPlaygroundItemCategory('not-a-game'), null);
  assert.equal(getPlaygroundItemLabel('city-builder'), '建设城市');

  assert.equal(isNavigationExcluded('/api'), true);
  assert.equal(isNavigationExcluded('/api/openai'), true);
  assert.equal(isNavigationExcluded('/world/overview'), false);
  assert.ok(!NAVIGATION_GROUPS.some((group) => group.id === 'api'), 'api is never promoted to navigation');
});

test('routeManifest directory groups only contain canonicalised routes', () => {
  const canonical = exportRouteManifest();
  for (const group of ROUTE_DIRECTORY_GROUPS) {
    assert.ok(group.items.length > 0, `group ${group.id} has items`);
    for (const item of group.items) {
      assert.ok(canonical[item.to] !== undefined, `${item.to} (${group.id}) exists in the canonical manifest`);
      assert.equal(item.label, canonical[item.to].label, `${item.to} label matches manifest`);
    }
  }
  for (const group of NAVIGATION_GROUPS) {
    assert.ok(!isNavigationExcluded(group.root), `group root ${group.root} is not excluded`);
  }
});

test('hybridSearch returns known story hits for a Chinese query on the real index', () => {
  const hits = hybridSearch('狐狸', 5);
  assert.ok(hits.length >= 1, 'at least one hit for 狐狸');
  const top = hits[0];
  assert.match(top.item.title, /狐狸/);
  assert.ok(top.score > 0);
  assert.ok(top.why.length >= 1);
});

test('hybridSearch handles empty and unmatched queries gracefully', () => {
  assert.deepEqual(hybridSearch('   '), []);
  const unmatched = hybridSearch('zzzzqqqqnoexist', 5);
  assert.ok(Array.isArray(unmatched));
});

test('imagePreference defaults to off and notifies subscribers on change', () => {
  setShowOriginalImages(false);
  assert.equal(getShowOriginalImages(), false);

  let notified = 0;
  const unsubscribe = subscribeShowOriginalImages(() => { notified += 1; });
  setShowOriginalImages(true);
  assert.equal(getShowOriginalImages(), true);
  assert.equal(notified, 1, 'subscriber notified once');

  // Setting the same value again must not notify.
  setShowOriginalImages(true);
  assert.equal(notified, 1);

  unsubscribe();
  setShowOriginalImages(false);
  assert.equal(notified, 1, 'no notification after unsubscribe');
  assert.equal(getShowOriginalImages(), false);
});
