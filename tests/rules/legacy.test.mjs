// Reproduces the permissions supplied by the owner; these rules are never deployed.
import { test, before, after } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-proferonald-legacy', database: { host: '127.0.0.1', port: 9000, rules: await readFile('tests/fixtures/database.legacy.rules.json', 'utf8') } });
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.database().ref().set({ articulos: { draft: { activo: 0, titulo: 'Borrador privado' } }, usuarios: { knownUid: { displayName: 'Usuario', email: 'private@example.test' } } });
  });
});
after(async () => { await env?.cleanup(); });
test('legacy rules expose drafts and complete profiles to an unauthenticated caller', async () => {
  const db = env.unauthenticatedContext().database();
  await assertSucceeds(db.ref('articulos/draft').once('value'));
  await assertSucceeds(db.ref('usuarios/knownUid/email').once('value'));
  // Public individual profiles do not imply permission to enumerate the users root.
  await assertFails(db.ref('usuarios').once('value'));
});
test('legacy rules allow unauthenticated creation, overwriting and author impersonation', async () => {
  const db = env.unauthenticatedContext().database();
  await assertSucceeds(db.ref('comentarios/post/comment').set({ comentario: 'Comentario válido', usuario: 'another-user', fecha: Date.now() - 1000 }));
  await assertSucceeds(db.ref('comentarios/post/comment').set({ comentario: 'Contenido reemplazado', usuario: 'impersonated-user', fecha: 1 }));
  await assertSucceeds(db.ref('comentarios/post/comment/respuestas/reply').set({ respuesta: '<img src=x onerror=alert(1)>', usuario: 'another-user', fecha: 1 }));
  await assertSucceeds(db.ref('comentarios/post/comment/usuario').remove());
  await assertFails(db.ref('comentarios/post/comment').remove());
});
