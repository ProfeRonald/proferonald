# Operación y activación segura

## Estado inicial

La revisión inicial no modificó producción. La activación posterior se realizó el 3 de noviembre de 2026 y se documenta en [ACTIVACION.md](ACTIVACION.md). El respaldo completo de esa transición está en `.local/backups/activation-v2-20261103`, incluidas las reglas efectivamente desplegadas y la versión anterior de Hosting.

Como referencia histórica, se respaldaron las reglas originales de Storage en `.local/remote-rules/storage.json`: restringían las operaciones a un UID concreto. Las reglas originales de Realtime Database fueron suministradas por el propietario y se conservan en `tests/fixtures/database.legacy.rules.json`, con una copia local en `.local/remote-rules/database.user-provided.json`. La lectura inicial por API respondió HTTP 401; se resolvió utilizando el alcance de identificación de la sesión local autorizada.

Las reglas suministradas confirman tres riesgos: lectura pública de todos los artículos, incluidos borradores; lectura pública de cada perfil completo si se conoce su UID, incluido su correo si está almacenado; y creación o sobrescritura de comentarios sin iniciar sesión porque `newData.exists()` no comprueba autenticación ni autoría. El borrado completo de un comentario sí queda reservado al UID administrador, pero sus campos y respuestas pueden modificarse mientras el comentario padre siga cumpliendo la validación. No hay evidencia aquí de que estos permisos se hayan explotado.

Antes de activar, confirmar que la referencia suministrada sigue vigente y conservarla junto al respaldo de datos. `node scripts/inspect-remote.cjs` es una herramienta de lectura para la instalación local de Firebase CLI en Windows; no imprime credenciales ni datos de usuarios. La referencia de reglas ya está disponible, pero sigue siendo necesario acceso autorizado para respaldar datos, asignar permisos y migrar. No relajar permisos para facilitar la inspección.

Los comandos administrativos usan Application Default Credentials. Configura `GOOGLE_APPLICATION_CREDENTIALS` con la ruta de una cuenta de servicio fuera del repositorio, o utiliza un entorno con credenciales asignadas. No pegues claves en código, argumentos o Git. Las claves públicas de configuración web de Firebase no sustituyen las reglas de autorización.

También puede reutilizarse la sesión local de Firebase CLI con `$env:PROFERONALD_CLI_AUTH='1'` en PowerShell. El código usa el token existente en memoria, incluyendo el alcance de identificación necesario para RTDB; no crea ni copia claves de servicio. Esta alternativa requiere que la cuenta conectada ya tenga permisos administrativos sobre el proyecto. No amplía permisos IAM.

El secreto de GitHub existente permite consultar Authentication y desplegar Hosting, pero la inspección detectó que no tiene los permisos de datos y Storage necesarios para una migración o publicación completa. Se conserva sin ampliar privilegios. Para esas operaciones se utilizó la sesión local autorizada; un despliegue completo desde GitHub seguirá necesitando credenciales con los permisos correspondientes. El flujo **Inspect Firebase readiness** solo consulta metadatos y no aplica cambios.

## Respaldo, migración y permisos

1. Detener temporalmente la edición y los comentarios mientras se obtiene el respaldo definitivo y se ejecuta la migración. Mantener disponible la lectura.
2. Obtener un respaldo completo de la base de datos, archivos, metadatos y CORS:

```powershell
npm run admin -- backup --out .local/backups/antes-v2
npm run admin -- verify-backup --backup .local/backups/antes-v2
```

El respaldo contiene datos privados y tokens históricos: `.local/` se excluye de Git y del alojamiento. Guardar otra copia cifrada con acceso limitado al operador. Política operativa recomendada: respaldos diarios retenidos 30 días y una copia anterior a cada cambio; configurar la tarea en la infraestructura del propietario antes de activarla. Esta versión no instala una tarea recurrente ni elimina respaldos existentes automáticamente.

3. Probar recuperación en un proyecto demo o entorno de ensayo sin datos reales de visitantes. Las pruebas automatizadas verifican checksums y restauración; no sustituyen un ensayo con el respaldo real en un entorno autorizado.

```powershell
npm run admin -- restore --backup .local/backups/antes-v2
# La simulación anterior no escribe. Para un proyecto demo con emuladores:
$env:GCLOUD_PROJECT = 'demo-proferonald'
$env:FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9000'
$env:FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199'
npm run admin -- restore --backup .local/backups/antes-v2 --apply --confirm demo-proferonald
```

No ejecutar pruebas demo con credenciales o URLs de producción. Limpiar las variables de emuladores al terminar. La restauración sobrescribe la base completa y los archivos incluidos, pero conserva archivos adicionales del bucket; no realiza un borrado masivo.

4. Asignar `admin` al UID de la cuenta propietaria. El UID de las reglas anteriores puede utilizarse después de confirmar que corresponde al propietario. Se preservan las demás declaraciones de la cuenta:

```powershell
npm run admin -- grant-admin --uid UID_DEL_PROPIETARIO
npm run admin -- grant-admin --uid UID_DEL_PROPIETARIO --apply --confirm proferonald-fb
```

Cerrar sesión y volver a entrar para renovar el token. Para retirar el permiso, añadir `--revoke` al mismo comando.

5. Simular y aplicar la migración:

```powershell
npm run admin -- migrate
npm run admin -- migrate --backup .local/backups/antes-v2 --apply --confirm proferonald-fb
```

La migración valida y sanea los artículos, conserva claves y fechas, crea el espejo público solo con artículos activos, mueve respuestas a su nodo paginado, crea perfiles públicos y elimina perfiles antiguos con correos. La simulación deja los cambios concretos en `.local/migration-preview.json`; revisar especialmente los artículos cuyo HTML cambia antes de aplicar. Ese archivo contiene borradores privados y no debe compartirse. Por defecto no conserva correos; solo usar `--retain-email` si se ha determinado una finalidad necesaria, guardándolos en `perfilesPrivados`. Los originales permanecen en el respaldo privado.

El comando exige un respaldo íntegro del estado actual; si hubo nuevas escrituras, aborta y debe repetirse el respaldo. No ignora artículos inválidos: corregirlos en una copia y repetir el ensayo antes de producción. Los datos de origen que se modifiquen al sanear HTML se recuperan del respaldo, no del espejo público.

6. Revocar enlaces históricos de descarga que eludan la sesión en archivos privados y aplicar CORS:

```powershell
npm run admin -- secure-private-files
npm run admin -- secure-private-files --backup .local/backups/antes-v2 --apply --confirm proferonald-fb
npm run admin -- configure-cors --backup .local/backups/antes-v2 --apply --confirm proferonald-fb
```

Los enlaces de `fotos/` permanecen públicos. La revocación puede invalidar documentos antes compartidos: revisar primero la simulación y las referencias existentes. Para vistas previas de Hosting, añadir su origen concreto a CORS durante la prueba y retirarlo después; no usar `*` para documentos privados. La [descarga autenticada con el SDK requiere CORS](https://firebase.google.com/docs/storage/web/download-files).

## Despliegue

Firebase Functions requiere un proyecto con facturación habilitada y los permisos de creación de funciones/Cloud Run. No se ha habilitado facturación ni modificado IAM automáticamente. La función limita las instancias a dos y consulta el estado actual de cada publicación. Revisar los cargos de uso del proyecto antes de activarla.

```powershell
npm ci
npm ci --prefix functions
npm run check
npm run test:rules
node scripts/preflight.mjs
npm run seo
npx firebase deploy --project proferonald-fb --only database,storage,functions,hosting
node scripts/health.mjs
```

Primero validar una vista previa y el entorno de ensayo. Las vistas previas normales no cambian reglas ni datos y apuntan al mismo proyecto configurado; para ensayos aislados usar emuladores. Una vista previa de Hosting por sí sola no prueba la nueva función si aún no está desplegada; comprobarla en emulador o en un proyecto de staging antes de activar producción.

Una subida a `main` ejecuta únicamente las comprobaciones. La publicación requiere ejecutar manualmente **Verify main and manually deploy Firebase** mediante **Run workflow** en GitHub Actions, o el comando de despliegue anterior. El trabajo manual verifica versión de esquema, consistencia del espejo y existencia del administrador, genera el sitemap y publica. Requiere el secreto existente `FIREBASE_SERVICE_ACCOUNT_PROFERONALD_FB` con acceso a estos recursos. No publica si el control previo falla. La sincronización del repositorio no aplica reglas ni migra datos en Firebase.

## Reversión y observación

- Hosting: conservar el identificador de la versión anterior y revertirla desde Firebase Console. Una reversión solo de Hosting no restaura reglas, funciones ni datos.
- Antes de volver a la aplicación antigua, detener escrituras y restaurar de forma coordinada los datos, reglas de Database/Storage respaldadas y la versión de Hosting. El código antiguo usa rutas y permisos diferentes. Eliminar la función nueva únicamente cuando ninguna versión activa la utilice.
- Restaurar datos requiere `restore --backup RUTA --apply --confirm proferonald-fb`; este comando sobrescribe la base, por lo que primero respaldar también el estado posterior si hay aportaciones nuevas.
- CSP está en modo de reporte. Comprobar en navegador lecturas, Google Auth, Storage y reproducción de videos; resolver violaciones antes de cambiar a `Content-Security-Policy`. No hay colector de CSP desplegado.
- El emulador actual de Hosting en Windows no reproduce correctamente las cabeceras configuradas mediante patrones de ruta: Superstatic convierte las barras de URL en separadores de Windows. Las pruebas de CI en Linux sí comprueban la caché de portada; verificar también las cabeceras del alojamiento real antes de activar CSP.
- Los errores de aplicación registran únicamente categoría y código. La función registra fallos sin texto de artículos, correos, tokens ni identificadores en mensajes propios. Google Cloud mantiene sus registros de infraestructura conforme a su configuración.
- Ejecutar `node scripts/health.mjs` tras publicar; comprueba portada, gestor, sitemap y 404 de recursos. Configurar en Cloud Monitoring alertas por errores 5xx y latencia de `postPage`, y en Billing presupuestos de gasto y alertas de consumo de Database/Storage. No se han creado alertas ni habilitado servicios de pago automáticamente.
- Medir Lighthouse/Core Web Vitals antes y después del despliegue con contenido real. Las capturas y pruebas locales no representan mediciones de producción.
- Revisar periódicamente `npm audit` en raíz y `functions/`. Quedan avisos moderados transitivos; no hay avisos altos tras la actualización de gRPC en el momento de la implementación.

## Límites y decisiones explícitas

La búsqueda recorre el catálogo público en lotes de 100 y filtra en memoria. Si crece a miles de publicaciones, medir coste y latencia antes de añadir un índice de búsqueda. La fecha de ordenación sigue las claves históricas de Firebase. Las subidas del editor se guardan en `imagenes/`, en privado, y solo se copian a `fotos/` cuando se publica. Si falla el guardado se intenta eliminar la copia pública y se conserva el formulario y su original privado. La biblioteca histórica `fotos/` sigue siendo pública, incluso para imágenes usadas anteriormente en publicaciones retiradas o insertadas directamente por el administrador; no se borran archivos que puedan estar enlazados por otras publicaciones. Para retirar también una imagen ya pública, comprobar referencias y eliminarla desde el gestor. Almacenar otros documentos confidenciales en `archivos/`.

El sitemap refleja el catálogo del último despliegue: las altas y bajas se reflejan en la siguiente publicación. Las páginas HTML y sus metadatos sí consultan siempre la visibilidad actual y devuelven 404 al retirar un artículo, sin conservar una copia estática accesible.

Los comentarios se muestran como texto seguro. El editor de noticias usa Tiptap 3.32.2, cargado solo al abrir el formulario de administrador, con formato visual, tablas, enlaces, fórmulas, vista previa y edición de HTML saneado. Se conservan fórmulas $ y $$. El blog conserva el tema Affiliates, Bootstrap 4.6.2 solo CSS, tipografía Rubik e iconos originales servidos localmente, carrusel de cinco segundos con controles y pausa por interacción o preferencia de movimiento reducido, tarjetas de novedades y publicaciones, barra lateral, enlaces sociales y pie de página originales. El gestor mantiene sus estilos separados. El versículo de DailyVerses se carga en un iframe con sandbox sin acceso al documento del blog, y su respuesta se sanea antes de mostrarla. No se carga Analytics. El texto de privacidad describe esta versión y necesita validación jurídica del propietario antes de activarla si su audiencia o tratamiento de datos lo exige.


## Editor de noticias e imágenes

Entra como administrador y elige **Nuevo** o **Editar**. La vista **Visual** permite dar formato al contenido; **Editar HTML** conserva la edición avanzada y **Vista previa** muestra el resultado sin publicar. Para insertar una imagen dentro del texto, sitúa el cursor y elige **Insertar imagen**. Selecciona una imagen existente y pulsa **Editar imagen**, o haz doble clic sobre ella. La portada tiene controles independientes para elegirla, editarla o quitarla.

El modal admite archivos JPEG, PNG y WebP de hasta 5 MB y 40 megapíxeles, galería paginada y enlaces HTTPS. Permite recortar arrastrando o con coordenadas, elegir proporciones, girar, voltear, ajustar brillo/contraste y reducir el tamaño de salida. Las copias nuevas se optimizan como WebP con un lado máximo de 1920 px y nombres únicos. Las imágenes externas requieren permiso CORS del proveedor para poder recortarlas; si no lo permite se pueden insertar sin editar o cargar desde el equipo. **Cancelar** o Escape no aplica los cambios.

Las imágenes insertadas y editadas se guardan primero en `imagenes/`. El contenido del borrador referencia esas imágenes mediante marcadores privados; solo el administrador puede obtener sus vistas previas temporales. Al publicar se copian a `fotos/` y se sustituyen todas las referencias privadas en la misma actualización de la noticia. Si falla el proceso se conserva el formulario y se intenta borrar únicamente las copias públicas creadas en ese intento. Las imágenes públicas ya existentes y los archivos originales no se sobrescriben. Los archivos privados que queden sin usar tras descartar una noticia pueden eliminarse desde el gestor, comprobando primero que ningún borrador los utiliza.
