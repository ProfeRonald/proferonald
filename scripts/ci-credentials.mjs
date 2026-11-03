import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
if (!process.env.GITHUB_ACTIONS || !process.env.GITHUB_ENV || !process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('Solo se ejecuta dentro del flujo de despliegue.');
const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (account.project_id !== 'proferonald-fb') throw new Error('Cuenta de servicio de otro proyecto.');
await mkdir('.local', { recursive: true });
const file = path.resolve('.local/ci-credentials.json');
await writeFile(file, JSON.stringify(account), { mode: 0o600 });
await appendFile(process.env.GITHUB_ENV, `GOOGLE_APPLICATION_CREDENTIALS=${file}\n`);
