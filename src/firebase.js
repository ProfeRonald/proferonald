import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './config.js';
const loopback = ['localhost', '127.0.0.1'].includes(location.hostname);
if (loopback && new URLSearchParams(location.search).get('emulators') === '1') sessionStorage.setItem('proferonald-emulators', '1');
const localEmulators = loopback && sessionStorage.getItem('proferonald-emulators') === '1';
export const app = initializeApp(localEmulators ? { ...firebaseConfig, projectId: 'demo-proferonald', databaseURL: 'https://demo-proferonald-default-rtdb.firebaseio.com', storageBucket: 'demo-proferonald.appspot.com', authDomain: 'localhost' } : firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
if (localEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
