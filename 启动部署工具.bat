@echo off
title Neural Connection 部署工具（全自动）
chcp 65001 >nul

echo ═══════════════════════════════════════════
echo   Neural Connection 部署工具
echo   Cloudflare Pages Build ^& Deploy（全自动）
echo ═══════════════════════════════════════════
echo.

:: ── Cloudflare 凭证 ──
set "CLOUDFLARE_API_TOKEN=cfat_2pGWCli8qP3AeSxKyf3QjS0SaKxHipMSwhSK2Xz0c50f43ef"
set "CLOUDFLARE_ACCOUNT_ID=f48158b30d064816b53ccfbe126ed23c"
set "CLOUDFLARE_PAGES_PROJECT=nyaumae"

:: ── 部署分支：必须与 Cloudflare 项目的 production_branch 一致（gh-pages），
::    否则只会生成 preview 部署，nyaumae.pages.dev 主域名不会更新 ──
set "CLOUDFLARE_PAGES_BRANCH=gh-pages"

:: ── 全自动模式：工具启动后自动执行 构建 + 部署，无需手动点击确认 ──
set "DEPLOY_TOOL_AUTO=1"

:: ── 部署工具配置 ──
set "DEPLOY_TOOL_PORT=3344"
set "DEPLOY_TOOL_BUILD_COMMAND=npm run build"
set "DEPLOY_TOOL_OUTPUT_DIR=dist"

cd /d "%~dp0"

:: 启动服务（工具会自动打开面板 http://127.0.0.1:3344 并自动构建部署）
node deploy-tool.mjs

pause
