import { ref, query, orderByKey, endBefore, limitToLast, get, push, update, serverTimestamp, onValue, remove, startAfter, limitToFirst } from 'firebase/database';
import { db } from './firebase.js';
import { site } from './config.js';
import { publicationUpdates, validateArticle, validateComment, draftImagePath } from './core.js';
const rows = snapshot => { const result = []; snapshot.forEach(s => { result.push({ ...s.val(), id: s.key }); }); return result; };
export async function page(cursor = '') {
  const constraints = [orderByKey(), ...(cursor ? [endBefore(cursor)] : []), limitToLast(site.pageSize + 1)];
  const items = rows(await get(query(ref(db, 'publicaciones'), ...constraints))).reverse();
  return { items: items.slice(0, site.pageSize), more: items.length > site.pageSize };
}
export async function catalog() {
  const all = []; let cursor = '';
  while (true) {
    const batch = rows(await get(query(ref(db, 'publicaciones'), orderByKey(), ...(cursor ? [startAfter(cursor)] : []), limitToFirst(100))));
    all.push(...batch);
    if (batch.length < 100) return all.reverse();
    cursor = batch.at(-1).id;
  }
}
export async function article(id, preview = false) {
  const snap = await get(ref(db, `${preview ? 'articulos' : 'publicaciones'}/${id}`));
  return snap.exists() ? { ...snap.val(), id } : null;
}
export async function saveArticle(input, id = '', fecha) {
  const value = { ...validateArticle(input), fecha: fecha || serverTimestamp(), actualizado: serverTimestamp() };
  if (value.activo === 1 && draftImagePath(value.imagen)) throw new Error('La imagen privada debe publicarse antes de guardar el artículo activo.');
  const key = id || push(ref(db, 'articulos')).key;
  await update(ref(db), publicationUpdates(key, value));
  return key;
}
export async function deleteArticle(id) {
  await update(ref(db), { ...publicationUpdates(id, null), [`comentarios/${id}`]: null, [`respuestas/${id}`]: null });
}
export const drafts = async () => rows(await get(ref(db, 'articulos'))).filter(p => p.activo !== 1).reverse();
export function watchComments(id, callback, error) {
  let comments = []; let stopped = false;
  const replies = new Map();
  const emit = () => { if (!stopped) callback(comments.map(c => ({ ...c, respuestas: replies.get(c.id)?.value || {} }))); };
  const stop = onValue(query(ref(db, `comentarios/${id}`), orderByKey(), limitToLast(20)), snap => {
    comments = rows(snap).reverse();
    const ids = new Set(comments.map(c => c.id));
    for (const [cid, subscription] of replies) if (!ids.has(cid)) { subscription.stop(); replies.delete(cid); }
    for (const cid of ids) if (!replies.has(cid)) {
      const subscription = { value: {}, stop: () => {} }; replies.set(cid, subscription);
      subscription.stop = onValue(query(ref(db, `respuestas/${id}/${cid}`), orderByKey(), limitToLast(20)), snapshot => { subscription.value = snapshot.val() || {}; emit(); }, error);
    }
    emit();
  }, error);
  return () => { stopped = true; stop(); for (const subscription of replies.values()) subscription.stop(); replies.clear(); };
}
export async function addComment(id, uid, text, parent = '') {
  const value = validateComment(text);
  await push(ref(db, parent ? `respuestas/${id}/${parent}` : `comentarios/${id}`), { [parent ? 'respuesta' : 'comentario']: value, usuario: uid, fecha: serverTimestamp() });
}
export const deleteComment = (id, cid, rid = '') => rid ? remove(ref(db, `respuestas/${id}/${cid}/${rid}`)) : update(ref(db), { [`comentarios/${id}/${cid}`]: null, [`respuestas/${id}/${cid}`]: null });
const profiles = new Map();
export function profile(uid) {
  if (!profiles.has(uid)) profiles.set(uid, get(ref(db, `perfilesPublicos/${uid}`)).then(s => s.val() || { displayName: 'Usuario' }).catch(e => { profiles.delete(uid); throw e; }));
  return profiles.get(uid);
}

export async function neighbors(id) {
  const before = query(ref(db,'publicaciones'), orderByKey(), endBefore(id), limitToLast(1));
  const after = query(ref(db,'publicaciones'), orderByKey(), startAfter(id), limitToFirst(1));
  return Promise.all([before,after].map(async q => rows(await get(q))[0] || null));
}
