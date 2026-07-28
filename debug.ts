import { buildEmptyRegions, generateHoles } from '@/game/threeHoles/puzzleGen';

// Test n=6 k=1 with a specific region arrangement
for (let trial = 0; trial < 5; trial++) {
  const start = Date.now();
  const regions = buildEmptyRegions(6);
  if (!regions) { console.log(`trial ${trial}: buildEmptyRegions failed`); continue; }
  const t1 = Date.now();
  
  // Verify region counts
  const counts = Array(6).fill(0);
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++)
      counts[regions[r][c]]++;
  console.log(`trial ${trial}: regions built in ${t1-start}ms, sizes=${counts.join(',')}`);
  
  const holes = generateHoles(regions, 1, 3000);
  const t2 = Date.now();
  
  if (holes.length > 0) {
    console.log(`  holes found in ${t2-t1}ms, count=${holes.length}`);
  } else {
    console.log(`  FAILED after ${t2-t1}ms`);
  }
}
