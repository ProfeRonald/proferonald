import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '../src/config.js';
export function adminClient() {
  const projectId = process.env.GCLOUD_PROJECT || firebaseConfig.projectId;
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST && !projectId.startsWith('demo-')) throw new Error('Los emuladores deben utilizar un proyecto demo-.');
  const app = initializeApp({ projectId, ...(projectId.startsWith('demo-') ? {} : { credential: applicationDefault() }), databaseURL: projectId.startsWith('demo-') ? `https://${projectId}-default-rtdb.firebaseio.com` : firebaseConfig.databaseURL, storageBucket: projectId.startsWith('demo-') ? `${projectId}.appspot.com` : firebaseConfig.storageBucket });
  return { projectId, db: getDatabase(app), bucket: getStorage(app).bucket(), auth: getAuth(app) };
}
