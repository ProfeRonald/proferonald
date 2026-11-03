import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { JSDOM } from 'jsdom';
import { adminClient } from './admin-client.mjs';
import { contentTools } from '../src/content.js';
import { migrationUpdates } from '../src/migration.js';
import { firebaseConfig } from '../src/config.js';
const owner = 'QrcyTgnWIDPDI5CytBKSe8GTjoo2';
async function main() {
  const client = adminClient();
  const credential = client.db.app.options.credential;
  const { access_token: token } = await credential.getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };
  const request = async (label, url) => {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Object.assign(new Error(`${label}: HTTP ${response.status}`), { code: `${label}/http-${response.status}` });
    return response.json();
  };
  const summary = {};
  try {
    const data = await request('database', `${firebaseConfig.databaseURL}/.json`);
    summary.database = { accessible: true, articles: Object.keys(data?.articulos || {}).length, active: Object.values(data?.articulos || {}).filter(p => Number(p.activo) === 1).length, published: Object.keys(data?.publicaciones || {}).length, legacyProfiles: Object.keys(data?.usuarios || {}).length, schemaVersion: data?.operacion?.schemaVersion || 1 };
    try {
      const tools = contentTools(new JSDOM('').window);
      const plan = migrationUpdates(data || {}, tools.sanitize, tools.text);
      summary.migration = { valid: true, articles: plan.articles, profiles: plan.profiles };
    } catch (error) { summary.migration = { valid: false, reason: error.message }; }
    const currentRules = await request('database-rules', `${firebaseConfig.databaseURL}/.settings/rules.json`);
    summary.database.rulesMatch = isDeepStrictEqual(currentRules, JSON.parse(await readFile('database.rules.json', 'utf8')));
  } catch (error) { summary.database = { accessible: false, code: error.code || 'read-failed' }; }
  try { const user = await client.auth.getUser(owner); summary.owner = { exists: true, admin: user.customClaims?.admin === true }; }
  catch (error) { summary.owner = { accessible: false, code: error.code || 'read-failed' }; }
  try {
    const [meta] = await client.bucket.getMetadata(); let files = 0; let bytes = 0; let next = {};
    do { const [batch, query] = await client.bucket.getFiles({ ...next, maxResults: 100, autoPaginate: false }); next = query; files += batch.length; bytes += batch.reduce((sum, f) => sum + Number(f.metadata.size || 0), 0); } while (next);
    summary.storage = { accessible: true, files, bytes, corsConfigured: !!meta.cors?.length };
  } catch (error) { summary.storage = { accessible: false, code: error.code || 'read-failed' }; }
  try { const info = await request('billing', `https://cloudbilling.googleapis.com/v1/projects/${client.projectId}/billingInfo`); summary.billing = { enabled: info.billingEnabled === true }; }
  catch (error) { summary.billing = { accessible: false, code: error.code || 'read-failed' }; }
  await mkdir('.local', { recursive: true });
  await writeFile('.local/activation-inspection.json', JSON.stringify(summary, null, 2));
  // Only counters and access flags are logged; records, profiles and credentials stay private.
  console.log(JSON.stringify(summary, null, 2));
}
main().catch(error => { console.error('Inspection failed:', error.code || error.name); process.exitCode = 1; }).finally(() => process.exit(process.exitCode || 0));
