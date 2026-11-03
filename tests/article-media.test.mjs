import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { contentTools } from '../src/content.js';
import { prepareArticleMedia } from '../src/article-media.js';
import { centeredCrop, clampCrop, imageSize, outputSize } from '../src/image-geometry.js';
const window = new JSDOM('').window, document = window.document, content = contentTools(window);
const a = 'private:imagenes/11111111-1111-4111-8111-111111111111.webp';
const b = 'private:imagenes/22222222-2222-4222-8222-222222222222.webp';
const article = { activo: 1, imagen: a, contenido: `<p>Texto $x^2$</p><img data-private-image="${a}" alt="Primera"><img data-private-image="${b}" width="150" alt="Segunda">` };

test('private inline images survive draft sanitation but are absent from public HTML', () => {
  const html = `<img src="${a}" width="250" alt="Privada" onerror="evil()"><img data-private-image="private:imagenes/../../secret" src="javascript:evil()"><img src="https://example.com/a.png" width="999999">`;
  const privateHTML = content.sanitize(html, { privateImages: true });
  assert.match(privateHTML, /data-private-image="private:imagenes\//); assert.match(privateHTML, /width="250"/);
  assert.doesNotMatch(privateHTML, /onerror|javascript:|secret|999999/);
  const published = content.sanitize(privateHTML); assert.doesNotMatch(published, /data-private-image|private:imagenes/);
  assert.equal(new JSDOM(published).window.document.querySelectorAll('img').length, 1);
});

test('publication promotes each distinct private image once and leaves the form copy intact', async () => {
  const promoted = [], removed = [];
  const prepared = await prepareArticleMedia(article, { document, publish: async src => { promoted.push(src); return { item: src, url: `https://example.com/${promoted.length}.webp` }; }, remove: async item => removed.push(item) });
  assert.deepEqual(promoted, [a,b]); assert.equal(prepared.value.imagen, 'https://example.com/1.webp');
  const images = new JSDOM(prepared.value.contenido).window.document.querySelectorAll('img');
  assert.equal(images[0].src, prepared.value.imagen); assert.equal(images[1].width, 150);
  assert.doesNotMatch(prepared.value.contenido, /data-private-image|private:/); assert.match(article.contenido, /data-private-image/);
  await prepared.rollback(); assert.deepEqual(removed, [a,b]);
});

test('a failed image promotion removes earlier public copies and preserves private originals', async () => {
  const removed = [];
  await assert.rejects(prepareArticleMedia(article, { document, publish: async src => { if (src === b) throw new Error('storage/unavailable'); return { item: 'copy-a', url: 'https://example.com/a.webp' }; }, remove: async item => removed.push(item) }), /unavailable/);
  assert.deepEqual(removed, ['copy-a']); assert.equal(article.imagen, a);
});

test('saving a draft does not publish its cover or inline images', async () => {
  const prepared = await prepareArticleMedia({ ...article, activo: 0 }, { document, publish: async () => { throw new Error('must not upload'); }, remove: async () => {} });
  assert.equal(prepared.value.imagen, a); assert.match(prepared.value.contenido, /data-private-image/); await prepared.rollback();
});

test('crop geometry remains inside the image, including portrait rotation and constrained exports', () => {
  assert.deepEqual(imageSize(300,200,1), {width:200,height:300});
  assert.deepEqual(centeredCrop(300,200,1), {x:50,y:0,width:200,height:200});
  assert.deepEqual(clampCrop({x:250,y:-20,width:500,height:300},300,200), {x:250,y:0,width:50,height:200});
  assert.deepEqual(outputSize({width:150,height:200},150), {width:150,height:200});
  const portrait = outputSize({width:2000,height:8000},1920); assert.deepEqual(portrait,{width:480,height:1920});
  assert.deepEqual(outputSize({width:100,height:80},500), {width:100,height:80});
});
