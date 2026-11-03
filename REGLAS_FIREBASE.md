# Reglas de Firebase: cambios y orden de activación

Los archivos definitivos de esta versión son:

- **Realtime Database:** reemplazar el documento completo por [database.rules.json](database.rules.json).
- **Storage:** reemplazar el documento completo por [storage.rules](storage.rules).

No mezclar estas reglas con permisos públicos anteriores: una lectura o escritura concedida en un nivel superior no puede restringirse desde sus hijos. `tests/fixtures/database.legacy.rules.json` conserva las reglas antiguas como referencia de pruebas y reversión; **no es el archivo que debe publicarse**.

## Qué cambia

| Área | Comportamiento nuevo |
| --- | --- |
| Administrador | Se comprueba la declaración `admin: true` del token; se elimina la dependencia del UID fijo en las reglas activas. |
| Artículos | `articulos/` solo permite acceso al administrador. Los visitantes leen `publicaciones/`, que contiene únicamente artículos activos. |
| Perfiles | `perfilesPublicos/{uid}` admite solo nombre y foto; `perfilesPrivados/{uid}` es privado. El nodo antiguo `usuarios/` deja de ser público. |
| Comentarios | Es obligatorio iniciar sesión y escribir con el UID propio. No se pueden sobrescribir comentarios ajenos. Autor y administrador pueden eliminar. |
| Respuestas | Se almacenan en `respuestas/{post}/{comentario}/{id}`, con las mismas comprobaciones de autoría y límites de texto. |
| Consultas | Los lectores consultan los últimos 20 comentarios y las últimas 20 respuestas por hilo, de acuerdo con el código nuevo. |
| Imágenes públicas | En `fotos/` se permite descargar; solo el administrador puede listar, subir, modificar o borrar. JPEG, PNG y WebP, hasta 5 MB. |
| Imágenes de borradores | `imagenes/` es privado y solo accesible al administrador. El editor publica una copia al activar el artículo. |
| Documentos | `archivos/` es privado; solo el administrador puede operar. Tipos permitidos explícitos y hasta 20 MB. |
| Resto de carpetas de Storage | Solo el administrador puede consultar, listar o borrar archivos antiguos. Las subidas nuevas se limitan a las carpetas definidas. |

Los enlaces antiguos de descarga de Storage que contienen un token pueden seguir dando acceso aunque cambien las reglas. Para documentos privados, revocarlos con el comando indicado abajo después de revisar la simulación y respaldar los archivos. Las imágenes que ya eran públicas y permanecen en `fotos/` continúan siendo públicas.

## Orden obligatorio

La versión antigua del blog no funciona con el nuevo cierre de `articulos/` y `usuarios/`. **No pegar estas reglas de forma aislada mientras siga sirviéndose la aplicación antigua.** Preparar primero la versión nueva y aplicar la transición en una ventana controlada; detener temporalmente las escrituras para conservar la consistencia del respaldo y la migración.

1. Configurar credenciales administrativas fuera del repositorio mediante `GOOGLE_APPLICATION_CREDENTIALS`. Tener las reglas no concede acceso para respaldar ni migrar datos.
2. Respaldar y verificar los datos, archivos y metadatos:

```powershell
npm run admin -- backup --out .local/backups/antes-v2
npm run admin -- verify-backup --backup .local/backups/antes-v2
```

3. Asignar la declaración de administrador al UID que ya figura en las reglas actuales y cerrar sesión y volver a entrar después de activar la nueva versión:

```powershell
npm run admin -- grant-admin --uid QrcyTgnWIDPDI5CytBKSe8GTjoo2
npm run admin -- grant-admin --uid QrcyTgnWIDPDI5CytBKSe8GTjoo2 --apply --confirm proferonald-fb
```

4. Simular la migración y revisar `.local/migration-preview.json`. Después aplicar con el respaldo íntegro del estado actual:

```powershell
npm run admin -- migrate
npm run admin -- migrate --backup .local/backups/antes-v2 --apply --confirm proferonald-fb
```

5. Revisar la simulación de revocación de enlaces privados y configurar CORS para las descargas autenticadas:

```powershell
npm run admin -- secure-private-files
npm run admin -- secure-private-files --backup .local/backups/antes-v2 --apply --confirm proferonald-fb
npm run admin -- configure-cors --backup .local/backups/antes-v2 --apply --confirm proferonald-fb
```

6. Validar y publicar la versión nueva junto con reglas, función de páginas públicas y Hosting:

```powershell
npm ci
npm ci --prefix functions
npm run check
npm run test:rules
node scripts/preflight.mjs
npm run seo
npx firebase deploy --project proferonald-fb --only database,storage,functions,hosting
```

También pueden reemplazarse los documentos de reglas desde las pestañas **Rules** de Realtime Database y Storage en Firebase Console, siempre dentro de la misma transición coordinada. La configuración del repositorio ya apunta a los dos archivos definitivos.

Functions necesita facturación habilitada y permisos de despliegue. Una subida a `main` ejecuta únicamente las verificaciones. Para publicar desde GitHub, ejecutar manualmente **Actions → Verify main and manually deploy Firebase → Run workflow**, después de preparar la migración y el administrador. El flujo verifica primero ambos requisitos y se detiene si no están preparados. Sincronizar el repositorio no equivale a haber completado la migración ni a haber publicado estas reglas.

Los detalles de restauración, reversión, pruebas con emuladores y alertas están en [OPERACION.md](OPERACION.md).
