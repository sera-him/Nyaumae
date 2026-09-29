// English mirror of ../data/nyaumae8.ts. Bit patterns and capacity numbers are
// language-neutral and stay byte-identical; only the prose is translated.
// Emoji clusters are rendered by the font, so they stay verbatim.

import type { Nyaumae8Class, CapacityRow, EmojiCluster } from './nyaumae8';

export const nyaumae8ClassesEn: Nyaumae8Class[] = [
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
    leadExcludes: ['111101xx 1xxxxxxx 1xxxxxxx', 'the first 2 bytes = 11111111 11xxxxxx'],
  },
  {
    bytes: 4,
    pattern: ['11111111', '11xxxxxx', '1xxxxxxx', '1xxxxxxx'],
    leadExcludes: [],
  },
];

export const nyaumae8CapacityEn: CapacityRow[] = [
  { bytes: 1, utf8: 128, nyaumae8: 128 },
  { bytes: 2, utf8: 2_048, nyaumae8: 14_848 },
  { bytes: 3, utf8: 65_536, nyaumae8: 188_416 },
  { bytes: 4, utf8: 1_048_576, nyaumae8: 1_048_576 },
];

export const nyaumae8EmojiEn: EmojiCluster[] = [
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

export const nyaumae8EmojiTotalsEn = {
  clusters: nyaumae8EmojiEn.length,
  codePoints: nyaumae8EmojiEn.reduce((sum, c) => sum + c.codePoints.length, 0),
  bytes: nyaumae8EmojiEn.reduce((sum, c) => sum + c.bytes, 0),
};

export const nyaumae8LeadZh = '我给我们的字写了一本自己的字典，叫 Nyaumae-8。跟 UTF-8 不一样的地方只有一个：2 字节的首字节放宽了，所以 2 字节能装的东西多好多。';

export const nyaumae8LeadEn = 'I wrote our own dictionary for our characters, and called it Nyaumae-8. It differs from UTF-8 in exactly one place: the 2-byte lead byte is widened, so the 2-byte class holds a lot more.';

export const nyaumae8EmojiLeadZh = '这是 4 字节那档要解决的东西。你看到的是 7 个图案，其实写了 11 个码点、42 个字节——中间那两个看不见的是 ZWJ，把两段粘成了一个图案。';

export const nyaumae8EmojiLeadEn = 'This is what the 4-byte class has to cope with. You see 7 pictures, but it is written as 11 code points and 42 bytes — the two invisible ones are ZWJ, gluing two halves into one picture.';

export const nyaumae8TableHeadZh = ['字节数', 'UTF-8 容量', 'Nyaumae-8 容量'];

/** Flattened text for the site-wide search index: bit patterns, capacity
 *  numbers and every emoji code point all need to be searchable. */
export const nyaumae8SearchTextEn = [
  'Nyaumae-8 encoding table',
  ...nyaumae8ClassesEn.flatMap((c) => [
    `${c.bytes} bytes ${c.pattern.join(' ')}`,
    ...c.leadExcludes.map((ex) => `${c.bytes} bytes but ${ex}`),
  ]),
  ...nyaumae8CapacityEn.map((r) => `${r.bytes} bytes UTF-8 capacity ${r.utf8} Nyaumae-8 capacity ${r.nyaumae8}`),
  ...nyaumae8EmojiEn.flatMap((c) => [
    `${c.cluster} ${c.codePoints.map((cp) => `${cp.hex}${cp.note ? ` ${cp.note}` : ''} ${cp.bytes} bytes`).join(' ')} total ${c.bytes} bytes`,
  ]),
  '7 clusters 11 code points 42 bytes',
  'ZWJ zero-width joiner U+1F9D1 U+1F9AF U+1F9CF U+1F910 U+1F9BC U+1F9E0 U+1F4AD U+1F9E9 U+200D',
].join('; ');

export const nyaumae8TableHeadEn = ['Bytes', 'UTF-8 capacity', 'Nyaumae-8 capacity'];
