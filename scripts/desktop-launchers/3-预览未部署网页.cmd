@echo off
chcp 65001 >nul
title 3-预览未部署网页

set "APP_DIR=C:\Users\Administrator\Desktop\app"
set "TOOL_NODE=C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%TOOL_NODE%" set "TOOL_NODE=node"
cd /d "%APP_DIR%" || goto :failed

"%TOOL_NODE%" "%APP_DIR%\scripts\desktop-site-tool.mjs" preview %*
set "TOOL_EXIT=%ERRORLEVEL%"

echo.
if not "%TOOL_EXIT%"=="0" echo 预览未正常结束，请查看上方提示。
pause
exit /b %TOOL_EXIT%

:failed
echo 无法打开项目目录：%APP_DIR%
pause
exit /b 1
