// Auto-extracted model block: types, static content tables and pure helpers.
// Kept in a separate module so the UI file only holds rendering concerns.
import { readJsonStorage } from '@/lib/browserStorage';
export type Need = 'snack' | 'play' | 'nap';
export type Phase = 'intro' | 'arrange' | 'resolving' | 'result' | 'upgrade';
export type SoundKind = 'tap' | 'swap' | 'lever' | 'score' | 'gold';

export interface CatDefinition {
  id: string;
  name: string;
  face: string;
  coat: string;
  trait: 'share' | 'night' | 'cuddle' | 'rainbow' | 'zoom' | 'box' | 'socks' | 'lucky' | 'choir';
  traitIcon: string;
  traitName: string;
  traitText: string;
}

export interface Cat extends CatDefinition {
  need: Need;
}

export interface RoundEvent {
  id: string;
  icon: string;
  name: string;
  description: string;
  featuredNeed?: Need;
  scorePerMatch?: number;
  perfectRowBonus?: number;
  edgeBonus?: number;
  fishPerPerfect?: number;
}

export interface MachineModule {
  id: string;
  icon: string;
  name: string;
  description: string;
  color: string;
}

export interface RoundResult {
  total: number;
  rawTotal: number;
  growthBonus: number;
  base: number;
  traitBonus: number;
  rowBonus: number;
  moduleBonus: number;
  eventBonus: number;
  goldBonus: number;
  fishEarned: number;
  energyGain: number;
  matches: number;
  perfectRows: number[];
  matchedIndices: number[];
  nextStreak: number;
  headline: string;
}

export interface SavedProgress {
  version: 1;
  savedAt: number;
  round: number;
  cats: Array<{ id: string; need: Need }>;
  stations: Need[];
  score: number;
  fish: number;
  energy: number;
  streak: number;
  moduleIds: string[];
}

export interface LoadedProgress extends SavedProgress {
  offlineGain: number;
}

export const MODULE_INTERVAL = 3;
export const SAVE_KEY = 'cat-machine:incremental-save:v1';
export const NEED_ORDER: Need[] = ['snack', 'play', 'nap'];

export const NEEDS: Record<Need, { icon: string; label: string; station: string; short: string }> = {
  snack: { icon: '🐟', label: '想吃鱼', station: '投喂舱', short: '吃鱼' },
  play: { icon: '🪶', label: '想玩耍', station: '逗猫舱', short: '玩耍' },
  nap: { icon: '📦', label: '想睡觉', station: '纸箱舱', short: '睡觉' },
};

export const CAT_DEFINITIONS: CatDefinition[] = [
  {
    id: 'ju-bao',
    name: '橘宝',
    face: '😺',
    coat: 'orange',
    trait: 'share',
    traitIcon: '🍊',
    traitName: '分一口',
    traitText: '在投喂舱满意时，左右每只满意猫再加 2 呼噜。',
  },
  {
    id: 'mo-mo',
    name: '墨墨',
    face: '🐈‍⬛',
    coat: 'black',
    trait: 'night',
    traitIcon: '🌙',
    traitName: '夜巡',
    traitText: '满意且同列三只猫的愿望各不相同时，加 4 呼噜。',
  },
  {
    id: 'nai-tang',
    name: '奶糖',
    face: '😸',
    coat: 'cream',
    trait: 'cuddle',
    traitIcon: '🎀',
    traitName: '贴贴',
    traitText: '满意且左右有满意的邻居时，加 3 呼噜。',
  },
  {
    id: 'hua-juan',
    name: '花卷',
    face: '😽',
    coat: 'calico',
    trait: 'rainbow',
    traitIcon: '🌈',
    traitName: '三色',
    traitText: '满意且这一层三只猫的愿望各不相同时，加 4 呼噜。',
  },
  {
    id: 'dou-bao',
    name: '豆包',
    face: '🙀',
    coat: 'blue',
    trait: 'zoom',
    traitIcon: '⚡',
    traitName: '暴走',
    traitText: '在逗猫舱满意时，加 4 呼噜。',
  },
  {
    id: 'tuan-zhang',
    name: '团长',
    face: '😼',
    coat: 'brown',
    trait: 'box',
    traitIcon: '📦',
    traitName: '箱霸',
    traitText: '在纸箱舱满意时，加 4 呼噜。',
  },
  {
    id: 'bai-wa',
    name: '白袜',
    face: '😹',
    coat: 'tuxedo',
    trait: 'socks',
    traitIcon: '🧦',
    traitName: '占边',
    traitText: '满意且坐在一层的左端或右端时，加 2 呼噜。',
  },
  {
    id: 'zhi-ma',
    name: '芝麻',
    face: '😻',
    coat: 'silver',
    trait: 'lucky',
    traitIcon: '✨',
    traitName: '好运',
    traitText: '满意时至少加 1 呼噜；每四次轮到幸运座位时会加 6。',
  },
  {
    id: 'bu-ding',
    name: '布丁',
    face: '😴',
    coat: 'lilac',
    trait: 'choir',
    traitIcon: '🎵',
    traitName: '合唱',
    traitText: '满意且整层三只猫都满意时，加 4 呼噜。',
  },
];

export const INITIAL_NEEDS: Need[] = [
  'snack', 'play', 'snack',
  'nap', 'play', 'nap',
  'nap', 'snack', 'play',
];

export const EVENTS: RoundEvent[] = [
  {
    id: 'sunbeam',
    icon: '☀️',
    name: '午后阳光',
    description: '晒到太阳的纸箱最舒服：每只“睡觉满意”的猫 +2 呼噜。',
    featuredNeed: 'nap',
    scorePerMatch: 2,
  },
  {
    id: 'paper-bag',
    icon: '🛍️',
    name: '纸袋空投',
    description: '纸袋里有鱼味：每只“吃鱼满意”的猫 +2 呼噜。',
    featuredNeed: 'snack',
    scorePerMatch: 2,
  },
  {
    id: 'moth-party',
    icon: '🦋',
    name: '飞蛾大会',
    description: '全员眼睛发亮：每只“玩耍满意”的猫 +2 呼噜。',
    featuredNeed: 'play',
    scorePerMatch: 2,
  },
  {
    id: 'cat-live',
    icon: '📹',
    name: '猫咪直播',
    description: '观众爱看整齐场面：每条完美整层额外 +4 呼噜。',
    perfectRowBonus: 4,
  },
  {
    id: 'window-rain',
    icon: '🌧️',
    name: '窗边小雨',
    description: '坐在每层两端更有氛围：边位满意猫 +2 呼噜。',
    edgeBonus: 2,
  },
  {
    id: 'treat-day',
    icon: '🐟',
    name: '猫条发薪日',
    description: '每条完美整层多带回 1 条鱼干。',
    fishPerPerfect: 1,
  },
  {
    id: 'robot',
    icon: '🤖',
    name: '扫地机器人出没',
    description: '追车时间到：每只“玩耍满意”的猫 +3 呼噜。',
    featuredNeed: 'play',
    scorePerMatch: 3,
  },
  {
    id: 'quiet-hour',
    icon: '🌙',
    name: '深夜静音档',
    description: '呼噜声格外清楚：每条完美整层额外 +5 呼噜。',
    perfectRowBonus: 5,
  },
];

export const MODULES: MachineModule[] = [
  { id: 'snack-press', icon: '🐟', name: '猫条挤压器', description: '每只吃鱼满意猫 +2 呼噜。', color: '#ff9e64' },
  { id: 'laser-prism', icon: '🔴', name: '激光棱镜', description: '每只玩耍满意猫 +2 呼噜。', color: '#f76c82' },
  { id: 'warm-box', icon: '📦', name: '恒温纸箱', description: '每只睡觉满意猫 +2 呼噜。', color: '#a98bf5' },
  { id: 'purr-amp', icon: '🔊', name: '呼噜放大器', description: '每条完美整层 +4 呼噜。', color: '#70d7c7' },
  { id: 'buddy-radar', icon: '📡', name: '贴贴雷达', description: '每对横向相邻的满意猫 +2 呼噜。', color: '#76b7ff' },
  { id: 'paw-cache', icon: '🐾', name: '软爪缓存', description: '摇铃时每剩 1 次操作 +3 呼噜。', color: '#f0bd64' },
  { id: 'gold-polish', icon: '✨', name: '金球抛光机', description: '金色呼噜倍率 ×1.5 起，每级 +0.15（Lv1=×1.65，Lv2=×1.8，上限6级）。', color: '#ffd56a' },
  { id: 'fish-bank', icon: '🧺', name: '鱼干小金库', description: '每条完美整层再赚 1 条鱼干。', color: '#7fd69c' },
  { id: 'treat-drawer', icon: '🗄️', name: '零食暗格', description: '购买额外猫爪只需 2 鱼干。', color: '#ef9ed5' },
];

export function createInitialCats(): Cat[] {
  return CAT_DEFINITIONS.map((cat, index) => ({ ...cat, need: INITIAL_NEEDS[index] }));
}

export function moduleLevel(modules: MachineModule[], id: string): number {
  return modules.filter((module) => module.id === id).length;
}

export function levelThreshold(level: number): number {
  if (level <= 1) return 0;
  return Math.round(90 * Math.pow(level - 1, 1.45));
}

export function getShopLevel(score: number): number {
  let level = 1;
  while (score >= levelThreshold(level + 1)) level += 1;
  return level;
}

export function loadSavedProgress(): LoadedProgress | null {
  try {
    const parsed = readJsonStorage<Partial<SavedProgress> | null>(SAVE_KEY, null, {
      currentVersion: 1,
      getVersion: (value) => value && typeof value === 'object' && 'version' in value && typeof value.version === 'number' ? value.version : 0,
      migrations: { 0: (value) => ({ ...(value && typeof value === 'object' ? value : {}), version: 1 }) },
    }).value;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.cats) || !Array.isArray(parsed.stations)) return null;

    const cats = parsed.cats
      .map((savedCat) => {
        const definition = CAT_DEFINITIONS.find((cat) => cat.id === savedCat.id);
        return definition && NEED_ORDER.includes(savedCat.need) ? { id: definition.id, need: savedCat.need } : null;
      })
      .filter((cat): cat is { id: string; need: Need } => cat !== null);
    if (cats.length !== CAT_DEFINITIONS.length || parsed.stations.length !== 3) return null;

    const score = Math.max(0, Number(parsed.score) || 0);
    const elapsedMinutes = Math.min(240, Math.floor((Date.now() - (Number(parsed.savedAt) || Date.now())) / 60_000));
    const offlineGain = Math.max(0, Math.floor(elapsedMinutes * Math.max(0, getShopLevel(score) - 1) * 0.25));

    return {
      version: 1,
      savedAt: Number(parsed.savedAt) || Date.now(),
      round: Math.max(1, Math.floor(Number(parsed.round) || 1)),
      cats,
      stations: parsed.stations.every((need) => NEED_ORDER.includes(need))
        ? parsed.stations as Need[]
        : ['snack', 'play', 'nap'],
      score,
      fish: Math.max(0, Math.floor(Number(parsed.fish) || 0)),
      energy: Math.max(0, Math.min(100, Number(parsed.energy) || 0)),
      streak: Math.max(0, Math.floor(Number(parsed.streak) || 0)),
      moduleIds: Array.isArray(parsed.moduleIds)
        ? parsed.moduleIds.filter((id): id is string => MODULES.some((module) => module.id === id))
        : [],
      offlineGain,
    };
  } catch {
    return null;
  }
}

export function restoreCats(saved: LoadedProgress | null): Cat[] {
  if (!saved) return createInitialCats();
  return saved.cats.map((savedCat) => ({
    ...CAT_DEFINITIONS.find((cat) => cat.id === savedCat.id)!,
    need: savedCat.need,
  }));
}

export function areAdjacent(a: number, b: number): boolean {
  const rowA = Math.floor(a / 3);
  const rowB = Math.floor(b / 3);
  const colA = a % 3;
  const colB = b % 3;
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}

export function simpleLayoutValue(cats: Cat[], stations: Need[]): number {
  let value = 0;
  for (let row = 0; row < 3; row += 1) {
    let rowMatches = 0;
    for (let col = 0; col < 3; col += 1) {
      if (cats[row * 3 + col].need === stations[row]) rowMatches += 1;
    }
    value += rowMatches;
    if (rowMatches === 3) value += 3;
  }
  return value;
}

export function getRank(level: number): { icon: string; name: string } {
  if (level >= 20) return { icon: '👑', name: `无限猫塔 · ${level}F` };
  if (level >= 12) return { icon: '🏆', name: '传奇猫店长' };
  if (level >= 7) return { icon: '🌟', name: '金牌喵务官' };
  if (level >= 4) return { icon: '✨', name: '熟练店员' };
  if (level >= 2) return { icon: '🐈', name: '靠谱帮手' };
  return { icon: '🐾', name: '实习铲屎官' };
}
