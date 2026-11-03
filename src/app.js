import './blog.css';
import { sidebarHTML } from './layout.js';
import { session, observeSession, login, logout, finishRedirect } from './auth.js';
import * as data from './data.js';
import { escapeHTML as esc, decodePID, postURL, dateInfo, categories, matchesPost, validateComment, safeURL, youtubeID, draftImagePath } from './core.js';
import { site, mathliveFonts } from './config.js';
import { contentTools, mediaHTML } from './content.js';
import { $, status, report, busy, button, fieldError } from './ui.js';
import { listFiles, publicPhotoURL, uploadFile, draftPhotoBlob, publishDraftPhoto, deleteFile } from './files.js';
const content = contentTools(window);
const searchForm = document.createElement('template'); searchForm.innerHTML = "  <form id=\"search-form\" role=\"search\" class=\"mb-4\">\n    <label for=\"search-text\">Buscar publicaciones</label>\n    <div class=\"input-group\"><input id=\"search-text\" name=\"q\" type=\"search\" class=\"form-control\" maxlength=\"160\"><div class=\"input-group-append\"><button type=\"submit\" class=\"btn btn-primary\">Buscar</button><button type=\"button\" id=\"clear-search\" class=\"btn btn-outline-secondary\">Limpiar</button></div></div>\n  </form>";
const search = searchForm.content.firstElementChild;
document.querySelector('.site-content').prepend(search);
new MutationObserver(() => { const slot = document.querySelector('#search-slot'); if (slot && search.parentElement !== slot) { slot.append(search); search.hidden = false; } }).observe(document.querySelector('#view'), { childList:true });
let stopComments = () => {}; let routeVersion = 0; let currentPost = null;
let cursors = ['']; let pageIndex = 0; let currentPage = [];
let fullCatalog; let editing = null; let dirty = false; let replying = '';
let commentVersion = 0; let lastURL = location.href;
let previewPhotoURL = '';
let galleryToken; let galleryItems = []; let galleryVersion = 0;
const profileCache = new Map();
const pageURL = id => postURL(id, '', location.origin);
function metadata(post) {
  const title = post ? `${post.titulo} - ${site.name}` : site.name;
  const description = post ? content.text(post.contenido).slice(0, 160) : 'Artículos, recursos y reflexiones sobre educación y matemáticas de Ronald Jiménez.';
  const canonical = post ? postURL(post.id, post.titulo) : site.origin + '/';
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('link[rel="canonical"]').href = canonical;
  const image = post && !youtubeID(post.imagen) && safeURL(post.imagen, { image: true }) || site.origin + '/assets/images/logo.png';
  for (const [name, value] of Object.entries({ title, description, image, url: canonical, type: post ? 'article' : 'website' })) document.querySelector(`meta[property="og:${name}"]`).content = value;
}
async function mathIfNeeded(element) {
  const fields = [...element.querySelectorAll('math-field')];
  if (!fields.length) return;
  const pending = [];
  if (!customElements.get('math-field')) for (const field of fields) {
    const placeholder = document.createElement('span'); placeholder.textContent = field.textContent;
    field.replaceWith(placeholder); pending.push([placeholder, field]);
  }
  try {
    const { MathfieldElement } = await import('mathlive');
    MathfieldElement.fontsDirectory = mathliveFonts;
    MathfieldElement.soundsDirectory = null;
    for (const [placeholder, field] of pending) if (placeholder.isConnected) placeholder.replaceWith(field);
  } catch (e) { report(e, 'formulas'); }
}
function syncAuth() {
  $('#login').innerHTML = session.user ? 'Salir' : '<i class="fa fa-key" aria-hidden="true"></i> Entrar';
  $('#user-name').textContent = session.user?.displayName || '';
  document.querySelectorAll('[data-admin]').forEach(el => { el.hidden = !session.admin; });
  if ($('#comment-form')) $('#comment-form').hidden = !session.user;
  if ($('#comment-login')) $('#comment-login').hidden = !!session.user;
  document.querySelectorAll('[data-owner]').forEach(el => { el.hidden = !(session.admin || el.dataset.owner === session.user?.uid); });
  if (!session.admin) {
    if (!$('#editor').hidden) { $('#editor').hidden = true; $('#view').hidden = false; $('#view').innerHTML = '<h1>Acceso restringido</h1><p>La sesión administradora dejó de estar disponible.</p>'; }
    $('#gallery').hidden = true;
  }
}
let verseHTML = ''; let verseFrame;
function loadVerse() {
  const wrapper = $('#dailyVersesWrapper'); if (!wrapper) return;
  if (verseHTML) { wrapper.innerHTML = verseHTML; return; }
  if (verseFrame) return;
  verseFrame = document.createElement('iframe'); verseFrame.hidden = true;
  verseFrame.sandbox = 'allow-scripts';
  verseFrame.srcdoc = '<!doctype html><html lang="es"><meta charset="utf-8"><div id="dailyVersesWrapper"></div><script src="https://dailyverses.net/get/verse.js?language=rvr60"></script><script src="'+location.origin+'/assets/verse-frame.js"></script></html>';
  verseFrame.title = 'Carga aislada del versículo';
  document.body.append(verseFrame);
  const frame = verseFrame; setTimeout(() => { if (verseFrame === frame) { frame.remove(); verseFrame = null; } },15000);
}
window.addEventListener('message', event => {
  if (!verseFrame || event.source !== verseFrame.contentWindow || event.data?.type !== 'proferonald-verse' || typeof event.data.html !== 'string') return;
  verseHTML = content.sanitize(event.data.html.slice(0,12000));
  const wrapper = $('#dailyVersesWrapper'); if (wrapper) wrapper.innerHTML = verseHTML;
  verseFrame.remove(); verseFrame = null;
});
let carouselTimer;
function slideTo(next) {
  const slides = [...document.querySelectorAll('[data-feature]')];
  if (!slides.length) return;
  next = (next + slides.length) % slides.length;
  slides.forEach((s, i) => { s.hidden = i !== next; s.classList.toggle('active', i === next); });
  document.querySelectorAll('[data-slide]').forEach((s,i) => { s.classList.toggle('active',i===next); s.setAttribute('aria-pressed',String(i===next)); });
  const image = safeURL(currentPage[next]?.imagen, {image:true});
  $('#home-intro').style.backgroundImage = 'url(' + JSON.stringify(image || '/assets/images/noticia.webp') + ')';
}
function renderCards(items, more = false, filtered = false) {
  currentPage = items;
  const home = !filtered && pageIndex === 0 && items.length;
  const card = (post, featured) => {
    const date = dateInfo(post.fecha);
    const title = '<h2 class="card-title"><a data-route href="'+esc(pageURL(post.id))+'">'+esc(post.titulo)+'</a></h2>';
    const excerpt = '<h4 class="card-text wraper-pr"><p class="text-articulo text-justify">'+esc(content.text(post.contenido).slice(0,296))+'</p><a class="read-more btn btn-sm btn-primary" data-route href="'+esc(pageURL(post.id))+'"><i class="fa fa-link" aria-hidden="true"></i> Leer más</a></h4>';
    const media = mediaHTML(post.imagen,post.titulo);
    return featured ? '<article class="col-sm-6 pnots"><div class="card"><div class="row"><div class="col-md-5 wrapthumbnail border-right border-primary">'+media+'</div><div class="col-md-7"><div class="card-block">'+title+excerpt+'</div></div></div></div></article>' : '<article class="col-md-6 grid-item nots"><div class="card-block"><div class="card">'+title+media+excerpt+'<div class="metafooter mt-4"><time class="post-date" datetime="'+date.iso+'">'+esc(date.label)+'</time></div></div></div></article>';
  };
  const intro = home ? '<section class="intro pt-1" id="home-intro" aria-label="Publicaciones destacadas"><div id="carousel" class="carousel slide mt-0"><ol class="carousel-indicators">'+items.slice(0,3).map((_,i)=>'<li><button type="button" data-action="feature-select" data-slide="'+i+'" aria-label="Destacada '+(i+1)+'"></button></li>').join('')+'</ol><div class="carousel-inner">'+items.slice(0,3).map((p,i)=>'<div class="carousel-item '+(!i?'active':'')+'" data-feature="'+i+'" '+(i?'hidden':'')+'><div class="wrapintro rounded my-0 pb-0"><h1>'+esc(p.titulo)+'</h1><h2 class="lead text-justify wraper-pr m-0 p-0 pb-2">'+esc(content.text(p.contenido).slice(0,273))+'…<span class="d-block text-right pt-2"><a data-route href="'+esc(pageURL(p.id))+'"><i class="fa fa-link" aria-hidden="true"></i> Leer más</a></span></h2></div></div>').join('')+'</div><button class="carousel-control-prev" type="button" data-action="feature-prev" aria-label="Destacada anterior"><span class="carousel-control-prev-icon" aria-hidden="true"></span></button><button class="carousel-control-next" type="button" data-action="feature-next" aria-label="Siguiente destacada"><span class="carousel-control-next-icon" aria-hidden="true"></span></button></div></section>' : '';
  const featured = home ? '<section class="featured-posts"><div class="section-title"><h2><span>Novedades</span></h2></div><div class="row listfeaturedtag" id="novedades">'+items.slice(0,2).map(p=>card(p,true)).join('')+'</div></section>' : '';
  $('#view').innerHTML = intro+'<div class="container">'+featured+'<section class="recent-posts row"><div class="col-sm-8 muro-izq"><div class="section-title"><h2><span>'+(filtered?'Resultados':'Publicaciones')+'</span></h2></div><div class="row listrecent" id="publicaciones">'+(home?items.slice(2):items).map(p=>card(p,false)).join('')+'</div>'+(!items.length?'<p role="status">No hay publicaciones que coincidan.</p>':'')+'<nav aria-label="Paginación" class="pagination-controls"><button class="btn btn-primary" data-action="newer" '+(pageIndex===0?'disabled':'')+'>Más recientes</button><span>Página '+(pageIndex+1)+'</span><button class="btn btn-primary" data-action="older" '+(!more?'disabled':'')+'>Anteriores</button></nav></div>'+sidebarHTML()+'</section></div>';
  loadVerse();
  if (home) { slideTo(0); carouselTimer = setInterval(() => { if (!document.hidden && !$('#carousel')?.matches(':hover, :focus-within') && !matchMedia('(prefers-reduced-motion: reduce)').matches) slideTo(Number(document.querySelector('[data-feature]:not([hidden])')?.dataset.feature || 0)+1); },5000); }
}
const categoryLinks = value => '<ul class="tags">'+categories(value).map(c => `<li><a data-route href="/?categoria=${encodeURIComponent(c)}">${esc(c)}</a></li>`).join('')+'</ul>';
async function listing(version) {
  const params = new URL(location.href).searchParams;
  const term = params.get('q') || ''; const category = params.get('categoria') || (location.hash.startsWith('#cat-') ? decodeURIComponent(location.hash.slice(5)) : '');
  search.querySelector('#search-text').value = term;
  if (term || category) {
    fullCatalog ??= data.catalog().catch(e => { fullCatalog = null; throw e; });
    const all = await fullCatalog;
    if (version !== routeVersion) return;
    const matches = all.filter(post => matchesPost({ ...post, contenido: content.text(post.contenido) }, term, category));
    renderCards(matches.slice(pageIndex * site.pageSize, (pageIndex + 1) * site.pageSize), matches.length > (pageIndex + 1) * site.pageSize, true);
  } else {
    const result = await data.page(cursors[pageIndex]);
    if (version !== routeVersion) return;
    renderCards(result.items, result.more);
    if (result.more) cursors[pageIndex + 1] = result.items.at(-1).id;
  }
}
async function showPost(id, version, preview = false) {
  if (preview && !session.admin) { $('#view').innerHTML = '<h1>Acceso restringido</h1><p>Se requiere una cuenta administradora para ver borradores.</p>'; return; }
  const post = await data.article(id, preview);
  if (version !== routeVersion) return;
  if (!post) { $('#view').innerHTML = '<h1>Publicación no disponible</h1><p>El enlace no existe o la publicación dejó de estar disponible.</p><a href="/" data-route>Volver a publicaciones</a>'; return; }
  currentPost = post; replying = ''; metadata(post);
  const date = dateInfo(post.fecha);
  $('#view').innerHTML = `<div class="container"><section class="recent-posts row"><div class="col-sm-8 muro-izq"><article><div class="mainheading"><div class="after-post-tags">${categoryLinks(post.categorias)}</div><h1 class="posttitle">${esc(post.titulo)}</h1></div><p><time datetime="${date.iso}">${esc(date.label)}</time> ${post.activo !== 1 ? '<strong>Borrador privado</strong>' : ''}</p><div data-admin hidden>${button('Editar', 'edit')} ${button('Eliminar publicación', 'delete-post')}</div><div class="my-3">${mediaHTML(post.imagen, post.titulo)}</div><div class="article-post capital-pr" id="article-body"></div><div class="my-4 text-right post-sharing"><span><i class="fa fa-share-alt" aria-hidden="true"></i> Comparte:</span> <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postURL(post.id))}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook"><i class="fa fa-facebook" aria-hidden="true"></i></a> <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.titulo)}&amp;url=${encodeURIComponent(postURL(post.id))}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Twitter"><i class="fa fa-twitter" aria-hidden="true"></i></a> <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postURL(post.id))}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en LinkedIn"><i class="fa fa-linkedin" aria-hidden="true"></i></a> <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(post.titulo+' '+postURL(post.id))}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en WhatsApp"><i class="fa fa-whatsapp" aria-hidden="true"></i></a> <button type="button" class="btn btn-link" data-action="copy-post" aria-label="Copiar enlace"><i class="fa fa-link" aria-hidden="true"></i></button></div><nav id="post-navigation" class="row PageNavigation mt-4 prevnextlinks" aria-label="Otras publicaciones"></nav></article><section aria-labelledby="comments-title"><h2 id="comments-title">Comentarios</h2><p>Se muestran los 20 comentarios más recientes.</p><p id="comment-login">Inicia sesión con Google para comentar.</p><form id="comment-form" hidden><label for="comment-text">Comentario (entre 4 y 600 caracteres)</label><p id="reply-label" role="status"></p><textarea id="comment-text" class="form-control" minlength="4" maxlength="600" required rows="4"></textarea><button class="btn btn-primary mt-2" type="submit">Publicar comentario</button> <button type="button" class="btn btn-link" data-action="cancel-reply">Cancelar respuesta</button></form><div id="comments" aria-live="polite"></div></section></div>${sidebarHTML()}</section></div>`;
  content.rich($('#article-body'), post.contenido); mathIfNeeded($('#article-body'));
  if (draftImagePath(post.imagen) && session.admin) {
    const blob = await draftPhotoBlob(post.imagen);
    if (version !== routeVersion || !session.admin) return;
    previewPhotoURL = URL.createObjectURL(blob);
    const image = document.createElement('img'); image.src = previewPhotoURL; image.alt = 'Imagen privada del borrador'; image.className = 'img-fluid post-image';
    $('#view .private-image').replaceWith(image);
  }
  syncAuth();
  if (post.activo === 1) data.neighbors(id).then(([older, newer]) => { if (version !== routeVersion) return; $('#post-navigation').innerHTML = [older, newer].map((p,i) => '<div class="col-md-6 '+(i?'text-right':'rightborder')+'">'+(p?'<a class="thepostlink" data-route href="'+esc(pageURL(p.id))+'">'+(i?'':'« ')+esc(p.titulo)+(i?' »':'')+'</a>':'')+'</div>').join(''); }).catch(e => report(e,'navegacion'));
  loadVerse();
  if (post.activo === 1) stopComments = data.watchComments(id, comments => renderComments(comments, version), e => { if (version === routeVersion) report(e, 'comentarios'); });
  else $('#comments').textContent = 'Los comentarios se habilitan al publicar.';
}
async function renderComments(comments, version) {
  const commentRequest = ++commentVersion;
  const container = $('#comments'); if (!container || version !== routeVersion) return;
  const users = [...new Set(comments.flatMap(c => [c.usuario, ...Object.values(c.respuestas || {}).map(r => r.usuario)]).filter(Boolean))];
  await Promise.all(users.map(async uid => { try { profileCache.set(uid, await data.profile(uid)); } catch { profileCache.set(uid, { displayName: 'Usuario' }); } }));
  if (version !== routeVersion || commentRequest !== commentVersion || !container.isConnected) return;
  container.replaceChildren();
  if (!comments.length) container.textContent = 'Todavía no hay comentarios.';
  function commentNode(value, cid, rid = '') {
    const el = document.createElement('article'); el.className = rid ? 'comment reply' : 'comment';
    const profile = profileCache.get(value.usuario) || {};
    el.innerHTML = `<img class="rounded-circle float-left mr-3" src="${esc(safeURL(profile.photoURL, {image:true}) || '/assets/images/usuario.png')}" width="45" height="45" alt="" loading="lazy"><h3 class="h6">${esc(profile.displayName || 'Usuario')}</h3><time datetime="${dateInfo(value.fecha).iso}">${esc(dateInfo(value.fecha).label)}</time><div class="comment-text"></div>${!rid ? button('Responder', 'reply', `data-comment="${esc(cid)}"`) : ''} <button type="button" class="btn btn-link btn-sm text-danger" data-action="delete-comment" data-owner="${esc(value.usuario)}" data-comment="${esc(cid)}" data-reply="${esc(rid)}" hidden>Eliminar</button>`;
    content.plain(el.querySelector('.comment-text'), value.comentario ?? value.respuesta ?? '');
    return el;
  }
  for (const comment of comments) {
    const el = commentNode(comment, comment.id);
    Object.entries(comment.respuestas || {}).sort(([a], [b]) => a.localeCompare(b)).forEach(([rid, reply]) => el.append(commentNode(reply, comment.id, rid)));
    container.append(el);
  }
  syncAuth(); mathIfNeeded(container);
}
async function staticPage(name, version) {
  if (name === 'contacto') {
    $('#view').innerHTML = '<h1>Contacto</h1><p>Puedes contactar a Ronald Jiménez mediante sus perfiles públicos:</p><ul><li><a href="https://www.facebook.com/ProfeRonaldCom/" rel="noopener noreferrer">Facebook de ProfeRonald</a></li><li><a href="https://www.linkedin.com/in/proferonald/" rel="noopener noreferrer">LinkedIn de Ronald Jiménez</a></li></ul>'; return;
  }
  const response = await fetch(`/assets/htmls/${name === 'politica' ? 'privacidad-v2' : name}.html`);
  if (!response.ok) throw new Error('Contenido no disponible');
  const html = await response.text(); if (version !== routeVersion) return;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const body = parsed.querySelector('.modal-body') || parsed.body;
  $('#view').innerHTML = content.sanitize(body.innerHTML); mathIfNeeded($('#view'));
}
async function route({ reset = true, focus = false } = {}) {
  lastURL = location.href;
  clearInterval(carouselTimer);
  search.hidden = true; document.querySelector('.site-content').prepend(search);
  const version = ++routeVersion; stopComments(); stopComments = () => {}; currentPost = null;
  if (previewPhotoURL) { URL.revokeObjectURL(previewPhotoURL); previewPhotoURL = ''; }
  if (reset) { cursors = ['']; pageIndex = 0; }
  $('#editor').hidden = true; $('#view').hidden = false;
  $('#view').innerHTML = '<p role="status">Cargando…</p>'; metadata(null); status('');
  try {
    const params = new URL(location.href).searchParams;
    const pid = params.get('pid');
    const pathId = /^\/publicaciones\/([-\w]{20})\/$/.exec(location.pathname)?.[1];
    const id = pathId || decodePID(pid) || (/^#[-\w]{20}$/.test(location.hash) ? location.hash.slice(1) : null);
    const name = location.hash.slice(1);
    if (pid !== null && !id) $('#view').innerHTML = '<h1>Enlace no válido</h1><a data-route href="/">Volver al inicio</a>';
    else if (id) await showPost(id, version, params.get('preview') === '1');
    else if (['about', 'contacto', 'politica', 'terminos'].includes(name)) await staticPage(name, version);
    else if (name === 'borradores' && session.admin) {
      const all = await data.drafts(); if (version !== routeVersion) return;
      $('#view').innerHTML = '<h1>Borradores</h1>' + (all.length ? all.map(p => `<p><a data-route href="${esc(pageURL(p.id) + '?preview=1')}">${esc(p.titulo)}</a></p>`).join('') : '<p>No hay borradores.</p>');
    } else await listing(version);
    if (focus && version === routeVersion) $('#view').focus();
  } catch (e) {
    if (version !== routeVersion) return;
    $('#view').innerHTML = '<h1>No se pudo cargar el contenido</h1><button class="btn btn-primary" data-action="retry">Reintentar</button>';
    report(e, 'lectura');
  }
}
function navigate(url) {
  if (hasUnsaved() && !confirm('Hay cambios sin guardar. ¿Descartarlos y continuar?')) return;
  dirty = false; history.pushState(null, '', url); route({ focus: true });
}
function editor(post = null) {
  if (!session.admin) return;
  editing = post; stopComments(); $('#view').hidden = true; $('#editor').hidden = false;
  const form = $('#article-form'); form.reset();
  for (const name of ['titulo', 'contenido', 'imagen', 'categorias']) form.elements[name].value = post?.[name] || '';
  form.elements.mediaURL.value = draftImagePath(post?.imagen) ? '' : post?.imagen || '';
  $('#private-photo-note').hidden = !draftImagePath(post?.imagen);
  form.elements.activo.checked = post?.activo === 1;
  $('#editor-title').textContent = post ? 'Editar publicación' : 'Nueva publicación';
  dirty = false; form.elements.titulo.focus();
}
async function gallery(append = false) {
  const version = ++galleryVersion;
  const result = await listFiles('fotos', append ? galleryToken : undefined);
  if (version !== galleryVersion || !session.admin) return;
  galleryToken = result.nextPageToken;
  if (!append) { galleryItems = []; $('#gallery-items').replaceChildren(); }
  const urls = await Promise.all(result.items.map(item => publicPhotoURL(item)));
  if (version !== galleryVersion || !session.admin) return;
  urls.forEach((url, index) => {
    const n = galleryItems.push(url) - 1; const b = document.createElement('button');
    b.type = 'button'; b.className = 'gallery-item'; b.dataset.photo = n;
    b.innerHTML = `<img src="${esc(url)}" alt="Seleccionar ${esc(result.items[index].name)}" loading="lazy" width="140" height="100">`;
    $('#gallery-items').append(b);
  });
  $('#gallery-more').hidden = !galleryToken; $('#gallery').hidden = false;
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-route]');
  if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); $('#navbarsWow').classList.remove('show'); document.querySelector('[data-action="toggle-nav"]').setAttribute('aria-expanded','false'); $('#categorias').nextElementSibling.classList.remove('show'); $('#categorias').setAttribute('aria-expanded','false'); navigate(link.href); return; }
  const video = event.target.closest('[data-video]');
  if (video) {
    const iframe = document.createElement('iframe'); iframe.title = 'Video de YouTube'; iframe.src = `https://www.youtube-nocookie.com/embed/${video.dataset.video}?autoplay=1`; iframe.allow = 'autoplay; encrypted-media; picture-in-picture'; iframe.allowFullscreen = true; iframe.className = 'video-player'; video.replaceWith(iframe); return;
  }
  const photo = event.target.closest('[data-photo]');
  if (photo) { $('#article-form').elements.imagen.value = galleryItems[photo.dataset.photo]; $('#article-form').elements.mediaURL.value = galleryItems[photo.dataset.photo]; $('#private-photo-note').hidden = true; dirty = true; $('#gallery').hidden = true; return; }
  const target = event.target.closest('[data-action]'); if (!target) return;
  busy(target, async () => {
    const action = target.dataset.action;
    if (action === 'toggle-nav') { const open = $('#navbarsWow').classList.toggle('show'); target.setAttribute('aria-expanded', String(open)); return; }
    if (action === 'toggle-categories') { const open = target.nextElementSibling.classList.toggle('show'); target.setAttribute('aria-expanded',String(open)); return; }
    if (action === 'feature-select') { slideTo(Number(target.dataset.slide)); return; }
    if (action === 'feature-prev' || action === 'feature-next') {
      const slides = [...document.querySelectorAll('[data-feature]')];
      const index = slides.findIndex(s => !s.hidden); const next = (index + (action === 'feature-next' ? 1 : -1) + slides.length) % slides.length;
      slideTo(next);
      return;
    }
    if (action === 'retry') return route({ reset: false });
    if (action === 'new') return editor();
    if (action === 'edit') return editor(currentPost);
    if (action === 'cancel-edit') { if (!dirty || confirm('¿Descartar los cambios sin guardar?')) { dirty = false; return route({ reset: false }); } }
    if (action === 'older' || action === 'newer') { pageIndex += action === 'older' ? 1 : -1; return route({ reset: false }); }
    if (action === 'copy-post' || action === 'share-post') {
      const url = postURL(currentPost.id, currentPost.titulo);
      if (action === 'share-post' && navigator.share) await navigator.share({ title: currentPost.titulo, url });
      else { await navigator.clipboard.writeText(url); status('Enlace copiado.'); }
    }
    if (action === 'reply') { if (!session.user) { status('Inicia sesión para responder.'); return; } replying = target.dataset.comment; $('#reply-label').textContent = 'Estás respondiendo a un comentario.'; $('#comment-text').focus(); }
    if (action === 'cancel-reply') { replying = ''; if ($('#reply-label')) $('#reply-label').textContent = ''; }
    if (action === 'delete-comment' && confirm('¿Eliminar este comentario y sus respuestas?')) await data.deleteComment(currentPost.id, target.dataset.comment, target.dataset.reply);
    if (action === 'delete-post' && session.admin && confirm('¿Eliminar esta publicación y todos sus comentarios?')) { await data.deleteArticle(currentPost.id); fullCatalog = null; navigate('/'); status('Publicación eliminada.'); }
    if (action === 'gallery') await gallery();
    if (action === 'close-gallery') $('#gallery').hidden = true;
  }).catch(e => { if (e.name !== 'AbortError') report(e, 'accion'); });
});
$('#search-form').addEventListener('submit', event => { event.preventDefault(); navigate('/?q=' + encodeURIComponent($('#search-text').value.trim())); });
$('#clear-search').addEventListener('click', () => navigate('/'));
$('#login').addEventListener('click', event => {
  if (session.user && hasUnsaved() && !confirm('¿Salir y descartar el texto sin guardar?')) return;
  busy(event.currentTarget, () => session.user ? logout() : login()).catch(e => report(e, 'sesion'));
});
$('#article-form').addEventListener('input', () => { dirty = true; });
$('#article-media').addEventListener('input', event => { $('#article-form').elements.imagen.value = event.target.value; $('#private-photo-note').hidden = true; });
$('#article-form').addEventListener('submit', event => {
  event.preventDefault();
  busy($('#save-article'), async () => {
    if (!session.admin) throw new Error('Permiso requerido');
    const form = event.target; const raw = Object.fromEntries(new FormData(form));
    raw.activo = form.elements.activo.checked;
    // Keep the submitted payload visible until the single atomic update succeeds.
    let value;
    try { value = (await import('./core.js')).validateArticle(raw); } catch (e) { throw fieldError(e); }
    value.contenido = content.sanitize(value.contenido);
    if (!content.text(value.contenido).trim()) throw fieldError(new Error('El contenido no puede estar vacío.'));
    let staged;
    let id;
    try {
      if (value.activo && draftImagePath(value.imagen)) { staged = await publishDraftPhoto(value.imagen); value.imagen = staged.url; }
      id = await data.saveArticle(value, editing?.id, editing?.fecha);
    } catch (error) {
      if (staged) await deleteFile(staged.item).catch(e => report(e, 'limpieza-imagen'));
      throw error;
    }
    dirty = false; fullCatalog = null;
    navigate(pageURL(id) + (value.activo ? '' : '?preview=1')); status('Publicación guardada.');
  }).catch(e => report(e, 'guardado'));
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'comment-form') return;
  event.preventDefault();
  busy(event.target.querySelector('[type="submit"]'), async () => {
    let text; try { text = validateComment($('#comment-text').value); } catch (e) { throw fieldError(e); }
    if (!session.user || !currentPost) throw new Error('Sesión requerida');
    const input = $('#comment-text'); const original = input.value;
    await data.addComment(currentPost.id, session.user.uid, text, replying);
    if (input.value === original) input.value = '';
    replying = ''; $('#reply-label').textContent = ''; status('Comentario publicado.');
  }).catch(e => report(e, 'comentario'));
});
$('#photo-upload').addEventListener('change', event => {
  const input = event.target; const file = input.files[0]; if (!file) return;
  busy($('#save-article'), async () => {
    if (!session.admin) throw new Error('Permiso requerido');
    const item = await uploadFile(file, 'imagenes', percent => status(`Subiendo imagen: ${percent}%`));
    $('#article-form').elements.imagen.value = 'private:' + item.fullPath;
    $('#article-form').elements.mediaURL.value = ''; $('#private-photo-note').hidden = false;
    dirty = true; input.value = ''; status('Imagen guardada en privado. Se hará pública al publicar el artículo.');
  }).catch(e => report(e, 'imagen'));
});
$('#gallery-more').addEventListener('click', event => busy(event.currentTarget, () => gallery(true)).catch(e => report(e, 'galeria')));
const hasUnsaved = () => dirty || !!$('#comment-text')?.value.trim();
window.addEventListener('popstate', () => {
  if (hasUnsaved() && !confirm('¿Descartar el texto sin guardar?')) { history.pushState(null, '', lastURL); return; }
  dirty = false; route();
});
window.addEventListener('hashchange', () => { if (location.href !== lastURL && location.hash !== '#view') { dirty = false; route(); } });
window.addEventListener('beforeunload', event => { if (hasUnsaved()) { event.preventDefault(); event.returnValue = ''; } });
$('#copy').textContent = `© ${new Date().getFullYear()} SaaS Dominicana`;
let booted = false;
observeSession(() => {
  syncAuth();
  if (!booted) { booted = true; route(); }
  else if (new URLSearchParams(location.search).get('preview') === '1') route();
}, report);
finishRedirect().catch(e => report(e, 'sesion'));
