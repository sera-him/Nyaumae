// Render-time zh-CN -> en for chrome components and misc pages.
export const BATCH5_CHROME_MISC: Record<string, string> = {
  // pages/CharacterDetail.tsx — character deep-file / word-frequency panel chrome.
  "· 从": "· from",
  "出场故事": "appears in",
  "词云与月": "Wordcloud & Moon",
  "次有效用词，": "valid word uses,",
  "大人国": "Grownup Country",
  "档案": "file",
  "年生": "-born",
  "年龄只是形象年龄": "Age is only the portrait age",
  "公元": "CE",
  "个唯一词汇。\n                这张 WordClouds 风格的词云与月覆盖完整词频集；文字实际面积按“词频^alpha”分配。": "unique words.\n                This WordClouds-style Wordcloud & Moon covers the full word-frequency set; actual text area is allocated by \"freq^alpha\".",
  "关联": "relations",
  "合并总结果": "merged totals",
  "条站内内容实时统计：": "site-wide entries, real-time stats:",
  "形象图集": "portrait gallery",
  "深层档案": "deep file",
  "中文统计": "zh stats",

  // components/WordFrequencyTable.tsx — table chrome fragments.
  "词语 · 出现次数 · 文档数（密集显示，每排": "word · count · docs (dense, per row",
  "加载更多（还有约": "Load more (about",
  "显示": "Show",
  "项）": "more)",
  "组）": ")",

  // components/WordFrequencyCloud.tsx — cloud chrome.
  "“词云与月” ·": "“Wordcloud & Moon” ·",
  "下载 PNG": "Download PNG",

  // pages/DataStatsPage.tsx — analytics chrome.
  "次 · 最近": "visits · latest",

  // pages/ThemedChat.tsx — themed chat chrome.
  "正在编辑历史消息；发送后将从这里重新生成": "Editing a past message; sending regenerates from here",

  // pages/Playground.tsx — playground chrome.
  "在好好搭搭上打开": "Open in Haohaodada",

  // pages/AISettingsPage.tsx — image settings chrome.
  "图片显示": "Image display",
  "展示原始图片": "Show original image",

  // components/AnimatedStats.tsx — animated stat chrome.
  "| 人均寿命": "Avg. lifespan",

  // components/RouteMetadata.tsx — not-found metadata.
  "页面未找到 — Neural Connection": "Page not found — Neural Connection",
};
