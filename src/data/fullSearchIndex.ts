import { characters, zeroChar } from './characters';
import { ATTRIBUTE_DEFINITIONS } from '@/game/cityBuilder/model';
import { extraCharacters } from './extraCharacters';
import { stories } from './stories';
import { storyText } from './storyText';
import { gameHintTexts } from './gameHintTexts';
import { dictionary, bilingualText } from './dictionary';
import { poems, extraPoems, miiaStoryFragments, absurdNarrative, tinyWish, primeFocus, fosStory, gaoKaiStory, chapterIndex, wishSection, correctOverdose, xishouStory, revolutionTable, vppRules, iqTests, gaoKaiTableData, jingBeiGouFragment, penPoemFragment, starChildStory, dualAxisModel, sanYiCollegeInfo, theoremFragments, sanCengNationInfo, wageFragment, shengYuQiYueInfo, superIntelligenceRule, gaoKaoVolunteerRule, subwayPricingRule, unifiedRecruitmentRule, agiEmploymentRegulation } from './extraStories';
import { organizations, zhihuaClasses } from './organizations';
import { timelineEvents } from './timeline';
import { characterRelations, relationLabels } from './relationships';
import { chessPieces, chessSpecialRules } from './chess';
import { NCTB_DIMENSIONS } from '@/nctb/catalog';
import { PEMS_DIMENSIONS } from '@/lib/pemsLModel';
import { FORMAL_A_V1_QUESTIONS } from '@/nctb/banks/formal-a.v1';
import { FORMAL_FOUNDATION_V1_QUESTIONS } from '@/nctb/banks/formal-foundation.v1';
import { DIMENSION_SPECS } from '@/nctb/specs/index';
import {
  skillTicTacToeOverview,
  probabilityAlgorithm,
  spSystemRules,
  professions,
  activeSkills,
  lightningRodSystem,
} from './skillTicTacToe';
import {
  worldviewNotes,
  hypothesis,
  qetWritten,
  qetPractical,
  miyaCircle,
  muGuangPlan,
  xinyuanLog,
  autismFeatures,
  moralPrinciplesNote,
  lawValuesNote,
  moralPrinciples,
  nyaumaeismPrinciples,
  fourDimensionTest,
} from './worldSettings';
import {
  miaWorldBackground,
  paradigmText,
  taskLens2025,
  rtoText,
  yearDayFragment,
  numberFragments,
  dreamPoem,
  badRabbitVersions,
  huaPoem,
  mimiAndMiiaPoem,
  diminutiveText,
  rainyDay,
  p2rDefinition,
  chessPieceTiers,
  chessDiamondWarning,
  mathFormulas,
  caregiverStress,
  fuShuYuStory,
  foreverThreeWorld,
  f3wCodeLine,
  sheepsFull,
} from './fragments';
import { miiaTexts, miiaWish, miiaAgiLand, miiaAgiPoem, lilaAnalysis, mappingBlock } from './miiaTexts';
import { worldviewStats, regionFsiiiStats, fsiiiRankings, heightWeightModel, worldviewInfo, modelNames } from './worldview';
import { LAND_ALLOCATION_META, LAND_ALLOCATION_SEARCH_TEXT } from './landAllocationPolicy';
import { NEURAL_SYSTEMS } from './neuralConnectionPlan';

export interface FullSearchItem {
  id: string;
  title: string;
  content: string;
  category: string;
  href: string;
  /** Raw textual units used by frequency analysis before search text flattening. */
  frequencySegments?: string[];
}

const items: FullSearchItem[] = [];

function cleanText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).replace(/\s+/g, ' ').trim();
  }
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(' · ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(cleanText).filter(Boolean).join(' · ');
  }
  return '';
}

const FREQUENCY_METADATA_KEYS = new Set([
  'id', 'key', 'slug', 'group', 'type', 'from', 'to',
  'color', 'accentcolor', 'backgroundcolor',
  'image', 'images', 'icon', 'src', 'href', 'url', 'path', 'route', 'poster', 'videoposter',
]);

function isTechnicalFrequencySegment(segment: string): boolean {
  return /^(?:from|via|to)-[a-z\d-]+(?:\s+(?:from|via|to)-[a-z\d-]+)*$/iu.test(segment)
    || /^#[\da-f]{3,8}$/iu.test(segment)
    || /^(?:https?:\/\/|\/)[^\s]+$/iu.test(segment)
    || /^[^\s]+\.(?:avif|gif|jpe?g|mp4|png|svg|webm|webp)(?:[?#].*)?$/iu.test(segment);
}

function collectFrequencySegments(value: unknown, key?: string): string[] {
  if (value == null || (key && FREQUENCY_METADATA_KEYS.has(key.toLocaleLowerCase('en-US')))) return [];
  if (typeof value === 'string') {
    return value
      .split(/\r?\n\s*/u)
      .map((segment) => segment.replace(/\s+/gu, ' ').trim())
      .filter((segment) => Boolean(segment) && !isTechnicalFrequencySegment(segment));
  }
  if (Array.isArray(value)) return value.flatMap((entry) => collectFrequencySegments(entry));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([entryKey, entryValue]) => collectFrequencySegments(entryValue, entryKey));
  }
  return [];
}

function add(id: string, title: unknown, content: unknown, category: string, href: string): void {
  const safeTitle = cleanText(title);
  const safeContent = cleanText(content);
  if (!safeTitle && !safeContent) return;
  items.push({
    id,
    title: safeTitle || safeContent.slice(0, 80),
    content: safeContent || safeTitle,
    category,
    href,
    frequencySegments: collectFrequencySegments(content),
  });
}

for (const character of [...characters, zeroChar]) {
  add(`char_${character.id}`, character.name, character, '角色', '#characters');
}

for (const character of extraCharacters) {
  const hiddenText = character.hidden ? ` ${character.hidden}` : '';
  add(`extra_char_${character.id}`, character.name, `${character.bio}${hiddenText}`, character.category === 'AI' ? '技能' : '角色', '#extra-characters');
}

for (const story of stories) {
  const chapterText = story.chapters.map((chapter, index) => `第 ${index + 1} 章 ${chapter.title} ${chapter.content}`).join(' ');
  add(`story_${story.id}`, story.title, `${story.subtitle ?? ''} ${chapterText}`, '故事', '#stories');
}
if (storyText) {
  add('story_1-txt', '大人国的小女孩正文', storyText, '故事', '#stories');
}
for (const hint of gameHintTexts) {
  add(`game-hint_${hint.game}`, hint.name, hint.texts.join(' '), '游戏', hint.href);
}

for (const entry of dictionary) {
  add(`dict_${entry.word}`, `Dadi Sapichi: ${entry.word}`, `${entry.word}: ${entry.meaning} ${(entry.tags ?? []).join(' ')}`, '词典', '#dictionary');
}

for (const entry of [...poems, ...extraPoems, ...miiaStoryFragments]) {
  add(`poem_${entry.title}`, entry.title, entry, '故事', '#extra-stories');
}

for (const [id, entry] of [
  ['absurd-narrative', absurdNarrative],
  ['tiny-wish', tinyWish],
  ['prime-focus', primeFocus],
  ['fos-story', fosStory],
  ['gao-kai-story', gaoKaiStory],
] as const) {
  add(`story_${id}`, typeof entry === 'object' && entry !== null && 'title' in entry ? entry.title : id, entry, '故事', '#extra-stories');
}
add('extra-chapter-index', '章节索引', chapterIndex, '故事', '#extra-stories');
add('extra-wish-section', '愿望区块', wishSection, '故事', '#extra-stories');
add('extra-correct-overdose', '矫枉过正', correctOverdose, '故事', '#extra-stories');
add('extra-xishou-story', '夕兽故事', xishouStory, '故事', '#extra-stories');
for (const [index, entry] of revolutionTable.entries()) add(`revolution_${index}`, '革命表', entry, '设定', '#world-settings');
add('extra-vpp-rules', 'VPP 规则', vppRules, '设定', '#world-settings');
for (const [index, entry] of iqTests.entries()) add(`iq-test_${index}`, '智商测试', entry, '设定', '#world-settings');
add('extra-gaokai-table', '高考表', gaoKaiTableData, '设定', '#extra-stories');
add('extra-jingbeigou', '京贝狗', jingBeiGouFragment, '故事', '#extra-stories');
add('extra-pen-poem', '把笔放下', penPoemFragment, '故事', '#extra-stories');
add('extra-star-child', '星尘之子', starChildStory, '故事', '#stories');
add('extra-dual-axis', '双轴模型', dualAxisModel, '设定', '#miia-world');
add('extra-sanyi-college', '三一学院', sanYiCollegeInfo, '设定', '#organizations');
add('extra-theorem', '定理', theoremFragments, '设定', '#miia-math-notes');
add('extra-sanceng-nation', '三层国家', sanCengNationInfo, '设定', '/world/pacific-islands');
add('extra-wage', '工资零花钱', wageFragment, '故事', '#extra-stories');
add('extra-shengyu-qiyue', '生育契约法', shengYuQiYueInfo, '设定', '#prime-focus');
add('extra-super-intelligence', '超级智能校规', superIntelligenceRule, '设定', '#organizations');
add('extra-gaokao-volunteer', '高考志愿', gaoKaoVolunteerRule, '设定', '/math/fsiii');
add('extra-subway-pricing', '地铁定价', subwayPricingRule, '设定', '/playground/games/city-builder');
add('extra-unified-recruitment', '统一招聘', unifiedRecruitmentRule, '设定', '#organizations');
add('extra-agi-employment', 'AGI就业调节', agiEmploymentRegulation, '设定', '#prime-focus');

for (const [index, entry] of organizations.entries()) add(`org_${index}`, entry.name, entry, '设定', '#organizations');
for (const [index, entry] of zhihuaClasses.entries()) add(`class_${index}`, entry.name, entry, '设定', '#organizations');
for (const [index, event] of timelineEvents.entries()) add(`timeline_${index}`, event.title, event, '设定', '#timeline');
for (const relation of characterRelations) add(`relation_${relation.from}_${relation.to}`, relationLabels[relation.type], relation, '设定', '#character-network');

for (const piece of chessPieces) add(`chess_${piece.letter}`, `${piece.letter} ${piece.name}`, piece, '棋子', '#chess');
for (const [index, rule] of chessSpecialRules.entries()) add(`chess-rule_${index}`, rule, rule, '棋子', '#chess');
for (const [index, tier] of chessPieceTiers.entries()) add(`chess-tier_${index}`, typeof tier === 'object' && tier !== null && 'name' in tier ? tier.name : `棋子阶级 ${index + 1}`, tier, '棋子', '#chess');
add('chess-diamond-warning', '钻石警告', chessDiamondWarning, '棋子', '#chess');

add('skill-overview', skillTicTacToeOverview.title, skillTicTacToeOverview, '技能', '#skill-ttt');
add('skill-probability', '概率生成算法', probabilityAlgorithm, '技能', '#skill-ttt');
add('skill-sp-system', spSystemRules.title, spSystemRules, '技能', '#skill-ttt');
for (const profession of professions) add(`profession_${profession.name}`, profession.name, profession, '技能', '#skill-ttt');
for (const skill of activeSkills) add(`skill_${skill.name}`, skill.name, skill, '技能', '#skill-ttt');
for (const [index, rule] of lightningRodSystem.entries()) add(`lightning_${index}`, `闪电杆规则 ${index + 1}`, rule, '技能', '#skill-ttt');

const settingSources: Array<[string, string, unknown]> = [
  ['worldview-notes', '世界观说明', worldviewNotes],
  ['hypothesis', '世界观假说', hypothesis],
  ['qet-written', 'QET 笔试', qetWritten],
  ['qet-practical', 'QET 实践', qetPractical],
  ['miya-circle', '米雅朋友圈', miyaCircle],
  ['mu-guang-plan', '沐光计划', muGuangPlan],
  ['xinyuan-log', '心渊日志', xinyuanLog],
  ['autism-features', '感知特征', autismFeatures],
  ['moral-principles-note', '伦理原则说明', moralPrinciplesNote],
  ['law-values-note', '法律价值观', lawValuesNote],
  ['moral-principles', '道德原则', moralPrinciples],
  ['nyaumaeism-principles', 'Nyaumaeism 原则', nyaumaeismPrinciples],
];
for (const [id, title, content] of settingSources) add(`setting_${id}`, title, content, '设定', '#world-settings');

const fragmentSources: Array<[string, string, unknown, string]> = [
  ['mia-background', miaWorldBackground.title, miaWorldBackground, '#miia-world'],
  ['paradigm', 'Paradigm', paradigmText, '#miia-math-notes'],
  ['task-lens', 'TaskLens 2025', taskLens2025, '#miia-math-notes'],
  ['rto', 'RTO', rtoText, '#miia-math-notes'],
  ['year-day', 'Year Day', yearDayFragment, '#timeline'],
  ['number-fragments', '数字碎片', numberFragments, '#miia-math-notes'],
  ['dream-poem', '梦境诗', dreamPoem, '#extra-stories'],
  ['bad-rabbit', '坏兔子版本', badRabbitVersions, '#extra-stories'],
  ['hua-poem', '花诗', huaPoem, '#extra-stories'],
  ['mimi-miia-poem', '米迷与米娅', mimiAndMiiaPoem, '#extra-stories'],
  ['diminutive', 'Diminutive', diminutiveText, '#miia-math-notes'],
  ['rainy-day', '下雨天', rainyDay, '#extra-stories'],
  ['p2r', 'p₂r 定义', p2rDefinition, '#miia-math-notes'],
  ['math-formulas', '数学公式', mathFormulas, '#miia-math-notes'],
  ['caregiver-stress', '照护者压力', caregiverStress, '#world-settings'],
  ['fu-shu-yu', '复数域公主梦', fuShuYuStory, '#extra-stories'],
  ['sheeps-full', '羊了个羊', sheepsFull, '#extra-stories'],
  ['forever-three', '永远的3人世界', foreverThreeWorld, '#extra-stories'],
  ['f3w-code', 'F3W 代码', f3wCodeLine, '#extra-stories'],
];
for (const [id, title, content, href] of fragmentSources) add(`fragment_${id}`, title, content, '设定', href);
add('setting_four-dimension', '四维测试', fourDimensionTest, '设定', '#world-settings');
for (const [index, name] of modelNames.entries()) add(`model-name_${index}`, name, name, '设定', '#math');
for (const system of NEURAL_SYSTEMS) add(`neural-system_${system.id}`, system.title, `${system.title} ${system.description}`, '设定', '#world-settings');
add('dict-bilingual', 'Dadi Sapichi 中文对照', bilingualText, '词典', '#dictionary');
add('hyper-communication', 'HyperCommunication 超沟通', '四种模式 汇报 各项目集群10分钟闪电汇报 碰撞 预设跨学科议题 错位 用非本学科语言汇报 静默 不使用语言仅用书写图像代码交流 核心规则 赵召必须参加 不允许说这是你们科照真的问题 每学期每位学生至少发言3次 不记录不存档 大型HC分组必须计算机随机分配 收敛HC 1月初回顾总结 发散HC 6月底展望开题 寒暑假暂停 QET考前两周暂停', '设定', '#organizations');
add('chess-poison', '中毒查询', '兵 象 骷髅兵 不可吃子 被移除 马 蹩腿 被移除 教 田 蹩腿 己方半场不可过中线 被移除 车 横竖最多2格 横竖最多1格 被移除 后 鸵鸟 8方向最多2格 4方向最多1格 巨鲸 被移除 老鼠 马步只能走一个日字 斜线最多2格 直线最多2格 猫 缅因猫 英语 天线 免疫 失去技能 王 女巫 圣骑士 太空人 星舰 火箭 反女巫 免疫 黄奶酪减少1次中毒 橙奶酪减少4次中毒 蓝奶酪下回合对手可操纵 紫奶酪增加2次中毒 黑奶酪增加8次中毒', '棋子', '#chess');
add('ttt3-rules', '技能三子棋规则', '传统三子棋 概率机制 SP技能 每个格子独立成功概率 中心3角4边6 SP上限30 每回合获得SP 技能消耗SP 职业天赋 突发事件', '技能', '#skill-ttt');
add('fractal-rules', '递归回响规则', '每次点击己方生长点生成三根计分子枝 17轮起保留一根 不足6px剪去 16个有效生长点 回声9 17 25轮补充 地形影响', '游戏', '/playground/games/fractal-echo');
add('neural-rules', '神经回响规则', '每次点击己方生长点生成三根计分子枝 6px时剪去 16个有效生长点 回声9 17 25轮最多2次复刻 分形阶段', '游戏', '/playground/games/neural-echo');
add('cat-machine-guide', '猫咪机指引', '九只猫 三层工位 换位 连锁 天赋 突发事件 模块升级 后备箱同时支援 9只猫同时其余4辆车 故事阶段', '游戏', '/playground/games/cat-machine');
add('nav-groups', '导航分组', 'MIIA 世界 世界观 编年史 组织 词典 未来线 西太平洋诸岛国 角色 故事目录 游戏宇宙 Scratch NCTB 认知实验室 数学实验室 创作对话 AI助手', '页面', '#hero');
add('game-session-rules', '游戏通用规则', '玩法说明 游戏内专用按键 暂停后页面拦截不可操作 继续游戏 规则说明 100节点666突触神经核强化突触脉冲 非对称追逐诱饵真实气味疾跑复盘', '游戏', '/playground/games');

for (const text of miiaTexts) add(`miia_${text.id}`, text.title, text, '故事', '#miia-world');
add('miia-wish', '米娅的愿望', miiaWish, '故事', '#miia-world');
add('miia-agi-land', 'AGI Land', miiaAgiLand, '故事', '#miia-world');
add('miia-agi-poem', 'AGI 诗', miiaAgiPoem, '故事', '#miia-world');
add('miia-lila-analysis', 'Lila 分析', lilaAnalysis, '设定', '#miia-world');
add('miia-mapping', '映射区块', mappingBlock, '设定', '#miia-world');

for (const [index, entry] of worldviewStats.entries()) add(`worldview-stat_${index}`, entry.label, entry, '设定', '#worldview');
add('region-fsiii-stats', '区域 FSIII 统计', regionFsiiiStats, '设定', '#worldview');
for (const entry of fsiiiRankings) add(`fsiii_${entry.rank}`, entry.name, entry, '设定', '#math');
for (const [index, entry] of heightWeightModel.entries()) add(`height-weight_${index}`, `身高 ${entry.height}`, entry, '设定', '#math');
add('worldview-info', '世界观信息', worldviewInfo, '设定', '#worldview');
add('world-land-allocation', LAND_ALLOCATION_META.title, LAND_ALLOCATION_SEARCH_TEXT, '设定', '/world/settings');
add('mia-background-data', 'M/I/As World 背景', miaWorldBackground, '设定', '#miia-world');

const pageRecords: Array<[string, string, string, string]> = [
  ['page-home', '首页', 'Neural Connection Aurora Atlas 神经连接', '#hero'],
  ['page-world', '世界观', '世界档案 QET 时间线 组织机构 世界设定', '#worldview'],
  ['page-characters', '角色档案', '角色 补充角色 关系网络', '#characters'],
  ['page-stories', '故事章节', '故事 阅读器', '#stories'],
  ['page-miia', '米娅空间', '米娅的世界 数学笔记 诗歌碎片', '#miia-world'],
  ['page-math', '数学模型', 'FSIII 数学模型 排名系统', '#math'],
  ['page-playground', '游乐场', '游戏 规则 Scratch', '#problems'],
  ['page-settings', '设置与工具', '词典 Prime Focus', '#dictionary'],
];
for (const [id, title, content, href] of pageRecords) add(id, title, content, '页面', href);

const gameRecords: Array<[string, string, string, string]> = [
  ['game-cat-machine', '猫咪机', '九只猫 三层工位 换位 连锁 天赋 突发事件 模块升级', '/playground/games/cat-machine'],
  ['game-city-builder', '建设城市', `实时城市建设 默认3个AI 十二属性 彩色资源 地图规划 跨城项目 区域事件 竞争合作 排名 ${ATTRIBUTE_DEFINITIONS.map(({ label, role }) => `${label} ${role}`).join(' ')}`, '/playground/games/city-builder'],
  ['game-stellar', '星际战线 Stellar', '实时射击 十武器 Stellar Flow 弱点 切换武器', '/playground/games/stellar'],
  ['game-compound-chess', '复合象棋', '传统象棋 立体空间 相位变换 召唤单位', '/playground/games/compound-chess'],
  ['game-box-battle', '箱子对决', '26个箱子 参赛者 资本家 Deal or No Deal 出价 议价', '/playground/games/box-battle'],
  ['game-super-24', '超级24点', '数字 表达式 目标值 平方根 阶乘 幂运算', '/playground/games/super-24'],
  ['game-skill-tic-tac-toe', '技能井字棋', '概率三子棋 SP 技能 职业 落子概率 行动日志', '/playground/games/skill-tic-tac-toe'],
  ['game-hell-maze-vi', '地狱迷宫·VI', '六边形 蜂窝迷宫 全盲 左前右 布尔反馈', '/playground/games/hell-maze-vi'],
  ['game-cunning-rabbit', '狡兔三窟', '逻辑填格 兔子洞 每行每列每区 猞猁活动区', '/playground/games/cunning-rabbit'],
  ['game-fractal-echo', '递归回响', '分形回响 递归棋盘 同坐标广播 蓝方 橙方 入侵子棋盘', '/playground/games/fractal-echo'],
  ['game-neural-echo', '神经回响', '分支生长 剪枝 双人策略 神经网络', '/playground/games/neural-echo'],
  ['game-neural-clash', '神经交锋', 'Neural Clash 100节点 666突触 神经核 强化突触 脉冲', '/playground/games/neural-clash'],
  ['game-cat-mouse', '猫鼠迷踪', '非对称追逐 诱饵 真实气味 疾跑 复盘', '/playground/games/cat-mouse'],
  ['game-quiz', '题目', '烧脑挑战 填空 选择题 二维码 提交答案', '/playground/games/quiz'],
  ['scratch-dont-touch-cat-2', '别碰另一只猫和边缘2', 'Scratch 小游戏', '/playground/scratch/dont-touch-cat-2'],
  ['scratch-knife-vs-archer', 'Knife V.S Archer', 'Scratch 小游戏', '/playground/scratch/knife-vs-archer'],
  ['scratch-royal-chess', '皇家战棋', 'Scratch 小游戏', '/playground/scratch/royal-chess'],
  ['scratch-number-klotski', '数字华容道', 'Scratch 小游戏', '/playground/scratch/number-klotski'],
  ['scratch-super-brain', '最强大脑', 'Scratch 小游戏', '/playground/scratch/super-brain'],
  ['scratch-red-vs-blue', '红蓝之战(毒圈模式)', 'Scratch 小游戏', '/playground/scratch/red-vs-blue'],
  ['scratch-kitten-world-1', '小猫闯天下1', 'Scratch 小游戏', '/playground/scratch/kitten-world-1'],
  ['scratch-welcome-to-1v1', 'welcome to 1v1', 'Scratch 小游戏', '/playground/scratch/welcome-to-1v1'],
  ['scratch-cat-mouse-38', '猫捉老鼠38', 'Scratch 小游戏', '/playground/scratch/cat-mouse-38'],
  ['scratch-honeycomb-maze', '蜂巢迷宫', 'Scratch 小游戏', '/playground/scratch/honeycomb-maze'],
  ['scratch-reinforcement-simulator', '强化模拟器', 'Scratch 小游戏', '/playground/scratch/reinforcement-simulator'],
];
for (const [id, title, content, href] of gameRecords) add(id, title, content, '游戏', href);

for (const dimension of NCTB_DIMENSIONS) {
  add(`nctb-dim_${dimension.id}`, `${dimension.title} ${dimension.english}`, `${dimension.title} ${dimension.english} ${dimension.description} ${dimension.skill}`, '测评', '/nctb');
}
add('nctb-modes', 'NCTB考试模式', '标准考试 正式考试 全部题目统一作为考试题 整套完成后统一反馈 不显示提示 解释或单题对错', '测评', '/nctb');
add('nctb-strategies', 'NCTB选题策略', '固定难度 自适应难度 题库按目标难度优先排序 并完整记录实际难度', '测评', '/nctb');
add('nctb-hero', '认知实验室介绍', '十个维度 五十道题 一套可中断 可恢复 可解释的本地能力探索闭环', '测评', '/nctb');
add('nctb-safety', 'NCTB数据说明', '标准考试只是本地一致化操作 不是受监管或保密的心理测验 综合探索分是十维描述性分数的平均', '测评', '/nctb');

for (const spec of DIMENSION_SPECS) {
  add(`nctb-spec_${spec.id}`, `${spec.id} 构念 ${spec.construct}`, `${spec.construct} 测量 ${spec.measures.join(' ')} 不测量 ${spec.shouldNotMeasure.join(' ')} 题族 ${spec.itemFamilies.join(' ')} 难度模型 ${spec.difficultyModel.join(' ')}`, '测评', '/nctb');
}
for (const question of [...FORMAL_A_V1_QUESTIONS, ...FORMAL_FOUNDATION_V1_QUESTIONS]) {
  const text = `${question.prompt} ${question.stimulus ?? ''} ${question.options.join(' ')}`;
  add(`nctb-q_${question.id}`, question.prompt, text, '测评', '/nctb');
}

for (const dimension of PEMS_DIMENSIONS) {
  add(`fla-dim_${dimension.code}`, `PEMS-L ${dimension.code} ${dimension.title}`, `${dimension.title} ${dimension.shortLabel} 权重${dimension.weight * 100}% 阈值${dimension.threshold} 斜率${dimension.slope}`, '设定', '/math/fla');
}
add('fla-model', 'PEMS-L FLA v2.1 功能法律年龄模型', '功能法律年龄模型 PEMS-L FLA 从五科加权到人口曲线反查 不推翻生命周期函数 重构年龄映射的最后一步 旧公式默认能力可以无限互相补偿 五个维度彼此独立 现实中的认知能力峰值时间高度异质 执行功能包含共同因素与不同子成分 社会认知甚至会随年龄向不同方向变化', '设定', '/math/fla');
add('fla-dimensions', 'PEMS-L 五维度', '生理发育 执行功能 情绪调节 社会互动 语言符号 P E M S L 不测身高 肌肉或青春期程度 避免让力量更大的年轻人无缘无故获得更高法律年龄 测量的是决策稳定性 而不是情绪多寡 容易哭或情绪强烈不应自动等于不成熟 不以是否符合主流社交方式为标准 关注能否理解具有法律意义的符号系统', '设定', '/math/fla');
add('fla-formula', 'PEMS-L 公式说明', '几何平均 软短板效应 成年线18岁由人口目标校准 成年法律身份不可逆 老年人不会因认知老化出现80到17到15到12并重新取得未成年人身份 当前能力下降应进入特定行为能力评估 而不是让年龄倒流', '设定', '/math/fla');

add('pacific-islands', '西太平洋诸岛国', '太平洋西侧的一组岛国与城邦 从君主制王国到AI托管城市 从渔业共和国到虚拟娱乐群岛 构成一片复杂而鲜活的海洋政治版图 岚汐共和国 青屿联邦 白潮王国 镜海共和国 雨见公国 星浦联邦 澄湾共和国 玄礁共同体 夕岬王国 浮光群岛国 海庭共和国 远汐联邦', '设定', '/world/pacific-islands');
add('pacific-nations', '西太平洋诸岛国详情', '岚汐共和国与中国日本都有密切贸易往来 青屿联邦由七座主要岛屿组成 农业和海洋工程发达 白潮王国保留君主制的航运国家 拥有古老海军传统 镜海共和国以金融教育和精密仪器产业闻名 雨见公国多山多雨的小型岛国 星浦联邦由天然岛屿和人工岛共同组成 澄湾共和国重要渔业冷链和海上补给中心 玄礁共同体依靠港口海洋法务和跨国仲裁生存 夕岬王国火山岛国家 拥有地热能源 浮光群岛国旅游文化产业和虚拟娱乐发达 海庭共和国长期保持中立 远汐联邦位于更外侧的太平洋', '设定', '/world/pacific-islands');
add('pacific-timeline', '西太平洋时间线', '2042年4月2日 雾岬市熄灭所有对外识别灯 切断中央政府进入城市系统的全部权限 城市AGI接管全部治理责任 第一艘悬空舰从东港地下船坞升起 岚汐共和国装甲车队遭精确电磁打击 工程无人机拆除隧道出口前一段轨道 雾岬市议会通过自由市临时宪章 自称雾岬自由市', '设定', '/world/pacific-islands');

export const fullSearchIndex: FullSearchItem[] = items;

const symbolAliases: Record<string, string[]> = {
  lila: ['Lila', 'Lila'],
  'fs3': ['fsiii'],
  fsiq: ['fsiii'],
  asi: ['ASI'],
  agi: ['AGI'],
  qet: ['QET'],
  pf: ['Prime Focus'],
  cf: ['Codeforces'],
  'sera-him': ['nyaumæ'],
};

function expandAliases(words: string[]): string[] {
  const expanded = new Set(words);
  for (const word of words) {
    for (const alias of symbolAliases[word] ?? symbolAliases[word.toLowerCase()] ?? []) expanded.add(alias.toLowerCase());
  }
  return [...expanded];
}

function normalizeUnicode(value: string): string {
  return value.normalize('NFKC').replace(/\u00a0/g, ' ').toLowerCase();
}

/**
 * Keep entity lookup useful when a natural-language question wraps a concise
 * query, for example “咪呀是谁？”. The fallback preserves the original words
 * when removing the question form would leave no searchable text.
 */
export function normalizeSearchQuery(query: string): string {
  const normalized = normalizeUnicode(query).trim();
  const withoutQuestionPunctuation = normalized.replace(/[？?！!。]+$/u, '').trim();
  const withoutQuestionSuffix = withoutQuestionPunctuation
    .replace(/\s*(?:是\s*谁|是\s*什么|什么|怎么样|如何|在哪(?:里)?|有(?:什么)?|多少|几|吗|呢)(?:\s*[呀啊])?\s*$/u, '')
    .trim();
  return withoutQuestionSuffix || withoutQuestionPunctuation;
}

function levenshtein(a: string, b: string): number {
  if (a.length < b.length) [a, b] = [b, a];
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const nextDiagonal = previous[j];
      previous[j] = a[i - 1] === b[j - 1]
        ? diagonal
        : Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + 1);
      diagonal = nextDiagonal;
    }
  }
  return previous[b.length];
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  while (count < 6) {
    const index = haystack.indexOf(needle, from);
    if (index < 0) break;
    count += 1;
    from = index + needle.length;
  }
  return count;
}

function scoreItem(item: FullSearchItem, queryWords: string[], phrase: string): number {
  const title = normalizeUnicode(item.title);
  const content = normalizeUnicode(item.content);
  let score = 0;
  let matchedWords = 0;

  if (phrase && title === phrase) score += 1600;
  else if (phrase && title.includes(phrase)) score += 850;
  if (phrase && content.includes(phrase)) score += 420;

  for (const word of queryWords) {
    if (!word) continue;
    const titleHits = countOccurrences(title, word);
    const contentHits = countOccurrences(content, word);
    if (titleHits || contentHits) matchedWords += 1;
    if (title === word) score += 1000;
    else if (title.startsWith(word)) score += 700;
    else if (title.includes(word)) score += 500;
    if (contentHits) score += 210 + Math.min(contentHits - 1, 4) * 24;
    if (content.startsWith(word)) score += 150;
    if (word.length >= 3) {
      const contentWords = content.split(/[\s·.,，。！？：；/()（）]+/).slice(0, 40);
      if (contentWords.some(candidate => candidate.length >= 3 && levenshtein(candidate, word) <= 2)) score += 100;
    }
    if (title.includes(word) || content.includes(word)) score += 50;
  }
  if (queryWords.length > 1 && matchedWords === queryWords.length) score += 320;
  else if (queryWords.length > 1) score -= (queryWords.length - matchedWords) * 80;
  return score;
}

export function fullTextSearch(query: string): { item: FullSearchItem; score: number }[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const rawWords = normalizedQuery.split(/[\s·.,，。！？：；/()（）-]+/).filter(Boolean);
  if (rawWords.length === 0) return [];
  const queryWords = expandAliases(rawWords);
  return fullSearchIndex
    .map(item => ({ item, score: scoreItem(item, queryWords, normalizedQuery) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length)
    .slice(0, 80);
}
