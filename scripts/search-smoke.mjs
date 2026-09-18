import { createServer } from 'vite';

async function main() {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const { fullTextSearch } = await server.ssrLoadModule('/src/data/fullSearchIndex.ts');
    const { hybridSearch } = await server.ssrLoadModule('/src/lib/hybridSearch.ts');

    const cases = [
      ['zh "咪呀"', '咪呀', 'zh-CN'],
      ['en "Miia"', 'Miia', 'en'],
      ['zh "Miia" (en word in zh corpus)', 'Miia', 'zh-CN'],
      ['en "咪呀" (zh word in en corpus → expect 0)', '咪呀', 'en'],
      ['en "compound chess"', 'compound chess', 'en'],
      ['zh "复合象棋"', '复合象棋', 'zh-CN'],
      ['en "qet"', 'qet', 'en'],
      ['zh "QET"', 'QET', 'zh-CN'],
    ];
    for (const [label, q, locale] of cases) {
      const hits = fullTextSearch(q, locale);
      console.log(`${label}: ${hits.length} hits` + (hits[0] ? ` | top: ${hits[0].item.id}` : ''));
    }

    console.log('\nhybridSearch locale behavior:');
    const h1 = hybridSearch('谁和小满关系最好', 5, 'zh-CN');
    const h2 = hybridSearch('who is closest to Xiaoman', 5, 'en');
    console.log(`zh query → ${h1.length} hits, top ${h1[0]?.item.id ?? '-'}`);
    console.log(`en query → ${h2.length} hits, top ${h2[0]?.item.id ?? '-'}`);
    const h3 = hybridSearch('咪呀', 5, 'en');
    console.log(`en corpus with zh query → ${h3.length} hits (expect 0)`);
  } finally {
    await server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
