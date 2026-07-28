import { createPuzzleState } from '@/game/threeHoles/puzzleGen';

const d = { name: '地狱', n: 14, k: 3 };
const start = Date.now();
const state = createPuzzleState(d);
console.log(`elapsed: ${Date.now() - start}ms`);
if (state) {
  const holes = state.solution.flat().filter(Boolean).length;
  console.log(`holes: ${holes}`);
  console.log(`surrendered: ${state.surrendered}, won: ${state.won}`);
} else {
  console.log('FAILED');
}
