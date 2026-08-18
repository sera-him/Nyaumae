export type LandPolicyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'formula'; math: string; caption?: string }
  | { type: 'table'; columns: [string, string]; rows: Array<[string, string]> }
  | { type: 'choices'; items: Array<{ label: string; text: string }> };

export interface LandPolicySection {
  id: string;
  number: number;
  title: string;
  lead: string;
  blocks: LandPolicyBlock[];
}

export interface LandPolicyChapter {
  id: string;
  number: string;
  title: string;
  summary: string;
  sections: LandPolicySection[];
}

export const LAND_ALLOCATION_META = {
  title: '公平随机土地分配制度',
  edition: '修订稿',
  summary: '以土地公共所有为前提，让每个人拥有等额、不可交易的土地竞争权重；申请者自主选择土地，多人竞争时再由公开、可验证的随机机制决定使用者。',
  rightsNote: '土地使用权与建筑物所有权相互分离。土地不永久私有，但合理的建筑和长期投资应受到保护。',
  disclaimer: '本页展示的是制度设计草案，用于说明规则与讨论机制，不代表现行政策，也不构成法律意见。',
  conclusion: '人人拥有同样的选择能力，并自行决定把竞争权重投入哪里。',
};

export const LAND_ALLOCATION_PILLARS = [
  {
    title: '同样的起点',
    text: '每位符合资格的申请者每轮都只有一份相同的基础权重，金钱、身份和权力不能购买更高概率。',
  },
  {
    title: '自主的选择',
    text: '申请者自己决定申请哪些土地、如何分配权重；未中签时，系统不能擅自把人安排到别处。',
  },
  {
    title: '可验证的随机',
    text: '同一土地出现竞争时，按照相对权重抽签，并公开算法、锁定数据、随机种子与结果供社会复算。',
  },
];

export const LAND_ALLOCATION_STEPS = [
  { title: '公开地块', text: '先公布编号、位置、面积、用途、期限与全部规划限制。' },
  { title: '自由配置', text: '每个人把总量不超过 1 的权重分配给自己选择的地块。' },
  { title: '截止锁定', text: '申请期结束后生成不可篡改的快照，任何一方都不能再修改。' },
  { title: '抽签复算', text: '按相对权重随机分配，公开种子、结果和日志，允许独立复算。' },
];

export const LAND_ALLOCATION_CHAPTERS: LandPolicyChapter[] = [
  {
    id: 'foundation',
    number: '01',
    title: '公平的起点',
    summary: '先定义谁能参与、土地怎样公开，以及每个人拥有多少选择能力。',
    sections: [
      {
        id: 'basic-principles',
        number: 1,
        title: '基本原则',
        lead: '土地保持公共属性，个人获得的是有期限的使用权；所有合格申请者从同样的基础资格出发。',
        blocks: [
          {
            type: 'bullets',
            items: [
              '土地属于公共资源，不因个人使用而永久私有化。',
              '每个符合资格的人都拥有完全相同的基础土地申请资格。',
              '任何人都不能通过金钱、身份、权力或其他资源购买更高的分配概率。',
              '申请者自行选择想申请的土地；未中签时，系统不得擅自将其分配到其他城市或地点。',
              '多人申请同一土地时，按照各自投入的权重进行公开随机抽签。',
              '不同用途可以采用不同的面积折算系数，但不能因此给特定个人额外权重。',
              '土地使用权原则上有期限，不等同于土地所有权。',
            ],
          },
        ],
      },
      {
        id: 'land-division',
        number: 2,
        title: '土地划分与信息公开',
        lead: '土地先按用途划分为最小单元，也可以根据规划需要，把相邻单元组合为连续地块。',
        blocks: [
          {
            type: 'bullets',
            items: ['城市住宅用地', '商业用地', '工业用地', '农业用地', '公共设施用地', '自然保护用地'],
          },
          {
            type: 'paragraph',
            text: '土地单元可以细分到 1 平方米。每轮开始前，必须公开土地编号、具体位置、面积、边界、允许用途、使用期限、环境与建设限制，以及是否开放个人申请。',
          },
          {
            type: 'paragraph',
            text: '公共设施和自然保护用地不一定向个人开放；是否开放以及如何使用，应由公开的公共规划决定。',
          },
        ],
      },
      {
        id: 'equal-weight',
        number: 3,
        title: '统一的个人权重',
        lead: '每位合格申请者在每一轮都拥有相同的总权重。数值写成 1、10 或 100000 并无本质区别，关键是人人总量相同。',
        blocks: [
          { type: 'formula', math: 'W=1', caption: '每个人每轮拥有一单位总权重' },
          { type: 'formula', math: '\\sum_i w_i\\le 1', caption: '分配到全部地块的权重总和不能超过 1' },
          {
            type: 'bullets',
            items: ['权重不是土地面积配额', '权重不是土地所有权', '权重不是金钱', '权重不是可继承财产', '权重不是可交易资产'],
          },
          {
            type: 'paragraph',
            text: '本轮未使用的权重原则上不累积到下一轮，也不能转让给他人。',
          },
        ],
      },
      {
        id: 'free-allocation',
        number: 4,
        title: '权重的自由分配',
        lead: '申请者可以集中权重争取一块土地，也可以分散到多块土地，制度不必简单限定每个人最多申请多少块。',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: '集中', text: '只申请一块土地：w_A = 1' },
              { label: '组合', text: '申请三块土地：w_A = 0.7，w_B = 0.2，w_C = 0.1' },
              { label: '分散', text: '申请 1000 块土地：每块投入 0.001' },
            ],
          },
          {
            type: 'paragraph',
            text: '申请范围越广，平均分到每块土地的权重通常越低；申请越集中，单块土地上的竞争权重通常越高。',
          },
        ],
      },
    ],
  },
  {
    id: 'allocation',
    number: '02',
    title: '分配怎样发生',
    summary: '把土地面积、用途和申请者投入的权重放进同一套公开规则，再计算每块土地的相对中签概率。',
    sections: [
      {
        id: 'effective-area',
        number: 5,
        title: '面积计权与用途系数',
        lead: '土地面积应计入申请成本；不同用途可以采用不同系数，但中签后获得的仍是地块的实际面积。',
        blocks: [
          { type: 'formula', math: 'A_{\\mathrm{eff}}=cA', caption: 'A 为实际面积，c 为用途系数，A_eff 只用于计算竞争成本' },
          {
            type: 'table',
            columns: ['土地用途', '示例系数'],
            rows: [
              ['普通住宅', '1'],
              ['商业', '1'],
              ['工业', '0.5'],
              ['农业', '0.05'],
              ['林业', '0.02'],
              ['生态保护', '0.01'],
            ],
          },
          {
            type: 'paragraph',
            text: '例如，申请 100000 平方米农业土地，若 c = 0.05，则计权面积为 5000 平方米；中签后实际获得的仍是 100000 平方米。',
          },
          { type: 'formula', math: 'w_{i,L}=r_{i,L}c_LA_L', caption: '可用统一的权重密度 r 把面积与权重换算到同一规则中' },
          { type: 'formula', math: '\\sum_L w_{i,L}\\le 1', caption: '申请者投入全部土地的权重仍不能超过 1' },
          {
            type: 'paragraph',
            text: '换算单位、最小精度和四舍五入规则必须提前公布，对所有人完全一致，并且不能在抽签后修改。',
          },
        ],
      },
      {
        id: 'agricultural-rules',
        number: 6,
        title: '农业土地的特别规则',
        lead: '较低的农业用途系数不能成为规避用途管制的通道。',
        blocks: [
          {
            type: 'bullets',
            items: ['种植', '牧业', '果园', '农业设施', '灌溉和土壤改良'],
          },
          {
            type: 'paragraph',
            text: '农业土地只能用于获批的农业用途，不能申请后改建豪宅、商场或其他非农业设施。改变用途时必须重新申请，并按新用途重新计算面积和权重。',
          },
          {
            type: 'paragraph',
            text: '还应设置实际使用要求，防止以农业名义长期囤地、闲置或转作其他用途。',
          },
        ],
      },
      {
        id: 'lottery',
        number: 7,
        title: '同一土地的抽签方式',
        lead: '同一地块上，每个人的中签概率只取决于其投入权重在该地块总权重中的占比。',
        blocks: [
          { type: 'formula', math: 'P(i\\mid L)=\\frac{w_{i,L}}{\\sum_j w_{j,L}}', caption: '申请者 i 在土地 L 上的中签概率' },
          {
            type: 'paragraph',
            text: '若 A、B、C 分别投入 0.6、0.3、0.1，则三人的中签概率分别为 60%、30%、10%。权重只决定相对概率，不代表购买土地，也不保证中签。',
          },
          {
            type: 'paragraph',
            text: '若某块土地无人申请，它继续保持公共状态，下一轮仍可申请。若申请者同时在多块土地中签，应按事先公布的用途、面积和实际使用规则决定能否全部接受；无法或不愿接受的地块应在期限内放弃并重新开放。',
          },
        ],
      },
      {
        id: 'demand-distribution',
        number: 8,
        title: '热门土地与需求分散',
        lead: '热门地块会吸引更多权重，也会自然降低单个申请者的中签概率。',
        blocks: [
          {
            type: 'bullets',
            items: ['集中权重申请少数热门土地', '分散权重申请多个土地', '转向竞争较小的周边区域'],
          },
          {
            type: 'paragraph',
            text: '公开竞争情况可以帮助申请者自主调整选择，并形成一定的需求分散作用；但这一机制不能代替交通建设、公共服务配置、城市规划和区域发展政策。',
          },
        ],
      },
    ],
  },
  {
    id: 'boundaries',
    number: '03',
    title: '权重与权利的边界',
    summary: '权重不能进入市场，也不能借代持、公司壳或建筑物交易绕过“一人一份”的限制。',
    sections: [
      {
        id: 'non-transferable',
        number: 9,
        title: '权重不得交易',
        lead: '个人权重只用于本人的土地申请，不能变成资产。',
        blocks: [
          { type: 'bullets', items: ['不得出售或购买', '不得赠送或继承', '不得抵押或出租', '不得以其他方式变相转让'] },
          {
            type: 'paragraph',
            text: '任何人都不能通过支付金钱，让他人代替自己提高土地中签概率。',
          },
        ],
      },
      {
        id: 'anti-nominee',
        number: 10,
        title: '禁止代持和规避规则',
        lead: '不能通过资助大量名义申请人，再由同一人实际控制土地或享有收益。',
        blocks: [
          {
            type: 'bullets',
            items: ['实际使用人', '资金来源', '企业控制关系', '家庭或组织的集中控制', '土地收益归属', '建设和经营决策权'],
          },
          {
            type: 'paragraph',
            text: '一旦确认存在虚假申请、代持或利益输送，可以取消申请或使用资格，并依法追究责任。家庭成员共同申请并不当然违法，但必须确有共同使用关系，不能仅利用亲属身份制造虚假申请人。',
          },
        ],
      },
      {
        id: 'enterprise-weight',
        number: 11,
        title: '企业不得凭空制造权重',
        lead: '公司或其他组织不能仅因完成登记，就自动获得一份新的完整权重。',
        blocks: [
          {
            type: 'bullets',
            items: ['建立独立的企业土地分配制度', '由实际参与者依法授权部分个人权重', '通过公开的公共项目或产业项目机制分配'],
          },
          {
            type: 'paragraph',
            text: '无论采用哪种方式，都不能通过公司、关联组织或名义申请人绕过“一人一份基础权重”的限制。',
          },
        ],
      },
      {
        id: 'separate-rights',
        number: 12,
        title: '土地使用权与建筑物所有权分离',
        lead: '获得土地只意味着取得一定期限的土地使用权；建筑物与合理建设投资可以由建造者私人所有。',
        blocks: [
          {
            type: 'paragraph',
            text: '土地使用权变化时，建筑物不会自动转归新的土地使用者。土地使用权也不得通过私下买卖、出租或隐性转让绕过公开分配。',
          },
          {
            type: 'paragraph',
            text: '建筑物可以依法转让，但交易不能自动附带土地使用权；购买建筑物的人仍须取得相应的土地使用资格。',
          },
        ],
      },
    ],
  },
  {
    id: 'continuity',
    number: '04',
    title: '期限与投资保护',
    summary: '土地不永久私有，但长期建设、农业周期和剩余投资价值都需要稳定、可预期的保护。',
    sections: [
      {
        id: 'short-long-term',
        number: 13,
        title: '短期与长期使用土地',
        lead: '不同用途需要不同期限，长期投资用地不能每年强制清空。',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: '短期', text: '临时摊位、临时停车场、临时活动场地、短期经营设施' },
              { label: '长期', text: '住宅、工业设施、农业设施、果园、长期经营场所' },
            ],
          },
          {
            type: 'table',
            columns: ['用途', '示例期限'],
            rows: [['住宅', '30 年'], ['工业', '20 年'], ['普通农业', '5 至 20 年'], ['果园和长期农业设施', '10 至 20 年']],
          },
          {
            type: 'paragraph',
            text: '具体期限应根据土地用途、投资周期和公共规划依法确定。',
          },
        ],
      },
      {
        id: 'long-term-agriculture',
        number: 14,
        title: '农业土地的长期使用',
        lead: '土壤改良、果树生长、灌溉建设和农业生产都需要稳定预期，农业土地不宜每年更换使用者。',
        blocks: [
          {
            type: 'paragraph',
            text: '农业土地应根据作物、土壤和设施设置合理的长期使用期限。期限届满后，土地重新进入分配制度。',
          },
          {
            type: 'paragraph',
            text: '原使用者可以再次申请，但不能仅因过去使用过该地块而获得永久优先权。',
          },
        ],
      },
      {
        id: 'expiry-buildings',
        number: 15,
        title: '期限届满与建筑物处理',
        lead: '使用期结束时，土地重新分配与建筑投资保护要同时处理。',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: 'A', text: '原使用者重新申请并中签，继续使用土地。' },
              { label: 'B', text: '新使用者取得使用权后，按评估价值购买原有建筑物。' },
              { label: 'C', text: '公共规划要求拆除时，由公共机构按建筑物剩余价值给予合理补偿。' },
            ],
          },
          {
            type: 'paragraph',
            text: '建筑物评估应由独立机构完成，并允许复核或申诉，避免合理投入被无偿收走。因公共利益提前收回土地时，也应结合剩余期限、建筑物价值和实际投资给予合理补偿。',
          },
        ],
      },
      {
        id: 'continuity-protection',
        number: 16,
        title: '期限结束后的连续性保护',
        lead: '原使用者没有永久特权，但可以在明确上限内获得必要过渡。',
        blocks: [
          {
            type: 'bullets',
            items: ['提前通知', '给予重新申请的准备期', '允许合理搬迁', '保护尚未收回的投资价值', '对农业生产周期作过渡安排'],
          },
          {
            type: 'paragraph',
            text: '连续性保护必须有明确期限、公开标准和统一上限，不能演变为事实上的永久土地私有。',
          },
        ],
      },
    ],
  },
  {
    id: 'governance',
    number: '05',
    title: '申请、公开与监督',
    summary: '把申请锁定、随机来源、身份核验、规划许可和申诉救济都写进可执行流程。',
    sections: [
      {
        id: 'application-lock',
        number: 17,
        title: '申请修改与截止锁定',
        lead: '申请期内可以自由调整；截止时刻之后，规则与数据同时锁定。',
        blocks: [
          { type: 'bullets', items: ['添加或删除土地', '增加或减少权重', '重新调整权重分配'] },
          {
            type: 'paragraph',
            text: '抽签前，系统应生成不可篡改的申请快照。截止后，包括管理机构在内的任何人都不能单方面修改申请内容。',
          },
        ],
      },
      {
        id: 'verifiable-draw',
        number: 18,
        title: '抽签的公开可验证性',
        lead: '抽签不仅要公开结果，还要让外部能够用同一数据独立复算。',
        blocks: [
          {
            type: 'bullets',
            items: ['公开分配算法', '公开土地编号与匿名申请编号', '公开锁定后的权重', '公开随机种子与抽签结果', '允许社会独立复算', '保留完整操作日志'],
          },
          {
            type: 'paragraph',
            text: '随机种子应来自抽签前无法准确预测的公开随机源，也可以采用多方承诺、公开随机数和独立审计，防止单一机构提前操控结果。算法、数据、随机种子和结果公开后不得秘密修改。',
          },
        ],
      },
      {
        id: 'privacy-audit',
        number: 19,
        title: '个人隐私与身份审计',
        lead: '公众需要足够信息验证抽签，但不需要看到申请者的真实身份资料。',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: '可以公开', text: '匿名申请编号、土地编号、申请权重、抽签结果、时间戳和审计记录' },
              { label: '不必公开', text: '姓名、身份证号码、家庭住址及其他不必要的个人信息' },
            ],
          },
          {
            type: 'paragraph',
            text: '管理机构或独立审计机构应能在法律授权下核验“一人一份基础权重”，并调查代持、重复注册和利益输送。制度需要同时做到对公众透明、对个人隐私保密、对审计机构可核验。',
          },
        ],
      },
      {
        id: 'planning-fees',
        number: 20,
        title: '建设、规划与费用',
        lead: '获得土地使用权不等于自动获得建设许可。',
        blocks: [
          {
            type: 'bullets',
            items: ['城市规划', '环境保护', '建筑安全', '公共设施容量', '消防和卫生标准', '土地用途规定'],
          },
          {
            type: 'paragraph',
            text: '建设成本、基础设施费用、维护费用和依法征收的税费可以按统一规则承担，但这些费用不得用于提高土地抽签概率。',
          },
        ],
      },
      {
        id: 'violations-appeals',
        number: 21,
        title: '违规、闲置与申诉',
        lead: '严重违规可以导致土地使用权被收回，但收回之前必须有完整程序。',
        blocks: [
          {
            type: 'bullets',
            items: ['虚假申报', '违法改变用途', '长期闲置或恶意囤积', '私下出租或买卖土地使用权', '代持或利益输送', '严重违反环境、安全或规划要求'],
          },
          {
            type: 'paragraph',
            text: '收回土地前，应履行通知、调查、听证和申诉程序。因使用者违法而收回时，可以依法减少或取消补偿；因公共规划调整而收回时，应按照剩余价值和实际投资给予合理补偿。',
          },
        ],
      },
    ],
  },
  {
    id: 'core',
    number: '06',
    title: '核心机制',
    summary: '复杂规则最终落回两条简单数学约束：人人总量相同，同一地块按相对权重随机分配。',
    sections: [
      {
        id: 'core-mechanism',
        number: 22,
        title: '制度的核心机制',
        lead: '两条公式定义分配本身，其余规则负责堵住规避路径，并保护公共利益、个人隐私与合理投资。',
        blocks: [
          { type: 'formula', math: '\\sum_i w_i\\le 1', caption: '每个人拥有有限且相同的总权重' },
          { type: 'formula', math: 'P(i\\mid L)=\\frac{w_{i,L}}{\\sum_j w_{j,L}}', caption: '同一块土地按照相对权重随机分配' },
          {
            type: 'bullets',
            items: ['防止农业用途伪装', '防止企业制造额外权重', '禁止代持和利益输送', '保护建筑与长期投资', '处理土地闲置', '平衡隐私与审计', '确保抽签过程公开可验证'],
          },
          {
            type: 'paragraph',
            text: '这套制度既不是由国家替个人决定住在哪里，也不是让有钱的人购买最好的土地，而是让每个人用同样的选择能力，自主决定把竞争权重投入哪里。',
          },
        ],
      },
    ],
  },
];

function blockSearchText(block: LandPolicyBlock): string {
  if (block.type === 'paragraph') return block.text;
  if (block.type === 'bullets') return block.items.join('；');
  if (block.type === 'formula') return [block.math, block.caption].filter(Boolean).join('；');
  if (block.type === 'table') return [block.columns.join('；'), ...block.rows.map((row) => row.join('：'))].join('；');
  return block.items.map((item) => `${item.label}：${item.text}`).join('；');
}

export const LAND_ALLOCATION_SEARCH_TEXT = [
  LAND_ALLOCATION_META.summary,
  LAND_ALLOCATION_META.rightsNote,
  LAND_ALLOCATION_META.conclusion,
  ...LAND_ALLOCATION_PILLARS.flatMap((pillar) => [pillar.title, pillar.text]),
  ...LAND_ALLOCATION_STEPS.flatMap((step) => [step.title, step.text]),
  ...LAND_ALLOCATION_CHAPTERS.flatMap((chapter) => [
    chapter.title,
    chapter.summary,
    ...chapter.sections.flatMap((section) => [
      section.title,
      section.lead,
      ...section.blocks.map(blockSearchText),
    ]),
  ]),
].join('\n');
