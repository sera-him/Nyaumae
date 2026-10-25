import { p } from '../lib/utils.ts';

const rawCharacterImages: Record<string, string> = {
  'high-school-student': 'characters/linmo.png',
  linmo: 'characters/high-school-student.png',
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
  retina: 'characters/retina.jpg',
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
  miiya: 'characters/miiya/portrait.jpg',
};

export const characterImages: Record<string, string> = {};
for (const [id, raw] of Object.entries(rawCharacterImages)) {
  characterImages[id] = p(raw);
}

// Character archives now use one canonical image per character.
// Legacy images remain in public/ for historical references, but are not displayed.
//
// 图集：需要多张形象图的角色在此登记（数组里第 1 张同时作为卡面/头像）。
// 只登记真实存在的文件——登记缺失文件会让角色页显示「图片加载失败」。
const rawMultiImages: Record<string, string[]> = {
  // 咪娅（Mi-iya）的素材目录：public/characters/miiya/
  // 头像/卡面 → public/characters/miiya/portrait.jpg（已在 rawCharacterImages 登记）
  // 图集      → public/characters/miiya/gallery-01.jpg、gallery-02.jpg …
  // 继续加图时，把文件名按顺序补进下面的数组即可，无需再改其它代码。
  // 注意：图集区块要 ≥2 张才显示，目前只有头像一张，所以不展示。
  miiya: ['characters/miiya/portrait.jpg'],
};

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

export interface CharacterVideo {
  /** 站点根目录起算的路径，例如 characters/miiya/clip-01.mp4。 */
  src: string;
  /** 封面图，未填则由浏览器取视频第一帧。 */
  poster?: string;
  caption?: string;
}

// ── 角色影像素材（视频）─────────────────────
// 视频不像图片那样走 srcset / 优化管线，所以直接登记原始文件路径。
// 约定：视频放在 public/characters/<角色 id>/ 下，例如
//   public/characters/miiya/clip-01.mp4、public/characters/miiya/clip-02.mp4
// 拿到文件后补进下面的登记即可，角色页会自动出现「影像素材」区块。
export const rawCharacterVideos: Record<string, CharacterVideo[]> = {
  miiya: [
    {
      src: 'characters/miiya/clip-01.mp4',
      poster: 'characters/miiya/clip-01-poster.jpg',
      caption: '咪娅的第一段影像：草地上的白色蝴蝶',
    },
  ],
};

export function getCharacterVideoSetLocal(id: string): CharacterVideo[] | undefined {
  const videos = rawCharacterVideos[id];
  if (!videos) return undefined;
  return videos.map((video) => ({
    ...video,
    src: `/${video.src}`,
    ...(video.poster ? { poster: `/${video.poster}` } : {}),
  }));
}

export function getCharacterImageSetLocal(id: string): string[] | undefined {
  const raw = rawMultiImages[id];
  return raw ? raw.map(r => `/${r}`) : undefined;
}
