import createDOMPurify from 'dompurify';
import { safeURL, youtubeID, escapeHTML, draftImagePath } from './core.js';
export const articleTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'pre', 'code', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'sup', 'sub'];
export function contentTools(win) {
  const purify = createDOMPurify(win);
  function sanitize(html) {
    const clean = purify.sanitize(String(html ?? ''), { ALLOWED_TAGS: articleTags, ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'colspan', 'rowspan'], ALLOW_DATA_ATTR: false });
    const template = win.document.createElement('template');
    template.innerHTML = clean;
    template.content.querySelectorAll('a').forEach(a => {
      const href = safeURL(a.getAttribute('href'));
      if (href) { a.href = href; a.rel = 'noopener noreferrer'; } else a.removeAttribute('href');
    });
    template.content.querySelectorAll('img').forEach(img => {
      const src = safeURL(img.getAttribute('src'), { image: true });
      if (!src) img.remove();
      else { img.src = src; img.loading = 'lazy'; img.decoding = 'async'; img.className = 'img-fluid'; }
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
  function rich(element, html) { element.innerHTML = sanitize(String(html).replace(/\n/g, '<br>')); math(element); }
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
export function mediaHTML(value, title) {
  if (draftImagePath(value)) return '<p class="private-image">Imagen privada del borrador.</p>';
  const video = youtubeID(value);
  if (video) return `<button type="button" class="btn btn-outline-primary video-load" data-video="${video}">Reproducir video de YouTube (carga contenido externo)</button>`;
  const url = safeURL(value, { image: true }) || '/assets/images/noticia.webp';
  return `<img class="img-fluid rounded post-image" src="${escapeHTML(url)}" alt="${escapeHTML(title)}" width="960" height="540" loading="lazy" decoding="async">`;
}
