// Render-time zh-CN -> en for worldbuilding lore sections.
// Covers: WorldSettings, Organizations, QETSection, HyperCommunication,
// PacificIslands, WorldOverview, CharacterNetwork, Navigation (static only),
// PrimeFocus, ExtraStories.
//
// Terminology locked to the shipped site:
//   Zhehua School / Ke-Zhao-Zhen academy / von Neumann Class / Delansi / Miia /
//   Grownup Country / Heart Realm VR / QET·FSIII·AGI·ICPC / Lanxi Republic /
//   Misaki / Haiting Republic / Mirror-sea Republic.
export const BATCH5_LORE: Record<string, string> = {
  // ── CharacterNetwork ──
  "。每个节点既是独立意识体（角色），又是网络中的一个信号中继（网络节点）。「角色/网络」强调的不是\"谁认识谁\"，而是": '. Every node is both an independent mind (a character) and a signal relay in the network (a network node). “Characters / Network” stresses not “who knows whom” but',

  // ── PacificIslands ──
  "\"你们参与制造过我的身体，但从未拥有过我的现在。\"": "\"You helped build my body, but you have never owned my present.\"",
  "中国、日本、海庭共和国和镜海共和国没有立即承认它是一个国家，但都在数日内与雾岬建立了紧急联络渠道。国际航运公司重新接受雾岬港口签发的通行文件，银行继续处理它的结算，附近岛国则开始派遣观察人员。世界没有在一夜之间承认雾岬。世界只是逐渐发现：无论承认与否，这座只有几平方千米核心城区、不到二十万居民的城市，已经能够保护自己的天空、维持自己的秩序，并拒绝任何外部系统重新取得最高权限。": 'China, Japan, the Haiting Republic and the Mirror-sea Republic did not immediately recognise it as a country, but within days all opened emergency liaison channels with Misaki. International shipping lines once again accepted the passage documents issued by Misaki’s port, banks kept clearing its settlements, and nearby island states began sending observers. The world did not recognise Misaki overnight. The world only gradually discovered that, recognised or not, this city — just a few square kilometres of core district, under 200,000 residents — could already guard its own sky, keep its own order, and refuse to let any external system retake top-level access.',

  // ── Organizations: blind-interview recruitment reform ──
  "1. 先晒价（面试前）：企业必须提前公示《资质加分表》，明确每个证书/技能加多少分，全网公开，禁止暗箱操作。": '1. Show the price first (before the interview): employers must publish the *Qualification Bonus Table* in advance, stating exactly how many points each certificate or skill adds — open to the whole web, no backroom deals.',
  "2. 盲面（无身份）：面试仅限文字或变声通话，禁止透露性别、年龄、外貌。面试官只问技术问题，打出的分数仅代表“纯能力”。": '2. Blind interview (no identity): interviews are text or voice-changed calls only; revealing gender, age or appearance is forbidden. Interviewers ask only technical questions, and the score means “pure ability” alone.',
  "3. 后验资（面试后）：面试结束后，求职者再提交学历、证书等资质。平台自动核验真伪，并按公示的表格计算附加分。": '3. Verify credentials afterward (after the interview): once the interview ends, the applicant submits degrees, certificates and other qualifications. The platform verifies authenticity automatically and computes the bonus points from the published table.',
  "4. 总分定胜负：最终总分 = 面试能力分 + 资质加分。按分数排名录取，公开透明。": '4. The total score decides: final total = interview ability score + qualification bonus. Admission is ranked by score, open and transparent.',
  "核心铁律：面试时允许撒谎（因为技术问题答不出就露馅）；资质造假零容忍。一切只凭真本事和硬证书说话。": 'The iron rule: lying in the interview is allowed (because a wrong technical answer gives you away), but credential fraud has zero tolerance. Everything rests on real ability and hard certificates.',
  "先晒价·盲面·后验资，总分定胜负": 'Show price first · blind face · credentials after — the total score decides',
  "对于任意学生及其就读的学校，只要学生请求①不违法、②不笔试作弊、③不增加学校资源消耗、④不直接影响其他学生，那么监护人签字同意后，学校必须无条件执行，否则校长被超级智能秒开除。": 'For any student and their school, as long as the student’s request ① breaks no law, ② involves no written-exam cheating, ③ adds no resource cost to the school, and ④ does not directly affect other students, then once the guardian signs consent the school must comply unconditionally — otherwise the principal is instantly fired by the superintelligence.',
  "学生四不条件+监护人签字，学校必须执行，否则校长被超级智能秒开除": 'The student’s four “no” conditions plus the guardian’s signature — the school must comply, or the principal is instantly fired by the superintelligence.',
  "年预算：": 'Annual budget:',
  "师资：": 'Faculty:',
  "权力与知识的网络，驱动着这个世界的运转": 'A network of power and knowledge drives this world forward.',
  "在读": 'Enrolled',

  // ── WorldSettings ──
  "12 道互动题测出你的四维人格（获取/休息/努力/社交），判断牛属性还是猫属性，共 17 种结果": '12 interactive questions measure your four-dimensional personality (acquisition / rest / effort / socialising) to judge whether you are Ox-type or Cat-type — 17 possible results.',
  "包括灾难性伤害原则、权利不可侵犯原则、道德普遍化、责任连带原则、自由化约原则等 6 条核心准则": 'including the catastrophic-harm principle, the inviolability of rights, moral universalisation, joint liability, the principle of liberal commitment, and others — six core tenets in all.',
  "笔试": 'Written',
  "笔试 500 分 + 机试 500 分，最高 65536 人报考，笔试通过率 256/65536，机试通过率 16/256，含 ICPC 赛制 Penalty 规则": 'Written round 500 + machine round 500; up to 65,536 applicants; written pass rate 256/65,536; machine pass rate 16/256, with ICPC-style Penalty rules.',
  "机试": 'Practical',
  "公平随机土地分配制度（修订稿）": 'Fair random land allocation system (revised draft)',
  "每个人拥有同样的、不可交易的土地竞争权重，可以自主选择土地；多人竞争时按照相对权重公开随机抽签。": 'Everyone holds the same, non-tradable land-competition weight and may choose land freely; where several compete, an open random draw is held by relative weight.',
  "亲缘距离公式 p₂r": 'Kinship-distance formula p₂r',
  "哲学原则": 'Philosophical principles',
  "再测一次": 'Retake the test',
  "世界观下已有不是二次元的VR游戏《复数域公主梦》，这部作品的女主林可梦（linkmo）是一名梦想成为公主的小镇做题家。但是其实她本来就是公主，是数电大魔王卡塔斯（Quartus）强行修改了世界观，利用分形将其映射到复数域世界观，扭曲了众人的认知。": 'The world already had a non-anime VR game, 《*Princess Dream of the Complex Plane*》. Its heroine Lin Kemeng (linkmo) is a small-town grind who dreams of being a princess. Yet she is already a princess; the Digital-Electro Demon King Quartus forcibly rewrote the worldbuilding, using fractals to map her onto the complex-plane worldview and warp everyone’s cognition.',
  "nyaumæ 是一名 2 年级学生。以下是这名学生提出的七条哲学原则。": 'nyaumæ is a grade-2 student. Below are the seven philosophical principles this student proposed.',
  "QET 详细规则": 'QET detailed rules',

  // ── QETSection ──
  "笔试上限": 'Written-round cap',
  "笔试通过": 'Passed the written round',
  "总分 1000 分，分为笔试（500 分）与机试（500 分）两部分。": 'Total score 1000 points, split into a written round (500) and a machine round (500).',
  "最终录取": 'Final admission',

  // ── HyperCommunication ──
  "寒暑假期间 HC 完全暂停。QET 考前两周及期末考试周暂停或缩短。": 'HC is fully suspended during winter and summer breaks, and paused or shortened in the two weeks before QET and during final-exam week.',
  "强制发言 · 无记录": 'Mandatory speak · no records',
  "秋季\"收敛\" · 春季\"发散\"": 'Autumn “converge” · Spring “diverge”',
  "全员在场 · 无学科庇护": 'Everyone present · no departmental shelter',

  // ── WorldOverview ──
  "节日": 'Festivals',
  "Neural Connection 是一个存在 12 亿人口的平行数字宇宙。哲华学校科照真学院与德澜思拓公司构成双核心驱动力，AGI 与意识的边界在此模糊。从冯·诺伊曼班的精英选拔到心界 VR 的沉浸式体验，每个意识体都在这个宇宙中寻找自己的神经频率。": 'Neural Connection is a parallel digital universe home to 1.2 billion people. The Ke-Zhao-Zhen academy of Zhehua School and Delansi Corporation form its dual core engines; here the boundary between AGI and consciousness blurs. From the elite selection of the von Neumann Class to the immersive experience of Heart Realm VR, every mind in this universe searches for its own neural frequency.',

  // ── PrimeFocus ──
  "汇率设定（2028）": 'Exchange-rate settings (2028)',

  // ── ExtraStories ──
  "Period 系列 · Corruption 0f Emotion · 更多叙事碎片": 'Period series · Corruption 0f Emotion · more narrative fragments',
};
