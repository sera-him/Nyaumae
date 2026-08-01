import { generateHoles, buildEmptyRegions } from '@/game/threeHoles/puzzleGen';

function regionStats(regions: number[][]): void {
  const n = regions.length;
  const counts = Array(n).fill(0);
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      counts[regions[r][c]]++;
  console.log(`  sizes: min=${Math.min(...counts)} max=${Math.max(...counts)}  ${counts.join(',')}`);
}

console.log('=== Uniform regions (each col = region) ===');
const uni: number[][] = Array.from({length:6}, () => Array.from({length:6}, (_,c) => c));
regionStats(uni);
for (let k = 1; k <= 3; k++) {
  const start = Date.now();
  const holes = generateHoles(uni, k, 5000);
  console.log(`  k=${k}: ${holes.length > 0 ? `OK ${Date.now()-start}ms` : `FAIL ${Date.now()-start}ms`} holes=${holes.length}`);
}

console.log('');
console.log('=== Random regions ===');
for (let trial = 0; trial < 8; trial++) {
  const regions = buildEmptyRegions(6);
  if (!regions) { console.log(`  trial ${trial}: build failed`); continue; }
  regionStats(regions);
  const start = Date.now();
  const holes = generateHoles(regions, 1, 3000);
  console.log(`  trial ${trial} k=1: ${holes.length > 0 ? `OK ${Date.now()-start}ms` : `FAIL ${Date.now()-start}ms`}`);
}
