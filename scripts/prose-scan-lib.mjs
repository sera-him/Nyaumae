// Shared prose-scanning primitives for the frequency-corpus pipeline.
// Used by BOTH scripts/generate-frequency-corpus.mjs (producer) and
// scripts/verify-corpus-coverage.mjs (coverage gate) so the two can never
// drift apart: whatever the producer scans, the gate checks.
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// scripts/prose-scan-lib.mjs -> <repo>/src
export const SRC = resolve(fileURLToPath(import.meta.url), '../../src');

// Directories that hold rendered prose but are NOT already structured-indexed.
export const SCAN_DIRS = [
  'sections',
  'pages',
  'components',
  'nctb/interactive',
];

// Individual files outside SCAN_DIRS that carry rendered prose and are NOT
// imported by src/data/fullSearchIndex.ts (verified 2026-10-12 — see
// scripts/verify-corpus-coverage.mjs, which fails when a prose-bearing file is
// covered by neither channel).
//
// RED LINE: a file must never be both manually add()'d in fullSearchIndex and
// scanned here. The engine de-duplicates only byte-identical segments, while a
// manual add() emits composite segments (e.g. storyText split per line) that
// never match the corpus literals — double registration double-counts.
// pacificIslands.en.ts / hyperCommunication.en.tsx are deliberately absent:
// fullSearchIndex imports and registers them directly (replacing the old
// hand-written condensed shadow entries).
export const EXTRA_SCAN_FILES = [
  'data/miiaMathNotes.en.ts',
  'nctb/review/formal-a.v1.ts',
  'nctb/banks/formal-a.v2.ts',
  'nctb/banks/formal-a.v2.en.ts',
  'nctb/indices.ts',
  'nctb/ReportCard.tsx',
  'conversation/promptRegistry.ts',
  'conversation/localModelCatalog.ts',
  'conversation/modelAdapters.ts',
  'conversation/conversationEngine.ts',
  'conversation/embeddingClient.ts',
  'conversation/canonGuard.ts',
  'conversation/privacy.ts',
  'conversation/stickers.ts',
  'lib/puzzleEngine.ts',
  'lib/routeBaseline.ts',
  'data/okcomputerObservations.ts',
  'lib/routeManifest.ts',
  'lib/analytics.ts',
  'lib/i18n.ts',
  'lib/browserStorage.ts',
  'lib/remoteCloudAdapter.ts',
  'lib/corpusExport.ts',
  'game/ttt3/engine.ts',
  'game/ttt3/types.ts',
  'game/neuralClash/engine.ts',
  'game/recursiveEcho/engine.ts',
  'game/hellMaze/mazeGen.ts',
  'game/threeHoles/puzzleGen.ts',
  'game/data.ts',
  'game/stores/gameStore.ts',
  'stores/ttt3Store.ts',
  'game/chess/clockPresets.ts',
  'game/chess/rules.ts',
  'game/cityBuilder/engine.ts',
  'routes.tsx',
];

// Optional href override for EXTRA_SCAN_FILES entries. Files here are scanned
// as corpus docs (href '#') by default; this map gives the in-game docs the
// same deep-link targets the old hand-written index entries had.
// Keys must exist in EXTRA_SCAN_FILES.
export const EXTRA_HREF = {
  'game/ttt3/engine.ts': '/playground/games/skill-tic-tac-toe',
  'game/ttt3/types.ts': '/playground/games/skill-tic-tac-toe',
  'game/neuralClash/engine.ts': '/playground/games/neural-clash',
  'game/recursiveEcho/engine.ts': '/playground/games/fractal-echo',
  'game/hellMaze/mazeGen.ts': '/playground/games/hell-maze-vi',
  'game/threeHoles/puzzleGen.ts': '/playground/games',
  'game/data.ts': '/playground/games/stellar',
  'game/stores/gameStore.ts': '/playground',
  'stores/ttt3Store.ts': '/playground/games/skill-tic-tac-toe',
  'game/chess/clockPresets.ts': '/playground/games/compound-chess',
  'game/chess/rules.ts': '/playground/games/compound-chess',
  'game/cityBuilder/engine.ts': '/playground/games/city-builder',
  'data/okcomputerObservations.ts': '/okcomputer',
};

// Skip pure code / mapping tables / generated files.
export const SKIP_PATH = /(node_modules|lib[\\/]translations|generated[\\/]|\.test\.|__tests__)/;
export const CJK = /[㐀-䶿一-鿿豈-﫿]/;
// English prose: at least 3 ASCII-letter words and no CJK. The character class
// admits the math notation that appears in real site prose (×, @, <, >, =, °,
// ≤, ≥, ±, ÷) —咪娅数学独白与 NCTB 题库题干大量使用，早期版本把它们整段
// 拒之门外（约 1,600 词不可见）。
export const EN_PROSE = /^[A-Za-z0-9][A-Za-z0-9 ,.;:!?'"()/&%#+\-–—@<>=\\×÷°≤≥±\n]{8,}$/;
// …but still reject technical strings that happen to look prose-shaped:
// URLs, data URIs, absolute paths, url(...) wrappers, MIME types, email
// addresses and hex colors.
// NOTE: never write these as `/a/ || /b/` — a RegExp object is always truthy,
// so the `||` chain silently keeps only the FIRST pattern (that bug let
// `application/json;charset=utf-8` and contact emails into the corpus).
const TECHNICAL_EN_PATTERNS = [
  /^(?:https?:\/\/|data:|\/)/iu,                          // URLs / data URIs / absolute paths
  /^url\(/iu,                                             // url("data:image/svg+xml,…")
  /^[a-z]+(?:-[a-z0-9+]+)*\/[a-z0-9.+-]+(?:;|,|$)/iu,     // MIME types
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,                          // email addresses
  /^#[\da-f]{3,8}$/iu,                                    // hex colors
];
export function isTechnicalEn(s) {
  return TECHNICAL_EN_PATTERNS.some((re) => re.test(s));
}
// Full EN acceptance test, shared by the corpus producer and the coverage gate.
export function isEnProseLiteral(s) {
  return !CJK.test(s) && EN_PROSE.test(s) && /[A-Za-z]/.test(s)
    && !isTechnicalEn(s)
    && (s.match(/[A-Za-z]+/g)?.length ?? 0) >= 3;
}

export function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { yield* walk(p); continue; }
    if (/\.(ts|tsx)$/.test(p) && !SKIP_PATH.test(p)) yield p;
  }
}

// Pull every string literal out of source, using the TypeScript parser.
//
// This used to be a hand-rolled quote scanner. That desynchronised on any
// apostrophe inside a comment (don't, it's) and on JSX text, so it reported
// non-literal source code as prose and fed identifiers like `listRef` and
// `useKeepActiveEntryVisible` into the published word-frequency table. The AST
// makes the class of bug impossible: we only ever visit real StringLiteral,
// NoSubstitutionTemplateLiteral and TemplateExpression nodes.
export function extractLiterals(source, fileName) {
  const out = [];
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const push = (text) => {
    // Template heads/middles/tails: substitute a space for each hole so the
    // surrounding prose stays separated instead of being glued together.
    const value = text.replace(/\$\{[^{}]*\}/gu, ' ');
    out.push(value);
  };

  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Skip import/export module specifiers — they are paths, not prose.
      const parent = node.parent;
      const isModuleSpecifier = (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent))
        && parent.moduleSpecifier === node;
      const isImportTypeSpecifier = ts.isImportTypeNode(parent) || ts.isExternalModuleReference(parent);
      if (!isModuleSpecifier && !isImportTypeSpecifier) push(node.text);
    } else if (ts.isTemplateExpression(node)) {
      push(node.head.text);
      for (const span of node.templateSpans) push(span.literal.text);
    } else if (ts.isJsxText(node)) {
      // Visible JSX copy (button labels, paragraphs). Collapse the whitespace
      // that JSX formatting introduces.
      const text = node.text.replace(/\s+/gu, ' ').trim();
      if (text) out.push(text);
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return out;
}

export function clean(s) {
  return s.replace(/\s+/g, ' ').trim();
}
