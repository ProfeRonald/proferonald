import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Reuse the already-authorized Firebase CLI session in memory. No token is copied or logged.
export function cliCredential() {
  const { getAccessToken } = require('firebase-tools/lib/auth.js');
  return { async getAccessToken() {
    const config = JSON.parse(readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
    if (!config.tokens?.refresh_token) throw new Error('La sesión local de Firebase no está disponible.');
    const token = await getAccessToken(config.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/userinfo.email']);
    return { access_token: token.access_token, expires_in: Math.max(60, Math.floor(((token.expires_at || Date.now() + 3600000) - Date.now()) / 1000)) };
  } };
}
