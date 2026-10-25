// Coverage gate for the word-frequency / search corpus.
//
// Two channels feed the engine (src/data/wordFrequencyEngine.ts):
//   A) src/data/fullSearchIndex.ts — hand-registered structured data modules
//      (add()/addEn() calls, content imported from data modules).
//   B) scripts/generate-frequency-corpus.mjs — AST literal scan of
//      SCAN_DIRS + EXTRA_SCAN_FILES, emitted to src/data/generated/frequencyCorpus.ts.
//
// A prose-bearing source file must be covered by at least one channel. Before
// 2026-10-12 nothing enforced this, so ~1.5万汉字 of rendered prose (NCTB v2
// banks, review banks, AI prompt registry, puzzle engines, route manifests…)
// was invisible to both the word-frequency stats and full-text search.
//
// This gate walks ALL of src, measures prose volume per file (AST literals
// only — comments and code cannot leak in), and fails when a substantial
// prose file is covered by neither channel. It also enforces the RED LINE:
// a file DIRECTLY imported by fullSearchIndex must never also be corpus-scanned
// (the engine de-duplicates only byte-identical segments, while manual add()
// emits composite segments, so dual registration double-counts).
//
// Heuristic limits (documented, accepted):
//   - "Covered by channel A" uses fullSearchIndex's *transitive runtime import
//     closure*: the gate cannot tell whether every exported string is actually
//     add()'d, only that the module feeds the index. (Transitive-only members
//     like nctb/questionBank.ts aggregate banks without registering their text;
//     those files are covered by channel B instead.)
//   - Prose volume is measured with the SAME acceptance filters the corpus
//     generator uses (CJK test for zh; EN_PROSE + >=3 words for en), so URLs,
//     class names and storage keys do not count as prose.
//   - Files below the prose threshold are not flagged (isolated UI labels).
//
// Usage: node scripts/verify-corpus-coverage.mjs   (exit 1 on violation)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import {
  SRC,
  SCAN_DIRS,
  EXTRA_SCAN_FILES,
  SKIP_PATH,
  CJK,
  isEnProseLiteral,
  extractLiterals,
  clean,
} from './prose-scan-lib.mjs';

const FSI = join(SRC, 'data/fullSearchIndex.ts');

// Prose volume below which a file is not worth flagging (isolated UI labels).
const ZH_MIN_CHARS = 40;
const EN_MIN_WORDS = 40;

// Files that deliberately carry keyword tables / dev-facing strings / audit
// artifacts rather than visitor-visible prose. Keeping them out of the stats
// is by design.
const IGNORE = [
  [/^lib[\\/]translations[\\/]/, '翻译词典：界面词条，按设计不进词频'],
  [/^lib[\\/]highlightUtils\.tsx$/, '关键词→颜色映射配置（词本身在数据模块计数）'],
  [/^lib[\\/]semanticHighlight\.tsx$/, 'CHAR_KEYWORDS 角色关键词配置'],
  [/^nctb[\\/]validation[\\/]/, '题库开发向校验消息，非访客可见散文'],
  [/^nctb[\\/]generation[\\/]/, '题库开发向工具：AI 生成提示词/审批/JSON schema，非访客可见'],
  [/^nctb[\\/]scoring[\\/]/, '评分键位映射：题目 ID，非散文'],
  [/^data[\\/]segmenterLexicon\.ts$/, '分词词典冻结快照（词表，非散文）'],
  [/^data[\\/]imageInventory\.ts$/, '图片审计产物，无任何渲染引用'],
  [/^lib[\\/]imageHostMap\.ts$/, '图片域名/URL 映射表'],
  [/^lib[\\/]fsiiiTiers\.ts$/, 'FSIII 层级样式配置（Tailwind 类名）'],
  [/^lib[\\/]renderStoryContent\.tsx$/, '故事渲染器：字符串为 CSS 类名/样式值'],
  [/^App\.tsx$/, '应用外壳：事件名与 CSS 类名，无散文'],
  [/^data[\\/]generated[\\/]/, '生成产物（SKIP_PATH 已覆盖，双保险）'],
];

const zhCharCount = (s) => (s.match(/[㐀-䶿一-鿿豈-﫿]/g) || []).length;
const enWordCount = (s) => (s.match(/[A-Za-z]+/g) || []).length;

function* walkAll(dir) {
  let names;
  try { names = readdirSync(dir); } catch { return; }
  for (const name of names) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { yield* walkAll(p); continue; }
    if (/\.(ts|tsx)$/.test(p) && !SKIP_PATH.test(p)) yield p;
  }
}

// ── Import resolution ───────────────────────────────────────────────────────
const IMPORT_RE = /import\s+(type\s+)?([\s\S]*?)from\s+'([^']+)'/g;
const REEXPORT_RE = /export\s+(type\s+)?([\s\S]*?)from\s+'([^']+)'/g;

function resolveSpecifier(spec, importerFile) {
  let base;
  if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(importerFile), spec);
  else return null; // bare package specifier
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }
  return null;
}

function runtimeImportsOf(file) {
  const src = readFileSync(file, 'utf8');
  const out = [];
  for (const [, typeKw, , spec] of src.matchAll(IMPORT_RE)) {
    if (typeKw) continue; // `import type` — no runtime registration
    out.push(spec);
  }
  for (const [, typeKw, , spec] of src.matchAll(REEXPORT_RE)) {
    if (typeKw) continue;
    out.push(spec);
  }
  return out;
}

function buildClosure(rootFile, maxDepth) {
  const closure = new Set();
  const queue = [[rootFile, 0]];
  while (queue.length) {
    const [file, depth] = queue.shift();
    if (closure.has(file) || depth > maxDepth) continue;
    closure.add(file);
    if (depth === maxDepth) continue;
    let specs = [];
    try { specs = runtimeImportsOf(file); } catch { continue; }
    for (const spec of specs) {
      const resolved = resolveSpecifier(spec, file);
      if (resolved && !closure.has(resolved)) queue.push([resolved, depth + 1]);
    }
  }
  return closure;
}

// Channel A, coverage heuristic: transitive closure (depth 4).
const closure = buildClosure(FSI, 4);
// Channel A, red-line precision: what FSI itself imports (depth 1) — only
// these are guaranteed to have their content registered via add()/addEn().
const directImports = buildClosure(FSI, 1);

const extraSet = new Set(EXTRA_SCAN_FILES);
const inScanDirs = (rel) => SCAN_DIRS.some((d) => rel.startsWith(`${d}/`));

// ── Scan every source file ──────────────────────────────────────────────────
const uncovered = [];
const redLine = [];
let scanned = 0;
let coveredCorpus = 0;
let coveredIndex = 0;
let ignored = 0;

for (const file of walkAll(SRC)) {
  scanned += 1;
  const rel = relative(SRC, file).replace(/\\/g, '/');
  const lits = extractLiterals(readFileSync(file, 'utf8'), file).map(clean).filter(Boolean);
  const zhChars = lits.filter((s) => CJK.test(s)).reduce((a, s) => a + zhCharCount(s), 0);
  const enWords = lits.filter(isEnProseLiteral).reduce((a, s) => a + enWordCount(s), 0);

  const inCorpus = inScanDirs(rel) || extraSet.has(rel);
  // fullSearchIndex.ts itself is the registration file — its literals ARE the
  // index content, so it is covered by channel A by definition.
  const inIndex = file === FSI || closure.has(file);
  const ignoreReason = IGNORE.find(([re]) => re.test(rel))?.[1];

  if (inCorpus && directImports.has(file)) {
    redLine.push({ rel, zhChars, enWords });
  } else if (inCorpus) {
    coveredCorpus += 1;
  } else if (inIndex) {
    coveredIndex += 1;
  } else if (ignoreReason) {
    ignored += 1;
  } else if (zhChars >= ZH_MIN_CHARS || enWords >= EN_MIN_WORDS) {
    uncovered.push({ rel, zhChars, enWords });
  }
}

// Stale EXTRA_SCAN_FILES entries (no prose left) are dead weight — warn only.
const staleExtra = [];
for (const rel of EXTRA_SCAN_FILES) {
  const file = join(SRC, rel);
  if (!existsSync(file)) { staleExtra.push(`${rel} (missing on disk)`); continue; }
  const lits = extractLiterals(readFileSync(file, 'utf8'), file).map(clean).filter(Boolean);
  const hasProse = lits.some((s) => CJK.test(s) || isEnProseLiteral(s));
  if (!hasProse) staleExtra.push(`${rel} (no prose literals left)`);
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log('corpus coverage gate');
console.log(`  files scanned:        ${scanned}`);
console.log(`  covered by corpus:    ${coveredCorpus}`);
console.log(`  covered by index:     ${coveredIndex}`);
console.log(`  ignored by design:    ${ignored}`);
console.log(`  uncovered:            ${uncovered.length}`);

if (staleExtra.length) {
  console.log('\nSTALE EXTRA_SCAN_FILES entries (remove or re-check):');
  for (const s of staleExtra) console.log(`  ~ ${s}`);
}

if (redLine.length) {
  console.log('\nRED LINE VIOLATIONS — file is DIRECTLY imported by fullSearchIndex AND corpus-scanned:');
  for (const r of redLine) console.log(`  ! ${r.rel} (zh ${r.zhChars} chars / en ${r.enWords} words)`);
  console.log('  Fix: drop it from EXTRA_SCAN_FILES (keep the fullSearchIndex add() registration),');
  console.log('  or drop the add() registration (keep the corpus scan) — never both.');
}

if (uncovered.length) {
  console.log('\nUNCOVERED prose files (add to EXTRA_SCAN_FILES, register in fullSearchIndex, or IGNORE with a reason):');
  for (const u of uncovered.sort((a, b) => b.zhChars - a.zhChars || b.enWords - a.enWords)) {
    console.log(`  ? ${u.rel} — zh ${u.zhChars} chars / en ${u.enWords} words`);
  }
}

const failed = uncovered.length > 0 || redLine.length > 0;
if (failed) {
  console.log('\nFAILED — see scripts/verify-corpus-coverage.mjs header for the fix playbook.');
  process.exitCode = 1;
} else {
  console.log('\nOK — every substantial prose file is covered exactly once.');
}
