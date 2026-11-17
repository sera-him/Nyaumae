export type InstallerPlatform = 'windows' | 'macos' | 'linux';

export interface InstallerOptions {
  /** Ollama 模型名，例如 qwen2.5:3b。 */
  model: string;
  /** 写进 OLLAMA_ORIGINS 的站点地址，逗号分隔后交给 Ollama。 */
  origins: string[];
}

const FALLBACK_SITE_ORIGINS = [
  'https://nyaumae.pages.dev',
  'https://*.nyaumae.pages.dev',
];

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

/**
 * 一键包必须知道「哪些网页地址可以调用这台电脑上的模型」。
 * 当前页面的 origin 是必给的；再补上生产域名和常见本地开发端口，
 * 这样同一份脚本在预览部署和本地开发时也能用。
 */
export function siteOrigins(): string[] {
  const origins = new Set<string>(FALLBACK_SITE_ORIGINS);
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
    origins.add(window.location.origin);
  }
  for (const origin of DEV_ORIGINS) origins.add(origin);
  return [...origins];
}

export function detectInstallerPlatform(): InstallerPlatform {
  if (typeof navigator === 'undefined') return 'windows';
  const platform = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('linux') || platform.includes('x11')) return 'linux';
  return 'windows';
}

export function installerFileName(platform: InstallerPlatform): string {
  if (platform === 'macos') return 'nyaumae-one-click-ai.command';
  if (platform === 'linux') return 'nyaumae-one-click-ai.sh';
  return 'nyaumae-one-click-ai.bat';
}

function sanitizeModel(model: string): string {
  return model.replace(/[^A-Za-z0-9._:/-]/g, '');
}

function sanitizeOrigins(origins: string[]): string {
  return origins
    .map((origin) => origin.replace(/["%;&|<>^%]/g, ''))
    .filter(Boolean)
    .join(',');
}

function windowsScript(options: InstallerOptions): string {
  const model = sanitizeModel(options.model);
  const origins = sanitizeOrigins(options.origins);
  const script = String.raw`@echo off
setlocal EnableExtensions
chcp 65001 >nul
title 一键安装本地 AI

set "MODEL=${model}"
set "ORIGINS=${origins}"
set "OLLAMA_DIR=%LOCALAPPDATA%\Programs\Ollama"
set "OLLAMA_EXE=%OLLAMA_DIR%\ollama.exe"
set "OLLAMA_APP=%OLLAMA_DIR%\ollama app.exe"

echo.
echo  ============================================================
echo   一键安装本地 AI
echo  ============================================================
echo   这个窗口会自动做完三件事：
echo     1. 安装运行器 Ollama，约 200 MB，不需要管理员权限
echo     2. 启动本地服务，并放行本站在用的网址
echo     3. 下载对话模型 ${model}
echo   全部完成后回到网页，页面会自动连上，不用再填任何参数。
echo   你已有的模型不会被删除，也不会被覆盖。
echo  ============================================================
echo.

where ollama >nul 2>nul
if not errorlevel 1 for /f "delims=" %%i in ('where ollama') do set "OLLAMA_EXE=%%i"
if exist "%OLLAMA_EXE%" goto have_runtime

echo [1/4] 正在下载 Ollama 安装包，约 200 MB，请稍候...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -UseBasicParsing -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile (Join-Path $env:TEMP 'OllamaSetup.exe') } catch { exit 1 }"
if not errorlevel 1 goto installer_downloaded
echo        改用 curl 再试一次...
curl -fL --retry 2 -o "%TEMP%\OllamaSetup.exe" "https://ollama.com/download/OllamaSetup.exe"
:installer_downloaded
if not exist "%TEMP%\OllamaSetup.exe" goto download_failed

echo [2/4] 正在安装 Ollama，这一步不需要点任何按钮...
start /wait "" "%TEMP%\OllamaSetup.exe" /VERYSILENT /NORESTART /SUPPRESSMSGBOXES
del "%TEMP%\OllamaSetup.exe" >nul 2>nul
where ollama >nul 2>nul
if not errorlevel 1 for /f "delims=" %%i in ('where ollama') do set "OLLAMA_EXE=%%i"
if not exist "%OLLAMA_EXE%" goto install_failed

:have_runtime
echo [3/4] 正在启动本地服务并放行本站网址...
taskkill /F /IM "ollama app.exe" >nul 2>nul
taskkill /F /IM "ollama.exe" >nul 2>nul
timeout /t 2 >nul
set "OLLAMA_ORIGINS=%ORIGINS%"
setx OLLAMA_ORIGINS "%ORIGINS%" >nul
if exist "%OLLAMA_APP%" start "" "%OLLAMA_APP%"
if not exist "%OLLAMA_APP%" start "Ollama Server" /min "%OLLAMA_EXE%" serve

set /a TRIES=0
:wait_server
set /a TRIES+=1
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $null = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://127.0.0.1:11434/api/tags'; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto server_ready
if %TRIES% GEQ 40 goto server_timeout
timeout /t 2 >nul
goto wait_server

:server_ready
echo [4/4] 正在下载模型 ${model}，第一次需要几分钟...
echo.
"%OLLAMA_EXE%" pull ${model}
if errorlevel 1 goto pull_failed

echo.
echo  ============================================================
echo   完成。回到网页，几秒内会自动显示「已连接」。
echo  ============================================================
echo.
pause
exit /b 0

:download_failed
echo.
echo  安装包下载失败，请检查网络后重新运行本文件。
echo  也可以手动安装：https://ollama.com/download
echo  装好后回到网页点「重新检测」。
echo.
pause
exit /b 1

:install_failed
echo.
echo  安装没有完成。请手动运行 OllamaSetup.exe，再回到网页点「重新检测」。
echo  下载地址：https://ollama.com/download
echo.
pause
exit /b 1

:server_timeout
echo.
echo  本地服务没有按时启动。请从开始菜单手动打开 Ollama，
echo  再回到网页点「重新检测」。
echo.
pause
exit /b 1

:pull_failed
echo.
echo  模型下载失败。可以稍后重新运行本文件，它会接着下载。
echo  也可以手动执行：ollama pull ${model}
echo.
pause
exit /b 1
`;
  return script.replace(/\n/g, '\r\n');
}

function macScript(options: InstallerOptions): string {
  const model = sanitizeModel(options.model);
  const origins = sanitizeOrigins(options.origins);
  return `#!/bin/bash
# 一键安装本地 AI（macOS）
set -u

MODEL="${model}"
ORIGINS="${origins}"
APP="/Applications/Ollama.app"

echo ""
echo "  ============================================================"
echo "   一键安装本地 AI"
echo "  ============================================================"
echo "   会自动完成：安装运行器、启动服务并放行本站、下载模型 ${model}"
echo "   全部完成后回到网页，页面会自动连上。"
echo "  ============================================================"
echo ""

if [ ! -d "$APP" ] && [ ! -d "$HOME/Applications/Ollama.app" ] && ! command -v ollama >/dev/null 2>&1; then
  echo "[1/4] 正在下载 Ollama..."
  TMP_DIR="$(mktemp -d)"
  if ! curl -fL --progress-bar "https://ollama.com/download/Ollama-darwin.zip" -o "$TMP_DIR/Ollama-darwin.zip"; then
    echo "  下载失败，请检查网络后重试。也可以手动安装：https://ollama.com/download"
    read -r -p "  按回车退出" _
    rm -rf "$TMP_DIR"
    exit 1
  fi
  unzip -q -o "$TMP_DIR/Ollama-darwin.zip" -d "$TMP_DIR"
  if [ -d "$TMP_DIR/Ollama.app" ]; then
    if cp -R "$TMP_DIR/Ollama.app" /Applications/ 2>/dev/null; then
      APP="/Applications/Ollama.app"
    else
      mkdir -p "$HOME/Applications"
      rm -rf "$HOME/Applications/Ollama.app"
      cp -R "$TMP_DIR/Ollama.app" "$HOME/Applications/"
      APP="$HOME/Applications/Ollama.app"
    fi
    xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
  echo "[2/4] Ollama 已安装到 $APP"
else
  echo "[1/4] 已经装过 Ollama，跳过安装。"
  if [ -d "$HOME/Applications/Ollama.app" ]; then APP="$HOME/Applications/Ollama.app"; fi
fi

echo "[3/4] 正在重启本地服务并放行本站网址..."
launchctl setenv OLLAMA_ORIGINS "$ORIGINS" 2>/dev/null || true
osascript -e 'quit app "Ollama"' >/dev/null 2>&1 || true
sleep 2
if [ -d "$APP" ]; then open "$APP"; else open -a Ollama; fi

TRIES=0
while ! curl -fsS --max-time 2 "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge 20 ]; then
    echo "  本地服务没有按时启动。请手动打开 Ollama，再回到网页点「重新检测」。"
    read -r -p "  按回车退出" _
    exit 1
  fi
  sleep 3
done

CLI="$(command -v ollama || true)"
if [ -z "$CLI" ] && [ -x "$APP/Contents/Resources/ollama" ]; then CLI="$APP/Contents/Resources/ollama"; fi
if [ -z "$CLI" ]; then
  echo "  找不到 ollama 命令。请手动打开 Ollama 应用后再回到网页点「重新检测」。"
  read -r -p "  按回车退出" _
  exit 1
fi

echo "[4/4] 正在下载模型 ${model}，第一次需要几分钟..."
"$CLI" pull "${model}"
if [ $? -ne 0 ]; then
  echo "  模型下载失败。可以稍后重新运行本文件，它会接着下载。"
  read -r -p "  按回车退出" _
  exit 1
fi

echo ""
echo "  完成。回到网页，几秒内会自动显示「已连接」。"
read -r -p "  按回车退出" _
`;
}

function linuxScript(options: InstallerOptions): string {
  const model = sanitizeModel(options.model);
  const origins = sanitizeOrigins(options.origins);
  return `#!/usr/bin/env bash
# 一键安装本地 AI（Linux，需要 sudo 权限）
set -u

MODEL="${model}"
ORIGINS="${origins}"

echo ""
echo "  ============================================================"
echo "   一键安装本地 AI"
echo "  ============================================================"
echo ""

if ! command -v ollama >/dev/null 2>&1; then
  echo "[1/3] 正在安装 Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "[2/3] 正在放行本站网址并重启服务..."
sudo mkdir -p /etc/systemd/system/ollama.service.d
printf '[Service]\\nEnvironment="OLLAMA_ORIGINS=%s"\\n' "$ORIGINS" | sudo tee /etc/systemd/system/ollama.service.d/zz-nyaumae.conf >/dev/null
sudo systemctl daemon-reload
sudo systemctl restart ollama

echo "[3/3] 正在下载模型 ${model}，第一次需要几分钟..."
ollama pull "${model}"

echo ""
echo "  完成。回到网页，几秒内会自动显示「已连接」。"
`;
}

export function buildInstallerScript(platform: InstallerPlatform, options: InstallerOptions): string {
  if (platform === 'macos') return macScript(options);
  if (platform === 'linux') return linuxScript(options);
  return windowsScript(options);
}

/** 生成并触发下载；返回文件名，方便界面提示。 */
export function downloadInstaller(platform: InstallerPlatform, options: InstallerOptions): string {
  const script = buildInstallerScript(platform, options);
  const name = installerFileName(platform);
  const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 4_000);
  return name;
}
