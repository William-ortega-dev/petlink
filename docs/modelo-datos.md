# Modelo de datos inicial

## Fuente y alcance

El enlace del MER de Lucidchart del prompt no fue accesible desde el entorno. Este esquema es una propuesta basada en las entidades funcionales del prompt; no se afirma que replique el diagrama. Debe compararse con el MER original antes de producción.

Hay 21 tablas del dominio original y dos tablas aditivas de soporte (`notifications` y `audit_logs`), además de `personal_access_tokens` de Sanctum y las tablas Laravel.

## Entidades

| Tabla | Propósito y relaciones |
| --- | --- |
| roles | Catálogo de perfiles; un rol pertenece a muchos usuarios. |
| users | Cuentas Laravel; cada usuario tiene rol y dirección opcional. |
| direcciones | Ubicaciones normalizadas de usuarios, refugios y hogares. |
| especies | Catálogo con razas y mascotas asociadas. |
| razas | Raza dependiente de especie, única por especie y nombre. |
| estados_mascota | Catálogo de estados y visibilidad pública. |
| refugios | Responsable, contacto y dirección; administra mascotas y recibe donaciones. |
| mascotas | Ficha, especie, raza, estado, responsable y refugio opcional. |
| fotos_mascota | Varias fotos por mascota; PostgreSQL guarda las rutas, archivos bajo backend/storage/app/public. |
| publicaciones_adopcion | Una publicación por mascota, estado y fechas de publicación/cierre. |
| solicitudes_adopcion | Une una publicación con un adoptante; no admite duplicados por persona y publicación. |
| adopciones | Formalización separada de una solicitud aprobada; mascota y solicitud únicas. |
| hogares_temporales | Capacidad y preferencias del responsable de hogar temporal. |
| asignaciones_hogar | Historial de mascotas asignadas a hogares, fechas y estado. |
| veterinarios | Perfil y número de licencia vinculado uno a uno con un usuario. |
| citas_veterinarias | Cita de una mascota con veterinario y solicitante. |
| historial_medico | Registros clínicos escritos por usuarios autorizados. |
| vacunas | Catálogo de vacunas. |
| mascota_vacuna | Aplicaciones de vacunas, separadas del catálogo. |
| donaciones | Tipo, destino, importe COP opcional y estado; no procesa pagos. |
| seguimientos_adopcion | Observaciones y resultados vinculados a una adopción. |
| notifications | Notificaciones persistentes de cambios de solicitudes, adopciones y citas; asociadas polimórficamente al usuario destinatario. |
| audit_logs | Registro de actor, acción crítica y entidad afectada; conserva el registro si se elimina la cuenta del actor. |

## Relaciones principales

- roles 1:N users; direcciones 1:N users, refugios y hogares.
- especies 1:N razas y mascotas; razas 1:N mascotas.
- users 1:N mascotas como responsables; refugios 1:N mascotas.
- mascotas 1:N fotos; mascotas 1:0..1 publicación.
- publicaciones 1:N solicitudes; users 1:N solicitudes como adoptantes.
- solicitudes 1:0..1 adopciones; mascotas 1:0..1 adopciones.
- hogares N:M mascotas mediante asignaciones.
- veterinarios 1:N citas; mascotas 1:N citas, historial médico y aplicaciones de vacunas.
- vacunas 1:N aplicaciones; adopciones 1:N seguimientos.

## Claves primarias y foráneas verificadas en las migraciones

Las claves primarias son `id` autoincrementales. Los cinco perfiles comparten `users.id`; el rol vive en `roles.id`, y cada usuario referencia exactamente un rol mediante `users.role_id` (FK `RESTRICT`). No existe una tabla intermedia de roles y no hay una PK distinta por perfil. Las credenciales de acceso son `users.email` y `users.password`; `password` guarda un hash y no es una clave relacional.

| Tabla / campo | Tipo de clave | Relación |
| --- | --- | --- |
| `roles.id` | PK | Identificador del catálogo de roles. |
| `users.id` | PK | Identificador común de cuentas. |
| `users.role_id` | FK | `roles.id`; define el perfil del usuario. |
| `users.direccion_id` | FK nullable | `direcciones.id`; dirección de la cuenta. |
| `refugios.responsable_id` | FK unique | `users.id`; responsable del refugio. |
| `mascotas.responsable_id` | FK | `users.id`; refugio/responsable dueño del registro. |
| `mascotas.refugio_id` | FK nullable | `refugios.id`; refugio asociado. |
| `mascotas.especie_id`, `raza_id`, `estado_id` | FKs | `especies.id`, `razas.id`, `estados_mascota.id`. |
| `publicaciones_adopcion.mascota_id` | FK unique | `mascotas.id`; una publicación por mascota. |
| `solicitudes_adopcion.publicacion_id`, `adoptante_id` | FKs | `publicaciones_adopcion.id` y `users.id`; pareja única por adoptante/publicación. |
| `adopciones.solicitud_id`, `mascota_id`, `adoptante_id` | FKs | Solicitud, mascota y `users.id`; solicitud y mascota son únicas. |
| `veterinarios.usuario_id` | FK unique | `users.id`; perfil veterinario uno a uno. |
| `citas_veterinarias.veterinario_id`, `mascota_id`, `solicitada_por` | FKs | Perfiles veterinarios, mascotas y `users.id`. |
| `historial_medico.mascota_id`, `registrado_por`, `veterinario_id` | FKs | Mascota, autor `users.id` y veterinario nullable. |
| `hogares_temporales.responsable_id` | FK unique | `users.id`; responsable del hogar. |
| `asignaciones_hogar.hogar_id`, `mascota_id`, `asignada_por` | FKs | Hogar, mascota y usuario asignador. |
| `seguimientos_adopcion.adopcion_id`, `registrado_por` | FKs | Adopción y usuario que registra. |
| `audit_logs.actor_id` | FK nullable | `users.id`; queda en `NULL` si se elimina el actor. |
| `audit_logs.subject_type`, `subject_id` | Referencia polimórfica | Identifica el tipo y el ID del registro afectado; no es FK porque el sujeto puede pertenecer a distintas tablas. |
| `notifications.notifiable_type`, `notifiable_id` | Relación polimórfica | Normalmente `App\Models\User` y `users.id`; cada consulta se limita a las notificaciones del usuario autenticado. |

Los nombres y reglas anteriores proceden de `database/migrations`; no se cambiaron PK ni FK existentes. Las migraciones nuevas agregan únicamente `notifications` y `audit_logs`.

## Integridad

PostgreSQL es el único driver configurado en config/database.php. Las migraciones declaran claves foráneas con RESTRICT, CASCADE o SET NULL según el historial que deban conservar. Hay restricciones CHECK para edad, sexo, tamaño, estados de solicitud, importes y fechas de acogida.

La solicitud de adopción bloquea la publicación y comprueba el estado disponible; las claves únicas previenen solicitudes duplicadas. La revisión también bloquea la solicitud y valida transiciones. La formalización usa transacción y bloqueos de filas para evitar adopciones incompatibles. Aprobar una solicitud no crea adopción; la formalización es un paso distinto. La disponibilidad en catálogo se restringe a publicaciones abiertas con mascota disponible.

Las notificaciones se escriben en PostgreSQL dentro de las transacciones de los cambios de negocio. El middleware de auditoría envuelve operaciones autenticadas de escritura y registra solo método, ruta, actor y sujeto; no guarda cuerpos de petición, contraseñas ni datos médicos.

## Reconstrucción

Las migraciones están en `backend/database/migrations`. Ejecuta `php artisan migrate --seed`. Los catálogos se actualizan con sus valores base; las cuentas y filas demostrativas se crean con `firstOrCreate` en local/testing, por lo que una ejecución repetida no cambia los usuarios preexistentes ni duplica esas cuentas.

