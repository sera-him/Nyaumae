import type { NctbDimension, NctbDimensionId, NctbDifficulty } from './types.ts';
import { defaultBankForMode, questionsInBank } from './questionBank.ts';

export const NCTB_BANK_VERSION = 4;

export const NCTB_DIMENSIONS: readonly NctbDimension[] = [
  { id: 'pattern', index: '01', title: '模式识别', english: 'PATTERN', description: '发现重复、变化和结构之间的关系。', skill: '视觉与抽象', accent: '#8deee0', targetQuestionCount: 8 },
  { id: 'memory', index: '02', title: '工作记忆', english: 'MEMORY', description: '在有限时间内保持、更新和重排信息。', skill: '保持与更新', accent: '#bfa8ff', targetQuestionCount: 8 },
  { id: 'space', index: '03', title: '空间推理', english: 'SPACE', description: '在脑中旋转、映射和比较空间结构。', skill: '空间构型', accent: '#91c7ff', targetQuestionCount: 8 },
  { id: 'quantity', index: '04', title: '数量关系', english: 'QUANTITY', description: '理解数量、比例、序列和运算关系。', skill: '数量模型', accent: '#ffd17a', targetQuestionCount: 8 },
  { id: 'language', index: '05', title: '语言推理', english: 'LANGUAGE', description: '从文本中提取条件、含义和逻辑关系。', skill: '语义结构', accent: '#ff9fc8', targetQuestionCount: 8 },
  { id: 'attention', index: '06', title: '注意控制', english: 'ATTENTION', description: '在干扰中保持目标，并及时切换规则。', skill: '抑制与切换', accent: '#74efe0', targetQuestionCount: 8 },
  { id: 'speed', index: '07', title: '速度与准确', english: 'SPEED', description: '在清晰的时间记录下平衡速度和错误率。', skill: '时限表现', accent: '#ffbf7c', targetQuestionCount: 8 },
  { id: 'causality', index: '08', title: '因果推演', english: 'CAUSALITY', description: '根据条件预测结果，并识别反事实分支。', skill: '因果模型', accent: '#e8a4ff', targetQuestionCount: 8 },
  { id: 'planning', index: '09', title: '策略规划', english: 'PLANNING', description: '拆解目标、管理资源并选择下一步。', skill: '多步策略', accent: '#a6d8ff', targetQuestionCount: 8 },
  { id: 'transfer', index: '10', title: '综合迁移', english: 'TRANSFER', description: '把已经形成的策略迁移到新问题。', skill: '跨域迁移', accent: '#d8b5ff', targetQuestionCount: 8 },
];

export const NCTB_DIMENSION_IDS = NCTB_DIMENSIONS.map((dimension) => dimension.id);

export const DEFAULT_ADAPTIVE_DIFFICULTY: Record<NctbDimensionId, NctbDifficulty> = {
  pattern: 3,
  memory: 3,
  space: 3,
  quantity: 3,
  language: 3,
  attention: 3,
  speed: 3,
  causality: 3,
  planning: 3,
  transfer: 3,
};

export function getNctbDimension(id: NctbDimensionId): NctbDimension {
  return NCTB_DIMENSIONS.find((dimension) => dimension.id === id) ?? NCTB_DIMENSIONS[0];
}

export function questionsRequiredForDimension(
  id: NctbDimensionId,
  _focusDimension: NctbDimensionId | 'all',
  mode: 'formal' = 'formal',
): number {
  const bankId = defaultBankForMode(mode);
  const availableExamItems = questionsInBank(bankId).filter((question) => question.dimensionId === id).length;
  return Math.min(getNctbDimension(id).targetQuestionCount, availableExamItems);
}
