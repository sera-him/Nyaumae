import type { Dimension } from '@/data/okcomputerObservations';

export const dimDot: Record<Dimension, string> = {
  ASD: 'bg-sage',
  ADHD: 'bg-acc',
  CROSS: 'bg-umber',
  META: 'bg-mute',
};

export const dimTagClass: Record<Dimension, string> = {
  ASD: 'bg-sage-soft text-sage',
  ADHD: 'bg-tint text-acc-deep',
  CROSS: 'bg-umber-soft text-umber',
  META: 'bg-cream text-mute',
};

export const dimBarClass: Record<Dimension, string> = {
  ASD: 'bg-sage',
  ADHD: 'bg-acc',
  CROSS: 'bg-umber',
  META: 'bg-mute',
};
