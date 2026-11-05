# Operaciones CRUD, persistencia y permisos

Las operaciones de la interfaz llaman a rutas REST. Laravel autentica y autoriza cada cambio; Eloquent persiste en PostgreSQL. Los nombres exactos de tablas y relaciones están en [modelo-datos.md](modelo-datos.md). Una opción visible en React no concede acceso por sí sola.

| Operación | Ruta API | Tablas principales | Quién puede usarla | Regla de integridad/ámbito |
|---|---|---|---|---|
| Consultar catálogo | `GET /mascotas`, `GET /mascotas/{id}` | `mascotas`, `publicaciones_adopcion`, `especies`, `razas`, `estados_mascota`, `fotos_mascota` | Público | Solo publicaciones abiertas y mascotas disponibles en el catálogo; filtros y paginación se resuelven en servidor. |
| Registrar ficha | `POST /mascotas` | `mascotas` | Administrador, refugio | Responsable se deriva del token. El backend valida especie, raza y campos permitidos. |
| Editar ficha | `PUT /mascotas/{id}` | `mascotas` | Administrador; refugio propietario | Policy verifica rol y propiedad. No permite cambiar la ficha formalmente adoptada. |
| Eliminar ficha | `DELETE /mascotas/{id}` | `mascotas` y relaciones | Administrador; refugio propietario | Rechaza si hay fotos, publicación, adopción, cita, historial, vacuna o asignación relacionada. Las FK son defensa adicional. |
| Administrar fotos | `POST /mascotas/{id}/fotos`, `PATCH .../principal`, `DELETE .../{foto}` | `fotos_mascota` y almacenamiento de archivos | Administrador; refugio propietario | Valida formatos jpg/jpeg/png/webp y máximo 5 MB; cada operación confirma que la foto pertenece a esa mascota. |
| Publicar o editar adopción | `POST /mascotas/{id}/publicaciones`, `PUT /publicaciones/{id}` | `publicaciones_adopcion` | Administrador; refugio propietario | Una publicación por mascota; se mantiene el estado y fecha de cierre. |
| Eliminar publicación | `DELETE /publicaciones/{id}` | `publicaciones_adopcion`, `solicitudes_adopcion` | Administrador; refugio propietario | Solo sin solicitudes relacionadas. |
| Presentar solicitud | `POST /publicaciones/{id}/solicitudes` | `solicitudes_adopcion`, `publicaciones_adopcion`, `notifications` | Adoptante | El adoptante sale del token; una solicitud por adoptante/publicación; publicación debe estar abierta y mascota disponible. |
| Consultar/retirar solicitud propia | `GET /mis-solicitudes`, `DELETE /solicitudes/{id}` | `solicitudes_adopcion` | Adoptante propietario | La retirada solo está permitida para solicitud propia pendiente. Cambiar ID ajeno devuelve rechazo. |
| Revisar/formalizar adopción | `GET /solicitudes/para-revisar`, `PATCH /solicitudes/{id}`, `POST /solicitudes/{id}/formalizar` | `solicitudes_adopcion`, `adopciones`, `mascotas`, `publicaciones_adopcion`, `notifications` | Administrador; refugio relacionado | El backend comprueba propiedad y transiciones. La formalización usa transacción/bloqueo, cierra publicación, cambia estado de la mascota y evita adopciones incompatibles. |
| Consultar adopciones y seguimientos | `GET /adopciones`, `GET /seguimientos`, `POST /adopciones/{id}/seguimientos`, `PATCH /seguimientos/{id}` | `adopciones`, `seguimientos_adopcion` | Adoptante propietario; administrador/refugio en su ámbito | Se limita por relación con usuario, refugio y adopción. |
| Administrar cuenta/roles | `GET /usuarios`, `PATCH /usuarios/{id}`, `GET /roles` | `users`, `roles`, `audit_logs` | Administrador | Perfil normal no acepta `role_id`; el admin no puede elevarse a sí mismo, desactivar su cuenta ni dejar el sistema sin administrador activo. |
| Editar perfil/contraseña | `PUT /auth/perfil`, `PUT /auth/contrasena` | `users`, opcionalmente `direcciones`, `personal_access_tokens` | Usuario autenticado | La contraseña actual se valida; nuevas contraseñas se almacenan con hash. Cambio invalida tokens anteriores. |
| Crear/consultar hogares y asignaciones | `POST/GET /hogar-temporal`, `GET/POST /asignaciones-hogar`, `PATCH /asignaciones-hogar/{id}/finalizar` | `hogares_temporales`, `asignaciones_hogar`, `mascotas`, `users` | Hogar consulta/finaliza lo propio; administrador/refugio asigna y puede finalizar registros de su ámbito | Un hogar no consulta ni altera asignaciones ajenas. La asignación conserva el historial y valida fechas. |
| Gestionar citas e historial | `GET/POST /citas`, `PATCH /citas/{id}`, `GET /mascotas/{id}/historial-medico`, `POST /historial-medico` | `citas_veterinarias`, `historial_medico`, `notifications` | Veterinario asignado; adoptante solicita sus citas | Veterinario solo accede a mascotas con relación/cita autorizada. Los cambios de cita validan horario/estado. |
| Registrar vacunas | `GET /catalogos/vacunas`, `POST /vacunaciones` | `vacunas`, `mascota_vacuna`, `historial_medico` | Veterinario autorizado | Se requiere relación clínica autorizada; se preserva el historial de dosis. |
| Registrar donación informativa | `POST /donaciones`, `GET /donaciones` | `donaciones`, `users`, `refugios` | Adoptante registra/consulta lo propio; admin/refugio consulta su ámbito | No se procesa cobro ni se guardan datos de tarjeta. |
| Consultar métricas y exportar | `GET /panel`, `GET /reportes/resumen.csv` | Tablas del módulo | Panel por rol; CSV admin/refugio | Los agregados salen de consultas PostgreSQL; reporte del refugio limita por responsable autenticado. |

## Resumen por verbo HTTP

- **Create (`POST`)**: alta de mascotas, publicaciones, solicitudes, citas, historial, vacunaciones, hogares, asignaciones, aportes y seguimientos.
- **Read (`GET`)**: catálogo público, detalle, listas de cada usuario, paneles, catálogos, reportes y registros autorizados.
- **Update (`PUT`/`PATCH`)**: fichas, publicaciones, decisión de solicitudes, citas, perfil, catálogos, estados de asignación y datos administrativos.
- **Delete (`DELETE`)**: fichas y publicaciones únicamente cuando no tienen historial; el adoptante puede retirar su propia solicitud pendiente. El diseño conserva el historial de adopciones y atenciones.

## Flujo de adopción que se puede presentar

1. El visitante consulta `/mascotas`; los filtros se aplican contra PostgreSQL.
2. Adoptante inicia sesión y presenta una solicitud desde el detalle de una publicación disponible.
3. Refugio propietario consulta sus solicitudes recibidas y las pasa por estados permitidos.
4. Al formalizar una solicitud aprobada, la API valida y bloquea la publicación/mascota, escribe la adopción en una transacción y resuelve solicitudes competidoras.
5. Adoptante consulta su adopción y seguimiento; se notifican las partes autorizadas.

Para confirmar los registros sembrados antes de iniciar la presentación, ejecuta [consultas-verificacion.sql](consultas-verificacion.sql) en Query Tool. No uses métodos de borrado para eliminar datos relacionados: las respuestas `409` protegen el historial.
