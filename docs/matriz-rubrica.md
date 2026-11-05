# PetLink — guía de entrega frente a la rúbrica

Esta guía ubica la evidencia de cada requisito del segundo parcial en los archivos del proyecto y distingue lo implementado de lo que aún necesita una verificación en la instancia PostgreSQL. El video no se incluye por indicación del estudiante.

## Matriz de cumplimiento

| Requisito | Evidencia en PetLink | Estado comprobado |
|---|---|---|
| Aplicación cliente-servidor | Cliente React/Vite en `frontend/`; API REST Laravel/Sanctum en `backend/`; datos PostgreSQL. | Implementado. Vercel sirve el cliente y Render responde el healthcheck de la API. |
| Separación por capas | Presentación, lógica de negocio y datos se describen en [entrega-segundo-parcial.md](entrega-segundo-parcial.md). | Implementado; React no decide permisos de servidor. |
| Modelo relacional con al menos 12 tablas relacionadas | [modelo-datos.md](modelo-datos.md), migraciones en `backend/database/migrations/` y [supabase-inicializacion.sql](supabase-inicializacion.sql). El esquema declara 21 tablas del dominio, 2 de soporte de PetLink y 9 de infraestructura/framework: 32 en total. | Implementado en el código. La equivalencia con el MER externo del curso queda pendiente porque ese enlace no estuvo disponible. |
| PK, FK e integridad | El diagrama y el diccionario documentan PK/FK, cardinalidades, unicidad, restricciones y borrado restringido. | Implementado en migraciones; no se cambiaron claves para separar roles. |
| CRUD con persistencia | [operaciones-crud.md](operaciones-crud.md) relaciona métodos HTTP, tablas, permisos y reglas. El backend usa Eloquent/PostgreSQL y la formalización de adopciones usa transacciones. | Las rutas y pruebas automatizadas están implementadas. En producción se verificaron lecturas, autenticación y paneles; no se hicieron escrituras/eliminaciones de prueba sobre el dataset público compartido. |
| Funcionalidades por actor/rol | Administrador, adoptante, refugio, veterinario y hogar temporal se detallan en [api.md](api.md) y [entrega-segundo-parcial.md](entrega-segundo-parcial.md). | Implementado con validación en controladores/policies del backend. |
| Consulta/reporte útil | `GET /api/reportes/resumen.csv` agrega información real de PostgreSQL y limita las cifras de refugio por `responsable_id`. | Implementado en el backend. La respuesta requiere registros cargados para mostrar cifras distintas de cero. |
| Esquema SQL y datos de muestra | [supabase-inicializacion.sql](supabase-inicializacion.sql) crea el esquema y filas ficticias relacionadas; [consultas-verificacion.sql](consultas-verificacion.sql) contiene comprobaciones de solo lectura. | Ejecutado en Supabase. La verificación confirmó 5 mascotas de muestra, 4 publicaciones, 4 solicitudes y registros relacionados de adopción, cita, historial médico, vacuna, donación y hogar temporal. La API pública devuelve 3 mascotas disponibles. El SQL no reemplaza un backup real. |
| Modelo/diagrama ER | [diagrama-er.md](diagrama-er.md) contiene el diagrama Mermaid del esquema de las migraciones. | Disponible. Representa el modelo versionado; no se pudo cotejar con el MER de Lucidchart externo. |
| Documentación de problema, módulos y capas | [entrega-segundo-parcial.md](entrega-segundo-parcial.md). | Disponible. |
| Endpoints y permisos | [api.md](api.md). | Disponible; las rutas privadas requieren token Sanctum y aplican permisos del servidor. |
| Instalación y ejecución | [README.md](../README.md) incluye requisitos, PostgreSQL, backend, frontend y pruebas. | Disponible. |
| Backup real PostgreSQL | [backup-postgres-pgadmin.md](backup-postgres-pgadmin.md) explica cómo exportarlo y restaurarlo. | Archivo `.backup` pendiente: requiere exportar desde la instancia del estudiante; el repositorio no contiene una copia del servidor. |
| Pruebas | `backend/tests/` cubre autenticación, autorización, adopción, perfiles, citas, fotografías, reportes y consistencia de hashes de las cinco cuentas demo; ESLint/build comprueban frontend. | La verificación en vivo confirmó healthcheck, catálogo y login/panel de los cinco roles con HTTP 200. La última suite local registrada tuvo 5 pruebas PHP aprobadas y 24 de integración bloqueadas por falta de `pdo_pgsql`; `npm run lint` y `npm run build` pasaron. |
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

1. **Completado:** el SQL de demostración se ejecutó en Supabase y sus conteos se verificaron.
2. **Completado:** se probaron inicio de sesión y panel de los cinco roles en la publicación; el administrador muestra sus indicadores.
3. Ejecuta la suite PHPUnit en un entorno PHP con `pdo_pgsql` habilitado y una base separada llamada `petlink_test`.
4. Exporta un backup PostgreSQL real desde pgAdmin y restaura una copia para demostrar que el archivo sirve.
5. Prepara el archivo comprimido final con código, SQL, backup y documentación.
6. Compara `diagrama-er.md` con el MER original del curso, si se obtiene el archivo/enlace.
7. El video de exposición no se realizará por instrucción del estudiante; la rúbrica sí lo solicita.

### Estado observado de la publicación

Verificación posterior a los commits `70d1e7b` y `4b648a7`, 4 de noviembre de 2026 (hora Colombia):

- `GET /api/health` respondió HTTP 200 con `database: connected`.
- `GET /api/mascotas?per_page=5` respondió HTTP 200 y devolvió 3 mascotas disponibles.
- Las cinco cuentas de prueba iniciaron sesión y cada panel respondió HTTP 200 con el rol correspondiente.
- El panel de administrador mostró 1 adopción y donaciones registradas por 25.000 COP.
- La suite de integración completa y el CRUD de escritura/eliminación aún necesitan una verificación aislada; no se modificó ni borró el dataset de producción para probarlos.

## Alcance de la demostración

Las cuentas `@petlink.test` son públicas y tienen roles funcionales, incluido administrador. Úsalas solo en la base aislada de estudio con los registros ficticios del inicializador. No agregues personas, mascotas reales ni información privada a esa base. Las contraseñas de muestra están en el README y sus hashes, no las contraseñas, en PostgreSQL.
