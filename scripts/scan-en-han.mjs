import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'E:/app/src';
const hanRe = /[\u3400-\u9fff]/;

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.en.ts')) out.push(full);
  }
  return out;
};

let flagged = 0;
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (hanRe.test(line)) {
      flagged += 1;
      console.log(`${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 140)}`);
    }
  });
}
console.log(`\nTOTAL Han lines in *.en.ts: ${flagged}`);
