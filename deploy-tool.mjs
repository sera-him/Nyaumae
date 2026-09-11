#!/usr/bin/env node

/**
 * deploy-tool.mjs — Cloudflare Build & Deploy Tool
 *
 * Windows CMD:
 *   set CLOUDFLARE_API_TOKEN=cfat_xxx
 *   set CLOUDFLARE_ACCOUNT_ID=xxx
 *   set CLOUDFLARE_PAGES_PROJECT=my-site
 *   set DEPLOY_TOOL_BUILD_COMMAND=npm run build
 *   set DEPLOY_TOOL_OUTPUT_DIR=dist
 *   node deploy-tool.mjs
 *
 * PowerShell:
 *   $env:CLOUDFLARE_API_TOKEN="cfat_xxx"
 *   $env:CLOUDFLARE_ACCOUNT_ID="xxx"
 *   $env:CLOUDFLARE_PAGES_PROJECT="my-site"
 *   $env:DEPLOY_TOOL_BUILD_COMMAND="npm run build"
 *   $env:DEPLOY_TOOL_OUTPUT_DIR="dist"
 *   node .\deploy-tool.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ─── Default Config ────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  port: 3344,
  buildCommand: 'npm run build',
  outputDir: 'dist',
  pagesProject: '',
  pagesBranch: 'gh-pages',
};

const HISTORY_FILE = '.deploy-tool-history.json';
const MAX_HISTORY = 1000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();

// ─── Config Loading ────────────────────────────────────────────────
function autoDeployEnabled() {
  const v = (process.env.DEPLOY_TOOL_AUTO || '1').trim().toLowerCase();
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no');
}

function getConfig() {
  return {
    port: parseInt(process.env.DEPLOY_TOOL_PORT || String(DEFAULT_CONFIG.port), 10),
    buildCommand: process.env.DEPLOY_TOOL_BUILD_COMMAND || DEFAULT_CONFIG.buildCommand,
    outputDir: process.env.DEPLOY_TOOL_OUTPUT_DIR || DEFAULT_CONFIG.outputDir,
    pagesProject: process.env.CLOUDFLARE_PAGES_PROJECT || DEFAULT_CONFIG.pagesProject,
    pagesBranch: process.env.CLOUDFLARE_PAGES_BRANCH || DEFAULT_CONFIG.pagesBranch,
    autoDeploy: autoDeployEnabled(),
  };
}

function getApiToken() {
  return process.env.CLOUDFLARE_API_TOKEN || '';
}

function getAccountId() {
  return process.env.CLOUDFLARE_ACCOUNT_ID || '';
}

function hasToken() {
  return getApiToken().length > 0;
}

function hasAccountId() {
  return getAccountId().length > 0;
}

// ─── Command Parsing ───────────────────────────────────────────────
function parseBuildCommand(cmdStr) {
  const trimmed = cmdStr.trim();
  const parts = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  for (const ch of trimmed) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  if (parts.length === 0) return { command: '', args: [] };

  let cmd = parts[0];
  const args = parts.slice(1);

  if (process.platform === 'win32') {
    const map = { npm: 'npm.cmd', npx: 'npx.cmd', pnpm: 'pnpm.cmd', yarn: 'yarn.cmd', bun: 'bun.exe' };
    cmd = map[cmd.toLowerCase()] || cmd;
  }

  return { command: cmd, args };
}

// ─── Sanitization ──────────────────────────────────────────────────
function sanitize(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)[=:]\s*["']?\S+/gi, '$1=***')
    .replace(/(Authorization:\s*Bearer\s+)\S+/gi, '$1***')
    .replace(/\b(cfat_[A-Za-z0-9_]{10,})\b/g, 'cfat_***');
}

// ─── State ─────────────────────────────────────────────────────────
const taskState = {
  running: false,
  type: null,
  phase: null,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  success: null,
  durationMs: null,
  deploymentUrl: null,
};

const logLines = [];
const LOG_LIMIT = 5000;
let currentChild = null;

function addLog(text, stream = 'stdout') {
  const line = { text: sanitize(text), stream, time: new Date().toISOString() };
  logLines.push(line);
  if (logLines.length > LOG_LIMIT) logLines.splice(0, logLines.length - LOG_LIMIT);
}

function getStatus() {
  return { ...taskState };
}

function resetState() {
  taskState.running = false;
  taskState.type = null;
  taskState.phase = null;
  taskState.startedAt = null;
  taskState.finishedAt = null;
  taskState.exitCode = null;
  taskState.success = null;
  taskState.durationMs = null;
  taskState.deploymentUrl = null;
}

// ─── History ───────────────────────────────────────────────────────
function historyPath() {
  return path.join(PROJECT_ROOT, HISTORY_FILE);
}

function loadHistory() {
  const fp = historyPath();
  try {
    if (!fs.existsSync(fp)) return [];
    const raw = fs.readFileSync(fp, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    try {
      const backup = `${fp}.broken.${Date.now()}`;
      fs.renameSync(fp, backup);
      addLog(`History file corrupted, backed up to ${path.basename(backup)}`, 'stderr');
    } catch (_) { /* ignore */ }
    return [];
  }
}

function saveHistory(entries) {
  const fp = historyPath();
  const tmp = fp + '.tmp.' + Date.now();
  try {
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf-8');
    fs.renameSync(tmp, fp);
  } catch (err) {
    addLog(`Failed to save history: ${err.message}`, 'stderr');
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
  }
}

function addHistory(entry) {
  const entries = loadHistory();
  entries.unshift(entry);
  if (entries.length > MAX_HISTORY) entries.length = MAX_HISTORY;
  saveHistory(entries);
}

// ─── Build ─────────────────────────────────────────────────────────
function runBuild() {
  return new Promise((resolve) => {
    const cfg = getConfig();
    const { command, args } = parseBuildCommand(cfg.buildCommand);
    const outputDir = path.resolve(PROJECT_ROOT, cfg.outputDir);

    addLog(`$ ${cfg.buildCommand}`, 'stdout');
    addLog(`Working directory: ${PROJECT_ROOT}`, 'stdout');
    addLog(`Output directory: ${outputDir}`, 'stdout');

    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    currentChild = child;

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const l of lines) addLog(l, 'stdout');
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const l of lines) addLog(l, 'stderr');
    });

    child.on('error', (err) => {
      addLog(`Failed to start build process: ${err.message}`, 'stderr');
      currentChild = null;
      resolve({ success: false, exitCode: -1 });
    });

    child.on('close', (code) => {
      currentChild = null;
      addLog(`Build finished with exit code ${code}`, 'stdout');

      const exists = fs.existsSync(outputDir);
      if (!exists) {
        addLog(`ERROR: Output directory "${cfg.outputDir}" (${outputDir}) does not exist after build!`, 'stderr');
      }

      resolve({ success: code === 0 && exists, exitCode: code });
    });
  });
}

// ─── Deploy ────────────────────────────────────────────────────────
function runDeploy() {
  return new Promise((resolve) => {
    const cfg = getConfig();
    const outputDir = path.resolve(PROJECT_ROOT, cfg.outputDir);
    const project = cfg.pagesProject;
    const branch = cfg.pagesBranch;

    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = ['wrangler', 'pages', 'deploy', outputDir, '--project-name', project, '--branch', branch];

    addLog(`$ npx wrangler pages deploy ${cfg.outputDir} --project-name ${project} --branch ${branch}`, 'stdout');

    const child = spawn(npxCmd, args, {
      cwd: PROJECT_ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    currentChild = child;

    let deployUrl = null;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      const lines = text.split('\n').filter(Boolean);
      for (const l of lines) {
        addLog(l, 'stdout');
        const urlMatch = l.match(/https:\/\/[a-z0-9-]+\.pages\.dev/);
        if (urlMatch) deployUrl = urlMatch[0];
        const urlMatch2 = l.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/);
        if (urlMatch2) deployUrl = urlMatch2[0];
      }
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const l of lines) addLog(l, 'stderr');
    });

    child.on('error', (err) => {
      addLog(`Failed to start deploy process: ${err.message}`, 'stderr');
      currentChild = null;
      resolve({ success: false, exitCode: -1, deploymentUrl: null });
    });

    child.on('close', (code) => {
      currentChild = null;
      addLog(`Deploy finished with exit code ${code}`, 'stdout');
      if (deployUrl) addLog(`Deployment URL: ${deployUrl}`, 'stdout');
      resolve({ success: code === 0, exitCode: code, deploymentUrl: deployUrl });
    });
  });
}

// ─── Cloudflare API ────────────────────────────────────────────────
async function fetchAllDeployments() {
  const token = getApiToken();
  const accountId = getAccountId();
  const cfg = getConfig();
  const projectName = cfg.pagesProject;

  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not configured');
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is not configured');
  if (!projectName) throw new Error('CLOUDFLARE_PAGES_PROJECT is not configured');

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  // Cloudflare Pages API maximum per_page is 25
  const perPage = 25;
  let page = 1;
  let allDeps = [];
  let maxPages = 100;

  while (page <= maxPages) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}/deployments?page=${page}&per_page=${perPage}`;
    let resp;
    try {
      resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchErr) {
      throw new Error(`Network error contacting Cloudflare API: ${fetchErr.message}`);
    }

    let data;
    try {
      data = await resp.json();
    } catch {
      throw new Error(`Invalid JSON response from Cloudflare API (status ${resp.status})`);
    }

    if (!data.success) {
      const msg = data.errors && data.errors.length > 0 ? data.errors[0].message : 'Unknown API error';
      throw new Error(`Cloudflare API error: ${msg}`);
    }

    const deployments = data.result || [];
    if (deployments.length === 0) break;

    let allInMonth = true;
    for (const dep of deployments) {
      const created = new Date(dep.created_on);
      if (created >= firstDay) {
        allDeps.push(dep);
      } else {
        allInMonth = false;
      }
    }

    if (!allInMonth) break;
    if (deployments.length < perPage) break;

    page++;
  }

  return allDeps;
}

function classifyDeploymentStatus(dep) {
  if (!dep) return 'other';

  const stages = dep.stages;
  if (stages && Array.isArray(stages) && stages.length > 0) {
    const lastStage = stages[stages.length - 1];
    if (lastStage && lastStage.status) {
      const s = lastStage.status;
      if (s === 'success') return 'success';
      if (s === 'failure' || s === 'failed') return 'failure';
      if (s === 'pending' || s === 'active' || s === 'queued') return 'pending';
      return 'other';
    }
  }

  if (dep.latest_stage && dep.latest_stage.status) {
    const s = dep.latest_stage.status;
    if (s === 'success') return 'success';
    if (s === 'failure' || s === 'failed') return 'failure';
    if (s === 'pending' || s === 'active' || s === 'queued') return 'pending';
    return 'other';
  }

  if (dep.status) {
    const s = dep.status;
    if (s === 'success') return 'success';
    if (s === 'failure' || s === 'failed') return 'failure';
    if (s === 'pending' || s === 'active' || s === 'queued') return 'pending';
    return 'other';
  }

  return 'other';
}

function getDeploymentEnvironment(dep) {
  if (dep.environment) return dep.environment;
  if (dep.deployment_trigger && dep.deployment_trigger.type) {
    return dep.deployment_trigger.type === 'ad_hoc' ? 'preview' : 'production';
  }
  if (dep.latest_stage && dep.latest_stage.name) return dep.latest_stage.name;
  return 'preview';
}

async function monthlyStats() {
  let deps = [];
  try {
    deps = await fetchAllDeployments();
  } catch (err) {
    return {
      total: 0, limit: 500,
      success: 0, failure: 0, pending: 0, other: 0,
      production: 0, preview: 0,
      latestDeployment: null,
      deployments: [],
      apiError: err.message,
    };
  }
  const stats = {
    total: deps.length,
    limit: 500,
    success: 0,
    failure: 0,
    pending: 0,
    other: 0,
    production: 0,
    preview: 0,
    latestDeployment: null,
    deployments: deps.map(d => {
      const status = classifyDeploymentStatus(d);
      const env = getDeploymentEnvironment(d);
      const commitInfo = d.deployment_trigger?.metadata || {};
      return {
        id: d.id ? d.id.substring(0, 8) : '—',
        created_on: d.created_on || '—',
        environment: env,
        status,
        url: d.url || d.latest_stage?.url || '—',
        branch: commitInfo.branch || d.deployment_trigger?.branch || '—',
        commit_hash: commitInfo.commit_hash ? commitInfo.commit_hash.substring(0, 7) : '—',
        commit_message: commitInfo.commit_message || '—',
      };
    }),
  };

  for (const dep of deps) {
    const status = classifyDeploymentStatus(dep);
    const env = getDeploymentEnvironment(dep);

    if (status === 'success') stats.success++;
    else if (status === 'failure') stats.failure++;
    else if (status === 'pending') stats.pending++;
    else stats.other++;

    if (env === 'production') stats.production++;
    else stats.preview++;
  }

  if (deps.length > 0) {
    const sorted = [...deps].sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
    stats.latestDeployment = sorted[0].created_on;
  }

  return stats;
}

// ─── HTTP Server ───────────────────────────────────────────────────
function serveHTML(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getHTML());
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function errorResponse(res, message, status = 400) {
  jsonResponse(res, { error: true, message }, status);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 10240) {
        tooLarge = true;
        req.destroy();
      }
    });
    req.on('end', () => {
      if (tooLarge) return reject(new Error('Request body too large'));
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = url.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    handleRoute(req, res, pathname, method);
  } catch (err) {
    addLog(`Unhandled error in route ${method} ${pathname}: ${err.message}`, 'stderr');
    errorResponse(res, 'Internal server error', 500);
  }
}

async function handleRoute(req, res, pathname, method) {
  // GET /
  if (pathname === '/' && method === 'GET') {
    return serveHTML(res);
  }

  // GET /api/status
  if (pathname === '/api/status' && method === 'GET') {
    return jsonResponse(res, getStatus());
  }

  // GET /api/logs
  if (pathname === '/api/logs' && method === 'GET') {
    const since = parseInt(req.url.includes('since=') ? new URL(req.url, `http://${req.headers.host}`).searchParams.get('since') || '0' : '0', 10);
    const recent = since > 0 ? logLines.slice(since) : logLines;
    return jsonResponse(res, { lines: recent, total: logLines.length });
  }

  // GET /api/config
  if (pathname === '/api/config' && method === 'GET') {
    const cfg = getConfig();
    return jsonResponse(res, {
      port: cfg.port,
      buildCommand: cfg.buildCommand,
      outputDir: cfg.outputDir,
      pagesProject: cfg.pagesProject,
      pagesBranch: cfg.pagesBranch,
      projectRoot: PROJECT_ROOT,
      hasToken: hasToken(),
      hasAccountId: hasAccountId(),
    });
  }

  // GET /api/monthly-deployments
  if (pathname === '/api/monthly-deployments' && method === 'GET') {
    try {
      const stats = await monthlyStats();
      // apiError is set when Cloudflare API fails; still return data so progress bar shows
      if (stats.apiError) {
        return jsonResponse(res, { error: stats.apiError, totals: stats.total, limit: stats.limit, deployments: [] });
      }
      return jsonResponse(res, { error: false, ...stats });
    } catch (err) {
      return jsonResponse(res, { error: true, message: sanitize(err.message), total: 0, limit: 500, deployments: [] });
    }
  }

  // GET /api/local-history
  if (pathname === '/api/local-history' && method === 'GET') {
    const history = loadHistory();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLocal = history.filter(e => e.finishedAt && new Date(e.finishedAt) >= firstDay);
    return jsonResponse(res, { entries: history, monthlyCount: monthLocal.length, limit: 500 });
  }

  // POST /api/build
  if (pathname === '/api/build' && method === 'POST') {
    if (taskState.running) {
      return errorResponse(res, 'A task is already running', 409);
    }
    startBuildTask();
    return jsonResponse(res, { ok: true, message: 'Build started' });
  }

  // POST /api/deploy
  if (pathname === '/api/deploy' && method === 'POST') {
    if (taskState.running) {
      return errorResponse(res, 'A task is already running', 409);
    }
    const cfg = getConfig();
    const outputDir = path.resolve(PROJECT_ROOT, cfg.outputDir);
    if (!fs.existsSync(outputDir)) {
      return errorResponse(res, `Output directory "${cfg.outputDir}" does not exist. Build first.`, 400);
    }
    if (!cfg.pagesProject) {
      return errorResponse(res, 'CLOUDFLARE_PAGES_PROJECT is not configured', 400);
    }
    startDeployTask();
    return jsonResponse(res, { ok: true, message: 'Deploy started' });
  }

  // POST /api/build-and-deploy
  if (pathname === '/api/build-and-deploy' && method === 'POST') {
    if (taskState.running) {
      return errorResponse(res, 'A task is already running', 409);
    }
    startBuildAndDeployTask();
    return jsonResponse(res, { ok: true, message: 'Build + Deploy started' });
  }

  // POST /api/clear-logs
  if (pathname === '/api/clear-logs' && method === 'POST') {
    logLines.length = 0;
    return jsonResponse(res, { ok: true });
  }

  // 405 for POST routes with wrong method
  if (['/api/build', '/api/deploy', '/api/build-and-deploy', '/api/clear-logs'].includes(pathname) && method !== 'POST') {
    return errorResponse(res, 'Method not allowed. Use POST.', 405);
  }

  // 404
  errorResponse(res, 'Not found', 404);
}

// ─── Task Runners ──────────────────────────────────────────────────
async function startBuildTask() {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  taskState.running = true;
  taskState.type = 'build';
  taskState.phase = 'building';
  taskState.startedAt = startedAt;
  taskState.finishedAt = null;
  taskState.exitCode = null;
  taskState.success = null;
  taskState.durationMs = null;
  taskState.deploymentUrl = null;

  const result = await runBuild();

  taskState.running = false;
  taskState.phase = null;
  taskState.finishedAt = new Date().toISOString();
  taskState.exitCode = result.exitCode;
  taskState.success = result.success;
  taskState.durationMs = Date.now() - startMs;
}

async function startDeployTask() {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  taskState.running = true;
  taskState.type = 'deploy';
  taskState.phase = 'deploying';
  taskState.startedAt = startedAt;
  taskState.finishedAt = null;
  taskState.exitCode = null;
  taskState.success = null;
  taskState.durationMs = null;
  taskState.deploymentUrl = null;

  const result = await runDeploy();

  taskState.running = false;
  taskState.phase = null;
  taskState.finishedAt = new Date().toISOString();
  taskState.exitCode = result.exitCode;
  taskState.success = result.success;
  taskState.durationMs = Date.now() - startMs;
  taskState.deploymentUrl = result.deploymentUrl || null;

  const cfg = getConfig();
  addHistory({
    startedAt: taskState.startedAt,
    finishedAt: taskState.finishedAt,
    success: taskState.success,
    exitCode: taskState.exitCode,
    durationMs: taskState.durationMs,
    deploymentUrl: taskState.deploymentUrl,
    branch: cfg.pagesBranch,
  });
}

async function startBuildAndDeployTask() {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  taskState.running = true;
  taskState.type = 'build-and-deploy';
  taskState.phase = 'building';
  taskState.startedAt = startedAt;
  taskState.finishedAt = null;
  taskState.exitCode = null;
  taskState.success = null;
  taskState.durationMs = null;
  taskState.deploymentUrl = null;

  addLog('=== Build & Deploy: Starting build phase ===', 'stdout');
  const buildResult = await runBuild();

  if (!buildResult.success) {
    taskState.running = false;
    taskState.phase = null;
    taskState.finishedAt = new Date().toISOString();
    taskState.exitCode = buildResult.exitCode;
    taskState.success = false;
    taskState.durationMs = Date.now() - startMs;
    addLog('=== Build failed, skipping deploy ===', 'stderr');
    return;
  }

  const cfg = getConfig();
  const outputDir = path.resolve(PROJECT_ROOT, cfg.outputDir);
  if (!fs.existsSync(outputDir)) {
    taskState.running = false;
    taskState.phase = null;
    taskState.finishedAt = new Date().toISOString();
    taskState.exitCode = -1;
    taskState.success = false;
    taskState.durationMs = Date.now() - startMs;
    addLog(`=== Output directory "${cfg.outputDir}" does not exist after build, aborting ===`, 'stderr');
    return;
  }

  taskState.phase = 'deploying';
  addLog('=== Build & Deploy: Starting deploy phase ===', 'stdout');

  const deployResult = await runDeploy();

  taskState.running = false;
  taskState.phase = null;
  taskState.finishedAt = new Date().toISOString();
  taskState.exitCode = deployResult.exitCode;
  taskState.success = deployResult.success;
  taskState.durationMs = Date.now() - startMs;
  taskState.deploymentUrl = deployResult.deploymentUrl || null;

  addHistory({
    startedAt: taskState.startedAt,
    finishedAt: taskState.finishedAt,
    success: taskState.success,
    exitCode: taskState.exitCode,
    durationMs: taskState.durationMs,
    deploymentUrl: taskState.deploymentUrl,
    branch: cfg.pagesBranch,
  });
}

// ─── Open Browser ──────────────────────────────────────────────────
function openBrowser(url) {
  if (process.env.DEPLOY_TOOL_NO_BROWSER === '1') return;
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', url], { shell: true, detached: true, stdio: 'ignore' }).unref();
    } else if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (_) {
    // Browser open failure is non-fatal
  }
}

// ─── Cleanup ───────────────────────────────────────────────────────
function cleanup() {
  if (currentChild && !currentChild.killed) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(currentChild.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        currentChild.kill('SIGTERM');
        setTimeout(() => {
          if (currentChild && !currentChild.killed) currentChild.kill('SIGKILL');
        }, 3000);
      }
    } catch (_) {}
  }
}

// ─── Startup ────────────────────────────────────────────────────────
function startServer() {
  const cfg = getConfig();

  const cfgForDisplay = getConfig();
  console.log('═══════════════════════════════════════════');
  console.log('  Cloudflare Build & Deploy Tool');
  console.log('═══════════════════════════════════════════');
  console.log(`  Project Directory : ${PROJECT_ROOT}`);
  console.log(`  Build Command     : ${cfgForDisplay.buildCommand}`);
  console.log(`  Output Directory  : ${cfgForDisplay.outputDir}`);
  console.log(`  Pages Project     : ${cfgForDisplay.pagesProject || '(not set)'}`);
  console.log(`  Branch            : ${cfgForDisplay.pagesBranch}`);
  console.log(`  Auto Mode         : ${cfgForDisplay.autoDeploy ? 'ON (auto build + deploy on start)' : 'OFF'}`);
  console.log(`  Listen Address    : http://127.0.0.1:${cfg.port}`);
  console.log(`  Token Configured  : ${hasToken() ? 'Yes' : 'No'}`);
  if (hasToken()) {
    const t = getApiToken();
    const masked = t.length > 8 ? t.substring(0, 4) + '****' + t.substring(t.length - 4) : '****';
    console.log(`  Token (masked)    : ${masked}`);
  }
  console.log(`  Account ID Set    : ${hasAccountId() ? 'Yes' : 'No'}`);
  console.log('═══════════════════════════════════════════');
  console.log('  Open http://127.0.0.1:' + cfg.port + ' in your browser');
  console.log('═══════════════════════════════════════════');

  const server = http.createServer(requestHandler);

  server.listen(cfg.port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${cfg.port}`;
    openBrowser(url);

    // Auto mode: run Build + Deploy automatically on start, no manual click needed.
    if (cfgForDisplay.autoDeploy) {
      console.log('Auto mode enabled: starting Build + Deploy automatically...');
      addLog('=== Auto mode: Build + Deploy started automatically ===', 'stdout');
      startBuildAndDeployTask();
    }
  });

  server.on('error', (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });

  function shutdown(signal) {
    console.log(`\nReceived ${signal}, shutting down...`);
    cleanup();
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

// ─── HTML Template ─────────────────────────────────────────────────
function getHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloudflare Build & Deploy</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; min-height: 100vh; }
  .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: #58a6ff; }
  h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #c9d1d9; }
  h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #8b949e; }

  .status-bar { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; }
  .status-bar .item { display: flex; align-items: center; gap: 6px; }
  .status-bar .label { color: #8b949e; white-space: nowrap; }
  .status-bar .value { color: #c9d1d9; font-weight: 500; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .status-dot.idle { background: #3fb950; }
  .status-dot.running { background: #d29922; animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .btn { padding: 8px 16px; border: 1px solid #30363d; border-radius: 6px; background: #21262d; color: #c9d1d9; font-size: 14px; cursor: pointer; transition: background .15s; font-family: inherit; }
  .btn:hover:not(:disabled) { background: #30363d; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: #238636; border-color: rgba(240,246,252,0.1); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #2ea043; }
  .btn-danger { background: #da3633; border-color: rgba(240,246,252,0.1); color: #fff; }
  .btn-danger:hover:not(:disabled) { background: #f85149; }
  .btn-warning { background: #d29922; border-color: rgba(240,246,252,0.1); color: #fff; }
  .btn-warning:hover:not(:disabled) { background: #e3b341; }
  .btn-secondary { background: #21262d; border-color: #30363d; color: #c9d1d9; }
  .btn-secondary:hover:not(:disabled) { background: #30363d; }

  .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
  .card-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .stat-box { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; text-align: center; }
  .stat-box .stat-value { font-size: 24px; font-weight: 600; color: #f0f6fc; }
  .stat-box .stat-label { font-size: 11px; color: #8b949e; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-box.success .stat-value { color: #3fb950; }
  .stat-box.failure .stat-value { color: #f85149; }
  .stat-box.pending .stat-value { color: #d29922; }

  .monthly-progress { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .monthly-progress .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .monthly-progress .count { font-size: 28px; font-weight: 700; color: #f0f6fc; }
  .monthly-progress .count .limit { font-size: 16px; font-weight: 400; color: #8b949e; }
  .monthly-progress .bar-track { height: 18px; background: #21262d; border-radius: 9px; overflow: hidden; position: relative; }
  .monthly-progress .bar-fill { height: 100%; border-radius: 9px; transition: width .6s ease; background: linear-gradient(90deg, #3fb950, #58a6ff); }
  .monthly-progress .bar-fill.warning { background: linear-gradient(90deg, #d29922, #e3b341); }
  .monthly-progress .bar-fill.danger { background: linear-gradient(90deg, #da3633, #f85149); }
  .monthly-progress .bar-label { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
  .monthly-progress .sub { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: #8b949e; }
  .monthly-progress .sub .remain { color: #3fb950; font-weight: 500; }
  .monthly-progress .sub .remain.warning { color: #d29922; }
  .monthly-progress .sub .remain.danger { color: #f85149; }

  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #21262d; }
  th { color: #8b949e; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { color: #c9d1d9; }
  tr:hover td { background: rgba(56,139,253,0.05); }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  .badge-success { background: rgba(63,185,80,0.15); color: #3fb950; }
  .badge-failure { background: rgba(248,81,73,0.15); color: #f85149; }
  .badge-pending { background: rgba(210,153,34,0.15); color: #d29922; }
  .badge-other { background: rgba(139,148,158,0.15); color: #8b949e; }
  .badge-production { background: rgba(88,166,255,0.15); color: #58a6ff; }
  .badge-preview { background: rgba(139,148,158,0.15); color: #8b949e; }
  td a { color: #58a6ff; text-decoration: none; }
  td a:hover { text-decoration: underline; }

  .log-area { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 12px; line-height: 1.6; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
  .log-area .line { padding: 1px 0; }
  .log-area .line.stderr { color: #f85149; }
  .log-area .line.stdout { color: #c9d1d9; }
  .log-empty { color: #8b949e; font-style: italic; }

  .toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast { padding: 12px 16px; border-radius: 6px; font-size: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); animation: slideIn .2s ease; max-width: 360px; }
  .toast-success { background: #238636; color: #fff; }
  .toast-error { background: #da3633; color: #fff; }
  .toast-warning { background: #d29922; color: #fff; }
  .toast-info { background: #1f6feb; color: #fff; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }

  .hidden { display: none; }
  .mt-8 { margin-top: 8px; }
  .mb-8 { margin-bottom: 8px; }
  .flex { display: flex; }
  .gap-8 { gap: 8px; }
  .items-center { align-items: center; }
  .text-sm { font-size: 12px; }
  .text-muted { color: #8b949e; }
  .commit-msg { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .no-data { color: #8b949e; text-align: center; padding: 20px; }

  .local-note { font-size: 12px; color: #8b949e; margin-top: 8px; }
  .tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid #30363d; }
  .tab { padding: 8px 16px; cursor: pointer; color: #8b949e; border-bottom: 2px solid transparent; transition: all .15s; }
  .tab:hover { color: #c9d1d9; }
  .tab.active { color: #f0f6fc; border-bottom-color: #58a6ff; }
</style>
</head>
<body>
<div class="container">
  <h1>Cloudflare Build & Deploy</h1>

  <div id="statusBar" class="status-bar"></div>

  <div class="actions">
    <button class="btn btn-primary" id="btnBuild" onclick="startTask('build')">Build</button>
    <button class="btn btn-warning" id="btnDeploy" onclick="startTask('deploy')">Deploy</button>
    <button class="btn btn-danger" id="btnBuildDeploy" onclick="startTask('build-and-deploy')">Build + Deploy</button>
    <button class="btn btn-secondary" id="btnRefresh" onclick="refreshStats()">Refresh Monthly Stats</button>
    <button class="btn btn-secondary" id="btnClear" onclick="clearLogs()">Clear Logs</button>
  </div>

  <div class="card">
    <h2>Monthly Statistics</h2>
    <p class="text-sm text-muted mb-8" id="statsNote">Click "Refresh Monthly Stats" to load Cloudflare Pages deployment data.</p>
    <div id="monthlyProgress" class="monthly-progress"></div>
    <div id="statsGrid" class="stats-grid"></div>
    <div id="statsError" class="text-sm text-muted mt-8 hidden"></div>
  </div>

  <div class="card">
    <div class="card-title">
      <h2>Deployments</h2>
    </div>
    <div class="tabs" id="deployTabs">
      <div class="tab active" data-tab="cloudflare" onclick="switchDeployTab('cloudflare')">Cloudflare API</div>
      <div class="tab" data-tab="local" onclick="switchDeployTab('local')">Local History</div>
    </div>
    <div id="deployContentCloudflare">
      <p class="text-sm text-muted" id="deployNote">Refresh monthly stats to see Cloudflare deployment data.</p>
      <div id="deployTableWrap"></div>
    </div>
    <div id="deployContentLocal" class="hidden">
      <div id="localHistoryWrap"></div>
      <p class="local-note">Only includes deployments executed through this tool.</p>
    </div>
  </div>

  <div class="card">
    <div class="card-title">
      <h2>Logs</h2>
      <span class="text-sm text-muted" id="logInfo"></span>
    </div>
    <div id="logArea" class="log-area">
      <div class="log-empty">No logs yet. Start a build or deploy.</div>
    </div>
  </div>

  <div class="text-sm text-muted" style="margin-top:8px;text-align:center;padding:12px;">
    To use Cloudflare API features, set
    <code style="background:#21262d;padding:2px 6px;border-radius:4px;">CLOUDFLARE_API_TOKEN</code>,
    <code style="background:#21262d;padding:2px 6px;border-radius:4px;">CLOUDFLARE_ACCOUNT_ID</code>, and
    <code style="background:#21262d;padding:2px 6px;border-radius:4px;">CLOUDFLARE_PAGES_PROJECT</code>
    environment variables before starting.
    <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" style="color:#58a6ff;">Create API Token →</a>
  </div>
</div>

<div class="toast-container" id="toastContainer"></div>

<script>
(function() {
  let statusPollInterval = null;
  let logPollInterval = null;
  let logSince = 0;
  let lastStatus = null;
  let currentDeployTab = 'cloudflare';

  function $(id) { return document.getElementById(id); }

  function showToast(message, type) {
    type = type || 'info';
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function updateStatus() {
    fetch('/api/status')
      .then(r => r.json())
      .then(s => {
        lastStatus = s;
        renderStatusBar(s);
        updateButtons(s);
      })
      .catch(() => {});
  }

  function renderStatusBar(s) {
    const bar = $('statusBar');
    const dotClass = s.running ? 'running' : 'idle';
    const statusText = s.running ? (s.phase || s.type || 'Running') : 'Idle';
    const cfg = window._config || {};
    bar.innerHTML = \`
      <div class="item"><span class="status-dot \${dotClass}"></span><span class="value">\${statusText}</span></div>
      <div class="item"><span class="label">Project:</span><span class="value">\${cfg.projectRoot || '—'}</span></div>
      <div class="item"><span class="label">Build:</span><span class="value">\${cfg.buildCommand || '—'}</span></div>
      <div class="item"><span class="label">Output:</span><span class="value">\${cfg.outputDir || '—'}</span></div>
      <div class="item"><span class="label">Pages:</span><span class="value">\${cfg.pagesProject || '(not set)'}</span></div>
      <div class="item"><span class="label">Branch:</span><span class="value">\${cfg.pagesBranch || '—'}</span></div>
      <div class="item"><span class="label">Token:</span><span class="value">\${cfg.hasToken ? 'Yes' : 'No'}</span></div>
    \`;
  }

  function updateButtons(s) {
    const btns = ['btnBuild', 'btnDeploy', 'btnBuildDeploy'];
    btns.forEach(id => $(id).disabled = s.running);
  }

  function fetchConfig() {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => {
        window._config = cfg;
        renderStatusBar(lastStatus || { running: false, type: null, phase: null });
      })
      .catch(() => {});
  }

  function pollLogs() {
    const url = '/api/logs' + (logSince > 0 ? '?since=' + logSince : '');
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const area = $('logArea');
        if (data.lines && data.lines.length > 0) {
          logSince = data.total;
          for (const line of data.lines) {
            const div = document.createElement('div');
            div.className = 'line ' + line.stream;
            div.textContent = line.text;
            area.appendChild(div);
          }
          area.scrollTop = area.scrollHeight;
          $('logInfo').textContent = data.total + ' lines';
        }
      })
      .catch(() => {});
  }

  function startTask(type) {
    const btn = $({ build: 'btnBuild', deploy: 'btnDeploy', 'build-and-deploy': 'btnBuildDeploy' }[type]);
    btn.disabled = true;
    fetch('/api/' + type, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          showToast(data.message || 'Failed to start task', 'error');
          btn.disabled = false;
        } else {
          showToast('Task started: ' + type, 'info');
          logSince = 0;
          const area = $('logArea');
          area.innerHTML = '';
          $('logInfo').textContent = '';
        }
      })
      .catch(err => {
        showToast('Network error: ' + err.message, 'error');
        btn.disabled = false;
      });
  }

  function clearLogs() {
    fetch('/api/clear-logs', { method: 'POST' })
      .then(r => r.json())
      .then(() => {
        const area = $('logArea');
        area.innerHTML = '<div class="log-empty">Logs cleared.</div>';
        logSince = 0;
        $('logInfo').textContent = '';
        showToast('Logs cleared', 'info');
      })
      .catch(() => {});
  }

  function refreshStats() {
    const btn = $('btnRefresh');
    btn.disabled = true;
    btn.textContent = 'Loading...';
    $('statsNote').textContent = 'Fetching Cloudflare Pages deployment data...';
    $('statsError').classList.add('hidden');

    fetch('/api/monthly-deployments')
      .then(r => r.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = 'Refresh Monthly Stats';
        if (data.error) {
          $('statsNote').textContent = '';
          $('statsError').textContent = data.message || 'Failed to fetch stats';
          $('statsError').classList.remove('hidden');
          renderStats({ total: 0, limit: 500 });
          renderDeployTable(null);
          return;
        }
        $('statsNote').textContent = 'Data from Cloudflare API. Updated just now.';
        renderStats(data);
        renderDeployTable(data.deployments);
      })
      .catch(err => {
        btn.disabled = false;
        btn.textContent = 'Refresh Monthly Stats';
        $('statsNote').textContent = '';
        $('statsError').textContent = 'Network error: ' + err.message;
        $('statsError').classList.remove('hidden');
      });
  }

  function renderStats(data) {
    const grid = $('statsGrid');
    if (!data) {
      grid.innerHTML = '<div class="no-data">No data available. Click "Refresh Monthly Stats" to load.</div>';
      $('monthlyProgress').innerHTML = '';
      return;
    }
    const total = data.total || 0;
    const limit = 500;
    const pct = Math.min(100, (total / limit) * 100);
    const barClass = pct >= 90 ? 'danger' : pct >= 60 ? 'warning' : '';
    const remain = limit - total;
    const remainClass = remain <= 50 ? 'danger' : remain <= 200 ? 'warning' : '';
    $('monthlyProgress').innerHTML = \`
      <div class="header">
        <span style="font-size:13px;color:#8b949e;font-weight:500;">当月部署次数</span>
        <span class="count">\${total} <span class="limit">/ \${limit}</span></span>
      </div>
      <div class="bar-track">
        <div class="bar-fill \${barClass}" style="width:\${pct}%"></div>
        <span class="bar-label">\${pct.toFixed(1)}%</span>
      </div>
      <div class="sub">
        <span>本月已用 \${total} 次</span>
        <span class="remain \${remainClass}">剩余 \${remain} 次</span>
      </div>
    \`;
    const items = [
      { label: 'Total', value: total, cls: '' },
      { label: 'Success', value: data.success || 0, cls: 'success' },
      { label: 'Failed', value: data.failure || 0, cls: 'failure' },
      { label: 'Pending', value: data.pending || 0, cls: 'pending' },
      { label: 'Production', value: data.production || 0, cls: '' },
      { label: 'Preview', value: data.preview || 0, cls: '' },
    ];
    grid.innerHTML = items.map(i => \`
      <div class="stat-box \${i.cls}">
        <div class="stat-value">\${i.value}</div>
        <div class="stat-label">\${i.label}</div>
      </div>
    \`).join('');
  }

  function renderDeployTable(deployments) {
    const wrap = $('deployTableWrap');
    if (!deployments || deployments.length === 0) {
      wrap.innerHTML = '<div class="no-data">No deployment records found this month.</div>';
      return;
    }
    const rows = deployments.map(d => {
      const statusBadge = 'badge-' + d.status;
      const envBadge = 'badge-' + (d.environment === 'production' ? 'production' : 'preview');
      const urlDisplay = d.url && d.url !== '—' ? \`<a href="\${d.url}" target="_blank" rel="noopener">\${d.url.replace(/^https?:\\/\\//, '')}</a>\` : '—';
      const time = d.created_on !== '—' ? new Date(d.created_on).toLocaleString() : '—';
      return \`<tr>
        <td>\${time}</td>
        <td><span class="badge \${statusBadge}">\${d.status}</span></td>
        <td><span class="badge \${envBadge}">\${d.environment}</span></td>
        <td>\${d.branch}</td>
        <td title="\${d.commit_message}"><code>\${d.commit_hash}</code></td>
        <td>\${urlDisplay}</td>
      </tr>\`;
    }).join('');
    wrap.innerHTML = \`
      <table>
        <thead><tr>
          <th>Time</th><th>Status</th><th>Environment</th><th>Branch</th><th>Commit</th><th>URL</th>
        </tr></thead>
        <tbody>\${rows}</tbody>
      </table>
    \`;
  }

  function renderLocalHistory() {
    const wrap = $('localHistoryWrap');
    fetch('/api/local-history')
      .then(r => r.json())
      .then(data => {
        const entries = data.entries || [];
        if (entries.length === 0) {
          wrap.innerHTML = '<div class="no-data">No local deployment history yet.</div>';
          return;
        }
        const rows = entries.map(e => {
          const statusClass = e.success ? 'badge-success' : 'badge-failure';
          const statusText = e.success ? 'Success' : 'Failed';
          const time = e.finishedAt ? new Date(e.finishedAt).toLocaleString() : '—';
          const dur = e.durationMs != null ? (e.durationMs / 1000).toFixed(1) + 's' : '—';
          const urlDisplay = e.deploymentUrl ? \`<a href="\${e.deploymentUrl}" target="_blank" rel="noopener">\${e.deploymentUrl.replace(/^https?:\\/\\//, '')}</a>\` : '—';
          return \`<tr>
            <td>\${time}</td>
            <td><span class="badge \${statusClass}">\${statusText}</span></td>
            <td>\${dur}</td>
            <td>\${e.branch || '—'}</td>
            <td>\${urlDisplay}</td>
          </tr>\`;
        }).join('');
        wrap.innerHTML = \`
          <table>
            <thead><tr>
              <th>Time</th><th>Status</th><th>Duration</th><th>Branch</th><th>URL</th>
            </tr></thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;
      })
      .catch(() => {
        wrap.innerHTML = '<div class="no-data">Failed to load local history.</div>';
      });
  }

  function switchDeployTab(tab) {
    currentDeployTab = tab;
    document.querySelectorAll('#deployTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $('deployContentCloudflare').classList.toggle('hidden', tab !== 'cloudflare');
    $('deployContentLocal').classList.toggle('hidden', tab !== 'local');
    if (tab === 'local') renderLocalHistory();
  }

  function init() {
    fetchConfig();
    updateStatus();
    statusPollInterval = setInterval(updateStatus, 2000);
    logPollInterval = setInterval(pollLogs, 800);

    document.addEventListener('visibilitychange', () => {
      if (logPollInterval) {
        clearInterval(logPollInterval);
        logPollInterval = null;
      }
      if (document.hidden) {
        logPollInterval = setInterval(pollLogs, 4000);
      } else {
        pollLogs();
        logPollInterval = setInterval(pollLogs, 800);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
</body>
</html>`;
}

// ─── Entry Point ──────────────────────────────────────────────────
startServer();
