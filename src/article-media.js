import { draftImagePath } from './core.js';

// Work on a copy. The form keeps its private originals if any later write fails.
export async function prepareArticleMedia(value, { document, publish, remove }) {
  const template = document.createElement('template'); template.innerHTML = value.contenido;
  const images = [...template.content.querySelectorAll('img[data-private-image]')];
  const sources = new Set([value.imagen, ...images.map(img => img.getAttribute('data-private-image'))].filter(draftImagePath));
  const staged = []; const urls = new Map();
  const rollback = async () => { await Promise.all(staged.map(entry => remove(entry.item))); };
  try {
    if (value.activo === 1) for (const source of sources) {
      const entry = await publish(source); staged.push(entry); urls.set(source, entry.url);
    }
    if (value.activo === 1) for (const image of images) {
      const url = urls.get(image.getAttribute('data-private-image'));
      if (!url) throw new Error('No se pudo publicar una imagen del contenido.');
      image.src = url; image.removeAttribute('data-private-image');
    }
    return { value: { ...value, imagen: urls.get(value.imagen) || value.imagen, contenido: template.innerHTML }, rollback };
  } catch (error) { await rollback().catch(() => {}); throw error; }
}
