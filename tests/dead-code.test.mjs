/**
 * 死代码守卫。
 *
 * 本仓库不删死代码，但要求每处死代码都必须被标注。历史事故全部源于
 * 「无注释的孤儿导出 + 并行的第二份实现」这一组合，所以这里机械地把两类
 * 退化钉死：
 *
 *  1. 登记表 `docs/dead-code-registry.md` 里「已处理」表格中出现过的符号，
 *     必须重新获得 ≥2 个引用（定义 + 至少一个消费方）。曾经只定义不引用的
 *     符号一旦回到「只有定义」状态，立刻失败。
 *  2. 曾经出现过「与真实生成器平行、且绕过统一过滤」的第二份走法实现。
 *     断言 getMoves/getCaptures 现在是 getRawMoves 之上的薄封装。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'generated') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name)) yield p;
  }
}

const SOURCE_FILES = [...walk(SRC)];

function countReferences(symbol) {
  const re = new RegExp(`\\b${symbol}\\b`, 'g');
  let hits = 0;
  for (const file of SOURCE_FILES) {
    const src = readFileSync(file, 'utf-8');
    const found = src.match(re);
    if (found) hits += found.length;
  }
  return hits;
}

const registry = readFileSync('docs/dead-code-registry.md', 'utf-8');

// 表格只覆盖「已处理」部分；「仍在表内」的项目按定义仍然无效，不在此断言。
const resolvedSection = registry.slice(0, registry.indexOf('## 仍在表内'));
const resolvedSymbols = [...resolvedSection.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)`/g)]
  .map(m => m[1])
  .filter(s => /^[A-Z_]{3,}$/.test(s) || s === 'getMoves' || s === 'getCaptures');

const uniqueResolved = [...new Set(resolvedSymbols)];

// 这两个符号已改为 getRawMoves 之上的正确薄封装，但仍无调用方：
// 它们在登记表里被明确记为「保留导出、待接线」，因此豁免引用数门槛，
// 由下面那条专门断言它们不再自建 switch 来守护。
const ANNOTATED_ONLY = new Set(['getMoves', 'getCaptures']);

test('dead-code registry documents every previously-orphaned symbol', () => {
  assert.ok(
    uniqueResolved.length >= 8,
    `registry should name the symbols it resolved, found ${uniqueResolved.length}`,
  );
});

for (const symbol of uniqueResolved) {
  if (ANNOTATED_ONLY.has(symbol)) continue;
  test(`"${symbol}" is no longer a definition-only export`, () => {
    const refs = countReferences(symbol);
    assert.ok(
      refs >= 2,
      `"${symbol}" appears ${refs} time(s) in src/ — it has regressed to a definition-only ` +
      'export. Either wire it up, fold it into a rule table, or annotate it AND record it ' +
      'under the "still unresolved" section of docs/dead-code-registry.md.',
    );
  });
}

test('getMoves/getCaptures delegate to getRawMoves instead of re-switching', () => {
  const moves = readFileSync('src/game/chess/moves.ts', 'utf-8');
  const getMoves = moves.slice(moves.indexOf('export function getMoves'));
  const getCaptures = moves.slice(getMoves.indexOf('export function getCaptures'));

  // 两个函数体都必须按 isCapture 过滤 getRawMoves 的结果。
  assert.match(getMoves, /getRawMoves\(/);
  assert.match(getCaptures, /getRawMoves\(/);
  assert.match(getMoves, /!m\.isCapture/);
  assert.match(getCaptures, /m\.isCapture/);

  // 注释里提到自身的名字不算消费方，所以正文引用必须来自实现语句。
  // 两者都在死代码登记表的「仍需接线」一节里，引用数门槛为 1（仅定义）。
  for (const symbol of ['getMoves', 'getCaptures']) {
    const re = new RegExp(`\\b${symbol}\\b`, 'g');
    let comments = 0;
    for (const file of SOURCE_FILES) {
      const src = readFileSync(file, 'utf-8');
      for (const line of src.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
          comments += (line.match(re) || []).length;
        }
      }
    }
    const total = countReferences(symbol);
    assert.ok(
      total - comments <= 1,
      `"${symbol}" has ${total - comments} non-comment reference(s); it should have exactly 1 ` +
      '(its definition). It is listed as unresolved-but-annotated in ' +
      'docs/dead-code-registry.md — do not add callers without also switching it to "wired up".',
    );
  }

  // 平行 switch 必须已经消失：这两段里不允许再出现 24 种棋子的 case。
  const body = moves.slice(moves.indexOf('export function getMoves'), moves.indexOf('export function getCaptures') + 900);
  const caseCount = (body.match(/case '/g) || []).length;
  assert.ok(
    caseCount === 0,
    `getMoves/getCaptures still contain ${caseCount} hand-written case arms; they must not ` +
    'reimplement move generation, or they will drift from getRawMoves and bypass the poison filter.',
  );
});

test('ttt3 fear is set by a real skill and cleared at end of the afflicted turn', () => {
  const engine = readFileSync('src/game/ttt3/engine.ts', 'utf-8');

  // 必须有施加点。
  const setters = engine.match(/fear\[\w+\]\s*=\s*true/g) || [];
  assert.ok(setters.length > 0, 'no code ever sets fear=true; the fear mechanic is still unreachable');

  // 清除点必须在 endTurn，而不是 startOfTurn —— startOfTurn 紧接着就会
  // 由 endTurn 调用，清在那里等于被施加者还没等到自己回合就被解除。
  const startOfTurn = engine.slice(engine.indexOf('export function startOfTurn'));
  const startOfTurnFear = startOfTurn.slice(0, startOfTurn.indexOf('export function endTurn'));
  assert.ok(
    !/fear\[\w+\]\s*=\s*false/.test(startOfTurnFear),
    'fear is still cleared in startOfTurn, which endTurn calls immediately — the debuff would ' +
    'expire before the afflicted player ever acts.',
  );

  const endTurn = engine.slice(engine.indexOf('export function endTurn'));
  assert.match(endTurn, /fear\[prevPlayer\]\s*=\s*false/);
});

test('chess decryption is handled before the piece lookup guard', () => {
  const engine = readFileSync('src/game/chess/engine.ts', 'utf-8');
  const executeMove = engine.slice(engine.indexOf('export function executeMove'));
  const decryptionIdx = executeMove.indexOf('move.isDecryption');
  const pieceGuardIdx = executeMove.indexOf('if (!piece) return state;');

  assert.ok(decryptionIdx > -1, 'executeMove no longer contains a decryption branch');
  assert.ok(pieceGuardIdx > -1, 'executeMove no longer guards on a missing piece');
  assert.ok(
    decryptionIdx < pieceGuardIdx,
    'the decryption branch must come BEFORE the getPiece guard: decryption has no origin ' +
    'square (the store passes {-1,-1}), so the guard returns the state unchanged and the ' +
    'whole 1->2->3 decryption state machine stays unreachable.',
  );
});

test('compound chess critical pieces come from the rule table, not inline literals', () => {
  const board = readFileSync('src/game/chess/board.ts', 'utf-8');
  const findCritical = board.slice(board.indexOf('export function findCriticalPieces'));
  const body = findCritical.slice(0, findCritical.indexOf('\n}'));
  assert.match(findCritical, /CRITICAL_PIECES\.includes/);
  assert.ok(
    !/type\s*===\s*'K'\s*\|\|/.test(body),
    "findCriticalPieces still hardcodes 'K'/'G'; it must read CRITICAL_PIECES so the table " +
    'stays the single source of truth.',
  );
});

test('cat-and-mouse replay actually renders the cat inference it records', () => {
  const cm = readFileSync('src/pages/CatMouseGame.tsx', 'utf-8');

  // Frame.belief 必须被真正渲染，否则每回合存一份点云只是更贵的死代码。
  assert.match(cm, /belief:/);
  assert.match(cm, /shown\?\.belief/);

  // catAim 必须从「只写不读」变成有消费方。
  const catAimUses = cm.match(/catAim/g) || [];
  assert.ok(catAimUses.length >= 4, `catAim has ${catAimUses.length} references; expected writes + renders`);

  // 猫与老鼠必须同速，否则诱饵半径小于终局阈值，老鼠在结构上无解。
  const catMove = cm.match(/const CAT_MOVE\s*=\s*([\d.]+)/);
  const mouseMove = cm.match(/const MOUSE_MOVE\s*=\s*([\d.]+)/);
  assert.ok(catMove && mouseMove, 'CAT_MOVE / MOUSE_MOVE constants are missing');
  assert.equal(
    Number(catMove[1]),
    Number(mouseMove[1]),
    'cat and mouse must move at the same speed. A constant pursuer speed advantage on an ' +
    'unbounded plane degenerates the game into distance decay and makes decoys worthless.',
  );

  // 诱饵半径必须大于终局阈值，否则 deception 永远够不到阈值之外。
  const bait = cm.match(/const BAIT_RADIUS\s*=\s*([\d.]+)/);
  const endgame = cm.match(/const ENDGAME_CAPTURE\s*=\s*([\d.]+)/);
  assert.ok(bait && endgame, 'BAIT_RADIUS / ENDGAME_CAPTURE constants are missing');
  assert.ok(
    Number(bait[1]) > Number(endgame[1]),
    'BAIT_RADIUS must exceed ENDGAME_CAPTURE, otherwise the cat\'s information error is ' +
    'structurally smaller than the win threshold and the mouse cannot escape at all.',
  );
});

test('fullSearchIndex does not file one game\'s rules under another game', () => {
  const idx = readFileSync('src/data/fullSearchIndex.ts', 'utf-8');

  const lines = idx.split('\n');
  const fractal = lines.filter(l => l.includes('fractal-rules') || l.includes('game-fractal-echo'));
  assert.ok(fractal.length > 0, 'fractal echo has no search entries at all');

  // 递归回响是 3×3 同坐标广播的棋盘树，不是枝干生长游戏。
  // 这些关键词属于神经回响（neural-echo），曾经整条挂在 fractal-echo 下。
  const borrowed = ['子枝', '生长点', '剪枝', '6px'];
  for (const line of fractal) {
    for (const term of borrowed) {
      assert.ok(
        !line.includes(term),
        `fractal-echo's search entry still carries neural-echo's vocabulary ("${term}"): ` +
        `${line.trim()}`,
      );
    }
  }
});

test('giant-catch hints name the squares the code actually starts from', () => {
  const gc = readFileSync('src/sections/GiantCatch.tsx', 'utf-8');

  // 从常量推出真实坐标，hint 必须与之一致。
  const readStart = (name) => {
    const m = gc.match(new RegExp(`${name}: Point = \\{ x: (\\d+), y: (\\d+) \\}`));
    assert.ok(m, `could not read ${name} from GiantCatch.tsx`);
    return { x: Number(m[1]), y: Number(m[2]) };
  };
  const toLabel = (p) => `${String.fromCharCode(65 + p.x)}${p.y + 1}`;

  const mouse = toLabel(readStart('MOUSE_START'));
  const giant = toLabel(readStart('GIANT_START'));

  for (const file of ['src/data/gameHintTexts.ts', 'src/data/gameHintTexts.en.ts']) {
    const hints = readFileSync(file, 'utf-8');
    assert.ok(
      hints.includes(mouse) && hints.includes(giant),
      `${file} does not name both ${mouse} and ${giant}; the hint text has drifted from ` +
      'GiantCatch.tsx start positions.',
    );
  }
});

test('playground descriptions match the implemented rules for the audited games', () => {
  const pg = readFileSync('src/pages/Playground.tsx', 'utf-8');

  // 这几个词曾与实现不符，逐个禁止回归。
  //
  // 「立体空间 / 相位变换」尚未修：复合象棋那张卡片仍在宣称 12×12 棋盘有第三
  // 维度和相位机制，而代码里 Board 是二维的、零处相位实现。修它需要重写象棋的
  // 玩法文案，属于一次独立的改动，所以先在登记表里记为待办，而不是在这里假装
  // 它已经通过。下面用一个白名单把「已修」与「待修」区分开。
  const FIXED = ['终局封锁', '双阵营实战', '递归程序', 'recursive programs'];
  for (const forbidden of FIXED) {
    assert.ok(
      !pg.includes(forbidden),
      `Playground still advertises "${forbidden}", which the implementation does not do.`,
    );
  }

  // fractal-echo 曾经有一个只为覆盖文案而存在的 displayGameDescription 特判，
  // 它是「中文已改、英文没改」的成因。断言特判已被消除，文案只有一个来源。
  assert.ok(
    !/if \(game\.id === 'fractal-echo'\)/.test(pg),
    "displayGameDescription still special-cases 'fractal-echo'; that override is exactly how the " +
    'Chinese card got fixed while the English card kept claiming recursive programs.',
  );
});