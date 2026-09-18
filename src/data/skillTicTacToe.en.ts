// English mirror of ./skillTicTacToe — same structure, English text.
import type { Profession, Skill } from './skillTicTacToe';

export const skillTicTacToeOverviewEn = {
  title: 'Skill Tic-Tac-Toe — probability tic-tac-toe',
  subtitle: 'Traditional tic-tac-toe × probability mechanics × SP skill system',
  objective: 'Line up three of your symbols (O or X) in a row, column or diagonal',
  coreMechanic: 'Every cell has its own action success probability. When placing, roll the probability die; on failure, your turn is skipped. There are no draws (Rolling Thunder can still clear a full board).',
};

export const probabilityAlgorithmEn = `
Probability generation based on a normal-distribution perturbation system:

1. Define a weight function: p[i] = i^(11/16), i = 1..N (N = 2,000,000)
2. Define a decay kernel: nn[i] = exp(-i²d²/2) / √(2π), d = 1/120000
3. Pick 9 distinct representative values res[0..8] by rejection-sampling roulette
4. After each draw, decay all p[i]: p[i] /= (1 + nn[|i-res|])
5. Finally, each cell's actual success rate = base value × res[idx] × d

This keeps the 9 cells' success rates correlated yet distinct, forming a rich strategy space.
`;

export const spSystemRulesEn = {
  title: 'SP (Skill Point) system',
  initialSP: [
    { player: 'First player (O)', sp: 10, note: 'Smaller opening edge, but holds information advantage' },
    { player: 'Second player (X)', sp: 15, note: 'Larger opening edge, with resource compensation' },
  ],
  spCap: 30,
  spIncome: '+3 SP / turn',
  failureCompensation: [
    { cell: 'Center (5)', sp: '+3 SP' },
    { cell: 'Corners (1,3,7,9)', sp: '+4 SP' },
    { cell: 'Others', sp: '+6 SP' },
  ],
  professionTax: [
    { count: '1st', extra: '0 SP' },
    { count: '2nd', extra: '+5 SP' },
    { count: '3rd', extra: '+10 SP' },
    { count: '4th', extra: '+15 SP' },
    { count: '5th', extra: '+20 SP' },
    { count: '6th', extra: '+25 SP' },
    { count: '7th', extra: '+30 SP' },
    { count: '8th', extra: '+35 SP' },
  ],
  buyRules: [
    'Buying an opponent\'s profession: costs 5/3 × the original price',
    'Seizing an opponent\'s profession: costs 10/3 × the original price',
    'Forgetting your own profession: refunds ⌊original price/3⌋ SP',
  ],
};

export const professionsEn: Profession[] = [
  {
    name: 'Gambler',
    type: 'Profession',
    spCost: 18,
    effect: 'On each failed action, 20% chance not to skip your turn (gain one retry)',
    color: 'from-rose-400 to-red-400',
  },
  {
    name: 'Mathematician',
    type: 'Profession',
    spCost: 10,
    effect: 'See success rates to two decimal places (others only see the nearest multiple of 5%)',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    name: 'Tyrant',
    type: 'Profession',
    spCost: 18,
    effect: 'Gain the exclusive skill "Tyrant\'s Grip". Using it raises all of the opponent\'s SP costs next turn',
    color: 'from-purple-500 to-violet-500',
  },
  {
    name: 'Monk',
    type: 'Profession',
    spCost: 9,
    effect: 'At the start of each turn, if SP < 5, restore to 5 SP automatically',
    color: 'from-amber-400 to-yellow-400',
  },
  {
    name: 'Assassin',
    type: 'Profession',
    spCost: 15,
    effect: 'For corner cells (1,3,7,9), total success rate +33% (randomly allocated)',
    color: 'from-red-500 to-red-600',
  },
  {
    name: 'Investor',
    type: 'Profession',
    spCost: 14,
    effect: 'At the start of each turn, for every 7 SP held, gain +1 SP extra',
    color: 'from-emerald-400 to-green-400',
  },
  {
    name: 'Matthew',
    type: 'Profession',
    spCost: 24,
    effect: 'Each turn, spend 2 SP to pick 2 empty cells; the higher-probability one +10%, the lower one -10%',
    color: 'from-indigo-400 to-blue-500',
  },
  {
    name: 'Capitalist',
    type: 'Profession',
    spCost: 27,
    effect: 'Whenever the opponent spends SP, you gain 10% of the amount (rounded). A successful SP Siphon automatically re-triggers Siphon',
    color: 'from-yellow-400 to-amber-500',
  },
];

export const activeSkillsEn: Skill[] = [
  {
    name: 'Rolling Thunder',
    type: 'Active',
    spCost: 'max(1, 25 + n(n+1)/2 - r - ⌊r²/42⌋)',
    effect: 'Thunder strikes all occupied pieces; each piece is independently judged for removal',
    detail: 'n = times used, r = turns since last use. Price rises with usage and falls with cooldown',
  },
  {
    name: 'Swap Fates',
    type: 'Active',
    spCost: '15',
    effect: 'Swap the success rates of any two cells. Costs +10 SP if the center cell is involved',
  },
  {
    name: 'Probability Surge',
    type: 'Active',
    spCost: '10',
    effect: 'Success rate +20% when placing this turn',
  },
  {
    name: 'Renew',
    type: 'Active',
    spCost: '10',
    effect: 'Permanently re-roll a chosen cell\'s success rate (regenerated with the full algorithm)',
  },
  {
    name: 'Absolutely Collapse',
    type: 'Active',
    spCost: '22',
    effect: 'Regenerate the success rates of all 9 cells',
  },
  {
    name: 'Mind Maze',
    type: 'Active',
    spCost: '12',
    effect: 'The opponent\'s next placement can only pick from a random half (rounded up) of the empty cells (at most half; affected by seal/rewrite; skipping costs nothing, but the restriction must be eaten once)',
  },
  {
    name: 'Spatial Seal',
    type: 'Active',
    spCost: '8',
    effect: 'Pick any cell; until the end of the opponent\'s turn, neither side may choose it',
  },
  {
    name: 'Decoy Trap',
    type: 'Active',
    spCost: '6',
    effect: 'Pick any cell; the opponent sees a fake high probability (displayed = original + 14~16%, real = original - 4~6%)',
    detail: 'The displayed value is ~18~22% above the new real value',
  },
  {
    name: 'Venture Investment',
    type: 'Active',
    spCost: '20',
    effect: 'Success rate +15% when placing this turn; on success refunds 15 SP, on failure no refund',
  },
  {
    name: 'Wheel of Fate',
    type: 'Active',
    spCost: '10',
    effect: 'Pick any cell (may be occupied, freely chosen); its success rate becomes fully random 0%~100% (real value hidden, displayed as white ???)',
  },
  {
    name: 'Overdraft Protocol',
    type: 'Active',
    spCost: '-3 (restores 3 SP)',
    effect: 'Action success rate -3% × overdraft count. Max overdraft count = round(SP cap / 6)',
  },
  {
    name: 'Debt Repayment',
    type: 'Active',
    spCost: '5',
    effect: 'Overdraft count -1',
  },
  {
    name: 'Info Overload',
    type: 'Active',
    spCost: '17',
    effect: 'The opponent is severely disrupted next turn and cannot read information normally. Becomes permanent after the 15th use',
  },
  {
    name: 'Grid Rewrite',
    type: 'Active',
    spCost: '5 + 2x',
    effect: 'Block all of the opponent\'s cells and give them a 1–9 keypad (numbers randomly mapped to physical cells). The opponent clicks numbers to unlock and place; if the opponent also uses Grid Rewrite, the block is lifted',
  },
  {
    name: 'SP Siphon',
    type: 'Active / Special',
    spCost: '0',
    effect: 'Skip this turn (no placement) and siphon 1 SP from the opponent; if the opponent failed this turn, additionally siphon 30% of their SP (rounded down)',
  },
  {
    name: 'Skip Protocol',
    type: 'Active / Special',
    spCost: '-5 (restores 5 SP)',
    effect: 'Skip this turn (no placement). If the opponent used SP Siphon last turn, the Siphon is nullified and the opponent gains no SP for the next 1 turn (if the opponent is a Capitalist) or 2 turns (otherwise), and cannot use SP Siphon either',
  },
  {
    name: 'Capacitor Core',
    type: 'Active / Special',
    spCost: '-3 (restores 3 SP)',
    effect: 'Skip this turn (no placement). SP cap permanently ×1.2 (rounded down), cap not exceeding 2^60',
  },
  {
    name: 'Matthew Shift',
    type: 'Active',
    spCost: '2',
    effect: 'Pick any two cells; the higher-probability one +10%, the lower one -10% (costs 2 SP). Requires the Matthew profession',
  },
  {
    name: 'Tyrant\'s Grip',
    type: 'Active',
    spCost: '0 + 5 per use / -3 per stop (minimum 0)',
    effect: 'All of the opponent\'s SP costs rise to ceil(1.5x+5) next turn, minimum -5. Profession prices are affected too. Requires the Tyrant profession',
  },
];

export const lightningRodSystemEn = [
  {
    name: 'Lightning Rod — Purchase',
    type: 'Item',
    spCost: 'round(42·ln(1+4x/27))',
    effect: 'x = number bought at once; bulk purchases get a discount. Obtains Lightning Rod items',
  },
  {
    name: 'Lightning Rod — Deploy',
    type: 'Active',
    spCost: '0 (consumes an item)',
    effect: 'Deploy on any cell; success rate = that cell\'s success rate × 35% + 20%. Max 9 rods per player per cell, 10 in total. Beyond the limit the success rate is fixed at 27.5%; on success the opponent loses 1 rod',
  },
  {
    name: 'Lightning Rod — Shield',
    type: 'Passive',
    spCost: '0',
    effect: 'a = (own rods × 2 + (own lightning? 4:3)) × (own lightning? 1.2:1). Lightning hit probability = 3×(1-(a/26.5)²)/a',
  },
  {
    name: 'Lightning Rod — Reckoning',
    type: 'Passive',
    spCost: '0',
    effect: 'After a lightning hit, both sides\' rod counts on that cell halve (rounded up). The owner of a struck piece gains ceil(own rods/2) SP; the opponent gives none',
  },
];
