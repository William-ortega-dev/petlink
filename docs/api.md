# API REST

Base local: http://127.0.0.1:8000/api. La API devuelve JSON. Rutas privadas usan Authorization: Bearer <token> de Sanctum; los tokens expiran a los 120 minutos.

| Área | Rutas |
| --- | --- |
| Estado | GET /health |
| Catálogo público | GET /mascotas, GET /mascotas/{id}, GET /catalogos/especies, GET /catalogos/estados-mascota, GET /catalogos/razas, GET /refugios, GET /veterinarios |
| Autenticación | POST /auth/registro, POST /auth/iniciar-sesion, POST /auth/cerrar-sesion, GET /auth/usuario, PUT /auth/perfil, PUT /auth/contrasena, POST /auth/recuperar-contrasena, POST /auth/restablecer-contrasena |
| Notificaciones | GET /notificaciones, PATCH /notificaciones/{id}/leida, PATCH /notificaciones/leidas |
| Mascotas | POST /mascotas, GET /mis-mascotas, PUT /mascotas/{id}, POST /mascotas/{id}/fotos, PATCH /mascotas/{id}/fotos/{foto}/principal, DELETE /mascotas/{id}/fotos/{foto} |
| Publicaciones | POST /mascotas/{id}/publicaciones, PUT /publicaciones/{id} |
| Adopción | POST /publicaciones/{id}/solicitudes, GET /mis-solicitudes, GET /solicitudes/para-revisar, PATCH /solicitudes/{id}, POST /solicitudes/{id}/formalizar, GET /adopciones |
| Administración y reportes | GET /panel, GET /usuarios, PATCH /usuarios/{id}, GET /roles, GET /auditoria (administrador), GET /reportes/resumen.csv (administrador/refugio), POST/PATCH /catalogos/especies, POST/PATCH /catalogos/razas, PATCH /catalogos/estados-mascota/{id}, POST /vacunas |
| Veterinaria | GET/POST /citas, PATCH /citas/{id}, GET /mascotas/{id}/historial-medico, POST /historial-medico, GET /catalogos/vacunas, POST /vacunas, POST /vacunaciones, POST /veterinarios |
| Hogares | GET/POST /hogar-temporal, GET /hogares-temporales, GET/POST /asignaciones-hogar, PATCH /asignaciones-hogar/{id}/finalizar |
| Donaciones y seguimiento | GET/POST /donaciones, GET /seguimientos, POST /adopciones/{id}/seguimientos, PATCH /seguimientos/{id} |

El catálogo acepta q, especie_id, sexo, tamano, page y per_page. per_page se limita a 30.

## Ámbito de acceso

| Rol | Permisos principales en API |
| --- | --- |
| Administrador | Estadísticas globales; usuarios/roles; catálogos; todas las mascotas, solicitudes, adopciones, hogares, citas, donaciones, historiales y seguimientos. No puede desactivar ni cambiar su propio rol, y debe quedar al menos un administrador activo. |
| Adoptante | Catálogo público; presentar y consultar sus solicitudes; ver sus adopciones, seguimientos y citas; perfil/contraseña; registrar sus aportes. Las consultas por ID de otra persona se rechazan. |
| Refugio | Mascotas, publicaciones, solicitudes, adopciones, citas y asignaciones que pertenezcan a sus registros. El backend filtra por `responsable_id`. |
| Veterinario | Citas asignadas y registros médicos de mascotas con citas activas o realizadas con su perfil. Para escribir historial o vacunas necesita una cita confirmada o realizada. No administra usuarios ni consulta donaciones. |
| Hogar temporal | Mascotas y asignaciones ligadas a su hogar; puede finalizar una asignación propia. No consulta solicitudes, adopciones ni registros médicos profesionales. |

Los roles se validan en controladores y políticas del backend; las opciones visibles en React no constituyen el control de autorización. Cada usuario solo consulta y marca como leídas sus propias notificaciones. Los reportes del refugio cuentan únicamente datos de mascotas cuyo `responsable_id` es el usuario autenticado. La auditoría es administrativa y no contiene cuerpos de solicitud ni contraseñas.

## Negocio y datos

- `GET /health` comprueba la conexión a PostgreSQL y responde `503` sin detalles internos si la base no está disponible.
- Aplicar a una publicación crea una notificación para su responsable. Las revisiones y formalizaciones notifican al adoptante. La creación y actualización de citas notifican al veterinario o solicitante correspondiente.
- Solicitudes, formalización y notificaciones se coordinan con transacciones; las peticiones concurrentes para una misma publicación no crean adopciones incompatibles.
- `GET /reportes/resumen.csv` entrega conteos del estado actual de PostgreSQL, sin datos personales.
- Las operaciones autenticadas de escritura generan entradas en `audit_logs`. Se guardan el actor, método/ruta y, cuando existe, el tipo/ID del registro afectado.

