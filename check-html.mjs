fetch('https://sera-him.github.io/Nyaumae/')
  .then(r => r.text())
  .then(h => {
    const scripts = [...h.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
    const links = [...h.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]);
    console.log('Scripts:', JSON.stringify(scripts));
    console.log('Links:', JSON.stringify(links));
    const base = h.match(/<base[^>]+>/);
    console.log('Base tag:', base ? base[0] : 'NONE');
    const title = h.match(/<title>([^<]+)<\/title>/);
    console.log('Title:', title ? title[1] : 'NONE');
    console.log('Has root div:', h.includes('id="root"'));
  });
