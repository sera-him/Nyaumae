import { DIFFICULTIES, createPuzzleState } from '@/game/threeHoles/puzzleGen';

const hard = DIFFICULTIES.slice(7); // starting from 地狱
for (const d of hard) {
  const start = Date.now();
  const state = createPuzzleState(d);
  const elapsed = Date.now() - start;
  if (state) {
    const holes = state.solution.flat().filter(Boolean).length;
    console.log(`${d.name.padEnd(8)} n=${String(d.n).padEnd(2)} k=${d.k}  ${String(elapsed).padStart(6)}ms  holes=${holes}`);
  } else {
    console.log(`${d.name.padEnd(8)} n=${String(d.n).padEnd(2)} k=${d.k}  ${String(elapsed).padStart(6)}ms  FAILED`);
  }
}
