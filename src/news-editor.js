import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { textToolbarHTML } from './editor-template.js';
import { createImageDialog } from './image-dialog.js';
import { draftImagePath, safeURL, youtubeID } from './core.js';
import { draftPhotoBlob, uploadFile, deleteFile } from './files.js';

export function createNewsEditor({ content, canEdit, onChange, status, math }) {
  const form = document.querySelector('#article-form'), source = form.elements.contenido;
  const template = document.createElement('template'); template.innerHTML = textToolbarHTML;
  for (const dialog of template.content.querySelectorAll('dialog')) document.body.append(dialog);
  source.before(template.content);
  const $ = selector => document.querySelector(selector);
  const toolbar = $('.news-text-toolbar');
  let htmlMode = false, active = false, saving = false, generation = 0, rich;
  const disabledControls = new Map();
  const urls = new Set(), privatePreviews = new Map();
  function allowed() { return active && !saving && canEdit(); }
  function clearPreviews() { generation++; for (const url of urls) URL.revokeObjectURL(url); urls.clear(); privatePreviews.clear(); }
  async function previewURL(src) {
    if (!draftImagePath(src)) return safeURL(src, { image: true });
    if (!allowed()) throw new Error('Sesión administradora requerida.');
    if (!privatePreviews.has(src)) {
      const version = generation;
      privatePreviews.set(src, draftPhotoBlob(src).then(blob => {
        if (!allowed() || version !== generation) throw new Error('La vista de edición cambió.');
        const url = URL.createObjectURL(blob); urls.add(url); return url;
      }).catch(error => { privatePreviews.delete(src); throw error; }));
    }
    return privatePreviews.get(src);
  }
  async function hydrate(root) {
    const version = generation;
    await Promise.all([...root.querySelectorAll('img[data-private-image]')].map(async image => {
      try { const url = await previewURL(image.getAttribute('data-private-image')); if (version === generation && allowed() && image.isConnected) image.src = url; }
      catch { image.alt = 'Imagen privada no disponible; vuelve a iniciar sesión o intenta cargarla de nuevo.'; }
    }));
  }
  const EditableImage = Image.extend({
    addAttributes() {
      return { ...this.parent?.(), src: { default: null, parseHTML: element => element.getAttribute('data-private-image') || element.getAttribute('src') }, width: { default: null, parseHTML: element => element.getAttribute('width') } };
    },
    parseHTML() { return [{ tag: 'img[data-private-image]' }, ...this.parent()]; },
    renderHTML({ HTMLAttributes }) {
      const attrs = { ...HTMLAttributes };
      if (draftImagePath(attrs.src)) { attrs['data-private-image'] = attrs.src; delete attrs.src; }
      return ['img', attrs];
    },
    addNodeView() {
      return ({ node, getPos, editor }) => {
        const image = document.createElement('img'); image.className = 'news-editable-image'; let version = 0;
        function update(current) {
          const token = ++version; image.alt = current.attrs.alt || ''; image.removeAttribute('src');
          if (current.attrs.width) image.width = Number(current.attrs.width); else image.removeAttribute('width');
          previewURL(current.attrs.src).then(url => { if (token === version && allowed() && image.isConnected) image.src = url; }).catch(() => { if (token === version) image.alt = 'Imagen privada no disponible.'; });
        }
        update(node);
        return { dom: image, update(next) {
          if (next.type !== node.type) return false;
          const changed = ['src', 'alt', 'title', 'width'].some(key => next.attrs[key] !== node.attrs[key]);
          node = next; if (changed) update(next); return true;
        }, selectNode() { image.classList.add('ProseMirror-selectednode'); }, deselectNode() { image.classList.remove('ProseMirror-selectednode'); }, destroy() { version++; } };
      };
    }
  });
  function refresh(editor) {
    const value = editor.getText(); $('#news-word-count').textContent = `${value.trim().split(/\s+/).filter(Boolean).length} palabras · ${value.length} caracteres`;
    for (const button of toolbar.querySelectorAll('[data-format]')) {
      const action = button.dataset.format;
      if (button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', String(editor.isActive(action)));
      button.disabled = htmlMode || (['edit-image', 'delete-image'].includes(action) && !editor.isActive('image')) || (action === 'undo' && !editor.can().undo()) || (action === 'redo' && !editor.can().redo());
    }
  }
  function sync(editor) { source.value = editor.getHTML(); source.dispatchEvent(new Event('input', { bubbles: true })); refresh(editor); }
  rich = new Editor({
    element: $('#article-visual'),
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, isAllowedUri: value => !!safeURL(value) } }), EditableImage, TableKit.configure({ table: { resizable: false } }), Subscript, Superscript],
    editorProps: {
      attributes: { role: 'textbox', 'aria-label': 'Contenido de la noticia', 'aria-multiline': 'true', 'aria-describedby': 'news-editor-help', class: 'news-rich-text' },
      transformPastedHTML: html => content.sanitize(html, { privateImages: true }),
      handleDoubleClickOn: (_view, _pos, node, nodePos, event) => {
        if (!allowed() || node.type.name !== 'image') return false;
        event.preventDefault(); rich.commands.setNodeSelection(nodePos); openBodyImage(true); return true;
      },
      handlePaste: (_view, event) => { const file = [...(event.clipboardData?.files || [])].find(file => file.type.startsWith('image/')); if (!file) return false; openBodyImage(false, file); return true; },
      handleDrop: (view, event) => { const file = [...(event.dataTransfer?.files || [])].find(file => file.type.startsWith('image/')); if (!file) return false; const pos = view.posAtCoords({ left: event.clientX, top: event.clientY }); if (pos) rich.commands.setTextSelection(pos.pos); openBodyImage(false, file); return true; }
    },
    onUpdate: ({ editor }) => sync(editor), onSelectionUpdate: ({ editor }) => refresh(editor)
  });
  function visual() {
    if (htmlMode) { rich.commands.setContent(content.sanitize(source.value.replace(/\n/g, '<br>'), { privateImages: true }), { emitUpdate: false }); source.value = rich.getHTML(); }
    htmlMode = false; source.hidden = true; source.labels.forEach(label => { label.hidden = true; }); $('#article-visual').hidden = false;
    $('#news-visual-mode').setAttribute('aria-pressed', 'true'); $('#news-html-mode').setAttribute('aria-pressed', 'false'); refresh(rich);
  }
  $('#news-visual-mode').addEventListener('click', () => { visual(); rich.commands.focus(); });
  $('#news-html-mode').addEventListener('click', () => {
    if (!htmlMode) source.value = rich.getHTML(); htmlMode = true; source.hidden = false; source.labels.forEach(label => { label.hidden = false; }); $('#article-visual').hidden = true;
    $('#news-visual-mode').setAttribute('aria-pressed', 'false'); $('#news-html-mode').setAttribute('aria-pressed', 'true'); refresh(rich); source.focus();
  });
  const modal = createImageDialog({ canEdit: allowed, onApply: async (image, apply) => {
    const version = generation; let src = image.src; let item;
    if (image.file) {
      item = await uploadFile(image.file, 'imagenes', percent => { $('#image-message').textContent = `Guardando imagen privada: ${percent}%`; }); src = 'private:' + item.fullPath;
      if (!allowed() || version !== generation) { await deleteFile(item).catch(() => {}); throw new Error('La sesión cambió. Vuelve a iniciar sesión antes de guardar la imagen.'); }
      const url = URL.createObjectURL(image.file); urls.add(url); privatePreviews.set(src, Promise.resolve(url));
    }
    if (!allowed() || version !== generation) throw new Error('La vista de edición cambió.');
    if (!draftImagePath(src) && !safeURL(src, { image: true })) throw new Error('La dirección de la imagen no es válida.');
    await apply({ src, alt: image.alt, width: image.width || null }); onChange();
    status(draftImagePath(src) ? 'Imagen guardada en privado. Se hará pública al publicar el artículo.' : 'Imagen insertada. Guarda la noticia para conservar el cambio.');
  } });
  function openBodyImage(edit = false, file) {
    if (!allowed()) return; visual(); const selection = rich.state.selection; const selected = selection.node?.type.name === 'image' ? selection.node : null;
    const attrs = edit && selected ? { ...selected.attrs } : {};
    modal.open({ kind: 'body', attrs, file, apply: image => {
      if (edit && selected) rich.chain().setNodeSelection(selection.from).updateAttributes('image', image).focus().run();
      else rich.chain().setTextSelection(Math.min(selection.from, rich.state.doc.content.size)).focus().setImage(image).run();
    } });
  }
  async function coverPreview() {
    const value = form.elements.imagen.value, version = generation; const root = $('#news-cover-preview'); root.replaceChildren();
    $('#news-cover-edit').disabled = !value || !!youtubeID(value); $('#news-cover-remove').disabled = !value;
    $('#private-photo-note').hidden = !draftImagePath(value);
    if (!value) { const p = document.createElement('p'); p.textContent = 'Sin imagen de portada'; root.append(p); return; }
    if (youtubeID(value)) { const p = document.createElement('p'); p.textContent = 'Video de YouTube seleccionado como portada'; root.append(p); return; }
    try {
      const url = await previewURL(value); if (version !== generation || form.elements.imagen.value !== value || !allowed()) return;
      const image = document.createElement('img'); image.src = url; image.alt = 'Vista previa de la portada'; root.append(image);
    } catch { if (version === generation) root.textContent = 'No se pudo cargar la portada. Puedes elegir otra imagen.'; }
  }
  function setCover(src) { form.elements.imagen.value = src; form.elements.mediaURL.value = draftImagePath(src) ? '' : src; onChange(); coverPreview(); }
  $('#news-cover-open').addEventListener('click', () => modal.open({ kind: 'cover', apply: image => setCover(image.src) }));
  $('#news-cover-edit').addEventListener('click', () => modal.open({ kind: 'cover', attrs: { src: form.elements.imagen.value }, apply: image => setCover(image.src) }));
  $('#news-cover-remove').addEventListener('click', () => setCover(''));
  $('#article-media').addEventListener('input', () => { form.elements.imagen.value = form.elements.mediaURL.value; coverPreview(); });
  toolbar.addEventListener('mousedown', event => { if (event.target.closest('button')) event.preventDefault(); });
  toolbar.addEventListener('click', event => {
    const button = event.target.closest('[data-format]'); if (!button || button.disabled || !allowed()) return;
    const action = button.dataset.format, chain = rich.chain().focus();
    const commands = { bold: 'toggleBold', italic: 'toggleItalic', underline: 'toggleUnderline', strike: 'toggleStrike', subscript: 'toggleSubscript', superscript: 'toggleSuperscript', bulletList: 'toggleBulletList', orderedList: 'toggleOrderedList', blockquote: 'toggleBlockquote', undo: 'undo', redo: 'redo' };
    if (commands[action]) chain[commands[action]]().run();
    if (action === 'paragraph') chain.setParagraph().run(); if (action === 'h2' || action === 'h3') chain.toggleHeading({ level: Number(action[1]) }).run();
    if (action === 'clear') chain.unsetAllMarks().clearNodes().run(); if (action === 'table') chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    if (action === 'image' || action === 'edit-image') openBodyImage(action === 'edit-image'); if (action === 'delete-image') chain.deleteSelection().run();
    if (action === 'link') { $('#news-link-error').textContent = ''; $('#news-link-url').value = rich.getAttributes('link').href || ''; $('#news-link-dialog').showModal(); }
    if (action === 'formula') { $('#news-formula-text').value = ''; $('#news-formula-dialog').showModal(); }
    refresh(rich);
  });
  for (const dialog of [$('#news-link-dialog'), $('#news-formula-dialog'), $('#news-preview-dialog')]) dialog.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  $('#news-link-form').addEventListener('submit', event => { event.preventDefault(); const href = safeURL($('#news-link-url').value); if (!href) { $('#news-link-error').textContent = 'Escribe un enlace válido (HTTPS, correo o teléfono).'; return; } rich.chain().focus().extendMarkRange('link').setLink({ href }).run(); $('#news-link-dialog').close(); });
  $('#news-unlink').addEventListener('click', () => { rich.chain().focus().extendMarkRange('link').unsetLink().run(); $('#news-link-dialog').close(); });
  $('#news-formula-form').addEventListener('submit', event => { event.preventDefault(); const formula = $('#news-formula-text').value.trim().replace(/\$/g, ''); if (!formula) return; const delimiter = $('#news-formula-block').checked ? '$$' : '$'; rich.chain().focus().insertContent({ type: 'text', text: `${delimiter}${formula}${delimiter}` }).run(); $('#news-formula-dialog').close(); });
  $('#news-preview').addEventListener('click', async () => {
    if (!allowed()) return; $('#news-preview-heading').textContent = form.elements.titulo.value || 'Sin título';
    const root = $('#news-preview-body'); content.rich(root, htmlMode ? source.value : rich.getHTML(), { privateImages: true });
    const cover = $('#news-preview-cover'); cover.replaceChildren(); const src = form.elements.imagen.value;
    if (src && !youtubeID(src)) { const image = document.createElement('img'); image.alt = form.elements.titulo.value; image.className = 'responsive-image'; if (draftImagePath(src)) image.setAttribute('data-private-image', src); else { const url = safeURL(src, { image: true }); if (url) image.src = url; } cover.append(image); }
    $('#news-preview-dialog').showModal(); await Promise.all([hydrate(root), hydrate(cover), math(root)]);
  });
  visual();
  return {
    setHTML(html) { active = true; clearPreviews(); source.value = html || ''; htmlMode = true; visual(); coverPreview(); },
    getHTML() { return htmlMode ? source.value : rich.getHTML(); },
    get busy() { return modal.busy; },
    setSaving(value) {
      saving = value; rich.setEditable(!value, false); form.setAttribute('aria-busy', String(value));
      if (value) for (const control of form.querySelectorAll('input,textarea,button,select')) { disabledControls.set(control, control.disabled); control.disabled = true; }
      else { for (const [control, disabled] of disabledControls) control.disabled = disabled; disabledControls.clear(); }
    },
    close() { active = false; modal.close(); for (const id of ['news-link-dialog', 'news-formula-dialog', 'news-preview-dialog']) if ($('#' + id).open) $('#' + id).close(); clearPreviews(); rich.commands.clearContent(false); }
  };
}
