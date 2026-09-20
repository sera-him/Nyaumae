// Dynamic render-time rules for chrome components and misc pages.
//
// Every in-scope `${...}` runtime string for this batch is already covered by
// the existing rule families in rules.ts (e.g. "X 形象 N", "继续阅读X，Y",
// "X插图", "X加载失败，点击重试", "X · X 次", "X，出现 X 次，X 篇",
// "X：X 次 / X 篇", "词云与月 alpha", "X个浏览会话", "当前等级进度 X%",
// "摸摸泡芙…", "X未找到 \"Y\"", "X玩法说明"). The StoryReader chapter / image
// strings already branch on isEn. No additional regexes are therefore needed.
export function applyChromeMiscRules(input: string): string | null {
  const t = input.trim();
  void t;
  return null;
}
