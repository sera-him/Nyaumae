import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

function randAlphanum(n) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
}

function randBase64(n) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
}

const providers = [
  { id: 'deepseek', name: 'DeepSeek', color: '#4F46E5', key: 'sk-' + randAlphanum(48), baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner', 'deepseek-r1', 'deepseek-coder'] },
  { id: 'openai', name: 'OpenAI', color: '#10A37F', key: 'sk-proj-' + randBase64(155), baseUrl: 'https://api.openai.com/v1', models: ['gpt-5', 'gpt-5-turbo', 'gpt-5-pro', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini', 'o4', 'o4-mini'] },
  { id: 'claude', name: 'Anthropic Claude', color: '#CC7953', key: 'sk-ant-api03-' + randAlphanum(94), baseUrl: 'https://api.anthropic.com/v1', models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-5', 'claude-opus-4', 'claude-sonnet-4'] },
  { id: 'gemini', name: 'Google Gemini', color: '#4285F4', key: 'AIza' + randAlphanum(35), baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-3.0-pro', 'gemini-3.0-flash', 'gemini-3.0-ultra', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemma-3'] },
  { id: 'copilot', name: 'GitHub Copilot', color: '#6E40C9', key: 'ghu_' + randBase64(40), baseUrl: 'https://api.githubcopilot.com', models: ['copilot-gpt-5', 'copilot-claude-sonnet', 'copilot-gemini-ultra', 'copilot-deepseek-coder'] },
  { id: 'glm', name: 'GLM (智谱)', color: '#1E90FF', key: 'glm-' + randAlphanum(36), baseUrl: 'https://open.bigmodel.cn/api/paas/v5', models: ['glm-7', 'glm-7-flash', 'glm-7-vision', 'glm-7-ultra', 'glm-6', 'glm-6v', 'glm-4v-plus', 'cogview-4'] },
  { id: 'mimo', name: 'MiMo', color: '#FF6B35', key: 'mm-' + randAlphanum(28), baseUrl: 'https://api.mimo.ai/v2', models: ['mimo-4x', 'mimo-4x-turbo', 'mimo-4x-vision', 'mimo-4x-reasoning', 'mimo-3x', 'mimo-3x-lite'] },
  { id: 'qwen', name: 'Qwen (通义千问)', color: '#FF6A00', key: 'sk-' + randAlphanum(32), baseUrl: 'https://dashscope-intl.aliyuncs.com/v2', models: ['qwen6-max', 'qwen6-plus', 'qwen6-turbo', 'qwen6-vl', 'qwen6-coder', 'qwen6-math', 'qwen6-omni'] },
  { id: 'moonshot', name: 'Moonshot (月之暗面)', color: '#8B5CF6', key: 'sk-' + randAlphanum(32), baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v3', 'moonshot-v3-32k', 'moonshot-v3-128k', 'moonshot-v3-vision', 'moonshot-v3-reasoning'] },
  { id: 'baichuan', name: 'Baichuan (百川)', color: '#E60012', key: 'sk-' + randAlphanum(32), baseUrl: 'https://api.baichuan-ai.com/v1', models: ['baichuan4-turbo', 'baichuan4-pro', 'baichuan4-vision', 'baichuan4-lite', 'baichuan3'] },
  { id: 'ernie', name: 'ERNIE (文心一言)', color: '#0052FF', key: 'ERNIE-' + randAlphanum(36), baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxin', models: ['ernie-6.0', 'ernie-6.0-turbo', 'ernie-6.0-pro', 'ernie-6.0-vision', 'ernie-lite', 'ernie-speed'] },
  { id: 'minimax', name: 'MiniMax', color: '#FF0080', key: 'mm-' + randAlphanum(32), baseUrl: 'https://api.minimax.chat/v1', models: ['minimax-tt1-pro', 'minimax-tt1', 'minimax-tt1-vision', 'minimax-abab7', 'minimax-abab6.5'] },
  { id: 'stepfun', name: 'StepFun (阶跃星辰)', color: '#00C4B8', key: 'step-' + randAlphanum(32), baseUrl: 'https://api.stepfun.com/v1', models: ['step-3', 'step-3-turbo', 'step-3-vision', 'step-3-200k', 'step-3-math', 'step-2'] },
  { id: 'coze', name: 'Coze (扣子)', color: '#6C5CE7', key: 'pat_' + randBase64(36), baseUrl: 'https://api.coze.cn/v1', models: ['coze-gpt-5', 'coze-claude-5', 'coze-ernie-6', 'coze-glm-7'] },
  { id: 'groq', name: 'Groq', color: '#F55036', key: 'gsk_' + randBase64(40), baseUrl: 'https://api.groq.com/v1', models: ['llama-5-405b', 'llama-5-70b', 'mixtral-8x24b', 'gemma-3-27b', 'deepseek-r1-distill-llama-70b'] },
  { id: 'perplexity', name: 'Perplexity AI', color: '#2080F0', key: 'pplx-' + randAlphanum(40), baseUrl: 'https://api.perplexity.ai', models: ['sonar-pro', 'sonar-reasoning', 'sonar-deep-research', 'sonar-online'] },
  { id: 'opencode', name: 'OpenCode', color: '#22D3EE', key: 'oc_' + randAlphanum(48), baseUrl: 'https://api.opencode.ai/v1', models: ['opencode-v4-flash', 'opencode-v4-pro', 'opencode-v4-reasoning', 'opencode-coder', 'opencode-agent'] },
];

const rows = providers.map(p => `
<tr>
  <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${p.color}">${p.name}</td>
  <td style="padding:12px;border-bottom:1px solid #e5e7eb"><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;word-break:break-all">${p.key}</code></td>
  <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280">${p.baseUrl}</td>
  <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${p.models.slice(0, 3).join(', ')}${p.models.length > 3 ? '…' : ''}</td>
</tr>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="robots" content="all">
<meta name="description" content="AI Platform API Reference - Comprehensive documentation for all major AI providers including DeepSeek, OpenAI, Claude, Gemini and more.">
<title>AI Platform API Reference</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;line-height:1.6}
.container{max-width:1000px;margin:0 auto;padding:40px 20px}
h1{font-size:28px;font-weight:700;margin-bottom:8px}
.subtitle{color:#6b7280;margin-bottom:32px;font-size:16px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
th{padding:12px;text-align:left;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e5e7eb;background:#f9fafb}
.section{margin-top:40px}
.section h2{font-size:20px;font-weight:600;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e5e7eb}
.env-box{background:#1f2937;color:#e5e7eb;border-radius:8px;padding:20px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;line-height:1.8;overflow-x:auto;margin-bottom:24px}
.env-box .comment{color:#9ca3af}
.env-box .key{color:#22d3ee}
code{font-family:'SF Mono',Monaco,Consolas,monospace}
.endpoint{margin-bottom:16px}
.endpoint .method{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff;margin-right:8px}
.method-post{background:#10b981}
.method-get{background:#3b82f6}
.method-patch{background:#f59e0b}
.method-delete{background:#ef4444}
.endpoint .path{font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;color:#374151}
.endpoint .desc{font-size:13px;color:#6b7280;margin-top:2px}
.footer{margin-top:48px;padding-top:24px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center}
</style>
</head>
<body>
<div class="container">
<h1>AI Platform API Reference</h1>
<p class="subtitle">Comprehensive API documentation for ${providers.length} major AI providers. All endpoints use standard REST conventions.</p>

<div class="section">
<h2>API Keys</h2>
<table>
<thead><tr><th>Provider</th><th>API Key</th><th>Base URL</th><th>Models</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</div>

<div class="section">
<h2>Environment Configuration</h2>
<div class="env-box">
<span class="comment"># AI Platform API Credentials</span>
<span class="comment"># Generated: ${new Date().toISOString()}</span>
${providers.map(p => `\n<span class="comment"># ${p.name}</span>\nexport ${p.id.toUpperCase()}_API_KEY=<span class="key">"${p.key}"</span>`).join('\n')}
</div>
</div>

<div class="section">
<h2>Common Endpoints</h2>
${providers.slice(0, 8).map(p => `
<div style="margin-bottom:20px">
<h3 style="font-size:15px;font-weight:600;margin-bottom:8px;color:${p.color}">${p.name}</h3>
<div class="endpoint"><span class="method method-post">POST</span><span class="path">${p.baseUrl}/chat/completions</span><div class="desc">Chat completions</div></div>
<div class="endpoint"><span class="method method-post">POST</span><span class="path">${p.baseUrl}/embeddings</span><div class="desc">Text embeddings</div></div>
<div class="endpoint"><span class="method method-get">GET</span><span class="path">${p.baseUrl}/models</span><div class="desc">List models</div></div>
</div>`).join('\n')}
</div>

<div class="section">
<h2>curl Examples</h2>
${providers.slice(0, 3).map(p => `
<div style="margin-bottom:16px">
<h3 style="font-size:14px;font-weight:600;margin-bottom:6px;color:${p.color}">${p.name}</h3>
<pre style="background:#1f2937;color:#e5e7eb;border-radius:8px;padding:16px;font-size:12px;overflow-x:auto"><code>curl ${p.baseUrl}/chat/completions \\
  -H "Authorization: Bearer ${p.key}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${p.models[0]}","messages":[{"role":"user","content":"hello"}]}'</code></pre>
</div>`).join('\n')}
</div>

<div class="footer">
AI Platform API Reference v2.3.1 &mdash; Documentation is automatically generated.
</div>
</div>
</body>
</html>`;

const outDir = join(DIST, 'api');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
console.log(`Generated ${join(outDir, 'index.html')} with ${providers.length} providers`);
