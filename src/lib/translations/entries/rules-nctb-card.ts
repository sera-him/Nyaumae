// Compositional rules for NCTB report-card / trials runtime strings; English or null.
export function applyNctbCardRules(input: string): string | null {
  const t = input.trim();

  {
    const m = t.match(/^(.+?) · 覆盖 (\d+) \/ (\d+) 个指数$/);
    if (m) return `${m[1]} · covers ${m[2]} / ${m[3]} indices`;
  }
  {
    // Index row norm-bar aria label, e.g. "标准分 120".
    const m = t.match(/^标准分 ([\d.]+)$/);
    if (m) return `standard score ${m[1]}`;
  }
  {
    // Trial-group badge, e.g. "3 选 1".
    const m = t.match(/^(\d+) 选 1$/);
    if (m) return `choose 1 of ${m[1]}`;
  }
  {
    // Result footer, e.g. "历史最佳 95 分 · 已挑战 4 次".
    const m = t.match(/^历史最佳 ([\d.]+) 分 · 已挑战 (\d+) 次$/);
    if (m) return `best yet ${m[1]} pts · attempted ${m[2]} times`;
  }

  return null;
}
