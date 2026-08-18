export type LocalRunMode = 'device' | 'browser';

export type LocalModelDownloadKind = 'ollama' | 'huggingface';

export interface LocalModelDownload {
  kind: LocalModelDownloadKind;
  command: string;
  sourceUrl: string;
  note: string;
}

export interface LocalModelTier {
  id: string;
  label: string;
  parameters: number;
  quantizedMemory: string;
  hardware: string;
  description: string;
  deviceModel: string;
  ollamaModel?: string;
  browserModel?: string;
  browserDownload?: string;
  download: LocalModelDownload;
}

type LocalModelTierDefinition = Omit<LocalModelTier, 'download'>;

const HUGGING_FACE_NOTE = '若尚未安装 HF CLI，先运行：py -m pip install -U huggingface_hub hf_xet。这里下载的是 Hugging Face 官方原始权重，不能把仓库名当作 Ollama 模型名；请使用支持该格式和架构的本地推理工具。';

function ollamaDownload(model: string): LocalModelDownload {
  return {
    kind: 'ollama',
    command: `ollama pull ${model}`,
    sourceUrl: `https://ollama.com/library/${model.split(':')[0]}`,
    note: 'Ollama 官方注册表中的本地模型包，下载后由 Ollama 在本机运行；它不是云端调用。',
  };
}

function huggingFaceDownload(repo: string): LocalModelDownload {
  const folder = repo.split('/').pop() ?? repo;
  const note = repo === 'deepseek-ai/DeepSeek-V4-Flash-0731'
    ? '先运行：py -m pip install -U huggingface_hub hf_xet。然后使用上面的 hf download 命令下载 DeepSeek 官方 FP8 权重；该模型没有 Ollama 官方本地包，不要执行 ollama pull。下载完成后请使用支持 DeepSeek-V4 架构的 vLLM 或 SGLang，并按官方模型卡配置推理服务。'
    : repo === 'moonshotai/Kimi-K3'
    ? '若尚未安装 HF CLI，先运行：py -m pip install -U huggingface_hub hf_xet。Kimi K3 官方原始权重需要兼容其模型架构的分布式推理环境；不能直接通过 Ollama 或普通电脑运行。'
    : repo === 'moonshotai/Kimi-K2.6'
      ? '若尚未安装 HF CLI，先运行：py -m pip install -U huggingface_hub hf_xet。Kimi K2.6 官方原始权重需要兼容其模型架构的高性能推理环境；不能直接通过 Ollama 运行。'
      : HUGGING_FACE_NOTE;
  return {
    kind: 'huggingface',
    command: `hf download ${repo} --local-dir "./models/${folder}"`,
    sourceUrl: `https://huggingface.co/${repo}`,
    note,
  };
}

function addDownloadInstruction(tier: LocalModelTierDefinition): LocalModelTier {
  return {
    ...tier,
    download: tier.ollamaModel ? ollamaDownload(tier.ollamaModel) : huggingFaceDownload(tier.deviceModel),
  };
}

// Ollama aliases are included only when the official Ollama registry has a local tag.
// Hugging Face repository IDs stay explicit so they are never accidentally passed to Ollama.
export const LOCAL_MODEL_TIERS: LocalModelTier[] = [
  { id: '1m', label: '1M', parameters: 1e6, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 1M', deviceModel: 'roneneldan/TinyStories-1M' },
  { id: '14m', label: '14M', parameters: 1.4e7, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'Pythia 14M', deviceModel: 'EleutherAI/pythia-14m' },
  { id: '70m', label: '70M', parameters: 7e7, quantizedMemory: '约 0.2 GB', hardware: 'Any modern device', description: 'Pythia 70M', deviceModel: 'EleutherAI/pythia-70m' },
  { id: '160m', label: '160M', parameters: 1.6e8, quantizedMemory: '约 0.4 GB', hardware: '4 GB RAM', description: 'Pythia 160M', deviceModel: 'EleutherAI/pythia-160m' },
  { id: '410m', label: '410M', parameters: 4.1e8, quantizedMemory: '约 0.8 GB', hardware: '4 GB RAM', description: 'Pythia 410M', deviceModel: 'EleutherAI/pythia-410m' },
  { id: '1b', label: '1B', parameters: 1e9, quantizedMemory: '约 2 GB', hardware: '8 GB RAM / WebGPU', description: 'Pythia 1B', deviceModel: 'EleutherAI/pythia-1b', browserModel: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', browserDownload: '约 800 MB' },
  { id: '1_4b', label: '1.4B', parameters: 1.4e9, quantizedMemory: '约 3 GB', hardware: '8 GB RAM', description: 'Pythia 1.4B', deviceModel: 'EleutherAI/pythia-1.4b' },
  { id: '2_8b', label: '2.8B', parameters: 2.8e9, quantizedMemory: '约 6 GB', hardware: '12 GB RAM', description: 'Pythia 2.8B', deviceModel: 'EleutherAI/pythia-2.8b' },
  { id: '6_9b', label: '6.9B', parameters: 6.9e9, quantizedMemory: '约 14 GB', hardware: '24 GB RAM', description: 'Pythia 6.9B', deviceModel: 'EleutherAI/pythia-6.9b' },
  { id: '12b', label: '12B', parameters: 1.2e10, quantizedMemory: '约 24 GB', hardware: '32 GB RAM', description: 'Pythia 12B', deviceModel: 'EleutherAI/pythia-12b' },
  { id: '70b', label: '70B', parameters: 7e10, quantizedMemory: '约 45 GB', hardware: '64 GB RAM / Multi-GPU', description: 'Llama 3.3 70B', deviceModel: 'llama3.3:70b', ollamaModel: 'llama3.3:70b' },
  { id: '104b', label: '104B', parameters: 1.04e11, quantizedMemory: '约 70 GB', hardware: '128 GB RAM / Multi-GPU', description: 'Command R+ 104B', deviceModel: 'CohereLabs/c4ai-command-r-plus' },
  { id: '235b', label: '235B', parameters: 2.35e11, quantizedMemory: '约 150 GB', hardware: 'Multi-GPU server', description: 'Qwen3 235B', deviceModel: 'qwen3:235b', ollamaModel: 'qwen3:235b' },
  { id: '304b', label: '304B', parameters: 3.04e11, quantizedMemory: '约 304 GB（FP8 权重）', hardware: '4×GB300 或同级多 GPU 集群', description: 'DeepSeek-V4-Flash-0731 官方权重', deviceModel: 'deepseek-ai/DeepSeek-V4-Flash-0731' },
  { id: '405b', label: '405B', parameters: 4.05e11, quantizedMemory: '约 260 GB', hardware: '8×80 GB GPU server', description: 'Llama 3.1 405B', deviceModel: 'llama3.1:405b', ollamaModel: 'llama3.1:405b' },
  { id: '671b', label: '671B', parameters: 6.71e11, quantizedMemory: '约 430 GB', hardware: 'Multi-node server', description: 'DeepSeek-R1 671B', deviceModel: 'deepseek-r1:671b', ollamaModel: 'deepseek-r1:671b' },
  { id: '1t', label: '1T', parameters: 1e12, quantizedMemory: '约 640 GB', hardware: 'Inference cluster', description: 'Kimi K2.6', deviceModel: 'moonshotai/Kimi-K2.6' },
  { id: '2_8t', label: '2.8T', parameters: 2.8e12, quantizedMemory: '约 1.8 TB', hardware: 'Large data-center cluster', description: 'Kimi K3', deviceModel: 'moonshotai/Kimi-K3' },
  // Extra checkpoints keep the scale useful between the existing anchor sizes.
  { id: '3m', label: '3M', parameters: 3e6, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 3M', deviceModel: 'roneneldan/TinyStories-3M' },
  { id: '8m', label: '8M', parameters: 8e6, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 8M', deviceModel: 'roneneldan/TinyStories-8M' },
  { id: '28m', label: '28M', parameters: 2.8e7, quantizedMemory: '~ 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 28M', deviceModel: 'roneneldan/TinyStories-28M' },
  { id: '31m', label: '31M', parameters: 3.1e7, quantizedMemory: '~ 0.1 GB', hardware: 'Any modern device', description: 'Pythia 31M', deviceModel: 'EleutherAI/pythia-31m' },
  { id: '33m', label: '33M', parameters: 3.3e7, quantizedMemory: '~ 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 33M', deviceModel: 'roneneldan/TinyStories-33M' },
  { id: '135m', label: '135M', parameters: 1.35e8, quantizedMemory: '~ 0.3 GB', hardware: '4 GB RAM', description: 'SmolLM2 135M', deviceModel: 'HuggingFaceTB/SmolLM2-135M-Instruct', ollamaModel: 'smollm2:135m' },
  { id: '360m', label: '360M', parameters: 3.6e8, quantizedMemory: '~ 0.7 GB', hardware: '4 GB RAM', description: 'SmolLM2 360M', deviceModel: 'HuggingFaceTB/SmolLM2-360M-Instruct', ollamaModel: 'smollm2:360m' },
  { id: '0_5b', label: '0.5B', parameters: 5e8, quantizedMemory: '~ 1 GB', hardware: '4 GB RAM', description: 'Qwen2.5 0.5B', deviceModel: 'Qwen/Qwen2.5-0.5B-Instruct', ollamaModel: 'qwen2.5:0.5b' },
  { id: '0_6b', label: '0.6B', parameters: 6e8, quantizedMemory: '~ 1.2 GB', hardware: '4 GB RAM', description: 'Qwen3 0.6B', deviceModel: 'Qwen/Qwen3-0.6B', ollamaModel: 'qwen3:0.6b' },
  { id: '1_7b', label: '1.7B', parameters: 1.7e9, quantizedMemory: '~ 3.5 GB', hardware: '8 GB RAM', description: 'SmolLM2 1.7B', deviceModel: 'HuggingFaceTB/SmolLM2-1.7B-Instruct', ollamaModel: 'smollm2:1.7b' },
  { id: '3b', label: '3B', parameters: 3e9, quantizedMemory: '~ 6 GB', hardware: '12 GB RAM', description: 'Qwen2.5 3B', deviceModel: 'Qwen/Qwen2.5-3B-Instruct', ollamaModel: 'qwen2.5:3b' },
  { id: '3_8b', label: '3.8B', parameters: 3.8e9, quantizedMemory: '~ 7 GB', hardware: '12 GB RAM', description: 'Phi-3.5 Mini 3.8B', deviceModel: 'microsoft/Phi-3.5-mini-instruct', ollamaModel: 'phi3.5' },
  { id: '4b', label: '4B', parameters: 4e9, quantizedMemory: '~ 8 GB', hardware: '16 GB RAM', description: 'Qwen3 4B', deviceModel: 'Qwen/Qwen3-4B', ollamaModel: 'qwen3:4b' },
  { id: '7b', label: '7B', parameters: 7e9, quantizedMemory: '~ 14 GB', hardware: '24 GB RAM', description: 'Mistral 7B', deviceModel: 'mistralai/Mistral-7B-Instruct-v0.3', ollamaModel: 'mistral:7b' },
  { id: '8b', label: '8B', parameters: 8e9, quantizedMemory: '~ 16 GB', hardware: '24 GB RAM', description: 'Llama 3.1 8B', deviceModel: 'meta-llama/Llama-3.1-8B-Instruct', ollamaModel: 'llama3.1:8b' },
  { id: '9b', label: '9B', parameters: 9e9, quantizedMemory: '~ 18 GB', hardware: '24 GB RAM', description: 'Gemma 2 9B', deviceModel: 'google/gemma-2-9b-it', ollamaModel: 'gemma2:9b' },
  { id: '14b', label: '14B', parameters: 1.4e10, quantizedMemory: '~ 28 GB', hardware: '32 GB RAM', description: 'Qwen2.5 14B', deviceModel: 'Qwen/Qwen2.5-14B-Instruct', ollamaModel: 'qwen2.5:14b' },
  { id: '22b', label: '22B', parameters: 2.2e10, quantizedMemory: '~ 14 GB', hardware: '48 GB RAM', description: 'Mistral Small 22B', deviceModel: 'mistralai/Mistral-Small-24B-Instruct-2501', ollamaModel: 'mistral-small:22b' },
  { id: '27b', label: '27B', parameters: 2.7e10, quantizedMemory: '~ 18 GB', hardware: '48 GB RAM', description: 'Gemma 3 27B', deviceModel: 'google/gemma-3-27b-it', ollamaModel: 'gemma3:27b' },
  { id: '32b', label: '32B', parameters: 3.2e10, quantizedMemory: '~ 22 GB', hardware: '64 GB RAM', description: 'Qwen2.5 32B', deviceModel: 'Qwen/Qwen2.5-32B-Instruct', ollamaModel: 'qwen2.5:32b' },
  { id: '35b', label: '35B', parameters: 3.5e10, quantizedMemory: '~ 24 GB', hardware: '64 GB RAM', description: 'Command R 35B', deviceModel: 'CohereForAI/c4ai-command-r-v01', ollamaModel: 'command-r:35b' },
  { id: '47b', label: '47B', parameters: 4.7e10, quantizedMemory: '~ 32 GB', hardware: '64 GB RAM / Multi-GPU', description: 'Mixtral 8x7B', deviceModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', ollamaModel: 'mixtral:8x7b' },
].map(addDownloadInstruction).sort((a, b) => a.parameters - b.parameters);

export function findModelTier(model: string): LocalModelTier | undefined {
  return LOCAL_MODEL_TIERS.find((tier) => tier.deviceModel === model || tier.ollamaModel === model || tier.browserModel === model);
}

export function recommendedTier(memoryGb: number | undefined, mode: LocalRunMode): LocalModelTier {
  if (mode === 'browser') return LOCAL_MODEL_TIERS.find((tier) => tier.id === '1b')!;
  if ((memoryGb ?? 8) >= 64) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '14b')!;
  if ((memoryGb ?? 8) >= 32) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '8b')!;
  if ((memoryGb ?? 8) >= 16) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '4b')!;
  return LOCAL_MODEL_TIERS.find((tier) => tier.id === '1_7b')!;
}
