import React from 'react';
import { frequencyHighlightMap } from '@/data/wordFrequency';
import { getLocale } from '@/lib/i18n';
import { translateSurfaceText } from '@/lib/translations/manual';

// ═══════════════════════════════════════════════════════════════
//  FULL-SITE Semantic Highlight — comprehensive keyword coverage
//  Strategy: scan all data sources, color EVERY proper noun / term / entity
//  Categories: 角色 | 动物 | 术语 | 地点 | 机构 | 动作 | 情感 | 物品 | 时间 | 棋子
// ═══════════════════════════════════════════════════════════════

// ── COLOR PALETTES ──
// We assign colors by semantic CATEGORY, not by individual item
// Each category gets a distinct hue range for visual grouping

// 角色 (Characters) — warm to cool spectrum
const CHAR_COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400',
  'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400',
  'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400',
  'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400',
  'text-rose-400', 'text-red-300', 'text-orange-300', 'text-amber-300',
];

// 动物角色 (Animal characters) — earthy tones
const ANIMAL_COLORS = [
  'text-orange-400', 'text-amber-300', 'text-yellow-300', 'text-lime-300',
  'text-green-300', 'text-emerald-300', 'text-teal-300', 'text-cyan-300',
  'text-sky-300', 'text-blue-300',
];

// 术语 (Terms) — gold family
const TERM_COLORS = [
  'text-nc-gold', 'text-amber-400', 'text-yellow-400', 'text-orange-400',
];

// 地点 (Places) — blue-purple family
const PLACE_COLORS = [
  'text-blue-400', 'text-indigo-400', 'text-violet-400', 'text-purple-400',
  'text-sky-400', 'text-cyan-400',
];

// 机构 (Organizations) — magenta family
const ORG_COLORS = [
  'text-fuchsia-400', 'text-pink-400', 'text-rose-400', 'text-purple-400',
];

// 动作 (Actions) — warm energetic
const ACTION_COLORS = [
  'text-amber-400', 'text-orange-400', 'text-red-400', 'text-rose-400',
  'text-yellow-400', 'text-lime-400',
];

// 情感 (Emotions) — soft pastels
const EMOTION_COLORS = [
  'text-rose-400', 'text-pink-400', 'text-purple-400', 'text-violet-400',
  'text-indigo-400', 'text-blue-400', 'text-sky-400', 'text-cyan-400',
  'text-teal-400', 'text-emerald-400', 'text-green-400', 'text-lime-400',
  'text-yellow-400', 'text-amber-400', 'text-orange-400', 'text-red-400',
];

// 物品 (Items) — pink-cyan
const ITEM_COLORS = [
  'text-pink-400', 'text-fuchsia-400', 'text-cyan-400', 'text-sky-400',
  'text-blue-400', 'text-purple-400',
];

// 时间 (Time) — sky family
const TIME_COLORS = [
  'text-sky-400', 'text-blue-300', 'text-indigo-300', 'text-violet-300',
  'text-cyan-300', 'text-teal-300',
];

// ═══════════════════════════════════════════════════════════════
//  COMPREHENSIVE KEYWORD DATABASE
//  Auto-generated from all site data + manual curation
// ═══════════════════════════════════════════════════════════════

// ── 角色名 (全部已登场角色) ──
const CHAR_KEYWORDS: string[] = [
  // M/I/A 核心
  '米雅', '咪呀', 'Mia', '米娅', '米迷', '小小咪', 'mimi', 'mia³',
  // 哲华学校
  '墨璇玥', '墨璇玥.iv', '墨璇玥.fc', '墨奥幂', '墨奥幂.fc', '星野遥', '林可梦', '卡塔斯', 'Quartus', '赵召',
  // 因派系
  '林浅', '林深',
  // 其他角色
  'Līlā', 'Lila', '朵拉', '朵拉·卡可拉', '爱丽丝', '可乐', '莱尼尔', '莱尼尔·塞佛·卡可拉', '塞佛', '卡可拉',
  '棋程', '哈姆诗', '墨问', 'Nihilib', 'Nimfa', 'Matthew',
  // AI / 特殊
  'Eirene', 'Damocles', '初音ミク', 'Miku', 'ミク', 'nyaumæ',
  'あいえふちゃん',
  // 故事角色
  '狐狸', '红狐狸', '小狐狸', '橙狐狸',
  '企鹅', '白企鹅', '小企鹅',
  '老乌龟', '蓝鲸鱼', '海星', '小丑鱼', '小螃蟹', '黄鱼',
  // 冯班候选人
  '叶冰辰',
];

// ── 动物角色 ──
const ANIMAL_KEYWORDS: string[] = [
  '兔子', '小兔子', '白兔子', '坏兔子', '萌兔子',
  '猫咪', '小猫', '大猫', '缅因猫',
  '狗狗', '小狗', '狼狗',
  '鸟儿', '小鸟', '海鸥', '天鹅',
  '鱼儿', '大鱼', '小鱼',
  '蝴蝶', '蜜蜂', '萤火虫',
  '小熊', '熊猫', ' polar bear',
  '松鼠', '刺猬', '鼹鼠',
  '青蛙', '蝌蚪', '蝾螈',
  '蜗牛', '贝壳', '珊瑚',
  '水母', '章鱼', '鱿鱼',
  '海草', '海藻', '海带',
  '海豚', '海豹', '海狮',
  '鲸鱼', '鲨鱼', '鳐鱼',
  // 叠词动物 (坏兔子故事)
  '兔兔', '坏兔兔', '乖兔兔', '胡萝卜卜', '老鼠鼠', '喵喵',
];

// ── 世界观术语 ──
const TERM_KEYWORDS: string[] = [
  'AGI', 'ASI', 'FSIII', 'FSIQ', 'PF', 'QET', 'DAT', 'FOS', 'SNS',
  'Ploutos', 'VR', 'AR', '心界', '沐光计划', '心渊日志',
  'p₂r', 'Prime Focus', 'QuaAGI',
  '高考', '内卷', '赋分', '刷题', '状元', '分数', '排名',
  '智商', '情商', '天赋', '努力', '运气', '机遇',
  '映射', '重构', '迭代', '超频', '运行',
  '信息茧房', 'PF+刷题', '题型', '教材', '校服裙', '棒棒糖',
  '数据模型', '曲线图', '公式', '维度', '空间', '时间', '记忆', '投影',
  '彩虹泡泡水', '魔法瓶', '贝壳', '海藻饼干',
  '立体画册', '小猫发夹', '星际飞船模型',
  '全息投影', '神经网络', '深度学习', '算法',
  '认知', '感知', '意识', '思维', '逻辑', '理性', '感性',
  '量子', '光子', '粒子', '波函数', '纠缠', '叠加',
  '基因', 'DNA', 'RNA', '蛋白质', '细胞', '神经元',
  '能量', '质量', '速度', '加速度', '力', '场',
  '熵', '焓', '自由能', '势阱', '势垒',
  // 三子棋术语
  'SP', '避雷针', 'Lightning Rod', 'Rolling Thunder', 'Rod',
  '概率', '成功率', '期望值', '方差', '标准差',
  '先手', '后手', '平局', '胜利', '失败',
  // 象棋术语
  '王车易位', '吃过路兵', '升变', '逼和', '长将',
  '将军', '将死', '和棋', '认输', '提和',
  '开局', '中局', '残局', '定式', '变例',
  '战术', '战略', '组合', '牺牲', '兑换',
  // 更多术语 (坏兔兔/夕兽/示例文本/高考)
  'CPTSD', '研究生', '科技', '污染', '童话',
  '试卷', '题目', '答错', '答案', '正确',
  '初试', '复试', '统考', '自命题', '报名',
  '预测', '惩罚', '总分', '总用时', 'Penalty',
  '社会', '机械', '解离', '抑郁', '紧张症',
  '行为刻板', '监护人', '同居', '缺陷',
  '分形', '复数域', '小镇做题家', '公主', '大魔王',
  '数电', 'VR游戏', '做题家', '马戏团',
];

// ── 地点 ──
const PLACE_KEYWORDS: string[] = [
  '彩虹泡泡海', '沙滩', '大海', '珊瑚小屋', '海底', '海边', '海岸',
  '巴别塔', '中心能源塔', '荧光灯镇', '高桥西站', '霞浦站',
  '深空蹦极跳台', '思拓中枢指挥室',
  '新加坡', '悉尼',
  '虚拟空间', '全息交互区', '数据流游泳池', '环形阅读区', '咖啡吧台',
  '知识的海洋', '逻辑的迷宫', '数学的迷宫',
  '森林深处', '星空', '银河', '宇宙', '黑洞', '虫洞',
  '实验室', '儿童房', '公主的小镇',
  '二次元', '三次元', '四次元',
  '梦境', '现实', '虚拟', '幻想', '理想乡',
  '东京',
];

// ── 机构 ──
const ORG_KEYWORDS: string[] = [
  '哲华学校', '冯·诺伊曼班', '星界馆', '科照真学院', '巴别塔班', '观学院',
  '因派', 'Impact Inc.', '德澜思拓', '德澜思拓公司', 'Fill Ocean', 'Fill Ocean School',
  '全域社会', '教育局', '元同人游戏社区',
];

// ── 关键动作 ──
const ACTION_KEYWORDS: string[] = [
  '创造', '改革', '打破', '失效', '改造', '升级', '进化', '重构', '迭代',
  '映射', '扭曲', '超频', '运行', '设计', '模拟', '构建', '生成', '计算',
  '处理', '分析', '探索', '研究', '跳跃', '游泳', '飞翔', '帮助', '合作',
  '观察', '思考', '推理', '归纳', '演绎', '抽象', '具体化',
  '验证', '检验', '测试', '评估', '评价', '判断', '决策',
  '执行', '实施', '操作', '控制', '调节', '优化', '改进',
  '学习', '记忆', '回忆', '遗忘', '联想', '想象', '创造',
  '表达', '交流', '沟通', '协商', '争论', '辩论', '说服',
  '理解', '领悟', '体会', '感受', '体验', '经历', '遭遇',
  // 夕兽故事/其他
  '画画', '独处', '热闹', '拯救', '崩溃', '发疯', '失控',
  '制止', '杀掉', '感染', '燃放', '打伞', '找钥匙',
  '拍手', '摇晃', '踱步', '排列', '敲击', '观察',
];

// ── 情感 ──
const EMOTION_KEYWORDS: string[] = [
  '兴奋', '温柔', '困惑', '寂寞', '孤独', '安心', '开心', '快乐',
  '难过', '悲伤', '愤怒', '恐惧', '好奇', '惊讶', '期待', '怀念',
  '希望', '绝望', '复杂', '模糊', '温暖', '高兴', '害羞', '紧张',
  '平静', '安宁', '祥和', '喜悦', '欢乐', '愉悦', '舒畅', '畅快',
  '忧郁', '愁苦', '哀怨', '惆怅', '失落', '沮丧', '颓废', '萎靡',
  '激动', '振奋', '鼓舞', '激励', '感动', '震撼', '触动', '感染',
  '厌恶', '反感', '憎恨', '仇视', '敌视', '蔑视', '轻视', '鄙视',
  '喜爱', '热爱', '钟爱', '溺爱', '宠爱', '怜爱', '疼爱', '珍爱',
  '信任', '信赖', '依靠', '依赖', '寄托', '归宿', '归属', '认同',
  '自豪', '骄傲', '得意', '满足', '欣慰', '庆幸', '感激', '感恩',
  '抱歉', '愧疚', '内疚', '自责', '悔恨', '遗憾', '惋惜', '叹息',
  '从容', '淡定', '坦然', '豁达', '开明', '包容', '宽恕', '原谅',
  // 更多
  '窒息', '气鼓鼓',
];

// ── 物品/概念 ──
const ITEM_KEYWORDS: string[] = [
  '立体画册', '小猫发夹', '星际飞船模型', '信息茧房',
  'PF+刷题', '刷题', '题型', '教材', '校服裙', '棒棒糖',
  '数据模型', '曲线图', '公式', '维度', '空间', '时间', '记忆', '投影',
  '彩虹泡泡水', '魔法瓶', '贝壳', '海藻饼干',
  '彩虹', '泡泡', '星光', '月光', '阳光', '灯光', '荧光',
  '钻石', '宝石', '水晶', '珍珠', '玛瑙', '翡翠',
  '飞船', '火箭', '卫星', '空间站', '宇宙飞船',
  '机器人', '无人机', '仿生体', '克隆体', '义体',
  '芯片', '处理器', '存储器', '传感器', '显示器',
  '网络', '服务器', '数据库', '防火墙', '协议',
  '信号', '频率', '波长', '振幅', '相位', '脉冲',
  '代码', '程序', '算法', '函数', '变量', '常量',
  '模型', '架构', '框架', '平台', '系统', '引擎',
  '界面', '交互', '反馈', '响应', '延迟', '带宽',
  // 更多物品/概念
  '脏脏水', '猫粮粮', '肚肚', '饭饭', '花园园', '烟花炮竹',
  '骨灰', '钥匙', '伞', '胡萝卜', '花花', '草草',
  '蜡烛', '金币', '蛋糕', '港湾', '乘法', '整数',
  '矩阵', '镜子', '走马灯', '风', '月亮', '铃兰花',
  '朝阳', '碎片', '梦', '路', '毕业',
  '校服', '试卷', '题目', '作业', '考试', '成绩',
];

// ── 时间 ──
const TIME_KEYWORDS: string[] = [
  '午后', '暑假', '假期', '童年', '青春', '岁月', '时光', '瞬间',
  '永恒', '永远', '未来', '过去', '现在', '夏天', '冬天', '春天', '秋天',
  '白天', '夜晚', '月光', '夕阳', '朝阳', '晨曦', '黄昏', '黎明', '午夜',
  '黎明前', '黄昏后', '子夜', '正午', '清晨', '傍晚', '深夜', '凌晨',
  '周一', '周二', '周三', '周四', '周五', '周六', '周日',
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
  '春节', '元宵', '清明', '端午', '中秋', '重阳', '冬至', '元旦',
  '情人节', '愚人节', '劳动节', '儿童节', '教师节', '国庆节',
  '圣诞节', '万圣节', '感恩节', '复活节',
];

// ── 棋子 (保留原有映射，确保全部覆盖) ──
const PIECE_KEYWORDS: Record<string, string> = {
  // Diamond (yellow-300): K, S, U
  '王': 'text-yellow-300 font-semibold',
  'K': 'text-yellow-300 font-semibold',
  '星舰': 'text-yellow-300 font-semibold',
  'S': 'text-yellow-300 font-semibold',
  '太空人': 'text-yellow-300 font-semibold',
  'U': 'text-yellow-300 font-semibold',
  // Amber (amber-300): M
  '老鼠': 'text-amber-300 font-semibold',
  'M': 'text-amber-300 font-semibold',
  // Gold (yellow-400): Q, H, O
  '后': 'text-yellow-400 font-semibold',
  'Q': 'text-yellow-400 font-semibold',
  '巨鲸': 'text-yellow-400 font-semibold',
  'H': 'text-yellow-400 font-semibold',
  '鸵鸟': 'text-yellow-400 font-semibold',
  'O': 'text-yellow-400 font-semibold',
  // Purple (purple-400): R, C, J
  '车': 'text-purple-400 font-semibold',
  'R': 'text-purple-400 font-semibold',
  '炮': 'text-purple-400 font-semibold',
  '大炮': 'text-purple-400 font-semibold',
  'C': 'text-purple-400 font-semibold',
  '圣骑士': 'text-purple-400 font-semibold',
  'J': 'text-purple-400 font-semibold',
  // Blue (blue-400): N, Y, L, B, A, W, IW
  '马': 'text-blue-400 font-semibold',
  'N': 'text-blue-400 font-semibold',
  '缅因猫': 'text-blue-400 font-semibold',
  'Y': 'text-blue-400 font-semibold',
  '英语': 'text-blue-400 font-semibold',
  'L': 'text-blue-400 font-semibold',
  '教': 'text-blue-400 font-semibold',
  'B': 'text-blue-400 font-semibold',
  '天线': 'text-blue-400 font-semibold',
  'A': 'text-blue-400 font-semibold',
  '女巫': 'text-blue-400 font-semibold',
  'W': 'text-blue-400 font-semibold',
  '反女巫': 'text-blue-400 font-semibold',
  'IW': 'text-blue-400 font-semibold',
  // Green (green-400): T, E
  '猫': 'text-green-400 font-semibold',
  'T': 'text-green-400 font-semibold',
  '象': 'text-green-400 font-semibold',
  'E': 'text-green-400 font-semibold',
  // White (gray-300): P, Z, IZ, X
  '兵': 'text-gray-300 font-semibold',
  'P': 'text-gray-300 font-semibold',
  '骷髅兵': 'text-gray-300 font-semibold',
  'Z': 'text-gray-300 font-semibold',
  '反骷髅兵': 'text-gray-300 font-semibold',
  'IZ': 'text-gray-300 font-semibold',
  '火箭': 'text-gray-300 font-semibold',
  'X': 'text-gray-300 font-semibold',
  // Catgirl keeps unique pink
  '猫娘': 'text-fuchsia-400 font-semibold',
  'G': 'text-fuchsia-400 font-semibold',
};

// ── 数字 ──
// NOTE: Only year-range numbers here. All other numbers are handled
// by the number-scanning logic in semanticHighlight() to avoid
// breaking multi-digit numbers (e.g. "158" being split as "15"+"8")
const NUMBER_KEYWORDS: string[] = [
  '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033',
  '1314', '831', '1415926535',
];

// ═══════════════════════════════════════════════════════════════
//  COLOR MAP BUILDING
// ═══════════════════════════════════════════════════════════════

const COLOR_MAP: Record<string, string> = {};

// 角色名 - text-[1.2em] (比周围大20%，突出)
CHAR_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = CHAR_COLORS[i % CHAR_COLORS.length] + ' font-semibold text-[1.2em]';
});

// 动物 - 不设置大小（继承父元素）
ANIMAL_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = ANIMAL_COLORS[i % ANIMAL_COLORS.length] + ' font-medium';
});

// 术语 - text-[1.1em] + bold (比周围大10%)
TERM_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = TERM_COLORS[i % TERM_COLORS.length] + ' font-bold text-[1.1em]';
});

// 地点 - 不设置大小（继承父元素）
PLACE_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = PLACE_COLORS[i % PLACE_COLORS.length] + ' font-semibold';
});

// 机构 - 不设置大小（继承父元素）
ORG_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = ORG_COLORS[i % ORG_COLORS.length] + ' font-semibold';
});

// 动作 - text-[1.1em] + bold (比周围大10%)
ACTION_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = ACTION_COLORS[i % ACTION_COLORS.length] + ' font-bold text-[1.1em]';
});

// 情感 - 不设置大小（继承父元素）
EMOTION_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = EMOTION_COLORS[i % EMOTION_COLORS.length];
});

// 物品 - 不设置大小（继承父元素）
ITEM_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = ITEM_COLORS[i % ITEM_COLORS.length];
});

// 时间 - 不设置大小（继承父元素）
TIME_KEYWORDS.forEach((k, i) => {
  COLOR_MAP[k] = TIME_COLORS[i % TIME_COLORS.length];
});

// 棋子
Object.entries(PIECE_KEYWORDS).forEach(([k, v]) => {
  COLOR_MAP[k] = v;
});

// 数字年份
NUMBER_KEYWORDS.forEach((k) => {
  COLOR_MAP[k] = 'text-nc-cyan font-mono font-bold';
});

// 单字角色名（词边界保护）
const SINGLE_CHAR_NAMES: Record<string, string> = {
  '零': 'text-slate-300 font-semibold',
};
Object.entries(SINGLE_CHAR_NAMES).forEach(([k, v]) => {
  COLOR_MAP[k] = v;
});

// ═══════════════════════════════════════════════════════════════
//  GRADIENT & SIZE ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════

// Core characters get gradient text + larger size
const GRADIENT_OVERRIDES: Record<string, string> = {
  '米雅': 'bg-gradient-to-r from-pink-400 via-purple-400 to-violet-400 bg-clip-text text-transparent font-bold text-lg',
  '咪呀': 'bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent font-bold',
  'Mia': 'bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold text-base',
};
Object.entries(GRADIENT_OVERRIDES).forEach(([k, v]) => {
  if (COLOR_MAP[k]) COLOR_MAP[k] = v;
});

// Special: simμla eden (glow keyword — must be in COLOR_MAP to be matched)
COLOR_MAP['simμla eden'] = 'text-violet-300 font-bold';

// ═══════════════════════════════════════════════════════════════

// Sort keywords by length descending (longest first for greedy matching)
for (const [keyword, color] of frequencyHighlightMap) {
  if (!COLOR_MAP[keyword]) COLOR_MAP[keyword] = color;
}

let ALL_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

// ═══════════════════════════════════════════════════════════════
//  MATCHING ENGINE
// ═══════════════════════════════════════════════════════════════

function isDelimiter(ch: string): boolean {
  if (!ch) return true;
  return /[\s\p{P}\p{S}\d]/u.test(ch);
}

// ═══════════════════════════════════════════════════════════════
//  PERFORMANCE: LRU Cache for semanticHighlight
//  Prevents re-processing identical text strings on every render
// ═══════════════════════════════════════════════════════════════

const MAX_CACHE_SIZE = 300;
const highlightCache = new Map<string, React.ReactNode[]>();

function syncFrequencyHighlights(): void {
  let changed = false;
  for (const [keyword, color] of frequencyHighlightMap) {
    if (COLOR_MAP[keyword]) continue;
    COLOR_MAP[keyword] = color;
    changed = true;
  }
  if (changed) {
    ALL_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
    highlightCache.clear();
  }
}

function getCachedHighlight(text: string): React.ReactNode[] | undefined {
  return highlightCache.get(text);
}

function setCachedHighlight(text: string, result: React.ReactNode[]): void {
  if (highlightCache.size >= MAX_CACHE_SIZE) {
    const firstKey = highlightCache.keys().next().value;
    if (firstKey !== undefined) {
      highlightCache.delete(firstKey);
    }
  }
  highlightCache.set(text, result);
}

// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  LOCALISATION
//
//  These helpers are the single choke point through which almost every
//  section renders its copy (headings, settings, tables, rules). Translating
//  *here* — before the per-character split — is what lets the English view
//  read as whole sentences instead of disconnected glyphs.
//
//  Long-form narrative (story reader, poems, essays) opts out with
//  `{ prose: true }`: those bodies are authored works, not interface copy,
//  and must keep their original layout and wording.
// ═══════════════════════════════════════════════════════════════

export interface HighlightOptions {
  /** Narrative body: never localised, even in the English view. */
  prose?: boolean;
}

function localizeSource(text: string, options?: HighlightOptions): string {
  if (options?.prose) return text;
  if (getLocale() !== 'en') return text;
  return translateSurfaceText(text);
}

// ═══════════════════════════════════════════════════════════════

export function semanticHighlight(input: string, options?: HighlightOptions): React.ReactNode[] {
  if (!input) return [];
  const text = localizeSource(input, options);

  syncFrequencyHighlights();

  // Check cache first
  const cached = getCachedHighlight(text);
  if (cached) return cached;

  const parts: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < text.length) {
    // 0. Numbers FIRST - never let keyword matching break digit sequences
    // (fixes "158" being matched as "15"+"8" when "15" is in COLOR_MAP)
    if (/\d/.test(text[i])) {
      let numStr = '';
      let j = i;
      while (j < text.length && /\d/.test(text[j])) {
        numStr += text[j];
        j++;
      }
      // Color ALL digit sequences — no threshold, all numbers get cyan
      parts.push(<span key={key++} className="text-nc-cyan font-mono font-bold">{numStr}</span>);
      i = j;
      continue;
    }

    let matched = false;

    // 1. Try matching longest keyword
    for (const kw of ALL_KEYS) {
      const len = kw.length;
      if (text.substring(i, i + len) === kw) {
        // Single-char boundary protection
        if (len === 1) {
          const prev = i > 0 ? text[i - 1] : '';
          const next = i + 1 < text.length ? text[i + 1] : '';
          if (!isDelimiter(prev) && !isDelimiter(next)) continue;
        }

        // Special: "答错" → split into "答"(yellow) + "错"(red)
        if (kw === '答错') {
          parts.push(<span key={key++} className="text-yellow-400 font-bold">答</span>);
          parts.push(<span key={key++} className="text-red-500 font-bold">错</span>);
          i += len;
          matched = true;
          break;
        }

        // Special glow effect for simμla eden
        if (kw === 'simμla eden') {
          parts.push(
            <span
              key={key++}
              className="text-violet-300 font-bold"
              style={{ textShadow: '0 0 8px rgba(167,139,250,0.6), 0 0 16px rgba(167,139,250,0.4), 0 0 24px rgba(236,72,153,0.2)' }}
            >
              {kw}
            </span>
          );
        } else {
          parts.push(<span key={key++} className={COLOR_MAP[kw]}>{kw}</span>);
        }
        i += len;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // 2. English words
    if (/[a-zA-Z]/.test(text[i])) {
      let enWord = '';
      let j = i;
      while (j < text.length && /[a-zA-Z]/.test(text[j])) {
        enWord += text[j];
        j++;
      }
      parts.push(<span key={key++}>{enWord}</span>);
      i = j;
      continue;
    }

    // 3. Other chars
    parts.push(<span key={key++}>{text[i]}</span>);
    i++;
  }

  // Cache result before returning
  setCachedHighlight(text, parts);

  return parts;
}

// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  SPECIALIZED: Alternating Color Highlight
//  For repeated words like "答错答错答错...", color them alternately
// ═══════════════════════════════════════════════════════════════

export function alternatingHighlight(
  input: string,
  colorA: string = 'text-rose-400 font-bold',
  colorB: string = 'text-cyan-400 font-bold',
  targetWord?: string,
  options?: HighlightOptions
): React.ReactNode[] {
  if (!input) return [];
  const text = localizeSource(input, options);

  syncFrequencyHighlights();
  const parts: React.ReactNode[] = [];
  let key = 0;
  let i = 0;
  let toggle = false;

  // If targetWord is specified, only alternate that word
  // Otherwise, alternate ALL repeated consecutive identical chars/words
  if (targetWord) {
    const tlen = targetWord.length;
    while (i < text.length) {
      if (text.substring(i, i + tlen) === targetWord) {
        const color = toggle ? colorA : colorB;
        parts.push(<span key={key++} className={color}>{targetWord}</span>);
        i += tlen;
        toggle = !toggle;
      } else {
        parts.push(<span key={key++}>{text[i]}</span>);
        i++;
      }
    }
  } else {
    // Auto-detect: scan for repeated sequences and alternate them
    while (i < text.length) {
      let matched = false;
      // Try ALL_KEYS first (same as semanticHighlight)
      for (const kw of ALL_KEYS) {
        const len = kw.length;
        if (text.substring(i, i + len) === kw) {
          if (len === 1) {
            const prev = i > 0 ? text[i - 1] : '';
            const next = i + 1 < text.length ? text[i + 1] : '';
            if (!isDelimiter(prev) && !isDelimiter(next)) continue;
          }
          parts.push(<span key={key++} className={COLOR_MAP[kw]}>{kw}</span>);
          i += len;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Numbers
      if (/\d/.test(text[i])) {
        let numStr = '';
        let j = i;
        while (j < text.length && /\d/.test(text[j])) {
          numStr += text[j];
          j++;
        }
        const n = parseInt(numStr, 10);
        if ((n >= 2010 && n <= 2099) || n >= 80 || numStr === '3' || numStr === '158' || numStr === '42') {
          parts.push(<span key={key++} className="text-nc-cyan font-mono font-bold">{numStr}</span>);
        } else {
          parts.push(<span key={key++}>{numStr}</span>);
        }
        i = j;
        continue;
      }

      // English
      if (/[a-zA-Z]/.test(text[i])) {
        let enWord = '';
        let j = i;
        while (j < text.length && /[a-zA-Z]/.test(text[j])) {
          enWord += text[j];
          j++;
        }
        parts.push(<span key={key++}>{enWord}</span>);
        i = j;
        continue;
      }

      parts.push(<span key={key++}>{text[i]}</span>);
      i++;
    }
  }

  return parts;
}

// ═══════════════════════════════════════════════════════════════
//  SPECIALIZED: Cow vs Cat Contrast Coloring (四维测试)
//  牛马人格 = 暖色系 (orange/red), 猫咪喵格 = 冷色系 (cyan/blue)
// ═══════════════════════════════════════════════════════════════

const COW_KEYWORDS = ['牛', '牛马', '人', '人人', '人人人', '主观', '努力', '意志力', '客观', '社交', '后台常驻', '恢复'];
const CAT_KEYWORDS = ['喵', '喵喵', '喵喵喵', '猫咪', '猫', '被动', '灵感', '身体', '感官', '直觉', '天性', '本能', '潮汐', '睡眠', '饥饿', '感知'];
// 滚滚滚滚 特殊红色（不属于牛马/猫咪，独立红色）
const GUN_COLOR = 'text-red-500 font-bold';

const COW_COLOR = 'text-orange-400 font-bold';
const CAT_COLOR = 'text-cyan-400 font-bold';

export function cowCatHighlight(input: string, options?: HighlightOptions): React.ReactNode[] {
  if (!input) return [];
  const text = localizeSource(input, options);
  const parts: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  // Build combined keyword list, longest first
  const allKws = [...COW_KEYWORDS.map(k => ({ word: k, type: 'cow' as const })),
                  ...CAT_KEYWORDS.map(k => ({ word: k, type: 'cat' as const }))];
  allKws.sort((a, b) => b.word.length - a.word.length);

  while (i < text.length) {
    let matched = false;

    // Special: 滚滚 → red (独立于 cow/cat)
    if (text.substring(i, i + 4) === '滚滚滚滚') {
      parts.push(<span key={key++} className={GUN_COLOR}>滚滚滚滚</span>);
      i += 4;
      continue;
    }
    if (text.substring(i, i + 2) === '滚滚') {
      parts.push(<span key={key++} className={GUN_COLOR}>滚滚</span>);
      i += 2;
      continue;
    }

    for (const { word, type } of allKws) {
      const len = word.length;
      if (text.substring(i, i + len) === word) {
        const colorClass = type === 'cow' ? COW_COLOR : CAT_COLOR;
        parts.push(<span key={key++} className={colorClass}>{word}</span>);
        i += len;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Emoji 保留
    const codePoint = text.codePointAt(i);
    const character = codePoint === undefined ? text[i] : String.fromCodePoint(codePoint);
    if (/[\u{1F42E}\u{1F431}\u{1F434}\u{1F404}\u{1F403}]/u.test(character)) {
      parts.push(<span key={key++}>{character}</span>);
      i += character.length;
      continue;
    }

    // English words
    if (/[a-zA-Z]/.test(text[i])) {
      let enWord = '';
      let j = i;
      while (j < text.length && /[a-zA-Z]/.test(text[j])) {
        enWord += text[j];
        j++;
      }
      parts.push(<span key={key++}>{enWord}</span>);
      i = j;
      continue;
    }

    // Default char
    parts.push(<span key={key++}>{text[i]}</span>);
    i++;
  }

  return parts;
}

// ═══════════════════════════════════════════════════════════════
//  SPECIALIZED: Part-of-Speech Coloring (字典词典)
//  不同词性使用不同颜色
// ═══════════════════════════════════════════════════════════════

const POS_COLOR_MAP: Record<string, string> = {
  '基础词汇': 'text-cyan-400',
  '名词': 'text-violet-400',
  '情感': 'text-pink-400',
  '感知': 'text-sky-400',
  '形容词': 'text-emerald-400',
  '称谓': 'text-amber-400',
  '数字': 'text-yellow-400 font-mono',
  '基础': 'text-cyan-400',
  '动词': 'text-rose-400',
  '身体': 'text-teal-400',
  '抽象': 'text-indigo-400',
  '评价': 'text-orange-400',
  '自然': 'text-green-400',
  '短语': 'text-purple-400',
  '活动': 'text-fuchsia-400',
  '数学': 'text-yellow-300',
  '核心词汇': 'text-red-400 font-bold',
  '空间': 'text-blue-400',
  '物品': 'text-lime-400',
  '教育': 'text-sky-300',
  '职业': 'text-amber-300',
  '副词': 'text-rose-300',
  '语法': 'text-gray-400',
  '生物': 'text-emerald-300',
  '核心': 'text-red-400 font-bold',
};

export function posColorHighlight(input: string, posTag: string, options?: HighlightOptions): React.ReactNode[] {
  if (!input) return [];
  const colorClass = POS_COLOR_MAP[posTag] || 'text-nc-text';
  // Apply the base POS color, then run semantic highlight within
  const highlighted = semanticHighlight(input, options);
  // Wrap each part with the POS color as default
  return highlighted.map((part, idx) => {
    if (React.isValidElement(part) && (part.props as { className?: string })?.className) {
      // Already has semantic coloring - keep it
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    }
    // Apply POS color
    return <span key={idx} className={colorClass}>{part}</span>;
  });
}

// ═══════════════════════════════════════════════════════════════
//  SPECIALIZED: Random Color for Overload Active State
// ═══════════════════════════════════════════════════════════════

const OVERLOAD_COLORS = [
  'text-[var(--aurora-brand-red)]', 'text-[var(--aurora-brand-amber)]', 'text-[var(--aurora-brand-cyan)]', 'text-[var(--aurora-brand-violet)]',
  'text-[var(--aurora-brand-pink)]', 'text-[var(--aurora-brand-indigo)]', 'text-[var(--aurora-brand-rose)]', 'text-[var(--aurora-brand-teal)]',
  'text-[var(--aurora-brand-purple)]', 'text-[var(--aurora-brand-orange)]', 'text-[var(--aurora-brand-cyan-deep)]', 'text-[var(--aurora-brand-yellow)]',
];

export function getRandomOverloadColor(): string {
  return OVERLOAD_COLORS[Math.floor(Math.random() * OVERLOAD_COLORS.length)];
}

export function randomColorHighlight(input: string, seed?: number, options?: HighlightOptions): React.ReactNode[] {
  if (!input) return [];
  const text = localizeSource(input, options);
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Use seed or random
  let rng = seed ?? Math.floor(Math.random() * 10000);
  const nextColor = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return OVERLOAD_COLORS[rng % OVERLOAD_COLORS.length];
  };

  // Split by Chinese characters and color each segment
  let i = 0;
  let currentSegment = '';

  const flushSegment = () => {
    if (currentSegment) {
      const color = nextColor();
      parts.push(<span key={key++} className={color}>{currentSegment}</span>);
      currentSegment = '';
    }
  };

  while (i < text.length) {
    const ch = text[i];
    // Split at delimiters
    if (/[\s\n\r\t，。！？、；：""''（）【】《》]/.test(ch)) {
      flushSegment();
      parts.push(<span key={key++}>{ch}</span>);
    } else {
      // Group by type for color consistency
      if (currentSegment && /[\u4e00-\u9fff]/.test(ch) !== /[\u4e00-\u9fff]/.test(currentSegment[0])) {
        flushSegment();
      }
      currentSegment += ch;
    }
    i++;
  }
  flushSegment();

  return parts;
}

// Re-export pieceTierColorMap for backward compatibility
export const pieceTierColorMap = PIECE_KEYWORDS;

/**
 * Same rendering, but for narrative bodies (novel chapters, poems, essays):
 * the text is never swapped for English, so a paragraph can never end up
 * half-translated.
 */
export function semanticHighlightProse(input: string): React.ReactNode[] {
  return semanticHighlight(input, { prose: true });
}

// Re-export POS colors for Dictionary use
export { POS_COLOR_MAP };
