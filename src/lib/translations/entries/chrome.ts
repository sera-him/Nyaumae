// Chrome and section copy that is rendered *through* semanticHighlight (the
// per-character highlighter). Those strings never reach the DOM translator as
// whole sentences, so they must be resolvable by exact lookup at render time:
// footer quotations, section headings, portal kickers.

export const CHROME_TRANSLATIONS: Record<string, string> = {
  // ── Footer quotations (rendered line by line, split per glyph) ──
  '「AGI 来了，AGI 来了，': '"AGI is here, AGI is here,',
  '卷王走了，': 'the grind king is gone,',
  'tourist 依然在我之上，': 'tourist is still ranked above me,',
  '可这重要吗？这不重要——': "but does that matter? It doesn't —",
  '你会在乎别人的时刻表，': "would you care about someone else's timetable,",
  '背得比你更准吗？」': 'memorised more precisely than your own?"',
  '「残障未必可见，': '"Disability is not always visible,',
  '智力正常，': 'average intelligence',
  '也不等于所有功能正常；': 'does not mean every function works;',
  '不要急着判断品德，': "don't rush to judge someone's character,",
  '先去理解，': 'try to understand first',
  '一个人实际遇见的困难。」': 'the difficulties a person actually faces."',
  '「别急着用同一把尺子，': '"Don\'t measure everyone with the same ruler,',
  '丈量所有的人；': 'all in one sweep;',
  '有人走得快，': 'some walk fast,',
  '也有人需要慢一点。': 'others need to go slower.',
  '能按照自己的节奏走下去，': 'moving at your own pace',
  '本身也是一种抵达。」': 'is an arrival in itself."',
  '由意识编织': 'woven from consciousness',
  'AURORA ATLAS / 由意识编织': 'AURORA ATLAS / woven from consciousness',

  '读到': 'Read to',
  'CONTINUE READING / 继续阅读': 'CONTINUE READING',
  '还没有记录，从世界观开始': 'No history yet — start from the world overview.',
  '没有匹配的对话': 'No matching conversations',
  '正在准备全站搜索……': 'Preparing site-wide search…',
  '正在搜索全站内容': 'Searching the whole site',
  '正在载入全站索引': 'Loading the site-wide index',
  '故事、角色、设定、词典和游戏资料正在汇入同一个结果列表。':
    'Stories, characters, world settings, the dictionary and game notes are all feeding into one result list.',

  // ── Section headings ──
  // Labels the highlighter splits per character: without an exact key the
  // translator only ever sees single glyphs, so these need whole-string hits.
  '核心成员：': 'Core members:',
  '超级智能校规提案': 'Super-intelligence school-rule proposal',
  '国家统一招聘平台': 'National unified hiring platform',
  '国际代数日': 'International Algebra Day',
  '国际几何日': 'International Geometry Day',
  '雾岬自由市': 'Cape Fog Free City',
  '认知增强工具': 'Cognitive enhancement tools',
  '打造更好世界': 'Building a better world',
  '诗歌与碎片': 'Poems & fragments',
  '世界观详述': 'World settings in detail',
  '角色/网络': 'Characters / network',
  'Prime Focus & 未来线': 'Prime Focus & the future line',
  '碎片：降临': 'Fragment: descent',
  '碎片：id().val.exp.redir()?dif:dis': 'Fragment: id().val.exp.redir()?dif:dis',
  '夕兽与年兽': 'The dusk beast and the year beast',
  '收录故事': 'Collected stories',
  '米雅朋友圈': "Mia's circle",
  '17 种结果': '17 outcomes',
  '坏兔子（三个版本）': 'Bad rabbit (three versions)',
  '故事诗歌': 'Story poems',
  '荒诞叙事': 'Absurd narrative',
  '工资与零花钱': 'Wages & pocket money',
  '就这样把笔放下': 'Just put the pen down',
  '咪呀的愿望': "Miia's wish",
  'AGI 应许之地': 'The AGI promised land',
  '映射区块': 'Mapping blocks',
  '关于 Līlā 的分析': 'Notes on Līlā',
  '双轴模型：控制与不认可': 'Two-axis model: control and disapproval',
  '海岛实景记录': 'Island field records',
  '身高-体重模型曲线': 'Height–weight model curve',
};
