import { adminClient } from './admin-client.mjs';
import { restore, verifyBackup, digest } from './backup.mjs';
if (process.env.GCLOUD_PROJECT !== 'demo-proferonald' || process.env.FIREBASE_DATABASE_EMULATOR_HOST !== '127.0.0.1:9000') throw new Error('La recuperación de prueba requiere el emulador local y el proyecto demo-proferonald.');
const client = adminClient();
try {
  const directory = process.argv[2]; const saved = await verifyBackup(directory);
  await restore(client, directory, { databaseOnly: true });
  const recovered = (await client.db.ref('/').get()).val();
  if (digest(JSON.stringify(recovered)) !== saved.manifest.database) throw new Error('El contenido restaurado no coincide con el respaldo.');
  console.log('Recuperación verificada en emulador local: la base restaurada coincide íntegramente con el respaldo.');
} catch (error) { console.error('Recuperación de prueba interrumpida:', error.code || error.message); process.exitCode = 1; }
finally { await client.db.ref('/').remove(); process.exit(process.exitCode || 0); }
