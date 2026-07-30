export type LocalRunMode = 'device' | 'browser';

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
}

// Parameter labels match the selected model family. These are model identifiers,
// not Ollama registry aliases; custom/local runtimes can load the corresponding model.
export const LOCAL_MODEL_TIERS: LocalModelTier[] = [
  { id: '1m', label: '1M', parameters: 1e6, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 1M', deviceModel: 'roneneldan/TinyStories-1M', ollamaModel: 'roneneldan/TinyStories-1M' },
  { id: '8m', label: '8M', parameters: 8e6, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 8M', deviceModel: 'roneneldan/TinyStories-8M', ollamaModel: 'roneneldan/TinyStories-8M' },
  { id: '33m', label: '33M', parameters: 3.3e7, quantizedMemory: '约 0.1 GB', hardware: 'Any modern device', description: 'TinyStories 33M', deviceModel: 'roneneldan/TinyStories-33M', ollamaModel: 'roneneldan/TinyStories-33M' },
  { id: '14m', label: '14M', parameters: 1.4e7, quantizedMemory: '< 0.1 GB', hardware: 'Any modern device', description: 'Pythia 14M', deviceModel: 'EleutherAI/pythia-14m', ollamaModel: 'EleutherAI/pythia-14m' },
  { id: '35m', label: '35M', parameters: 3.5e7, quantizedMemory: '约 0.1 GB', hardware: 'Any modern device', description: 'Pythia 35M', deviceModel: 'EleutherAI/pythia-35m', ollamaModel: 'EleutherAI/pythia-35m' },
  { id: '70m', label: '70M', parameters: 7e7, quantizedMemory: '约 0.2 GB', hardware: 'Any modern device', description: 'Pythia 70M', deviceModel: 'EleutherAI/pythia-70m', ollamaModel: 'EleutherAI/pythia-70m' },
  { id: '160m', label: '160M', parameters: 1.6e8, quantizedMemory: '约 0.4 GB', hardware: '4 GB RAM', description: 'Pythia 160M', deviceModel: 'EleutherAI/pythia-160m', ollamaModel: 'EleutherAI/pythia-160m' },
  { id: '410m', label: '410M', parameters: 4.1e8, quantizedMemory: '约 0.8 GB', hardware: '4 GB RAM', description: 'Pythia 410M', deviceModel: 'EleutherAI/pythia-410m', ollamaModel: 'EleutherAI/pythia-410m' },
  { id: '100m', label: '100M', parameters: 1e8, quantizedMemory: '约 0.2 GB', hardware: '4 GB RAM', description: 'SmolLM2 135M', deviceModel: 'smollm2:135m', ollamaModel: 'smollm2:135m' },
  { id: '360m', label: '360M', parameters: 3.6e8, quantizedMemory: '约 0.4 GB', hardware: '4 GB RAM', description: 'SmolLM2 360M', deviceModel: 'smollm2:360m', ollamaModel: 'smollm2:360m' },
  { id: '500m', label: '0.5B', parameters: 5e8, quantizedMemory: '约 0.6 GB', hardware: '4 GB RAM / WebGPU', description: 'Qwen2.5 0.5B', deviceModel: 'qwen2.5:0.5b', ollamaModel: 'qwen2.5:0.5b', browserModel: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', browserDownload: '约 400 MB' },
  { id: '1b', label: '1B', parameters: 1e9, quantizedMemory: '约 2 GB', hardware: '8 GB RAM / WebGPU', description: 'Pythia 1B', deviceModel: 'EleutherAI/pythia-1b', ollamaModel: 'EleutherAI/pythia-1b', browserModel: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', browserDownload: '约 800 MB' },
  { id: '1_4b', label: '1.4B', parameters: 1.4e9, quantizedMemory: '约 3 GB', hardware: '8 GB RAM', description: 'Pythia 1.4B', deviceModel: 'EleutherAI/pythia-1.4b', ollamaModel: 'EleutherAI/pythia-1.4b' },
  { id: '2_8b', label: '2.8B', parameters: 2.8e9, quantizedMemory: '约 6 GB', hardware: '12 GB RAM', description: 'Pythia 2.8B', deviceModel: 'EleutherAI/pythia-2.8b', ollamaModel: 'EleutherAI/pythia-2.8b' },
  { id: '1_5b', label: '1.5B', parameters: 1.5e9, quantizedMemory: '约 3 GB', hardware: '8 GB RAM / WebGPU', description: 'Qwen2.5 1.5B', deviceModel: 'qwen2.5:1.5b', ollamaModel: 'qwen2.5:1.5b', browserModel: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', browserDownload: '约 1.2 GB' },
  { id: '3b', label: '3B', parameters: 3e9, quantizedMemory: '约 6 GB', hardware: '12 GB RAM / WebGPU', description: 'Qwen2.5 3B', deviceModel: 'qwen2.5:3b', ollamaModel: 'qwen2.5:3b', browserModel: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', browserDownload: '约 2.2 GB' },
  { id: '6_9b', label: '6.9B', parameters: 6.9e9, quantizedMemory: '约 14 GB', hardware: '24 GB RAM', description: 'Pythia 6.9B', deviceModel: 'EleutherAI/pythia-6.9b', ollamaModel: 'EleutherAI/pythia-6.9b' },
  { id: '12b', label: '12B', parameters: 1.2e10, quantizedMemory: '约 24 GB', hardware: '32 GB RAM', description: 'Pythia 12B', deviceModel: 'EleutherAI/pythia-12b', ollamaModel: 'EleutherAI/pythia-12b' },
  { id: '7b', label: '7B', parameters: 7e9, quantizedMemory: '约 5 GB', hardware: '16 GB RAM / 8 GB VRAM', description: 'Qwen2.5 7B', deviceModel: 'qwen2.5:7b', ollamaModel: 'qwen2.5:7b' },
  { id: '14b', label: '14B', parameters: 1.4e10, quantizedMemory: '约 10 GB', hardware: '24 GB RAM / 12 GB VRAM', description: 'Qwen2.5 14B', deviceModel: 'qwen2.5:14b', ollamaModel: 'qwen2.5:14b' },
  { id: '32b', label: '32B', parameters: 3.2e10, quantizedMemory: '约 22 GB', hardware: '48 GB RAM / 24 GB VRAM', description: 'Qwen2.5 32B', deviceModel: 'qwen2.5:32b', ollamaModel: 'qwen2.5:32b' },
  { id: '70b', label: '70B', parameters: 7e10, quantizedMemory: '约 45 GB', hardware: '64 GB RAM / Multi-GPU', description: 'Llama 3.3 70B', deviceModel: 'llama3.3:70b', ollamaModel: 'llama3.3:70b' },
  { id: '104b', label: '104B', parameters: 1.04e11, quantizedMemory: '约 70 GB', hardware: '128 GB RAM / Multi-GPU', description: 'Command R+ 104B', deviceModel: 'CohereForAI/c4ai-command-r-plus', ollamaModel: 'CohereForAI/c4ai-command-r-plus' },
  { id: '235b', label: '235B', parameters: 2.35e11, quantizedMemory: '约 150 GB', hardware: 'Multi-GPU server', description: 'Qwen3 235B', deviceModel: 'qwen3:235b', ollamaModel: 'qwen3:235b' },
  { id: '405b', label: '405B', parameters: 4.05e11, quantizedMemory: '约 260 GB', hardware: '8×80 GB GPU server', description: 'Llama 3.1 405B', deviceModel: 'llama3.1:405b', ollamaModel: 'llama3.1:405b' },
  { id: '671b', label: '671B', parameters: 6.71e11, quantizedMemory: '约 430 GB', hardware: 'Multi-node server', description: 'DeepSeek-R1 671B', deviceModel: 'deepseek-r1:671b', ollamaModel: 'deepseek-r1:671b' },
  { id: '1t', label: '1T', parameters: 1e12, quantizedMemory: '约 640 GB', hardware: 'Inference cluster', description: 'Kimi K2.6', deviceModel: 'kimi-k2.6', ollamaModel: 'kimi-k2.6' },
  { id: '2_8t', label: '2.8T', parameters: 2.8e12, quantizedMemory: '约 1.8 TB', hardware: 'Large data-center cluster', description: 'Kimi K3', deviceModel: 'kimi-k3', ollamaModel: 'kimi-k3' },
];

export function findModelTier(model: string): LocalModelTier | undefined {
  return LOCAL_MODEL_TIERS.find((tier) => tier.deviceModel === model || tier.ollamaModel === model || tier.browserModel === model);
}

export function recommendedTier(memoryGb: number | undefined, mode: LocalRunMode): LocalModelTier {
  if (mode === 'browser') return LOCAL_MODEL_TIERS.find((tier) => tier.id === '1b')!;
  if ((memoryGb ?? 8) >= 64) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '12b')!;
  if ((memoryGb ?? 8) >= 32) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '6_9b')!;
  if ((memoryGb ?? 8) >= 16) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '2_8b')!;
  return LOCAL_MODEL_TIERS.find((tier) => tier.id === '1_4b')!;
}
