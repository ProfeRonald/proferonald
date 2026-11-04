import { escapeHTML, safeURL } from './core.js';
export const $ = selector => document.querySelector(selector);
export function renderAccount(identity, user) {
  const photo = identity.querySelector('img');
  const name = identity.querySelector('.account-name');
  const fallback = '/assets/images/usuario.png';
  identity.hidden = !user;
  name.textContent = user ? user.displayName || 'Usuario' : '';
  photo.onerror = null;
  if (!user) { photo.removeAttribute('src'); return; }
  const src = safeURL(user.photoURL, { image: true }) || fallback;
  if (src !== fallback) photo.onerror = () => { photo.onerror = null; photo.src = fallback; };
  if (photo.getAttribute('src') !== src) photo.src = src;
}
export function status(message, error = false) {
  const el = $('#app-status'); if (!el) return;
  el.textContent = message; el.className = `notice ${error ? 'notice-error' : ''}`; el.hidden = !message;
}
export function report(error, operation = 'operacion') {
  // Only the category/code is logged, never tokens, URLs, user input or personal data.
  const code = /^[a-z-]+\/[a-z-]+$/.test(error?.code || '') ? error.code : 'app/error';
  console.error('[ProfeRonald]', operation, code);
  status(error?.userMessage || 'No se pudo completar la operación. Conservamos tus datos; vuelve a intentarlo.', true);
}
export async function busy(button, operation) {
  if (button?.disabled) return;
  if (button) button.disabled = true;
  try { return await operation(); }
  finally { if (button) button.disabled = false; }
}
export function fieldError(error) { error.userMessage = error.message; return error; }
export const button = (label, action, extra = '') => `<button type="button" class="button button-small button-outline" data-action="${action}" ${extra}>${escapeHTML(label)}</button>`;
window.addEventListener('error', () => report(null, 'javascript'));
window.addEventListener('unhandledrejection', event => { event.preventDefault(); report(event.reason, 'promesa'); });
window.addEventListener('offline', () => status('Sin conexión. El texto se conserva; las operaciones pendientes pueden completarse al reconectar.'));
window.addEventListener('online', () => status('Conexión restablecida. Puedes volver a intentar la operación.'));
