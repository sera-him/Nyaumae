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

export const LOCAL_MODEL_TIERS: LocalModelTier[] = [
  { id: '1m', label: '1M', parameters: 1e6, quantizedMemory: '< 0.1 GB', hardware: '任意现代设备', description: '实验、分类和极简单任务', deviceModel: 'custom-1m' },
  { id: '10m', label: '10M', parameters: 1e7, quantizedMemory: '< 0.1 GB', hardware: '任意现代设备', description: '超轻量实验模型', deviceModel: 'custom-10m' },
  { id: '50m', label: '50M', parameters: 5e7, quantizedMemory: '约 0.1 GB', hardware: '任意现代设备', description: '专用小模型与教学', deviceModel: 'custom-50m' },
  { id: '100m', label: '100M', parameters: 1e8, quantizedMemory: '约 0.2 GB', hardware: '4 GB 内存', description: '基础文本任务', deviceModel: 'smollm2:135m', ollamaModel: 'smollm2:135m' },
  { id: '360m', label: '360M', parameters: 3.6e8, quantizedMemory: '约 0.4 GB', hardware: '4 GB 内存', description: '轻量聊天与简单问答', deviceModel: 'smollm2:360m', ollamaModel: 'smollm2:360m' },
  { id: '500m', label: '0.5B', parameters: 5e8, quantizedMemory: '约 0.6 GB', hardware: '4 GB 内存 / WebGPU', description: '浏览器极速体验', deviceModel: 'qwen2.5:0.5b', ollamaModel: 'qwen2.5:0.5b', browserModel: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', browserDownload: '约 400 MB' },
  { id: '1b', label: '1B', parameters: 1e9, quantizedMemory: '约 1 GB', hardware: '8 GB 内存 / WebGPU', description: '轻量日常对话', deviceModel: 'llama3.2:1b', ollamaModel: 'llama3.2:1b', browserModel: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', browserDownload: '约 800 MB' },
  { id: '1_5b', label: '1.5B', parameters: 1.5e9, quantizedMemory: '约 1.3 GB', hardware: '8 GB 内存 / WebGPU', description: '中文轻量对话', deviceModel: 'qwen2.5:1.5b', ollamaModel: 'qwen2.5:1.5b', browserModel: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', browserDownload: '约 1.2 GB' },
  { id: '3b', label: '3B', parameters: 3e9, quantizedMemory: '约 2.4 GB', hardware: '12 GB 内存 / 较强 WebGPU', description: '质量与速度平衡', deviceModel: 'qwen2.5:3b', ollamaModel: 'qwen2.5:3b', browserModel: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', browserDownload: '约 2.2 GB' },
  { id: '7b', label: '7B', parameters: 7e9, quantizedMemory: '约 5 GB', hardware: '16 GB 内存 / 8 GB 显存', description: '个人电脑主力模型', deviceModel: 'qwen2.5:7b', ollamaModel: 'qwen2.5:7b' },
  { id: '14b', label: '14B', parameters: 1.4e10, quantizedMemory: '约 10 GB', hardware: '24 GB 内存 / 12 GB 显存', description: '更强的推理和写作', deviceModel: 'qwen2.5:14b', ollamaModel: 'qwen2.5:14b' },
  { id: '32b', label: '32B', parameters: 3.2e10, quantizedMemory: '约 22 GB', hardware: '48 GB 内存 / 24 GB 显存', description: '高质量本地工作站', deviceModel: 'qwen2.5:32b', ollamaModel: 'qwen2.5:32b' },
  { id: '70b', label: '70B', parameters: 7e10, quantizedMemory: '约 45 GB', hardware: '64–96 GB 内存 / 多 GPU', description: '专业工作站级模型', deviceModel: 'llama3.3:70b', ollamaModel: 'llama3.3:70b' },
  { id: '110b', label: '110B', parameters: 1.1e11, quantizedMemory: '约 70 GB', hardware: '128 GB 内存 / 多 GPU', description: '大型工作站或服务器', deviceModel: 'custom-110b' },
  { id: '235b', label: '235B', parameters: 2.35e11, quantizedMemory: '约 150 GB', hardware: '多卡服务器', description: '大型 MoE / 专业推理', deviceModel: 'qwen3:235b', ollamaModel: 'qwen3:235b' },
  { id: '405b', label: '405B', parameters: 4.05e11, quantizedMemory: '约 260 GB', hardware: '8×80 GB GPU 级服务器', description: '数据中心级模型', deviceModel: 'llama3.1:405b', ollamaModel: 'llama3.1:405b' },
  { id: '671b', label: '671B', parameters: 6.71e11, quantizedMemory: '约 430 GB', hardware: '多机多卡服务器', description: '超大型 MoE 模型', deviceModel: 'deepseek-r1:671b', ollamaModel: 'deepseek-r1:671b' },
  { id: '1t', label: '1T', parameters: 1e12, quantizedMemory: '约 640 GB', hardware: '专业推理集群', description: '万亿参数分布式推理', deviceModel: 'custom-1t' },
  { id: '2_8t', label: '2.8T', parameters: 2.8e12, quantizedMemory: '约 1.8 TB', hardware: '大型数据中心集群', description: '当前范围上限，仅适合分布式部署', deviceModel: 'custom-2.8t' },
];

export function findModelTier(model: string): LocalModelTier | undefined {
  return LOCAL_MODEL_TIERS.find((tier) => tier.deviceModel === model || tier.ollamaModel === model || tier.browserModel === model);
}

export function recommendedTier(memoryGb: number | undefined, mode: LocalRunMode): LocalModelTier {
  if (mode === 'browser') {
    if ((memoryGb ?? 4) >= 16) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '3b')!;
    if ((memoryGb ?? 4) >= 8) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '1b')!;
    return LOCAL_MODEL_TIERS.find((tier) => tier.id === '500m')!;
  }
  if ((memoryGb ?? 8) >= 64) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '32b')!;
  if ((memoryGb ?? 8) >= 32) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '14b')!;
  if ((memoryGb ?? 8) >= 16) return LOCAL_MODEL_TIERS.find((tier) => tier.id === '7b')!;
  return LOCAL_MODEL_TIERS.find((tier) => tier.id === '3b')!;
}
