import { DIFFICULTIES, createPuzzleState } from '@/game/threeHoles/puzzleGen';

for (const d of DIFFICULTIES) {
  const start = Date.now();
  const state = createPuzzleState(d);
  const elapsed = Date.now() - start;
  if (state) {
    const holes = state.solution.flat().filter(Boolean).length;
    console.log(`${d.name.padEnd(8)} n=${String(d.n).padEnd(2)} k=${d.k}  ${String(elapsed).padStart(5)}ms  holes=${holes}`);
  } else {
    console.log(`${d.name.padEnd(8)} n=${String(d.n).padEnd(2)} k=${d.k}  ${String(elapsed).padStart(5)}ms  FAILED`);
  }
}
