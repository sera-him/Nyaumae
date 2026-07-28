// ═══════════════════════════════════════════════════════════════
//  FSIII 9-Tier Shared Design System
//  满格基准 235，起点 85，EX 溢出
// ═══════════════════════════════════════════════════════════════

export type Tier = 'EX' | 'SS' | 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

export interface TierStyle {
  tier: Tier;
  barGradient: string;     // Tailwind gradient classes
  scoreClass: string;        // Score number styling
  rankBadgeClass: string;    // Rank circle styling
  glow?: string;             // Optional glow/shadow
  overflow?: boolean;        // Whether overflow effect
}

export function getTier(score: number): Tier {
  if (score > 235) return 'EX';
  if (score >= 200) return 'SS';
  if (score >= 180) return 'S+';
  if (score >= 170) return 'S';
  if (score >= 150) return 'A';
  if (score >= 130) return 'B';
  if (score >= 110) return 'C';
  if (score >= 100) return 'D';
  return 'E';
}

export function getTierStyle(score: number): TierStyle {
  const tier = getTier(score);
  switch (tier) {
    case 'EX':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-rose-300 via-amber-200 via-orange-200 via-emerald-300 via-sky-300 via-violet-300 to-pink-300',
        scoreClass: 'bg-gradient-to-r from-amber-200 via-rose-300 to-red-400 bg-clip-text text-transparent drop-shadow-lg',
        rankBadgeClass: 'bg-gradient-to-br from-amber-200/20 via-rose-300/20 to-red-400/20 text-amber-200 border border-amber-200/30',
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]',
        overflow: true,
      };
    case 'SS':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-rose-300 via-orange-200 via-amber-100 via-emerald-300 to-sky-300',
        scoreClass: 'bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent drop-shadow-md',
        rankBadgeClass: 'bg-gradient-to-br from-rose-300/20 to-pink-400/20 text-rose-300 border border-rose-300/30',
        glow: 'shadow-[0_0_8px_rgba(244,114,182,0.1)]',
      };
    case 'S+':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300',
        scoreClass: 'bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-md',
        rankBadgeClass: 'bg-gradient-to-br from-emerald-300/20 to-cyan-300/20 text-emerald-300 border border-emerald-300/30',
        glow: 'shadow-[0_0_8px_rgba(52,211,153,0.1)]',
      };
    case 'S':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-orange-300 via-amber-100 to-emerald-300',
        scoreClass: 'text-orange-300 drop-shadow-sm',
        rankBadgeClass: 'bg-orange-300/15 text-orange-300 border border-orange-300/20',
        glow: 'shadow-[0_0_6px_rgba(253,186,116,0.08)]',
      };
    case 'A':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300',
        scoreClass: 'text-cyan-300 drop-shadow-sm',
        rankBadgeClass: 'bg-cyan-300/15 text-cyan-300 border border-cyan-300/20',
        glow: 'shadow-[0_0_6px_rgba(34,211,238,0.08)]',
      };
    case 'B':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-sky-300 to-violet-300',
        scoreClass: 'text-sky-300',
        rankBadgeClass: 'bg-sky-300/15 text-sky-300 border border-sky-300/20',
      };
    case 'C':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-violet-300 to-pink-300',
        scoreClass: 'text-violet-300',
        rankBadgeClass: 'bg-violet-300/15 text-violet-300 border border-violet-300/20',
      };
    case 'D':
      return {
        tier,
        barGradient: 'bg-gradient-to-r from-slate-400/50 to-slate-500/30',
        scoreClass: 'text-slate-400/80',
        rankBadgeClass: 'bg-slate-400/12 text-slate-400/80 border border-slate-400/20',
      };
    case 'E':
      return {
        tier,
        barGradient: 'bg-slate-500/25',
        scoreClass: 'text-slate-500',
        rankBadgeClass: 'bg-slate-500/10 text-slate-500 border border-slate-500/15',
      };
  }
}

/** Position in % on the chart.
 *  Normal range 85-235 maps to 0-95%.
 *  Overflow: Eirene 831 → fixed at 97.5% (240), Damocles 1314 → fixed at 100% (245).
 *  This makes overflow bars extend just slightly past the 235 axis line.
 */
export function getPositionPercent(score: number): number {
  const BASE_MIN = 85;
  const BASE_MAX = 235;

  if (score <= BASE_MIN) return 0;
  if (score > BASE_MAX) {
    // Map actual overflow scores to visual overflow positions
    if (score >= 1000) return 100; // Damocles 1314 → 245 position (100%)
    return 97.5; // Eirene 831 → 240 position (97.5%)
  }
  // Normal range maps to 0-95%
  return ((score - BASE_MIN) / (BASE_MAX - BASE_MIN)) * 95;
}

/** Tier color for simple text (used in Characters.tsx etc) */
export const tierTextColor: Record<Tier, string> = {
  'EX': 'text-amber-200',
  'SS': 'text-rose-300',
  'S+': 'text-emerald-300',
  'S': 'text-orange-300',
  'A': 'text-cyan-300',
  'B': 'text-sky-300',
  'C': 'text-violet-300',
  'D': 'text-slate-400/80',
  'E': 'text-slate-500',
};
