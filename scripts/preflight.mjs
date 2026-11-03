import { adminClient } from './admin-client.mjs';
try {
  const { db, auth } = adminClient();
  const snapshot = (await db.ref('/').get()).val() || {};
  if (snapshot.operacion?.schemaVersion !== 2) throw new Error('Primero ejecuta y verifica la migración de datos v2.');
  const active = Object.fromEntries(Object.entries(snapshot.articulos || {}).filter(([, p]) => p.activo === 1));
  const published = snapshot.publicaciones || {};
  if (Object.keys(active).length !== Object.keys(published).length || Object.entries(active).some(([id, post]) => JSON.stringify(post) !== JSON.stringify(published[id]))) throw new Error('El espejo público difiere de los artículos activos.');
  let nextPage; let hasAdmin = false;
  do { const result = await auth.listUsers(1000, nextPage); hasAdmin ||= result.users.some(u => u.customClaims?.admin === true); nextPage = result.pageToken; } while (nextPage && !hasAdmin);
  if (!hasAdmin) throw new Error('No hay una cuenta con el permiso admin.');
  console.log('Datos migrados, publicaciones consistentes y administrador configurado.');
} catch (e) { console.error('Publicación bloqueada:', e.message?.replace(/https?:\/\/\S+/g, '[URL omitida]')); process.exitCode = 1; }
finally { process.exit(process.exitCode || 0); }
