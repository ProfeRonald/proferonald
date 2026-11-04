import './blog.css';
import { articleHTML, postCard, featuredPost, authorHTML, secondaryHTML, resourcesHTML, aboutHTML } from './presentation.js';
import { icon } from './icons.js';
import { observeHeader } from './navigation.js';
import { session, observeSession, login, logout, finishRedirect } from './auth.js';
import * as data from './data.js';
import { escapeHTML as esc, decodePID, postURL, dateInfo, editorialCategories, categoryName, postCategories, matchesPost, validateComment, safeURL, youtubeID, draftImagePath } from './core.js';
import { site, mathliveFonts } from './config.js';
import { contentTools, mediaHTML } from './content.js';
import { $, status, report, busy, button, fieldError } from './ui.js';
import { draftPhotoBlob, publishDraftPhoto, deleteFile } from './files.js';
import { prepareArticleMedia } from './article-media.js';
const content = contentTools(window);
const search = $('#search-form');
observeHeader();
$('#view').addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-sponsor-image')) event.target.hidden = true;
}, true);
let stopComments = () => {}; let routeVersion = 0; let currentPost = null;
let cursors = ['']; let pageIndex = 0; let currentPage = [];
let fullCatalog; let editing = null; let dirty = false; let replying = '';
let commentVersion = 0; let lastURL = location.href;
let previewPhotoURL = '';
let newsEditor; let editorLoading; let editorVersion = 0; const inlinePreviewURLs = [];
const profileCache = new Map();
const pageURL = id => postURL(id, '', location.origin);
const stateHTML = (title, text, action = '<a data-route class="button button-outline" href="/">Volver al inicio</a>') => '<div class="static-page"><p class="eyebrow">El cuaderno de ProfeRonald</p><h1>'+esc(title)+'</h1><p>'+esc(text)+'</p>'+action+'</div>';
function metadata(post) {
  const title = post ? `${post.titulo} - ${site.name}` : site.name;
  const description = post ? content.text(post.contenido).slice(0, 160) : 'Artículos, recursos y reflexiones sobre educación y matemáticas de Ronald Jiménez.';
  const canonical = post ? postURL(post.id, post.titulo) : site.origin + '/';
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('link[rel="canonical"]').href = canonical;
  const image = post && !youtubeID(post.imagen) && safeURL(post.imagen, { image: true }) || site.origin + '/assets/brand/social.png';
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
  $('#login').textContent = session.user ? 'Salir' : 'Entrar';
  $('#user-name').textContent = session.user?.displayName || '';
  document.querySelectorAll('[data-admin]').forEach(el => { el.hidden = !session.admin; });
  if ($('#comment-form')) $('#comment-form').hidden = !session.user;
  if ($('#comment-login')) $('#comment-login').hidden = !!session.user;
  document.querySelectorAll('[data-owner]').forEach(el => { el.hidden = !(session.admin || el.dataset.owner === session.user?.uid); });
  if (!session.admin) {
    if (!$('#editor').hidden) { $('#editor').hidden = true; $('#view').hidden = false; $('#view').innerHTML = stateHTML('Acceso restringido','La sesión administradora dejó de estar disponible.'); }
    newsEditor?.close();
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
async function catalog() {
  fullCatalog ??= data.catalog().catch(error => { fullCatalog = null; throw error; });
  return fullCatalog;
}
const categoryNavigation = Object.entries(editorialCategories)
  .map(([key, name]) => `<a data-route href="/?tema=${key}">${name}</a>`).join('');
$('#category-menu').innerHTML = categoryNavigation;
$('#article-categories').innerHTML = Object.entries(editorialCategories)
  .map(([key, name]) => `<label><input type="checkbox" name="tema" value="${key}"> ${name}</label>`).join('');
function renderCards(items, more = false, filters = {}) {
  currentPage = items;
  const { term, category, keyword } = filters;
  const filtered = Boolean(term || category || keyword);
  const home = !filtered && pageIndex === 0;
  const introduction = home ? '<section class="home-intro"><div><p class="eyebrow">El cuaderno de Ronald Jiménez</p><h1>Ideas que invitan<br>a <em>pensar.</em></h1></div><div class="intro-copy"><p>Matemáticas, educación y tecnología, desde la mirada de un docente.</p><span class="intro-annotation">Para quienes enseñan y aprenden</span></div></section><nav class="category-ribbon" id="home-categories" aria-label="Temas de las publicaciones"><span>Explora por tema</span><a data-route href="/#categorias">Ver categorías</a></nav>' : '';
  const featured = home && items.length ? featuredPost(items[0],content.text(items[0].contenido)) : '';
  const recent = home && items.length ? items.slice(1) : items;
  const headingTag = home ? 'h2' : 'h1';
  const heading = filtered ? '<div class="page-intro"><p class="eyebrow">Una idea lleva a otra</p><h1>Resultados</h1></div><div class="results-summary"><span>'+esc(term ? 'Búsqueda: «'+term+'»' : category ? 'Categoría: '+(categoryName(category) || category) : 'Palabra clave: '+keyword)+'</span><button class="button button-quiet button-small" type="button" data-action="clear-filters">Limpiar</button></div>' : '<div class="section-heading"><div><p class="eyebrow">Para seguir aprendiendo</p><'+headingTag+' id="publications-title">Publicaciones</'+headingTag+'></div><a class="text-link" data-route href="/#categorias">Explorar temas '+icon('arrow',16)+'</a></div>';
  const pagination = '<nav aria-label="Paginación" class="pagination-controls"><button class="button button-outline" data-action="newer" '+(pageIndex === 0 ? 'disabled':'')+'>Más recientes</button><span>Página '+(pageIndex+1)+'</span><button class="button button-outline" data-action="older" '+(!more?'disabled':'')+'>Anteriores</button></nav>';
  $('#view').innerHTML = '<div class="site-wrap">'+introduction+featured+'<section class="'+(home?'latest-section':'listing-section')+'">'+heading+'<div class="post-grid">'+recent.map(post=>postCard(post,content.text(post.contenido))).join('')+'</div>'+(!items.length?'<p class="empty-state" role="status">No hay publicaciones que coincidan.</p>':'')+(home && items.length === 1 ? '<p class="muted">Pronto habrá más ideas para compartir.</p>':'')+pagination+'</section>'+(home?authorHTML()+secondaryHTML():'')+'</div>';
  if (home) {
    $('#home-categories').innerHTML = '<span>Explora por tema</span><a data-route href="/" aria-current="page">Todos</a>' + categoryNavigation;
    loadVerse();
  }
}
async function listing(version) {
  const params = new URL(location.href).searchParams;
  const term = params.get('q') || '';
  const category = params.get('tema') || '';
  const keyword = params.get('palabra') || params.get('categoria') || (location.hash.startsWith('#cat-') ? decodeURIComponent(location.hash.slice(5)) : '');
  search.querySelector('#search-text').value = term;
  if (term || category || keyword) {
    const all = await catalog();
    if (version !== routeVersion) return;
    const matches = all.filter(post => matchesPost({ ...post, contenido: content.text(post.contenido) }, term, { category, keyword }));
    renderCards(matches.slice(pageIndex * site.pageSize, (pageIndex + 1) * site.pageSize), matches.length > (pageIndex + 1) * site.pageSize, { term, category, keyword });
  } else {
    const result = await data.page(cursors[pageIndex]);
    if (version !== routeVersion) return;
    if (!result.more && pageIndex === 0) fullCatalog = Promise.resolve(result.items);
    renderCards(result.items, result.more);
    if (result.more) cursors[pageIndex + 1] = result.items.at(-1).id;
  }
}
async function showPost(id, version, preview = false) {
  if (preview && !session.admin) { $('#view').innerHTML = stateHTML('Acceso restringido','Se requiere una cuenta administradora para ver borradores.'); return; }
  const post = await data.article(id, preview);
  if (version !== routeVersion) return;
  if (!post) { $('#view').innerHTML = stateHTML('Publicación no disponible','El enlace no existe o la publicación dejó de estar disponible.'); return; }
  currentPost = post; replying = ''; metadata(post);
  $('#view').innerHTML = articleHTML(post, '', content.text(post.contenido));
  content.rich($('#article-body'), post.contenido, { privateImages: post.activo !== 1 && session.admin }); mathIfNeeded($('#article-body'));
  if (post.activo !== 1 && session.admin) hydratePostImages($('#article-body'), version);
  if (draftImagePath(post.imagen) && session.admin) {
    const blob = await draftPhotoBlob(post.imagen);
    if (version !== routeVersion || !session.admin) return;
    previewPhotoURL = URL.createObjectURL(blob);
    const image = document.createElement('img'); image.src = previewPhotoURL; image.alt = 'Imagen privada del borrador'; image.className = 'responsive-image post-image';
    $('#view .private-image').replaceWith(image);
  }
  syncAuth();
  if (post.activo === 1) data.neighbors(id).then(([older,newer]) => {
    if (version !== routeVersion) return;
    $('#post-navigation').innerHTML = [older,newer].map((p,i)=>'<div>'+(p?'<a data-route href="'+esc(pageURL(p.id))+'">'+(i?'':'← ')+esc(p.titulo)+(i?' →':'')+'</a>':'')+'</div>').join('');
  }).catch(error => report(error,'navegacion'));
  if (post.activo === 1) stopComments = data.watchComments(id, comments => renderComments(comments, version), e => { if (version === routeVersion) report(e, 'comentarios'); });
  else $('#comments').textContent = 'Los comentarios se habilitan al publicar.';
}
async function hydratePostImages(root, version) {
  await Promise.all([...root.querySelectorAll('img[data-private-image]')].map(async image => {
    try {
      const blob = await draftPhotoBlob(image.getAttribute('data-private-image'));
      if (version !== routeVersion || !session.admin || !image.isConnected) return;
      const url = URL.createObjectURL(blob); inlinePreviewURLs.push(url); image.src = url;
    } catch (error) { if (version === routeVersion) report(error,'imagen-privada'); }
  }));
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
    el.innerHTML = `<div class="comment-head"><img src="${esc(safeURL(profile.photoURL,{image:true}) || '/assets/images/usuario.png')}" width="40" height="40" alt="" loading="lazy"><div><h3>${esc(profile.displayName || 'Usuario')}</h3><time datetime="${dateInfo(value.fecha).iso}">${esc(dateInfo(value.fecha).label)}</time></div></div><div class="comment-text"></div><div class="action-row">${!rid ? button('Responder','reply',`data-comment="${esc(cid)}"`) : ''}<button type="button" class="button button-quiet button-small" data-action="delete-comment" data-owner="${esc(value.usuario)}" data-comment="${esc(cid)}" data-reply="${esc(rid)}" hidden>Eliminar</button></div>`;
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
  if (name === 'about') { $('#view').innerHTML = '<div class="site-wrap">'+aboutHTML()+'</div>'; return; }
  if (name === 'recursos') { $('#view').innerHTML = '<div class="site-wrap">'+resourcesHTML()+'</div>'; return; }
  if (name === 'categorias') {
    $('#view').innerHTML = '<div class="site-wrap"><section class="page-intro"><p class="eyebrow">Explora el cuaderno</p><h1>Un tema lleva a otro.</h1><p>Encuentra lecturas que despierten tu curiosidad.</p></section><nav class="category-directory" aria-label="Todas las categorías">'+categoryNavigation+'</nav></div>'; return;
  }
  if (name === 'contacto') {
    $('#view').innerHTML = '<div class="static-page"><p class="eyebrow">Sigamos conversando</p><h1>Contacto</h1><div class="article-post"><p>¿Una idea, una pregunta o una experiencia para compartir? Puedes contactar conmigo en mis perfiles públicos.</p><div class="action-row"><a class="button button-primary" href="https://www.facebook.com/ProfeRonaldCom/" target="_blank" rel="noopener noreferrer">Facebook '+icon('external',18)+'</a><a class="button button-outline" href="https://www.linkedin.com/in/proferonald/" target="_blank" rel="noopener noreferrer">LinkedIn '+icon('external',18)+'</a></div></div></div>'; return;
  }
  const response = await fetch('/assets/htmls/'+(name === 'politica'?'privacidad-v2':name)+'.html'); if (!response.ok) throw new Error('Contenido no disponible');
  const html = await response.text(); if (version !== routeVersion) return;
  const parsed = new DOMParser().parseFromString(html,'text/html'); const body = parsed.querySelector('.modal-body') || parsed.body;
  $('#view').innerHTML = '<div class="static-page article-post">'+(!body.querySelector('h1') ? '<h1>Términos de uso</h1>' : '')+content.sanitize(body.innerHTML)+'</div>'; mathIfNeeded($('#view'));
}
async function route({ reset = true, focus = false } = {}) {
  lastURL = location.href;
  newsEditor?.close(); editorVersion++;
  closeNavigation(); if ($('#search-dialog').open) $('#search-dialog').close();
  for (const url of inlinePreviewURLs.splice(0)) URL.revokeObjectURL(url);
  const version = ++routeVersion; stopComments(); stopComments = () => {}; currentPost = null;
  if (previewPhotoURL) { URL.revokeObjectURL(previewPhotoURL); previewPhotoURL = ''; }
  if (reset) { cursors = ['']; pageIndex = 0; }
  $('#editor').hidden = true; $('#view').hidden = false;
  $('#view').innerHTML = '<div class="site-wrap page-loading"><p role="status">Cargando…</p></div>'; metadata(null); status('');
  try {
    const params = new URL(location.href).searchParams;
    const pid = params.get('pid');
    const pathId = /^\/publicaciones\/([-\w]{20})\/$/.exec(location.pathname)?.[1];
    const id = pathId || decodePID(pid) || (/^#[-\w]{20}$/.test(location.hash) ? location.hash.slice(1) : null);
    const name = location.hash.slice(1);
    if (pid !== null && !id) $('#view').innerHTML = stateHTML('Enlace no válido','Comprueba el enlace o encuentra otra lectura en la portada.');
    else if (id) await showPost(id, version, params.get('preview') === '1');
    else if (['about', 'contacto', 'politica', 'terminos', 'recursos', 'categorias'].includes(name)) await staticPage(name, version);
    else if (name === 'borradores' && session.admin) {
      const all = await data.drafts(); if (version !== routeVersion) return;
      $('#view').innerHTML = '<div class="site-wrap"><section class="page-intro"><p class="eyebrow">Tu espacio de edición</p><h1>Borradores</h1></section><div class="draft-list">' + (all.length ? all.map(p => `<a data-route href="${esc(pageURL(p.id) + '?preview=1')}">${esc(p.titulo)} ${icon('arrow',18)}</a>`).join('') : '<p>No hay borradores.</p>')+'</div></div>';
    } else await listing(version);
    document.querySelectorAll('.site-nav > a').forEach(link => { if (link.href === location.href || (link.getAttribute('href') === '/' && !location.hash && !id)) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
    if (focus && version === routeVersion) { $('#view').focus({ preventScroll:true }); window.scrollTo(0,0); }
  } catch (e) {
    if (version !== routeVersion) return;
    $('#view').innerHTML = stateHTML('No se pudo cargar el contenido','Vuelve a intentarlo en un momento.','<button class="button button-primary" data-action="retry">Reintentar</button>');
    report(e, 'lectura');
  }
}
function navigate(url) {
  if (hasUnsaved() && !confirm('Hay cambios sin guardar. ¿Descartarlos y continuar?')) return;
  dirty = false; history.pushState(null, '', url); route({ focus: true });
}
async function editor(post = null) {
  if (!session.admin) return;
  const version = ++editorVersion; newsEditor?.close(); closeNavigation();
  editing = post; stopComments(); $('#view').hidden = true; $('#editor').hidden = false;
  const form = $('#article-form'); form.reset();
  for (const name of ['titulo', 'contenido', 'imagen', 'categorias']) form.elements[name].value = post?.[name] || '';
  const selected = post ? postCategories(post) : [];
  for (const checkbox of form.querySelectorAll('[name=tema]')) checkbox.checked = selected.includes(checkbox.value);
  form.elements.mediaURL.value = draftImagePath(post?.imagen) ? '' : post?.imagen || '';
  $('#private-photo-note').hidden = !draftImagePath(post?.imagen);
  form.elements.activo.checked = post?.activo === 1;
  $('#editor-title').textContent = post ? 'Editar publicación' : 'Nueva publicación';
  editorLoading ??= import('./news-editor.js').then(({ createNewsEditor }) => {
    newsEditor = createNewsEditor({ content, canEdit: () => session.admin && !$('#editor').hidden, onChange: () => { dirty = true; }, status, math: mathIfNeeded });
    return newsEditor;
  }).catch(error => { editorLoading = null; throw error; });
  const composer = await editorLoading;
  if (version !== editorVersion || !session.admin || $('#editor').hidden) return;
  composer.setHTML(form.elements.contenido.value);
  dirty = false; form.elements.titulo.focus();
}
function closeNavigation() {
  $('#nav-links').classList.remove('is-open'); document.querySelector('[data-action="toggle-nav"]').setAttribute('aria-expanded','false');
  $('#category-menu').hidden = true; $('#categorias').setAttribute('aria-expanded','false');
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-route]');
  if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); closeNavigation(); navigate(link.href); return; }
  if (!event.target.closest('.nav-dropdown')) { $('#category-menu').hidden = true; $('#categorias').setAttribute('aria-expanded','false'); }
  const video = event.target.closest('[data-video]');
  if (video) {
    const iframe = document.createElement('iframe'); iframe.title = 'Video de YouTube'; iframe.src = `https://www.youtube-nocookie.com/embed/${video.dataset.video}?autoplay=1`; iframe.allow = 'autoplay; encrypted-media; picture-in-picture'; iframe.allowFullscreen = true; iframe.className = 'video-player'; video.replaceWith(iframe); return;
  }
  const target = event.target.closest('[data-action]'); if (!target) return;
  busy(target, async () => {
    const action = target.dataset.action;
    if (action === 'toggle-nav') { const open = $('#nav-links').classList.toggle('is-open'); target.setAttribute('aria-expanded',String(open)); return; }
    if (action === 'toggle-categories') { const open = $('#category-menu').hidden; $('#category-menu').hidden = !open; target.setAttribute('aria-expanded',String(open)); return; }
    if (action === 'open-search') { $('#search-dialog').showModal(); $('#search-text').focus(); return; }
    if (action === 'close-search') { $('#search-dialog').close(); return; }
    if (action === 'clear-filters') return navigate('/');
    if (action === 'retry') return route({reset:false});
    if (action === 'new') { closeNavigation(); return editor(); }
    if (action === 'edit') return editor(currentPost);
    if (action === 'cancel-edit') { if (!dirty || confirm('¿Descartar los cambios sin guardar?')) { dirty = false; return route({ reset: false }); } }
    if (action === 'older' || action === 'newer') { pageIndex += action === 'older' ? 1 : -1; return route({ reset: false, focus:true }); }
    if (action === 'copy-post' || action === 'share-post') {
      const url = postURL(currentPost.id, currentPost.titulo);
      if (action === 'share-post' && navigator.share) await navigator.share({ title: currentPost.titulo, url });
      else { await navigator.clipboard.writeText(url); status('Enlace copiado.'); }
    }
    if (action === 'reply') { if (!session.user) { status('Inicia sesión para responder.'); return; } replying = target.dataset.comment; $('#reply-label').textContent = 'Estás respondiendo a un comentario.'; $('#comment-text').focus(); }
    if (action === 'cancel-reply') { replying = ''; if ($('#reply-label')) $('#reply-label').textContent = ''; }
    if (action === 'delete-comment' && confirm('¿Eliminar este comentario y sus respuestas?')) await data.deleteComment(currentPost.id, target.dataset.comment, target.dataset.reply);
    if (action === 'delete-post' && session.admin && confirm('¿Eliminar esta publicación y todos sus comentarios?')) { await data.deleteArticle(currentPost.id); fullCatalog = null; navigate('/'); status('Publicación eliminada.'); }
  }).catch(e => { if (e.name !== 'AbortError') report(e, 'accion'); });
});
$('#search-form').addEventListener('submit', event => { event.preventDefault(); navigate('/?q=' + encodeURIComponent($('#search-text').value.trim())); });
$('#clear-search').addEventListener('click', () => navigate('/'));
$('#login').addEventListener('click', event => {
  if (session.user && hasUnsaved() && !confirm('¿Salir y descartar el texto sin guardar?')) return;
  busy(event.currentTarget, () => session.user ? logout() : login()).catch(e => report(e, 'sesion'));
});
$('#article-form').addEventListener('input', () => { dirty = true; });
$('#article-form').addEventListener('submit', event => {
  event.preventDefault();
  busy($('#save-article'), async () => {
    if (!session.admin) throw new Error('Permiso requerido');
    if (!newsEditor || newsEditor.busy) throw fieldError(new Error('Termina de preparar la imagen antes de guardar la noticia.'));
    const form = event.target; const fields = new FormData(form);
    const raw = Object.fromEntries(fields);
    raw.categoriasEditoriales = Object.fromEntries(fields.getAll('tema').map(key => [key, true]));
    raw.contenido = newsEditor.getHTML();
    raw.activo = form.elements.activo.checked;
    // Keep the submitted payload visible until the single atomic update succeeds.
    let value;
    try { value = (await import('./core.js')).validateArticle(raw); } catch (e) { throw fieldError(e); }
    value.contenido = content.sanitize(value.contenido, { privateImages: true });
    if (!content.text(value.contenido).trim()) throw fieldError(new Error('El contenido no puede estar vacío.'));
    let prepared; let id; const version = editorVersion;
    newsEditor.setSaving(true);
    try {
      prepared = await prepareArticleMedia(value, { document, publish: publishDraftPhoto, remove: deleteFile });
      if (!session.admin) throw fieldError(new Error('La sesión administradora caducó. Inicia sesión para guardar.'));
      id = await data.saveArticle(prepared.value, editing?.id, editing?.fecha);
    } catch (error) {
      if (prepared) await prepared.rollback().catch(e => report(e, 'limpieza-imagen'));
      throw error;
    } finally { newsEditor.setSaving(false); }
    if (version !== editorVersion) { status('Publicación guardada.'); return; }
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
const hasUnsaved = () => dirty || !!$('#comment-text')?.value.trim();
window.addEventListener('popstate', () => {
  if (hasUnsaved() && !confirm('¿Descartar el texto sin guardar?')) { history.pushState(null, '', lastURL); return; }
  dirty = false; route();
});
window.addEventListener('hashchange', () => { if (location.href !== lastURL && location.hash !== '#view') { dirty = false; route(); } });
window.addEventListener('beforeunload', event => { if (hasUnsaved()) { event.preventDefault(); event.returnValue = ''; } });
$('#copy').textContent = `© ${new Date().getFullYear()} ProfeRonald · SaaS Dominicana`;
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#category-menu').hidden) { $('#category-menu').hidden = true; $('#categorias').setAttribute('aria-expanded','false'); $('#categorias').focus(); } else if (event.key === 'Escape' && $('#nav-links').classList.contains('is-open')) { closeNavigation(); document.querySelector('[data-action="toggle-nav"]').focus(); } });
let booted = false;
observeSession(() => {
  syncAuth();
  if (!booted) { booted = true; route(); }
  else if (new URLSearchParams(location.search).get('preview') === '1') route();
}, report);
finishRedirect().catch(e => report(e, 'sesion'));
