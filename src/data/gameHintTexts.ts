// 游戏搜索元数据（game key / 名称 / 跳转路由）。
// 2026-10-12 起 texts 已迁出：凡 src/game/** 有源码的游戏，文本统一走语料通道
// （scripts/generate-frequency-corpus.mjs 的 EXTRA_SCAN_FILES + EXTRA_HREF，
// 与 fullSearchIndex 共享同一套 AST 提取逻辑）。旧版 texts 是模板占位替换版
// （`${n}` 被抹掉），与源码模板形态不同，双通道并存会双双计入词频。
// 仅 giant-catch 一个游戏没有源码（src/game/** 下无对应目录），其 texts
// 是唯一副本，保留在此；stellar 的文本在 src/game/data.ts 的
// CONDITION_TEMPLATES，已走语料通道。
// 此文件的 texts 清空后，fullSearchIndex 的 game-hint_* 条目退化为纯元数据
// （命中标题仍可跳转），词频由语料单通道承担。
export interface GameHintText {
  game: string;
  name: string;
  href: string;
  texts: string[];
}

export const gameHintTexts: GameHintText[] = [
  {
    game: 'chess',
    name: '复合象棋',
    href: '/playground/games/compound-chess',
    texts: [],
  },
  {
    game: 'city-builder',
    name: '建设城市',
    href: '/playground/games/city-builder',
    texts: [],
  },
  {
    game: 'stellar',
    name: '星际战线 Stellar',
    href: '/playground/games/stellar',
    texts: [],
  },
  {
    game: 'hell-maze',
    name: '地狱迷宫·VI',
    href: '/playground/games/hell-maze-vi',
    texts: [],
  },
  {
    game: 'neural-clash',
    name: '神经交锋',
    href: '/playground/games/neural-clash',
    texts: [],
  },
  {
    game: 'recursive-echo',
    name: '递归回响',
    href: '/playground/games/fractal-echo',
    texts: [],
  },
  {
    game: 'ttt3',
    name: '技能井字棋',
    href: '/playground/games/skill-tic-tac-toe',
    texts: [],
  },
  {
    game: 'three-holes',
    name: '三孔谜题',
    href: '/playground/games',
    texts: [],
  },
  {
    game: 'save',
    name: '存档系统',
    href: '/playground',
    texts: [],
  },
  {
    game: 'giant-catch',
    name: '大人国抓小人',
    href: '/playground/games/giant-catch',
    texts: [
      '大人国抓小人：撑过限定回合即获胜，被小满的指尖碰到则她获胜。',
      '喵呜每回合移动 1 格，全场共有 3 次冲刺：直线连跑 2 格。',
      '小满每两回合伸一次手指：移动 1 格或直线 2 格，指尖经过的每一格都算。',
      '交通锥、轮胎和纸箱棋子会挡住喵呜，但挡不住小满的指尖。',
      '不能踏上小满的指尖所在格。',
      '追逐从 A8 与 I2 之间开始。',
    ],
  },
];
