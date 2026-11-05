-- PetLink: esquema PostgreSQL y datos ficticios para la instancia académica.
-- Derivado de backend/database/migrations y DatabaseSeeder.php.
--
-- Uso: pegar el archivo completo en Supabase > SQL Editor y ejecutar.
-- Solo crea objetos; no contiene DROP, TRUNCATE ni DELETE.
-- Se puede ejecutar de nuevo: los catálogos y datos demo son idempotentes.
-- Si detecta un esquema incompleto, aborta para proteger datos existentes.
--
-- Incluye cinco cuentas públicas de demostración con contraseñas bcrypt.
-- Ejecutar únicamente en una base separada para estudio/demo, nunca con datos
-- reales. El guard inferior aborta si encuentra usuarios o mascotas ajenos a
-- las cuentas y fichas de muestra de PetLink.

BEGIN;
SET LOCAL search_path = public;

DO $petlink_guard$
DECLARE
    existing_tables integer;
BEGIN
    SELECT count(*)
      INTO existing_tables
      FROM unnest(ARRAY[
          'roles', 'direcciones', 'users', 'password_reset_tokens', 'sessions',
          'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs',
          'refugios', 'especies', 'razas', 'estados_mascota', 'mascotas',
          'fotos_mascota', 'publicaciones_adopcion', 'solicitudes_adopcion',
          'adopciones', 'hogares_temporales', 'asignaciones_hogar',
          'veterinarios', 'citas_veterinarias', 'historial_medico', 'vacunas',
          'mascota_vacuna', 'donaciones', 'seguimientos_adopcion',
          'personal_access_tokens', 'notifications', 'audit_logs', 'migrations'
      ]) AS expected(name)
     WHERE to_regclass(format('public.%I', expected.name)) IS NOT NULL;

    IF existing_tables <> 0 AND existing_tables <> 32 THEN
        RAISE EXCEPTION
            'PetLink encontró % de 32 tablas esperadas en public. Se detuvo sin cambios: revisa el esquema antes de ejecutar este archivo.',
            existing_tables;
    END IF;
END
$petlink_guard$;

-- Tablas de Laravel y catálogos base.
CREATE TABLE IF NOT EXISTS roles (
    id bigserial PRIMARY KEY,
    nombre varchar(40) NOT NULL UNIQUE,
    descripcion varchar(255),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS direcciones (
    id bigserial PRIMARY KEY,
    departamento varchar(80) NOT NULL,
    municipio varchar(100) NOT NULL,
    direccion_linea varchar(180) NOT NULL,
    barrio varchar(100),
    codigo_postal varchar(12),
    latitud numeric(10, 7),
    longitud numeric(10, 7),
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS direcciones_departamento_municipio_index
    ON direcciones (departamento, municipio);

CREATE TABLE IF NOT EXISTS users (
    id bigserial PRIMARY KEY,
    role_id bigint NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    telefono varchar(30),
    direccion_id bigint REFERENCES direcciones(id) ON DELETE SET NULL,
    activo boolean NOT NULL DEFAULT true,
    email_verified_at timestamp,
    password varchar(255) NOT NULL,
    remember_token varchar(100),
    created_at timestamp,
    updated_at timestamp
);
CREATE INDEX IF NOT EXISTS users_role_id_activo_index ON users (role_id, activo);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email varchar(255) PRIMARY KEY,
    token varchar(255) NOT NULL,
    created_at timestamp
);

CREATE TABLE IF NOT EXISTS sessions (
    id varchar(255) PRIMARY KEY,
    user_id bigint,
    ip_address varchar(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON sessions (last_activity);

CREATE TABLE IF NOT EXISTS cache (
    key varchar(255) PRIMARY KEY,
    value text NOT NULL,
    expiration integer NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_locks (
    key varchar(255) PRIMARY KEY,
    owner varchar(255) NOT NULL,
    expiration integer NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id bigserial PRIMARY KEY,
    queue varchar(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_queue_index ON jobs (queue);

CREATE TABLE IF NOT EXISTS job_batches (
    id varchar(255) PRIMARY KEY,
    name varchar(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);

CREATE TABLE IF NOT EXISTS failed_jobs (
    id bigserial PRIMARY KEY,
    uuid varchar(255) NOT NULL UNIQUE,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refugios (
    id bigserial PRIMARY KEY,
    nombre varchar(140) NOT NULL,
    nit varchar(25) UNIQUE,
    correo_contacto varchar(255),
    telefono_contacto varchar(30),
    responsable_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    direccion_id bigint REFERENCES direcciones(id) ON DELETE SET NULL,
    descripcion text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS refugios_activo_nombre_index ON refugios (activo, nombre);

CREATE TABLE IF NOT EXISTS especies (
    id bigserial PRIMARY KEY,
    nombre varchar(60) NOT NULL UNIQUE,
    icono varchar(50),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS razas (
    id bigserial PRIMARY KEY,
    especie_id bigint NOT NULL REFERENCES especies(id) ON DELETE RESTRICT,
    nombre varchar(80) NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz,
    updated_at timestamptz,
    UNIQUE (especie_id, nombre)
);

CREATE TABLE IF NOT EXISTS estados_mascota (
    id bigserial PRIMARY KEY,
    codigo varchar(30) NOT NULL UNIQUE,
    nombre varchar(60) NOT NULL,
    visible_publico boolean NOT NULL DEFAULT false,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS mascotas (
    id bigserial PRIMARY KEY,
    nombre varchar(100) NOT NULL,
    especie_id bigint NOT NULL REFERENCES especies(id) ON DELETE RESTRICT,
    raza_id bigint REFERENCES razas(id) ON DELETE SET NULL,
    estado_id bigint NOT NULL REFERENCES estados_mascota(id) ON DELETE RESTRICT,
    responsable_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    refugio_id bigint REFERENCES refugios(id) ON DELETE SET NULL,
    fecha_nacimiento date,
    edad_estimada_anios smallint,
    sexo varchar(16),
    tamano varchar(16),
    descripcion text,
    notas_salud text,
    codigo_identificacion varchar(80) UNIQUE,
    registrada_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at timestamptz,
    updated_at timestamptz,
    CONSTRAINT mascotas_edad_check CHECK (edad_estimada_anios IS NULL OR edad_estimada_anios BETWEEN 0 AND 40),
    CONSTRAINT mascotas_sexo_check CHECK (sexo IS NULL OR sexo IN ('hembra', 'macho', 'desconocido')),
    CONSTRAINT mascotas_tamano_check CHECK (tamano IS NULL OR tamano IN ('pequeno', 'mediano', 'grande'))
);
CREATE INDEX IF NOT EXISTS mascotas_estado_especie_tamano_index
    ON mascotas (estado_id, especie_id, tamano);
CREATE INDEX IF NOT EXISTS mascotas_responsable_estado_index
    ON mascotas (responsable_id, estado_id);

CREATE TABLE IF NOT EXISTS fotos_mascota (
    id bigserial PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    ruta varchar(500) NOT NULL,
    texto_alternativo varchar(180),
    principal boolean NOT NULL DEFAULT false,
    orden smallint NOT NULL DEFAULT 0,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS fotos_mascota_mascota_principal_index
    ON fotos_mascota (mascota_id, principal);

CREATE TABLE IF NOT EXISTS publicaciones_adopcion (
    id bigserial PRIMARY KEY,
    mascota_id bigint NOT NULL UNIQUE REFERENCES mascotas(id) ON DELETE RESTRICT,
    publicada_por bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    titulo varchar(160) NOT NULL,
    descripcion text,
    estado varchar(20) NOT NULL DEFAULT 'publicada',
    publicada_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cerrada_en timestamptz,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS publicaciones_adopcion_estado_publicada_en_index
    ON publicaciones_adopcion (estado, publicada_en);

CREATE TABLE IF NOT EXISTS solicitudes_adopcion (
    id bigserial PRIMARY KEY,
    publicacion_id bigint NOT NULL REFERENCES publicaciones_adopcion(id) ON DELETE RESTRICT,
    adoptante_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    motivacion text,
    estado varchar(20) NOT NULL DEFAULT 'pendiente',
    observacion_responsable text,
    revisada_por bigint REFERENCES users(id) ON DELETE SET NULL,
    revisada_en timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    CONSTRAINT solicitudes_estado_check CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'formalizada')),
    UNIQUE (publicacion_id, adoptante_id)
);
CREATE INDEX IF NOT EXISTS solicitudes_adopcion_adoptante_estado_index
    ON solicitudes_adopcion (adoptante_id, estado);

CREATE TABLE IF NOT EXISTS adopciones (
    id bigserial PRIMARY KEY,
    solicitud_id bigint NOT NULL UNIQUE REFERENCES solicitudes_adopcion(id) ON DELETE RESTRICT,
    mascota_id bigint NOT NULL UNIQUE REFERENCES mascotas(id) ON DELETE RESTRICT,
    adoptante_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    formalizada_por bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    fecha_adopcion date NOT NULL,
    estado varchar(20) NOT NULL DEFAULT 'activa',
    observaciones text,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS adopciones_adoptante_fecha_adopcion_index
    ON adopciones (adoptante_id, fecha_adopcion);

CREATE TABLE IF NOT EXISTS hogares_temporales (
    id bigserial PRIMARY KEY,
    responsable_id bigint NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    direccion_id bigint REFERENCES direcciones(id) ON DELETE SET NULL,
    capacidad smallint NOT NULL DEFAULT 1,
    acepta_perros boolean NOT NULL DEFAULT true,
    acepta_gatos boolean NOT NULL DEFAULT true,
    notas text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS asignaciones_hogar (
    id bigserial PRIMARY KEY,
    hogar_id bigint NOT NULL REFERENCES hogares_temporales(id) ON DELETE RESTRICT,
    mascota_id bigint NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    asignada_por bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    inicio date NOT NULL,
    fin date,
    estado varchar(20) NOT NULL DEFAULT 'activa',
    notas text,
    created_at timestamptz,
    updated_at timestamptz,
    CONSTRAINT asignaciones_fechas_check CHECK (fin IS NULL OR fin >= inicio)
);
CREATE INDEX IF NOT EXISTS asignaciones_hogar_hogar_estado_index
    ON asignaciones_hogar (hogar_id, estado);
CREATE INDEX IF NOT EXISTS asignaciones_hogar_mascota_estado_index
    ON asignaciones_hogar (mascota_id, estado);

CREATE TABLE IF NOT EXISTS veterinarios (
    id bigserial PRIMARY KEY,
    usuario_id bigint NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    numero_licencia varchar(60) NOT NULL UNIQUE,
    especialidad varchar(100),
    clinica varchar(140),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS citas_veterinarias (
    id bigserial PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    veterinario_id bigint NOT NULL REFERENCES veterinarios(id) ON DELETE RESTRICT,
    solicitada_por bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    programada_en timestamptz NOT NULL,
    duracion_minutos smallint NOT NULL DEFAULT 30,
    estado varchar(20) NOT NULL DEFAULT 'programada',
    motivo varchar(180),
    notas text,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS citas_veterinarias_veterinario_programada_estado_index
    ON citas_veterinarias (veterinario_id, programada_en, estado);
CREATE INDEX IF NOT EXISTS citas_veterinarias_mascota_programada_index
    ON citas_veterinarias (mascota_id, programada_en);

CREATE TABLE IF NOT EXISTS historial_medico (
    id bigserial PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    registrado_por bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    veterinario_id bigint REFERENCES veterinarios(id) ON DELETE SET NULL,
    tipo varchar(60) NOT NULL,
    fecha_registro date NOT NULL,
    titulo varchar(160) NOT NULL,
    descripcion text NOT NULL,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS historial_medico_mascota_fecha_registro_index
    ON historial_medico (mascota_id, fecha_registro);

CREATE TABLE IF NOT EXISTS vacunas (
    id bigserial PRIMARY KEY,
    nombre varchar(100) NOT NULL UNIQUE,
    especie_recomendada varchar(60),
    descripcion text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS mascota_vacuna (
    id bigserial PRIMARY KEY,
    mascota_id bigint NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    vacuna_id bigint NOT NULL REFERENCES vacunas(id) ON DELETE RESTRICT,
    veterinario_id bigint REFERENCES veterinarios(id) ON DELETE SET NULL,
    aplicada_en date NOT NULL,
    refuerzo_en date,
    lote varchar(80),
    observaciones text,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS mascota_vacuna_mascota_aplicada_en_index
    ON mascota_vacuna (mascota_id, aplicada_en);

CREATE TABLE IF NOT EXISTS donaciones (
    id bigserial PRIMARY KEY,
    donante_id bigint REFERENCES users(id) ON DELETE SET NULL,
    refugio_id bigint REFERENCES refugios(id) ON DELETE SET NULL,
    tipo_aporte varchar(20) NOT NULL,
    importe_cop numeric(14, 2),
    descripcion varchar(180),
    estado varchar(20) NOT NULL DEFAULT 'registrada',
    donada_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at timestamptz,
    updated_at timestamptz,
    CONSTRAINT donaciones_importe_check CHECK (importe_cop IS NULL OR importe_cop >= 0),
    CONSTRAINT donaciones_tipo_check CHECK (tipo_aporte IN ('dinero', 'especie', 'servicio'))
);
CREATE INDEX IF NOT EXISTS donaciones_donante_donada_en_index
    ON donaciones (donante_id, donada_en);
CREATE INDEX IF NOT EXISTS donaciones_refugio_estado_index
    ON donaciones (refugio_id, estado);

CREATE TABLE IF NOT EXISTS seguimientos_adopcion (
    id bigserial PRIMARY KEY,
    adopcion_id bigint NOT NULL REFERENCES adopciones(id) ON DELETE RESTRICT,
    registrado_por bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    fecha_programada date NOT NULL,
    fecha_realizada date,
    resultado varchar(20) NOT NULL DEFAULT 'pendiente',
    observaciones text,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS seguimientos_adopcion_adopcion_fecha_programada_index
    ON seguimientos_adopcion (adopcion_id, fecha_programada);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id bigserial PRIMARY KEY,
    tokenable_type varchar(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token varchar(64) NOT NULL UNIQUE,
    abilities text,
    last_used_at timestamp,
    expires_at timestamp,
    created_at timestamp,
    updated_at timestamp
);
CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_type_tokenable_id_index
    ON personal_access_tokens (tokenable_type, tokenable_id);
CREATE INDEX IF NOT EXISTS personal_access_tokens_expires_at_index
    ON personal_access_tokens (expires_at);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY,
    type varchar(255) NOT NULL,
    notifiable_type varchar(255) NOT NULL,
    notifiable_id bigint NOT NULL,
    data text NOT NULL,
    read_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS notifications_notifiable_type_notifiable_id_index
    ON notifications (notifiable_type, notifiable_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id bigserial PRIMARY KEY,
    actor_id bigint REFERENCES users(id) ON DELETE SET NULL,
    action varchar(120) NOT NULL,
    subject_type varchar(100),
    subject_id bigint,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_at_index
    ON audit_logs (actor_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_subject_type_subject_id_index
    ON audit_logs (subject_type, subject_id);

CREATE TABLE IF NOT EXISTS migrations (
    id serial PRIMARY KEY,
    migration varchar(255) NOT NULL,
    batch integer NOT NULL
);

-- Barrera: la base de la presentación debe contener solo registros ficticios.
-- No actualiza ni elimina datos; se detiene si encuentra otras cuentas o fichas.
DO $petlink_demo_data_guard$
BEGIN
    IF EXISTS (
        SELECT 1 FROM users
         WHERE lower(email) NOT IN (
             'admin@petlink.test', 'adoptante@petlink.test', 'refugio@petlink.test',
             'veterinario@petlink.test', 'hogar@petlink.test'
         )
           AND lower(email) NOT LIKE 'demo-%@petlink.invalid'
    ) THEN
        RAISE EXCEPTION 'La base ya contiene usuarios fuera del conjunto demo PetLink. No se insertaron credenciales públicas; usa una base separada de estudio.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM mascotas pet
         WHERE NOT EXISTS (
             SELECT 1 FROM users owner
              WHERE owner.id = pet.responsable_id
                AND (lower(owner.email) IN (
                    'admin@petlink.test', 'adoptante@petlink.test', 'refugio@petlink.test',
                    'veterinario@petlink.test', 'hogar@petlink.test'
                ) OR lower(owner.email) LIKE 'demo-%@petlink.invalid')
         )
    ) THEN
        RAISE EXCEPTION 'La base contiene mascotas fuera del conjunto demo PetLink. No se realizaron cambios.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM users user_demo
          JOIN roles role_demo ON role_demo.id = user_demo.role_id
         WHERE lower(user_demo.email) IN (
             'admin@petlink.test', 'adoptante@petlink.test', 'refugio@petlink.test',
             'veterinario@petlink.test', 'hogar@petlink.test'
         )
           AND (role_demo.nombre <> CASE lower(user_demo.email)
                 WHEN 'admin@petlink.test' THEN 'Administrador'
                 WHEN 'adoptante@petlink.test' THEN 'Adoptante'
                 WHEN 'refugio@petlink.test' THEN 'Refugio'
                 WHEN 'veterinario@petlink.test' THEN 'Veterinario'
                 WHEN 'hogar@petlink.test' THEN 'Hogar temporal'
               END OR user_demo.activo IS NOT TRUE)
    ) THEN
        RAISE EXCEPTION 'Una cuenta demo existe con rol distinto o inactiva. Se detuvo para no sobrescribir usuarios.';
    END IF;
END
$petlink_demo_data_guard$;

-- Registra los mismos nombres que Laravel para que artisan migrate no intente
-- recrear las tablas ya inicializadas desde este archivo.
INSERT INTO migrations (migration, batch)
SELECT expected.migration, 1
  FROM (VALUES
      ('0000_12_31_000000_create_roles_and_direcciones_tables'),
      ('0001_01_01_000000_create_users_table'),
      ('0001_01_01_000001_create_cache_table'),
      ('0001_01_01_000002_create_jobs_table'),
      ('0002_01_01_000000_add_petlink_fields_to_users_table'),
      ('2026_10_29_000000_create_petlink_domain_tables'),
      ('2026_10_29_203506_create_personal_access_tokens_table'),
      ('2026_10_29_220000_create_notifications_table'),
      ('2026_10_29_220001_create_audit_logs_table')
  ) AS expected(migration)
 WHERE NOT EXISTS (
       SELECT 1 FROM migrations existing
        WHERE existing.migration = expected.migration
  );

-- Roles y catálogos: insertar solo cuando falten.
INSERT INTO roles (nombre, descripcion, created_at, updated_at)
VALUES
    ('Administrador', 'Administración general de la plataforma.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Adoptante', 'Persona que busca adoptar y consultar sus procesos.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Refugio', 'Responsable de un refugio y sus publicaciones.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Veterinario', 'Profesional veterinario con acceso a registros autorizados.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Hogar temporal', 'Responsable de acogidas temporales.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO especies (nombre, icono, activo, created_at, updated_at)
VALUES
    ('Perro', '🐶', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Gato', '🐱', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO razas (especie_id, nombre, activo, created_at, updated_at)
SELECT especies.id, seed.nombre, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM (VALUES
      ('Perro', 'Criollo'), ('Perro', 'Labrador'), ('Perro', 'Beagle'),
      ('Gato', 'Criollo'), ('Gato', 'Siamés')
  ) AS seed(especie, nombre)
  JOIN especies ON especies.nombre = seed.especie
ON CONFLICT (especie_id, nombre) DO NOTHING;

INSERT INTO estados_mascota (codigo, nombre, visible_publico, created_at, updated_at)
VALUES
    ('disponible', 'Disponible', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('en_acogida', 'En hogar temporal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('en_proceso', 'En proceso de adopción', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('adoptada', 'Adoptada', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('atencion_medica', 'En atención médica', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO vacunas (nombre, activo, created_at, updated_at)
VALUES
    ('Rabia', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Triple felina', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Parvovirus', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Moquillo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (nombre) DO NOTHING;

-- Dataset ficticio persistente. Las cinco cuentas activas usan correos .test;
-- las contraseñas correspondientes se documentan en README para uso académico.
INSERT INTO direcciones (
    departamento, municipio, direccion_linea, barrio, created_at, updated_at
)
SELECT 'Cundinamarca', 'Bogotá', 'Calle 10 # 5-20', 'Centro', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
 WHERE NOT EXISTS (
       SELECT 1 FROM direcciones
        WHERE departamento = 'Cundinamarca'
          AND municipio = 'Bogotá'
          AND direccion_linea = 'Calle 10 # 5-20'
  );

INSERT INTO users (
    role_id, name, email, telefono, direccion_id, activo, password, created_at, updated_at
)
SELECT roles.id, seed.name, seed.email, '3000000000', address.id, true,
       seed.password_hash, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM (VALUES
      ('Administrador', 'PetLink Admin Demo', 'admin@petlink.test', '$2y$10$eodZEjEO2jyqUrpCl8Bkk.xSijODsrJ7wcLHYmYk8oYths4/e/iDG'),
      ('Adoptante', 'PetLink Adoptante Demo', 'adoptante@petlink.test', '$2y$10$ieW6zEhD/JbBm1cQfvmlved.SL0GwXLCTRQspY4bu..l/ppG1syLm'),
      ('Refugio', 'PetLink Refugio Demo', 'refugio@petlink.test', '$2y$10$3.73.0bDyU6hzeKZeWr0.uWepSUZqmuSFViqR9XoUPUkhMIU.Mkz6'),
      ('Veterinario', 'PetLink Veterinario Demo', 'veterinario@petlink.test', '$2y$10$R/FcSDImGGEUrutnzhQaIeBFz3wOaJxxE/6Ro79U/O/JTS0/3hZVC'),
      ('Hogar temporal', 'PetLink Hogar Demo', 'hogar@petlink.test', '$2y$10$4wnRenPPiwYGDlywCeSgRO9mrUwL68OlDsgpfW3sqxhlMk3pSMarq')
  ) AS seed(role_name, name, email, password_hash)
  JOIN roles ON roles.nombre = seed.role_name
  JOIN direcciones address
    ON address.departamento = 'Cundinamarca'
   AND address.municipio = 'Bogotá'
   AND address.direccion_linea = 'Calle 10 # 5-20'
ON CONFLICT (email) DO NOTHING;

INSERT INTO refugios (
    nombre, correo_contacto, telefono_contacto, responsable_id, direccion_id,
    descripcion, activo, created_at, updated_at
)
SELECT 'Refugio PetLink Demo', shelter_user.email, shelter_user.telefono, shelter_user.id, address.id,
       'Refugio de demostración para validar PetLink.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM users shelter_user
  JOIN direcciones address
    ON address.departamento = 'Cundinamarca'
   AND address.municipio = 'Bogotá'
   AND address.direccion_linea = 'Calle 10 # 5-20'
 WHERE shelter_user.email = 'refugio@petlink.test'
   AND NOT EXISTS (
       SELECT 1 FROM refugios existing
        WHERE existing.responsable_id = shelter_user.id
          AND existing.nombre = 'Refugio PetLink Demo'
   );

INSERT INTO veterinarios (
    usuario_id, numero_licencia, especialidad, clinica, activo, created_at, updated_at
)
SELECT user_demo.id, 'DEMO-MV-SQL-001', 'Medicina preventiva', 'Clínica PetLink Demo',
       true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM users user_demo
 WHERE user_demo.email = 'veterinario@petlink.test'
ON CONFLICT DO NOTHING;

INSERT INTO hogares_temporales (
    responsable_id, direccion_id, capacidad, acepta_perros, acepta_gatos,
    activo, created_at, updated_at
)
SELECT user_demo.id, address.id, 2, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM users user_demo
  JOIN direcciones address
    ON address.departamento = 'Cundinamarca'
   AND address.municipio = 'Bogotá'
   AND address.direccion_linea = 'Calle 10 # 5-20'
 WHERE user_demo.email = 'hogar@petlink.test'
ON CONFLICT (responsable_id) DO NOTHING;

INSERT INTO mascotas (
    nombre, especie_id, raza_id, estado_id, responsable_id, refugio_id,
    edad_estimada_anios, sexo, tamano, descripcion, codigo_identificacion,
    registrada_en, created_at, updated_at
)
SELECT seed.nombre, especie.id, raza.id, estado.id, shelter_user.id, shelter.id,
       seed.edad, seed.sexo, seed.tamano, seed.descripcion, seed.codigo,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM (VALUES
      ('Luna', 'Gato', 'Criollo', 'disponible', 2, 'hembra', 'pequeno', 'Cariñosa, tranquila y lista para encontrar un hogar.', 'DEMO-PL-PUBLIC-001'),
      ('Max', 'Perro', 'Criollo', 'disponible', 3, 'macho', 'mediano', 'Sociable y juguetón; disfruta los paseos y la compañía.', 'DEMO-PL-PUBLIC-002'),
      ('Mora', 'Perro', 'Beagle', 'disponible', 1, 'hembra', 'mediano', 'Curiosa, activa y con mucha energía para compartir.', 'DEMO-PL-PUBLIC-003'),
      ('Bongo', 'Perro', 'Criollo', 'adoptada', 4, 'macho', 'mediano', 'Adopción de demostración PetLink.', 'DEMO-PL-PUBLIC-004'),
      ('Nube', 'Gato', 'Criollo', 'en_acogida', 1, 'hembra', 'pequeno', 'En hogar temporal de demostración.', 'DEMO-PL-PUBLIC-005')
  ) AS seed(nombre, especie, raza, estado, edad, sexo, tamano, descripcion, codigo)
  JOIN especies especie ON especie.nombre = seed.especie
  JOIN razas raza ON raza.especie_id = especie.id AND raza.nombre = seed.raza
  JOIN estados_mascota estado ON estado.codigo = seed.estado
  JOIN users shelter_user ON shelter_user.email = 'refugio@petlink.test'
  JOIN refugios shelter ON shelter.responsable_id = shelter_user.id
ON CONFLICT (codigo_identificacion) DO NOTHING;

INSERT INTO publicaciones_adopcion (
    mascota_id, publicada_por, titulo, descripcion, estado, publicada_en,
    cerrada_en, created_at, updated_at
)
SELECT pet.id, shelter_user.id, 'Conoce a ' || pet.nombre, pet.descripcion,
       CASE WHEN pet.codigo_identificacion = 'DEMO-PL-PUBLIC-004' THEN 'cerrada' ELSE 'publicada' END,
       CURRENT_TIMESTAMP,
       CASE WHEN pet.codigo_identificacion = 'DEMO-PL-PUBLIC-004' THEN CURRENT_TIMESTAMP ELSE NULL END,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM mascotas pet
  JOIN users shelter_user ON shelter_user.email = 'refugio@petlink.test'
 WHERE pet.codigo_identificacion IN (
       'DEMO-PL-PUBLIC-001', 'DEMO-PL-PUBLIC-002', 'DEMO-PL-PUBLIC-003', 'DEMO-PL-PUBLIC-004'
  )
ON CONFLICT (mascota_id) DO NOTHING;

INSERT INTO solicitudes_adopcion (
    publicacion_id, adoptante_id, motivacion, estado, revisada_por, revisada_en,
    created_at, updated_at
)
SELECT publication.id, adopter.id, 'Solicitud ficticia para demostración PetLink.', seed.estado,
       CASE WHEN seed.estado = 'pendiente' THEN NULL ELSE shelter_user.id END,
       CASE WHEN seed.estado = 'pendiente' THEN NULL ELSE CURRENT_TIMESTAMP END,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM (VALUES
      ('DEMO-PL-PUBLIC-001', 'pendiente'),
      ('DEMO-PL-PUBLIC-002', 'en_revision'),
      ('DEMO-PL-PUBLIC-003', 'aprobada'),
      ('DEMO-PL-PUBLIC-004', 'formalizada')
  ) AS seed(codigo_mascota, estado)
  JOIN mascotas pet ON pet.codigo_identificacion = seed.codigo_mascota
  JOIN publicaciones_adopcion publication ON publication.mascota_id = pet.id
  JOIN users adopter ON adopter.email = 'adoptante@petlink.test'
  JOIN users shelter_user ON shelter_user.email = 'refugio@petlink.test'
ON CONFLICT (publicacion_id, adoptante_id) DO NOTHING;

INSERT INTO adopciones (
    solicitud_id, mascota_id, adoptante_id, formalizada_por, fecha_adopcion,
    estado, observaciones, created_at, updated_at
)
SELECT request.id, pet.id, adopter.id, shelter_user.id, CURRENT_DATE,
       'activa', 'Adopción ficticia de demostración.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM solicitudes_adopcion request
  JOIN publicaciones_adopcion publication ON publication.id = request.publicacion_id
  JOIN mascotas pet ON pet.id = publication.mascota_id
  JOIN users adopter ON adopter.id = request.adoptante_id
  JOIN users shelter_user ON shelter_user.email = 'refugio@petlink.test'
 WHERE pet.codigo_identificacion = 'DEMO-PL-PUBLIC-004'
   AND request.estado = 'formalizada'
ON CONFLICT DO NOTHING;

INSERT INTO seguimientos_adopcion (
    adopcion_id, registrado_por, fecha_programada, resultado, observaciones,
    created_at, updated_at
)
SELECT adoption.id, shelter_user.id, (CURRENT_DATE + 7), 'pendiente',
       'Seguimiento ficticio de demostración.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM adopciones adoption
  JOIN mascotas pet ON pet.id = adoption.mascota_id
  JOIN users shelter_user ON shelter_user.email = 'refugio@petlink.test'
 WHERE pet.codigo_identificacion = 'DEMO-PL-PUBLIC-004'
   AND NOT EXISTS (
       SELECT 1 FROM seguimientos_adopcion existing
        WHERE existing.adopcion_id = adoption.id
          AND existing.observaciones = 'Seguimiento ficticio de demostración.'
   );

INSERT INTO citas_veterinarias (
    mascota_id, veterinario_id, solicitada_por, programada_en, duracion_minutos,
    estado, motivo, created_at, updated_at
)
SELECT pet.id, veterinarian.id, adopter.id, ((CURRENT_DATE + 2 + TIME '10:00') AT TIME ZONE 'America/Bogota'),
       30, 'confirmada', 'Control preventivo ficticio de demostración.',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM mascotas pet
  JOIN veterinarios veterinarian ON true
  JOIN users vet_user ON vet_user.id = veterinarian.usuario_id
  JOIN users adopter ON adopter.email = 'adoptante@petlink.test'
 WHERE pet.codigo_identificacion = 'DEMO-PL-PUBLIC-001'
   AND vet_user.email = 'veterinario@petlink.test'
   AND NOT EXISTS (
       SELECT 1 FROM citas_veterinarias existing
        WHERE existing.mascota_id = pet.id
          AND existing.veterinario_id = veterinarian.id
          AND existing.solicitada_por = adopter.id
          AND existing.motivo = 'Control preventivo ficticio de demostración.'
   );

INSERT INTO historial_medico (
    mascota_id, registrado_por, veterinario_id, tipo, fecha_registro, titulo,
    descripcion, created_at, updated_at
)
SELECT pet.id, vet_user.id, veterinarian.id, 'consulta', CURRENT_DATE,
       'Control preventivo demo',
       'Registro clínico ficticio para mostrar un historial de atención.',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM mascotas pet
  JOIN veterinarios veterinarian ON true
  JOIN users vet_user ON vet_user.id = veterinarian.usuario_id
 WHERE pet.codigo_identificacion = 'DEMO-PL-PUBLIC-001'
   AND vet_user.email = 'veterinario@petlink.test'
   AND NOT EXISTS (
       SELECT 1 FROM historial_medico existing
        WHERE existing.mascota_id = pet.id
          AND existing.veterinario_id = veterinarian.id
          AND existing.titulo = 'Control preventivo demo'
   );

INSERT INTO mascota_vacuna (
    mascota_id, vacuna_id, veterinario_id, aplicada_en, refuerzo_en, lote,
    observaciones, created_at, updated_at
)
SELECT pet.id, vaccine.id, veterinarian.id, (CURRENT_DATE - INTERVAL '2 months')::date, (CURRENT_DATE + INTERVAL '10 months')::date,
       'DEMO-RAB-SQL-01', 'Aplicación ficticia de demostración.',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM mascotas pet
  JOIN vacunas vaccine ON vaccine.nombre = 'Rabia'
  JOIN veterinarios veterinarian ON true
  JOIN users vet_user ON vet_user.id = veterinarian.usuario_id
 WHERE pet.codigo_identificacion = 'DEMO-PL-PUBLIC-001'
   AND vet_user.email = 'veterinario@petlink.test'
   AND NOT EXISTS (
       SELECT 1 FROM mascota_vacuna existing
        WHERE existing.mascota_id = pet.id
          AND existing.vacuna_id = vaccine.id
          AND existing.veterinario_id = veterinarian.id
          AND existing.lote = 'DEMO-RAB-SQL-01'
   );

INSERT INTO donaciones (
    donante_id, refugio_id, tipo_aporte, importe_cop, descripcion, estado,
    donada_en, created_at, updated_at
)
SELECT adopter.id, shelter.id, 'dinero', 25000,
       'Aporte ficticio de demostración PetLink', 'registrada',
       ((CURRENT_DATE + TIME '12:00') AT TIME ZONE 'America/Bogota'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM users adopter
  JOIN refugios shelter ON shelter.nombre = 'Refugio PetLink Demo'
 WHERE adopter.email = 'adoptante@petlink.test'
   AND NOT EXISTS (
       SELECT 1 FROM donaciones existing
        WHERE existing.donante_id = adopter.id
          AND existing.refugio_id = shelter.id
          AND existing.descripcion = 'Aporte ficticio de demostración PetLink'
   );

INSERT INTO asignaciones_hogar (
    hogar_id, mascota_id, asignada_por, inicio, estado, notas, created_at, updated_at
)
SELECT home.id, pet.id, shelter_user.id, (CURRENT_DATE - 3), 'activa',
       'Cuidar, alimentar y registrar novedades de forma ficticia.',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM hogares_temporales home
  JOIN users foster_user ON foster_user.id = home.responsable_id
  JOIN mascotas pet ON pet.codigo_identificacion = 'DEMO-PL-PUBLIC-005'
  JOIN users shelter_user ON shelter_user.email = 'refugio@petlink.test'
 WHERE foster_user.email = 'hogar@petlink.test'
   AND NOT EXISTS (
       SELECT 1 FROM asignaciones_hogar existing
        WHERE existing.hogar_id = home.id
          AND existing.mascota_id = pet.id
          AND existing.notas = 'Cuidar, alimentar y registrar novedades de forma ficticia.'
   );

COMMIT;

-- Verificación visual después de ejecutar:
SELECT role_demo.nombre AS rol, user_demo.email, user_demo.activo
  FROM users user_demo
  JOIN roles role_demo ON role_demo.id = user_demo.role_id
 WHERE lower(user_demo.email) IN (
       'admin@petlink.test', 'adoptante@petlink.test', 'refugio@petlink.test',
       'veterinario@petlink.test', 'hogar@petlink.test'
  )
 ORDER BY role_demo.id;

SELECT 'mascotas' AS modulo, count(*) AS registros FROM mascotas WHERE codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'publicaciones', count(*) FROM publicaciones_adopcion publication JOIN mascotas pet ON pet.id = publication.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'solicitudes', count(*) FROM solicitudes_adopcion request JOIN publicaciones_adopcion publication ON publication.id = request.publicacion_id JOIN mascotas pet ON pet.id = publication.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'adopciones', count(*) FROM adopciones adoption JOIN mascotas pet ON pet.id = adoption.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'citas', count(*) FROM citas_veterinarias appointment JOIN mascotas pet ON pet.id = appointment.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'historial médico', count(*) FROM historial_medico record JOIN mascotas pet ON pet.id = record.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'vacunas', count(*) FROM mascota_vacuna vaccine JOIN mascotas pet ON pet.id = vaccine.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%'
UNION ALL SELECT 'donaciones', count(*) FROM donaciones donation JOIN refugios shelter ON shelter.id = donation.refugio_id WHERE shelter.nombre = 'Refugio PetLink Demo'
UNION ALL SELECT 'hogares asignados', count(*) FROM asignaciones_hogar assignment JOIN mascotas pet ON pet.id = assignment.mascota_id WHERE pet.codigo_identificacion LIKE 'DEMO-PL-PUBLIC-%';
