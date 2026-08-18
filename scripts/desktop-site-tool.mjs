#!/usr/bin/env node

import { spawn } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const DIST_DIR = join(PROJECT_ROOT, 'dist');
const DIST_INDEX = join(DIST_DIR, 'index.html');

const TSC_BIN = join(PROJECT_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const VITE_BIN = join(PROJECT_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const PREPARE_SITES = join(PROJECT_ROOT, 'scripts', 'prepare-sites.mjs');
const HOSTING_CONFIG = join(PROJECT_ROOT, '.openai', 'hosting.json');
const LEGACY_DEPLOY_LAUNCHER = join(PROJECT_ROOT, '启动部署工具.bat');
const PNPM_BIN = join(
  'C:\\Users\\Administrator\\.cache\\codex-runtimes\\codex-primary-runtime',
  'dependencies',
  'node',
  'node_modules',
  'pnpm',
  'bin',
  'pnpm.mjs',
);

const CHECK_ONLY = process.argv.includes('--check');
const action = process.argv[2];

function requireFile(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label}不存在：${filePath}`);
  }
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const env = { ...(options.env ?? process.env) };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'Path';
    env[pathKey] = `${dirname(process.execPath)};${env[pathKey] ?? ''}`;

    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      env,
      stdio: 'inherit',
      windowsHide: false,
    });

    child.once('error', rejectPromise);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      const suffix = signal ? `（${signal}）` : `（退出码 ${code ?? '未知'}）`;
      rejectPromise(new Error(`命令执行失败${suffix}`));
    });
  });
}

function parseLauncherValue(source, name) {
  const pattern = new RegExp(`^\\s*set\\s+"${name}=([^"]*)"\\s*$`, 'im');
  return source.match(pattern)?.[1]?.trim() ?? '';
}

function loadCloudflareConfig() {
  requireFile(LEGACY_DEPLOY_LAUNCHER, '项目现有部署配置');
  const source = readFileSync(LEGACY_DEPLOY_LAUNCHER, 'utf8');
  const getValue = (name) => process.env[name] || parseLauncherValue(source, name);

  const config = {
    token: getValue('CLOUDFLARE_API_TOKEN'),
    accountId: getValue('CLOUDFLARE_ACCOUNT_ID'),
    project: getValue('CLOUDFLARE_PAGES_PROJECT'),
    branch: getValue('CLOUDFLARE_PAGES_BRANCH') || 'main',
  };

  if (!config.token || !config.accountId || !config.project) {
    throw new Error('现有 Cloudflare 部署配置不完整。');
  }

  if (!/^[a-z0-9][a-z0-9-]*$/i.test(config.project)) {
    throw new Error('Cloudflare Pages 项目名无效。');
  }

  if (!/^[a-z0-9._/-]+$/i.test(config.branch)) {
    throw new Error('Cloudflare Pages 分支名无效。');
  }

  return config;
}

function newestMtime(pathToInspect) {
  if (!existsSync(pathToInspect)) return 0;

  const entry = statSync(pathToInspect);
  if (!entry.isDirectory()) return entry.mtimeMs;

  let newest = entry.mtimeMs;
  for (const child of readdirSync(pathToInspect, { withFileTypes: true })) {
    const childPath = join(pathToInspect, child.name);
    if (child.isSymbolicLink()) continue;
    newest = Math.max(newest, newestMtime(childPath));
  }
  return newest;
}

function getNewestSourceMtime() {
  const paths = [
    'src',
    'public',
    'index.html',
    'package.json',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.ts',
    join('scripts', 'generate-api-html.mjs'),
    join('scripts', 'prepare-sites.mjs'),
  ];

  return Math.max(...paths.map((relativePath) => newestMtime(join(PROJECT_ROOT, relativePath))));
}

async function confirmDeployment(config) {
  const buildTime = statSync(DIST_INDEX).mtime;
  const sourceIsNewer = getNewestSourceMtime() > buildTime.getTime();

  console.log('');
  console.log(`即将部署项目：${config.project}.pages.dev`);
  console.log(`当前 build 时间：${buildTime.toLocaleString('zh-CN')}`);
  console.log('此工具只部署现有 dist，不会重新 build。');

  if (sourceIsNewer) {
    console.warn('');
    console.warn('警告：检测到源文件比当前 build 更新。');
    console.warn('如果要发布最新修改，请先运行桌面上的“1-构建网页”。');
  }

  if (!input.isTTY) {
    throw new Error('部署需要在可交互窗口中确认。');
  }

  const prompt = createInterface({ input, output });
  try {
    const answer = await prompt.question('\n输入 DEPLOY 确认发布（其他任意输入取消）：');
    return answer.trim().toUpperCase() === 'DEPLOY';
  } finally {
    prompt.close();
  }
}

function checkBuildDependencies() {
  requireFile(TSC_BIN, 'TypeScript 构建程序');
  requireFile(VITE_BIN, 'Vite 构建程序');
  requireFile(PREPARE_SITES, 'Sites 打包程序');
  requireFile(HOSTING_CONFIG, 'Sites 项目配置');
}

async function buildSite() {
  checkBuildDependencies();
  if (CHECK_ONLY) {
    console.log('构建工具检查通过。');
    return;
  }

  console.log('开始构建网页（不会部署）...\n');
  console.log('[1/3] TypeScript 检查');
  await run(process.execPath, [TSC_BIN, '-b']);

  console.log('\n[2/3] Vite build');
  await run(process.execPath, [VITE_BIN, 'build']);

  console.log('\n[3/3] 准备 Sites 构建产物');
  await run(process.execPath, [PREPARE_SITES]);

  requireFile(DIST_INDEX, '构建首页');
  requireFile(join(DIST_DIR, 'server', 'index.js'), 'Sites server 入口');
  requireFile(join(DIST_DIR, '.openai', 'hosting.json'), 'Sites 构建配置');

  console.log('\n构建成功。新网页已放在 dist，未部署。');
}

async function previewSite() {
  requireFile(VITE_BIN, 'Vite 预览程序');
  requireFile(DIST_INDEX, '已构建的网页');
  if (CHECK_ONLY) {
    console.log('预览工具检查通过。');
    return;
  }

  console.log('正在预览现有 build（不会 build，不会部署）...');
  console.log('浏览器会自动打开；关闭本窗口即可停止本地预览。\n');
  await run(process.execPath, [
    VITE_BIN,
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4173',
    '--open',
  ]);
}

async function deploySite() {
  requireFile(DIST_INDEX, '已构建的网页');
  requireFile(PNPM_BIN, 'pnpm 运行时');
  const config = loadCloudflareConfig();

  if (CHECK_ONLY) {
    console.log(`部署工具检查通过，目标：${config.project}.pages.dev`);
    return;
  }

  if (!(await confirmDeployment(config))) {
    console.log('\n已取消部署。');
    return;
  }

  console.log('\n开始部署现有 dist...\n');
  const env = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: config.token,
    CLOUDFLARE_ACCOUNT_ID: config.accountId,
  };

  await run(process.execPath, [
    PNPM_BIN,
    'dlx',
    'wrangler@latest',
    'pages',
    'deploy',
    DIST_DIR,
    '--project-name',
    config.project,
    '--branch',
    config.branch,
  ], { env });

  console.log(`\n部署命令已成功完成：https://${config.project}.pages.dev`);
}

async function main() {
  if (action === 'build') return buildSite();
  if (action === 'preview') return previewSite();
  if (action === 'deploy') return deploySite();
  throw new Error('用法：desktop-site-tool.mjs <build|deploy|preview> [--check]');
}

main().catch((error) => {
  console.error(`\n失败：${error.message}`);
  process.exitCode = 1;
});
