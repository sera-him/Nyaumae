// English mirror of ./formal-foundation.v1 — same ids, English text.
import { definePublicQuestion } from './helpers.ts';
import type { NctbPublicQuestion } from '../types.ts';

const bankId = 'formal-a-v1' as const;

export const FORMAL_FOUNDATION_V1_QUESTIONS_EN: readonly NctbPublicQuestion[] = [
  definePublicQuestion({
    id: 'formal-a-v1-foundation-pattern-01', bankId, dimensionId: 'pattern', difficulty: 1, family: 'periodic-overlay',
    stimulus: '● ○ ● ○\n○ ● ○ ●\n● ○ ● ○',
    prompt: 'The three rows alternate on the same period. What should the next row be?',
    options: ['○ ● ○ ●', '● ● ○ ○', '● ○ ○ ●', '○ ○ ● ●'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 1, abstraction: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-pattern-02', bankId, dimensionId: 'pattern', difficulty: 3, family: 'recursive-pattern',
    stimulus: 'Rules: A → AB; B → A. Every step replaces all letters simultaneously. Start: A.',
    prompt: 'Which string results after three replacement steps?',
    options: ['ABABA', 'AABAB', 'ABAAB', 'ABBAB'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-memory-01', bankId, dimensionId: 'memory', difficulty: 1, family: 'forward-span', kind: 'memory',
    stimulus: 'Fog · rock · lamp · bridge', revealMs: 3_400,
    prompt: 'Which item matches the order just shown exactly?',
    options: ['fog · lamp · rock · bridge', 'fog · rock · lamp · bridge', 'bridge · lamp · rock · fog', 'fog · rock · bridge · lamp'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-memory-02', bankId, dimensionId: 'memory', difficulty: 3, family: 'memory-updating', kind: 'memory',
    stimulus: 'Initial: 3–8–5\nOperation 1: add 2 to the first item\nOperation 2: swap the last two items', revealMs: 4_800,
    prompt: 'What is the sequence after the two operations?',
    options: ['5–8–5', '8–5–5', '5–5–8', '3–5–8'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 4, ruleSwitches: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-space-01', bankId, dimensionId: 'space', difficulty: 2, family: 'grid-movement',
    stimulus: 'Start at (2,2). Move up 1, then right 2, then down 1.',
    prompt: 'What is the endpoint coordinate?',
    options: ['(3,2)', '(4,2)', '(4,3)', '(2,4)'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-space-02', bankId, dimensionId: 'space', difficulty: 3, family: 'paper-folding',
    stimulus: 'A paper strip has cells 1, 2, 3, 4 from left to right. Fold it to the right along the line between 2 and 3, then punch one hole in the rightmost cell of the folded strip.',
    prompt: 'After fully unfolding, which positions have holes?',
    options: ['2 and 3', '1 and 3', '2 and 4', '1 and 4'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-quantity-01', bankId, dimensionId: 'quantity', difficulty: 1, family: 'ratio-scaling',
    prompt: 'Red and blue beads form a bag in a 2:3 ratio, 25 beads total. How many red beads are there (the fewer)?',
    options: ['5', '8', '10', '15'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-quantity-02', bankId, dimensionId: 'quantity', difficulty: 3, family: 'relative-quantity',
    prompt: 'A is 20% more than B; B is 25% less than C. How does A compare with C?',
    options: ['A is 10% more than C', 'A is 10% less than C', 'A equals C', 'Not enough information'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-language-01', bankId, dimensionId: 'language', difficulty: 2, family: 'instruction-comprehension',
    stimulus: 'Rule: cards with a circle go in the left box; if a card also has a triangle, the latter rule takes priority and it goes in the right box.',
    prompt: 'Where should a card with both a circle and a triangle go?',
    options: ['Left box', 'Both boxes', 'Right box', 'Cannot determine'],
    profile: { reasoningSteps: 2, ruleSwitches: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-language-02', bankId, dimensionId: 'language', difficulty: 3, family: 'ambiguity-resolution',
    prompt: '"Xiaolin told Xiaozhou that the teacher would check the form after she finished the records." Based only on this sentence, who must "she" refer to?',
    options: ['Xiaolin', 'Xiaozhou', 'The teacher', 'Cannot be uniquely determined'],
    profile: { reasoningSteps: 2, distractorSimilarity: 4, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-attention-01', bankId, dimensionId: 'attention', difficulty: 2, family: 'selective-search',
    stimulus: 'Target rule: respond only to "hollow circle + even number"; suppress any card with ×.\nA ○4   B ●4   C ○3   D ○6×',
    prompt: 'Which card is the only one to respond to?',
    options: ['B', 'A', 'D', 'C'],
    profile: { reasoningSteps: 1, distractorSimilarity: 3, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-attention-02', bankId, dimensionId: 'attention', difficulty: 3, family: 'response-inhibition',
    stimulus: 'Rule: press on seeing A; but if A is immediately followed by X, inhibit. Other characters: stop.\nTrials: A | X | A | B | A',
    prompt: 'What is the correct five-response sequence?',
    options: ['press–stop–press–stop–press', 'stop–stop–stop–stop–press', 'press–stop–stop–stop–press', 'press–press–stop–stop–press'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-speed-01', bankId, dimensionId: 'speed', difficulty: 1, family: 'rapid-same-different',
    stimulus: 'M7/M7   Q2/QZ   B8/B8   H4/H4   S5/SS   K1/K1',
    prompt: 'How many pairs are exactly identical left and right?',
    options: ['4', '3', '2', '5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-speed-02', bankId, dimensionId: 'speed', difficulty: 3, family: 'visual-code-match',
    stimulus: 'Code: ◆=2, ●=5, ▲=7\n◆●▲/257   ●◆▲/527   ▲●◆/725   ◆▲●/275',
    prompt: 'How many pairs have symbols and digit codes matching exactly?',
    options: ['2', '3', '4', '1'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-causality-01', bankId, dimensionId: 'causality', difficulty: 2, family: 'confound-detection',
    prompt: 'Two groups of seedlings get different fertilizers, but group 1 is watered daily and group 2 every other day. Group 1 grows taller. What is the more reliable next step to compare fertilizers?',
    options: ['Give both groups the same watering conditions, then compare fertilizers', 'Measure group 1 more times', 'Conclude the first fertilizer is better', 'Change light and pots at the same time'],
    profile: { reasoningSteps: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-causality-02', bankId, dimensionId: 'causality', difficulty: 3, family: 'necessary-sufficient',
    prompt: 'The alarm sounds only when both "sensor OK" and "power OK" hold. The alarm is sounding now. Which must hold?',
    options: ['Only the sensor is OK', 'At least one condition is OK', 'Both conditions are OK', 'Both conditions may be not OK'],
    profile: { reasoningSteps: 2, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-planning-01', bankId, dimensionId: 'planning', difficulty: 2, family: 'dependency-planning',
    prompt: 'Both A and B must finish before C; A and B share a non-parallelizable machine. Which plan is valid?',
    options: ['C→A→B', 'A→B→C (A and B interchangeable)', 'A parallel with C, then B', 'C first, then either A or B'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-planning-02', bankId, dimensionId: 'planning', difficulty: 4, family: 'resource-planning',
    stimulus: 'Battery has 6 units: scanning costs 3, labeling costs 1, uploading costs 2; uploading must follow scanning. Goal: finish all three.',
    prompt: 'Which plan satisfies both resources and dependencies?',
    options: ['upload→scan→label', 'scan twice→upload', 'label→upload→scan', 'label→scan→upload'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 3, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-transfer-01', bankId, dimensionId: 'transfer', difficulty: 2, family: 'strategy-transfer',
    prompt: 'In the old task, "first find the shortest repeating unit, then locate by period" handled repeating notes. The new task uses a light blinking in cycles. What is the best approach?',
    options: ['First verify the light\'s shortest period, then locate by period', 'Copy the old task\'s note answers directly', 'Compare only the colors of light and notes', 'Abandon the proven strategy'],
    profile: { reasoningSteps: 2, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v1-foundation-transfer-02', bankId, dimensionId: 'transfer', difficulty: 5, family: 'relational-mapping',
    stimulus: 'In the old task comparing two workflows, only three kinds of relations were kept: X must precede Y; Y and Z share a resource and cannot overlap; when X is cancelled, W can substitute for X. The new task compares two robot teams, with different names, positions and durations.',
    prompt: 'Which comparison method fully transfers the old task\'s deep structure?',
    options: ['Require the robots\' names and positions to match one by one', 'Compare only who starts first', 'Map precedence, resource conflicts and substitution relations, ignoring names, positions and durations', 'Copy the old workflow\'s specific times onto the robots'],
    profile: { reasoningSteps: 4, workingMemoryLoad: 4, abstraction: 5, ruleSwitches: 2, distractorSimilarity: 4, stimulusComplexity: 5 },
  }),
];
