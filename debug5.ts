import { generateHoles, buildEmptyRegions } from '@/game/threeHoles/puzzleGen';

// Check buildEmptyRegions for n=4
console.log('buildEmptyRegions(4) 10 trials:');
for (let t = 0; t < 10; t++) {
  const reg = buildEmptyRegions(4);
  if (!reg) { console.log(`trial ${t}: NULL`); continue; }
  const s = Array(4).fill(0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s[reg[r][c]]++;
  console.log(`  trial ${t}: sizes=${s.join(',')}`);
  // Check all cells are assigned
  let valid = true;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (reg[r][c] === -1) valid = false;
  if (!valid) console.log(`    ERROR: unassigned cells!`);
  
  // Try to generate holes
  const holes = generateHoles(reg, 1, 200);
  if (holes.length > 0) {
    console.log(`    holes OK: ${holes.map(h => `(${h.row},${h.col})`).join(' ')}`);
  } else {
    console.log(`    holes FAIL`);
    // Check row/col/region totals
    const rows = Array(4).fill(0), cols = Array(4).fill(0), regs = Array(4).fill(0);
    let tryHoles: {r:number,c:number}[] = [];
    // Try a manual checkerboard
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        // Check if (r,c) is 8-adjacent to any existing hole
        let adj = false;
        for (const h of tryHoles) {
          if (Math.abs(h.r - r) <= 1 && Math.abs(h.c - c) <= 1) { adj = true; break; }
        }
        if (adj) continue;
        if (rows[r] < 1 && cols[c] < 1 && regs[reg[r][c]] < 1) {
          tryHoles.push({r,c});
          rows[r]++; cols[c]++; regs[reg[r][c]]++;
        }
      }
    }
    if (tryHoles.length === 4) {
      console.log(`    manual greedy: ${tryHoles.map(h => `(${h.r},${h.c})`).join(' ')}`);
    } else {
      console.log(`    manual greedy FAILED: ${tryHoles.length} holes`);
    }
  }
}
