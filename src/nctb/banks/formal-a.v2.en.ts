// English mirror of ./formal-a.v2 — same ids, English text.
// Hand-translated 2026-09-15 (all 70 items; stimulus/prompt/options replaced, profiles untouched).
import { definePublicQuestion } from './helpers.ts';
import type { NctbPublicQuestion } from '../types.ts';

const bankId = 'formal-a-v1' as const;

export const FORMAL_A_V2_QUESTIONS_EN: readonly NctbPublicQuestion[] = [
  // ═══════════ pattern 模式识别 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-pattern-01', bankId, dimensionId: 'pattern', difficulty: 1, family: 'alternating-operator',
    stimulus: 'Rule: alternately apply "+2" and "×2" to the number. Start: 1.',
    prompt: 'What is the number after step 5?',
    options: ['18', '32', '20', '16'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-02', bankId, dimensionId: 'pattern', difficulty: 2, family: 'rule-classification',
    stimulus: 'Series A: △ △ ○ △ △ ○ △ △\nSeries B: △ ○ △ ○ △ ○ △\nSeries C: △ ○ ○ △ ○ ○ △\nSeries D: △ △ △ ○ △ △ △',
    prompt: 'Which series follows the cycle of "two solid followed by one hollow"?',
    options: ['Series B', 'Series C', 'Series D', 'Series A'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 3, abstraction: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-03', bankId, dimensionId: 'pattern', difficulty: 3, family: 'matrix-relation',
    stimulus: 'Row 1: ● ● ○\nRow 2: ○ ● ●\nRow 3: ?',
    prompt: 'Each row shifts the row above one cell to the right (the last cell wraps to the front). What is row 3?',
    options: ['○ ○ ●', '● ● ○', '○ ● ○', '● ○ ●'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-04', bankId, dimensionId: 'pattern', difficulty: 4, family: 'periodic-overlay',
    stimulus: 'Row 1 cycles every 3 cells: ● ○ ○\nRow 2 cycles every 4 cells: ● ● ○ ○\nRow 3: each cell = ● when rows 1 and 2 have the same color in that column, otherwise ○.',
    prompt: 'What are the first 6 cells of row 3?',
    options: ['● ○ ● ○ ○ ○', '● ● ○ ○ ○ ○', '● ○ ○ ● ○ ○', '○ ● ○ ● ○ ●'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-05', bankId, dimensionId: 'pattern', difficulty: 4, family: 'analogy-transform',
    stimulus: 'Example: [◇ ◇ ●] → [● ◆ ◆]\n(◆ is the pattern that swaps with ◇)\nTo process: [● ◇ ◇]',
    prompt: 'The example applies both "mirror left-right" and "solid/pattern swap". What is the result for the sequence to process?',
    options: ['● ◆ ◆', '◇ ◇ ●', '◆ ◆ ●', '◆ ◇ ●'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-06', bankId, dimensionId: 'pattern', difficulty: 5, family: 'recursive-pattern',
    stimulus: 'Rule: ● → ●○; ○ → ○. Every step replaces all symbols at once. Start: ● ●.',
    prompt: 'After three replacement steps, how many ○ are in the string?',
    options: ['4', '6', '5', '8'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-pattern-07', bankId, dimensionId: 'pattern', difficulty: 5, family: 'rule-classification',
    stimulus: 'Rule 1: any two adjacent cells differ in color.\nRule 2: ○ must appear exactly at cells 2 and 4.\nA: ● ○ ● ○\nB: ○ ● ○ ●\nC: ● ○ ○ ●\nD: ● ○ ● ●',
    prompt: 'Which row satisfies both rules at once?',
    options: ['A', 'B', 'C', 'D'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, ruleSwitches: 2, distractorSimilarity: 4 },
  }),

  // ═══════════ memory 工作记忆 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-memory-01', bankId, dimensionId: 'memory', difficulty: 1, family: 'backward-span', kind: 'memory',
    stimulus: 'Mountain · River · Forest · Field', revealMs: 3_400,
    prompt: 'What was the sequence, reversed?',
    options: ['Field · Forest · River · Mountain', 'Mountain · River · Forest · Field', 'Field · River · Forest · Mountain', 'Forest · Field · Mountain · River'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-02', bankId, dimensionId: 'memory', difficulty: 2, family: 'forward-span', kind: 'memory',
    stimulus: 'Moon · Snow · Lamp · Paper · Clock · Bridge', revealMs: 4_200,
    prompt: 'Which option is exactly the sequence you just saw?',
    options: ['Moon · Lamp · Snow · Paper · Clock · Bridge', 'Clock · Paper · Lamp · Snow · Moon · Bridge', 'Moon · Snow · Lamp · Paper · Clock · Bridge', 'Moon · Snow · Paper · Lamp · Clock · Bridge'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-03', bankId, dimensionId: 'memory', difficulty: 3, family: 'ordered-recall', kind: 'memory',
    stimulus: 'The cards appeared in this order: Blue – Yellow – Red – White', revealMs: 4_500,
    prompt: 'Which two cards appeared before "White", in order?',
    options: ['Red – Yellow', 'Yellow – Red', 'Blue – Red', 'Red – White'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-04', bankId, dimensionId: 'memory', difficulty: 3, family: 'n-back-match', kind: 'memory',
    stimulus: 'Appearing one by one: K M K M M R M R', revealMs: 5_200,
    prompt: 'Starting from the 3rd character, how many characters match the one two places before them?',
    options: ['2', '1', '3', '4'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-05', bankId, dimensionId: 'memory', difficulty: 4, family: 'sequence-transformation', kind: 'memory',
    stimulus: 'Start: Morning – Noon – Night\nOperation 1: move the first item to the end\nOperation 2: reverse the whole string\nOperation 3: replace the current last item with "Dusk"', revealMs: 5_600,
    prompt: 'What is the order after all three operations?',
    options: ['Dusk – Night – Morning', 'Morning – Dusk – Night', 'Night – Morning – Dusk', 'Morning – Night – Dusk'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 5, ruleSwitches: 3, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-06', bankId, dimensionId: 'memory', difficulty: 4, family: 'binding-memory', kind: 'memory',
    stimulus: 'J—Maple   P—Well   V—Lamp   N—Bridge', revealMs: 5_000,
    prompt: 'Which letters pair with "Well" and with "Lamp"?',
    options: ['V and P', 'P and V', 'J and N', 'P and N'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 4, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-memory-07', bankId, dimensionId: 'memory', difficulty: 5, family: 'interference-memory', kind: 'memory',
    stimulus: 'Target: Cloud—3, Bridge—8, Lamp—5\nInterference: Cloud—8, Bridge—5, Lamp—3', revealMs: 6_200,
    prompt: 'In the TARGET list, which numbers pair with "Cloud" and "Bridge"?',
    options: ['8 and 5', '8 and 3', '5 and 3', '3 and 8'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 5, distractorSimilarity: 5, stimulusComplexity: 5 },
  }),

  // ═══════════ space 空间推理 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-space-01', bankId, dimensionId: 'space', difficulty: 1, family: 'grid-movement',
    stimulus: 'The robot is at (1,1), facing up. Commands: turn right, move forward 2 cells.',
    prompt: 'What is the final coordinate?',
    options: ['(1,3)', '(3,1)', '(-1,1)', '(3,3)'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-02', bankId, dimensionId: 'space', difficulty: 2, family: 'spatial-relation',
    stimulus: 'Room layout: the door is on the south wall, the window on the north wall, the table in the middle of the room, the chair on the north side of the table. Someone stands with their back to the door.',
    prompt: 'At this moment, on which side of the table is the chair?',
    options: ['The side of the table nearer the door', 'The left side of the table', 'The side of the table farther from the door', 'The right side of the table'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, abstraction: 2, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-03', bankId, dimensionId: 'space', difficulty: 3, family: 'object-transform',
    stimulus: 'An arrow points to the 3 o\'clock direction. First rotate it 90° counterclockwise about its own center, then rotate it 90° clockwise about the screen center.',
    prompt: 'Which direction does the arrow finally point?',
    options: ['12 o\'clock', '6 o\'clock', '9 o\'clock', '3 o\'clock'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-04', bankId, dimensionId: 'space', difficulty: 3, family: 'viewpoint-transform',
    stimulus: 'A boat leaves the river mouth and heads straight east; the captain faces the direction of travel. A bridge is on the boat\'s left.',
    prompt: 'On which side of the boat\'s route (relative to the route direction) is the bridge?',
    options: ['South side', 'East side', 'West side', 'North side'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-05', bankId, dimensionId: 'space', difficulty: 4, family: 'mental-rotation',
    stimulus: 'An L-shape of three cells: (0,0), (0,1), (1,0). First rotate 180° about the origin, then mirror across the horizontal axis.',
    prompt: 'Which set is the transformed coordinates?',
    options: ['(0,0), (0,1), (-1,0)', '(0,0), (0,-1), (1,0)', '(0,0), (1,0), (0,-1)', '(0,0), (-1,0), (0,-1)'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-06', bankId, dimensionId: 'space', difficulty: 4, family: 'path-integration',
    stimulus: 'Facing east. Move 3 cells; turn left and move 2; turn left and move 3; turn right and move 1.',
    prompt: 'Where does the trip end, relative to the start?',
    options: ['3 cells due north', '3 cells due west', '2 cells due north', 'Back at the start'],
    profile: { reasoningSteps: 4, workingMemoryLoad: 4, distractorSimilarity: 3, ruleSwitches: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-space-07', bankId, dimensionId: 'space', difficulty: 5, family: 'paper-folding',
    stimulus: 'A 1×4 paper strip (cells 1–4). First fold it rightward along the line between 2 and 3 (3 flips over onto 2, 4 flips over onto 1). Then punch a hole through the top layer at the original cell-4 position, and another at the original cell-1 position; each hole pierces that layer plus the layer directly beneath it.',
    prompt: 'After unfolding, which cells have holes?',
    options: ['1 and 4', '2 and 3', 'All four cells', '1, 2 and 4'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, stimulusComplexity: 5 },
  }),

  // ═══════════ quantity 数量关系 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-quantity-01', bankId, dimensionId: 'quantity', difficulty: 2, family: 'magnitude-estimation',
    prompt: 'A tap fills 4 identical large bowls per minute. Filling a bathtub takes about 30 bowls of water. Roughly how long must the tap run?',
    options: ['About 12 minutes', 'About 4 minutes', 'About 8 minutes', 'About 30 minutes'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-02', bankId, dimensionId: 'quantity', difficulty: 3, family: 'resource-balance',
    stimulus: 'A camp has 24 people, each needing 2 rations per day. There are 96 rations on hand. An 8-person squad arrives; the total rations stay the same.',
    prompt: 'Now, at most how many rations per person per day can be divided exactly evenly among everyone?',
    options: ['2', '3', '4', '2.5'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-03', bankId, dimensionId: 'quantity', difficulty: 3, family: 'arithmetic-model',
    prompt: 'A print shop charges ¥0.5 per page for the first 20 pages and ¥0.3 per page beyond that. How much does printing 50 pages cost?',
    options: ['¥25', '¥19', '¥15', '¥17'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-04', bankId, dimensionId: 'quantity', difficulty: 4, family: 'quantitative-transform',
    stimulus: 'Exchange rates: 2 copper shells = 3 clay shells; 4 clay shells = 1 jade shell.',
    prompt: '16 copper shells are worth how many jade shells?',
    options: ['6', '8', '12', '4'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-05', bankId, dimensionId: 'quantity', difficulty: 4, family: 'relative-quantity',
    prompt: 'A\'s income is 25% higher than B\'s; B\'s income is 20% lower than C\'s. How does A compare with C?',
    options: ['A equals C', 'A is 5% more than C', 'A is 5% less than C', 'They cannot be compared'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-06', bankId, dimensionId: 'quantity', difficulty: 5, family: 'proportional-comparison',
    prompt: 'Team A finishes 3 similar tasks in 5 days; Team B finishes 4 similar tasks in 7 days. At constant speed, who is faster by "average time per task"?',
    options: ['Team B is faster', 'The two teams are equally fast', 'They cannot be compared', 'Team A is faster'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-quantity-07', bankId, dimensionId: 'quantity', difficulty: 2, family: 'ratio-scaling',
    prompt: 'A paint mix needs red to blue at 3:5. You have 9 liters of red paint and plenty of blue. At most how many liters of this mix can you make?',
    options: ['15 L', '20 L', '24 L', '12 L'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, distractorSimilarity: 2 },
  }),

  // ═══════════ language 语言推理 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-language-01', bankId, dimensionId: 'language', difficulty: 1, family: 'verbal-analogy',
    prompt: '"Pen" is to "writing" as "pot" is to what?',
    options: ['Cooking', 'Kitchen', 'Plate', 'Fire'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 1, abstraction: 1 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-02', bankId, dimensionId: 'language', difficulty: 2, family: 'conditional-language',
    prompt: 'If it rains tomorrow, the sports meet moves to the gym. The sports meet did not move to the gym. Which statement must be true?',
    options: ['It will definitely rain tomorrow', 'It did not rain', 'The sports meet was rescheduled', 'The gym has another event'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-03', bankId, dimensionId: 'language', difficulty: 3, family: 'semantic-inference',
    prompt: 'The notice says: "The library is open to the public only on Wednesdays and Fridays." Today is Thursday. Based on the notice alone, which statement must be true?',
    options: ['The library is open to the public today', 'The library is not open to the public today', 'The notice is wrong', 'You may enter on Thursdays only with a reservation'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, abstraction: 2, distractorSimilarity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-04', bankId, dimensionId: 'language', difficulty: 4, family: 'quantifier-scope',
    prompt: '"There is no one who does not know Xiao Zhou." What does this sentence mean?',
    options: ['Nobody knows Xiao Zhou', 'Xiao Zhou knows nobody', 'Everyone knows Xiao Zhou', 'Some people do not know Xiao Zhou'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-05', bankId, dimensionId: 'language', difficulty: 5, family: 'instruction-comprehension',
    stimulus: 'Rule 1: only badge holders may enter the server room.\nRule 2: if anyone is inside the server room, the main door unlocks.\nStatus: the main door is not unlocked.',
    prompt: 'Based only on the rules and the status, which statement must be true?',
    options: ['Everyone is wearing a badge', 'The main door is broken', 'There is nobody in the server room right now', 'Everyone wearing a badge can enter'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, distractorSimilarity: 5 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-06', bankId, dimensionId: 'language', difficulty: 3, family: 'ambiguity-resolution',
    prompt: '"When Xiao An met Xiao Bei, he was watering the flowers." Based on this sentence alone, who must "he" refer to?',
    options: ['Xiao An', 'Xiao Bei', 'Both of them', 'It cannot be uniquely determined'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-language-07', bankId, dimensionId: 'language', difficulty: 3, family: 'verbal-relation',
    prompt: 'Which pair has the same relation as "wheel — car"?',
    options: ['Steering wheel — driving', 'Car window — glass', 'Tire — rubber', 'Wing — airplane'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 3 },
  }),

  // ═══════════ attention 注意控制 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-attention-01', bankId, dimensionId: 'attention', difficulty: 1, family: 'sustained-target',
    stimulus: 'Target: ▲ (solid triangle) — respond whenever it appears.\nSeries: ○ ● ▲ ○ ▲ ●',
    prompt: 'How many times did the target appear?',
    options: ['2', '1', '3', '4'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, distractorSimilarity: 2, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-02', bankId, dimensionId: 'attention', difficulty: 2, family: 'conjunction-detection',
    stimulus: 'Respond only to "solid + circle" shapes (triangles do not count):\n○ (hollow circle) ● (solid circle) ▲ (solid triangle) △ (hollow triangle) ● △ ○ ▲',
    prompt: 'How many items should you respond to?',
    options: ['2', '3', '1', '4'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 3, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-03', bankId, dimensionId: 'attention', difficulty: 3, family: 'go-no-go',
    stimulus: 'Rule: press when a square ■ appears; but if the square carries a dot (■•), do not press. Other shapes: do not press.\nSeries: ■ ▲ ■• ● ■ ■• ▲ ■',
    prompt: 'How many key presses should there be in total?',
    options: ['2', '3', '4', '5'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-04', bankId, dimensionId: 'attention', difficulty: 4, family: 'rule-switching',
    stimulus: 'Rules: letter rows write "1 for vowel, 0 for consonant"; number rows write "1 for odd, 0 for even".\nRow 1 (letters): K A M E\nRow 2 (numbers): 7 4 9 2\nRow 3 (letters): B U T O\nRow 4 (numbers): 3 8 6 5',
    prompt: 'How many 1s are produced across the four rows?',
    options: ['6', '7', '9', '8'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 4, ruleSwitches: 4, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-05', bankId, dimensionId: 'attention', difficulty: 5, family: 'flanker-interference',
    stimulus: 'Rule: respond only to the direction of the central arrow; the flanker arrows may differ; rows containing # get no response.\nRow 1: ＜ ＞ ＞ ＞ ＜\nRow 2: ＞ ＜ ＜ ＜ ＞\nRow 3: ＜ ＞ ＜ ＞ ＜#\nRow 4: ＞ ＜ ＜ ＞ ＜',
    prompt: 'Which row calls for a "rightward" response?',
    options: ['Row 2', 'Row 3', 'Row 1', 'Row 4'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 5, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-06', bankId, dimensionId: 'attention', difficulty: 3, family: 'selective-search',
    stimulus: 'Table (3 rows):\nRow 1: ▲ ■ ●\nRow 2: ● ▲ ■\nRow 3: ■ ● ▲\nRule: count only "solid squares", but a solid square to the right of a triangle does not count.',
    prompt: 'By the rule, how many solid squares are counted?',
    options: ['2', '1', '3', '0'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 3, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-attention-07', bankId, dimensionId: 'attention', difficulty: 4, family: 'sustained-target',
    stimulus: 'Target: two identical symbols in a row (grouped in twos from the start, non-overlapping).\nSeries: ○ ○ ● ▲ ▲ ● ● □ □ □',
    prompt: 'How many "two identical in a row" groups appeared?',
    options: ['2', '4', '5', '3'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 4, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),

  // ═══════════ speed 速度与准确 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-speed-01', bankId, dimensionId: 'speed', difficulty: 2, family: 'symbol-matching',
    stimulus: '◆2   ●7   ▲5   ●7   ◆9   ▲3',
    prompt: 'Which "symbol+digit" combination appeared twice?',
    options: ['◆2', '●7', '▲5', '◆9'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-02', bankId, dimensionId: 'speed', difficulty: 5, family: 'feature-scan',
    stimulus: 'R4S   T8T   M2N   K6K   J3L   W5W   Y9Z',
    prompt: 'Among these triplets, how many have a first and last character that differ?',
    options: ['4', '3', '2', '5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 5, stimulusComplexity: 5 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-03', bankId, dimensionId: 'speed', difficulty: 3, family: 'visual-code-match',
    stimulus: 'Code: ▲=1, ●=2, ■=3\n▲●■/123   ●▲■/231   ■●▲/312   ▲▲●/112',
    prompt: 'How many groups match the symbol-digit code exactly?',
    options: ['1', '2', '3', '4'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 3, distractorSimilarity: 4, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-04', bankId, dimensionId: 'speed', difficulty: 4, family: 'rapid-classification',
    stimulus: '3B   8E   1C   6A   9D   4F',
    prompt: 'How many items start with an odd digit AND have a letter in the A–D range?',
    options: ['2', '4', '3', '1'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, distractorSimilarity: 3, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-05', bankId, dimensionId: 'speed', difficulty: 1, family: 'rapid-same-different',
    stimulus: 'X3/X3   M8/M9   P5/P5   T2/T7   B6/B6',
    prompt: 'How many pairs are identical on both sides?',
    options: ['2', '4', '3', '5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-06', bankId, dimensionId: 'speed', difficulty: 2, family: 'visual-comparison',
    stimulus: 'Target: K7F2',
    prompt: 'Which item is exactly the same as the target?',
    options: ['K7F2', 'K7F3', 'KTF2', 'Q7F2'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 1, distractorSimilarity: 5, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-speed-07', bankId, dimensionId: 'speed', difficulty: 4, family: 'symbol-matching',
    stimulus: '◇5   ◎5   ◇6   ◎6   ◇5',
    prompt: 'Which is a repeated group with BOTH the symbol and the digit identical?',
    options: ['◎5', '◇6', '◎6', '◇5'],
    profile: { reasoningSteps: 0, workingMemoryLoad: 2, distractorSimilarity: 4, stimulusComplexity: 3 },
  }),

  // ═══════════ causality 因果推演 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-causality-01', bankId, dimensionId: 'causality', difficulty: 1, family: 'causal-graph',
    stimulus: 'When the switch is on, the lamp lights. The buzzer sounds only when the lamp is lit. Right now the lamp is not lit.',
    prompt: 'What is the soundest judgment about the buzzer?',
    options: ['It definitely did not sound', 'It is definitely sounding', 'Whether it sounds has nothing to do with the lamp', 'It sounds whenever the switch is on'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-02', bankId, dimensionId: 'causality', difficulty: 2, family: 'intervention-reasoning',
    prompt: 'Observed: when the roof is wet, the ground is wet too. To test whether the wet ground is caused by a roof leak or by rain, which check works best?',
    options: ['Repair the roof (cut off the leak), then compare the wet ground', 'Record more days when the roof is wet', 'Count the days per year when the ground is wet', 'Ask the neighbors whether the roof leaks'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-03', bankId, dimensionId: 'causality', difficulty: 3, family: 'confound-detection',
    prompt: 'After a new coffee machine arrived, office morale scores rose. At the same time the office had just abolished overtime. To assess the coffee machine\'s effect, what is the key question?',
    options: ['What brand is the coffee machine', 'Who tallies the morale scores', 'Has the overtime removal been ruled out as an alternative cause of the morale rise', 'How many times a day is the coffee machine used'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-04', bankId, dimensionId: 'causality', difficulty: 4, family: 'alternative-explanation',
    prompt: 'A plant grew taller after a new fertilizer was applied, but this year is also warmer. Which finding best supports "temperature is the main cause"?',
    options: ['The more fertilizer, the taller the plant', 'Fertilized plants also flower more', 'Last year\'s fertilized plants also grew taller', 'Unfertilized plants in the same warmth also grew taller'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-05', bankId, dimensionId: 'causality', difficulty: 5, family: 'counterfactual',
    stimulus: 'Facts: trucks originally routed around the small town were diverted through it by traffic control; the town had a traffic jam that day. The town is normally jam-free, and these trucks were the only unusual traffic that day.',
    prompt: 'Is the counterfactual "without the traffic control, the town would not have jammed that day" well supported?',
    options: ['Not supported: we cannot know which road the trucks would have taken', 'Supported: without the control these trucks would not pass the town, and there was no other unusual traffic', 'Supported: jams must be related to trucks', 'Not supported: the town\'s traffic conditions naturally fluctuate'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-06', bankId, dimensionId: 'causality', difficulty: 3, family: 'evidence-strength',
    prompt: 'Someone claims "listening to white noise improves focus". Which evidence supports this claim most strongly?',
    options: ['Many people say white noise makes them feel more focused', 'Famous scientists listen to white noise too', 'A randomized experiment: a stable score gap on focus tasks between the listening and non-listening groups', 'People with poor focus prefer listening to white noise'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-causality-07', bankId, dimensionId: 'causality', difficulty: 4, family: 'necessary-sufficient',
    stimulus: 'Rule: only those who pass the physical exam may compete; passing does not guarantee competing. Now someone has competed.',
    prompt: 'Which statement must be true?',
    options: ['This person failed the physical exam', 'Everyone who passed the physical exam competes', 'The physical exam result cannot be determined', 'This person passed the physical exam'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 4 },
  }),

  // ═══════════ planning 策略规划 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-planning-01', bankId, dimensionId: 'planning', difficulty: 1, family: 'goal-decomposition',
    prompt: 'Sandwich steps: A get the bread; B spread the sauce; C add the filling; D put the bread on top. B and C must both come after A and before D. Which order definitely works?',
    options: ['A→B→C→D', 'B→A→C→D', 'A→D→B→C', 'D→C→B→A'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, stimulusComplexity: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-02', bankId, dimensionId: 'planning', difficulty: 2, family: 'multi-step-sequencing',
    prompt: 'Five judges taste in turn: #3 must be first or second; #1 must come before #5; #2 goes last. Which order is valid?',
    options: ['3–1–4–5–2', '4–3–1–2–5', '1–5–3–4–2', '3–5–4–1–2'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-03', bankId, dimensionId: 'planning', difficulty: 3, family: 'dependency-planning',
    stimulus: 'Tasks: T1 needs material A; T2 needs material B; T3 needs the outputs of both T1 and T2. There is only one truck, and it carries one material per trip.',
    prompt: 'Which plan is the most sensible with the fewest trips?',
    options: ['1 trip: haul both materials at once', '3 trips: haul A first, finish T1, then haul B', '2 trips: haul A and B separately, then complete T1, T2 and T3 in order', 'No transport needed — do T3 directly'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 3, stimulusComplexity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-04', bankId, dimensionId: 'planning', difficulty: 3, family: 'constraint-planning',
    prompt: 'Three exhibitions, one day each (Mon–Wed): the oil-painting show cannot be on Monday; the photography show must immediately follow the sculpture show. Which schedule works?',
    options: ['Mon oil painting, Tue sculpture, Wed photography', 'Mon sculpture, Tue photography, Wed oil painting', 'Mon photography, Tue sculpture, Wed oil painting', 'Mon sculpture, Tue oil painting, Wed photography'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-05', bankId, dimensionId: 'planning', difficulty: 4, family: 'resource-planning',
    stimulus: 'Forklift A in warehouse A moves 40 boxes per hour, forklift B in warehouse B moves 25 per hour; both start at once without pausing. Goal: 260 boxes moved in total.',
    prompt: 'What is the minimum number of hours needed?',
    options: ['3', '5', '6', '4'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 3, stimulusComplexity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-06', bankId, dimensionId: 'planning', difficulty: 4, family: 'schedule-repair',
    stimulus: 'Original schedule: 9:00 blood draw → 10:00 lab test (takes 1 hour) → 11:30 report. The lab machine breaks down for 1 hour; the blood sample can be chilled first; the report must be completed.',
    prompt: 'What is the soundest new schedule?',
    options: ['Cancel the lab test and issue the report directly', 'Wait for the repair with everything else paused', 'Draw blood on time and chill it; run the lab as soon as the machine is fixed and shift the rest', 'Postpone the blood draw to 11:00 and keep the lab test on its original time'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 3, distractorSimilarity: 4, ruleSwitches: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-planning-07', bankId, dimensionId: 'planning', difficulty: 5, family: 'multi-step-sequencing',
    stimulus: 'Five programs P1–P5 queue on a single processor: P1 must be first; P3 must immediately follow P4; P2 and P5 cannot be adjacent.',
    prompt: 'Which queue satisfies every constraint?',
    options: ['P1–P3–P4–P5–P2', 'P1–P2–P5–P4–P3', 'P4–P3–P1–P2–P5', 'P1–P2–P4–P3–P5'],
    profile: { reasoningSteps: 4, workingMemoryLoad: 5, abstraction: 4, ruleSwitches: 2, distractorSimilarity: 4 },
  }),

  // ═══════════ transfer 综合迁移 ═══════════
  definePublicQuestion({
    id: 'formal-a-v2-transfer-01', bankId, dimensionId: 'transfer', difficulty: 1, family: 'near-transfer',
    stimulus: 'Old game: a queue of cards moves its frontmost card to the back each round. New game: cards line up left to right, and the leftmost acts as the queue front.',
    prompt: 'Applying the old operation once in the new game gives what result?',
    options: ['The rightmost card moves to the leftmost position', 'Two cards swap places', 'The leftmost card moves to the rightmost position', 'The order is unchanged'],
    profile: { reasoningSteps: 1, workingMemoryLoad: 2, abstraction: 2 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-02', bankId, dimensionId: 'transfer', difficulty: 2, family: 'rule-transfer',
    prompt: 'Old rule: in the classroom, "first raised hand speaks first". New setting: an online meeting where speaking uses a "raise hand" button. What is the soundest mapping?',
    options: ['Use button-press order as the speaking order', 'Whoever is closest to the screen speaks first', 'Random calling', 'Let the loudest voice speak first'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 2, abstraction: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-03', bankId, dimensionId: 'transfer', difficulty: 3, family: 'structural-analogy',
    prompt: 'Old finding: two departments kept separate, inconsistent rosters, so reconciliation failed — the diagnosis was "no single source of truth". New task: three devices record the same inventory with mismatched numbers. What is the closest diagnosis?',
    options: ['No unified inventory baseline — each device keeps its own books', 'The device screens are too small', 'There are too many items in stock', 'All three devices should be replaced with new hardware'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4, distractorSimilarity: 3 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-04', bankId, dimensionId: 'transfer', difficulty: 3, family: 'strategy-transfer',
    prompt: 'In the old task, "working backward from the exit" quickly solved a forward-only maze. The new task is a puzzle room whose gate opens only by stepping back step by step. What is the soundest strategy transfer?',
    options: ['Copy the old maze route exactly', 'Just pace back and forth and hope', 'Abandon all known strategies', 'Work backward from the goal state — trigger the mechanism needed last first'],
    profile: { reasoningSteps: 2, workingMemoryLoad: 3, abstraction: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-05', bankId, dimensionId: 'transfer', difficulty: 4, family: 'relational-mapping',
    prompt: 'Old system: "a filter passes qualified parcels; rejected ones are repackaged and retried". The new system is a hiring pipeline. Which mapping preserves the deep structure?',
    options: ['Résumé→parcel; interview→filter; onboarding→rejection', 'Résumé→parcel; screening→filter; rejected résumé revised and resubmitted→repackaged and retried', 'HR→parcel; offer→filter', 'Copy the old system\'s logistics timing onto hiring'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 5, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-06', bankId, dimensionId: 'transfer', difficulty: 5, family: 'far-transfer',
    prompt: 'Old domain: a reservoir "releases water before flood season to free capacity, stores water at its end to cover the shortfall", smoothing flood peaks. New domain: a team scheduling work between an off-season and a peak season. Which choice keeps the same deep strategy?',
    options: ['Copy the reservoir\'s exact water-level numbers to the team', 'Clear all technical debt at once during the peak season', 'In the off-season, release engineering capacity to burn the backlog and concentrate output in the peak — trading time for stability', 'Stop all engineering activity during the off-season'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 3, abstraction: 5, distractorSimilarity: 4 },
  }),
  definePublicQuestion({
    id: 'formal-a-v2-transfer-07', bankId, dimensionId: 'transfer', difficulty: 4, family: 'boundary-aware-transfer',
    prompt: 'undefined',
    options: ['No risk: shuffling always improves speed', 'A light shuffle also fixes extreme outliers', 'The new task must abandon sorting algorithms entirely', 'A light shuffle does not help with extreme outliers and wastes a step'],
    profile: { reasoningSteps: 3, workingMemoryLoad: 4, abstraction: 5, ruleSwitches: 2, distractorSimilarity: 4 },
  }),
];
