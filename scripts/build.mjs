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
// Explicit allowlist: never publish legacy JS, compiled manager, maps or archivos2.
for (const dir of ['images', 'htmls', 'css']) await cp(`docs/assets/${dir}`, `dist/assets/${dir}`, { recursive: true });
for (const name of await readdir('docs/assets/images')) {
  if (!/\.(png|jpe?g)$/i.test(name)) continue;
  await sharp(`docs/assets/images/${name}`).rotate().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`dist/assets/images/${name.replace(/\.[^.]+$/, '')}.webp`);
}
for (const file of ['word-latex.png', 'subir-img.png']) await cp(`docs/${file}`, `dist/${file}`);
const result = await build({ entryPoints: { app: 'src/app.js', manager: 'src/manager-entry.js' }, outdir: 'dist/assets/build', entryNames: '[name]-[hash]', chunkNames: 'chunk-[hash]', assetNames: '[name]-[hash]', loader: { '.woff2':'file', '.ttf':'file' }, bundle: true, splitting: true, format: 'esm', minify: true, target: ['es2022'], metafile: true });
const entry = name => Object.entries(result.metafile.outputs).find(([, value]) => value.entryPoint === `src/${name}.js`);
const [appJS, app] = entry('app'); const [managerJS, manager] = entry('manager-entry');
const css = '/' + app.cssBundle.replaceAll('\\', '/').replace(/^dist\//, '');
const values = { '{{APP_JS}}': '/' + appJS.replace(/^dist\//, ''), '{{MANAGER_JS}}': '/' + managerJS.replace(/^dist\//, ''), '{{APP_CSS}}': css };
for (const [source, destination] of [['src/index.html', 'dist/index.html'], ['src/manager.html', 'dist/archivos/index.html']]) {
  let html = await readFile(source, 'utf8'); for (const [key, value] of Object.entries(values)) html = html.replaceAll(key, source.includes('manager.html') && key === '{{APP_CSS}}' ? '/' + manager.cssBundle.replaceAll('\\', '/').replace(/^dist\//, '') : value);
  await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, html);
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
if (mathliveFonts !== `/assets/build/mathlive-${manifest.dependencies.mathlive}/fonts`) throw new Error('Update the versioned MathLive fonts path with the dependency.');
await cp('node_modules/mathlive/fonts', 'dist' + mathliveFonts, { recursive: true });
await writeFile('dist/404.html', '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no encontrada — ProfeRonald</title><h1>Página no encontrada</h1><p>El enlace no existe.</p><a href="/">Volver al blog</a></html>');
await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nDisallow: /archivos/\nSitemap: https://proferonald.com/sitemap.xml\n');
await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://proferonald.com/</loc></url></urlset>');
await mkdir('functions/lib', { recursive: true });
await cp('dist/index.html', 'functions/lib/shell.html');
await build({ entryPoints: ['src/render.js'], outfile: 'functions/lib/render.mjs', platform: 'node', format: 'esm', bundle: true, packages: 'external', target: 'node22' });
console.log('Build ready in dist/ (legacy applications excluded).');
