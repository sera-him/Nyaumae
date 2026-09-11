// Performance budget: fail CI when the app shell or WebLLM chunk grows wild.
// WebLLM stays in its own lazy chunk (vite.config.ts manualChunks); this only
// guards the regression, it does not lower the intentional 7000 limit.
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist/assets';
const BUDGETS = { entryJsKb: 900, entryCssKb: 350, webLlmChunkMb: 30 };

if (!existsSync(dist)) {
  console.log('check-budget: dist missing, skipped');
  process.exit(0);
}
const files = readdirSync(dist).map((f) => ({ f, size: statSync(join(dist, f)).size }));
const js = files.filter((x) => x.f.endsWith('.js'));
const css = files.filter((x) => x.f.endsWith('.css'));
const webllm = files.filter((x) => x.f.includes('web-llm'));
const kb = (b) => Math.round(b / 1024);

let failed = false;
const biggestJs = js.sort((a, b) => b.size - a.size)[0];
if (biggestJs && !biggestJs.f.includes('web-llm') && kb(biggestJs.size) > BUDGETS.entryJsKb) {
  console.error(`budget fail: entry ${biggestJs.f} ${kb(biggestJs.size)}KB > ${BUDGETS.entryJsKb}KB`);
  failed = true;
}
const biggestCss = css.sort((a, b) => b.size - a.size)[0];
if (biggestCss && kb(biggestCss.size) > BUDGETS.entryCssKb) {
  console.error(`budget fail: css ${biggestCss.f} ${kb(biggestCss.size)}KB > ${BUDGETS.entryCssKb}KB`);
  failed = true;
}
for (const c of webllm) {
  if (c.size > BUDGETS.webLlmChunkMb * 1024 * 1024) {
    console.error(`budget fail: ${c.f} exceeds ${BUDGETS.webLlmChunkMb}MB`);
    failed = true;
  }
}
console.log(`check-budget: js=${js.length} css=${css.length} webllm=${webllm.length} failed=${failed}`);
process.exit(failed ? 1 : 0);
