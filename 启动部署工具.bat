@echo off
title Neural Connection 部署工具（全自动）
chcp 65001 >nul

echo ═══════════════════════════════════════════
echo   Neural Connection 部署工具
echo   Cloudflare Pages Build ^& Deploy（全自动）
echo ═══════════════════════════════════════════
echo.

:: ── Cloudflare 凭证（SEC-002/003 修复：凭据不再写入文件，改读环境变量）──
:: 一次性配置（PowerShell 执行后重开本工具）：
::   setx CLOUDFLARE_API_TOKEN "你的新Token"
::   setx CLOUDFLARE_ACCOUNT_ID "你的AccountID"
:: 安全提醒：旧 Token 已泄露进 git 历史，必须先在 Cloudflare 控制台吊销！
if "%CLOUDFLARE_API_TOKEN%"=="" (
  echo [缺少凭据] 未检测到环境变量 CLOUDFLARE_API_TOKEN。
  echo 请先执行: setx CLOUDFLARE_API_TOKEN "你的新Token" 然后重开本工具。
  echo 安全提醒: 旧 Token 已泄露进 git 历史，请先在 Cloudflare 控制台吊销。
  pause
  exit /b 1
)
if "%CLOUDFLARE_ACCOUNT_ID%"=="" (
  echo [缺少凭据] 未检测到环境变量 CLOUDFLARE_ACCOUNT_ID。
  echo 请先执行: setx CLOUDFLARE_ACCOUNT_ID "你的AccountID" 然后重开本工具。
  pause
  exit /b 1
)
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
node scripts\deploy-tool.mjs

pause
