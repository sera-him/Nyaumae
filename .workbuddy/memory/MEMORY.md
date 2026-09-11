
## 部署与工具链（长期）
- 线上站点：**Cloudflare Pages → nyaumae.pages.dev**（`zhi-yi-dialogue-os.nyaumae.chatgpt.site` 是已失效的旧域名，勿再当作线上地址）。
- 部署入口：桌面 `1-构建网页.cmd` / `2-部署网页.cmd` / `3-预览未部署网页.cmd` → `scripts/desktop-site-tool.mjs <build|deploy|preview|git-sync> [--check] [--no-git]`；Cloudflare Token、账号、项目名、分支从项目根 `启动部署工具.bat` 解析。
- **部署自动 git**：`deploy` 在确认发布后、下发前自动 `git add -A` 并提交（消息 `deploy: 自动提交（时间戳）`）。`--no-git` 可跳过；`git-sync` 动作可单独跑一次提交。**注意：本仓库当前没有配置 remote，所以只会本地提交、不会推送**——要自动推送需先 `git remote add origin <地址>`（脚本检测到 remote 会用 `git push -u` 建上游）。
- `wrangler` 已作为 devDependency（4.131.0），部署用 `node node_modules/wrangler/bin/wrangler.js pages deploy`；**不要再引入对本机缓存目录（如 codex-runtimes）的绝对路径依赖**。
- 常用自检：`node scripts/desktop-site-tool.mjs deploy --check`（不下发）。
- 图片约定：`public/**` 里有优化变体的原图会被 `prepare-sites.mjs` 从 dist 裁剪 → CSS/JS 引用图片必须用 `/optimized/...` 路径（否则线上 404）。
