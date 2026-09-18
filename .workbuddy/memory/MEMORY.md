
## 部署与工具链（长期）
- 线上站点：**Cloudflare Pages → nyaumae.pages.dev**（`zhi-yi-dialogue-os.nyaumae.chatgpt.site` 是已失效的旧域名，勿再当作线上地址）。
- 部署入口：桌面 `1-构建网页.cmd` / `2-部署网页.cmd` / `3-预览未部署网页.cmd` → `scripts/desktop-site-tool.mjs <build|deploy|preview|git-sync> [--check] [--no-git]`；Cloudflare Token、账号、项目名、分支从项目根 `启动部署工具.bat` 解析。
- **部署自动 git**：`deploy` 在确认发布后、下发前自动 `git add -A` 并提交（消息 `deploy: 自动提交（时间戳）`）。`--no-git` 可跳过；`git-sync` 动作可单独跑一次提交。**仓库已有 remote `https://github.com/sera-him/Nyaumae.git`（main），但本机到 GitHub 的 schannel TLS 握手失败且会长时间挂起——实测把一次部署卡死 30 分钟。在 WorkBuddy 内部署一律加 `--no-git`**（提交会由前一次 autoGitSync 落地，只是推不上去）。
- `wrangler` 已作为 devDependency（4.131.0），部署用 `node node_modules/wrangler/bin/wrangler.js pages deploy`；**不要再引入对本机缓存目录（如 codex-runtimes）的绝对路径依赖**。
- 常用自检：`node scripts/desktop-site-tool.mjs deploy --check`（不下发）。
- **在 WorkBuddy 内构建的坑**：Vite `emptyOutDir` 删 `dist/assets`（200+ 文件）会命中 safe-delete 批量删除保护（阈值 50），build 直接失败。构建前先整体重命名产物目录（`mv dist "tmp/dist-old-$(date +%s)"`，不能 `mv dist/* tmp/x/`，目标子目录非空会失败），让 Vite 重建。
- **线上比本地多一层 URL 规范化**：Cloudflare Pages 给预渲染目录补尾斜杠（`/chat/ocean` → `/chat/ocean/`），`serve-dist.mjs` 本地预览不会。**任何 `location.pathname` 的精确比对都必须先过 `normalizePathname()`（`src/lib/visualTheme.ts` 已导出）**，否则线上静默失效。历史故障：聊天页 `/chat/ocean/` 导致 `isThemedChatRoute` 为 false → 页脚被渲染 + main 失去高度锁死 → 整页 1503px，外层滚动条把输入框卷走。**验线上问题必须带尾斜杠访问。**
- 图片约定：`public/**` 里有优化变体的原图会被 `prepare-sites.mjs` 从 dist 裁剪 → CSS/JS 引用图片必须用 `/optimized/...` 路径（否则线上 404）。

## 聊天页布局（长期，勿再分散）
- **高度链只有一处真源：`src/pages/chat-layout.css`**（`ChatSkin.css` / `SweetDreamChat.css` / `AuroraChat.css` 只留配色与装饰，不要再写 `height`/`position:absolute` 的布局）。三主题都用 `.ocean-*`/`.sweet-*`/`.aurora-*` 前缀，共用选择器组。
- 高度令牌：`--app-vh` 三重兜底 = `100vh` → `@supports(100svh)` → `html[data-app-vh="measured"]` 时用 `--app-vh-px`（`src/hooks/useAppViewportHeight.ts` 写入，跟进 visualViewport/软键盘）。**命令式写死高度时只用 `height` + `max-height` 同值 + `min-height:0`，绝不再用 `min-height: calc(100vh - …)`，它会和 height 打架并把容器撑高。**
- 结构：`main.aurora-site-main--chat`（用元素+类提高优先级，压过 `aurora-design-system` 的 `.aurora-site-main{min-height:100svh}`）→ `.xxx-chat`（margin-top 导航高，height=`var(--app-vh) - 导航`，**必须同时声明 `grid-template-rows: minmax(0,1fr)`**）→ `.xxx-chat-shell`（`grid-template-rows: minmax(0,1fr) auto`）→ 第 1 行 `.xxx-chat-main`（flex column，内含唯一滚动区 `.xxx-chat-scroll`）、第 2 行 `.xxx-composer-shell`（输入框，**占位不再 absolute**，窄屏 68px 底部内边距给移动导航让位）。
- **grid 隐式行陷阱（已踩）**：只写 `grid-template-columns` 时隐式行按 max-content 计算，侧栏对话一多（40 个 → 2401px）就顶开整行，`height:100%` 的兄弟面板跟着膨胀，底部输入框被推到视口外。**凡是侧栏+主区两栏骨架，都要 `grid-template-rows: minmax(0,1fr)`；侧栏 `min-height:0; overflow:hidden`；侧栏内列表 `flex:1 1 auto; min-height:0; overflow-y:auto`（列表的 `min-height:180px` 之类会阻止收缩，是撑破的帮凶）。**
- 回归脚本：`tmp/chat-layout-verify.mjs`（高度链，3 主题 × 带/不带尾斜杠 × 多视口，注入 40 条消息后断言 6 项）、`tmp/chat-sidebar-verify.mjs`（**灌 40 个对话** + 30 条消息，断言侧栏不撑破容器 / 输入框在视口内 / 两个列表都真能滚）、`tmp/chat-interaction-test.mjs`（多行草稿/面板/侧栏）。改完布局必跑全部 + tsc + eslint。**测试必须同时灌「对话」和「消息」——只灌消息会漏掉侧栏这条路径。**

## 站点翻译层（长期）
- 语言按钮（`SiteAids` 右下角）走**运行时 DOM 翻译**：`src/lib/translations/dictionary.ts`（exact 整节点 + phrase 子串，含 `entries/*.ts` 分批/规则/界面词）+ `pageTranslator.ts`（TreeWalker + MutationObserver + 1.5s 全量对账 + WeakMap 可逆还原）。切换不 reload；`nc:locale:v1` 存 `zh-CN|en`。
- **中文模式是硬不变量**：`startPageTranslation(false)` 在 `touchedAnything === false` 时不扫 DOM、不挂 observer → 默认访问零写入。验证脚本 `tmp/zh-proof.mjs`（给 `Node.prototype.nodeValue` / `setAttribute` / `document.title` 打桩，按调用栈筛出翻译模块的写入）实测 6/6 页面 0 写入、EN 模式 34 次写入、en→zh 往返文本完全一致。
- **正文 / 界面必须分流**（否则出现中英混杂）：
  - 正文走 `semanticHighlightProse()`（不本地化）；正文容器显式 `data-no-translate`（`ExtraStories` 根 section、`TextStoryReader` 的 `.story-reader-prose`）。
  - `pageTranslator` 侧三重跳过：单字节点 / 拆分容器（≥5 个单字子节点）/ **散文碎片**（`isProseFragment`：节点在行内包装里、自身 CJK ≤6、所属 block CJK ≥24、block 有 ≥2 个含中文的直接子节点、且 block 的直接子元素**全是行内**——只要 block 里出现真块级子元素（卡片带 `<p>` 说明）就判定是布局而非散文，标签必须翻译）。
  - 词典只放**界面词**，别放内容词（意识/宇宙/计算…），否则正文高亮 span 会被误译为英文。
- 覆盖率口径：`tmp/gap3.mjs`（复刻翻译器的跳过规则，只报访客真会读到中文的界面文案）。当前 `/nctb`、`/analytics`、`/characters`、`/world/settings`、`/math/fsiii` 界面缺口=0；残留只有正文内容（高亮词、高频词表、章节/卡片标题）。
- **长篇正文（约 25 万字，`storyText.ts` 独占 21 万字）目前仍是中文**：站内没有服务端接口，Cloudflare Workers AI 用现有 Pages Token 调不通（401 无权限），Google gtx 走代理 502，有道 demo 接口一限流就 103，只剩社区 LibreTranslate（`translate.disroot.org` 可用但质量一般、需 ~1.6s/请求）。要出英文版必须有一条可批量调的翻译通道（用户提供 DeepSeek 等 Key 最实际）。

## 中英翻译层（长期架构）
- 运行时 DOM 翻译：`src/lib/translations/pageTranslator.ts`（TreeWalker + MutationObserver + 1.5s 对账 + WeakMap 还原），词典 `dictionary.ts`（entries/batch1-4 + ui + chrome），规则 `entries/rules.ts`。中文模式零 DOM 写入。
- 防误译关键：`behavesInline()` 按计算 display 判行内（flex 卡片 `<a>` 不能穿透）；散文/诗歌/逐字动画/单字名**设计内不翻译**（`isProseFragment`、isSplitTextNode、SINGLE_CHAR_SURFACE 白名单例外）。界面层用 `translateSurfaceText()`，正文用 `semanticHighlightProse()`。
- 线上验收脚本 `tmp/final-live.mjs`（addInitScript 预置 locale；等待真实内容标记而非固定时长）。
