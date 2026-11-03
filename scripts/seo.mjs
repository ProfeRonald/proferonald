import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { postURL } from '../src/core.js';
import { firebaseConfig, site } from '../src/config.js';
export async function generateSEO(posts) {
  const urls = [site.origin + '/'];
  for (const [id, post] of Object.entries(posts || {})) {
    if (post.activo !== 1 || !/^[-\w]{20}$/.test(id)) continue;
    const url = postURL(id, post.titulo);
    urls.push(url);
  }
  const xmlEscape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${xmlEscape(url)}</loc></url>`).join('')}</urlset>`);
  console.log(`SEO: ${urls.length - 1} publicaciones públicas.`);
}
if (process.argv[1]?.endsWith('seo.mjs')) {
  try {
    const { values } = parseArgs({ options: { input: { type: 'string' } } });
    let posts;
    if (values.input) posts = JSON.parse(await readFile(values.input, 'utf8'));
    else {
      const response = await fetch(`${firebaseConfig.databaseURL}/publicaciones.json`, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('No se pudo leer el catálogo público.');
      posts = await response.json();
    }
    await generateSEO(posts);
  } catch (e) { console.error('SEO no generado:', e.message); process.exitCode = 1; }
}
