/**
 * Runs the responsive-image variant generator (Python/Pillow) as part of
 * `npm run build`, tolerating environments where Python is unavailable: a
 * stale manifest only means fewer pre-generated variants and a larger deploy,
 * never broken images, because ResponsiveImage falls back to originals that
 * the prune step keeps when they are missing from the manifest.
 */
import { spawn } from 'node:child_process';

const script = 'scripts/generate_responsive_images.py';

function tryRun(command) {
  return new Promise((resolve) => {
    const child = spawn(command, [script], { stdio: 'inherit', shell: false });
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

const ok = (await tryRun('python')) || (await tryRun('python3'));
if (!ok) {
  console.warn('[build] responsive image variants skipped (python/Pillow unavailable); using existing manifest');
}
