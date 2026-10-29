# API REST

Base local: http://127.0.0.1:8000/api. La API devuelve JSON. Rutas privadas usan Authorization: Bearer <token> de Sanctum; los tokens expiran a los 120 minutos.

| Área | Rutas |
| --- | --- |
| Estado | GET /health |
| Catálogo público | GET /mascotas, GET /mascotas/{id}, GET /catalogos/especies, GET /catalogos/estados-mascota, GET /catalogos/razas, GET /refugios, GET /veterinarios |
| Autenticación | POST /auth/registro, POST /auth/iniciar-sesion, POST /auth/cerrar-sesion, GET /auth/usuario, PUT /auth/perfil, PUT /auth/contrasena |
| Mascotas | POST /mascotas, GET /mis-mascotas, PUT /mascotas/{id}, POST /mascotas/{id}/fotos |
| Publicaciones | POST /mascotas/{id}/publicaciones, PUT /publicaciones/{id} |
| Adopción | POST /publicaciones/{id}/solicitudes, GET /mis-solicitudes, GET /solicitudes/para-revisar, PATCH /solicitudes/{id}, POST /solicitudes/{id}/formalizar, GET /adopciones |
| Administración | GET /panel, GET /usuarios, PATCH /usuarios/{id}, GET /roles, POST /catalogos/especies, POST /catalogos/razas, POST /refugios |
| Veterinaria | GET/POST /citas, PATCH /citas/{id}, GET /mascotas/{id}/historial-medico, POST /historial-medico, GET /catalogos/vacunas, POST /vacunas, POST /vacunaciones, POST /veterinarios |
| Hogares | GET/POST /hogar-temporal, GET /hogares-temporales, GET/POST /asignaciones-hogar, PATCH /asignaciones-hogar/{id}/finalizar |
| Donaciones y seguimiento | GET/POST /donaciones, GET /seguimientos, POST /adopciones/{id}/seguimientos, PATCH /seguimientos/{id} |

El catálogo acepta q, especie_id, sexo, tamano, page y per_page. per_page se limita a 30.

