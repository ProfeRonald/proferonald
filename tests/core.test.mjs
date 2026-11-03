import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { escapeHTML, safeURL, youtubeID, encodePID, decodePID, dateInfo, matchesPost, validateArticle, validateComment, filePolicy, publicationUpdates } from '../src/core.js';
import { contentTools } from '../src/content.js';
import { migrationUpdates } from '../src/migration.js';
const window = new JSDOM('').window; const tools = contentTools(window);
const id = '-NCTb9s4nnhF0cY0sArI';
const article = { titulo: 'Álgebra', contenido: '<p>Educación $x^2$</p>', categorias: 'Matemática, Noticias', imagen: '', activo: 1, fecha: 1660000000000 };
test('legacy pid roundtrip and malformed identifiers', () => {
  assert.equal(decodePID(encodePID(id)), id);
  for (const value of ['', 'abc', '%', encodePID(id).replace(/t/, '!'), null]) assert.equal(decodePID(value), '');
});
test('HTML and URL boundaries', () => {
  assert.equal(escapeHTML('<img "x">'), '&lt;img &quot;x&quot;&gt;');
  for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.com']) assert.equal(safeURL(value), '');
  assert.equal(safeURL('http://example.com/image.png', { image: true }), '');
  assert.equal(safeURL('/assets/images/logo.png', { image: true }), 'https://proferonald.com/assets/images/logo.png');
});
test('YouTube parsed by hostname and ID, not string replacement', () => {
  for (const url of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1', 'https://youtube.com/embed/dQw4w9WgXcQ']) assert.equal(youtubeID(url), 'dQw4w9WgXcQ');
  for (const url of ['https://youtube.com.evil.com/embed/dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtu.be/bad', 'https://youtube.com:9000/embed/dQw4w9WgXcQ']) assert.equal(youtubeID(url), '');
});
test('rich HTML strips scripts, attributes, custom elements and unsafe links', () => {
  const clean = tools.sanitize('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">x</a><svg onload="alert(1)"></svg><math-field onclick="x()">x</math-field><strong>Bien</strong><iframe src="https://evil.com"></iframe>');
  assert.doesNotMatch(clean, /<script|onerror|onclick|javascript:|<svg|<iframe|<math-field/);
  assert.match(clean, /<strong>Bien<\/strong>/);
});
test('comments stay literal text while math is created as safe elements', () => {
  const node = window.document.createElement('div');
  tools.plain(node, '<img onerror="evil()"> $x<y$ $$z^2$$ https://example.com');
  assert.equal(node.querySelectorAll('img').length, 0);
  assert.equal(node.querySelectorAll('math-field').length, 2);
  assert.equal(node.querySelector('math-field').textContent, 'x<y');
  assert.equal(node.querySelector('a').rel, 'noopener noreferrer');
});
test('article formulas and formatting survive sanitation', () => {
  const node = window.document.createElement('div'); tools.rich(node, '<strong>Fórmula</strong> $x^2$\n$$y=1$$');
  assert.equal(node.querySelector('strong').textContent, 'Fórmula'); assert.equal(node.querySelectorAll('math-field').length, 2);
});
test('date metadata handles January and invalid data', () => { assert.match(dateInfo(Date.UTC(2024, 0, 5)).iso, /^2024-01-05/); assert.equal(dateInfo('invalid').iso, ''); });
test('accent insensitive search and exact categories', () => {
  assert.equal(matchesPost(article, 'educacion', 'matematica'), true); assert.equal(matchesPost(article, 'álgebra', 'Noticias'), true); assert.equal(matchesPost(article, '', 'Matem'), false);
});
test('article and comment validation rejects invalid lengths and URLs', () => {
  assert.equal(validateArticle(article).categorias, 'Matemática,Noticias');
  assert.throws(() => validateArticle({ ...article, titulo: '' })); assert.throws(() => validateArticle({ ...article, imagen: 'javascript:evil()' }));
  assert.throws(() => validateComment('abc')); assert.throws(() => validateComment('x'.repeat(601))); assert.equal(validateComment(' comentario '), 'comentario');
  assert.equal(validateArticle({ ...article, activo: 0, imagen: 'private:imagenes/12345678-1234-1234-1234-123456789abc.webp' }).imagen, 'private:imagenes/12345678-1234-1234-1234-123456789abc.webp');
});
test('file policy rejects executable, empty and oversized files', () => {
  assert.throws(() => filePolicy({ type: 'text/html', size: 10 })); assert.throws(() => filePolicy({ type: 'image/svg+xml', size: 10 }, true));
  assert.throws(() => filePolicy({ type: 'image/png', size: 6 * 1024 * 1024 }, true)); assert.throws(() => filePolicy({ type: 'application/pdf', size: 0 }));
  assert.equal(filePolicy({ type: 'application/pdf', size: 100 }), true);
});
test('atomic public mirror excludes drafts and removes withdrawn posts', () => {
  assert.equal(publicationUpdates(id, article)[`publicaciones/${id}`], article);
  assert.equal(publicationUpdates(id, { ...article, activo: 0 })[`publicaciones/${id}`], null);
  assert.equal(publicationUpdates(id, null)[`articulos/${id}`], null);
});
test('migration separates profiles, removes legacy email and preserves dates', () => {
  const snapshot = { articulos: { [id]: article }, usuarios: { user: { displayName: 'Nombre', email: 'private@example.com', photoURL: '' } } };
  const result = migrationUpdates(snapshot, tools.sanitize, tools.text);
  assert.equal(result.updates[`publicaciones/${id}`].fecha, article.fecha);
  assert.equal(result.updates['usuarios/user'], null); assert.equal(result.updates['perfilesPublicos/user'].email, undefined);
  assert.equal(result.updates['perfilesPrivados/user/email'], undefined);
  assert.equal(migrationUpdates(snapshot, tools.sanitize, tools.text, { retainEmail: true }).updates['perfilesPrivados/user/email'], 'private@example.com');
});
test('migration refuses invalid records instead of silently losing data', () => { assert.throws(() => migrationUpdates({ articulos: { [id]: { ...article, contenido: '<script>bad()</script>' } } }, tools.sanitize, tools.text)); });
