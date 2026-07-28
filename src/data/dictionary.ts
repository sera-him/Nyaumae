export interface DictionaryEntry {
  word: string;
  meaning: string;
  tags?: string[];
}

export const dictionary: DictionaryEntry[] = [
  { word: 'AAA', meaning: '痛', tags: ['基础词汇'] },
  { word: 'aa', meaning: '啊', tags: ['基础词汇'] },
  { word: 'ai', meaning: '爱', tags: ['基础词汇'] },
  { word: 'al', meaning: '都', tags: ['基础词汇'] },
  { word: 'aleid', meaning: '万花筒', tags: ['名词'] },
  { word: 'api', meaning: '开心', tags: ['情感'] },
  { word: 'ark', meaning: '好黑', tags: ['感知'] },
  { word: 'asai', meaning: '温柔', tags: ['形容词'] },
  { word: 'at', meaning: '在', tags: ['基础词汇'] },
  { word: 'aua', meaning: '阿姨', tags: ['称谓'] },
  { word: 'ba', meaning: '8', tags: ['数字'] },
  { word: 'baba', meaning: '爸爸', tags: ['称谓'] },
  { word: 'bee', meaning: '被', tags: ['基础词汇'] },
  { word: 'bi', meaning: '不', tags: ['基础词汇'] },
  { word: 'bii', meaning: '分别', tags: ['基础词汇'] },
  { word: 'bice-om', meaning: '变成', tags: ['动词'] },
  { word: 'bu', meaning: '却', tags: ['基础词汇'] },
  { word: 'can', meaning: '看', tags: ['动作'] },
  { word: 'cane', meaning: '眼睛', tags: ['身体'] },
  { word: 'canen', meaning: '才能', tags: ['抽象'] },
  { word: 'chad', meaning: '差', tags: ['评价'] },
  { word: 'chii', meaning: '嘴巴', tags: ['身体'] },
  { word: 'chi', meaning: '语言', tags: ['抽象'] },
  { word: 'chowa', meaning: '选我', tags: ['短语'] },
  { word: 'chre', meaning: '树', tags: ['自然'] },
  { word: 'cip-su', meaning: '夏令营', tags: ['活动'] },
  { word: 'com', meaning: '来、到来', tags: ['动词'] },
  { word: 'da', meaning: '零和', tags: ['数学'] },
  { word: 'dadi', meaning: '同时有合作和竞争；舞蹈', tags: ['核心词汇'] },
  { word: 'dait', meaning: '等待', tags: ['动词'] },
  { word: 'dart-thi', meaning: '脏东西', tags: ['名词'] },
  { word: 'defi', meaning: '一定', tags: ['副词'] },
  { word: 'deg', meaning: '退化', tags: ['动词'] },
  { word: 'dele', meaning: '删掉', tags: ['动词'] },
  { word: 'desi', meaning: '愿望、心愿', tags: ['抽象'] },
  { word: 'di', meaning: '竞争', tags: ['抽象'] },
  { word: 'dla', meaning: '地方', tags: ['空间'] },
  { word: 'do', meaning: '给', tags: ['动词'] },
  { word: 'dot', meaning: '顶点', tags: ['数学'] },
  { word: 'duo', meaning: '脚', tags: ['身体'] },
  { word: 'eaw', meaning: '东西', tags: ['基础词汇'] },
  { word: 'ed', meaning: '了', tags: ['基础词汇'] },
  { word: 'eds', meaning: '边', tags: ['空间'] },
  { word: 'end', meaning: '和', tags: ['基础词汇'] },
  { word: 'eri', meaning: '2', tags: ['数字'] },
  { word: 'esi', meaning: '兄弟姐妹', tags: ['称谓'] },
  { word: 'fa', meaning: '花', tags: ['自然'] },
  { word: 'fine', meaning: '结束', tags: ['动词'] },
  { word: 'fire', meaning: '生气', tags: ['情感'] },
  { word: 'foley', meaning: '沿着', tags: ['空间'] },
  { word: 'gab', meaning: '上班', tags: ['活动'] },
  { word: 'gab-sapi', meaning: '工人', tags: ['职业'] },
  { word: 'gali', meaning: '发条', tags: ['物品'] },
  { word: 'good', meaning: '关', tags: ['基础词汇'] },
  { word: 'grade', meaning: '年级', tags: ['教育'] },
  { word: 'gudu', meaning: '渴', tags: ['感知'] },
  { word: 'gulu', meaning: '饿', tags: ['感知'] },
  { word: 'hao', meaning: '好', tags: ['评价'] },
  { word: 'has', meaning: '有', tags: ['基础词汇'] },
  { word: 'hawai', meaning: '害怕', tags: ['情感'] },
  { word: 'hednod', meaning: '点头', tags: ['动作'] },
  { word: 'hit', meaning: '恨', tags: ['情感'] },
  { word: 'homoc', meaning: '回家', tags: ['空间'] },
  { word: 'iao', meaning: '要', tags: ['基础词汇'] },
  { word: 'ike', meaning: '如……般', tags: ['语法'] },
  { word: 'ikes', meaning: '一样', tags: ['语法'] },
  { word: 'iiai', meaning: '土、土里', tags: ['自然'] },
  { word: 'iiai-play-eaw', meaning: '两栖动物', tags: ['生物'] },
  { word: 'i', meaning: '1', tags: ['数字'] },
  { word: 'in', meaning: '着', tags: ['基础词汇'] },
  { word: 'inase', meaning: '因为', tags: ['语法'] },
  { word: 'ish', meaning: '是', tags: ['基础词汇'] },
  { word: 'isia', meaning: '吗', tags: ['语法'] },
  { word: 'iter', meaning: '眼泪', tags: ['身体'] },
  { word: 'itio', meaning: '明明', tags: ['基础词汇'] },
  { word: 'iu:', meaning: '9', tags: ['数字'] },
  { word: 'ium', meaning: '游戏、博弈', tags: ['抽象'] },
  { word: 'ioina', meaning: '永远', tags: ['时间'] },
  { word: 'izh', meaning: '一直', tags: ['时间'] },
  { word: 'kili', meaning: '笑', tags: ['情感'] },
  { word: 'kochi', meaning: '孩子', tags: ['称谓'] },
  { word: 'kodachi', meaning: '好孩子', tags: ['称谓'] },
  { word: 'kosapi', meaning: '亲生孩子', tags: ['称谓'] },
  { word: 'kui', meaning: '7', tags: ['数字'] },
  { word: 'les', meaning: '数字', tags: ['抽象'] },
  { word: 'liki', meaning: '年', tags: ['时间'] },
  { word: 'lili', meaning: '香草', tags: ['自然'] },
  { word: 'lina', meaning: '线', tags: ['空间'] },
  { word: 'lini', meaning: '直', tags: ['空间'] },
  { word: 'live', meaning: '肺', tags: ['身体'] },
  { word: 'loh', meaning: '环', tags: ['物品'] },
  { word: 'love', meaning: '心', tags: ['情感'] },
  { word: 'lumin', meaning: '魔法棒', tags: ['物品'] },
  { word: 'luma', meaning: '月光、融合', tags: ['自然'] },
  { word: 'ma-dart', meaning: '弄脏', tags: ['动作'] },
  { word: 'mama', meaning: '妈妈', tags: ['称谓'] },
  { word: 'mak', meaning: '把', tags: ['基础词汇'] },
  { word: 'mae', meaning: '猫', tags: ['动物'] },
  { word: 'may', meaning: '怎么', tags: ['语法'] },
  { word: 'me', meaning: '见', tags: ['动作'] },
  { word: 'mecia', meaning: '门票', tags: ['物品'] },
  { word: 'mi+', meaning: '中间（前缀）', tags: ['语法'] },
  { word: 'miia', meaning: '中午', tags: ['时间'] },
  { word: 'misir', meaning: '认识', tags: ['动词'] },
  { word: 'moeia', meaning: '萌芽', tags: ['自然'] },
  { word: 'n+', meaning: '后一个（前缀）', tags: ['语法'] },
  { word: 'nami', meaning: '大家', tags: ['称谓'] },
  { word: 'ne', meaning: '呢', tags: ['语法'] },
  { word: 'need', meaning: '需要', tags: ['基础词汇'] },
  { word: 'netia', meaning: '明天', tags: ['时间'] },
  { word: 'nere', meaning: '哪里', tags: ['空间'] },
  { word: 'nesi', meaning: '弟弟妹妹', tags: ['称谓'] },
  { word: 'nia', meaning: '晚上', tags: ['时间'] },
  { word: 'nomat', meaning: '没关系', tags: ['短语'] },
  { word: 'oiiai', meaning: '埋', tags: ['动作'] },
  { word: 'oni', meaning: '只要', tags: ['语法'] },
  { word: 'onion', meaning: '只能', tags: ['语法'] },
  { word: 'p+', meaning: '前一个（前缀）', tags: ['语法'] },
  { word: 'pai', meaning: '手', tags: ['身体'] },
  { word: 'pat', meaning: '摸', tags: ['动作'] },
  { word: 'pei', meaning: '开、打开水龙头', tags: ['动作'] },
  { word: 'pes', meaning: '现在', tags: ['时间'] },
  { word: 'pesi', meaning: '哥哥姐姐', tags: ['称谓'] },
  { word: 'pilt', meaning: '可怜', tags: ['评价'] },
  { word: 'pipir', meaning: '纸', tags: ['物品'] },
  { word: 'pia', meaning: '早上', tags: ['时间'] },
  { word: 'pitia', meaning: '昨天', tags: ['时间'] },
  { word: 'plii', meaning: '求', tags: ['动作'] },
  { word: 'play', meaning: '水', tags: ['自然'] },
  { word: 'play-bi-eaw', meaning: '水生哺乳动物', tags: ['生物'] },
  { word: 'play-eaw', meaning: '鱼', tags: ['生物'] },
  { word: 'pr-apium', meaning: '游乐园', tags: ['地点'] },
  { word: 'rad', meaning: '读', tags: ['动作'] },
  { word: 'rad-kochi', meaning: '童话', tags: ['文化'] },
  { word: 'rapid', meaning: '很快', tags: ['时间'] },
  { word: 'ray', meaning: '雨', tags: ['自然'] },
  { word: 'redo', meaning: '还给', tags: ['动作'] },
  { word: 'ru', meaning: '全部', tags: ['基础词汇'] },
  { word: 'roo', meaning: '红色', tags: ['颜色'] },
  { word: 'rosmie', meaning: '绚烂', tags: ['形容词'] },
  { word: 'sab', meaning: '上学', tags: ['活动'] },
  { word: 'sadi', meaning: '伤心', tags: ['情感'] },
  { word: 'sadii', meaning: '难过', tags: ['情感'] },
  { word: 'saki', meaning: '世界', tags: ['抽象'] },
  { word: 'salu', meaning: '月（时间）', tags: ['时间'] },
  { word: 'san', meaning: '3', tags: ['数字'] },
  { word: 'sapi', meaning: '人', tags: ['基础词汇'] },
  { word: 'sepia', meaning: '小时', tags: ['时间'] },
  { word: 'secio', meaning: '秒', tags: ['时间'] },
  { word: 'sesia', meaning: '分钟', tags: ['时间'] },
  { word: 'she', meaning: '说', tags: ['动作'] },
  { word: 'shi', meaning: '亲爱的', tags: ['称谓'] },
  { word: 'si', meaning: '消失；4', tags: ['基础词汇'] },
  { word: 'sio', meaning: '合作', tags: ['抽象'] },
  { word: 'siti', meaning: '星星', tags: ['自然'] },
  { word: 'slix', meaning: '休息', tags: ['活动'] },
  { word: 'sp-chm-bom', meaning: '鞭炮', tags: ['物品'] },
  { word: 'steptra', meaning: '踩到陷阱', tags: ['短语'] },
  { word: 'stli', meaning: '太阳', tags: ['自然'] },
  { word: 'st-vcc-gnd', meaning: '开天辟地', tags: ['短语', '特殊'] },
  { word: 'such', meaning: '这样', tags: ['基础词汇'] },
  { word: 'sum', meaning: '这么', tags: ['基础词汇'] },
  { word: 'te', meaning: '这', tags: ['基础词汇'] },
  { word: 'tia', meaning: '天', tags: ['时间'] },
  { word: 'tia-eaw', meaning: '鸟', tags: ['动物'] },
  { word: 'ticha', meaning: '老师', tags: ['称谓'] },
  { word: 'tine', meaning: '耳朵', tags: ['身体'] },
  { word: 'titi', meaning: '亮晶晶', tags: ['形容词'] },
  { word: 'to', meaning: '那', tags: ['基础词汇'] },
  { word: 'toa', meaning: '对', tags: ['基础词汇'] },
  { word: 'toere', meaning: '这里', tags: ['空间'] },
  { word: 'togi', meaning: '一起', tags: ['基础词汇'] },
  { word: 'tok', meaning: '丢', tags: ['动作'] },
  { word: 'uns', meaning: '叔叔', tags: ['称谓'] },
  { word: 'u', meaning: '5', tags: ['数字'] },
  { word: 'up', meaning: '上', tags: ['空间'] },
  { word: 'us', meaning: '用；只是', tags: ['基础词汇'] },
  { word: 'ü', meaning: '你', tags: ['称谓'] },
  { word: 'üdoua', meaning: '没收', tags: ['动作'] },
  { word: 'vew', meaning: '新', tags: ['形容词'] },
  { word: 'wa', meaning: '我', tags: ['称谓'] },
  { word: 'wabest', meaning: '我最棒', tags: ['短语'] },
  { word: 'wafin', meaning: '我最好', tags: ['短语'] },
  { word: 'wah', meaning: '什么', tags: ['语法'] },
  { word: 'waho', meaning: '多少', tags: ['语法'] },
  { word: 'wam', meaning: '为什么', tags: ['语法'] },
  { word: 'wania', meaning: '想、想要', tags: ['情感'] },
  { word: 'wed', meaning: '风', tags: ['自然'] },
  { word: 'wene', meaning: '鼻子', tags: ['身体'] },
  { word: 'wata', meaning: '光', tags: ['自然'] },
  { word: 'wi', meaning: '会', tags: ['基础词汇'] },
  { word: 'wol', meaning: '狗', tags: ['动物'] },
  { word: 'xap-ang-3', meaning: '三角形', tags: ['数学'] },
  { word: 'xapi', meaning: '谁', tags: ['语法'] },
  { word: 'yin', meaning: '0', tags: ['数字'] },
  { word: 'yo', meaning: '的', tags: ['基础词汇'] },
  { word: 'yoo', meaning: '地（副词标记）', tags: ['语法'] },
  { word: 'yu:', meaning: '6', tags: ['数字'] },
  { word: 'zak', meaning: '走', tags: ['动作'] },
  { word: "+'n", meaning: '个、条、根（量词后缀）', tags: ['语法'] },
  { word: "+s", meaning: '们（复数后缀）', tags: ['语法'] },
];

export const dictionaryExample = `Inase aa, te ish wa yo desi.
Te ish was yo 3'n sapi yo saki.
Iao izh at togi.
Wa us dait in，to 1 tia com ne.
To'n vew saki, wi com isia?
Wa us wania 1'n nami al api yo saki,
Ike aleid rosmie.
Sp-chm-bom · gab-sapi · stli · st-vcc-gnd.
Ioina at togi,
Tia tia me, bi she bii.
Wa bee tok nere ed?
Ish wa bi wania com yo dla.
Xap-ang-3 3'n eds 1èr3,
Dot up ish siti yo loh (twinkle twinkle).
Uns end aua do loh gali-up.
Loh asai yoo toa wa she: "Üdoua."
Pr-apium si ed (slix yo dla oiiai iiai).
Itio sum pilt (ark aa),
Bu bi sadi isia?
Sum chad yo dla (wa misir sapi bi at toere),
Üs bi sadii isia? (Wa wania homoc)
Foley lina zak.
Lina may si ed?
Wa ish kodachi, ne? meow～
Roo les
Mak pipir ma-dart ed.
Wa steptra ed.
Redo wa redo wa!
Wa onion ish kodachi (pat pat).
Cip-su mecia (wania · need · desi)
End ticha yo hednod (chowa · wabest · wafin)
Ish lumin.
Dele wa bi wania yo loh.
Plii plii ü, do wa, plii plii ü.
Dait wa 3 grade com yo tia,
Ü defi wi do wa, isia?
Defi iao do wa, hao isia?
Üs has 10000'n lumin ne!
Such, canen
Has lumin, canen
Ioina at togi (ove)
San-nin dake no sekai
Forever love!
Ioina bi deg,
Ioina bi fine,
Ioina bi good bye.
Moe littleXwish sYeep
Eterna 3-p life.
Ii ko da ne.
Nomat, rapid bi ark ed.
Can, moeia.
Nami al ikes ed aa.
Pes has 1415926535'n lumin.
Iter end dart-thi bice-om ed titi yo siti.
Nami bi need sab, bi need gab, oni rad rad-kochi.`;

export interface BilingualLine {
  dadi: string;
  chinese: string;
}

export const bilingualText: BilingualLine[] = [
  { dadi: "Inase aa, te ish wa yo desi.", chinese: "因为啊，这是我的愿望。" },
  { dadi: "Te ish was yo 3'n sapi yo saki.", chinese: "这是我们 3 个人的世界。" },
  { dadi: "Iao izh at togi.", chinese: "要一直在一起。" },
  { dadi: "Wa us dait in, to 1 tia com ne.", chinese: "我只是等待着，那一天的到来呢。" },
  { dadi: "To'n vew saki, wi com isia?", chinese: "那个新世界，会到来吗？" },
  { dadi: "Wa us wania 1'n nami al api yo saki,", chinese: "我想要一个大家都开心的世界，" },
  { dadi: "Ike aleid rosmie.", chinese: "如万花筒般绚烂。" },
  { dadi: "Sp-chm-bom · gab-sapi · stli · st-vcc-gnd.", chinese: "鞭炮 · 工人 · 太阳 · 开天辟地。" },
  { dadi: "Ioina at togi,", chinese: "永远在一起，" },
  { dadi: "Tia tia me, bi she bii.", chinese: "天天见，不说再见。" },
  { dadi: "Wa bee tok nere ed?", chinese: "我被带到哪里了？" },
  { dadi: "Ish wa bi wania com yo dla.", chinese: "是我不想来的地方。" },
  { dadi: "Xap-ang-3 3'n eds 1èr3,", chinese: "三角形 3 条边 1 2 3，" },
  { dadi: "Dot up ish siti yo loh (twinkle twinkle).", chinese: "顶点上是星星的环（twinkle twinkle）。" },
  { dadi: "Uns end aua do loh gali-up.", chinese: "叔叔阿姨给环上发条。" },
  { dadi: 'Loh asai yoo toa wa she: "Üdoua."', chinese: "环温柔地对我说：「没收」。" },
  { dadi: "Pr-apium si ed (slix yo dla oiiai iiai).", chinese: "游乐园消失了（休息的地方埋在土里）。" },
  { dadi: "Itio sum pilt (ark aa),", chinese: "明明这么可怜（好黑啊），" },
  { dadi: "Bu bi sadi isia?", chinese: "却不伤心吗？" },
  { dadi: "Sum chad yo dla (wa misir sapi bi at toere),", chinese: "这么差的地方（我认识的人不在这里），" },
  { dadi: "Üs bi sadii isia? (Wa wania homoc)", chinese: "你们不难过吗？（我想回家）" },
  { dadi: "Foley lina zak.", chinese: "沿着线走。" },
  { dadi: "Lina may si ed?", chinese: "线怎么消失了？" },
  { dadi: "Wa ish kodachi, ne? meow～", chinese: "我是好孩子吧？喵～" },
  { dadi: "Roo les", chinese: "红色数字。" },
  { dadi: "Mak pipir ma-dart ed.", chinese: "把纸弄脏了。" },
  { dadi: "Wa steptra ed.", chinese: "我踩到陷阱了。" },
  { dadi: "Redo wa redo wa!", chinese: "还给我还给我！" },
  { dadi: "Wa onion ish kodachi (pat pat).", chinese: "我只能是好孩子（摸摸）。" },
  { dadi: "Cip-su mecia (wania · need · desi)", chinese: "夏令营的门票（想要 · 需要 · 心愿）" },
  { dadi: "End ticha yo hednod (chowa · wabest · wafin)", chinese: "和老师的点头（选我 · 我最棒 · 我最好）" },
  { dadi: "Ish lumin.", chinese: "是魔法棒。" },
  { dadi: "Dele wa bi wania yo loh.", chinese: "把我不要的环删掉。" },
  { dadi: "Plii plii ü, do wa, plii plii ü.", chinese: "求求你，给我吧，求求你。" },
  { dadi: "Dait wa 3 grade com yo tia,", chinese: "等我 3 年级的时候，" },
  { dadi: "Ü defi wi do wa, isia?", chinese: "你一定会给我，对吧？" },
  { dadi: "Defi iao do wa, hao isia?", chinese: "你一定要给我，好吗？" },
  { dadi: "Üs has 10000'n lumin ne!", chinese: "你们有 10000 根魔法棒呢！" },
  { dadi: "Such, canen", chinese: "这样，才能" },
  { dadi: "Has lumin, canen", chinese: "有魔法棒，才能" },
  { dadi: "Ioina at togi (ove)", chinese: "永远在一起（ぉゔえ）" },
  { dadi: "San-nin dake no sekai", chinese: "三人世界。" },
  { dadi: "Forever love!", chinese: "Forever love!" },
  { dadi: "Ioina bi deg,", chinese: "永远不会退化，" },
  { dadi: "Ioina bi fine,", chinese: "永远不会结束，" },
  { dadi: "Ioina bi good bye.", chinese: "永远不会 good bye。" },
  { dadi: "Moe littleXwish sYeep", chinese: "Moe littleXwish sYeep，" },
  { dadi: "Eterna 3-p life.", chinese: "eterna 3-p life。" },
  { dadi: "Ii ko da ne.", chinese: "好孩子呢。" },
  { dadi: "Nomat, rapid bi ark ed.", chinese: "没关系，很快就不黑了。" },
  { dadi: "Can, moeia.", chinese: "看，萌芽。" },
  { dadi: "Nami al ikes ed aa.", chinese: "大家都一样了啊。" },
  { dadi: "Pes has 1415926535'n lumin.", chinese: "现在有 1415926535 根魔法棒。" },
  { dadi: "Iter end dart-thi bice-om ed titi yo siti.", chinese: "眼泪和脏东西，变成了亮晶晶的星星。" },
  { dadi: "Nami bi need sab, bi need gab, oni rad rad-kochi.", chinese: "大家不用上学，不用上班，只要读童话。" },
];

export const dictionaryTranslation = `因为啊，这是我的愿望。
这是我们 3 个人的世界。
要一直在一起。
我只是等待着，那一天的到来呢。
那个新世界，会到来吗？
我想要一个大家都开心的世界，
如万花筒般绚烂。
鞭炮·工人·太阳·开天辟地。
永远在一起，
天天见，不说再见。
我被带到哪里了？
是我不想来的地方。
三角形 3 条边 1 2 3，
顶点上是星星的环（twinkle twinkle）。
叔叔阿姨给环上发条。
环温柔地对我说："没收"。
游乐园消失了（休息的地方埋在土里）。
明明这么可怜（好黑啊），
却不伤心吗？
这么差的地方（我认识的人不在这里），
你们不难过吗？（我想回家）
沿着线走。
线怎么消失了？
我是好孩子吧？喵～
红色数字。
把纸弄脏了。
我踩到陷阱了。
还给我还给我！
我只能是好孩子（摸摸）。
夏令营的门票（想要 需要 心愿）
和老师的点头（选我 我最棒 我最好）
是魔法棒。
把我不要的环删掉。
求求你 给我吧 求你了。
等我 3 年级的时候，
你会给我的，对吧？
你一定要给我，好吗？
你们有 10000 根魔法棒呢！
这样，才能
有魔法棒，才能
永远在一起（ove）。
三人世界。
Forever love!
永远不会退化，
永远不会结束，
永远不会 good bye。
Moe littleXwish sYeep，
eterna 3-p life。
好孩子呢。
没关系，很快就不黑了。
看，萌芽。
大家都一样了啊。
现在有 1415926535 根魔法棒。
眼泪和脏东西，变成了亮晶晶的星星。
大家不用上学，不用上班，只要读童话。`;
