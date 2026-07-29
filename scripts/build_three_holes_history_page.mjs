import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const git = 'C:\\Users\\Administrator\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\native\\git\\cmd\\git.exe';
const history = [
  { sha: '0fdb258', label: '版本 1 · 初始题库', date: '2026-07-28 15:46' },
  { sha: '97ee4f7', label: '版本 2 · 接入更新', date: '2026-07-28 17:39' },
  { sha: '4a45e96', label: '版本 3 · 随机与计数', date: '2026-07-29 10:24' },
  { sha: '6402bb9', label: '版本 4 · 自然团块与唯一解', date: '2026-07-29 17:27' },
];

function readBank(sha) {
  const text = execFileSync(git, [
    'show', `${sha}:src/game/threeHoles/puzzles.generated.json`,
  ], { cwd: root, encoding: 'utf8' });
  return JSON.parse(text);
}

const boards = {};
const records = [];
for (const version of history) {
  const bank = readBank(version.sha);
  for (const puzzle of bank.puzzles) {
    if (!((puzzle.n === 14 && puzzle.k === 3) || (puzzle.n === 32 && puzzle.k === 6))) continue;
    const givens = puzzle.givens ?? (puzzle.clues ?? []).map((cell) => ({ cell, value: 1 }));
    const boardKey = `${puzzle.n}-${puzzle.k}-${puzzle.regions.join('')}-${puzzle.solution.join('')}`;
    boards[boardKey] ??= {
      n: puzzle.n,
      k: puzzle.k,
      regions: puzzle.regions,
      solution: puzzle.solution,
    };
    records.push({
      version: version.label,
      sha: version.sha,
      date: version.date,
      difficultyId: puzzle.difficultyId,
      id: puzzle.id,
      n: puzzle.n,
      k: puzzle.k,
      boardKey,
      givens,
      certificate: puzzle.certificate ?? {},
    });
  }
}

const snapshot = JSON.stringify({ history, records, boards });
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>狡兔三窟 · 历史题面对照</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #e7eef7; background: #08111d; }
    .page { width: min(1500px, 100%); margin: 0 auto; padding: 38px 22px 60px; }
    .hero { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 26px; }
    .eyebrow { margin: 0 0 9px; color: #71e2b6; font-size: 12px; font-weight: 800; letter-spacing: .18em; }
    h1 { margin: 0; color: #f8fbff; font-size: clamp(30px, 5vw, 54px); letter-spacing: -.045em; }
    .intro { max-width: 670px; margin: 14px 0 0; color: #9caec0; line-height: 1.7; }
    .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 14px; border: 1px solid #20364c; border-radius: 15px; background: #0d1b2a; }
    label { color: #94a9bd; font-size: 13px; }
    select, button { min-height: 38px; border: 1px solid #2a4660; border-radius: 9px; color: #f2f7fb; background: #13283b; font: inherit; }
    select { padding: 0 12px; }
    button { padding: 0 13px; cursor: pointer; }
    button:hover, button:focus-visible { border-color: #71e2b6; outline: none; }
    button.active { color: #052118; border-color: #71e2b6; background: #71e2b6; }
    .versions { display: grid; grid-template-columns: repeat(4, minmax(260px, 1fr)); gap: 14px; }
    .card { min-width: 0; overflow: hidden; border: 1px solid #20364c; border-radius: 16px; background: #0d1b2a; box-shadow: 0 18px 45px #02081266; }
    .card-head { padding: 17px 17px 13px; border-bottom: 1px solid #20364c; }
    .card-head h2 { margin: 0; font-size: 18px; }
    .card-head p { margin: 6px 0 0; color: #91a6ba; font-size: 12px; line-height: 1.5; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
    .tag { padding: 4px 7px; border: 1px solid #28455d; border-radius: 999px; color: #a9bfd2; font-size: 11px; }
    .board-wrap { overflow: auto; padding: 15px; background: #07121e; }
    .board { display: grid; width: max-content; margin: 0 auto; grid-template-columns: repeat(var(--n), var(--cell)); border: 2px solid #b8c8d8; }
    .cell { position: relative; width: var(--cell); height: var(--cell); border: .5px solid #ffffff1d; }
    .cell::after { content: ""; position: absolute; inset: 15%; border: 0 solid transparent; }
    .cell.known-rabbit::after, .cell.answer-rabbit::after { border: max(1px, calc(var(--cell) * .07)) solid #fff8dc; border-radius: 50%; background: #8c3b17; box-shadow: 0 1px 5px #0009; }
    .cell.known-rabbit::after { background: #0f8278; border-color: #ffefb0; box-shadow: 0 0 0 2px #ffe7a55c; }
    .cell.excluded::after { inset: 38%; border-radius: 50%; background: #d8e8f6; box-shadow: 0 0 0 2px #0b1724aa; }
    .cell.answer-rabbit:not(.known-rabbit)::after { opacity: .92; }
    .cell.answer-rabbit.excluded::after { background: #e9f3ff; }
    .card-foot { display: flex; justify-content: space-between; gap: 12px; padding: 11px 15px 14px; color: #8fa4b8; font-size: 11px; }
    .card-foot strong { color: #d9e7f3; font-weight: 700; }
    .empty { padding: 50px 20px; border: 1px dashed #2b4862; border-radius: 15px; color: #91a6ba; text-align: center; }
    .note { margin-top: 18px; color: #7f95aa; font-size: 12px; line-height: 1.7; }
    @media (max-width: 1160px) { .versions { grid-template-columns: repeat(2, minmax(280px, 1fr)); } }
    @media (max-width: 660px) { .page { padding: 25px 12px 40px; } .hero { display: block; } .controls { margin-top: 20px; } .versions { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <p class="eyebrow">HISTORICAL PUZZLE ATLAS</p>
        <h1>狡兔三窟 · 历史题面对照</h1>
        <p class="intro">这里固定保存本地 Git 中四个版本的题库快照。选择棋盘尺寸后，会同时显示四个版本对应的题目；颜色表示活动区，圆点表示题面已知兔子或答案中的兔子，浅点表示旧版本的已知排除。</p>
      </div>
    </section>
    <section class="controls" aria-label="题目筛选">
      <label for="size">查看题型</label>
      <select id="size">
        <option value="14-3">14 × 14 · k=3</option>
        <option value="32-6">32 × 32 · k=6</option>
      </select>
      <button id="answer" type="button">显示答案</button>
      <span id="summary" class="note" style="margin:0"></span>
    </section>
    <section id="versions" class="versions" aria-live="polite"></section>
    <p class="note">版本来源：<span id="source"></span>。版本 1–3 的这两道题仍是同一份题面快照；版本 4 重新生成了自然团块和答案布局。此页面只用于历史对照，不会修改游戏题库。</p>
  </main>
  <script>
    const snapshot = ${snapshot};
    const sizeSelect = document.querySelector('#size');
    const answerButton = document.querySelector('#answer');
    const versionsEl = document.querySelector('#versions');
    const summaryEl = document.querySelector('#summary');
    const sourceEl = document.querySelector('#source');
    let showAnswer = false;

    function colorForRegion(character) {
      const index = parseInt(character, 36);
      return 'hsl(' + ((index * 47 + 168) % 360) + ' 38% ' + (index % 2 ? '29%' : '33%') + ')';
    }

    function recordFor(version, size) {
      return snapshot.records.find((record) => record.version === version.label && record.n + '-' + record.k === size);
    }

    function boardHtml(record) {
      const board = snapshot.boards[record.boardKey];
      const givens = new Map(record.givens.map((given) => [given.cell, given.value]));
      const cells = [];
      for (let row = 0; row < board.n; row += 1) {
        for (let col = 0; col < board.n; col += 1) {
          const index = row * board.n + col;
          const given = givens.get(index);
          const isRabbit = board.solution[row][col] === '1';
          const classes = ['cell'];
          if (given === 1) classes.push('known-rabbit');
          if (given === 0) classes.push('excluded');
          if (showAnswer && isRabbit) classes.push('answer-rabbit');
          cells.push('<span class="' + classes.join(' ') + '" style="background:' + colorForRegion(board.regions[row][col]) + '" title="第' + (row + 1) + '行，第' + (col + 1) + '列"></span>');
        }
      }
      return '<div class="board" style="--n:' + board.n + ';--cell:' + (board.n === 32 ? '16px' : '28px') + '">' + cells.join('') + '</div>';
    }

    function cardHtml(version, record) {
      const givenCount = record.givens.length;
      const knownRabbits = record.givens.filter((given) => given.value === 1).length;
      const knownExclusions = givenCount - knownRabbits;
      return '<article class="card">'
        + '<header class="card-head"><h2>' + version.label + '</h2>'
        + '<p>' + version.date + ' · 提交 ' + version.sha + '<br>' + record.id + '</p>'
        + '<div class="meta"><span class="tag">兔子总数 ' + (record.n * record.k) + '</span><span class="tag">已知兔子 ' + knownRabbits + '</span><span class="tag">已知排除 ' + knownExclusions + '</span></div></header>'
        + '<div class="board-wrap">' + boardHtml(record) + '</div>'
        + '<footer class="card-foot"><span>题面与答案叠加：<strong>' + (showAnswer ? '开' : '关') + '</strong></span><span>' + record.certificate.kind + '</span></footer>'
        + '</article>';
    }

    function render() {
      const size = sizeSelect.value;
      const records = snapshot.history.map((version) => recordFor(version, size)).filter(Boolean);
      versionsEl.innerHTML = records.length
        ? records.map((record) => cardHtml(snapshot.history.find((version) => version.label === record.version), record)).join('')
        : '<div class="empty">没有找到这组历史题目。</div>';
      const [n, k] = size.split('-');
      summaryEl.textContent = records.length + ' 个历史版本 · ' + n + '×' + n + ' · 每行、列、活动区各 ' + k + ' 个兔子';
      sourceEl.textContent = snapshot.history.map((version) => version.sha).join('、');
    }

    sizeSelect.addEventListener('change', render);
    answerButton.addEventListener('click', () => { showAnswer = !showAnswer; answerButton.textContent = showAnswer ? '隐藏答案' : '显示答案'; render(); });
    render();
  </script>
</body>
</html>
`;

writeFileSync(resolve(root, 'public/three-holes-history.html'), html, 'utf8');
console.log(`wrote public/three-holes-history.html with ${records.length} historical puzzle snapshots`);
