export const worldviewStats = [
  { label: '世界观人口', value: '1,207,963,268', unit: '人' },
  { label: '人均寿命', value: '74', unit: '岁 6 月 24 天' },
  { label: 'QET 笔试上限', value: '65,536', unit: '人' },
  { label: 'QET 最终录取', value: '16', unit: '人' },
];

export const regionFsiiiStats = {
  average: 102.31,
  range: [100.01, 104.72] as const,
};

export const fsiiiRankings = [
  { rank: 1, name: 'Damocles', score: 1314 },
  { rank: 2, name: 'Eirene', score: 831 },
  { rank: 3, name: '咪呀', score: 226 },
  { rank: 3, name: 'Līlā', score: 226 },
  { rank: 5, name: 'あいえふちゃん', score: 180 },
  { rank: 6, name: '墨问', score: 177 },
  { rank: 7, name: '卡塔斯', score: 174 },
  { rank: 8, name: '莱尼尔', score: 165 },
  { rank: 9, name: 'mia³', score: 158 },
  { rank: 10, name: 'Nimfa', score: 144 },
  { rank: 10, name: 'Nihilib', score: 144 },
  { rank: 12, name: '初音ミク', score: 139 },
  { rank: 13, name: '棋程', score: 138 },
  { rank: 14, name: '墨璇玥.iv', score: 136 },
  { rank: 15, name: '赵召', score: 123 },
  { rank: 16, name: '林深', score: 120 },
  { rank: 17, name: '朵拉·卡可拉', score: 115 },
  { rank: 18, name: '星野遥', score: 114 },
  { rank: 19, name: '米雅', score: 109 },
  { rank: 19, name: 'Mia', score: 109 },
  { rank: 19, name: '米娅', score: 109 },
  { rank: 22, name: '林可梦', score: 105 },
  { rank: 23, name: '可乐', score: 103 },
  { rank: 24, name: '哈姆诗', score: 98 },
  { rank: 25, name: '零', score: 96 },
  { rank: 26, name: '米迷', score: 94 },
  { rank: 27, name: '墨奥幂.fc', score: 93 },
  { rank: 28, name: '爱丽丝', score: 92 },
  { rank: 29, name: '林浅', score: 90 },
];

export const heightWeightModel = [
  { height: 0.5, values: [3.25, 3.34, 3.44, 3.90, 3.88, 3.66, 4.07, 1.75, 1.49, 1.24] },
  { height: 0.6, values: [6.05, 5.82, 6.17, 5.59, 5.53, 5.42, 5.86, 3.02, 2.58, 2.14] },
  { height: 0.7, values: [8.57, 8.30, 8.47, 7.57, 7.51, 7.54, 7.98, 4.80, 4.10, 3.39] },
  { height: 0.8, values: [10.64, 10.79, 10.36, 9.84, 9.87, 10.05, 10.43, 7.17, 6.12, 5.06] },
  { height: 0.9, values: [12.74, 13.28, 12.60, 12.42, 12.63, 12.95, 13.19, 10.21, 8.71, 7.21] },
  { height: 1.0, values: [15.21, 15.76, 15.38, 15.35, 15.82, 16.24, 16.29, 14.00, 11.95, 9.89] },
  { height: 1.1, values: [18.27, 18.25, 18.77, 19.16, 19.48, 19.93, 19.71, 18.63, 15.91, 13.16] },
  { height: 1.2, values: [22.10, 20.73, 22.83, 23.56, 23.64, 24.03, 23.46, 24.19, 20.65, 17.09] },
  { height: 1.3, values: [26.88, 26.43, 27.63, 28.50, 28.34, 28.55, 27.53, 30.76, 26.25, 21.73] },
  { height: 1.4, values: [32.77, 33.79, 33.22, 33.98, 33.61, 33.48, 31.93, 38.42, 32.79, 27.14] },
  { height: 1.5, values: [39.95, 41.15, 39.68, 40.03, 39.47, 38.83, 36.65, 47.25, 40.33, 33.38] },
];

export const modelNames = ['自由', '线偏', '约束', '复合', '多项', '牛津', '平方', '立方', '无婴', '咪呀'];

export interface Holiday {
  date: string;
  name: string;
  desc?: string;
}

export const worldviewInfo = {
  holidays: [
    { date: '1.1', name: '新年', desc: '新的意识周期开始' },
    { date: '1.28', name: '国际代数日', desc: '纪念代数对现代思维的奠基' },
    { date: '6.26', name: '国际几何日', desc: '别名：国际对数日' },
  ] as Holiday[],
  qet: {
    total: 1000,
    note: '报名 1000-1500 人（含大三模拟考生），65536 为理论上限',
    written: { score: 500, maxApplicants: 65536, maxPass: 256, fee: 128 },
    practical: { score: 500, maxApplicants: 256, maxPass: 16, fee: 512 },
  },
};
