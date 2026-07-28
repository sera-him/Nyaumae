import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const serverDirectory = resolve(root, 'dist', 'server');
const metadataDirectory = resolve(root, 'dist', '.openai');
const hostingSource = resolve(root, '.openai', 'hosting.json');

mkdirSync(serverDirectory, { recursive: true });
mkdirSync(metadataDirectory, { recursive: true });

writeFileSync(resolve(serverDirectory, 'index.js'), `export default {
  async fetch(request, env) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('Static asset binding is unavailable.', { status: 503 });
  },
};
`, 'utf8');

if (existsSync(hostingSource)) {
  copyFileSync(hostingSource, resolve(metadataDirectory, 'hosting.json'));
}
