import { createServer } from 'vite';

const hanRe = /[\u3400-\u9fff]/;

async function main() {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const idx = await server.ssrLoadModule('/src/data/fullSearchIndex.ts');
    const { fullSearchIndex, fullSearchIndexEn } = idx;
    const { fsiiiRankings } = await server.ssrLoadModule('/src/data/worldview.ts');
    const { fsiiiRankingsEn } = await server.ssrLoadModule('/src/data/worldview.en.ts');

    const zhIds = new Set(fullSearchIndex.map((i) => i.id));
    const enIds = new Set(fullSearchIndexEn.map((i) => i.id));
    const missingEn = fullSearchIndex.filter((i) => !enIds.has(i.id)).map((i) => i.id);
    const extraEn = fullSearchIndexEn.filter((i) => !zhIds.has(i.id)).map((i) => i.id);

    let hanInEn = 0;
    const hanSamples = [];
    for (const item of fullSearchIndexEn) {
      const hay = `${item.title} ${item.content}`;
      if (hanRe.test(hay)) {
        hanInEn += 1;
        if (hanSamples.length < 15) hanSamples.push(`${item.id}: ${hay.slice(0, 90)}`);
      }
    }

    const fsiiiSame = JSON.stringify(fsiiiRankings.map(({ rank, score }) => [rank, score])) ===
      JSON.stringify(fsiiiRankingsEn.map(({ rank, score }) => [rank, score]));
    const fsiiiLen = fsiiiRankings.length === fsiiiRankingsEn.length;

    const { loadWordFrequencyEn } = await server.ssrLoadModule('/src/data/wordFrequencyEn.ts');
    await loadWordFrequencyEn().catch(() => {});
    const { wordFrequencyEn } = await server.ssrLoadModule('/src/data/wordFrequencyEn.ts');

    console.log('zh items:', fullSearchIndex.length);
    console.log('en items:', fullSearchIndexEn.length);
    console.log('zh ids without en mirror:', missingEn.length, JSON.stringify(missingEn.slice(0, 30)));
    console.log('en-only ids (not in zh):', extraEn.length, JSON.stringify(extraEn.slice(0, 30)));
    console.log('en items containing Han (title/content):', hanInEn);
    hanSamples.forEach((s) => console.log('  sample:', s));
    console.log('fsiii rankings identical:', fsiiiLen && fsiiiSame);
    console.log('en freq entries:', wordFrequencyEn.length);
    console.log('en freq Han-containing:', wordFrequencyEn.filter((w) => hanRe.test(w.word)).length);
    const dupEn = fullSearchIndexEn.length - new Set(fullSearchIndexEn.map((i) => i.id)).size;
    const dupZh = fullSearchIndex.length - new Set(fullSearchIndex.map((i) => i.id)).size;
    console.log('duplicate en ids:', dupEn, 'duplicate zh ids:', dupZh);
  } finally {
    await server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
