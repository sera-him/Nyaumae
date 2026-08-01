import { DIFFICULTIES, createPuzzleState } from '@/game/threeHoles/puzzleGen';

// Test each difficulty briefly with debug output
for (const d of DIFFICULTIES.slice(0, 4)) {
  process.stdout.write(`${d.name} n=${d.n} k=${d.k} ... `);
  const start = Date.now();
  const state = createPuzzleState(d);
  const elapsed = Date.now() - start;
  if (state) {
    const holes = state.solution.flat().filter(Boolean).length;
    console.log(`${String(elapsed).padStart(5)}ms  holes=${holes}`);
  } else {
    console.log(`${String(elapsed).padStart(5)}ms  FAILED`);
  }
}
