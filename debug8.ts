import { DIFFICULTIES, createPuzzleState } from '@/game/threeHoles/puzzleGen';

const hard = DIFFICULTIES.slice(7); // 地狱 onward
for (const d of hard) {
  const start = Date.now();
  const state = createPuzzleState(d);
  const elapsed = Date.now() - start;
  if (state) {
    const holes = state.solution.flat().filter(Boolean).length;
    const regSizes = Array(d.n).fill(0);
    for (let r = 0; r < d.n; r++)
      for (let c = 0; c < d.n; c++)
        regSizes[state.regions[r][c]]++;
    const min = Math.min(...regSizes), max = Math.max(...regSizes);
    console.log(`${d.name.padEnd(8)} n=${String(d.n).padEnd(2)} k=${d.k}  ${String(elapsed).padStart(5)}ms  holes=${holes}  regRange=${min}-${max}`);
  } else {
    console.log(`${d.name.padEnd(8)} n=${String(d.n).padEnd(2)} k=${d.k}  ${String(elapsed).padStart(5)}ms  FAILED`);
  }
}
