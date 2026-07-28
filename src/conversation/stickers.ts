export interface ChatSticker {
  id: string;
  label: string;
  src: string;
}

export const CHAT_STICKERS: ChatSticker[] = [
  { id: 'cheer', label: '欢呼', src: '/stickers/cat-cheer.png' },
  { id: 'shy', label: '害羞', src: '/stickers/cat-shy.png' },
  { id: 'love', label: '送爱心', src: '/stickers/cat-love.png' },
  { id: 'hug', label: '抱抱', src: '/stickers/cat-hug.png' },
  { id: 'kiss', label: '亲亲', src: '/stickers/cat-kiss.png' },
  { id: 'hello', label: '你好', src: '/stickers/cat-hello.png' },
  { id: 'happy', label: '开心', src: '/stickers/cat-happy.png' },
  { id: 'excited', label: '期待', src: '/stickers/cat-excited.png' },
  { id: 'sparkle', label: '眼睛发光', src: '/stickers/cat-sparkle-alt.png' },
  { id: 'cute', label: '乖巧', src: '/stickers/cat-cute.png' },
  { id: 'surprised', label: '惊讶', src: '/stickers/cat-surprised.png' },
  { id: 'speechless', label: '无语', src: '/stickers/cat-speechless.png' },
  { id: 'confused', label: '疑惑', src: '/stickers/cat-confused.png' },
  { id: 'thinking', label: '思考', src: '/stickers/cat-thinking.png' },
  { id: 'peek', label: '悄悄看', src: '/stickers/cat-peek.png' },
  { id: 'pocket', label: '探头', src: '/stickers/cat-pocket.png' },
  { id: 'please', label: '拜托', src: '/stickers/cat-please.png' },
  { id: 'cry', label: '大哭', src: '/stickers/cat-cry.png' },
  { id: 'angry', label: '生气', src: '/stickers/cat-angry.png' },
  { id: 'annoyed', label: '不高兴', src: '/stickers/cat-annoyed.png' },
  { id: 'smile', label: '微笑', src: '/stickers/cat-sparkle.png' },
  { id: 'tired', label: '累了', src: '/stickers/cat-tired.png' },
  { id: 'sleepy', label: '困困', src: '/stickers/cat-sleepy.png' },
  { id: 'goodnight', label: '晚安', src: '/stickers/cat-goodnight.png' },
];

const STICKER_BY_ID = new Map(CHAT_STICKERS.map((sticker) => [sticker.id, sticker]));
const STICKER_TOKEN_PATTERN = /\[\[sticker:([a-z0-9-]+)\]\]/g;

export type MessagePart =
  | { type: 'text'; value: string }
  | { type: 'sticker'; sticker: ChatSticker };

export function stickerToken(id: string): string {
  return `[[sticker:${id}]]`;
}

export function parseMessageParts(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let cursor = 0;

  for (const match of content.matchAll(STICKER_TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: 'text', value: content.slice(cursor, index) });
    const sticker = STICKER_BY_ID.get(match[1]);
    if (sticker) parts.push({ type: 'sticker', sticker });
    else parts.push({ type: 'text', value: match[0] });
    cursor = index + match[0].length;
  }

  if (cursor < content.length) parts.push({ type: 'text', value: content.slice(cursor) });
  return parts.length ? parts : [{ type: 'text', value: content }];
}

export const STICKER_SYSTEM_PROMPT = [
  'You may use the website sticker pack in your reply when it fits the emotion.',
  'Insert a sticker with the exact standalone syntax [[sticker:id]].',
  `Available stickers: ${CHAT_STICKERS.map((sticker) => `${sticker.id} (${sticker.label})`).join(', ')}.`,
  'Use at most one sticker per reply unless the user explicitly asks for more. Never invent sticker ids.',
].join('\n');
