// Compositional rules for NCTB subtask runtime strings; return English or null.
export function applyNctbTasksRules(input: string): string | null {
  const t = input.trim();

  {
    const m = t.match(/^(\d+) 秒答对 (\d+) 次$/);
    if (m) return `${m[1]} s — ${m[2]} correct`;
  }
  {
    const m = t.match(/^(\d+) 步完成（最优 (\d+) 步）$/);
    if (m) return `${m[1]} steps (optimal ${m[2]} steps)`;
  }
  {
    const m = t.match(/^(\d+) 次成绩：(.+) ms$/);
    if (m) return `${m[1]} runs: ${m[2]} ms`;
  }
  {
    const m = t.match(/^，抢跑 (\d+) 次已扣分。$/);
    if (m) return `, ${m[1]} false starts (points deducted).`;
  }
  {
    const m = t.match(/^6 轮归位用时 (\d+) 秒$/);
    if (m) return `6 rounds — aligned in ${m[1]} s`;
  }
  {
    const m = t.match(/^60 秒判对 (\d+) 组$/);
    if (m) return `60 s — ${m[1]} pairs correct`;
  }
  {
    const m = t.match(/^60 秒译对 (\d+) 个符号$/);
    if (m) return `60 s — ${m[1]} symbols decoded`;
  }
  {
    const m = t.match(/^(红|蓝|绿|黄)色$/);
    if (m) {
      const color: Record<string, string> = { 红: 'Red', 蓝: 'Blue', 绿: 'Green', 黄: 'Yellow' };
      return color[m[1]] ?? m[0];
    }
  }
  {
    const m = t.match(/^成功复现 (\d+) 步序列$/);
    if (m) return `Recreated a ${m[1]}-step sequence`;
  }
  {
    const m = t.match(/^点击开始第 (\d+) 轮$/);
    if (m) return `Click to start round ${m[1]}`;
  }
  {
    const m = t.match(/^格子 (\d+)$/);
    if (m) return `Tile ${m[1]}`;
  }
  {
    const m = t.match(/^共判断 (\d+) 组，正确率 (\d+)%；参考节奏约为每分钟 20 组。$/);
    if (m) return `Judged ${m[1]} pairs, accuracy ${m[2]}%; reference pace ~20 pairs/min.`;
  }
  {
    const m = t.match(/^共旋转 (\d+) 步；目标参考 (\d+) 秒，多余的转动会小幅扣分。$/);
    if (m) return `Rotated ${m[1]} steps; reference time ${m[2]} s — extra turns cost a few points.`;
  }
  {
    const m = t.match(/^共作答 (\d+) 次，正确率 (\d+)%；参考节奏约为每分钟 45 个。$/);
    if (m) return `Answered ${m[1]} times, accuracy ${m[2]}%; reference pace ~45 items/min.`;
  }
  {
    const m = t.match(/^共作答 (\d+) 次，正确率 (\d+)%；字义是干扰，墨色才是答案。$/);
    if (m) return `Answered ${m[1]} times, accuracy ${m[2]}%; the word is a distractor — the ink color is the answer.`;
  }
  {
    const m = t.match(/^轮到你了：第 (\d+) \/ (\d+) 步$/);
    if (m) return `Your turn: step ${m[1]} / ${m[2]}`;
  }
  {
    const m = t.match(/^平均反应时 (\d+) ms$/);
    if (m) return `Mean reaction time ${m[1]} ms`;
  }
  {
    const m = t.match(/^抢跑 (\d+) 次$/);
    if (m) return `${m[1]} false starts`;
  }
  {
    const m = t.match(/^数字逐个闪现后复述；正背从 (\d+) 位、倒背从 (\d+) 位开始逐次加 1，倒背同时考察保持与重排。$/);
    if (m) return `Recite the digits as they flash one by one; forward recall starts at ${m[1]} digits, backward at ${m[2]}, rising by 1 each round — backward recall tests both holding and reordering.`;
  }
  {
    const m = t.match(/^误点 (\d+) 次；目标参考 (\d+) 秒，越快越准分越高。$/);
    if (m) return `${m[1]} misclicks; reference time ${m[2]} s — faster and more accurate scores higher.`;
  }
  {
    const m = t.match(/^序列从 (\d+) 步开始每次加 1，你在 (\d+) 步序列上出错。$/);
    if (m) return `The sequence starts at ${m[1]} steps and grows by 1 each round; you slipped up at the ${m[2]}-step sequence.`;
  }
  {
    const m = t.match(/^已完成：(.+) ms$/);
    if (m) return `Done: ${m[1]} ms`;
  }
  {
    const m = t.match(/^用时 (\d+) 秒；每多走一步都会拉低效率分，先想清楚再动手。$/);
    if (m) return `Took ${m[1]} s; every extra step lowers the efficiency score — plan before you move.`;
  }
  {
    const m = t.match(/^找齐 (\d+) 个目标，用时 (\d+) 秒$/);
    if (m) return `Found all ${m[1]} targets in ${m[2]} s`;
  }
  {
    const m = t.match(/^正背 (\d+) 位 · 倒背 (\d+) 位$/);
    if (m) return `Forward ${m[1]} digits · backward ${m[2]} digits`;
  }
  {
    const m = t.match(/^正背成绩 (\d+) 位$/);
    if (m) return `Forward recall best: ${m[1]} digits`;
  }
  {
    const m = t.match(/^柱子 (\d+)$/);
    if (m) return `Peg ${m[1]}`;
  }
  {
    const m = t.match(/^最优 (\d+) 步$/);
    if (m) return `Optimal ${m[1]} steps`;
  }

  return null;
}
