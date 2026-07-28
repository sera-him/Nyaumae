@echo off
title Neural Connection 部署工具
chcp 65001 >nul

echo ═══════════════════════════════════════════
echo   Neural Connection 部署工具
echo   Cloudflare Pages Build ^& Deploy
echo ═══════════════════════════════════════════
echo.

:: ── Cloudflare 凭证 ──
set "CLOUDFLARE_API_TOKEN=cfat_2pGWCli8qP3AeSxKyf3QjS0SaKxHipMSwhSK2Xz0c50f43ef"
set "CLOUDFLARE_ACCOUNT_ID=f48158b30d064816b53ccfbe126ed23c"
set "CLOUDFLARE_PAGES_PROJECT=nyaumae"

:: ── 部署工具配置 ──
set "DEPLOY_TOOL_PORT=3344"
set "DEPLOY_TOOL_BUILD_COMMAND=npm run build"
set "DEPLOY_TOOL_OUTPUT_DIR=dist"

cd /d "%~dp0"

:: 打开部署面板
start "" "C:\Users\Administrator\Desktop\部署面板.html"

:: 启动服务
node deploy-tool.mjs

pause
