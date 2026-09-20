// Render-time zh-CN -> en for game boards (chess, fractal echo, city builder, cat machine, ...).
export const BATCH5_GAMES: Record<string, string> = {
  // ── FractalEcho ──
  "，橙方": ", orange ",
  "。蓝方受控子盘": ". Blue-controlled sub-boards ",
  "· 橙": "· orange ",
  "橙色": "Orange",
  "当前坐标": "Coordinate ",
  "根盘票数": "Root votes ",
  "规则图": "Rules map ",
  "次行动，蓝/橙各半；第 r 次行动方由": "moves, blue/orange split evenly; mover of move r is decided by ",
  "全场": "Whole field",
  "极速、轻度、中等、高强度分别取 8 / 16 / 32 / 64 次行动，都是同一条序列的前缀。第 r 次行动方由": "Turbo/light/medium/intense take 8 / 16 / 32 / 64 moves — all prefixes of one sequence. Mover of move r is decided by ",
  "子盘": "sub-boards",
  "AI 控制子盘": "AI-controlled sub-boards ",
  "AI色": "AI color ",
  "蓝色": "Blue",

  // ── CityBuilderGame ──
  "；\n        混合方案的成本正好落在两端之间，说明该定价主要在为“时间选择”而不是“距离”收费。": ";\n        the mixed plan's cost lands right between the two ends, showing this pricing mainly charges for the “time choice” rather than the “distance”.",
  "/秒 · 排名分": "/s · rank pts ",
  "+ 排名": "+ rank ",
  "5×5 地图中央是十二色市政厅，其余地块随三个时代分批开放。每城发展容量为 8 → 12 → 16 格；🔴基建达到 6、🤎人口达到 6 时各再增加 1 格，因此终局也必须取舍。1级建筑放在空地，高级建筑和地标在同色低一级建筑上原位升级。": "In the centre of the 5×5 map is the twelve-color city hall; the remaining tiles open in batches across three eras. Each city's development capacity is 8 → 12 → 16 tiles; when 🔴infrastructure reaches 6 and 🤎population reaches 6, +1 tile each, so the endgame still forces trade-offs. Level-1 buildings go on empty land; higher-level buildings and landmarks upgrade in place on a same-color, one-level-lower building.",
  "按 4 周估算：同样的通勤，错峰到低谷时段每月能省": "At 4 weeks per month: the same commute, shifted off-peak, saves ",
  "当前付出": "Paying ",
  "城排名分依次为": "City ranks resolve by ",
  "储备上限": "Reserve cap ",
  "付出颜色": "Colors paid",
  "计时、生产、施工与": "Clock, production, construction and ",
  "建筑入队时支付原色成本，完成后才增加永久属性。正交相邻且具有依赖关系的颜色会同时成长，🟣文化会放大邻接奖励。时间按所选局长等比缩放；基础有 2 个施工槽，🔴基建达到 6、10 时各增加 1 槽并持续缩短工期。": "Pay the original-color cost when a building enters the queue; permanent attributes are added only after completion. Orthogonally adjacent colors with dependencies grow together, and 🟣culture amplifies the adjacency bonus. Time scales proportionally with the chosen shift length; there are 2 construction slots to start, and at 🔴infrastructure 6 and 10 each adds 1 slot and keeps shortening the build time.",
  "默认三名 AI 分别偏向均衡规划、核心专业化和区域合作；增加 AI 时还会出现韧性路线。它们与玩家使用相同初始颜色、施工时间、事件信息与交换规则，不获得隐藏资源。AI 会先处理危机，再判断有效合作、交换和建设。": "The three default AIs lean toward balanced planning, core specialization, and regional cooperation; adding more AIs also unlocks the resilience route. They use the same starting colors, build times, event info, and exchange rules as the player, and get no hidden resources. AIs handle crises first, then judge effective cooperation, exchange, and construction.",
  "募资剩余": "Funding left ",
  "排名领先不会带来额外生产；落后城市会获得基础追赶增益，🩵民生会进一步放大它。末局不会再生成来不及结算的项目或事件；时间归零立即结算。总分相同时依次比较十二项属性总和、达到 6 的颜色数量，仍相同则共同第一。": "Leading in ranking brings no extra production; lagging cities get a basic catch-up bonus, and 🩵livelihood amplifies it further. The final round stops spawning projects or events too late to settle; when time hits zero everything settles immediately. On a tie in total score, compare the sum of the twelve attributes, then the number of colors that reached 6; still tied means shared first place.",
  "区域交换可把任意富余颜色换成任意紧缺颜色，🟡经济越高损耗越低。跨城项目要求至少两座城市各贡献总需求的 15%；完成后所有城市获得 0.1 项目色，合格成员再等额获得 0.7。🩷景区只放大临时储备，最高贡献者也只多获得临时储备，点击速度不能换来更多永久分。": "Regional exchanges swap any surplus color for any shortage color; the higher 🟡economy, the lower the loss. Cross-city projects require at least two cities each committing 15% of the total demand; on completion all cities gain 0.1 project color, and qualifying members gain an equal extra 0.7. 🩷scenic only amplifies temporary reserves — even the top contributor gains only extra temporary reserves; click speed cannot buy more permanent points.",
  "至少两城各投入": "At least two cities each commit ",
  "时代": "Era",

  // ── ChessGameBoard ──
  "☠️ 下毒": "☠️ Poison",
  "✨ 合成星舰": "✨ Synthesize starship",
  "💥 自爆": "💥 Self-destruct",
  "🔓 发动破译": "🔓 Start decrypt",
  "🦢 变为鸵鸟 O": "🦢 Become ostrich O",
  "🙏 献祭": "🙏 Sacrifice ",
  "白方（大写字母）": "White (uppercase letters)",
  "保持鸵鸟": "Keep ostrich",
  "变回皇后": "Revert to queen",
  "兵/象已到达对方底线，请选择升变目标": "Pawn/elephant reached the opponent's back rank — choose the promotion piece",
  "撤销": "Undo",
  "黑方（小写字母）": "Black (lowercase letters)",
  "确认自爆": "Confirm self-destruct",
  "鸵鸟已移动，是否变回皇后？变回后猫娘将同步变回王。": "The ostrich has moved. Revert to queen? Reverting also turns the catgirl back into a king.",
  "选择要部署的非关键棋子": "Select a non-key piece to deploy",

  // ── ChessRules ──
  "12×12 棋盘 · 融合国际象棋、中国象棋及原创机制": "12×12 board · blends international chess, Chinese chess and original mechanics",
  "奶酪规则 —— 当老鼠踏入有奶酪的格子时": "Cheese rule — when a mouse steps onto a cheese square",
  "女巫制作橙奶酪或黑奶酪前需要献祭周围 8 格的一个己方 Z/IZ。除老鼠外的棋子踏入奶酪格会踩坏奶酪。": "Before the witch makes orange or black cheese, she must sacrifice one friendly Z/IZ in the surrounding 8 squares. Any piece other than a mouse stepping onto a cheese square spoils it.",

  // ── CatMachine ──
  "/9 只满意 ·": "/9 satisfied · ",
  "+呼噜": "+snore",
  "继续值班": "Back on duty ",
  "清空本机进度": "Clear local progress",

  // ── Problems ──
  "道题 ·": "items · ",
  "计算中...": "Calculating...",
  "清空重填": "Clear and refill",
  "烧脑挑战": "Brain-teaser challenge",
  "提交答案": "Submit answer",
  "提交后将基于你当前填写的答案计算生成二维码，无需全部填完；答案全部正确时才能得到有效的二维码。": "On submit, a QR code is generated from your current answers — you don't need to finish all blanks; only fully correct answers produce a valid QR code.",

  // ── NeuralEcho ──
  "/ 16 生长点 ·": "/ 16 growth points · ",
  "当前阶段 ·": "Phase · ",
  "克隆回声": "Clone echo ",
  "生长点": "growth point",
  "子枝": "branch",

  // ── ThreeHoles ──
  "· 每行 / 列 / 区": "· per row / col / zone",
  "本题有": "This puzzle has ",
  "个不可修改的题面线索：": " unmodifiable puzzle clues: ",
  "个已知排除；\n              它们已计入当前标记。": " known exclusions;\n              already counted in the current marks.",
  "结束并查看答案": "Finish and view answers",
  "在 n×n 草原上标出兔子洞。每行、每列和每个猞猁活动区都恰好有 k 个兔子洞，\n            且兔子洞之间不能相邻。": "Mark rabbit holes on an n×n grassland. Each row, each column, and each lynx territory must contain exactly k rabbit holes,\n            and no two rabbit holes may be adjacent.",

  // ── NeuralClash ──
  "100节点 · 666突触 · 平衡差异": "100 nodes · 666 synapses · balance delta",
  "核 ·": "cores · ",
  "核 +": "core + ",
  "节点 +": "node + ",
  "突触网络 #": "Synapse network #",

  // ── SkillTicTacToe ──
  "传统三子棋 × 概率机制 × SP 技能系统。每个格子有独立的成功概率，落子需要运气与策略！": "Classic tic-tac-toe × probability mechanics × SP skill system. Every cell has its own success probability; placing a piece needs both luck and strategy!",
  "夺取": "Seize",
  "概率三子棋": "Probabilistic tic-tac-toe",
  "买断": "Buyout",
  "遗忘": "Forget",
  "职业商店": "Career shop",

  // ── SpaceGame ──
  "返回主界面": "Back to main menu",
  "继续战斗": "Keep fighting",
  "进入战场": "Enter the battlefield",
  "识别敌人弱点，在十把武器间高速调度。每一次正确切枪都会累积 Weapon Flow，直到点燃 Stellar Flow。": "Identify enemy weak points and cycle among ten weapons at high speed. Every correct weapon swap builds Weapon Flow, until you ignite Stellar Flow.",
  "先用武器 A 命中，切至武器 B 后在 1.5 秒内造成弱点伤害，即可累积 Flow。": "First land a hit with weapon A, then, after switching to weapon B, deal weakness damage within 1.5 seconds to build Flow.",

  // ── BoxDuel ──
  "• 打开": "• Opening ",
  "• 每局参赛者仅有": "• Each game the contestant has only ",
  "| 箱子:": "| Box: ",
  "总净收益:": "Total net gain: ",

  // ── Super24 ──
  "🔍 精确答案:": "🔍 Exact answer: ",
  "1. 系统给出": "1. The system draws ",
  "6. 根号内不能为负数，可用": "6. No negatives under the root; you may use ",
  "目标值:": "Target: ",

  // ── HeroCompact ──
  "创作者": "Created by ",
  "进入游戏": "Enter the game",
  "探索角色": "Explore characters",
  "阅读故事": "Read stories",

  // ── CatMouseGame ──
  "· 距离": "· distance",
  "回合 · 起距": "Round · start distance",
  "回合 · 终局距离": "Round · final distance",

  // ── HellMaze ──
  "开始挑战": "Start challenge",
  "已收集": "Collected ",
  "个填空": " blanks",
};
