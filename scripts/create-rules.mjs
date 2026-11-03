// The generated file is checked in. Run only when intentionally changing rule templates.
import { writeFile } from 'node:fs/promises';
const admin = 'auth != null && auth.token.admin === true';
const fields = {
  titulo: { '.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 180' },
  contenido: { '.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 100000' },
  imagen: { '.validate': "newData.isString() && newData.val().length <= 2048 && (newData.val() === '' || newData.val().beginsWith('https://') || (auth != null && auth.token.aud === 'demo-proferonald' && newData.val().beginsWith('http://127.0.0.1:9199/')))" },
  categorias: { '.validate': 'newData.isString() && newData.val().length <= 500' },
  activo: { '.validate': 'newData.val() === 0 || newData.val() === 1' },
  fecha: { '.validate': 'newData.isNumber() && newData.val() > 0 && newData.val() <= now' },
  actualizado: { '.validate': 'newData.isNumber() && newData.val() <= now' },
  '$other': { '.validate': false }
};
const article = { '.write': admin, '.validate': "newData.hasChildren(['titulo', 'contenido', 'imagen', 'categorias', 'activo', 'fecha'])", ...fields };
const comment = key => ({
  '.validate': `newData.hasChildren(['${key}', 'usuario', 'fecha'])`,
  [key]: { '.validate': 'newData.isString() && newData.val().length >= 4 && newData.val().length <= 600 && (!data.exists() || newData.val() === data.val())' },
  usuario: { '.validate': 'newData.isString() && newData.val().length <= 128 && (!data.exists() || newData.val() === data.val())' },
  fecha: { '.validate': 'newData.isNumber() && newData.val() <= now && (data.exists() ? newData.val() === data.val() : newData.val() >= now - 60000)' },
  '$other': { '.validate': false }
});
const rules = {
  '.read': false, '.write': false,
  articulos: { '.read': admin, '$id': { ...article, imagen: { '.validate': fields.imagen['.validate'].replace("newData.val().beginsWith('https://')", "newData.val().beginsWith('https://') || newData.val().beginsWith('private:imagenes/')") } } },
  publicaciones: { '.read': true, '$id': { ...article, '.validate': article['.validate'] + " && newData.child('activo').val() === 1", activo: { '.validate': 'newData.val() === 1' } } },
  perfilesPublicos: { '$uid': {
    '.read': true, '.write': 'auth != null && auth.uid === $uid', '.validate': "newData.hasChildren(['displayName', 'photoURL'])",
    displayName: { '.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 120' },
    photoURL: { '.validate': "newData.isString() && newData.val().length <= 2048 && (newData.val() === '' || newData.val().beginsWith('https://'))" }, '$other': { '.validate': false }
  } },
  usuarios: { '.read': admin, '.write': admin },
  perfilesPrivados: { '$uid': { '.read': `auth != null && (auth.uid === $uid || auth.token.admin === true)`, '.write': admin } },
  comentarios: { '$post': {
    '.read': `(${admin}) || (root.child('publicaciones').child($post).exists() && query.limitToLast != null && query.limitToLast <= 20)`,
    '.write': admin,
    '$comment': {
      ...comment('comentario'),
      '.write': "auth != null && root.child('publicaciones').child($post).exists() && ((!data.exists() && newData.exists() && newData.child('usuario').val() === auth.uid && !newData.hasChild('respuestas')) || (!newData.exists() && data.child('usuario').val() === auth.uid))",
    }
  } },
  respuestas: { '$post': {
    '.write': admin,
    '$comment': {
      '.read': `(${admin}) || (root.child('publicaciones').child($post).exists() && query.limitToLast != null && query.limitToLast <= 20)`,
      '.write': "auth != null && !newData.exists() && root.child('comentarios').child($post).child($comment).child('usuario').val() === auth.uid",
      '$reply': { ...comment('respuesta'), '.write': "auth != null && root.child('publicaciones').child($post).exists() && root.child('comentarios').child($post).child($comment).exists() && ((!data.exists() && newData.exists() && newData.child('usuario').val() === auth.uid) || (!newData.exists() && data.child('usuario').val() === auth.uid))" }
    }
  } },
  operacion: { '.read': admin, '.write': admin }
};
await writeFile('database.rules.json', JSON.stringify({ rules }, null, 2) + '\n');
