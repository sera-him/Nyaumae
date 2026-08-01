// Direct test of constructHoles and buildRegionsFromHoles
// by copy-pasting the functions
function constructHoles(n: number, k: number): {row:number,col:number}[] | null {
  if (k * 2 > n) return null;
  let step = 2 * k + 1;
  if (step >= n) step = k + 1;
  while (step < n && (() => { let a = n, b = step; while (b) { [a, b] = [b, a % b]; } return a !== 1; })()) {
    step++;
  }
  if (step >= n) return null;
  const holes: {row:number,col:number}[] = [];
  for (let r = 0; r < n; r++) {
    const base = (r * step) % n;
    for (let j = 0; j < k; j++) {
      holes.push({ row: r, col: (base + j * 2) % n });
    }
  }
  // Verify
  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      if (Math.abs(holes[i].row - holes[j].row) <= 1 &&
          Math.abs(holes[i].col - holes[j].col) <= 1) {
        console.log(`ADJACENT: (${holes[i].row},${holes[i].col}) and (${holes[j].row},${holes[j].col})`);
      }
    }
  }
  return holes;
}

console.log('Testing constructHoles(14,3):');
const holes = constructHoles(14, 3);
if (holes) {
  console.log(`Got ${holes.length} holes, step=9`);
  // Print rows
  for (let r = 0; r < 14; r++) {
    const row = holes.filter(h => h.row === r).map(h => h.col);
    console.log(`  Row ${r}: [${row.join(',')}]`);
  }
  
  // Check column counts
  const colCounts = Array(14).fill(0);
  for (const h of holes) colCounts[h.col]++;
  console.log(`  Column counts: [${colCounts.join(',')}]`);
  
  console.log('\nNow testing buildRegionsFromHoles...');
  const start = Date.now();
  
  // Inline buildRegionsFromHoles
  const n = 14, k = 3;
  const total = n * n;
  const target = total / n;
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
  const dirs: [number,number][] = [[0,1],[1,0],[0,-1],[-1,0]];

  const sorted = [...holes].sort((a, b) => a.row * n + a.col - b.row * n - b.col);
  const regionHoles: Set<number>[] = Array.from({ length: n }, () => new Set());
  for (let g = 0; g < n; g++) {
    for (let j = 0; j < k; j++) {
      const { row, col } = sorted[g * k + j];
      regionHoles[g].add(row * n + col);
      grid[row][col] = g;
    }
  }

  console.log(`Seed placement done in ${Date.now() - start}ms`);

  const sizes = new Int32Array(n).fill(k);
  const frontier: number[][] = Array.from({ length: n }, () => []);
  for (let g = 0; g < n; g++) {
    for (const idx of regionHoles[g]) {
      const r = Math.floor(idx / n), c = idx % n;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === -1) frontier[g].push(nr * n + nc);
      }
    }
  }

  console.log(`Frontier init done in ${Date.now() - start}ms`);
  console.log(`Frontier sizes: ${frontier.map(f => f.length).join(',')}`);

  let claimed = n * k;
  let iterations = 0;
  while (claimed < total) {
    iterations++;
    let best = -1, bestSize = total + 1;
    for (let g = 0; g < n; g++) {
      if (sizes[g] >= target) continue;
      if (frontier[g].length === 0) continue;
      if (sizes[g] < bestSize) { bestSize = sizes[g]; best = g; }
    }
    if (best === -1) {
      console.log(`Iteration ${iterations}: rebuild needed (claimed=${claimed}, sizes=[${sizes.join(',')}])`);
      for (let g = 0; g < n; g++) {
        if (sizes[g] >= target) continue;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (grid[r][c] !== g) continue;
            for (const [dr, dc] of dirs) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === -1) frontier[g].push(nr * n + nc);
            }
          }
        }
      }
      continue;
    }
    const list = frontier[best];
    const ri = Math.floor(Math.random() * list.length);
    const idx = list[ri];
    list[ri] = list[list.length - 1]; list.pop();
    const r = Math.floor(idx / n), c = idx % n;
    if (grid[r][c] !== -1) continue;
    grid[r][c] = best;
    sizes[best]++;
    claimed++;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === -1) frontier[best].push(nr * n + nc);
    }
  }

  console.log(`BFS done: ${iterations} iterations, ${Date.now() - start}ms`);
  console.log(`Final sizes: [${sizes.join(',')}]`);
  
  // Verify connectivity
  for (let g = 0; g < n; g++) {
    const cells: [number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (grid[r][c] === g) cells.push([r, c]);
    const seen = new Uint8Array(total);
    const stack: [number, number][] = [cells[0]];
    seen[cells[0][0] * n + cells[0][1]] = 1;
    let count = 0;
    while (stack.length > 0) {
      const [sr, sc] = stack.pop()!;
      count++;
      for (const [dr, dc] of dirs) {
        const nr = sr + dr, nc = sc + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === g && !seen[nr * n + nc]) {
          seen[nr * n + nc] = 1;
          stack.push([nr, nc]);
        }
      }
    }
    if (count !== cells.length) {
      console.log(`Region ${g}: only ${count}/${cells.length} connected`);
    }
  }
  console.log(`All regions ${Date.now() - start}ms`);
} else {
  console.log('constructHoles returned null');
}
