import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useParams, Link } from 'react-router';
import { Key, Terminal, Shield, Server, Lock } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';

interface FakeEndpoint {
  method: string;
  path: string;
  desc: string;
}

interface FakeProvider {
  id: string;
  name: string;
  color: string;
  keyPrefix: string;
  baseUrl: string;
  models: string[];
  endpoints: FakeEndpoint[];
}

function generateProviders(): FakeProvider[] {
  return [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      color: '#4F46E5',
      keyPrefix: 'sk-',
      baseUrl: 'https://api.deepseek.com/v1',
      models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner', 'deepseek-r1', 'deepseek-coder'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/moderations', desc: 'Content moderation' },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      color: '#10A37F',
      keyPrefix: 'sk-proj-',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-5', 'gpt-5-turbo', 'gpt-5-pro', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini', 'o4', 'o4-mini'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions (legacy)' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/images/generations', desc: 'Image generation (DALL·E 4)' },
        { method: 'POST', path: '/audio/transcriptions', desc: 'Audio transcription (Whisper-4)' },
        { method: 'POST', path: '/audio/speech', desc: 'Text-to-speech (TTS-2)' },
        { method: 'POST', path: '/moderations', desc: 'Content moderation' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      color: '#CC7953',
      keyPrefix: 'sk-ant-api03-',
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-5', 'claude-opus-4', 'claude-sonnet-4'],
      endpoints: [
        { method: 'POST', path: '/messages', desc: 'Send a message' },
        { method: 'POST', path: '/complete', desc: 'Text completion (legacy)' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'GET', path: '/models', desc: 'List available models' },
      ],
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      color: '#4285F4',
      keyPrefix: 'AIza',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-3.0-pro', 'gemini-3.0-flash', 'gemini-3.0-ultra', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemma-3'],
      endpoints: [
        { method: 'POST', path: '/models/{model}:generateContent', desc: 'Generate content' },
        { method: 'POST', path: '/models/{model}:streamGenerateContent', desc: 'Stream generate content' },
        { method: 'POST', path: '/models/{model}:embedContent', desc: 'Embed content' },
        { method: 'POST', path: '/models/{model}:countTokens', desc: 'Count tokens' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
    {
      id: 'copilot',
      name: 'GitHub Copilot',
      color: '#6E40C9',
      keyPrefix: 'ghu_',
      baseUrl: 'https://api.githubcopilot.com',
      models: ['copilot-gpt-5', 'copilot-claude-sonnet', 'copilot-gemini-ultra', 'copilot-deepseek-coder'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Code completions' },
        { method: 'POST', path: '/embeddings', desc: 'Code embeddings' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
    {
      id: 'glm',
      name: 'GLM (智谱)',
      color: '#1E90FF',
      keyPrefix: 'glm-',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v5',
      models: ['glm-7', 'glm-7-flash', 'glm-7-vision', 'glm-7-ultra', 'glm-6', 'glm-6v', 'glm-4v-plus', 'cogview-4'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/images/generations', desc: 'Image generation (CogView)' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/tools/sql', desc: 'Text-to-SQL' },
      ],
    },
    {
      id: 'mimo',
      name: 'MiMo',
      color: '#FF6B35',
      keyPrefix: 'mm-',
      baseUrl: 'https://api.mimo.ai/v2',
      models: ['mimo-4x', 'mimo-4x-turbo', 'mimo-4x-vision', 'mimo-4x-reasoning', 'mimo-3x', 'mimo-3x-lite'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/rerank', desc: 'Reranking' },
      ],
    },
    {
      id: 'qwen',
      name: 'Qwen (通义千问)',
      color: '#FF6A00',
      keyPrefix: 'sk-',
      baseUrl: 'https://dashscope-intl.aliyuncs.com/v2',
      models: ['qwen6-max', 'qwen6-plus', 'qwen6-turbo', 'qwen6-vl', 'qwen6-coder', 'qwen6-math', 'qwen6-omni'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/audio/transcriptions', desc: 'Audio transcription' },
        { method: 'POST', path: '/images/generations', desc: 'Image generation (Tongyi Wanxiang)' },
      ],
    },
    {
      id: 'moonshot',
      name: 'Moonshot (月之暗面)',
      color: '#8B5CF6',
      keyPrefix: 'sk-',
      baseUrl: 'https://api.moonshot.cn/v1',
      models: ['moonshot-v3', 'moonshot-v3-32k', 'moonshot-v3-128k', 'moonshot-v3-vision', 'moonshot-v3-reasoning'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
    {
      id: 'baichuan',
      name: 'Baichuan (百川)',
      color: '#E60012',
      keyPrefix: 'sk-',
      baseUrl: 'https://api.baichuan-ai.com/v1',
      models: ['baichuan4-turbo', 'baichuan4-pro', 'baichuan4-vision', 'baichuan4-lite', 'baichuan3'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
      ],
    },
    {
      id: 'ernie',
      name: 'ERNIE (文心一言)',
      color: '#0052FF',
      keyPrefix: 'ERNIE-',
      baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxin',
      models: ['ernie-6.0', 'ernie-6.0-turbo', 'ernie-6.0-pro', 'ernie-6.0-vision', 'ernie-lite', 'ernie-speed'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/images/generations', desc: 'Image generation' },
      ],
    },
    {
      id: 'minimax',
      name: 'MiniMax',
      color: '#FF0080',
      keyPrefix: 'mm-',
      baseUrl: 'https://api.minimax.chat/v1',
      models: ['minimax-tt1-pro', 'minimax-tt1', 'minimax-tt1-vision', 'minimax-abab7', 'minimax-abab6.5'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'POST', path: '/audio/tts', desc: 'Text-to-speech' },
      ],
    },
    {
      id: 'stepfun',
      name: 'StepFun (阶跃星辰)',
      color: '#00C4B8',
      keyPrefix: 'step-',
      baseUrl: 'https://api.stepfun.com/v1',
      models: ['step-3', 'step-3-turbo', 'step-3-vision', 'step-3-200k', 'step-3-math', 'step-2'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
      ],
    },
    {
      id: 'coze',
      name: 'Coze (扣子)',
      color: '#6C5CE7',
      keyPrefix: 'pat_',
      baseUrl: 'https://api.coze.cn/v1',
      models: ['coze-gpt-5', 'coze-claude-5', 'coze-ernie-6', 'coze-glm-7'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/workflow/run', desc: 'Run workflow' },
        { method: 'GET', path: '/bot/list', desc: 'List bots' },
      ],
    },
    {
      id: 'groq',
      name: 'Groq',
      color: '#F55036',
      keyPrefix: 'gsk_',
      baseUrl: 'https://api.groq.com/v1',
      models: ['llama-5-405b', 'llama-5-70b', 'mixtral-8x24b', 'gemma-3-27b', 'deepseek-r1-distill-llama-70b'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'POST', path: '/embeddings', desc: 'Text embeddings' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
    {
      id: 'perplexity',
      name: 'Perplexity AI',
      color: '#2080F0',
      keyPrefix: 'pplx-',
      baseUrl: 'https://api.perplexity.ai',
      models: ['sonar-pro', 'sonar-reasoning', 'sonar-deep-research', 'sonar-online'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Text completions' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      color: '#22D3EE',
      keyPrefix: 'oc_',
      baseUrl: 'https://api.opencode.ai/v1',
      models: ['opencode-v4-flash', 'opencode-v4-pro', 'opencode-v4-reasoning', 'opencode-coder', 'opencode-agent'],
      endpoints: [
        { method: 'POST', path: '/chat/completions', desc: 'Chat completions' },
        { method: 'POST', path: '/completions', desc: 'Code completions' },
        { method: 'POST', path: '/edits', desc: 'Code edits' },
        { method: 'POST', path: '/reviews', desc: 'Code review' },
        { method: 'POST', path: '/embeddings', desc: 'Code embeddings' },
        { method: 'GET', path: '/models', desc: 'List models' },
      ],
    },
  ];
}

function generateBillingEntry(): { plan: string; credits: string; expires: string } {
  return {
    plan: 'Not connected',
    credits: 'Not available',
    expires: 'Not available',
  };
}

function generateRateLimit(): string {
  return 'Provider-defined';
}

export default function ApiDocs() {
  const { provider: paramProvider } = useParams<{ provider: string }>();
  const { ref, isVisible } = useScrollReveal();
  const { playTrack, currentTrack } = useMusic();

  const providers = generateProviders();

  const selectedProvider = paramProvider
    ? providers.find(p => p.id === paramProvider)
    : null;

  useEffect(() => {
    if (isVisible && currentTrack !== '/audio/stars.mp3') {
      playTrack('/audio/stars.mp3');
    }
  }, [isVisible, playTrack, currentTrack]);

  return (
    <div className="aurora-ui aurora-generic-page api-aurora-page" data-aurora-accent="settings">
      <div className="aurora-container aurora-generic-inner">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="aurora-simple-hero"><p className="aurora-eyebrow">08 / DEVELOPER SYSTEM</p><div className="flex items-center gap-3 mb-2">
          <Terminal className="w-6 h-6 text-nc-violet" />
          <h1 className="aurora-title">API Reference</h1>
        </div>
        <p className="text-nc-text-secondary mb-8">
          AI platform API documentation — {providers.length} providers supported
        </p></div>

        {selectedProvider ? (
          <ProviderDetail
            provider={selectedProvider}
            onBack={() => window.history.back()}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {providers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={`/api/${p.id}`}
                    className="api-aurora-card block rounded-xl p-5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: p.color + '20', color: p.color }}
                        >
                          {p.name[0]}
                        </div>
                        <h3 className="font-semibold text-sm">{p.name}</h3>
                      </div>
                      <Key className="w-4 h-4 text-nc-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-3 h-3 text-nc-text-muted shrink-0" />
                      <code className="text-[10px] text-nc-text-muted font-mono truncate">
                        {p.keyPrefix}•••• (not configured)
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="w-3 h-3 text-nc-text-muted shrink-0" />
                      <span className="text-[10px] text-nc-text-muted font-mono truncate">{p.baseUrl}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.models.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-nc-bg-tertiary text-nc-text-muted"
                        >
                          {m}
                        </span>
                      ))}
                      {p.models.length > 4 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-nc-bg-tertiary text-nc-text-muted">
                          +{p.models.length - 4}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl border border-nc-violet/15 liquid-glass-subtle p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-nc-gold" />
                <h2 className="text-lg font-semibold">Local API Configuration</h2>
              </div>
              <p className="text-sm text-nc-text-secondary mb-4">This reference page never generates, stores, reveals, or copies API keys. Configure your own key in <Link to="/settings/ai" className="text-nc-cyan hover:underline">AI Settings</Link>.</p>
              <div className="space-y-1 font-mono text-xs">
                <div className="text-nc-text-muted mb-1"># Provider-issued credentials are not configured here</div>
                {providers.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-nc-text-muted shrink-0 w-20"># {p.name}</span>
                    <span className="text-nc-text-muted">{p.keyPrefix}•••• (not configured)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-nc-violet/15 liquid-glass-subtle p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-nc-cyan" />
                <h2 className="text-lg font-semibold">Quick Start Examples</h2>
              </div>
              {providers.slice(0, 3).map((p) => (
                <div key={p.id} className="mb-4 last:mb-0">
                  <h3 className="text-sm font-medium text-nc-text mb-2">{p.name}</h3>
                  <pre className="bg-nc-bg-tertiary rounded-lg p-4 overflow-x-auto text-xs font-mono text-nc-text-secondary leading-relaxed">
                    <span className="text-nc-text-muted">curl {p.baseUrl}{p.endpoints[0].path} \</span>{'\n'}
                    <span className="text-nc-text-muted">  -H "Authorization: Bearer YOUR_API_KEY" \</span>{'\n'}
                    <span className="text-nc-text-muted">  -H "Content-Type: application/json" \</span>{'\n'}
                    <span className="text-nc-text-muted">{'  -d \'{"model":"'}{p.models[0]}{'","messages":[{"role":"user","content":"hello"}]}\''}</span>
                  </pre>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
      </div>
    </div>
  );
}

function ProviderDetail({
  provider,
  onBack,
}: {
  provider: FakeProvider;
  onBack: () => void;
}) {
  const rateLimit = generateRateLimit();
  const billing = generateBillingEntry();

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-nc-text-muted hover:text-nc-cyan mb-6 transition-colors"
      >
        ← Back to Providers
      </button>

      <div className="rounded-2xl border border-nc-violet/15 liquid-glass-subtle p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: provider.color + '20', color: provider.color }}
          >
            {provider.name[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{provider.name}</h2>
            <span className="text-xs text-nc-text-muted font-mono">{provider.baseUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-nc-text-muted" />
          <span className="text-sm text-nc-text-secondary">API Key:</span>
          <code className="text-xs font-mono bg-nc-bg-tertiary px-3 py-1.5 rounded border border-nc-violet/10">
            YOUR_API_KEY (not configured)
          </code>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-nc-bg-tertiary/50 p-4">
            <div className="text-xs text-nc-text-muted mb-1">Rate Limit</div>
            <div className="text-lg font-semibold font-mono">{rateLimit}</div>
          </div>
          <div className="rounded-xl bg-nc-bg-tertiary/50 p-4">
            <div className="text-xs text-nc-text-muted mb-1">Billing Plan</div>
            <div className="text-lg font-semibold font-mono">{billing.plan}</div>
            <div className="text-xs text-nc-text-muted mt-1">{billing.credits} remaining</div>
          </div>
          <div className="rounded-xl bg-nc-bg-tertiary/50 p-4">
            <div className="text-xs text-nc-text-muted mb-1">Usage (this month)</div>
            <div className="text-lg font-semibold font-mono">Not connected</div>
            <div className="text-xs text-nc-text-muted mt-1">Live usage is unavailable in this static reference.</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-nc-text mb-2">Available Models</h3>
          <div className="flex flex-wrap gap-2">
            {provider.models.map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 rounded-lg bg-nc-bg-tertiary border border-nc-violet/10 text-xs font-mono text-nc-text-secondary"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-nc-text mb-3">API Endpoints</h3>
          <div className="space-y-2">
            {provider.endpoints.map((ep, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-nc-bg-tertiary/30 p-3 border border-nc-violet/5"
              >
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    ep.method === 'GET'
                      ? 'bg-nc-cyan/10 text-nc-cyan'
                      : ep.method === 'POST'
                      ? 'bg-nc-violet/10 text-nc-violet'
                      : 'bg-nc-gold/10 text-nc-gold'
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-nc-text-secondary truncate">{ep.path}</code>
                <span className="text-xs text-nc-text-muted ml-auto shrink-0">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-nc-text mb-2">Environment Variables</h3>
          <pre className="bg-nc-bg-tertiary rounded-lg p-4 overflow-x-auto text-xs font-mono text-nc-text-secondary leading-relaxed">
            <div className="text-nc-text-muted mt-2"># {provider.name} SDK Configuration</div>
            <div>AI_PROVIDER="{provider.id}"</div>
            <div>AI_MODEL="{provider.models[0]}"</div>
            <div>AI_BASE_URL="{provider.baseUrl}"</div>
            <div>AI_API_KEY="YOUR_API_KEY"</div>
            <div className="text-nc-text-muted"># Set this value locally; this site does not generate or store it.</div>
          </pre>
        </div>
      </div>

      <div className="rounded-2xl border border-nc-violet/15 liquid-glass-subtle p-6">
        <h3 className="text-sm font-semibold text-nc-text mb-3">Example: {provider.name} Chat Completion</h3>
        <pre className="bg-nc-bg-tertiary rounded-lg p-4 overflow-x-auto text-xs font-mono text-nc-text-secondary leading-relaxed">
          <span className="text-nc-text-muted">curl {provider.baseUrl}{provider.endpoints[0].path} \</span>{'\n'}
          <span className="text-nc-text-muted">  -H "Authorization: Bearer YOUR_API_KEY" \</span>{'\n'}
          <span className="text-nc-text-muted">  -H "Content-Type: application/json" \</span>{'\n'}
          <span className="text-nc-text-muted">  -d &apos;{'{'}</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;model&quot;: &quot;{provider.models[0]}&quot;,</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;messages&quot;: [</span>{'\n'}
          <span className="text-nc-text-muted">      {'{'}&quot;role&quot;: &quot;system&quot;, &quot;content&quot;: &quot;You are a helpful assistant.&quot;{'}'},</span>{'\n'}
          <span className="text-nc-text-muted">      {'{'}&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;Hello!&quot;{'}'}</span>{'\n'}
          <span className="text-nc-text-muted">    ],</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;temperature&quot;: 0.7,</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;max_tokens&quot;: 1200,</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;top_p&quot;: 0.95,</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;stream&quot;: false,</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;frequency_penalty&quot;: 0,</span>{'\n'}
          <span className="text-nc-text-muted">    &quot;presence_penalty&quot;: 0</span>{'\n'}
          <span className="text-nc-text-muted">  {'}'}&apos;</span>
        </pre>
      </div>
    </div>
  );
}
