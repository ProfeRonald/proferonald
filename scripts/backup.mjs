import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export const digest = data => createHash('sha256').update(data).digest('hex');
export function localBackupPath(directory) {
  const target = path.resolve(directory); const root = path.resolve('.local');
  if (!target.startsWith(root + path.sep)) throw new Error('Los respaldos deben guardarse dentro de .local/.');
  return target;
}
export async function backup(client, directory) {
  const target = localBackupPath(directory); await mkdir(target, { recursive: true });
  const database = JSON.stringify((await client.db.ref('/').get()).val() || {});
  await writeFile(path.join(target, 'database.json'), database, { flag: 'wx' });
  const manifest = { version: 1, projectId: client.projectId, createdAt: new Date().toISOString(), database: digest(database), storage: [] };
  const [bucketMetadata] = await client.bucket.getMetadata(); manifest.cors = bucketMetadata.cors || [];
  let next = {};
  do {
    const [files, query] = await client.bucket.getFiles({ ...next, maxResults: 100, autoPaginate: false }); next = query;
    for (const file of files) {
      const [bytes] = await file.download(); const [metadata] = await file.getMetadata();
      const local = `${digest(file.name)}.bin`; await writeFile(path.join(target, local), bytes);
      manifest.storage.push({ name: file.name, local, sha256: digest(bytes), contentType: metadata.contentType, metadata: metadata.metadata || {}, cacheControl: metadata.cacheControl || '' });
    }
  } while (next);
  await writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  return manifest;
}
export async function verifyBackup(directory) {
  const target = localBackupPath(directory);
  const manifest = JSON.parse(await readFile(path.join(target, 'manifest.json'), 'utf8'));
  const database = await readFile(path.join(target, 'database.json'));
  if (manifest.version !== 1 || digest(database) !== manifest.database) throw new Error('El respaldo de base de datos no supera la verificación.');
  for (const item of manifest.storage) {
    if (!/^[a-f0-9]{64}\.bin$/.test(item.local) || digest(await readFile(path.join(target, item.local))) !== item.sha256) throw new Error('El respaldo de archivos no supera la verificación.');
  }
  for (const [name, checksum] of Object.entries(manifest.extra || {})) {
    if (!/^[a-zA-Z0-9_-]+\.json$/.test(name) || digest(await readFile(path.join(target, name))) !== checksum) throw new Error('El respaldo adicional no supera la verificación.');
  }
  return { manifest, database: JSON.parse(database), target };
}
export async function restore(client, directory, { databaseOnly = false } = {}) {
  const { manifest, database, target } = await verifyBackup(directory);
  if (!client.projectId.startsWith('demo-') && manifest.projectId !== client.projectId) throw new Error('Proyecto del respaldo distinto al destino.');
  await client.db.ref('/').set(database);
  if (!databaseOnly) for (const item of manifest.storage) await client.bucket.file(item.name).save(await readFile(path.join(target, item.local)), { metadata: { contentType: item.contentType, cacheControl: item.cacheControl, metadata: item.metadata }, resumable: false });
  if (!databaseOnly && manifest.cors) await client.bucket.setCorsConfiguration(manifest.cors);
  return manifest;
}
