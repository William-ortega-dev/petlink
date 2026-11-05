# PetLink — guía de entrega frente a la rúbrica

Esta guía ubica la evidencia de cada requisito del segundo parcial en los archivos del proyecto y distingue lo implementado de lo que aún necesita una verificación en la instancia PostgreSQL. El video no se incluye por indicación del estudiante.

## Matriz de cumplimiento

| Requisito | Evidencia en PetLink | Estado comprobado |
|---|---|---|
| Aplicación cliente-servidor | Cliente React/Vite en `frontend/`; API REST Laravel/Sanctum en `backend/`; datos PostgreSQL. | Implementado. Vercel sirve el cliente y Render responde el healthcheck de la API. |
| Separación por capas | Presentación, lógica de negocio y datos se describen en [entrega-segundo-parcial.md](entrega-segundo-parcial.md). | Implementado; React no decide permisos de servidor. |
| Modelo relacional con al menos 12 tablas relacionadas | [modelo-datos.md](modelo-datos.md), migraciones en `backend/database/migrations/` y [supabase-inicializacion.sql](supabase-inicializacion.sql). El esquema declara 21 tablas del dominio, 2 de soporte de PetLink y 9 de infraestructura/framework: 32 en total. | Implementado en el código. La equivalencia con el MER externo del curso queda pendiente porque ese enlace no estuvo disponible. |
| PK, FK e integridad | El diagrama y el diccionario documentan PK/FK, cardinalidades, unicidad, restricciones y borrado restringido. | Implementado en migraciones; no se cambiaron claves para separar roles. |
| CRUD con persistencia | [operaciones-crud.md](operaciones-crud.md) relaciona métodos HTTP, tablas, permisos y reglas. El backend usa Eloquent/PostgreSQL y la formalización de adopciones usa transacciones. | Implementado en rutas. La instancia pública está conectada, pero hoy devuelve cero mascotas; falta ejecutar el SQL de demo para verificar CRUD en esa instancia. |
| Funcionalidades por actor/rol | Administrador, adoptante, refugio, veterinario y hogar temporal se detallan en [api.md](api.md) y [entrega-segundo-parcial.md](entrega-segundo-parcial.md). | Implementado con validación en controladores/policies del backend. |
| Consulta/reporte útil | `GET /api/reportes/resumen.csv` agrega información real de PostgreSQL y limita las cifras de refugio por `responsable_id`. | Implementado en el backend. La respuesta requiere registros cargados para mostrar cifras distintas de cero. |
| Esquema SQL y datos de muestra | [supabase-inicializacion.sql](supabase-inicializacion.sql) crea el esquema y filas ficticias relacionadas; [consultas-verificacion.sql](consultas-verificacion.sql) contiene comprobaciones de solo lectura. | Preparado. El SQL aún debe ejecutarse en Supabase para que aparezca la muestra pública. No reemplaza un backup real. |
| Modelo/diagrama ER | [diagrama-er.md](diagrama-er.md) contiene el diagrama Mermaid del esquema de las migraciones. | Disponible. Representa el modelo versionado; no se pudo cotejar con el MER de Lucidchart externo. |
| Documentación de problema, módulos y capas | [entrega-segundo-parcial.md](entrega-segundo-parcial.md). | Disponible. |
| Endpoints y permisos | [api.md](api.md). | Disponible; las rutas privadas requieren token Sanctum y aplican permisos del servidor. |
| Instalación y ejecución | [README.md](../README.md) incluye requisitos, PostgreSQL, backend, frontend y pruebas. | Disponible. |
| Backup real PostgreSQL | [backup-postgres-pgadmin.md](backup-postgres-pgadmin.md) explica cómo exportarlo y restaurarlo. | Archivo `.backup` pendiente: requiere exportar desde la instancia del estudiante; el repositorio no contiene una copia del servidor. |
| Pruebas | `backend/tests/` cubre autenticación, autorización, adopción, perfiles, citas, fotografías, reportes y consistencia de hashes de las cinco cuentas demo; ESLint/build comprueban frontend. | 5 pruebas PHP pasan; 24 pruebas de integración no alcanzan sus aserciones porque falta el driver `pdo_pgsql` en este entorno. `npm run lint` y `npm run build` pasan. |
| Video de exposición | No se entrega. | Excluido por solicitud expresa del estudiante. |

## Documentos para entregar

1. Código fuente: repositorio Git y ZIP limpio de la carpeta del proyecto.
2. Esquema/datos de demostración: [supabase-inicializacion.sql](supabase-inicializacion.sql).
3. Modelo de datos, PK/FK: [modelo-datos.md](modelo-datos.md).
4. Diagrama entidad-relación: [diagrama-er.md](diagrama-er.md).
5. Problema, módulos y arquitectura en capas: [entrega-segundo-parcial.md](entrega-segundo-parcial.md).
6. Endpoints, permisos y reglas: [api.md](api.md) y [operaciones-crud.md](operaciones-crud.md).
7. Instalación: [README.md](../README.md).
8. Exportación del backup real: seguir [backup-postgres-pgadmin.md](backup-postgres-pgadmin.md) desde pgAdmin.
9. Verificación de datos relacionales: [consultas-verificacion.sql](consultas-verificacion.sql), después de ejecutar el SQL inicializador.

## Pasos pendientes para cerrar la evidencia

1. En Supabase, abre el proyecto de estudio, entra a **SQL Editor**, pega y ejecuta `supabase-inicializacion.sql`.
2. Ejecuta las consultas de `consultas-verificacion.sql` y confirma que aparecen las cinco cuentas y mascotas de demostración.
3. En la app publicada, inicia sesión desde `/iniciar-sesion` y recorre cada rol. Los botones solo rellenan el formulario; el backend sigue autenticando las cuentas.
4. Ejecuta las pruebas PHPUnit en un entorno PHP con `pdo_pgsql` habilitado y una base separada llamada `petlink_test`.
5. Exporta el backup desde pgAdmin después de cargar la muestra. Guárdalo fuera del repositorio público si contiene información privada.
6. Compara `diagrama-er.md` con el MER que entregó el curso, si se obtiene el archivo/enlace.

### Estado observado de la publicación

- `https://petlink-ten.vercel.app/` respondió HTTP 200 y sirvió el cliente actualizado.
- `https://petlink-api-sz68.onrender.com/api/health` respondió `database: connected`.
- `GET /api/mascotas?per_page=3` respondió HTTP 200 con cero registros al 4 de noviembre de 2026; el intento de inicio de sesión de Adoptante con la cuenta demo respondió HTTP 422. El SQL de demostración todavía no está cargado en la base conectada.
- Los hashes del SQL sí corresponden a las cinco contraseñas públicas. Se comprobó con `DemoAccountSeedTest`; el rechazo remoto se debe a que las cuentas/datos aún no existen en esa base, no a una diferencia de contraseña.

## Alcance de la demostración

Las cuentas `@petlink.test` son públicas y tienen roles funcionales, incluido administrador. Úsalas solo en la base aislada de estudio con los registros ficticios del inicializador. No agregues personas, mascotas reales ni información privada a esa base. Las contraseñas de muestra están en el README y sus hashes, no las contraseñas, en PostgreSQL.
