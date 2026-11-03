import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { adminClient } from './admin-client.mjs';
import { verifyBackup, digest } from './backup.mjs';
const directory = process.argv[2];
try {
  const saved = await verifyBackup(directory); const client = adminClient();
  if (saved.manifest.projectId !== client.projectId) throw new Error('El respaldo pertenece a otro proyecto.');
  const { access_token } = await client.credential.getAccessToken();
  const get = async url => {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`No se pudo guardar el estado de reversión: HTTP ${response.status}`);
    return response.json();
  };
  const databaseRules = await get(client.db.app.options.databaseURL + '/.settings/rules.json');
  const release = await get(`https://firebaserules.googleapis.com/v1/projects/${client.projectId}/releases/firebase.storage/${client.bucket.name}`);
  const storageRules = await get(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
  const hosting = await get(`https://firebasehosting.googleapis.com/v1beta1/sites/${client.projectId}/releases?pageSize=1`);
  const owner = await client.auth.getUser('QrcyTgnWIDPDI5CytBKSe8GTjoo2');
  const values = { 'database-rules.json': databaseRules, 'storage-rules.json': storageRules, 'hosting-release.json': hosting, 'auth-owner.json': { uid: owner.uid, customClaims: owner.customClaims || {} } };
  saved.manifest.extra ||= {};
  for (const [name, value] of Object.entries(values)) {
    const bytes = JSON.stringify(value, null, 2); await writeFile(path.join(saved.target, name), bytes, { flag: 'wx', mode: 0o600 });
    saved.manifest.extra[name] = digest(bytes);
  }
  await writeFile(path.join(saved.target, 'manifest.json'), JSON.stringify(saved.manifest, null, 2));
  await verifyBackup(saved.target);
  const normalize = text => text.replace(/\r\n/g, '\n').trim();
  console.log(JSON.stringify({ rollbackStateSaved: true, databaseRulesMatch: isDeepStrictEqual(databaseRules, JSON.parse(await readFile('database.rules.json', 'utf8'))), storageRulesMatch: normalize(storageRules.source.files.find(f => f.name === 'storage.rules')?.content || '') === normalize(await readFile('storage.rules', 'utf8')), ownerAdminBefore: owner.customClaims?.admin === true, previousHostingReleaseSaved: !!hosting.releases?.length }));
} catch (error) { console.error('No se pudo completar el respaldo de reversión:', error.code || error.message); process.exitCode = 1; }
finally { process.exit(process.exitCode || 0); }
