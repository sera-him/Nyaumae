# Nyaumæ 站长期记忆

## 部署
- 线上 CF Pages → nyaumae.pages.dev（旧域名失效勿用）。入口 `node scripts/desktop-site-tool.mjs <build|deploy>`；deploy 不构建只传 dist；**本机一律 `deploy --no-git --yes`**（勿调 cmd，pause 卡死）。
- wrangler stderr 警告会被误判 exit 1：看日志 `Deployment complete!`/`部署命令已成功完成`，再 curl 线上新 chunk HEAD 200。
- **build 前 `mv dist tmp/dist-old-<ts>`**（勿 mv dist/*），否则 safe-delete 保护（阈值 50）致 build 失败。
- **Bash 工具间歇性 PATH 失效**（报 dirname/cd null directory、外部命令全 127，echo 因是内建仍能跑）→ 显式 `export PATH="/c/Users/Administrator/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:.../bin:/usr/bin:/bin:$PATH"` 或重试；长命令输出一律重定向到 tmp/*.log 再 Read。
- worldSettings 等数据模块实际打包在 `hyperCommunication.en-*.js` chunk（不在 fullSearchIndex chunk），线上文案复核 grep 这个文件。
- 线上预渲染目录补尾斜杠：pathname 比对先过 `normalizePathname()`（visualTheme.ts）；有优化变体的原图被裁，引用用 `/optimized/`。

## 字体
- generate-font-css.mjs FONT_RULES 定静态字重，**无 variable.css**；字重 (500,700] 吸附 700，中间字重无 600 切面全渲染 700——补切面或写面值。线上对 fonts.css MD5。

## 微交互/聊天布局
- 聚焦双层阴影环（3px .16 + 6px .07），composer 容器 focus-within；流式打字 `.chat-stream-char`，**尾迹起点必须在 onToken 回调算**；高度链 chat-layout.css + `--app-vh`；grid 两栏都要 `minmax(0,1fr)` + 侧栏 min-height:0;overflow:hidden；回归脚本 tmp/chat-*-verify.mjs 须灌对话+消息。

## 翻译层
- dictionary.ts(entries/*) + pageTranslator（TreeWalker+Observer+1.5s 对账）；**中文模式零 DOM 写入不变量**（tmp/zh-proof.mjs）；正文 data-no-translate 走 semanticHighlightProse，词典只放界面词；长篇正文仅中文，出英文需用户给 Key。

## 角色数据
- **中英数组 id 顺序必须一致**（verify-characters.mjs）；新角色 6 处：characters.ts/.en.ts、relationships.ts/.en.ts、CHAR_KEYWORDS、characterImages.ts、词典 overflow.ts；**改 bio 只 3 处**（characters.ts/.en.ts + 词典整句条目）；关系图坐标用 tmp/place-miiya3.mjs；**性别未知一律 ta**。

## 影像素材
- characterImages.ts 三表（已 export）：头像/图集/视频；只登记真实文件（public/characters/<id>/），视频不走优化管线，抽帧用 opencv。

## 词频口径
- 单字计入；highlightMap 要 count≥4 且 length≥2。语料=fullSearchIndex add() + generate-frequency-corpus.mjs（EXTRA_SCAN_FILES 含 localModelCatalog.ts）；**红线：同文件不得双通**（tmp/dedup-final.mjs 计数=1）。
- 门禁 verify:corpus 挂 build 链；**桌面工具 build 不跑语料生成**，新增文案先手动跑生成器再过门禁。新中文词补 segmenterLexicon（CURATED 重跑）；**DP 词数优先，只补会被切碎的双字词**。Node 脚本加桩：`--import ./tmp/env-stub-hooks.mjs`。

## 新故事登记（9 处）
stories.ts/.en.ts、storyCovers.ts、storyThemeConfig.ts、routeManifest.ts（目录组 items+篇数句）、词典（label+篇数两形态）、visualTheme.ts prefixes、routeBaseline.ts、imageInventory.ts usedIn；路由免改；timeline/组织卡 desc 是词典整句（zh/en/overflow 三处）。

## 本地模型目录
- LOCAL_MODEL_TIERS（localModelCatalog.ts）= AI 设置页模型列表，按 parameters 排序；无 Ollama 包自动走 HF 通道。2026-10-24 加 LittleLearner 三档 chatty：ll_0_6b/ll_1_3b/ll_5b（Qwen3 架构，HF 官方权重，无 browserModel）。
