
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
- 结构：`main.aurora-site-main--chat`（用元素+类提高优先级，压过 `aurora-design-system` 的 `.aurora-site-main{min-height:100svh}`）→ `.xxx-chat`（margin-top 导航高，height=`var(--app-vh) - 导航`）→ `.xxx-chat-shell`（`grid-template-rows: minmax(0,1fr) auto`）→ 第 1 行 `.xxx-chat-main`（flex column，内含唯一滚动区 `.xxx-chat-scroll`）、第 2 行 `.xxx-composer-shell`（输入框，**占位不再 absolute**，窄屏 68px 底部内边距给移动导航让位）。
- 回归脚本：`tmp/chat-layout-verify.mjs`（3 主题 × 带/不带尾斜杠 × 多视口，注入 40 条消息后断言 6 项）、`tmp/chat-interaction-test.mjs`（多行草稿/面板/侧栏）。改完布局必跑这两个 + tsc + eslint。

## 站点翻译层（长期）
- 语言按钮（`SiteAids` 右下角）走**运行时 DOM 翻译**：`src/lib/translations/dictionary.ts`（exact 整节点 + phrase 子串）+ `pageTranslator.ts`（TreeWalker + MutationObserver + 1.5s 全量对账 + WeakMap 可逆还原）。切换不 reload；`nc:locale:v1` 存 `zh-CN|en`。
- 词典只放**界面词**，别放内容词（意识/宇宙/计算…），否则正文高亮 span 会被误译为英文。
- 正文容器必须显式加 `data-no-translate`（已加：`ExtraStories` 根 section、`TextStoryReader` 的 `.story-reader-prose`）；单字节点永不翻译；`pre/code/textarea/svg` 及祖先链自动跳过。
