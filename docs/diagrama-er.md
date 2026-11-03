# Diagrama entidad-relación de PetLink

Este diagrama representa las tablas y claves declaradas por las migraciones Laravel del repositorio. No se pudo contrastar con el MER externo original ni consultar el PostgreSQL del proyecto, por lo que describe el esquema versionado aquí, no una inspección de una instancia en producción.

```mermaid
erDiagram
    ROLES {
        bigint id PK
        varchar nombre UK
        varchar descripcion
    }
    DIRECCIONES {
        bigint id PK
        varchar departamento
        varchar municipio
        varchar direccion_linea
        varchar barrio
        varchar codigo_postal
        decimal latitud
        decimal longitud
    }
    USERS {
        bigint id PK
        bigint role_id FK
        bigint direccion_id FK
        varchar name
        varchar email UK
        varchar telefono
        varchar password
        boolean activo
    }
    REFUGIOS {
        bigint id PK
        bigint responsable_id FK_UK
        bigint direccion_id FK
        varchar nombre
        varchar nit UK
        varchar correo_contacto
        varchar telefono_contacto
        text descripcion
        boolean activo
    }
    ESPECIES {
        bigint id PK
        varchar nombre UK
        varchar icono
        boolean activo
    }
    RAZAS {
        bigint id PK
        bigint especie_id FK
        varchar nombre
        boolean activo
    }
    ESTADOS_MASCOTA {
        bigint id PK
        varchar codigo UK
        varchar nombre
        boolean visible_publico
    }
    MASCOTAS {
        bigint id PK
        bigint especie_id FK
        bigint raza_id FK
        bigint estado_id FK
        bigint responsable_id FK
        bigint refugio_id FK
        varchar nombre
        date fecha_nacimiento
        smallint edad_estimada_anios
        varchar sexo
        varchar tamano
        text descripcion
        text notas_salud
        varchar codigo_identificacion UK
        timestamptz registrada_en
    }
    FOTOS_MASCOTA {
        bigint id PK
        bigint mascota_id FK
        varchar ruta
        varchar texto_alternativo
        boolean principal
        smallint orden
    }
    PUBLICACIONES_ADOPCION {
        bigint id PK
        bigint mascota_id FK_UK
        bigint publicada_por FK
        varchar titulo
        text descripcion
        varchar estado
        timestamptz publicada_en
        timestamptz cerrada_en
    }
    SOLICITUDES_ADOPCION {
        bigint id PK
        bigint publicacion_id FK
        bigint adoptante_id FK
        bigint revisada_por FK
        varchar estado
        text motivacion
        text observacion_responsable
        timestamptz revisada_en
    }
    ADOPCIONES {
        bigint id PK
        bigint solicitud_id FK_UK
        bigint mascota_id FK_UK
        bigint adoptante_id FK
        bigint formalizada_por FK
        date fecha_adopcion
        varchar estado
        text observaciones
    }
    HOGARES_TEMPORALES {
        bigint id PK
        bigint responsable_id FK_UK
        bigint direccion_id FK
        smallint capacidad
        boolean acepta_perros
        boolean acepta_gatos
        text notas
        boolean activo
    }
    ASIGNACIONES_HOGAR {
        bigint id PK
        bigint hogar_id FK
        bigint mascota_id FK
        bigint asignada_por FK
        date inicio
        date fin
        varchar estado
        text notas
    }
    VETERINARIOS {
        bigint id PK
        bigint usuario_id FK_UK
        varchar numero_licencia UK
        varchar especialidad
        varchar clinica
        boolean activo
    }
    CITAS_VETERINARIAS {
        bigint id PK
        bigint mascota_id FK
        bigint veterinario_id FK
        bigint solicitada_por FK
        timestamptz programada_en
        smallint duracion_minutos
        varchar estado
        varchar motivo
        text notas
    }
    HISTORIAL_MEDICO {
        bigint id PK
        bigint mascota_id FK
        bigint registrado_por FK
        bigint veterinario_id FK
        varchar tipo
        date fecha_registro
        varchar titulo
        text descripcion
    }
    VACUNAS {
        bigint id PK
        varchar nombre UK
        varchar especie_recomendada
        text descripcion
        boolean activo
    }
    MASCOTA_VACUNA {
        bigint id PK
        bigint mascota_id FK
        bigint vacuna_id FK
        bigint veterinario_id FK
        date aplicada_en
        date refuerzo_en
        varchar lote
        text observaciones
    }
    DONACIONES {
        bigint id PK
        bigint donante_id FK
        bigint refugio_id FK
        varchar tipo_aporte
        decimal importe_cop
        varchar descripcion
        varchar estado
        timestamptz donada_en
    }
    SEGUIMIENTOS_ADOPCION {
        bigint id PK
        bigint adopcion_id FK
        bigint registrado_por FK
        date fecha_programada
        date fecha_realizada
        varchar resultado
        text observaciones
    }
    NOTIFICATIONS {
        uuid id PK
        varchar type
        varchar notifiable_type
        bigint notifiable_id
        text data
        timestamptz read_at
    }
    AUDIT_LOGS {
        bigint id PK
        bigint actor_id FK
        varchar action
        varchar subject_type
        bigint subject_id
        timestamptz created_at
    }

    ROLES ||--o{ USERS : asigna
    DIRECCIONES o|--o{ USERS : ubica
    DIRECCIONES o|--o{ REFUGIOS : ubica
    USERS ||--o| REFUGIOS : responsable
    DIRECCIONES o|--o{ HOGARES_TEMPORALES : ubica
    USERS ||--o| HOGARES_TEMPORALES : responsable
    USERS ||--o| VETERINARIOS : perfil
    ESPECIES ||--o{ RAZAS : clasifica
    ESPECIES ||--o{ MASCOTAS : clasifica
    RAZAS o|--o{ MASCOTAS : identifica
    ESTADOS_MASCOTA ||--o{ MASCOTAS : estado
    USERS ||--o{ MASCOTAS : responsable
    REFUGIOS o|--o{ MASCOTAS : gestiona
    MASCOTAS ||--o{ FOTOS_MASCOTA : muestra
    MASCOTAS ||--o| PUBLICACIONES_ADOPCION : publica
    USERS ||--o{ PUBLICACIONES_ADOPCION : publica
    PUBLICACIONES_ADOPCION ||--o{ SOLICITUDES_ADOPCION : recibe
    USERS ||--o{ SOLICITUDES_ADOPCION : presenta
    USERS o|--o{ SOLICITUDES_ADOPCION : revisa
    SOLICITUDES_ADOPCION ||--o| ADOPCIONES : formaliza
    MASCOTAS ||--o| ADOPCIONES : adoptada
    USERS ||--o{ ADOPCIONES : adoptante
    USERS ||--o{ ADOPCIONES : formaliza
    HOGARES_TEMPORALES ||--o{ ASIGNACIONES_HOGAR : conserva
    MASCOTAS ||--o{ ASIGNACIONES_HOGAR : acogida
    USERS ||--o{ ASIGNACIONES_HOGAR : asigna
    VETERINARIOS ||--o{ CITAS_VETERINARIAS : atiende
    MASCOTAS ||--o{ CITAS_VETERINARIAS : agenda
    USERS ||--o{ CITAS_VETERINARIAS : solicita
    MASCOTAS ||--o{ HISTORIAL_MEDICO : historial
    USERS ||--o{ HISTORIAL_MEDICO : registra
    VETERINARIOS o|--o{ HISTORIAL_MEDICO : profesional
    MASCOTAS ||--o{ MASCOTA_VACUNA : recibe
    VACUNAS ||--o{ MASCOTA_VACUNA : aplica
    VETERINARIOS o|--o{ MASCOTA_VACUNA : aplica
    USERS o|--o{ DONACIONES : dona
    REFUGIOS o|--o{ DONACIONES : recibe
    ADOPCIONES ||--o{ SEGUIMIENTOS_ADOPCION : seguimiento
    USERS ||--o{ SEGUIMIENTOS_ADOPCION : registra
    USERS ||--o{ NOTIFICATIONS : destinatario
    USERS o|--o{ AUDIT_LOGS : actor
```

## Notas de lectura

- Cada entidad utiliza una PK `id`; `users.role_id` es FK a `roles.id`. Los cinco roles comparten la tabla de usuarios.
- `FK_UK` significa una FK con restricción de unicidad: relación uno a uno (por ejemplo, `publicaciones_adopcion.mascota_id`).
- `mascota_vacuna` y `asignaciones_hogar` implementan relaciones muchos a muchos con atributos propios.
- Los vínculos de `notifications` y el sujeto de `audit_logs` son polimórficos. `notifiable_type/notifiable_id` y `subject_type/subject_id` no son FKs convencionales.
- `users.password` es la columna real de Laravel y contiene el hash de autenticación, no la contraseña en texto plano.
- Las tablas de dominio incluyen `created_at` y `updated_at` (`timestamptz`) cuando fueron creadas con `timestampsTz`; `users` también conserva `email_verified_at` y `remember_token` del esquema Laravel base.
- Laravel también crea tablas de infraestructura (`migrations`, `cache`, `jobs`, `password_reset_tokens`, `sessions` y `personal_access_tokens`) que no representan entidades de negocio.
