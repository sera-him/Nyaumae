import { generateHoles } from '@/game/threeHoles/puzzleGen';

// Perfectly balanced: each column = region
function uniformRegions(n: number): number[][] {
  return Array.from({length:n}, (_,r) => Array.from({length:n}, (_,c) => c));
}

console.log('=== Uniform regions (each col = region) ===');
for (const [n, k] of [[4,1],[6,1],[8,1],[10,1],[12,2],[14,2],[14,3]]) {
  const reg = uniformRegions(n);
  const sizes = Array(n).fill(n);
  const start = Date.now();
  const holes = generateHoles(reg, k, 10000);
  const elapsed = Date.now() - start;
  if (holes.length > 0) {
    console.log(`n=${n} k=${k}: OK ${elapsed}ms  holes=${holes.length}`);
  } else {
    console.log(`n=${n} k=${k}: FAIL ${elapsed}ms`);
  }
}

console.log('');
console.log('=== Random balanced regions (10 trials) ===');
async function testRandomBalanced() {
  const { buildEmptyRegions } = await import('@/game/threeHoles/puzzleGen');
  for (const [n, k] of [[6,1],[8,1],[10,1]]) {
    let ok = 0, fail = 0, totalTime = 0;
    for (let t = 0; t < 10; t++) {
      const reg = buildEmptyRegions(n);
      if (!reg) { fail++; continue; }
      const start = Date.now();
      const holes = generateHoles(reg, k, 5000);
      const elapsed = Date.now() - start;
      totalTime += elapsed;
      if (holes.length > 0) ok++;
      else fail++;
    }
    console.log(`n=${n} k=${k}: ${ok}/10 OK, ${fail}/10 FAIL, avg ${(totalTime/10).toFixed(0)}ms`);
  }
}
void testRandomBalanced();
