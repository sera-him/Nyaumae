import assert from 'node:assert/strict';

class MemoryStorage {
  values = new Map();
  rejectWrites = false;

  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  removeItem(key) {
    if (this.rejectWrites) throw new DOMException('Blocked', 'SecurityError');
    this.values.delete(key);
  }
  setItem(key, value) {
    if (this.rejectWrites) throw new DOMException('Full', 'QuotaExceededError');
    this.values.set(key, String(value));
  }
}

class TestWindow extends EventTarget {
  localStorage = new MemoryStorage();
  sessionStorage = new MemoryStorage();
}

if (typeof CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  };
}
globalThis.window = new TestWindow();

const {
  BROWSER_STORAGE_ISSUE_EVENT,
  readJsonStorage,
  readStorageValue,
  removeStorageValue,
  writeJsonStorage,
  writeStorageValue,
} = await import('../src/lib/browserStorage.ts');

const issues = [];
window.addEventListener(BROWSER_STORAGE_ISSUE_EVENT, (event) => issues.push(event.detail));

assert.equal(writeJsonStorage('normal', { ok: true }).persisted, true);
assert.deepEqual(readJsonStorage('normal', { ok: false }).value, { ok: true });

window.localStorage.setItem('corrupt', '{not-json');
const corrupt = readJsonStorage('corrupt', { safe: true });
assert.equal(corrupt.status, 'corrupt');
assert.deepEqual(corrupt.value, { safe: true });
assert.equal(issues.at(-1)?.code, 'corrupt-data');

window.localStorage.setItem('legacy', JSON.stringify({ schemaVersion: 0, name: 'old' }));
const migrated = readJsonStorage('legacy', { schemaVersion: 1, name: '' }, {
  currentVersion: 1,
  migrations: { 0: (value) => ({ ...value, schemaVersion: 1, migrated: true }) },
  validate: (value) => Boolean(value && typeof value === 'object' && value.schemaVersion === 1),
});
assert.equal(migrated.status, 'migrated');
assert.equal(migrated.value.migrated, true);

window.localStorage.rejectWrites = true;
const quotaWrite = writeStorageValue('quota', 'kept-in-memory');
assert.equal(quotaWrite.persisted, false);
assert.equal(quotaWrite.issue?.code, 'quota-exceeded');
assert.equal(readStorageValue('quota').value, 'kept-in-memory');
window.localStorage.rejectWrites = false;

writeStorageValue('remove-me', 'yes');
removeStorageValue('remove-me');
assert.equal(readStorageValue('remove-me').value, null);

console.log('resilience smoke: 5/5 passed');
