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

/**
 * pnpm 运行时解析。原来这里写死了 codex 运行时自带的 pnpm 绝对路径，
 * 那套运行时一旦不在本机（比如换机器、缓存被清），部署就会以
 * 「pnpm 运行时不存在」失败。现在按顺序找，都找不到就退回 npx
 * （`npx wrangler` 与 `pnpm dlx wrangler` 等价）。
 */
const PNPM_CANDIDATES = [
  join(PROJECT_ROOT, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'),
  join(PROJECT_ROOT, 'node_modules', 'pnpm', 'bin', 'pnpm.mjs'),
  join(process.env.LOCALAPPDATA ?? '', 'pnpm', 'pnpm.cjs'),
  join(
    'C:\\Users\\Administrator\\.cache\\codex-runtimes\\codex-primary-runtime',
    'dependencies',
    'node',
    'node_modules',
    'pnpm',
    'bin',
    'pnpm.mjs',
  ),
];
const PNPM_BIN = PNPM_CANDIDATES.find((candidate) => candidate && existsSync(candidate)) ?? null;

/**
 * 首选本地 wrangler（作为 devDependency 安装）：部署时不需要下载任何东西，
 * 也不依赖 pnpm 或 npx 的联网行为，最稳。
 */
const WRANGLER_BIN = join(PROJECT_ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

/** git 可执行文件：优先 PATH，其次 Git for Windows 的常见安装位置。 */
const GIT_CANDIDATES = ['git', 'C:\\Program Files\\Git\\cmd\\git.exe', 'C:\\Program Files (x86)\\Git\\cmd\\git.exe'];
const GIT_BIN = GIT_CANDIDATES.find((candidate) => candidate === 'git' || existsSync(candidate)) ?? 'git';

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

/**
 * 通过 cmd.exe 执行（Windows 上 npx 是 .cmd 脚本，spawn 不能直接执行）。
 * 用于没找到 pnpm 时退回 `npx --yes wrangler@latest`。
 */
function runViaShell(args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const env = { ...(options.env ?? process.env) };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'Path';
    env[pathKey] = `${dirname(process.execPath)};${env[pathKey] ?? ''}`;
    const quote = (value) => (/[\s"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value);
    const comspec = process.env.ComSpec || 'cmd.exe';

    const child = spawn(comspec, ['/d', '/s', '/c', args.map(quote).join(' ')], {
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

/** 执行命令并捕获输出（用于需要根据结果做判断的步骤，比如 git）。 */
function runCapture(command, args) {
  return new Promise((resolvePromise) => {
    let child;
    try {
      child = spawn(command, args, { cwd: PROJECT_ROOT, windowsHide: true });
    } catch (error) {
      resolvePromise({ code: -1, stdout: '', stderr: String(error.message) });
      return;
    }

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', (error) => resolvePromise({ code: -1, stdout, stderr: String(error.message) }));
    child.once('exit', (code) => resolvePromise({ code: code ?? -1, stdout, stderr }));
  });
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * 部署前自动把当前改动提交进 git。
 * - 只提交、不推送时给出明确提示（本仓库当前没有配置远端）；
 * - 配了远端且已设上游就自动 push，配了远端但没上游则用 -u 建立上游；
 * - git 环节出错只警告，不阻断部署（部署本身才是主任务）。
 */
async function autoGitSync() {
  const inside = await runCapture(GIT_BIN, ['rev-parse', '--is-inside-work-tree']);
  if (inside.code !== 0 || inside.stdout.trim() !== 'true') {
    console.log('[git] 当前目录不是 git 仓库，跳过自动提交。');
    return;
  }

  const staged = await runCapture(GIT_BIN, ['add', '-A']);
  if (staged.code !== 0) {
    console.log(`[git] git add 失败，跳过自动提交：${(staged.stderr || staged.stdout).trim().slice(0, 200)}`);
    return;
  }

  const changed = await runCapture(GIT_BIN, ['diff', '--cached', '--name-only']);
  const files = changed.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  if (files.length === 0) {
    console.log('[git] 工作区干净，无需提交。');
  } else {
    const areas = [...new Set(files.map((file) => file.split('/')[0]))].slice(0, 6).join('、');
    const message = [
      `deploy: 自动提交（${timestamp()}）`,
      '',
      `共 ${files.length} 个文件变更，涉及：${areas}`,
    ].join('\n');
    const commit = await runCapture(GIT_BIN, ['commit', '-m', message]);
    if (commit.code !== 0) {
      console.log(`[git] 提交失败，跳过（部署继续）：${(commit.stderr || commit.stdout).trim().slice(0, 200)}`);
      return;
    }
    const head = await runCapture(GIT_BIN, ['log', '-1', '--pretty=%h %s']);
    console.log(`[git] 已提交 ${files.length} 个文件：${head.stdout.trim()}`);
  }

  const remotes = (await runCapture(GIT_BIN, ['remote'])).stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  if (remotes.length === 0) {
    console.log('[git] 未配置远端仓库，仅提交到本地。如需自动推送：git remote add origin <仓库地址>');
    return;
  }

  const branch = (await runCapture(GIT_BIN, ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim() || 'main';
  const upstream = await runCapture(GIT_BIN, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const pushArgs = upstream.code === 0
    ? ['push']
    : ['push', '-u', remotes[0], branch];
  if (upstream.code !== 0) {
    console.log(`[git] 尚未设置上游分支，将执行 git push -u ${remotes[0]} ${branch}`);
  }
  const push = await runCapture(GIT_BIN, pushArgs);
  if (push.code === 0) {
    console.log(`[git] 已推送到 ${remotes[0]}（${(push.stdout || push.stderr).trim().split('\n').slice(-1)[0] ?? ''}）`);
  } else {
    console.log(`[git] 推送失败（部署继续）：${(push.stderr || push.stdout).trim().slice(0, 200)}`);
  }
}

/**
 * 决定用哪种方式调用 wrangler，并给出可读的说明。
 * 顺序：本地 wrangler → pnpm dlx → npx（都不需要 codex 自带的运行时）。
 */
function describeRunner() {
  if (existsSync(WRANGLER_BIN)) {
    return { kind: 'local', label: `本地 wrangler（${WRANGLER_BIN}）`, note: '' };
  }
  if (PNPM_BIN) {
    return { kind: 'pnpm', label: `pnpm dlx（${PNPM_BIN}）`, note: '' };
  }
  return {
    kind: 'npx',
    label: 'npx --yes wrangler@latest（未找到本地 wrangler，会在部署时联网下载）',
    note: '提示：本地未安装 wrangler，将使用 npx 临时下载（与 pnpm dlx 等价）。',
  };
}

async function deploySite() {
  requireFile(DIST_INDEX, '已构建的网页');
  const config = loadCloudflareConfig();

  if (CHECK_ONLY) {
    console.log(`部署工具检查通过，目标：${config.project}.pages.dev`);
    console.log(`部署方式：${describeRunner().label}`);
    return;
  }

  if (!(await confirmDeployment(config))) {
    console.log('\n已取消部署。');
    return;
  }

  // 部署前先把这次要上线的状态提交进 git（--no-git 可跳过）。
  if (process.argv.includes('--no-git')) {
    console.log('[git] 已按 --no-git 跳过自动提交。\n');
  } else {
    console.log('同步 git 提交...');
    await autoGitSync();
    console.log('');
  }

  console.log('\n开始部署现有 dist...\n');
  const env = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: config.token,
    CLOUDFLARE_ACCOUNT_ID: config.accountId,
  };

  const pagesArgs = [
    'pages',
    'deploy',
    DIST_DIR,
    '--project-name',
    config.project,
    '--branch',
    config.branch,
  ];

  const runner = describeRunner();
  if (runner.label !== '本地 wrangler') console.log(`${runner.note}\n`);

  if (runner.kind === 'local') {
    await run(process.execPath, [WRANGLER_BIN, ...pagesArgs], { env });
  } else if (runner.kind === 'pnpm') {
    await run(process.execPath, [PNPM_BIN, 'dlx', 'wrangler@latest', ...pagesArgs], { env });
  } else {
    await runViaShell(['npx', '--yes', 'wrangler@latest', ...pagesArgs], { env });
  }

  console.log(`\n部署命令已成功完成：https://${config.project}.pages.dev`);
}

async function main() {
  if (action === 'build') return buildSite();
  if (action === 'preview') return previewSite();
  if (action === 'deploy') return deploySite();
  if (action === 'git-sync') return autoGitSync();
  throw new Error('用法：desktop-site-tool.mjs <build|deploy|preview|git-sync> [--check] [--no-git]');
}

main().catch((error) => {
  console.error(`\n失败：${error.message}`);
  process.exitCode = 1;
});
