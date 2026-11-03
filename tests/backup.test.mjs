import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { backup, restore, verifyBackup, localBackupPath } from '../scripts/backup.mjs';
await mkdir('.local/test-backups', { recursive: true });
function fixture() {
  let database = { articulos: { a: { titulo: 'Conservado' } } };
  let files = new Map([['archivos/documento.pdf', Buffer.from('original')]]); let cors = [];
  const bucket = {
    async getMetadata() { return [{ cors }]; }, async setCorsConfiguration(value) { cors = value; },
    async getFiles() { return [[...files.keys()].map(name => this.file(name)), null]; },
    file(name) { return { name, async download() { return [files.get(name)]; }, async getMetadata() { return [{ contentType: 'application/pdf', metadata: {} }]; }, async save(bytes) { files.set(name, bytes); } }; }
  };
  return { projectId: 'demo-proferonald', bucket, db: { ref() { return { async get() { return { val: () => database }; }, async set(value) { database = value; } }; } }, change() { database = {}; files.clear(); }, state: () => ({ database, files }) };
}
test('backup verifies checksums and restores database, files and bucket configuration', async () => {
  const client = fixture(); const directory = await mkdtemp(path.resolve('.local/test-backups/restore-'));
  await backup(client, directory); await verifyBackup(directory); client.change();
  await restore(client, directory);
  assert.equal(client.state().database.articulos.a.titulo, 'Conservado'); assert.equal(client.state().files.get('archivos/documento.pdf').toString(), 'original');
});
test('restore rejects corrupted files before making writes', async () => {
  const client = fixture(); const directory = await mkdtemp(path.resolve('.local/test-backups/corrupt-'));
  const manifest = await backup(client, directory); await writeFile(path.join(directory, manifest.storage[0].local), 'corrupt');
  await assert.rejects(restore(client, directory)); assert.equal(client.state().database.articulos.a.titulo, 'Conservado');
});
test('backup paths cannot escape ignored local directory', () => { assert.throws(() => localBackupPath('../outside')); assert.throws(() => localBackupPath('.local')); });
