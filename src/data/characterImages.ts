import { p } from '../lib/utils.ts';

const rawCharacterImages: Record<string, string> = {
  'high-school-student': 'characters/high-school-student.png',
  linmo: 'characters/linmo.png',
  gpt: 'characters/gpt.png',
  wangshu: 'characters/wangshu.png',
  neon: 'characters/neon.png',
  changfeng: 'characters/changfeng-generated.jpg',
  chuxia: 'characters/chuxia-generated.jpg',
  xiaoman: 'characters/xiaoman-generated.jpg',
  xiaohe: 'characters/xiaohe-generated.jpg',
  xiaogu: 'characters/xiaogu-generated.jpg',
  miaowu: 'characters/miaowu-generated.jpg',
  xiulan: 'characters/xiulan-generated.jpg',
  zhouji: 'characters/zhouji-generated.jpg',
  'delivery-rider': 'characters/delivery-rider-generated.jpg',
  miia: 'characters/miia-generated.png',
  mia: 'characters/mia-generated.png',
  miya: 'characters/miya-generated.png',
  amiya: 'characters/amiya-generated.png',
  miacubic: 'characters/miacubic-generated.png',
  lila: 'characters/lila-generated.png',
  mxy: 'characters/mxy.jpg',
  nimfa: 'characters/nimfa.jpg',
  nihilib: 'characters/nihilib.jpg',
  miku: 'characters/miku.jpg',
  qicheng: 'characters/qicheng.jpg',
  haruka: 'characters/haruka.jpg',
  linqian: 'characters/linqian.jpg',
  ifchan: 'characters/ifchan.jpg',
  hamster: 'characters/hamster.jpg',
  linshen: 'characters/linshen.jpg',
  zhaozhao: 'characters/zhaozhao.jpg',
  mowen: 'characters/mowen.jpg',
  mimi: 'characters/mimi.jpg',
  linear: 'characters/linear.jpg',
  dora: 'characters/dora.jpg',
  cola: 'characters/cola.jpg',
  mao: 'characters/mao.jpg',
  eirene: 'characters/eirene.jpg',
  damocles: 'characters/damocles.jpg',
  alice: 'characters/alice-wonderland.jpg',
  linkmo: 'characters/linkmo.jpg',
  quartus: 'characters/quartus.jpg',
  zero: 'characters/zero.jpg',
};

export const characterImages: Record<string, string> = {};
for (const [id, raw] of Object.entries(rawCharacterImages)) {
  characterImages[id] = p(raw);
}

// Character archives now use one canonical image per character.
// Legacy images remain in public/ for historical references, but are not displayed.
const rawMultiImages: Record<string, string[]> = {};

const multiImages: Record<string, string[]> = {};
for (const [id, raws] of Object.entries(rawMultiImages)) {
  multiImages[id] = raws.map(r => p(r));
}

export function getCharacterImage(id: string): string | undefined {
  return characterImages[id];
}

export function getCharacterImageLocal(id: string): string | undefined {
  const raw = rawCharacterImages[id];
  return raw ? `/${raw}` : undefined;
}

export function getCharacterCardImageLocal(id: string): string | undefined {
  return id === 'alice' ? '/characters/alice-card.jpg' : getCharacterImageLocal(id);
}

export function getCharacterImageSet(id: string): string[] | undefined {
  return multiImages[id];
}

export function getCharacterImageSetLocal(id: string): string[] | undefined {
  const raw = rawMultiImages[id];
  return raw ? raw.map(r => `/${r}`) : undefined;
}
