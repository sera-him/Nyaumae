export type NeuralSystemTier = 'S' | 'A' | 'B';

export interface NeuralSystem {
  id: string;
  index: string;
  title: string;
  english: string;
  tier: NeuralSystemTier;
  description: string;
  route: string;
  accent: string;
  icon: 'brain' | 'globe' | 'users' | 'book' | 'flask' | 'sigma' | 'game' | 'sparkles';
}

/**
 * The live product directory. This intentionally describes only real system
 * entry points; aspirational capability/status data does not belong here.
 */
export const NEURAL_SYSTEMS: NeuralSystem[] = [
  {
    id: 'stories', index: '01', title: '故事目录', english: 'STORY DIRECTORY', tier: 'S',
    description: '五个故事世界、卷章阅读、阅读进度与正史资料都从这里展开。', route: '/stories', accent: '#ff9fc8', icon: 'book',
  },
  {
    id: 'characters', index: '02', title: '角色网络', english: 'CHARACTER NETWORK', tier: 'S',
    description: '档案、关系、家族、派系和人物时间线彼此相连。', route: '/characters', accent: '#c2a0ff', icon: 'users',
  },
  {
    id: 'universe', index: '03', title: '世界观', english: 'WORLD LORE', tier: 'S',
    description: '编年史、地图、组织、规则与未来线的共同坐标系。', route: '/world', accent: '#91c7ff', icon: 'globe',
  },
  {
    id: 'games', index: '04', title: '游戏宇宙', english: 'GAME UNIVERSE', tier: 'S',
    description: 'AURORA ATLAS、递归回响、Cat Machine 与 Scratch。', route: '/playground', accent: '#8caeff', icon: 'game',
  },
  {
    id: 'cognition', index: '05', title: '认知实验室', english: 'COGNITION LAB', tier: 'A',
    description: 'NCTB 标准考试、十维能力图谱与历史报告。', route: '/nctb', accent: '#ffd17a', icon: 'flask',
  },
  {
    id: 'research', index: '06', title: '数学实验室', english: 'RESEARCH LAB', tier: 'A',
    description: 'PEMS-L、FLA、身高体重模型与可交互数学研究。', route: '/math', accent: '#75e8d5', icon: 'sigma',
  },
  {
    id: 'creative', index: '07', title: '创作与对话', english: 'CREATIVE STUDIO', tier: 'B',
    description: '星海对话、甜梦小屋、极光星语与角色对话。', route: '/chat', accent: '#e8a4ff', icon: 'sparkles',
  },
  {
    id: 'neural', index: '08', title: '站内 AI 助手', english: 'AI ASSISTANT', tier: 'B',
    description: '按需提供站内检索、引用、对话、记忆与正史边界。', route: '/chat', accent: '#74efe0', icon: 'brain',
  },
];
