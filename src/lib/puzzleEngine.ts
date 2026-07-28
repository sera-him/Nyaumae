/**
 * 谜题加密引擎
 * 
 * 13 道 QR 题目 → 18 个槽位
 * 算法：
 * 1. 将 18 个槽位按顺序用分隔符拼接成密码串
 * 2. 对密码串做 10 次 SHA-512，第 i 次在末尾加盐字节 0x0i
 * 3. 10 个 512 位输出串接 → 截取前 4761 位
 * 4. 末尾补零到 8 的整数倍 → 596 字节
 * 5. 与 stored 值逐字节 XOR → 69×69 二维码模块数据
 */

// 分隔符
const SEPARATOR = 'MySchoolOwlsMeAnIEP';

// Stored 密文（base64url 编码，596 字符）
const STORED_BASE64URL =
  'pRDc0pMiQeliF_e8cXe-FqsP8Ae8TG6Ryxks0_LurlwBSj_N1gDJp33z-W7l-PPtwwsDA4UkdA0nhUEBJw9Y5JWEg0meZkhDYVMq86SBbLyn_mMGX-Cexr_jDGxZGaKpsULnbdR4PG3fFJRY5RzUx7jEf11aZYJ8mS50KdfWnT0p01SSAfmnovEJEvaxUi-o41eEMNDvIaGucJr7c_E-41EagiTAN0hwqx7SBpfR7Pn1YJ50lHmOMDfSudHaNfg-xUV4BdOo0Z1-_C6pfW1-0OsG9SHVpO1l0MY2HgcvG1MxujgfPTDybIAhlZiVWZCHDocQ7NUCYfkAeqCgIlgcUWQaLUGPIFDxKgTatSe_CJvAB4adoTwJCJ-NpIJESg-iVV5oVAlIZJufW7ERDEw-g0Z9Pd3S4Lyl2VEkUUaW27LKUP-pLWQ-h78K5PrVkxA5r1r27uRQuhI9Ikp5pTovnprPHp1ATLYnT172KFnSlHaZfIRtF-nqRZWVUvn5oLT3l1lAIR9Z0Ucm2Gz9MY18bgXdNi30p1PMOinGZkxpHQS1BW1FCw3nbQg27sd_pZhSXKdjZd0z5aAS__Dm9WaBa0h5ggd8Anr4I8BJD3LwcK9ukVuSXPJHCyglqpPb0XTsNg_8sBXii5hreNLtc7KgIDXX2BxvesGb0EAr0ovd3uuFkarEgbWHrMVMlYWv5oTSFI0ZdniMJmNDFLaNoAe5pN4qMxIsx2n0R7A7MxY10qHzioHCa1CfdkltJOjQI-beB_unwGFOwyssR9AwsNRmnCZNy5I';

// ---- 题目定义 ----

export interface SlotDef {
  id: number;                // 槽位编号 1-18
  placeholder?: string;      // 提示文字
  width?: string;            // 输入框宽度（CSS 值，如 '64px'）
  /** 按字符数定宽，优先级高于 width */
  size?: number;
  /** 多选选项（非空时渲染为勾选框） */
  options?: string[];
}

export interface ProblemDef {
  id: number;
  /** 按（填空）分割的文本片段 */
  parts: string[];
  /** 每个空白对应的槽位 */
  slots: SlotDef[];
  /** 题末的额外提示 */
  suffix?: string;

}

// 13 道题 → 18 个槽位
// parts 数组按（填空）位置分割文本
export const PROBLEMS: ProblemDef[] = [
  {
    id: 1,
    parts: ['十连寻访需要6000合成玉，如果Zc还差275合成玉进行一次寻访，那么Zc有', '合成玉？'],
    slots: [{ id: 1 }],
  },
  {
    id: 2,
    parts: ['若闪电读完清华大学需要30秒，则闪电读完现代汉语词典需要', '秒？'],
    slots: [{ id: 2 }],
  },
  {
    id: 3,
    parts: ['台风（Typhoon）在移动城市的正南方向，距离600千米，若台风向正东方向移动，时速22.26千米，移动城市向正东方向移动，时速2.26千米，若台风影响半径201千米，则40小时后台风影响区中离台风最近的点距离移动城市的距离是', '千米？'],
    slots: [{ id: 3 }],
  },
  {
    id: 4,
    parts: ['U={x∈N*|x≤9}。设A₁,A₂,...,Aₙ⊆U。若Card(Aᵢ)=3, 且∀a,b∈U, a≠b, ∃i 使{a,b}⊆Aᵢ, 且j≠i时{a,b}⊈Aⱼ, 则 n=', '。'],
    slots: [{ id: 4 }],
  },
  {
    id: 5,
    parts: ['(1+10⁻¹⁰⁰)^10¹⁰⁰', 'e。 [小于/等于/大于]'],
    slots: [{ id: 5, placeholder: '小于/等于/大于' }],
  },
  {
    id: 6,
    parts: ['已知1kbit约有10³⁰⁸·²⁵种状态，则lg2约为', '？ [提示：a/b格式]'],
    slots: [{ id: 6, placeholder: 'a/b' }],
  },
  {
    id: 7,
    parts: ['若ln s = (1/(n+1/2)) + (1/(n+3/2)) + ⋯ + (1/(2n-1/2))，2', 's。 [小于/等于/大于]'],
    slots: [{ id: 7, placeholder: '小于/等于/大于' }],
  },
  {
    id: 8,
    parts: ['6662333的除自身外所有正因数的和 + x^y = y^x，求正整数x=', '，y=', '。'],
    slots: [{ id: 8, width: 'w-20' }, { id: 9, width: 'w-20' }],
  },
  {
    id: 9,
    parts: ['现有20个物体，质量分别为1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,32768,65536,131072,262144,524288，试将它们放在天平两侧使天平平衡，左边放了：', ''],
    slots: [{ id: 10, placeholder: '如 1,2,4,8', width: 'w-72' }],
    suffix: '不要包含空格',
  },
  {
    id: 10,
    parts: ['翻译：sechshundertsechsundsechzig →', ' [汉字]'],
    slots: [{ id: 11, placeholder: '中文翻译' }],
  },
  {
    id: 11,
    parts: ['翻译：salt is not even salt anymore →', ' [汉字]'],
    slots: [{ id: 12, placeholder: '中文翻译' }],
  },
  {
    id: 12,
    parts: ['写出以下Python程序的结果：print(0!=1,2!=2,str(4!=24),sep="tember") →', ''],
    slots: [{ id: 13, placeholder: '严格区分大小写' }],
  },
  {
    id: 13,
    parts: ['对于重量m，静摩擦系数μ的敌人，冲量I可以使其位移的距离 s = ', '·I^', '·μ^', '·m^', '·g^', ''],
    slots: [
      { id: 14, placeholder: '系数', width: 'w-16' },
      { id: 15, placeholder: '指数', width: 'w-16' },
      { id: 16, placeholder: '指数', width: 'w-16' },
      { id: 17, placeholder: '指数', width: 'w-16' },
      { id: 18, placeholder: '指数', width: 'w-16' },
    ],
    suffix: '第1空 a/b 格式',
  },
  {
    id: 14,
    parts: [
      '有一台抓娃娃机，内有山山兔、猫山山、龙泡泡各 2 只。每次投币启动普通爪（抓 1 只）或强力爪（抓 2 只），初始 p=0.02 概率强力爪。若连续 50 爪未出货，之后每次强力爪概率递增 p。抓到 2 只相同玩偶才算出货，否则放回。期望上欧阳修需要投币',
      '次才能出货？（结果保留整数）',
    ],
    slots: [{ id: 19, placeholder: '?' }]
  },
  {
    id: 15,
    parts: [
      '(多选) 若函数 f(x) 满足 f(x)·(lnx+1)=f\'(x)，定义域 R⁺，值域 ⊆ R⁺，则正确的选项是：',
      '\nA. f(x) 在 (0,1/e] 单调增\nB. f(x) 在 (1/e,1] 单调增\nC. 4f(1)<f(2)\nD. 6f(2)<f(3)',
    ],
    slots: [{ id: 20, options: ['A', 'B', 'C', 'D'], width: '160px' }],
  },
  {
    id: 16,
    parts: [
      '2 张银行卡 A、B 分别存 x 元和 2x 元。小明随机抽一张并看到余额 m∈{x,2x}。若换另一张卡，期望上 E =',
      '*m + ',      
      '*x',
    ],
    slots: [
      { id: 21, placeholder: '?', width: '64px' },
      { id: 22, placeholder: '?', width: '64px' },
    ],
    suffix: '[保留两位小数]',
  },
  {
    id: 17,
    parts: [
      'A={1,3,7,8}，B={2,4,6}。若哥德巴赫猜想成立则在 A 中取全部 4 个元素，否则在 A 取 1 个、B 取 3 个。选出的元素用四则运算组成 24 的概率为：',
      '',
    ],
    slots: [{ id: 23, placeholder: '?', width: '64px' }],
    suffix: '[保留两位小数]',
  },
  {
    id: 18,
    parts: [
      '小明在陆地与水中速度比 7:5（y≥0 为陆地，y<0 为海洋）。从海中 A 到陆地 B 的最短时间路径中，一部分在 y=x/2 上，则另一部分所在直线为 y =',
      'x + ',
      '（取 √145≈12）',
    ],
    slots: [
      { id: 24, placeholder: '?', width: '64px' },
      { id: 25, placeholder: '?', width: '64px' },
    ],
    suffix: '[保留两位小数]',
  },
  {
    id: 19,
    parts: [
      '边长 6 的立方体 ABCD-A₁B₁C₁D₁ 中，到 A 和 C₁ 距离均 <6 的点组成的图形体积为（取 π=3.14，√3=1.73）：',
      '',
    ],
    slots: [{ id: 26, placeholder: '?', width: '80px' }],
    suffix: '[保留两位小数]',
  },
  {
    id: 20,
    parts: ['已知 sinx=x（x∈R），求证 tanx=x²。最重要的一步：', ''],
    slots: [{ id: 27, placeholder: '?', width: '80px' }],
    suffix: '3个字符',
  },
  {
    id: 21,
    parts: [
      '定义 f(x)=-x/27，令 K=k·pi（k∈Z）；常数项 bias 满足 0≤bias<周期，禁止使用减号和负号！\n可用函数：sin,cos,tan,csc,sec,cot,arcsin,arccos,arctan,arccsc,arcsec,arccot,sqrt,cbrt,log,f\n规则：省略乘号，不含空格；乘法因子按 ASCII 升序，加法项按字典序；sqrt 和 cbrt 系数为 1\nsin³x+sin²xcosx+sinxcos²x+cos³x = (tanx+1)²/(cos2x+2sin²x-tanx)\n所有解（按字典序排列）：\nx₁ = ',
      '\nx₂ = ',
      '\nx₃ = ',
    ],
    slots: [
      { id: 28, placeholder: '?', size: 70 },
      { id: 29, placeholder: '?', size: 70 },
      { id: 30, placeholder: '?', size: 70 },
    ]
  },
  {
    id: 22,
    parts: [
      '质量 m、电荷量 +e 的源石碎片垂直射入磁场强度 B=ky（垂直纸面向外）的磁场，设初速度 v₀，则 y_max² =',
      '·m^',
      '·v₀^',
      '·e^',
      '·k^',
      '',
    ],
    slots: [
      { id: 31, placeholder: '?', width: '40px' },
      { id: 32, placeholder: '?', width: '40px' },
      { id: 33, placeholder: '?', width: '40px' },
      { id: 34, placeholder: '?', width: '40px' },
      { id: 35, placeholder: '?', width: '40px' },
    ],
    suffix: '第1空 系数，其余为指数',
  },
  {
    id: 23,
    parts: [
      '配平化学方程式：',
      'HNO₃（稀）+ ',
      'Fe → ',
      'H₂↑ + ',
      'Fe(NO₃)₂',
    ],
    slots: [
      { id: 36, placeholder: '?', width: '40px' },
      { id: 37, placeholder: '?', width: '40px' },
      { id: 38, placeholder: '?', width: '40px' },
      { id: 39, placeholder: '?', width: '40px' },
    ],
    suffix: '按 HNO₃, Fe, H₂, Fe(NO₃)₂ 顺序',
  },
  {
    id: 24,
    parts: [
      '一只小老鼠（',
      '）牵着一头丑丑的牛（',
      '）去赶集，半路遇见获胜的老虎（',
      '）当裁判，却发现赛场上没有兔子（',
      '）。突然成龙（',
      '）翻滚入场，身手似一条蛇（',
      '）般灵活，可惜现场没有马（',
      '）能骑。观众们慌忙喂羊，只求新冠未变阳（',
      '），这时神通广大的猴子（',
      '）孙悟空从天而降，左手上有一只鸡（',
      '），右手牵着虚拟的狗（',
      '），落地时一个没站稳，一屁股伤害了一只猪（',
      '）。',
    ],
    slots: [
      { id: 40, placeholder: '?', width: '64px' },
      { id: 41, placeholder: '?', width: '64px' },
      { id: 42, placeholder: '?', width: '64px' },
      { id: 43, placeholder: '?', width: '64px' },
      { id: 44, placeholder: '?', width: '64px' },
      { id: 45, placeholder: '?', width: '64px' },
      { id: 46, placeholder: '?', width: '64px' },
      { id: 47, placeholder: '?', width: '64px' },
      { id: 48, placeholder: '?', width: '64px' },
      { id: 49, placeholder: '?', width: '64px' },
      { id: 50, placeholder: '?', width: '64px' },
      { id: 51, placeholder: '?', width: '64px' },
    ],
  },
];


/** 获取 QR 题目（id≤13）的所有槽位，按 id 排序 */
export function getAllSlots(): SlotDef[] {
  return PROBLEMS
    .filter((p) => p.id <= 13)
    .flatMap((p) => p.slots)
    .sort((a, b) => a.id - b.id);
}

export function getTotalSlots(): number {
  return getAllSlots().length;
}

/** 获取某个题目前面的槽位总数 */
export function getSlotOffset(problemIdx: number): number {
  let offset = 0;
  for (let i = 0; i < problemIdx; i++) {
    offset += PROBLEMS[i].slots.length;
  }
  return offset;
}

// ---- Base64url 解码 ----

function base64urlDecode(str: string): Uint8Array {
  // 将 base64url 转为标准 base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补足 padding
  while (base64.length % 4 !== 0) base64 += '=';
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

// ---- SHA-512 哈希 ----

async function sha512(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-512', data as BufferSource);
  return new Uint8Array(hash);
}

// ---- 核心加密逻辑 ----

/**
 * 对 nonQR 答案做 HKDF-SHA512，精确输出 596 字节
 */
async function hkdfNonQR(nonQRAnswers: string[]): Promise<Uint8Array> {
  const passwordStr = nonQRAnswers.join(SEPARATOR);
  const ikm = new TextEncoder().encode(passwordStr);
  const salt = new TextEncoder().encode(SEPARATOR);
  const info = new TextEncoder().encode('NeuralConnectionNonQR');

  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-512', salt, info },
    key,
    4768, // 596 字节
  );
  return new Uint8Array(derived);
}

/**
 * 根据用户答案计算二维码数据
 * @param qrAnswers 按槽位 id (1-18) 顺序排列的答案
 * @param nonQRAnswers 非 QR 题（id>13）的答案
 */
export async function computeQRData(qrAnswers: string[], nonQRAnswers?: string[]): Promise<Uint8Array | null> {
  if (qrAnswers.length !== 18) {
    return null;
  }

  // 1. 用分隔符拼接 QR 密码串
  const passwordStr = qrAnswers.join(SEPARATOR);
  const passwordBytes = new TextEncoder().encode(passwordStr);

  // 2. 对密码串做 10 次 SHA-512，第 i 次末尾加盐 0x0i
  const allHashes: Uint8Array[] = [];
  for (let i = 0; i < 10; i++) {
    const salted = new Uint8Array(passwordBytes.length + 1);
    salted.set(passwordBytes);
    salted[passwordBytes.length] = 0x00 + i;
    const hash = await sha512(salted);
    allHashes.push(hash);
  }

  // 3. 串接 10 个 64 字节输出 = 640 字节 = 5120 位
  const concatenated = new Uint8Array(640);
  let offset = 0;
  for (const hash of allHashes) {
    concatenated.set(hash, offset);
    offset += 64;
  }

  // 4. 截取前 4761 位 → 末尾补零到 8 的整数倍 → 596 字节
  const totalBits = 4761;
  const totalBytes = 596;
  const hashBytes = new Uint8Array(totalBytes);

  for (let i = 0; i < totalBits; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    const srcByteIdx = Math.floor(i / 8);
    const srcBitIdx = 7 - (i % 8);
    if (concatenated[srcByteIdx] & (1 << srcBitIdx)) {
      hashBytes[byteIdx] |= (1 << bitIdx);
    }
  }

  // 5. 计算 nonQR 的 HKDF 并 XOR 到 hash 上
  let combined = hashBytes;
  if (nonQRAnswers && nonQRAnswers.length > 0) {
    const nonQRBytes = await hkdfNonQR(nonQRAnswers);
    combined = new Uint8Array(totalBytes);
    for (let i = 0; i < totalBytes; i++) {
      combined[i] = hashBytes[i] ^ nonQRBytes[i];
    }
  }

  // 6. 解码 stored 值并与 combined XOR
  const storedBytes = base64urlDecode(STORED_BASE64URL);

  const xorLen = Math.min(combined.length, storedBytes.length);
  const qrBytes = new Uint8Array(totalBytes);
  for (let i = 0; i < xorLen; i++) {
    qrBytes[i] = combined[i] ^ storedBytes[i];
  }
  for (let i = xorLen; i < combined.length; i++) {
    qrBytes[i] = combined[i];
  }

  return qrBytes;
}

/**
 * 在 Canvas 上绘制二维码
 */
export function drawQRCode(
  canvas: HTMLCanvasElement,
  qrData: Uint8Array,
  size: number = 69,
  moduleSize: number = 6
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const canvasSize = size * moduleSize;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = '#000000';

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const bitIdx = row * size + col;
      const byteIdx = Math.floor(bitIdx / 8);
      const bitPos = 7 - (bitIdx % 8);
      if (byteIdx < qrData.length && (qrData[byteIdx] & (1 << bitPos))) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

// ---- Base64url 解码 ----
