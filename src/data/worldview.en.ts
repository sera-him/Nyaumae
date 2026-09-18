// English mirror of ./worldview — same structure, English text.
import { charactersEn } from './characters.en';
import { extraCharactersEn } from './extraCharacters.en';

export const worldviewStatsEn = [
  { label: 'World population', value: '1,207,963,268', unit: 'people' },
  { label: 'Average lifespan', value: '74', unit: 'yrs 6 mo 24 d' },
  { label: 'QET written-exam cap', value: '65,536', unit: 'people' },
  { label: 'QET final admissions', value: '16', unit: 'people' },
];

export const regionFsiiiStatsEn = {
  average: 102.31,
  range: [100.01, 104.72] as const,
};

const fsiiiScoresEn = [
  ...charactersEn.filter((character) => character.fsiii !== undefined)
    .map((character) => ({ name: character.name, score: character.fsiii! })),
  ...extraCharactersEn.filter((character) => character.fsiii !== undefined)
    .map((character) => ({ name: character.name, score: character.fsiii! })),
].sort((a, b) => b.score - a.score);

export const fsiiiRankingsEn = fsiiiScoresEn.reduce<Array<{ rank: number; name: string; score: number }>>(
  (rankings, entry, index) => {
    const previous = rankings[index - 1];
    const rank = previous && previous.score === entry.score ? previous.rank : index + 1;
    rankings.push({ rank, ...entry });
    return rankings;
  },
  [],
);

export const heightWeightModelEn = [
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

export const modelNamesEn = ['Free', 'Linear-bias', 'Constrained', 'Composite', 'Polynomial', 'Oxford', 'Square', 'Cubic', 'No-infant', 'Miia'];

export interface HolidayEn {
  date: string;
  name: string;
  desc?: string;
}

export const worldviewInfoEn = {
  holidays: [
    { date: '1.1', name: 'New Year', desc: 'A new consciousness cycle begins' },
    { date: '1.28', name: 'International Algebra Day', desc: 'Commemorating algebra\'s founding role in modern thought' },
    { date: '6.26', name: 'International Geometry Day', desc: 'Alias: International Logarithm Day' },
  ] as HolidayEn[],
  qet: {
    total: 1000,
    note: '1,000–1,500 applicants (including third-year mock examinees); 65,536 is the theoretical cap',
    written: { score: 500, maxApplicants: 65536, maxPass: 256, fee: 128 },
    practical: { score: 500, maxApplicants: 256, maxPass: 16, fee: 512 },
  },
};
