import { JSDOM } from 'jsdom';
import { contentTools, mediaHTML } from './content.js';
import { postURL, dateInfo, safeURL, youtubeID } from './core.js';
import { site } from './config.js';
export function renderPublicPost(template, id, post) {
  if (!post || post.activo !== 1) return null;
  const dom = new JSDOM(template); const doc = dom.window.document; const tools = contentTools(dom.window);
  const url = postURL(id, post.titulo); doc.title = `${post.titulo} - ${site.name}`;
  const description = tools.text(post.contenido).slice(0, 160);
  doc.querySelector('meta[name="description"]').content = description;
  doc.querySelector('link[rel="canonical"]').href = url;
  const image = !youtubeID(post.imagen) && safeURL(post.imagen, { image: true }) || site.origin + '/assets/images/logo.png';
  for (const [name, value] of Object.entries({ title: doc.title, description, image, url, type: 'article' })) doc.querySelector(`meta[property="og:${name}"]`).content = value;
  const main = doc.querySelector('main'); main.replaceChildren();
  const h1 = doc.createElement('h1'); h1.textContent = post.titulo;
  const date = doc.createElement('time'); date.dateTime = dateInfo(post.fecha).iso; date.textContent = dateInfo(post.fecha).label;
  const media = doc.createElement('div'); media.innerHTML = mediaHTML(post.imagen, post.titulo);
  const body = doc.createElement('div'); body.className = 'article-post'; body.innerHTML = tools.sanitize(String(post.contenido).replace(/\n/g, '<br>'));
  main.append(h1, date, media, body);
  const result = dom.serialize(); dom.window.close(); return result;
}
