// Render-time rules for worldbuilding lore sections.
//
// Every dynamic candidate in the batch-5 lore scope is already handled upstream
// in ./rules.ts, so this function intentionally adds nothing new:
//   - `${N}个空间导航`            -> /^(\d+)个空间导航$/ (rules.ts)
//   - `X未找到 "Y"`              -> covers 故事/角色/咪呀空间/世界领域/数学模型 (rules.ts)
//   - `未找到 API 供应商 "X"`    -> rules.ts
// It exists as the integration point for any future compositional lore strings.
export function applyLoreRules(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  return null;
}
