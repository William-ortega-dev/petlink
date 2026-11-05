# PetLink — documentación lógica para el segundo parcial

## Problema y solución

Los refugios y responsables de mascotas necesitan publicar animales disponibles y llevar sus procesos de adopción sin depender de listas dispersas o mensajes sin seguimiento. Adoptantes, profesionales veterinarios y hogares temporales también necesitan consultar solo la información pertinente a su relación con cada mascota.

PetLink centraliza el catálogo, las fichas, solicitudes, adopciones y seguimientos en una API conectada a PostgreSQL. Los cinco roles tienen paneles con tareas distintas; el backend valida el rol, la propiedad del registro y el estado del proceso. Las publicaciones del catálogo se consultan sin iniciar sesión; los datos privados requieren autenticación.

## Arquitectura cliente-servidor en tres capas

| Capa | Responsabilidad | Implementación en el repositorio |
| --- | --- | --- |
| Presentación / cliente | Rutas, formularios, tablas, estados de carga/error y paneles por rol. Envía solicitudes HTTP y no decide permisos. | `frontend/src/App.jsx`, `frontend/src/api.js`, estilos en `frontend/src/*.css`; React 19, Vite y React Router. |
| Lógica de negocio / servidor | Autenticación, validación, políticas, transacciones, notificaciones, reportes y serialización JSON. | `backend/routes/api.php`, `backend/app/Http/Controllers/Api`, `backend/app/Policies`, `backend/app/Http/Middleware`; Laravel 12 y Sanctum. |
| Datos | Persistencia relacional, claves, restricciones, índices y consultas ORM. | `backend/database/migrations`, `backend/database/seeders`, `backend/app/Models`; PostgreSQL. |

El frontend se comunica con la API REST mediante Axios. El API verifica token y rol en cada ruta protegida; ocultar una opción en React nunca es la única barrera. Las migraciones Laravel son la definición ejecutable del esquema. La inicialización SQL para pgAdmin/Supabase está en `docs/supabase-inicializacion.sql` y genera datos ficticios idempotentes.

## Módulos, actores, tablas y operaciones

| Módulo | Actor | Tablas principales | Operaciones y relaciones |
| --- | --- | --- | --- |
| Catálogo y fotografías | Público; administrador/refugio administra | `mascotas`, `especies`, `razas`, `estados_mascota`, `fotos_mascota`, `publicaciones_adopcion` | Consultar y filtrar catálogo/detalle; crear y actualizar mascotas y publicaciones; subir, elegir y eliminar fotos; eliminar publicación sin solicitudes; eliminar ficha solo sin referencias ni fotos. Una especie contiene razas y mascotas; cada mascota puede tener muchas fotos y una publicación. |
| Solicitudes y adopciones | Adoptante; administrador/refugio revisa | `solicitudes_adopcion`, `publicaciones_adopcion`, `adopciones`, `seguimientos_adopcion`, `notifications` | Crear y consultar solicitudes propias, revisar transiciones, retirar una solicitud propia pendiente, formalizar una solicitud aprobada y consultar adopciones/seguimientos. Una publicación recibe solicitudes; cada solicitud/adopción es única; la formalización bloquea filas, cierra la publicación y resuelve solicitudes concurrentes dentro de una transacción. |
| Administración y seguridad | Administrador | `users`, `roles`, catálogos, `audit_logs` | Consultar estadísticas globales, consultar/actualizar usuarios y roles con salvaguardas, mantener especies/razas/estados y consultar auditoría. No se permite autoelevar el rol ni desactivar o degradar al último administrador. |
| Refugios | Refugio / administrador | `refugios`, `direcciones`, `mascotas`, `publicaciones_adopcion`, `solicitudes_adopcion`, `adopciones` | Administrar únicamente mascotas/publicaciones propias, revisar solicitudes recibidas, consultar adopciones y exportar estadísticas de su ámbito. `mascotas.responsable_id` delimita la propiedad. |
| Veterinaria | Veterinario; adoptante solicita cita | `veterinarios`, `citas_veterinarias`, `historial_medico`, `vacunas`, `mascota_vacuna` | Consultar citas autorizadas, cambiar estado, registrar consultas y vacunas relacionadas con las mascotas a las que tiene acceso. Los historiales son registros preservados; no ofrecen borrado ordinario. |
| Hogares temporales | Responsable de hogar; administrador/refugio asigna | `hogares_temporales`, `asignaciones_hogar`, `mascotas`, `direcciones` | Consultar asignaciones propias, fechas y notas autorizadas; el asignador autorizado crea/finaliza asignaciones. La relación N:M mascota-hogar se conserva en `asignaciones_hogar`. |
| Donaciones y reportes | Adoptante registra aporte; administrador/refugio consulta | `donaciones`, `refugios`, `users` | Registrar aportes informativos sin procesar pagos. El reporte CSV agrega conteos desde PostgreSQL y delimita datos del refugio al responsable autenticado. |
| Cuenta | Todos | `users`, `roles`, `direcciones`, `personal_access_tokens`, `password_reset_tokens` | Registro de adoptante, autenticación y cierre de token Sanctum, actualización de perfil/contraseña y recuperación de cuenta mediante el broker Laravel. El envío de correo requiere SMTP configurado. |

La lista exacta de endpoints está en [api.md](api.md); el esquema y sus claves están en [modelo-datos.md](modelo-datos.md) y el diagrama en [diagrama-er.md](diagrama-er.md).

## Integridad y persistencia

- Se usa una tabla común `users` con PK `users.id`; `users.role_id` referencia `roles.id`. Correo y contraseña son credenciales, no claves relacionales.
- Las FK, `UNIQUE`, `CHECK` e índices se declaran en las migraciones. Varias relaciones históricas usan `RESTRICT` para impedir que la eliminación de una ficha borre solicitudes, consultas, vacunas, acogidas o adopciones.
- La API usa transacciones y bloqueos al solicitar, revisar y formalizar adopciones; las restricciones únicas complementan la validación concurrente.
- Las nuevas rutas DELETE solo permiten eliminar datos sin historial: la publicación no puede tener solicitudes; la mascota no puede tener fotos ni relaciones clínicas, de acogida, publicación o adopción; la solicitud solo se retira por su adoptante mientras está pendiente. Las FK de PostgreSQL siguen siendo la última defensa ante registros relacionados.
- Las migraciones y seeders son la fuente reproducible de la aplicación. `docs/supabase-inicializacion.sql` es un script de inicialización idempotente con esquema/datos ficticios, no un volcado de los datos actuales de una instancia PostgreSQL.

## Informes

`GET /api/reportes/resumen.csv` calcula conteos de mascotas bajo gestión, publicaciones activas, solicitudes pendientes, adopciones formalizadas, citas y acogidas. El administrador recibe el consolidado; el refugio recibe solo la actividad asociada a mascotas con su `responsable_id`. No se usan valores escritos a mano en la interfaz.

## Instalación y verificación

Las instrucciones de PostgreSQL, variables locales, migraciones, seeders, backend y frontend están en [README.md](../README.md). Para ejecutar pruebas automatizadas se requiere una base PostgreSQL `petlink_test` separada, con credenciales válidas: PHPUnit usa `RefreshDatabase` y reconstruye esa base. No ejecutes la suite contra una base con datos que quieras conservar. `npm run lint` y `npm run build` verifican el cliente.

El esquema versionado no reemplaza el MER externo no accesible desde este entorno. También falta obtener un backup real de la base desplegada: este repositorio contiene el SQL de inicialización, pero no se recibió una conexión de solo lectura/backup del PostgreSQL del usuario. El paso para generar el archivo desde pgAdmin está en [backup-postgres-pgadmin.md](backup-postgres-pgadmin.md). El video queda fuera de esta actualización.
