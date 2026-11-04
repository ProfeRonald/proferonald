import { imageDialogHTML } from './editor-template.js';
import { filePolicy, safeURL, draftImagePath } from './core.js';
import { listFiles, publicPhotoURL, draftPhotoBlob } from './files.js';
import { imageSize, clampCrop, centeredCrop, outputSize } from './image-geometry.js';

export function createImageDialog({ canEdit, onApply }) {
  const template = document.createElement('template'); template.innerHTML = imageDialogHTML;
  const dialog = template.content.firstElementChild; document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const canvas = $('#image-canvas'), ctx = canvas.getContext('2d');
  let bitmap, source = '', crop, turns = 0, flipX = false, flipY = false, changed = false;
  let busy = false, target = 'cover', generation = 0, request = 0, pageToken, galleryLoaded = false, drag;
  let applyCallback; let controller; let displayWidth = 0;
  let outputAxis = 'width', requestedOutput;
  const dimensionsForExport = () => outputSize(crop, requestedOutput, outputAxis);
  function showOutput(editingAxis) {
    const output = dimensionsForExport();
    for (const axis of ['width', 'height']) if (axis !== editingAxis) $('#image-output-' + axis).value = output[axis];
    $('#image-output-size').textContent = `Salida: ${output.width} × ${output.height} px`;
  }
  const message = (text, error = false) => { $('#image-message').textContent = text; $('#image-message').classList.toggle('is-error', error); };
  const size = () => imageSize(bitmap.width, bitmap.height, turns);
  function dispose() { generation++; request++; controller?.abort(); bitmap?.close(); bitmap = null; drag = null; source = ''; $('#image-workspace').hidden = true; }
  dialog.addEventListener('close', () => { dispose(); message(''); });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.querySelectorAll('[data-image-close]').forEach(button => button.addEventListener('click', () => { if (!busy) dialog.close(); }));
  function drawImage(context) {
    const dimensions = size();
    context.save(); context.filter = `brightness(${$('#image-brightness').value}%) contrast(${$('#image-contrast').value}%)`;
    context.translate(dimensions.width / 2, dimensions.height / 2); context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    context.rotate(turns * Math.PI / 2); context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); context.restore();
  }
  function paint(updateFields = true) {
    if (!bitmap) return;
    const dimensions = size(); crop = clampCrop(crop, dimensions.width, dimensions.height);
    const scale = Math.min(1, 480 / dimensions.width, Math.min(300, window.innerHeight * .35) / dimensions.height);
    canvas.width = Math.max(1, Math.round(dimensions.width * scale)); canvas.height = Math.max(1, Math.round(dimensions.height * scale));
    ctx.save(); ctx.scale(canvas.width / dimensions.width, canvas.height / dimensions.height); drawImage(ctx); ctx.restore();
    const sx = canvas.width / dimensions.width, sy = canvas.height / dimensions.height;
    ctx.save(); ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height); ctx.rect(crop.x * sx, crop.y * sy, crop.width * sx, crop.height * sy); ctx.fill('evenodd');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(crop.x * sx + 1, crop.y * sy + 1, Math.max(1, crop.width * sx - 2), Math.max(1, crop.height * sy - 2)); ctx.restore();
    if (updateFields) for (const name of ['x', 'y', 'width', 'height']) $('#crop-' + name).value = crop[name];
    showOutput();
  }
  function reset() {
    turns = 0; flipX = flipY = false; $('#image-ratio').value = '0'; $('#image-brightness').value = $('#image-contrast').value = '100';
    crop = centeredCrop(bitmap.width, bitmap.height); outputAxis = 'width'; requestedOutput = Math.min(1920, bitmap.width); paint();
  }
  async function loadBlob(blob, url = '') {
    filePolicy(blob, true); const token = ++request; const open = generation;
    message('Preparando imagen…'); $('#image-apply').disabled = true;
    const next = await createImageBitmap(blob);
    if (token !== request || open !== generation || !dialog.open || !canEdit()) { next.close(); return; }
    if (!next.width || !next.height || next.width * next.height > 40_000_000) { next.close(); throw new Error('La imagen supera 40 megapíxeles.'); }
    bitmap?.close(); bitmap = next; source = url; reset();
    changed = !url || Math.max(bitmap.width, bitmap.height) > 1920;
    $('#image-workspace').hidden = false; $('#image-apply').disabled = false; message('Imagen lista. Ajusta el recorte o las dimensiones finales y pulsa Usar imagen.');
    if (!$('#image-alt').value && blob.name) $('#image-alt').value = blob.name.replace(/\.[^.]+$/, '').slice(0, 300);
  }
  async function loadURL(value) {
    const url = draftImagePath(value) ? value : safeURL(value, { image: true });
    if (!url) throw new Error('Escribe una dirección HTTPS válida para la imagen.');
    const open = generation; const token = ++request; controller?.abort(); controller = new AbortController();
    const download = controller; const timeout = setTimeout(() => download.abort(), 15000);
    message('Cargando imagen…'); $('#image-apply').disabled = true;
    let blob;
    try {
      if (draftImagePath(url)) blob = await draftPhotoBlob(url);
      else {
        const response = await fetch(url, { mode: 'cors', signal: controller.signal });
        if (!response.ok || Number(response.headers.get('content-length')) > 5 * 1024 * 1024) throw new Error('No se pudo descargar la imagen o supera 5 MB.');
        blob = await response.blob();
      }
    } catch (error) {
      if (open !== generation || token !== request) return;
      if (draftImagePath(url) || !(error instanceof TypeError || error.name === 'AbortError')) throw error;
      // The browser may display an external image without permission to read its pixels.
      bitmap?.close(); bitmap = null; source = url; changed = false; $('#image-workspace').hidden = true; $('#image-apply').disabled = false;
      message('No se pudo descargar la imagen para editarla. Comprueba el enlace y los permisos del proveedor. Puedes insertarla sin recortar, o subir el archivo desde tu equipo.', true);
      return;
    } finally { clearTimeout(timeout); }
    if (open !== generation || token !== request || !dialog.open) return;
    await loadBlob(blob, url);
  }
  const fail = error => { message(error.message || 'No se pudo preparar la imagen.', true); $('#image-apply').disabled = !bitmap && !source; };
  $('#photo-upload').addEventListener('change', event => { const file = event.target.files[0]; if (file) loadBlob(file).catch(fail); });
  $('#image-load-url').addEventListener('click', () => loadURL($('#image-url').value).catch(fail));
  async function gallery(more = false) {
    const open = generation; message('Cargando galería…');
    const result = await listFiles('fotos', more ? pageToken : undefined);
    const urls = await Promise.all(result.items.map(publicPhotoURL));
    if (open !== generation || !dialog.open || !canEdit()) return;
    pageToken = result.nextPageToken; if (!more) $('#gallery-items').replaceChildren();
    urls.forEach((url, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'gallery-item'; button.setAttribute('aria-label', 'Elegir ' + result.items[index].name);
      const image = document.createElement('img'); image.src = url; image.alt = ''; image.loading = 'lazy'; image.width = 120; image.height = 85; button.append(image);
      button.addEventListener('click', () => loadURL(url).catch(fail)); $('#gallery-items').append(button);
    });
    galleryLoaded = true; $('#gallery-more').hidden = !pageToken; message(urls.length || more ? 'Elige una imagen para insertarla o editarla.' : 'Todavía no hay imágenes en la galería.');
  }
  $('#gallery-more').addEventListener('click', async event => { event.currentTarget.disabled = true; try { await gallery(true); } catch (e) { fail(e); } finally { event.currentTarget.disabled = false; } });
  dialog.querySelectorAll('[data-image-tab]').forEach(button => button.addEventListener('click', () => {
    dialog.querySelectorAll('[data-image-tab]').forEach(tab => { const selected = tab === button; tab.setAttribute('aria-selected', String(selected)); $('#image-source-' + tab.dataset.imageTab).hidden = !selected; });
    if (button.dataset.imageTab === 'gallery' && !galleryLoaded) gallery().catch(fail);
  }));
  $('.news-image-tabs').addEventListener('keydown', event => {
    const tabs = [...dialog.querySelectorAll('[data-image-tab]')], index = tabs.indexOf(document.activeElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); tabs[next].click();
  });
  $('#image-ratio').addEventListener('change', () => { if (!bitmap) return; const dimensions = size(); crop = centeredCrop(dimensions.width, dimensions.height, Number($('#image-ratio').value)); changed = true; paint(); });
  for (const name of ['x', 'y', 'width', 'height']) $('#crop-' + name).addEventListener('change', () => { if (!bitmap) return; crop[name] = Number($('#crop-' + name).value); $('#image-ratio').value = '0'; changed = true; paint(); });
  dialog.querySelectorAll('[data-image-transform]').forEach(button => button.addEventListener('click', () => {
    if (!bitmap) return; const action = button.dataset.imageTransform;
    if (action.startsWith('rotate')) { turns = (turns + (action === 'rotate-right' ? 1 : 3)) % 4; const dimensions = size(); crop = centeredCrop(dimensions.width, dimensions.height, Number($('#image-ratio').value)); }
    if (action === 'flip-x') flipX = !flipX; if (action === 'flip-y') flipY = !flipY;
    changed = true; paint();
  }));
  for (const id of ['image-brightness', 'image-contrast']) $('#' + id).addEventListener('input', () => { changed = true; paint(); });
  for (const axis of ['width', 'height']) {
    const input = $('#image-output-' + axis);
    input.addEventListener('input', () => { outputAxis = axis; requestedOutput = input.value; showOutput(axis); });
    input.addEventListener('change', () => showOutput());
  }
  $('#image-reset').addEventListener('click', () => { if (bitmap) { reset(); changed = !source; } });
  const point = event => { const box = canvas.getBoundingClientRect(), dimensions = size(); return { x: Math.max(0, Math.min(dimensions.width - 1, (event.clientX - box.left) * dimensions.width / box.width)), y: Math.max(0, Math.min(dimensions.height - 1, (event.clientY - box.top) * dimensions.height / box.height)) }; };
  canvas.addEventListener('pointerdown', event => { if (!bitmap || busy || event.button !== 0) return; event.preventDefault(); drag = point(event); canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => {
    if (!drag || !bitmap) return; const end = point(event); const ratio = Number($('#image-ratio').value);
    let width = Math.max(1, Math.abs(end.x - drag.x)), height = Math.max(1, Math.abs(end.y - drag.y));
    if (ratio) { width = Math.min(width, height * ratio); height = width / ratio; }
    crop = { x: end.x < drag.x ? drag.x - width : drag.x, y: end.y < drag.y ? drag.y - height : drag.y, width, height }; changed = true; paint();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, () => { drag = null; });
  $('#image-apply').addEventListener('click', async () => {
    if (busy || !canEdit() || (!bitmap && !source)) return;
    busy = true; const open = generation;
    dialog.querySelectorAll('button,input,select').forEach(el => { el.disabled = true; }); message('Guardando imagen…');
    try {
      let file;
      const output = bitmap ? dimensionsForExport() : {};
      if (bitmap && (changed || !source || output.width !== bitmap.width || output.height !== bitmap.height)) {
        const exported = document.createElement('canvas'); exported.width = output.width; exported.height = output.height;
        const context = exported.getContext('2d'); context.scale(output.width / crop.width, output.height / crop.height); context.translate(-crop.x, -crop.y); drawImage(context);
        const blob = await new Promise(resolve => exported.toBlob(resolve, 'image/webp', 0.88));
        if (!blob) throw new Error('No se pudo crear la imagen editada.'); file = new File([blob], 'imagen-editada.webp', { type: 'image/webp' });
      }
      await onApply({ file, src: source, alt: $('#image-alt').value.trim(), width: file ? output.width : displayWidth || output.width, target }, applyCallback);
      if (open === generation) dialog.close();
    } catch (error) { if (open === generation) fail(error); }
    finally { busy = false; dialog.querySelectorAll('button,input,select').forEach(el => { el.disabled = false; }); $('#image-apply').disabled = !bitmap && !source; }
  });
  return {
    open({ kind = 'body', attrs = {}, apply, file } = {}) {
      if (!canEdit() || busy) return;
      dispose(); galleryLoaded = false; pageToken = undefined; $('#gallery-items').replaceChildren(); $('#gallery-more').hidden = true;
      target = kind; displayWidth = Number(attrs.width) || 0; applyCallback = apply; $('#image-alt').value = attrs.alt || ''; $('#image-alt-group').hidden = kind === 'cover'; $('#image-url').value = draftImagePath(attrs.src) ? '' : attrs.src || '';
      $('#photo-upload').value = ''; $('#image-apply').disabled = true; $('#news-image-title').textContent = kind === 'cover' ? 'Imagen de portada' : 'Imagen del contenido';
      if (!dialog.open) dialog.showModal(); $('#image-tab-file').click();
      if (file) loadBlob(file).catch(fail); else if (attrs.src) loadURL(attrs.src).catch(fail); else message('Elige una imagen del equipo, de la galería o de un enlace.');
    },
    close() { dispose(); if (dialog.open) dialog.close(); },
    get busy() { return busy; }
  };
}
