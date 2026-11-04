import { GoogleAuthProvider, browserLocalPersistence, getRedirectResult, onIdTokenChanged, setPersistence, signInWithRedirect, signOut } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, db } from './firebase.js';
export let session = { user: null, admin: false };
export function observeSession(callback, report) {
  return onIdTokenChanged(auth, async user => {
    try {
      const token = user ? await user.getIdTokenResult() : null;
      if (auth.currentUser !== user) return;
      session = { user, admin: token?.claims.admin === true };
      callback(session);
      if (user) update(ref(db, `perfilesPublicos/${user.uid}`), { displayName: (user.displayName || 'Usuario').slice(0, 120), photoURL: user.photoURL?.startsWith('https://') ? user.photoURL : '' }).catch(e => report(e, 'perfil'));
    } catch (e) {
      if (auth.currentUser !== user) return;
      // Never retain administrator UI after a failed token refresh.
      session = { user, admin: false }; callback(session); report(e, 'sesion');
    }
  }, error => { session = { user: null, admin: false }; callback(session); report(error, 'sesion'); });
}
export async function login() {
  await setPersistence(auth, browserLocalPersistence);
  await signInWithRedirect(auth, new GoogleAuthProvider());
}
export const logout = () => signOut(auth);
export const finishRedirect = () => getRedirectResult(auth);
