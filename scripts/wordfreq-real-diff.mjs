// Diff two snapshots produced by tmp/freq-report.mjs (label argument).
import { readFileSync, writeFileSync } from 'node:fs';

const [oldLabel = 'old', newLabel = 'new'] = process.argv.slice(2);
const old = JSON.parse(readFileSync(`tmp/wordfreq-real-${oldLabel}.json`, 'utf8'));
const nw = JSON.parse(readFileSync(`tmp/wordfreq-real-${newLabel}.json`, 'utf8'));

const mOld = new Map(old.zh.items.map(i => [i.word, i]));
const mNew = new Map(nw.zh.items.map(i => [i.word, i]));
const pad = (s, n) => String(s).padStart(n);
const isHan = w => /^\p{Script=Han}+$/u.test(w);

console.log('=== meta (zh) ===');
console.log(`  docs        ${old.zh.docs} -> ${nw.zh.docs}   (${nw.zh.docs - old.zh.docs >= 0 ? '+' : ''}${nw.zh.docs - old.zh.docs})`);
console.log(`  totalWords  ${old.zh.totalWords} -> ${nw.zh.totalWords}   (${(nw.zh.totalWords - old.zh.totalWords).toFixed(1)})`);
console.log(`  unique      ${old.zh.unique} -> ${nw.zh.unique}   (${nw.zh.unique - old.zh.unique >= 0 ? '+' : ''}${nw.zh.unique - old.zh.unique})`);
console.log('=== meta (en) ===');
console.log(`  totalWords  ${old.en.totalWords} -> ${nw.en.totalWords}   (${(nw.en.totalWords - old.en.totalWords).toFixed(1)})`);
console.log(`  unique      ${old.en.unique} -> ${nw.en.unique}   (${nw.en.unique - old.en.unique >= 0 ? '+' : ''}${nw.en.unique - old.en.unique})`);

const diffs = [];
for (const [w, n] of mNew) {
  const o = mOld.get(w);
  const oc = o?.count ?? 0;
  if (n.count !== oc) diffs.push({ w, oc, nc: n.count, d: +(n.count - oc).toFixed(1), isChar: n.isCharacter });
}
diffs.sort((a, b) => b.d - a.d || b.nc - a.nc);

const up = diffs.filter(x => x.d > 0);
const down = diffs.filter(x => x.d < 0);
const fresh = diffs.filter(x => x.oc === 0);
const gone = [...mOld.keys()].filter(w => !mNew.has(w));
const rankedUp = [...diffs].sort((a, b) => (mNew.get(b.w).count - (mOld.get(b.w)?.count ?? 0)) - (mNew.get(a.w).count - (mOld.get(a.w)?.count ?? 0)));

console.log(`\n=== Σ 变化 ===`);
console.log(`  上升 ${up.length} / 下降 ${down.length} / 合计变化 ${diffs.length}`);
console.log(`  消失的词 ${gone.length}`);

console.log('\n--- Σ 涨幅 Top 30 (含非汉字) ---');
for (const x of rankedUp.slice(0, 30)) console.log(`  ${x.w.padEnd(8)} ${pad(x.oc, 7)} -> ${pad(x.nc, 7)}  (${x.d >= 0 ? '+' : ''}${x.d})${x.isChar ? '  [角色]' : ''}`);

const hanUp = rankedUp.filter(x => isHan(x.w));
console.log('\n--- Σ 涨幅 Top 30 (仅汉字) ---');
for (const x of hanUp.slice(0, 30)) console.log(`  ${x.w.padEnd(8)} ${pad(x.oc, 7)} -> ${pad(x.nc, 7)}  (${x.d >= 0 ? '+' : ''}${x.d})${x.isChar ? '  [角色]' : ''}`);

console.log('\n--- 排名上升最多 Top 20 (old rank -> new rank) ---');
const rankOld = new Map([...mOld.keys()].map((w, i) => [w, i + 1]));
const rankNew = new Map([...mNew.keys()].map((w, i) => [w, i + 1]));
const jumped = [...mNew.keys()]
  .map(w => ({ w, ro: rankOld.get(w) ?? Infinity, rn: rankNew.get(w), c: mNew.get(w).count }))
  .filter(x => Number.isFinite(x.ro))
  .map(x => ({ ...x, gain: x.ro - x.rn }))
  .sort((a, b) => b.gain - a.rn);
for (const x of jumped.slice(0, 20)) console.log(`  ${x.w.padEnd(8)} rank ${pad(x.ro, 5)} -> ${pad(x.rn, 5)}  (${x.gain >= 0 ? '+' : ''}${x.gain})  Σ=${x.c}`);

console.log('\n--- 排名跌落最多 Top 15 ---');
for (const x of [...jumped].reverse().slice(0, 15)) console.log(`  ${x.w.padEnd(8)} rank ${pad(x.ro, 5)} -> ${pad(x.rn, 5)}  (${x.gain})  Σ=${x.c}`);

console.log(`\n--- 全新入榜词 (old=0) 共 ${fresh.length} 个, Top 40 ---`);
for (const x of fresh.slice(0, 40)) console.log(`  NEW ${x.w.padEnd(8)} Σ=${pad(x.nc, 7)}${x.isChar ? '  [角色]' : ''}`);

const hanFresh = fresh.filter(x => isHan(x.w));
console.log(`\n--- 全新入榜汉字词 共 ${hanFresh.length} 个, Top 40 ---`);
for (const x of hanFresh.slice(0, 40)) console.log(`  NEW ${x.w.padEnd(8)} Σ=${pad(x.nc, 7)}`);

if (down.length) {
  console.log('\n--- Σ 下降 Top 20 (加权竞争, 非内容删除) ---');
  for (const x of [...down].sort((a, b) => a.d - b.d).slice(0, 20)) console.log(`  ${x.w.padEnd(8)} ${pad(x.oc, 7)} -> ${pad(x.nc, 7)}  (${x.d})`);
}
if (gone.length) {
  console.log(`\n--- 消失的词 Top 20 (共 ${gone.length}) ---`);
  for (const w of gone.slice(0, 20)) console.log(`  GONE ${w.padEnd(8)} old Σ=${mOld.get(w).count}`);
}

// 角色词
console.log('\n=== 角色词变化 (zh) ===');
const chars = nw.zh.items.filter(i => i.isCharacter);
for (const c of chars) {
  const o = mOld.get(c.word);
  const oc = o?.count ?? 0;
  if (oc !== c.count) console.log(`  ${c.word.padEnd(14)} ${pad(oc, 7)} -> ${pad(c.count, 7)}  (${c.count - oc >= 0 ? '+' : ''}${+(c.count - oc).toFixed(1)})  N=${c.docCount}`);
}

// 第二卷人物/道具/概念
const vol2 = ['小谷', '喵呜', '还钱罐', '还钱', '创可贴', '本子', '碗', '凉棚', '换牙', '降温', '数据卡',
  '高中生', '外卖员', '秀兰奶奶', '周济', '黄豆', '发布会', '墨璇玥', '小满', '咪呀', '大人国',
  '三十天', '回家', '牙齿', '感冒', '姜汤', '车库', '停车场', '金星', '数据', '记账', '凉棚顶',
  '面条', '馒头', '手机', '屏幕', '顺丰', '快递', '挥手', '绳子', '小本子'];
console.log('\n=== 第二卷相关词 ===');
for (const w of vol2) {
  const n = mNew.get(w);
  const o = mOld.get(w);
  if (!n && !o) continue;
  console.log(`  ${w.padEnd(8)} ${pad(o?.count ?? 0, 7)} -> ${pad(n?.count ?? 0, 7)}  N=${pad(n?.docCount ?? 0, 3)}  饱和=${pad((n?.saturation ?? 0).toFixed(2), 6)}  密度=${(n?.density ?? 0).toFixed(4)}${n?.isCharacter ? '  [角色]' : ''}`);
}

writeFileSync('tmp/wordfreq-real-diff.json', JSON.stringify({
  oldLabel, newLabel,
  meta: { old: { docs: old.zh.docs, totalWords: old.zh.totalWords, unique: old.zh.unique }, new: { docs: nw.zh.docs, totalWords: nw.zh.totalWords, unique: nw.zh.unique } },
  up: up.length, down: down.length, fresh: fresh.length, gone: gone.length,
  diffs,
}, null, 1), 'utf8');
console.log('\nDIFF=tmp/wordfreq-real-diff.json');
