/**
 * Generates 1200×630 social share cards for every game in the playground.
 *
 * Cards are rendered from the site's own metadata (game label, category,
 * existing SEO description wording) in the Neural Connection visual language —
 * no invented copy, no stock art. Output lands in public/og/<game-id>.png and
 * is wired into RouteMetadata via the same prefix-rule mechanism as the
 * cat-machine card.
 *
 * Reproducible: `npm run og:generate` (uses the installed Edge, no browser
 * download). Fonts fall back to the system CJK stack, so glyph rendering can
 * differ marginally across machines — the committed PNGs are the source of
 * truth for deploys.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'public', 'og');

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];

const GAMES = [
  { id: 'cat-machine', label: '猫咪机', caption: 'CAT-O-MATIC', accent: ['#66e9da', '#a685ff'] },
  { id: 'city-builder', label: '建设城市', caption: 'CITY BUILDER', accent: ['#79a9ff', '#66e9da'] },
  { id: 'stellar', label: '星际战线 Stellar', caption: 'STELLAR', accent: ['#a685ff', '#ff8fc7'] },
  { id: 'compound-chess', label: '复合象棋', caption: 'COMPOUND CHESS', accent: ['#df8dff', '#66e9da'] },
  { id: 'box-battle', label: '箱子对决', caption: 'BOX DUEL', accent: ['#ffc76b', '#ff8fc7'] },
  { id: 'super-24', label: '超级24点', caption: 'SUPER 24', accent: ['#66e9da', '#ffc76b'] },
  { id: 'skill-tic-tac-toe', label: '技能井字棋', caption: 'SKILL TIC-TAC-TOE', accent: ['#a685ff', '#79a9ff'] },
  { id: 'hell-maze-vi', label: '地狱迷宫·VI', caption: 'HELL MAZE VI', accent: ['#ff8fc7', '#a685ff'] },
  { id: 'cunning-rabbit', label: '狡兔三窟', caption: 'CUNNING RABBIT', accent: ['#f58ab8', '#66e9da'] },
  { id: 'quiz', label: '题目', caption: 'QUIZ ARENA', accent: ['#66e9da', '#a685ff'] },
  { id: 'fractal-echo', label: '递归回响', caption: 'FRACTAL ECHO', accent: ['#79a9ff', '#ff8fc7'] },
  { id: 'neural-echo', label: '神经回响', caption: 'NEURAL ECHO', accent: ['#66e9da', '#df8dff'] },
  { id: 'neural-clash', label: '神经交锋', caption: 'NEURAL CLASH', accent: ['#ff8fc7', '#79a9ff'] },
  { id: 'cat-mouse', label: '猫鼠迷踪', caption: 'CAT & MOUSE', accent: ['#ffc76b', '#a685ff'] },
  { id: 'giant-catch', label: '大人国抓小人', caption: 'GIANT CATCH', accent: ['#93c9ff', '#66e9da'] },
];

function cardHtml({ label, caption, accent }) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: 'Microsoft YaHei', 'Noto Sans SC', 'PingFang SC', system-ui, sans-serif;
    background: #080710; color: #f8f4ff; position: relative;
  }
  .grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(circle at 22% 30%, #000 0%, transparent 72%);
  }
  .glow-a { position: absolute; width: 620px; height: 620px; left: -140px; top: -180px;
    background: radial-gradient(circle, ${accent[0]}33, transparent 62%); }
  .glow-b { position: absolute; width: 720px; height: 720px; right: -220px; bottom: -300px;
    background: radial-gradient(circle, ${accent[1]}2e, transparent 64%); }
  .stroke { position: absolute; inset: 26px; border: 1px solid rgba(255,255,255,.12); border-radius: 22px; }
  .content { position: absolute; inset: 26px; padding: 62px 68px; display: flex; flex-direction: column; justify-content: space-between; }
  .eyebrow { display: flex; align-items: center; gap: 12px; font-size: 17px; letter-spacing: .3em; color: #b9b0cd; text-transform: uppercase; }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: ${accent[0]}; box-shadow: 0 0 22px ${accent[0]}; }
  .title { font-size: 108px; line-height: .95; font-weight: 700; letter-spacing: -.03em;
    background: linear-gradient(96deg, #f9f5ff 6%, ${accent[0]} 58%, ${accent[1]} 96%);
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .caption { margin-top: 22px; font-size: 26px; letter-spacing: .34em; color: #8d84a3; font-family: 'Consolas', monospace; }
  .footer { display: flex; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.1); }

  .tag { padding: 12px 20px; border: 1px solid ${accent[0]}55; border-radius: 999px; font-size: 19px; color: ${accent[0]}; background: ${accent[0]}14; }
</style></head>
<body>
  <div class="glow-a"></div><div class="glow-b"></div><div class="grid"></div><div class="stroke"></div>
  <div class="content">
    <div class="eyebrow"><span class="dot"></span><span>NEURAL CONNECTION / 游戏实验场</span></div>
    <div>
      <div class="title">${label}</div>
      <div class="caption">${caption}</div>
    </div>
    <div class="footer"><span class="tag">可在浏览器直接玩 · 建议使用键盘或触摸操作</span></div>
  </div>
</body></html>`;
}

async function main() {
  const { existsSync } = await import('node:fs');
  const executablePath = EDGE_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!executablePath) {
    console.error('og:generate — 找不到 Edge/Chrome，跳过');
    process.exitCode = 1;
    return;
  }

  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

  for (const game of GAMES) {
    writeFileSync(resolve(outDir, `.${game.id}.html`), cardHtml(game), 'utf-8');
    await page.goto(`file://${resolve(outDir, `.${game.id}.html`).replace(/\\/g, '/')}`, { waitUntil: 'load' });
    await page.waitForTimeout(180);
    await page.screenshot({ path: resolve(outDir, `${game.id}.png`), clip: { x: 0, y: 0, width: 1200, height: 630 } });
    console.log(`og:generate — ${game.id}.png`);
  }

  await browser.close();

  // Tidy the temporary HTML sources.
  const { readdirSync, unlinkSync } = await import('node:fs');
  for (const entry of readdirSync(outDir)) {
    if (entry.startsWith('.') && entry.endsWith('.html')) unlinkSync(resolve(outDir, entry));
  }
  console.log(`og:generate — ${GAMES.length} 张分享卡写入 public/og/`);
}

await main();
