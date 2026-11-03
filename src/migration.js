import { validateArticle, publicationUpdates, draftImagePath } from './core.js';
export function migrationUpdates(snapshot, sanitize, text, { retainEmail = false } = {}) {
  const updates = {}; let articles = 0; let profiles = 0;
  for (const [id, source] of Object.entries(snapshot.articulos || {})) {
    if (!/^[-\w]{20}$/.test(id)) throw new Error('Identificador de artículo no válido.');
    const value = validateArticle({ ...source, activo: Number(source.activo) === 1 });
    if (value.activo === 1 && draftImagePath(value.imagen)) throw new Error(`El artículo activo ${id} conserva una imagen privada.`);
    value.contenido = sanitize(value.contenido);
    if (!text(value.contenido).trim()) throw new Error(`El artículo ${id} queda vacío después de sanearlo.`);
    if (!Number.isFinite(source.fecha) || source.fecha <= 0 || source.fecha > Date.now()) throw new Error(`Fecha no válida en ${id}.`);
    value.fecha = source.fecha;
    if (Number.isFinite(source.actualizado)) value.actualizado = source.actualizado;
    Object.assign(updates, publicationUpdates(id, value)); articles++;
  }
  // Remove obsolete public copies; never leave withdrawn drafts in the mirror.
  for (const id of Object.keys(snapshot.publicaciones || {})) if (!(id in (snapshot.articulos || {}))) updates[`publicaciones/${id}`] = null;
  for (const [uid, profile] of Object.entries(snapshot.usuarios || {})) {
    if (!/^[\w-]{1,128}$/.test(uid)) throw new Error('Identificador de perfil no válido.');
    if (!snapshot.perfilesPublicos?.[uid]) updates[`perfilesPublicos/${uid}`] = { displayName: String(profile.displayName || 'Usuario').slice(0, 120), photoURL: /^https:\/\//.test(profile.photoURL || '') ? profile.photoURL.slice(0, 2048) : '' };
    if (retainEmail && profile.email) updates[`perfilesPrivados/${uid}/email`] = String(profile.email);
    updates[`usuarios/${uid}`] = null; profiles++;
  }
  updates['operacion/schemaVersion'] = 2;
  for (const [post, comments] of Object.entries(snapshot.comentarios || {})) {
    for (const [cid, comment] of Object.entries(comments)) if (comment.respuestas) {
      updates[`respuestas/${post}/${cid}`] = { ...comment.respuestas, ...snapshot.respuestas?.[post]?.[cid] };
      updates[`comentarios/${post}/${cid}/respuestas`] = null;
    }
  }
  return { updates, articles, profiles };
}
