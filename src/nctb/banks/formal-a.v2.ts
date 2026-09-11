import { definePublicQuestion } from './helpers.ts';
import type { NctbPublicQuestion } from '../types.ts';

/**
 * formal-a 题库的第二批扩充题（v2 批次）。
 * 逻辑 bank 保持 'formal-a-v1' 不变（既有会话与存储兼容），
 * 本批题目在 questionBank.ts 中与 v1/foundation 合并后统一发布。
 */
const bankId = 'formal-a-v1' as const;

export const FORMAL_A_V2_QUESTIONS: readonly NctbPublicQuestion[] = [
  // ═══════════ pattern 模式识别 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-pattern-01', bankId, dimensionId: 'pattern', difficulty: 1, family: 'alternating-operator',
    stimulus: '规则：对数字交替执行“+2”和“×2”。起点：1。',
    prompt: '第 5 步之后的数是多少？',
    options: ['18', '32', '20', '16'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-02', bankId, dimensionId: 'pattern', difficulty: 2, family: 'rule-classification',
    stimulus: '序列甲：△ △ ○ △ △ ○ △ △\n序列乙：△ ○ △ ○ △ ○ △\n序列丙：△ ○ ○ △ ○ ○ △\n序列丁：△ △ △ ○ △ △ △',
    prompt: '哪条序列遵循“每两个实心后接一个空心”的周期？',
    options: ['序列乙', '序列丙', '序列丁', '序列甲'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 3, abstraction: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-03', bankId, dimensionId: 'pattern', difficulty: 3, family: 'matrix-relation',
    stimulus: '第一行：● ● ○\n第二行：○ ● ●\n第三行：？',
    prompt: '每一行都是上一行整体右移一格（末位循环到首位）。第三行是什么？',
    options: ['○ ○ ●', '● ● ○', '○ ● ○', '● ○ ●'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-04', bankId, dimensionId: 'pattern', difficulty: 4, family: 'periodic-overlay',
    stimulus: '第 1 行每 3 格循环：● ○ ○\n第 2 行每 4 格循环：● ● ○ ○\n第 3 行每一格 = 第 1、2 行同列同色时为 ●，否则为 ○。',
    prompt: '第 3 行前 6 格是什么？',
    options: ['● ○ ● ○ ○ ○', '● ● ○ ○ ○ ○', '● ○ ○ ● ○ ○', '○ ● ○ ● ○ ●'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-05', bankId, dimensionId: 'pattern', difficulty: 4, family: 'analogy-transform',
    stimulus: '示例：[◇ ◇ ●] → [● ◆ ◆]\n（◆ 是与 ◇ 互换后的花纹）\n待处理：[● ◇ ◇]',
    prompt: '示例同时使用“左右镜像”和“实心/花纹互换”。待处理序列的结果是什么？',
    options: ['● ◆ ◆', '◇ ◇ ●', '◆ ◆ ●', '◆ ◇ ●'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-06', bankId, dimensionId: 'pattern', difficulty: 5, family: 'recursive-pattern',
    stimulus: '规则：● → ●○；○ → ○。每一步同时替换所有符号。起点：● ●。',
    prompt: '完成三步替换后，串中共有多少个 ○？',
    options: ['4', '6', '5', '8'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-07', bankId, dimensionId: 'pattern', difficulty: 5, family: 'rule-classification',
    stimulus: '规则 1：任意相邻两格不同色。\n规则 2：○ 必须恰好出现在第 2、4 格。\n甲：● ○ ● ○\n乙：○ ● ○ ●\n丙：● ○ ○ ●\n丁：● ○ ● ●',
    prompt: '哪一行同时满足两条规则？',
    options: ['甲', '乙', '丙', '丁'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, ruleSwitches: 2, distractorSimilarity: 4 },
  }),

  // ═══════════ memory 工作记忆 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-memory-01', bankId, dimensionId: 'memory', difficulty: 1, family: 'backward-span', kind: 'memory',
    stimulus: '山 · 河 · 林 · 田', revealMs: 3_400,
    prompt: '刚才的序列倒过来是什么？',
    options: ['田 · 林 · 河 · 山', '山 · 河 · 林 · 田', '田 · 河 · 林 · 山', '林 · 田 · 山 · 河'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-02', bankId, dimensionId: 'memory', difficulty: 2, family: 'forward-span', kind: 'memory',
    stimulus: '月 · 雪 · 灯 · 纸 · 钟 · 桥', revealMs: 4_200,
    prompt: '哪一项与刚才的顺序完全相同？',
    options: ['月 · 灯 · 雪 · 纸 · 钟 · 桥', '钟 · 纸 · 灯 · 雪 · 月 · 桥', '月 · 雪 · 灯 · 纸 · 钟 · 桥', '月 · 雪 · 纸 · 灯 · 钟 · 桥'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-03', bankId, dimensionId: 'memory', difficulty: 3, family: 'ordered-recall', kind: 'memory',
    stimulus: '卡片按此顺序出现：蓝 – 黄 – 红 – 白', revealMs: 4_500,
    prompt: '“白”之前出现的两张卡片按顺序是什么？',
    options: ['红 – 黄', '黄 – 红', '蓝 – 红', '红 – 白'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-04', bankId, dimensionId: 'memory', difficulty: 3, family: 'n-back-match', kind: 'memory',
    stimulus: '逐个出现：K M K M M R M R', revealMs: 5_200,
    prompt: '从第 3 个开始，有几个字符与它前面第 2 个字符相同？',
    options: ['2', '1', '3', '4'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-05', bankId, dimensionId: 'memory', difficulty: 4, family: 'sequence-transformation', kind: 'memory',
    stimulus: '初始：晨 – 午 – 夜\n操作 1：把首项移到末尾\n操作 2：整串倒序\n操作 3：把当前末项替换为“昏”', revealMs: 5_600,
    prompt: '三次操作后的顺序是什么？',
    options: ['昏 – 夜 – 晨', '晨 – 昏 – 夜', '夜 – 晨 – 昏', '晨 – 夜 – 昏'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 5, ruleSwitches: 3, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-06', bankId, dimensionId: 'memory', difficulty: 4, family: 'binding-memory', kind: 'memory',
    stimulus: 'J—枫   P—井   V—灯   N—桥', revealMs: 5_000,
    prompt: '与“井”配对的字母和与“灯”配对的字母分别是什么？',
    options: ['V 和 P', 'P 和 V', 'J 和 N', 'P 和 N'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 4, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-07', bankId, dimensionId: 'memory', difficulty: 5, family: 'interference-memory', kind: 'memory',
    stimulus: '目标：云—3，桥—8，灯—5\n干扰：云—8，桥—5，灯—3', revealMs: 6_200,
    prompt: '目标列表中“云”和“桥”分别配对什么数字？',
    options: ['8 和 5', '8 和 3', '5 和 3', '3 和 8'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 5, distractorSimilarity: 5, stimulusComplexity: 5 },
  }),

  // ═══════════ space 空间推理 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-space-01', bankId, dimensionId: 'space', difficulty: 1, family: 'grid-movement',
    stimulus: '机器人在 (1,1)，面朝上。指令：右转，前进 2 格。',
    prompt: '终点坐标是什么？',
    options: ['(1,3)', '(3,1)', '(-1,1)', '(3,3)'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-02', bankId, dimensionId: 'space', difficulty: 2, family: 'spatial-relation',
    stimulus: '房间布局：门在南墙，窗在北墙，桌子在房间正中，椅子在桌子的北侧。有人背对门站立。',
    prompt: '此时椅子在桌子的哪一侧？',
    options: ['桌子靠近门的一侧', '桌子的左侧', '桌子远离门的一侧', '桌子的右侧'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, abstraction: 2, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-03', bankId, dimensionId: 'space', difficulty: 3, family: 'object-transform',
    stimulus: '一个箭头指向 3 点钟方向。先让它绕自身逆时针旋转 90°，再让它绕屏幕中心顺时针旋转 90°。',
    prompt: '最终箭头指向几点钟方向？',
    options: ['12 点钟', '6 点钟', '9 点钟', '3 点钟'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-04', bankId, dimensionId: 'space', difficulty: 3, family: 'viewpoint-transform',
    stimulus: '小船从河口出发沿直线向东行驶，船长面朝行进方向。桥在船的左侧。',
    prompt: '桥在船行驶路线的哪一侧（以路线方向为准）？',
    options: ['南侧', '东侧', '西侧', '北侧'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-05', bankId, dimensionId: 'space', difficulty: 4, family: 'mental-rotation',
    stimulus: 'L 形三格坐标：(0,0)、(0,1)、(1,0)。先绕原点旋转 180°，再沿水平轴镜像。',
    prompt: '变换后的三个坐标是哪一组？',
    options: ['(0,0)、(0,1)、(-1,0)', '(0,0)、(0,-1)、(1,0)', '(0,0)、(1,0)、(0,-1)', '(0,0)、(-1,0)、(0,-1)'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-06', bankId, dimensionId: 'space', difficulty: 4, family: 'path-integration',
    stimulus: '面朝东。前进 3 格；左转前进 2 格；左转前进 3 格；右转前进 1 格。',
    prompt: '终点相对起点在哪里？',
    options: ['正北 3 格', '正西 3 格', '正北 2 格', '回到起点'],
    profile: { reasoningSteps: 4, workingMemoryLoad: 4, distractorSimilarity: 3, ruleSwitches: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-07', bankId, dimensionId: 'space', difficulty: 5, family: 'paper-folding',
    stimulus: '一条 1×4 纸带（格号 1–4）。先沿 2 与 3 之间向右对折（3 翻面压在 2 上，4 翻面压在 1 上）。再在原 4 号格位置的顶层打一个孔、在原 1 号格位置的顶层打一个孔，每个孔都穿透该层及它压着的那一层。',
    prompt: '展开后哪些格有孔？',
    options: ['1 与 4', '2 与 3', '所有四格', '1、2 与 4'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, stimulusComplexity: 5 },
  }),

  // ═══════════ quantity 数量关系 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-quantity-01', bankId, dimensionId: 'quantity', difficulty: 2, family: 'magnitude-estimation',
    prompt: '一个水龙头每分钟流出的水可以装满 4 个同样的大碗。装满一个浴缸大约需要 30 碗的水。水龙头大约要开多久？',
    options: ['约 12 分钟', '约 4 分钟', '约 8 分钟', '约 30 分钟'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-02', bankId, dimensionId: 'quantity', difficulty: 3, family: 'resource-balance',
    stimulus: '营地有 24 人，每人每天需要 2 份口粮。现有口粮 96 份。又来了一支 8 人的小队，口粮总量不变。',
    prompt: '现在全部人员每天每人最多能精确均分到几份口粮？',
    options: ['2', '3', '4', '2.5'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-03', bankId, dimensionId: 'quantity', difficulty: 3, family: 'arithmetic-model',
    prompt: '复印店收费：前 20 张每张 0.5 元，超过部分每张 0.3 元。打印 50 张需要多少钱？',
    options: ['25 元', '19 元', '15 元', '17 元'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-04', bankId, dimensionId: 'quantity', difficulty: 4, family: 'quantitative-transform',
    stimulus: '兑换关系：2 枚铜贝 = 3 枚陶贝；4 枚陶贝 = 1 枚玉贝。',
    prompt: '16 枚铜贝与多少枚玉贝等值？',
    options: ['6', '8', '12', '4'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-05', bankId, dimensionId: 'quantity', difficulty: 4, family: 'relative-quantity',
    prompt: '甲的收入比乙高 25%，乙的收入比丙低 20%。甲与丙相比怎样？',
    options: ['甲与丙相等', '甲比丙多 5%', '甲比丙少 5%', '无法比较'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-06', bankId, dimensionId: 'quantity', difficulty: 5, family: 'proportional-comparison',
    prompt: '甲队 5 天完成 3 项同类任务，乙队 7 天完成 4 项同类任务。若速度不变，按“每项任务平均耗时”比较，谁更快？',
    options: ['乙队更快', '两队一样快', '无法比较', '甲队更快'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-07', bankId, dimensionId: 'quantity', difficulty: 2, family: 'ratio-scaling',
    prompt: '调一种颜料需要红漆与蓝漆按 3:5 混合。现有红漆 9 升，蓝漆足够多。最多能调出多少升这种颜料？',
    options: ['15 升', '20 升', '24 升', '12 升'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),

  // ═══════════ language 语言推理 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-language-01', bankId, dimensionId: 'language', difficulty: 1, family: 'verbal-analogy',
    prompt: '“笔”对于“写字”，相当于“锅”对于什么？',
    options: ['做饭', '厨房', '盘子', '火'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 1, abstraction: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-02', bankId, dimensionId: 'language', difficulty: 2, family: 'conditional-language',
    prompt: '如果明天下雨，运动会就改到体育馆。现在运动会没有改到体育馆。哪项必然成立？',
    options: ['明天一定下雨', '明天没有下雨', '运动会改期了', '体育馆有别的活动'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-03', bankId, dimensionId: 'language', difficulty: 3, family: 'semantic-inference',
    prompt: '公告说：“图书馆只在周三和周五对公众开放。”今天是周四。只根据公告，哪项必然成立？',
    options: ['今天图书馆对公众开放', '今天图书馆不对公众开放', '公告有误', '周四有预约才能进入'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, abstraction: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-04', bankId, dimensionId: 'language', difficulty: 4, family: 'quantifier-scope',
    prompt: '“没有一个不认识小周的人。”这句话表示什么？',
    options: ['没有人认识小周', '小周不认识任何人', '所有人都认识小周', '有些人不认识小周'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-05', bankId, dimensionId: 'language', difficulty: 5, family: 'instruction-comprehension',
    stimulus: '规则 1：只有佩戴徽章，才能进入机房。\n规则 2：若机房内有人，则大门解锁。\n现状：大门没有解锁。',
    prompt: '只根据规则与现状，哪项必然成立？',
    options: ['每个人都佩戴了徽章', '大门已经损坏', '机房里现在没有人', '佩戴徽章的人都能进入'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, distractorSimilarity: 5 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-06', bankId, dimensionId: 'language', difficulty: 3, family: 'ambiguity-resolution',
    prompt: '“小安遇见小北时，他正在浇花。”只根据这句话，“他”一定指谁？',
    options: ['小安', '小北', '两人', '无法唯一确定'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-07', bankId, dimensionId: 'language', difficulty: 3, family: 'verbal-relation',
    prompt: '下列哪一组词的关系与“车轮—汽车”相同？',
    options: ['方向盘—驾驶', '车窗—玻璃', '轮胎—橡胶', '机翼—飞机'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 3 },
  }),

  // ═══════════ attention 注意控制 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-attention-01', bankId, dimensionId: 'attention', difficulty: 1, family: 'sustained-target',
    stimulus: '目标：▲（实心三角），出现即响应。\n序列：○ ● ▲ ○ ▲ ●',
    prompt: '目标出现了几次？',
    options: ['2', '1', '3', '4'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, distractorSimilarity: 2, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-02', bankId, dimensionId: 'attention', difficulty: 2, family: 'conjunction-detection',
    stimulus: '只对“实心 + 圆形”的图形响应（三角形不算圆形）：\n○（空心圆） ●（实心圆） ▲（实心三角） △（空心三角） ● △ ○ ▲',
    prompt: '应该响应的项目有几个？',
    options: ['2', '3', '1', '4'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 3, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-03', bankId, dimensionId: 'attention', difficulty: 3, family: 'go-no-go',
    stimulus: '规则：出现方块 ■ 就按键；但如果方块带点（■•），则不按。其他形状不按。\n序列：■ ▲ ■• ● ■ ■• ▲ ■',
    prompt: '总共应该按几次键？',
    options: ['2', '3', '4', '5'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-04', bankId, dimensionId: 'attention', difficulty: 4, family: 'rule-switching',
    stimulus: '规则：字母行按“元音写 1，辅音写 0”；数字行按“奇数写 1，偶数写 0”。\n行 1（字母）：K A M E\n行 2（数字）：7 4 9 2\n行 3（字母）：B U T O\n行 4（数字）：3 8 6 5',
    prompt: '四行得到的 1 的总数是多少？',
    options: ['6', '7', '9', '8'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 4, ruleSwitches: 4, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-05', bankId, dimensionId: 'attention', difficulty: 5, family: 'flanker-interference',
    stimulus: '规则：只按中央箭头的方向反应，两侧箭头可以相反；含 # 的行不反应。\n行 1：＜ ＞ ＞ ＞ ＜\n行 2：＞ ＜ ＜ ＜ ＞\n行 3：＜ ＞ ＜ ＞ ＜#\n行 4：＞ ＜ ＜ ＞ ＜',
    prompt: '哪一行要求“向右”反应？',
    options: ['行 2', '行 3', '行 1', '行 4'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 5, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-06', bankId, dimensionId: 'attention', difficulty: 3, family: 'selective-search',
    stimulus: '表格（3 行）：\n行 1：▲ ■ ●\n行 2：● ▲ ■\n行 3：■ ● ▲\n规则：只统计“实心方块”，但排在三角形右边的实心方块不算。',
    prompt: '按规则统计，实心方块有几个？',
    options: ['2', '1', '3', '0'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 3, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-07', bankId, dimensionId: 'attention', difficulty: 4, family: 'sustained-target',
    stimulus: '目标：连续两个相同的符号（从头开始每两个一组，不重叠）。\n序列：○ ○ ● ▲ ▲ ● ● □ □ □',
    prompt: '“连续两个相同符号”的组出现了几次？',
    options: ['2', '4', '5', '3'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 4, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),

  // ═══════════ speed 速度与准确 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-speed-01', bankId, dimensionId: 'speed', difficulty: 2, family: 'symbol-matching',
    stimulus: '◆2   ●7   ▲5   ●7   ◆9   ▲3',
    prompt: '哪组“符号+数字”的组合出现了两次？',
    options: ['◆2', '●7', '▲5', '◆9'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-02', bankId, dimensionId: 'speed', difficulty: 5, family: 'feature-scan',
    stimulus: 'R4S   T8T   M2N   K6K   J3L   W5W   Y9Z',
    prompt: '这些三字符组里，第一个和最后一个字符不一样的有几组？',
    options: ['4', '3', '2', '5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 5, stimulusComplexity: 5 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-03', bankId, dimensionId: 'speed', difficulty: 3, family: 'visual-code-match',
    stimulus: '编码：▲=1，●=2，■=3\n▲●■/123   ●▲■/231   ■●▲/312   ▲▲●/112',
    prompt: '符号与数字编码完全匹配的有几组？',
    options: ['1', '2', '3', '4'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 3, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-04', bankId, dimensionId: 'speed', difficulty: 4, family: 'rapid-classification',
    stimulus: '3B   8E   1C   6A   9D   4F',
    prompt: '以奇数开头、且字母在 A–D 范围内的项目有几个？',
    options: ['2', '4', '3', '1'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 3, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-05', bankId, dimensionId: 'speed', difficulty: 1, family: 'rapid-same-different',
    stimulus: 'X3/X3   M8/M9   P5/P5   T2/T7   B6/B6',
    prompt: '左右完全相同的配对有几组？',
    options: ['2', '4', '3', '5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-06', bankId, dimensionId: 'speed', difficulty: 2, family: 'visual-comparison',
    stimulus: '目标：K7F2',
    prompt: '哪一项与目标完全相同？',
    options: ['K7F2', 'K7F3', 'KTF2', 'Q7F2'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, distractorSimilarity: 5, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-07', bankId, dimensionId: 'speed', difficulty: 4, family: 'symbol-matching',
    stimulus: '◇5   ◎5   ◇6   ◎6   ◇5',
    prompt: '哪一组是“符号与数字都相同”的重复组？',
    options: ['◎5', '◇6', '◎6', '◇5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),

  // ═══════════ causality 因果推演 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-causality-01', bankId, dimensionId: 'causality', difficulty: 1, family: 'causal-graph',
    stimulus: '开关接通则灯亮。蜂鸣器只有在灯亮时才会响。现在灯没有亮。',
    prompt: '对蜂鸣器最合理的判断是？',
    options: ['一定没有响', '一定在响', '是否在响与灯无关', '只要开关接通就在响'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-02', bankId, dimensionId: 'causality', difficulty: 2, family: 'intervention-reasoning',
    prompt: '观察到：屋顶湿的时候，地面也湿。想检验地面湿是屋顶漏水导致的还是下雨导致的，最有效的做法是什么？',
    options: ['把屋顶修好（阻断屋顶漏水），再比较地面湿的情况', '记录更多屋顶湿的日子', '统计一年中地面湿的天数', '问邻居屋顶是否漏水'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-03', bankId, dimensionId: 'causality', difficulty: 3, family: 'confound-detection',
    prompt: '新咖啡机入驻后，办公室士气分数上升。同时办公室刚刚取消了加班制度。想评估咖啡机的作用，最关键的问题是什么？',
    options: ['咖啡机是什么品牌', '士气分数由谁统计', '取消加班与士气上升之间是否已被排除为替代原因', '咖啡机每天使用几次'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-04', bankId, dimensionId: 'causality', difficulty: 4, family: 'alternative-explanation',
    prompt: '一种植物在施用新肥后长得更高，但今年气温也更高。下列哪个发现最能支持“气温是主因”？',
    options: ['施肥越多长得越高', '施肥植物开花更多', '去年施肥的植物也长高了', '未施肥但处于同样高温的植物同样长高'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-05', bankId, dimensionId: 'causality', difficulty: 5, family: 'counterfactual',
    stimulus: '事实：原定路线不经过小镇的货车，因交通管制改道，经过小镇；小镇当天堵车。小镇平时不堵车，这批货车是当天唯一的异常车流。',
    prompt: '“如果没有交通管制，小镇当天不会堵车”这一反事实判断，依据是否充分？',
    options: ['不充分：无法确定货车会走哪条路', '充分：若不管制，这批货车不会经过小镇，且无其他异常车流', '充分：堵车一定与货车有关', '不充分：小镇的路况本来就时好时坏'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-06', bankId, dimensionId: 'causality', difficulty: 3, family: 'evidence-strength',
    prompt: '有人声称“听白噪音能提高专注度”。下列哪种证据最有力地支持这一说法？',
    options: ['很多人说听白噪音感觉更专注', '著名的科学家也听白噪音', '随机分组实验：听与不听的两组在专注任务上的成绩差异稳定出现', '专注度差的人更喜欢听白噪音'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-07', bankId, dimensionId: 'causality', difficulty: 4, family: 'necessary-sufficient',
    stimulus: '规则：只有通过体检，才能参加比赛；通过体检的人未必都能参加。现在某人参加了比赛。',
    prompt: '哪项必然成立？',
    options: ['这个人没通过体检', '所有通过体检的人都参赛', '体检结果无法确定', '这个人通过了体检'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),

  // ═══════════ planning 策略规划 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-planning-01', bankId, dimensionId: 'planning', difficulty: 1, family: 'goal-decomposition',
    prompt: '做三明治的步骤：A 取面包；B 涂酱；C 加馅料；D 合上面包。B、C 都必须在 A 之后、D 之前。哪种顺序一定可行？',
    options: ['A→B→C→D', 'B→A→C→D', 'A→D→B→C', 'D→C→B→A'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-02', bankId, dimensionId: 'planning', difficulty: 2, family: 'multi-step-sequencing',
    prompt: '五位评委依次试吃：3 号必须第一或第二个；1 号必须在 5 号之前；2 号最后一个。哪种顺序有效？',
    options: ['3–1–4–5–2', '4–3–1–2–5', '1–5–3–4–2', '3–5–4–1–2'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-03', bankId, dimensionId: 'planning', difficulty: 3, family: 'dependency-planning',
    stimulus: '任务：T1 需要材料甲；T2 需要材料乙；T3 需要 T1 和 T2 的成果。只有一辆运输车，每趟只能运一种材料。',
    prompt: '最省趟数的合理计划是什么？',
    options: ['1 趟：一次运齐两种材料', '3 趟：先运甲，做完 T1 再运乙', '2 趟：分别运甲和乙，随后依次完成 T1、T2、T3', '不用运输，直接做 T3'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 3, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-04', bankId, dimensionId: 'planning', difficulty: 3, family: 'constraint-planning',
    prompt: '三个展览各占一天（周一到周三）：油画展不能排在周一；摄影展必须紧接在雕塑展之后。哪种排法有效？',
    options: ['周一油画、周二雕塑、周三摄影', '周一雕塑、周二摄影、周三油画', '周一摄影、周二雕塑、周三油画', '周一雕塑、周二油画、周三摄影'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-05', bankId, dimensionId: 'planning', difficulty: 4, family: 'resource-planning',
    stimulus: '甲仓叉车每小时搬 40 箱，乙仓叉车每小时搬 25 箱，两车同时开始、不停歇。目标：共运出 260 箱。',
    prompt: '最少需要多少小时？',
    options: ['3', '5', '6', '4'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 3, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-06', bankId, dimensionId: 'planning', difficulty: 4, family: 'schedule-repair',
    stimulus: '原日程：9:00 采血 → 10:00 化验（需 1 小时）→ 11:30 出报告。化验机器故障 1 小时；采血样本可先冷藏；报告必须完成。',
    prompt: '最合理的新日程是？',
    options: ['取消化验，直接出报告', '等待维修，其他环节全部暂停', '按原时间采血并冷藏；机器修复后立即化验，其余顺延', '把采血推迟到 11:00，化验照原时间进行'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 3, distractorSimilarity: 4, ruleSwitches: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-07', bankId, dimensionId: 'planning', difficulty: 5, family: 'multi-step-sequencing',
    stimulus: '五个程序 P1–P5 在同一处理器上排队：P1 必须第一；P3 必须紧接在 P4 之后；P2 与 P5 不能相邻。',
    prompt: '哪种排队满足全部约束？',
    options: ['P1–P3–P4–P5–P2', 'P1–P2–P5–P4–P3', 'P4–P3–P1–P2–P5', 'P1–P2–P4–P3–P5'],
    profile: { reasoningSteps: 4, workingMemoryLoad: 5, abstraction: 4, ruleSwitches: 2, distractorSimilarity: 4 },
  }),

  // ═══════════ transfer 综合迁移 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-transfer-01', bankId, dimensionId: 'transfer', difficulty: 1, family: 'near-transfer',
    stimulus: '旧游戏：队列牌堆每轮把最前一张移到最后。新游戏：卡从左到右排成一排，最左端相当于队列最前端。',
    prompt: '在新游戏里照搬旧操作一次，结果是？',
    options: ['最右边的卡移到最左边', '两张卡交换', '最左边的卡移到最右边', '顺序不变'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-02', bankId, dimensionId: 'transfer', difficulty: 2, family: 'rule-transfer',
    prompt: '旧规则：教室里“先举手者先发言”。新环境：在线会议，发言靠“举手”按钮。最合理的对应做法是？',
    options: ['按按钮的时间先后作为发言顺序', '谁离屏幕近谁先说', '随机点名', '让声音最大的人先说'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-03', bankId, dimensionId: 'transfer', difficulty: 3, family: 'structural-analogy',
    prompt: '旧任务发现：两个部门各自维护一份互不一致的名单，导致核对失败——诊断是“缺少单一事实来源”。新任务：三台设备各自记录同一批库存，数字对不上。最相关的诊断是？',
    options: ['缺少统一的库存记录基准，各设备各自为政', '设备屏幕太小', '库存商品太多', '应该把三台设备全部换成新硬件'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-04', bankId, dimensionId: 'transfer', difficulty: 3, family: 'strategy-transfer',
    prompt: '旧任务中，“倒着从终点往回推”能快速解开只进不退的迷宫。新任务是一个必须逐步后退才能开启闸门的机关房。最合理的策略迁移是？',
    options: ['完全照搬旧迷宫的路线', '只在房间里来回走动碰运气', '放弃使用已有策略', '从目标状态倒推，先触发最后需要的机关'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-05', bankId, dimensionId: 'transfer', difficulty: 4, family: 'relational-mapping',
    prompt: '旧系统里“过滤器只放行合格包裹，退回的不合格品会被重新包装再试”。新系统是一条招聘流程。哪个映射保留了深层结构？',
    options: ['简历→包裹；面试→过滤器；入职→退回', '简历→包裹；初筛→过滤器；被拒简历修改后再投递→重新包装再试', 'HR→包裹；offer→过滤器', '把旧系统的物流时间复制给招聘流程'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 5, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-06', bankId, dimensionId: 'transfer', difficulty: 5, family: 'far-transfer',
    prompt: '旧领域：水库“汛前放水腾库容，汛末蓄水补亏空”能平滑洪峰。新领域：一个团队在项目淡季与旺季之间安排工作。哪种做法保留了同一深层策略？',
    options: ['把水库的具体水位数字抄给团队', '旺季把所有技术债一次清完', '淡季释放工程产能去消化积压，旺季集中产出，以时间换平稳', '淡季完全停止所有工程活动'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 5, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-07', bankId, dimensionId: 'transfer', difficulty: 4, family: 'boundary-aware-transfer',
    prompt: '旧任务：某排序算法在“数据基本有序”时反而更快，于是每次都先轻微打乱再排序。新任务：数据来源明确声明“几乎完全有序，但偶尔会有极端乱序值”。直接照搬旧策略的主要风险是什么？',
    options: ['没有风险：打乱总能提升速度', '轻微打乱能顺便修复极端乱序值', '新任务必须彻底放弃排序算法', '轻微打乱无助于处理极端乱序值，反而浪费一步'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, ruleSwitches: 2, distractorSimilarity: 4 },
  }),
];
