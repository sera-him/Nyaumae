export interface Character {
  id: string;
  name: string;
  pinyin?: string;
  alias: string;
  birthYear: number;
  birthday?: string;
  age: number;
  group: 'mia' | 'zhihua' | 'impact' | 'delan' | 'giant' | 'other';
  groupLabel: string;
  title?: string;
  bio: string;
  extra?: string[];
  /** 与公元年同时展示的巨人国纪年；公元 2026 年 = 巨人国 169 年。 */
  giantBirthYear?: number;
  /** 年龄或出生年由正文线索推定，而非精确设定。 */
  approximateAge?: boolean;
  profile?: Array<{ label: string; value: string }>;
  fsiii?: number;
  color: string;
}

const charactersInSourceOrder: Character[] = [
  {
    id: 'high-school-student', name: '陈予安', alias: 'high school student', birthYear: 2009, age: 17,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '来自现实世界的高中生',
    bio: '来自现实世界的高中生，只是出现在《大人国的小女孩》的故事中，并不来自大人国。谨慎、安静，遇到异常事件时仍会尽力帮助别人。',
    profile: [
      { label: '现实年龄', value: '17 岁' },
      { label: '身份', value: '高中生' },
      { label: '所属', value: '大人国的小女孩阵营（故事关联）' },
    ],
    color: 'from-slate-400 to-blue-500',
  },
  {
    id: 'linmo', name: '苏珞', alias: 'linmo', birthYear: 2010, age: 16,
    group: 'other', groupLabel: '其他', title: '黑发少年',
    bio: '背着书包的安静少年，观察细致，习惯把复杂的情绪藏在平静的目光之后。',
    profile: [{ label: '身份', value: '学生' }, { label: '阵营', value: '其他' }],
    color: 'from-slate-500 to-zinc-700',
  },
  {
    id: 'gpt', name: 'GPT', alias: 'gpt', birthYear: 2026, age: 0,
    group: 'other', groupLabel: '其他', title: '白发 AI 意识体',
    bio: '以白发少女形象出现的 AI 意识体，擅长整理知识、拆解问题，并把复杂目标转译成可执行的下一步。',
    profile: [{ label: '身份', value: 'AI' }, { label: '阵营', value: '其他' }],
    color: 'from-white to-cyan-400',
  },
  {
    id: 'wangshu', name: '小芽', alias: 'wangshu', birthYear: 2018, age: 8,
    group: 'other', groupLabel: '其他', title: '二年级小小探索家',
    bio: '喜欢和 AI 一起学习的二年级学生，总把新奇的问题写进自己的小本子里。',
    profile: [{ label: '年级', value: '小学二年级' }, { label: '阵营', value: '其他' }],
    color: 'from-violet-400 to-pink-400',
  },
  {
    id: 'neon', name: '霓虹', alias: 'neon', birthYear: 2002, age: 24,
    group: 'other', groupLabel: '其他', title: '赛博朋克游侠',
    bio: '穿行于霓虹都市的赛博朋克游侠，擅长情报追踪与近身防御，行动目标始终保持神秘。',
    profile: [{ label: '身份', value: '赛博朋克游侠' }, { label: '阵营', value: '其他' }],
    color: 'from-red-500 to-fuchsia-500',
  },
  {
    id: 'changfeng', name: '长风', alias: 'changfeng', birthYear: 1991, giantBirthYear: 134, age: 35,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '爸比 · 巨人国居民',
    bio: '小满和小谷的父亲，初夏的丈夫。体型高挑修长，按照统一尺度换算后属于偏瘦但健康的成年男性。',
    profile: [
      { label: '巨人国身高', value: '21 m' },
      { label: '巨人国体重', value: '108.9 t' },
      { label: '普通人等效身高', value: '175 cm' },
      { label: '普通人等效体重', value: '63 kg' },
      { label: '等效体型', value: '高挑偏瘦' },
    ],
    extra: ['纪年换算：公元 1991 年 = 巨人国 134 年'],
    color: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'chuxia', name: '初夏', alias: 'chuxia', birthYear: 1993, giantBirthYear: 136, age: 33,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '妈妈 · 巨人国居民',
    bio: '小满和小谷的母亲，长风的妻子。体型纤细；在小满关于家乡的记忆里，她总会准备草莓吐司、热牛奶和切好的苹果。',
    profile: [
      { label: '巨人国身高', value: '20 m' },
      { label: '巨人国体重', value: '86.4 t' },
      { label: '普通人等效身高', value: '166.7 cm' },
      { label: '普通人等效体重', value: '50 kg' },
      { label: '等效体型', value: '纤细型' },
    ],
    extra: ['纪年换算：公元 1993 年 = 巨人国 136 年'],
    color: 'from-rose-400 to-pink-500',
  },
  {
    id: 'xiaoman', name: '小满', alias: 'xiaoman', birthYear: 2017, giantBirthYear: 160, age: 9,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '第 9 代 · 巨人国女孩',
    bio: '从巨人国意外来到东海市的女孩。黑色长发、琥珀色眼睛，身穿浅蓝色连衣裙；敏感、善良，也会努力避免伤害脚下这个过于小巧的世界。喵呜初见时从低处仰视，将她目测为“十八九米”。',
    profile: [
      { label: '巨人国真实身高', value: '17 m' },
      { label: '巨人国体重', value: '58.8 t' },
      { label: '普通人等效身高', value: '141.7 cm' },
      { label: '普通人等效体重', value: '34 kg' },
      { label: '等效体型', value: '高挑偏瘦' },
      { label: '喵呜初见估算', value: '18–19 m（仰视目测）' },
    ],
    extra: ['纪年换算：公元 2017 年 = 巨人国 160 年', '统一换算：身高 ÷ 12；体重 ÷ 1728'],
    color: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'xiaohe', name: '小禾', alias: 'xiaohe', birthYear: 2020, giantBirthYear: 163, age: 6,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '小谷的双胞胎妹妹 · 巨人国女孩',
    bio: '小谷的双胞胎妹妹。有神经发育障碍，需要像喵呜一样按时服药；虽然发育稍缓，但眼神里总带着温柔的好奇。喜欢和小谷一起躲在窗帘后，听姐姐用舌头顶那颗摇晃的牙。',
    profile: [
      { label: '巨人国身高', value: '13 m' },
      { label: '巨人国体重', value: '28.5 t' },
      { label: '普通人等效身高', value: '108.3 cm' },
      { label: '普通人等效体重', value: '16.5 kg' },
      { label: '等效体型', value: '正常偏纤细' },
    ],
    extra: ['纪年换算：公元 2020 年 = 巨人国 163 年'],
    color: 'from-amber-300 to-orange-400',
  },
  {
    id: 'xiaogu', name: '小谷', alias: 'xiaogu', birthYear: 2020, giantBirthYear: 163, age: 6,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '小满的妹妹 · 巨人国女孩',
    bio: '小满明显更年幼的妹妹。正在换牙，会躲在窗帘后用舌头顶那颗摇晃的牙；小满谈起她时，总会自然地放松下来。',
    profile: [
      { label: '巨人国身高', value: '14 m' },
      { label: '巨人国体重', value: '34.6 t' },
      { label: '普通人等效身高', value: '116.7 cm' },
      { label: '普通人等效体重', value: '20 kg' },
      { label: '等效体型', value: '正常偏纤细' },
    ],
    extra: ['纪年换算：公元 2020 年 = 巨人国 163 年'],
    color: 'from-amber-300 to-orange-400',
  },
  {
    id: 'miaowu', name: '喵呜', alias: 'miaowu', birthYear: 2018, giantBirthYear: 161, age: 8, approximateAge: true,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '小满在普通世界遇见的第一个朋友',
    bio: '东海市二年级小学生，身高不到 1.3 米，有神经发育障碍，需要按时服药。说话直接、观察细致，不轻易以“正常”或“异常”评判别人；她接纳小满，也成为小满适应普通世界时最重要的朋友。',
    profile: [
      { label: '现实世界身高', value: '< 1.3 m' },
      { label: '年级', value: '小学二年级' },
      { label: '年龄依据', value: '正文未明示；按年级暂定约 8 岁' },
    ],
    extra: ['推定纪年：约公元 2018 年 = 约巨人国 161 年'],
    color: 'from-violet-400 to-fuchsia-500',
  },
  {
    id: 'xiulan', name: '秀兰奶奶', alias: 'xiulan', birthYear: 1969, giantBirthYear: 112, age: 57,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '周济的母亲 · 黄豆的主人',
    bio: '住在东海市幸福小区的老人，务实、泼辣又热心。她给小满找来窗帘、床单和夏凉被，又架起大锅做饭；面对儿子周济的破产与自责，她用一盘蛋炒饭和朴素的话把他重新拉回生活。',
    profile: [
      { label: '现实世界身份', value: '东海市居民' },
      { label: '家庭关系', value: '周济的母亲' },
      { label: '宠物', value: '黄豆（土狗）' },
    ],
    extra: ['纪年换算：公元 1969 年 = 巨人国 112 年'],
    color: 'from-orange-400 to-rose-500',
  },
  {
    id: 'zhouji', name: '周济', alias: 'zhouji', birthYear: 1994, giantBirthYear: 137, age: 32,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '绿芯半导体驱动工程师',
    bio: '在绿芯半导体担任了六年显卡底层驱动工程师，参与支撑 AI 对齐基础设施。公司事故令他的积蓄与期权几乎归零，也使他陷入强烈自责；母亲秀兰和小满的经历让他重新尝试面对问题。',
    profile: [
      { label: '现实世界职业', value: '半导体驱动工程师' },
      { label: '从业时间', value: '6 年' },
      { label: '家庭关系', value: '秀兰奶奶的儿子' },
    ],
    extra: ['纪年换算：公元 1994 年 = 巨人国 137 年'],
    color: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 'delivery-rider', name: '外卖员', alias: 'delivery rider', birthYear: 1996, giantBirthYear: 139, age: 30, approximateAge: true,
    group: 'giant', groupLabel: '《大人国的小女孩》', title: '热心的东海外卖骑手',
    bio: '最初在路口目睹小满出现，随后主动拿出防水布和野餐垫，并多次骑车跑腿采购食材。他以前做过后厨，熟悉灶具、采购和处理食材，是临时互助小队里行动力很强的一员。正文没有公布他的姓名与精确年龄。',
    profile: [
      { label: '现实世界职业', value: '外卖骑手；曾做后厨' },
      { label: '姓名', value: '正文未公布' },
      { label: '年龄依据', value: '正文未明示；人物档案暂定约 30 岁' },
    ],
    extra: ['推定纪年：约公元 1996 年 = 约巨人国 139 年'],
    color: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'mimi', name: '米迷', alias: 'mimi', birthYear: 2024, age: 2,
    group: 'mia', groupLabel: 'M/I/A 家族',
    bio: '女孩，Neural Connection 世界观中最年幼的意识体。',
    fsiii: 94, color: 'from-pink-400 to-rose-400',
  },
  {
    id: 'qicheng', name: '棋程', alias: 'qicheng', birthYear: 2019, age: 7,
    group: 'mia', groupLabel: 'M/I/A 家族',
    bio: '中国象棋、国际象棋、围棋，他擅长并热爱一切棋类游戏。理科成绩名列前茅。曾在由米雅举行的、和咪呀、Mia、米娅的数学比赛中获得和咪呀并列第一名。',
    fsiii: 138, color: 'from-amber-400 to-orange-400',
  },
  {
    id: 'miia', name: '咪呀', pinyin: 'mī yā', alias: 'miia', birthYear: 2017, age: 9,
    group: 'mia', groupLabel: 'M/I/A 家族', title: '冯·诺伊曼班候选人',
    bio: '与 Mia 常被合称为"小小咪"。挑战 Codeforces 上高难度的算法题。于 2019 年创造角色 mia³。期待加入哲华学校科照真学院冯·诺伊曼班，研究 QuaAGI。',
    extra: ['FSIII 排名并列第 3（226）'], fsiii: 226, color: 'from-violet-400 to-purple-400',
  },
  {
    id: 'mia', name: 'Mia', alias: 'mia', birthYear: 2017, age: 9,
    group: 'mia', groupLabel: 'M/I/A 家族',
    bio: '与咪呀常被合称为"小小咪"。喜欢绘画和音乐，经常弹奏钢琴。',
    fsiii: 109, color: 'from-fuchsia-400 to-pink-400',
  },
  {
    id: 'mxy', name: '墨璇玥.iv', alias: 'mxy.iv', birthYear: 2016, birthday: '8.20', age: 10,
    group: 'zhihua', groupLabel: '哲华学校',
    bio: '长发缀满银白珠饰，常着青碧云纹襦裙，手持白梅团扇。',
    extra: ['2026.2.20 时：1.47m，32kg', '与咪呀 p₂r=1.498，与 Mia p₂r=0.970，与米娅 p₂r=0.970', '住在银润豪景，餐费30元，牛奶水果15元，零花钱30元', 'ID：330206201608201648（NC下1641）'],
    fsiii: 136, color: 'from-cyan-400 to-teal-400',
  },
  {
    id: 'dora', name: '朵拉·卡可拉', alias: 'dora calcla', birthYear: 2016, birthday: '1.3', age: 10,
    group: 'other', groupLabel: '其他',
    bio: '莱尼尔·塞佛·卡可拉的妹妹，早产 20 天。在哥哥的影响下喜欢密码，设定密码 "c+ti"。',
    color: 'from-rose-400 to-red-400', fsiii: 115,
  },
  {
    id: 'alice', name: '爱丽丝', alias: 'alice', birthYear: 2015, birthday: '10.11', age: 11,
    group: 'other', groupLabel: '其他',
    bio: '异瞳猫娘萝莉公主，手持玩具魔法棒和童话书《Nymphilia》，常与猫咪在沙滩奔跑玩耍。猫尾可以摘下来。',
    fsiii: 92, color: 'from-sky-400 to-blue-400',
  },
  {
    id: 'cola', name: '可乐', alias: 'cola', birthYear: 2015, age: 11,
    group: 'other', groupLabel: '其他',
    bio: '一线城市中产阶级的学生，成绩优异、多才多艺，人生轨迹清晰明确。',
    fsiii: 103, color: 'from-indigo-400 to-violet-400',
  },
  {
    id: 'amiya', name: '米娅', alias: 'amiya', birthYear: 2014, age: 12,
    group: 'mia', groupLabel: 'M/I/A 家族',
    bio: '活力四射，充满想象力，爱好绘画。对米雅充满崇拜和向往，渴望快些长大，是集体活动的积极发起者。',
    fsiii: 109, color: 'from-pink-400 to-rose-400',
  },
  {
    id: 'mao', name: '墨奥幂.fc', alias: 'mao.fc', birthYear: 2012, age: 14,
    group: 'zhihua', groupLabel: '哲华学校',
    bio: '神秘的墨色家猫，眼睛如同翡翠，能够穿越梦境。他的额头上有一个月亮印记，行动优雅而敏捷。',
    fsiii: 93, color: 'from-emerald-400 to-green-400',
  },
  {
    id: 'linear', name: '莱尼尔·塞佛·卡可拉', alias: 'linear cypher calcla', birthYear: 2011, birthday: '1.28', age: 15,
    group: 'other', groupLabel: '其他', title: '国际代数日诞辰',
    bio: '热爱数学和密码学，擅长解密。随身携带一本笔记本，封面上写着 "pred=2³|23"。',
    extra: ['坐标：29.2963°N, 118.6558°E'], fsiii: 165, color: 'from-amber-400 to-yellow-400',
  },
  {
    id: 'lila', name: 'Līlā', alias: 'lila', birthYear: 2011, birthday: '1.28', age: 15,
    group: 'other', groupLabel: '其他', title: '宇宙的秩序',
    bio: '声音。太吵。光。太亮。标签。扎。影子。在晃。杯子必须在那个位置。必须是那个杯子。她只会发一个音。li-la。像是叫自己的名字。像是确认自己还在。行为机械，有自己的小世界。秩序还是没有来。',
    extra: ['父母在 SNS 发帖找人"同居"'], fsiii: 226, color: 'from-slate-400 to-gray-400',
  },
  {
    id: 'linqian', name: '林浅', alias: 'lin qian', birthYear: 2010, age: 16,
    group: 'impact', groupLabel: '因派系',
    bio: '林深的女儿，因派的"编外小顾问"。性格更文艺内向，喜欢绘画和写诗。私下运营名为"心渊日志"的频道。',
    fsiii: 90, color: 'from-teal-400 to-emerald-400',
  },
  {
    id: 'haruka', name: '星野遥', alias: 'hoshino haruka', birthYear: 2008, age: 18,
    group: 'zhihua', groupLabel: '哲华学校', title: '观学院学生',
    bio: '来自日本的天才歌手，因家庭工作暂居中国，转学至哲华学校观学院。性格温和但极具专注力，与 Mia 因音乐结为好友。',
    fsiii: 114, color: 'from-cyan-400 to-sky-400',
  },
  {
    id: 'miacubic', name: 'mia³', alias: 'mia.cubic', birthYear: 2005, age: 21,
    group: 'mia', groupLabel: 'M/I/A 家族', title: '永恒 14 岁学生',
    bio: '咪呀在 2019 年创造的"自设"。永恒 14 岁学生，研究人工智能模型的可解释性与底层逻辑架构。',
    fsiii: 158, color: 'from-violet-400 to-indigo-400',
  },
  {
    id: 'ifchan', name: 'あいえふちゃん', alias: 'ifchan', birthYear: 2005, age: 21,
    group: 'other', groupLabel: '其他', title: '沐光计划发起人',
    bio: '身高 166cm / 体重 48kg。神经多样性特征。发起"沐光计划"。',
    fsiii: 180, color: 'from-fuchsia-400 to-purple-400',
  },
  {
    id: 'miya', name: '米雅', alias: 'miya', birthYear: 2004, age: 22,
    group: 'delan', groupLabel: '德澜思拓', title: '德澜思拓公司领导者',
    bio: '德澜思拓公司的年轻领导者，沉稳干练。',
    fsiii: 109, color: 'from-rose-400 to-pink-400',
  },
  {
    id: 'hamster', name: '哈姆诗', alias: 'hamster', birthYear: 1999, age: 27,
    group: 'impact', groupLabel: '因派系', title: '因派 CV（声优）',
    bio: '因派（Impact Inc.）的一名 CV，风格是憨憨和可爱。购买了因派 50ppm 的股份。年薪 18 万元。因派投资一亿美元，研发全国首款二次元 VR 游戏《心界》。',
    fsiii: 98, color: 'from-teal-400 to-cyan-400',
  },
  {
    id: 'nimfa', name: 'Nimfa', alias: 'nimfa', birthYear: 1988, age: 38,
    group: 'zhihua', groupLabel: '哲华学校', title: '冯·诺伊曼班教授',
    bio: '仙女，《Nymphilia》童话书主角原型，掌管自然和梦境。拥有透明的翅膀和花冠，出生于森林深处的永恒花园。墨问的妻子。年薪 27 万元。',
    extra: ['教授：Nimfa（85 后，构造出复杂度 2^Θ(√n)）'],
    fsiii: 144, color: 'from-green-400 to-emerald-400',
  },
  {
    id: 'nihilib', name: 'Nihilib', alias: 'nihilib', birthYear: 1988, age: 38,
    group: 'zhihua', groupLabel: '哲华学校', title: '巴别塔班教授',
    bio: '黑暗灵，掌管静谧与遗忘。形象是银发紫裙、手持怀表的少女。Nimfa 的"反面姊妹"，维持平衡。年薪 23 万元。',
    fsiii: 144, color: 'from-indigo-400 to-slate-400',
  },
  {
    id: 'linshen', name: '林深', alias: 'lin shen', birthYear: 1985, age: 41,
    group: 'impact', groupLabel: '因派系', title: '因派创始人',
    bio: '大学时代是动漫字幕组骨干、游戏 MOD 制作者、论坛版主。从二次元同人游戏社区转型为手游发行商，最终在 VR 概念兴起时创立"因派"，All in 下一代沉浸式体验。',
    extra: ['设备对比：5000cm³→500cm³，5999元→138元'], fsiii: 120, color: 'from-cyan-400 to-teal-400',
  },
  {
    id: 'zhaozhao', name: '赵召', alias: 'zhaozhao', birthYear: 1981, age: 45,
    group: 'zhihua', groupLabel: '哲华学校', title: '科照真学院院长',
    bio: '哲华学校科照真学院院长，一位气质儒雅、目光深邃的学者。科学前沿的探索者。年薪 40 万元。',
    extra: ['赵召院士证明了核心结论"任意复杂度 ω(n) 的 QuaAGI 训练算法均存在，即边际效益可下降得任意缓慢。"'],
    fsiii: 123, color: 'from-violet-400 to-purple-400',
  },
  {
    id: 'mowen', name: '墨问', alias: 'mo wen', birthYear: 1978, age: 48,
    group: 'zhihua', groupLabel: '哲华学校', title: '巴别塔班班主任',
    bio: '墨奥幂.fc 和墨璇玥.iv 的父亲，哲华学校科照真学院巴别塔班班主任兼教授。研究方向是"生物意识"。话极少，常年待在实验室。和德澜思拓公司合作。年薪 27 万元。',
    extra: ['1978/1983（取决于参考系）', '桌上总有一杯冷掉的茶，杯子上画着一匹骏马'], fsiii: 177, color: 'from-blue-400 to-indigo-400',
  },
];

const sourceOrder = new Map(charactersInSourceOrder.map((character, index) => [character.id, index]));

/** 角色总览按现实年龄递增；同龄角色保持原有顺序，小满在 9 岁组最后。 */
export const characters: Character[] = [...charactersInSourceOrder].sort((a, b) => {
  const ageOrder = a.age - b.age;
  if (ageOrder !== 0) return ageOrder;

  if (a.age === 9 && b.age === 9) {
    if (a.id === 'xiaoman') return 1;
    if (b.id === 'xiaoman') return -1;
  }

  return (sourceOrder.get(a.id) ?? 0) - (sourceOrder.get(b.id) ?? 0);
});

export const zeroChar = {
  id: 'zero', name: '零', alias: 'zero', birthYear: 2026, birthday: '1.11', age: 0,
  group: 'impact' as const, groupLabel: '因派系', title: '《心界》中的 AI',
  bio: '2026 年 2 月 20 日，《心界》迎来第一个活动"沐诚艺柏"，"零"作为任务 NPC 出现。',
  color: 'from-white to-gray-300',
};
