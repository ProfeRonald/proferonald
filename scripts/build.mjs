import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { mathliveFonts } from '../src/config.js';
const root = process.cwd();
const dist = path.resolve('dist');
if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Unexpected build destination');
await mkdir(dist, { recursive: true });
// Keep the output directory itself: Windows previews may hold an open directory handle.
for (const name of await readdir(dist)) {
  const target = path.resolve(dist, name);
  if (!target.startsWith(dist + path.sep)) throw new Error('Unexpected output path');
  await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
await mkdir('dist/assets/build', { recursive: true });
await cp('src/verse-frame.js','dist/assets/verse-frame.js');
await cp('src/assets/brand','dist/assets/brand',{recursive:true});
await mkdir('dist/assets/licenses',{recursive:true});
for (const font of ['Inter','Lora']) await cp(`src/fonts/${font}-OFL.txt`, `dist/assets/licenses/${font}-OFL.txt`);
await sharp('src/assets/brand/social.svg').png().toFile('dist/assets/brand/social.png');
await sharp('src/assets/brand/wordmark.svg').resize({width:1600}).png().toFile('dist/assets/brand/wordmark.png');
await sharp('src/assets/brand/mark.svg').resize(512,512).png().toFile('dist/assets/brand/mark.png');
const favicon = await sharp('src/assets/brand/mark.svg').resize(32,32).png().toBuffer();
const ico = Buffer.alloc(22); ico.writeUInt16LE(1,2); ico.writeUInt16LE(1,4); ico[6]=32; ico[7]=32; ico.writeUInt16LE(1,10); ico.writeUInt16LE(32,12); ico.writeUInt32LE(favicon.length,14); ico.writeUInt32LE(22,18);
await writeFile('dist/assets/brand/favicon.ico',Buffer.concat([ico,favicon]));
// Explicit allowlist: never publish legacy JS, compiled manager, maps or archivos2.
for (const dir of ['images', 'htmls']) await cp(`docs/assets/${dir}`, `dist/assets/${dir}`, { recursive: true });
for (const name of await readdir('docs/assets/images')) {
  if (!/\.(png|jpe?g)$/i.test(name)) continue;
  await sharp(`docs/assets/images/${name}`).rotate().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`dist/assets/images/${name.replace(/\.[^.]+$/, '')}.webp`);
}
for (const file of ['word-latex.png', 'subir-img.png']) await cp(`docs/${file}`, `dist/${file}`);
const result = await build({ entryPoints: { app: 'src/app.js', manager: 'src/manager-entry.js' }, outdir: 'dist/assets/build', entryNames: '[name]-[hash]', chunkNames: 'chunk-[hash]', assetNames: '[name]-[hash]', loader: { '.woff2':'file', '.ttf':'file' }, bundle: true, splitting: true, format: 'esm', minify: true, target: ['es2022'], metafile: true });
const forbiddenInputs = Object.keys(result.metafile.inputs).filter(name => /(?:node_modules\/(?:bootstrap|jquery)|vendor\/bootstrap|assets\/css\/theme\.css)/i.test(name.replaceAll('\\','/')));
if (forbiddenInputs.length) throw new Error('Legacy UI dependency reached the build: '+forbiddenInputs.join(', '));
const entry = name => Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === `src/${name}.js`);
const [appJS, app] = entry('app'); const [managerJS, manager] = entry('manager-entry');
const css = '/' + app.cssBundle.replaceAll('\\', '/').replace(/^dist\//, '');
const values = { '{{APP_JS}}': '/' + appJS.replace(/^dist\//, ''), '{{MANAGER_JS}}': '/' + managerJS.replace(/^dist\//, ''), '{{APP_CSS}}': css };
for (const [source, destination] of [['src/index.html', 'dist/index.html'], ['src/manager.html', 'dist/archivos/index.html'], ['src/404.html','dist/404.html']]) {
  let html = await readFile(source, 'utf8'); for (const [key, value] of Object.entries(values)) html = html.replaceAll(key, source.includes('manager.html') && key === '{{APP_CSS}}' ? '/' + manager.cssBundle.replaceAll('\\', '/').replace(/^dist\//, '') : value);
  await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, html);
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
if (mathliveFonts !== `/assets/build/mathlive-${manifest.dependencies.mathlive}/fonts`) throw new Error('Update the versioned MathLive fonts path with the dependency.');
await cp('node_modules/mathlive/fonts', 'dist' + mathliveFonts, { recursive: true });
await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nDisallow: /archivos/\nSitemap: https://proferonald.com/sitemap.xml\n');
await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://proferonald.com/</loc></url></urlset>');
await mkdir('functions/lib', { recursive: true });
await cp('dist/index.html', 'functions/lib/shell.html');
await build({ entryPoints: ['src/render.js'], outfile: 'functions/lib/render.mjs', platform: 'node', format: 'esm', bundle: true, packages: 'external', target: 'node22' });
console.log('Build ready in dist/ (legacy applications excluded).');
