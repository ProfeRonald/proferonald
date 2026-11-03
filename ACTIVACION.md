# Activación de ProfeRonald v2

Activación realizada el 3 de noviembre de 2026 en el proyecto `proferonald-fb`.

## Estado comprobado

- Dominio activo: https://proferonald.com.
- Reglas de RTDB y Storage confirmadas contra los archivos del repositorio antes de migrar.
- Respaldo privado completo, verificado por checksum: RTDB, 24 objetos de Storage, metadatos, CORS, reglas, permisos originales de la cuenta y versión anterior de Hosting.
- Recuperación real del respaldo de RTDB comprobada en un emulador local aislado: el contenido restaurado coincide íntegramente con el checksum original. La copia de prueba se eliminó del emulador al terminar.
- Cuenta propietaria con la declaración `admin: true`, preservando sus demás declaraciones.
- Migración atómica completada: 3 artículos activos y 2 perfiles. El espejo público es consistente y el esquema tiene versión 2.
- CORS configurado para los dominios de producción y descargas autenticadas.
- Revocados 7 enlaces antiguos de archivos privados, sin referencias desde las publicaciones activas. Se verificaron los hashes MD5 de los 24 objetos: ningún contenido fue alterado.
- Función `public-pages:postPage` publicada en `us-east1`, Node 22, con máximo de dos instancias.
- Política de limpieza de imágenes de compilación de esa región: 7 días. No afecta a los archivos de usuarios.
- Hosting publicado, sitemap con las 3 publicaciones y páginas de artículos con metadatos y `private,no-store,max-age=0`.
- Verificación pública en navegador: lectura, HTML del servidor, recarga, enlaces históricos, gestor cerrado para visitantes, presentación móvil y ausencia de errores de JavaScript.

El respaldo permanece en `.local/backups/activation-v2-20261103`, excluido de Git y de Hosting. Contiene información privada; no debe publicarse ni subirse como artefacto de un repositorio público. Sus reglas y permisos originales se incluyen como archivos adicionales validados por el manifiesto. Las eliminaciones locales anteriores de `docs/archivos2` se mantuvieron fuera de los commits.

## Administración y publicaciones futuras

Para ver los controles de administración, cerrar sesión y volver a entrar con la cuenta propietaria. El permiso depende del token renovado, no del correo ni de un control visual.

La activación utilizó la sesión ya autorizada de Firebase CLI del propietario. El alcance de identificación era necesario para RTDB. No se copiaron tokens ni se crearon claves de servicio nuevas; tampoco se ampliaron privilegios del secreto de despliegue de GitHub. Firebase habilitó y aprovisionó los servicios que requiere Functions en un proyecto que ya tenía facturación habilitada.

```powershell
$env:PROFERONALD_CLI_AUTH = '1'
node scripts/preflight.mjs
npm run check
npm run seo
npx firebase deploy --project proferonald-fb --only functions:public-pages:postPage,hosting
node scripts/health.mjs
```

La sincronización de `main` ejecuta verificaciones, sin publicar automáticamente. La publicación completa desde GitHub sigue requiriendo un secreto con los permisos de datos, Storage y Functions que actualmente no tiene; usar la sesión local autorizada mientras no se ajuste expresamente ese acceso. El flujo **Inspect Firebase readiness** es de solo lectura y no descarga artículos o perfiles para contar registros.

## Pendientes de preferencias del propietario

Para configurar avisos de gasto hacen falta el correo destinatario y el umbral mensual en USD. No se eligió una dirección ni un importe sin esa información. Las alertas no actúan como límite de consumo.

La CSP permanece en modo de reporte para observar el comportamiento real antes de imponerla. Los respaldos recurrentes y su retención fuera de este equipo deben configurarse en un destino privado elegido por el propietario; el respaldo de esta activación está verificado y disponible localmente.

Los procedimientos detallados de recuperación y reversión están en [OPERACION.md](OPERACION.md).
