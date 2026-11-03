import createDOMPurify from 'dompurify';
import { icon } from './icons.js';
import { safeURL, youtubeID, escapeHTML, draftImagePath } from './core.js';
export const articleTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'pre', 'code', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'sup', 'sub'];
export function contentTools(win) {
  const purify = createDOMPurify(win);
  function sanitize(html, { privateImages = false } = {}) {
    const input = win.document.createElement('template'); input.innerHTML = String(html ?? '');
    input.content.querySelectorAll('img').forEach(img => {
      if (draftImagePath(img.getAttribute('src'))) { img.setAttribute('data-private-image', img.getAttribute('src')); img.removeAttribute('src'); }
    });
    const clean = purify.sanitize(input.innerHTML, { ALLOWED_TAGS: articleTags, ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'width', 'colspan', 'rowspan', 'data-private-image'], ADD_URI_SAFE_ATTR: ['data-private-image'], ALLOW_DATA_ATTR: false });
    const template = win.document.createElement('template');
    template.innerHTML = clean;
    template.content.querySelectorAll('[data-private-image]:not(img)').forEach(element => element.removeAttribute('data-private-image'));
    template.content.querySelectorAll('a').forEach(a => {
      const href = safeURL(a.getAttribute('href'));
      if (href) { a.href = href; a.rel = 'noopener noreferrer'; } else a.removeAttribute('href');
    });
    template.content.querySelectorAll('img').forEach(img => {
      const privateImage = img.getAttribute('data-private-image');
      const src = safeURL(img.getAttribute('src'), { image: true });
      if (privateImages && draftImagePath(privateImage)) { img.removeAttribute('src'); }
      else { img.removeAttribute('data-private-image'); if (!src) { img.remove(); return; } img.src = src; }
      const width = Number(img.getAttribute('width'));
      if (Number.isInteger(width) && width >= 1 && width <= 1920) img.width = width; else img.removeAttribute('width');
      img.loading = 'lazy'; img.decoding = 'async'; img.className = 'responsive-image';
    });
    return template.innerHTML;
  }
  function text(html) {
    const node = win.document.createElement('div'); node.innerHTML = sanitize(html); return node.textContent || '';
  }
  function math(element) {
    const walker = win.document.createTreeWalker(element, win.NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('pre,code,math-field')) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
      const fragment = win.document.createDocumentFragment(); let index = 0;
      for (const match of node.textContent.matchAll(pattern)) {
        fragment.append(node.textContent.slice(index, match.index));
        const field = win.document.createElement('math-field');
        field.setAttribute('read-only', ''); field.setAttribute('aria-label', 'Fórmula matemática');
        field.textContent = match[1] ?? match[2];
        field.className = match[1] ? 'math-block' : 'math-inline';
        fragment.append(field); index = match.index + match[0].length;
      }
      if (index) { fragment.append(node.textContent.slice(index)); node.replaceWith(fragment); }
    }
  }
  function rich(element, html, options) { element.innerHTML = sanitize(String(html).replace(/\n/g, '<br>'), options); math(element); }
  function plain(element, value) {
    element.textContent = value;
    const pattern = /https?:\/\/[^\s<>]+/g;
    const fragment = win.document.createDocumentFragment(); let index = 0;
    for (const match of String(value).matchAll(pattern)) {
      fragment.append(value.slice(index, match.index));
      const a = win.document.createElement('a'); a.textContent = match[0]; a.href = safeURL(match[0]); a.rel = 'noopener noreferrer';
      fragment.append(a); index = match.index + match[0].length;
    }
    if (index) { fragment.append(value.slice(index)); element.replaceChildren(fragment); }
    math(element);
  }
  return { sanitize, text, rich, plain };
}
export function mediaHTML(value, title, { thumbnail = false } = {}) {
  if (draftImagePath(value)) return '<p class="private-image notice">Imagen privada del borrador.</p>';
  const video = youtubeID(value);
  const url = !video && safeURL(value,{image:true}) || '/assets/brand/cover.svg';
  const image = '<img class="responsive-image post-image" src="'+escapeHTML(url)+'" alt="'+escapeHTML(title)+'" width="960" height="600" loading="lazy" decoding="async">';
  if (thumbnail) return video ? '<span class="media-thumbnail">'+image+'<span class="video-label">'+icon('play',15)+' Video</span></span>' : image;
  if (video) return '<button type="button" class="video-load" data-video="'+video+'"><span class="play-disc">'+icon('play',28)+'</span><strong>Reproducir video de YouTube</strong><span class="small muted">Se cargará contenido externo al reproducirlo.</span></button>';
  return image;
}
