# Modelo de datos inicial

## Fuente y alcance

El enlace del MER de Lucidchart del prompt no fue accesible desde el entorno. Este esquema es una propuesta basada en las entidades funcionales del prompt; no se afirma que replique el diagrama. Debe compararse con el MER original antes de producción.

Hay 21 tablas del dominio, además de personal_access_tokens de Sanctum y las tablas de soporte Laravel.

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

## Integridad

PostgreSQL es el único driver configurado en config/database.php. Las migraciones declaran claves foráneas con RESTRICT, CASCADE o SET NULL según el historial que deban conservar. Hay restricciones CHECK para edad, sexo, tamaño, estados de solicitud, importes y fechas de acogida.

La formalización usa transacción y bloqueos de filas para evitar adopciones incompatibles. Aprobar una solicitud no crea adopción; la formalización es un paso distinto. La disponibilidad en catálogo se restringe a publicaciones abiertas con mascota disponible.

## Reconstrucción

Las migraciones están en backend/database/migrations. Ejecuta php artisan migrate --seed. DatabaseSeeder usa updateOrCreate para catálogos y cuentas demo, por lo que las ejecuciones repetidas no duplican usuarios.

