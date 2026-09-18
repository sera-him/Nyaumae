// English mirror of the inline Chinese data arrays in HyperCommunication.tsx.
// Kept here (not in organizations.en.ts) because the icon elements are JSX and
// HyperCommunication owns the lucide imports.
import type { JSX } from 'react';
import { Radio, MessageCircle, Shuffle, Eye } from 'lucide-react';

export interface HcMode {
  icon: JSX.Element;
  name: string;
  desc: string;
}

export const modesEn: HcMode[] = [
  {
    icon: <Radio className="w-5 h-5" />,
    name: 'Briefing',
    desc: '10-minute lightning talks from each project cluster; all teachers and students sit in and ask questions.',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    name: 'Collision',
    desc: 'Pre-set cross-disciplinary prompts (e.g. "Can AGI feel colour?"); random breakout groups debate.',
  },
  {
    icon: <Shuffle className="w-5 h-5" />,
    name: 'Displacement',
    desc: 'Students must report progress in a non-home-discipline medium (Von Neumann class paints; Fine Arts class writes formulas).',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    name: 'Silence',
    desc: 'Everyone gathers in the Star Hall; no spoken language — communicate for 1.5 hours through writing, images or code only.',
  },
];

export const rulesEn: string[] = [
  'Zhao Zhao himself must attend; absence counts as a teaching incident.',
  'No saying "That\'s your Kezhaozhen problem, none of my Guan Academy business".',
  'Every student speaks or presents at least 3 times per semester.',
  'Content is in principle unrecorded, unarchived, untraceable — risky expression is encouraged.',
  'Large HC groups must be computer-randomised; cliques from the same class are banned.',
];

export interface LargeHc {
  name: string;
  time: string;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export const largeHcEn: LargeHc[] = [
  {
    name: 'Convergent HC',
    time: 'Early January · end of autumn term',
    theme: 'Review, summary, convergence',
    morning: 'Annual showcase of results from each project cluster.',
    afternoon: 'Cross-academy debate: vote for "Cluster of the Year".',
    evening: 'Zhao Zhao closes: which paths were proven dead and should be abandoned.',
  },
  {
    name: 'Divergent HC',
    time: 'Late June · end of spring term',
    theme: 'Outlook, proposals, divergence',
    morning: 'Zhao Zhao personally opens the new annual theme.',
    afternoon: 'Free team-up: students pitch new cluster directions on their own.',
    evening: 'Critique: which directions deserve resource priority next term.',
  },
];

export interface HcCalendarRow {
  week: string;
  label: string;
  hc: string;
  off?: boolean;
}

export const calendarEn: HcCalendarRow[] = [
  { week: '1-16', label: 'Autumn term', hc: 'Every Friday 19:00-21:30' },
  { week: '17-18', label: 'Early January', hc: 'Large HC (convergent)' },
  { week: '—', label: 'Winter break', hc: 'Suspended', off: true },
  { week: '19-34', label: 'Spring term', hc: 'Every Friday 19:00-21:30' },
  { week: '35-36', label: 'Late June', hc: 'Large HC (divergent)' },
  { week: '—', label: 'Summer break', hc: 'Suspended', off: true },
];
