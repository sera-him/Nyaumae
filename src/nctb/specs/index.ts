import type { DimensionSpec, NctbDimensionId } from '../types.ts';

export const DIMENSION_SPECS: readonly DimensionSpec[] = [
  {
    id: 'pattern',
    construct: '从非语言材料中抽取、组合并延伸关系规则。',
    measures: ['关系抽象', '多规则归纳', '周期发现', '递归结构', '类比结构', '规则边界识别'],
    shouldNotMeasure: ['学校数学熟练度', '单一等差或等比数列', '冷知识', '大数心算'],
    itemFamilies: ['matrix-relation', 'recursive-pattern', 'periodic-overlay', 'analogy-transform', 'rule-classification', 'alternating-operator'],
    difficultyModel: ['同时维护的规则数', '规则抽象度', '推理步骤', '相似干扰项', '例外或边界条件'],
  },
  {
    id: 'memory',
    construct: '短时保持信息，并在保持期间更新、绑定、抑制或重排。',
    measures: ['顺向保持', '逆向保持', '重排', '项目-位置绑定', '更新', '干扰抵抗', 'n-back 类匹配', '序列变换'],
    shouldNotMeasure: ['长期知识', '只靠纸笔记录', '所有题都使用数字倒序', '复杂推理'],
    itemFamilies: ['forward-span', 'backward-span', 'ordered-recall', 'binding-memory', 'memory-updating', 'interference-memory', 'n-back-match', 'sequence-transformation'],
    difficultyModel: ['项目数量', '项目相似度', '操作次数', '干扰强度', '保持间隔', '绑定关系数量'],
  },
  {
    id: 'space',
    construct: '在视点或物体变化时保持并转换空间关系。',
    measures: ['心理旋转', '折叠展开', '空间关系', '路径整合', '视点转换', '物体变换', '网格移动'],
    shouldNotMeasure: ['只做东南西北单步旋转', '地理知识', '专业制图术语', '纯语言逻辑'],
    itemFamilies: ['mental-rotation', 'paper-folding', 'spatial-relation', 'path-integration', 'viewpoint-transform', 'object-transform', 'grid-movement'],
    difficultyModel: ['旋转轴数量', '变换步骤', '遮挡或折叠层数', '视点切换', '空间干扰项相似度'],
  },
  {
    id: 'quantity',
    construct: '理解数量之间的比例、相对关系与操作后变化。',
    measures: ['数量关系', '比例', '估计', '相对量', '算术建模', '数量变换', '资源平衡'],
    shouldNotMeasure: ['高阶学校数学', '只做数列', '大规模精确计算', '公式记忆'],
    itemFamilies: ['ratio-scaling', 'proportional-comparison', 'magnitude-estimation', 'relative-quantity', 'arithmetic-model', 'quantitative-transform', 'resource-balance'],
    difficultyModel: ['关系层数', '表示转换', '无关数字', '估算精度', '逆向推断', '资源约束数量'],
  },
  {
    id: 'language',
    construct: '在受控词汇下理解语义、条件、指代与关系结构。',
    measures: ['言语关系', '语义推断', '逻辑语言理解', '歧义消解', '类比', '条件推理', '指令理解'],
    shouldNotMeasure: ['生僻词汇量', '文化典故', '所有题都是三段论', '阅读速度'],
    itemFamilies: ['verbal-relation', 'semantic-inference', 'ambiguity-resolution', 'verbal-analogy', 'conditional-language', 'instruction-comprehension', 'quantifier-scope'],
    difficultyModel: ['条件嵌套', '否定范围', '指代候选数量', '关系抽象度', '干扰信息', '规则切换'],
  },
  {
    id: 'attention',
    construct: '在竞争刺激中维持目标规则并抑制不相关反应。',
    measures: ['选择性注意', '持续注意', '反应抑制', '目标检测', '干扰抵抗', '规则切换'],
    shouldNotMeasure: ['单纯 Unicode 计数', '复杂推理', '色觉作为前提', '记忆长序列'],
    itemFamilies: ['selective-search', 'sustained-target', 'response-inhibition', 'flanker-interference', 'rule-switching', 'conjunction-detection', 'go-no-go'],
    difficultyModel: ['目标稀有度', '干扰相似度', '规则切换次数', '抑制频率', '刺激密度', '持续时长'],
  },
  {
    id: 'speed',
    construct: '在低推理、清晰规则任务中的快速且准确处理。',
    measures: ['符号匹配', '同异判断', '视觉比较', '快速分类', '编码核对'],
    shouldNotMeasure: ['多步推理', '复杂计算', '知识回忆', '不合理极短时限'],
    itemFamilies: ['symbol-matching', 'rapid-same-different', 'visual-comparison', 'rapid-classification', 'visual-code-match', 'feature-scan'],
    difficultyModel: ['项目数量', '视觉相似度', '目标频率', '规则一致性', '允许时间'],
  },
  {
    id: 'causality',
    construct: '区分关联与因果，并用干预、反事实和证据结构判断因果主张。',
    measures: ['混杂识别', '干预推理', '必要与充分', '反事实', '因果图直觉', '证据强度'],
    shouldNotMeasure: ['只背“控制变量”口号', '领域冷知识', '统计公式', '道德判断'],
    itemFamilies: ['confound-detection', 'intervention-reasoning', 'necessary-sufficient', 'counterfactual', 'causal-graph', 'evidence-strength', 'alternative-explanation'],
    difficultyModel: ['变量数量', '路径数量', '反事实层数', '证据冲突', '必要充分转换', '混杂隐蔽度'],
  },
  {
    id: 'planning',
    construct: '在依赖、资源和竞争约束下构造并修正多步行动方案。',
    measures: ['依赖规划', '约束满足', '资源规划', '多步排序', '目标分解', '重规划'],
    shouldNotMeasure: ['只有拓扑排序', '领域专业知识', '无限搜索', '纯算术优化'],
    itemFamilies: ['dependency-planning', 'constraint-planning', 'resource-planning', 'multi-step-sequencing', 'goal-decomposition', 'replanning', 'schedule-repair'],
    difficultyModel: ['竞争约束数量', '资源类型', '计划深度', '死路相似度', '环境变化', '子目标交互'],
  },
  {
    id: 'transfer',
    construct: '识别表面不同任务的共同深层结构，并迁移适用策略及其边界。',
    measures: ['结构类比', '策略迁移', '规则迁移', '关系映射', '近迁移', '远迁移', '适用边界'],
    shouldNotMeasure: ['主要做乘法规则', '复制旧答案', '只匹配相同词语', '领域知识'],
    itemFamilies: ['structural-analogy', 'strategy-transfer', 'rule-transfer', 'relational-mapping', 'near-transfer', 'far-transfer', 'boundary-aware-transfer'],
    difficultyModel: ['表面差异', '共同关系层数', '策略改写程度', '边界条件', '干扰类比相似度'],
  },
];

const SPEC_BY_ID = new Map(DIMENSION_SPECS.map((spec) => [spec.id, spec]));

export function getDimensionSpec(id: NctbDimensionId): DimensionSpec {
  const spec = SPEC_BY_ID.get(id);
  if (!spec) throw new Error(`Unknown NCTB dimension: ${id}`);
  return spec;
}
