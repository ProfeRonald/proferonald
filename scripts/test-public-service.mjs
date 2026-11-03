import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5000';
const home = await fetch(base + '/'); assert.equal(home.status, 200);
// Superstatic's glob-slasher converts URL slashes to backslashes on Windows,
// so custom Hosting headers cannot be asserted there. CI on Linux checks them.
if (process.platform !== 'win32') assert.match(home.headers.get('cache-control'), /no-cache/);
const id = '-NCTb9s4nnhF0cY0sAr8';
const result = await fetch(`${base}/publicaciones/${id}/`);
assert.equal(result.status, 200);
const html = await result.text();
assert.equal(new JSDOM(html).window.document.querySelector('main h1')?.textContent, 'Artículo 8');
assert.match(html, /og:type" content="article/);
assert.match(result.headers.get('cache-control'), /no-store/);
const missing = await fetch(`${base}/publicaciones/-NCTb9s4nnhF0cY0sAr0/`); assert.equal(missing.status, 404);
const preview = await fetch(`${base}/publicaciones/${id}/?preview=1`);
assert.equal(preview.status, 200); assert.notEqual(new JSDOM(await preview.text()).window.document.querySelector('main h1')?.textContent, 'Artículo 8');
assert.equal(preview.headers.get('x-robots-tag'), 'noindex,nofollow');
const absent = await fetch(`${base}/assets/missing.js`); assert.equal(absent.status, 404);
console.log('Public function + Hosting: HTML, metadata, no-store, preview and 404 verified.');
