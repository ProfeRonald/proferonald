export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function safeURL(value, { image = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, 'https://proferonald.com');
    const emulator = url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.port === '9199' &&
      ((typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname) && sessionStorage.getItem('proferonald-emulators') === '1') ||
       (typeof process !== 'undefined' && process.env?.FIREBASE_STORAGE_EMULATOR_HOST === '127.0.0.1:9199'));
    if (image ? url.protocol !== 'https:' && !emulator : !['https:', 'http:', 'mailto:'].includes(url.protocol)) return '';
    if (url.username || url.password) return '';
    return url.href;
  } catch { return ''; }
}
export function youtubeID(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.port || u.username || u.password) return '';
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com'].includes(u.hostname)) {
      id = u.pathname === '/watch' ? u.searchParams.get('v') : /^\/(?:embed|shorts)\/([^/]+)$/.exec(u.pathname)?.[1];
    }
    return /^[\w-]{11}$/.test(id ?? '') ? id : '';
  } catch { return ''; }
}
export function encodePID(key) {
  const chars = 't,4,W,s,Q,w,R,g,M,k,1,P,j,Y,u,O,n,5,G,m,E,e,V,l,A,i,C,0,y,U,7,6,h,L,c,I,q,X,v,K,a,F,1,N,f,H,x,3,D,d,T,o,S,2,z,B,r,J,9,b,Z,p'.split(',');
  return key.slice(1).split('').map((c, i) => c + chars[i]).join('');
}
export function decodePID(value) {
  if (!value || value.length !== 38) return '';
  const key = '-' + [...value].filter((_, i) => i % 2 === 0).join('');
  return /^[-\w]{20}$/.test(key) && encodePID(key) === value ? key : '';
}
export const postURL = (key, title = '', origin = 'https://proferonald.com') => {
  return new URL(`/publicaciones/${encodeURIComponent(key)}/`, origin).href;
};
export function dateInfo(value) {
  const d = new Date(Number(value));
  if (!Number.isFinite(d.getTime())) return { iso: '', label: 'Fecha no disponible' };
  return { iso: d.toISOString(), label: new Intl.DateTimeFormat('es-DO', { dateStyle: 'long', timeZone: 'America/Santo_Domingo' }).format(d) };
}
export const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
export const editorialCategories = Object.freeze({
  matematicas: 'Matemáticas',
  educacion: 'Educación',
  tecnologia: 'Tecnología',
  cultura: 'Cultura',
  noticias: 'Noticias'
});
export const categoryName = key => typeof key === 'string' && Object.hasOwn(editorialCategories, key) ? editorialCategories[key] : '';
// The historical RTDB field "categorias" stores the article's keywords.
export const keywords = value => [...new Set(String(value ?? '').split(',').map(s => s.trim()).filter(Boolean))];
const legacyTopics = [
  ['tecnologia', ['tecnologia', 'latex', 'tex', 'msword']],
  ['matematicas', ['matematica', 'matematicas', 'algebra', 'geometria']],
  ['cultura', ['cultura', 'espanol', 'lengua', 'castellano']],
  ['educacion', ['educacion', 'docencia', 'estudiante', 'estudiantes']]
];
export function postCategory(post) {
  if (categoryName(post.categoria)) return post.categoria;
  const tags = new Set(keywords(post.categorias).map(normalize));
  return legacyTopics.find(([, aliases]) => aliases.some(alias => tags.has(alias)))?.[0] || 'noticias';
}
export const draftImagePath = value => /^private:(imagenes\/[a-f0-9-]{36}\.webp)$/.exec(String(value ?? ''))?.[1] || '';
export function matchesPost(post, term, { category = '', keyword = '' } = {}) {
  const topic = postCategory(post);
  return (!category || topic === category) &&
    (!keyword || keywords(post.categorias).some(tag => normalize(tag) === normalize(keyword))) &&
    normalize([post.titulo, post.contenido, post.categorias, categoryName(topic)].join(' ')).includes(normalize(term));
}
export function validateArticle(input) {
  const post = { titulo: String(input.titulo ?? '').trim(), contenido: String(input.contenido ?? '').trim(), categoria: input.categoria, categorias: keywords(input.categorias).join(','), imagen: String(input.imagen ?? '').trim(), activo: input.activo ? 1 : 0 };
  if (!post.titulo || post.titulo.length > 180) throw new Error('El título debe tener entre 1 y 180 caracteres.');
  if (!post.contenido || post.contenido.length > 100000) throw new Error('El contenido debe tener entre 1 y 100 000 caracteres.');
  if (!categoryName(post.categoria)) throw new Error('Selecciona una categoría editorial.');
  if (post.categorias.length > 500) throw new Error('Las palabras clave no pueden superar 500 caracteres.');
  if (post.imagen && !draftImagePath(post.imagen) && !youtubeID(post.imagen) && !safeURL(post.imagen, { image: true })) throw new Error('La imagen debe usar HTTPS o ser un video de YouTube válido.');
  if (post.imagen && !draftImagePath(post.imagen)) post.imagen = youtubeID(post.imagen) ? `https://www.youtube-nocookie.com/embed/${youtubeID(post.imagen)}` : safeURL(post.imagen, { image: true });
  if (post.imagen.length > 2048) throw new Error('La dirección multimedia es demasiado larga.');
  return post;
}
export function validateComment(value) {
  const text = String(value ?? '').trim();
  if (text.length < 4 || text.length > 600) throw new Error('Escribe entre 4 y 600 caracteres.');
  return text;
}
export function filePolicy(file, photos = false) {
  const types = photos ? ['image/jpeg', 'image/png', 'image/webp'] : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  const limit = (photos ? 5 : 20) * 1024 * 1024;
  if (!types.includes(file.type) || !file.size || file.size > limit) throw new Error(`Tipo de archivo no permitido o tamaño superior a ${photos ? 5 : 20} MB.`);
  return true;
}
export function publicationUpdates(key, article) {
  return { [`articulos/${key}`]: article, [`publicaciones/${key}`]: article?.activo === 1 ? article : null };
}
