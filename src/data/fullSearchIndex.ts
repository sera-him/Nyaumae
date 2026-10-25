import { characters, zeroChar } from './characters';
import { ATTRIBUTE_DEFINITIONS } from '@/game/cityBuilder/model';
import { extraCharacters } from './extraCharacters';
import { rawCharacterVideos } from './characterImages';
import { stories } from './stories';
import { storyText } from './storyText';
import { storyTextEn } from './storyText.en';
import { gameHintTexts } from './gameHintTexts';
import { dictionary, bilingualText } from './dictionary';
import { poems, extraPoems, miiaStoryFragments, absurdNarrative, tinyWish, primeFocus, fosStory, gaoKaiStory, chapterIndex, wishSection, correctOverdose, xishouStory, revolutionTable, vppRules, iqTests, gaoKaiTableData, jingBeiGouFragment, penPoemFragment, starChildStory, dualAxisModel, sanYiCollegeInfo, theoremFragments, sanCengNationInfo, wageFragment, shengYuQiYueInfo, superIntelligenceRule, gaoKaoVolunteerRule, subwayPricingRule, unifiedRecruitmentRule, agiEmploymentRegulation, openExamRegistrationRule, laborValueTheory, sumoAngleNote, emotionVectorNote, unnecessaryDoorStory } from './extraStories';
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
  catTrueNameTable,
  citizenLevelSystem,
  teacherVotingRule,
  workplaceBlindnessRule,
  specialChildrenNotes,
  miiaSchoolRules,
  elderSystemNote,
  aiEnergyNote,
  combatSkillCosts,
  sentencingRule,
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
import { charactersEn, zeroCharEn } from './characters.en';
import { extraCharactersEn } from './extraCharacters.en';
import { storiesEn } from './stories.en';
import { dictionaryEn, bilingualTextEn } from './dictionary.en';
import { organizationsEn, zhihuaClassesEn } from './organizations.en';
import { timelineEventsEn } from './timeline.en';
import { relationLabelsEn } from './relationships.en';
import {
  worldviewNotesEn, hypothesisEn, qetWrittenEn, qetPracticalEn, miyaCircleEn, muGuangPlanEn,
  xinyuanLogEn, autismFeaturesEn, moralPrinciplesNoteEn, lawValuesNoteEn,
  moralPrinciplesEn, nyaumaeismPrinciplesEn, fourDimensionTestEn,
  catTrueNameTableEn, citizenLevelSystemEn, teacherVotingRuleEn, workplaceBlindnessRuleEn, specialChildrenNotesEn,
  miiaSchoolRulesEn,
  elderSystemNoteEn, aiEnergyNoteEn, combatSkillCostsEn, sentencingRuleEn,
} from './worldSettings.en';
import {
  miaWorldBackgroundEn, paradigmTextEn, taskLens2025En, rtoTextEn, yearDayFragmentEn,
  numberFragmentsEn, foreverThreeWorldEn, f3wCodeLineEn, dreamPoemEn, badRabbitVersionsEn,
  huaPoemEn, diminutiveTextEn, rainyDayEn, p2rDefinitionEn,
  chessPieceTiersEn, chessDiamondWarningEn, mathFormulasEn, caregiverStressEn,
  fuShuYuStoryEn, sheepsFullEn,
} from './fragments.en';
import { nyaumae8SearchText } from './nyaumae8';
import { nyaumae8SearchTextEn } from './nyaumae8.en';
import {
  miiaTextsEn, miiaWishEn, miiaAgiLandEn, miiaAgiPoemEn, lilaAnalysisEn, mappingBlockEn,
} from './miiaTexts.en';
import { chessPiecesEn, chessSpecialRulesEn } from './chess.en';
import {
  skillTicTacToeOverviewEn, probabilityAlgorithmEn, spSystemRulesEn,
  professionsEn, activeSkillsEn, lightningRodSystemEn,
} from './skillTicTacToe.en';
import { gameHintTextsEn } from './gameHintTexts.en';
import { worldviewStatsEn, regionFsiiiStatsEn, fsiiiRankingsEn, heightWeightModelEn, worldviewInfoEn, modelNamesEn } from './worldview.en';
import { LAND_ALLOCATION_META_EN, LAND_ALLOCATION_SEARCH_TEXT_EN } from './landAllocationPolicy.en';
import { NEURAL_SYSTEMS_EN } from './neuralConnectionPlan.en';
import {
  poemsEn, extraPoemsEn, miiaStoryFragmentsEn, absurdNarrativeEn, tinyWishEn, primeFocusEn,
  fosStoryEn, gaoKaiStoryEn, chapterIndexEn, wishSectionEn, correctOverdoseEn, xishouStoryEn,
  revolutionTableEn, vppRulesEn, iqTestsEn, gaoKaiTableDataEn, jingBeiGouFragmentEn,
  penPoemFragmentEn, starChildStoryEn, dualAxisModelEn, sanYiCollegeInfoEn, theoremFragmentsEn,
  sanCengNationInfoEn, wageFragmentEn, shengYuQiYueInfoEn, superIntelligenceRuleEn,
  gaoKaoVolunteerRuleEn, subwayPricingRuleEn, unifiedRecruitmentRuleEn, agiEmploymentRegulationEn,
  openExamRegistrationRuleEn, laborValueTheoryEn,
  sumoAngleNoteEn, emotionVectorNoteEn, unnecessaryDoorStoryEn,
} from './extraStories.en';
import { NCTB_DIMENSIONS_EN } from '@/nctb/catalog.en';
import { DIMENSION_SPECS_EN } from '@/nctb/specs/index.en';
import { FORMAL_A_V1_QUESTIONS_EN } from '@/nctb/banks/formal-a.v1.en';
import { FORMAL_FOUNDATION_V1_QUESTIONS_EN } from '@/nctb/banks/formal-foundation.v1.en';
import { PEMS_DIMENSIONS_EN } from '@/lib/pemsLModel.en';
import type { Locale } from '@/lib/i18n';
import {
  nationsZh, chinaPolicyZh, travelInfoZh, timelineZh, cityStatsZh,
  pacificIntroZh, yuanchuiTitleZh, yuanchuiDescZh, lowerTierDescZh,
  customsDescZh, yuanchuiNoteZh, chengwanChinaTitleZh, cityHeadingZh,
} from './pacificIslands.zh';
import {
  nationsEn, chinaPolicyEn, travelInfoEn, timelineEn,
  pacificIntroEn, yuanchuiTitleEn, yuanchuiDescEn, lowerTierDescEn,
  customsDescEn, yuanchuiNoteEn, chengwanChinaTitleEn, cityHeadingEn, cityStatsEn,
} from './pacificIslands.en';
import { modes, rules, largeHc, calendar } from './hyperCommunication.zh';
import { modesEn, rulesEn, largeHcEn, calendarEn } from './hyperCommunication.en';
import { frequencyCorpusZh, frequencyCorpusEn } from './generated/frequencyCorpus';

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

// English search corpus (built below) shares the same id/href scheme.

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

// 角色影像素材的 caption 文案（如咪娅视频）也纳入词频。
for (const [id, videos] of Object.entries(rawCharacterVideos)) {
  for (const v of videos) {
    if (v.caption) add(`char-video_${id}_${v.src}`, `${id} 影像素材`, v.caption, '角色', '#characters');
  }
}

for (const story of stories) {
  const chapterText = story.chapters.map((chapter, index) => `第 ${index + 1} 章 ${chapter.title} ${chapter.content}`).join(' ');
  add(`story_${story.id}`, story.title, `${story.subtitle ?? ''} ${chapterText}`, '故事', '#stories');
}
if (storyText) {
  add('storytext_little-girl-in-giant-country', '大人国的小女孩正文', storyText, '故事', '/stories/little-girl-in-giant-country');
}
// 游戏搜索元数据。texts 已迁至语料通道（见 data/gameHintTexts.ts 头注释）：
// 有源码游戏的 texts 为空数组，这里只剩标题元数据 + 跳转路由；
// giant-catch 无源码，其 texts 是唯一副本，仍在此登记。
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
  add(`extra_${id}`, typeof entry === 'object' && entry !== null && 'title' in entry ? entry.title : id, entry, '故事', '#extra-stories');
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
add('extra-open-exam-registration', '强制开放报名', openExamRegistrationRule, '设定', '#organizations');
add('extra-labor-value', '人工越贵生活越好', laborValueTheory, '故事', '#extra-stories');
add('extra-sumo-angle', '相扑选手与周角', sumoAngleNote, '故事', '#extra-stories');
add('extra-emotion-vector', '情感计算与反讽', emotionVectorNote, '故事', '#extra-stories');
add('extra-unnecessary-door', '白开一次门', unnecessaryDoorStory, '故事', '#extra-stories');

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
  ['cat-true-names', '猫猫真身对照表', catTrueNameTable],
  ['citizen-level-system', '等级公民制度', citizenLevelSystem],
  ['teacher-voting', '教师投票', teacherVotingRule],
  ['workplace-blindness', '职场特征盲化', workplaceBlindnessRule],
  ['special-children', '特殊儿童与三年级课程', specialChildrenNotes],
  ['miia-school', '咪呀的学校', miiaSchoolRules],
  ['elder-system', '长寿基因与长老制', elderSystemNote],
  ['ai-energy', 'AI 能耗量级', aiEnergyNote],
  ['combat-skill-costs', '技能算力数值表', combatSkillCosts],
  ['sentencing', '量刑规则', sentencingRule],
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
  ['diminutive', 'Diminutive', diminutiveText, '#miia-math-notes'],
  ['rainy-day', '下雨天', rainyDay, '#extra-stories'],
  ['p2r', 'p₂r 定义', p2rDefinition, '#miia-math-notes'],
  ['nyaumae8', 'Nyaumae-8 编码表', nyaumae8SearchText, '#miia-math-notes'],
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
// 超沟通：数据已从 section 抽到 hyperCommunication.zh/.en 模块（2026-10-12），
// 原手写浓缩条目已删——与渲染数据重复计数，英文还停了在旧措辞。icon 是 JSX
// 元素，登记前剥掉，否则 cleanText 会把 className 当正文收进去。
add('hyper-communication', 'HyperCommunication 超沟通', [modes.map((m) => ({ name: m.name, desc: m.desc })), rules, largeHc, calendar], '设定', '#organizations');
add('chess-poison', '中毒查询', '兵 象 骷髅兵 不可吃子 被移除 马 蹩腿 被移除 教 田 蹩腿 己方半场不可过中线 被移除 车 横竖最多2格 横竖最多1格 被移除 后 鸵鸟 8方向最多2格 4方向最多1格 巨鲸 被移除 老鼠 马步只能走一个日字 斜线最多2格 直线最多2格 猫 缅因猫 英语 天线 免疫 失去技能 王 女巫 圣骑士 太空人 星舰 火箭 反女巫 免疫 黄奶酪减少1次中毒 橙奶酪减少4次中毒 蓝奶酪下回合对手可操纵 紫奶酪增加2次中毒 黑奶酪增加8次中毒', '棋子', '#chess');
// ttt3-rules 手写浓缩条目已删（2026-10-12）：skillTicTacToe.ts 的技能/职业/
// SP 数据已在上面完整登记，事件文案由 game/ttt3/engine.ts 进语料通道。
add('fractal-rules', '递归回响规则', '3×3同坐标广播 每步在所有已存在的子盘同一坐标落子 8 16 32 64步 行动方按Thue-Morse序列分配 蓝橙严格对半 单人同时执两方 开局AI地形 敌对双方且不计分 根盘9票占住5票即控制 三级判定 根盘票数 受控子盘总数', '游戏', '/playground/games/fractal-echo');
add('neural-rules', '神经回响规则', '每次点击己方生长点生成三根计分子枝 6px时剪去 16个有效生长点 回声9 17 25轮最多2次复刻 分形阶段', '游戏', '/playground/games/neural-echo');
add('cat-machine-guide', '猫咪机指引', '九只猫 三层工位 换位 连锁 天赋 突发事件 模块升级 后备箱同时支援 9只猫同时其余4辆车 故事阶段', '游戏', '/playground/games/cat-machine');
add('nav-groups', '导航分组', 'MIIA 世界 世界观 编年史 组织 词典 未来线 西太平洋诸岛国 角色 故事目录 游戏宇宙 Scratch NCTB 认知实验室 数学实验室 创作对话 AI助手', '页面', '#hero');
add('game-session-rules', '游戏通用规则', '玩法说明 游戏内专用按键 暂停后页面拦截不可操作 继续游戏 规则说明 100节点666突触神经核强化突触脉冲 非对称追逐诱饵真实气味疾跑复盘', '游戏', '/playground/games');

for (const text of miiaTexts) add(`miia_${text.id}`, text.title, text, '故事', '#miia-world');
add('miia-wish', '咪呀的愿望', miiaWish, '故事', '#miia-world');
add('miia-agi-land', 'AGI Land', miiaAgiLand, '故事', '#miia-world');
add('miia-agi-poem', 'AGI 诗', miiaAgiPoem, '故事', '#miia-world');
add('miia-lila-analysis', 'Lila 分析', lilaAnalysis, '设定', '#miia-world');
add('miia-mapping', '映射区块', mappingBlock, '设定', '#miia-world');

for (const [index, entry] of worldviewStats.entries()) add(`worldview-stat_${index}`, entry.label, entry, '设定', '#worldview');
add('region-fsiii-stats', '区域 FSIII 统计', regionFsiiiStats, '设定', '#worldview');
// 并列名次会产生相同的 rank，追加索引保证 id 唯一（随机发现等处用 id 作 React key）
for (const [index, entry] of fsiiiRankings.entries()) add(`fsiii_${entry.rank}_${index}`, entry.name, entry, '设定', '#math');
for (const [index, entry] of heightWeightModel.entries()) add(`height-weight_${index}`, `身高 ${entry.height}`, entry, '设定', '#math');
add('worldview-info', '世界观信息', worldviewInfo, '设定', '#worldview');
add('world-land-allocation', LAND_ALLOCATION_META.title, LAND_ALLOCATION_SEARCH_TEXT, '设定', '/world/settings');
add('mia-background-data', 'M/I/As World 背景', miaWorldBackground, '设定', '#miia-world');

const pageRecords: Array<[string, string, string, string]> = [
  ['page-home', '首页', 'Neural Connection Aurora Atlas 神经连接', '#hero'],
  ['page-world', '世界观', '世界档案 QET 时间线 组织机构 世界设定', '#worldview'],
  ['page-characters', '角色档案', '角色 补充角色 关系网络', '#characters'],
  ['page-stories', '故事章节', '故事 阅读器', '#stories'],
  ['page-miia', '咪呀空间', '咪呀的世界 数学笔记 诗歌碎片', '#miia-world'],
  ['page-math', '数学模型', 'FSIII 数学模型 排名系统', '#math'],
  ['page-playground', '游乐场', '游戏 规则 Scratch', '#problems'],
  ['page-settings', '设置与工具', '词典 Prime Focus', '#dictionary'],
  ['page-other', '其他入口', '其他工具 全站搜索 认知实验室 数据统计 本机观察报告 搜索记录 浏览路径 存档读档 可中断可恢复 本地优先', '/other'],
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
  ['game-cat-mouse', '猫鼠迷踪', '回合制 连续平面 猫与老鼠同速 猫看不见老鼠 只看得见诱饵 半径4 真实气味 有限次 揭穿 疾跑 移动上限2 不可连续 复盘 推断点 推断误差 诱饵偏移 终局判定 距离阈值3 世界不收缩 人机对战 另一方由电脑控制', '/playground/games/cat-mouse'],
  ['game-giant-catch', '大人国抓小人', '停车场 石灰格子 非对称追逐 喵呜 小满的指尖 冲刺 温柔抓捕 双阵营', '/playground/games/giant-catch'],
  ['game-quiz', '题目', '烧脑挑战 填空 选择题 二维码 提交答案', '/playground/games/quiz'],
  ['okcomputer', '自我观察档案 OKComputer', '自我观察 档案 感觉处理 功能域 时间线 模式洞察 就诊摘要 门诊 发育', '/okcomputer'],
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

// 西太平洋诸岛国：数据已从 section 抽到 pacificIslands.zh/.en 模块（2026-10-12），
// 原三组手写浓缩条目已删——与渲染数据重复计数，英文专名还漂成旧罗马音
// （Arashi/Wujiao/Chenwan/Xijiao/Hating，术语表在 src/lib/translations）。
add('pacific-islands', '西太平洋诸岛国', pacificIntroZh, '设定', '/world/pacific-islands');
add('pacific-nations', '西太平洋诸岛国详情', nationsZh, '设定', '/world/pacific-islands');
add('pacific-timeline', '西太平洋时间线', timelineZh, '设定', '/world/pacific-islands');
add('pacific-travel', '澄湾与中国往来', travelInfoZh, '设定', '/world/pacific-islands');
add('pacific-policy', '入境政策', chinaPolicyZh, '设定', '/world/pacific-islands');
add('pacific-yuanchui', '渊垂联邦', [yuanchuiTitleZh, yuanchuiDescZh, lowerTierDescZh, customsDescZh, yuanchuiNoteZh], '设定', '/world/pacific-islands');
add('pacific-chengwan', chengwanChinaTitleZh, [chengwanChinaTitleZh, cityHeadingZh, cityStatsZh], '设定', '/world/pacific-islands');

// ---- English corpus --------------------------------------------------------
// Mirrors the zh index one-to-one (same ids / hrefs / categories, English
// title & content). Only content with an English side is included; the list
// grows as translation batches land (characters + stories first).
const enItems: FullSearchItem[] = [];

function addEn(id: string, title: unknown, content: unknown, category: string, href: string): void {
  const safeTitle = cleanText(title);
  const safeContent = cleanText(content);
  if (!safeTitle && !safeContent) return;
  enItems.push({
    id,
    title: safeTitle || safeContent.slice(0, 80),
    content: safeContent || safeTitle,
    category,
    href,
  });
}

for (const character of [...charactersEn, zeroCharEn]) {
  addEn(`char_${character.id}`, character.name, character, '角色', '#characters');
}

for (const character of extraCharactersEn) {
  const hiddenText = character.hidden ? ` ${character.hidden}` : '';
  addEn(`extra_char_${character.id}`, character.name, `${character.bio}${hiddenText}`, character.category === 'AI' ? '技能' : '角色', '#extra-characters');
}

for (const [id, videos] of Object.entries(rawCharacterVideos)) {
  for (const v of videos) {
    if (v.caption) addEn(`char-video_${id}_${v.src}`, `${id} video media`, v.caption, '角色', '#characters');
  }
}

for (const story of storiesEn) {
  const chapterText = story.chapters.map((chapter, index) => `Chapter ${index + 1} ${chapter.title} ${chapter.content}`).join(' ');
  addEn(`story_${story.id}`, story.title, `${story.subtitle ?? ''} ${chapterText}`, '故事', '#stories');
}

for (const entry of dictionaryEn) {
  addEn(`dict_${entry.word}`, `Dadi Sapichi: ${entry.word}`, `${entry.word}: ${entry.meaning} ${(entry.tags ?? []).join(' ')}`, '词典', '#dictionary');
}

addEn('dict-bilingual', 'Dadi Sapichi bilingual lines', bilingualTextEn, '词典', '#dictionary');

for (const [index, entry] of organizationsEn.entries()) addEn(`org_${index}`, entry.name, entry, '设定', '#organizations');
for (const [index, entry] of zhihuaClassesEn.entries()) addEn(`class_${index}`, entry.name, entry, '设定', '#organizations');
for (const [index, event] of timelineEventsEn.entries()) addEn(`timeline_${index}`, event.title, event, '设定', '#timeline');
for (const relation of characterRelations) addEn(`relation_${relation.from}_${relation.to}`, relationLabelsEn[relation.type], relation, '设定', '#character-network');

const settingSourcesEn: Array<[string, string, unknown]> = [
  ['worldview-notes', 'Worldview notes', worldviewNotesEn],
  ['hypothesis', 'Worldview hypothesis', hypothesisEn],
  ['qet-written', 'QET written exam', qetWrittenEn],
  ['qet-practical', 'QET practical exam', qetPracticalEn],
  ['miya-circle', "Miya's circle", miyaCircleEn],
  ['mu-guang-plan', 'Sunlight Project', muGuangPlanEn],
  ['xinyuan-log', 'Heart Abyss Journal', xinyuanLogEn],
  ['autism-features', 'Sensory features', autismFeaturesEn],
  ['moral-principles-note', 'Ethics principles note', moralPrinciplesNoteEn],
  ['law-values-note', 'Legal values', lawValuesNoteEn],
  ['moral-principles', 'Moral principles', moralPrinciplesEn],
  ['nyaumaeism-principles', 'Nyaumaeism principles', nyaumaeismPrinciplesEn],
  ['cat-true-names', 'Cat True-Name Table', catTrueNameTableEn],
  ['citizen-level-system', 'Citizen Level System', citizenLevelSystemEn],
  ['teacher-voting', 'Teacher Voting', teacherVotingRuleEn],
  ['workplace-blindness', 'Workplace Feature Blindness', workplaceBlindnessRuleEn],
  ['special-children', 'Special Children and the Third-Grade Curriculum', specialChildrenNotesEn],
  ['miia-school', "Miia's school", miiaSchoolRulesEn],
  ['elder-system', 'Longevity genes and the elder system', elderSystemNoteEn],
  ['ai-energy', 'AI energy order of magnitude', aiEnergyNoteEn],
  ['combat-skill-costs', 'Skill and computing-power table', combatSkillCostsEn],
  ['sentencing', 'Sentencing rule', sentencingRuleEn],
];
for (const [id, title, content] of settingSourcesEn) addEn(`setting_${id}`, title, content, '设定', '#world-settings');
addEn('setting_four-dimension', 'Four-Dimension Test', fourDimensionTestEn, '设定', '#world-settings');

const fragmentSourcesEn: Array<[string, string, unknown, string]> = [
  ['mia-background', "M/I/As' World background", miaWorldBackgroundEn, '#miia-world'],
  ['paradigm', 'Paradigm', paradigmTextEn, '#miia-math-notes'],
  ['task-lens', 'TaskLens 2025', taskLens2025En, '#miia-math-notes'],
  ['rto', 'RTO', rtoTextEn, '#miia-math-notes'],
  ['year-day', 'Year Day', yearDayFragmentEn, '#timeline'],
  ['number-fragments', 'Number fragments', numberFragmentsEn, '#miia-math-notes'],
  ['dream-poem', 'Dream poem', dreamPoemEn, '#extra-stories'],
  ['bad-rabbit', 'Bad rabbit versions', badRabbitVersionsEn, '#extra-stories'],
  ['hua-poem', 'Flower poem', huaPoemEn, '#extra-stories'],
  ['diminutive', 'Diminutive', diminutiveTextEn, '#miia-math-notes'],
  ['nyaumae8', 'Nyaumae-8 Encoding Table', nyaumae8SearchTextEn, '#miia-math-notes'],
  ['rainy-day', 'Rainy day', rainyDayEn, '#extra-stories'],
  ['p2r', 'p₂r definition', p2rDefinitionEn, '#miia-math-notes'],
  ['math-formulas', 'Math formulas', mathFormulasEn, '#miia-math-notes'],
  ['caregiver-stress', 'Caregiver stress', caregiverStressEn, '#world-settings'],
  ['fu-shu-yu', 'Princess Dream of the Complex Domain', fuShuYuStoryEn, '#extra-stories'],
  ['sheeps-full', 'Sheep a Sheep', sheepsFullEn, '#extra-stories'],
  ['forever-three', 'The eternal world of three', foreverThreeWorldEn, '#extra-stories'],
  ['f3w-code', 'F3W code', f3wCodeLineEn, '#extra-stories'],
];
for (const [id, title, content, href] of fragmentSourcesEn) addEn(`fragment_${id}`, title, content, '设定', href);

for (const text of miiaTextsEn) addEn(`miia_${text.id}`, text.title, text, '故事', '#miia-world');
addEn('mia-background-data', 'M/I/As World background', miaWorldBackgroundEn, '设定', '#miia-world');
addEn('miia-wish', "Miia's wish", miiaWishEn, '故事', '#miia-world');
addEn('miia-agi-land', 'AGI Land', miiaAgiLandEn, '故事', '#miia-world');
addEn('miia-agi-poem', 'AGI poem', miiaAgiPoemEn, '故事', '#miia-world');
addEn('miia-lila-analysis', 'Līlā analysis', lilaAnalysisEn, '设定', '#miia-world');
addEn('miia-mapping', 'Mapping Block', mappingBlockEn, '设定', '#miia-world');

for (const [index, tier] of chessPieceTiersEn.entries()) addEn(`chess-tier_${index}`, typeof tier === 'object' && tier !== null && 'name' in tier ? tier.name : `Chess tier ${index + 1}`, tier, '棋子', '#chess');
addEn('chess-diamond-warning', 'Diamond warning', chessDiamondWarningEn, '棋子', '#chess');

for (const piece of chessPiecesEn) addEn(`chess_${piece.letter}`, `${piece.letter} ${piece.name}`, piece, '棋子', '#chess');
for (const [index, rule] of chessSpecialRulesEn.entries()) addEn(`chess-rule_${index}`, rule, rule, '棋子', '#chess');

addEn('skill-overview', skillTicTacToeOverviewEn.title, skillTicTacToeOverviewEn, '技能', '#skill-ttt');
addEn('skill-probability', 'Probability generation algorithm', probabilityAlgorithmEn, '技能', '#skill-ttt');
addEn('skill-sp-system', spSystemRulesEn.title, spSystemRulesEn, '技能', '#skill-ttt');
for (const profession of professionsEn) addEn(`profession_${profession.name}`, profession.name, profession, '技能', '#skill-ttt');
for (const skill of activeSkillsEn) addEn(`skill_${skill.name}`, skill.name, skill, '技能', '#skill-ttt');
for (const [index, rule] of lightningRodSystemEn.entries()) addEn(`lightning_${index}`, `Lightning rod rule ${index + 1}`, rule, '技能', '#skill-ttt');

for (const hint of gameHintTextsEn) addEn(`game-hint_${hint.game}`, hint.name, hint.texts.join(' '), '游戏', hint.href);

addEn('chess-poison', 'Poison lookup', 'Pawn Elephant Skeleton cannot capture removed Knight hobbled removed Bishop-teacher field hobbled own half cannot cross midline removed Rook max 2 squares orthogonally max 1 square orthogonally removed Queen Ostrich max 2 squares in 8 directions max 1 square in 4 directions Whale removed Mouse L-shape only one sun step max 2 squares diagonally max 2 squares straight Cat Maine Coon English Antenna immune loses skill King Witch Paladin Astronaut Starship Rocket Anti-Witch immune Yellow cheese removes 1 poison Orange cheese removes 4 poison Blue cheese opponent controls next turn Purple cheese adds 2 poison Black cheese adds 8 poison', '棋子', '#chess');
// ttt3-rules 手写浓缩条目已删（2026-10-12）：与 zh 侧同理，skillTicTacToe.en
// 已完整登记，事件文案由 game/ttt3/engine.ts 进语料通道。
addEn('fractal-rules', 'Recursive Echo rules', '3x3 same-coordinate broadcast every action lands on the same coordinate in all existing sub-boards 8/16/32/64 actions sides assigned by the Thue-Morse schedule blue and orange exactly even one solo player drives both opening AI terrain hostile to both and not scored control the root board with 5 of its 9 votes three-level verdict root votes total controlled sub-boards', '游戏', '/playground/games/fractal-echo');
addEn('neural-rules', 'Neural Echo rules', 'Each click on your own growth point grows three scoring branches prune at 6px 16 effective growth points echoes on turns 9 17 25 max 2 replicas fractal phase', '游戏', '/playground/games/neural-echo');
addEn('cat-machine-guide', 'Cat Machine guide', 'Nine cats three-layer workstations swap chains talents random events module upgrades trunk support 9 cats simultaneously the other 4 cars story phases', '游戏', '/playground/games/cat-machine');
addEn('game-session-rules', 'Common game rules', 'How to play in-game hotkeys paused page blocks interaction resume rules 100 nodes 666 synapses neural cores reinforced synapses pulses asymmetric chase decoys real scent dash replays', '游戏', '/playground/games');
addEn('nav-groups', 'Navigation groups', 'MIIA world worldview chronicle organizations dictionary future timeline West Pacific island nations characters story catalog game universe Scratch NCTB cognitive lab math lab creation dialogues AI assistant', '页面', '#hero');
// 超沟通 EN：改为从 hyperCommunication.en.tsx 模块登记（2026-10-12），
// 手写浓缩条目已删。icon 是 JSX 元素，登记前剥掉。
addEn('hyper-communication', 'HyperCommunication', [modesEn.map((m) => ({ name: m.name, desc: m.desc })), rulesEn, largeHcEn, calendarEn], '设定', '#organizations');

const pageRecordsEn: Array<[string, string, string, string]> = [
  ['page-home', 'Home', 'Neural Connection Aurora Atlas neural connections', '#hero'],
  ['page-world', 'World Lore', 'World archive QET timeline organizations world settings', '#worldview'],
  ['page-characters', 'Characters', 'Characters extra characters character network', '#characters'],
  ['page-stories', 'Stories', 'Story chapters reader', '#stories'],
  ['page-miia', "Miia's Space", "Miia's world math notes poetry fragments", '#miia-world'],
  ['page-math', 'Math Models', 'FSIII math models ranking system', '#math'],
  ['page-playground', 'Playground', 'Games rules Scratch', '#problems'],
  ['page-settings', 'Settings & Tools', 'Dictionary Prime Focus', '#dictionary'],
  ['page-other', 'Other Hub', 'Other tools site search cognition lab data statistics local observatory search history browsing paths archive restore interruptible resumable local-first', '/other'],
];
for (const [id, title, content, href] of pageRecordsEn) addEn(id, title, content, '页面', href);

const gameRecordsEn: Array<[string, string, string, string]> = [
  ['game-cat-machine', 'Cat Machine', 'Nine cats three-layer workstations swap chains talents random events module upgrades', '/playground/games/cat-machine'],
  ['game-city-builder', 'City Builder', 'Real-time city building 3 default AIs twelve attributes color resources map planning cross-city projects zone events competition cooperation ranking', '/playground/games/city-builder'],
  ['game-stellar', 'Stellar Frontline Stellar', 'Real-time shooting ten weapons Stellar Flow weak points weapon switching', '/playground/games/stellar'],
  ['game-compound-chess', 'Compound Chess', 'Traditional chess three-dimensional space phase transformation summon units', '/playground/games/compound-chess'],
  ['game-box-battle', 'Box Battle', '26 boxes participants capitalists Deal or No Deal bids bargaining', '/playground/games/box-battle'],
  ['game-super-24', 'Super 24', 'Numbers expressions target value square root factorial exponentiation', '/playground/games/super-24'],
  ['game-skill-tic-tac-toe', 'Skill Tic-Tac-Toe', 'Probability tic-tac-toe SP skills professions placement probability action log', '/playground/games/skill-tic-tac-toe'],
  ['game-hell-maze-vi', 'Hell Maze · VI', 'Hexagonal honeycomb maze full blind left front right boolean feedback', '/playground/games/hell-maze-vi'],
  ['game-cunning-rabbit', 'Cunning Rabbit', 'Logic grid rabbit holes rows columns regions lynx activity zones', '/playground/games/cunning-rabbit'],
  ['game-fractal-echo', 'Recursive Echo', 'Fractal echo recursive board same-coordinate broadcast blue orange invasion sub-boards', '/playground/games/fractal-echo'],
  ['game-neural-echo', 'Neural Echo', 'Branch growth pruning two-player strategy neural networks', '/playground/games/neural-echo'],
  ['game-neural-clash', 'Neural Clash', 'Neural Clash 100 nodes 666 synapses neural cores reinforced synapses pulses', '/playground/games/neural-clash'],
  ['game-cat-mouse', 'Cat and Mouse', 'turn-based deduction continuous plane cat and mouse move at the same speed the cat never sees the mouse only the bait bait radius 4 real scent limited unmasking sprint move limit 2 not on consecutive turns replay inference point inference error bait offset final verdict distance threshold 3 the world never shrinks single human versus computer', '/playground/games/cat-mouse'],
  ['game-giant-catch', 'Giant Country Catch the Little One', 'Parking lot chalk grid asymmetric chase Miaowu Xiaoman\'s fingertip dashes gentle capture two factions', '/playground/games/giant-catch'],
  ['game-quiz', 'Quiz', 'Brain-teaser challenges fill-in blanks multiple choice QR codes submit answers', '/playground/games/quiz'],
  ['okcomputer', 'Self-Observation Archive OKComputer', 'self-observation archive sensory processing domains timeline insights clinic summary diagnosis development', '/okcomputer'],
  ['scratch-dont-touch-cat-2', "Don't Touch the Other Cat and the Edge 2", 'Scratch mini game', '/playground/scratch/dont-touch-cat-2'],
  ['scratch-knife-vs-archer', 'Knife V.S Archer', 'Scratch mini game', '/playground/scratch/knife-vs-archer'],
  ['scratch-royal-chess', 'Royal Chess', 'Scratch mini game', '/playground/scratch/royal-chess'],
  ['scratch-number-klotski', 'Number Klotski', 'Scratch mini game', '/playground/scratch/number-klotski'],
  ['scratch-super-brain', 'Super Brain', 'Scratch mini game', '/playground/scratch/super-brain'],
  ['scratch-red-vs-blue', 'Red vs Blue (Poison Circle Mode)', 'Scratch mini game', '/playground/scratch/red-vs-blue'],
  ['scratch-kitten-world-1', 'Kitten World 1', 'Scratch mini game', '/playground/scratch/kitten-world-1'],
  ['scratch-welcome-to-1v1', 'welcome to 1v1', 'Scratch mini game', '/playground/scratch/welcome-to-1v1'],
  ['scratch-cat-mouse-38', 'Cat and Mouse 38', 'Scratch mini game', '/playground/scratch/cat-mouse-38'],
  ['scratch-honeycomb-maze', 'Honeycomb Maze', 'Scratch mini game', '/playground/scratch/honeycomb-maze'],
  ['scratch-reinforcement-simulator', 'Reinforcement Simulator', 'Scratch mini game', '/playground/scratch/reinforcement-simulator'],
];
for (const [id, title, content, href] of gameRecordsEn) addEn(id, title, content, '游戏', href);

for (const [index, entry] of worldviewStatsEn.entries()) addEn(`worldview-stat_${index}`, entry.label, entry, '设定', '#worldview');
addEn('region-fsiii-stats', 'Region FSIII statistics', regionFsiiiStatsEn, '设定', '#worldview');
for (const [index, entry] of fsiiiRankingsEn.entries()) addEn(`fsiii_${entry.rank}_${index}`, entry.name, entry, '设定', '#math');
for (const [index, entry] of heightWeightModelEn.entries()) addEn(`height-weight_${index}`, `Height ${entry.height}`, entry, '设定', '#math');
addEn('worldview-info', 'Worldview information', worldviewInfoEn, '设定', '#worldview');
addEn('world-land-allocation', LAND_ALLOCATION_META_EN.title, LAND_ALLOCATION_SEARCH_TEXT_EN, '设定', '/world/settings');
for (const [index, name] of modelNamesEn.entries()) addEn(`model-name_${index}`, name, name, '设定', '#math');
for (const system of NEURAL_SYSTEMS_EN) addEn(`neural-system_${system.id}`, system.english, `${system.english} ${system.description}`, '设定', '#world-settings');

const zhPoemTitles = [...poems, ...extraPoems, ...miiaStoryFragments].map((entry) => entry.title);
for (const [index, entry] of [...poemsEn, ...extraPoemsEn, ...miiaStoryFragmentsEn].entries()) {
  // 英文镜像沿用中文标题作 id，保证与中文索引同 id；展示标题仍为英文。
  const zhTitle = zhPoemTitles[index] ?? entry.title;
  addEn(`poem_${zhTitle}`, entry.title, entry, '故事', '#extra-stories');
}
addEn('storytext_little-girl-in-giant-country', 'The Little Girl in the Giant Country full text', storyTextEn, '故事', '/stories/little-girl-in-giant-country');

for (const [id, entry] of [
  ['absurd-narrative', absurdNarrativeEn],
  ['tiny-wish', tinyWishEn],
  ['prime-focus', primeFocusEn],
  ['fos-story', fosStoryEn],
  ['gao-kai-story', gaoKaiStoryEn],
] as const) {
  addEn(`extra_${id}`, typeof entry === 'object' && entry !== null && 'title' in entry ? entry.title : id, entry, '故事', '#extra-stories');
}
addEn('extra-chapter-index', 'Chapter index', chapterIndexEn, '故事', '#extra-stories');
addEn('extra-wish-section', 'Wish section', wishSectionEn, '故事', '#extra-stories');
addEn('extra-correct-overdose', 'Correct Overdose', correctOverdoseEn, '故事', '#extra-stories');
addEn('extra-xishou-story', 'Xi Beast story', xishouStoryEn, '故事', '#extra-stories');
for (const [index, entry] of revolutionTableEn.entries()) addEn(`revolution_${index}`, 'Reform table', entry, '设定', '#world-settings');
addEn('extra-vpp-rules', 'VPP rules', vppRulesEn, '设定', '#world-settings');
for (const [index, entry] of iqTestsEn.entries()) addEn(`iq-test_${index}`, 'IQ tests', entry, '设定', '#world-settings');
addEn('extra-gaokai-table', 'Gaokai table', gaoKaiTableDataEn, '设定', '#extra-stories');
addEn('extra-jingbeigou', 'Jing Bei Dog', jingBeiGouFragmentEn, '故事', '#extra-stories');
addEn('extra-pen-poem', 'Putting the pen down', penPoemFragmentEn, '故事', '#extra-stories');
addEn('extra-star-child', 'Child of the Stars', starChildStoryEn, '故事', '#stories');
addEn('extra-dual-axis', 'Dual-axis model', dualAxisModelEn, '设定', '#miia-world');
addEn('extra-sanyi-college', 'Trinity College', sanYiCollegeInfoEn, '设定', '#organizations');
addEn('extra-theorem', 'Theorems', theoremFragmentsEn, '设定', '#miia-math-notes');
addEn('extra-sanceng-nation', 'Three-layer nation', sanCengNationInfoEn, '设定', '/world/pacific-islands');
addEn('extra-wage', 'Salary and pocket money', wageFragmentEn, '故事', '#extra-stories');
addEn('extra-shengyu-qiyue', 'Birth Contract Law', shengYuQiYueInfoEn, '设定', '#prime-focus');
addEn('extra-super-intelligence', 'Superintelligence school rule', superIntelligenceRuleEn, '设定', '#organizations');
addEn('extra-gaokao-volunteer', 'Gaokao volunteer rules', gaoKaoVolunteerRuleEn, '设定', '/math/fsiii');
addEn('extra-subway-pricing', 'Metro pricing', subwayPricingRuleEn, '设定', '/playground/games/city-builder');
addEn('extra-unified-recruitment', 'Unified recruitment', unifiedRecruitmentRuleEn, '设定', '#organizations');
addEn('extra-agi-employment', 'AGI employment regulation', agiEmploymentRegulationEn, '设定', '#prime-focus');
addEn('extra-open-exam-registration', 'Mandatory open registration', openExamRegistrationRuleEn, '设定', '#organizations');
addEn('extra-labor-value', 'Pricier labor, better life', laborValueTheoryEn, '故事', '#extra-stories');
addEn('extra-sumo-angle', 'The sumo wrestler and the full turn', sumoAngleNoteEn, '故事', '#extra-stories');
addEn('extra-emotion-vector', 'Affective computing and irony', emotionVectorNoteEn, '故事', '#extra-stories');
addEn('extra-unnecessary-door', 'A door opened for nothing', unnecessaryDoorStoryEn, '故事', '#extra-stories');

// 西太平洋诸岛国 EN：改为从 pacificIslands.en.ts 模块登记（2026-10-12），
// 手写浓缩条目已删——旧条目专名是漂移的旧罗马音（Arashi/Wujiao/Chenwan/
// Xijiao/Hating），模块与术语表一致（Lanxi/Wujia/Chengwan/Xijia/Haiting），
// 且补上了旧条目没有的 travel / policy / yuanchui 细节。
addEn('pacific-islands', 'West Pacific Island Nations', pacificIntroEn, '设定', '/world/pacific-islands');
addEn('pacific-nations', 'West Pacific island nations details', nationsEn, '设定', '/world/pacific-islands');
addEn('pacific-timeline', 'West Pacific timeline', timelineEn, '设定', '/world/pacific-islands');
addEn('pacific-travel', 'Chengwan-China travel', travelInfoEn, '设定', '/world/pacific-islands');
addEn('pacific-policy', 'Entry policy', chinaPolicyEn, '设定', '/world/pacific-islands');
addEn('pacific-yuanchui', 'Yuanchui Federation', [yuanchuiTitleEn, yuanchuiDescEn, lowerTierDescEn, customsDescEn, yuanchuiNoteEn], '设定', '/world/pacific-islands');
addEn('pacific-chengwan', chengwanChinaTitleEn, [chengwanChinaTitleEn, cityHeadingEn, cityStatsEn], '设定', '/world/pacific-islands');

for (const dimension of NCTB_DIMENSIONS_EN) {
  addEn(`nctb-dim_${dimension.id}`, `${dimension.title} ${dimension.english}`, `${dimension.title} ${dimension.english} ${dimension.description} ${dimension.skill}`, '测评', '/nctb');
}
addEn('nctb-modes', 'NCTB exam modes', 'Standard exam formal exam all items treated uniformly as exam questions feedback given once after the whole set no hints no explanations no per-item right/wrong', '测评', '/nctb');
addEn('nctb-strategies', 'NCTB question-selection strategies', 'Fixed difficulty adaptive difficulty question bank sorted by target difficulty first, with actual difficulty fully recorded', '测评', '/nctb');
addEn('nctb-hero', 'Cognition Lab introduction', 'Ten dimensions fifty questions a local ability-exploration loop that is interruptible resumable and explainable', '测评', '/nctb');
addEn('nctb-safety', 'NCTB data notes', 'The standard exam is only a local calibration exercise, not a regulated or confidential psychological test; the composite exploration score is the average of ten descriptive dimension scores', '测评', '/nctb');

for (const spec of DIMENSION_SPECS_EN) {
  addEn(`nctb-spec_${spec.id}`, `${spec.id} construct ${spec.construct}`, `${spec.construct} measures ${spec.measures.join(' ')} does not measure ${spec.shouldNotMeasure.join(' ')} item families ${spec.itemFamilies.join(' ')} difficulty model ${spec.difficultyModel.join(' ')}`, '测评', '/nctb');
}
for (const question of [...FORMAL_A_V1_QUESTIONS_EN, ...FORMAL_FOUNDATION_V1_QUESTIONS_EN]) {
  const text = `${question.prompt} ${question.stimulus ?? ''} ${question.options.join(' ')}`;
  addEn(`nctb-q_${question.id}`, question.prompt, text, '测评', '/nctb');
}

for (const dimension of PEMS_DIMENSIONS_EN) {
  addEn(`fla-dim_${dimension.code}`, `PEMS-L ${dimension.code} ${dimension.title}`, `${dimension.title} ${dimension.shortLabel} weight ${dimension.weight * 100}% threshold ${dimension.threshold} slope ${dimension.slope}`, '设定', '/math/fla');
}
addEn('fla-model', 'PEMS-L FLA v2.1 functional legal age model', 'Functional legal age model PEMS-L FLA from weighted five dimensions to population-curve lookup does not overturn the life-course function the last step of reconstructing the age mapping the old formula assumed abilities can compensate each other infinitely the five dimensions are mutually independent real-world cognitive peak timing is highly heterogeneous executive function includes both a common factor and distinct subcomponents social cognition even shifts in different directions with age', '设定', '/math/fla');
addEn('fla-dimensions', 'PEMS-L five dimensions', 'Physical development executive function emotional regulation social interaction language symbols P E M S L does not measure height muscle or puberty level avoids letting stronger young people earn a higher legal age for no reason measures decision stability not emotional quantity crying easily or strong emotions should not automatically mean immaturity does not judge by mainstream sociability focuses on whether legally meaningful symbol systems are understood', '设定', '/math/fla');
addEn('fla-formula', 'PEMS-L formula notes', 'Geometric mean soft bottleneck effect adulthood line 18 calibrated by population targets adult legal identity is irreversible the elderly do not see their age regress 80 to 17 to 15 to 12 and reacquire minor status current capacity decline should enter specific capacity assessment rather than making age flow backward', '设定', '/math/fla');


// Catch-all corpus: every prose-bearing string from component / page /
// interactive sources that the structured add() list below does not cover.
// The engine de-duplicates segments that overlap the already-indexed data.
for (const doc of frequencyCorpusZh) {
  items.push({ id: doc.id, title: doc.title, content: doc.content, category: doc.category, href: doc.href, frequencySegments: doc.segments });
}
for (const doc of frequencyCorpusEn) {
  enItems.push({ id: doc.id, title: doc.title, content: doc.content, category: doc.category, href: doc.href, frequencySegments: doc.segments });
}

export const fullSearchIndexEn: FullSearchItem[] = enItems;

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

export function fullTextSearch(query: string, locale: Locale = 'zh-CN'): { item: FullSearchItem; score: number }[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const rawWords = normalizedQuery.split(/[\s·.,，。！？：；/()（）-]+/).filter(Boolean);
  if (rawWords.length === 0) return [];
  const queryWords = expandAliases(rawWords);
  const corpus = locale === 'en' ? fullSearchIndexEn : fullSearchIndex;
  return corpus
    .map(item => ({ item, score: scoreItem(item, queryWords, normalizedQuery) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length)
    .slice(0, 80);
}
