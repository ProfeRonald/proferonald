import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '../src/config.js';
import { Storage } from '@google-cloud/storage';
import { OAuth2Client } from 'google-auth-library';
import { cliCredential } from './cli-credential.mjs';
export function adminClient() {
  const projectId = process.env.GCLOUD_PROJECT || firebaseConfig.projectId;
  if (!projectId.startsWith('demo-') && projectId !== firebaseConfig.projectId) throw new Error('Este administrador solo admite el proyecto configurado o proyectos demo-.');
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST && !projectId.startsWith('demo-')) throw new Error('Los emuladores deben utilizar un proyecto demo-.');
  const useCli = process.env.PROFERONALD_CLI_AUTH === '1' && !projectId.startsWith('demo-');
  const credential = useCli ? cliCredential() : applicationDefault();
  const app = initializeApp({ projectId, ...(projectId.startsWith('demo-') ? {} : { credential }), databaseURL: projectId.startsWith('demo-') ? `https://${projectId}-default-rtdb.firebaseio.com` : firebaseConfig.databaseURL, storageBucket: projectId.startsWith('demo-') ? `${projectId}.appspot.com` : firebaseConfig.storageBucket });
  let bucket;
  if (useCli) {
    const oauth = new OAuth2Client();
    oauth.refreshHandler = async () => { const token = await credential.getAccessToken(); return { access_token: token.access_token, expiry_date: Date.now() + token.expires_in * 1000 }; };
    bucket = new Storage({ projectId, authClient: oauth }).bucket(firebaseConfig.storageBucket);
  } else bucket = getStorage(app).bucket();
  return { projectId, db: getDatabase(app), bucket, auth: getAuth(app), credential };
}
