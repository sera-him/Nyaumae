import { generateHoles, buildEmptyRegions } from '@/game/threeHoles/puzzleGen';

// Test n=6 with fixed checkerboard regions
function makeCheckered(n: number): number[][] {
  const g: number[][] = [];
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) {
      row.push((Math.floor(r / 2) * 3 + Math.floor(c / 2)) % n);
    }
    g.push(row);
  }
  return g;
}

console.log('=== n=6,k=1 with checkered regions ===');
const regions = makeCheckered(6);

// Verify region sizes
const sizes = Array(6).fill(0);
for (let r = 0; r < 6; r++)
  for (let c = 0; c < 6; c++)
    sizes[regions[r][c]]++;
console.log('Region sizes:', sizes.join(','));

const start = Date.now();
const holes = generateHoles(regions, 1, 10000);
const elapsed = Date.now() - start;
if (holes.length > 0) {
  console.log(`SUCCESS ${elapsed}ms, ${holes.length} holes`);
  console.log('Holes:', holes.map(h => `(${h.row},${h.col})`).join(' '));
} else {
  console.log(`FAIL ${elapsed}ms`);
}

// Now test random regions with the same setup but track dfsCalls
console.log('\n=== n=6,k=1 random regions (5 trials) ===');
for (let t = 0; t < 5; t++) {
  const reg = buildEmptyRegions(6);
  if (!reg) { console.log('build failed'); continue; }
  const s = Array(6).fill(0);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) s[reg[r][c]]++;
  const st = Date.now();
  const h = generateHoles(reg, 1, 5000);
  const et = Date.now() - st;
  console.log(`trial ${t}: sizes=${s.join(',')}  ${h.length > 0 ? `OK ${et}ms` : `FAIL ${et}ms`} dfsCalls=${(global as any).lastDfsCalls ?? '?'}`);
}
