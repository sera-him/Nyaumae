// One-off generator for src/data/segmenterLexicon.ts.
//
// Run manually when the corpus grows enough to justify refreshing it:
//
//   node --experimental-strip-types --experimental-specifier-resolution=node \
//        --import ./tests/ts-resolve-hooks.mjs scripts/generate-segmenter-lexicon.ts
//
// It segments the current corpus once with Intl.Segmenter, then keeps only the
// candidates that look like real words rather than segmentation accidents:
// a minimum pointwise-mutual-information cohesion and a minimum branching
// entropy on each side. That is what stops junk pairs such as 的日, 期正, 有小
// and 叫页 from entering the list, since they only ever appear glued to one
// fixed neighbour.
//
// The runtime tokenizer never touches Intl — the result is a frozen snapshot so
// the numbers stay identical on every browser and server.
import { writeFileSync } from 'node:fs';
import { fullSearchIndex } from '../src/data/fullSearchIndex.ts';

const MAX_WORD = 8;
const MIN_COUNT = 3;
const MIN_PMI = 0.2;
// Branching entropy is measured but not enforced. Requiring it costs about 1,900
// perfectly good words — including the site's own 降临 — because a coined term
// naturally sits in one fixed phrase and therefore has low neighbour entropy.
// PMI alone already rejects the accidental pairs (的日, 期正, 有小, 叫页), which
// is what this list has to get right.
const MIN_ENTROPY = 0;

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

const candidates = new Map();
for (const item of fullSearchIndex) {
  for (const seg of item.frequencySegments ?? [item.content]) {
    if (typeof seg !== 'string') continue;
    for (const part of segmenter.segment(seg)) {
      if (!part.isWordLike) continue;
      const w = part.segment;
      if (w.length < 2 || w.length > MAX_WORD) continue;
      if (!/^[\p{Script=Han}]+$/u.test(w)) continue;
      candidates.set(w, (candidates.get(w) ?? 0) + 1);
    }
  }
}

// Reconstruct the Han character stream (runs split by non-Han) so cohesion and
// neighbour statistics are measured against real character sequences.
const runs = [];
for (const item of fullSearchIndex) {
  for (const seg of item.frequencySegments ?? [item.content]) {
    if (typeof seg !== 'string') continue;
    for (const match of seg.matchAll(/[\p{Script=Han}]+/gu)) runs.push(match[0]);
  }
}

const unigram = new Map();
const bigram = new Map();
let totalChars = 0;
for (const run of runs) {
  for (const ch of run) { unigram.set(ch, (unigram.get(ch) ?? 0) + 1); totalChars += 1; }
  for (let i = 0; i + 1 < run.length; i += 1) {
    const pair = run.slice(i, i + 2);
    bigram.set(pair, (bigram.get(pair) ?? 0) + 1);
  }
}

const leftNeighbours = new Map();
const rightNeighbours = new Map();
const noteNeighbour = (map, word, neighbour) => {
  let table = map.get(word);
  if (!table) { table = new Map(); map.set(word, table); }
  table.set(neighbour, (table.get(neighbour) ?? 0) + 1);
};
for (const run of runs) {
  for (let i = 0; i < run.length; i += 1) {
    // Words are only ever two characters in the Han stream sense; neighbour
    // statistics are gathered for the same substrings we might accept.
    for (let size = 2; size <= Math.min(MAX_WORD, run.length - i); size += 1) {
      const w = run.slice(i, i + size);
      if (i > 0) noteNeighbour(leftNeighbours, w, run[i - 1]);
      if (i + size < run.length) noteNeighbour(rightNeighbours, w, run[i + size]);
    }
  }
}

function entropyOf(map, word) {
  const table = map.get(word);
  if (!table) return 0;
  let total = 0;
  for (const n of table.values()) total += n;
  if (total === 0) return 0;
  let h = 0;
  for (const n of table.values()) {
    const p = n / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function minPmi(word, count) {
  let worst = Infinity;
  for (let k = 1; k < word.length; k += 1) {
    const left = unigram.get(word.slice(0, k)) ?? 0;
    const right = unigram.get(word.slice(k)) ?? 0;
    if (left === 0 || right === 0) return -Infinity;
    const pmi = Math.log2((count * totalChars) / (left * right));
    if (pmi < worst) worst = pmi;
  }
  return worst;
}

const KEYS = ['想要', '日期', '正在', '老师', '本子', '一个', '没有', '哪个', '时候', '东西', '世界', '故事', '玩具', '学校', '桌面', '降临', '卷王', '页表', '咪呀', '小满', '喵呜'];
const JUNK = ['的日', '期正', '有小', '叫页', '照镜', '页又', '是表', '又在', '上来', '本叫', '的话', '的上', '子叫'];

function evaluate(thresholdPmi, thresholdEntropy, thresholdCount) {
  const keep = [];
  for (const [word, count] of candidates) {
    if (count < thresholdCount) continue;
    if (!(minPmi(word, count) >= thresholdPmi)) continue;
    if (entropyOf(leftNeighbours, word) < thresholdEntropy) continue;
    if (entropyOf(rightNeighbours, word) < thresholdEntropy) continue;
    keep.push(word);
  }
  return keep;
}

if (process.argv.includes('--sweep')) {
  console.log('minPmi minEnt minCnt |  size | real kept | missing | junk kept');
  for (const thresholdPmi of [0, 0.2, 0.4, 0.8, 1.2]) {
    for (const thresholdEntropy of [0, 0.1, 0.2, 0.4]) {
      for (const thresholdCount of [2, 3, 4]) {
        const keep = evaluate(thresholdPmi, thresholdEntropy, thresholdCount);
        const set = new Set(keep);
        const real = KEYS.filter((k) => set.has(k));
        const junk = JUNK.filter((j) => set.has(j));
        console.log([
          thresholdPmi.toFixed(1).padStart(5),
          thresholdEntropy.toFixed(1).padStart(5),
          String(thresholdCount).padStart(5),
          String(keep.length).padStart(6),
          `${real.length}/${KEYS.length}`.padStart(10),
          KEYS.filter((k) => !set.has(k)).join(' ').padEnd(22),
          junk.length ? junk.join(' ') : '(none)',
        ].join(' | '));
      }
    }
  }
  process.exit(0);
}

const kept = [];
const rejected = [];
for (const [word, count] of candidates) {
  if (count < MIN_COUNT) { rejected.push([word, count, 'rare']); continue; }
  const pmi = minPmi(word, count);
  if (!(pmi >= MIN_PMI)) { rejected.push([word, count, `pmi ${pmi.toFixed(2)}`]); continue; }
  const left = entropyOf(leftNeighbours, word);
  const right = entropyOf(rightNeighbours, word);
  if (left < MIN_ENTROPY || right < MIN_ENTROPY) {
    rejected.push([word, count, `entropy ${left.toFixed(2)}/${right.toFixed(2)}`]);
    continue;
  }
  kept.push(word);
}

kept.sort((a, b) => a.localeCompare(b, 'zh-CN'));

const probes = ['想要', '日期', '正在', '老师', '本子', '页表', '一个', '没有', '的日', '期正', '有小', '叫页', '又在', '是表'];
console.log('kept', kept.length, '| rejected', rejected.length, 'of', candidates.size);
console.log('probe results:');
for (const p of probes) {
  const keptIt = kept.includes(p);
  const why = rejected.find(([w]) => w === p)?.[2] ?? '';
  console.log(`  ${p}: ${keptIt ? 'KEPT' : 'rejected'}${why ? ' (' + why + ')' : ''}`);
}

const lines = [];
let current = '  ';
for (const w of kept) {
  const entry = `'${w}',`;
  if (current.length + entry.length + 1 > 116) { lines.push(current.trimEnd()); current = '  '; }
  current += entry;
}
if (current.trim()) lines.push(current.trimEnd());

const ts = `// AUTO-GENERATED by scripts/generate-segmenter-lexicon.mts — frozen snapshot.
//
// The word-frequency tokenizer used to depend on the host's Intl.Segmenter, so
// the published counts drifted a little between Chrome, Node and other engines
// (measured: 24 occurrences / 9 words out of 37.8k on this corpus). The runtime
// is now self-contained: this list is the entire Han vocabulary it knows, and
// the tokenizer picks boundaries with a deterministic dynamic program over it.
// Characters it has never seen fall back to a fixed two-character pairing rule.
//
// Single-character entries are excluded on purpose. isUsefulWord drops them
// downstream, and letting the tokenizer score them would make it prefer
// shredding a run into 的|日期 over the single word 日期.
//
// Regenerate only when the corpus has grown enough to matter — refreshing it
// will shift the published counts.

const HAN_LEXICON_RAW = [
${lines.join('\n')}
];

/** Max Han token length in the lexicon; the tokenizer never matches longer. */
export const HAN_LEXICON_MAX = ${MAX_WORD};

const HAN_LEXICON = new Set(HAN_LEXICON_RAW);

export function isKnownHanWord(word: string): boolean {
  return HAN_LEXICON.has(word);
}

export const HAN_LEXICON_SIZE = HAN_LEXICON_RAW.length;
`;

writeFileSync('src/data/segmenterLexicon.ts', ts, 'utf8');
console.log(`words: ${kept.length} | source: ${(ts.length / 1024).toFixed(1)} KB`);
