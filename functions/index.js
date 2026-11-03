import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { readFile } from 'node:fs/promises';
import { createPageHandler } from './page-handler.js';
initializeApp({ databaseURL: process.env.FIREBASE_DATABASE_EMULATOR_HOST ? 'https://demo-proferonald-default-rtdb.firebaseio.com' : 'https://proferonald-fb-default-rtdb.firebaseio.com' });
const template = readFile(new URL('./lib/shell.html', import.meta.url), 'utf8');
export const postPage = onRequest({ region: 'us-east1', memory: '512MiB', maxInstances: 2, invoker: 'public' }, createPageHandler({
  template: () => template,
  getPost: async id => (await getDatabase().ref(`publicaciones/${id}`).get()).val(),
  render: async (...args) => (await import('./lib/render.mjs')).renderPublicPost(...args)
}));
