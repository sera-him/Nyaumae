// Nyaumae-8 —— 咪呀手写笔记本 P.2 里的自创编码表。
// 相对 UTF-8 的改动：2 字节首字节从 110xxxxx 放宽到 1xxxxxxx，
// 代价是把原本 3 字节首字节里的 11111xxx / 111101xx 挤到 3 字节去。
//
// 注意：3 字节那档的 pattern 只列了「11111xxx」这一条首位模式，
// 111101xx 走的是同一个「首字节 + 2 个后续字节」的形状，
// 只是首位不是 11111xxx。它被排除的是「前 2 字节 = 11111111 11xxxxxx」
// 那一段连续位，而不是排除整个 3 字节长度。

export interface Nyaumae8Class {
  /** 1 | 2 | 3 | 4 */
  bytes: 1 | 2 | 3 | 4;
  /** 首字节与其余字节的位模式，逐字节一行 */
  pattern: string[];
  /** 首字节被排除掉的那几类 */
  leadExcludes: string[];
}

export const nyaumae8Classes: Nyaumae8Class[] = [
  {
    bytes: 1,
    pattern: ['0xxxxxxx'],
    leadExcludes: [],
  },
  {
    bytes: 2,
    pattern: ['1xxxxxxx', '1xxxxxxx'],
    leadExcludes: ['11111xxx', '111101xx'],
  },
  {
    bytes: 3,
    pattern: ['11111xxx', '1xxxxxxx', '1xxxxxxx'],
    leadExcludes: ['111101xx 1xxxxxxx 1xxxxxxx', '前 2 字节 = 11111111 11xxxxxx'],
  },
  {
    bytes: 4,
    pattern: ['11111111', '11xxxxxx', '1xxxxxxx', '1xxxxxxx'],
    leadExcludes: [],
  },
];

export interface CapacityRow {
  bytes: 1 | 2 | 3 | 4;
  utf8: number;
  nyaumae8: number;
}

/** 容量数字照笔记本原样抄录，未做改动。 */
export const nyaumae8Capacity: CapacityRow[] = [
  { bytes: 1, utf8: 128, nyaumae8: 128 },
  { bytes: 2, utf8: 2_048, nyaumae8: 14_848 },
  { bytes: 3, utf8: 65_536, nyaumae8: 188_416 },
  { bytes: 4, utf8: 1_048_576, nyaumae8: 1_048_576 },
];

export interface EmojiCodePoint {
  char: string;
  hex: string;
  bytes: number;
  note?: string;
}

export interface EmojiCluster {
  /** 屏幕上看到的一整簇 */
  cluster: string;
  /** 展开成码点序列，ZWJ 单独列出 */
  codePoints: EmojiCodePoint[];
  bytes: number;
}

/** 🧑‍🦯🧏🤐🧑‍🦼🧠💭🧩 —— 4 字节那档的动机样本。
 *  两处 ZWJ 拼接说明"看起来的一个图案"可能不是 4 个字节。 */
export const nyaumae8Emoji: EmojiCluster[] = [
  {
    cluster: '🧑‍🦯',
    codePoints: [
      { char: '🧑', hex: 'U+1F9D1', bytes: 4 },
      { char: '‍', hex: 'U+200D', bytes: 3, note: 'ZWJ' },
      { char: '🦯', hex: 'U+1F9AF', bytes: 4 },
    ],
    bytes: 11,
  },
  { cluster: '🧏', codePoints: [{ char: '🧏', hex: 'U+1F9CF', bytes: 4 }], bytes: 4 },
  { cluster: '🤐', codePoints: [{ char: '🤐', hex: 'U+1F910', bytes: 4 }], bytes: 4 },
  {
    cluster: '🧑‍🦼',
    codePoints: [
      { char: '🧑', hex: 'U+1F9D1', bytes: 4 },
      { char: '‍', hex: 'U+200D', bytes: 3, note: 'ZWJ' },
      { char: '🦼', hex: 'U+1F9BC', bytes: 4 },
    ],
    bytes: 11,
  },
  { cluster: '🧠', codePoints: [{ char: '🧠', hex: 'U+1F9E0', bytes: 4 }], bytes: 4 },
  { cluster: '💭', codePoints: [{ char: '💭', hex: 'U+1F4AD', bytes: 4 }], bytes: 4 },
  { cluster: '🧩', codePoints: [{ char: '🧩', hex: 'U+1F9E9', bytes: 4 }], bytes: 4 },
];

/** 7 簇 / 11 码点 / 42 字节 */
export const nyaumae8EmojiTotals = {
  clusters: nyaumae8Emoji.length,
  codePoints: nyaumae8Emoji.reduce((sum, c) => sum + c.codePoints.length, 0),
  bytes: nyaumae8Emoji.reduce((sum, c) => sum + c.bytes, 0),
};

/** 供全站搜索索引用的扁平文本：位模式 + 容量数字 + emoji 码点都进索引。 */
export const nyaumae8SearchText = [
  'Nyaumae-8 编码表',
  ...nyaumae8Classes.flatMap((c) => [
    `${c.bytes}字节 ${c.pattern.join(' ')}`,
    ...c.leadExcludes.map((ex) => `${c.bytes}字节但${ex}`),
  ]),
  ...nyaumae8Capacity.map((r) => `${r.bytes} 字节 UTF-8 容量 ${r.utf8} Nyaumae-8 容量 ${r.nyaumae8}`),
  ...nyaumae8Emoji.flatMap((c) => [
    `${c.cluster} ${c.codePoints.map((cp) => `${cp.hex}${cp.note ? ` ${cp.note}` : ''} ${cp.bytes}字节`).join(' ')} 共 ${c.bytes} 字节`,
  ]),
  '7簇 11码点 42字节',
  'ZWJ 零宽连接符 1F9D1 1F9AF 1F9CF 1F910 1F9BC 1F9E0 1F4AD 1F9E9 200D',
].join('；');
