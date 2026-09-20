// Dynamic (composed) render-time strings for the game boards.
// These run only when the exact dictionary misses, matching the RENDERED form.
export function applyGamesRules(input: string): string | null {
  const t = input.trim();

  // CatMachine cat aria label, e.g.
  // "豆包，想玩耍。天赋暴走：在逗猫舱满意时，加 4 呼噜。，已选中"
  // -> "Bean Bun, wants to play. Talent Rampage: when a teaser pod is satisfied, +4 snore., selected"
  {
    const m = t.match(/^(.+?)，(.+?)。天赋(.+?)：(.+?)(，已选中|，可与已选猫交换)?$/);
    if (m) {
      const suffix = m[5] === '，已选中'
        ? ', selected'
        : m[5] === '，可与已选猫交换'
          ? ', can swap with the selected cat'
          : '';
      return input.replace(t, () => `${m[1]}, ${m[2]}. Talent ${m[3]}: ${m[4]}${suffix}`);
    }
  }

  return null;
}
