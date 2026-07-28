import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const T = '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';
const O = 'sera-him', R = 'Nyaumae', B = 'gh-pages';
const dist = 'C:/Users/Administrator/Desktop/app/dist';
const textRe = /\.(html?|css|js|json|svg|txt|xml|md|yml|ico|webmanifest)$/i;

async function api(m, p, b) {
  const r = await fetch(`https://api.github.com/repos/${O}/${R}${p}`, {
    method: m,
    headers: { Authorization: `Bearer ${T}`, 'Content-Type': 'application/json', 'User-Agent': 'd' },
    body: b ? JSON.stringify(b) : undefined,
  });
  if (!r.ok) throw Error(`${m} ${p}: ${await r.text()}`);
  return r.headers.get('content-type')?.includes('json') ? r.json() : r.text();
}

async function main() {
  const headSha = (await api('GET', `/git/refs/heads/${B}`)).object.sha;
  const files = [];
  (function walk(p) {
    for (const n of readdirSync(p)) {
      const u = join(p, n);
      statSync(u).isDirectory() ? walk(u) : files.push({ path: relative(dist, u).replace(/\\/g, '/'), full: u });
    }
  })(dist);
  console.log(`${files.length} files`);

  const blobs = await Promise.all(files.map(async x => {
    const c = readFileSync(x.full);
    const t = textRe.test(x.path);
    const b = await api('POST', '/git/blobs', {
      content: t ? c.toString() : c.toString('base64'),
      encoding: t ? 'utf-8' : 'base64',
    });
    return { path: x.path, mode: '100644', type: 'blob', sha: b.sha };
  }));

  const tree = await api('POST', '/git/trees', { tree: blobs });
  const commit = await api('POST', '/git/commits', { message: 'deploy', tree: tree.sha, parents: [headSha] });
  await api('PATCH', `/git/refs/heads/${B}`, { sha: commit.sha, force: true });
  console.log('Done');
}

main().catch(e => { console.error(e.message); process.exit(1); });
