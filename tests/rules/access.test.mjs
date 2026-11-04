import { test, before, after, beforeEach } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { publicationUpdates } from '../../src/core.js';
let env;
const id = '-NCTb9s4nnhF0cY0sArI';
const post = { titulo: 'Artículo', contenido: 'Contenido público', categorias: '', imagen: '', activo: 1, fecha: 1660000000000 };
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-proferonald', database: { rules: await readFile('database.rules.json', 'utf8'), host: '127.0.0.1', port: 9000 }, storage: { rules: await readFile('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 } }); });
beforeEach(async () => {
  await env.clearDatabase(); await env.clearStorage();
  await env.withSecurityRulesDisabled(async ctx => { await ctx.database().ref().set({ articulos: { [id]: post, draft: { ...post, activo: 0 } }, publicaciones: { [id]: post }, perfilesPublicos: { user: { displayName: 'Usuario', photoURL: '' } }, usuarios: { user: { email: 'private@example.com' } } }); });
});
after(async () => { await env?.cleanup(); });
const guest = () => env.unauthenticatedContext(); const user = () => env.authenticatedContext('user'); const admin = () => env.authenticatedContext('admin', { admin: true });
test('public reads cannot reach drafts, legacy profiles or private email', async () => {
  await assertSucceeds(guest().database().ref('publicaciones').once('value'));
  await assertFails(guest().database().ref('articulos').once('value'));
  await assertFails(user().database().ref('articulos/draft').once('value'));
  await assertFails(user().database().ref('usuarios/user').once('value'));
  await assertFails(guest().database().ref('perfilesPrivados/user').once('value'));
  await assertSucceeds(guest().database().ref('perfilesPublicos/user').once('value'));
});
test('only administrator can atomically publish, withdraw and delete articles', async () => {
  await assertFails(user().database().ref().update(publicationUpdates(id, post)));
  await assertFails(admin().database().ref().update(publicationUpdates(id, { ...post, categoria: 'etiqueta-libre' })));
  await assertSucceeds(admin().database().ref().update(publicationUpdates(id, { ...post, categoria: 'cultura', categorias: 'lengua,Caribe' })));
  await assertSucceeds(admin().database().ref().update(publicationUpdates(id, { ...post, categoriasEditoriales: { cultura: true, educacion: true } })));
  await assertFails(admin().database().ref().update(publicationUpdates(id, { ...post, categoriasEditoriales: { cultura: true, inventada: true } })));
  await assertSucceeds(admin().database().ref().update(publicationUpdates(id, { ...post, activo: 0 })));
  await assertFails(admin().database().ref(`publicaciones/${id}`).set({ ...post, activo: 0 }));
  await assertSucceeds(admin().database().ref().update(publicationUpdates(id, null)));
});
test('profiles accept only public fields owned by the caller', async () => {
  await assertFails(user().database().ref('perfilesPublicos/other').set({ displayName: 'X', photoURL: '' }));
  await assertFails(user().database().ref('perfilesPublicos/user/email').set('private@example.com'));
  await assertSucceeds(user().database().ref('perfilesPublicos/user').set({ displayName: 'Usuario', photoURL: '' }));
});
test('comments require authentication, own UID, bounded text and a public article', async () => {
  const c = { comentario: 'Comentario', usuario: 'user', fecha: Date.now() };
  await assertFails(guest().database().ref(`comentarios/${id}/c`).set(c));
  await assertFails(user().database().ref(`comentarios/${id}/c`).set({ ...c, usuario: 'other' }));
  await assertFails(user().database().ref('comentarios/draft/c').set(c));
  await assertFails(user().database().ref(`comentarios/${id}/c`).set({ ...c, comentario: 'x'.repeat(601) }));
  await assertSucceeds(user().database().ref(`comentarios/${id}/c`).set(c));
  await assertFails(user().database().ref(`comentarios/${id}/c/comentario`).set('Editado'));
  await assertFails(guest().database().ref(`comentarios/${id}`).once('value'));
  await assertSucceeds(guest().database().ref(`comentarios/${id}`).limitToLast(20).once('value'));
});
test('replies require an existing parent and cannot impersonate or delete others', async () => {
  const ctx = user().database(); const value = { respuesta: 'Respuesta', usuario: 'user', fecha: Date.now() };
  await assertFails(ctx.ref(`respuestas/${id}/missing/r`).set(value));
  await assertSucceeds(ctx.ref(`comentarios/${id}/c`).set({ comentario: 'Comentario', usuario: 'user', fecha: Date.now() }));
  await assertFails(ctx.ref(`respuestas/${id}/c/r`).set({ ...value, usuario: 'other' }));
  await assertSucceeds(ctx.ref(`respuestas/${id}/c/r`).set(value));
  await assertFails(env.authenticatedContext('other').database().ref(`respuestas/${id}/c/r`).remove());
  await assertSucceeds(ctx.ref(`respuestas/${id}/c/r`).remove());
  await assertSucceeds(ctx.ref(`respuestas/${id}/c/r2`).set(value));
  await assertSucceeds(ctx.ref().update({ [`comentarios/${id}/c`]: null, [`respuestas/${id}/c`]: null }));
});
test('storage listing and modifications restricted to admin; active content types validated', async () => {
  await assertFails(user().storage().ref('fotos').list({ maxResults: 24 }));
  await assertFails(user().storage().ref('fotos/x.png').put(new Uint8Array([1]), { contentType: 'image/png' }));
  await assertSucceeds(admin().storage().ref('fotos/x.png').put(new Uint8Array([1]), { contentType: 'image/png' }));
  await assertSucceeds(guest().storage().ref('fotos/x.png').getDownloadURL());
  await assertFails(admin().storage().ref('fotos/x.svg').put(new Uint8Array([1]), { contentType: 'image/svg+xml' }));
  await assertFails(admin().storage().ref('archivos/x.html').put(new Uint8Array([1]), { contentType: 'text/html' }));
  await assertSucceeds(admin().storage().ref('archivos/x.pdf').put(new Uint8Array([1]), { contentType: 'application/pdf' }));
  await assertFails(user().storage().ref('archivos/x.pdf').getDownloadURL());
  await assertSucceeds(admin().storage().ref('imagenes/private.webp').put(new Uint8Array([1]), { contentType: 'image/webp' }));
  await assertFails(guest().storage().ref('imagenes/private.webp').getDownloadURL());
  await assertFails(user().storage().ref('imagenes/private.webp').getDownloadURL());
  await assertFails(user().storage().ref('fotos/x.png').delete());
  await assertSucceeds(admin().storage().ref('fotos/x.png').delete());
});
test('storage size limits cannot be bypassed by direct SDK calls', async () => {
  await assertFails(admin().storage().ref('fotos/large.png').put(new Uint8Array(5 * 1024 * 1024 + 1), { contentType: 'image/png' }));
  await assertFails(admin().storage().ref('archivos/large.pdf').put(new Uint8Array(20 * 1024 * 1024 + 1), { contentType: 'application/pdf' }));
});
