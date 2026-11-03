import { parseArgs } from 'node:util';
import { adminClient } from './admin-client.mjs';
import { backup, verifyBackup, restore, digest } from './backup.mjs';
import { migrationUpdates } from '../src/migration.js';
import { contentTools } from '../src/content.js';
import { JSDOM } from 'jsdom';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const { positionals, values } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' }, backup: { type: 'string' }, uid: { type: 'string' }, confirm: { type: 'string' }, apply: { type: 'boolean' }, 'retain-email': { type: 'boolean' }, revoke: { type: 'boolean' } } });
try {
  const command = positionals[0];
  if (command === 'verify-backup') {
    const { manifest } = await verifyBackup(values.backup); console.log(`Respaldo íntegro: ${manifest.storage.length} archivos.`);
  } else {
    const client = adminClient();
    const confirmWrite = () => { if (!values.apply || values.confirm !== client.projectId) throw new Error('Para escribir se requiere --apply --confirm con el ID exacto del proyecto.'); };
    if (command === 'backup') {
      const manifest = await backup(client, values.out || `.local/backups/${Date.now()}`); console.log(`Respaldo completo: ${manifest.storage.length} archivos.`);
    } else if (command === 'grant-admin') {
      if (!values.uid) throw new Error('Falta --uid.');
      const user = await client.auth.getUser(values.uid);
      if (values.apply) { confirmWrite(); await client.auth.setCustomUserClaims(values.uid, { ...user.customClaims, admin: !values.revoke }); }
      console.log(values.apply ? 'Permiso actualizado. Cierra sesión y vuelve a entrar.' : 'Simulación: se actualizaría únicamente el permiso admin.');
    } else if (command === 'migrate') {
      const snapshot = (await client.db.ref('/').get()).val() || {};
      const tools = contentTools(new JSDOM('').window);
      const result = migrationUpdates(snapshot, tools.sanitize, tools.text, { retainEmail: values['retain-email'] });
      await mkdir('.local', { recursive: true });
      await writeFile('.local/migration-preview.json', JSON.stringify({ projectId: client.projectId, articles: result.articles, profiles: result.profiles, updates: result.updates }, null, 2), { mode: 0o600 });
      console.log(`Migración preparada: ${result.articles} artículos, ${result.profiles} perfiles.`);
      console.log('Cambios revisables en .local/migration-preview.json (contiene datos privados).');
      if (values.apply) {
        confirmWrite();
        const saved = await verifyBackup(values.backup);
        if (saved.manifest.projectId !== client.projectId || digest(JSON.stringify(snapshot)) !== saved.manifest.database) throw new Error('Se requiere un respaldo completo del estado actual. Si hubo nuevas escrituras, crea otro respaldo.');
        await client.db.ref('/').update(result.updates);
        console.log('Migración atómica completada.');
      } else console.log('Simulación terminada, sin cambios.');
    } else if (command === 'secure-private-files' || command === 'configure-cors') {
      if (values.apply) {
        confirmWrite();
        const saved = await verifyBackup(values.backup);
        if (saved.manifest.projectId !== client.projectId) throw new Error('El respaldo debe pertenecer al proyecto de destino.');
      }
      if (command === 'configure-cors') {
        const config = JSON.parse(await readFile('storage.cors.json', 'utf8'));
        if (values.apply) await client.bucket.setCorsConfiguration(config);
        console.log(values.apply ? 'CORS actualizado.' : 'Simulación: se aplicaría storage.cors.json.');
      } else {
        let count = 0; let next = {};
        do {
          const [files, query] = await client.bucket.getFiles({ ...next, maxResults: 100, autoPaginate: false }); next = query;
          for (const file of files) if (!file.name.startsWith('fotos/')) {
            const [metadata] = await file.getMetadata();
            if (metadata.metadata?.firebaseStorageDownloadTokens) {
              count++; if (values.apply) await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: null } });
            }
          }
        } while (next);
        console.log(`${values.apply ? 'Revocados' : 'Por revocar'}: ${count} enlaces antiguos de archivos privados.`);
      }
    } else if (command === 'restore') {
      const saved = await verifyBackup(values.backup);
      console.log(`Respaldo verificado: ${saved.manifest.storage.length} archivos.`);
      if (values.apply) { confirmWrite(); await restore(client, values.backup); console.log('Restauración completada. No se eliminan archivos adicionales del bucket.'); }
      else console.log('Simulación terminada, sin cambios.');
    } else throw new Error('Comandos: backup, verify-backup, grant-admin, migrate, secure-private-files, configure-cors, restore.');
  }
} catch (e) {
  console.error('Operación interrumpida:', e.message?.replace(/https?:\/\/\S+/g, '[URL omitida]')); process.exitCode = 1;
} finally { process.exit(process.exitCode || 0); }
