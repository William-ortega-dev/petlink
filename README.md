# PetLink

PetLink conecta personas adoptantes con refugios y responsables de mascotas en Colombia. Incluye un catálogo público, solicitudes y formalización de adopciones, además de módulos para refugios, veterinarios y hogares temporales.

## Estado

La aplicación usa una API Laravel y un cliente React independiente. PostgreSQL es el único motor configurado. Este equipo tiene PostgreSQL 18 en localhost:5432; psql.exe está instalado pero no está en PATH. PHP tiene la DLL `pdo_pgsql`, pero no la carga por defecto. Al habilitarla solo para la ejecución de PHPUnit, el servidor rechazó la contraseña local del usuario `petlink` al conectar con la base de pruebas `petlink_test`; no se modificaron credenciales ni datos.

El enlace de Lucidchart del prompt no fue accesible. El esquema es una propuesta inicial basada en las entidades sugeridas y debe compararse con el MER antes de usar PetLink con datos reales.

## Tecnologías y estructura

- PHP 8.2, Laravel 12, Eloquent ORM y Laravel Sanctum 4.
- PostgreSQL 16 o posterior como único motor de base de datos.
- React 19, Vite 8, React Router 7, Axios y Bootstrap 5.
- PHPUnit y ESLint.
- backend/: API, migraciones, modelos, políticas y seeders Laravel.
- frontend/: interfaz React en español.
- docs/modelo-datos.md y docs/api.md: esquema y rutas propuestas.
- docs/diagrama-er.md y docs/entrega-segundo-parcial.md: ER visual, arquitectura por capas y mapa de módulos/roles.
- docs/supabase-inicializacion.sql: esquema reproducible y datos sintéticos de demostración; no contiene una copia de la base desplegada.
- docker-compose.yml: PostgreSQL opcional para desarrollo local.

Herramientas detectadas: PHP 8.2.12, Composer 2.8.12, Node 24.11.1, npm 11.6.2, Docker CLI 29.7.2 y servicio PostgreSQL 18. El cliente psql.exe existe, pero su carpeta no está en PATH; Docker Desktop/daemon no está activo.

## Requisitos en Windows

PHP 8.2+, Composer, extensiones PHP pdo_pgsql y pgsql habilitadas, PostgreSQL 16+ o Docker Desktop en ejecución, Node.js 20.19+ y npm.

### Habilitar PostgreSQL para PHP de XAMPP

PHP usa C:\xampp\php\php.ini y las DLL están en C:\xampp\php\ext. Edita el archivo y habilita estas líneas (si están comentadas, quita el punto y coma):

~~~ini
extension=pdo_pgsql
extension=pgsql
~~~

En una terminal nueva, comprueba:

~~~powershell
php -m | findstr /I "pdo_pgsql pgsql"
~~~

La salida debe incluir ambos módulos.

### Iniciar PostgreSQL

Con Docker Desktop instalado y en ejecución:

~~~powershell
cd .
docker compose up -d postgres
~~~

Compose crea la base petlink, el usuario petlink y la contraseña local de ejemplo petlink_dev_password. Solo se debe usar para desarrollo.

Alternativamente, el servicio PostgreSQL 18 local ya está activo. Tras iniciar sesión como un usuario administrador de PostgreSQL, crea el rol y las bases de desarrollo/pruebas. En este equipo se puede invocar psql con su ruta completa:

~~~powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h 127.0.0.1 -d postgres
~~~

Cuando psql muestre su indicador, ejecuta allí estas sentencias SQL:

~~~sql
CREATE USER petlink WITH PASSWORD 'petlink_dev_password';
CREATE DATABASE petlink OWNER petlink;
CREATE DATABASE petlink_test OWNER petlink;
~~~

Si petlink ya existe, omite CREATE USER o restablece su contraseña solo si administras esa instancia. Si las bases ya existen, omite sus comandos. La contraseña del ejemplo es solo para desarrollo.

## Instalar y ejecutar

En PowerShell:

~~~powershell
cd .\backend
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
~~~

El ejemplo usa PostgreSQL en 127.0.0.1:5432, base petlink y usuario petlink. Ajusta la contraseña si es necesario. No compartas .env ni uses credenciales de ejemplo en producción.

Backend, en una terminal:

~~~powershell
cd .\backend
php artisan serve --host 127.0.0.1 --port 8000
~~~

La API queda en http://127.0.0.1:8000/api; /api/health verifica que Laravel responda.

Frontend, en otra terminal:

~~~powershell
cd .\frontend
Copy-Item .env.example .env
npm ci
npm run dev
~~~

Vite suele mostrar http://localhost:5173. VITE_API_URL está en frontend/.env y apunta a http://127.0.0.1:8000/api.

## Verificación y pruebas

Con PostgreSQL disponible, php artisan migrate:status lista las migraciones ejecutadas y http://127.0.0.1:8000/api/mascotas devuelve las mascotas sembradas. El catálogo y sus filtros consumen esas rutas.

PHPUnit apunta a la base separada petlink_test. Créala antes de ejecutar:

~~~powershell
cd .\backend
php artisan test
~~~

Las pruebas usan RefreshDatabase sobre petlink_test; no apuntes PHPUnit a una base con datos que quieras conservar.

Comprobaciones frontend:

~~~powershell
cd .\frontend
npm run lint
npm run build
~~~

Verificación actual: `npm run lint` y `npm run build` pasan; también compilé con `VITE_DEMO_MODE=true` para revisar el selector público. `php artisan test` ejecuta 28 pruebas: 4 pasan y 24 no llegan a sus aserciones porque este PHP no tiene el controlador `pdo_pgsql` (`could not find driver`) para `petlink_test`. La base desplegada responde `/api/health` con PostgreSQL conectado, pero el catálogo aún devuelve cero mascotas. No pude ejecutar el SQL de inicialización contra la instancia Supabase desde este entorno; hazlo una vez desde Supabase SQL Editor y luego repite la verificación de catálogo/login.

## Cuentas demo locales y de presentación

En `APP_ENV=local` o `APP_ENV=testing`, `php artisan migrate --seed` crea cuentas y datos de demostración relacionados cuando las cinco contraseñas están configuradas. `backend/.env.example` trae las credenciales locales de referencia. El seeder usa `firstOrCreate`: no duplica ni cambia usuarios que ya existan. En otro entorno controlado se necesita además `PETLINK_DEMO_ACCOUNTS=true`; producción siempre los omite. Las contraseñas se guardan con el cast `hashed` del modelo y nunca se devuelven por la API.

| Rol | Correo | Contraseña de prueba |
|---|---|---|
| Administrador | `admin@petlink.test` | `AdminPetLink2026!` |
| Adoptante | `adoptante@petlink.test` | `AdoptantePetLink2026!` |
| Refugio | `refugio@petlink.test` | `RefugioPetLink2026!` |
| Veterinario | `veterinario@petlink.test` | `Veterinario2026!` |
| Hogar temporal | `hogar@petlink.test` | `HogarTemporal2026!` |

Para presentar una demo persistente, usa una instancia Supabase dedicada a estudio y ejecuta una vez [`docs/supabase-inicializacion.sql`](docs/supabase-inicializacion.sql) en su SQL Editor. El script crea el esquema y datos ficticios enlazados para mascotas, publicaciones, solicitudes, adopciones, citas, historial médico, vacunas, donaciones y hogares. Es idempotente, no actualiza ni elimina usuarios existentes y aborta si encuentra usuarios o mascotas fuera del dataset de demostración. **No lo ejecutes en una base con información real:** incluye credenciales públicas de prueba con permisos de administrador.

En Vercel configura `VITE_API_URL=https://<tu-api>.onrender.com/api` y `VITE_DEMO_MODE=true`. En `/iniciar-sesion`, cada botón de rol rellena el formulario normal; el usuario debe pulsar **Iniciar sesión** y el backend valida la contraseña, emite el token y aplica permisos. Las operaciones se guardan en PostgreSQL. No hay bypass de autenticación en producción. El dataset es ficticio y público, por lo que no se deben registrar datos personales o reales en esa instancia.

Estas contraseñas son públicas y solo sirven para la base aislada de presentación; no las reutilices. PostgreSQL recibe hashes bcrypt. Para simular el modo sin API local, `VITE_DEMO_MODE=true` en Vite habilita los paneles de navegador solo cuando la compilación es de desarrollo. En local conectado a API, déjalo en `false`. `frontend/.env.example` configura la URL local; nunca incluyas contraseñas personales, tokens ni archivos `.env` en Git.

## Funcionalidades implementadas

- Registro de adoptantes, inicio/cierre de sesión, perfil, cambio y recuperación de contraseña. La recuperación usa el broker de Laravel y requiere configurar un transport de correo real para que el enlace llegue al usuario.
- Tokens Sanctum Bearer con expiración de 120 minutos, rutas privadas y políticas para mascotas y solicitudes.
- Catálogo paginado, búsqueda y filtros, detalle, fotografías y publicaciones.
- Solicitudes con transiciones revisadas y formalización transaccional; al formalizar se cierra la publicación, cambia el estado de la mascota y se resuelven solicitudes competidoras.
- Borrado restringido de fichas sin historial, publicaciones sin solicitudes y solicitudes propias aún pendientes; las dependencias y el historial se preservan.
- Paneles con datos de la API para administrador, adoptante, refugio, veterinario y hogar temporal.
- Notificaciones internas persistentes para nuevas solicitudes, decisiones de adopción y cambios de citas; cada cuenta solo consulta y marca sus avisos.
- Auditoría de operaciones autenticadas de escritura, consultable únicamente por administradores; no almacena contraseñas ni cuerpos de solicitudes.
- Reporte CSV con cifras actuales de PostgreSQL, global para administrador y limitado a las mascotas del refugio responsable.
- Gestión de fotografías con validación de formato/tamaño, selección de imagen principal y eliminación autorizada.
- Gestión base de refugios, hogares y asignaciones; citas con comprobación de horario; historial médico y vacunas; registro de donaciones sin cobros; seguimientos.
- Migraciones PostgreSQL con claves, índices y restricciones; seeders repetibles.
- Interfaz responsive en español conectada a la API.

## Pendiente y límites conocidos

- Ejecutar migraciones, seeders y pruebas con `pdo_pgsql` habilitado y credenciales válidas para PostgreSQL. Esta actualización añade migraciones aditivas para notificaciones y auditoría; no modifica PK/FK existentes.
- Comparar el esquema con el MER original.
- Configurar SMTP para entregar los enlaces de recuperación; el entorno local usa `MAIL_MAILER=log` y deja el enlace en el log de Laravel.
- En despliegue, configurar un bucket público de Supabase Storage y `PET_PHOTO_DISK=supabase`; la clave elevada queda únicamente en Laravel. El disco local sirve para desarrollo y no persiste en un host efímero.
- Donaciones solo registran aportes; no hay pasarela de pagos.
- Antes de desplegar, cambiar credenciales demo, secretos, CORS, URL pública, almacenamiento y reglas operativas.

## Despliegue de demostración

Hay configuración para Laravel en Render (`backend/Dockerfile`, `backend/render.yaml`) y para el SPA en Vercel (`frontend/vercel.json`). El propietario indicó que creó los servicios y observó un despliegue exitoso; el estado operativo actual y sus secretos no se verifican desde el repositorio. El procedimiento y las variables requeridas están en [docs/despliegue-gratuito.md](docs/despliegue-gratuito.md).

Para el respaldo real del PostgreSQL de la cuenta, sigue [la guía de pgAdmin](docs/backup-postgres-pgadmin.md). No se incluyó un volcado de datos reales en este repositorio público.

Render Free puede suspender el backend al estar inactivo y el filesystem local es efímero. La propuesta usa Supabase para PostgreSQL y almacenamiento de fotos; la base gratuita puede pausarse tras una semana con baja actividad. Vercel Hobby está destinado a proyectos personales/no comerciales. Estos planes sirven para una demostración y no ofrecen garantías de producción.

