-- Consultas de solo lectura para verificar la instancia académica PetLink.
-- Ejecutar después de docs/supabase-inicializacion.sql.

-- 1) Inventario de tablas del esquema public (el inicializador crea 32).
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_type = 'BASE TABLE'
 ORDER BY table_name;

-- 2) Las cinco cuentas, sus roles y el estado. No se consulta password.
SELECT role_demo.nombre AS rol, user_demo.email, user_demo.activo
  FROM users user_demo
  JOIN roles role_demo ON role_demo.id = user_demo.role_id
 WHERE lower(user_demo.email) IN (
       'admin@petlink.test', 'adoptante@petlink.test', 'refugio@petlink.test',
       'veterinario@petlink.test', 'hogar@petlink.test'
  )
 ORDER BY role_demo.id;

-- 3) Fichas demo, especie/raza/estado y publicación asociada.
SELECT pet.codigo_identificacion, pet.nombre AS mascota,
       species.nombre AS especie, breed.nombre AS raza,
       pet_state.nombre AS estado, publication.estado AS estado_publicacion
  FROM mascotas pet
  JOIN especies species ON species.id = pet.especie_id
  LEFT JOIN razas breed ON breed.id = pet.raza_id
  JOIN estados_mascota pet_state ON pet_state.id = pet.estado_id
  LEFT JOIN publicaciones_adopcion publication ON publication.mascota_id = pet.id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
 ORDER BY pet.codigo_identificacion;

-- 4) Solicitudes y su estado, relacionadas con mascota, adoptante y publicación.
SELECT pet.nombre AS mascota, adopter.email AS adoptante,
       publication.estado AS publicacion, adoption_request.estado AS solicitud
  FROM solicitudes_adopcion adoption_request
  JOIN publicaciones_adopcion publication ON publication.id = adoption_request.publicacion_id
  JOIN mascotas pet ON pet.id = publication.mascota_id
  JOIN users adopter ON adopter.id = adoption_request.adoptante_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
 ORDER BY pet.nombre, adoption_request.created_at;

-- 5) Conteos de filas del conjunto de presentación por módulo.
SELECT 'mascotas' AS modulo, count(*) AS registros
  FROM mascotas WHERE codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'publicaciones', count(*)
  FROM publicaciones_adopcion publication
  JOIN mascotas pet ON pet.id = publication.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'solicitudes', count(*)
  FROM solicitudes_adopcion adoption_request
  JOIN publicaciones_adopcion publication ON publication.id = adoption_request.publicacion_id
  JOIN mascotas pet ON pet.id = publication.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'adopciones', count(*)
  FROM adopciones adoption
  JOIN mascotas pet ON pet.id = adoption.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'citas', count(*)
  FROM citas_veterinarias appointment
  JOIN mascotas pet ON pet.id = appointment.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'historial_medico', count(*)
  FROM historial_medico medical_entry
  JOIN mascotas pet ON pet.id = medical_entry.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'vacunaciones', count(*)
  FROM mascota_vacuna vaccine_application
  JOIN mascotas pet ON pet.id = vaccine_application.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL
SELECT 'donaciones', count(*)
  FROM donaciones donation
  JOIN refugios shelter ON shelter.id = donation.refugio_id
 WHERE shelter.nombre = 'Refugio PetLink Demo'
UNION ALL
SELECT 'asignaciones_hogar', count(*)
  FROM asignaciones_hogar assignment
  JOIN mascotas pet ON pet.id = assignment.mascota_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%';

-- 6) Informe público de conteo por estado para relacionar datos y reporte.
SELECT pet_state.nombre AS estado, count(*) AS total
  FROM mascotas pet
  JOIN estados_mascota pet_state ON pet_state.id = pet.estado_id
 WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
 GROUP BY pet_state.nombre
 ORDER BY pet_state.nombre;
