import { observeSession, login, logout, finishRedirect, session } from './auth.js';
import { listFiles, uploadFile, publicPhotoURL, deleteFile, downloadFile, fileMetadata } from './files.js';
import { $, status, report, busy, fieldError } from './ui.js';
import { escapeHTML } from './core.js';
let prefix = ''; let pageToken; let items = []; let generation = 0;
let names = [];
const pending = new Set();
async function load(append = false) {
  const version = ++generation;
  status('Cargando archivos…');
  const result = await listFiles(prefix, append ? pageToken : undefined);
  const metadata = await Promise.all(result.items.map(item => fileMetadata(item)));
  if (version !== generation || !session.admin) return;
  pageToken = result.nextPageToken;
  if (!append) { items = []; names = []; $('#file-list').replaceChildren(); }
  $('#folder-name').textContent = prefix || 'Biblioteca';
  $('#photos-folder').setAttribute('aria-pressed',String(prefix === 'fotos'));
  $('#documents-folder').setAttribute('aria-pressed',String(prefix === 'archivos'));
  for (const folder of result.prefixes) {
    const li = document.createElement('li');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'button button-quiet'; b.textContent = `Carpeta: ${folder.name}`;
    b.addEventListener('click', () => { prefix = folder.fullPath; load().catch(e => report(e, 'archivos')); });
    li.append(b); $('#file-list').append(li);
  }
  for (const item of result.items) {
    const index = items.push(item) - 1;
    const name = metadata[result.items.indexOf(item)].customMetadata?.originalName || item.name;
    names[index] = name;
    const li = document.createElement('li'); li.className = 'file-row';
    li.innerHTML = `<span>${escapeHTML(name)}</span> <button type="button" data-download="${index}" class="button button-small button-outline">Descargar</button> ${item.fullPath.startsWith('fotos/') ? `<button type="button" data-copy="${index}" class="button button-small button-outline">Copiar enlace público</button>` : ''} <button type="button" data-delete="${index}" class="button button-small button-danger">Eliminar</button>`;
    $('#file-list').append(li);
  }
  $('#more-files').hidden = !pageToken;
  $('#empty-files').hidden = $('#file-list').children.length > 0;
  status('');
}
observeSession(state => {
  generation++;
  $('#manager').hidden = !state.admin;
  $('#manager-auth').textContent = state.user ? 'Salir' : 'Entrar con Google';
  $('#access-message').textContent = state.admin ? 'Solo las imágenes de fotos/ son públicas. Los documentos se descargan mediante una sesión autorizada.' : state.user ? 'Tu cuenta no tiene permiso de administrador.' : 'Inicia sesión con la cuenta administradora.';
  if (!state.admin) { items = []; $('#file-list').replaceChildren(); }
  else load().catch(e => report(e, 'archivos'));
}, report);
$('#manager-auth').addEventListener('click', e => busy(e.currentTarget, () => session.user ? logout() : login()).catch(e => report(e, 'sesion')));
$('#more-files').addEventListener('click', e => busy(e.currentTarget, () => load(true)).catch(e => report(e, 'archivos')));
$('#parent-folder').addEventListener('click', () => { prefix = prefix.split('/').slice(0, -1).join('/'); load().catch(e => report(e, 'archivos')); });
$('#photos-folder').addEventListener('click', () => { prefix = 'fotos'; load().catch(e => report(e, 'archivos')); });
$('#documents-folder').addEventListener('click', () => { prefix = 'archivos'; load().catch(e => report(e, 'archivos')); });
$('#upload-form').addEventListener('submit', event => {
  event.preventDefault();
  busy($('#upload-button'), async () => {
    if (!session.admin) throw new Error('Permiso requerido.');
    const file = $('#upload-file').files[0];
    if (!file) throw fieldError(new Error('Selecciona un archivo.'));
    if (!(prefix === 'fotos' || prefix.startsWith('fotos/') || prefix === 'imagenes' || prefix === 'archivos' || prefix.startsWith('archivos/'))) throw fieldError(new Error('Abre Fotos públicas, imágenes privadas o Documentos privados antes de subir un archivo.'));
    await uploadFile(file, prefix, percent => status(`Subiendo: ${percent}%`));
    $('#upload-form').reset(); await load(); status('Archivo subido.');
  }).catch(e => report(e, 'subida'));
});
$('#file-list').addEventListener('click', async event => {
  const target = event.target.closest('button'); if (!target || !session.admin) return;
  const index = target.dataset.download ?? target.dataset.copy ?? target.dataset.delete;
  if (index === undefined || pending.has(items[index]?.fullPath)) return;
  const item = items[index]; if (!item) return;
  pending.add(item.fullPath);
  try { await busy(target, async () => {
    if ('copy' in target.dataset) { await navigator.clipboard.writeText(await publicPhotoURL(item)); status('Enlace público copiado.'); }
    else if ('download' in target.dataset) await downloadFile(item, names[index]);
    else if (confirm(`¿Eliminar ${names[index]}? Si está insertado en una publicación, dejará de mostrarse.`)) { await deleteFile(item); await load(); status('Archivo eliminado.'); }
  }); } catch (e) { report(e, 'archivo'); } finally { pending.delete(item.fullPath); }
});
finishRedirect().catch(e => report(e, 'sesion'));
