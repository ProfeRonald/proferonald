import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Emulador obligatorio.');
const app = initializeApp({ projectId: 'demo-proferonald', databaseURL: 'https://demo-proferonald-default-rtdb.firebaseio.com' });
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Emulador de autenticación obligatorio.');
const result = await getAuth(app).importUsers([
  { uid: 'admin', email: 'admin@example.test', displayName: 'Administrador', customClaims: { admin: true }, providerData: [{ providerId: 'google.com', uid: 'google-admin', email: 'admin@example.test', displayName: 'Administrador' }] },
  { uid: 'user', email: 'user@example.test', displayName: 'Usuario', providerData: [{ providerId: 'google.com', uid: 'google-user', email: 'user@example.test', displayName: 'Usuario' }] }
]);
if (result.failureCount) throw new Error('No se pudieron preparar las cuentas demo.');
const posts = {};
for (let i = 1; i <= 8; i++) posts['-NCTb9s4nnhF0cY0sAr' + i] = { titulo: `Artículo ${i}`, contenido: '<p>Educación $x^2$</p><script>alert(1)</script>', imagen: i === 8 ? 'https://youtu.be/dQw4w9WgXcQ' : '', categorias: i % 2 ? 'Noticias' : 'Matemática', activo: 1, fecha: 1660000000000 + i };
await getDatabase(app).ref().set({ publicaciones: posts, articulos: { ...posts, draft: { ...Object.values(posts)[0], activo: 0 } }, comentarios: { '-NCTb9s4nnhF0cY0sAr8': { c: { comentario: 'Comentario principal', usuario: 'user', fecha: 1660000000000 } } }, respuestas: { '-NCTb9s4nnhF0cY0sAr8': { c: { r: { respuesta: 'Respuesta asíncrona', usuario: 'user', fecha: 1660000000001 } } } }, perfilesPublicos: { user: { displayName: 'Usuario', photoURL: '' } } });
console.log('Fixture demo lista.'); process.exit(0);
