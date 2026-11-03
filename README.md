# ProfeRonald

Blog educativo con Firebase Authentication, Realtime Database, Storage y Hosting. La interfaz conserva el tema y el contenido existentes; el código mantenible está en `src/`. El gestor en `/archivos/` utiliza el permiso de administrador, no el correo del usuario.

## Desarrollo

Requisitos: Node 24, npm y Java 21 para emuladores. Functions se publica con Node 22. No se necesitan credenciales de producción para las pruebas.

```powershell
npm ci
npm ci --prefix functions
npm run check
npm run dev
```

Abre `http://127.0.0.1:4173`. El servidor entrega exclusivamente `dist/`; ejecutar directamente el HTML antiguo en XAMPP no ejecuta esta versión. `npm run build` genera los bundles con nombres versionados, imágenes WebP, las fuentes de MathLive y la plantilla de la función pública, conservando también los originales para los enlaces existentes. No edites archivos generados.

Para trabajar sin producción:

```powershell
npx firebase emulators:start --project demo-proferonald --only auth,database,storage
```

En otra terminal, con `FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000` y `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, ejecuta `node scripts/seed-emulators.mjs`. Abre `http://127.0.0.1:4173/?emulators=1`. La selección de emuladores se conserva en sessionStorage únicamente en localhost. Cierra esa pestaña o elimina `proferonald-emulators` para volver al proyecto configurado.

## Validación

```powershell
npm test
npm run test:rules
npx playwright install chromium
npx firebase emulators:exec --project demo-proferonald --only auth,database,storage "node scripts/seed-emulators.mjs && npm run test:browser"
npm audit --omit=dev --audit-level=high
```

Las pruebas cubren permisos, contenido malicioso, matemáticas, migración y recuperación, páginas públicas, paginación, navegación, edición, comentarios y archivos. La integración continua repite las verificaciones antes del despliegue.

## Datos e interfaces

- `articulos/{id}`: fuente privada, solo administrador. Mantiene los identificadores históricos.
- `publicaciones/{id}`: espejo de artículos activos. Guardar, retirar y eliminar utilizan una actualización atómica sobre ambos nodos.
- `perfilesPublicos/{uid}`: exclusivamente `displayName` y `photoURL`. `perfilesPrivados/{uid}` es privado. La aplicación no almacena correos.
- `comentarios/{post}/{id}` y `respuestas/{post}/{comentario}/{id}`: texto de 4–600 caracteres, UID del autor y fecha del servidor. Se escuchan los últimos 20 comentarios y las últimas 20 respuestas de cada hilo; las suscripciones se cancelan al navegar.
- `fotos/`: biblioteca de imágenes públicas; listado y modificaciones exclusivos del administrador. Las imágenes nuevas del editor se guardan primero en `imagenes/`, que es privado, y solo se copian a `fotos/` al publicar. `archivos/` y las carpetas históricas restantes son privadas. No subas imágenes confidenciales directamente a `fotos/` desde el gestor.
- La autorización usa `auth.token.admin === true`. Los permisos se asignan desde un entorno confiable mediante `scripts/admin.mjs`.

Los enlaces históricos `?post=...&pid=...` siguen funcionando. Los nuevos enlaces canónicos son `/publicaciones/{id}/`. La función `postPage` entrega HTML y metadatos a partir del estado público actual, sin caché compartida. Un borrador nunca se incluye en una respuesta de servidor; su vista previa es una plantilla que requiere autenticación en el cliente. El sitemap se genera con `npm run seo` en cada despliegue.

## Publicación y operación

La versión v2 está activada en https://proferonald.com. Consulta [ACTIVACION.md](ACTIVACION.md) para el resultado, el respaldo de la transición y el acceso administrativo.

**No publiques esta versión antes de migrar y verificar los datos y el administrador.** El workflow de producción ejecuta un control previo que impide hacerlo accidentalmente. Consulta [REGLAS_FIREBASE.md](REGLAS_FIREBASE.md) para los cambios exactos y su orden de activación, y [OPERACION.md](OPERACION.md) para respaldo, restauración, migración, credenciales, despliegue, reversión y alertas.

Los archivos históricos bajo `docs/assets/js` y `docs/archivos/static` se conservan como referencia y no forman parte del paquete publicable. El repositorio original del gestor, <https://github.com/ProfeRonald/archivos-proferonald>, también contiene solo compilados. Las eliminaciones preexistentes en `docs/archivos2` no son parte de esta implementación.

El tema conserva su atribución y licencia en `docs/assets/css/theme.css`. Las bibliotecas tienen versiones exactas y archivos de bloqueo. La auditoría de las dependencias de producción del sitio y de Functions no presenta avisos al implementar estos cambios. Quedan avisos moderados transitivos en las herramientas de desarrollo; no se aplican cambios mayores forzados para ocultarlos.
