import { escapeHTML as esc, keywords, categoryName, postCategories, postURL, dateInfo } from './core.js';
import { mediaHTML } from './content.js';
import { icon } from './icons.js';

const pathURL = id => new URL(postURL(id)).pathname;
function categoryLinks(post) {
  return `<ul class="category-tags" aria-label="Categor&#237;as editoriales">${postCategories(post).map(key => `<li><a data-route href="/?tema=${key}">${categoryName(key)}</a></li>`).join('')}</ul>`;
}
function keywordLinks(value) {
  const tags = keywords(value);
  return tags.length ? `<nav class="article-keywords" aria-label="Palabras clave"><p>Palabras clave</p><ul>${tags.map(tag => `<li><a data-route href="/?palabra=${encodeURIComponent(tag)}">${esc(tag)}</a></li>`).join('')}</ul></nav>` : '';
}
export function postMeta(post, text = '') {
  const date = dateInfo(post.fecha), minutes = Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200));
  return `<span class="post-meta"><time datetime="${date.iso}">${esc(date.label)}</time><span aria-hidden="true">·</span><span>${minutes} min de lectura</span></span>`;
}
export function postCard(post, text) {
  return `<article class="post-card" data-post="${esc(post.id)}"><a class="post-card-image" data-route href="${esc(pathURL(post.id))}" tabindex="-1" aria-hidden="true">${mediaHTML(post.imagen, '', { thumbnail: true })}</a><div class="post-card-copy">${categoryLinks(post)}<h2><a data-route href="${esc(pathURL(post.id))}">${esc(post.titulo)}</a></h2><p>${esc(text.slice(0, 190))}${text.length > 190 ? '…' : ''}</p>${postMeta(post, text)}<a class="text-link" data-route href="${esc(pathURL(post.id))}">Leer artículo ${icon('arrow',18)}</a></div></article>`;
}
export function featuredPost(post, text) {
  return `<article class="featured-story" data-post="${esc(post.id)}"><div class="featured-copy"><p class="eyebrow"><span class="accent-dot"></span> En portada</p>${categoryLinks(post)}<h2><a data-route href="${esc(pathURL(post.id))}">${esc(post.titulo)}</a></h2><p class="featured-excerpt">${esc(text.slice(0, 270))}${text.length > 270 ? '…' : ''}</p>${postMeta(post,text)}<a class="button button-primary" data-route href="${esc(pathURL(post.id))}">Leer artículo ${icon('arrow',18)}</a></div><a class="featured-media" data-route href="${esc(pathURL(post.id))}" tabindex="-1" aria-hidden="true">${mediaHTML(post.imagen,'',{thumbnail:true})}</a></article>`;
}
export function sharingHTML(post) {
  const url = encodeURIComponent(postURL(post.id)), title = encodeURIComponent(post.titulo);
  return `<div class="post-sharing"><span>Comparte esta idea</span><div class="sharing-links"><a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">${icon('facebook')}</a><a href="https://twitter.com/intent/tweet?text=${title}&amp;url=${url}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Twitter">${icon('twitter')}</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en LinkedIn">${icon('linkedin')}</a><a href="https://api.whatsapp.com/send?text=${title}%20${url}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en WhatsApp">${icon('whatsapp')}</a><button type="button" class="icon-button" data-action="copy-post" aria-label="Copiar enlace">${icon('link')}</button></div></div>`;
}
export function commentsHTML() {
  return `<section class="discussion" aria-labelledby="comments-title"><div class="section-heading"><div><p class="eyebrow">Sigamos conversando</p><h2 id="comments-title">Comentarios</h2></div>${icon('book',28)}</div><p class="muted small">Se muestran los 20 comentarios más recientes.</p><p id="comment-login" class="notice">Inicia sesión con Google para comentar.</p><form id="comment-form" class="comment-compose" hidden><label for="comment-text">Comentario (entre 4 y 600 caracteres)</label><p id="reply-label" role="status"></p><textarea id="comment-text" class="field" minlength="4" maxlength="600" required rows="4" placeholder="Comparte una idea, una pregunta o una experiencia…"></textarea><div class="action-row"><button class="button button-primary" type="submit">Publicar comentario</button><button type="button" class="button button-quiet" data-action="cancel-reply">Cancelar respuesta</button></div></form><div id="comments" aria-live="polite"></div></section>`;
}
// One presentation for both server HTML and client navigation. bodyHTML is sanitized by the caller.
export function articleHTML(post, bodyHTML = '', plainText = '') {
  return `<div class="reading-layout"><a class="back-link" data-route href="/">${icon('arrow',17)} Todas las publicaciones</a><article class="reading-article" data-post="${esc(post.id)}"><header class="article-heading">${categoryLinks(post)}<h1>${esc(post.titulo)}</h1><div class="article-byline"><img src="/assets/images/proferonald_foto.webp" width="42" height="42" alt="" loading="lazy"><div><span>ProfeRonald</span>${postMeta(post,plainText)}</div></div>${post.activo !== 1 ? '<p class="draft-badge">Borrador privado</p>' : ''}<div class="admin-post-tools" data-admin hidden><button type="button" class="button button-outline" data-action="edit">Editar</button><button type="button" class="button button-danger" data-action="delete-post">Eliminar publicación</button></div></header><figure class="article-cover" id="post-media">${mediaHTML(post.imagen,post.titulo)}</figure><div class="article-post" id="article-body">${bodyHTML}</div>${keywordLinks(post.categorias)}${sharingHTML(post)}<nav id="post-navigation" class="post-neighbors" aria-label="Otras publicaciones"></nav></article>${commentsHTML()}</div>`;
}
export function authorHTML() {
  return `<section class="author-note" aria-labelledby="author-title"><div class="author-portrait"><img src="/assets/images/proferonald_foto.webp" alt="Ronald Jiménez" width="360" height="420" loading="lazy"></div><div class="author-note-copy"><p class="eyebrow">Detrás de este cuaderno</p><h2 id="author-title">Hola, soy Ronald.</h2><p>Educador dominicano, apasionado por las matemáticas y las posibilidades de la tecnología en el aprendizaje.</p><p>Este es un espacio para compartir ideas, experiencias y recursos que nos ayuden a enseñar y aprender mejor.</p><a class="text-link" data-route href="/#about">Conoce mi historia ${icon('arrow',18)}</a></div><span class="author-signature" aria-hidden="true">R.</span></section>`;
}
export function reflectionHTML() {
  return `<aside class="verse-card" aria-labelledby="reflection-title"><p class="eyebrow">Una pausa para reflexionar</p><h2 id="reflection-title">Versículo del día</h2><div id="dailyVersesWrapper"><a href="https://dailyverses.net/es" target="_blank" rel="noopener noreferrer">Leer el versículo del día ${icon('external',16)}</a></div></aside>`;
}
export const resources = [
  ['escuelaRD','https://escuelard.com','Un proyecto que forma parte de este espacio educativo.'],
  ['MathChats','https://math--chat.web.app','Otro punto de encuentro para las matemáticas.'],
  ['Politécnico Maestra Elsa Brito','https://instagram.com/politecnicoelsabrito','Conecta con la comunidad educativa.'],
  ['Farmacia Darselys','https://farmaciadarselys.com','Un enlace de nuestra comunidad.']
];
export function resourcesHTML() {
  return `<section class="page-intro"><p class="eyebrow">Para explorar</p><h1>Recursos y conexiones.</h1><p>Proyectos, herramientas y comunidades que también tienen un lugar en este cuaderno.</p></section><div class="resource-grid">${resources.map(([name,url,description],i)=>`<a class="resource-card" href="${url}" target="_blank" rel="noopener noreferrer"><span class="resource-number">0${i+1}</span><h2>${name}</h2><p>${description}</p><span class="text-link">Explorar ${icon('external',18)}</span></a>`).join('')}</div>`;
}
export function aboutHTML() {
  return `<section class="about-layout"><div class="about-photo"><img src="/assets/images/proferonald_foto.webp" alt="Ronald Jiménez" width="600" height="720"><span>Docente. Matemáticas. Tecnología.</span></div><div class="about-copy"><p class="eyebrow">Sobre mí</p><h1>Enseñar es otra forma de aprender.</h1><p class="about-lead">Soy Ronald Jiménez, educador dominicano y especialista en didáctica de las matemáticas.</p><p>Mi trabajo se centra en la enseñanza de las matemáticas en los niveles básico, medio y universitario. He compartido aulas con grupos de educación general, técnicos, adultos y estudiantes universitarios.</p><p>En la Universidad Autónoma de Santo Domingo obtuve mi licenciatura en Educación, mención Matemática, en 2012, y concluí la maestría en esta misma área en 2016.</p><p>También soy entusiasta de la informática y el desarrollo de aplicaciones web. Me interesa cómo las herramientas digitales pueden ayudarnos a resolver, presentar y comprender ideas matemáticas.</p><a class="button button-primary" data-route href="/#contacto">Sigamos en contacto ${icon('arrow',18)}</a></div></section>`;
}
