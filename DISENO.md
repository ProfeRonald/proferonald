# Identidad editorial ProfeRonald

La interfaz pública, el editor y el gestor comparten CSS propio, sin Bootstrap ni jQuery. El código y los recursos históricos de `docs/` se conservan para recuperación; Hosting se construye exclusivamente en `dist/` y no incluye sus hojas de estilo ni aplicaciones antiguas.

## Identidad

- Marfil `#F7F5F0`, tinta `#172D3D`, terracota `#AD503D`; texto secundario `#626F73`.
- Lora para títulos e Inter para lectura y controles. Fuentes variables locales, con sus licencias en `src/fonts/`; MathLive conserva sus fuentes versionadas.
- Monograma PR vectorial y wordmark en `src/assets/brand/`. La compilación genera PNG para redes, versiones de marca e ICO. Las imágenes antiguas conservan sus rutas públicas.
- Componentes compartidos en `src/design.css`; composición del blog y administrador en sus hojas propias. Las funciones de presentación del artículo se comparten entre cliente y servidor.

## Comportamiento

La portada usa seis publicaciones activas por página. El primer artículo de la primera página es el destacado y no se repite en la cuadrícula. Las categorías vienen del catálogo público; la portada muestra hasta seis y ofrece el directorio completo. Búsqueda, categorías, recursos y biografía conservan navegación con historial. El encabezado fijo mide su altura para evitar tapar contenido al entrar como administrador. Los videos se cargan a petición.

El versículo se carga en un marco aislado y se sanea antes de insertarlo. La publicidad es secundaria, conserva su identificación y mantiene un enlace cuando falla su imagen. Las plantillas de contenido siguen saneadas; el editor, los documentos privados y las imágenes de borrador mantienen sus permisos y flujos existentes.

## Validación y reversión

`npm run check` verifica lógica y compilación, y esta última rechaza dependencias de interfaz antiguas dentro del grafo de recursos. Las pruebas de navegador cubren la identidad, ausencia de solicitudes a frameworks o fuentes remotas, escritorio y móvil (320, 375 y 768 px), búsquedas, paginación, lectura, comentarios y los flujos de administración. Las capturas de revisión quedan en `.local/`, fuera del repositorio.

La versión previa al rediseño es `5b6b767`. Para revertir, reconstruir esa revisión en un checkout separado y desplegar conjuntamente Hosting y `functions:public-pages:postPage`, regenerando primero el sitemap público. No restaurar ni modificar la base de datos o reglas para revertir únicamente la presentación. El despliegue no requiere migraciones.
