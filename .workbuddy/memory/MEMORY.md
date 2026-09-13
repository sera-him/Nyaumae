
## 部署与工具链（长期）
- 线上站点：**Cloudflare Pages → nyaumae.pages.dev**（`zhi-yi-dialogue-os.nyaumae.chatgpt.site` 是已失效的旧域名，勿再当作线上地址）。
- 部署入口：桌面 `1-构建网页.cmd` / `2-部署网页.cmd` / `3-预览未部署网页.cmd` → `scripts/desktop-site-tool.mjs <build|deploy|preview|git-sync> [--check] [--no-git]`；Cloudflare Token、账号、项目名、分支从项目根 `启动部署工具.bat` 解析。
- **部署自动 git**：`deploy` 在确认发布后、下发前自动 `git add -A` 并提交（消息 `deploy: 自动提交（时间戳）`）。`--no-git` 可跳过；`git-sync` 动作可单独跑一次提交。**注意：本仓库当前没有配置 remote，所以只会本地提交、不会推送**——要自动推送需先 `git remote add origin <地址>`（脚本检测到 remote 会用 `git push -u` 建上游）。
- `wrangler` 已作为 devDependency（4.131.0），部署用 `node node_modules/wrangler/bin/wrangler.js pages deploy`；**不要再引入对本机缓存目录（如 codex-runtimes）的绝对路径依赖**。
- 常用自检：`node scripts/desktop-site-tool.mjs deploy --check`（不下发）。
- **在 WorkBuddy 内构建的坑**：Vite `emptyOutDir` 删 `dist/assets`（200+ 文件）会命中 safe-delete 批量删除保护（阈值 50），build 直接失败。构建前先整体重命名产物目录（`mv dist "tmp/dist-old-$(date +%s)"`，不能 `mv dist/* tmp/x/`，目标子目录非空会失败），让 Vite 重建。
- 图片约定：`public/**` 里有优化变体的原图会被 `prepare-sites.mjs` 从 dist 裁剪 → CSS/JS 引用图片必须用 `/optimized/...` 路径（否则线上 404）。

## 站点翻译层（长期）
- 语言按钮（`SiteAids` 右下角）走**运行时 DOM 翻译**：`src/lib/translations/dictionary.ts`（exact 整节点 + phrase 子串）+ `pageTranslator.ts`（TreeWalker + MutationObserver + 1.5s 全量对账 + WeakMap 可逆还原）。切换不 reload；`nc:locale:v1` 存 `zh-CN|en`。
- 词典只放**界面词**，别放内容词（意识/宇宙/计算…），否则正文高亮 span 会被误译为英文。
- 正文容器必须显式加 `data-no-translate`（已加：`ExtraStories` 根 section、`TextStoryReader` 的 `.story-reader-prose`）；单字节点永不翻译；`pre/code/textarea/svg` 及祖先链自动跳过。
