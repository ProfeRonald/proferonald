import { JSDOM } from 'jsdom';
import { contentTools, mediaHTML } from './content.js';
import { postURL, dateInfo, safeURL, youtubeID } from './core.js';
import { articleHTML } from './presentation.js';
import { site } from './config.js';
export function renderPublicPost(template, id, post) {
  if (!post || post.activo !== 1) return null;
  const dom = new JSDOM(template); const doc = dom.window.document; const tools = contentTools(dom.window);
  const url = postURL(id, post.titulo); doc.title = `${post.titulo} - ${site.name}`;
  const description = tools.text(post.contenido).slice(0, 160);
  doc.querySelector('meta[name="description"]').content = description;
  doc.querySelector('link[rel="canonical"]').href = url;
  const image = !youtubeID(post.imagen) && safeURL(post.imagen, { image: true }) || site.origin + '/assets/brand/social.png';
  for (const [name, value] of Object.entries({ title: doc.title, description, image, url, type: 'article' })) doc.querySelector(`meta[property="og:${name}"]`).content = value;
  doc.querySelector('main').innerHTML = articleHTML({ ...post, id }, tools.sanitize(String(post.contenido).replace(/\n/g,'<br>')), tools.text(post.contenido));
  const result = dom.serialize(); dom.window.close(); return result;
}
