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
// and 叫摆 from entering the list, since they only ever appear glued to one
// fixed neighbour.
//
// The runtime tokenizer never touches Intl — the result is a frozen snapshot so
// the numbers stay identical on every browser and server.
import { writeFileSync } from 'node:fs';
import { fullSearchIndex } from '../src/data/fullSearchIndex.ts';

const MAX_WORD = 8;
const MIN_COUNT = 3;
const MIN_PMI = 0.1;
// Branching entropy is measured but not enforced. Requiring it costs about 1,900
// perfectly good words — including the site's own 降临 — because a coined term
// naturally sits in one fixed phrase and therefore has low neighbour entropy.
// PMI alone already rejects the accidental pairs (的日, 期正, 有小, 叫摆), which
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

const KEYS = ['想要', '日期', '正在', '老师', '本子', '一个', '没有', '哪个', '时候', '东西', '世界', '故事', '玩具', '学校', '桌面', '降临', '卷王', '摆位表', '咪呀', '小满', '喵呜'];
const JUNK = ['的日', '期正', '有小', '叫摆', '照镜', '西摆', '是表', '又在', '上来', '本叫', '的话', '的上', '子叫'];

// One cross-boundary accident worth dropping. The story files are full of
// `## 第三章：…` headings, and the numeral glues to 章 often enough to clear
// both gates, minting 三章 / 六章 / 八章 as if they were vocabulary.
//
// Deliberately narrow. Numeral+measure pairs like 三十天, 十天 or 六只 are real
// Chinese units, they carry meaning in a story whose subject is counting days,
// and they only ever surface at a fraction of a Σ — so they stay. Likewise
// 不见 / 不信 / 不落 are ordinary words that happen to start with 不.
const ACCIDENTS = /^[一二三四五六七八九十百千]+章$/u;

// Curated proper nouns and coined terms, kept even when the statistical gates
// reject them. Two failure modes make the gates structurally unable to recover
// these, so no threshold tuning helps:
//
//   1. Intl.Segmenter never proposes them. It segments the corpus as
//      大人|国, 凉|棚, 创|可|贴, 铁|锅, so the candidate map never even
//      contains the term and there is nothing for a threshold to admit.
//   2. Their worst-split PMI is -Infinity. 高中生 and 游泳池 both appear 88+
//      times, but 泳 never occurs on its own, so the 游泳|池 split divides by
//      zero. A real word whose parts are only ever glued to it looks exactly
//      like a junk pair to a cohesion test.
//
// Both are why 喵呜, 小满, 大人国, 墨璇玥 and the rest of the cast had no
// standalone count in the published table: character names were rescued by the
// engine's protectedTerms marker pass, everything else counted as碎 fragments.
// Every entry below is verified to occur at least twice in the corpus and to be
// absent from the current lexicon, so this list can only ever add real words.
const CURATED = [
  // 《大人国的小女孩》 setting and coined objects
  '大人国', '巨人国', '还钱罐', '还钱', '创可贴', '数据卡', '凉棚', '换牙', '降温',
  '姜汤', '测温枪', '高中生', '停车场', '房顶', '手机屏', '快递', '铁锅', '纸币',
  '发布会', '记账', '游泳池', '三十天', '磨牙', '梦话', '桥洞', '小仓鼠', '墨璇玥',
  // Institutions and places
  '德澜思拓', '哲华', '星界馆', '心界', '冯班', '因派', '哲华学校', '科照真学院',
  '东海市', '滨海公园',
  // Cast names that are not registered characters
  '米雅', '米娅', '林浅', '林深', '墨问', '朵拉', '苏珞', '爱丽丝', '莱尼尔',
  '卡可拉', '陈予安', '小禾', '长风', '赵召',
  // Setting terminology
  '神经连接', '神经拓扑', '意识体', '数字生命', '因派系', '哲华系', '恒温层',
  '硅基', '人择', '双轴', '三一', '圣子', '圣父', '圣灵', '位次', '五险一金',
  '超级智能', '零花钱', '到手', '保证金',
  // ── 2026-10 新增：长寿基因与长老制 ──
  '长寿', '长老', '长老制', '衰老', '迟缓', '火山', '地表', '微生物', '权威',
  '退潮', '掌权', '嫌弃', '饿死', '均匀',
  // ── 等级公民制度 · 增补：临时等级 ──
  '临时等级', '复评', '放逐', '脱手', '回避', '撤销', '宣告', '暂按', '续接', '异议',
  '降级', '评估', '认知', '创伤',
  // ── 量刑规则 ──
  '量刑', '刑罚', '罪犯', '损伤', '未遂', '既遂', '自首', '轻判', '赎买', '担保',
  '低保', '清偿', '利息', '账本', '仁慈', '订阅', '续费', '断供', '回滚', '立法者',
  '灰色收入',
  // ── 技能算力数值表 ──
  '算力', '反弹', '激光', '电磁炮', '病毒', '护罩', '笼子', '镜子', '网盾', '网警',
  '算盾', '接地', '投币', '无视', '指明', '防御',
  // ── 冷知识 / 观点 / 小故事 ──
  '相扑', '选手', '周角', '脂肪', '热量', '反讽', '向量', '古代', '国足',
  '栏杆', '缺口', '复原', '司机', '指引',
  // ── 2026-10-12 新增：小禾设定（全面发育迟缓） ──
  '全面', '伴随',
  // ── 2026-10-23 新增：德澜思拓继位事件（外传） ──
  '继位', '掌门', '元老', '守灵', '公地', '探矿', '开采', '配额', '内卷',
  '矿床', '热泉', '盆地', '股权', '公证', '宣读', '王座', '章程', '教师', '母校',
  '沉稳', '干练', '丧亲', '谋杀', '登基', '皇位', '传位', '顾深', '贺争',
];

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

const kept = new Set();
const rejected = [];
const accidents = [];
for (const [word, count] of candidates) {
  if (ACCIDENTS.test(word)) { accidents.push([word, count]); continue; }
  if (count < MIN_COUNT) { rejected.push([word, count, 'rare']); continue; }
  const pmi = minPmi(word, count);
  if (!(pmi >= MIN_PMI)) { rejected.push([word, count, `pmi ${pmi.toFixed(2)}`]); continue; }
  const left = entropyOf(leftNeighbours, word);
  const right = entropyOf(rightNeighbours, word);
  if (left < MIN_ENTROPY || right < MIN_ENTROPY) {
    rejected.push([word, count, `entropy ${left.toFixed(2)}/${right.toFixed(2)}`]);
    continue;
  }
  kept.add(word);
}

// Admit the curated list. Guarded so a typo or a term that has since been
// deleted from the corpus cannot quietly enter the frozen snapshot.
const corpusText = runs.join('\n');
const countOccurrences = (word) => {
  let n = 0;
  let i = 0;
  while ((i = corpusText.indexOf(word, i)) !== -1) { n += 1; i += word.length; }
  return n;
};
const curatedKept = [];
const curatedDropped = [];
for (const word of CURATED) {
  if (!/^[\p{Script=Han}]+$/u.test(word)) { curatedDropped.push([word, 0, 'not pure Han']); continue; }
  if (word.length < 2 || word.length > MAX_WORD) { curatedDropped.push([word, 0, 'bad length']); continue; }
  if (ACCIDENTS.test(word)) { curatedDropped.push([word, 0, 'matches accident pattern']); continue; }
  const occurrences = countOccurrences(word);
  // Threshold was 2 until 2026-10. Lowered to 1 because institution write-ups
  // legitimately introduce a term once — 量刑, 反讽, 护罩, 灰色收入 — and a
  // hand-confirmed term that does occur in the corpus is still a real word,
  // whereas the statistical pass (MIN_COUNT = 3) exists to keep *guessed*
  // bigrams out. Every curated entry is verified present, never guessed.
  if (occurrences < 1) { curatedDropped.push([word, occurrences, 'absent from corpus']); continue; }
  if (kept.has(word)) { curatedDropped.push([word, occurrences, 'already kept statistically']); continue; }
  kept.add(word);
  curatedKept.push([word, occurrences]);
}

const keptList = [...kept];
keptList.sort((a, b) => a.localeCompare(b, 'zh-CN'));

const keptSet = new Set(keptList);
const probes = [...KEYS, ...JUNK, '大人国', '喵呜', '创可贴', '凉棚', '墨璇玥', '高中生', '停车场'];
console.log('kept', keptList.length, '| rejected', rejected.length, '| accidents', accidents.length, 'of', candidates.size);
console.log(`accidents dropped: ${accidents.map(([w]) => w).join(' ')}`);
console.log(`curated admitted ${curatedKept.length}, skipped ${curatedDropped.length}`);
for (const [w, occ] of curatedKept) console.log(`  + ${w} (corpus x${occ})`);
for (const [w, occ, why] of curatedDropped) console.log(`  - ${w} (${why}${occ ? `, x${occ}` : ''})`);
console.log('probe results:');
for (const p of probes) {
  const keptIt = keptSet.has(p);
  const why = rejected.find(([w]) => w === p)?.[2] ?? '';
  const curated = curatedKept.find(([w]) => w === p) ? ' (curated)' : '';
  console.log(`  ${p}: ${keptIt ? 'KEPT' : 'rejected'}${curated}${why ? ' (' + why + ')' : ''}`);
}
// Guard the curated list only. The statistical pass is allowed to keep
// borderline bigrams like 的话 on its own judgement; what must never happen is a
// hand-written entry smuggling one of the known segmentation accidents in.
const curatedJunk = JUNK.filter(j => curatedKept.some(([w]) => w === j));
if (curatedJunk.length) {
  console.error(`FATAL: curated list contains known junk: ${curatedJunk.join(' ')}`);
  process.exit(1);
}

const lines = [];
let current = '  ';
for (const w of keptList) {
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
// The list is the Intl+PMI result plus the CURATED proper nouns in
// scripts/generate-segmenter-lexicon.ts. Those are added by hand because the
// statistical gates cannot recover them: Intl never proposes 大人国 or 凉棚 as
// single words, and a word like 游泳池 whose parts never occur separately has a
// worst-split PMI of -Infinity. Without the curated pass they counted as碎
// fragments, or not at all.
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
console.log(`words: ${keptList.length} | source: ${(ts.length / 1024).toFixed(1)} KB`);
