@echo off
chcp 65001 >nul
title 1-构建网页

set "APP_DIR=E:\app"
set "TOOL_NODE=C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%TOOL_NODE%" set "TOOL_NODE=node"
cd /d "%APP_DIR%" || goto :failed

"%TOOL_NODE%" "%APP_DIR%\scripts\desktop-site-tool.mjs" build %*
set "TOOL_EXIT=%ERRORLEVEL%"

echo.
if "%TOOL_EXIT%"=="0" (
  echo 完成：已 build，没有 deploy。
) else (
  echo 构建失败，请查看上方提示。
)
pause
exit /b %TOOL_EXIT%

:failed
echo 无法打开项目目录：%APP_DIR%
pause
exit /b 1
