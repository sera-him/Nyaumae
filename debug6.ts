import { generateHoles, buildEmptyRegions } from '@/game/threeHoles/puzzleGen';

console.log('n=10 region balance:');
for (let t = 0; t < 5; t++) {
  const reg = buildEmptyRegions(10);
  if (!reg) { console.log(`trial ${t}: NULL`); continue; }
  const s = Array(10).fill(0);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) s[reg[r][c]]++;
  console.log(`trial ${t}: min=${Math.min(...s)} max=${Math.max(...s)}  ${s.join(',')}`);
  
  const start = Date.now();
  const holes = generateHoles(reg, 1, 5000);
  const elapsed = Date.now() - start;
  if (holes.length > 0) {
    console.log(`  OK ${elapsed}ms`);
  } else {
    console.log(`  FAIL ${elapsed}ms`);
  }
}

console.log('\nn=6,k=1 region balance:');
for (let t = 0; t < 5; t++) {
  const reg = buildEmptyRegions(6);
  if (!reg) { console.log(`trial ${t}: NULL`); continue; }
  const s = Array(6).fill(0);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) s[reg[r][c]]++;
  console.log(`trial ${t}: min=${Math.min(...s)} max=${Math.max(...s)}  ${s.join(',')}`);
  const start = Date.now();
  const holes = generateHoles(reg, 1, 5000);
  const elapsed = Date.now() - start;
  if (holes.length > 0) {
    console.log(`  OK ${elapsed}ms`);
  } else {
    console.log(`  FAIL ${elapsed}ms`);
  }
}
