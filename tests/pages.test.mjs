import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { renderPublicPost } from '../src/render.js';
import { createPageHandler } from '../functions/page-handler.js';
const id = '-NCTb9s4nnhF0cY0sArI';
const template = await readFile('src/index.html', 'utf8');
const post = { titulo: '<script>alert(1)</script>', contenido: '<p>Hola $x^2$</p><script>evil()</script>', imagen: '', activo: 1, fecha: 1660000000000 };
test('public HTML has article metadata and safely escaped content without JavaScript', () => {
  const doc = new JSDOM(renderPublicPost(template, id, post)).window.document;
  assert.equal(doc.querySelector('h1').textContent, post.titulo);
  assert.equal(doc.querySelector('main script'), null);
  assert.equal(doc.querySelector('meta[property="og:type"]').content, 'article');
  assert.match(doc.querySelector('link[rel="canonical"]').href, /publicaciones\//);
});
test('withdrawn or nonexistent post never renders from a historical snapshot', () => {
  assert.equal(renderPublicPost(template, id, { ...post, activo: 0 }), null); assert.equal(renderPublicPost(template, id, null), null);
});
function response() { return { headers: {}, code: 0, body: '', set(k, v) { this.headers[k] = v; return this; }, status(n) { this.code = n; return this; }, type() { return this; }, send(body) { this.body = body; return this; } }; }
test('server rechecks current visibility on every request and uses no-store', async () => {
  let current = post;
  const handler = createPageHandler({ template: async () => template, getPost: async () => current, render: renderPublicPost });
  const first = response(); await handler({ method: 'GET', url: `/publicaciones/${id}/` }, first); assert.equal(first.code, 200); assert.match(first.headers['Cache-Control'], /no-store/);
  current = null; const second = response(); await handler({ method: 'GET', url: `/publicaciones/${id}/` }, second); assert.equal(second.code, 404); assert.doesNotMatch(second.body, /Hola/);
});
test('private preview shell never contains draft content and is noindex', async () => {
  let reads = 0;
  const handler = createPageHandler({ template: async () => template, getPost: async () => { reads++; return post; }, render: renderPublicPost });
  const result = response(); await handler({ method: 'GET', url: `/publicaciones/${id}/?preview=1` }, result);
  assert.equal(reads, 0); assert.equal(result.code, 200); assert.equal(result.headers['X-Robots-Tag'], 'noindex,nofollow'); assert.doesNotMatch(result.body, /Hola/);
});
