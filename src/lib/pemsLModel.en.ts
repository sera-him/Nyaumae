// English mirror of ./pemsLModel — same structure, English text.
import type { PemsDimensionConfig } from './pemsLModel';

export const PEMS_DIMENSIONS_EN: readonly PemsDimensionConfig[] = [
  { code: 'P', title: 'Physical Development', shortLabel: 'Physical', weight: 0.05, threshold: -1.5, slope: 1, color: '#22d3ee' },
  { code: 'E', title: 'Executive Function', shortLabel: 'Executive', weight: 0.3, threshold: -0.75, slope: 1.6, color: '#a78bfa' },
  { code: 'M', title: 'Emotional Regulation', shortLabel: 'Emotional', weight: 0.25, threshold: -1, slope: 1.3, color: '#f472b6' },
  { code: 'S', title: 'Social Interaction', shortLabel: 'Social', weight: 0.15, threshold: -1.25, slope: 1, color: '#34d399' },
  { code: 'L', title: 'Language / Symbols', shortLabel: 'Language', weight: 0.25, threshold: -0.75, slope: 1.5, color: '#fbbf24' },
] as const;
