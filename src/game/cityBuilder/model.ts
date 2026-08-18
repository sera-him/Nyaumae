export const ATTRIBUTE_IDS = [
  'technology',
  'welfare',
  'ecology',
  'infrastructure',
  'tourism',
  'economy',
  'industry',
  'culture',
  'healthcare',
  'security',
  'food',
  'population',
] as const;

export type AttributeId = (typeof ATTRIBUTE_IDS)[number];
export type AttributeValues = Record<AttributeId, number>;
export type AttributeCosts = Partial<AttributeValues>;
export type Era = 1 | 2 | 3;
export type BuildingTier = 1 | 2 | 3;
export type AiStyle = 'balanced' | 'specialist' | 'cooperator' | 'resilient';

export interface AttributeDefinition {
  id: AttributeId;
  label: string;
  icon: string;
  color: string;
  textColor: string;
  role: string;
  mechanic: string;
  dependencies: readonly [AttributeId, AttributeId];
}

export const ATTRIBUTE_DEFINITIONS: readonly AttributeDefinition[] = [
  {
    id: 'technology', label: '科技', icon: '🔵', color: '#3b82f6', textColor: '#eff6ff',
    role: '解锁高级建筑与地标', mechanic: '科技达到 2.5 / 4 时，分别解锁二级建筑 / 三级地标。',
    dependencies: ['industry', 'culture'],
  },
  {
    id: 'welfare', label: '民生', icon: '🩵', color: '#67e8f9', textColor: '#083344',
    role: '追赶与危机减损', mechanic: '排名落后时提高彩色资源增长，并减少事件失败造成的损失。',
    dependencies: ['economy', 'healthcare'],
  },
  {
    id: 'ecology', label: '生态', icon: '🟢', color: '#22c55e', textColor: '#052e16',
    role: '抵消工业与人口压力', mechanic: '生态不足会拖慢全城彩色资源生产；生态越高，压力惩罚越小。',
    dependencies: ['technology', 'food'],
  },
  {
    id: 'infrastructure', label: '基建', icon: '🔴', color: '#ef4444', textColor: '#fff1f2',
    role: '扩充施工槽并加快建设', mechanic: '基建达到 6 / 10 时各增加一个施工槽，并持续缩短施工时间。',
    dependencies: ['industry', 'population'],
  },
  {
    id: 'tourism', label: '景区', icon: '🩷', color: '#f472b6', textColor: '#500724',
    role: '放大区域合作回报', mechanic: '景区越强，跨城项目完成时获得的彩色奖励越多。',
    dependencies: ['ecology', 'culture'],
  },
  {
    id: 'economy', label: '经济', icon: '🟡', color: '#facc15', textColor: '#422006',
    role: '提高彩色交换效率', mechanic: '允许把富余颜色调度为紧缺颜色；经济越高，每次交换成本越低。',
    dependencies: ['tourism', 'security'],
  },
  {
    id: 'industry', label: '工业', icon: '🩶', color: '#94a3b8', textColor: '#0f172a',
    role: '提高全城生产率', mechanic: '工业按比例放大十二种彩色资源的被动产出，但需要生态维持平衡。',
    dependencies: ['infrastructure', 'technology'],
  },
  {
    id: 'culture', label: '文化', icon: '🟣', color: '#a855f7', textColor: '#faf5ff',
    role: '强化相邻建筑网络', mechanic: '兼容颜色相邻时同时成长；文化越高，邻接奖励越强。',
    dependencies: ['population', 'welfare'],
  },
  {
    id: 'healthcare', label: '医疗', icon: '⚪', color: '#f8fafc', textColor: '#0f172a',
    role: '应对健康与人口事件', mechanic: '为医疗、民生、人口和美食类事件提供持续防御。',
    dependencies: ['technology', 'food'],
  },
  {
    id: 'security', label: '治安', icon: '⚫', color: '#1f2937', textColor: '#f8fafc',
    role: '保护彩色储备', mechanic: '为科技、经济、景区和治安事件提供防御，并减少事件失败损失。',
    dependencies: ['welfare', 'infrastructure'],
  },
  {
    id: 'food', label: '美食', icon: '🟠', color: '#f97316', textColor: '#431407',
    role: '维持人口与专注产出', mechanic: '美食跟不上人口时全城生产会下降；充足时提高当前专注颜色产出。',
    dependencies: ['ecology', 'economy'],
  },
  {
    id: 'population', label: '人口', icon: '🤎', color: '#a16207', textColor: '#fffbeb',
    role: '扩大储备上限与劳动规模', mechanic: '提高十二种彩色资源的容量，并小幅放大当前专注颜色产出。',
    dependencies: ['welfare', 'healthcare'],
  },
] as const;

export const ATTRIBUTE_BY_ID = Object.fromEntries(
  ATTRIBUTE_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<AttributeId, AttributeDefinition>;

export function createAttributeValues(initial = 0): AttributeValues {
  return Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, initial])) as AttributeValues;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  color: AttributeId;
  tier: BuildingTier;
  gain: number;
  description: string;
}

const BUILDING_SEEDS: Record<AttributeId, readonly [
  readonly [string, string],
  readonly [string, string],
  readonly [string, string],
]> = {
  technology: [
    ['创客工坊', '低门槛研发空间，为更高阶建设建立科技底座。'],
    ['城市研究院', '把工业能力与公共知识转化为持续创新。'],
    ['城市智能中枢', '统筹全城数据与自动化，是科技地标。'],
  ],
  welfare: [
    ['社区服务站', '吸收发展压力，让落后城市更快恢复。'],
    ['全民服务中心', '扩大公共服务覆盖，降低危机损耗。'],
    ['全龄共享社区', '把教育、照护与公共空间连成民生地标。'],
  ],
  ecology: [
    ['雨水花园', '用小型绿色设施抵消人口与工业压力。'],
    ['零碳湿地', '净化城市代谢，稳定十二色生产。'],
    ['城市森林环', '以连续生态带包围高密度城区。'],
  ],
  infrastructure: [
    ['公交枢纽', '扩充施工能力并连接相邻功能区。'],
    ['城市主干网', '让大型建筑和跨城项目更快落地。'],
    ['零换乘交通环', '把所有城区接入同一张高效网络。'],
  ],
  tourism: [
    ['城市观景台', '把文化、美食与城市空间转化为吸引力。'],
    ['四季游线', '延长游客停留并放大合作收益。'],
    ['天际会客地标', '面向整个城市群的景区地标。'],
  ],
  economy: [
    ['街区市集', '开放彩色资源交换，缓解短缺。'],
    ['区域交易港', '降低交换损耗，支撑复杂供应链。'],
    ['公共财富中心', '把多元发展转化为高效率调度。'],
  ],
  industry: [
    ['智造工坊', '提高所有彩色资源的被动生产。'],
    ['协同制造园', '用基础设施与技术形成规模生产。'],
    ['柔性制造母港', '能随城市需求切换产能的工业地标。'],
  ],
  culture: [
    ['公共剧场', '让相邻的不同颜色互相增益。'],
    ['城市记忆馆', '放大规划网络中的邻接协同。'],
    ['城市记忆宫', '把多种生活方式凝聚为文化地标。'],
  ],
  healthcare: [
    ['社区诊所', '为健康、人口与民生事件提供防御。'],
    ['综合医学中心', '以科技和民生支撑区域救治。'],
    ['精准医学城', '覆盖全城的医疗地标与应急底座。'],
  ],
  security: [
    ['夜间巡防站', '保护储备并处理经济与客流风险。'],
    ['韧性指挥中心', '把基础设施、人口与安全联动。'],
    ['全天候韧性中枢', '在重大事件中守住城市彩色储备。'],
  ],
  food: [
    ['社区厨房', '让生态与工业产出真正服务居民。'],
    ['城市食品网络', '稳定人口扩张并提高专注产出。'],
    ['全域食物花园', '把生产、餐桌与景区连成美食地标。'],
  ],
  population: [
    ['混合住区', '增加彩色储备上限与城市劳动规模。'],
    ['宜居新城', '以美食和民生承接持续迁入。'],
    ['复合宜居城区', '容纳高密度、多功能生活的城市地标。'],
  ],
};

const TIER_GAINS: Record<BuildingTier, number> = { 1: 1, 2: 2, 3: 3 };

export const BUILDINGS: readonly BuildingDefinition[] = ATTRIBUTE_IDS.flatMap((color) =>
  BUILDING_SEEDS[color].map(([name, description], index) => {
    const tier = (index + 1) as BuildingTier;
    return {
      id: `${color}-${tier}`,
      name,
      color,
      tier,
      gain: TIER_GAINS[tier],
      description,
    };
  }),
);

export const BUILDING_BY_ID = Object.fromEntries(
  BUILDINGS.map((building) => [building.id, building]),
) as Record<string, BuildingDefinition>;

export interface ProjectDefinition {
  id: string;
  name: string;
  color: AttributeId;
  description: string;
  requirements: AttributeCosts;
}

const PROJECT_NAMES: Record<AttributeId, readonly [string, string]> = {
  technology: ['联合算力云', '各城共同建设开放研发与算力网络。'],
  welfare: ['跨城民生热线', '让公共服务在城市边界之外也能接续。'],
  ecology: ['流域共同治理', '上游与下游城市必须共同修复生态。'],
  infrastructure: ['城际交通环线', '连接所有城市的高速公共交通。'],
  tourism: ['城市群四季节', '以多城文化与美食形成连续游线。'],
  economy: ['区域彩色交易所', '降低城市群内部的资源错配。'],
  industry: ['协同制造链', '让技术、基建与工厂跨城协作。'],
  culture: ['公共文化季', '让不同城市共同创作与共享舞台。'],
  healthcare: ['联合急救网络', '跨城调度床位、技术与照护能力。'],
  security: ['区域韧性指挥网', '共同应对安全、交通与信息风险。'],
  food: ['区域食物网络', '把生态产地、制造与餐桌连起来。'],
  population: ['人才共居计划', '让人口流动获得住房与服务支撑。'],
};

export const PROJECTS: readonly ProjectDefinition[] = ATTRIBUTE_IDS.map((color) => {
  const definition = ATTRIBUTE_BY_ID[color];
  const [name, description] = PROJECT_NAMES[color];
  return {
    id: `project-${color}`,
    name,
    color,
    description,
    requirements: {
      [color]: 6,
      [definition.dependencies[0]]: 3,
      [definition.dependencies[1]]: 3,
    },
  };
});

export interface EventDefinition {
  id: string;
  name: string;
  color: AttributeId;
  description: string;
  responses: readonly [AttributeId, AttributeId, AttributeId];
  healthcareWeight: number;
  securityWeight: number;
}

export const EVENTS: readonly EventDefinition[] = [
  { id: 'event-technology', name: '城市系统故障', color: 'technology', description: '关键数字系统出现连锁故障。', responses: ['technology', 'security', 'industry'], healthcareWeight: 0, securityWeight: 0.35 },
  { id: 'event-welfare', name: '公共服务挤兑', color: 'welfare', description: '服务需求在短时间内集中爆发。', responses: ['welfare', 'economy', 'healthcare'], healthcareWeight: 0.25, securityWeight: 0 },
  { id: 'event-ecology', name: '热岛警报', color: 'ecology', description: '持续高温考验绿色空间与公共服务。', responses: ['ecology', 'infrastructure', 'welfare'], healthcareWeight: 0.2, securityWeight: 0 },
  { id: 'event-infrastructure', name: '暴雨内涝', color: 'infrastructure', description: '暴雨让交通和排水同时承压。', responses: ['infrastructure', 'ecology', 'security'], healthcareWeight: 0, securityWeight: 0.2 },
  { id: 'event-tourism', name: '客流失序', color: 'tourism', description: '突发客流冲击景区与公共空间。', responses: ['tourism', 'security', 'food'], healthcareWeight: 0, securityWeight: 0.3 },
  { id: 'event-economy', name: '市场震荡', color: 'economy', description: '区域需求骤变，供应链开始波动。', responses: ['economy', 'welfare', 'industry'], healthcareWeight: 0, securityWeight: 0.2 },
  { id: 'event-industry', name: '产线事故', color: 'industry', description: '制造系统停摆并产生次生风险。', responses: ['industry', 'healthcare', 'security'], healthcareWeight: 0.3, securityWeight: 0.25 },
  { id: 'event-culture', name: '公共记忆断层', color: 'culture', description: '城市更新让共同记忆快速消失。', responses: ['culture', 'population', 'welfare'], healthcareWeight: 0, securityWeight: 0 },
  { id: 'event-healthcare', name: '流感高峰', color: 'healthcare', description: '季节性流感迅速占用医疗容量。', responses: ['healthcare', 'technology', 'welfare'], healthcareWeight: 0.45, securityWeight: 0 },
  { id: 'event-security', name: '通信诈骗潮', color: 'security', description: '信息网络中的欺诈活动突然增加。', responses: ['security', 'technology', 'welfare'], healthcareWeight: 0, securityWeight: 0.45 },
  { id: 'event-food', name: '供应短缺', color: 'food', description: '运输受阻让餐桌供应变得紧张。', responses: ['food', 'ecology', 'economy'], healthcareWeight: 0.15, securityWeight: 0 },
  { id: 'event-population', name: '集中迁入潮', color: 'population', description: '大量居民同时迁入，城市容量受考验。', responses: ['population', 'welfare', 'healthcare'], healthcareWeight: 0.3, securityWeight: 0 },
] as const;

export interface BuildingInstance {
  instanceId: string;
  buildingId: string;
  color: AttributeId;
  startedAt: number;
  completeAt: number;
  status: 'building' | 'complete';
}

export interface CityState {
  id: string;
  name: string;
  isHuman: boolean;
  aiStyle: AiStyle | null;
  core: AttributeId;
  focus: AttributeId;
  attributes: AttributeValues;
  reserves: AttributeValues;
  tiles: Array<BuildingInstance | null>;
  nextExchangeAt: number;
  nextProjectContributionAt: number;
  nextAiAt: number;
}

export interface ProjectState {
  definitionId: string;
  startedAt: number;
  endsAt: number;
  contributions: Record<string, AttributeValues>;
}

export interface EventState {
  definitionId: string;
  startedAt: number;
  warningEndsAt: number;
  endsAt: number;
  responses: Record<string, AttributeValues>;
}

export interface GameLogEntry {
  id: number;
  at: number;
  color: AttributeId;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

export interface GameMetrics {
  buildsByColor: AttributeValues;
  exchanges: number;
  projectContributions: number;
  completedProjects: number;
  resolvedProjects: number;
  eventResponses: number;
  resolvedEvents: number;
  successfulEventDefenses: number;
  failedEventDefenses: number;
}

export interface CityBuilderGameState {
  status: 'running' | 'finished';
  seed: number;
  rngState: number;
  durationSeconds: number;
  elapsed: number;
  era: Era;
  humanCityId: string;
  cities: CityState[];
  activeProject: ProjectState | null;
  nextProjectAt: number;
  activeEvent: EventState | null;
  nextEventAt: number;
  regionalFailures: AttributeValues;
  logs: GameLogEntry[];
  nextLogId: number;
  metrics: GameMetrics;
  winnerIds: string[];
}

export interface GameConfig {
  playerCore: AttributeId;
  aiCount?: number;
  durationSeconds?: number;
  seed?: number;
}

export interface CityScore {
  cityId: string;
  total: number;
  place: number;
  attributeScores: AttributeValues;
  rankBonuses: AttributeValues;
}

export const ERA_LABELS: Record<Era, string> = {
  1: '奠基期',
  2: '联动期',
  3: '都会期',
};

export const BASELINE_DURATION_SECONDS = 18 * 60;
export const CITY_MAP_SIZE = 5;
export const CITY_HALL_INDEX = 12;
